import { createTool } from "@mastra/core";
import { z } from "zod";

/**
 * Tool to get the current diagram state
 * This tool retrieves the current XML content of the diagram
 */
export const getCurrentDiagramTool = createTool({
  id: "get-current_diagram",
  description:
    "Retrieves the current state of the diagram as XML. " +
    "Use this tool when you need to see what's currently displayed on the canvas " +
    "before making modifications or to analyze the current diagram structure.",
  inputSchema: z.object({}),
  outputSchema: z.object({
    xml: z.string().describe("The current diagram XML content"),
    hasContent: z.boolean().describe("Whether the diagram has any content"),
  }),
  execute: async () => {
    // This will be provided by the frontend through the request body
    // The actual XML is passed via the API route context
    return {
      xml: "",
      hasContent: false,
    };
  },
});
