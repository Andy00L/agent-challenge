// src/mastra/agents/news-agent/fact-check-tool.ts
import { createTool } from "@mastra/core/tools";
import { z } from "zod";

export const factCheckTool = createTool({
  id: "fact-check",
  description: "Verify claims and fact-check statements using multiple sources",
  inputSchema: z.object({
    claim: z.string().describe("The claim or statement to fact-check"),
    sources: z
      .array(z.string())
      .optional()
      .describe("Sources to check against"),
    context: z
      .string()
      .optional()
      .describe("Additional context about the claim"),
  }),
  outputSchema: z.object({
    claim: z.string(),
    verdict: z.enum([
      "true",
      "mostly_true",
      "mixed",
      "mostly_false",
      "false",
      "unverifiable",
    ]),
    confidence: z.number().min(0).max(1),
    evidence: z.array(
      z.object({
        source: z.string(),
        supporting: z.boolean(),
        quote: z.string(),
        credibility: z.number().min(0).max(1),
      })
    ),
    explanation: z.string(),
    relatedClaims: z.array(z.string()),
    checkDate: z.string(),
  }),
  execute: async ({ context }) => {
    const { claim, sources = [], context: additionalContext } = context;

    try {
      // Validate input
      if (!claim || claim.trim().length === 0) {
        throw new Error("Claim input is empty or invalid");
      }

      // Validate API key
      if (!process.env.PERPLEXITY_API_KEY) {
        throw new Error("PERPLEXITY_API_KEY environment variable is not set");
      }

      console.log(
        `✓ Fact-checking claim: "${claim.substring(0, 50)}${
          claim.length > 50 ? "..." : ""
        }"`
      );

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
                content: `You are a professional fact-checker with expertise in verifying claims using multiple sources.
                
                For the given claim, you must:
                1. Search for evidence from credible sources
                2. Cross-reference multiple sources
                3. Consider the context and nuance
                4. Identify any misleading elements
                5. Check for common misinformation patterns
                
                Provide a detailed fact-check report with:
                - Clear verdict (true/mostly_true/mixed/mostly_false/false/unverifiable)
                - Confidence level in your assessment
                - Evidence from multiple sources
                - Explanation of your reasoning
                - Related claims that might provide context
                
                Be thorough, objective, and transparent about limitations.`,
              },
              {
                role: "user",
                content: `Fact-check this claim: "${claim}"
                ${additionalContext ? `\nContext: ${additionalContext}` : ""}
                ${
                  sources.length > 0
                    ? `\nSuggested sources to check: ${sources.join(", ")}`
                    : ""
                }
                
                Please verify this claim using multiple credible sources and provide a detailed analysis.`,
              },
            ],
            max_tokens: 2000,
            temperature: 0.1,
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `❌ Fact-check API error: ${response.status} - ${errorText}`
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
            `Fact-check API error: ${response.status} - ${errorText}`
          );
        }
      }

      const data = await response.json();

      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error("Invalid response format from Perplexity API");
      }

      const analysisText = data.choices[0].message.content;

      if (!analysisText || analysisText.trim().length === 0) {
        throw new Error("Empty response from Perplexity API");
      }

      // Parse the response to extract structured data
      const verdictMatch = analysisText.match(
        /verdict:\s*(true|mostly_true|mixed|mostly_false|false|unverifiable)/i
      );
      const confidenceMatch = analysisText.match(/confidence:\s*(\d+\.?\d*)/i);

      const verdict = verdictMatch
        ? verdictMatch[1].toLowerCase()
        : "unverifiable";
      const confidence = confidenceMatch
        ? parseFloat(confidenceMatch[1]) / 100
        : 0.5;

      // Extract evidence mentions
      const evidence = [];
      const sourcePattern = /source:\s*([^\n]+)\s*-\s*([^\n]+)/gi;
      let match;
      while ((match = sourcePattern.exec(analysisText)) !== null) {
        evidence.push({
          source: match[1].trim(),
          supporting:
            match[2].toLowerCase().includes("support") ||
            match[2].toLowerCase().includes("confirm"),
          quote: match[2].trim(),
          credibility: 0.8,
        });
      }

      // Extract related claims
      const relatedClaims = [];
      const relatedPattern = /related claim[s]?:\s*([^\n]+)/gi;
      while ((match = relatedPattern.exec(analysisText)) !== null) {
        relatedClaims.push(match[1].trim());
      }

      console.log(
        `✅ Fact-check completed: ${verdict} (confidence: ${confidence})`
      );

      return {
        claim,
        verdict: verdict as any,
        confidence,
        evidence: evidence.slice(0, 5), // Limit to 5 evidence items
        explanation: analysisText,
        relatedClaims: relatedClaims.slice(0, 3),
        checkDate: new Date().toISOString(),
      };
    } catch (error) {
      console.error("❌ Fact-check error:", error);

      // Provide a robust fallback response
      const fallbackResult = {
        claim,
        verdict: "unverifiable" as const,
        confidence: 0,
        evidence: [],
        explanation: `Fact-checking failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }. Unable to verify this claim at this time.`,
        relatedClaims: [],
        checkDate: new Date().toISOString(),
      };

      return fallbackResult;
    }
  },
});
