import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  UploadCloud, AlertTriangle, FileText, Loader2, Shield, CheckCircle, 
  History, Plus, Download, Trash2, Zap, User, Settings // <-- Added User & Settings
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { jsPDF } from "jspdf";

export default function Dashboard() {
  const location = useLocation();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [scans, setScans] = useState([]);
  const [currentScore, setCurrentScore] = useState(null);
  const [activeScanId, setActiveScanId] = useState(null); // <-- NEW: Tracks current scan
  const [showPaywall, setShowPaywall] = useState(false);
  const [terminalLogs, setTerminalLogs] = useState([]);
  const [isPro, setIsPro] = useState(false);

  
  const token = localStorage.getItem('token');
  const queryParameters = new URLSearchParams(window.location.search);
  const paymentSuccess = queryParameters.get("payment") === "success";

  const [currentView, setCurrentView] = useState('scanner'); // 'scanner' or 'profile'
  const [profileData, setProfileData] = useState({ first_name: '', last_name: '', email: '' });
  const [saveMessage, setSaveMessage] = useState('');

  const [cancelAtEnd, setCancelAtEnd] = useState(false);
  const [billingDate, setBillingDate] = useState("");

  const handleNewScan = () => {
    setFile(null);
    setResult("");
    setError("");
    setTerminalLogs([]);
    setCurrentScore(null);
    setActiveScanId(null);
    setShowPaywall(false);
    setCurrentView('scanner'); // Forces them back to the scanner tab if they were on their profile
  };

  const fetchProfile = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/engine/profile/`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      const data = await response.json();
      setIsPro(data.is_pro);
      setProfileData({
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        email: data.email || ''
      });
      
      // NEW: Save billing dates
      setCancelAtEnd(data.cancel_at_period_end || false);
      if (data.billing_date) {
        // Format the date to look nice (e.g., "June 7, 2026")
        setBillingDate(new Date(data.billing_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }));
      } else {
        setBillingDate("");
      }
    } catch (err) {
      console.error("Failed to fetch profile");
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/engine/profile/`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ first_name: profileData.first_name, last_name: profileData.last_name })
      });
      if (response.ok) {
        setSaveMessage("Profile updated successfully.");
        setTimeout(() => setSaveMessage(""), 3000);
      }
    } catch (err) {
      setError("Failed to update profile.");
    }
  };

  const handleCancelSubscription = async () => {
    if (!window.confirm("Are you sure you want to cancel your subscription? You will retain access until the end of your current billing cycle.")) return;
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/engine/profile/cancel/`, {
        method: 'POST',
        headers: { 'Authorization': `Token ${token}` }
      });
      if (response.ok) {
        alert("Auto-renew cancelled successfully. You will remain on the Pro tier until the end of your cycle.");
        fetchProfile(); // <-- ADD THIS LINE: Refreshes the UI instantly
      }
    } catch (err) {
      setError("Failed to cancel subscription.");
    }
  };

  // --- UI Components ---
  const RiskScorecard = ({ score }) => {
    const getColor = (s) => {
      if (s <= 3) return 'text-green-400';
      if (s <= 7) return 'text-yellow-400';
      return 'text-red-400';
    };
    return (
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 mb-8 flex items-center justify-between shadow-2xl backdrop-blur-md">
        <div>
          <h3 className="text-xs uppercase tracking-widest text-gray-500 font-bold mb-1">System Risk Assessment</h3>
          <p className="text-gray-400 text-xs">Automated clause surveillance complete.</p>
        </div>
        <div className={`text-5xl font-black ${getColor(score)} tabular-nums`}>
          {score}<span className="text-xl text-gray-600">/10</span>
        </div>
      </div>
    );
  };

  // --- Logic ---
  const addLog = (message) => {
    setTerminalLogs(prev => [...prev, `> ${new Date().toLocaleTimeString()}: ${message}`].slice(-5));
  };

  const fetchHistory = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/engine/history/`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      const data = await response.json();
      setScans(data);
    } catch (err) {
      console.error("Failed to fetch history");
    }
  };

  // --- NEW: Delete Logic ---
  const handleDelete = async (id, e) => {
    if (e) e.stopPropagation(); // Prevents clicking the sidebar button from triggering the select
    
    if (!window.confirm("Delete this surveillance report permanently?")) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/engine/history/${id}/`, {
        method: 'DELETE',
        headers: { 'Authorization': `Token ${token}` }
      });

      if (response.ok) {
        // Remove from sidebar instantly
        setScans(prev => prev.filter(scan => scan.id !== id));
        
        // If the deleted scan is currently open on the main stage, clear it
        if (activeScanId === id) {
          setResult("");
          setCurrentScore(null);
          setActiveScanId(null);
        }
      } else {
        setError("Failed to delete record.");
      }
    } catch (err) {
      setError("Network error while deleting.");
    }
  };

  const handleUpgrade = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/engine/checkout/`, {
        method: 'POST',
        headers: { 'Authorization': `Token ${token}` }
      });
      const data = await response.json();
      
      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      } else {
        setError("Failed to generate checkout link.");
      }
    } catch (err) {
      setError("Failed to connect to the payment gateway.");
    }
  };

  useEffect(() => {
    fetchHistory();
    fetchProfile(); 
  }, []);

  // 2. URL Change Listener (Runs whenever the URL updates)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('triggerCheckout') === 'true') {
      handleUpgrade();
    }
  }, [location.search]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setError("");
    setResult("");
    setTerminalLogs([]);
    setCurrentScore(null);
    setActiveScanId(null);
    setShowPaywall(false);

    addLog("Initializing Llama-3.3-70B engine...");
    setTimeout(() => addLog("Parsing PDF layers and page markers..."), 1000);
    setTimeout(() => addLog("Running deep clause extraction..."), 2500);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/engine/summarize/`, {
        method: 'POST',
        headers: { 'Authorization': `Token ${token}` },
        body: formData,
      });

      const data = await response.json();
      
      if (response.ok) {
        setResult(data.analysis);
        setCurrentScore(data.risk_score);
        setActiveScanId(data.scan_id); // <-- NEW: Save the active ID
        fetchHistory(); 
      } else {
        if (data.error === "DAILY_LIMIT_REACHED") setShowPaywall(true);
        else if (data.error === "QUOTA_EXCEEDED") setError("Usage limit reached ($19 quota).");
        else setError(data.error || "Processing failed.");
      }
    } catch (err) {
      setError("Failed to connect to surveillance engine.");
    } finally {
      setLoading(false);
    }
  };

  const exportToTxt = () => {
    const blob = new Blob([result], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = "vigilate_audit_report.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const exportToPdf = () => {
    const doc = new jsPDF();
    const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const score = currentScore || "N/A"; 

    // --- Cover Header ---
    doc.setFillColor(17, 24, 39); 
    doc.rect(0, 0, 210, 40, 'F');
    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    doc.setTextColor(59, 130, 246); 
    doc.text("VIGILATE", 20, 25);
    doc.setFontSize(10);
    doc.setTextColor(156, 163, 175); 
    doc.text("LEGAL SURVEILLANCE & CLAUSE EXTRACTION", 20, 32);

    // --- Score Header ---
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.text(`Scan Date: ${date}`, 20, 55);
    doc.text("Risk Score:", 20, 65);
    const scoreColor = score <= 3 ? [34, 197, 94] : score <= 7 ? [234, 179, 8] : [239, 68, 68];
    doc.setTextColor(scoreColor[0], scoreColor[1], scoreColor[2]);
    doc.setFontSize(18);
    doc.text(`${score}/10`, 45, 65);

    doc.setDrawColor(229, 231, 235); 
    doc.line(20, 75, 190, 75);

    // --- Body Text with Pagination ---
    doc.setTextColor(31, 41, 55); 
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);

    const cleanResult = result.replace(/### /g, '').replace(/\*\*/g, '').replace(/RISK_SCORE: \d+/g, ''); 
    const splitText = doc.splitTextToSize(cleanResult, 170);
    
    let y = 85; // Starting height
    for (let i = 0; i < splitText.length; i++) {
      if (y > 280) { // If we hit the bottom of the A4 page
        doc.addPage();
        y = 20; // Reset Y to the top of the new page
      }
      doc.text(splitText[i], 20, y);
      y += 6; // Move down 6 units for the next line
    }
    
    doc.save(`vigilate_report_${new Date().getTime()}.pdf`);
  };

  return (
    <div className="flex h-screen bg-gray-900 text-white overflow-hidden">
      
      {/* --- SIDEBAR --- */}
      <aside className="w-80 border-r border-gray-800 bg-gray-900/50 backdrop-blur-xl flex flex-col">
        <div className="p-4 border-b border-gray-800 flex gap-2">
          <button 
            onClick={() => setCurrentView('scanner')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition ${currentView === 'scanner' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
          >
            <Shield className="w-4 h-4" /> Scanner
          </button>
          <button 
            onClick={() => setCurrentView('profile')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition ${currentView === 'profile' ? 'bg-gray-700 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
          >
            <User className="w-4 h-4" /> Profile
          </button>
        </div>

        {/* --- NEW: GLOBAL 'NEW SCAN' BUTTON --- */}
        <div className="p-4 border-b border-gray-800">
          <button 
            onClick={handleNewScan}
            className="w-full bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/30 text-blue-400 font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition shadow-inner"
          >
            <Plus className="w-4 h-4" /> New Surveillance Scan
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
          {scans.length === 0 && <p className="text-gray-600 text-xs text-center mt-10">No documents indexed yet.</p>}
          {scans.map((scan) => (
            <button 
              key={scan.id} 
              onClick={() => {
                setResult(scan.analysis); 
                setCurrentScore(scan.risk_score);
                setActiveScanId(scan.id); // Set the active scan when clicked from history
                setCurrentView('scanner');
              }}
              className={`w-full text-left p-3 rounded-lg transition border group flex justify-between items-start ${activeScanId === scan.id ? 'bg-gray-800 border-gray-600' : 'hover:bg-gray-800 border-transparent hover:border-gray-700'}`}
            >
              <div className="truncate pr-2 overflow-hidden">
                <div className="text-sm font-medium text-gray-300 group-hover:text-white truncate">{scan.filename}</div>
                <div className="text-[10px] text-gray-600 uppercase mt-1">{scan.date} • Risk: {scan.risk_score}/10</div>
              </div>
              
              {/* SIDEBAR DELETE ICON */}
              <div 
                onClick={(e) => handleDelete(scan.id, e)} 
                className="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition p-1 rounded hover:bg-gray-700"
              >
                <Trash2 className="w-4 h-4" />
              </div>
            </button>
          ))}
        </div>
      </aside>

      {/* --- MAIN STAGE --- */}
      <main className="flex-1 overflow-y-auto bg-linear-to-b from-gray-900 to-black p-8 relative">
        <div className="max-w-4xl mx-auto">

          {/* RENDER PROFILE VIEW */}
          {currentView === 'profile' && (
            <div className="animate-in fade-in duration-500">
              <h2 className="text-3xl font-black mb-8 tracking-tighter flex items-center gap-3">
                <Settings className="text-blue-500" /> Account Settings
              </h2>
              
              <div className="grid md:grid-cols-2 gap-8">
                
                {/* Profile Form */}
                <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-8">
                  <h3 className="text-xl font-bold mb-6">Personal Information</h3>
                  <form onSubmit={handleSaveProfile} className="space-y-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Email (Read Only)</label>
                      <input type="email" disabled value={profileData.email} className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-gray-500 cursor-not-allowed" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">First Name</label>
                        <input type="text" value={profileData.first_name} onChange={(e) => setProfileData({...profileData, first_name: e.target.value})} className="w-full bg-gray-900 border border-gray-700 focus:border-blue-500 rounded-lg px-4 py-3 outline-none transition" />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">Last Name</label>
                        <input type="text" value={profileData.last_name} onChange={(e) => setProfileData({...profileData, last_name: e.target.value})} className="w-full bg-gray-900 border border-gray-700 focus:border-blue-500 rounded-lg px-4 py-3 outline-none transition" />
                      </div>
                    </div>
                    <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition mt-4">
                      Save Changes
                    </button>
                    {saveMessage && <p className="text-green-400 text-sm text-center mt-2">{saveMessage}</p>}
                  </form>
                </div>

                {/* Subscription Card */}
                <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-8 flex flex-col">
                  <h3 className="text-xl font-bold mb-6">Subscription Tier</h3>
                  
                  {isPro ? (
                    <div className="flex-1 flex flex-col">
                      <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-6 mb-6 flex-1">
                        
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <div className="text-blue-400 font-bold mb-1 flex items-center gap-2"><Zap className="w-4 h-4"/> Command Center Pro</div>
                            <div className="text-3xl font-black text-white">$19<span className="text-sm text-gray-500 font-normal">/mo</span></div>
                          </div>
                          
                          {/* CONDITIONAL BADGE */}
                          {cancelAtEnd ? (
                            <span className="bg-yellow-500/20 text-yellow-400 text-xs px-2 py-1 rounded border border-yellow-500/50 uppercase tracking-widest">Cancelling</span>
                          ) : (
                            <span className="bg-green-500/20 text-green-400 text-xs px-2 py-1 rounded border border-green-500/50 uppercase tracking-widest">Active</span>
                          )}
                        </div>
                        
                        {/* CONDITIONAL DATE TEXT */}
                        {billingDate && (
                          cancelAtEnd ? (
                            <p className="text-sm text-yellow-400 mb-4 font-bold tracking-wide">Expires on: {billingDate}</p>
                          ) : (
                            <p className="text-sm text-gray-300 mb-4 font-bold tracking-wide">Next billing date: {billingDate}</p>
                          )
                        )}
                        
                        <p className="text-sm text-gray-400">You have unlimited scanning capacity and access to deep clause extraction.</p>
                      </div>

                      {/* CONDITIONAL CANCEL BUTTON - Hides if already cancelled */}
                      {!cancelAtEnd && (
                        <button onClick={handleCancelSubscription} className="w-full bg-red-900/20 border border-red-900/50 hover:bg-red-900/40 text-red-400 font-bold py-3 rounded-xl transition mt-auto">
                          Cancel Auto-Renew
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col">
                      <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 mb-6 flex-1">
                        <div className="text-gray-300 font-bold mb-1">Reconnaissance (Free)</div>
                        <div className="text-3xl font-black text-white mb-4">$0</div>
                        
                        {/* --- TEXT TWEAK HERE --- */}
                        <p className="text-sm text-gray-500 mb-2">You are limited to 5 basic scans per month.</p>
                      </div>
                      <button onClick={handleUpgrade} className="w-full bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-500 hover:to-blue-700 text-white font-bold py-3 rounded-xl shadow-lg transition">
                        Upgrade to Pro
                      </button>
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}
          
          {currentView === 'scanner' && (
            <>
            {paymentSuccess && (
              <div className="mb-6 bg-green-900/20 border border-green-500/50 text-green-400 p-4 rounded-xl flex items-center animate-in fade-in slide-in-from-top-4">
                <CheckCircle className="mr-3" /> Account Upgraded Successfully
              </div>
            )}

            {!result && !loading && !showPaywall && (
              <div className="mt-12 text-center">
                <h1 className="text-4xl font-black mb-4 tracking-tighter">SURVEILLANCE MODE</h1>
                <p className="text-gray-500 mb-12">Upload a legal instrument to begin deep clause extraction.</p>
                
                <form onSubmit={handleUpload} className="max-w-xl mx-auto bg-gray-800/40 p-12 rounded-2xl border border-gray-700/50 border-dashed hover:border-blue-500/50 transition">
                  <UploadCloud className="mx-auto h-16 w-16 text-gray-600 mb-6" />
                  <input 
                    type="file" 
                    accept=".pdf, .docx, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document" 
                    onChange={(e) => setFile(e.target.files[0])}
                    className="mb-8 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:bg-blue-600/10 file:text-blue-400 file:border-0 font-mono"
                  />
                  <button 
                    type="submit" disabled={!file}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl shadow-xl shadow-blue-900/20 transition disabled:opacity-30"
                  >
                    START ANALYSIS
                  </button>
                </form>
              </div>
            )}

            {loading && (
              <div className="max-w-2xl mx-auto mt-20 bg-black p-6 rounded-xl border border-gray-800 font-mono text-xs text-blue-400 shadow-2xl">
                <div className="flex items-center gap-2 mb-4 opacity-50"><div className="w-2 h-2 rounded-full bg-blue-500 animate-ping"></div> VIGILATE_CORE_INIT</div>
                {terminalLogs.map((log, i) => <div key={i} className="mb-1 opacity-70">{log}</div>)}
                <div className="mt-4 flex items-center gap-2 text-blue-200">
                  <Loader2 className="animate-spin w-4 h-4" /> INFERENCE IN PROGRESS...
                </div>
              </div>
            )}

            {result && (
              <div className="animate-in fade-in duration-700">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold flex items-center gap-3">
                    <FileText className="text-blue-500" /> Analysis Report
                  </h2>
                  <div className="flex gap-2">
                    
                    {/* MAIN STAGE DELETE BUTTON */}
                    {activeScanId && (
                      <button 
                        onClick={(e) => handleDelete(activeScanId, e)}
                        className="flex items-center gap-2 bg-red-900/20 text-red-400 border border-red-900/50 hover:bg-red-900/40 px-4 py-2 rounded-lg text-sm transition mr-2"
                      >
                        <Trash2 className="w-4 h-4" /> Purge
                      </button>
                    )}

                    {/* TIER FEATURE: Export Gating */}
                    {isPro ? (
                      <>
                        <button onClick={exportToTxt} className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg text-sm transition text-gray-300">
                          <Download className="w-4 h-4" /> .TXT
                        </button>
                        <button onClick={exportToPdf} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg text-sm font-bold transition shadow-lg shadow-blue-900/20">
                          <FileText className="w-4 h-4" /> Export PDF
                        </button>
                      </>
                    ) : (
                      <button 
                        onClick={handleUpgrade}
                        className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-500 hover:to-blue-700 px-4 py-2 rounded-lg text-sm font-bold transition shadow-lg"
                      >
                        <Zap className="w-4 h-4 text-yellow-400" /> Unlock Pro Exports
                      </button>
                    )}
                  </div>
                </div>

                <RiskScorecard score={currentScore || 5} />

                {/* REPLACED: Added the magic Tailwind selector to make blockquote bold text red */}
                <div className="mt-4 prose prose-invert max-w-none text-gray-300 leading-relaxed
                  prose-h3:text-2xl prose-h3:font-bold prose-h3:text-white prose-h3:border-b prose-h3:border-gray-800 prose-h3:pb-2 prose-h3:mt-12 prose-h3:mb-6
                  prose-strong:text-gray-200 
                  prose-ul:space-y-4 prose-li:text-gray-400 prose-li:marker:text-gray-600
                  prose-blockquote:bg-red-900/10 prose-blockquote:border-l-4 prose-blockquote:border-red-500 prose-blockquote:p-6 prose-blockquote:rounded-r-lg prose-blockquote:font-normal prose-blockquote:not-italic prose-blockquote:text-gray-300 prose-blockquote:my-8
                  prose-blockquote:before:content-none prose-blockquote:after:content-none
                  [&_blockquote_strong]:text-red-400
                ">
                  <ReactMarkdown>
                    {result.replace(/RISK_SCORE:\s*\d+/i, '').trim()}
                  </ReactMarkdown>
                </div>
              </div>
            )}
          

            {error && (
              <div className="mt-8 bg-red-900/20 border border-red-500/50 p-6 rounded-xl flex items-center gap-4 text-red-400 animate-in fade-in slide-in-from-bottom-4">
                <AlertTriangle className="w-8 h-8 shrink-0" />
                <div>
                  <h3 className="font-bold text-lg">System Error</h3>
                  <p>{error}</p>
                </div>
              </div>
            )}

            {showPaywall && (
              <div className="mt-12 bg-gray-800 border border-blue-500/30 p-8 rounded-xl text-center shadow-2xl relative overflow-hidden animate-in zoom-in duration-500">
                <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-blue-400 to-cyan-300"></div>
                <Shield className="mx-auto h-12 w-12 text-blue-400 mb-4" />
                <h2 className="text-2xl font-bold mb-2">Surveillance Limit Reached</h2>
                <p className="text-gray-400 mb-6">Upgrade to Pro to unlock premium AI token allowance and analyze massive legal documents without restrictions.</p>
                <button 
                  onClick={handleUpgrade}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-8 rounded-full shadow-lg transition transform hover:scale-105"
                >
                  Upgrade to Pro - $19
                </button>
              </div>
            )}
          </>)}
          
        </div>
      </main>
    </div>
  );
}