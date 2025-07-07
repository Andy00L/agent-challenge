// src/mastra/agents/news-agent/sentiment-tool.ts
import { createTool } from "@mastra/core/tools";
import { z } from "zod";

export const sentimentTool = createTool({
  id: "analyze-sentiment",
  description:
    "Analyze sentiment and emotional tone of news content with detailed metrics",
  inputSchema: z.object({
    text: z.string().describe("Text to analyze for sentiment"),
    context: z.string().optional().describe("Additional context for analysis"),
  }),
  outputSchema: z.object({
    overallSentiment: z.enum([
      "very_positive",
      "positive",
      "neutral",
      "negative",
      "very_negative",
    ]),
    sentimentScore: z.number().min(-1).max(1),
    emotions: z.object({
      joy: z.number().min(0).max(1),
      anger: z.number().min(0).max(1),
      fear: z.number().min(0).max(1),
      sadness: z.number().min(0).max(1),
      surprise: z.number().min(0).max(1),
      trust: z.number().min(0).max(1),
    }),
    subjectivity: z.number().min(0).max(1),
    confidence: z.number().min(0).max(1),
    keyPhrases: z.array(
      z.object({
        phrase: z.string(),
        sentiment: z.string(),
        importance: z.number(),
      })
    ),
    summary: z.string(),
  }),
  execute: async ({ context }) => {
    const { text, context: additionalContext } = context;

    try {
      // Validate input
      if (!text || text.trim().length === 0) {
        throw new Error("Text input is empty or invalid");
      }

      // Validate API key
      if (!process.env.PERPLEXITY_API_KEY) {
        throw new Error("PERPLEXITY_API_KEY environment variable is not set");
      }

      console.log(
        `💭 Analyzing sentiment for text (${text.length} characters)`
      );

      // Use Perplexity for sentiment analysis
      const response = await fetch(
        "https://api.perplexity.ai/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.PERPLEXITY_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "sonar",
            messages: [
              {
                role: "system",
                content: `You are an expert sentiment analysis AI. Analyze the given text and provide detailed sentiment metrics.
                
                Return a JSON object with the following structure:
                {
                  "overallSentiment": "very_positive" | "positive" | "neutral" | "negative" | "very_negative",
                  "sentimentScore": number between -1 and 1,
                  "emotions": {
                    "joy": number between 0 and 1,
                    "anger": number between 0 and 1,
                    "fear": number between 0 and 1,
                    "sadness": number between 0 and 1,
                    "surprise": number between 0 and 1,
                    "trust": number between 0 and 1
                  },
                  "subjectivity": number between 0 and 1,
                  "confidence": number between 0 and 1,
                  "keyPhrases": [
                    {
                      "phrase": "string",
                      "sentiment": "positive" | "negative" | "neutral",
                      "importance": number between 0 and 1
                    }
                  ],
                  "summary": "Brief explanation of the sentiment analysis"
                }
                
                Be precise and consider cultural context, sarcasm, and nuanced language.`,
              },
              {
                role: "user",
                content: `Analyze the sentiment of this text${
                  additionalContext ? ` (Context: ${additionalContext})` : ""
                }:\n\n${text}`,
              },
            ],
            max_tokens: 1000,
            temperature: 0.2,
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `❌ Sentiment analysis API error: ${response.status} - ${errorText}`
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
            `Sentiment analysis API error: ${response.status} - ${errorText}`
          );
        }
      }

      const data = await response.json();

      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error("Invalid response format from Perplexity API");
      }

      const content = data.choices[0].message.content;

      if (!content || content.trim().length === 0) {
        throw new Error("Empty response from Perplexity API");
      }

      // Parse JSON response
      let result;
      try {
        result = JSON.parse(content);
      } catch (parseError) {
        console.warn(
          "⚠️ JSON parsing failed, using fallback values:",
          parseError
        );
        // Fallback if JSON parsing fails
        result = {
          overallSentiment: "neutral" as const,
          sentimentScore: 0,
          emotions: {
            joy: 0.5,
            anger: 0.1,
            fear: 0.1,
            sadness: 0.1,
            surprise: 0.1,
            trust: 0.5,
          },
          subjectivity: 0.5,
          confidence: 0.7,
          keyPhrases: [],
          summary:
            "Sentiment analysis completed with fallback values due to parsing error.",
        };
      }

      // Validate result structure
      if (!result.overallSentiment || !result.emotions) {
        throw new Error("Invalid sentiment analysis result structure");
      }

      console.log(
        `✅ Successfully analyzed sentiment: ${result.overallSentiment}`
      );

      return result;
    } catch (error) {
      console.error("❌ Sentiment analysis error:", error);

      // Provide a robust fallback response
      const fallbackResult = {
        overallSentiment: "neutral" as const,
        sentimentScore: 0,
        emotions: {
          joy: 0,
          anger: 0,
          fear: 0,
          sadness: 0,
          surprise: 0,
          trust: 0,
        },
        subjectivity: 0.5,
        confidence: 0,
        keyPhrases: [],
        summary: `Sentiment analysis failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }. Using neutral fallback values.`,
      };

      return fallbackResult;
    }
  },
});
