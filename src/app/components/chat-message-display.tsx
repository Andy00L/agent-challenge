"use client";

import { ScrollArea } from "@radix-ui/react-scroll-area";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

import ExamplePanel from "./chat-example-panel";
import { useDiagram } from "../contexts/diagram-context";
import { convertToLegalXml, replaceNodes } from "../lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  parts?: Array<any>;
  toolCalls?: Array<{
    id: string;
    toolName: string;
    args: any;
  }>;
}

interface ChatMessageDisplayProps {
  messages: Message[];
  error?: Error | null;
  setInput: (input: string) => void;
}

export function ChatMessageDisplay({
  messages,
  error,
  setInput,
}: ChatMessageDisplayProps) {
  const { chartXML, loadDiagram: onDisplayChart } = useDiagram();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const previousXML = useRef<string>("");
  const processedToolCalls = useRef<Set<string>>(new Set());
  const [expandedTools, setExpandedTools] = useState<Record<string, boolean>>(
    {}
  );

  const handleDisplayChart = useCallback(
    (xml: string) => {
      const currentXml = xml || "";
      const convertedXml = convertToLegalXml(currentXml);
      if (convertedXml !== previousXML.current) {
        previousXML.current = convertedXml;
        const replacedXML = replaceNodes(chartXML, convertedXml);
        onDisplayChart(replacedXML);
      }
    },
    [chartXML, onDisplayChart]
  );

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // ✅ Handle Mastra tool calls
  useEffect(() => {
    messages.forEach((message) => {
      if (message.role === "user") return;

      if (message.toolCalls && message.toolCalls.length > 0) {
        message.toolCalls.forEach((toolCall) => {
          const callId = toolCall.id;

          setExpandedTools((prev) => ({
            ...prev,
            [callId]: false,
          }));

          if (
            toolCall.toolName === "display_diagram" &&
            toolCall.args?.xml &&
            !processedToolCalls.current.has(callId)
          ) {
            handleDisplayChart(toolCall.args.xml);
            processedToolCalls.current.add(callId);
          }
        });
      }
    });
  }, [messages, handleDisplayChart]);

  const renderToolCall = (toolCall: any) => {
    const callId = toolCall.id;
    const isExpanded = expandedTools[callId] ?? true;
    const toolName = toolCall.toolName;

    const toggleExpanded = () => {
      setExpandedTools((prev) => ({
        ...prev,
        [callId]: !isExpanded,
      }));
    };

    // Check if XML is large
    const isLargeXml = toolCall.args?.xml && toolCall.args.xml.length > 500;

    return (
      <div
        key={callId}
        className="p-3 my-2 border-l-4 border-blue-500 bg-blue-50 rounded"
      >
        {/* Tool Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">🔧</span>
            <div>
              <div className="font-semibold text-gray-800">
                Tool: {toolName}
              </div>
            </div>
          </div>
          {isLargeXml && (
            <button
              onClick={toggleExpanded}
              className="text-xs px-2 py-1 bg-blue-200 hover:bg-blue-300 text-blue-800 rounded"
            >
              {isExpanded ? "Hide" : "Show"} Input
            </button>
          )}
        </div>

        {/* Tool Input/Args - Always show for small inputs, collapsible for large */}
        {(!isLargeXml || isExpanded) && (
          <div className="mt-2 p-3 bg-white rounded border border-blue-200">
            <div className="text-xs font-semibold text-gray-600 mb-2">
              INPUT (What Agent Generated):
            </div>
            {toolCall.toolName === "display_diagram" ? (
              <div className="text-xs font-mono text-gray-700 overflow-auto max-h-64 bg-gray-50 p-2 rounded">
                <pre className="whitespace-pre-wrap break-words">
                  {toolCall.args?.xml
                    ? toolCall.args.xml.substring(0, 1000)
                    : "No input"}
                  {toolCall.args?.xml &&
                    toolCall.args.xml.length > 1000 &&
                    "\n\n... (truncated)"}
                </pre>
              </div>
            ) : (
              <div className="text-xs font-mono text-gray-700 overflow-auto max-h-48 bg-gray-50 p-2 rounded">
                <pre>{JSON.stringify(toolCall.args, null, 2)}</pre>
              </div>
            )}
          </div>
        )}

        {/* Tool Status */}
        <div className="mt-2 flex items-center gap-2">
          <span className="text-green-600">✓</span>
          <span className="text-xs text-gray-600">Executed</span>
        </div>
      </div>
    );
  };

  // Filter empty assistant messages
  const filteredMessages = messages.filter((msg) => {
    if (msg.role === "user") return true;
    if (msg.role === "assistant") {
      if (msg.content?.trim()) return true;
      if (msg.toolCalls && msg.toolCalls.length > 0) return true;
      return false;
    }
    return true;
  });

  return (
    <ScrollArea className="h-full pr-4">
      {filteredMessages.length === 0 ? (
        <ExamplePanel setInput={setInput} />
      ) : (
        filteredMessages.map((message) => (
          <div
            key={message.id}
            className={`mb-4 ${
              message.role === "user" ? "text-right" : "text-left"
            }`}
          >
            {/* User Message */}
            {message.role === "user" && (
              <div className="inline-block px-4 py-2 bg-blue-500 text-white rounded-lg max-w-[85%] break-words">
                {message.content}
              </div>
            )}

            {/* Assistant Message with Text Content */}
            {message.role === "assistant" && message.content?.trim() && (
              <div className="inline-block px-4 py-2 bg-gray-200 text-gray-900 rounded-lg max-w-[85%] break-words mb-2">
                {message.content}
              </div>
            )}

            {/* Tool Calls - Always show with details */}
            {message.role === "assistant" &&
              message.toolCalls &&
              message.toolCalls.length > 0 && (
                <div className="mt-2 space-y-2">
                  {message.toolCalls.map((toolCall) =>
                    renderToolCall(toolCall)
                  )}
                </div>
              )}

            {/* Uploaded Images */}
            {message.parts && message.parts.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {message.parts.map((part: any, index: number) => {
                  if (part.type === "file" || part.type?.includes("image")) {
                    return (
                      <div key={index}>
                        <Image
                          src={part.url}
                          width={150}
                          height={150}
                          alt={`uploaded-${index}`}
                          className="rounded-md border border-gray-300"
                          style={{ objectFit: "contain" }}
                        />
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            )}
          </div>
        ))
      )}
      {error && (
        <div className="text-red-500 text-sm mt-4 p-3 bg-red-50 rounded border border-red-200">
          ❌ Error: {error.message}
        </div>
      )}
      <div ref={messagesEndRef} />
    </ScrollArea>
  );
}
