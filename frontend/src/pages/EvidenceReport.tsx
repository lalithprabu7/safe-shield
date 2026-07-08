import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Download, Loader2, Eye, ChevronDown, ChevronUp, AlertTriangle, Target } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { useToast } from '../components/common/Toast';

interface EvidenceCase {
  id: string;
  title: string;
  timestamp: string;
  type: string;
  riskScore: number;
  status: string;
  transcript_excerpt: string;
  detected_patterns: string[];
  confidence_scores: Record<string, number>;
  phone_number: string;
  duration_seconds: number;
  amount_at_risk: string;
}

export default function EvidenceReport() {
  const [cases, setCases] = useState<EvidenceCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);
  const [expandedCase, setExpandedCase] = useState<string | null>(null);
  const toast = useToast();

  useEffect(() => {
    const fetchCases = async () => {
      try {
        const resp = await fetch('/api/evidence/cases');
        if (!resp.ok) throw new Error('Failed');
        const data = await resp.json();
        setCases(data);
      } catch {
        // empty
      } finally {
        setLoading(false);
      }
    };
    fetchCases();
  }, []);

  const generatePDF = async (caseData: EvidenceCase, e: React.MouseEvent) => {
    e.stopPropagation();
    setGenerating(caseData.id);
    try {
      // Fetch report data
      const resp = await fetch('/api/evidence/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(caseData),
      });
      if (!resp.ok) throw new Error('Failed');
      const report = await resp.json();

      await new Promise((r) => setTimeout(r, 800));

      // Generate PDF
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();

      // Letterhead header
      doc.setFillColor(11, 17, 32);
      doc.rect(0, 0, pageWidth, 35, 'F');
      doc.setFillColor(6, 182, 212);
      doc.rect(0, 35, pageWidth, 2, 'F');

      doc.setTextColor(6, 182, 212);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('DIGITALSHIELD AI', 15, 15);
      doc.setFontSize(9);
      doc.setTextColor(156, 163, 175);
      doc.text('DIGITAL PUBLIC SAFETY INTELLIGENCE PLATFORM', 15, 22);
      doc.setFontSize(8);
      doc.text('EVIDENCE REPORT — CONFIDENTIAL', 15, 30);

      // Timestamp + Case ID
      doc.setTextColor(107, 114, 128);
      doc.setFontSize(8);
      doc.text(`Generated: ${new Date(report.generatedAt).toLocaleString('en-IN')}`, pageWidth - 15, 15, { align: 'right' });
      doc.text(`Case ID: ${report.caseId}`, pageWidth - 15, 22, { align: 'right' });

      let y = 48;

      // Title
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(report.title, 15, y);
      y += 10;

      // Summary
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(55, 65, 81);
      const summaryLines = doc.splitTextToSize(report.summary, pageWidth - 30);
      doc.text(summaryLines, 15, y);
      y += summaryLines.length * 5 + 8;

      // Details section
      const addSection = (title: string, content: string[][]) => {
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(6, 182, 212);
        doc.text(title, 15, y);
        y += 7;
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(55, 65, 81);
        content.forEach(([label, value]) => {
          doc.setFont('helvetica', 'bold');
          doc.text(`${label}:`, 20, y);
          doc.setFont('helvetica', 'normal');
          doc.text(value, 70, y);
          y += 5.5;
        });
        y += 5;
      };

      addSection('CASE DETAILS', [
        ['Type', report.type],
        ['Risk Score', `${report.riskScore}/100`],
        ['Phone Number', report.phoneNumber],
        ['Call Duration', report.duration],
        ['Amount at Risk', report.amountAtRisk],
      ]);

      addSection('CONFIDENCE SCORES', Object.entries(report.confidenceScores).map(([k, v]) => [
        k.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
        `${Math.round((v as number) * 100)}%`,
      ]));

      // Detected patterns
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(6, 182, 212);
      doc.text('DETECTED PATTERNS', 15, y);
      y += 7;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(55, 65, 81);
      report.detectedPatterns.forEach((p: string) => {
        doc.text(`• ${p}`, 20, y);
        y += 5;
      });
      y += 5;

      // Transcript excerpt
      if (report.transcriptExcerpt) {
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(6, 182, 212);
        doc.text('TRANSCRIPT EXCERPT', 15, y);
        y += 7;
        doc.setFontSize(8);
        doc.setFont('courier', 'normal');
        doc.setTextColor(75, 85, 99);
        const excerptLines = doc.splitTextToSize(`"${report.transcriptExcerpt}"`, pageWidth - 35);
        doc.text(excerptLines, 20, y);
        y += excerptLines.length * 4 + 8;
      }

      // Recommendations
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(6, 182, 212);
      doc.text('RECOMMENDATIONS', 15, y);
      y += 7;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(55, 65, 81);
      report.recommendations.forEach((r: string, i: number) => {
        doc.text(`${i + 1}. ${r}`, 20, y);
        y += 5.5;
      });

      // Footer
      doc.setFillColor(6, 182, 212);
      doc.rect(0, 285, pageWidth, 1, 'F');
      doc.setFontSize(7);
      doc.setTextColor(156, 163, 175);
      doc.text('This report was auto-generated by DigitalShield AI. For official use only.', pageWidth / 2, 291, { align: 'center' });

      doc.save(`${report.caseId}_Evidence_Report.pdf`);
      toast.showToast('success', 'Report Generated', `PDF saved as ${report.caseId}_Evidence_Report.pdf`);
    } catch {
      toast.showToast('error', 'Generation Failed', 'Could not generate PDF report');
    } finally {
      setGenerating(null);
    }
  };

  if (loading) {
    return (
      <div className="glass-card p-8 flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      <div className="glass-card p-5">
        <div className="flex items-center gap-3 mb-1">
            <FileText className="w-5 h-5 text-accent" />
            <h3 className="text-body-lg font-semibold text-white">Forensic Evidence Export</h3>
        </div>
        <p className="text-body text-gray-400 mb-6 pl-8">Select a flagged case to preview forensic data and generate an official FIR-ready PDF report.</p>

        <div className="space-y-3">
          {cases.map((c, i) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className={`rounded-xl border transition-all cursor-pointer ${
                  expandedCase === c.id 
                  ? 'bg-navy-800 border-accent/40 shadow-[0_0_15px_rgba(6,182,212,0.1)]' 
                  : 'bg-navy-700/50 border-white/5 hover:border-white/10'
              }`}
              onClick={() => setExpandedCase(expandedCase === c.id ? null : c.id)}
            >
              <div className="p-4 flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[10px] font-mono text-accent bg-accent/10 px-2 py-0.5 rounded">{c.id}</span>
                    <span className={`text-[10px] uppercase font-semibold tracking-wider px-2 py-0.5 rounded ${c.riskScore >= 70 ? 'bg-danger/20 text-danger' : 'bg-warning/20 text-warning'}`}>
                        {c.type}
                    </span>
                    <span className="text-[10px] text-gray-500 ml-auto">
                        {new Date(c.timestamp).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                    </span>
                  </div>
                  <h4 className="text-body font-semibold text-white mb-2 truncate">{c.title}</h4>
                  
                  {expandedCase !== c.id && (
                      <p className="text-caption text-gray-500 line-clamp-1 italic">"{c.transcript_excerpt}"</p>
                  )}
                  
                  <div className="flex flex-wrap gap-x-5 gap-y-2 mt-3 text-[11px] text-gray-400">
                    <span className="flex items-center gap-1.5">
                        <AlertTriangle className={`w-3.5 h-3.5 ${c.riskScore >= 70 ? 'text-danger' : 'text-warning'}`} />
                        Threat Confidence: <span className="text-white font-semibold">{c.riskScore}%</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="text-gray-500">Target Phone:</span> <span className="font-mono text-white">{c.phone_number}</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="text-gray-500">Value at Risk:</span> <span className="text-danger font-semibold">{c.amount_at_risk}</span>
                    </span>
                  </div>
                </div>
                
                <div className="flex flex-col items-end gap-3 shrink-0">
                    <button
                      onClick={(e) => generatePDF(c, e)}
                      disabled={generating === c.id}
                      className="btn-primary flex items-center gap-2 text-caption px-4 py-2"
                    >
                      {generating === c.id ? (
                        <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating...</>
                      ) : (
                        <><Download className="w-3.5 h-3.5" /> Export PDF</>
                      )}
                    </button>
                    {expandedCase === c.id ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </div>
              </div>
              
              {/* Expanded Forensic Details */}
              <AnimatePresence>
                  {expandedCase === c.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                          <div className="p-4 pt-0 border-t border-white/10 mt-2 grid grid-cols-1 md:grid-cols-2 gap-5">
                              {/* Left side */}
                              <div className="space-y-4">
                                  <div>
                                      <h5 className="text-[10px] uppercase font-semibold text-gray-500 tracking-wider mb-2">Transcript Excerpt</h5>
                                      <div className="bg-navy-900 rounded p-3 border border-white/5 font-mono text-[11px] text-gray-400 leading-relaxed italic">
                                          "{c.transcript_excerpt}"
                                      </div>
                                  </div>
                                  
                                  <div>
                                      <h5 className="text-[10px] uppercase font-semibold text-gray-500 tracking-wider mb-2 flex items-center gap-2">
                                          <Target className="w-3 h-3" /> Detected Threat Vectors
                                      </h5>
                                      <ul className="space-y-1">
                                          {c.detected_patterns.map((pattern, idx) => (
                                              <li key={idx} className="text-caption text-danger-light bg-danger/10 px-2 py-1 rounded inline-block mr-2 mb-1 border border-danger/20">
                                                  {pattern}
                                              </li>
                                          ))}
                                      </ul>
                                  </div>
                              </div>
                              
                              {/* Right side */}
                              <div>
                                  <h5 className="text-[10px] uppercase font-semibold text-gray-500 tracking-wider mb-2">Forensic Confidence Scores</h5>
                                  <div className="space-y-2.5">
                                      {Object.entries(c.confidence_scores).map(([key, score]) => (
                                          <div key={key}>
                                              <div className="flex justify-between text-[11px] mb-1">
                                                  <span className="text-gray-300 capitalize">{key.replace(/_/g, ' ')}</span>
                                                  <span className={score >= 0.7 ? 'text-danger font-semibold' : 'text-warning font-semibold'}>
                                                      {Math.round(score * 100)}%
                                                  </span>
                                              </div>
                                              <div className="w-full h-1 bg-navy-900 rounded-full overflow-hidden">
                                                  <div 
                                                      className={`h-full rounded-full ${score >= 0.7 ? 'bg-danger' : 'bg-warning'}`} 
                                                      style={{ width: `${score * 100}%` }}
                                                  />
                                              </div>
                                          </div>
                                      ))}
                                  </div>
                              </div>
                          </div>
                      </motion.div>
                  )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
