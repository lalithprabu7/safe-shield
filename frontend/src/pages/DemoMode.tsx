import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, SkipForward, RotateCcw, Phone, AudioWaveform, Shield, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';

const DEMO_STEPS = [
  {
    id: 1,
    title: 'Step 1: Scam Call Detection',
    subtitle: 'AI analyzing incoming call transcript in real-time',
    narration: 'A citizen receives a suspicious call from someone impersonating a CBI officer. DigitalShield AI intercepts and analyzes the conversation in real-time, detecting threat patterns as words are spoken.',
    icon: Phone,
    color: 'from-red-500 to-orange-500',
    duration: 8000,
  },
  {
    id: 2,
    title: 'Step 2: Voice Deepfake Analysis',
    subtitle: 'Synthetic speech patterns identified in caller\'s voice',
    narration: 'Simultaneously, the Voice Spoof Agent analyzes the caller\'s audio. Spectral analysis reveals unnatural pitch consistency in the 340–450Hz range — a telltale sign of AI-generated speech. The caller is using a deepfake voice.',
    icon: AudioWaveform,
    color: 'from-purple-500 to-indigo-500',
    duration: 6000,
  },
  {
    id: 3,
    title: 'Step 3: Citizen Advisory & Protection',
    subtitle: 'Fraud alert generated and safety advisory dispatched',
    narration: 'Based on the combined analysis (94% scam confidence + 87% deepfake probability), DigitalShield AI immediately generates a fraud alert, sends the citizen a safety advisory in their preferred language, and creates an evidence report for law enforcement.',
    icon: Shield,
    color: 'from-emerald-500 to-teal-500',
    duration: 6000,
  },
];

// Transcript for demo
const DEMO_WORDS = [
  'Hello,', 'this', 'is', 'Senior', 'Inspector', 'from', 'CBI.',
  'Your', 'Aadhaar', 'is', 'linked', 'to', 'money', 'laundering.',
  'An', 'arrest', 'warrant', 'has', 'been', 'issued.',
  'Stay', 'on', 'this', 'video', 'call.',
  'Do', 'not', 'disconnect.',
  'Transfer', 'funds', 'to', 'safe', 'account.',
];

const SCAM_WORDS = new Set(['cbi.', 'aadhaar', 'arrest', 'warrant', 'disconnect.', 'transfer', 'safe', 'money', 'laundering.']);

export default function DemoMode() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [riskScore, setRiskScore] = useState(0);
  const [transcriptWords, setTranscriptWords] = useState<string[]>([]);
  const [deepfakeScore, setDeepfakeScore] = useState(0);
  const [alertShown, setAlertShown] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);

  const reset = useCallback(() => {
    setIsPlaying(false);
    setCurrentStep(0);
    setProgress(0);
    setRiskScore(0);
    setTranscriptWords([]);
    setDeepfakeScore(0);
    setAlertShown(false);
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const playDemo = () => {
    reset();
    setTimeout(() => {
      setIsPlaying(true);
      setCurrentStep(1);
    }, 300);
  };

  // Step 1: Transcript streaming + risk (calls backend API for real classification)
  useEffect(() => {
    if (!isPlaying || currentStep !== 1) return;
    let wordIdx = 0;
    let lastApiCall = 0;
    const interval = setInterval(async () => {
      if (wordIdx >= DEMO_WORDS.length) {
        clearInterval(interval);
        // Final API call with all words
        try {
          const resp = await fetch('/api/scam-call/classify-realtime', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ words: DEMO_WORDS }),
          });
          if (resp.ok) {
            const data = await resp.json();
            setRiskScore(data.confidence);
          }
        } catch { /* use local fallback */ }
        setTimeout(() => setCurrentStep(2), 1500);
        return;
      }
      wordIdx++;
      const currentWords = DEMO_WORDS.slice(0, wordIdx);
      setTranscriptWords(currentWords);
      setProgress((1 / 3) * (wordIdx / DEMO_WORDS.length) * 100);
      if (transcriptRef.current) transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;

      // Throttled API call every 600ms
      const now = Date.now();
      if (now - lastApiCall > 600) {
        lastApiCall = now;
        try {
          const resp = await fetch('/api/scam-call/classify-realtime', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ words: currentWords }),
          });
          if (resp.ok) {
            const data = await resp.json();
            setRiskScore(data.confidence);
          }
        } catch {
          setRiskScore(Math.min(94, Math.round((wordIdx / DEMO_WORDS.length) * 94)));
        }
      }
    }, 200);
    timerRef.current = interval;
    return () => clearInterval(interval);
  }, [isPlaying, currentStep]);

  // Step 2: Deepfake analysis (calls backend voice API)
  useEffect(() => {
    if (!isPlaying || currentStep !== 2) return;
    let targetScore = 87;
    // Call voice API to get the actual deepfake confidence
    fetch('/api/voice/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileName: 'demo_scam_call_cbi.wav', fileSize: 248000 }),
    })
      .then((r) => r.json())
      .then((data) => {
        targetScore = Math.round((data.confidence || 0.87) * 100);
      })
      .catch(() => { /* use default 87 */ });

    let val = 0;
    const interval = setInterval(() => {
      val += 2;
      if (val > targetScore) {
        clearInterval(interval);
        setDeepfakeScore(targetScore);
        setTimeout(() => setCurrentStep(3), 1500);
        return;
      }
      setDeepfakeScore(val);
      setProgress(33 + (val / targetScore) * 33);
    }, 60);
    timerRef.current = interval;
    return () => clearInterval(interval);
  }, [isPlaying, currentStep]);

  // Step 3: Advisory
  useEffect(() => {
    if (!isPlaying || currentStep !== 3) return;
    setAlertShown(true);
    let p = 66;
    const interval = setInterval(() => {
      p += 1;
      if (p >= 100) {
        clearInterval(interval);
        setProgress(100);
        setTimeout(() => setIsPlaying(false), 2000);
        return;
      }
      setProgress(p);
    }, 150);
    timerRef.current = interval;
    return () => clearInterval(interval);
  }, [isPlaying, currentStep]);

  const step = DEMO_STEPS[Math.max(0, currentStep - 1)];

  return (
    <div className="space-y-5">
      {/* Hero */}
      <div className="glass-card p-6 bg-gradient-to-r from-accent/10 via-transparent to-purple-500/10 border-accent/20">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-heading font-bold text-white mb-1">Digital Arrest Simulation Demo</h2>
            <p className="text-body text-gray-400">Experience the full DigitalShield AI detection pipeline in action</p>
          </div>
          {!isPlaying ? (
            <button onClick={playDemo} className="btn-primary flex items-center gap-2 text-body-lg px-8 py-3 animate-glow">
              <Play className="w-5 h-5" /> Play Full Demo
            </button>
          ) : (
            <div className="flex gap-2">
              <button onClick={reset} className="btn-secondary flex items-center gap-2">
                <RotateCcw className="w-4 h-4" /> Reset
              </button>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        {(isPlaying || progress > 0) && (
          <div className="mt-5">
            <div className="flex justify-between text-caption text-gray-400 mb-2">
              {DEMO_STEPS.map((s) => (
                <span key={s.id} className={currentStep >= s.id ? 'text-accent font-medium' : ''}>
                  {s.title.split(':')[0]}
                </span>
              ))}
            </div>
            <div className="h-2 bg-navy-700 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-accent to-cyan-400 rounded-full"
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Narrative */}
      <AnimatePresence mode="wait">
        {isPlaying && (
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className={`glass-card p-5 border border-white/10 bg-gradient-to-r ${step.color} bg-opacity-10`}
            style={{ background: `linear-gradient(135deg, rgba(0,0,0,0.6), rgba(0,0,0,0.8))` }}
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                <step.icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-body-lg font-bold text-white">{step.title}</h3>
                <p className="text-body text-gray-300 mt-1">{step.narration}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Live Panels */}
      {isPlaying && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Transcript */}
          <div className="glass-card p-5">
            <h3 className="text-body font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Phone className="w-4 h-4" /> Live Transcript
            </h3>
            <div ref={transcriptRef} className="bg-navy-700/50 rounded-lg p-3 h-40 overflow-y-auto text-body font-mono border border-white/5">
              {transcriptWords.length === 0 ? (
                <span className="text-gray-500">Waiting for call...</span>
              ) : (
                transcriptWords.map((w, i) => (
                  <span key={i} className={SCAM_WORDS.has(w.toLowerCase()) ? 'text-danger font-semibold' : 'text-gray-300'}>
                    {w}{' '}
                  </span>
                ))
              )}
              {currentStep === 1 && <span className="inline-block w-1.5 h-4 bg-accent animate-pulse" />}
            </div>
          </div>

          {/* Risk Gauge */}
          <div className="glass-card p-5 flex flex-col items-center">
            <h3 className="text-body font-semibold text-gray-400 uppercase tracking-wider mb-3 self-start flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> Scam Risk
            </h3>
            <div className="relative w-28 h-28">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="50" fill="none" stroke="#1F2937" strokeWidth="8" />
                <circle cx="60" cy="60" r="50" fill="none"
                  stroke={riskScore >= 70 ? '#EF4444' : riskScore >= 40 ? '#F59E0B' : '#10B981'}
                  strokeWidth="8" strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 50}
                  strokeDashoffset={2 * Math.PI * 50 * (1 - riskScore / 100)}
                  style={{ transition: 'all 0.5s ease-out' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-heading font-bold text-white tabular-nums">{riskScore}</span>
                <span className="text-[10px] text-gray-400">%</span>
              </div>
            </div>
            {currentStep >= 2 && (
              <div className="mt-3 text-center">
                <p className="text-caption text-gray-400">Deepfake Score</p>
                <p className="text-body-lg font-bold text-purple-400 tabular-nums">{deepfakeScore}%</p>
              </div>
            )}
          </div>

          {/* Status */}
          <div className="glass-card p-5">
            <h3 className="text-body font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Shield className="w-4 h-4" /> System Status
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-body">
                {currentStep >= 1 ? <CheckCircle className="w-4 h-4 text-success" /> : <Loader2 className="w-4 h-4 text-gray-500 animate-spin" />}
                <span className={currentStep >= 1 ? 'text-gray-200' : 'text-gray-500'}>Call intercepted</span>
              </div>
              <div className="flex items-center gap-2 text-body">
                {currentStep >= 2 ? <CheckCircle className="w-4 h-4 text-success" /> : currentStep === 1 ? <Loader2 className="w-4 h-4 text-accent animate-spin" /> : <span className="w-4 h-4 rounded-full border border-gray-600" />}
                <span className={currentStep >= 2 ? 'text-gray-200' : 'text-gray-500'}>Voice analysis</span>
              </div>
              <div className="flex items-center gap-2 text-body">
                {currentStep >= 3 ? <CheckCircle className="w-4 h-4 text-success" /> : currentStep === 2 ? <Loader2 className="w-4 h-4 text-accent animate-spin" /> : <span className="w-4 h-4 rounded-full border border-gray-600" />}
                <span className={currentStep >= 3 ? 'text-gray-200' : 'text-gray-500'}>Advisory generated</span>
              </div>
              <div className="flex items-center gap-2 text-body">
                {alertShown ? <CheckCircle className="w-4 h-4 text-success" /> : <span className="w-4 h-4 rounded-full border border-gray-600" />}
                <span className={alertShown ? 'text-gray-200' : 'text-gray-500'}>Evidence report filed</span>
              </div>
            </div>

            {alertShown && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-4 bg-danger/15 border border-danger/30 rounded-lg p-3 text-caption text-danger-light animate-alert-pulse"
              >
                🚨 SCAM BLOCKED — Citizen protected, evidence preserved
              </motion.div>
            )}
          </div>
        </div>
      )}

      {/* Not playing state */}
      {!isPlaying && progress === 0 && (
        <div className="glass-card p-8 flex flex-col items-center justify-center min-h-[300px]">
          <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center mb-5 animate-glow">
            <Play className="w-10 h-10 text-accent ml-1" />
          </div>
          <h3 className="text-subheading font-semibold text-white mb-2">Ready to Demo</h3>
          <p className="text-body text-gray-400 text-center max-w-md">
            Click "Play Full Demo" to watch DigitalShield AI detect a digital arrest scam in real-time — from call interception through evidence generation.
          </p>
        </div>
      )}

      {/* Completed state */}
      {!isPlaying && progress >= 100 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6 border border-success/20 bg-gradient-to-r from-success/5 to-transparent"
        >
          <div className="flex items-center gap-4">
            <CheckCircle className="w-10 h-10 text-success shrink-0" />
            <div>
              <h3 className="text-body-lg font-bold text-white">Demo Complete</h3>
              <p className="text-body text-gray-400">
                DigitalShield AI successfully detected a digital arrest scam with 94% confidence, identified a deepfake voice with 87% probability, and generated a complete evidence report in under 20 seconds.
              </p>
            </div>
            <button onClick={playDemo} className="btn-primary shrink-0 flex items-center gap-2">
              <RotateCcw className="w-4 h-4" /> Replay
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
