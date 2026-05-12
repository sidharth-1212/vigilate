import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  UploadCloud, AlertTriangle, FileText, Loader2, Shield, CheckCircle, 
  History, Plus, Download, Trash2, Zap, User, Settings
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
  const [activeScanId, setActiveScanId] = useState(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const [terminalLogs, setTerminalLogs] = useState([]);
  const [isPro, setIsPro] = useState(false);

  const token = localStorage.getItem('token');
  const queryParameters = new URLSearchParams(window.location.search);
  const paymentSuccess = queryParameters.get("payment") === "success";

  const [currentView, setCurrentView] = useState('scanner');
  const [profileData, setProfileData] = useState({ first_name: '', last_name: '', email: '' });
  const [saveMessage, setSaveMessage] = useState('');

  const [cancelAtEnd, setCancelAtEnd] = useState(false);
  const [billingDate, setBillingDate] = useState("");

  const [isUpgrading, setIsUpgrading] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleNewScan = () => {
    setFile(null);
    setResult("");
    setError("");
    setTerminalLogs([]);
    setCurrentScore(null);
    setActiveScanId(null);
    setShowPaywall(false);
    setCurrentView('scanner');
  };

  const fetchProfile = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/engine/profile/`, {
        headers: { 'Authorization': `Token ${token}` }
      });

      if (response.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
        return;
      }

      const data = await response.json();
      setIsPro(data.is_pro);
      setProfileData({
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        email: data.email || ''
      });
      
      setCancelAtEnd(data.cancel_at_period_end || false);
      if (data.billing_date) {
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
    if (isSavingProfile) return;
    setIsSavingProfile(true);
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
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!window.confirm("Are you sure you want to cancel your subscription? You will retain access until the end of your current billing cycle.")) return;
    if (isCancelling) return;
    setIsCancelling(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/engine/profile/cancel/`, {
        method: 'POST',
        headers: { 'Authorization': `Token ${token}` }
      });
      if (response.ok) {
        alert("Auto-renew cancelled successfully. You will remain on the Pro tier until the end of your cycle.");
        fetchProfile();
      }
    } catch (err) {
      setError("Failed to cancel subscription.");
    } finally {
      setIsCancelling(false);
    }
  };

  // --- UI Components ---
  const RiskScorecard = ({ score }) => {
    const getStyle = (s) => {
      if (s <= 3) return { color: 'text-emerald-400', bg: 'bg-emerald-500/5', border: 'border-emerald-500/20', label: 'Low Risk', bar: 'bg-emerald-500' };
      if (s <= 7) return { color: 'text-amber-400', bg: 'bg-amber-500/5', border: 'border-amber-500/20', label: 'Moderate Risk', bar: 'bg-amber-500' };
      return { color: 'text-red-400', bg: 'bg-red-500/5', border: 'border-red-500/20', label: 'High Risk', bar: 'bg-red-500' };
    };
    const style = getStyle(score);
    return (
      <div className={`${style.bg} border ${style.border} rounded-xl p-5 mb-8 flex items-center justify-between`}>
        <div>
          <p className="text-[10px] uppercase tracking-[0.15em] text-slate-500 mb-1">Risk Assessment</p>
          <p className={`text-sm font-semibold ${style.color}`}>{style.label}</p>
          <div className="mt-2 flex gap-1">
            {[...Array(10)].map((_, i) => (
              <div key={i} className={`h-1 w-4 rounded-full transition-all ${i < score ? style.bar : 'bg-slate-800'}`} />
            ))}
          </div>
        </div>
        <div className={`text-5xl font-bold ${style.color} tabular-nums`} style={{ fontFamily: "'Georgia', serif" }}>
          {score}<span className="text-base text-slate-700 font-normal">/10</span>
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
      
      if (response.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
        return;
      }

      const data = await response.json();
      setScans(data);
    } catch (err) {
      console.error("Failed to fetch history");
    }
  };

  const handleDelete = async (id, e) => {
    if (e) e.stopPropagation();
    
    if (!window.confirm("Delete this surveillance report permanently?")) return;

    if (isDeleting) return;
    setIsDeleting(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/engine/history/${id}/`, {
        method: 'DELETE',
        headers: { 'Authorization': `Token ${token}` }
      });

      if (response.ok) {
        setScans(prev => prev.filter(scan => scan.id !== id));
        
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
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUpgrade = async () => {
    if (isUpgrading) return;
    setIsUpgrading(true);
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
        setIsUpgrading(false);
      }
    } catch (err) {
      setError("Failed to connect to the payment gateway.");
      setIsUpgrading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
    fetchProfile(); 
  }, []);

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
        setActiveScanId(data.scan_id);
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

    doc.setFillColor(17, 24, 39); 
    doc.rect(0, 0, 210, 40, 'F');
    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    doc.setTextColor(59, 130, 246); 
    doc.text("VIGILATE", 20, 25);
    doc.setFontSize(10);
    doc.setTextColor(156, 163, 175); 
    doc.text("LEGAL SURVEILLANCE & CLAUSE EXTRACTION", 20, 32);

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

    doc.setTextColor(31, 41, 55); 
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);

    const cleanResult = result.replace(/### /g, '').replace(/\*\*/g, '').replace(/RISK_SCORE: \d+/g, ''); 
    const splitText = doc.splitTextToSize(cleanResult, 170);
    
    let y = 85;
    for (let i = 0; i < splitText.length; i++) {
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
      doc.text(splitText[i], 20, y);
      y += 6;
    }
    
    doc.save(`vigilate_report_${new Date().getTime()}.pdf`);
  };

  return (
    <div className="flex h-screen bg-[#080c14] text-white overflow-hidden" style={{ fontFamily: "'system-ui', sans-serif" }}>

      {/* Sidebar */}
      <aside className="w-72 border-r border-slate-800/60 bg-[#0a0f1a] flex flex-col">
        
        {/* Nav tabs */}
        <div className="p-3 border-b border-slate-800/60 flex gap-1.5">
          <button
            onClick={() => setCurrentView('scanner')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
              currentView === 'scanner'
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/60'
            }`}
          >
            <Shield className="w-3.5 h-3.5" /> Scanner
          </button>
          <button
            onClick={() => setCurrentView('profile')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
              currentView === 'profile'
                ? 'bg-slate-700/60 text-white border border-slate-600/40'
                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/60'
            }`}
          >
            <User className="w-3.5 h-3.5" /> Profile
          </button>
        </div>

        {/* New Scan button */}
        <div className="p-3 border-b border-slate-800/60">
          <button
            onClick={handleNewScan}
            className="w-full bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 hover:border-slate-600 text-slate-300 text-xs font-medium py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all"
          >
            <Plus className="w-3.5 h-3.5" /> New Scan
          </button>
        </div>

        {/* Scan history */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {scans.length === 0 && (
            <div className="text-center mt-12 px-4">
              <History className="w-6 h-6 text-slate-700 mx-auto mb-2" />
              <p className="text-slate-600 text-xs">No documents scanned yet.</p>
            </div>
          )}
          {scans.map((scan) => (
            <button
              key={scan.id}
              onClick={() => {
                setResult(scan.analysis);
                setCurrentScore(scan.risk_score);
                setActiveScanId(scan.id);
                setCurrentView('scanner');
              }}
              className={`w-full text-left p-3 rounded-xl transition-all border group flex justify-between items-start ${
                activeScanId === scan.id
                  ? 'bg-slate-800/80 border-slate-600/60'
                  : 'hover:bg-slate-800/40 border-transparent hover:border-slate-700/40'
              }`}
            >
              <div className="truncate pr-2 overflow-hidden flex-1">
                <div className="text-xs font-medium text-slate-300 group-hover:text-white truncate">{scan.filename}</div>
                <div className="text-[10px] text-slate-600 mt-1 flex items-center gap-1.5">
                  <span>{scan.date}</span>
                  <span className="w-0.5 h-0.5 rounded-full bg-slate-700" />
                  <span className={`font-medium ${scan.risk_score >= 7 ? 'text-red-500' : scan.risk_score >= 4 ? 'text-amber-500' : 'text-emerald-500'}`}>
                    {scan.risk_score}/10
                  </span>
                </div>
              </div>
              <div
                onClick={(e) => handleDelete(scan.id, e)}
                className="text-slate-700 hover:text-red-400 opacity-0 group-hover:opacity-100 transition p-1 rounded-lg hover:bg-slate-700/50 flex-shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </div>
            </button>
          ))}
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto bg-[#080c14] p-8 relative">
        <div className="max-w-3xl mx-auto">

          {/* Profile View */}
          {currentView === 'profile' && (
            <div>
              <div className="flex items-center gap-3 mb-8">
                <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center">
                  <Settings className="w-4 h-4 text-slate-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white tracking-tight" style={{ fontFamily: "'Georgia', serif" }}>Account Settings</h2>
                  <p className="text-xs text-slate-500">Manage your profile and subscription.</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">

                {/* Profile Form */}
                <div className="bg-[#0c1220] border border-slate-800 rounded-2xl p-6">
                  <h3 className="text-sm font-semibold text-white mb-5 pb-4 border-b border-slate-800">Personal Information</h3>
                  <form onSubmit={handleSaveProfile} className="space-y-4">
                    <div>
                      <label className="block text-xs text-slate-500 mb-1.5 uppercase tracking-wide">Email (Read Only)</label>
                      <input type="email" disabled value={profileData.email}
                        className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-500 cursor-not-allowed text-sm" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-slate-500 mb-1.5 uppercase tracking-wide">First Name</label>
                        <input type="text" value={profileData.first_name} onChange={(e) => setProfileData({...profileData, first_name: e.target.value})}
                          className="w-full bg-slate-900/60 border border-slate-700/60 focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/20 rounded-xl px-4 py-2.5 outline-none transition text-sm text-white" />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-500 mb-1.5 uppercase tracking-wide">Last Name</label>
                        <input type="text" value={profileData.last_name} onChange={(e) => setProfileData({...profileData, last_name: e.target.value})}
                          className="w-full bg-slate-900/60 border border-slate-700/60 focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/20 rounded-xl px-4 py-2.5 outline-none transition text-sm text-white" />
                      </div>
                    </div>
                    <button type="submit" disabled={isSavingProfile}
                      className="w-full bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold py-2.5 rounded-xl transition mt-1 disabled:opacity-50 disabled:cursor-not-allowed">
                      {isSavingProfile ? "Saving..." : "Save Changes"}
                    </button>
                    {saveMessage && <p className="text-emerald-400 text-xs text-center">{saveMessage}</p>}
                  </form>
                </div>

                {/* Subscription Card */}
                <div className="bg-[#0c1220] border border-slate-800 rounded-2xl p-6 flex flex-col">
                  <h3 className="text-sm font-semibold text-white mb-5 pb-4 border-b border-slate-800">Subscription</h3>

                  {isPro ? (
                    <div className="flex-1 flex flex-col">
                      <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-5 mb-5 flex-1">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <div className="flex items-center gap-1.5 text-blue-400 text-xs font-semibold mb-1.5">
                              <Zap className="w-3.5 h-3.5" /> Command Center Pro
                            </div>
                            <div className="text-3xl font-bold text-white" style={{ fontFamily: "'Georgia', serif" }}>
                              $19<span className="text-xs text-slate-500 font-normal ml-1">/mo</span>
                            </div>
                          </div>
                          {cancelAtEnd ? (
                            <span className="bg-amber-500/10 text-amber-400 text-[10px] px-2.5 py-1 rounded-full border border-amber-500/30 uppercase tracking-widest">Cancelling</span>
                          ) : (
                            <span className="bg-emerald-500/10 text-emerald-400 text-[10px] px-2.5 py-1 rounded-full border border-emerald-500/30 uppercase tracking-widest">Active</span>
                          )}
                        </div>

                        {billingDate && (
                          cancelAtEnd ? (
                            <p className="text-xs text-amber-400 mb-4 font-medium">Expires: {billingDate}</p>
                          ) : (
                            <p className="text-xs text-slate-400 mb-4">Next billing: {billingDate}</p>
                          )
                        )}

                        <p className="text-xs text-slate-500">Unlimited scanning capacity with deep clause extraction.</p>
                      </div>

                      {!cancelAtEnd && (
                        <button onClick={handleCancelSubscription} disabled={isCancelling}
                          className="w-full bg-red-500/8 border border-red-500/20 hover:bg-red-500/15 text-red-400 text-xs font-semibold py-2.5 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed">
                          {isCancelling ? "Processing..." : "Cancel Auto-Renew"}
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col">
                      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 mb-5 flex-1">
                        <div className="text-slate-400 text-xs font-semibold mb-1.5">Reconnaissance (Free)</div>
                        <div className="text-3xl font-bold text-white mb-3" style={{ fontFamily: "'Georgia', serif" }}>$0</div>
                        <p className="text-xs text-slate-600">Limited to 5 basic scans per month.</p>
                      </div>
                      <button disabled={isUpgrading} onClick={handleUpgrade}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold py-2.5 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-900/20">
                        {isUpgrading ? "Redirecting..." : "Upgrade to Pro"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Scanner View */}
          {currentView === 'scanner' && (
            <>
              {paymentSuccess && (
                <div className="mb-6 bg-emerald-500/8 border border-emerald-500/30 text-emerald-400 p-4 rounded-xl flex items-center gap-3 text-sm">
                  <CheckCircle className="w-4 h-4 flex-shrink-0" /> Account upgraded successfully. Welcome to Pro.
                </div>
              )}

              {/* Upload state */}
              {!result && !loading && !showPaywall && (
                <div className="mt-8">
                  <div className="mb-10">
                    <h1 className="text-3xl font-bold tracking-tight text-white mb-2" style={{ fontFamily: "'Georgia', serif" }}>
                      Document Analysis
                    </h1>
                    <p className="text-slate-500 text-sm">Upload a legal document to extract clauses, risks, and key terms.</p>
                  </div>

                  <form onSubmit={handleUpload}>
                    <label className="block cursor-pointer group">
                      <div className="border border-dashed border-slate-700 group-hover:border-blue-500/50 bg-slate-900/30 group-hover:bg-slate-900/60 rounded-2xl p-14 text-center transition-all duration-300">
                        <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto mb-4 group-hover:border-blue-500/40 transition-colors">
                          <UploadCloud className="w-5 h-5 text-slate-500 group-hover:text-blue-400 transition-colors" />
                        </div>
                        <p className="text-slate-300 text-sm font-medium mb-1">Drop your document here</p>
                        <p className="text-slate-600 text-xs mb-4">PDF or DOCX · Up to 50,000 characters</p>
                        {file ? (
                          <span className="inline-flex items-center gap-1.5 bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs px-3 py-1.5 rounded-lg">
                            <FileText className="w-3.5 h-3.5" /> {file.name}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-600 border border-slate-700 px-3 py-1.5 rounded-lg">Browse files</span>
                        )}
                        <input
                          type="file"
                          accept=".pdf, .docx, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                          onChange={(e) => setFile(e.target.files[0])}
                          className="hidden"
                        />
                      </div>
                    </label>

                    <button
                      type="submit"
                      disabled={!file || loading}
                      className="w-full mt-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3.5 rounded-xl shadow-lg shadow-blue-900/20 transition disabled:opacity-40 disabled:cursor-not-allowed text-sm"
                    >
                      {loading ? "Processing..." : "Begin Analysis"}
                    </button>
                  </form>
                </div>
              )}

              {/* Loading terminal */}
              {loading && (
                <div className="max-w-xl mx-auto mt-16">
                  <div className="bg-black/60 border border-slate-800 rounded-2xl p-6 font-mono text-xs shadow-2xl">
                    <div className="flex items-center gap-3 mb-5 pb-4 border-b border-slate-800">
                      <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                        <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
                      </div>
                      <span className="text-slate-600">vigilate_core — analysis</span>
                    </div>
                    <div className="space-y-1.5">
                      {terminalLogs.map((log, i) => (
                        <div key={i} className="text-blue-400/70">{log}</div>
                      ))}
                    </div>
                    <div className="mt-4 flex items-center gap-2 text-blue-300">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Inference in progress...</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Results */}
              {result && (
                <div>
                  {/* Result header */}
                  <div className="flex justify-between items-center mb-6 pb-5 border-b border-slate-800">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/25 flex items-center justify-center">
                        <FileText className="w-4 h-4 text-blue-400" />
                      </div>
                      <div>
                        <h2 className="text-base font-semibold text-white tracking-tight" style={{ fontFamily: "'Georgia', serif" }}>Analysis Report</h2>
                        <p className="text-xs text-slate-600">AI-powered clause extraction</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {activeScanId && (
                        <button
                          onClick={(e) => handleDelete(activeScanId, e)}
                          className="flex items-center gap-1.5 bg-red-500/8 text-red-400 border border-red-500/20 hover:bg-red-500/15 px-3 py-2 rounded-lg text-xs transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>
                      )}

                      {isPro ? (
                        <>
                          <button onClick={exportToTxt}
                            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-lg text-xs transition text-slate-300 border border-slate-700">
                            <Download className="w-3.5 h-3.5" /> .TXT
                          </button>
                          <button onClick={exportToPdf}
                            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 px-3 py-2 rounded-lg text-xs font-semibold transition shadow-lg shadow-blue-900/20">
                            <FileText className="w-3.5 h-3.5" /> Export PDF
                          </button>
                        </>
                      ) : (
                        <button onClick={handleUpgrade}
                          className="flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 px-3 py-2 rounded-lg text-xs font-semibold transition shadow-lg">
                          <Zap className="w-3.5 h-3.5 text-yellow-400" /> Unlock Exports
                        </button>
                      )}
                    </div>
                  </div>

                  <RiskScorecard score={currentScore || 5} />

                  <div className="mt-4 prose prose-invert max-w-none text-slate-300 leading-relaxed
                    prose-h3:text-xl prose-h3:font-semibold prose-h3:text-white prose-h3:border-b prose-h3:border-slate-800 prose-h3:pb-2 prose-h3:mt-10 prose-h3:mb-5
                    prose-strong:text-slate-200
                    prose-ul:space-y-3 prose-li:text-slate-400 prose-li:marker:text-slate-700
                    prose-blockquote:bg-red-500/5 prose-blockquote:border-l-4 prose-blockquote:border-red-500/60 prose-blockquote:p-5 prose-blockquote:rounded-r-xl prose-blockquote:font-normal prose-blockquote:not-italic prose-blockquote:text-slate-300 prose-blockquote:my-6
                    prose-blockquote:before:content-none prose-blockquote:after:content-none
                    [&_blockquote_strong]:text-red-400
                    prose-p:text-slate-400 prose-p:text-sm prose-p:leading-relaxed
                  ">
                    <ReactMarkdown>
                      {result.replace(/RISK_SCORE:\s*\d+/i, '').trim()}
                    </ReactMarkdown>
                  </div>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="mt-8 bg-red-500/5 border border-red-500/20 p-5 rounded-xl flex items-start gap-4 text-red-400">
                  <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-semibold mb-1">Analysis Failed</h3>
                    <p className="text-xs text-red-400/70">{error}</p>
                  </div>
                </div>
              )}

              {/* Paywall */}
              {showPaywall && (
                <div className="mt-10 bg-[#0c1220] border border-blue-500/25 p-8 rounded-2xl text-center relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/25 flex items-center justify-center mx-auto mb-4">
                    <Shield className="w-5 h-5 text-blue-400" />
                  </div>
                  <h2 className="text-xl font-bold mb-2 tracking-tight" style={{ fontFamily: "'Georgia', serif" }}>Scan Limit Reached</h2>
                  <p className="text-slate-500 text-sm mb-6 max-w-sm mx-auto leading-relaxed">Upgrade to Pro for unlimited scans, deeper clause extraction, and professional PDF exports.</p>
                  <button disabled={isUpgrading} onClick={handleUpgrade}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 px-8 rounded-xl shadow-lg shadow-blue-900/20 transition disabled:opacity-50 text-sm">
                    {isUpgrading ? "Redirecting..." : "Upgrade to Pro"}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}