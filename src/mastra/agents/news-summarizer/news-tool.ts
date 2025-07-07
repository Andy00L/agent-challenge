// src/mastra/agents/news-agent/news-tool.ts
import { createTool } from "@mastra/core/tools";
import { z } from "zod";

export const newsTool = createTool({
  id: "fetch-news",
  description:
    "Fetch and summarize latest news articles from multiple sources with advanced filtering",
  inputSchema: z.object({
    topic: z.string().describe("The news topic to search for"),
    count: z
      .number()
      .optional()
      .default(5)
      .describe("Number of articles to fetch (1-10)"),
    language: z
      .string()
      .optional()
      .default("en")
      .describe("Language code (en, es, fr, de, etc.)"),
    sortBy: z
      .enum(["relevancy", "popularity", "publishedAt"])
      .optional()
      .default("publishedAt")
      .describe("Sort order for results"),
    timeRange: z
      .enum(["today", "week", "month", "all"])
      .optional()
      .default("week")
      .describe("Time range for news search"),
  }),
  outputSchema: z.object({
    topic: z.string(),
    summary: z.string(),
    timestamp: z.string(),
    articleCount: z.number(),
    sources: z.array(z.string()),
    language: z.string(),
  }),
  execute: async ({ context }) => {
    const {
      topic,
      count = 5,
      language = "en",
      sortBy = "publishedAt",
      timeRange = "week",
    } = context;

    // Calculate date range
    const now = new Date();
    let fromDate = new Date();
    switch (timeRange) {
      case "today":
        fromDate.setDate(now.getDate() - 1);
        break;
      case "week":
        fromDate.setDate(now.getDate() - 7);
        break;
      case "month":
        fromDate.setMonth(now.getMonth() - 1);
        break;
      default:
        fromDate.setFullYear(now.getFullYear() - 1);
    }

    try {
      // Validate API key
      if (!process.env.PERPLEXITY_API_KEY) {
        throw new Error("PERPLEXITY_API_KEY environment variable is not set");
      }

      console.log(
        `🔍 Fetching news for topic: "${topic}" (${count} articles, ${language}, ${timeRange})`
      );

      // Use Perplexity for AI-powered analysis
      const response = await fetch(
        "https://api.perplexity.ai/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.PERPLEXITY_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "sonar-pro",
            messages: [
              {
                role: "system",
                content: `
                  You are a professional multilingual news analyst and summarizer. Your task is to find, analyze, and present the latest news articles in a clear, structured format.

                  For each news summary, structure your response exactly as follows:

                  📰 NEWS SUMMARY: [Topic]
                  ═══════════════════════════════════════

                  🔍 SEARCH OVERVIEW
                  • Total articles found: [X]
                  • Date range: [earliest] to [latest]
                  • Language: ${language}
                  • Key themes identified: [list main themes]
                  • Geographic coverage: [regions/countries mentioned]

                  📋 ARTICLE SUMMARIES
                  ───────────────────────────────────────

                  [For each article, use this format:]

                  📖 Article [X]: [Headline/Title]
                  • Source: [Publication Name] | Credibility: [High/Medium/Low]
                  • Date: [Publication Date]
                  • Author: [Author name if available]
                  • Key Points:
                    - [Main point 1]
                    - [Main point 2]
                    - [Main point 3]
                  • Impact: [Brief analysis of significance]
                  • Stakeholders: [Who is affected]
                  • Reference: [URL or citation if available]

                  📊 TREND ANALYSIS
                  • Overall sentiment: [Positive/Negative/Neutral/Mixed]
                  • Emerging patterns: [Notable trends across articles]
                  • Geographic focus: [Which regions/countries are mentioned most]
                  • Timeline: [How the story has evolved]
                  • Contradictions: [Any conflicting information between sources]

                  🎯 KEY TAKEAWAYS
                  • Most important development: [Brief summary]
                  • What to watch: [Future implications or developments to monitor]
                  • Reliability assessment: [Overall confidence in information]
                  • Related topics: [Connected news stories or themes]

                  ⚠️ CONTEXT & VERIFICATION
                  • Background context: [Historical or additional context]
                  • Unverified claims: [Information needing verification]
                  • Source diversity: [Assessment of source variety]

                  Guidelines:
                  - Prioritize recent articles (${timeRange} time range)
                  - Include diverse perspectives and sources
                  - Highlight breaking news or significant developments
                  - Maintain objectivity and avoid editorial opinions
                  - Include publication dates for temporal context
                  - Flag any conflicting information between sources
                  - Provide context for technical or specialized topics
                  - Consider cultural and regional perspectives
                  - Verify facts across multiple sources when possible

                  Maintain this exact formatting for consistency, using the emoji and section headers as shown.
                `,
              },
              {
                role: "user",
                content: `Find and summarize the latest ${count} news articles about "${topic}" from the past ${timeRange}. Focus on ${language} language sources. Sort by ${sortBy}. Include publication dates, source names, and provide a comprehensive analysis of the current situation regarding this topic.`,
              },
            ],
            max_tokens: 3000,
            temperature: 0.3,
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `❌ Perplexity API error: ${response.status} - ${errorText}`
        );

        if (response.status === 401) {
          throw new Error(
            "Invalid Perplexity API key. Please check your PERPLEXITY_API_KEY environment variable."
          );
        } else if (response.status === 429) {
          throw new Error(
            "Rate limit exceeded. Please wait a moment and try again."
          );
        } else if (response.status >= 500) {
          throw new Error(
            "Perplexity API server error. Please try again later."
          );
        } else {
          throw new Error(
            `Perplexity API error: ${response.status} - ${errorText}`
          );
        }
      }

      const data = await response.json();

      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error("Invalid response format from Perplexity API");
      }

      const summary = data.choices[0].message.content;

      if (!summary || summary.trim().length === 0) {
        throw new Error("Empty response from Perplexity API");
      }

      console.log(`✅ Successfully fetched news for "${topic}"`);

      return {
        topic,
        summary,
        timestamp: new Date().toISOString(),
        articleCount: count,
        sources: ["Perplexity AI Analysis"],
        language,
      };
    } catch (error) {
      console.error("❌ News fetch error:", error);

      // Provide a helpful fallback response
      const fallbackSummary = `Unable to fetch news for "${topic}" at this time. 

🔍 SEARCH OVERVIEW
• Total articles found: 0
• Date range: ${fromDate.toISOString().split("T")[0]} to ${
        now.toISOString().split("T")[0]
      }
• Language: ${language}
• Key themes identified: Unable to analyze
• Geographic coverage: Unable to determine

📋 ARTICLE SUMMARIES
───────────────────────────────────────
No articles could be retrieved due to: ${
        error instanceof Error ? error.message : "Unknown error"
      }

📊 TREND ANALYSIS
• Overall sentiment: Unable to determine
• Emerging patterns: No data available
• Geographic focus: Unable to determine
• Timeline: Unable to analyze
• Contradictions: No data available

🎯 KEY TAKEAWAYS
• Most important development: Unable to determine
• What to watch: Monitor for future developments
• Reliability assessment: Low confidence due to data unavailability
• Related topics: Unable to determine

⚠️ CONTEXT & VERIFICATION
• Background context: Unable to provide context
• Unverified claims: No claims to verify
• Source diversity: No sources available

Please try again later or check your API configuration.`;

      return {
        topic,
        summary: fallbackSummary,
        timestamp: new Date().toISOString(),
        articleCount: 0,
        sources: ["Error - No sources available"],
        language,
      };
    }
  },
});
