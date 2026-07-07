import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Download, Loader2, Eye } from 'lucide-react';
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

  const generatePDF = async (caseData: EvidenceCase) => {
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
    <div className="space-y-5 max-w-4xl">
      <div className="glass-card p-5">
        <h3 className="text-body-lg font-semibold text-white mb-1">Evidence Report Generator</h3>
        <p className="text-body text-gray-400 mb-5">Select a flagged case to generate an official evidence report (PDF)</p>

        <div className="space-y-3">
          {cases.map((c, i) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="bg-navy-700/50 rounded-xl p-4 border border-white/5 hover:border-white/10 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-caption font-mono text-accent">{c.id}</span>
                    <span className="badge-danger">{c.type}</span>
                  </div>
                  <h4 className="text-body font-semibold text-white mb-1 truncate">{c.title}</h4>
                  <p className="text-caption text-gray-500 line-clamp-2">{c.transcript_excerpt}</p>
                  <div className="flex gap-4 mt-2 text-caption text-gray-500">
                    <span>Risk: <span className="text-danger font-semibold">{c.riskScore}%</span></span>
                    <span>Phone: {c.phone_number}</span>
                    <span>At risk: <span className="text-warning">{c.amount_at_risk}</span></span>
                  </div>
                </div>
                <button
                  onClick={() => generatePDF(c)}
                  disabled={generating === c.id}
                  className="btn-primary flex items-center gap-2 shrink-0 text-caption"
                >
                  {generating === c.id ? (
                    <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating...</>
                  ) : (
                    <><Download className="w-3.5 h-3.5" /> Generate PDF</>
                  )}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
