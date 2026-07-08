import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Upload, Shield, AlertTriangle, CheckCircle, Loader2, Flag, FileText, ChevronDown, ChevronUp, Target } from 'lucide-react';
import { useToast } from '../components/common/Toast';
import { UI_TRANSLATIONS } from '../utils/translations';
import { MOCK_SCAMS } from '../utils/mockData';

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

function RiskGauge({ value }: { value: number }) {
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  const color = value >= 70 ? '#EF4444' : value >= 40 ? '#F59E0B' : '#10B981';

  return (
    <div className="relative w-28 h-28 mx-auto">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="#1F2937" strokeWidth="8" />
        <circle
          cx="50" cy="50" r={radius} fill="none"
          stroke={color} strokeWidth="8" strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.5s ease-out, stroke 0.3s' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-h3 font-bold text-white tabular-nums">{value}</span>
        <span className="text-[10px] text-gray-400 uppercase tracking-wider">Risk %</span>
      </div>
    </div>
  );
}

export default function CitizenFraudShield() {
  const [selectedLang, setSelectedLang] = useState('en');
  const t = UI_TRANSLATIONS[selectedLang] || UI_TRANSLATIONS['en'];

  const [messages, setMessages] = useState<Message[]>([
    { id: '0', type: 'bot', content: t.welcome, timestamp: new Date() },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [expandedIndicator, setExpandedIndicator] = useState<number | null>(null);

  const chatRef = useRef<HTMLDivElement>(null);
  const toast = useToast();

  // Update welcome message when language changes if no other messages exist
  useEffect(() => {
    if (messages.length === 1 && messages[0].id === '0') {
      setMessages([{ id: '0', type: 'bot', content: t.welcome, timestamp: new Date() }]);
    }
  }, [selectedLang]);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages]);

  const analyzeMessage = async (text: string) => {
    const userMsg: Message = { id: Date.now().toString(), type: 'user', content: text, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setVerdict(null);
    setExpandedIndicator(null);

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
            <h3 className="text-body-lg font-semibold text-white">{t.chatTitle}</h3>
            <p className="text-caption text-gray-500">{t.chatSubtitle}</p>
          </div>
          <select 
            value={selectedLang}
            onChange={(e) => setSelectedLang(e.target.value)}
            className="bg-navy-700/50 border border-white/10 text-gray-300 text-caption rounded-lg px-3 py-2 outline-none focus:border-accent transition-colors cursor-pointer"
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
                  ? 'bg-accent/20 text-gray-200 rounded-br-md border border-accent/20'
                  : 'bg-navy-700 text-gray-300 rounded-bl-md border border-white/5'
              }`}>
                <p className="text-body whitespace-pre-wrap">{msg.content}</p>
                <p className="text-[10px] text-gray-500 mt-1.5">
                  {msg.timestamp.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </motion.div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-navy-700 border border-white/5 rounded-2xl rounded-bl-md px-4 py-3">
                <Loader2 className="w-4 h-4 text-accent animate-spin" />
              </div>
            </div>
          )}
        </div>

        {messages.length === 1 && (
          <div className="px-4 py-3 bg-navy-800/30 border-t border-white/[0.06]">
            <p className="text-caption text-gray-400 mb-2">Try an example:</p>
            <button 
              type="button" 
              onClick={() => analyzeMessage(MOCK_SCAMS[selectedLang] || MOCK_SCAMS['en'])}
              className="text-left text-sm text-gray-300 bg-navy-900/50 hover:bg-navy-700 p-3 rounded-lg border border-white/10 transition-colors w-full truncate"
            >
              "{MOCK_SCAMS[selectedLang] || MOCK_SCAMS['en']}"
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-4 border-t border-white/[0.06]">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t.placeholder}
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
        <h3 className="text-body-lg font-semibold text-white mb-4">{t.verdictTitle}</h3>

        {!verdict ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Shield className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-body text-gray-500">{t.verdictEmpty}</p>
            </div>
          </div>
        ) : vs && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 flex-1 overflow-y-auto custom-scrollbar pr-2">
            <div className="flex justify-center mb-6 mt-2">
              <RiskGauge value={verdict.riskScore} />
            </div>

            <div className={`${vs.bg} border ${vs.border} rounded-xl p-4 flex items-center gap-3`}>
              <vs.icon className={`w-8 h-8 ${vs.text}`} />
              <div>
                <p className={`text-subheading font-bold ${vs.text}`}>{vs.label}</p>
                <p className="text-caption text-gray-400">{verdict.scamCategory && verdict.scamCategory !== 'None' ? verdict.scamCategory : 'General Analysis'}</p>
              </div>
            </div>

            {verdict.indicators.length > 0 && (
              <div className="mt-4">
                <h4 className="text-caption font-semibold text-gray-400 uppercase tracking-wider mb-3">{t.detectedIndicators}</h4>
                <div className="space-y-2">
                  {verdict.indicators.map((ind, i) => (
                    <div 
                      key={i} 
                      className={`bg-navy-800 rounded-lg border transition-colors cursor-pointer
                        ${expandedIndicator === i ? 'border-accent/50 bg-navy-700' : 'border-white/5 hover:border-white/20'}`}
                      onClick={() => setExpandedIndicator(expandedIndicator === i ? null : i)}
                    >
                      <div className="p-3 flex items-start gap-3">
                        <Target className={`w-4 h-4 mt-0.5 shrink-0 ${verdict.verdict === 'high_risk' ? 'text-danger' : 'text-warning'}`} />
                        <div className="flex-1">
                          <p className={`text-caption ${expandedIndicator === i ? 'text-gray-200' : 'text-gray-300 line-clamp-1'}`}>
                            {ind}
                          </p>
                        </div>
                        {expandedIndicator === i ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-4 bg-navy-900/50 p-4 rounded-xl border border-white/5">
              <h4 className="text-caption font-semibold text-gray-400 uppercase tracking-wider mb-3">{t.safetyAdvice}</h4>
              <div className="space-y-2">
                {verdict.advice.map((adv, i) => (
                  <p key={i} className="text-caption text-gray-300 flex items-start gap-2">
                    <span className="text-accent mt-0.5">•</span> 
                    <span>{adv}</span>
                  </p>
                ))}
              </div>
            </div>

            {verdict.verdict !== 'safe' && (
              <button onClick={reportToNCRB} className="btn-danger w-full flex items-center justify-center gap-2 mt-4">
                <Flag className="w-4 h-4" /> {t.reportNcrb}
              </button>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
