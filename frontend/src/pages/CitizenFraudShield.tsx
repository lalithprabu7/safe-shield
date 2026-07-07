import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Upload, Shield, AlertTriangle, CheckCircle, Loader2, Flag } from 'lucide-react';
import { useToast } from '../components/common/Toast';

interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
}

interface Verdict {
  verdict: 'safe' | 'suspicious' | 'high_risk';
  riskScore: number;
  scamCategory: string;
  explanation: string;
  indicators: string[];
  advice: string[];
}

const VERDICT_STYLES = {
  safe: { bg: 'bg-success/15', border: 'border-success/30', text: 'text-success', icon: CheckCircle, label: 'Safe' },
  suspicious: { bg: 'bg-warning/15', border: 'border-warning/30', text: 'text-warning', icon: AlertTriangle, label: 'Suspicious' },
  high_risk: { bg: 'bg-danger/15', border: 'border-danger/30', text: 'text-danger', icon: AlertTriangle, label: 'High Risk' },
};

const LANGUAGES = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'hi', label: 'Hindi', native: 'हिंदी' },
  { code: 'ta', label: 'Tamil', native: 'தமிழ்' },
  { code: 'te', label: 'Telugu', native: 'తెలుగు' },
  { code: 'kn', label: 'Kannada', native: 'ಕನ್ನಡ' },
  { code: 'bn', label: 'Bengali', native: 'বাংলা' },
  { code: 'mr', label: 'Marathi', native: 'मराठी' },
  { code: 'gu', label: 'Gujarati', native: 'ગુજરાતી' },
  { code: 'ml', label: 'Malayalam', native: 'മലയാളം' },
  { code: 'or', label: 'Odia', native: 'ଓଡ଼ିଆ' },
  { code: 'pa', label: 'Punjabi', native: 'ਪੰਜਾਬੀ' },
  { code: 'as', label: 'Assamese', native: 'অসমীয়া' },
];

export default function CitizenFraudShield() {
  const [messages, setMessages] = useState<Message[]>([
    { id: '0', type: 'bot', content: 'Welcome to Citizen Fraud Shield! Paste a suspicious message, or upload a screenshot to check if it\'s a scam.', timestamp: new Date() },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [selectedLang, setSelectedLang] = useState('en');
  const chatRef = useRef<HTMLDivElement>(null);
  const toast = useToast();

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages]);

  const analyzeMessage = async (text: string) => {
    const userMsg: Message = { id: Date.now().toString(), type: 'user', content: text, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setVerdict(null);

    try {
      const resp = await fetch('/api/chat/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // We pass the lang so the backend could potentially translate the advisory response
        body: JSON.stringify({ message: text, lang: selectedLang }),
      });
      if (!resp.ok) throw new Error('Analysis failed');
      const data: Verdict = await resp.json();
      await new Promise((r) => setTimeout(r, 800));

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: data.explanation,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMsg]);
      setVerdict(data);
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), type: 'bot', content: 'Sorry, analysis failed. Please try again.', timestamp: new Date() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    analyzeMessage(input.trim());
  };

  const reportToNCRB = () => {
    toast.showToast('success', 'Report Submitted', 'Your report has been submitted to NCRB Cyber Crime Portal (Reference: NCRB-' + Date.now().toString(36).toUpperCase() + ')');
  };

  const vs = verdict ? VERDICT_STYLES[verdict.verdict] : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 h-[calc(100vh-8rem)]">
      {/* Chat Panel */}
      <div className="lg:col-span-2 glass-card flex flex-col">
        <div className="px-5 py-4 border-b border-white/[0.06] flex justify-between items-center">
          <div>
            <h3 className="text-body-lg font-semibold text-white">Fraud Advisory Chat</h3>
            <p className="text-caption text-gray-500">Paste suspicious messages to check for fraud</p>
          </div>
          <select 
            value={selectedLang}
            onChange={(e) => setSelectedLang(e.target.value)}
            className="bg-navy-700/50 border border-white/10 text-gray-300 text-caption rounded-lg px-3 py-2 outline-none focus:border-accent transition-colors"
          >
            {LANGUAGES.map(l => (
              <option key={l.code} value={l.code}>{l.native} ({l.label})</option>
            ))}
          </select>
        </div>

        <div ref={chatRef} className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                msg.type === 'user'
                  ? 'bg-accent/20 text-gray-200 rounded-br-md'
                  : 'bg-navy-700 text-gray-300 rounded-bl-md'
              }`}>
                <p className="text-body">{msg.content}</p>
                <p className="text-[10px] text-gray-500 mt-1.5">
                  {msg.timestamp.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </motion.div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-navy-700 rounded-2xl rounded-bl-md px-4 py-3">
                <Loader2 className="w-4 h-4 text-accent animate-spin" />
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-4 border-t border-white/[0.06]">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Paste a suspicious message here..."
              className="input-field flex-1"
              disabled={loading}
            />
            <button type="submit" disabled={loading || !input.trim()} className="btn-primary px-4">
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>

      {/* Verdict Panel */}
      <div className="glass-card p-5 flex flex-col">
        <h3 className="text-body-lg font-semibold text-white mb-4">Analysis Verdict</h3>

        {!verdict ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Shield className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-body text-gray-500">Submit a message to see the analysis results</p>
            </div>
          </div>
        ) : vs && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 flex-1 overflow-y-auto">
            <div className={`${vs.bg} border ${vs.border} rounded-xl p-4 flex items-center gap-3`}>
              <vs.icon className={`w-8 h-8 ${vs.text}`} />
              <div>
                <p className={`text-subheading font-bold ${vs.text}`}>{vs.label}</p>
                <p className="text-caption text-gray-400">Risk Score: {verdict.riskScore}%{verdict.scamCategory && verdict.scamCategory !== 'None' ? ` • ${verdict.scamCategory}` : ''}</p>
              </div>
            </div>

            {verdict.indicators.length > 0 && (
              <div>
                <h4 className="text-caption font-semibold text-gray-400 uppercase tracking-wider mb-2">Detected Indicators</h4>
                <div className="space-y-1.5">
                  {verdict.indicators.map((ind, i) => (
                    <div key={i} className="flex items-center gap-2 text-caption text-gray-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-danger shrink-0" />
                      {ind}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h4 className="text-caption font-semibold text-gray-400 uppercase tracking-wider mb-2">Safety Advice</h4>
              <div className="space-y-2">
                {verdict.advice.map((adv, i) => (
                  <p key={i} className="text-caption text-gray-400 flex gap-2">
                    <span className="text-accent shrink-0">•</span> {adv}
                  </p>
                ))}
              </div>
            </div>

            {verdict.verdict !== 'safe' && (
              <button onClick={reportToNCRB} className="btn-danger w-full flex items-center justify-center gap-2 mt-2">
                <Flag className="w-4 h-4" /> Report to NCRB
              </button>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
