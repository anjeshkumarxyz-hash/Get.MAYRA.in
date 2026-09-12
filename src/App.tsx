/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from './lib/firebase';
import Dashboard from './components/Dashboard';
import LoginScreen from './components/LoginScreen';
import { Loader2 } from 'lucide-react';

export default function App() {
  const [user, loading, error] = useAuthState(auth);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-rose-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-white">
        <p className="text-red-400">Error initializing app: {error.message}</p>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  return <Dashboard />;
}


