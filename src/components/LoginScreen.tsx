import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { LogIn } from 'lucide-react';
import { useState } from 'react';
import mayraAvatar from '../assets/images/circular_lineart_logo_1789206621221.jpg';

export default function LoginScreen() {
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    try {
      setLoading(true);
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (e: any) {
      console.error(e);
      alert('Login failed: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background blur effect using the avatar */}
      <div 
        className="absolute inset-0 opacity-20 blur-3xl scale-110 pointer-events-none"
        style={{ backgroundImage: `url(${mayraAvatar})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
      />
      
      <div className="w-full max-w-sm p-8 bg-zinc-900/60 border border-zinc-800 rounded-3xl backdrop-blur-xl text-center space-y-6 relative z-10 shadow-2xl">
        <div className="mx-auto w-24 h-24 rounded-full overflow-hidden border-2 border-zinc-700 shadow-lg">
          <img src={mayraAvatar} alt="Mayra Avatar" className="w-full h-full object-cover" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white mb-2">Welcome to Mayra</h1>
          <p className="text-sm text-zinc-400">Sign in to access your personal anime AI assistant, chat, video generation, and more.</p>
        </div>
        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full py-3 px-4 bg-white text-black font-semibold rounded-xl hover:bg-zinc-200 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <LogIn className="w-5 h-5" />
          {loading ? 'Signing in...' : 'Sign in with Google'}
        </button>
      </div>
    </div>
  );
}
