import React, { useState, useRef } from 'react';
import { Mic, Upload, FileAudio, Loader2 } from 'lucide-react';

export default function TranscribePanel() {
  const [file, setFile] = useState<File | null>(null);
  const [transcription, setTranscription] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setTranscription(null);
    }
  };

  const handleTranscribe = async () => {
    if (!file) return;
    setLoading(true);
    setTranscription(null);
    
    try {
      const formData = new FormData();
      formData.append('audio', file);

      const res = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });
      
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setTranscription(data.text);
    } catch (e: any) {
      console.error(e);
      alert('Transcription failed: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-zinc-900/50 rounded-3xl border border-zinc-800 p-6">
      <div className="mb-6 space-y-2">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <FileAudio className="w-5 h-5 text-rose-500" />
          Audio Transcription
        </h2>
        <p className="text-sm text-zinc-400">Upload an audio file and transcribe it using the gemini-3.5-transcribe model.</p>
      </div>

      <div className="space-y-4 mb-6">
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-zinc-700 hover:border-rose-500/50 rounded-2xl p-8 text-center cursor-pointer transition-colors bg-zinc-800/50 hover:bg-zinc-800"
        >
          <input 
            type="file" 
            accept="audio/*" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
          />
          <Upload className="w-8 h-8 text-zinc-500 mx-auto mb-3" />
          <p className="text-sm font-medium text-zinc-300">
            {file ? file.name : 'Click to upload audio file'}
          </p>
          <p className="text-xs text-zinc-500 mt-1">MP3, WAV, M4A, etc.</p>
        </div>

        <button
          onClick={handleTranscribe}
          disabled={loading || !file}
          className="w-full flex items-center justify-center gap-2 bg-rose-500 text-white py-3 rounded-xl font-medium hover:bg-rose-600 transition-colors disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Mic className="w-5 h-5" />}
          {loading ? 'Transcribing...' : 'Transcribe Audio'}
        </button>
      </div>

      <div className="flex-1 bg-zinc-950/50 rounded-2xl border border-zinc-800/50 p-6 overflow-y-auto relative">
        {transcription ? (
          <div className="prose prose-invert max-w-none">
            <p className="text-sm leading-relaxed text-zinc-300">{transcription}</p>
          </div>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-500 space-y-2">
            <FileAudio className="w-8 h-8 opacity-20" />
            <p className="text-sm font-medium">Transcription will appear here</p>
          </div>
        )}
      </div>
    </div>
  );
}
