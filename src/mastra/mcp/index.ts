import { MCPServer } from "@mastra/mcp";
import { diagramTools } from "../tools";
import { diagramAgent } from "../agents/diagramAgent";

export const server = new MCPServer({
  name: "nosDraw - Diagram Generator",
  version: "1.0.0",
  tools: diagramTools,
  agents: { diagramAgent },
});
