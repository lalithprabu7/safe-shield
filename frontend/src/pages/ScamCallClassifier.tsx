import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, PhoneOff, AlertTriangle, Shield, Loader2 } from 'lucide-react';

// Hardcoded transcript for instant demo (no API dependency for words)
const DEMO_TRANSCRIPT = {
  id: 'TR-001',
  title: 'CBI Impersonation - Digital Arrest',
  words: [
    'Hello,', 'this', 'is', 'Senior', 'Inspector', 'Rajesh', 'Kumar',
    'calling', 'from', 'the', 'Central', 'Bureau', 'of', 'Investigation,', 'CBI.',
    'We', 'have', 'received', 'credible', 'intelligence', 'that', 'your',
    'Aadhaar', 'number', 'ending', 'in', '4378', 'has', 'been', 'directly',
    'linked', 'to', 'multiple', 'cases', 'of', 'international', 'money', 'laundering',
    'and', 'hawala', 'transactions.', 'A', 'First', 'Information', 'Report',
    'has', 'been', 'registered', 'against', 'your', 'name,', 'FIR', 'number',
    'CBI-2024-MC-7829.', 'An', 'arrest', 'warrant', 'has', 'been', 'issued',
    'by', 'the', 'High', 'Court.', 'You', 'are', 'required', 'to', 'stay',
    'on', 'this', 'video', 'call', 'while', 'we', 'verify', 'your', 'identity.',
    'Do', 'not', 'disconnect', 'this', 'call', 'under', 'any', 'circumstances.',
    'If', 'you', 'disconnect,', 'the', 'arrest', 'warrant', 'will', 'be',
    'executed', 'immediately.', 'You', 'must', 'not', 'inform', 'anyone',
    'about', 'this', 'ongoing', 'investigation.', 'For', 'the', 'safety',
    'of', 'your', 'funds,', 'you', 'will', 'need', 'to', 'transfer', 'all',
    'your', 'savings', 'to', 'a', 'safe', 'account', 'provided', 'by', 'the',
    'Reserve', 'Bank', 'of', 'India.', 'This', 'is', 'a', 'mandatory',
    'verification', 'process.', 'Failure', 'to', 'comply', 'will', 'result',
    'in', 'immediate', 'arrest', 'and', 'seizure', 'of', 'all', 'your', 'assets.',
  ],
};

// Dynamic keywords will be loaded from the backend
let highlightKeywords = new Set<string>();

function isHighlightWord(word: string): boolean {
  const clean = word.toLowerCase().replace(/[.,!?;:'"()]/g, '');
  return clean.length > 2 && highlightKeywords.has(clean);
}

// Circular Risk Gauge
function RiskGauge({ value }: { value: number }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  const color = value >= 70 ? '#EF4444' : value >= 40 ? '#F59E0B' : '#10B981';

  return (
    <div className="relative w-36 h-36 mx-auto">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={radius} fill="none" stroke="#1F2937" strokeWidth="8" />
        <circle
          cx="60" cy="60" r={radius} fill="none"
          stroke={color} strokeWidth="8" strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.5s ease-out, stroke 0.3s' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-display text-white tabular-nums">{value}</span>
        <span className="text-caption text-gray-400">Risk %</span>
      </div>
    </div>
  );
}

interface ApiResult {
  riskLevel: string;
  confidence: number;
  scamType: string;
  matchedPatterns: { category: string; matches: string[]; categoryScore: number }[];
  reasoning: string[];
  recommendedAction: string;
  categoriesHit: string[];
}

export default function ScamCallClassifier() {
  const [isStreaming, setIsStreaming] = useState(false);
  const [wordIndex, setWordIndex] = useState(0);
  const [displayedWords, setDisplayedWords] = useState<string[]>([]);
  const [riskScore, setRiskScore] = useState(0);
  const [patternsFound, setPatternsFound] = useState<string[]>([]);
  const [showAlert, setShowAlert] = useState(false);
  const [scamType, setScamType] = useState('');
  const [reasoning, setReasoning] = useState<string[]>([]);
  const [recommendation, setRecommendation] = useState('');
  const transcriptRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastApiCall = useRef(0);

  const words = DEMO_TRANSCRIPT.words;

  // Fetch ML keywords on mount
  useEffect(() => {
    fetch('/api/scam-call/keywords')
      .then(res => res.json())
      .then(data => {
        if (data.keywords && Array.isArray(data.keywords)) {
          highlightKeywords = new Set(data.keywords.map((k: string) => k.toLowerCase()));
        }
      })
      .catch(err => console.error('Failed to load keywords:', err));
  }, []);

  // Call backend API for real-time classification (throttled)
  const classifyViaApi = useCallback(async (currentWords: string[]) => {
    const now = Date.now();
    // Throttle: only call API every 800ms or when we have significantly more words
    if (now - lastApiCall.current < 800) return;
    lastApiCall.current = now;

    try {
      const resp = await fetch('/api/scam-call/classify-realtime', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ words: currentWords }),
      });
      if (!resp.ok) return;
      const data: ApiResult = await resp.json();
      setRiskScore(data.confidence);
      setScamType(data.scamType);
      setReasoning(data.reasoning);
      setRecommendation(data.recommendedAction);
      setPatternsFound(data.matchedPatterns.map((p) => `${p.category} (${p.matches.length} matches)`));
      if (data.confidence >= 70 && !showAlert) setShowAlert(true);
    } catch {
      // Silently fail — frontend still works with local highlighting
    }
  }, [showAlert]);

  const startSimulation = () => {
    setIsStreaming(true);
    setWordIndex(0);
    setDisplayedWords([]);
    setRiskScore(0);
    setPatternsFound([]);
    setShowAlert(false);
    setScamType('');
    setReasoning([]);
    setRecommendation('');
    lastApiCall.current = 0;
  };

  const stopSimulation = () => {
    setIsStreaming(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  useEffect(() => {
    if (!isStreaming) return;
    intervalRef.current = setInterval(() => {
      setWordIndex((prev) => {
        if (prev >= words.length) {
          setIsStreaming(false);
          return prev;
        }
        return prev + 1;
      });
    }, 150);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isStreaming, words.length]);

  useEffect(() => {
    if (wordIndex === 0) return;
    const newWords = words.slice(0, wordIndex);
    setDisplayedWords(newWords);
    // Call API for classification
    classifyViaApi(newWords);
    // Auto-scroll transcript
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [wordIndex, words, classifyViaApi]);

  return (
    <div className="space-y-5">
      {/* Alert Banner */}
      <AnimatePresence>
        {showAlert && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-danger/15 border border-danger/40 rounded-xl px-5 py-3 flex items-center gap-3 animate-alert-pulse">
              <AlertTriangle className="w-5 h-5 text-danger shrink-0" />
              <span className="text-body font-semibold text-danger-light">
                ⚠️ {scamType || 'SCAM'} DETECTED — Confidence: {riskScore}%
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Transcript Panel */}
        <div className="lg:col-span-2 glass-card p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-body-lg font-semibold text-white">Live Transcript</h3>
            <div className="flex gap-2">
              {!isStreaming ? (
                <button onClick={startSimulation} className="btn-primary flex items-center gap-2 text-body">
                  <Phone className="w-4 h-4" /> Simulate Incoming Call
                </button>
              ) : (
                <button onClick={stopSimulation} className="btn-danger flex items-center gap-2 text-body">
                  <PhoneOff className="w-4 h-4" /> End Call
                </button>
              )}
            </div>
          </div>

          <div
            ref={transcriptRef}
            className="bg-navy-700/50 rounded-lg p-4 h-64 overflow-y-auto font-mono text-body leading-relaxed border border-white/5"
          >
            {displayedWords.length === 0 ? (
              <p className="text-gray-500 italic">Click "Simulate Incoming Call" to begin real-time analysis...</p>
            ) : (
              <p className="text-gray-300">
                {displayedWords.map((word, i) => (
                  <span
                    key={i}
                    className={isHighlightWord(word) ? 'text-danger font-semibold bg-danger/10 rounded px-0.5' : ''}
                  >
                    {word}{' '}
                  </span>
                ))}
                {isStreaming && <span className="inline-block w-2 h-4 bg-accent animate-pulse ml-1" />}
              </p>
            )}
          </div>

          {isStreaming && (
            <div className="mt-3 flex items-center gap-2 text-caption text-gray-400">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Analyzing transcript... {wordIndex}/{words.length} words processed</span>
            </div>
          )}

          {/* Reasoning section — only after some analysis */}
          {reasoning.length > 0 && (
            <div className="mt-4 border-t border-white/5 pt-3">
              <h4 className="text-caption font-semibold text-gray-400 uppercase tracking-wider mb-2">AI Reasoning</h4>
              <div className="space-y-1.5 max-h-28 overflow-y-auto">
                {reasoning.map((r, i) => (
                  <p key={i} className="text-caption text-gray-400 flex gap-2">
                    <span className="text-accent shrink-0">▸</span> {r}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Risk Panel */}
        <div className="glass-card p-5 flex flex-col items-center">
          <h3 className="text-body-lg font-semibold text-white mb-5 self-start">Risk Analysis</h3>
          <RiskGauge value={riskScore} />

          {scamType && scamType !== 'None Detected' && (
            <div className="mt-3 text-center">
              <span className="badge-danger text-caption">{scamType}</span>
            </div>
          )}

          <div className="mt-5 w-full">
            <h4 className="text-caption font-semibold text-gray-400 uppercase tracking-wider mb-3">Detected Categories</h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {patternsFound.length === 0 ? (
                <p className="text-caption text-gray-500 italic">No patterns detected yet</p>
              ) : (
                patternsFound.map((p, i) => (
                  <motion.div
                    key={p}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-2 text-caption"
                  >
                    <Shield className="w-3.5 h-3.5 text-danger shrink-0" />
                    <span className="text-gray-300">{p}</span>
                  </motion.div>
                ))
              )}
            </div>
          </div>

          <div className="mt-auto pt-5 w-full">
            <div className="bg-navy-700/50 rounded-lg p-3 border border-white/5">
              <p className="text-caption text-gray-400">
                {recommendation || (
                  riskScore >= 70 ? '🚨 High-confidence scam — recommend immediate call termination and NCRB reporting.'
                  : riskScore >= 40 ? '⚠️ Moderate risk — continued monitoring recommended.'
                  : '✅ Low risk — no significant threats detected.'
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
