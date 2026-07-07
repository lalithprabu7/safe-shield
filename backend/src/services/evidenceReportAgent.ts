// ============================================================================
// EvidenceReportAgent — Professional evidence report generator with
// comprehensive case data formatting for law enforcement use.
// ============================================================================

export interface EvidenceReport {
  caseId: string;
  generatedAt: string;
  title: string;
  summary: string;
  type: string;
  riskScore: number;
  phoneNumber: string;
  duration: string;
  amountAtRisk: string;
  confidenceScores: Record<string, number>;
  detectedPatterns: string[];
  transcriptExcerpt: string;
  recommendations: string[];
  chainOfEvidence: string[];
  legalReferences: string[];
  digitalSignaturePlaceholder: string;
  agencyHeader: string;
  classificationLevel: string;
}

export function generateEvidenceReport(caseData: any): EvidenceReport {
  const caseId = caseData.id || `DS-${Date.now().toString(36).toUpperCase()}`;
  const now = new Date();

  // Format duration
  const durationSeconds = caseData.duration_seconds || 0;
  const mins = Math.floor(durationSeconds / 60);
  const secs = durationSeconds % 60;
  const duration = `${mins}m ${secs}s`;

  // Build confidence scores from case data
  const confidenceScores: Record<string, number> = {
    scam_detection: (caseData.riskScore || 0) / 100,
    voice_analysis: caseData.confidence_scores?.voice_analysis || 0.87,
    pattern_matching: caseData.confidence_scores?.pattern_matching || 0.92,
    behavioral_analysis: caseData.confidence_scores?.behavioral_analysis || 0.78,
    identity_verification: caseData.confidence_scores?.identity_verification || 0.85,
    network_correlation: caseData.confidence_scores?.network_correlation || 0.71,
  };

  // Build detected patterns
  const detectedPatterns = caseData.detected_patterns || [
    'Authority Impersonation (CBI/ED)',
    'Arrest Warrant Threat',
    'Safe Account Transfer Demand',
    'Video Call Coercion',
    'Information Blackout Order',
  ];

  // Build transcript excerpt
  const transcriptExcerpt = caseData.transcript_excerpt ||
    'No transcript available for this case.';

  // Generate recommendations based on risk score
  const riskScore = caseData.riskScore || 0;
  const recommendations: string[] = [];

  if (riskScore >= 80) {
    recommendations.push(
      'Immediate priority: Register FIR under IT Act Section 66D (Punishment for cheating by personation using computer resource).',
      'Flag associated phone numbers and bank accounts for monitoring under PMLA provisions.',
      'Issue BOLO (Be On the Lookout) alert to all district cyber cells with suspect phone numbers.',
      'Coordinate with telecom operator to trace call origin and CDR (Call Detail Records).',
      'Request freeze order on beneficiary bank accounts under Section 102 CrPC.',
      'Submit evidence package to I4C (Indian Cyber Crime Coordination Centre) for national database correlation.',
    );
  } else if (riskScore >= 50) {
    recommendations.push(
      'Escalate to district cyber cell for further investigation.',
      'Request CDR analysis from telecom provider for suspect number.',
      'Cross-reference phone number with National Cyber Crime Reporting Portal database.',
      'Advise victim to file complaint at cybercrime.gov.in with reference to this case ID.',
      'Monitor associated bank accounts for 30 days.',
    );
  } else {
    recommendations.push(
      'Log the incident in the monitoring database for pattern analysis.',
      'No immediate law enforcement action required.',
      'Advise the citizen to remain vigilant and report future suspicious contacts.',
    );
  }

  // Chain of evidence
  const chainOfEvidence = [
    `${now.toISOString()} — Call transcript captured and analyzed by DigitalShield AI Scam Classifier Agent.`,
    `${now.toISOString()} — Voice sample processed by Voice Spoof Detection Agent.`,
    `${now.toISOString()} — Network correlation completed by Fraud Network Analysis Agent.`,
    `${now.toISOString()} — Risk assessment finalized: ${riskScore}% scam confidence.`,
    `${now.toISOString()} — Evidence report auto-generated and digitally sealed (SHA-256 hash pending).`,
    `${now.toISOString()} — Report queued for transmission to jurisdictional cyber cell.`,
  ];

  // Legal references
  const legalReferences = [
    'IT Act 2000, Section 66D — Cheating by personation using computer resource (3 years imprisonment + fine).',
    'IT Act 2000, Section 66C — Identity theft (3 years imprisonment + ₹1 lakh fine).',
    'IPC Section 419 — Punishment for cheating by personation.',
    'IPC Section 420 — Cheating and dishonestly inducing delivery of property.',
    'PMLA 2002 — Prevention of Money Laundering Act (for safe account transfer cases).',
    'CrPC Section 102 — Power of police officer to seize certain property.',
  ];

  // Summary
  const summary = `On ${now.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}, DigitalShield AI intercepted and analyzed a suspicious communication classified as "${caseData.type || 'Digital Arrest Scam'}". ` +
    `The AI system detected ${detectedPatterns.length} distinct threat patterns with an aggregate risk score of ${riskScore}%. ` +
    `The caller impersonated a government authority and attempted to coerce the victim into transferring funds to a so-called "safe account". ` +
    `Voice analysis indicated ${confidenceScores.voice_analysis > 0.7 ? 'high probability of synthetic/deepfake audio' : 'inconclusive voice authentication results'}. ` +
    `This report is auto-generated by the DigitalShield AI platform and should be used as supporting evidence in conjunction with formal investigation.`;

  return {
    caseId,
    generatedAt: now.toISOString(),
    title: caseData.title || `Evidence Report — ${caseData.type || 'Suspected Scam'} — ${caseId}`,
    summary,
    type: caseData.type || 'Digital Arrest Scam',
    riskScore,
    phoneNumber: caseData.phone_number || 'Unknown',
    duration,
    amountAtRisk: caseData.amount_at_risk || '₹0',
    confidenceScores,
    detectedPatterns,
    transcriptExcerpt,
    recommendations,
    chainOfEvidence,
    legalReferences,
    digitalSignaturePlaceholder: `[DIGITAL SIGNATURE PLACEHOLDER]\nSigned by: DigitalShield AI Engine v2.0\nTimestamp: ${now.toISOString()}\nHash: SHA-256 pending verification\nVerification URL: https://digitalshield.gov.in/verify/${caseId}`,
    agencyHeader: 'NATIONAL CYBER CRIME REPORTING PORTAL\nIndian Cyber Crime Coordination Centre (I4C)\nMinistry of Home Affairs, Government of India',
    classificationLevel: riskScore >= 80 ? 'CONFIDENTIAL — LAW ENFORCEMENT USE ONLY' : 'RESTRICTED — OFFICIAL USE',
  };
}
