import { createTool } from "@mastra/core";
import z from "zod";

/**
 * Tool to edit existing diagram by replacing specific parts
 * This tool applies surgical edits to the current diagram
 */
export const editDiagramTool = createTool({
  id: "edit_diagram",
  description:
    "Edit specific parts of the current diagram by replacing exact line matches. " +
    "Use this tool to make targeted fixes without regenerating the entire XML. " +
    "IMPORTANT: Keep edits concise - only include the lines that are changing, plus 1-2 surrounding lines for context. " +
    "Break large changes into multiple smaller edits. Each search must contain complete lines. " +
    "First match only - be specific enough to target the right element.",
  inputSchema: z.object({
    edits: z
      .array(
        z.object({
          search: z
            .string()
            .describe(
              "Exact lines to search for (including whitespace and indentation)"
            ),
          replace: z.string().describe("Replacement lines"),
        })
      )
      .describe("Array of search/replace pairs to apply sequentially"),
  }),
  outputSchema: z.object({
    success: z
      .boolean()
      .describe("Whether the edits were successfully applied"),
    message: z.string().describe("Status message about the operation"),
    editsApplied: z.number().describe("Number of edits successfully applied"),
  }),
  execute: async ({ context }) => {
    const { edits } = context;

    // Validate edits array
    if (!edits || edits.length === 0) {
      return {
        success: false,
        message: "No edits provided",
        editsApplied: 0,
      };
    }

    // Validate each edit has both search and replace
    for (const edit of edits) {
      if (!edit.search || !edit.replace) {
        return {
          success: false,
          message: "Each edit must have both 'search' and 'replace' fields",
          editsApplied: 0,
        };
      }
    }

    // The actual edit logic is handled by the frontend via onToolCall
    return {
      success: true,
      message: `Prepared ${edits.length} edit(s) for application`,
      editsApplied: edits.length,
    };
  },
});
