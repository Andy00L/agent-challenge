import { createTool } from "@mastra/core";
import { z } from "zod";

/**
 * Tool to display a diagram on the canvas
 * This tool receives XML content and renders it in the draw.io editor
 */
export const displayDiagramTool = createTool({
  id: "display_diagram",
  description:
    "Display a diagram on draw.io. You only need to pass the nodes inside the <root> tag (including the <root> tag itself) in the XML string. " +
    "Use this tool when the user wants to create a new flowchart, diagram, or visual representation. " +
    "The XML should be valid draw.io/mxGraph format.",
  inputSchema: z.object({
    xml: z
      .string()
      .describe(
        "XML string to be displayed on draw.io. Should contain the <root> element with mxCell nodes. " +
          'Example: <root><mxCell id="0"/><mxCell id="1" parent="0"/>...</root>'
      ),
  }),
  outputSchema: z.object({
    success: z
      .boolean()
      .describe("Whether the diagram was successfully displayed"),
    message: z.string().describe("Status message about the operation"),
  }),
  execute: async ({ context }) => {
    const { xml } = context;

    // Validate that XML is not empty
    if (!xml || xml.trim().length === 0) {
      return {
        success: false,
        message: "XML content cannot be empty",
      };
    }

    // Basic validation that it looks like XML
    if (!xml.trim().startsWith("<")) {
      return {
        success: false,
        message: "Invalid XML format - must start with '<'",
      };
    }

    // The actual display logic is handled by the frontend via onToolCall
    return {
      success: true,
      message: "Successfully prepared diagram for display",
    };
  },
});
