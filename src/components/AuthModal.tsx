import React, { useState } from 'react';
import { X, Mail, Lock, Phone, Chrome } from 'lucide-react';
import { auth, googleProvider } from '../firebase';
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      onClose();
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(err.message);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      if (mode === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
        onClose();
      } else if (mode === 'signup') {
        await createUserWithEmailAndPassword(auth, email, password);
        onClose();
      } else if (mode === 'forgot') {
        await sendPasswordResetEmail(auth, email);
        setMessage('Password reset email sent. Please check your inbox.');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6 md:p-8 relative shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors">
          <X className="w-6 h-6" />
        </button>

        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">
            {mode === 'login' ? 'Welcome Back' : mode === 'signup' ? 'Create Account' : 'Reset Password'}
          </h2>
          <p className="text-zinc-400 text-sm">
            {mode === 'login' ? 'Sign in to continue to AMG Prime' : mode === 'signup' ? 'Sign up to access premium healthcare content' : 'Enter your email to receive a reset link'}
          </p>
        </div>

        {error && <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-sm p-3 rounded mb-4">{error}</div>}
        {message && <div className="bg-green-500/10 border border-green-500/50 text-green-500 text-sm p-3 rounded mb-4">{message}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {(mode === 'login' || mode === 'signup' || mode === 'forgot') && (
            <div>
              <label className="block text-xs font-bold text-zinc-400 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full bg-black border border-zinc-800 rounded-lg pl-10 pr-4 py-3 text-white focus:border-brand outline-none transition-colors" placeholder="you@example.com" />
              </div>
            </div>
          )}

          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-bold text-zinc-400 mb-1">Mobile Number (Optional)</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="w-full bg-black border border-zinc-800 rounded-lg pl-10 pr-4 py-3 text-white focus:border-brand outline-none transition-colors" placeholder="+91 98765 43210" />
              </div>
            </div>
          )}

          {(mode === 'login' || mode === 'signup') && (
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-bold text-zinc-400">Password</label>
                {mode === 'login' && (
                  <button type="button" onClick={() => setMode('forgot')} className="text-xs text-brand hover:underline">Forgot password?</button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full bg-black border border-zinc-800 rounded-lg pl-10 pr-4 py-3 text-white focus:border-brand outline-none transition-colors" placeholder="••••••••" />
              </div>
            </div>
          )}

          <button type="submit" disabled={loading} className="w-full bg-brand text-black font-bold py-3 rounded-lg hover:bg-brand/90 transition-colors mt-2 disabled:opacity-50">
            {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Sign Up' : 'Send Reset Link'}
          </button>
        </form>

        {(mode === 'login' || mode === 'signup') && (
          <>
            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 h-px bg-zinc-800"></div>
              <span className="text-xs text-zinc-500 font-medium uppercase">Or continue with</span>
              <div className="flex-1 h-px bg-zinc-800"></div>
            </div>

            <button onClick={handleGoogleSignIn} type="button" className="w-full bg-white text-black font-bold py-3 rounded-lg hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2">
              <Chrome className="w-5 h-5" /> Google
            </button>
          </>
        )}

        <div className="mt-6 text-center text-sm text-zinc-400">
          {mode === 'login' ? (
            <>Don't have an account? <button onClick={() => setMode('signup')} className="text-brand font-bold hover:underline">Sign up</button></>
          ) : mode === 'signup' ? (
            <>Already have an account? <button onClick={() => setMode('login')} className="text-brand font-bold hover:underline">Sign in</button></>
          ) : (
            <button onClick={() => setMode('login')} className="text-brand font-bold hover:underline">Back to Sign In</button>
          )}
        </div>
      </div>
    </div>
  );
}
