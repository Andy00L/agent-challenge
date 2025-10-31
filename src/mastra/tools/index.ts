// src/mastra/tools/index.ts
import { analyzeDiagramTool } from "./analyzeDiagramTool";
import { clearDiagramTool } from "./clearDiagramTool";
import { displayDiagramTool } from "./displayDiagramTool";
import { editDiagramTool } from "./editDiagramTool";
import { getCurrentDiagramTool } from "./getCurrentDiagramTool";

export const diagramTools = {
  display_diagram: displayDiagramTool,
  edit_diagram: editDiagramTool,
  get_current_diagram: getCurrentDiagramTool,
  analyze_diagram: analyzeDiagramTool,
  clear_diagram: clearDiagramTool,
};
