// src/mastra/agents/news-agent/news-workflow.ts
import { createStep, createWorkflow } from "@mastra/core/workflows";
import { z } from "zod";
import { factCheckTool } from "./fact-check-tool";
import { newsTool } from "./news-tool";
import { sentimentTool } from "./sentiment-tool";
import { trendTool } from "./trend-tool";

// Enhanced schemas
const comprehensiveAnalysisSchema = z.object({
  topic: z.string(),
  executiveSummary: z.object({
    keyFindings: z.array(z.string()),
    recommendedActions: z.array(z.string()),
    riskLevel: z.enum(["low", "medium", "high", "critical"]),
  }),
  newsAnalysis: z.object({
    summary: z.string(),
    sourceCount: z.number(),
    geographicScope: z.array(z.string()),
    timelineSummary: z.string(),
  }),
  sentimentAnalysis: z.object({
    overallSentiment: z.string(),
    publicMood: z.string(),
    emotionalDrivers: z.array(z.string()),
    sentimentShift: z.string(),
  }),
  factChecking: z.object({
    verifiedClaims: z.array(z.string()),
    disputedClaims: z.array(z.string()),
    misinformationRisk: z.enum(["low", "medium", "high"]),
  }),
  trendAnalysis: z.object({
    currentTrend: z.string(),
    momentum: z.number(),
    predictions: z.array(z.string()),
    relatedTrends: z.array(z.string()),
  }),
  strategicRecommendations: z.array(
    z.object({
      action: z.string(),
      priority: z.enum(["immediate", "short-term", "long-term"]),
      rationale: z.string(),
    })
  ),
  metadata: z.object({
    analysisDate: z.string(),
    confidence: z.number(),
    dataQuality: z.enum(["excellent", "good", "fair", "limited"]),
  }),
});

// Step implementations
const performComprehensiveAnalysis = createStep({
  id: "comprehensive-analysis",
  description: "Performs comprehensive news intelligence analysis",
  inputSchema: z.object({
    topic: z.string(),
    depth: z.enum(["basic", "standard", "deep"]).default("standard"),
    language: z.string().default("en"),
    region: z.string().optional(),
  }),
  outputSchema: comprehensiveAnalysisSchema,
  execute: async ({ inputData, runtimeContext }) => {
    try {
      console.log("🚀 Starting comprehensive news analysis workflow...");

      if (!inputData) {
        throw new Error("Input data required");
      }

      const { topic, depth, language, region } = inputData;

      console.log(
        `📋 Analysis parameters: topic="${topic}", depth=${depth}, language=${language}${
          region ? `, region=${region}` : ""
        }`
      );

      // Step 1: Fetch news
      console.log("📰 Step 1: Fetching latest news...");
      let newsResult;
      try {
        newsResult = await newsTool.execute({
          context: {
            topic,
            count: depth === "deep" ? 10 : 5,
            language,
            sortBy: "publishedAt",
            timeRange: depth === "deep" ? "month" : "week",
          },
          runtimeContext,
        });
        console.log("✅ News fetch completed");
      } catch (error) {
        console.error("❌ News fetch failed:", error);
        throw new Error(
          `News fetch failed: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }

      // Step 2: Analyze sentiment
      console.log("💭 Step 2: Analyzing sentiment...");
      let sentimentResult;
      try {
        sentimentResult = await sentimentTool.execute({
          context: {
            text: newsResult.summary,
            context: `News about ${topic}`,
          },
          runtimeContext,
        });
        console.log("✅ Sentiment analysis completed");
      } catch (error) {
        console.error("❌ Sentiment analysis failed:", error);
        throw new Error(
          `Sentiment analysis failed: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }

      // Step 3: Fact-check key claims
      console.log("✓ Step 3: Fact-checking claims...");
      let factCheckResults: Array<{
        claim: string;
        verdict: string;
        confidence: number;
        explanation: string;
      }> = [];
      try {
        const claims = newsResult.summary.match(/["']([^"']+)["']/g) || [];
        console.log(`🔍 Found ${claims.length} claims to fact-check`);

        if (claims.length > 0) {
          const factCheckPromises = claims.slice(0, 3).map((claim) =>
            factCheckTool.execute({
              context: {
                claim: claim.replace(/["']/g, ""),
                context: topic,
              },
              runtimeContext,
            })
          );
          factCheckResults = await Promise.all(factCheckPromises);
          console.log("✅ Fact-checking completed");
        } else {
          console.log("⚠️ No claims found to fact-check");
        }
      } catch (error) {
        console.error("❌ Fact-checking failed:", error);
        // Don't throw here, continue with empty results
        factCheckResults = [];
      }

      // Step 4: Analyze trends
      console.log("📈 Step 4: Analyzing trends...");
      let trendResult;
      try {
        trendResult = await trendTool.execute({
          context: {
            topic,
            timeframe: depth === "deep" ? "month" : "week",
            region,
          },
          runtimeContext,
        });
        console.log("✅ Trend analysis completed");
      } catch (error) {
        console.error("❌ Trend analysis failed:", error);
        throw new Error(
          `Trend analysis failed: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }

      // Step 5: Structure the results
      console.log("📊 Step 5: Structuring final results...");

      const result = {
        topic,
        executiveSummary: {
          keyFindings: [
            `Primary sentiment: ${sentimentResult.overallSentiment}`,
            `Trend direction: ${trendResult.trendDirection}`,
            `Source diversity: ${newsResult.sources.length} sources`,
          ],
          recommendedActions: [
            "Monitor developing situation",
            "Prepare stakeholder communications",
            "Review risk mitigation strategies",
          ],
          riskLevel:
            sentimentResult.emotions.fear > 0.6
              ? ("high" as const)
              : sentimentResult.emotions.anger > 0.5
              ? ("medium" as const)
              : ("low" as const),
        },
        newsAnalysis: {
          summary: newsResult.summary,
          sourceCount: newsResult.articleCount,
          geographicScope: region ? [region] : ["Global"],
          timelineSummary: "Coverage spans recent developments",
        },
        sentimentAnalysis: {
          overallSentiment: sentimentResult.overallSentiment,
          publicMood: `${Math.round(
            sentimentResult.sentimentScore * 100
          )}% positive`,
          emotionalDrivers: Object.entries(sentimentResult.emotions)
            .filter(([_, value]) => value > 0.5)
            .map(([emotion]) => emotion),
          sentimentShift: "Analyzing temporal changes",
        },
        factChecking: {
          verifiedClaims: factCheckResults
            .filter(
              (r) => r?.verdict === "true" || r?.verdict === "mostly_true"
            )
            .map((r) => r?.claim || "Unknown claim"),
          disputedClaims: factCheckResults
            .filter(
              (r) => r?.verdict === "false" || r?.verdict === "mostly_false"
            )
            .map((r) => r?.claim || "Unknown claim"),
          misinformationRisk: factCheckResults.some(
            (r) => r?.verdict === "false"
          )
            ? ("high" as const)
            : ("low" as const),
        },
        trendAnalysis: {
          currentTrend: trendResult.trendDirection,
          momentum: trendResult.momentum,
          predictions: trendResult.predictions?.map((p) => p.scenario) || [],
          relatedTrends: trendResult.relatedTopics?.map((t) => t.topic) || [],
        },
        strategicRecommendations: [
          {
            action: "Implement monitoring dashboard",
            priority: "immediate" as const,
            rationale: "Early detection of sentiment shifts",
          },
          {
            action: "Develop response scenarios",
            priority: "short-term" as const,
            rationale: "Prepare for predicted developments",
          },
          {
            action: "Engage stakeholder communication",
            priority: "immediate" as const,
            rationale: "Address current sentiment and concerns",
          },
        ],
        metadata: {
          analysisDate: new Date().toISOString(),
          confidence: 0.85,
          dataQuality:
            newsResult.sources.length > 5
              ? ("excellent" as const)
              : newsResult.sources.length > 2
              ? ("good" as const)
              : ("fair" as const),
        },
      };

      console.log("🎉 Comprehensive analysis workflow completed successfully!");
      return result;
    } catch (error) {
      console.error("💥 Workflow execution failed:", error);

      // Return a fallback result with error information
      return {
        topic: inputData?.topic || "unknown",
        executiveSummary: {
          keyFindings: ["Analysis failed due to technical issues"],
          recommendedActions: [
            "Retry the analysis",
            "Check system configuration",
          ],
          riskLevel: "medium" as const,
        },
        newsAnalysis: {
          summary: "Unable to fetch news due to technical issues",
          sourceCount: 0,
          geographicScope: ["Unknown"],
          timelineSummary: "Analysis failed",
        },
        sentimentAnalysis: {
          overallSentiment: "neutral",
          publicMood: "Unable to determine",
          emotionalDrivers: [],
          sentimentShift: "Analysis failed",
        },
        factChecking: {
          verifiedClaims: [],
          disputedClaims: [],
          misinformationRisk: "low" as const,
        },
        trendAnalysis: {
          currentTrend: "stable",
          momentum: 0,
          predictions: [],
          relatedTrends: [],
        },
        strategicRecommendations: [
          {
            action: "Retry analysis",
            priority: "immediate" as const,
            rationale: "Technical issues prevented completion",
          },
        ],
        metadata: {
          analysisDate: new Date().toISOString(),
          confidence: 0,
          dataQuality: "limited" as const,
        },
      };
    }
  },
});

// Create the workflow
export const newsIntelligenceWorkflow = createWorkflow({
  id: "news-intelligence-workflow",
  inputSchema: z.object({
    topic: z.string().describe("Topic to analyze"),
    depth: z.enum(["basic", "standard", "deep"]).default("standard"),
    language: z.string().default("en"),
    region: z.string().optional(),
  }),
  outputSchema: comprehensiveAnalysisSchema,
}).then(performComprehensiveAnalysis);

newsIntelligenceWorkflow.commit();

console.log("📋 News Intelligence Workflow registered successfully");
