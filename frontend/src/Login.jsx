import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Loader2, ArrowRight } from 'lucide-react';
import { login, register } from './api/auth';

export default function Login() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(window.location.search);
  const intent = searchParams.get('intent');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegistering) {
        await register(email, password);
      } else {
        await login(email, password);
      }
      
      if (intent === 'purchase') {
        window.location.href = '/dashboard?triggerCheckout=true';
      } else {
        window.location.href = '/dashboard';
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false); 
    }
  };

  return (
    <div className="min-h-screen bg-[#080c14] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative" style={{ fontFamily: "'system-ui', sans-serif" }}>

      {/* Background grid */}
      <div className="fixed inset-0 pointer-events-none" style={{
        backgroundImage: `linear-gradient(rgba(59,130,246,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.03) 1px, transparent 1px)`,
        backgroundSize: '80px 80px'
      }} />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(ellipse at center, rgba(59,130,246,0.06) 0%, transparent 70%)' }} />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        {/* Logo */}
        <a href="/" className="flex items-center justify-center gap-2.5 mb-8 group">
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center group-hover:border-blue-500/60 transition-colors">
            <Shield className="w-4 h-4 text-blue-400" />
          </div>
          <span className="text-white font-semibold tracking-tight" style={{ fontFamily: "'Georgia', serif" }}>Vigilate</span>
        </a>

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white tracking-tight" style={{ fontFamily: "'Georgia', serif" }}>
            {isRegistering ? 'Create your account' : 'Welcome back'}
          </h1>
          <p className="text-slate-500 text-sm mt-1.5">
            {isRegistering ? 'Start auditing legal documents today.' : 'Sign in to your Vigilate account.'}
          </p>
        </div>

        <div className="bg-[#0c1220] border border-slate-800 rounded-2xl p-8 shadow-2xl shadow-black/40">
          
          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="text-red-400 text-xs bg-red-500/8 border border-red-500/20 p-3.5 rounded-xl leading-relaxed">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-400 tracking-wide uppercase">
                Email address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="block w-full border border-slate-700/80 rounded-xl py-3 px-4 bg-slate-900/60 text-white text-sm placeholder:text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500/60 focus:border-blue-500/60 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-400 tracking-wide uppercase">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="block w-full border border-slate-700/80 rounded-xl py-3 px-4 bg-slate-900/60 text-white text-sm placeholder:text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500/60 focus:border-blue-500/60 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-900/20 mt-2"
            >
              {loading
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <>
                    {isRegistering ? 'Create Account' : 'Sign In'}
                    <ArrowRight className="w-4 h-4" />
                  </>
              }
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-800 text-center">
            <button
              onClick={() => setIsRegistering(!isRegistering)}
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              {isRegistering
                ? <>Already have an account? <span className="text-blue-400 hover:text-blue-300">Sign in</span></>
                : <>Don't have an account? <span className="text-blue-400 hover:text-blue-300">Create one</span></>
              }
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-slate-700 mt-6">
          By continuing, you agree to our{' '}
          <a href="/terms" className="text-slate-600 hover:text-slate-400 underline transition-colors">Terms</a>
          {' '}and{' '}
          <a href="/privacy" className="text-slate-600 hover:text-slate-400 underline transition-colors">Privacy Policy</a>.
        </p>
      </div>
    </div>
  );
}