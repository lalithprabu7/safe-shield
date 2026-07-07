const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, 'backend', 'data', 'translations.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

const missingLangs = ['mr', 'gu', 'ml', 'or', 'pa', 'as'];
const enData = data['en'];

for (const lang of missingLangs) {
  if (!data[lang]) {
    // Clone English as fallback
    data[lang] = JSON.parse(JSON.stringify(enData));
    data[lang].title += ` (${lang.toUpperCase()})`; // visually distinguish
  }
}

fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
console.log('Translations filled!');
