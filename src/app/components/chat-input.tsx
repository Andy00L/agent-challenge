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

  // ---------- Auto-resize textarea ----------
  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    const newHeight = Math.min(textarea.scrollHeight, 200);
    textarea.style.height = `${newHeight}px`;
  }, []);

  // Ajuste la hauteur à l'initialisation et quand l'input change
  useEffect(() => {
    adjustTextareaHeight();
  }, [input, adjustTextareaHeight]);

  useEffect(() => {
    // Ajuste une toute première fois au montage
    adjustTextareaHeight();
  }, [adjustTextareaHeight]);

  // ---------- Focus management ----------
  // Focus au montage
  useEffect(() => {
    textareaRef.current?.focus({ preventScroll: true });
  }, []);

  // Refocus dès que le streaming se termine (ready ou error)
  useEffect(() => {
    if (status === "ready" || status === "error") {
      textareaRef.current?.focus({ preventScroll: true });
    }
  }, [status]);

  // ---------- Handlers ----------
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e);
    requestAnimationFrame(() => {
      adjustTextareaHeight();
    });
  };

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // Empêche l'envoi pendant IME/composition
      // (utile pour certaines langues/claviers)
      if (e.nativeEvent?.isComposing) return;

      // Cmd/Ctrl + Enter pour soumettre
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        if (input.trim() && status !== "streaming") {
          const form = e.currentTarget.closest("form");
          if (form) form.requestSubmit();
        }
      }
    },
    [input, status]
  );

  // Nettoyage + refocus après fermeture de la modale
  const handleClear = useCallback(() => {
    onClearChat();
    setShowClearDialog(false);
    setTimeout(() => {
      textareaRef.current?.focus({ preventScroll: true });
    }, 0);
  }, [onClearChat]);

  return (
    <form onSubmit={onSubmit} className="w-full space-y-2">
      <Textarea
        ref={textareaRef}
        value={input}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={`Describe the diagram you want to create.\n(Press Cmd/Ctrl + Enter to send)`}
        // IMPORTANT : garder le focus pendant le streaming
        readOnly={status === "streaming"}
        aria-disabled={status === "streaming"}
        autoFocus
        className={`min-h-[80px] resize-none transition-all duration-200 px-4 py-2 ${
          status === "streaming" ? "opacity-70 cursor-not-allowed" : ""
        }`}
        autoComplete="off"
        autoCorrect="off"
        spellCheck="true"
      />

      <div className="flex items-center gap-2">
        <div className="flex gap-2">
          <ButtonWithTooltip
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setShowClearDialog(true)}
            tooltipContent="Clear current conversation and diagram"
            disabled={status === "streaming"}
          >
            <RotateCcw className="h-4 w-4" />
          </ButtonWithTooltip>

          <ButtonWithTooltip
            type="button"
            variant="outline"
            size="icon"
            onClick={() => onToggleHistory(true)}
            disabled={status === "streaming" || diagramHistory.length === 0}
            tooltipContent="View diagram history"
          >
            <History className="h-4 w-4" />
          </ButtonWithTooltip>
        </div>

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

        <div className="ml-auto">
          <Button
            type="submit"
            disabled={status === "streaming" || !input.trim()}
            className="transition-opacity"
            aria-label={
              status === "streaming" ? "Sending message..." : "Send message"
            }
            // Évite que le bouton ne vole le focus à la textarea
            onMouseDown={(e) => e.preventDefault()}
          >
            {status === "streaming" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            Send
          </Button>
        </div>
      </div>
    </form>
  );
}
