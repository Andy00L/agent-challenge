import { createTool } from "@mastra/core";
import z from "zod";

/**
 * Tool to clear the entire diagram
 * This tool removes all content from the canvas
 */
export const clearDiagramTool = createTool({
  id: "clear_diagram",
  description:
    "Clears all content from the diagram canvas, creating a blank slate. " +
    "Use this when the user wants to start over or remove everything.",
  inputSchema: z.object({
    confirm: z
      .boolean()
      .default(true)
      .describe("Confirmation that the user wants to clear the diagram"),
  }),
  outputSchema: z.object({
    success: z
      .boolean()
      .describe("Whether the diagram was successfully cleared"),
    message: z.string().describe("Status message about the operation"),
  }),
  execute: async ({ context }) => {
    const { confirm } = context;

    if (!confirm) {
      return {
        success: false,
        message: "Clear operation cancelled - confirmation required",
      };
    }

    // The actual clear logic is handled by the frontend
    return {
      success: true,
      message: "Diagram cleared successfully",
    };
  },
});
