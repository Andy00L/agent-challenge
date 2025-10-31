"use client";

import type React from "react";
import { useEffect, useRef, useState } from "react";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { useDiagram } from "../contexts/diagram-context";
import { formatXML } from "../lib/utils";
import { ChatMessageDisplay } from "./chat-message-display";
import { ChatInput } from "./chat-input";

// Define message type
interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  parts?: Array<{
    type: string;
    text?: string;
    url?: string;
    mediaType?: string;
  }>;
  toolCalls?: Array<{
    id: string;
    type: string;
    toolName: string;
    args: any;
  }>;
}

export default function ChatPanel() {
  const {
    loadDiagram: onDisplayChart,
    handleExport: onExport,
    resolverRef,
    chartXML,
    clearDiagram,
  } = useDiagram();

  const onFetchChart = () => {
    return new Promise<string>((resolve) => {
      if (resolverRef && "current" in resolverRef) {
        resolverRef.current = resolve;
      }
      onExport();
    });
  };

  // State management
  const [showHistory, setShowHistory] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [status, setStatus] = useState<
    "submitted" | "streaming" | "ready" | "error"
  >("ready");
  const [error, setError] = useState<Error | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Handle tool calls from assistant messages
  useEffect(() => {
    const processToolCalls = async () => {
      const lastMessage = messages[messages.length - 1];

      if (lastMessage?.role === "assistant" && lastMessage.toolCalls) {
        for (const toolCall of lastMessage.toolCalls) {
          try {
            if (
              toolCall.toolName === "display-diagram" ||
              toolCall.toolName === "display_diagram"
            ) {
              const { xml } = toolCall.args;
              onDisplayChart(xml);
              console.log("✅ Displayed diagram");
            } else if (
              toolCall.toolName === "edit-diagram" ||
              toolCall.toolName === "edit_diagram"
            ) {
              const { edits } = toolCall.args;

              // Fetch current chart XML
              const currentXml = await onFetchChart();

              // Apply edits using the utility function
              const { replaceXMLParts } = await import("../lib/utils");
              const editedXml = replaceXMLParts(currentXml, edits);

              // Load the edited diagram
              onDisplayChart(editedXml);
              console.log(`✅ Applied ${edits.length} edit(s) to diagram`);
            } else if (
              toolCall.toolName === "clear-diagram" ||
              toolCall.toolName === "clear_diagram"
            ) {
              clearDiagram();
              console.log("✅ Cleared diagram");
            } else if (
              toolCall.toolName === "analyze-diagram" ||
              toolCall.toolName === "analyze_diagram"
            ) {
              const currentXml = await onFetchChart();
              console.log("✅ Analyzed diagram");
            }
          } catch (err) {
            console.error(`❌ Error executing ${toolCall.toolName}:`, err);
          }
        }
      }
    };

    processToolCalls();
  }, [messages, onDisplayChart, onFetchChart, clearDiagram]);

  const onFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (input.trim() && status !== "streaming") {
      try {
        setStatus("streaming");
        setError(null);

        // Fetch chart data before sending message
        let chartXml = await onFetchChart();
        chartXml = formatXML(chartXml);

        // Create message parts - ONLY TEXT (no files)
        const parts: any[] = [{ type: "text", text: input }];

        // Add user message
        const userMessage: Message = {
          id: crypto.randomUUID(),
          role: "user",
          content: input,
          parts,
        };
        setMessages((prev) => [...prev, userMessage]);

        // Clear input
        setInput("");

        // Send to API
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messages: [...messages, userMessage],
            xml: chartXml,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to get response");
        }

        const assistantMessage: Message = await response.json();
        setMessages((prev) => [...prev, assistantMessage]);
        setStatus("ready");
      } catch (err) {
        console.error("Error in chat:", err);
        setError(err instanceof Error ? err : new Error("Unknown error"));
        setStatus("error");
      }
    }
  };

  // Handle input change
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setInput(e.target.value);
  };

  return (
    <Card className="h-full flex flex-col rounded-none py-0 gap-0">
      <CardHeader className="p-4 flex justify-between items-center">
        <CardTitle>nosDraw</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow overflow-hidden px-2">
        <ChatMessageDisplay
          messages={messages}
          error={error}
          setInput={setInput}
        />
        <div ref={messagesEndRef} />
      </CardContent>

      <CardFooter className="p-2">
        <ChatInput
          input={input}
          status={status}
          onSubmit={onFormSubmit}
          onChange={handleInputChange}
          onClearChat={() => {
            setMessages([]);
            clearDiagram();
          }}
          showHistory={showHistory}
          onToggleHistory={setShowHistory}
        />
      </CardFooter>
    </Card>
  );
}
