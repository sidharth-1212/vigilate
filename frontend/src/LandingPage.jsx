import { ArrowRight, Shield, Zap, FileText, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function LandingPage() {
  const navigate = useNavigate();

  const handleAuthRoute = () => {
    const hasToken = !!localStorage.getItem('token');
    if (hasToken) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans selection:bg-blue-500/30">
      {/* Navigation */}
      <nav className="container mx-auto px-6 py-6 flex justify-between items-center">
        <div className="text-2xl font-bold tracking-tighter flex items-center gap-2">
          <Shield className="text-blue-500" />
          ClearContract AI
        </div>
        <div className="space-x-4">
          <button onClick={handleAuthRoute} className="text-gray-300 hover:text-white transition">Login</button>
          <button onClick={handleAuthRoute} className="bg-blue-600 hover:bg-blue-700 px-5 py-2 rounded-lg font-medium transition">
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="container mx-auto px-6 pt-24 pb-32 text-center max-w-4xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-900/30 text-blue-400 text-sm font-medium mb-8 border border-blue-800/50">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
          </span>
          SambaNova Llama 3.3 Powered
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-tight">
          Stop signing <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">blind.</span>
        </h1>
        <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
          Upload any freelance contract, NDA, or terms of service. Our AI acts as your personal legal team, instantly extracting hidden red flags and plain-English summaries so you can sign with confidence.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <button onClick={handleAuthRoute} className="bg-white text-gray-900 px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-100 transition flex items-center justify-center gap-2">
            Scan a Document <ArrowRight className="w-5 h-5" />
          </button>
          <button className="px-8 py-4 rounded-xl font-bold text-lg border border-gray-700 hover:bg-gray-800 transition">
            View Sample Report
          </button>
        </div>
      </header>

      {/* Value Prop Section */}
      <section className="border-y border-gray-800 bg-gray-900/50 py-24">
        <div className="container mx-auto px-6 grid md:grid-cols-3 gap-12">
          <div className="space-y-4">
            <div className="bg-blue-900/20 w-12 h-12 rounded-lg flex items-center justify-center border border-blue-800/50">
              <Zap className="text-blue-400" />
            </div>
            <h3 className="text-xl font-bold">Instant Analysis</h3>
            <p className="text-gray-400">No waiting for lawyers. Get a complete breakdown of obligations and risks in under 5 seconds.</p>
          </div>
          <div className="space-y-4">
            <div className="bg-red-900/20 w-12 h-12 rounded-lg flex items-center justify-center border border-red-800/50">
              <Shield className="text-red-400" />
            </div>
            <h3 className="text-xl font-bold">Red Flag Detection</h3>
            <p className="text-gray-400">We highlight non-competes, one-sided indemnity clauses, and IP grabs before they ruin your business.</p>
          </div>
          <div className="space-y-4">
            <div className="bg-green-900/20 w-12 h-12 rounded-lg flex items-center justify-center border border-green-800/50">
              <FileText className="text-green-400" />
            </div>
            <h3 className="text-xl font-bold">Plain English</h3>
            <p className="text-gray-400">Legalese translated into language a human can actually understand. Know exactly what you're agreeing to.</p>
          </div>
        </div>
      </section>

      {/* Pricing / CTA Section */}
      <section className="container mx-auto px-6 py-32 text-center max-w-3xl">
        <h2 className="text-4xl font-bold mb-6">Skip the $400/hr legal fees.</h2>
        <p className="text-gray-400 text-lg mb-12">Get unlimited contract scans and protect your freelance business today.</p>
        
        <div className="bg-gray-800 rounded-3xl p-8 border border-gray-700 max-w-md mx-auto shadow-2xl">
          <div className="text-5xl font-extrabold mb-2">$19<span className="text-xl text-gray-500 font-medium">/mo</span></div>
          <p className="text-gray-400 mb-8">Cancel anytime. Global payments accepted.</p>
          
          <ul className="space-y-4 mb-8 text-left text-gray-300">
            <li className="flex gap-3"><CheckCircle className="text-blue-500 w-5 h-5 shrink-0" /> Unlimited PDF contract scans</li>
            <li className="flex gap-3"><CheckCircle className="text-blue-500 w-5 h-5 shrink-0" /> Real-time red flag extraction</li>
            <li className="flex gap-3"><CheckCircle className="text-blue-500 w-5 h-5 shrink-0" /> Plain-English summaries</li>
          </ul>
          
          <button onClick={handleAuthRoute} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition">
            Start Free Trial
          </button>
        </div>
      </section>
    </div>
  );
}