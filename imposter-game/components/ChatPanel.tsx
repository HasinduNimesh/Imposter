'use client';

import { useState, useRef, useEffect } from 'react';
import type { ChatMessage } from '@/lib/onlineTypes';
import { getPlayerColor } from './CartoonElements';

interface ChatPanelProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  myId: string;
  players: { id: string; name: string }[];
  isOpen: boolean;
  onToggle: () => void;
  unreadCount: number;
}

export default function ChatPanel({
  messages,
  onSendMessage,
  myId,
  players,
  isOpen,
  onToggle,
  unreadCount,
}: ChatPanelProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll when new messages arrive
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    onSendMessage(trimmed);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getPlayerIndex = (playerId: string) => {
    return players.findIndex(p => p.id === playerId);
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Floating toggle button when closed
  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="fixed bottom-4 right-4 z-40 bg-purple-500 hover:bg-purple-600 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg transition-all hover:scale-110 active:scale-95 border-2 border-purple-600"
        title="Open chat"
      >
        <span className="text-2xl">💬</span>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center border-2 border-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-40 w-80 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl border-2 border-gray-200 flex flex-col overflow-hidden animate-fade-in"
      style={{ maxHeight: 'min(480px, 60vh)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-linear-to-r from-purple-500 to-blue-500 text-white shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-lg">💬</span>
          <span className="font-bold text-sm">Chat</span>
          <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
            {messages.length}
          </span>
        </div>
        <button
          onClick={onToggle}
          className="hover:bg-white/20 rounded-lg px-2 py-1 transition-colors text-sm font-bold"
        >
          ✕
        </button>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2 min-h-0"
        style={{ maxHeight: '320px' }}
      >
        {messages.length === 0 && (
          <div className="text-center py-8">
            <span className="text-3xl">💬</span>
            <p className="text-gray-400 text-sm mt-2">No messages yet</p>
            <p className="text-gray-300 text-xs">Be the first to say hello!</p>
          </div>
        )}

        {messages.map((msg) => {
          if (msg.type === 'system') {
            return (
              <div key={msg.id} className="text-center">
                <span className="text-xs text-gray-400 bg-gray-50 px-3 py-1 rounded-full">
                  {msg.text}
                </span>
              </div>
            );
          }

          const isMe = msg.senderId === myId;
          const pIdx = getPlayerIndex(msg.senderId);

          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] ${isMe ? 'order-1' : ''}`}>
                {!isMe && (
                  <div className="flex items-center gap-1.5 mb-0.5 ml-1">
                    <div
                      className="w-4 h-4 rounded-full shrink-0"
                      style={{ background: getPlayerColor(pIdx >= 0 ? pIdx : 0) }}
                    />
                    <span className="text-xs font-semibold text-gray-500">
                      {msg.senderName}
                    </span>
                  </div>
                )}
                <div
                  className={`px-3 py-2 rounded-2xl text-sm wrap-break-word ${
                    isMe
                      ? 'bg-purple-500 text-white rounded-br-md'
                      : 'bg-gray-100 text-gray-800 rounded-bl-md'
                  }`}
                >
                  {msg.text}
                </div>
                <p className={`text-[10px] text-gray-300 mt-0.5 ${isMe ? 'text-right mr-1' : 'ml-1'}`}>
                  {formatTime(msg.timestamp)}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="px-3 py-2 border-t border-gray-100 shrink-0">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1 bg-gray-50 border-2 border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-purple-400 transition-colors"
            maxLength={500}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="bg-purple-500 hover:bg-purple-600 disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-xl px-3 py-2 text-sm font-bold transition-all active:scale-95"
          >
            ➤
          </button>
        </div>
      </div>
    </div>
  );
}
