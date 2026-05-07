import { ArrowRight, Check, Shield, Zap, FileText, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

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
          Stop signing <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-400 to-cyan-300">blind.</span>
        </h1>
        <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
          Upload any contract, NDA, or terms of service. Our AI acts as your personal legal team, instantly extracting hidden red flags and plain-English summaries so you can sign with confidence.
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
            <h3 className="text-xl font-bold">High-Speed Inference</h3>
            <p className="text-gray-400">Powered by Llama 3.3 70B for sub-second text processing on documents up to 50,000 characters.</p>
          </div>
          <div className="space-y-4">
            <div className="bg-red-900/20 w-12 h-12 rounded-lg flex items-center justify-center border border-red-800/50">
              <Shield className="text-red-400" />
            </div>
            <h3 className="text-xl font-bold">Deep Clause Extraction</h3>
            <p className="text-gray-400">Our engine identifies non-competes, indemnity traps, and IP grabs that generic AI models overlook.</p>
          </div>
          <div className="space-y-4">
            <div className="bg-green-900/20 w-12 h-12 rounded-lg flex items-center justify-center border border-green-800/50">
              <FileText className="text-green-400" />
            </div>
            <h3 className="text-xl font-bold">Premium Quota</h3>
            <p className="text-gray-400">Pro members receive a massive token allowance, enough to analyze thousands of pages per month.</p>
          </div>
        </div>
      </section>

      {/* Pricing / CTA Section */}
      <section className="py-24 px-6 bg-gray-900/20">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-black tracking-tighter sm:text-5xl mb-4">DEPLOY VIGILATE</h2>
          <p className="text-gray-500 max-w-2xl mx-auto">
            Start auditing contracts for free, or unlock enterprise-grade surveillance capacity for your entire operation.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            
            {/* --- FREE TIER CARD --- */}
            <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8 flex flex-col transition hover:border-gray-700">
              <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-300 mb-2">Reconnaissance</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-black text-white">$0</span>
                  <span className="text-gray-500 text-sm">/ forever</span>
                </div>
                <p className="text-gray-500 text-sm mt-4">Essential legal intelligence for individuals and quick checks.</p>
              </div>

              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-center gap-3 text-sm text-gray-300">
                  <Check className="w-5 h-5 text-gray-600" /> 5 AI Scans per day
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-300">
                  <Check className="w-5 h-5 text-gray-600" /> PDF & DOCX File Support
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-300">
                  <Check className="w-5 h-5 text-gray-600" /> Basic Risk Scoring (1-10)
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-300">
                  <Check className="w-5 h-5 text-gray-600" /> 24-Hour Audit History
                </li>
              </ul>

              <button 
                onClick={() => navigate('/login')}
                className="w-full bg-gray-800 hover:bg-gray-700 text-white font-bold py-4 rounded-xl transition"
              >
                Start Scanning
              </button>
            </div>

            {/* --- PRO TIER CARD --- */}
            <div className="bg-gray-800 border border-blue-500/50 rounded-3xl p-8 flex flex-col shadow-2xl shadow-blue-900/20 relative overflow-hidden transform md:-translate-y-4">
              {/* Glowing Accent Top - TYPO FIXED HERE */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-cyan-300"></div>
              
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-xl font-bold text-blue-400">Command Center</h3>
                  <span className="bg-blue-900/30 text-blue-300 text-[10px] uppercase tracking-wider px-3 py-1 rounded-full border border-blue-500/30 flex items-center gap-1">
                    <Zap className="w-3 h-3" /> Recommended
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-black text-white">$19</span>
                  <span className="text-gray-500 text-sm">/ month</span>
                </div>
                <p className="text-gray-400 text-sm mt-4">Massive surveillance capacity for professionals and high-volume operations.</p>
              </div>

              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-center gap-3 text-sm text-white">
                  <Shield className="w-5 h-5 text-blue-400" /> Bypass daily scan limits
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-300">
                  <Check className="w-5 h-5 text-blue-500" /> Deep Clause Extraction
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-300">
                  <Check className="w-5 h-5 text-blue-500" /> Unlimited Persistent Audit History
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-300">
                  <Check className="w-5 h-5 text-blue-500" /> Professional PDF & TXT Exports
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-300">
                  <Check className="w-5 h-5 text-blue-500" /> Priority Llama-3.3 Inference
                </li>
              </ul>

              <button 
                onClick={() => navigate('/login?intent=purchase')}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-900/50 transition transform hover:scale-[1.02]"
              >
                Upgrade to Pro
              </button>
            </div>

        </div>
      </section>

      {/* --- LEGAL FOOTER --- */}
          <footer className="mt-16 pt-8 border-t border-gray-800 text-center text-xs text-gray-600 pb-4">
            <p className="mb-2">© 2026 Vigilate Intelligence. All rights reserved.</p>
            <div className="flex justify-center gap-4">
              <a href="/privacy" className="hover:text-blue-400 transition">Privacy Policy</a>
              <a href="/terms" className="hover:text-blue-400 transition">Terms of Service</a>
            </div>
            <p className="mt-4 max-w-xl mx-auto opacity-50">
              Disclaimer: Vigilate provides AI-assisted text analysis and clause extraction. 
              It does not constitute legal advice. No attorney-client relationship is formed. 
              Always consult with qualified legal counsel before signing binding agreements.
            </p>
          </footer>
    </div>
  );
}