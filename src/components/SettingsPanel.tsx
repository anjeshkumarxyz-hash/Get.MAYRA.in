import { useState, useEffect } from 'react';
import { Settings, Save, Loader2 } from 'lucide-react';
import { auth, db } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useDocumentData } from 'react-firebase-hooks/firestore';

export default function SettingsPanel() {
  const [wakeWord, setWakeWord] = useState('');
  const [speechRate, setSpeechRate] = useState(1.0);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const userId = auth.currentUser?.uid;
  const settingsRef = userId ? doc(db, 'users', userId, 'settings', 'preferences') : null;
  const [settings, loading, error] = useDocumentData(settingsRef);

  useEffect(() => {
    if (settings) {
      if (settings.wakeWord) setWakeWord(settings.wakeWord);
      if (settings.speechRate !== undefined) setSpeechRate(settings.speechRate);
    }
  }, [settings]);

  const handleSave = async () => {
    if (!settingsRef) return;
    setSaving(true);
    setMessage('');
    try {
      await setDoc(settingsRef, { 
        wakeWord: wakeWord.trim() || 'Mayra',
        speechRate: speechRate
      }, { merge: true });
      setMessage('Settings saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err: any) {
      console.error(err);
      setMessage('Failed to save settings: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-zinc-900/50 rounded-3xl border border-zinc-800 p-6">
      <div className="mb-6 space-y-2">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Settings className="w-5 h-5 text-rose-500" />
          Settings
        </h2>
        <p className="text-sm text-zinc-400">Customize your preferences and how Mayra responds to you.</p>
      </div>

      <div className="flex-1 bg-zinc-950/50 rounded-2xl border border-zinc-800/50 p-6 space-y-8">
        {loading ? (
          <div className="flex items-center gap-2 text-zinc-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Loading settings...</span>
          </div>
        ) : error ? (
          <div className="text-red-400 text-sm">Error loading settings: {error.message}</div>
        ) : (
          <div className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Custom Wake Word
              </label>
              <p className="text-xs text-zinc-500 mb-3">
                Change the name Mayra responds to (e.g., "Jarvis", "Computer", "Kira"). Default is "Mayra".
              </p>
              <input
                type="text"
                value={wakeWord}
                onChange={(e) => setWakeWord(e.target.value)}
                placeholder="Mayra"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/50 text-white"
                maxLength={50}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2 flex justify-between">
                <span>Speech Rate</span>
                <span className="text-rose-400 font-bold">{speechRate.toFixed(1)}x</span>
              </label>
              <p className="text-xs text-zinc-500 mb-3">
                Adjust how fast Mayra speaks. Higher values make her sound faster and sassier, lower values sound clearer and more deliberate.
              </p>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={speechRate}
                onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
                className="w-full accent-rose-500 bg-zinc-900 rounded-lg cursor-pointer h-2"
              />
              <div className="flex justify-between text-xs text-zinc-600 mt-1 font-medium">
                <span>0.5x (Slow)</span>
                <span>1.0x (Normal)</span>
                <span>2.0x (Fast)</span>
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-rose-500 text-white rounded-xl font-medium hover:bg-rose-600 transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving...' : 'Save Changes'}
            </button>

            {message && (
              <p className={`text-sm ${message.includes('Failed') ? 'text-red-400' : 'text-emerald-400'}`}>
                {message}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
