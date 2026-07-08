import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, PhoneOff, AlertTriangle, Shield, Loader2, ChevronDown, ChevronUp, AlertOctagon, Target } from 'lucide-react';

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
  const [matchedPatterns, setMatchedPatterns] = useState<ApiResult['matchedPatterns']>([]);
  const [showAlert, setShowAlert] = useState(false);
  const [scamType, setScamType] = useState('');
  const [reasoning, setReasoning] = useState<string[]>([]);
  const [recommendation, setRecommendation] = useState('');
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  
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
      setMatchedPatterns(data.matchedPatterns);
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
    setMatchedPatterns([]);
    setShowAlert(false);
    setScamType('');
    setReasoning([]);
    setRecommendation('');
    setExpandedCategory(null);
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
                ⚠️ {scamType || 'SCAM'} DETECTED — Threat Confidence: {riskScore}%
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Transcript Panel */}
        <div className="lg:col-span-2 space-y-5">
            <div className="glass-card p-5 flex flex-col h-[400px]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-body-lg font-semibold text-white flex items-center gap-2">
                    <Phone className="w-4 h-4" /> Live Intercept Transcript
                </h3>
                <div className="flex gap-2">
                  {!isStreaming ? (
                    <button onClick={startSimulation} className="btn-primary flex items-center gap-2 text-body">
                      Simulate Incoming Call
                    </button>
                  ) : (
                    <button onClick={stopSimulation} className="btn-danger flex items-center gap-2 text-body">
                      <PhoneOff className="w-4 h-4" /> Terminate Connection
                    </button>
                  )}
                </div>
              </div>

              <div
                ref={transcriptRef}
                className="bg-navy-700/50 rounded-lg p-4 flex-1 overflow-y-auto font-mono text-body leading-relaxed border border-white/5"
              >
                {displayedWords.length === 0 ? (
                  <p className="text-gray-500 italic">Awaiting call connection. Click "Simulate Incoming Call" to begin real-time analysis...</p>
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
                <div className="mt-4 flex items-center gap-2 text-caption text-gray-400">
                  <Loader2 className="w-3 h-3 animate-spin text-accent" />
                  <span>Real-time linguistic analysis in progress... {wordIndex}/{words.length} packets processed</span>
                </div>
              )}
            </div>
            
            {/* Actionable Recommendations */}
            {riskScore >= 70 && recommendation && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5 border border-danger/30 bg-danger/5">
                <h3 className="text-body font-semibold text-danger uppercase tracking-wider mb-3 flex items-center gap-2">
                    <AlertOctagon className="w-4 h-4" /> Recommended Standard Operating Procedure (SOP)
                </h3>
                <div className="text-body text-gray-200">
                    {recommendation}
                </div>
              </motion.div>
            )}
        </div>

        {/* Risk Panel */}
        <div className="glass-card p-5 flex flex-col items-center">
          <h3 className="text-body-lg font-semibold text-white mb-5 self-start">Threat Assessment</h3>
          <RiskGauge value={riskScore} />

          {scamType && scamType !== 'None Detected' && (
            <div className="mt-3 text-center">
              <span className="badge-danger text-caption px-3 py-1 text-[11px] uppercase tracking-wider">{scamType}</span>
            </div>
          )}

          <div className="mt-6 w-full flex-1">
            <h4 className="text-caption font-semibold text-gray-400 uppercase tracking-wider mb-3">Forensic Breakdown</h4>
            <div className="space-y-2 max-h-[320px] overflow-y-auto pr-2 custom-scrollbar">
              {matchedPatterns.length === 0 ? (
                <p className="text-caption text-gray-500 italic bg-navy-800 p-3 rounded-lg border border-white/5 text-center">No threat patterns identified in current timeframe.</p>
              ) : (
                matchedPatterns.map((pattern, i) => (
                    <div 
                        key={i} 
                        className={`bg-navy-800 rounded-lg border transition-colors cursor-pointer
                          ${expandedCategory === pattern.category ? 'border-accent/50 bg-navy-700' : 'border-white/5 hover:border-white/20'}`}
                        onClick={() => setExpandedCategory(expandedCategory === pattern.category ? null : pattern.category)}
                      >
                        <div className="p-3 flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <Target className={`w-3.5 h-3.5 ${pattern.categoryScore > 1 ? 'text-danger' : 'text-warning'}`} />
                            <span className="text-body font-medium text-gray-200 truncate">{pattern.category}</span>
                          </div>
                          <div className="flex items-center gap-3">
                              <span className="text-[10px] text-gray-400 bg-navy-900 px-2 py-0.5 rounded-full">
                                  {pattern.matches.length} hits
                              </span>
                              {expandedCategory === pattern.category ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                          </div>
                        </div>
                        
                        <AnimatePresence>
                            {expandedCategory === pattern.category && (
                                <motion.div 
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  className="overflow-hidden"
                                >
                                    <div className="p-3 pt-0 border-t border-white/10 mt-1 space-y-2">
                                        <p className="text-[10px] uppercase text-gray-500 font-semibold tracking-wider">Identified Linguistic Cues:</p>
                                        <ul className="space-y-1">
                                            {pattern.matches.map((match, j) => (
                                                <li key={j} className="text-caption text-danger-light bg-danger/10 px-2 py-1 rounded inline-block mr-2 mb-1">
                                                    "{match}"
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                      </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
