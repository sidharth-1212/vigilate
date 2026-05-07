import { Shield, LogOut, LayoutDashboard, Crown } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export default function Navbar({ isPro }) {
  const location = useLocation();
  const hasToken = !!localStorage.getItem('token');

  const handleLogout = () => {
    localStorage.removeItem('token');
    // Force a hard refresh to the landing page to clear all app state
    window.location.href = '/'; 
  };

  return (
    <nav className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
        {/* Logo */}
        <Link to="/" className="text-2xl font-black flex items-center gap-3 hover:opacity-80 transition tracking-tighter group">
        {/* Increased icon size and stroke for more "weight" */}
            <Shield className="text-blue-500 w-10 h-10 group-hover:scale-110 transition-transform" strokeWidth={2.5} />
            <span className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                VIGILATE
            </span>
        </Link>
        
        <div className="flex items-center gap-2 sm:gap-4">
          {hasToken ? (
            /* --- SIGNED IN STATE --- */
            <>
              {/* Dashboard Button (Hidden if already on dashboard) */}
              {location.pathname !== '/dashboard' && (
                <Link to="/dashboard" className="flex items-center gap-2 text-gray-300 hover:text-white transition px-3 py-2 text-sm font-medium">
                  <LayoutDashboard className="w-4 h-4" />
                  <span className="hidden sm:inline">Dashboard</span>
                </Link>
              )}

              {/* Upgrade Button (Hidden if already Pro) */}
              {!isPro && (
                <Link 
                  to="/dashboard?triggerCheckout=true" 
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-bold transition shadow-lg"
                >
                  <Crown className="w-4 h-4" />
                  Upgrade
                </Link>
              )}

              {/* Log Out */}
              <button 
                onClick={handleLogout}
                className="flex items-center gap-2 text-gray-400 hover:text-red-400 transition px-3 py-2 text-sm font-medium"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Log Out</span>
              </button>
            </>
          ) : (
            /* --- SIGNED OUT STATE --- */
            <>
              <Link to="/login" className="text-gray-300 hover:text-white transition px-4 py-2 text-sm font-medium">
                Log In
              </Link>
              <Link to="/login" className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-bold transition">
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}