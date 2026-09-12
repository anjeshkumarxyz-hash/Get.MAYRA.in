import { useState } from 'react';
import { Video, Loader2, Download } from 'lucide-react';

export default function VideoPanel() {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [loading, setLoading] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setVideoUrl(null);
    try {
      const res = await fetch('/api/video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, aspectRatio })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      if (data.videoBytes) {
        const url = `data:video/mp4;base64,${data.videoBytes}`;
        setVideoUrl(url);
      }
    } catch (e: any) {
      console.error(e);
      alert('Video generation failed: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-zinc-900/50 rounded-3xl border border-zinc-800 p-6">
      <div className="mb-6 space-y-2">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Video className="w-5 h-5 text-rose-500" />
          Veo 3 Video Generation
        </h2>
        <p className="text-sm text-zinc-400">Generate high-quality videos using the veo-3.1-fast-generate-preview model.</p>
      </div>

      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-xs font-medium text-zinc-500 mb-1.5 uppercase tracking-wide">Aspect Ratio</label>
          <div className="flex gap-2">
            {['16:9', '9:16'].map(ratio => (
              <button
                key={ratio}
                onClick={() => setAspectRatio(ratio)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${aspectRatio === ratio ? 'bg-white text-black' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`}
              >
                {ratio === '16:9' ? 'Landscape (16:9)' : 'Portrait (9:16)'}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-500 mb-1.5 uppercase tracking-wide">Prompt</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the video you want to generate..."
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/50 resize-none h-24"
          />
        </div>
        <button
          onClick={handleGenerate}
          disabled={loading || !prompt.trim()}
          className="w-full flex items-center justify-center gap-2 bg-rose-500 text-white py-3 rounded-xl font-medium hover:bg-rose-600 transition-colors disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Video className="w-5 h-5" />}
          {loading ? 'Generating (takes a while)...' : 'Generate Video'}
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center bg-zinc-950/50 rounded-2xl border border-zinc-800/50 overflow-hidden relative">
        {videoUrl ? (
          <>
            <video src={videoUrl} controls autoPlay loop className="w-full h-full object-contain" />
            <a
              href={videoUrl}
              download="generated-video.mp4"
              className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/80 rounded-full backdrop-blur-md transition-colors"
              title="Download Video"
            >
              <Download className="w-5 h-5 text-white" />
            </a>
          </>
        ) : (
          <div className="text-center text-zinc-500 space-y-2">
            <Video className="w-8 h-8 mx-auto opacity-20" />
            <p className="text-sm font-medium">Your generated video will appear here</p>
          </div>
        )}
      </div>
    </div>
  );
}
