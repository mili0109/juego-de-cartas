import React, { useEffect, useRef, useState } from 'react';
import { useGame } from '../../hooks/useGame';
import { useGameContext } from '../../context/GameContext';

export const TextChat: React.FC = () => {
  const { sendChatMessage } = useGame();
  const { messages } = useGameContext();
  const [text, setText] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    sendChatMessage(text);
    setText('');
  };

  return (
    <div className="bg-slate-800 rounded-xl p-4 flex flex-col h-72">
      <h3 className="font-semibold mb-2">💬 Chat</h3>
      <div className="flex-1 overflow-y-auto space-y-1 text-sm pr-1">
        {messages.map((m, i) => (
          <p key={i}>
            <span className="font-medium text-emerald-400">{m.sender}: </span>
            <span>{m.text}</span>
          </p>
        ))}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={handleSend} className="mt-2 flex gap-2">
        <input
          className="flex-1 rounded-lg bg-slate-700 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Escribí un mensaje..."
        />
        <button type="submit" className="rounded-lg bg-emerald-600 px-3 py-2 text-sm hover:bg-emerald-500">
          Enviar
        </button>
      </form>
    </div>
  );
};
