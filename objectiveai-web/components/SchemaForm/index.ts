/**
 * SchemaForm - Dynamic form generation from input schemas.
 *
 * @example
 * ```tsx
 * import { SchemaFormBuilder } from "@/components/SchemaForm";
 *
 * function MyForm() {
 *   const [value, setValue] = useState({});
 *
 *   return (
 *     <SchemaFormBuilder
 *       schema={functionSchema.input_schema}
 *       value={value}
 *       onChange={setValue}
 *     />
 *   );
 * }
 * ```
 */

// Main components
export { default as SchemaFormBuilder } from "./SchemaFormBuilder";
export { default as SchemaField } from "./SchemaField";

// Types
export type {
  InputSchema,
  ObjectInputSchema,
  ArrayInputSchema,
  StringInputSchema,
  NumberInputSchema,
  IntegerInputSchema,
  BooleanInputSchema,
  ImageInputSchema,
  AudioInputSchema,
  VideoInputSchema,
  FileInputSchema,
  AnyOfInputSchema,
  InputValue,
  ImageRichContentPart,
  AudioRichContentPart,
  VideoRichContentPart,
  FileRichContentPart,
  FieldPath,
  ValidationError,
  FieldProps,
  SchemaFormBuilderProps,
} from "./types";

// Type guards
export {
  isObjectSchema,
  isArraySchema,
  isStringSchema,
  isNumberSchema,
  isIntegerSchema,
  isBooleanSchema,
  isImageSchema,
  isAudioSchema,
  isVideoSchema,
  isFileSchema,
  isAnyOfSchema,
  getSchemaTypeLabel,
} from "./types";

// Utilities
export {
  parsePath,
  joinPath,
  getAtPath,
  setAtPath,
  getDefaultValue,
  detectMatchingSchemaIndex,
  valueMatchesSchema,
  fileToBase64,
  getAudioFormat,
} from "./utils";

// Validation
export {
  validateValue,
  getErrorsForPath,
  hasErrors,
  getErrorMessage,
} from "./validation";
