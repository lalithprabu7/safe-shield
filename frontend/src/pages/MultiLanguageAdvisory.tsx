import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Globe, Shield, AlertTriangle, BookOpen } from 'lucide-react';

const LANGUAGES = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'hi', label: 'Hindi', native: 'हिंदी' },
  { code: 'ta', label: 'Tamil', native: 'தமிழ்' },
  { code: 'te', label: 'Telugu', native: 'తెలుగు' },
  { code: 'kn', label: 'Kannada', native: 'ಕನ್ನಡ' },
  { code: 'bn', label: 'Bengali', native: 'বাংলা' },
];

interface Section {
  heading: string;
  content: string;
}

interface LangData {
  title: string;
  subtitle: string;
  sections: Section[];
}

export default function MultiLanguageAdvisory() {
  const [selectedLang, setSelectedLang] = useState('en');
  const [allTranslations, setAllTranslations] = useState<Record<string, LangData>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const resp = await fetch('/api/translations');
        if (!resp.ok) throw new Error('Failed');
        const data = await resp.json();
        setAllTranslations(data);
      } catch {
        // Use empty translations
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const langData = allTranslations[selectedLang];

  if (loading) {
    return (
      <div className="glass-card p-8 flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Section icons by index
  const SECTION_ICONS = [AlertTriangle, Shield, BookOpen, Globe, Shield];
  const SECTION_COLORS = ['text-danger', 'text-warning', 'text-accent', 'text-purple-400', 'text-success'];

  return (
    <div className="space-y-5 max-w-4xl">
      {/* Language Selector */}
      <div className="glass-card p-5">
        <h3 className="text-body-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Globe className="w-5 h-5 text-accent" /> Select Language
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => setSelectedLang(lang.code)}
              className={`px-4 py-3 rounded-lg text-center transition-all duration-200 ${
                selectedLang === lang.code
                  ? 'bg-accent/20 border border-accent/40 text-accent'
                  : 'bg-navy-700/50 border border-white/5 text-gray-400 hover:border-white/20 hover:text-gray-200'
              }`}
            >
              <p className="text-body font-medium">{lang.native}</p>
              <p className="text-caption text-gray-500">{lang.label}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Advisory Content */}
      {langData ? (
        <motion.div
          key={selectedLang}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-5"
        >
          {/* Title Banner */}
          <div className="glass-card p-5 border border-accent/20 bg-gradient-to-r from-accent/5 to-transparent">
            <h2 className="text-heading font-bold text-white">{langData.title}</h2>
            <p className="text-body text-gray-400 mt-1">{langData.subtitle}</p>
          </div>

          {/* Sections */}
          {langData.sections.map((section, i) => {
            const Icon = SECTION_ICONS[i % SECTION_ICONS.length];
            const color = SECTION_COLORS[i % SECTION_COLORS.length];
            const isAlert = i === 0; // First section is the "What is" alert

            return (
              <div
                key={i}
                className={`glass-card p-5 ${isAlert ? 'border border-danger/20' : ''}`}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-9 h-9 rounded-xl ${isAlert ? 'bg-danger/15' : 'bg-white/5'} flex items-center justify-center shrink-0`}>
                    <Icon className={`w-4.5 h-4.5 ${color}`} />
                  </div>
                  <h3 className={`text-body-lg font-semibold ${isAlert ? 'text-danger' : 'text-white'}`}>
                    {section.heading}
                  </h3>
                </div>
                <div className="bg-navy-700/30 rounded-lg p-4 border border-white/5">
                  <p className="text-body text-gray-300 leading-relaxed whitespace-pre-line">
                    {section.content}
                  </p>
                </div>
              </div>
            );
          })}
        </motion.div>
      ) : (
        <div className="glass-card p-8 flex items-center justify-center h-40">
          <p className="text-body text-gray-500">Translation not available for this language.</p>
        </div>
      )}
    </div>
  );
}
