// Test script to verify data return
import { factCheckTool } from "./src/mastra/agents/news-summarizer/fact-check-tool.js";
import { newsTool } from "./src/mastra/agents/news-summarizer/news-tool.js";
import { newsIntelligenceWorkflow } from "./src/mastra/agents/news-summarizer/news-workflow.js";
import { sentimentTool } from "./src/mastra/agents/news-summarizer/sentiment-tool.js";
import { trendTool } from "./src/mastra/agents/news-summarizer/trend-tool.js";

async function testDataReturn() {
  console.log("🧪 Testing data return from tools and workflow...\n");

  try {
    // Test 1: News Tool
    console.log("📰 Testing News Tool...");
    const newsResult = await newsTool.execute({
      context: {
        topic: "artificial intelligence",
        count: 3,
        language: "en",
        sortBy: "publishedAt",
        timeRange: "week",
      },
    });
    console.log("✅ News Tool Result:", {
      topic: newsResult.topic,
      summaryLength: newsResult.summary?.length || 0,
      articleCount: newsResult.articleCount,
      sourcesCount: newsResult.sources?.length || 0,
      timestamp: newsResult.timestamp,
    });

    // Test 2: Sentiment Tool
    console.log("\n💭 Testing Sentiment Tool...");
    const sentimentResult = await sentimentTool.execute({
      context: {
        text: "AI technology is advancing rapidly and shows great promise for the future.",
        context: "Technology news",
      },
    });
    console.log("✅ Sentiment Tool Result:", {
      overallSentiment: sentimentResult.overallSentiment,
      sentimentScore: sentimentResult.sentimentScore,
      emotions: sentimentResult.emotions,
      confidence: sentimentResult.confidence,
    });

    // Test 3: Trend Tool
    console.log("\n📈 Testing Trend Tool...");
    const trendResult = await trendTool.execute({
      context: {
        topic: "artificial intelligence",
        timeframe: "week",
        region: "global",
      },
    });
    console.log("✅ Trend Tool Result:", {
      topic: trendResult.topic,
      trendDirection: trendResult.trendDirection,
      momentum: trendResult.momentum,
      predictionsCount: trendResult.predictions?.length || 0,
      relatedTopicsCount: trendResult.relatedTopics?.length || 0,
    });

    // Test 4: Fact Check Tool
    console.log("\n✓ Testing Fact Check Tool...");
    const factCheckResult = await factCheckTool.execute({
      context: {
        claim: "AI can now write code better than humans",
        context: "Technology claims",
      },
    });
    console.log("✅ Fact Check Tool Result:", {
      claim: factCheckResult.claim,
      verdict: factCheckResult.verdict,
      confidence: factCheckResult.confidence,
      evidenceCount: factCheckResult.evidence?.length || 0,
    });

    // Test 5: Workflow
    console.log("\n🔄 Testing Workflow...");
    const workflowResult = await newsIntelligenceWorkflow.execute({
      inputData: {
        topic: "artificial intelligence",
        depth: "basic",
        language: "en",
      },
    });
    console.log("✅ Workflow Result:", {
      topic: workflowResult.topic,
      executiveSummary:
        workflowResult.executiveSummary?.keyFindings?.length || 0,
      newsAnalysis: !!workflowResult.newsAnalysis,
      sentimentAnalysis: !!workflowResult.sentimentAnalysis,
      factChecking: !!workflowResult.factChecking,
      trendAnalysis: !!workflowResult.trendAnalysis,
      strategicRecommendations:
        workflowResult.strategicRecommendations?.length || 0,
    });

    console.log("\n🎉 All tests completed successfully!");
    console.log("✅ Data return is working correctly.");
  } catch (error) {
    console.error("❌ Test failed:", error);
    console.error("Error details:", error.message);
  }
}

// Run the test
testDataReturn();
