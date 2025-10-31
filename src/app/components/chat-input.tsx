"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";

import { History, Loader2, RotateCcw, Send } from "lucide-react";
import { ButtonWithTooltip } from "./button-with-tooltip";
import { HistoryDialog } from "./history-dialog";
import { ResetWarningModal } from "./reset-warning-modal";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { useDiagram } from "../contexts/diagram-context";

interface ChatInputProps {
  input: string;
  status: "submitted" | "streaming" | "ready" | "error";
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onClearChat: () => void;
  showHistory?: boolean;
  onToggleHistory?: (show: boolean) => void;
}

export function ChatInput({
  input,
  status,
  onSubmit,
  onChange,
  onClearChat,
  showHistory = false,
  onToggleHistory = () => {},
}: ChatInputProps) {
  const { diagramHistory } = useDiagram();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showClearDialog, setShowClearDialog] = useState(false);

  // Auto-resize textarea based on content
  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, []);

  useEffect(() => {
    adjustTextareaHeight();
  }, [input, adjustTextareaHeight]);

  // ✅ FIX: Ensure onChange is called AND height is adjusted
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange(e);
      adjustTextareaHeight();
    },
    [onChange, adjustTextareaHeight]
  );

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      const form = e.currentTarget.closest("form");
      if (form && input.trim() && status !== "streaming") {
        form.requestSubmit();
      }
    }
  };

  // Handle clearing conversation and diagram
  const handleClear = () => {
    onClearChat();
    setShowClearDialog(false);
  };

  return (
    <form onSubmit={onSubmit} className="w-full space-y-2">
      <Textarea
        ref={textareaRef}
        value={input}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="Describe the diagram you want to create.
(Press Cmd/Ctrl + Enter to send)"
        disabled={status === "streaming"}
        aria-label="Chat input"
        className="min-h-[80px] resize-none transition-all duration-200 px-1 py-0"
      />

      <div className="flex items-center gap-2">
        <div className="mr-auto">
          <ButtonWithTooltip
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setShowClearDialog(true)}
            tooltipContent="Clear current conversation and diagram"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
          </ButtonWithTooltip>

          {/* Warning Modal */}
          <ResetWarningModal
            open={showClearDialog}
            onOpenChange={setShowClearDialog}
            onClear={handleClear}
          />

          <HistoryDialog
            showHistory={showHistory}
            onToggleHistory={onToggleHistory}
          />
        </div>
        <div className="flex gap-2">
          {/* History Button */}
          <ButtonWithTooltip
            type="button"
            variant="outline"
            size="icon"
            onClick={() => onToggleHistory(true)}
            disabled={status === "streaming" || diagramHistory.length === 0}
            title="Diagram History"
            tooltipContent="View diagram history"
          >
            <History className="h-4 w-4" />
          </ButtonWithTooltip>
        </div>

        <Button
          type="submit"
          disabled={status === "streaming" || !input.trim()}
          className="transition-opacity"
          aria-label={
            status === "streaming" ? "Sending message..." : "Send message"
          }
        >
          {status === "streaming" ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Send className="mr-2 h-4 w-4" />
          )}
          Send
        </Button>
      </div>
    </form>
  );
}
