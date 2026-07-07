import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';
import { Upload, FileAudio, AlertTriangle, CheckCircle, Loader2, AudioWaveform } from 'lucide-react';

interface AnalysisResult {
  isDeepfake: boolean;
  confidence: number;
  riskLevel: string;
  explanation: string;
  technicalSummary: string;
  analysis: Record<string, { score: number; finding: string }>;
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

  const onDrop = useCallback((acceptedFiles: File[], rejections: any[]) => {
    setError('');
    setResult(null);
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

  const analyze = async () => {
    if (!file) return;
    setAnalyzing(true);
    setResult(null);
    try {
      const resp = await fetch('/api/voice/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: file.name, fileSize: file.size }),
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
  };

  return (
    <div className="space-y-5 max-w-4xl">
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
          <div className="mt-4 flex items-center justify-between bg-navy-700/50 rounded-lg p-3 border border-white/5">
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
        )}
      </div>

      {/* Results */}
      {result && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
          {/* Waveform */}
          <div className="glass-card p-5">
            <h3 className="text-body font-semibold text-gray-400 uppercase tracking-wider mb-3">Waveform Analysis</h3>
            <div className="bg-navy-700/50 rounded-lg p-3 border border-white/5">
              <WaveformViz data={result.waveformData} isDeepfake={result.isDeepfake} />
            </div>
          </div>

          {/* Verdict */}
          <div className={`glass-card p-5 border ${result.isDeepfake ? 'border-danger/30' : 'border-success/30'}`}>
            <div className="flex items-center gap-3 mb-4">
              {result.isDeepfake ? (
                <div className="w-10 h-10 rounded-full bg-danger/20 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-danger" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-success" />
                </div>
              )}
              <div>
                <h3 className="text-body-lg font-semibold text-white">
                  {result.isDeepfake ? 'Deepfake Detected' : 'Authentic Voice'}
                </h3>
                <p className="text-caption text-gray-400">
                  Confidence: {Math.round(result.confidence * 100)}%
                </p>
              </div>
              <span className={`ml-auto ${result.isDeepfake ? 'badge-danger' : 'badge-safe'}`}>
                {result.riskLevel.toUpperCase()}
              </span>
            </div>
            <p className="text-body text-gray-300">{result.explanation}</p>
            {result.technicalSummary && (
              <p className="text-caption text-gray-500 mt-2 italic">{result.technicalSummary}</p>
            )}
          </div>

          {/* Audio Metrics */}
          {result.audioMetrics && (
            <div className="glass-card p-5">
              <h3 className="text-body font-semibold text-gray-400 uppercase tracking-wider mb-3">Audio Metrics</h3>
              <div className="grid grid-cols-3 lg:grid-cols-5 gap-3">
                {[
                  { label: 'Duration', value: result.audioMetrics.estimatedDuration },
                  { label: 'Sample Rate', value: result.audioMetrics.sampleRate },
                  { label: 'Channels', value: result.audioMetrics.channels },
                  { label: 'Silence', value: `${result.audioMetrics.silencePercentage}%` },
                  { label: 'Pitch Range', value: result.audioMetrics.pitchRange },
                ].map((m) => (
                  <div key={m.label} className="bg-navy-700/50 rounded-lg p-2.5 border border-white/5 text-center">
                    <p className="text-caption text-gray-500 mb-0.5">{m.label}</p>
                    <p className="text-caption font-semibold text-white">{m.value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Analysis Details */}
          <div className="glass-card p-5">
            <h3 className="text-body font-semibold text-gray-400 uppercase tracking-wider mb-4">Detailed Analysis</h3>
            <div className="space-y-3">
              {Object.entries(result.analysis).map(([key, val]) => (
                <div key={key} className="bg-navy-700/50 rounded-lg p-3 border border-white/5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-body font-medium text-gray-300 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                    <span className={`text-caption font-semibold ${val.score > 0.6 ? 'text-danger' : val.score > 0.3 ? 'text-warning' : 'text-success'}`}>
                      {Math.round(val.score * 100)}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-navy-600 rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full ${val.score > 0.6 ? 'bg-danger' : val.score > 0.3 ? 'bg-warning' : 'bg-success'}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${val.score * 100}%` }}
                      transition={{ duration: 0.8 }}
                    />
                  </div>
                  <p className="text-caption text-gray-500 mt-1.5">{val.finding}</p>
                </div>
              ))}
            </div>
          </div>

          <button onClick={reset} className="btn-secondary">Analyze Another File</button>
        </motion.div>
      )}
    </div>
  );
}
