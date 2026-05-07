// frontend/src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'; // Added Navigate
import { useState, useEffect } from 'react'; // Added for Pro status check
import Navbar from './components/Navbar';
import LandingPage from './LandingPage';
import Login from './Login';
import Dashboard from './Dashboard';
import PrivacyPolicy from './PrivacyPolicy';
import TermsOfService from './TermsOfService';

export default function App() {
  const [isPro, setIsPro] = useState(false);
  const isAuthenticated = !!localStorage.getItem('token'); 

  // Optional: Fetch the user's real Pro status from your backend on mount
  // This ensures the Navbar knows if they are actually Pro
  useEffect(() => {
    const fetchProfile = async () => {
      if (!isAuthenticated) return;
      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/engine/profile/`, {
          headers: { 'Authorization': `Token ${localStorage.getItem('token')}` }
        });
        const data = await response.json();
        setIsPro(data.is_pro);
      } catch (err) {
        console.error("Failed to sync pro status");
      }
    };
    fetchProfile();
  }, [isAuthenticated]);

  return (
    <Router> {/* Use Router here to match your import */}
      <div className="min-h-screen bg-gray-900 text-white">
        <Navbar isPro={isPro} /> {/* Pass isPro to the Navbar */}
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route 
            path="/dashboard" 
            element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />} 
          />
          <Route path="/privacy" element={<PrivacyPolicy />}/>
          <Route path="/terms" element={<TermsOfService />} />
        </Routes>
      </div>
    </Router>
  );
}