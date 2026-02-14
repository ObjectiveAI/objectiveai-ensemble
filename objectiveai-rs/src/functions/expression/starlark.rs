//! Starlark expression evaluation engine.
//! Provides a sandboxed Starlark runtime for evaluating expressions.
//! Variables `input`, `output`, and `map` are injected into the global scope.

use serde_json::{Map as JsonMap, Number as JsonNumber, Value};
use starlark::environment::{Globals, GlobalsBuilder, Module};
use starlark::eval::Evaluator;
use starlark::starlark_module;
use starlark::syntax::{AstModule, Dialect};
use starlark::values::float::UnpackFloat;
use starlark::values::dict::DictRef;
use starlark::values::list::ListRef;
use starlark::values::{Heap, UnpackValue, Value as SValue};
use std::sync::LazyLock;

use super::{ExpressionError, OneOrMany};

/// Global Starlark globals with custom functions.
pub static STARLARK_GLOBALS: LazyLock<Globals> = LazyLock::new(|| {
    let mut builder = GlobalsBuilder::standard();
    register_custom_functions(&mut builder);
    builder.build()
});

/// Register custom functions that extend Starlark's standard library.
#[starlark_module]
fn register_custom_functions(builder: &mut GlobalsBuilder) {
    /// Sum of a list of numbers. Returns 0 for empty list.
    fn sum<'v>(
        #[starlark(require = pos)] xs: &ListRef<'v>,
    ) -> starlark::Result<f64> {
        let mut total = 0.0;
        for x in xs.iter() {
            let n = UnpackFloat::unpack_value(x)
                .map_err(|e| {
                    starlark::Error::new_other(anyhow::anyhow!("{}", e))
                })?
                .ok_or_else(|| {
                    starlark::Error::new_other(anyhow::anyhow!(
                        "sum: expected number, got {}",
                        x.get_type()
                    ))
                })?;
            total += n.0;
        }
        Ok(total)
    }

    /// Absolute value of a number.
    fn abs(#[starlark(require = pos)] x: UnpackFloat) -> starlark::Result<f64> {
        Ok(x.0.abs())
    }

    /// Convert to float.
    fn float(
        #[starlark(require = pos)] x: UnpackFloat,
    ) -> starlark::Result<f64> {
        Ok(x.0)
    }

    /// Round a number to the nearest integer.
    fn round(
        #[starlark(require = pos)] x: UnpackFloat,
    ) -> starlark::Result<i64> {
        Ok(x.0.round() as i64)
    }
}

/// Trait for direct conversion to Starlark values (bypassing serde_json).
trait ToStarlarkValue {
    fn to_starlark_value<'v>(&self, heap: &'v Heap) -> SValue<'v>;
}

fn decimal_to_starlark<'v>(
    heap: &'v Heap,
    d: &rust_decimal::Decimal,
) -> SValue<'v> {
    use rust_decimal::prelude::ToPrimitive;
    heap.alloc(d.to_f64().unwrap_or(0.0))
}

fn decimals_to_starlark<'v>(
    heap: &'v Heap,
    ds: &[rust_decimal::Decimal],
) -> SValue<'v> {
    let items: Vec<SValue> =
        ds.iter().map(|d| decimal_to_starlark(heap, d)).collect();
    heap.alloc(items)
}

impl ToStarlarkValue for super::Input {
    fn to_starlark_value<'v>(&self, heap: &'v Heap) -> SValue<'v> {
        match self {
            super::Input::String(s) => heap.alloc_str(s).to_value(),
            super::Input::Integer(i) => heap.alloc(*i),
            super::Input::Number(f) => heap.alloc(*f),
            super::Input::Boolean(b) => SValue::new_bool(*b),
            super::Input::Object(map) => {
                let pairs: Vec<(&str, SValue)> = map
                    .iter()
                    .map(|(k, v)| (k.as_str(), v.to_starlark_value(heap)))
                    .collect();
                heap.alloc(starlark::values::dict::AllocDict(pairs))
            }
            super::Input::Array(arr) => {
                let items: Vec<SValue> = arr
                    .iter()
                    .map(|v| v.to_starlark_value(heap))
                    .collect();
                heap.alloc(items)
            }
            super::Input::RichContentPart(part) => {
                // Fallback to JSON for complex rich content types
                let json =
                    serde_json::to_value(part).unwrap_or(Value::Null);
                json_to_starlark(heap, &json)
            }
        }
    }
}

impl ToStarlarkValue for super::FunctionOutput {
    fn to_starlark_value<'v>(&self, heap: &'v Heap) -> SValue<'v> {
        match self {
            super::FunctionOutput::Scalar(d) => decimal_to_starlark(heap, d),
            super::FunctionOutput::Vector(ds) => {
                decimals_to_starlark(heap, ds)
            }
            super::FunctionOutput::Err(json) => json_to_starlark(heap, json),
        }
    }
}

impl ToStarlarkValue for super::VectorCompletionOutput {
    fn to_starlark_value<'v>(&self, heap: &'v Heap) -> SValue<'v> {
        // Votes: fallback to JSON (complex struct, rarely accessed)
        let votes_json =
            serde_json::to_value(&self.votes).unwrap_or(Value::Null);
        let votes = json_to_starlark(heap, &votes_json);
        let scores = decimals_to_starlark(heap, &self.scores);
        let weights = decimals_to_starlark(heap, &self.weights);
        heap.alloc(starlark::values::dict::AllocDict(vec![
            ("votes", votes),
            ("scores", scores),
            ("weights", weights),
        ]))
    }
}

impl ToStarlarkValue for super::TaskOutputOwned {
    fn to_starlark_value<'v>(&self, heap: &'v Heap) -> SValue<'v> {
        match self {
            super::TaskOutputOwned::Function(f) => {
                f.to_starlark_value(heap)
            }
            super::TaskOutputOwned::MapFunction(fs) => {
                let items: Vec<SValue> = fs
                    .iter()
                    .map(|f| f.to_starlark_value(heap))
                    .collect();
                heap.alloc(items)
            }
            super::TaskOutputOwned::VectorCompletion(vc) => {
                vc.to_starlark_value(heap)
            }
            super::TaskOutputOwned::MapVectorCompletion(vcs) => {
                let items: Vec<SValue> = vcs
                    .iter()
                    .map(|vc| vc.to_starlark_value(heap))
                    .collect();
                heap.alloc(items)
            }
        }
    }
}

impl<'a> ToStarlarkValue for super::TaskOutputRef<'a> {
    fn to_starlark_value<'v>(&self, heap: &'v Heap) -> SValue<'v> {
        match self {
            super::TaskOutputRef::Function(f) => f.to_starlark_value(heap),
            super::TaskOutputRef::MapFunction(fs) => {
                let items: Vec<SValue> = fs
                    .iter()
                    .map(|f| f.to_starlark_value(heap))
                    .collect();
                heap.alloc(items)
            }
            super::TaskOutputRef::VectorCompletion(vc) => {
                vc.to_starlark_value(heap)
            }
            super::TaskOutputRef::MapVectorCompletion(vcs) => {
                let items: Vec<SValue> = vcs
                    .iter()
                    .map(|vc| vc.to_starlark_value(heap))
                    .collect();
                heap.alloc(items)
            }
        }
    }
}

impl<'a> ToStarlarkValue for super::TaskOutput<'a> {
    fn to_starlark_value<'v>(&self, heap: &'v Heap) -> SValue<'v> {
        match self {
            super::TaskOutput::Owned(o) => o.to_starlark_value(heap),
            super::TaskOutput::Ref(r) => r.to_starlark_value(heap),
        }
    }
}

/// Trait for converting a Starlark runtime value into a Rust type.
///
/// Used by [`Expression`](super::Expression) to compile Starlark expressions
/// directly from `starlark::values::Value` to the target type.
pub trait FromStarlarkValue: Sized {
    fn from_starlark_value(value: &SValue) -> Result<Self, ExpressionError>;
}

// Primitives and common types
impl FromStarlarkValue for bool {
    fn from_starlark_value(value: &SValue) -> Result<Self, ExpressionError> {
        bool::unpack_value(*value)
            .map_err(|e| ExpressionError::StarlarkConversionError(e.to_string()))
            .and_then(|o| o.ok_or_else(|| ExpressionError::StarlarkConversionError("expected bool".to_string())))
    }
}

impl FromStarlarkValue for i64 {
    fn from_starlark_value(value: &SValue) -> Result<Self, ExpressionError> {
        i64::unpack_value(*value)
            .map_err(|e| ExpressionError::StarlarkConversionError(e.to_string()))
            .and_then(|o| o.ok_or_else(|| ExpressionError::StarlarkConversionError("expected int".to_string())))
    }
}

impl FromStarlarkValue for u64 {
    fn from_starlark_value(value: &SValue) -> Result<Self, ExpressionError> {
        let i = i64::unpack_value(*value)
            .map_err(|e| ExpressionError::StarlarkConversionError(e.to_string()))?
            .ok_or_else(|| ExpressionError::StarlarkConversionError("expected int".to_string()))?;
        if i < 0 {
            return Err(ExpressionError::StarlarkConversionError("expected non-negative int".to_string()));
        }
        Ok(i as u64)
    }
}

impl FromStarlarkValue for f64 {
    fn from_starlark_value(value: &SValue) -> Result<Self, ExpressionError> {
        if let Ok(Some(i)) = i64::unpack_value(*value) {
            return Ok(i as f64);
        }
        UnpackFloat::unpack_value(*value)
            .map_err(|e| ExpressionError::StarlarkConversionError(e.to_string()))
            .and_then(|o| o.ok_or_else(|| ExpressionError::StarlarkConversionError("expected number".to_string())))
            .map(|u| u.0)
    }
}

impl FromStarlarkValue for String {
    fn from_starlark_value(value: &SValue) -> Result<Self, ExpressionError> {
        <&str as UnpackValue>::unpack_value(*value)
            .map_err(|e| ExpressionError::StarlarkConversionError(e.to_string()))?
            .map(|s| s.to_owned())
            .ok_or_else(|| ExpressionError::StarlarkConversionError("expected string".to_string()))
    }
}

impl<T: FromStarlarkValue> FromStarlarkValue for Option<T> {
    fn from_starlark_value(value: &SValue) -> Result<Self, ExpressionError> {
        if value.is_none() {
            return Ok(None);
        }
        T::from_starlark_value(value).map(Some)
    }
}

impl<T: FromStarlarkValue> FromStarlarkValue for Vec<T> {
    fn from_starlark_value(value: &SValue) -> Result<Self, ExpressionError> {
        let list = ListRef::from_value(*value)
            .ok_or_else(|| ExpressionError::StarlarkConversionError("expected list".to_string()))?;
        let mut out = Vec::with_capacity(list.len());
        for v in list.iter() {
            out.push(T::from_starlark_value(&v)?);
        }
        Ok(out)
    }
}

impl<T: FromStarlarkValue> FromStarlarkValue for super::WithExpression<T> {
    fn from_starlark_value(value: &SValue) -> Result<Self, ExpressionError> {
        T::from_starlark_value(value).map(super::WithExpression::Value)
    }
}

impl<V: FromStarlarkValue> FromStarlarkValue for indexmap::IndexMap<String, V> {
    fn from_starlark_value(value: &SValue) -> Result<Self, ExpressionError> {
        let dict = DictRef::from_value(*value)
            .ok_or_else(|| ExpressionError::StarlarkConversionError("expected dict".to_string()))?;
        let mut map = indexmap::IndexMap::new();
        for (k, v) in dict.iter() {
            let key = <&str as UnpackValue>::unpack_value(k)
                .map_err(|e| ExpressionError::StarlarkConversionError(e.to_string()))?
                .ok_or_else(|| ExpressionError::StarlarkConversionError("expected string key".to_string()))?
                .to_owned();
            map.insert(key, V::from_starlark_value(&v)?);
        }
        Ok(map)
    }
}

fn dict_get<'v>(dict: &DictRef<'v>, key: &str) -> Option<SValue<'v>> {
    for (k, v) in dict.iter() {
        if let Ok(Some(s)) = <&str as UnpackValue>::unpack_value(k) {
            if s == key {
                return Some(v);
            }
        }
    }
    None
}

fn svalue_to_serde_value(value: &SValue) -> Result<Value, ExpressionError> {
    if value.is_none() {
        return Ok(Value::Null);
    }
    if let Ok(Some(b)) = bool::unpack_value(*value) {
        return Ok(Value::Bool(b));
    }
    if let Ok(Some(i)) = i64::unpack_value(*value) {
        return Ok(Value::Number(JsonNumber::from(i)));
    }
    if let Ok(Some(UnpackFloat(f))) = UnpackFloat::unpack_value(*value) {
        if let Some(n) = JsonNumber::from_f64(f) {
            return Ok(Value::Number(n));
        }
    }
    if let Ok(Some(s)) = <&str as UnpackValue>::unpack_value(*value) {
        return Ok(Value::String(s.to_owned()));
    }
    if let Some(list) = ListRef::from_value(*value) {
        let mut items = Vec::with_capacity(list.len());
        for v in list.iter() {
            items.push(svalue_to_serde_value(&v)?);
        }
        return Ok(Value::Array(items));
    }
    if let Some(dict) = DictRef::from_value(*value) {
        let mut obj = JsonMap::with_capacity(dict.len());
        for (k, v) in dict.iter() {
            let key = <&str as UnpackValue>::unpack_value(k)
                .map_err(|e| ExpressionError::StarlarkConversionError(e.to_string()))?
                .ok_or_else(|| ExpressionError::StarlarkConversionError("expected string key".to_string()))?;
            obj.insert(key.to_owned(), svalue_to_serde_value(&v)?);
        }
        return Ok(Value::Object(obj));
    }
    Err(ExpressionError::StarlarkConversionError(format!(
        "unsupported type: {}",
        value.get_type()
    )))
}

impl FromStarlarkValue for super::Input {
    fn from_starlark_value(value: &SValue) -> Result<Self, ExpressionError> {
        if value.is_none() {
            return Err(ExpressionError::StarlarkConversionError("expected value".to_string()));
        }
        if let Ok(Some(b)) = bool::unpack_value(*value) {
            return Ok(super::Input::Boolean(b));
        }
        if let Ok(Some(i)) = i64::unpack_value(*value) {
            return Ok(super::Input::Integer(i));
        }
        if let Ok(Some(UnpackFloat(f))) = UnpackFloat::unpack_value(*value) {
            return Ok(super::Input::Number(f));
        }
        if let Ok(Some(s)) = <&str as UnpackValue>::unpack_value(*value) {
            return Ok(super::Input::String(s.to_owned()));
        }
        if let Some(list) = ListRef::from_value(*value) {
            let items = list.iter().map(|v| super::Input::from_starlark_value(&v)).collect::<Result<Vec<_>, _>>()?;
            return Ok(super::Input::Array(items));
        }
        if let Some(dict) = DictRef::from_value(*value) {
            let mut map = indexmap::IndexMap::new();
            for (k, v) in dict.iter() {
                let key = <&str as UnpackValue>::unpack_value(k)
                    .map_err(|e| ExpressionError::StarlarkConversionError(e.to_string()))?
                    .ok_or_else(|| ExpressionError::StarlarkConversionError("expected string key".to_string()))?
                    .to_owned();
                map.insert(key, super::Input::from_starlark_value(&v)?);
            }
            return Ok(super::Input::Object(map));
        }
        Err(ExpressionError::StarlarkConversionError(format!(
            "unsupported type: {}",
            value.get_type()
        )))
    }
}

impl FromStarlarkValue for super::input::InputExpression {
    fn from_starlark_value(value: &SValue) -> Result<Self, ExpressionError> {
        if value.is_none() {
            return Err(ExpressionError::StarlarkConversionError("expected value".to_string()));
        }
        if let Ok(Some(b)) = bool::unpack_value(*value) {
            return Ok(super::input::InputExpression::Boolean(b));
        }
        if let Ok(Some(i)) = i64::unpack_value(*value) {
            return Ok(super::input::InputExpression::Integer(i));
        }
        if let Ok(Some(UnpackFloat(f))) = UnpackFloat::unpack_value(*value) {
            return Ok(super::input::InputExpression::Number(f));
        }
        if let Ok(Some(s)) = <&str as UnpackValue>::unpack_value(*value) {
            return Ok(super::input::InputExpression::String(s.to_owned()));
        }
        if let Some(list) = ListRef::from_value(*value) {
            let items = list.iter()
                .map(|v| super::input::InputExpression::from_starlark_value(&v))
                .map(|r| r.map(super::WithExpression::Value))
                .collect::<Result<Vec<_>, _>>()?;
            return Ok(super::input::InputExpression::Array(items));
        }
        if let Some(dict) = DictRef::from_value(*value) {
            let mut map = indexmap::IndexMap::new();
            for (k, v) in dict.iter() {
                let key = <&str as UnpackValue>::unpack_value(k)
                    .map_err(|e| ExpressionError::StarlarkConversionError(e.to_string()))?
                    .ok_or_else(|| ExpressionError::StarlarkConversionError("expected string key".to_string()))?
                    .to_owned();
                let val = super::input::InputExpression::from_starlark_value(&v)?;
                map.insert(key, super::WithExpression::Value(val));
            }
            return Ok(super::input::InputExpression::Object(map));
        }
        Err(ExpressionError::StarlarkConversionError(format!(
            "unsupported type: {}",
            value.get_type()
        )))
    }
}

impl FromStarlarkValue for super::params::FunctionOutput {
    fn from_starlark_value(value: &SValue) -> Result<Self, ExpressionError> {
        if value.is_none() {
            return Err(ExpressionError::StarlarkConversionError("expected value".to_string()));
        }
        if let Some(list) = ListRef::from_value(*value) {
            let mut decimals = Vec::with_capacity(list.len());
            for v in list.iter() {
                let f = f64::from_starlark_value(&v)?;
                decimals.push(rust_decimal::Decimal::from_f64_retain(f).unwrap_or(rust_decimal::Decimal::ZERO));
            }
            return Ok(super::params::FunctionOutput::Vector(decimals));
        }
        if let Ok(Some(UnpackFloat(f))) = UnpackFloat::unpack_value(*value) {
            let d = rust_decimal::Decimal::from_f64_retain(f).unwrap_or(rust_decimal::Decimal::ZERO);
            return Ok(super::params::FunctionOutput::Scalar(d));
        }
        if let Ok(Some(i)) = i64::unpack_value(*value) {
            let d = rust_decimal::Decimal::from(i);
            return Ok(super::params::FunctionOutput::Scalar(d));
        }
        let v = svalue_to_serde_value(value)?;
        Ok(super::params::FunctionOutput::Err(v))
    }
}

// Chat/completions/request types (message.rs, tool.rs)
impl FromStarlarkValue for crate::chat::completions::request::SimpleContentExpression {
    fn from_starlark_value(value: &SValue) -> Result<Self, ExpressionError> {
        if let Ok(Some(s)) = <&str as UnpackValue>::unpack_value(*value) {
            return Ok(crate::chat::completions::request::SimpleContentExpression::Text(s.to_owned()));
        }
        if let Some(list) = ListRef::from_value(*value) {
            let parts = list.iter()
                .map(|v| crate::chat::completions::request::SimpleContentPartExpression::from_starlark_value(&v))
                .map(|r| r.map(super::WithExpression::Value))
                .collect::<Result<Vec<_>, _>>()?;
            return Ok(crate::chat::completions::request::SimpleContentExpression::Parts(parts));
        }
        Err(ExpressionError::StarlarkConversionError("expected string or list".to_string()))
    }
}

impl FromStarlarkValue for crate::chat::completions::request::RichContentExpression {
    fn from_starlark_value(value: &SValue) -> Result<Self, ExpressionError> {
        if let Ok(Some(s)) = <&str as UnpackValue>::unpack_value(*value) {
            return Ok(crate::chat::completions::request::RichContentExpression::Text(s.to_owned()));
        }
        if let Some(list) = ListRef::from_value(*value) {
            let parts = list.iter()
                .map(|v| crate::chat::completions::request::RichContentPartExpression::from_starlark_value(&v))
                .map(|r| r.map(super::WithExpression::Value))
                .collect::<Result<Vec<_>, _>>()?;
            return Ok(crate::chat::completions::request::RichContentExpression::Parts(parts));
        }
        Err(ExpressionError::StarlarkConversionError("expected string or list".to_string()))
    }
}

impl FromStarlarkValue for crate::chat::completions::request::SimpleContentPartExpression {
    fn from_starlark_value(value: &SValue) -> Result<Self, ExpressionError> {
        let dict = DictRef::from_value(*value)
            .ok_or_else(|| ExpressionError::StarlarkConversionError("expected dict".to_string()))?;
        let typ = dict_get(&dict, "type")
            .and_then(|v| <&str as UnpackValue>::unpack_value(v).ok().flatten())
            .ok_or_else(|| ExpressionError::StarlarkConversionError("expected type field".to_string()))?;
        if typ == "text" {
            let text = dict_get(&dict, "text")
                .ok_or_else(|| ExpressionError::StarlarkConversionError("expected text".to_string()))?;
            let s = String::from_starlark_value(&text)?;
            return Ok(crate::chat::completions::request::SimpleContentPartExpression::Text {
                text: super::WithExpression::Value(s),
            });
        }
        Err(ExpressionError::StarlarkConversionError("expected text part".to_string()))
    }
}

impl FromStarlarkValue for crate::chat::completions::request::ImageUrl {
    fn from_starlark_value(value: &SValue) -> Result<Self, ExpressionError> {
        let dict = DictRef::from_value(*value)
            .ok_or_else(|| ExpressionError::StarlarkConversionError("expected dict".to_string()))?;
        let url = dict_get(&dict, "url")
            .ok_or_else(|| ExpressionError::StarlarkConversionError("expected url".to_string()))?;
        let url = String::from_starlark_value(&url)?;
        let detail = dict_get(&dict, "detail")
            .and_then(|v| <&str as UnpackValue>::unpack_value(v).ok().flatten())
            .and_then(|s| match s {
                "auto" => Some(crate::chat::completions::request::ImageUrlDetail::Auto),
                "low" => Some(crate::chat::completions::request::ImageUrlDetail::Low),
                "high" => Some(crate::chat::completions::request::ImageUrlDetail::High),
                _ => None,
            });
        Ok(crate::chat::completions::request::ImageUrl {
            url,
            detail,
        })
    }
}

impl FromStarlarkValue for crate::chat::completions::request::InputAudio {
    fn from_starlark_value(value: &SValue) -> Result<Self, ExpressionError> {
        let dict = DictRef::from_value(*value)
            .ok_or_else(|| ExpressionError::StarlarkConversionError("expected dict".to_string()))?;
        let data = dict_get(&dict, "data").and_then(|v| String::from_starlark_value(&v).ok()).unwrap_or_default();
        let format = dict_get(&dict, "format").and_then(|v| String::from_starlark_value(&v).ok()).unwrap_or_default();
        Ok(crate::chat::completions::request::InputAudio { data, format })
    }
}

impl FromStarlarkValue for crate::chat::completions::request::VideoUrl {
    fn from_starlark_value(value: &SValue) -> Result<Self, ExpressionError> {
        let dict = DictRef::from_value(*value)
            .ok_or_else(|| ExpressionError::StarlarkConversionError("expected dict".to_string()))?;
        let url = dict_get(&dict, "url")
            .ok_or_else(|| ExpressionError::StarlarkConversionError("expected url".to_string()))?;
        Ok(crate::chat::completions::request::VideoUrl {
            url: String::from_starlark_value(&url)?,
        })
    }
}

impl FromStarlarkValue for crate::chat::completions::request::File {
    fn from_starlark_value(value: &SValue) -> Result<Self, ExpressionError> {
        let dict = DictRef::from_value(*value)
            .ok_or_else(|| ExpressionError::StarlarkConversionError("expected dict".to_string()))?;
        let file_data = dict_get(&dict, "file_data").and_then(|v| Option::<String>::from_starlark_value(&v).ok()).flatten();
        let file_id = dict_get(&dict, "file_id").and_then(|v| Option::<String>::from_starlark_value(&v).ok()).flatten();
        let filename = dict_get(&dict, "filename").and_then(|v| Option::<String>::from_starlark_value(&v).ok()).flatten();
        let filename = dict_get(&dict, "filename").and_then(|v| Option::<String>::from_starlark_value(&v).ok()).flatten();
        let file_url = dict_get(&dict, "file_url").and_then(|v| Option::<String>::from_starlark_value(&v).ok()).flatten();
        Ok(crate::chat::completions::request::File {
            file_data,
            file_id,
            filename,
            file_url,
        })
    }
}

impl FromStarlarkValue for crate::chat::completions::request::RichContentPartExpression {
    fn from_starlark_value(value: &SValue) -> Result<Self, ExpressionError> {
        let dict = DictRef::from_value(*value)
            .ok_or_else(|| ExpressionError::StarlarkConversionError("expected dict".to_string()))?;
        let typ = dict_get(&dict, "type")
            .and_then(|v| <&str as UnpackValue>::unpack_value(v).ok().flatten())
            .ok_or_else(|| ExpressionError::StarlarkConversionError("expected type field".to_string()))?;
        match typ {
            "text" => {
                let text = dict_get(&dict, "text").ok_or_else(|| ExpressionError::StarlarkConversionError("expected text".to_string()))?;
                Ok(crate::chat::completions::request::RichContentPartExpression::Text {
                    text: super::WithExpression::Value(String::from_starlark_value(&text)?),
                })
            }
            "image_url" => {
                let image_url = dict_get(&dict, "image_url").ok_or_else(|| ExpressionError::StarlarkConversionError("expected image_url".to_string()))?;
                Ok(crate::chat::completions::request::RichContentPartExpression::ImageUrl {
                    image_url: super::WithExpression::Value(crate::chat::completions::request::ImageUrl::from_starlark_value(&image_url)?),
                })
            }
            "input_audio" => {
                let input_audio = dict_get(&dict, "input_audio").ok_or_else(|| ExpressionError::StarlarkConversionError("expected input_audio".to_string()))?;
                Ok(crate::chat::completions::request::RichContentPartExpression::InputAudio {
                    input_audio: super::WithExpression::Value(crate::chat::completions::request::InputAudio::from_starlark_value(&input_audio)?),
                })
            }
            "input_video" | "video_url" => {
                let key = if typ == "input_video" { "video_url" } else { "video_url" };
                let video_url = dict_get(&dict, key).ok_or_else(|| ExpressionError::StarlarkConversionError("expected video_url".to_string()))?;
                let v = crate::chat::completions::request::VideoUrl::from_starlark_value(&video_url)?;
                if typ == "input_video" {
                    Ok(crate::chat::completions::request::RichContentPartExpression::InputVideo {
                        video_url: super::WithExpression::Value(v),
                    })
                } else {
                    Ok(crate::chat::completions::request::RichContentPartExpression::VideoUrl {
                        video_url: super::WithExpression::Value(v),
                    })
                }
            }
            "file" => {
                let file = dict_get(&dict, "file").ok_or_else(|| ExpressionError::StarlarkConversionError("expected file".to_string()))?;
                Ok(crate::chat::completions::request::RichContentPartExpression::File {
                    file: super::WithExpression::Value(crate::chat::completions::request::File::from_starlark_value(&file)?),
                })
            }
            _ => Err(ExpressionError::StarlarkConversionError(format!("unknown part type: {}", typ))),
        }
    }
}

impl FromStarlarkValue for crate::chat::completions::request::ValueExpression {
    fn from_starlark_value(value: &SValue) -> Result<Self, ExpressionError> {
        if value.is_none() {
            return Ok(crate::chat::completions::request::ValueExpression::Null);
        }
        if let Ok(Some(b)) = bool::unpack_value(*value) {
            return Ok(crate::chat::completions::request::ValueExpression::Bool(b));
        }
        if let Ok(Some(i)) = i64::unpack_value(*value) {
            return Ok(crate::chat::completions::request::ValueExpression::Number(JsonNumber::from(i)));
        }
        if let Ok(Some(UnpackFloat(f))) = UnpackFloat::unpack_value(*value) {
            if let Some(n) = JsonNumber::from_f64(f) {
                return Ok(crate::chat::completions::request::ValueExpression::Number(n));
            }
        }
        if let Ok(Some(s)) = <&str as UnpackValue>::unpack_value(*value) {
            return Ok(crate::chat::completions::request::ValueExpression::String(s.to_owned()));
        }
        if let Some(list) = ListRef::from_value(*value) {
            let arr = list.iter()
                .map(|v| crate::chat::completions::request::ValueExpression::from_starlark_value(&v))
                .map(|r| r.map(super::WithExpression::Value))
                .collect::<Result<Vec<_>, _>>()?;
            return Ok(crate::chat::completions::request::ValueExpression::Array(arr));
        }
        if let Some(dict) = DictRef::from_value(*value) {
            let mut map = indexmap::IndexMap::new();
            for (k, v) in dict.iter() {
                let key = <&str as UnpackValue>::unpack_value(k)
                    .map_err(|e| ExpressionError::StarlarkConversionError(e.to_string()))?
                    .ok_or_else(|| ExpressionError::StarlarkConversionError("expected string key".to_string()))?
                    .to_owned();
                let val = crate::chat::completions::request::ValueExpression::from_starlark_value(&v)?;
                map.insert(key, super::WithExpression::Value(val));
            }
            return Ok(crate::chat::completions::request::ValueExpression::Object(map));
        }
        Err(ExpressionError::StarlarkConversionError("unsupported value type".to_string()))
    }
}

impl FromStarlarkValue for crate::chat::completions::request::FunctionToolExpression {
    fn from_starlark_value(value: &SValue) -> Result<Self, ExpressionError> {
        let dict = DictRef::from_value(*value)
            .ok_or_else(|| ExpressionError::StarlarkConversionError("expected dict".to_string()))?;
        let name = dict_get(&dict, "name").ok_or_else(|| ExpressionError::StarlarkConversionError("expected name".to_string()))?;
        let name = String::from_starlark_value(&name)?;
        let description = dict_get(&dict, "description").and_then(|v| Option::<String>::from_starlark_value(&v).ok()).map(super::WithExpression::Value);
        let parameters = dict_get(&dict, "parameters")
            .map(|v| {
                if v.is_none() {
                    Ok(super::WithExpression::Value(None))
                } else {
                    indexmap::IndexMap::<String, super::WithExpression<crate::chat::completions::request::ValueExpression>>::from_starlark_value(&v)
                        .map(|m| super::WithExpression::Value(Some(m)))
                }
            })
            .transpose()
            .ok()
            .flatten();
        let strict = dict_get(&dict, "strict").and_then(|v| Option::<bool>::from_starlark_value(&v).ok()).map(super::WithExpression::Value);
        Ok(crate::chat::completions::request::FunctionToolExpression {
            name: super::WithExpression::Value(name),
            description,
            parameters,
            strict,
        })
    }
}

impl FromStarlarkValue for crate::chat::completions::request::AssistantToolCallFunctionExpression {
    fn from_starlark_value(value: &SValue) -> Result<Self, ExpressionError> {
        let dict = DictRef::from_value(*value)
            .ok_or_else(|| ExpressionError::StarlarkConversionError("expected dict".to_string()))?;
        let name = dict_get(&dict, "name").ok_or_else(|| ExpressionError::StarlarkConversionError("expected name".to_string()))?;
        let name = String::from_starlark_value(&name)?;
        let arguments = dict_get(&dict, "arguments").and_then(|v| String::from_starlark_value(&v).ok()).unwrap_or_else(|| "{}".to_string());
        Ok(crate::chat::completions::request::AssistantToolCallFunctionExpression {
            name: super::WithExpression::Value(name),
            arguments: super::WithExpression::Value(arguments),
        })
    }
}

impl FromStarlarkValue for crate::chat::completions::request::AssistantToolCallExpression {
    fn from_starlark_value(value: &SValue) -> Result<Self, ExpressionError> {
        let dict = DictRef::from_value(*value)
            .ok_or_else(|| ExpressionError::StarlarkConversionError("expected dict".to_string()))?;
        let id = dict_get(&dict, "id").and_then(|v| String::from_starlark_value(&v).ok()).unwrap_or_default();
        let function = dict_get(&dict, "function").ok_or_else(|| ExpressionError::StarlarkConversionError("expected function".to_string()))?;
        let function = crate::chat::completions::request::AssistantToolCallFunctionExpression::from_starlark_value(&function)?;
        Ok(crate::chat::completions::request::AssistantToolCallExpression::Function {
            id: super::WithExpression::Value(id),
            function: super::WithExpression::Value(function),
        })
    }
}

impl FromStarlarkValue for crate::chat::completions::request::ToolExpression {
    fn from_starlark_value(value: &SValue) -> Result<Self, ExpressionError> {
        let dict = DictRef::from_value(*value)
            .ok_or_else(|| ExpressionError::StarlarkConversionError("expected dict".to_string()))?;
        let function = dict_get(&dict, "function").ok_or_else(|| ExpressionError::StarlarkConversionError("expected function".to_string()))?;
        let function = crate::chat::completions::request::FunctionToolExpression::from_starlark_value(&function)?;
        Ok(crate::chat::completions::request::ToolExpression::Function {
            function: super::WithExpression::Value(function),
        })
    }
}

impl FromStarlarkValue for crate::chat::completions::request::MessageExpression {
    fn from_starlark_value(value: &SValue) -> Result<Self, ExpressionError> {
        let dict = DictRef::from_value(*value)
            .ok_or_else(|| ExpressionError::StarlarkConversionError("expected dict".to_string()))?;
        let role = dict_get(&dict, "role")
            .and_then(|v| <&str as UnpackValue>::unpack_value(v).ok().flatten())
            .ok_or_else(|| ExpressionError::StarlarkConversionError("expected role".to_string()))?;
        match role {
            "user" => {
                let content = dict_get(&dict, "content").ok_or_else(|| ExpressionError::StarlarkConversionError("expected content".to_string()))?;
                let content = crate::chat::completions::request::RichContentExpression::from_starlark_value(&content)?;
                let name = dict_get(&dict, "name")
                    .map(|v| Option::<String>::from_starlark_value(&v))
                    .transpose()
                    .ok()
                    .flatten()
                    .map(super::WithExpression::Value);
                Ok(crate::chat::completions::request::MessageExpression::User(
                    crate::chat::completions::request::UserMessageExpression {
                        content: super::WithExpression::Value(content),
                        name,
                    },
                ))
            }
            "system" => {
                let content = dict_get(&dict, "content").ok_or_else(|| ExpressionError::StarlarkConversionError("expected content".to_string()))?;
                let content = crate::chat::completions::request::SimpleContentExpression::from_starlark_value(&content)?;
                let name = dict_get(&dict, "name")
                    .map(|v| Option::<String>::from_starlark_value(&v))
                    .transpose()
                    .ok()
                    .flatten()
                    .map(super::WithExpression::Value);
                Ok(crate::chat::completions::request::MessageExpression::System(
                    crate::chat::completions::request::SystemMessageExpression {
                        content: super::WithExpression::Value(content),
                        name,
                    },
                ))
            }
            "assistant" => {
                let content = dict_get(&dict, "content")
                    .map(|v| Option::<crate::chat::completions::request::RichContentExpression>::from_starlark_value(&v))
                    .transpose()
                    .ok()
                    .flatten()
                    .map(super::WithExpression::Value);
                let name = dict_get(&dict, "name")
                    .map(|v| Option::<String>::from_starlark_value(&v))
                    .transpose()
                    .ok()
                    .flatten()
                    .map(super::WithExpression::Value);
                let refusal = dict_get(&dict, "refusal")
                    .map(|v| Option::<String>::from_starlark_value(&v))
                    .transpose()
                    .ok()
                    .flatten()
                    .map(super::WithExpression::Value);
                Ok(crate::chat::completions::request::MessageExpression::Assistant(
                    crate::chat::completions::request::AssistantMessageExpression {
                        content,
                        name,
                        tool_calls: None,
                        reasoning: None,
                        refusal,
                    },
                ))
            }
            "tool" => {
                let tool_call_id = dict_get(&dict, "tool_call_id").and_then(|v| String::from_starlark_value(&v).ok()).unwrap_or_default();
                let content = dict_get(&dict, "content").ok_or_else(|| ExpressionError::StarlarkConversionError("expected content".to_string()))?;
                let content = crate::chat::completions::request::RichContentExpression::from_starlark_value(&content)?;
                Ok(crate::chat::completions::request::MessageExpression::Tool(
                    crate::chat::completions::request::ToolMessageExpression {
                        tool_call_id: super::WithExpression::Value(tool_call_id),
                        content: super::WithExpression::Value(content),
                    },
                ))
            }
            "developer" => {
                let content = dict_get(&dict, "content").ok_or_else(|| ExpressionError::StarlarkConversionError("expected content".to_string()))?;
                let content = crate::chat::completions::request::SimpleContentExpression::from_starlark_value(&content)?;
                Ok(crate::chat::completions::request::MessageExpression::Developer(
                    crate::chat::completions::request::DeveloperMessageExpression {
                        content: super::WithExpression::Value(content),
                        name: None,
                    },
                ))
            }
            _ => Err(ExpressionError::StarlarkConversionError(format!("unknown role: {}", role))),
        }
    }
}

/// Run a Starlark expression and pass the result (while still valid) to `f`.
fn with_eval_result<F, R>(
    code: &str,
    params: &super::Params,
    f: F,
) -> Result<R, ExpressionError>
where
    F: FnOnce(&SValue) -> Result<R, ExpressionError>,
{
    let module = Module::new();
    {
        let heap = module.heap();
        match params {
            super::Params::Owned(owned) => {
                module.set("input", owned.input.to_starlark_value(heap));
                module.set(
                    "output",
                    owned
                        .output
                        .as_ref()
                        .map_or(SValue::new_none(), |o| o.to_starlark_value(heap)),
                );
                module.set(
                    "map",
                    owned
                        .map
                        .as_ref()
                        .map_or(SValue::new_none(), |m| m.to_starlark_value(heap)),
                );
            }
            super::Params::Ref(r) => {
                module.set("input", r.input.to_starlark_value(heap));
                module.set(
                    "output",
                    r.output
                        .as_ref()
                        .map_or(SValue::new_none(), |o| o.to_starlark_value(heap)),
                );
                module.set(
                    "map",
                    r.map.map_or(SValue::new_none(), |m| m.to_starlark_value(heap)),
                );
            }
        }
    }
    let ast =
        AstModule::parse("expression", code.to_string(), &Dialect::Extended)
            .map_err(|e| ExpressionError::StarlarkParseError(e.to_string()))?;
    let mut eval = Evaluator::new(&module);
    let result = eval
        .eval_module(ast, &STARLARK_GLOBALS)
        .map_err(|e| ExpressionError::StarlarkEvalError(e.to_string()))?;
    f(&result)
}

/// Evaluate a Starlark expression and convert the result to `T`.
pub fn starlark_eval<T: FromStarlarkValue>(
    code: &str,
    params: &super::Params,
) -> Result<T, ExpressionError> {
    with_eval_result(code, params, T::from_starlark_value)
}

fn svalue_to_one_or_many<T: FromStarlarkValue>(
    value: &SValue,
) -> Result<OneOrMany<T>, ExpressionError> {
    if value.is_none() {
        return Ok(OneOrMany::Many(Vec::new()));
    }
    if let Ok(v) = T::from_starlark_value(value) {
        return Ok(OneOrMany::One(v));
    }
    if let Some(list) = ListRef::from_value(*value) {
        let mut vs: Vec<T> = Vec::with_capacity(list.len());
        for v in list.iter() {
            if let Some(opt) = Option::<T>::from_starlark_value(&v)? {
                vs.push(opt);
            }
        }
        return Ok(if vs.is_empty() {
            OneOrMany::Many(Vec::new())
        } else if vs.len() == 1 {
            OneOrMany::One(vs.into_iter().next().unwrap())
        } else {
            OneOrMany::Many(vs)
        });
    }
    match Option::<T>::from_starlark_value(value)? {
        Some(v) => Ok(OneOrMany::One(v)),
        None => Ok(OneOrMany::Many(Vec::new())),
    }
}

/// Evaluate a Starlark expression and convert the result into `OneOrMany<T>`.
pub fn starlark_eval_one_or_many<T>(
    code: &str,
    params: &super::Params,
) -> Result<OneOrMany<T>, ExpressionError>
where
    T: FromStarlarkValue,
{
    with_eval_result(code, params, svalue_to_one_or_many)
}

/// Convert JSON value to Starlark value.
fn json_to_starlark<'v>(heap: &'v Heap, json: &Value) -> SValue<'v> {
    match json {
        Value::Null => SValue::new_none(),
        Value::Bool(b) => SValue::new_bool(*b),
        Value::Number(n) => {
            if let Some(i) = n.as_i64() {
                heap.alloc(i)
            } else if let Some(f) = n.as_f64() {
                heap.alloc(f)
            } else {
                SValue::new_none()
            }
        }
        Value::String(s) => heap.alloc_str(s).to_value(),
        Value::Array(arr) => {
            let items: Vec<SValue> =
                arr.iter().map(|v| json_to_starlark(heap, v)).collect();
            heap.alloc(items)
        }
        Value::Object(obj) => {
            let pairs: Vec<(&str, SValue)> = obj
                .iter()
                .map(|(k, v)| (k.as_str(), json_to_starlark(heap, v)))
                .collect();
            heap.alloc(starlark::values::dict::AllocDict(pairs))
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::chat::completions::request::{
        AssistantMessageExpression, AssistantToolCallExpression,
        AssistantToolCallFunctionExpression, DeveloperMessageExpression, File,
        FunctionToolExpression, ImageUrl, ImageUrlDetail, InputAudio,
        MessageExpression, RichContentExpression, RichContentPartExpression,
        SimpleContentExpression, SimpleContentPartExpression,
        SystemMessageExpression, ToolExpression, ToolMessageExpression,
        UserMessageExpression, ValueExpression, VideoUrl,
    };
    use crate::functions::expression::{
        FunctionOutput, Input, InputExpression, Params, ParamsOwned, TaskOutputOwned,
        VectorCompletionOutput, WithExpression,
    };
    use indexmap::IndexMap;
    use rust_decimal::dec;
    use serde::Serialize;
    use serde_json::Number as JsonNumber;

    fn assert_starlark_deep_eq<T: FromStarlarkValue + Serialize>(
        code: &str,
        params: &Params<'_, '_, '_>,
        expected: &T,
    ) {
        let result: T = starlark_eval(code, params).unwrap();
        assert_eq!(
            serde_json::to_value(&result).unwrap(),
            serde_json::to_value(expected).unwrap()
        );
    }

    fn empty_input() -> Input {
        Input::Object(IndexMap::new())
    }

    fn make_params(input: Input) -> Params<'static, 'static, 'static> {
        Params::Owned(ParamsOwned {
            input,
            output: None,
            map: None,
        })
    }

    fn make_params_with_output(
        input: Input,
        output: TaskOutputOwned,
    ) -> Params<'static, 'static, 'static> {
        Params::Owned(ParamsOwned {
            input,
            output: Some(output),
            map: None,
        })
    }

    fn make_params_with_map(
        input: Input,
        map: Input,
    ) -> Params<'static, 'static, 'static> {
        Params::Owned(ParamsOwned {
            input,
            output: None,
            map: Some(map),
        })
    }

    fn make_full_params(
        input: Input,
        output: TaskOutputOwned,
        map: Input,
    ) -> Params<'static, 'static, 'static> {
        Params::Owned(ParamsOwned {
            input,
            output: Some(output),
            map: Some(map),
        })
    }

    // Helper to build an object Input
    fn obj(pairs: Vec<(&str, Input)>) -> Input {
        Input::Object(
            pairs.into_iter().map(|(k, v)| (k.to_string(), v)).collect(),
        )
    }

    // Helper to build an array Input
    fn arr(items: Vec<Input>) -> Input {
        Input::Array(items)
    }

    #[test]
    fn test_simple_literal() {
        let params = make_params(empty_input());
        let result: i64 = starlark_eval("42", &params).unwrap();
        assert_eq!(result, 42);
    }

    #[test]
    fn test_string_literal() {
        let params = make_params(empty_input());
        let result: String = starlark_eval("\"hello\"", &params).unwrap();
        assert_eq!(result, "hello");
    }

    #[test]
    fn test_boolean_literal() {
        let params = make_params(empty_input());
        assert_eq!(starlark_eval::<bool>("True", &params).unwrap(), true);
        assert_eq!(starlark_eval::<bool>("False", &params).unwrap(), false);
    }

    #[test]
    fn test_none_literal() {
        let params = make_params(empty_input());
        let result: Option<i64> = starlark_eval("None", &params).unwrap();
        assert_eq!(result, None);
    }

    #[test]
    fn test_list_literal() {
        let params = make_params(empty_input());
        let result: Vec<i64> = starlark_eval("[1, 2, 3]", &params).unwrap();
        assert_eq!(result, vec![1, 2, 3]);
    }

    #[test]
    fn test_input_access() {
        let input = obj(vec![
            ("name", Input::String("alice".to_string())),
            ("age", Input::Integer(30)),
        ]);
        let params = make_params(input);
        let name: String = starlark_eval("input['name']", &params).unwrap();
        assert_eq!(name, "alice");
        let age: i64 = starlark_eval("input['age']", &params).unwrap();
        assert_eq!(age, 30);
    }

    #[test]
    fn test_nested_input_access() {
        let input = obj(vec![(
            "user",
            obj(vec![(
                "profile",
                obj(vec![(
                    "email",
                    Input::String("test@example.com".to_string()),
                )]),
            )]),
        )]);
        let params = make_params(input);
        let result: String =
            starlark_eval("input['user']['profile']['email']", &params)
                .unwrap();
        assert_eq!(result, "test@example.com");
    }

    #[test]
    fn test_array_indexing() {
        let input = obj(vec![(
            "items",
            arr(vec![
                Input::String("a".to_string()),
                Input::String("b".to_string()),
                Input::String("c".to_string()),
            ]),
        )]);
        let params = make_params(input);
        let v0: String = starlark_eval("input['items'][0]", &params).unwrap();
        assert_eq!(v0, "a");
        let v1: String = starlark_eval("input['items'][-1]", &params).unwrap();
        assert_eq!(v1, "c");
    }

    #[test]
    fn test_list_comprehension() {
        let input = obj(vec![(
            "numbers",
            arr(vec![
                Input::Integer(1),
                Input::Integer(2),
                Input::Integer(3),
            ]),
        )]);
        let params = make_params(input);
        let result: Vec<i64> =
            starlark_eval("[x * 2 for x in input['numbers']]", &params)
                .unwrap();
        assert_eq!(result, vec![2, 4, 6]);
    }

    #[test]
    fn test_list_comprehension_with_filter() {
        let input = obj(vec![(
            "numbers",
            arr(vec![
                Input::Integer(1),
                Input::Integer(2),
                Input::Integer(3),
                Input::Integer(4),
                Input::Integer(5),
                Input::Integer(6),
            ]),
        )]);
        let params = make_params(input);
        let result: Vec<i64> = starlark_eval(
            "[x for x in input['numbers'] if x % 2 == 0]",
            &params,
        )
        .unwrap();
        assert_eq!(result, vec![2, 4, 6]);
    }

    #[test]
    fn test_arithmetic() {
        let params = make_params(empty_input());
        assert_eq!(starlark_eval::<i64>("1 + 2", &params).unwrap(), 3);
        assert_eq!(starlark_eval::<i64>("10 - 3", &params).unwrap(), 7);
        assert_eq!(starlark_eval::<i64>("4 * 5", &params).unwrap(), 20);
        assert_eq!(starlark_eval::<i64>("15 // 4", &params).unwrap(), 3);
        assert_eq!(starlark_eval::<i64>("15 % 4", &params).unwrap(), 3);
    }

    #[test]
    fn test_builtin_functions() {
        let params = make_params(empty_input());
        assert_eq!(starlark_eval::<i64>("min([3, 1, 2])", &params).unwrap(), 1);
        assert_eq!(starlark_eval::<i64>("max([3, 1, 2])", &params).unwrap(), 3);
        assert_eq!(starlark_eval::<i64>("len([1, 2, 3])", &params).unwrap(), 3);
        let sorted: Vec<i64> = starlark_eval("sorted([3, 1, 2])", &params).unwrap();
        assert_eq!(sorted, vec![1, 2, 3]);
    }

    #[test]
    fn test_conditional_expression() {
        let input = obj(vec![("value", Input::Integer(10))]);
        let params = make_params(input);
        let result: String = starlark_eval(
            "\"big\" if input['value'] > 5 else \"small\"",
            &params,
        )
        .unwrap();
        assert_eq!(result, "big");

        let input2 = obj(vec![("value", Input::Integer(3))]);
        let params2 = make_params(input2);
        let result2: String = starlark_eval(
            "\"big\" if input['value'] > 5 else \"small\"",
            &params2,
        )
        .unwrap();
        assert_eq!(result2, "small");
    }

    #[test]
    fn test_parse_error() {
        let params = make_params(empty_input());
        let result: Result<i64, _> = starlark_eval("invalid syntax [[[", &params);
        assert!(matches!(
            result,
            Err(ExpressionError::StarlarkParseError(_))
        ));
    }

    #[test]
    fn test_eval_error() {
        let params = make_params(empty_input());
        let result: Result<i64, _> = starlark_eval("undefined_variable", &params);
        assert!(matches!(result, Err(ExpressionError::StarlarkEvalError(_))));
    }

    // ==================== TESTS USING MAP ====================

    #[test]
    fn test_map_access() {
        let input = obj(vec![("base", Input::Integer(100))]);
        let map = obj(vec![("multiplier", Input::Integer(3))]);
        let params = make_params_with_map(input, map);

        let result: i64 =
            starlark_eval("input['base'] * map['multiplier']", &params)
                .unwrap();
        assert_eq!(result, 300);
    }

    #[test]
    fn test_map_with_nested_data() {
        let input = obj(vec![("prefix", Input::String("Hello".to_string()))]);
        let map = obj(vec![
            ("name", Input::String("World".to_string())),
            ("count", Input::Integer(3)),
        ]);
        let params = make_params_with_map(input, map);

        let result: String =
            starlark_eval("input['prefix'] + ' ' + map['name']", &params)
                .unwrap();
        assert_eq!(result, "Hello World");

        let result2: i64 = starlark_eval("map['count'] * 10", &params).unwrap();
        assert_eq!(result2, 30);
    }

    #[test]
    fn test_map_array_iteration() {
        let input = obj(vec![("factor", Input::Integer(2))]);
        let map = obj(vec![(
            "values",
            arr(vec![
                Input::Integer(1),
                Input::Integer(2),
                Input::Integer(3),
            ]),
        )]);
        let params = make_params_with_map(input, map);

        let result: Vec<i64> = starlark_eval(
            "[v * input['factor'] for v in map['values']]",
            &params,
        )
        .unwrap();
        assert_eq!(result, vec![2, 4, 6]);
    }

    // ==================== TESTS USING OUTPUT ====================

    #[test]
    fn test_output_scalar() {
        let input = empty_input();
        let output =
            TaskOutputOwned::Function(FunctionOutput::Scalar(dec!(0.75)));
        let params = make_params_with_output(input, output);

        let result: f64 = starlark_eval("output", &params).unwrap();
        assert!((result - 0.75).abs() < 1e-9);
    }

    #[test]
    fn test_output_vector() {
        let input = empty_input();
        let output = TaskOutputOwned::Function(FunctionOutput::Vector(vec![
            dec!(0.1),
            dec!(0.2),
            dec!(0.7),
        ]));
        let params = make_params_with_output(input, output);

        let result: i64 = starlark_eval("len(output)", &params).unwrap();
        assert_eq!(result, 3);
    }

    #[test]
    fn test_output_vector_completion_scores() {
        let input = empty_input();
        let output = TaskOutputOwned::VectorCompletion(VectorCompletionOutput {
            votes: vec![],
            scores: vec![dec!(0.25), dec!(0.25), dec!(0.5)],
            weights: vec![dec!(1.0), dec!(1.0), dec!(2.0)],
        });
        let params = make_params_with_output(input, output);

        let result: i64 = starlark_eval("len(output['scores'])", &params).unwrap();
        assert_eq!(result, 3);

        let result2: i64 = starlark_eval("len(output['weights'])", &params).unwrap();
        assert_eq!(result2, 3);
    }

    #[test]
    fn test_output_none() {
        let input = empty_input();
        let params = make_params(input);

        let result: bool = starlark_eval("output == None", &params).unwrap();
        assert!(result);
    }

    #[test]
    fn test_output_not_none() {
        let input = obj(vec![("threshold", Input::Number(0.5))]);
        let output =
            TaskOutputOwned::Function(FunctionOutput::Scalar(dec!(0.7)));
        let params = make_params_with_output(input, output);

        let result: bool = starlark_eval("output != None", &params).unwrap();
        assert!(result);
    }

    // ==================== TESTS USING ALL THREE ====================

    #[test]
    fn test_full_params_all_fields() {
        let input = obj(vec![("base_score", Input::Number(0.5))]);
        let output = TaskOutputOwned::VectorCompletion(VectorCompletionOutput {
            votes: vec![],
            scores: vec![dec!(0.3), dec!(0.7)],
            weights: vec![dec!(1.0), dec!(1.0)],
        });
        let map = obj(vec![("index", Input::Integer(1))]);
        let params = make_full_params(input, output, map);

        let result: i64 = starlark_eval("len(output['scores'])", &params).unwrap();
        assert_eq!(result, 2);

        let result2: i64 = starlark_eval("map['index']", &params).unwrap();
        assert_eq!(result2, 1);
    }

    #[test]
    fn test_full_params_complex_expression() {
        let input = obj(vec![(
            "items",
            arr(vec![
                Input::String("a".to_string()),
                Input::String("b".to_string()),
                Input::String("c".to_string()),
            ]),
        )]);
        let output =
            TaskOutputOwned::Function(FunctionOutput::Scalar(dec!(0.5)));
        let map = obj(vec![("selected_index", Input::Integer(1))]);
        let params = make_full_params(input, output, map);

        let result: String =
            starlark_eval("input['items'][map['selected_index']]", &params)
                .unwrap();
        assert_eq!(result, "b");

        let result2: f64 = starlark_eval("output", &params).unwrap();
        assert!((result2 - 0.5).abs() < 1e-9);
    }

    #[test]
    fn test_map_function_outputs() {
        let input = empty_input();
        let output = TaskOutputOwned::MapFunction(vec![
            FunctionOutput::Scalar(dec!(0.1)),
            FunctionOutput::Scalar(dec!(0.5)),
            FunctionOutput::Scalar(dec!(0.9)),
        ]);
        let params = make_params_with_output(input, output);

        let result: i64 = starlark_eval("len(output)", &params).unwrap();
        assert_eq!(result, 3);
    }

    #[test]
    fn test_map_vector_completion_outputs() {
        let input = empty_input();
        let output = TaskOutputOwned::MapVectorCompletion(vec![
            VectorCompletionOutput {
                votes: vec![],
                scores: vec![dec!(0.5), dec!(0.5)],
                weights: vec![dec!(1.0), dec!(1.0)],
            },
            VectorCompletionOutput {
                votes: vec![],
                scores: vec![dec!(0.3), dec!(0.7)],
                weights: vec![dec!(0.5), dec!(0.5)],
            },
        ]);
        let params = make_params_with_output(input, output);

        let result: i64 = starlark_eval("len(output[0]['scores'])", &params).unwrap();
        assert_eq!(result, 2);

        let result2: i64 =
            starlark_eval("len(output[1]['weights'])", &params).unwrap();
        assert_eq!(result2, 2);
    }

    // ==================== TESTS FOR CUSTOM FUNCTIONS ====================

    #[test]
    fn test_sum_integers() {
        let params = make_params(empty_input());
        let result: f64 = starlark_eval("sum([1, 2, 3, 4, 5])", &params).unwrap();
        assert_eq!(result, 15.0);
    }

    #[test]
    fn test_sum_floats() {
        let params = make_params(empty_input());
        let result: f64 = starlark_eval("sum([1.5, 2.5, 3.0])", &params).unwrap();
        assert_eq!(result, 7.0);
    }

    #[test]
    fn test_sum_empty() {
        let params = make_params(empty_input());
        let result: f64 = starlark_eval("sum([])", &params).unwrap();
        assert_eq!(result, 0.0);
    }

    #[test]
    fn test_sum_from_input() {
        let input = obj(vec![(
            "values",
            arr(vec![
                Input::Integer(10),
                Input::Integer(20),
                Input::Integer(30),
            ]),
        )]);
        let params = make_params(input);
        let result: f64 = starlark_eval("sum(input['values'])", &params).unwrap();
        assert_eq!(result, 60.0);
    }

    #[test]
    fn test_abs_positive() {
        let params = make_params(empty_input());
        let result: f64 = starlark_eval("abs(5)", &params).unwrap();
        assert_eq!(result, 5.0);
    }

    #[test]
    fn test_abs_negative() {
        let params = make_params(empty_input());
        let result: f64 = starlark_eval("abs(-5)", &params).unwrap();
        assert_eq!(result, 5.0);
    }

    #[test]
    fn test_abs_float() {
        let params = make_params(empty_input());
        let result: f64 = starlark_eval("abs(-3.14)", &params).unwrap();
        assert!((result - 3.14).abs() < 0.001);
    }

    #[test]
    fn test_float_from_int() {
        let params = make_params(empty_input());
        let result: f64 = starlark_eval("float(42)", &params).unwrap();
        assert_eq!(result, 42.0);
    }

    #[test]
    fn test_round_down() {
        let params = make_params(empty_input());
        let result: i64 = starlark_eval("round(3.4)", &params).unwrap();
        assert_eq!(result, 3);
    }

    #[test]
    fn test_round_up() {
        let params = make_params(empty_input());
        let result: i64 = starlark_eval("round(3.6)", &params).unwrap();
        assert_eq!(result, 4);
    }

    // ==================== TESTS FOR AVERAGING ====================

    #[test]
    fn test_average_simple() {
        let params = make_params(empty_input());
        let result: f64 =
            starlark_eval("sum([2, 4, 6]) / len([2, 4, 6])", &params).unwrap();
        assert_eq!(result, 4.0);
    }

    #[test]
    fn test_average_from_input() {
        let input = obj(vec![(
            "scores",
            arr(vec![
                Input::Number(0.8),
                Input::Number(0.6),
                Input::Number(0.9),
                Input::Number(0.7),
            ]),
        )]);
        let params = make_params(input);
        let result: f64 = starlark_eval(
            "sum(input['scores']) / len(input['scores'])",
            &params,
        )
        .unwrap();
        assert_eq!(result, 0.75);
    }

    #[test]
    fn test_average_mapped_outputs() {
        let input = empty_input();
        let output = TaskOutputOwned::MapFunction(vec![
            FunctionOutput::Scalar(dec!(0.2)),
            FunctionOutput::Scalar(dec!(0.4)),
            FunctionOutput::Scalar(dec!(0.6)),
        ]);
        let params = make_params_with_output(input, output);

        let result: f64 =
            starlark_eval("sum(output) / len(output)", &params).unwrap();
        assert!((result - 0.4).abs() < 0.0001);
    }

    // ==================== TESTS FOR L1 NORMALIZATION ====================

    #[test]
    fn test_l1_normalize_simple() {
        let params = make_params(empty_input());
        let result: Vec<f64> = starlark_eval(
            "[x / sum([abs(y) for y in [2, 3, 5]]) for x in [2, 3, 5]]",
            &params,
        )
        .unwrap();
        assert_eq!(result.len(), 3);
        assert!((result[0] - 0.2).abs() < 1e-9);
        assert!((result[1] - 0.3).abs() < 1e-9);
        assert!((result[2] - 0.5).abs() < 1e-9);
    }

    #[test]
    fn test_l1_normalize_with_negatives() {
        let params = make_params(empty_input());
        let result: Vec<f64> = starlark_eval(
            "[x / sum([abs(y) for y in [-2, 3, -5]]) for x in [-2, 3, -5]]",
            &params,
        )
        .unwrap();
        assert_eq!(result.len(), 3);
        assert!((result[0] - (-0.2)).abs() < 1e-9);
        assert!((result[1] - 0.3).abs() < 1e-9);
        assert!((result[2] - (-0.5)).abs() < 1e-9);
    }

    #[test]
    fn test_l1_normalize_from_input() {
        let input = obj(vec![(
            "weights",
            arr(vec![
                Input::Integer(1),
                Input::Integer(2),
                Input::Integer(2),
            ]),
        )]);
        let params = make_params(input);
        let result: Vec<f64> = starlark_eval(
            "[w / sum(input['weights']) for w in input['weights']]",
            &params,
        )
        .unwrap();
        assert_eq!(result.len(), 3);
        assert!((result[0] - 0.2).abs() < 1e-9);
        assert!((result[1] - 0.4).abs() < 1e-9);
        assert!((result[2] - 0.4).abs() < 1e-9);
    }

    #[test]
    fn test_l1_normalize_sums_to_one() {
        let input = obj(vec![(
            "values",
            arr(vec![
                Input::Number(0.3),
                Input::Number(0.5),
                Input::Number(0.1),
                Input::Number(0.4),
            ]),
        )]);
        let params = make_params(input);
        let result: f64 = starlark_eval(
            "sum([v / sum(input['values']) for v in input['values']])",
            &params,
        )
        .unwrap();
        assert!((result - 1.0).abs() < 0.0001);
    }

    #[test]
    fn test_starlark_primitive_bool() {
        let params = make_params(empty_input());
        assert_starlark_deep_eq("True", &params, &true);
        assert_starlark_deep_eq("False", &params, &false);
    }

    #[test]
    fn test_starlark_primitive_i64() {
        let params = make_params(empty_input());
        assert_starlark_deep_eq("42", &params, &42i64);
    }

    #[test]
    fn test_starlark_primitive_u64() {
        let params = make_params(empty_input());
        assert_starlark_deep_eq("100", &params, &100u64);
    }

    #[test]
    fn test_starlark_primitive_f64() {
        let params = make_params(empty_input());
        assert_starlark_deep_eq("2.5", &params, &2.5f64);
    }

    #[test]
    fn test_starlark_primitive_string() {
        let params = make_params(empty_input());
        assert_starlark_deep_eq("\"world\"", &params, &"world".to_string());
    }

    #[test]
    fn test_starlark_option_none() {
        let params = make_params(empty_input());
        let expected: Option<i64> = None;
        assert_starlark_deep_eq("None", &params, &expected);
    }

    #[test]
    fn test_starlark_option_some() {
        let params = make_params(empty_input());
        let expected: Option<String> = Some("x".to_string());
        assert_starlark_deep_eq("\"x\"", &params, &expected);
    }

    #[test]
    fn test_starlark_vec() {
        let params = make_params(empty_input());
        let expected: Vec<f64> = vec![1.0, 2.0, 3.0];
        assert_starlark_deep_eq("[1.0, 2.0, 3.0]", &params, &expected);
    }

    #[test]
    fn test_starlark_input_boolean() {
        let params = make_params(empty_input());
        assert_starlark_deep_eq("True", &params, &Input::Boolean(true));
        assert_starlark_deep_eq("False", &params, &Input::Boolean(false));
    }

    #[test]
    fn test_starlark_input_integer() {
        let params = make_params(empty_input());
        assert_starlark_deep_eq("42", &params, &Input::Integer(42));
    }

    #[test]
    fn test_starlark_input_number() {
        let params = make_params(empty_input());
        assert_starlark_deep_eq("3.14", &params, &Input::Number(3.14));
    }

    #[test]
    fn test_starlark_input_string() {
        let params = make_params(empty_input());
        assert_starlark_deep_eq("\"hello\"", &params, &Input::String("hello".to_string()));
    }

    #[test]
    fn test_starlark_input_array() {
        let params = make_params(empty_input());
        let expected = Input::Array(vec![
            Input::Integer(1),
            Input::Integer(2),
            Input::String("x".to_string()),
        ]);
        assert_starlark_deep_eq("[1, 2, \"x\"]", &params, &expected);
    }

    #[test]
    fn test_starlark_input_object() {
        let params = make_params(empty_input());
        let expected = obj(vec![
            ("a", Input::Integer(1)),
            ("b", Input::String("two".to_string())),
        ]);
        assert_starlark_deep_eq("{\"a\": 1, \"b\": \"two\"}", &params, &expected);
    }

    #[test]
    fn test_starlark_input_expression_boolean() {
        let params = make_params(empty_input());
        assert_starlark_deep_eq(
            "True",
            &params,
            &InputExpression::Boolean(true),
        );
    }

    #[test]
    fn test_starlark_input_expression_integer() {
        let params = make_params(empty_input());
        assert_starlark_deep_eq(
            "0",
            &params,
            &InputExpression::Integer(0),
        );
    }

    #[test]
    fn test_starlark_input_expression_number() {
        let params = make_params(empty_input());
        assert_starlark_deep_eq(
            "1.5",
            &params,
            &InputExpression::Number(1.5),
        );
    }

    #[test]
    fn test_starlark_input_expression_string() {
        let params = make_params(empty_input());
        assert_starlark_deep_eq(
            "\"s\"",
            &params,
            &InputExpression::String("s".to_string()),
        );
    }

    #[test]
    fn test_starlark_input_expression_array() {
        let params = make_params(empty_input());
        let expected = InputExpression::Array(vec![
            WithExpression::Value(InputExpression::Integer(1)),
            WithExpression::Value(InputExpression::String("y".to_string())),
        ]);
        assert_starlark_deep_eq("[1, \"y\"]", &params, &expected);
    }

    #[test]
    fn test_starlark_input_expression_object() {
        let params = make_params(empty_input());
        let mut map = IndexMap::new();
        map.insert(
            "k".to_string(),
            WithExpression::Value(InputExpression::Boolean(true)),
        );
        let expected = InputExpression::Object(map);
        assert_starlark_deep_eq("{\"k\": True}", &params, &expected);
    }

    #[test]
    fn test_starlark_function_output_scalar() {
        let params = make_params(empty_input());
        assert_starlark_deep_eq(
            "0.5",
            &params,
            &FunctionOutput::Scalar(dec!(0.5)),
        );
    }

    #[test]
    fn test_starlark_function_output_scalar_int() {
        let params = make_params(empty_input());
        assert_starlark_deep_eq(
            "1",
            &params,
            &FunctionOutput::Scalar(dec!(1)),
        );
    }

    #[test]
    fn test_starlark_function_output_vector() {
        let params = make_params(empty_input());
        assert_starlark_deep_eq(
            "[0.25, 0.75]",
            &params,
            &FunctionOutput::Vector(vec![dec!(0.25), dec!(0.75)]),
        );
    }

    #[test]
    fn test_starlark_function_output_err() {
        let params = make_params(empty_input());
        let err_val = serde_json::json!({"error": "bad"});
        assert_starlark_deep_eq(
            "{\"error\": \"bad\"}",
            &params,
            &FunctionOutput::Err(err_val),
        );
    }

    #[test]
    fn test_starlark_simple_content_expression_text() {
        let params = make_params(empty_input());
        assert_starlark_deep_eq(
            "\"hello\"",
            &params,
            &SimpleContentExpression::Text("hello".to_string()),
        );
    }

    #[test]
    fn test_starlark_simple_content_expression_parts() {
        let params = make_params(empty_input());
        let expected = SimpleContentExpression::Parts(vec![
            WithExpression::Value(SimpleContentPartExpression::Text {
                text: WithExpression::Value("a".to_string()),
            }),
            WithExpression::Value(SimpleContentPartExpression::Text {
                text: WithExpression::Value("b".to_string()),
            }),
        ]);
        assert_starlark_deep_eq(
            "[{\"type\": \"text\", \"text\": \"a\"}, {\"type\": \"text\", \"text\": \"b\"}]",
            &params,
            &expected,
        );
    }

    #[test]
    fn test_starlark_simple_content_part_expression_text() {
        let params = make_params(empty_input());
        let expected = SimpleContentPartExpression::Text {
            text: WithExpression::Value("part".to_string()),
        };
        assert_starlark_deep_eq(
            "{\"type\": \"text\", \"text\": \"part\"}",
            &params,
            &expected,
        );
    }

    #[test]
    fn test_starlark_rich_content_expression_text() {
        let params = make_params(empty_input());
        assert_starlark_deep_eq(
            "\"hi\"",
            &params,
            &RichContentExpression::Text("hi".to_string()),
        );
    }

    #[test]
    fn test_starlark_rich_content_expression_parts() {
        let params = make_params(empty_input());
        let expected = RichContentExpression::Parts(vec![
            WithExpression::Value(RichContentPartExpression::Text {
                text: WithExpression::Value("x".to_string()),
            }),
        ]);
        assert_starlark_deep_eq(
            "[{\"type\": \"text\", \"text\": \"x\"}]",
            &params,
            &expected,
        );
    }

    #[test]
    fn test_starlark_image_url_no_detail() {
        let params = make_params(empty_input());
        assert_starlark_deep_eq(
            "{\"url\": \"https://x.com/img.png\"}",
            &params,
            &ImageUrl {
                url: "https://x.com/img.png".to_string(),
                detail: None,
            },
        );
    }

    #[test]
    fn test_starlark_image_url_detail_auto() {
        let params = make_params(empty_input());
        assert_starlark_deep_eq(
            "{\"url\": \"u\", \"detail\": \"auto\"}",
            &params,
            &ImageUrl {
                url: "u".to_string(),
                detail: Some(ImageUrlDetail::Auto),
            },
        );
    }

    #[test]
    fn test_starlark_image_url_detail_low() {
        let params = make_params(empty_input());
        assert_starlark_deep_eq(
            "{\"url\": \"u\", \"detail\": \"low\"}",
            &params,
            &ImageUrl {
                url: "u".to_string(),
                detail: Some(ImageUrlDetail::Low),
            },
        );
    }

    #[test]
    fn test_starlark_image_url_detail_high() {
        let params = make_params(empty_input());
        assert_starlark_deep_eq(
            "{\"url\": \"u\", \"detail\": \"high\"}",
            &params,
            &ImageUrl {
                url: "u".to_string(),
                detail: Some(ImageUrlDetail::High),
            },
        );
    }

    #[test]
    fn test_starlark_input_audio() {
        let params = make_params(empty_input());
        assert_starlark_deep_eq(
            "{\"data\": \"base64data\", \"format\": \"wav\"}",
            &params,
            &InputAudio {
                data: "base64data".to_string(),
                format: "wav".to_string(),
            },
        );
    }

    #[test]
    fn test_starlark_input_audio_defaults() {
        let params = make_params(empty_input());
        assert_starlark_deep_eq(
            "{}",
            &params,
            &InputAudio {
                data: String::new(),
                format: String::new(),
            },
        );
    }

    #[test]
    fn test_starlark_video_url() {
        let params = make_params(empty_input());
        assert_starlark_deep_eq(
            "{\"url\": \"https://v.com/x.mp4\"}",
            &params,
            &VideoUrl {
                url: "https://v.com/x.mp4".to_string(),
            },
        );
    }

    #[test]
    fn test_starlark_file_all_missing() {
        let params = make_params(empty_input());
        assert_starlark_deep_eq(
            "{}",
            &params,
            &File {
                file_data: None,
                file_id: None,
                filename: None,
                file_url: None,
            },
        );
    }

    #[test]
    fn test_starlark_file_with_file_data() {
        let params = make_params(empty_input());
        assert_starlark_deep_eq(
            "{\"file_data\": \"abc\"}",
            &params,
            &File {
                file_data: Some("abc".to_string()),
                file_id: None,
                filename: None,
                file_url: None,
            },
        );
    }

    #[test]
    fn test_starlark_file_with_file_id() {
        let params = make_params(empty_input());
        assert_starlark_deep_eq(
            "{\"file_id\": \"id-1\"}",
            &params,
            &File {
                file_data: None,
                file_id: Some("id-1".to_string()),
                filename: None,
                file_url: None,
            },
        );
    }

    #[test]
    fn test_starlark_file_with_filename() {
        let params = make_params(empty_input());
        assert_starlark_deep_eq(
            "{\"filename\": \"doc.pdf\"}",
            &params,
            &File {
                file_data: None,
                file_id: None,
                filename: Some("doc.pdf".to_string()),
                file_url: None,
            },
        );
    }

    #[test]
    fn test_starlark_file_with_file_url() {
        let params = make_params(empty_input());
        assert_starlark_deep_eq(
            "{\"file_url\": \"https://f.com/f\"}",
            &params,
            &File {
                file_data: None,
                file_id: None,
                filename: None,
                file_url: Some("https://f.com/f".to_string()),
            },
        );
    }

    #[test]
    fn test_starlark_file_all_present() {
        let params = make_params(empty_input());
        assert_starlark_deep_eq(
            "{\"file_data\": \"d\", \"file_id\": \"i\", \"filename\": \"n\", \"file_url\": \"u\"}",
            &params,
            &File {
                file_data: Some("d".to_string()),
                file_id: Some("i".to_string()),
                filename: Some("n".to_string()),
                file_url: Some("u".to_string()),
            },
        );
    }

    #[test]
    fn test_starlark_rich_content_part_text() {
        let params = make_params(empty_input());
        let expected = RichContentPartExpression::Text {
            text: WithExpression::Value("t".to_string()),
        };
        assert_starlark_deep_eq(
            "{\"type\": \"text\", \"text\": \"t\"}",
            &params,
            &expected,
        );
    }

    #[test]
    fn test_starlark_rich_content_part_image_url() {
        let params = make_params(empty_input());
        let expected = RichContentPartExpression::ImageUrl {
            image_url: WithExpression::Value(ImageUrl {
                url: "u".to_string(),
                detail: Some(ImageUrlDetail::High),
            }),
        };
        assert_starlark_deep_eq(
            "{\"type\": \"image_url\", \"image_url\": {\"url\": \"u\", \"detail\": \"high\"}}",
            &params,
            &expected,
        );
    }

    #[test]
    fn test_starlark_rich_content_part_input_audio() {
        let params = make_params(empty_input());
        let expected = RichContentPartExpression::InputAudio {
            input_audio: WithExpression::Value(InputAudio {
                data: "d".to_string(),
                format: "mp3".to_string(),
            }),
        };
        assert_starlark_deep_eq(
            "{\"type\": \"input_audio\", \"input_audio\": {\"data\": \"d\", \"format\": \"mp3\"}}",
            &params,
            &expected,
        );
    }

    #[test]
    fn test_starlark_rich_content_part_input_video() {
        let params = make_params(empty_input());
        let expected = RichContentPartExpression::InputVideo {
            video_url: WithExpression::Value(VideoUrl {
                url: "https://v".to_string(),
            }),
        };
        assert_starlark_deep_eq(
            "{\"type\": \"input_video\", \"video_url\": {\"url\": \"https://v\"}}",
            &params,
            &expected,
        );
    }

    #[test]
    fn test_starlark_rich_content_part_video_url() {
        let params = make_params(empty_input());
        let expected = RichContentPartExpression::VideoUrl {
            video_url: WithExpression::Value(VideoUrl {
                url: "https://v2".to_string(),
            }),
        };
        assert_starlark_deep_eq(
            "{\"type\": \"video_url\", \"video_url\": {\"url\": \"https://v2\"}}",
            &params,
            &expected,
        );
    }

    #[test]
    fn test_starlark_rich_content_part_file() {
        let params = make_params(empty_input());
        let expected = RichContentPartExpression::File {
            file: WithExpression::Value(File {
                file_data: None,
                file_id: Some("fid".to_string()),
                filename: None,
                file_url: None,
            }),
        };
        assert_starlark_deep_eq(
            "{\"type\": \"file\", \"file\": {\"file_id\": \"fid\"}}",
            &params,
            &expected,
        );
    }

    #[test]
    fn test_starlark_value_expression_null() {
        let params = make_params(empty_input());
        assert_starlark_deep_eq("None", &params, &ValueExpression::Null);
    }

    #[test]
    fn test_starlark_value_expression_bool() {
        let params = make_params(empty_input());
        assert_starlark_deep_eq("True", &params, &ValueExpression::Bool(true));
        assert_starlark_deep_eq("False", &params, &ValueExpression::Bool(false));
    }

    #[test]
    fn test_starlark_value_expression_number() {
        let params = make_params(empty_input());
        assert_starlark_deep_eq(
            "42",
            &params,
            &ValueExpression::Number(JsonNumber::from(42)),
        );
        assert_starlark_deep_eq(
            "3.14",
            &params,
            &ValueExpression::Number(JsonNumber::from_f64(3.14).unwrap()),
        );
    }

    #[test]
    fn test_starlark_value_expression_string() {
        let params = make_params(empty_input());
        assert_starlark_deep_eq(
            "\"s\"",
            &params,
            &ValueExpression::String("s".to_string()),
        );
    }

    #[test]
    fn test_starlark_value_expression_array() {
        let params = make_params(empty_input());
        let expected = ValueExpression::Array(vec![
            WithExpression::Value(ValueExpression::Number(JsonNumber::from(1))),
            WithExpression::Value(ValueExpression::String("a".to_string())),
        ]);
        assert_starlark_deep_eq("[1, \"a\"]", &params, &expected);
    }

    #[test]
    fn test_starlark_value_expression_object() {
        let params = make_params(empty_input());
        let mut map = IndexMap::new();
        map.insert(
            "k".to_string(),
            WithExpression::Value(ValueExpression::Bool(false)),
        );
        let expected = ValueExpression::Object(map);
        assert_starlark_deep_eq("{\"k\": False}", &params, &expected);
    }

    #[test]
    fn test_starlark_function_tool_expression_name_only() {
        let params = make_params(empty_input());
        let expected = FunctionToolExpression {
            name: WithExpression::Value("f".to_string()),
            description: None,
            parameters: None,
            strict: None,
        };
        assert_starlark_deep_eq("{\"name\": \"f\"}", &params, &expected);
    }

    #[test]
    fn test_starlark_function_tool_expression_with_description() {
        let params = make_params(empty_input());
        let expected = FunctionToolExpression {
            name: WithExpression::Value("g".to_string()),
            description: Some(WithExpression::Value(Some("desc".to_string()))),
            parameters: None,
            strict: None,
        };
        assert_starlark_deep_eq(
            "{\"name\": \"g\", \"description\": \"desc\"}",
            &params,
            &expected,
        );
    }

    #[test]
    fn test_starlark_function_tool_expression_with_parameters() {
        let params = make_params(empty_input());
        let mut params_map = IndexMap::new();
        params_map.insert(
            "x".to_string(),
            WithExpression::Value(ValueExpression::String("s".to_string())),
        );
        let expected = FunctionToolExpression {
            name: WithExpression::Value("h".to_string()),
            description: None,
            parameters: Some(WithExpression::Value(Some(params_map))),
            strict: None,
        };
        assert_starlark_deep_eq(
            "{\"name\": \"h\", \"parameters\": {\"x\": \"s\"}}",
            &params,
            &expected,
        );
    }

    #[test]
    fn test_starlark_function_tool_expression_with_strict() {
        let params = make_params(empty_input());
        let expected = FunctionToolExpression {
            name: WithExpression::Value("s".to_string()),
            description: None,
            parameters: None,
            strict: Some(WithExpression::Value(Some(true))),
        };
        assert_starlark_deep_eq(
            "{\"name\": \"s\", \"strict\": True}",
            &params,
            &expected,
        );
    }

    #[test]
    fn test_starlark_function_tool_expression_all_fields() {
        let params = make_params(empty_input());
        let mut params_map = IndexMap::new();
        params_map.insert(
            "a".to_string(),
            WithExpression::Value(ValueExpression::Number(JsonNumber::from(1))),
        );
        let expected = FunctionToolExpression {
            name: WithExpression::Value("all".to_string()),
            description: Some(WithExpression::Value(Some("d".to_string()))),
            parameters: Some(WithExpression::Value(Some(params_map))),
            strict: Some(WithExpression::Value(Some(false))),
        };
        assert_starlark_deep_eq(
            "{\"name\": \"all\", \"description\": \"d\", \"parameters\": {\"a\": 1}, \"strict\": False}",
            &params,
            &expected,
        );
    }

    #[test]
    fn test_starlark_assistant_tool_call_function_expression() {
        let params = make_params(empty_input());
        let expected = AssistantToolCallFunctionExpression {
            name: WithExpression::Value("fn".to_string()),
            arguments: WithExpression::Value("{\"x\": 1}".to_string()),
        };
        assert_starlark_deep_eq(
            "{\"name\": \"fn\", \"arguments\": \"{\\\"x\\\": 1}\"}",
            &params,
            &expected,
        );
    }

    #[test]
    fn test_starlark_assistant_tool_call_expression() {
        let params = make_params(empty_input());
        let expected = AssistantToolCallExpression::Function {
            id: WithExpression::Value("call_1".to_string()),
            function: WithExpression::Value(AssistantToolCallFunctionExpression {
                name: WithExpression::Value("f".to_string()),
                arguments: WithExpression::Value("{}".to_string()),
            }),
        };
        assert_starlark_deep_eq(
            "{\"type\": \"function\", \"id\": \"call_1\", \"function\": {\"name\": \"f\", \"arguments\": \"{}\"}}",
            &params,
            &expected,
        );
    }

    #[test]
    fn test_starlark_assistant_tool_call_expression_id_default() {
        let params = make_params(empty_input());
        let expected = AssistantToolCallExpression::Function {
            id: WithExpression::Value(String::new()),
            function: WithExpression::Value(AssistantToolCallFunctionExpression {
                name: WithExpression::Value("g".to_string()),
                arguments: WithExpression::Value("{}".to_string()),
            }),
        };
        assert_starlark_deep_eq(
            "{\"type\": \"function\", \"function\": {\"name\": \"g\", \"arguments\": \"{}\"}}",
            &params,
            &expected,
        );
    }

    #[test]
    fn test_starlark_tool_expression() {
        let params = make_params(empty_input());
        let expected = ToolExpression::Function {
            function: WithExpression::Value(FunctionToolExpression {
                name: WithExpression::Value("do_it".to_string()),
                description: None,
                parameters: None,
                strict: None,
            }),
        };
        assert_starlark_deep_eq(
            "{\"type\": \"function\", \"function\": {\"name\": \"do_it\"}}",
            &params,
            &expected,
        );
    }

    #[test]
    fn test_starlark_message_user_without_name() {
        let params = make_params(empty_input());
        let expected = MessageExpression::User(UserMessageExpression {
            content: WithExpression::Value(RichContentExpression::Text("hi".to_string())),
            name: None,
        });
        assert_starlark_deep_eq(
            "{\"role\": \"user\", \"content\": \"hi\"}",
            &params,
            &expected,
        );
    }

    #[test]
    fn test_starlark_message_user_with_name() {
        let params = make_params(empty_input());
        let expected = MessageExpression::User(UserMessageExpression {
            content: WithExpression::Value(RichContentExpression::Text("hey".to_string())),
            name: Some(WithExpression::Value(Some("alice".to_string()))),
        });
        assert_starlark_deep_eq(
            "{\"role\": \"user\", \"content\": \"hey\", \"name\": \"alice\"}",
            &params,
            &expected,
        );
    }

    #[test]
    fn test_starlark_message_system_without_name() {
        let params = make_params(empty_input());
        let expected = MessageExpression::System(SystemMessageExpression {
            content: WithExpression::Value(SimpleContentExpression::Text("sys".to_string())),
            name: None,
        });
        assert_starlark_deep_eq(
            "{\"role\": \"system\", \"content\": \"sys\"}",
            &params,
            &expected,
        );
    }

    #[test]
    fn test_starlark_message_system_with_name() {
        let params = make_params(empty_input());
        let expected = MessageExpression::System(SystemMessageExpression {
            content: WithExpression::Value(SimpleContentExpression::Text("s".to_string())),
            name: Some(WithExpression::Value(Some("bot".to_string()))),
        });
        assert_starlark_deep_eq(
            "{\"role\": \"system\", \"content\": \"s\", \"name\": \"bot\"}",
            &params,
            &expected,
        );
    }

    #[test]
    fn test_starlark_message_assistant_content_none() {
        let params = make_params(empty_input());
        let expected = MessageExpression::Assistant(AssistantMessageExpression {
            content: Some(WithExpression::Value(None)),
            name: None,
            refusal: None,
            tool_calls: None,
            reasoning: None,
        });
        assert_starlark_deep_eq(
            "{\"role\": \"assistant\", \"content\": None}",
            &params,
            &expected,
        );
    }

    #[test]
    fn test_starlark_message_assistant_with_content() {
        let params = make_params(empty_input());
        let expected = MessageExpression::Assistant(AssistantMessageExpression {
            content: Some(WithExpression::Value(Some(RichContentExpression::Text("ok".to_string())))),
            name: None,
            refusal: None,
            tool_calls: None,
            reasoning: None,
        });
        assert_starlark_deep_eq(
            "{\"role\": \"assistant\", \"content\": \"ok\"}",
            &params,
            &expected,
        );
    }

    #[test]
    fn test_starlark_message_assistant_with_refusal() {
        let params = make_params(empty_input());
        let expected = MessageExpression::Assistant(AssistantMessageExpression {
            content: Some(WithExpression::Value(None)),
            name: None,
            refusal: Some(WithExpression::Value(Some("declined".to_string()))),
            tool_calls: None,
            reasoning: None,
        });
        assert_starlark_deep_eq(
            "{\"role\": \"assistant\", \"content\": None, \"refusal\": \"declined\"}",
            &params,
            &expected,
        );
    }

    #[test]
    fn test_starlark_message_assistant_with_name() {
        let params = make_params(empty_input());
        let expected = MessageExpression::Assistant(AssistantMessageExpression {
            content: Some(WithExpression::Value(None)),
            name: Some(WithExpression::Value(Some("asst".to_string()))),
            refusal: None,
            tool_calls: None,
            reasoning: None,
        });
        assert_starlark_deep_eq(
            "{\"role\": \"assistant\", \"content\": None, \"name\": \"asst\"}",
            &params,
            &expected,
        );
    }

    #[test]
    fn test_starlark_message_tool() {
        let params = make_params(empty_input());
        let expected = MessageExpression::Tool(ToolMessageExpression {
            tool_call_id: WithExpression::Value("tid".to_string()),
            content: WithExpression::Value(RichContentExpression::Text("result".to_string())),
        });
        assert_starlark_deep_eq(
            "{\"role\": \"tool\", \"tool_call_id\": \"tid\", \"content\": \"result\"}",
            &params,
            &expected,
        );
    }

    #[test]
    fn test_starlark_message_developer() {
        let params = make_params(empty_input());
        let expected = MessageExpression::Developer(DeveloperMessageExpression {
            content: WithExpression::Value(SimpleContentExpression::Text("dev".to_string())),
            name: None,
        });
        assert_starlark_deep_eq(
            "{\"role\": \"developer\", \"content\": \"dev\"}",
            &params,
            &expected,
        );
    }
}
