import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Upload, ScanLine, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';

interface Feature {
  name: string;
  region: { x: number; y: number; width: number; height: number };
  passed: boolean;
  confidence: number;
  description: string;
}

interface AnalysisResult {
  isGenuine: boolean;
  overallConfidence: number;
  denomination: string;
  features: Feature[];
  verdict: string;
}

// Pre-loaded sample images (generated via canvas)
function generateSampleImage(type: 'genuine' | 'fake1' | 'fake2'): string {
  const canvas = document.createElement('canvas');
  canvas.width = 600;
  canvas.height = 280;
  const ctx = canvas.getContext('2d')!;

  // Background gradient
  const bg = ctx.createLinearGradient(0, 0, 600, 280);
  if (type === 'genuine') {
    bg.addColorStop(0, '#1a3a2a');
    bg.addColorStop(1, '#2d5a3e');
  } else {
    bg.addColorStop(0, '#3a1a1a');
    bg.addColorStop(1, '#5a2d2d');
  }
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 600, 280);

  // Grid lines
  ctx.strokeStyle = 'rgba(255,255,255,0.05)';
  for (let i = 0; i < 600; i += 20) {
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 280); ctx.stroke();
  }
  for (let i = 0; i < 280; i += 20) {
    ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(600, i); ctx.stroke();
  }

  // "₹2000" text
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.font = 'bold 60px Inter, sans-serif';
  ctx.fillText('₹2000', 380, 200);

  // Gandhi portrait placeholder
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(100, 140, 50, 70, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Security thread line
  ctx.strokeStyle = 'rgba(100,200,255,0.3)';
  ctx.lineWidth = 3;
  ctx.setLineDash([8, 4]);
  ctx.beginPath();
  ctx.moveTo(280, 0);
  ctx.lineTo(280, 280);
  ctx.stroke();
  ctx.setLineDash([]);

  // Serial number
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.font = '14px monospace';
  ctx.fillText(type === 'genuine' ? '9AB 847291' : '9AB 8472XX', 380, 40);

  // RBI seal
  ctx.beginPath();
  ctx.arc(500, 130, 30, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  ctx.font = '10px sans-serif';
  ctx.fillText('RBI', 490, 134);

  // Label
  ctx.fillStyle = type === 'genuine' ? '#4ade80' : '#f87171';
  ctx.font = 'bold 12px sans-serif';
  ctx.fillText(
    type === 'genuine' ? 'SAMPLE: GENUINE' : type === 'fake1' ? 'SAMPLE: SUSPECT A' : 'SAMPLE: SUSPECT B',
    20, 25
  );

  return canvas.toDataURL('image/png');
}

export default function CounterfeitScanner() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [samples] = useState(() => ({
    genuine: generateSampleImage('genuine'),
    fake1: generateSampleImage('fake1'),
    fake2: generateSampleImage('fake2'),
  }));

  const analyze = async (imgSrc: string, name: string) => {
    setSelectedImage(imgSrc);
    setFileName(name);
    setAnalyzing(true);
    setResult(null);

    try {
      const resp = await fetch('/api/currency/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: name }),
      });
      if (!resp.ok) throw new Error('Analysis failed');
      const data: AnalysisResult = await resp.json();
      await new Promise((r) => setTimeout(r, 1200));
      setResult(data);
    } catch {
      setResult(null);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => analyze(reader.result as string, file.name);
    reader.readAsDataURL(file);
  };

  // Draw annotations on canvas
  useEffect(() => {
    if (!result || !selectedImage || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      result.features.forEach((f) => {
        const x = f.region.x * img.width;
        const y = f.region.y * img.height;
        const w = f.region.width * img.width;
        const h = f.region.height * img.height;

        ctx.strokeStyle = f.passed ? '#10B981' : '#EF4444';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 3]);
        ctx.strokeRect(x, y, w, h);
        ctx.setLineDash([]);

        // Label
        const labelH = 18;
        ctx.fillStyle = f.passed ? 'rgba(16,185,129,0.85)' : 'rgba(239,68,68,0.85)';
        ctx.fillRect(x, y - labelH, Math.min(w, 140), labelH);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 10px sans-serif';
        ctx.fillText(
          `${f.passed ? '✓' : '✗'} ${f.name.slice(0, 18)} ${Math.round(f.confidence * 100)}%`,
          x + 3, y - 5
        );
      });
    };
    img.src = selectedImage;
  }, [result, selectedImage]);

  return (
    <div className="space-y-5">
      {/* Sample Selection */}
      <div className="glass-card p-5">
        <h3 className="text-body-lg font-semibold text-white mb-4">Select a Sample or Upload</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          {[
            { key: 'genuine', label: 'Genuine Note', src: samples.genuine },
            { key: 'fake1', label: 'Suspect Note A', src: samples.fake1 },
            { key: 'fake2', label: 'Suspect Note B', src: samples.fake2 },
          ].map((s) => (
            <button
              key={s.key}
              onClick={() => analyze(s.src, `sample_${s.key}.png`)}
              className="glass-card-hover p-3 text-left"
              disabled={analyzing}
            >
              <img src={s.src} alt={s.label} className="w-full h-24 object-cover rounded-lg mb-2" />
              <p className="text-caption font-medium text-gray-300">{s.label}</p>
            </button>
          ))}
        </div>
        <label className="btn-secondary inline-flex items-center gap-2 cursor-pointer">
          <Upload className="w-4 h-4" /> Upload Custom Image
          <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
        </label>
      </div>

      {/* Analysis Results */}
      {(analyzing || result) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="glass-card p-5">
            <h3 className="text-body font-semibold text-gray-400 uppercase tracking-wider mb-3">
              {analyzing ? 'Scanning...' : 'Annotated Analysis'}
            </h3>
            {analyzing ? (
              <div className="h-52 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-accent animate-spin" />
              </div>
            ) : (
              <canvas ref={canvasRef} className="w-full rounded-lg border border-white/10" />
            )}
          </div>

          {result && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
              {/* Verdict */}
              <div className={`glass-card p-5 border ${result.isGenuine ? 'border-success/30' : 'border-danger/30'}`}>
                <div className="flex items-center gap-3">
                  {result.isGenuine ? (
                    <CheckCircle className="w-8 h-8 text-success" />
                  ) : (
                    <AlertTriangle className="w-8 h-8 text-danger" />
                  )}
                  <div>
                    <h3 className={`text-body-lg font-bold ${result.isGenuine ? 'text-success' : 'text-danger'}`}>
                      {result.isGenuine ? '✅ GENUINE NOTE' : '⚠️ COUNTERFEIT DETECTED'}
                    </h3>
                    <p className="text-caption text-gray-400">
                      Overall confidence: {Math.round(result.overallConfidence * 100)}%
                    </p>
                  </div>
                </div>
              </div>

              {/* Features */}
              <div className="glass-card p-5">
                <h3 className="text-body font-semibold text-gray-400 uppercase tracking-wider mb-3">Security Features</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {result.features.map((f, i) => (
                    <div key={i} className="bg-navy-700/50 rounded-lg p-3 border border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${f.passed ? 'bg-success' : 'bg-danger'}`} />
                        <span className="text-body text-gray-300 truncate">{f.name}</span>
                      </div>
                      <span className={`text-caption font-semibold ${f.passed ? 'text-success' : 'text-danger'}`}>
                        {f.passed ? 'PASS' : 'FAIL'} {Math.round(f.confidence * 100)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}
