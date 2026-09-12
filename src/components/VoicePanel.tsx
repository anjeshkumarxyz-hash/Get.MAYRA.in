import { Mic, MicOff, AlertCircle } from 'lucide-react';
import { useVoiceAssistant } from '../useVoiceAssistant';
import { useEffect, useRef } from 'react';
import { auth, db } from '../lib/firebase';
import { doc } from 'firebase/firestore';
import { useDocumentData } from 'react-firebase-hooks/firestore';

export default function VoicePanel({ theme, onSentimentChange, onActiveChange }: { theme: any, onSentimentChange?: (sentiment: string) => void, onActiveChange?: (active: boolean) => void }) {
  const userId = auth.currentUser?.uid;
  const settingsRef = userId ? doc(db, 'users', userId, 'settings', 'preferences') : null;
  const [settings] = useDocumentData(settingsRef);
  const wakeWord = settings?.wakeWord || 'Mayra';
  const speechRate = settings?.speechRate ?? 1.0;

  const { isConnected, isSpeaking, sentiment, error, status, connect, disconnect, inputAnalyser, outputAnalyser } = useVoiceAssistant(wakeWord, speechRate);
  const orbRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (onActiveChange) {
      onActiveChange(isConnected || isSpeaking || status === 'connecting');
    }
  }, [isConnected, isSpeaking, status, onActiveChange]);

  const getStatusColor = () => {
    switch (status) {
      case 'connected': return 'bg-emerald-500';
      case 'connecting': return 'bg-amber-500';
      case 'error': return 'bg-rose-500';
      case 'disconnected':
      default: return 'bg-zinc-600';
    }
  };

  useEffect(() => {
    let animationId: number;

    const updateOrb = () => {
      animationId = requestAnimationFrame(updateOrb);
      const orb = orbRef.current;
      if (!orb) return;

      const activeAnalyser = isSpeaking ? outputAnalyser : inputAnalyser;
      let scale = 1;

      if (isConnected && activeAnalyser) {
        const bufferLength = activeAnalyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        activeAnalyser.getByteFrequencyData(dataArray);

        let sum = 0;
        // Use a subset of frequencies for better responsiveness to voice
        const activeCount = Math.floor(bufferLength * 0.5);
        for (let i = 0; i < activeCount; i++) {
          sum += dataArray[i];
        }
        const average = sum / activeCount; // 0 to 255
        
        // Scale from 1 to 1.8 based on volume
        scale = 1 + (average / 255) * 0.8; 
      }

      orb.style.transform = `scale(${scale})`;
    };

    updateOrb();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [isConnected, isSpeaking, inputAnalyser, outputAnalyser]);

  return (
    <div className="flex flex-col h-full bg-zinc-900/50 rounded-3xl border border-zinc-800 p-6 relative overflow-hidden items-center justify-center">
      <div className="absolute top-8 text-center space-y-2 z-10">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">Live Assistant</h1>
        <p className="text-sm text-zinc-500 font-medium tracking-wide uppercase transition-colors">
          {isConnected ? (isSpeaking ? `${wakeWord} is speaking...` : 'Listening...') : 'Offline'}
        </p>
      </div>

      <div className="relative flex items-center justify-center w-full flex-1 mt-12 cursor-pointer group" onClick={isConnected ? disconnect : connect}>
        <div className={`relative flex items-center justify-center w-48 h-48 transition-all duration-700 ${!isConnected ? 'opacity-50 grayscale' : 'opacity-100'}`}>
          {/* Dynamic Orb */}
          <div 
            ref={orbRef}
            className={`absolute inset-0 rounded-full bg-gradient-to-tr ${isSpeaking ? 'from-purple-500 to-pink-500 shadow-[0_0_80px_-15px_rgba(236,72,153,0.5)]' : theme.orb + ' ' + theme.shadow} transition-colors duration-500 ease-in-out blur-[2px]`}
          />
          {/* Inner Core */}
          <div className="absolute inset-2 rounded-full bg-zinc-950/40 backdrop-blur-sm z-10" />
          
          {/* Icon */}
          <div className="absolute z-20">
            {isConnected ? (
              <Mic className={`w-12 h-12 ${isSpeaking ? 'text-pink-400' : theme.glow.replace('bg-', 'text-')} transition-colors duration-500`} />
            ) : (
              <MicOff className="w-12 h-12 text-zinc-500" />
            )}
          </div>
        </div>

        {!isConnected && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-64">
            <span className="text-zinc-400 font-medium tracking-wide bg-zinc-900/50 px-4 py-2 rounded-full border border-zinc-800/50 backdrop-blur-md">
              Say "{wakeWord}" or Tap to Wake
            </span>
          </div>
        )}
      </div>

      <div className="absolute bottom-8 left-8 flex items-center gap-3 bg-zinc-900/80 border border-zinc-800/50 px-4 py-2 rounded-full backdrop-blur-md z-10">
        <div className="relative flex h-3 w-3">
          {(status === 'connecting' || status === 'connected') && (
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${getStatusColor()}`}></span>
          )}
          <span className={`relative inline-flex rounded-full h-3 w-3 ${getStatusColor()} transition-colors duration-300`}></span>
        </div>
        <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
          {status}
        </span>
      </div>

      {error && (
        <div className="absolute bottom-8 right-8 flex items-center gap-2 bg-red-500/10 text-red-400 px-4 py-3 rounded-2xl text-sm font-medium border border-red-500/20 max-w-xs text-right z-10">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}
    </div>
  );
}
