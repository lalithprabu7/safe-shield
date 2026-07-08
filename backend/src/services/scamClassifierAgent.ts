import natural from 'natural';
import fs from 'fs';
import path from 'path';

// ---------------------------------------------------------------------------
// 1. ML TRAINING DATA
// ---------------------------------------------------------------------------

interface TrainingData {
  phrase: string;
  weight: number;
  category: string;
}

const VOICE_TRAINING_DATA: TrainingData[] = [
  // Authority Impersonation
  { phrase: 'cbi', weight: 12, category: 'Authority Impersonation' },
  { phrase: 'central bureau of investigation', weight: 14, category: 'Authority Impersonation' },
  { phrase: 'enforcement directorate', weight: 14, category: 'Authority Impersonation' },
  { phrase: 'ed', weight: 6, category: 'Authority Impersonation' },
  { phrase: 'narcotics bureau', weight: 13, category: 'Authority Impersonation' },
  { phrase: 'customs', weight: 8, category: 'Authority Impersonation' },
  { phrase: 'income tax', weight: 9, category: 'Authority Impersonation' },
  { phrase: 'reserve bank', weight: 10, category: 'Authority Impersonation' },
  { phrase: 'rbi', weight: 10, category: 'Authority Impersonation' },
  { phrase: 'high court', weight: 11, category: 'Authority Impersonation' },
  { phrase: 'supreme court', weight: 12, category: 'Authority Impersonation' },
  { phrase: 'interpol', weight: 13, category: 'Authority Impersonation' },
  { phrase: 'nia', weight: 12, category: 'Authority Impersonation' },

  // Arrest Threats
  { phrase: 'arrest', weight: 15, category: 'Arrest Threat' },
  { phrase: 'arrest warrant', weight: 18, category: 'Arrest Threat' },
  { phrase: 'non-bailable warrant', weight: 20, category: 'Arrest Threat' },
  { phrase: 'bail', weight: 8, category: 'Arrest Threat' },
  { phrase: 'jail', weight: 10, category: 'Arrest Threat' },
  { phrase: 'imprisonment', weight: 12, category: 'Arrest Threat' },
  { phrase: 'custody', weight: 10, category: 'Arrest Threat' },

  // Legal Intimidation
  { phrase: 'fir', weight: 10, category: 'Legal Intimidation' },
  { phrase: 'case registered', weight: 10, category: 'Legal Intimidation' },
  { phrase: 'pmla', weight: 12, category: 'Legal Intimidation' },
  { phrase: 'prevention of money laundering', weight: 14, category: 'Legal Intimidation' },
  { phrase: 'summons', weight: 8, category: 'Legal Intimidation' },
  { phrase: 'court order', weight: 9, category: 'Legal Intimidation' },

  // Criminal Accusation
  { phrase: 'money laundering', weight: 14, category: 'Criminal Accusation' },
  { phrase: 'hawala', weight: 13, category: 'Criminal Accusation' },
  { phrase: 'tax evasion', weight: 10, category: 'Criminal Accusation' },
  { phrase: 'drug trafficking', weight: 14, category: 'Criminal Accusation' },
  { phrase: 'narcotics', weight: 12, category: 'Criminal Accusation' },
  { phrase: 'smuggling', weight: 11, category: 'Criminal Accusation' },
  { phrase: 'terrorism financing', weight: 15, category: 'Criminal Accusation' },

  // Identity Harvesting
  { phrase: 'aadhaar', weight: 7, category: 'Identity Harvesting' },
  { phrase: 'aadhaar number', weight: 10, category: 'Identity Harvesting' },
  { phrase: 'pan card', weight: 8, category: 'Identity Harvesting' },
  { phrase: 'bank account number', weight: 10, category: 'Identity Harvesting' },
  { phrase: 'credit card', weight: 7, category: 'Identity Harvesting' },
  { phrase: 'cvv', weight: 12, category: 'Identity Harvesting' },
  { phrase: 'otp', weight: 10, category: 'Identity Harvesting' },
  { phrase: 'pin number', weight: 9, category: 'Identity Harvesting' },

  // Safe Account Demand
  { phrase: 'safe account', weight: 20, category: 'Safe Account Demand' },
  { phrase: 'government account', weight: 16, category: 'Safe Account Demand' },
  { phrase: 'rbi account', weight: 18, category: 'Safe Account Demand' },
  { phrase: 'transfer money', weight: 22, category: 'Safe Account Demand' },
  { phrase: 'transfer all savings', weight: 22, category: 'Safe Account Demand' },
  { phrase: 'wire transfer', weight: 15, category: 'Safe Account Demand' },

  // Coercion & Control
  { phrase: 'do not disconnect', weight: 15, category: 'Coercion & Control' },
  { phrase: 'stay on the line', weight: 12, category: 'Coercion & Control' },
  { phrase: 'video call', weight: 8, category: 'Coercion & Control' },
  { phrase: 'do not inform', weight: 14, category: 'Coercion & Control' },
  { phrase: 'do not tell anyone', weight: 15, category: 'Coercion & Control' },
  { phrase: 'under surveillance', weight: 14, category: 'Coercion & Control' },
  { phrase: 'anydesk', weight: 12, category: 'Coercion & Control' },
  { phrase: 'teamviewer', weight: 12, category: 'Coercion & Control' },

  // Urgency Pressure
  { phrase: 'immediately', weight: 5, category: 'Urgency Pressure' },
  { phrase: 'urgent', weight: 5, category: 'Urgency Pressure' },
  { phrase: 'time is running out', weight: 8, category: 'Urgency Pressure' },
  { phrase: 'failure to comply', weight: 10, category: 'Urgency Pressure' },
  { phrase: 'severe punishment', weight: 9, category: 'Urgency Pressure' },

  // Seizure Threat
  { phrase: 'seizure', weight: 10, category: 'Seizure Threat' },
  { phrase: 'seize your property', weight: 14, category: 'Seizure Threat' },
  { phrase: 'freeze your accounts', weight: 12, category: 'Seizure Threat' },

  // UPI/Payment Scam
  { phrase: 'upi', weight: 5, category: 'UPI/Payment Scam' },
  { phrase: 'upi pin', weight: 10, category: 'UPI/Payment Scam' },
  { phrase: 'scan qr', weight: 7, category: 'UPI/Payment Scam' },

  // OTP/Verification Scam
  { phrase: 'verification code', weight: 9, category: 'OTP/Verification Scam' },
  { phrase: 'share the otp', weight: 14, category: 'OTP/Verification Scam' },
  { phrase: 'tell me the code', weight: 12, category: 'OTP/Verification Scam' },

  // Remote Access Scam
  { phrase: 'install app', weight: 8, category: 'Remote Access Scam' },
  { phrase: 'install anydesk', weight: 14, category: 'Remote Access Scam' },
  { phrase: 'share screen', weight: 9, category: 'Remote Access Scam' },

  // Customs/Parcel Scam
  { phrase: 'parcel', weight: 5, category: 'Customs/Parcel Scam' },
  { phrase: 'seized parcel', weight: 12, category: 'Customs/Parcel Scam' },
  { phrase: 'illegal contents', weight: 11, category: 'Customs/Parcel Scam' },
  { phrase: 'drugs found', weight: 14, category: 'Customs/Parcel Scam' },

  // Impersonation Cue
  { phrase: 'badge number', weight: 8, category: 'Impersonation Cue' },
  { phrase: 'warrant number', weight: 9, category: 'Impersonation Cue' },
  { phrase: 'department of', weight: 5, category: 'Impersonation Cue' },

  // Emotional Manipulation
  { phrase: 'your family will suffer', weight: 14, category: 'Emotional Manipulation' },
  { phrase: 'reputation destroyed', weight: 9, category: 'Emotional Manipulation' },
  { phrase: 'public humiliation', weight: 9, category: 'Emotional Manipulation' },
  
  // High-Specificity Phrases
  { phrase: 'digital arrest', weight: 22, category: 'Digital Arrest' },
  { phrase: 'arrest warrant has been issued', weight: 20, category: 'Digital Arrest' },
  { phrase: 'linked to money laundering', weight: 18, category: 'Digital Arrest' },
  { phrase: 'safe account provided by', weight: 22, category: 'Safe Account Demand' },
  { phrase: 'do not disconnect this call', weight: 18, category: 'Coercion & Control' },
  { phrase: 'central bureau of investigation', weight: 16, category: 'Authority Impersonation' },

  // Investment / Crypto Scams (Voice)
  { phrase: 'guaranteed returns', weight: 16, category: 'Investment Scam' },
  { phrase: 'double your money', weight: 18, category: 'Investment Scam' },
  { phrase: 'risk free investment', weight: 16, category: 'Investment Scam' },
  { phrase: 'deposit to start earning', weight: 14, category: 'Investment Scam' },
  { phrase: 'cryptocurrency investment', weight: 10, category: 'Investment Scam' },
  { phrase: 'bitcoin opportunity', weight: 12, category: 'Investment Scam' },

  // Lottery / Prize Scams (Voice)
  { phrase: 'you have won', weight: 14, category: 'Lottery Scam' },
  { phrase: 'lottery winner', weight: 18, category: 'Lottery Scam' },
  { phrase: 'pay tax to claim', weight: 16, category: 'Lottery Scam' },
  { phrase: 'claim your prize', weight: 16, category: 'Lottery Scam' },
];

// ---------------------------------------------------------------------------
// 2. ML MODEL INIT
// ---------------------------------------------------------------------------

const VOICE_MODEL_PATH = path.join(__dirname, '../../data/nlp_voice_model.json');
let voiceClassifier: natural.BayesClassifier;

export async function initVoiceNLPModel() {
  return new Promise<void>((resolve, reject) => {
    if (fs.existsSync(VOICE_MODEL_PATH)) {
      natural.BayesClassifier.load(VOICE_MODEL_PATH, null as any, (err, loadedClassifier) => {
        if (err || !loadedClassifier) {
          console.error("Failed to load Voice NLP model:", err);
          reject(err || new Error("Classifier is undefined"));
        } else {
          voiceClassifier = loadedClassifier as natural.BayesClassifier;
          console.log("Loaded trained Voice NLP Bayes Model from disk.");
          resolve();
        }
      });
    } else {
      console.log("Training Voice NLP Bayes Model from VOICE_TRAINING_DATA...");
      voiceClassifier = new natural.BayesClassifier();
      
      for (const t of VOICE_TRAINING_DATA) {
        // Boost weight
        const iterations = Math.ceil(t.weight / 5) * 10;
        for (let i = 0; i < iterations; i++) {
          voiceClassifier.addDocument(t.phrase, t.category);
        }
      }
      
      // Safe examples (looped to balance boosted scam phrases)
      const safeExamples = [
        'hello how are you', 'can we meet tomorrow', 'i transferred the money for the rent',
        'did you get my email', 'happy birthday', 'the meeting is scheduled for 5pm',
        'what did you have for lunch', 'call me back when you are free', 'the package has been delivered',
        'mom are you at home', 'where are we going for dinner', 'good morning have a great day',
        'i will send the document shortly', 'thanks for the update', 'let me know if you need help'
      ];
      for (const safe of safeExamples) {
        for (let i = 0; i < 50; i++) {
          voiceClassifier.addDocument(safe, 'Safe');
        }
      }
      
      voiceClassifier.train();
      
      voiceClassifier.save(VOICE_MODEL_PATH, (err) => {
        if (err) console.error("Failed to save Voice NLP model:", err);
        else console.log("Voice NLP Model trained and saved to disk successfully.");
        resolve();
      });
    }
  });
}

// ---------------------------------------------------------------------------
// 3. SCORING ENGINE
// ---------------------------------------------------------------------------

export interface ClassificationResult {
  riskLevel: 'safe' | 'low' | 'moderate' | 'high' | 'critical';
  confidence: number;                    // 0–100
  scamType: string;
  matchedPatterns: {
    category: string;
    matches: string[];
    categoryScore: number;
  }[];
  reasoning: string[];
  recommendedAction: string;
  rawScore: number;
  maxPossibleScore: number;
  keywordHits: number;
  phraseHits: number;
  sequenceHits: number;
  categoriesHit: string[];
}

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/['']/g, "'")
    .replace(/[""]/g, '"')
    .replace(/[.,!?;:()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function generateRecommendation(riskLevel: string, scamType: string): string {
  switch (riskLevel) {
    case 'critical':
      return `IMMEDIATE ACTION REQUIRED: Terminate the call. Report to cybercrime.gov.in or call 1930. This is a confirmed ${scamType} pattern. Do NOT transfer money, share OTPs, or install any apps.`;
    case 'high':
      return `HIGH RISK: Strongly recommend ending this call. This matches known ${scamType} patterns. File a report at cybercrime.gov.in.`;
    case 'moderate':
      return `CAUTION: This conversation shows suspicious indicators consistent with ${scamType}. Verify the caller's identity independently. Do not share personal or financial information.`;
    case 'low':
      return `LOW RISK: Minor suspicious indicators detected. Exercise standard caution. Never share OTPs, PINs, or financial details over phone.`;
    default:
      return `No significant threat indicators detected. This appears to be a normal conversation.`;
  }
}

export async function classifyTranscript(text: string): Promise<ClassificationResult> {
  if (!voiceClassifier) {
    await initVoiceNLPModel();
  }

  const normalized = normalizeText(text);

  const classifications = voiceClassifier.getClassifications(normalized);
  classifications.sort((a, b) => b.value - a.value);

  const topClassification = classifications[0];
  const secondClassification = classifications.length > 1 ? classifications[1] : null;

  let scamType = topClassification.label;
  let confidence = 0;

  // -------------------------------------------------------------
  // False Positive Mitigation Heuristic
  // -------------------------------------------------------------
  const normalizedWords = normalized.split(/\s+/);
  let maxPhraseMatch = 0;
  
  const isSignificant = (w: string) => {
    const importantShortWords = ['cbi', 'otp', 'pin', 'cvv', 'fir', 'rbi', 'nia', 'kyc', 'job', 'pay', 'tax', 'sms', 'link', 'app', 'qr', 'card', 'bank', 'win', 'won', 'ed'];
    if (importantShortWords.includes(w)) return true;
    const stopWords = ['from', 'your', 'with', 'this', 'that', 'have', 'will', 'been', 'what', 'when', 'into', 'they', 'them', 'then', 'than', 'tell'];
    if (stopWords.includes(w)) return false;
    return w.length >= 4;
  };

  for (const t of VOICE_TRAINING_DATA) {
    const phraseLower = t.phrase.toLowerCase();
    if (normalized.includes(phraseLower)) {
      maxPhraseMatch = 1.0;
      break;
    }
    const phraseWords = phraseLower.split(' ');
    const matchedWords = phraseWords.filter(w => isSignificant(w) && normalizedWords.includes(w));
    if (phraseWords.length > 0 && matchedWords.length > 0) {
      maxPhraseMatch = Math.max(maxPhraseMatch, matchedWords.length / phraseWords.length);
    }
  }

  if (scamType !== 'Safe') {
    if (maxPhraseMatch < 0.3) {
      scamType = 'Safe';
      confidence = 5;
    } else {
      if (secondClassification && topClassification.value > 0) {
        confidence = Math.min(99, Math.round((topClassification.value / (topClassification.value + secondClassification.value)) * 100));
      } else {
        confidence = 85;
      }
    }
  } else {
    confidence = 5;
  }

  // Risk level
  let riskLevel: ClassificationResult['riskLevel'];
  if (confidence >= 80) riskLevel = 'critical';
  else if (confidence >= 60) riskLevel = 'high';
  else if (confidence >= 35) riskLevel = 'moderate';
  else if (confidence >= 15) riskLevel = 'low';
  else riskLevel = 'safe';

  const categoriesHit = scamType !== 'Safe' ? [scamType] : [];
  
  const reasoning: string[] = [];
  if (scamType !== 'Safe') {
    reasoning.push(`Voice ML Classifier detected intent as: ${scamType} with ${confidence}% confidence.`);
  } else {
    reasoning.push(`Voice ML Classifier found no immediate threat.`);
  }

  const recommendedAction = generateRecommendation(riskLevel, scamType);

  return {
    riskLevel,
    confidence,
    scamType,
    matchedPatterns: categoriesHit.map(c => ({ category: c, matches: [c], categoryScore: confidence })),
    reasoning,
    recommendedAction,
    rawScore: confidence,
    maxPossibleScore: 100,
    keywordHits: categoriesHit.length > 0 ? 1 : 0,
    phraseHits: categoriesHit.length > 0 ? 1 : 0,
    sequenceHits: 0,
    categoriesHit
  };
}

export async function classifyRealtime(words: string[]): Promise<ClassificationResult> {
  const text = words.join(' ');
  return classifyTranscript(text);
}

export function getKeywordList(): string[] {
  return VOICE_TRAINING_DATA.map(t => t.phrase);
}

export function getKeywordCategories(): Record<string, string[]> {
  const cats: Record<string, string[]> = {};
  for (const t of VOICE_TRAINING_DATA) {
    if (!cats[t.category]) cats[t.category] = [];
    cats[t.category].push(t.phrase);
  }
  return cats;
}

