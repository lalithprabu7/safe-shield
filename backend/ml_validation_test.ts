import { analyzeCurrency } from './src/services/currencyAnalyzerAgent';
import { analyzeVoice } from './src/services/voiceSpoofAgent';
import { analyzeMessage } from './src/services/chatAdvisorAgent';
import { classifyTranscript } from './src/services/scamClassifierAgent';

async function runTests() {
  console.log("=== ML VALIDATION TEST SUITE ===\n");
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName}`);
      failed++;
    }
  }

  // 1. Currency Analyzer Tests (ML Driven)
  try {
    // Pass features that simulate a "Fake" note (low scores)
    const fakeResult = analyzeCurrency("sample_fake_note.jpg", [0.1, 0.2, 0.1]);
    assert(fakeResult.isGenuine === false, "Currency ML Model correctly classifies [0.1, 0.2, 0.1] features as Counterfeit");
    
    // Pass features that simulate a "Genuine" note (high scores)
    const genuineResult = analyzeCurrency("sample_genuine_note.jpg", [0.9, 0.9, 0.8]);
    assert(genuineResult.isGenuine === true, "Currency ML Model correctly classifies [0.9, 0.9, 0.8] features as Genuine");
  } catch (err) {
    console.error("Currency tests threw error:", err);
    failed += 2;
  }

  // 2. Voice Deepfake Tests (ML Driven)
  try {
    // Pass features simulating a Deepfake (Low Pitch Variance, High HNR, High Spectral Anomalies)
    const voiceFakeResult = analyzeVoice("sample_voice.wav", 4000, [0.1, 0.9, 0.9]);
    assert(voiceFakeResult.isDeepfake === true, "Voice ML correctly classifies [0.1, 0.9, 0.9] features as Deepfake");
    
    // Pass features simulating Human Voice (High Pitch Variance, Low HNR, Low Spectral Anomalies)
    const voiceGenuineResult = analyzeVoice("sample_voice.wav", 4000, [0.9, 0.1, 0.1]);
    assert(voiceGenuineResult.isDeepfake === false, "Voice ML correctly classifies [0.9, 0.1, 0.1] features as Human");

    // Backwards compatibility tests
    const deepfakeNameResult = analyzeVoice("deepfake_sample.wav", 1000);
    assert(deepfakeNameResult.isDeepfake === true, "Voice: 'deepfake' and small size correctly triggers detection");
    
    const realNameResult = analyzeVoice("real_audio.wav", 150000);
    assert(realNameResult.isDeepfake === false, "Voice: 'real' correctly flags as genuine");
  } catch (err) {
    console.error("Voice tests threw error:", err);
    failed += 2;
  }

  // 3. Chat / Scam Classifier Tests
  try {
    const safeMsgResult = await analyzeMessage("I want to buy some apples from the market today");
    assert(safeMsgResult.scamCategory === 'Safe', "Chat Advisor: Safe sentence correctly bypasses Naive Bayes false positives");

    const scamMsgResult = await analyzeMessage("cbi is calling you must pay now or go to jail");
    assert(scamMsgResult.scamCategory !== 'Safe', "Chat Advisor: Actual scam sentence is flagged correctly");

    const safeScamResult = await classifyTranscript("Can you give me the OTP for the login?");
    assert(safeScamResult.riskLevel !== 'safe' && safeScamResult.riskLevel !== 'low', "Scam Classifier: OTP request is flagged as risky");
  } catch (err) {
    console.error("Chat/Scam tests threw error:", err);
    failed += 3;
  }

  console.log(`\n=== RESULTS: ${passed} Passed, ${failed} Failed ===`);
  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests();
