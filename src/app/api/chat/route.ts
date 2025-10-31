// src/app/api/chat/route.ts

import { mastra } from "@/mastra";
import { readFileSync } from "fs";
import { NextRequest, NextResponse } from "next/server";
import path from "path";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    console.log("\n📨 ==================== NEW REQUEST ====================");

    const body = await req.json();
    const { messages, xml } = body;

    // Log incoming data
    console.log("📥 RECEIVED DATA:");
    console.log("   Messages count:", messages?.length);
    console.log("   XML length:", xml?.length);
    console.log("   Last message:", messages?.[messages.length - 1]);

    // Read the XML guide from file
    let guide = "";
    try {
      // __dirname is the directory of this file (src/app/api/chat/)
      const guideFile = path.join(__dirname, "xml_guide.md");
      guide = readFileSync(guideFile, "utf8");
      console.log("✅ XML guide loaded:", guide.length, "characters");
    } catch (error) {
      console.warn(
        "⚠️  XML guide file not found at:",
        path.join(__dirname, "xml_guide.md")
      );
      console.warn("   Error:", (error as Error).message);
    }

    // Get the diagram agent
    const agent = mastra.getAgent("diagramAgent");
    console.log("🤖 Agent retrieved:", agent?.name);

    if (!agent) {
      throw new Error("Diagram agent not found");
    }

    // Get the last message from the user
    const lastMessage = messages[messages.length - 1];
    console.log("📝 Last message structure:", lastMessage);

    // Extract text from the last message parts
    const lastMessageText =
      lastMessage.parts?.find((part: any) => part.type === "text")?.text ||
      lastMessage.content ||
      "";

    console.log("💬 User input:", lastMessageText);

    // Build the complete prompt with all context
    const prompt = `You are an expert diagram creation assistant specializing in draw.io XML generation.

Current diagram XML:
\`\`\`xml
${xml || "No diagram currently loaded"}
\`\`\`

${guide ? `XML Format Guide:\n${guide}` : ""}

User request: ${lastMessageText}

IMPORTANT: You MUST use the display-diagram tool to create and display the diagram. Do not respond with text only.`;

    console.log("\n📤 SENDING TO AGENT:");
    console.log("   Prompt length:", prompt.length);
    console.log("   Prompt preview:", prompt.substring(0, 200) + "...");

    // ✅ Use generateVNext with ONLY the prompt argument
    const response = await agent.generateVNext(prompt);

    console.log("\n📬 AGENT RESPONSE:");
    console.log("   Response text:", response.text?.substring(0, 200));
    console.log("   Response text length:", response.text?.length);
    console.log("   Tool calls count:", response.toolCalls?.length || 0);

    if (response.toolCalls && response.toolCalls.length > 0) {
      console.log("\n🔧 TOOL CALLS:");
      response.toolCalls.forEach((tc: any, idx: number) => {
        console.log(`   [${idx}] Full tool call object:`);
        console.log(`       `, JSON.stringify(tc, null, 2));
        console.log(`   Tool name: ${tc.toolName}`);
        console.log(`   Tool ID: ${tc.toolCallId}`);
        console.log(`   Tool args:`, tc.args);
        if (tc.toolName === "display_diagram") {
          console.log(`       XML length:`, tc.args?.xml?.length);
          console.log(`       XML preview:`, tc.args?.xml?.substring(0, 200));
        }
      });
    } else {
      console.log("\n⚠️  NO TOOL CALLS in response");
      console.log(
        "   Full response object:",
        JSON.stringify(response, null, 2)
      );
    }

    if (response.toolCalls && response.toolCalls.length > 0) {
      console.log("\n🔧 TOOL CALLS:");
      response.toolCalls.forEach((tc: any, idx: number) => {
        console.log(
          `   [${idx}] Full tool call object:`,
          JSON.stringify(tc, null, 2)
        );

        // ✅ FIX: Access through payload!
        const toolName = tc.payload?.toolName || tc.toolName;
        const toolCallId = tc.payload?.toolCallId || tc.toolCallId;
        const args = tc.payload?.args || tc.args;

        console.log(`   Tool name: ${toolName}`);
        console.log(`   Tool ID: ${toolCallId}`);
        console.log(`   Tool args:`, args);

        if (toolName === "display_diagram" && args?.xml) {
          console.log(`       XML length:`, args.xml.length);
          console.log(`       XML preview:`, args.xml.substring(0, 150));
        }
      });
    } else {
      console.log("\n⚠️  NO TOOL CALLS in response");
      console.log("   Text only response:", response.text);
    }

    // Return the response in the expected format
    const result = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: response.text || "",
      toolCalls:
        response.toolCalls?.map((tc: any) => {
          const payload = tc.payload || tc; // Handle both formats
          return {
            id: payload.toolCallId || tc.toolCallId || crypto.randomUUID(),
            type: "tool-call",
            toolName: payload.toolName || tc.toolName,
            args: payload.args || tc.args,
          };
        }) || [],
    };

    console.log("\n📤 SENDING TO FRONTEND:");
    console.log("   Tool calls in response:", result.toolCalls.length);
    console.log("   Content preview:", result.content?.substring(0, 100));
    console.log("✅ REQUEST COMPLETED SUCCESSFULLY\n");

    return NextResponse.json(result);
  } catch (error) {
    console.error("\n❌ ==================== ERROR ====================");
    console.error("❌ Error in chat API:", error);

    // Provide helpful error messages
    if (error instanceof Error) {
      // Ollama connection errors
      if (
        error.message.includes("connect ECONNREFUSED") ||
        error.message.includes("ECONNREFUSED") ||
        error.message.includes("fetch failed")
      ) {
        return NextResponse.json(
          {
            error:
              "Cannot connect to Ollama. Make sure Ollama is running (ollama serve)",
            details: error.message,
            suggestion: "Run 'ollama serve' in a terminal and try again",
          },
          { status: 503 }
        );
      }

      // Model not found errors
      if (
        error.message.includes("model") &&
        (error.message.includes("not found") || error.message.includes("404"))
      ) {
        const modelName =
          process.env.NOS_MODEL_NAME_AT_ENDPOINT ||
          process.env.MODEL_NAME_AT_ENDPOINT ||
          "llama3.1";
        return NextResponse.json(
          {
            error: `Model '${modelName}' not found. Please pull the required model.`,
            details: error.message,
            suggestion: `Run 'ollama pull ${modelName}' and try again`,
          },
          { status: 404 }
        );
      }

      // Agent not found errors
      if (
        error.message.includes("agent not found") ||
        error.message.includes("Agent not found")
      ) {
        return NextResponse.json(
          {
            error: "Diagram agent not initialized properly",
            details: error.message,
            suggestion: "Check Mastra configuration in src/mastra/index.ts",
          },
          { status: 500 }
        );
      }

      // Generic errors
      return NextResponse.json(
        {
          error: "Failed to process request",
          details: error.message,
          stack:
            process.env.NODE_ENV === "development" ? error.stack : undefined,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "An unknown error occurred" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const ollamaUrl =
      process.env.NOS_OLLAMA_API_URL ||
      process.env.OLLAMA_API_URL ||
      "http://localhost:11434";

    const modelName =
      process.env.NOS_MODEL_NAME_AT_ENDPOINT ||
      process.env.MODEL_NAME_AT_ENDPOINT ||
      "llama3.1";

    return NextResponse.json({
      status: "ok",
      service: "diagram-agent-api",
      ollama: {
        url: ollamaUrl,
        model: modelName,
      },
      agents: ["diagramAgent"],
      tools: [
        "display_diagram",
        "edit_diagram",
        "get_current_diagram",
        "analyze_diagram",
        "clear_diagram",
      ],
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development",
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

function strictXMLFix(xml: string): string {
  // FIX 1: Remove quotes around hex colors in style attributes
  xml = xml.replace(/fillColor="(#[0-9a-fA-F]{6})"/g, "fillColor=$1");
  xml = xml.replace(/strokeColor="(#[0-9a-fA-F]{6})"/g, "strokeColor=$1");

  // FIX 2: Remove spaces and quotes in style attributes
  xml = xml.replace(/style="([^"]*)"/g, (match, styleContent) => {
    const fixed = styleContent
      .replace(/\s*=\s*/g, "=")
      .replace(/\s*;\s*/g, ";")
      .replace(/"([^"]*)"/g, "$1"); // Remove any quotes inside style
    return `style="${fixed}"`;
  });

  // FIX 3: Fix broken edges - ensure they have proper structure
  xml = xml.replace(
    /<mxCell\s+id="(\d+)"\s+parent="([^"]+)"\s+value=""\s+style="[^"]*"\s+edge="1"\s+parent="[^"]+"\s*\/>/g,
    (match, id, parentId) => {
      // Reconstruct as proper edge with source/target
      // This is a fallback - ideally agent shouldn't generate these
      return `<mxCell id="${id}" value="" style="endArrow=classic;html=1" edge="1" parent="1">
  <mxGeometry width="50" height="50" relative="1" as="geometry"/>
</mxCell>`;
    }
  );

  return xml;
}
