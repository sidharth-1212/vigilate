import { useState } from 'react';
import { 
  UploadCloud, AlertTriangle, FileText, Loader2, LogOut, Shield, CheckCircle 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';

export default function Dashboard() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const [showPaywall, setShowPaywall] = useState(false);
  const queryParameters = new URLSearchParams(window.location.search);
  const paymentSuccess = queryParameters.get("payment") === "success";

  // The Logout Function
  const handleLogout = () => {
    localStorage.removeItem('token'); // Destroy the key
    window.location.href = '/login';  // Force redirect and clear React state
  };

  const handleUpgrade = async () => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}api/engine/checkout/`, {
      method: 'POST',
      headers: { 'Authorization': `Token ${token}` }
    });
    const data = await response.json();
    if (data.checkout_url) {
      window.location.href = data.checkout_url; // Send them to Dodo!
    } else {
      setError("Payment gateway is temporarily down.");
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setError("");
    setResult("");

    const formData = new FormData();
    formData.append('file', file);

    try {
      // Get the token to prove we are allowed to use the AI
      const token = localStorage.getItem('token');

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/engine/summarize/`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}` // <--- IMPORTANT: We added the Auth header!
        },
        body: formData,
      });

      const data = await response.json();
      
      if (response.ok) {
        setResult(data.analysis);
      } else {
        // Trigger the upgrade UI for free users
        if (data.error === "DAILY_LIMIT_REACHED") {
            setShowPaywall(true); 
        } 
        // Show a standard error if a Pro user hits their $19 token limit
        else if (data.error === "QUOTA_EXCEEDED") {
            setError("You have reached your maximum API spend quota of $19.");
        } 
        // Catch all other errors
        else {
            setError(data.error || data.detail || JSON.stringify(data) || "Something went wrong parsing the document.");
        }
      }
    } catch (err) {
      setError("Failed to connect to the AI engine.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans">
      
      {/* --- NEW Top Navigation Bar --- */}
      <nav className="border-b border-gray-800 bg-gray-900/50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="text-xl font-bold flex items-center gap-2">
            <Shield className="text-blue-500 w-6 h-6" />
            Vigilate
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition px-4 py-2 rounded-lg hover:bg-gray-800"
          >
            <LogOut className="w-4 h-4" />
            Log Out
          </button>
        </div>
      </nav>

      {paymentSuccess && (
          <div className="mb-6 bg-green-900/30 border border-green-500 text-green-200 p-4 rounded-lg flex items-center animate-bounce">
            <CheckCircle className="mr-3 text-green-400" />
            Payment Successful! Your account is being upgraded.
          </div>
        )}

      {/* Main Content */}
      <div className="max-w-4xl mx-auto pt-12 px-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Contract Summarizer</h1>
          <p className="text-gray-400">Upload a PDF to instantly extract red flags and plain-English summaries.</p>
        </div>

        {/* Upload Box */}
        <form onSubmit={handleUpload} className="bg-gray-800 p-8 rounded-xl border border-gray-700 text-center shadow-lg">
          <UploadCloud className="mx-auto h-12 w-12 text-blue-500 mb-4" />
          <input 
            type="file" 
            accept=".pdf"
            onChange={(e) => setFile(e.target.files[0])}
            className="mb-4 block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
          />
          <button 
            type="submit" 
            disabled={!file || loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg disabled:opacity-50 flex justify-center items-center transition"
          >
            {loading ? <Loader2 className="animate-spin mr-2" /> : "Scan Document"}
          </button>
        </form>

        {/* Error State */}
        {error && (
          <div className="mt-6 bg-red-900/50 border border-red-500 text-red-200 p-4 rounded-lg flex items-center shadow-lg">
            <AlertTriangle className="mr-3 text-red-400 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Paywall State */}
        {showPaywall && (
          <div className="mt-8 bg-gradient-to-b from-blue-900/40 to-gray-900 border border-blue-500/30 p-8 rounded-xl text-center shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-cyan-300"></div>
            <Shield className="mx-auto h-12 w-12 text-blue-400 mb-4" />
            <h2 className="text-2xl font-bold mb-2">Daily Limit Reached!</h2>
            <p className="text-gray-400 mb-6">You've used your 10 free scans for today. Upgrade to Pro to unlock a $19 premium AI token allowance and analyze massive legal documents without restrictions.</p>
            <button 
              onClick={handleUpgrade}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-8 rounded-full shadow-lg transition transform hover:scale-105"
            >
              Upgrade to Pro - $19
            </button>
          </div>
        )}

        {/* Result State */}
        {result && (
          <div className="mt-8 bg-gray-800 border border-gray-700 rounded-xl p-6 shadow-lg mb-12">
            <h2 className="text-xl font-bold flex items-center mb-4 border-b border-gray-700 pb-4">
              <FileText className="mr-2 text-green-400" /> AI Analysis Result
            </h2>
            {/* The 'prose' class magically styles the Markdown! */}
            <div className="prose prose-invert prose-blue max-w-none">
                <ReactMarkdown>{result}</ReactMarkdown>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}