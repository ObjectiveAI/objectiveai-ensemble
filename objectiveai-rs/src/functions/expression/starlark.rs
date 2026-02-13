//! Starlark eval for expressions. Sandboxed; `input`, `output`, `map` in scope. by nityam

use serde_json::Value;
use starlark::environment::{Globals, GlobalsBuilder, Module};
use starlark::eval::Evaluator;
use starlark::starlark_module;
use starlark::syntax::{AstModule, Dialect};
use starlark::values::float::UnpackFloat;
use starlark::values::list::ListRef;
use starlark::values::{Heap, UnpackValue, Value as SValue};
use std::sync::LazyLock;

use super::ExpressionError;

pub static STARLARK_GLOBALS: LazyLock<Globals> = LazyLock::new(|| {
    let mut builder = GlobalsBuilder::standard();
    register_custom_functions(&mut builder);
    builder.build()
});

#[starlark_module]
fn register_custom_functions(builder: &mut GlobalsBuilder) {
    /// sum(list) → 0 for empty
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

    fn abs(#[starlark(require = pos)] x: UnpackFloat) -> starlark::Result<f64> {
        Ok(x.0.abs())
    }

    fn float(
        #[starlark(require = pos)] x: UnpackFloat,
    ) -> starlark::Result<f64> {
        Ok(x.0)
    }

    fn round(
        #[starlark(require = pos)] x: UnpackFloat,
    ) -> starlark::Result<i64> {
        Ok(x.0.round() as i64)
    }
}

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

pub fn starlark_eval(
    code: &str,
    params: &super::Params,
) -> Result<Value, ExpressionError> {
    let module = Module::new();
    {
        let heap = module.heap();
        match params {
            super::Params::Owned(owned) => {
                module.set(
                    "input",
                    owned.input.to_starlark_value(heap),
                );
                module.set(
                    "output",
                    owned
                        .output
                        .as_ref()
                        .map_or(SValue::new_none(), |o| {
                            o.to_starlark_value(heap)
                        }),
                );
                module.set(
                    "map",
                    owned
                        .map
                        .as_ref()
                        .map_or(SValue::new_none(), |m| {
                            m.to_starlark_value(heap)
                        }),
                );
            }
            super::Params::Ref(r) => {
                module
                    .set("input", r.input.to_starlark_value(heap));
                module.set(
                    "output",
                    r.output
                        .as_ref()
                        .map_or(SValue::new_none(), |o| {
                            o.to_starlark_value(heap)
                        }),
                );
                module.set(
                    "map",
                    r.map.map_or(SValue::new_none(), |m| {
                        m.to_starlark_value(heap)
                    }),
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

    result
        .to_json_value()
        .map_err(|e| ExpressionError::StarlarkConversionError(e.to_string()))
}

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
    use crate::functions::expression::{
        FunctionOutput, Input, Params, ParamsOwned, TaskOutputOwned,
        VectorCompletionOutput,
    };
    use indexmap::IndexMap;
    use rust_decimal::dec;

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
        let result = starlark_eval("42", &params).unwrap();
        assert_eq!(result, Value::Number(42.into()));
    }

    #[test]
    fn test_string_literal() {
        let params = make_params(empty_input());
        let result = starlark_eval("\"hello\"", &params).unwrap();
        assert_eq!(result, Value::String("hello".to_string()));
    }

    #[test]
    fn test_boolean_literal() {
        let params = make_params(empty_input());
        assert_eq!(starlark_eval("True", &params).unwrap(), Value::Bool(true));
        assert_eq!(
            starlark_eval("False", &params).unwrap(),
            Value::Bool(false)
        );
    }

    #[test]
    fn test_none_literal() {
        let params = make_params(empty_input());
        let result = starlark_eval("None", &params).unwrap();
        assert_eq!(result, Value::Null);
    }

    #[test]
    fn test_list_literal() {
        let params = make_params(empty_input());
        let result = starlark_eval("[1, 2, 3]", &params).unwrap();
        assert_eq!(
            result,
            Value::Array(vec![
                Value::Number(1.into()),
                Value::Number(2.into()),
                Value::Number(3.into())
            ])
        );
    }

    #[test]
    fn test_input_access() {
        let input = obj(vec![
            ("name", Input::String("alice".to_string())),
            ("age", Input::Integer(30)),
        ]);
        let params = make_params(input);
        assert_eq!(
            starlark_eval("input['name']", &params).unwrap(),
            Value::String("alice".to_string())
        );
        assert_eq!(
            starlark_eval("input['age']", &params).unwrap(),
            Value::Number(30.into())
        );
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
        let result =
            starlark_eval("input['user']['profile']['email']", &params)
                .unwrap();
        assert_eq!(result, Value::String("test@example.com".to_string()));
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
        assert_eq!(
            starlark_eval("input['items'][0]", &params).unwrap(),
            Value::String("a".to_string())
        );
        assert_eq!(
            starlark_eval("input['items'][-1]", &params).unwrap(),
            Value::String("c".to_string())
        );
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
        let result =
            starlark_eval("[x * 2 for x in input['numbers']]", &params)
                .unwrap();
        assert_eq!(
            result,
            Value::Array(vec![
                Value::Number(2.into()),
                Value::Number(4.into()),
                Value::Number(6.into())
            ])
        );
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
        let result = starlark_eval(
            "[x for x in input['numbers'] if x % 2 == 0]",
            &params,
        )
        .unwrap();
        assert_eq!(
            result,
            Value::Array(vec![
                Value::Number(2.into()),
                Value::Number(4.into()),
                Value::Number(6.into())
            ])
        );
    }

    #[test]
    fn test_arithmetic() {
        let params = make_params(empty_input());
        assert_eq!(
            starlark_eval("1 + 2", &params).unwrap(),
            Value::Number(3.into())
        );
        assert_eq!(
            starlark_eval("10 - 3", &params).unwrap(),
            Value::Number(7.into())
        );
        assert_eq!(
            starlark_eval("4 * 5", &params).unwrap(),
            Value::Number(20.into())
        );
        assert_eq!(
            starlark_eval("15 // 4", &params).unwrap(),
            Value::Number(3.into())
        );
        assert_eq!(
            starlark_eval("15 % 4", &params).unwrap(),
            Value::Number(3.into())
        );
    }

    #[test]
    fn test_builtin_functions() {
        let params = make_params(empty_input());
        assert_eq!(
            starlark_eval("min([3, 1, 2])", &params).unwrap(),
            Value::Number(1.into())
        );
        assert_eq!(
            starlark_eval("max([3, 1, 2])", &params).unwrap(),
            Value::Number(3.into())
        );
        assert_eq!(
            starlark_eval("len([1, 2, 3])", &params).unwrap(),
            Value::Number(3.into())
        );
        assert_eq!(
            starlark_eval("sorted([3, 1, 2])", &params).unwrap(),
            Value::Array(vec![
                Value::Number(1.into()),
                Value::Number(2.into()),
                Value::Number(3.into()),
            ])
        );
    }

    #[test]
    fn test_conditional_expression() {
        let input = obj(vec![("value", Input::Integer(10))]);
        let params = make_params(input);
        let result = starlark_eval(
            "\"big\" if input['value'] > 5 else \"small\"",
            &params,
        )
        .unwrap();
        assert_eq!(result, Value::String("big".to_string()));

        let input2 = obj(vec![("value", Input::Integer(3))]);
        let params2 = make_params(input2);
        let result2 = starlark_eval(
            "\"big\" if input['value'] > 5 else \"small\"",
            &params2,
        )
        .unwrap();
        assert_eq!(result2, Value::String("small".to_string()));
    }

    #[test]
    fn test_parse_error() {
        let params = make_params(empty_input());
        let result = starlark_eval("invalid syntax [[[", &params);
        assert!(matches!(
            result,
            Err(ExpressionError::StarlarkParseError(_))
        ));
    }

    #[test]
    fn test_eval_error() {
        let params = make_params(empty_input());
        let result = starlark_eval("undefined_variable", &params);
        assert!(matches!(result, Err(ExpressionError::StarlarkEvalError(_))));
    }

    // ==================== TESTS USING MAP ====================

    #[test]
    fn test_map_access() {
        let input = obj(vec![("base", Input::Integer(100))]);
        let map = obj(vec![("multiplier", Input::Integer(3))]);
        let params = make_params_with_map(input, map);

        let result =
            starlark_eval("input['base'] * map['multiplier']", &params)
                .unwrap();
        assert_eq!(result, Value::Number(300.into()));
    }

    #[test]
    fn test_map_with_nested_data() {
        let input = obj(vec![("prefix", Input::String("Hello".to_string()))]);
        let map = obj(vec![
            ("name", Input::String("World".to_string())),
            ("count", Input::Integer(3)),
        ]);
        let params = make_params_with_map(input, map);

        let result =
            starlark_eval("input['prefix'] + ' ' + map['name']", &params)
                .unwrap();
        assert_eq!(result, Value::String("Hello World".to_string()));

        let result2 = starlark_eval("map['count'] * 10", &params).unwrap();
        assert_eq!(result2, Value::Number(30.into()));
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

        let result = starlark_eval(
            "[v * input['factor'] for v in map['values']]",
            &params,
        )
        .unwrap();
        assert_eq!(
            result,
            Value::Array(vec![
                Value::Number(2.into()),
                Value::Number(4.into()),
                Value::Number(6.into())
            ])
        );
    }

    // ==================== TESTS USING OUTPUT ====================

    #[test]
    fn test_output_scalar() {
        let input = empty_input();
        let output =
            TaskOutputOwned::Function(FunctionOutput::Scalar(dec!(0.75)));
        let params = make_params_with_output(input, output);

        // FunctionOutput::Scalar serializes as just the decimal value (float)
        let result = starlark_eval("output", &params).unwrap();
        assert_eq!(result.as_f64().unwrap(), 0.75);
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

        // FunctionOutput::Vector serializes as just the array of decimals
        let result = starlark_eval("len(output)", &params).unwrap();
        assert_eq!(result, Value::Number(3.into()));
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

        let result = starlark_eval("len(output['scores'])", &params).unwrap();
        assert_eq!(result, Value::Number(3.into()));

        let result2 = starlark_eval("len(output['weights'])", &params).unwrap();
        assert_eq!(result2, Value::Number(3.into()));
    }

    #[test]
    fn test_output_none() {
        let input = empty_input();
        let params = make_params(input);

        let result = starlark_eval("output == None", &params).unwrap();
        assert_eq!(result, Value::Bool(true));
    }

    #[test]
    fn test_output_not_none() {
        let input = obj(vec![("threshold", Input::Number(0.5))]);
        let output =
            TaskOutputOwned::Function(FunctionOutput::Scalar(dec!(0.7)));
        let params = make_params_with_output(input, output);

        let result = starlark_eval("output != None", &params).unwrap();
        assert_eq!(result, Value::Bool(true));
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

        // Access all three: input, output, and map
        let result = starlark_eval("len(output['scores'])", &params).unwrap();
        assert_eq!(result, Value::Number(2.into()));

        let result2 = starlark_eval("map['index']", &params).unwrap();
        assert_eq!(result2, Value::Number(1.into()));
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

        // Use map to index into input
        let result =
            starlark_eval("input['items'][map['selected_index']]", &params)
                .unwrap();
        assert_eq!(result, Value::String("b".to_string()));

        // Verify output is accessible
        let result2 = starlark_eval("output", &params).unwrap();
        assert_eq!(result2.as_f64().unwrap(), 0.5);
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

        let result = starlark_eval("len(output)", &params).unwrap();
        assert_eq!(result, Value::Number(3.into()));
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

        // Access first mapped output's scores length
        let result = starlark_eval("len(output[0]['scores'])", &params).unwrap();
        assert_eq!(result, Value::Number(2.into()));

        // Access second mapped output
        let result2 =
            starlark_eval("len(output[1]['weights'])", &params).unwrap();
        assert_eq!(result2, Value::Number(2.into()));
    }

    // ==================== TESTS FOR CUSTOM FUNCTIONS ====================

    #[test]
    fn test_sum_integers() {
        let params = make_params(empty_input());
        let result = starlark_eval("sum([1, 2, 3, 4, 5])", &params).unwrap();
        assert_eq!(result.as_f64().unwrap(), 15.0);
    }

    #[test]
    fn test_sum_floats() {
        let params = make_params(empty_input());
        let result = starlark_eval("sum([1.5, 2.5, 3.0])", &params).unwrap();
        assert_eq!(result.as_f64().unwrap(), 7.0);
    }

    #[test]
    fn test_sum_empty() {
        let params = make_params(empty_input());
        let result = starlark_eval("sum([])", &params).unwrap();
        assert_eq!(result.as_f64().unwrap(), 0.0);
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
        let result = starlark_eval("sum(input['values'])", &params).unwrap();
        assert_eq!(result.as_f64().unwrap(), 60.0);
    }

    #[test]
    fn test_abs_positive() {
        let params = make_params(empty_input());
        let result = starlark_eval("abs(5)", &params).unwrap();
        assert_eq!(result.as_f64().unwrap(), 5.0);
    }

    #[test]
    fn test_abs_negative() {
        let params = make_params(empty_input());
        let result = starlark_eval("abs(-5)", &params).unwrap();
        assert_eq!(result.as_f64().unwrap(), 5.0);
    }

    #[test]
    fn test_abs_float() {
        let params = make_params(empty_input());
        let result = starlark_eval("abs(-3.14)", &params).unwrap();
        assert!((result.as_f64().unwrap() - 3.14).abs() < 0.001);
    }

    #[test]
    fn test_float_from_int() {
        let params = make_params(empty_input());
        let result = starlark_eval("float(42)", &params).unwrap();
        assert_eq!(result.as_f64().unwrap(), 42.0);
    }

    #[test]
    fn test_round_down() {
        let params = make_params(empty_input());
        let result = starlark_eval("round(3.4)", &params).unwrap();
        assert_eq!(result.as_i64().unwrap(), 3);
    }

    #[test]
    fn test_round_up() {
        let params = make_params(empty_input());
        let result = starlark_eval("round(3.6)", &params).unwrap();
        assert_eq!(result.as_i64().unwrap(), 4);
    }

    // ==================== TESTS FOR AVERAGING ====================

    #[test]
    fn test_average_simple() {
        let params = make_params(empty_input());
        let result =
            starlark_eval("sum([2, 4, 6]) / len([2, 4, 6])", &params).unwrap();
        assert_eq!(result.as_f64().unwrap(), 4.0);
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
        let result = starlark_eval(
            "sum(input['scores']) / len(input['scores'])",
            &params,
        )
        .unwrap();
        assert_eq!(result.as_f64().unwrap(), 0.75);
    }

    #[test]
    fn test_average_mapped_outputs() {
        let input = empty_input();
        // MapFunction contains multiple scalar outputs from mapped task execution
        let output = TaskOutputOwned::MapFunction(vec![
            FunctionOutput::Scalar(dec!(0.2)),
            FunctionOutput::Scalar(dec!(0.4)),
            FunctionOutput::Scalar(dec!(0.6)),
        ]);
        let params = make_params_with_output(input, output);

        // FunctionOutput::Scalar serializes as just the float value
        let result =
            starlark_eval("sum(output) / len(output)", &params).unwrap();
        assert!((result.as_f64().unwrap() - 0.4).abs() < 0.0001);
    }

    // ==================== TESTS FOR L1 NORMALIZATION ====================

    #[test]
    fn test_l1_normalize_simple() {
        let params = make_params(empty_input());
        // L1 normalize [2, 3, 5] -> sum of abs = 10 -> [0.2, 0.3, 0.5]
        let result = starlark_eval(
            "[x / sum([abs(y) for y in [2, 3, 5]]) for x in [2, 3, 5]]",
            &params,
        )
        .unwrap();
        let arr = result.as_array().unwrap();
        assert_eq!(arr.len(), 3);
        assert_eq!(arr[0].as_f64().unwrap(), 0.2);
        assert_eq!(arr[1].as_f64().unwrap(), 0.3);
        assert_eq!(arr[2].as_f64().unwrap(), 0.5);
    }

    #[test]
    fn test_l1_normalize_with_negatives() {
        let params = make_params(empty_input());
        // L1 normalize [-2, 3, -5] -> sum of abs = 10 -> [-0.2, 0.3, -0.5]
        let result = starlark_eval(
            "[x / sum([abs(y) for y in [-2, 3, -5]]) for x in [-2, 3, -5]]",
            &params,
        )
        .unwrap();
        let arr = result.as_array().unwrap();
        assert_eq!(arr.len(), 3);
        assert_eq!(arr[0].as_f64().unwrap(), -0.2);
        assert_eq!(arr[1].as_f64().unwrap(), 0.3);
        assert_eq!(arr[2].as_f64().unwrap(), -0.5);
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
        // L1 normalize [1, 2, 2] -> sum = 5 -> [0.2, 0.4, 0.4]
        let result = starlark_eval(
            "[w / sum(input['weights']) for w in input['weights']]",
            &params,
        )
        .unwrap();
        let arr = result.as_array().unwrap();
        assert_eq!(arr.len(), 3);
        assert_eq!(arr[0].as_f64().unwrap(), 0.2);
        assert_eq!(arr[1].as_f64().unwrap(), 0.4);
        assert_eq!(arr[2].as_f64().unwrap(), 0.4);
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
        // Normalize and verify sum equals 1.0
        let result = starlark_eval(
            "sum([v / sum(input['values']) for v in input['values']])",
            &params,
        )
        .unwrap();
        assert!((result.as_f64().unwrap() - 1.0).abs() < 0.0001);
    }
}
