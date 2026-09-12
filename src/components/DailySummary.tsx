import { useState, useEffect } from 'react';
import { CalendarClock, X, Loader2 } from 'lucide-react';
import { auth, db } from '../lib/firebase';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';

export default function DailySummary() {
  const [showModal, setShowModal] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [targetTime] = useState("20:00"); // 8:00 PM local time

  useEffect(() => {
    // Check every minute if it's the target time and we haven't summarized today
    const interval = setInterval(() => {
      const now = new Date();
      const currentHours = now.getHours().toString().padStart(2, '0');
      const currentMinutes = now.getMinutes().toString().padStart(2, '0');
      const currentTime = `${currentHours}:${currentMinutes}`;
      
      const lastSummaryDate = localStorage.getItem('lastSummaryDate');
      const todayDate = now.toDateString();

      if (currentTime === targetTime && lastSummaryDate !== todayDate) {
        localStorage.setItem('lastSummaryDate', todayDate);
        generateSummary();
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [targetTime]);

  const generateSummary = async () => {
    if (!auth.currentUser) return;
    setLoading(true);
    setShowModal(true);
    setSummary(null);

    try {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      // Fetch chats for today
      const qChats = query(
        collection(db, `users/${auth.currentUser.uid}/chats`),
        where('createdAt', '>=', startOfDay),
        orderBy('createdAt', 'asc')
      );
      const snap = await getDocs(qChats);
      const logs = snap.docs.map(doc => doc.data());

      // Fetch voice logs for today
      const qVoice = query(
        collection(db, `users/${auth.currentUser.uid}/voiceLogs`),
        where('createdAt', '>=', startOfDay),
        orderBy('createdAt', 'asc')
      );
      const voiceSnap = await getDocs(qVoice);
      const voiceLogs = voiceSnap.docs.map(doc => doc.data());

      const allLogs = [...logs, ...voiceLogs].sort((a: any, b: any) => {
        const timeA = a.createdAt?.toMillis() || 0;
        const timeB = b.createdAt?.toMillis() || 0;
        return timeA - timeB;
      });

      const res = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logs: allLogs })
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setSummary(data.text);
    } catch (e: any) {
      console.error(e);
      setSummary("Oops! I had a little brain freeze and couldn't generate the summary right now. Let's try again later!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => {
            const todayDate = new Date().toDateString();
            localStorage.setItem('lastSummaryDate', todayDate);
            generateSummary();
        }}
        className="flex items-center gap-3 px-4 py-3 rounded-2xl transition-colors font-medium text-sm text-zinc-400 hover:text-white hover:bg-zinc-800/50 w-full"
      >
        <CalendarClock className="w-5 h-5" /> Daily Summary
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 max-w-md w-full shadow-2xl relative">
            <button 
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-2 bg-zinc-800 hover:bg-zinc-700 rounded-full transition-colors text-zinc-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
            
            <div className="mb-6 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-500/20 flex items-center justify-center border border-rose-500/30">
                <CalendarClock className="w-5 h-5 text-rose-500" />
              </div>
              <div>
                <h3 className="text-xl font-bold tracking-tight text-white">Mayra's Daily Wrap-up</h3>
                <p className="text-sm text-zinc-400">Your personalized summary</p>
              </div>
            </div>

            <div className="bg-zinc-950 rounded-2xl p-5 border border-zinc-800/50 min-h-[120px] flex items-center justify-center">
              {loading ? (
                <div className="flex flex-col items-center gap-3 text-zinc-500">
                  <Loader2 className="w-6 h-6 animate-spin text-rose-500" />
                  <span className="text-sm font-medium">Mayra is reviewing your day...</span>
                </div>
              ) : (
                <p className="text-sm text-zinc-200 leading-relaxed whitespace-pre-wrap">
                  {summary}
                </p>
              )}
            </div>

            <button 
              onClick={() => setShowModal(false)}
              className="mt-6 w-full py-3 bg-white text-black font-semibold rounded-xl hover:bg-zinc-200 transition-colors"
            >
              Awesome, thanks!
            </button>
          </div>
        </div>
      )}
    </>
  );
}
