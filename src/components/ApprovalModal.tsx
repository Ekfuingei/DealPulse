"use client";

import { useState, useEffect } from "react";
import { X, Check, Edit2 } from "lucide-react";

interface ApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: string;
  prospect?: string;
  channel?: string;
  onApprove: (editedMessage?: string) => void;
  isLoading?: boolean;
  error?: string | null;
}

export function ApprovalModal({
  isOpen,
  onClose,
  message,
  prospect,
  channel,
  onApprove,
  isLoading,
  error,
}: ApprovalModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedMessage, setEditedMessage] = useState(message);

  useEffect(() => {
    setEditedMessage(message);
    setIsEditing(false);
  }, [message, isOpen]);

  if (!isOpen) return null;

  const displayMessage = isEditing ? editedMessage : message;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative w-full max-w-lg rounded-2xl border border-zinc-800 bg-[var(--card)] p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Approve message</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {prospect && (
          <p className="text-sm text-zinc-400 mb-2">
            To: <span className="text-white">{prospect}</span>
            {channel && <span className="ml-2">via {channel}</span>}
          </p>
        )}
        {error && (
          <div className="mb-4 rounded-lg bg-red-950/50 border border-red-800 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}
        {isEditing ? (
          <textarea
            value={editedMessage}
            onChange={(e) => setEditedMessage(e.target.value)}
            className="w-full rounded-lg bg-zinc-900/50 p-4 text-zinc-300 text-sm min-h-[120px] border border-zinc-700 focus:border-indigo-500 outline-none"
            placeholder="Edit message..."
          />
        ) : (
          <div className="rounded-lg bg-zinc-900/50 p-4 text-zinc-300 text-sm whitespace-pre-wrap">
            {displayMessage}
          </div>
        )}
        <div className="flex gap-2 mt-4">
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors"
            >
              <Edit2 className="w-4 h-4" />
              Edit
            </button>
          ) : (
            <button
              onClick={() => setIsEditing(false)}
              className="flex items-center gap-2 rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors"
            >
              Cancel edit
            </button>
          )}
          <button
            onClick={() => onApprove(isEditing ? editedMessage : undefined)}
            disabled={isLoading}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50 transition-colors"
          >
            <Check className="w-4 h-4" />
            {isLoading ? "Sending…" : "Approve & send"}
          </button>
        </div>
      </div>
    </div>
  );
}
