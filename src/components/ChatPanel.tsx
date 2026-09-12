import { useState, useRef, useEffect } from 'react';
import { Send, Map, Search, Loader2 } from 'lucide-react';
import { auth, db } from '../lib/firebase';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';

export default function ChatPanel() {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [useMaps, setUseMaps] = useState(false);
  const [useSearch, setUseSearch] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(
      collection(db, `users/${auth.currentUser.uid}/chats`),
      orderBy('createdAt', 'asc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(msgs);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    });
    return () => unsubscribe();
  }, []);

  const handleSend = async () => {
    if (!input.trim() || !auth.currentUser) return;
    const userMessage = input;
    setInput('');
    setLoading(true);

    try {
      // Save user message to Firestore
      await addDoc(collection(db, `users/${auth.currentUser.uid}/chats`), {
        role: 'user',
        text: userMessage,
        createdAt: serverTimestamp()
      });

      // Prepare history for API
      const history = messages.map(m => ({
        role: m.role === 'model' ? 'model' : 'user',
        parts: [{ text: m.text }]
      }));
      history.push({ role: 'user', parts: [{ text: userMessage }] });

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: history,
          useMaps,
          useSearch,
          model: 'gemini-3.5-flash'
        })
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      // Save model response to Firestore
      await addDoc(collection(db, `users/${auth.currentUser.uid}/chats`), {
        role: 'model',
        text: data.text,
        createdAt: serverTimestamp()
      });
    } catch (e: any) {
      console.error(e);
      alert('Error: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-zinc-900/50 rounded-3xl border border-zinc-800 overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => (
          <div key={msg.id || idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${msg.role === 'user' ? 'bg-rose-500 text-white' : 'bg-zinc-800 text-zinc-200'}`}>
              <p className="whitespace-pre-wrap text-sm">{msg.text}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-zinc-800 text-zinc-400 rounded-2xl px-4 py-2 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Mayra is thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="p-4 border-t border-zinc-800 bg-zinc-950">
        <div className="flex items-center gap-2 mb-3">
          <button
            onClick={() => setUseMaps(!useMaps)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${useMaps ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-zinc-800 text-zinc-400 border border-transparent hover:bg-zinc-700'}`}
          >
            <Map className="w-3 h-3" />
            Maps Grounding
          </button>
          <button
            onClick={() => setUseSearch(!useSearch)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${useSearch ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-zinc-800 text-zinc-400 border border-transparent hover:bg-zinc-700'}`}
          >
            <Search className="w-3 h-3" />
            Search Grounding
          </button>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type your message..."
            className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/50"
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="bg-white text-black p-2.5 rounded-xl hover:bg-zinc-200 disabled:opacity-50 transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
