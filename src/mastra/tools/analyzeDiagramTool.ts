import { createTool } from "@mastra/core";
import z from "zod";

/**
 * Tool to analyze diagram structure
 * This tool provides information about the diagram's components
 */
export const analyzeDiagramTool = createTool({
  id: "analyze_diagram",
  description:
    "Analyzes the current diagram structure and provides insights about its components, " +
    "such as number of nodes, connections, and overall complexity. " +
    "Use this when the user asks questions about their diagram.",
  inputSchema: z.object({
    xml: z.string().describe("The diagram XML to analyze"),
  }),
  outputSchema: z.object({
    nodeCount: z.number().describe("Number of nodes/shapes in the diagram"),
    edgeCount: z.number().describe("Number of connections between nodes"),
    summary: z.string().describe("A brief summary of the diagram structure"),
  }),
  execute: async ({ context }) => {
    const { xml } = context;

    // Simple analysis - count mxCell elements
    const cellMatches = xml.match(/<mxCell/g);
    const nodeCount = cellMatches ? cellMatches.length : 0;

    // Count edges (cells with source and target)
    const edgeMatches = xml.match(/source="[^"]+"\s+target="[^"]+"/g);
    const edgeCount = edgeMatches ? edgeMatches.length : 0;

    const summary =
      `The diagram contains ${nodeCount} elements and ${edgeCount} connections. ` +
      (nodeCount === 0
        ? "The diagram is currently empty."
        : "The diagram has content.");

    return {
      nodeCount,
      edgeCount,
      summary,
    };
  },
});
