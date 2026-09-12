import { useState, useCallback } from 'react';
import { MessageSquare, Video, Mic2, LogOut, FileAudio, Palette, Settings, HelpCircle } from 'lucide-react';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import VoicePanel from './VoicePanel';
import ChatPanel from './ChatPanel';
import VideoPanel from './VideoPanel';
import TranscribePanel from './TranscribePanel';
import DailySummary from './DailySummary';
import SettingsPanel from './SettingsPanel';
import HelpPanel from './HelpPanel';
import mayraAvatar from '../assets/images/circular_lineart_logo_1789206621221.jpg';

const THEMES = [
  { id: 'rose', glow: 'bg-rose-500', orb: 'from-rose-500 to-purple-600', shadow: 'shadow-[0_0_80px_-15px_rgba(244,63,94,0.5)]', selection: 'selection:bg-rose-500/30' },
  { id: 'cyan', glow: 'bg-cyan-500', orb: 'from-cyan-400 to-blue-600', shadow: 'shadow-[0_0_80px_-15px_rgba(6,182,212,0.5)]', selection: 'selection:bg-cyan-500/30' },
  { id: 'emerald', glow: 'bg-emerald-500', orb: 'from-emerald-400 to-teal-600', shadow: 'shadow-[0_0_80px_-15px_rgba(16,185,129,0.5)]', selection: 'selection:bg-emerald-500/30' },
  { id: 'amber', glow: 'bg-amber-500', orb: 'from-amber-400 to-orange-600', shadow: 'shadow-[0_0_80px_-15px_rgba(245,158,11,0.5)]', selection: 'selection:bg-amber-500/30' },
  { id: 'violet', glow: 'bg-violet-500', orb: 'from-violet-400 to-purple-600', shadow: 'shadow-[0_0_80px_-15px_rgba(139,92,246,0.5)]', selection: 'selection:bg-violet-500/30' }
];

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<'voice' | 'chat' | 'video' | 'transcribe' | 'settings' | 'help'>('voice');
  const [themeIndex, setThemeIndex] = useState(0);
  const [isAssistantActive, setIsAssistantActive] = useState(false);

  const currentTheme = THEMES[themeIndex];
  const toggleTheme = () => setThemeIndex((prev) => (prev + 1) % THEMES.length);

  const handleSentimentChange = useCallback((sentiment: string) => {
    switch(sentiment) {
      case 'happy':
        setThemeIndex(3); // amber
        break;
      case 'calm':
        setThemeIndex(1); // cyan
        break;
      case 'energetic':
        setThemeIndex(2); // emerald
        break;
      case 'sad':
        setThemeIndex(4); // violet
        break;
      case 'angry':
        setThemeIndex(0); // rose
        break;
    }
  }, []);

  return (
    <div className={`min-h-screen bg-zinc-950 text-white flex flex-col md:flex-row p-4 gap-4 ${currentTheme.selection}`}>
      
      {/* Sidebar Navigation */}
      <nav className="w-full md:w-64 flex flex-col gap-2 bg-zinc-900/30 rounded-3xl p-4 border border-zinc-800/50">
        <div className="flex items-center gap-3 px-2 mb-6 mt-2">
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-zinc-700 shadow-lg">
            <img src={mayraAvatar} alt="Mayra" className="w-full h-full object-cover" />
          </div>
          <h2 className="text-xl font-bold tracking-tight">Mayra</h2>
        </div>

        <button onClick={() => setActiveTab('voice')} className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-colors font-medium text-sm ${activeTab === 'voice' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'}`}>
          <Mic2 className="w-5 h-5" /> Live Voice
        </button>
        <button onClick={() => setActiveTab('chat')} className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-colors font-medium text-sm ${activeTab === 'chat' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'}`}>
          <MessageSquare className="w-5 h-5" /> Chat & Search
        </button>
        <button onClick={() => setActiveTab('video')} className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-colors font-medium text-sm ${activeTab === 'video' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'}`}>
          <Video className="w-5 h-5" /> Video Gen
        </button>
        <button onClick={() => setActiveTab('transcribe')} className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-colors font-medium text-sm ${activeTab === 'transcribe' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'}`}>
          <FileAudio className="w-5 h-5" /> Transcription
        </button>

        <div className="mt-auto pt-4 border-t border-zinc-800/50 flex flex-col gap-2">
          <DailySummary />
          <button onClick={() => setActiveTab('help')} className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-colors font-medium text-sm ${activeTab === 'help' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'}`}>
            <HelpCircle className="w-5 h-5" /> Commands & Tips
          </button>
          <button onClick={() => setActiveTab('settings')} className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-colors font-medium text-sm ${activeTab === 'settings' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'}`}>
            <Settings className="w-5 h-5" /> Settings
          </button>
          <button onClick={toggleTheme} className="flex items-center gap-3 px-4 py-3 rounded-2xl transition-colors font-medium text-sm text-zinc-400 hover:text-white hover:bg-zinc-800/50">
            <Palette className="w-5 h-5" /> Theme Color
          </button>
          <button onClick={() => signOut(auth)} className="flex items-center gap-3 px-4 py-3 rounded-2xl transition-colors font-medium text-sm text-rose-400 hover:bg-rose-500/10">
            <LogOut className="w-5 h-5" /> Sign Out
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 flex flex-col h-[calc(100vh-2rem)] relative z-10">
        {activeTab === 'voice' && <VoicePanel theme={currentTheme} onSentimentChange={handleSentimentChange} onActiveChange={setIsAssistantActive} />}
        {activeTab === 'chat' && <ChatPanel />}
        {activeTab === 'video' && <VideoPanel />}
        {activeTab === 'transcribe' && <TranscribePanel />}
        {activeTab === 'settings' && <SettingsPanel />}
        {activeTab === 'help' && <HelpPanel />}
      </main>

      {/* Edge Lighting Overlay */}
      <div className={`fixed inset-0 z-50 pointer-events-none transition-opacity duration-700 ${isAssistantActive ? 'opacity-100' : 'opacity-0'}`}>
        <div className={`w-full h-full border-[6px] ${currentTheme.glow.replace('bg-', 'border-')} shadow-[inset_0_0_50px_rgba(0,0,0,0.4)] transition-all duration-700 ease-in-out`} 
             style={{ filter: `drop-shadow(0 0 15px ${currentTheme.glow.replace('bg-', 'var(--tw-')})` }} />
      </div>
    </div>
  );
}
