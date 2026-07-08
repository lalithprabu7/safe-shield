import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, ScanLine, CheckCircle, AlertTriangle, Loader2, ChevronDown, ChevronUp, FileText, AlertOctagon } from 'lucide-react';

interface Feature {
  name: string;
  region: { x: number; y: number; width: number; height: number };
  passed: boolean;
  confidence: number;
  description: string;
  expectedValue: string;
  detectedValue: string;
}

interface AnalysisResult {
  isGenuine: boolean;
  overallConfidence: number;
  denomination: string;
  features: Feature[];
  verdict: string;
  analysisDetails: string;
  serialNumber: string;
  series: string;
  recommendations: string[];
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
  const [expandedFeature, setExpandedFeature] = useState<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [samples] = useState(() => ({
    genuine: generateSampleImage('genuine'),
    fake1: generateSampleImage('fake1'),
    fake2: generateSampleImage('fake2'),
  }));

  const extractImageFeatures = async (base64Str: string): Promise<number[]> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const cvs = document.createElement('canvas');
        cvs.width = img.width;
        cvs.height = img.height;
        const ctx = cvs.getContext('2d');
        if (!ctx) return resolve([0,0,0]);
        ctx.drawImage(img, 0, 0);
        
        const imgData = ctx.getImageData(0, 0, img.width, img.height).data;
        let sumBrightness = 0;
        const brightnessArray: number[] = [];
        
        // Convert to grayscale brightness
        for (let i = 0; i < imgData.length; i += 4) {
          const b = (imgData[i] + imgData[i+1] + imgData[i+2]) / 3;
          sumBrightness += b;
          brightnessArray.push(b);
        }
        
        const avgBrightness = sumBrightness / brightnessArray.length;
        
        // Calculate Contrast (Standard Deviation of Brightness)
        let sumVariance = 0;
        for (let i = 0; i < brightnessArray.length; i++) {
          sumVariance += Math.pow(brightnessArray[i] - avgBrightness, 2);
        }
        const stdDev = Math.sqrt(sumVariance / brightnessArray.length);
        
        // Normalize Features (Assuming max brightness 255, max stdDev ~127)
        const normalizedBrightness = avgBrightness / 255.0;
        const normalizedContrast = stdDev / 127.0;
        
        // Random 3rd feature (simulate Edge Density for now)
        const edgeDensity = Math.random(); // In a real massive CV system this would be a Sobel filter

        resolve([normalizedBrightness, normalizedContrast, edgeDensity]);
      };
      img.src = base64Str;
    });
  };

  const analyze = async (imgSrc: string, name: string) => {
    setSelectedImage(imgSrc);
    setFileName(name);
    setAnalyzing(true);
    setResult(null);
    setExpandedFeature(null);

    try {
      const features = await extractImageFeatures(imgSrc);
      const resp = await fetch('/api/currency/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: name, features }),
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

      result.features.forEach((f, i) => {
        const x = f.region.x * img.width;
        const y = f.region.y * img.height;
        const w = f.region.width * img.width;
        const h = f.region.height * img.height;

        // Highlight expanded feature
        const isExpanded = expandedFeature === i;
        ctx.strokeStyle = f.passed ? '#10B981' : '#EF4444';
        ctx.lineWidth = isExpanded ? 4 : 2;
        ctx.setLineDash(isExpanded ? [] : [6, 3]);
        ctx.strokeRect(x, y, w, h);
        ctx.setLineDash([]);

        if (isExpanded) {
            ctx.fillStyle = f.passed ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)';
            ctx.fillRect(x, y, w, h);
        }

        // Label
        const labelH = 18;
        ctx.fillStyle = f.passed ? 'rgba(16,185,129,0.9)' : 'rgba(239,68,68,0.9)';
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
  }, [result, selectedImage, expandedFeature]);

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
          <div className="space-y-5">
              <div className="glass-card p-5">
                <h3 className="text-body font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  {analyzing ? 'Scanning...' : 'Annotated Analysis'}
                </h3>
                {analyzing ? (
                  <div className="h-[280px] flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-accent animate-spin" />
                  </div>
                ) : (
                  <canvas ref={canvasRef} className="w-full rounded-lg border border-white/10" />
                )}
              </div>

              {result && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5">
                      <h3 className="text-body font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <FileText className="w-4 h-4" /> Analysis Details
                      </h3>
                      <div className="space-y-3">
                          <div className="flex gap-4">
                              <div className="flex-1 bg-navy-800 rounded-lg p-3 border border-white/5">
                                  <span className="text-caption text-gray-400 block mb-1">Denomination</span>
                                  <span className="text-body font-bold text-white">{result.denomination}</span>
                              </div>
                              <div className="flex-1 bg-navy-800 rounded-lg p-3 border border-white/5">
                                  <span className="text-caption text-gray-400 block mb-1">Series</span>
                                  <span className="text-body font-bold text-white">{result.series}</span>
                              </div>
                          </div>
                          <div className="bg-navy-800 rounded-lg p-3 border border-white/5">
                              <span className="text-caption text-gray-400 block mb-1">Detected Serial Number</span>
                              <span className="text-body-lg font-mono text-accent tracking-widest">{result.serialNumber}</span>
                          </div>
                          <p className="text-body text-gray-300 leading-relaxed bg-navy-900/50 p-4 rounded-lg border border-white/5">
                              {result.analysisDetails}
                          </p>
                      </div>
                  </motion.div>
              )}
          </div>

          {result && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
              {/* Verdict */}
              <div className={`glass-card p-5 border ${result.isGenuine ? 'border-success/30 bg-success/5' : 'border-danger/30 bg-danger/5'}`}>
                <div className="flex items-center gap-3">
                  {result.isGenuine ? (
                    <CheckCircle className="w-10 h-10 text-success" />
                  ) : (
                    <AlertTriangle className="w-10 h-10 text-danger" />
                  )}
                  <div>
                    <h3 className={`text-h3 font-bold ${result.isGenuine ? 'text-success' : 'text-danger'}`}>
                      {result.isGenuine ? 'GENUINE NOTE' : 'COUNTERFEIT DETECTED'}
                    </h3>
                    <p className="text-body text-gray-300 mt-1">
                      {result.verdict}
                    </p>
                  </div>
                </div>
              </div>

              {/* Actionable Recommendations */}
              {!result.isGenuine && (
                <div className="glass-card p-5 border border-warning/20 bg-warning/5">
                    <h3 className="text-body font-semibold text-warning uppercase tracking-wider mb-3 flex items-center gap-2">
                        <AlertOctagon className="w-4 h-4" /> Recommended Actions
                    </h3>
                    <ul className="space-y-2">
                        {result.recommendations.map((rec, i) => (
                            <li key={i} className="text-body text-gray-200 flex items-start gap-2">
                                <span className="text-warning mt-1">•</span> {rec}
                            </li>
                        ))}
                    </ul>
                </div>
              )}

              {/* Features */}
              <div className="glass-card p-5">
                <h3 className="text-body font-semibold text-gray-400 uppercase tracking-wider mb-3">Detailed Security Features ({result.features.length})</h3>
                <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                  {result.features.map((f, i) => (
                    <div 
                      key={i} 
                      className={`bg-navy-800 rounded-lg border transition-colors cursor-pointer
                        ${expandedFeature === i ? 'border-accent/50 bg-navy-700' : 'border-white/5 hover:border-white/20'}`}
                      onClick={() => setExpandedFeature(expandedFeature === i ? null : i)}
                    >
                      <div className="p-3 flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${f.passed ? 'bg-success shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-danger shadow-[0_0_8px_rgba(239,68,68,0.5)]'}`} />
                          <span className="text-body font-medium text-gray-200 truncate">{f.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className={`text-caption font-bold ${f.passed ? 'text-success' : 'text-danger'}`}>
                            {f.passed ? 'PASS' : 'FAIL'} {Math.round(f.confidence * 100)}%
                            </span>
                            {expandedFeature === i ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                        </div>
                      </div>
                      
                      <AnimatePresence>
                          {expandedFeature === i && (
                              <motion.div 
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                              >
                                  <div className="p-3 pt-0 border-t border-white/10 mt-1 space-y-3">
                                      <p className="text-caption text-gray-300 leading-relaxed mt-2">
                                          {f.description}
                                      </p>
                                      <div className="grid grid-cols-2 gap-3 bg-navy-900 rounded p-2 border border-white/5">
                                          <div>
                                              <span className="text-[10px] uppercase text-gray-500 font-semibold tracking-wider block">Expected</span>
                                              <span className="text-caption text-gray-300 block">{f.expectedValue}</span>
                                          </div>
                                          <div>
                                              <span className="text-[10px] uppercase text-gray-500 font-semibold tracking-wider block">Detected</span>
                                              <span className={`text-caption block ${f.passed ? 'text-success' : 'text-danger'}`}>{f.detectedValue}</span>
                                          </div>
                                      </div>
                                  </div>
                              </motion.div>
                          )}
                      </AnimatePresence>
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
