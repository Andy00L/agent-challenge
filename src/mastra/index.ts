// src/mastra/index.ts
import { ConsoleLogger, LogLevel } from "@mastra/core/logger";
import { Mastra } from "@mastra/core/mastra";
import { LibSQLStore } from "@mastra/libsql";

import { diagramAgent } from "./agents/diagramAgent";
import { flowchartAgent } from "./agents/flowchartAgent";

const LOG_LEVEL = (process.env.LOG_LEVEL as LogLevel) || "info";

export const mastra = new Mastra({
  agents: {
    diagramAgent,
    flowchartAgent,
  },
  storage: new LibSQLStore({
    url: ":memory:",
  }),
  logger: new ConsoleLogger({
    level: LOG_LEVEL,
  }),
});
