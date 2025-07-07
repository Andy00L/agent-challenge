import { Mastra } from "@mastra/core/mastra";
import { PinoLogger } from "@mastra/loggers";
import { newsAgent } from "./agents/news-summarizer/index"; // Build your agent here
import { newsIntelligenceWorkflow } from "./agents/news-summarizer/news-workflow"; // News workflow

export const mastra = new Mastra({
  workflows: { newsIntelligenceWorkflow },
  agents: { newsAgent },
  logger: new PinoLogger({
    name: "Mastra",
    level: "info",
  }),
  server: {
    port: 8080,
    timeout: 60000,
  },
});
