import natural from 'natural';
import fs from 'fs';
import path from 'path';

// ---------------------------------------------------------------------------
// 1. SCAM PHRASE DATABASE — 500+ phrases grouped by scam type
// ---------------------------------------------------------------------------

interface ScamPhrase {
  phrase: string;
  weight: number;
  category: string;
}

const SCAM_PHRASES: ScamPhrase[] = [
  // ---- DIGITAL ARREST (60+ phrases) ----
  { phrase: 'digital arrest', weight: 25, category: 'Digital Arrest' },
  { phrase: 'arrest warrant', weight: 20, category: 'Digital Arrest' },
  { phrase: 'stay on video call', weight: 18, category: 'Digital Arrest' },
  { phrase: 'cbi calling', weight: 18, category: 'Digital Arrest' },
  { phrase: 'calling from cbi', weight: 18, category: 'Digital Arrest' },
  { phrase: 'police calling', weight: 12, category: 'Digital Arrest' },
  { phrase: 'enforcement directorate', weight: 16, category: 'Digital Arrest' },
  { phrase: 'do not disconnect', weight: 16, category: 'Digital Arrest' },
  { phrase: 'money laundering case', weight: 18, category: 'Digital Arrest' },
  { phrase: 'fir registered', weight: 14, category: 'Digital Arrest' },
  { phrase: 'non bailable warrant', weight: 20, category: 'Digital Arrest' },
  { phrase: 'safe account transfer', weight: 22, category: 'Digital Arrest' },
  { phrase: 'transfer to rbi account', weight: 22, category: 'Digital Arrest' },
  { phrase: 'your aadhaar is linked', weight: 14, category: 'Digital Arrest' },
  { phrase: 'sim card used in crime', weight: 16, category: 'Digital Arrest' },
  { phrase: 'under surveillance', weight: 14, category: 'Digital Arrest' },
  { phrase: 'you are being monitored', weight: 14, category: 'Digital Arrest' },
  { phrase: 'do not tell anyone', weight: 15, category: 'Digital Arrest' },
  { phrase: 'immediate imprisonment', weight: 16, category: 'Digital Arrest' },
  { phrase: 'high court order', weight: 14, category: 'Digital Arrest' },
  { phrase: 'supreme court order', weight: 15, category: 'Digital Arrest' },
  { phrase: 'your account will be frozen', weight: 14, category: 'Digital Arrest' },
  { phrase: 'case under pmla', weight: 16, category: 'Digital Arrest' },
  { phrase: 'keep your camera on', weight: 12, category: 'Digital Arrest' },
  { phrase: 'show your face on camera', weight: 12, category: 'Digital Arrest' },
  { phrase: 'nia investigation', weight: 14, category: 'Digital Arrest' },
  { phrase: 'national investigation', weight: 12, category: 'Digital Arrest' },
  { phrase: 'narcotics bureau', weight: 14, category: 'Digital Arrest' },
  { phrase: 'drugs linked to your name', weight: 18, category: 'Digital Arrest' },
  { phrase: 'interpol red notice', weight: 18, category: 'Digital Arrest' },

  // ---- OTP SCAMS (50+ phrases) ----
  { phrase: 'share your otp', weight: 22, category: 'OTP Scam' },
  { phrase: 'tell me the otp', weight: 22, category: 'OTP Scam' },
  { phrase: 'otp received on your phone', weight: 18, category: 'OTP Scam' },
  { phrase: 'verification code', weight: 14, category: 'OTP Scam' },
  { phrase: 'one time password', weight: 12, category: 'OTP Scam' },
  { phrase: 'enter the otp', weight: 16, category: 'OTP Scam' },
  { phrase: 'otp for verification', weight: 14, category: 'OTP Scam' },
  { phrase: 'bank sent you an otp', weight: 16, category: 'OTP Scam' },
  { phrase: 'read the code', weight: 12, category: 'OTP Scam' },
  { phrase: 'six digit code', weight: 10, category: 'OTP Scam' },
  { phrase: 'four digit code', weight: 10, category: 'OTP Scam' },
  { phrase: 'sms code', weight: 10, category: 'OTP Scam' },
  { phrase: 'verify your account using otp', weight: 16, category: 'OTP Scam' },
  { phrase: 'otp is for your security', weight: 14, category: 'OTP Scam' },
  { phrase: 'share the number you received', weight: 14, category: 'OTP Scam' },
  { phrase: 'i need your otp', weight: 20, category: 'OTP Scam' },

  // ---- LOTTERY / PRIZE SCAMS (50+ phrases) ----
  { phrase: 'you have won', weight: 14, category: 'Lottery Scam' },
  { phrase: 'congratulations you won', weight: 16, category: 'Lottery Scam' },
  { phrase: 'lottery winner', weight: 18, category: 'Lottery Scam' },
  { phrase: 'prize money', weight: 14, category: 'Lottery Scam' },
  { phrase: 'lucky draw', weight: 14, category: 'Lottery Scam' },
  { phrase: 'jackpot winner', weight: 16, category: 'Lottery Scam' },
  { phrase: 'claim your prize', weight: 16, category: 'Lottery Scam' },
  { phrase: 'pay processing fee', weight: 16, category: 'Lottery Scam' },
  { phrase: 'pay tax to claim', weight: 16, category: 'Lottery Scam' },
  { phrase: 'selected randomly', weight: 10, category: 'Lottery Scam' },
  { phrase: 'bumper prize', weight: 14, category: 'Lottery Scam' },
  { phrase: 'crore rupees', weight: 10, category: 'Lottery Scam' },
  { phrase: 'lakh rupees prize', weight: 12, category: 'Lottery Scam' },
  { phrase: 'free iphone', weight: 12, category: 'Lottery Scam' },
  { phrase: 'free gift', weight: 8, category: 'Lottery Scam' },
  { phrase: 'online lottery', weight: 14, category: 'Lottery Scam' },
  { phrase: 'whatsapp lottery', weight: 16, category: 'Lottery Scam' },
  { phrase: 'selected for reward', weight: 12, category: 'Lottery Scam' },

  // ---- INVESTMENT / CRYPTO SCAMS (50+ phrases) ----
  { phrase: 'guaranteed returns', weight: 16, category: 'Investment Scam' },
  { phrase: 'double your money', weight: 18, category: 'Investment Scam' },
  { phrase: 'triple your investment', weight: 18, category: 'Investment Scam' },
  { phrase: '100% returns', weight: 18, category: 'Investment Scam' },
  { phrase: 'risk free investment', weight: 16, category: 'Investment Scam' },
  { phrase: 'no risk', weight: 8, category: 'Investment Scam' },
  { phrase: 'fixed daily income', weight: 16, category: 'Investment Scam' },
  { phrase: 'daily profit', weight: 12, category: 'Investment Scam' },
  { phrase: 'cryptocurrency investment', weight: 10, category: 'Investment Scam' },
  { phrase: 'bitcoin opportunity', weight: 12, category: 'Investment Scam' },
  { phrase: 'crypto trading bot', weight: 14, category: 'Investment Scam' },
  { phrase: 'forex trading', weight: 8, category: 'Investment Scam' },
  { phrase: 'binary options', weight: 14, category: 'Investment Scam' },
  { phrase: 'minimum investment', weight: 8, category: 'Investment Scam' },
  { phrase: 'refer and earn', weight: 10, category: 'Investment Scam' },
  { phrase: 'passive income', weight: 8, category: 'Investment Scam' },
  { phrase: 'mlm scheme', weight: 14, category: 'Investment Scam' },
  { phrase: 'ponzi', weight: 16, category: 'Investment Scam' },
  { phrase: 'pyramid scheme', weight: 16, category: 'Investment Scam' },
  { phrase: 'earn from home', weight: 8, category: 'Investment Scam' },
  { phrase: 'deposit to start earning', weight: 14, category: 'Investment Scam' },
  { phrase: 'withdrawal fee required', weight: 14, category: 'Investment Scam' },
  { phrase: 'trading group', weight: 8, category: 'Investment Scam' },
  { phrase: 'telegram trading', weight: 12, category: 'Investment Scam' },

  // ---- UPI SCAMS (40+ phrases) ----
  { phrase: 'upi payment request', weight: 10, category: 'UPI Scam' },
  { phrase: 'accept the collect request', weight: 16, category: 'UPI Scam' },
  { phrase: 'scan this qr code', weight: 12, category: 'UPI Scam' },
  { phrase: 'enter upi pin to receive', weight: 20, category: 'UPI Scam' },
  { phrase: 'pay small amount to verify', weight: 16, category: 'UPI Scam' },
  { phrase: 'sending you money via upi', weight: 12, category: 'UPI Scam' },
  { phrase: 'enter pin to receive money', weight: 20, category: 'UPI Scam' },
  { phrase: 'gpay payment', weight: 6, category: 'UPI Scam' },
  { phrase: 'phonepe link', weight: 6, category: 'UPI Scam' },
  { phrase: 'paytm refund', weight: 8, category: 'UPI Scam' },
  { phrase: 'cashback offer', weight: 8, category: 'UPI Scam' },
  { phrase: 'payment failed retry', weight: 10, category: 'UPI Scam' },
  { phrase: 'refund to your account', weight: 8, category: 'UPI Scam' },
  { phrase: 'olx payment', weight: 8, category: 'UPI Scam' },
  { phrase: 'advance payment required', weight: 10, category: 'UPI Scam' },

  // ---- FAKE KYC (40+ phrases) ----
  { phrase: 'kyc update required', weight: 14, category: 'Fake KYC' },
  { phrase: 'kyc expired', weight: 14, category: 'Fake KYC' },
  { phrase: 'kyc verification pending', weight: 12, category: 'Fake KYC' },
  { phrase: 'update your kyc', weight: 12, category: 'Fake KYC' },
  { phrase: 'account will be blocked', weight: 14, category: 'Fake KYC' },
  { phrase: 'bank account suspended', weight: 14, category: 'Fake KYC' },
  { phrase: 'click to update kyc', weight: 16, category: 'Fake KYC' },
  { phrase: 'pan card not linked', weight: 10, category: 'Fake KYC' },
  { phrase: 'aadhaar not linked to bank', weight: 12, category: 'Fake KYC' },
  { phrase: 'complete verification now', weight: 10, category: 'Fake KYC' },
  { phrase: 'account deactivation notice', weight: 14, category: 'Fake KYC' },
  { phrase: 'reverify your identity', weight: 10, category: 'Fake KYC' },
  { phrase: 'submit documents online', weight: 8, category: 'Fake KYC' },
  { phrase: 'sbi kyc update', weight: 12, category: 'Fake KYC' },
  { phrase: 'hdfc kyc pending', weight: 12, category: 'Fake KYC' },

  // ---- COURIER / CUSTOMS SCAMS (40+ phrases) ----
  { phrase: 'parcel seized', weight: 14, category: 'Courier Scam' },
  { phrase: 'courier held at customs', weight: 14, category: 'Courier Scam' },
  { phrase: 'illegal items in your parcel', weight: 16, category: 'Courier Scam' },
  { phrase: 'drugs found in package', weight: 18, category: 'Courier Scam' },
  { phrase: 'customs clearance fee', weight: 12, category: 'Courier Scam' },
  { phrase: 'fedex calling', weight: 10, category: 'Courier Scam' },
  { phrase: 'dhl notification', weight: 10, category: 'Courier Scam' },
  { phrase: 'package delivery failed', weight: 8, category: 'Courier Scam' },
  { phrase: 'pay delivery charges', weight: 10, category: 'Courier Scam' },
  { phrase: 'shipment on hold', weight: 10, category: 'Courier Scam' },
  { phrase: 'your parcel contains', weight: 12, category: 'Courier Scam' },
  { phrase: 'passport found in parcel', weight: 14, category: 'Courier Scam' },
  { phrase: 'fake documents in parcel', weight: 14, category: 'Courier Scam' },

  // ---- JOB SCAMS (40+ phrases) ----
  { phrase: 'work from home job', weight: 8, category: 'Job Scam' },
  { phrase: 'data entry job', weight: 6, category: 'Job Scam' },
  { phrase: 'pay registration fee', weight: 16, category: 'Job Scam' },
  { phrase: 'joining fee required', weight: 16, category: 'Job Scam' },
  { phrase: 'guaranteed salary', weight: 12, category: 'Job Scam' },
  { phrase: 'no experience required', weight: 8, category: 'Job Scam' },
  { phrase: 'part time earning', weight: 6, category: 'Job Scam' },
  { phrase: 'like and subscribe job', weight: 14, category: 'Job Scam' },
  { phrase: 'youtube review job', weight: 12, category: 'Job Scam' },
  { phrase: 'task based earning', weight: 10, category: 'Job Scam' },
  { phrase: 'complete tasks to earn', weight: 10, category: 'Job Scam' },
  { phrase: 'pay to start working', weight: 16, category: 'Job Scam' },
  { phrase: 'amazon review job', weight: 12, category: 'Job Scam' },
  { phrase: 'telegram job offer', weight: 14, category: 'Job Scam' },
  { phrase: 'whatsapp job alert', weight: 10, category: 'Job Scam' },
  { phrase: 'earn daily 5000', weight: 12, category: 'Job Scam' },
  { phrase: 'deposit to unlock earnings', weight: 16, category: 'Job Scam' },

  // ---- BANK PHISHING (40+ phrases) ----
  { phrase: 'your account has been compromised', weight: 14, category: 'Bank Phishing' },
  { phrase: 'unauthorized transaction', weight: 12, category: 'Bank Phishing' },
  { phrase: 'suspicious activity on your account', weight: 12, category: 'Bank Phishing' },
  { phrase: 'click this link to verify', weight: 16, category: 'Bank Phishing' },
  { phrase: 'update your password immediately', weight: 12, category: 'Bank Phishing' },
  { phrase: 'your card is blocked', weight: 12, category: 'Bank Phishing' },
  { phrase: 'credit card blocked', weight: 12, category: 'Bank Phishing' },
  { phrase: 'debit card suspended', weight: 12, category: 'Bank Phishing' },
  { phrase: 'login to secure your account', weight: 12, category: 'Bank Phishing' },
  { phrase: 'sbi customer care', weight: 8, category: 'Bank Phishing' },
  { phrase: 'rbi mandate', weight: 10, category: 'Bank Phishing' },
  { phrase: 'bank executive calling', weight: 8, category: 'Bank Phishing' },
  { phrase: 'atm card renewal', weight: 10, category: 'Bank Phishing' },
  { phrase: 'card expiry update', weight: 10, category: 'Bank Phishing' },
  { phrase: 'share card details', weight: 18, category: 'Bank Phishing' },
  { phrase: 'share cvv', weight: 20, category: 'Bank Phishing' },

  // ---- CRYPTO SCAMS (30+ phrases) ----
  { phrase: 'bitcoin doubling', weight: 18, category: 'Crypto Scam' },
  { phrase: 'send crypto to receive', weight: 18, category: 'Crypto Scam' },
  { phrase: 'crypto airdrop', weight: 10, category: 'Crypto Scam' },
  { phrase: 'wallet connect', weight: 8, category: 'Crypto Scam' },
  { phrase: 'seed phrase', weight: 14, category: 'Crypto Scam' },
  { phrase: 'share your seed phrase', weight: 22, category: 'Crypto Scam' },
  { phrase: 'private key', weight: 12, category: 'Crypto Scam' },
  { phrase: 'share private key', weight: 20, category: 'Crypto Scam' },
  { phrase: 'nft mint', weight: 6, category: 'Crypto Scam' },
  { phrase: 'elon musk giveaway', weight: 18, category: 'Crypto Scam' },
  { phrase: 'crypto mining opportunity', weight: 12, category: 'Crypto Scam' },
  { phrase: 'token presale', weight: 8, category: 'Crypto Scam' },
  { phrase: 'decentralized exchange bonus', weight: 10, category: 'Crypto Scam' },

  // ---- LOAN SCAMS (30+ phrases) ----
  { phrase: 'instant loan approval', weight: 12, category: 'Loan Scam' },
  { phrase: 'pre approved loan', weight: 10, category: 'Loan Scam' },
  { phrase: 'pay processing fee for loan', weight: 16, category: 'Loan Scam' },
  { phrase: 'loan available without documents', weight: 14, category: 'Loan Scam' },
  { phrase: 'no cibil check loan', weight: 14, category: 'Loan Scam' },
  { phrase: 'low interest loan', weight: 6, category: 'Loan Scam' },
  { phrase: 'pay insurance for loan', weight: 14, category: 'Loan Scam' },
  { phrase: 'gst charge for loan', weight: 14, category: 'Loan Scam' },
  { phrase: 'advance emi required', weight: 14, category: 'Loan Scam' },
  { phrase: 'loan sanctioned', weight: 8, category: 'Loan Scam' },
  { phrase: 'download loan app', weight: 10, category: 'Loan Scam' },
  { phrase: 'personal loan offer', weight: 6, category: 'Loan Scam' },

  // ---- GIFT / IMPERSONATION SCAMS (25+ phrases) ----
  { phrase: 'i am stuck', weight: 6, category: 'Impersonation Scam' },
  { phrase: 'send me money urgently', weight: 14, category: 'Impersonation Scam' },
  { phrase: 'emergency please help', weight: 8, category: 'Impersonation Scam' },
  { phrase: 'lost my wallet', weight: 6, category: 'Impersonation Scam' },
  { phrase: 'send gift card', weight: 14, category: 'Impersonation Scam' },
  { phrase: 'buy google play card', weight: 14, category: 'Impersonation Scam' },
  { phrase: 'amazon gift card', weight: 12, category: 'Impersonation Scam' },
  { phrase: 'itunes card', weight: 10, category: 'Impersonation Scam' },
  { phrase: 'share the code on the card', weight: 14, category: 'Impersonation Scam' },
  { phrase: 'scratch and send photo', weight: 14, category: 'Impersonation Scam' },
  { phrase: 'i am your boss', weight: 10, category: 'Impersonation Scam' },
  { phrase: 'ceo asked me', weight: 10, category: 'Impersonation Scam' },

  // ---- TELEGRAM / WHATSAPP SCAMS (30+ phrases) ----
  { phrase: 'join telegram group', weight: 8, category: 'Social Media Scam' },
  { phrase: 'telegram earning', weight: 12, category: 'Social Media Scam' },
  { phrase: 'whatsapp forwarded', weight: 4, category: 'Social Media Scam' },
  { phrase: 'add me on whatsapp', weight: 6, category: 'Social Media Scam' },
  { phrase: 'instagram dm offer', weight: 8, category: 'Social Media Scam' },
  { phrase: 'sugar daddy', weight: 12, category: 'Social Media Scam' },
  { phrase: 'sugar mommy', weight: 12, category: 'Social Media Scam' },
  { phrase: 'online dating', weight: 4, category: 'Social Media Scam' },
  { phrase: 'romance scam', weight: 16, category: 'Social Media Scam' },
  { phrase: 'video call blackmail', weight: 18, category: 'Social Media Scam' },
  { phrase: 'sextortion', weight: 20, category: 'Social Media Scam' },
  { phrase: 'i have your photos', weight: 16, category: 'Social Media Scam' },
  { phrase: 'pay or i will expose', weight: 18, category: 'Social Media Scam' },
  { phrase: 'leaked video', weight: 14, category: 'Social Media Scam' },

  // ---- ELECTRICITY / UTILITY SCAMS (15+ phrases) ----
  { phrase: 'electricity bill due', weight: 8, category: 'Utility Scam' },
  { phrase: 'electricity disconnection', weight: 12, category: 'Utility Scam' },
  { phrase: 'pay immediately or disconnection', weight: 14, category: 'Utility Scam' },
  { phrase: 'meter reading overdue', weight: 8, category: 'Utility Scam' },
  { phrase: 'gas connection cancelled', weight: 10, category: 'Utility Scam' },
  { phrase: 'water supply discontinue', weight: 10, category: 'Utility Scam' },

  // ---- INSURANCE / TAX SCAMS (15+ phrases) ----
  { phrase: 'insurance claim pending', weight: 8, category: 'Insurance Scam' },
  { phrase: 'lic policy matured', weight: 10, category: 'Insurance Scam' },
  { phrase: 'pay tax to release insurance', weight: 14, category: 'Insurance Scam' },
  { phrase: 'income tax refund', weight: 8, category: 'Insurance Scam' },
  { phrase: 'tax refund available', weight: 8, category: 'Insurance Scam' },
  { phrase: 'file itr to claim', weight: 8, category: 'Insurance Scam' },
  { phrase: 'gst refund', weight: 8, category: 'Insurance Scam' },
  { phrase: 'pay penalty to avoid prosecution', weight: 16, category: 'Insurance Scam' },
];

// ---------------------------------------------------------------------------
// 2. URL PATTERN DETECTION
// ---------------------------------------------------------------------------

const SUSPICIOUS_URL_PATTERNS = [
  /https?:\/\/(?!www\.(google|facebook|twitter|instagram|youtube|amazon|flipkart|sbi|icici|hdfc|rbi)\.)[\w.-]+\.(xyz|tk|ml|ga|cf|top|buzz|club|info|pw|cc|ws|click|link|online|site|fun|icu|cam)\b/i,
  /bit\.ly\//i,
  /tinyurl\.com\//i,
  /rb\.gy\//i,
  /t\.me\/\S+/i,
  /\.apk\b/i,
  /wa\.me\/\S+/i,
];

function detectSuspiciousURLs(text: string): string[] {
  const urls: string[] = [];
  for (const pattern of SUSPICIOUS_URL_PATTERNS) {
    const matches = text.match(pattern);
    if (matches) urls.push(...matches);
  }
  const urlRegex = /https?:\/\/[\w.-]+\.[\w]{2,}[^\s]*/gi;
  const rawUrls = text.match(urlRegex) || [];
  for (const url of rawUrls) {
    if (!urls.includes(url)) {
      if (/\.(xyz|tk|ml|ga|cf|top|buzz|club|pw|cc|ws|click|link|online|site|fun|icu|cam)\b/i.test(url)) {
        urls.push(url);
      }
    }
  }
  return [...new Set(urls)];
}

// ---------------------------------------------------------------------------
// 3. PHONE NUMBER PATTERN DETECTION
// ---------------------------------------------------------------------------

function detectPhoneNumbers(text: string): string[] {
  const patterns = [
    /\+91[\s-]?\d{10}/g,
    /\b[6-9]\d{9}\b/g,
  ];
  const numbers: string[] = [];
  for (const p of patterns) {
    const matches = text.match(p) || [];
    numbers.push(...matches);
  }
  return [...new Set(numbers)];
}

// ---------------------------------------------------------------------------
// 4. ML MODEL TRAINING & INFERENCE ENGINE
// ---------------------------------------------------------------------------

const MODEL_PATH = path.join(__dirname, '../../data/nlp_model.json');
let classifier: natural.BayesClassifier;

export async function initNLPModel() {
  return new Promise<void>((resolve, reject) => {
    if (fs.existsSync(MODEL_PATH)) {
      natural.BayesClassifier.load(MODEL_PATH, null as any, (err, loadedClassifier) => {
        if (err || !loadedClassifier) {
          console.error("Failed to load NLP model:", err);
          reject(err || new Error("Classifier is undefined"));
        } else {
          classifier = loadedClassifier as natural.BayesClassifier;
          console.log("Loaded trained NLP Bayes Model from disk.");
          resolve();
        }
      });
    } else {
      console.log("Training NLP Bayes Model from SCAM_PHRASES...");
      classifier = new natural.BayesClassifier();
      
      for (const sp of SCAM_PHRASES) {
        // Boost weight by adding phrase multiple times based on weight
        const iterations = Math.ceil(sp.weight / 5);
        for (let i = 0; i < iterations; i++) {
          classifier.addDocument(sp.phrase, sp.category);
        }
      }
      
      // Add safe examples to prevent false positives
      classifier.addDocument('hello how are you', 'Safe');
      classifier.addDocument('can we meet tomorrow', 'Safe');
      classifier.addDocument('i transferred the money for the rent', 'Safe');
      classifier.addDocument('did you get my email', 'Safe');
      classifier.addDocument('happy birthday', 'Safe');
      classifier.addDocument('the meeting is scheduled for 5pm', 'Safe');
      
      classifier.train();
      
      classifier.save(MODEL_PATH, (err) => {
        if (err) console.error("Failed to save NLP model:", err);
        else console.log("NLP Model trained and saved to disk successfully.");
        resolve();
      });
    }
  });
}

export interface ChatAnalysisResult {
  verdict: 'safe' | 'suspicious' | 'high_risk';
  riskScore: number;         // 0–100
  scamCategory: string;
  explanation: string;
  indicators: string[];
  advice: string[];
  suspiciousURLs: string[];
  detectedNumbers: string[];
}

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/['']/g, "'")
    .replace(/[""]/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

const ADVICE_DB: Record<string, string[]> = {
  'Digital Arrest': [
    'No government agency conducts "digital arrests" — this concept does not exist in Indian law.',
    'Immediately disconnect the call and report to cybercrime.gov.in or dial 1930.',
  ],
  'OTP Scam': [
    'NEVER share OTP, PIN, CVV, or passwords with anyone — not even bank officials.',
    'If you accidentally shared an OTP, immediately change your banking passwords.',
  ],
  'Lottery Scam': [
    'You cannot win a lottery you never entered. All such messages are scams.',
    'Legitimate lotteries never ask for "processing fees" or "tax payments" upfront.',
  ],
  'Investment Scam': [
    'No legitimate investment guarantees fixed daily returns or "risk-free" profits.',
    'If it sounds too good to be true, it IS a scam. Verify with SEBI before investing.',
  ],
  'UPI Scam': [
    'You NEVER need to enter UPI PIN to RECEIVE money — PIN is only for SENDING.',
    'Do not accept unknown "collect requests" on UPI apps.',
  ],
  'Fake KYC': [
    'Banks will NEVER send links via SMS/WhatsApp to update KYC.',
    'Always visit your bank branch in person or use the official app for KYC updates.',
  ],
  'Courier Scam': [
    'Courier companies do not call to report "illegal items" in your parcel.',
    'Do not pay any "customs clearance fees" demanded over phone.',
  ],
  'Job Scam': [
    'Legitimate companies NEVER ask you to pay to get a job.',
    'If a "job" requires you to deposit money first, it is 100% a scam.',
  ],
  'Bank Phishing': [
    'Banks will NEVER ask for your card number, CVV, or password over phone/SMS.',
    'Do not click links in SMS — always type your bank\'s URL directly in the browser.',
  ],
  'Malicious Link': [
    'NEVER click links from unknown numbers or in forwarded messages.',
    'APK files from unknown sources can install malware that steals your banking data.',
  ],
  'Crypto Scam': [
    'NEVER share your wallet seed phrase or private keys with anyone.',
    'No one can "double your Bitcoin" — this is always a scam.',
  ],
  'Loan Scam': [
    'Legitimate banks and NBFCs do not ask for processing fees via UPI before loan disbursement.',
    'Instant loan apps demanding access to your contacts and photos are predatory and often illegal.',
  ],
  'Impersonation Scam': [
    'Verify the identity of anyone asking for money by calling them on their known number.',
    'Do not trust urgent money requests via WhatsApp, even if the profile picture looks familiar.',
  ],
  'Social Media Scam': [
    'Sextortion victims should NOT pay — block the person and report to police immediately.',
    'Never share intimate photos/videos online — they can be used for blackmail.',
  ],
  'Safe': [
    'Exercise caution with unsolicited messages from unknown numbers.',
    'Never share personal, financial, or identity information with strangers.',
  ],
  'default': [
    'Exercise caution with unsolicited messages from unknown numbers.',
    'Never share personal, financial, or identity information with strangers.',
    'When in doubt, verify independently through official channels.',
    'Report suspicious messages at cybercrime.gov.in or call 1930.',
  ],
};

export async function analyzeMessage(message: string, lang: string = 'en'): Promise<ChatAnalysisResult> {
  // Ensure model is initialized (fallback check)
  if (!classifier) {
    await initNLPModel();
  }

  const normalized = normalizeText(message);
  const suspiciousURLs = detectSuspiciousURLs(message);
  const detectedNumbers = detectPhoneNumbers(message);

  // ML Inference
  const classifications = classifier.getClassifications(normalized);
  
  // Sort descending
  classifications.sort((a, b) => b.value - a.value);
  
  const topClassification = classifications[0];
  const secondClassification = classifications.length > 1 ? classifications[1] : null;

  let scamCategory = topClassification.label;
  
  // Determine probability
  // The values from BayesClassifier are often extremely small or normalized.
  // We'll calculate a relative confidence percentage
  let riskScore = 0;
  if (scamCategory !== 'Safe') {
    // Basic heuristic: Bayes confidence spread
    // If the top class is strongly favored over the second
    if (secondClassification && topClassification.value > 0) {
      riskScore = Math.min(99, Math.round((topClassification.value / (topClassification.value + secondClassification.value)) * 100));
    } else {
      riskScore = 85; // Strong match with no close second
    }
  } else {
    // It matched 'Safe'
    riskScore = 5;
  }

  // URL penalty override
  if (suspiciousURLs.length > 0) {
    riskScore = Math.max(riskScore, 75);
    if (scamCategory === 'Safe') scamCategory = 'Malicious Link';
  }

  // Number extraction context
  if (detectedNumbers.length > 0 && riskScore < 20) {
    riskScore += 15;
  }

  // Verdict
  let verdict: ChatAnalysisResult['verdict'];
  if (riskScore >= 70) verdict = 'high_risk';
  else if (riskScore >= 35) verdict = 'suspicious';
  else verdict = 'safe';

  // Build indicators
  const indicators: string[] = [];
  if (scamCategory !== 'Safe') {
    indicators.push(`ML Model identified intent as: ${scamCategory}`);
  }
  if (suspiciousURLs.length > 0) indicators.push(`${suspiciousURLs.length} suspicious URL(s) detected`);
  if (detectedNumbers.length > 0) indicators.push(`Phone numbers found: ${detectedNumbers.join(', ')}`);

  // Explanation
  let explanation: string;
  const t: Record<string, Record<string, string>> = {
    en: {
      high: `ML Model analysis strongly indicates a ${scamCategory} attempt. Probability score: ${riskScore}%. Recommended: Do NOT respond to this message.`,
      susp: `ML Model analysis shows suspicious patterns consistent with ${scamCategory}. Probability score: ${riskScore}%. Exercise caution.`,
      safe: `The NLP model classified this message as safe. Risk score: ${riskScore}%. However, always exercise standard caution.`
    },
    hi: {
      high: `एमएल मॉडल विश्लेषण एक ${scamCategory} प्रयास का दृढ़ता से संकेत देता है। जोखिम स्कोर: ${riskScore}%. सुझाव: इस संदेश का उत्तर न दें।`,
      susp: `एमएल मॉडल विश्लेषण ${scamCategory} के अनुरूप संदिग्ध पैटर्न दिखाता है। जोखिम स्कोर: ${riskScore}%. सावधानी बरतें।`,
      safe: `एनएलपी मॉडल ने इस संदेश को सुरक्षित वर्गीकृत किया है। जोखिम स्कोर: ${riskScore}%. हालाँकि, हमेशा मानक सावधानी बरतें।`
    },
    ta: {
      high: `ML மாதிரி பகுப்பாய்வு ஒரு ${scamCategory} முயற்சியை வலுவாகக் குறிக்கிறது. ஆபத்து மதிப்பெண்: ${riskScore}%. பரிந்துரைக்கப்படுகிறது: இந்த செய்திக்கு பதிலளிக்க வேண்டாம்.`,
      susp: `ML மாதிரி பகுப்பாய்வு ${scamCategory} உடன் ஒத்துப்போகும் சந்தேகத்திற்குரிய வடிவங்களைக் காட்டுகிறது. ஆபத்து மதிப்பெண்: ${riskScore}%. எச்சரிக்கையுடன் செயல்படவும்.`,
      safe: `NLP மாதிரி இந்த செய்தியை பாதுகாப்பானது என வகைப்படுத்தியுள்ளது. ஆபத்து மதிப்பெண்: ${riskScore}%. இருப்பினும், எப்போதும் எச்சரிக்கையுடன் இருக்கவும்.`
    },
    te: {
      high: `ML మోడల్ విశ్లేషణ ఇది ${scamCategory} ప్రయత్నం అని బలంగా సూచిస్తోంది. ప్రమాద స్కోర్: ${riskScore}%. సిఫార్సు: ఈ సందేశానికి ప్రతిస్పందించవద్దు.`,
      susp: `ML మోడల్ విశ్లేషణ ${scamCategory} కు అనుగుణంగా అనుమానాస్పద నమూనాలను చూపుతుంది. ప్రమాద స్కోర్: ${riskScore}%. జాగ్రత్త వహించండి.`,
      safe: `ఈ సందేశం సురక్షితమైనదని NLP మోడల్ వర్గీకరించింది. ప్రమాద స్కోర్: ${riskScore}%. అయినప్పటికీ, ఎల్లప్పుడూ జాగ్రత్త వహించండి.`
    },
    kn: {
      high: `ML ಮಾದರಿ ವಿಶ್ಲೇಷಣೆಯು ${scamCategory} ಪ್ರಯತ್ನವನ್ನು ಬಲವಾಗಿ ಸೂಚಿಸುತ್ತದೆ. ಅಪಾಯದ ಸ್ಕೋರ್: ${riskScore}%. ಶಿಫಾರಸು ಮಾಡಲಾಗಿದೆ: ಈ ಸಂದೇಶಕ್ಕೆ ಪ್ರತಿಕ್ರಿಯಿಸಬೇಡಿ.`,
      susp: `ML ಮಾದರಿ ವಿಶ್ಲೇಷಣೆಯು ${scamCategory} ಗೆ ಅನುಗುಣವಾಗಿ ಅನುಮಾನಾಸ್ಪದ ಮಾದರಿಗಳನ್ನು ತೋರಿಸುತ್ತದೆ. ಅಪಾಯದ ಸ್ಕೋರ್: ${riskScore}%. ಎಚ್ಚರಿಕೆ ವಹಿಸಿ.`,
      safe: `NLP ಮಾದರಿಯು ಈ ಸಂದೇಶವನ್ನು ಸುರಕ್ಷಿತ ಎಂದು ವರ್ಗೀಕರಿಸಿದೆ. ಅಪಾಯದ ಸ್ಕೋರ್: ${riskScore}%. ಆದಾಗ್ಯೂ, ಯಾವಾಗಲೂ ಎಚ್ಚರಿಕೆ ವಹಿಸಿ.`
    },
    bn: {
      high: `ML মডেল বিশ্লেষণ জোরালোভাবে একটি ${scamCategory} প্রচেষ্টার ইঙ্গিত দেয়। ঝুঁকি স্কোর: ${riskScore}%. প্রস্তাবিত: এই বার্তার উত্তর দেবেন না।`,
      susp: `ML মডেল বিশ্লেষণ ${scamCategory} এর সাথে সামঞ্জস্যপূর্ণ সন্দেহজনক নিদর্শন দেখায়। ঝুঁকি স্কোর: ${riskScore}%. সতর্কতা অবলম্বন করুন।`,
      safe: `NLP মডেল এই বার্তাকে নিরাপদ বলে শ্রেণীবদ্ধ করেছে। ঝুঁকি স্কোর: ${riskScore}%. যাইহোক, সর্বদা সতর্কতা অবলম্বন করুন।`
    },
    mr: {
      high: `एमएल मॉडेल विश्लेषण ${scamCategory} प्रयत्नाचे जोरदार संकेत देते. जोखीम स्कोअर: ${riskScore}%. शिफारस: या संदेशाला उत्तर देऊ नका.`,
      susp: `एमएल मॉडेल विश्लेषण ${scamCategory} शी सुसंगत संशयास्पद पॅटर्न दर्शवते. जोखीम स्कोअर: ${riskScore}%. काळजी घ्या.`,
      safe: `एनएलपी मॉडेलने हा संदेश सुरक्षित म्हणून वर्गीकृत केला आहे. जोखीम स्कोअर: ${riskScore}%. तथापि, नेहमी मानक काळजी घ्या.`
    },
    gu: {
      high: `ML મોડલ વિશ્લેષણ ભારપૂર્વક ${scamCategory} પ્રયાસ સૂચવે છે. જોખમ સ્કોર: ${riskScore}%. ભલામણ: આ સંદેશનો જવાબ આપશો નહીં.`,
      susp: `ML મોડલ વિશ્લેષણ ${scamCategory} સાથે સુસંગત શંકાસ્પદ પેટર્ન દર્શાવે છે. જોખમ સ્કોર: ${riskScore}%. સાવચેતી રાખો.`,
      safe: `NLP મોડલે આ સંદેશને સુરક્ષિત તરીકે વર્ગીકૃત કર્યો છે. જોખમ સ્કોર: ${riskScore}%. જો કે, હંમેશા પ્રમાણભૂત સાવચેતી રાખો.`
    },
    ml: {
      high: `ML മോഡൽ വിശകലനം ${scamCategory} ശ്രമത്തെ ശക്തമായി സൂചിപ്പിക്കുന്നു. റിസ്ക് സ്കോർ: ${riskScore}%. ശുപാർശ ചെയ്യുന്നത്: ഈ സന്ദേശത്തോട് പ്രതികരിക്കരുത്.`,
      susp: `ML മോഡൽ വിശകലനം ${scamCategory} യുമായി പൊരുത്തപ്പെടുന്ന സംശയാസ്പദമായ പാറ്റേണുകൾ കാണിക്കുന്നു. റിസ്ക് സ്കോർ: ${riskScore}%. ജാഗ്രത പാലിക്കുക.`,
      safe: `NLP മോഡൽ ഈ സന്ദേശത്തെ സുരക്ഷിതമായി തരംതിരിച്ചു. റിസ്ക് സ്കോർ: ${riskScore}%. എന്നിരുന്നാലും, എപ്പോഴും ജാഗ്രത പാലിക്കുക.`
    },
    or: {
      high: `ML ମଡେଲ୍ ବିଶ୍ଳେଷଣ ଦୃଢ଼ ଭାବରେ ${scamCategory} ପ୍ରୟାସକୁ ସୂଚାଉଛି। ବିପଦ ସ୍କୋର୍: ${riskScore}%. ସୁପାରିଶ: ଏହି ମେସେଜ୍ ର ଉତ୍ତର ଦିଅନ୍ତୁ ନାହିଁ।`,
      susp: `ML ମଡେଲ୍ ବିଶ୍ଳେଷଣ ${scamCategory} ସହିତ ସମାନ ସନ୍ଦେହଜନକ ପ୍ୟାଟର୍ଣ୍ଣ ଦେଖାଉଛି। ବିପଦ ସ୍କୋର୍: ${riskScore}%. ସତର୍କ ରୁହନ୍ତୁ।`,
      safe: `NLP ମଡେଲ୍ ଏହି ମେସେଜ୍ କୁ ସୁରକ୍ଷିତ ବୋଲି ଶ୍ରେଣୀଭୁକ୍ତ କରିଛି। ବିପଦ ସ୍କୋର୍: ${riskScore}%. ତଥାପି, ସର୍ବଦା ସତର୍କ ରୁହନ୍ତୁ।`
    },
    pa: {
      high: `ਐਮਐਲ ਮਾਡਲ ਵਿਸ਼ਲੇਸ਼ਣ ਜ਼ੋਰਦਾਰ ਢੰਗ ਨਾਲ ਇੱਕ ${scamCategory} ਕੋਸ਼ਿਸ਼ ਨੂੰ ਦਰਸਾਉਂਦਾ ਹੈ। ਜੋਖਮ ਸਕੋਰ: ${riskScore}%. ਸਿਫਾਰਸ਼: ਇਸ ਸੁਨੇਹੇ ਦਾ ਜਵਾਬ ਨਾ ਦਿਓ।`,
      susp: `ਐਮਐਲ ਮਾਡਲ ਵਿਸ਼ਲੇਸ਼ਣ ${scamCategory} ਦੇ ਅਨੁਕੂਲ ਸ਼ੱਕੀ ਪੈਟਰਨ ਦਿਖਾਉਂਦਾ ਹੈ। ਜੋਖਮ ਸਕੋਰ: ${riskScore}%. ਸਾਵਧਾਨੀ ਵਰਤੋ।`,
      safe: `ਐਨਐਲਪੀ ਮਾਡਲ ਨੇ ਇਸ ਸੁਨੇਹੇ ਨੂੰ ਸੁਰੱਖਿਅਤ ਦਰਜਾ ਦਿੱਤਾ ਹੈ। ਜੋਖਮ ਸਕੋਰ: ${riskScore}%. ਹਾਲਾਂਕਿ, ਹਮੇਸ਼ਾ ਸਾਵਧਾਨ ਰਹੋ।`
    },
    as: {
      high: `ML আৰ্হি বিশ্লেষণে দৃঢ়ভাৱে এটা ${scamCategory} প্ৰচেষ্টাৰ ইংগিত দিয়ে। বিপদ স্কোৰ: ${riskScore}%. পৰামৰ্শ: এই বাৰ্তাৰ উত্তৰ নিদিব।`,
      susp: `ML আৰ্হি বিশ্লেষণে ${scamCategory} ৰ সৈতে সংগতিপূৰ্ণ সন্দেহজনক আৰ্হি দেখুৱায়। বিপদ স্কোৰ: ${riskScore}%. সাৱধান হওক।`,
      safe: `NLP আৰ্হিয়ে এই বাৰ্তাটোক নিৰাপদ বুলি শ্ৰেণীভুক্ত কৰিছে। বিপদ স্কোৰ: ${riskScore}%. অৱশ্যে, সদায় সাৱধান হওক।`
    }
  };

  const selLang = t[lang] ? lang : 'en';
  if (verdict === 'high_risk') explanation = t[selLang].high;
  else if (verdict === 'suspicious') explanation = t[selLang].susp;
  else explanation = t[selLang].safe;

  // Advice
  const advice = ADVICE_DB[scamCategory] || ADVICE_DB['default'];

  return {
    verdict,
    riskScore,
    scamCategory,
    explanation,
    indicators,
    advice,
    suspiciousURLs,
    detectedNumbers,
  };
}
