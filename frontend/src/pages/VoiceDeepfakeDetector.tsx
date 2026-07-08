import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileAudio, AlertTriangle, CheckCircle, Loader2, AudioWaveform, ChevronDown, ChevronUp, AlertOctagon } from 'lucide-react';

interface AnalysisResult {
  isDeepfake: boolean;
  confidence: number;
  riskLevel: string;
  explanation: string;
  technicalSummary: string;
  analysis: Record<string, { score: number; finding: string; expectedPattern: string; detectedPattern: string }>;
  audioMetrics: {
    estimatedDuration: string;
    sampleRate: string;
    channels: string;
    bitRate: string;
    silencePercentage: number;
    pitchRange: string;
    energyVariation: number;
    speechConsistency: number;
    backgroundNoiseLevel: string;
  };
  waveformData: number[];
}

function WaveformViz({ data, isDeepfake }: { data: number[]; isDeepfake: boolean }) {
  const width = 600;
  const height = 120;
  const barWidth = width / data.length;
  const color = isDeepfake ? '#EF4444' : '#10B981';

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-28 rounded-lg">
      {data.map((val, i) => {
        const barH = Math.abs(val) * height * 0.8;
        return (
          <motion.rect
            key={i}
            x={i * barWidth}
            y={(height - barH) / 2}
            width={Math.max(barWidth - 1, 1)}
            height={barH}
            fill={color}
            opacity={0.7}
            initial={{ height: 0, y: height / 2 }}
            animate={{ height: barH, y: (height - barH) / 2 }}
            transition={{ delay: i * 0.005, duration: 0.3 }}
          />
        );
      })}
    </svg>
  );
}

export default function VoiceDeepfakeDetector() {
  const [file, setFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState('');
  const [expandedFeature, setExpandedFeature] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[], rejections: any[]) => {
    setError('');
    setResult(null);
    setExpandedFeature(null);
    if (rejections.length > 0) {
      const rej = rejections[0];
      if (rej.errors?.[0]?.code === 'file-too-large') setError('File exceeds 10MB limit.');
      else if (rej.errors?.[0]?.code === 'file-invalid-type') setError('Only .mp3 and .wav files accepted.');
      else setError('Invalid file. Please upload an MP3 or WAV file.');
      return;
    }
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'audio/mpeg': ['.mp3'], 'audio/wav': ['.wav'], 'audio/x-wav': ['.wav'] },
    maxSize: 10 * 1024 * 1024,
    maxFiles: 1,
  });

  const [extractedFeatures, setExtractedFeatures] = useState<{ zcr: number, rms: number, spectralCentroid: number } | null>(null);

  const extractAudioFeatures = async (audioFile: File): Promise<number[]> => {
    return new Promise((resolve, reject) => {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
          
          const channelData = audioBuffer.getChannelData(0); // Left channel or mono
          let zeroCrossings = 0;
          let sumSquares = 0;
          
          for (let i = 0; i < channelData.length; i++) {
            // Zero-Crossing Rate
            if (i > 0 && ((channelData[i] >= 0 && channelData[i-1] < 0) || (channelData[i] < 0 && channelData[i-1] >= 0))) {
              zeroCrossings++;
            }
            // Energy (RMS)
            sumSquares += channelData[i] * channelData[i];
          }
          
          const zcr = zeroCrossings / channelData.length; // Normalized ZCR
          const rms = Math.sqrt(sumSquares / channelData.length); // Root Mean Square Energy
          
          // ---- TRUE FFT SPECTRAL ANALYSIS ----
          // Use an OfflineAudioContext to render the audio graph quickly
          const offlineCtx = new OfflineAudioContext(1, audioBuffer.length, audioBuffer.sampleRate);
          const source = offlineCtx.createBufferSource();
          source.buffer = audioBuffer;
          
          const analyser = offlineCtx.createAnalyser();
          analyser.fftSize = 2048;
          
          source.connect(analyser);
          analyser.connect(offlineCtx.destination);
          
          source.start(0);
          await offlineCtx.startRendering(); // Process the graph
          
          const bufferLength = analyser.frequencyBinCount;
          const dataArray = new Uint8Array(bufferLength);
          analyser.getByteFrequencyData(dataArray);
          
          // Calculate Spectral Centroid (Center of Mass of Frequency)
          let sumWeightedFrequencies = 0;
          let sumAmplitudes = 0;
          
          for (let i = 0; i < bufferLength; i++) {
            const frequency = i * (audioBuffer.sampleRate / 2) / bufferLength;
            const amplitude = dataArray[i];
            
            sumWeightedFrequencies += frequency * amplitude;
            sumAmplitudes += amplitude;
          }
          
          const spectralCentroid = sumAmplitudes === 0 ? 0 : sumWeightedFrequencies / sumAmplitudes;
          
          // Normalize Spectral Centroid (Assume typical voice is under 4000Hz)
          const normalizedCentroid = Math.min(1.0, spectralCentroid / 4000.0);
          
          // Set UI State for Visualization
          setExtractedFeatures({
            zcr,
            rms,
            spectralCentroid
          });
          
          // Scale features for Neural Network Compatibility
          resolve([zcr * 10, rms * 10, normalizedCentroid]);
        } catch (err) {
          console.error("Audio decoding error:", err);
          resolve([0, 0, 0]);
        }
      };
      
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(audioFile);
    });
  };

  const analyze = async () => {
    if (!file) return;
    setAnalyzing(true);
    setResult(null);
    setExpandedFeature(null);
    setExtractedFeatures(null);
    try {
      // True Web Audio API feature extraction (ZCR, RMS, FFT Spectral Centroid)
      const features = await extractAudioFeatures(file);

      const resp = await fetch('/api/voice/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: file.name, fileSize: file.size, features }),
      });
      if (!resp.ok) throw new Error('Analysis failed');
      const data = await resp.json();
      // Simulate processing time
      await new Promise((r) => setTimeout(r, 1500));
      setResult(data);
    } catch (err) {
      setError('Analysis failed. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const reset = () => {
    setFile(null);
    setResult(null);
    setError('');
    setExpandedFeature(null);
  };

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      {/* Upload Zone */}
      <div className="glass-card p-6">
        <h3 className="text-body-lg font-semibold text-white mb-4">Upload Audio Sample</h3>
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
            isDragActive
              ? 'border-accent bg-accent/5'
              : 'border-white/10 hover:border-white/20 hover:bg-white/[0.02]'
          }`}
        >
          <input {...getInputProps()} />
          <Upload className={`w-10 h-10 mx-auto mb-3 ${isDragActive ? 'text-accent' : 'text-gray-500'}`} />
          <p className="text-body text-gray-300 mb-1">
            {isDragActive ? 'Drop your audio file here' : 'Drag & drop an audio file, or click to browse'}
          </p>
          <p className="text-caption text-gray-500">Accepts .mp3, .wav — Max 10MB</p>
        </div>

        {error && (
          <div className="mt-3 flex items-center gap-2 text-caption text-danger">
            <AlertTriangle className="w-3.5 h-3.5" /> {error}
          </div>
        )}

        {file && !result && (
          <div className="mt-4 flex flex-col gap-4 bg-navy-700/50 rounded-lg p-4 border border-white/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileAudio className="w-5 h-5 text-accent" />
                <div>
                  <p className="text-body text-white">{file.name}</p>
                  <p className="text-caption text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={reset} className="btn-secondary text-caption">Remove</button>
                <button onClick={analyze} disabled={analyzing} className="btn-primary text-caption flex items-center gap-2">
                  {analyzing ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Analyzing...</> : <><AudioWaveform className="w-3.5 h-3.5" /> Analyze</>}
                </button>
              </div>
            </div>

            {/* Neural Network Live Input Visualizer */}
            {analyzing && extractedFeatures && (
              <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="bg-navy-900/60 p-4 rounded-lg border border-white/5 mt-2">
                <h4 className="text-[10px] uppercase text-accent font-semibold tracking-wider mb-3">Live Neural Network Inputs (Web Audio API)</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-caption text-gray-400 mb-1 flex justify-between">
                      <span>ZCR (Fricatives)</span>
                      <span>{(extractedFeatures.zcr * 100).toFixed(2)}%</span>
                    </p>
                    <div className="w-full bg-navy-800 rounded-full h-1.5">
                      <div className="bg-emerald-400 h-1.5 rounded-full" style={{ width: `${Math.min(100, extractedFeatures.zcr * 500)}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <p className="text-caption text-gray-400 mb-1 flex justify-between">
                      <span>RMS Energy</span>
                      <span>{(extractedFeatures.rms).toFixed(4)}</span>
                    </p>
                    <div className="w-full bg-navy-800 rounded-full h-1.5">
                      <div className="bg-blue-400 h-1.5 rounded-full" style={{ width: `${Math.min(100, extractedFeatures.rms * 500)}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <p className="text-caption text-gray-400 mb-1 flex justify-between">
                      <span>Spectral Centroid</span>
                      <span>{(extractedFeatures.spectralCentroid).toFixed(0)} Hz</span>
                    </p>
                    <div className="w-full bg-navy-800 rounded-full h-1.5">
                      <div className="bg-purple-400 h-1.5 rounded-full" style={{ width: `${Math.min(100, extractedFeatures.spectralCentroid / 4000 * 100)}%` }}></div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        )}
      </div>

      {/* Results Grid */}
      {result && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Left Column */}
          <div className="space-y-5">
              {/* Verdict */}
              <div className={`glass-card p-5 border ${result.isDeepfake ? 'border-danger/30 bg-danger/5' : 'border-success/30 bg-success/5'}`}>
                <div className="flex items-center gap-3 mb-4">
                  {result.isDeepfake ? (
                    <div className="w-12 h-12 rounded-full bg-danger/20 flex items-center justify-center">
                      <AlertTriangle className="w-6 h-6 text-danger" />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-success" />
                    </div>
                  )}
                  <div>
                    <h3 className="text-h3 font-semibold text-white">
                      {result.isDeepfake ? 'DEEPFAKE DETECTED' : 'AUTHENTIC VOICE'}
                    </h3>
                    <p className="text-body text-gray-400">
                      Confidence Score: <span className={result.isDeepfake ? 'text-danger font-bold' : 'text-success font-bold'}>{Math.round(result.confidence * 100)}%</span>
                    </p>
                  </div>
                  <span className={`ml-auto ${result.isDeepfake ? 'badge-danger' : 'badge-safe'}`}>
                    {result.riskLevel.toUpperCase()}
                  </span>
                </div>
                <p className="text-body text-gray-300 leading-relaxed p-3 bg-navy-900/50 rounded-lg border border-white/5">{result.explanation}</p>
              </div>

              {/* Actionable Recommendations */}
              {result.isDeepfake && (
                  <div className="glass-card p-5 border border-warning/20 bg-warning/5">
                      <h3 className="text-body font-semibold text-warning uppercase tracking-wider mb-3 flex items-center gap-2">
                          <AlertOctagon className="w-4 h-4" /> Recommended Actions
                      </h3>
                      <ul className="space-y-2 text-body text-gray-200">
                          <li className="flex items-start gap-2"><span className="text-warning mt-1">•</span> Do not trust instructions given in this audio.</li>
                          <li className="flex items-start gap-2"><span className="text-warning mt-1">•</span> If this is a voicemail claiming to be family or an official, verify independently via a known phone number.</li>
                          <li className="flex items-start gap-2"><span className="text-warning mt-1">•</span> Preserve this audio file as digital evidence for cyber crime reporting (IPC Section 419).</li>
                      </ul>
                  </div>
              )}

              {/* Audio Metrics */}
              {result.audioMetrics && (
                <div className="glass-card p-5">
                  <h3 className="text-body font-semibold text-gray-400 uppercase tracking-wider mb-3">Audio Profile Extraction</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {[
                      { label: 'Duration', value: result.audioMetrics.estimatedDuration },
                      { label: 'Sample Rate', value: result.audioMetrics.sampleRate },
                      { label: 'Channels', value: result.audioMetrics.channels },
                      { label: 'Silence', value: `${result.audioMetrics.silencePercentage}%` },
                      { label: 'Pitch Range', value: result.audioMetrics.pitchRange },
                      { label: 'Energy Var', value: result.audioMetrics.energyVariation },
                    ].map((m) => (
                      <div key={m.label} className="bg-navy-800 rounded-lg p-3 border border-white/5 flex flex-col justify-center">
                        <span className="text-[10px] uppercase text-gray-500 font-semibold tracking-wider block mb-1">{m.label}</span>
                        <span className="text-caption font-bold text-white block">{m.value}</span>
                      </div>
                    ))}
                  </div>
                  {result.technicalSummary && (
                      <p className="text-caption text-gray-500 mt-4 italic">{result.technicalSummary}</p>
                  )}
                </div>
              )}
          </div>

          {/* Right Column */}
          <div className="space-y-5">
              {/* Waveform */}
              <div className="glass-card p-5">
                <h3 className="text-body font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <AudioWaveform className="w-4 h-4" /> Waveform Analysis
                </h3>
                <div className="bg-navy-800 rounded-lg p-3 border border-white/5">
                  <WaveformViz data={result.waveformData} isDeepfake={result.isDeepfake} />
                </div>
              </div>

              {/* Analysis Details (Interactive Accordion) */}
              <div className="glass-card p-5">
                <h3 className="text-body font-semibold text-gray-400 uppercase tracking-wider mb-3">Detailed Forensic Breakdown</h3>
                <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                  {Object.entries(result.analysis).map(([key, val]) => (
                    <div 
                      key={key} 
                      className={`bg-navy-800 rounded-lg border transition-colors cursor-pointer
                        ${expandedFeature === key ? 'border-accent/50 bg-navy-700' : 'border-white/5 hover:border-white/20'}`}
                      onClick={() => setExpandedFeature(expandedFeature === key ? null : key)}
                    >
                      <div className="p-3 flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <span className={`w-2.5 h-2.5 rounded-full shrink-0 
                            ${val.score > 0.6 ? 'bg-danger shadow-[0_0_8px_rgba(239,68,68,0.5)]' 
                            : val.score > 0.3 ? 'bg-warning shadow-[0_0_8px_rgba(245,158,11,0.5)]' 
                            : 'bg-success shadow-[0_0_8px_rgba(16,185,129,0.5)]'}`} />
                          <span className="text-body font-medium text-gray-200 capitalize truncate">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className={`text-caption font-bold 
                                ${val.score > 0.6 ? 'text-danger' : val.score > 0.3 ? 'text-warning' : 'text-success'}`}>
                                {Math.round(val.score * 100)}% Anomaly
                            </span>
                            {expandedFeature === key ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                        </div>
                      </div>
                      
                      <AnimatePresence>
                          {expandedFeature === key && (
                              <motion.div 
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                              >
                                  <div className="p-3 pt-0 border-t border-white/10 mt-1 space-y-3">
                                      <p className="text-caption text-gray-300 leading-relaxed mt-2">
                                          {val.finding}
                                      </p>
                                      <div className="grid grid-cols-2 gap-3 bg-navy-900 rounded p-2 border border-white/5">
                                          <div>
                                              <span className="text-[10px] uppercase text-gray-500 font-semibold tracking-wider block">Expected Human Model</span>
                                              <span className="text-caption text-gray-300 block">{val.expectedPattern}</span>
                                          </div>
                                          <div>
                                              <span className="text-[10px] uppercase text-gray-500 font-semibold tracking-wider block">Detected In Sample</span>
                                              <span className={`text-caption block 
                                                ${val.score > 0.6 ? 'text-danger' : val.score > 0.3 ? 'text-warning' : 'text-success'}`}>
                                                {val.detectedPattern}
                                              </span>
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
          </div>
        </motion.div>
      )}

      {result && (
        <div className="flex justify-center mt-5">
           <button onClick={reset} className="btn-secondary">Analyze Another Audio File</button>
        </div>
      )}
    </div>
  );
}
