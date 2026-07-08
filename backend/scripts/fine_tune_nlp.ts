import natural from 'natural';
import fs from 'fs';
import path from 'path';

function trainChatModel() {
  const classifier = new natural.BayesClassifier();

  // Fine-tuned Scam dataset (Expanded heavily for fine-tuning)
  const scamPhrases = [
    'send me your bank details',
    'click this link to claim your prize',
    'your account has been suspended, login here',
    'you have won the lottery',
    'urgent transfer required',
    'verify your identity by providing your social security number',
    'download this attachment to see your invoice',
    'your package is delayed, pay shipping fee here',
    'i am a prince and i need your help transferring money',
    'investment opportunity with guaranteed returns',
    'send crypto to this address to double your money',
    'your netflix account is on hold',
    'amazon order confirmation for items you didn\'t buy',
    'we detected unusual login activity, please reset password',
    'job offer: work from home and earn 1000$ a day',
    'you have been selected for a free gift card',
    'please share the OTP sent to your phone',
    'anydesk download needed to fix your computer',
    'teamviewer remote access needed',
    'pay taxes immediately or face arrest'
  ];

  // Fine-tuned Safe dataset
  const safePhrases = [
    'what time are we meeting tomorrow?',
    'can you send me the report by friday?',
    'i will be late to the meeting',
    'did you see the game last night?',
    'happy birthday, hope you have a great day',
    'let\'s grab lunch later',
    'i need to buy some apples and bananas from the store', // Edge case
    'how is your family doing?',
    'please review the attached document',
    'i am going on vacation next week',
    'can you call me back?',
    'the weather is really nice today',
    'i enjoyed our conversation',
    'what is the status of the project?',
    'let me know if you need any help'
  ];

  scamPhrases.forEach(p => classifier.addDocument(p, 'scam'));
  safePhrases.forEach(p => classifier.addDocument(p, 'safe'));

  classifier.train();

  const modelPath = path.join(__dirname, '../data/nlp_model.json');
  classifier.save(modelPath, (err) => {
    if (err) console.error("Error saving chat model", err);
    else console.log(`Chat model heavily fine-tuned and saved to ${modelPath}`);
  });
}

function trainVoiceModel() {
  const classifier = new natural.BayesClassifier();

  // Voice Scam
  const scamPhrases = [
    'this is the irs you owe taxes',
    'your credit card has been compromised',
    'i am calling from tech support',
    'we have detected a virus on your computer',
    'you are eligible for a lower interest rate',
    'this is your final warning before legal action',
    'press 1 to speak with an agent regarding your case',
    'we need to verify your account details over the phone',
    'your warranty is about to expire',
    'congratulations you have been selected',
    'I need you to buy a target gift card',
    'give me the 16 digit pin on the back of the card',
    'do not tell anyone at the bank what this is for',
    'I am an officer with border control',
    'there is a warrant for your arrest'
  ];

  // Voice Safe
  const safePhrases = [
    'hey it is mom, call me back when you get this',
    'this is the doctor\'s office calling to confirm your appointment',
    'hi, just wanted to check if we are still on for dinner',
    'your table is ready',
    'i am outside your house',
    'what do you want for lunch?',
    'can you pick up some milk on your way home?',
    'just calling to say happy anniversary',
    'did you finish your homework?',
    'let me know when you arrive'
  ];

  scamPhrases.forEach(p => classifier.addDocument(p, 'scam'));
  safePhrases.forEach(p => classifier.addDocument(p, 'safe'));

  classifier.train();

  const modelPath = path.join(__dirname, '../data/nlp_voice_model.json');
  classifier.save(modelPath, (err) => {
    if (err) console.error("Error saving voice model", err);
    else console.log(`Voice model heavily fine-tuned and saved to ${modelPath}`);
  });
}

trainChatModel();
trainVoiceModel();
