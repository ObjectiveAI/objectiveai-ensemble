import z from "zod";

export const ParametersBaseSchema = z.object({
  branchMinWidth: z
    .int()
    .positive()
    .describe("The minimum number of tasks for branch functions."),
  branchMaxWidth: z
    .int()
    .positive()
    .describe("The maximum number of tasks for branch functions."),
  leafMinWidth: z
    .int()
    .positive()
    .describe("The minimum number of tasks for leaf functions."),
  leafMaxWidth: z
    .int()
    .positive()
    .describe("The maximum number of tasks for leaf functions."),
});
export type ParametersBase = z.infer<typeof ParametersBaseSchema>;

export const ParametersBranchSchema = ParametersBaseSchema.extend({
  depth: z
    .int()
    .positive()
    .describe("The depth of this function. All tasks will be sub-functions."),
});
export type ParametersBranch = z.infer<typeof ParametersBranchSchema>;

export const ParametersLeafSchema = ParametersBaseSchema.extend({
  depth: z
    .literal(0)
    .describe(
      "The depth of this function. All tasks will be Vector Completions.",
    ),
});
export type ParametersLeaf = z.infer<typeof ParametersLeafSchema>;

export const ParametersSchema = ParametersBaseSchema.extend({
  depth: z
    .int()
    .nonnegative()
    .describe(
      "The depth of this function. If depth > 0, then all tasks will be sub-functions. If depth = 0, then all tasks will be Vector Completions.",
    ),
});
export type Parameters = z.infer<typeof ParametersSchema>;

export const DefaultParameters: ParametersLeaf = {
  depth: 0,
  branchMinWidth: 3,
  branchMaxWidth: 6,
  leafMinWidth: 5,
  leafMaxWidth: 10,
};

export const ParametersBuilderSchema = z.object({
  depth: z.int().nonnegative().optional(),
  branchMinWidth: z.int().positive().optional(),
  branchMaxWidth: z.int().positive().optional(),
  branchWidth: z.int().positive().optional(),
  leafMinWidth: z.int().positive().optional(),
  leafMaxWidth: z.int().positive().optional(),
  leafWidth: z.int().positive().optional(),
  minWidth: z.int().positive().optional(),
  maxWidth: z.int().positive().optional(),
  width: z.int().positive().optional(),
});
export type ParametersBuilder = z.infer<typeof ParametersBuilderSchema>;

export function buildParameters(builder: ParametersBuilder = {}): Parameters {
  const depth = builder.depth ?? DefaultParameters.depth;

  let branchMinWidth =
    builder.branchMinWidth ??
    builder.branchWidth ??
    builder.minWidth ??
    builder.width ??
    DefaultParameters.branchMinWidth;
  let branchMaxWidth =
    builder.branchMaxWidth ??
    builder.branchWidth ??
    builder.maxWidth ??
    builder.width ??
    DefaultParameters.branchMaxWidth;
  if (branchMinWidth > branchMaxWidth) {
    branchMinWidth = branchMaxWidth;
  }

  let leafMinWidth =
    builder.leafMinWidth ??
    builder.leafWidth ??
    builder.minWidth ??
    builder.width ??
    DefaultParameters.leafMinWidth;
  let leafMaxWidth =
    builder.leafMaxWidth ??
    builder.leafWidth ??
    builder.maxWidth ??
    builder.width ??
    DefaultParameters.leafMaxWidth;
  if (leafMinWidth > leafMaxWidth) {
    leafMinWidth = leafMaxWidth;
  }

  return {
    depth,
    branchMinWidth,
    branchMaxWidth,
    leafMinWidth,
    leafMaxWidth,
  };
}
