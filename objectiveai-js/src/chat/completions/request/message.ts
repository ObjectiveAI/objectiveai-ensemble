import { ExpressionSchema } from "src/functions/expression/expression";
import z from "zod";
import { convert, type JSONSchema } from "../../../json_schema";

// Simple Content

export const SimpleContentTextSchema = z
  .string()
  .describe("Plain text content.")
  .meta({ title: "SimpleContentText" });
export type SimpleContentText = z.infer<typeof SimpleContentTextSchema>;
export const SimpleContentTextJsonSchema: JSONSchema = convert(
  SimpleContentTextSchema,
);

export const SimpleContentPartSchema = z
  .object({
    type: z.literal("text"),
    text: z.string().describe("The text content."),
  })
  .describe("A simple content part.")
  .meta({ title: "SimpleContentPart" });
export type SimpleContentPart = z.infer<typeof SimpleContentPartSchema>;
export const SimpleContentPartJsonSchema: JSONSchema = convert(
  SimpleContentPartSchema,
);

export const SimpleContentPartExpressionSchema = z
  .union([
    z.object({
      type: z.literal("text"),
      text: z.union([
        z.string().describe("The text content."),
        ExpressionSchema.describe(
          "An expression which evaluates to the text content. Receives: `input`, `map` (if mapped).",
        ),
      ]),
    }),
    ExpressionSchema.describe(
      "An expression which evaluates to a simple content part. Receives: `input`, `map` (if mapped).",
    ),
  ])
  .describe(SimpleContentPartSchema.description!)
  .meta({ title: "SimpleContentPartExpression" });
export type SimpleContentPartExpression = z.infer<
  typeof SimpleContentPartExpressionSchema
>;
export const SimpleContentPartExpressionJsonSchema: JSONSchema = convert(
  SimpleContentPartExpressionSchema,
);

export const SimpleContentPartsSchema = z
  .array(SimpleContentPartSchema)
  .describe("An array of simple content parts.")
  .meta({ title: "SimpleContentParts" });
export type SimpleContentParts = z.infer<typeof SimpleContentPartsSchema>;
export const SimpleContentPartsJsonSchema: JSONSchema = convert(
  SimpleContentPartsSchema,
);

export const SimpleContentPartExpressionsSchema = z
  .array(SimpleContentPartExpressionSchema)
  .describe(SimpleContentPartsSchema.description!)
  .meta({ title: "SimpleContentPartExpressions" });
export type SimpleContentPartExpressions = z.infer<
  typeof SimpleContentPartExpressionsSchema
>;
export const SimpleContentPartExpressionsJsonSchema: JSONSchema = convert(
  SimpleContentPartExpressionsSchema,
);

export const SimpleContentSchema = z
  .union([SimpleContentTextSchema, SimpleContentPartsSchema])
  .describe("Simple content.")
  .meta({ title: "SimpleContent" });
export type SimpleContent = z.infer<typeof SimpleContentSchema>;
export const SimpleContentJsonSchema: JSONSchema = convert(SimpleContentSchema);

export const SimpleContentExpressionSchema = z
  .union([
    SimpleContentTextSchema,
    SimpleContentPartExpressionsSchema,
    ExpressionSchema.describe(
      "An expression which evaluates to simple content. Receives: `input`, `map` (if mapped).",
    ),
  ])
  .describe(SimpleContentSchema.description!)
  .meta({ title: "SimpleContentExpression" });
export type SimpleContentExpression = z.infer<
  typeof SimpleContentExpressionSchema
>;
export const SimpleContentExpressionJsonSchema: JSONSchema = convert(
  SimpleContentExpressionSchema,
);

// Text Rich Content Part

export const TextRichContentPartTextSchema = z
  .string()
  .describe("The text content.");
export type TextRichContentPartText = z.infer<
  typeof TextRichContentPartTextSchema
>;
export const TextRichContentPartTextJsonSchema: JSONSchema = convert(
  TextRichContentPartTextSchema,
);

export const TextRichContentPartTextExpressionSchema = z
  .union([
    TextRichContentPartTextSchema,
    ExpressionSchema.describe(
      "An expression which evaluates to the text content. Receives: `input`, `map` (if mapped).",
    ),
  ])
  .describe(TextRichContentPartTextSchema.description!)
  .meta({ title: "TextRichContentPartTextExpression" });
export type TextRichContentPartTextExpression = z.infer<
  typeof TextRichContentPartTextExpressionSchema
>;
export const TextRichContentPartTextExpressionJsonSchema: JSONSchema = convert(
  TextRichContentPartTextExpressionSchema,
);

export const TextRichContentPartSchema = z
  .object({
    type: z.literal("text"),
    text: TextRichContentPartTextSchema,
  })
  .describe("A text rich content part.")
  .meta({ title: "TextRichContentPart" });
export type TextRichContentPart = z.infer<typeof TextRichContentPartSchema>;
export const TextRichContentPartJsonSchema: JSONSchema = convert(
  TextRichContentPartSchema,
);

export const TextRichContentPartExpressionSchema = z
  .object({
    type: z.literal("text"),
    text: TextRichContentPartTextExpressionSchema,
  })
  .describe(TextRichContentPartSchema.description!)
  .meta({ title: "TextRichContentPartExpression" });
export type TextRichContentPartExpression = z.infer<
  typeof TextRichContentPartExpressionSchema
>;
export const TextRichContentPartExpressionJsonSchema: JSONSchema = convert(
  TextRichContentPartExpressionSchema,
);

// Image Rich Content Part

export const ImageRichContentPartDefinitionDetailSchema = z
  .enum(["auto", "low", "high"])
  .describe("Specifies the detail level of the image.");
export type ImageRichContentPartDefinitionDetail = z.infer<
  typeof ImageRichContentPartDefinitionDetailSchema
>;
export const ImageRichContentPartDefinitionDetailJsonSchema: JSONSchema =
  convert(ImageRichContentPartDefinitionDetailSchema);

export const ImageRichContentPartDefinitionUrlSchema = z
  .string()
  .describe("Either a URL of the image or the base64 encoded image data.");
export type Url = z.infer<typeof ImageRichContentPartDefinitionUrlSchema>;
export const ImageRichContentPartDefinitionUrlJsonSchema: JSONSchema = convert(
  ImageRichContentPartDefinitionUrlSchema,
);

export const ImageRichContentPartDefinitionSchema = z
  .object({
    url: ImageRichContentPartDefinitionUrlSchema,
    detail: ImageRichContentPartDefinitionDetailSchema.optional().nullable(),
  })
  .describe("The URL of the image and its optional detail level.");
export type ImageRichContentPartDefinition = z.infer<
  typeof ImageRichContentPartDefinitionSchema
>;
export const ImageRichContentPartDefinitionJsonSchema: JSONSchema = convert(
  ImageRichContentPartDefinitionSchema,
);

export const ImageRichContentPartDefinitionExpressionSchema = z
  .union([
    ImageRichContentPartDefinitionSchema,
    ExpressionSchema.describe(
      "An expression which evaluates to the image URL definition. Receives: `input`, `map` (if mapped).",
    ),
  ])
  .describe(ImageRichContentPartDefinitionSchema.description!)
  .meta({ title: "ImageRichContentPartDefinitionExpression" });
export type ImageRichContentPartDefinitionExpression = z.infer<
  typeof ImageRichContentPartDefinitionExpressionSchema
>;
export const ImageRichContentPartDefinitionExpressionJsonSchema: JSONSchema =
  convert(ImageRichContentPartDefinitionExpressionSchema);

export const ImageRichContentPartSchema = z
  .object({
    type: z.literal("image_url"),
    image_url: ImageRichContentPartDefinitionSchema,
  })
  .describe("An image rich content part.")
  .meta({ title: "ImageRichContentPart" });
export type ImageRichContentPart = z.infer<typeof ImageRichContentPartSchema>;
export const ImageRichContentPartJsonSchema: JSONSchema = convert(
  ImageRichContentPartSchema,
);

export const ImageRichContentPartExpressionSchema = z
  .object({
    type: z.literal("image_url"),
    image_url: ImageRichContentPartDefinitionExpressionSchema,
  })
  .describe(ImageRichContentPartSchema.description!)
  .meta({ title: "ImageRichContentPartExpression" });
export type ImageRichContentPartExpression = z.infer<
  typeof ImageRichContentPartExpressionSchema
>;
export const ImageRichContentPartExpressionJsonSchema: JSONSchema = convert(
  ImageRichContentPartExpressionSchema,
);

// Audio Rich Content Part

export const AudioRichContentPartDefinitionFormatSchema = z
  .enum(["wav", "mp3"])
  .describe("The format of the encoded audio data.");
export type AudioRichContentPartDefinitionFormat = z.infer<
  typeof AudioRichContentPartDefinitionFormatSchema
>;
export const AudioRichContentPartDefinitionFormatJsonSchema: JSONSchema =
  convert(AudioRichContentPartDefinitionFormatSchema);

export const AudioRichContentPartDefinitionDataSchema = z
  .string()
  .describe("Base64 encoded audio data.");
export type AudioRichContentPartDefinitionData = z.infer<
  typeof AudioRichContentPartDefinitionDataSchema
>;
export const AudioRichContentPartDefinitionDataJsonSchema: JSONSchema = convert(
  AudioRichContentPartDefinitionDataSchema,
);

export const AudioRichContentPartDefinitionSchema = z
  .object({
    data: AudioRichContentPartDefinitionDataSchema,
    format: AudioRichContentPartDefinitionFormatSchema,
  })
  .describe("The audio data and its format.");
export type AudioRichContentPartDefinition = z.infer<
  typeof AudioRichContentPartDefinitionSchema
>;
export const AudioRichContentPartDefinitionJsonSchema: JSONSchema = convert(
  AudioRichContentPartDefinitionSchema,
);

export const AudioRichContentPartDefinitionExpressionSchema = z
  .union([
    AudioRichContentPartDefinitionSchema,
    ExpressionSchema.describe(
      "An expression which evaluates to the audio definition. Receives: `input`, `map` (if mapped).",
    ),
  ])
  .describe(AudioRichContentPartDefinitionSchema.description!)
  .meta({ title: "AudioRichContentPartDefinitionExpression" });
export type AudioRichContentPartDefinitionExpression = z.infer<
  typeof AudioRichContentPartDefinitionExpressionSchema
>;
export const AudioRichContentPartDefinitionExpressionJsonSchema: JSONSchema =
  convert(AudioRichContentPartDefinitionExpressionSchema);

export const AudioRichContentPartSchema = z
  .object({
    type: z.literal("input_audio"),
    input_audio: AudioRichContentPartDefinitionSchema,
  })
  .describe("An audio rich content part.")
  .meta({ title: "AudioRichContentPart" });
export type AudioRichContentPart = z.infer<typeof AudioRichContentPartSchema>;
export const AudioRichContentPartJsonSchema: JSONSchema = convert(
  AudioRichContentPartSchema,
);

export const AudioRichContentPartExpressionSchema = z
  .object({
    type: z.literal("input_audio"),
    input_audio: AudioRichContentPartDefinitionExpressionSchema,
  })
  .describe(AudioRichContentPartSchema.description!)
  .meta({ title: "AudioRichContentPartExpression" });
export type AudioRichContentPartExpression = z.infer<
  typeof AudioRichContentPartExpressionSchema
>;
export const AudioRichContentPartExpressionJsonSchema: JSONSchema = convert(
  AudioRichContentPartExpressionSchema,
);

// Video Rich Content Part

export const VideoRichContentPartDefinitionUrlSchema = z
  .string()
  .describe("URL of the video.");
export type VideoRichContentPartDefinitionUrl = z.infer<
  typeof VideoRichContentPartDefinitionUrlSchema
>;
export const VideoRichContentPartDefinitionUrlJsonSchema: JSONSchema = convert(
  VideoRichContentPartDefinitionUrlSchema,
);

export const VideoRichContentPartDefinitionSchema = z.object({
  url: VideoRichContentPartDefinitionUrlSchema,
});
export type VideoRichContentPartDefinition = z.infer<
  typeof VideoRichContentPartDefinitionSchema
>;
export const VideoRichContentPartDefinitionJsonSchema: JSONSchema = convert(
  VideoRichContentPartDefinitionSchema,
);

export const VideoRichContentPartDefinitionExpressionSchema = z
  .union([
    VideoRichContentPartDefinitionSchema,
    ExpressionSchema.describe(
      "An expression which evaluates to the video URL definition. Receives: `input`, `map` (if mapped).",
    ),
  ])
  .describe("The video URL definition.")
  .meta({ title: "VideoRichContentPartDefinitionExpression" });
export type VideoRichContentPartDefinitionExpression = z.infer<
  typeof VideoRichContentPartDefinitionExpressionSchema
>;
export const VideoRichContentPartDefinitionExpressionJsonSchema: JSONSchema =
  convert(VideoRichContentPartDefinitionExpressionSchema);

export const VideoRichContentPartSchema = z
  .object({
    type: z.enum(["video_url", "input_video"]),
    video_url: VideoRichContentPartDefinitionSchema,
  })
  .describe("A video rich content part.")
  .meta({ title: "VideoRichContentPart" });
export type VideoRichContentPart = z.infer<typeof VideoRichContentPartSchema>;
export const VideoRichContentPartJsonSchema: JSONSchema = convert(
  VideoRichContentPartSchema,
);

export const VideoRichContentPartExpressionSchema = z
  .object({
    type: z.enum(["video_url", "input_video"]),
    video_url: VideoRichContentPartDefinitionExpressionSchema,
  })
  .describe(VideoRichContentPartSchema.description!)
  .meta({ title: "VideoRichContentPartExpression" });
export type VideoRichContentPartExpression = z.infer<
  typeof VideoRichContentPartExpressionSchema
>;
export const VideoRichContentPartExpressionJsonSchema: JSONSchema = convert(
  VideoRichContentPartExpressionSchema,
);

// File Rich Content Part

export const FileRichContentPartDefinitionFileDataSchema = z
  .string()
  .describe(
    "The base64 encoded file data, used when passing the file to the model as a string.",
  );
export type FileRichContentPartDefinitionFileData = z.infer<
  typeof FileRichContentPartDefinitionFileDataSchema
>;
export const FileRichContentPartDefinitionFileDataJsonSchema: JSONSchema =
  convert(FileRichContentPartDefinitionFileDataSchema);

export const FileRichContentPartDefinitionFileIdSchema = z
  .string()
  .describe("The ID of an uploaded file to use as input.");
export type FileRichContentPartDefinitionFileId = z.infer<
  typeof FileRichContentPartDefinitionFileIdSchema
>;
export const FileRichContentPartDefinitionFileIdJsonSchema: JSONSchema =
  convert(FileRichContentPartDefinitionFileIdSchema);

export const FileRichContentPartDefinitionFilenameSchema = z
  .string()
  .describe(
    "The name of the file, used when passing the file to the model as a string.",
  );
export type FileRichContentPartDefinitionFilename = z.infer<
  typeof FileRichContentPartDefinitionFilenameSchema
>;
export const FileRichContentPartDefinitionFilenameJsonSchema: JSONSchema =
  convert(FileRichContentPartDefinitionFilenameSchema);

export const FileRichContentPartDefinitionFileUrlSchema = z
  .string()
  .describe(
    "The URL of the file, used when passing the file to the model as a URL.",
  );
export type FileRichContentPartDefinitionFileUrl = z.infer<
  typeof FileRichContentPartDefinitionFileUrlSchema
>;
export const FileRichContentPartDefinitionFileUrlJsonSchema: JSONSchema =
  convert(FileRichContentPartDefinitionFileUrlSchema);

export const FileRichContentPartDefinitionSchema = z
  .object({
    file_data:
      FileRichContentPartDefinitionFileDataSchema.optional().nullable(),
    file_id: FileRichContentPartDefinitionFileIdSchema.optional().nullable(),
    filename: FileRichContentPartDefinitionFilenameSchema.optional().nullable(),
    file_url: FileRichContentPartDefinitionFileUrlSchema.optional().nullable(),
  })
  .describe(
    "The file to be used as input, either as base64 data, an uploaded file ID, or a URL.",
  );
export type FileRichContentPartDefinition = z.infer<
  typeof FileRichContentPartDefinitionSchema
>;
export const FileRichContentPartDefinitionJsonSchema: JSONSchema = convert(
  FileRichContentPartDefinitionSchema,
);

export const FileRichContentPartDefinitionExpressionSchema = z
  .union([
    FileRichContentPartDefinitionSchema,
    ExpressionSchema.describe(
      "An expression which evaluates to the file definition. Receives: `input`, `map` (if mapped).",
    ),
  ])
  .describe(FileRichContentPartDefinitionSchema.description!)
  .meta({ title: "FileRichContentPartDefinitionExpression" });
export type FileRichContentPartDefinitionExpression = z.infer<
  typeof FileRichContentPartDefinitionExpressionSchema
>;
export const FileRichContentPartDefinitionExpressionJsonSchema: JSONSchema =
  convert(FileRichContentPartDefinitionExpressionSchema);

export const FileRichContentPartSchema = z
  .object({
    type: z.literal("file"),
    file: FileRichContentPartDefinitionSchema,
  })
  .describe("A file rich content part.")
  .meta({ title: "FileRichContentPart" });
export type FileRichContentPart = z.infer<typeof FileRichContentPartSchema>;
export const FileRichContentPartJsonSchema: JSONSchema = convert(
  FileRichContentPartSchema,
);

export const FileRichContentPartExpressionSchema = z
  .object({
    type: z.literal("file"),
    file: FileRichContentPartDefinitionExpressionSchema,
  })
  .describe(FileRichContentPartSchema.description!)
  .meta({ title: "FileRichContentPartExpression" });
export type FileRichContentPartExpression = z.infer<
  typeof FileRichContentPartExpressionSchema
>;
export const FileRichContentPartExpressionJsonSchema: JSONSchema = convert(
  FileRichContentPartExpressionSchema,
);

// Rich Content

export const RichContentTextSchema = z
  .string()
  .describe("Plain text content.")
  .meta({ title: "RichContentText" });
export type RichContentText = z.infer<typeof RichContentTextSchema>;
export const RichContentTextJsonSchema: JSONSchema = convert(
  RichContentTextSchema,
);

export const RichContentPartSchema = z
  .discriminatedUnion("type", [
    TextRichContentPartSchema,
    ImageRichContentPartSchema,
    AudioRichContentPartSchema,
    VideoRichContentPartSchema,
    FileRichContentPartSchema,
  ])
  .describe("A rich content part.")
  .meta({ title: "RichContentPart" });
export type RichContentPart = z.infer<typeof RichContentPartSchema>;
export const RichContentPartJsonSchema: JSONSchema = convert(
  RichContentPartSchema,
);

export const RichContentPartExpressionSchema = z
  .union([
    z
      .discriminatedUnion("type", [
        TextRichContentPartExpressionSchema,
        ImageRichContentPartExpressionSchema,
        AudioRichContentPartExpressionSchema,
        VideoRichContentPartExpressionSchema,
        FileRichContentPartExpressionSchema,
      ])
      .describe(RichContentPartSchema.description!),
    ExpressionSchema.describe(
      "An expression which evaluates to a rich content part. Receives: `input`, `map` (if mapped).",
    ),
  ])
  .describe(RichContentPartSchema.description!)
  .meta({ title: "RichContentPartExpression" });
export type RichContentPartExpression = z.infer<
  typeof RichContentPartExpressionSchema
>;
export const RichContentPartExpressionJsonSchema: JSONSchema = convert(
  RichContentPartExpressionSchema,
);

export const RichContentPartsSchema = z
  .array(RichContentPartSchema)
  .describe("An array of rich content parts.")
  .meta({ title: "RichContentParts" });
export type RichContentParts = z.infer<typeof RichContentPartsSchema>;
export const RichContentPartsJsonSchema: JSONSchema = convert(
  RichContentPartsSchema,
);

export const RichContentPartExpressionsSchema = z
  .array(RichContentPartExpressionSchema)
  .describe(RichContentPartsSchema.description!)
  .meta({ title: "RichContentPartExpressions" });
export type RichContentPartExpressions = z.infer<
  typeof RichContentPartExpressionsSchema
>;
export const RichContentPartExpressionsJsonSchema: JSONSchema = convert(
  RichContentPartExpressionsSchema,
);

export const RichContentSchema = z
  .union([RichContentTextSchema, RichContentPartsSchema])
  .describe("Rich content.")
  .meta({ title: "RichContent" });
export type RichContent = z.infer<typeof RichContentSchema>;
export const RichContentJsonSchema: JSONSchema = convert(RichContentSchema);

export const RichContentExpressionSchema = z
  .union([
    RichContentTextSchema,
    RichContentPartExpressionsSchema,
    ExpressionSchema.describe(
      "An expression which evaluates to rich content. Receives: `input`, `map` (if mapped).",
    ),
  ])
  .describe(RichContentSchema.description!)
  .meta({ title: "RichContentExpression" });
export type RichContentExpression = z.infer<typeof RichContentExpressionSchema>;
export const RichContentExpressionJsonSchema: JSONSchema = convert(
  RichContentExpressionSchema,
);

// Message Name

export const MessageNameSchema = z
  .string()
  .describe(
    "An optional name for the participant. Provides the model information to differentiate between participants of the same role.",
  )
  .meta({ title: "MessageName" });
export type MessageName = z.infer<typeof MessageNameSchema>;
export const MessageNameJsonSchema: JSONSchema = convert(MessageNameSchema);

export const MessageNameExpressionSchema = z
  .union([
    MessageNameSchema,
    ExpressionSchema.describe(
      "An expression which evaluates to a string. Receives: `input`, `map` (if mapped).",
    ),
  ])
  .describe(MessageNameSchema.description!)
  .meta({ title: "MessageNameExpression" });
export type MessageNameExpression = z.infer<typeof MessageNameExpressionSchema>;
export const MessageNameExpressionJsonSchema: JSONSchema = convert(
  MessageNameExpressionSchema,
);

// Developer Message

export const DeveloperMessageSchema = z
  .object({
    role: z.literal("developer"),
    content: SimpleContentSchema,
    name: MessageNameSchema.optional().nullable(),
  })
  .describe(
    "Developer-provided instructions that the model should follow, regardless of messages sent by the user.",
  )
  .meta({ title: "DeveloperMessage" });
export type DeveloperMessage = z.infer<typeof DeveloperMessageSchema>;
export const DeveloperMessageJsonSchema: JSONSchema = convert(
  DeveloperMessageSchema,
);

export const DeveloperMessageExpressionSchema = z
  .object({
    role: z.literal("developer"),
    content: SimpleContentExpressionSchema,
    name: MessageNameExpressionSchema.optional().nullable(),
  })
  .describe(DeveloperMessageSchema.description!)
  .meta({ title: "DeveloperMessageExpression" });
export type DeveloperMessageExpression = z.infer<
  typeof DeveloperMessageExpressionSchema
>;
export const DeveloperMessageExpressionJsonSchema: JSONSchema = convert(
  DeveloperMessageExpressionSchema,
);

// System Message

export const SystemMessageSchema = z
  .object({
    role: z.literal("system"),
    content: SimpleContentSchema,
    name: MessageNameSchema.optional().nullable(),
  })
  .describe(
    "Developer-provided instructions that the model should follow, regardless of messages sent by the user.",
  )
  .meta({ title: "SystemMessage" });
export type SystemMessage = z.infer<typeof SystemMessageSchema>;
export const SystemMessageJsonSchema: JSONSchema = convert(SystemMessageSchema);

export const SystemMessageExpressionSchema = z
  .object({
    role: z.literal("system"),
    content: SimpleContentExpressionSchema,
    name: MessageNameExpressionSchema.optional().nullable(),
  })
  .describe(SystemMessageSchema.description!)
  .meta({ title: "SystemMessageExpression" });
export type SystemMessageExpression = z.infer<
  typeof SystemMessageExpressionSchema
>;
export const SystemMessageExpressionJsonSchema: JSONSchema = convert(
  SystemMessageExpressionSchema,
);

// User Message

export const UserMessageSchema = z
  .object({
    role: z.literal("user"),
    content: RichContentSchema,
    name: MessageNameSchema.optional().nullable(),
  })
  .describe(
    "Messages sent by an end user, containing prompts or additional context information.",
  )
  .meta({ title: "UserMessage" });
export type UserMessage = z.infer<typeof UserMessageSchema>;
export const UserMessageJsonSchema: JSONSchema = convert(UserMessageSchema);

export const UserMessageExpressionSchema = z
  .object({
    role: z.literal("user"),
    content: RichContentExpressionSchema,
    name: MessageNameExpressionSchema.optional().nullable(),
  })
  .describe(UserMessageSchema.description!)
  .meta({ title: "UserMessageExpression" });
export type UserMessageExpression = z.infer<typeof UserMessageExpressionSchema>;
export const UserMessageExpressionJsonSchema: JSONSchema = convert(
  UserMessageExpressionSchema,
);

// Tool Message

export const ToolMessageToolCallIdSchema = z
  .string()
  .describe("The ID of the tool call that this message is responding to.")
  .meta({ title: "ToolMessageToolCallId" });
export type ToolMessageToolCallId = z.infer<typeof ToolMessageToolCallIdSchema>;
export const ToolMessageToolCallIdJsonSchema: JSONSchema = convert(
  ToolMessageToolCallIdSchema,
);

export const ToolMessageToolCallIdExpressionSchema = z
  .union([
    ToolMessageToolCallIdSchema,
    ExpressionSchema.describe(
      "An expression which evaluates to a string. Receives: `input`, `map` (if mapped).",
    ),
  ])
  .describe(ToolMessageToolCallIdSchema.description!)
  .meta({ title: "ToolMessageToolCallIdExpression" });
export type ToolMessageToolCallIdExpression = z.infer<
  typeof ToolMessageToolCallIdExpressionSchema
>;
export const ToolMessageToolCallIdExpressionJsonSchema: JSONSchema = convert(
  ToolMessageToolCallIdExpressionSchema,
);

export const ToolMessageSchema = z
  .object({
    role: z.literal("tool"),
    content: RichContentSchema,
    tool_call_id: ToolMessageToolCallIdSchema,
  })
  .describe(
    "Messages sent by tools in response to tool calls made by the assistant.",
  )
  .meta({ title: "ToolMessage" });
export type ToolMessage = z.infer<typeof ToolMessageSchema>;
export const ToolMessageJsonSchema: JSONSchema = convert(ToolMessageSchema);

export const ToolMessageExpressionSchema = z
  .object({
    role: z.literal("tool"),
    content: RichContentExpressionSchema,
    tool_call_id: ToolMessageToolCallIdExpressionSchema,
  })
  .describe(ToolMessageSchema.description!)
  .meta({ title: "ToolMessageExpression" });
export type ToolMessageExpression = z.infer<typeof ToolMessageExpressionSchema>;
export const ToolMessageExpressionJsonSchema: JSONSchema = convert(
  ToolMessageExpressionSchema,
);

// Assistant Message

export const AssistantMessageRefusalSchema = z
  .string()
  .describe("The refusal message by the assistant.")
  .meta({ title: "AssistantMessageRefusal" });
export type AssistantMessageRefusal = z.infer<
  typeof AssistantMessageRefusalSchema
>;
export const AssistantMessageRefusalJsonSchema: JSONSchema = convert(
  AssistantMessageRefusalSchema,
);

export const AssistantMessageRefusalExpressionSchema = z
  .union([
    AssistantMessageRefusalSchema,
    ExpressionSchema.describe(
      "An expression which evaluates to a string. Receives: `input`, `map` (if mapped).",
    ),
  ])
  .describe(AssistantMessageRefusalSchema.description!)
  .meta({ title: "AssistantMessageRefusalExpression" });
export type AssistantMessageRefusalExpression = z.infer<
  typeof AssistantMessageRefusalExpressionSchema
>;
export const AssistantMessageRefusalExpressionJsonSchema: JSONSchema = convert(
  AssistantMessageRefusalExpressionSchema,
);

export const AssistantMessageReasoningSchema = z
  .string()
  .describe("The reasoning provided by the assistant.")
  .meta({ title: "AssistantMessageReasoning" });
export type AssistantMessageReasoning = z.infer<
  typeof AssistantMessageReasoningSchema
>;
export const AssistantMessageReasoningJsonSchema: JSONSchema = convert(
  AssistantMessageReasoningSchema,
);

export const AssistantMessageReasoningExpressionSchema = z
  .union([
    AssistantMessageReasoningSchema,
    ExpressionSchema.describe(
      "An expression which evaluates to a string. Receives: `input`, `map` (if mapped).",
    ),
  ])
  .describe(AssistantMessageReasoningSchema.description!)
  .meta({ title: "AssistantMessageReasoningExpression" });
export type AssistantMessageReasoningExpression = z.infer<
  typeof AssistantMessageReasoningExpressionSchema
>;
export const AssistantMessageReasoningExpressionJsonSchema: JSONSchema =
  convert(AssistantMessageReasoningExpressionSchema);

export const AssistantMessageToolCallIdSchema = z
  .string()
  .describe("The unique identifier for the tool call.")
  .meta({ title: "AssistantMessageToolCallId" });
export type AssistantMessageToolCallId = z.infer<
  typeof AssistantMessageToolCallIdSchema
>;
export const AssistantMessageToolCallIdJsonSchema: JSONSchema = convert(
  AssistantMessageToolCallIdSchema,
);

export const AssistantMessageToolCallIdExpressionSchema = z
  .union([
    AssistantMessageToolCallIdSchema,
    ExpressionSchema.describe(
      "An expression which evaluates to a string. Receives: `input`, `map` (if mapped).",
    ),
  ])
  .describe(AssistantMessageToolCallIdSchema.description!)
  .meta({ title: "AssistantMessageToolCallIdExpression" });
export type AssistantMessageToolCallIdExpression = z.infer<
  typeof AssistantMessageToolCallIdExpressionSchema
>;
export const AssistantMessageToolCallIdExpressionJsonSchema: JSONSchema =
  convert(AssistantMessageToolCallIdExpressionSchema);

export const AssistantMessageToolCallFunctionNameSchema = z
  .string()
  .describe("The name of the function called.")
  .meta({ title: "AssistantMessageToolCallFunctionName" });
export type AssistantMessageToolCallFunctionName = z.infer<
  typeof AssistantMessageToolCallFunctionNameSchema
>;
export const AssistantMessageToolCallFunctionNameJsonSchema: JSONSchema =
  convert(AssistantMessageToolCallFunctionNameSchema);

export const AssistantMessageToolCallFunctionNameExpressionSchema = z
  .union([
    AssistantMessageToolCallFunctionNameSchema,
    ExpressionSchema.describe(
      "An expression which evaluates to a string. Receives: `input`, `map` (if mapped).",
    ),
  ])
  .describe(AssistantMessageToolCallFunctionNameSchema.description!)
  .meta({ title: "AssistantMessageToolCallFunctionNameExpression" });
export type AssistantMessageToolCallFunctionNameExpression = z.infer<
  typeof AssistantMessageToolCallFunctionNameExpressionSchema
>;
export const AssistantMessageToolCallFunctionNameExpressionJsonSchema: JSONSchema =
  convert(AssistantMessageToolCallFunctionNameExpressionSchema);

export const AssistantMessageToolCallFunctionArgumentsSchema = z
  .string()
  .describe("The arguments passed to the function.")
  .meta({ title: "AssistantMessageToolCallFunctionArguments" });
export type AssistantMessageToolCallFunctionArguments = z.infer<
  typeof AssistantMessageToolCallFunctionArgumentsSchema
>;
export const AssistantMessageToolCallFunctionArgumentsJsonSchema: JSONSchema =
  convert(AssistantMessageToolCallFunctionArgumentsSchema);

export const AssistantMessageToolCallFunctionArgumentsExpressionSchema = z
  .union([
    AssistantMessageToolCallFunctionArgumentsSchema,
    ExpressionSchema.describe(
      "An expression which evaluates to a string. Receives: `input`, `map` (if mapped).",
    ),
  ])
  .describe(AssistantMessageToolCallFunctionArgumentsSchema.description!)
  .meta({
    title: "AssistantMessageToolCallFunctionArgumentsExpression",
  });
export type AssistantMessageToolCallFunctionArgumentsExpression = z.infer<
  typeof AssistantMessageToolCallFunctionArgumentsExpressionSchema
>;
export const AssistantMessageToolCallFunctionArgumentsExpressionJsonSchema: JSONSchema =
  convert(AssistantMessageToolCallFunctionArgumentsExpressionSchema);

export const AssistantMessageToolCallFunctionDefinitionSchema = z
  .object({
    name: AssistantMessageToolCallFunctionNameSchema,
    arguments: AssistantMessageToolCallFunctionArgumentsSchema,
  })
  .describe("The name and arguments of the function called.")
  .meta({ title: "AssistantMessageToolCallFunctionDefinition" });
export type AssistantMessageToolCallFunctionDefinition = z.infer<
  typeof AssistantMessageToolCallFunctionDefinitionSchema
>;
export const AssistantMessageToolCallFunctionDefinitionJsonSchema: JSONSchema =
  convert(AssistantMessageToolCallFunctionDefinitionSchema);

export const AssistantMessageToolCallFunctionDefinitionExpressionSchema = z
  .object({
    name: AssistantMessageToolCallFunctionNameExpressionSchema,
    arguments: AssistantMessageToolCallFunctionArgumentsExpressionSchema,
  })
  .describe(AssistantMessageToolCallFunctionDefinitionSchema.description!)
  .meta({
    title: "AssistantMessageToolCallFunctionDefinitionExpression",
  });
export type AssistantMessageToolCallFunctionDefinitionExpression = z.infer<
  typeof AssistantMessageToolCallFunctionDefinitionExpressionSchema
>;
export const AssistantMessageToolCallFunctionDefinitionExpressionJsonSchema: JSONSchema =
  convert(AssistantMessageToolCallFunctionDefinitionExpressionSchema);

export const AssistantMessageToolCallFunctionSchema = z
  .object({
    type: z.literal("function"),
    id: AssistantMessageToolCallIdSchema,
    function: AssistantMessageToolCallFunctionDefinitionSchema,
  })
  .describe("A function tool call made by the assistant.")
  .meta({ title: "AssistantMessageToolCallFunction" });
export type AssistantMessageToolCallFunction = z.infer<
  typeof AssistantMessageToolCallFunctionSchema
>;
export const AssistantMessageToolCallFunctionJsonSchema: JSONSchema = convert(
  AssistantMessageToolCallFunctionSchema,
);

export const AssistantMessageToolCallFunctionExpressionSchema = z
  .object({
    type: z.literal("function"),
    id: AssistantMessageToolCallIdExpressionSchema,
    function: AssistantMessageToolCallFunctionDefinitionExpressionSchema,
  })
  .describe(AssistantMessageToolCallFunctionSchema.description!)
  .meta({ title: "AssistantMessageToolCallFunctionExpression" });
export type AssistantMessageToolCallFunctionExpression = z.infer<
  typeof AssistantMessageToolCallFunctionExpressionSchema
>;
export const AssistantMessageToolCallFunctionExpressionJsonSchema: JSONSchema =
  convert(AssistantMessageToolCallFunctionExpressionSchema);

export const AssistantMessageToolCallSchema = z
  .union([AssistantMessageToolCallFunctionSchema])
  .describe("A tool call made by the assistant.")
  .meta({ title: "AssistantMessageToolCall" });
export type AssistantMessageToolCall = z.infer<
  typeof AssistantMessageToolCallSchema
>;
export const AssistantMessageToolCallJsonSchema: JSONSchema = convert(
  AssistantMessageToolCallSchema,
);

export const AssistantMessageToolCallExpressionSchema = z
  .union([
    AssistantMessageToolCallFunctionExpressionSchema,
    ExpressionSchema.describe(
      "An expression which evaluates to a tool call. Receives: `input`, `map` (if mapped).",
    ),
  ])
  .describe(AssistantMessageToolCallSchema.description!)
  .meta({ title: "AssistantMessageToolCallExpression" });
export type AssistantMessageToolCallExpression = z.infer<
  typeof AssistantMessageToolCallExpressionSchema
>;
export const AssistantMessageToolCallExpressionJsonSchema: JSONSchema = convert(
  AssistantMessageToolCallExpressionSchema,
);

export const AssistantMessageToolCallsSchema = z
  .array(AssistantMessageToolCallSchema)
  .describe("Tool calls made by the assistant.")
  .meta({ title: "AssistantMessageToolCalls" });
export type AssistantMessageToolCalls = z.infer<
  typeof AssistantMessageToolCallsSchema
>;
export const AssistantMessageToolCallsJsonSchema: JSONSchema = convert(
  AssistantMessageToolCallsSchema,
);

export const AssistantMessageToolCallsExpressionSchema = z
  .union([
    z
      .array(AssistantMessageToolCallExpressionSchema)
      .describe(AssistantMessageToolCallsSchema.description!),
    ExpressionSchema.describe(
      "An expression which evaluates to an array of tool calls. Receives: `input`, `map` (if mapped).",
    ),
  ])
  .describe(AssistantMessageToolCallsSchema.description!)
  .meta({ title: "AssistantMessageToolCallsExpression" });
export type AssistantMessageToolCallsExpression = z.infer<
  typeof AssistantMessageToolCallsExpressionSchema
>;
export const AssistantMessageToolCallsExpressionJsonSchema: JSONSchema =
  convert(AssistantMessageToolCallsExpressionSchema);

export const AssistantMessageSchema = z
  .object({
    role: z.literal("assistant"),
    content: RichContentSchema.optional().nullable(),
    name: MessageNameSchema.optional().nullable(),
    refusal: AssistantMessageRefusalSchema.optional().nullable(),
    tool_calls: AssistantMessageToolCallsSchema.optional().nullable(),
    reasoning: AssistantMessageReasoningSchema.optional().nullable(),
  })
  .describe("Messages sent by the model in response to user messages.")
  .meta({ title: "AssistantMessage" });
export type AssistantMessage = z.infer<typeof AssistantMessageSchema>;
export const AssistantMessageJsonSchema: JSONSchema = convert(
  AssistantMessageSchema,
);

export const AssistantMessageExpressionSchema = z
  .object({
    role: z.literal("assistant"),
    content: RichContentExpressionSchema.optional().nullable(),
    name: MessageNameExpressionSchema.optional().nullable(),
    refusal: AssistantMessageRefusalExpressionSchema.optional().nullable(),
    tool_calls: AssistantMessageToolCallsExpressionSchema.optional().nullable(),
    reasoning: AssistantMessageReasoningExpressionSchema.optional().nullable(),
  })
  .describe(AssistantMessageSchema.description!)
  .meta({ title: "AssistantMessageExpression" });
export type AssistantMessageExpression = z.infer<
  typeof AssistantMessageExpressionSchema
>;
export const AssistantMessageExpressionJsonSchema: JSONSchema = convert(
  AssistantMessageExpressionSchema,
);

// Message

export const MessageSchema = z
  .discriminatedUnion("role", [
    DeveloperMessageSchema,
    SystemMessageSchema,
    UserMessageSchema,
    ToolMessageSchema,
    AssistantMessageSchema,
  ])
  .describe("A message exchanged in a chat conversation.")
  .meta({ title: "Message" });
export type Message = z.infer<typeof MessageSchema>;
export const MessageJsonSchema: JSONSchema = convert(MessageSchema);

export const MessageExpressionSchema = z
  .union([
    z
      .discriminatedUnion("role", [
        DeveloperMessageExpressionSchema,
        SystemMessageExpressionSchema,
        UserMessageExpressionSchema,
        ToolMessageExpressionSchema,
        AssistantMessageExpressionSchema,
      ])
      .describe(MessageSchema.description!),
    ExpressionSchema.describe(
      "An expression which evaluates to a message. Receives: `input`, `map` (if mapped).",
    ),
  ])
  .describe(MessageSchema.description!)
  .meta({ title: "MessageExpression" });
export type MessageExpression = z.infer<typeof MessageExpressionSchema>;
export const MessageExpressionJsonSchema: JSONSchema = convert(
  MessageExpressionSchema,
);

export const MessagesSchema = z
  .array(MessageSchema)
  .describe("A list of messages exchanged in a chat conversation.")
  .meta({ title: "Messages" });
export type Messages = z.infer<typeof MessagesSchema>;
export const MessagesJsonSchema: JSONSchema = convert(MessagesSchema);

export const MessagesExpressionSchema = z
  .union([
    z
      .array(MessageExpressionSchema)
      .describe(MessagesSchema.description!)
      .meta({ title: "MessageExpressions" }),
    ExpressionSchema.describe(
      "An expression which evaluates to an array of messages. Receives: `input`, `map` (if mapped).",
    ),
  ])
  .describe(MessagesSchema.description!)
  .meta({ title: "MessagesExpression" });
export type MessagesExpression = z.infer<typeof MessagesExpressionSchema>;
export const MessagesExpressionJsonSchema: JSONSchema = convert(
  MessagesExpressionSchema,
);

// Quality Message Expressions (content must be array of content parts, never plain strings)

export const QualityDeveloperMessageExpressionSchema = z
  .object({
    role: z.literal("developer"),
    content: SimpleContentPartExpressionsSchema,
    name: MessageNameExpressionSchema.optional().nullable(),
  })
  .describe(DeveloperMessageExpressionSchema.description!)
  .meta({ title: "QualityDeveloperMessageExpression" });
export type QualityDeveloperMessageExpression = z.infer<
  typeof QualityDeveloperMessageExpressionSchema
>;
export const QualityDeveloperMessageExpressionJsonSchema: JSONSchema = convert(
  QualityDeveloperMessageExpressionSchema,
);

export const QualitySystemMessageExpressionSchema = z
  .object({
    role: z.literal("system"),
    content: SimpleContentPartExpressionsSchema,
    name: MessageNameExpressionSchema.optional().nullable(),
  })
  .describe(SystemMessageExpressionSchema.description!)
  .meta({ title: "QualitySystemMessageExpression" });
export type QualitySystemMessageExpression = z.infer<
  typeof QualitySystemMessageExpressionSchema
>;
export const QualitySystemMessageExpressionJsonSchema: JSONSchema = convert(
  QualitySystemMessageExpressionSchema,
);

export const QualityUserMessageExpressionSchema = z
  .object({
    role: z.literal("user"),
    content: RichContentPartExpressionsSchema,
    name: MessageNameExpressionSchema.optional().nullable(),
  })
  .describe(UserMessageExpressionSchema.description!)
  .meta({ title: "QualityUserMessageExpression" });
export type QualityUserMessageExpression = z.infer<
  typeof QualityUserMessageExpressionSchema
>;
export const QualityUserMessageExpressionJsonSchema: JSONSchema = convert(
  QualityUserMessageExpressionSchema,
);

export const QualityToolMessageExpressionSchema = z
  .object({
    role: z.literal("tool"),
    content: RichContentPartExpressionsSchema,
    tool_call_id: ToolMessageToolCallIdExpressionSchema,
  })
  .describe(ToolMessageExpressionSchema.description!)
  .meta({ title: "QualityToolMessageExpression" });
export type QualityToolMessageExpression = z.infer<
  typeof QualityToolMessageExpressionSchema
>;
export const QualityToolMessageExpressionJsonSchema: JSONSchema = convert(
  QualityToolMessageExpressionSchema,
);

export const QualityAssistantMessageExpressionSchema = z
  .object({
    role: z.literal("assistant"),
    content: RichContentPartExpressionsSchema.optional().nullable(),
    name: MessageNameExpressionSchema.optional().nullable(),
    refusal: AssistantMessageRefusalExpressionSchema.optional().nullable(),
    tool_calls: AssistantMessageToolCallsExpressionSchema.optional().nullable(),
    reasoning: AssistantMessageReasoningExpressionSchema.optional().nullable(),
  })
  .describe(AssistantMessageExpressionSchema.description!)
  .meta({ title: "QualityAssistantMessageExpression" });
export type QualityAssistantMessageExpression = z.infer<
  typeof QualityAssistantMessageExpressionSchema
>;
export const QualityAssistantMessageExpressionJsonSchema: JSONSchema = convert(
  QualityAssistantMessageExpressionSchema,
);

export const QualityMessageExpressionSchema = z
  .union([
    z
      .discriminatedUnion("role", [
        QualityDeveloperMessageExpressionSchema,
        QualitySystemMessageExpressionSchema,
        QualityUserMessageExpressionSchema,
        QualityToolMessageExpressionSchema,
        QualityAssistantMessageExpressionSchema,
      ])
      .describe(MessageSchema.description!),
    ExpressionSchema.describe(
      "An expression which evaluates to a message. Content must be an array of content parts, not a plain string. Receives: `input`, `map` (if mapped).",
    ),
  ])
  .describe(
    MessageSchema.description! +
      " Content must be an array of content parts, not a plain string.",
  )
  .meta({ title: "QualityMessageExpression" });
export type QualityMessageExpression = z.infer<
  typeof QualityMessageExpressionSchema
>;
export const QualityMessageExpressionJsonSchema: JSONSchema = convert(
  QualityMessageExpressionSchema,
);

export const QualityMessagesExpressionSchema = z
  .union([
    z
      .array(QualityMessageExpressionSchema)
      .describe(MessagesSchema.description!),
    ExpressionSchema.describe(
      "An expression which evaluates to an array of messages. Content must be arrays of content parts, not plain strings. Receives: `input`, `map` (if mapped).",
    ),
  ])
  .describe(
    MessagesSchema.description! +
      " Each message's content must be an array of content parts, not a plain string.",
  )
  .meta({ title: "QualityMessagesExpression" });
export type QualityMessagesExpression = z.infer<
  typeof QualityMessagesExpressionSchema
>;
export const QualityMessagesExpressionJsonSchema: JSONSchema = convert(
  QualityMessagesExpressionSchema,
);

// Quality Messages (compiled, non-expression: content must be array of content parts, never plain strings)

export const QualityDeveloperMessageSchema = z
  .object({
    role: z.literal("developer"),
    content: SimpleContentPartsSchema,
    name: MessageNameSchema.optional().nullable(),
  })
  .describe(DeveloperMessageSchema.description!);
export type QualityDeveloperMessage = z.infer<
  typeof QualityDeveloperMessageSchema
>;
export const QualityDeveloperMessageJsonSchema: JSONSchema = convert(
  QualityDeveloperMessageSchema,
);

export const QualitySystemMessageSchema = z
  .object({
    role: z.literal("system"),
    content: SimpleContentPartsSchema,
    name: MessageNameSchema.optional().nullable(),
  })
  .describe(SystemMessageSchema.description!);
export type QualitySystemMessage = z.infer<typeof QualitySystemMessageSchema>;
export const QualitySystemMessageJsonSchema: JSONSchema = convert(
  QualitySystemMessageSchema,
);

export const QualityUserMessageSchema = z
  .object({
    role: z.literal("user"),
    content: RichContentPartsSchema,
    name: MessageNameSchema.optional().nullable(),
  })
  .describe(UserMessageSchema.description!);
export type QualityUserMessage = z.infer<typeof QualityUserMessageSchema>;
export const QualityUserMessageJsonSchema: JSONSchema = convert(
  QualityUserMessageSchema,
);

export const QualityToolMessageSchema = z
  .object({
    role: z.literal("tool"),
    content: RichContentPartsSchema,
    tool_call_id: ToolMessageToolCallIdSchema,
  })
  .describe(ToolMessageSchema.description!);
export type QualityToolMessage = z.infer<typeof QualityToolMessageSchema>;
export const QualityToolMessageJsonSchema: JSONSchema = convert(
  QualityToolMessageSchema,
);

export const QualityAssistantMessageSchema = z
  .object({
    role: z.literal("assistant"),
    content: RichContentPartsSchema.optional().nullable(),
    name: MessageNameSchema.optional().nullable(),
    refusal: AssistantMessageRefusalSchema.optional().nullable(),
    tool_calls: AssistantMessageToolCallsSchema.optional().nullable(),
    reasoning: AssistantMessageReasoningSchema.optional().nullable(),
  })
  .describe(AssistantMessageSchema.description!);
export type QualityAssistantMessage = z.infer<
  typeof QualityAssistantMessageSchema
>;
export const QualityAssistantMessageJsonSchema: JSONSchema = convert(
  QualityAssistantMessageSchema,
);

export const QualityMessageSchema = z
  .discriminatedUnion("role", [
    QualityDeveloperMessageSchema,
    QualitySystemMessageSchema,
    QualityUserMessageSchema,
    QualityToolMessageSchema,
    QualityAssistantMessageSchema,
  ])
  .describe(
    MessageSchema.description! +
      " Content must be an array of content parts, not a plain string.",
  )
  .meta({ title: "QualityMessage" });
export type QualityMessage = z.infer<typeof QualityMessageSchema>;
export const QualityMessageJsonSchema: JSONSchema =
  convert(QualityMessageSchema);

export const QualityMessagesSchema = z
  .array(QualityMessageSchema)
  .describe(
    MessagesSchema.description! +
      " Each message's content must be an array of content parts, not a plain string.",
  );
export type QualityMessages = z.infer<typeof QualityMessagesSchema>;
export const QualityMessagesJsonSchema: JSONSchema = convert(
  QualityMessagesSchema,
);
