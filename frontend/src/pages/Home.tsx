import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Phone, AudioWaveform, Shield, ScanLine, Network, Play,
  Globe, FileText, BarChart3, Map, TrendingUp, Users, PhoneOff
} from 'lucide-react';

// ---- IMPACT DATA — Deterministic, computed from mock dataset ----
// These values are derived from the backend mock data to be consistent.
const IMPACT_DATA = {
  fraudPrevented: { base: 4827, unit: 'L', prefix: '₹' },   // ₹48.27 Crore
  citizensProtected: { base: 28493, unit: '', prefix: '' },
  callsIntercepted: { base: 12847, unit: '', prefix: '' },
};

// Smooth count-up animation + slow deterministic increments
function ImpactCounter({ label, target, prefix = '', suffix = '', icon: Icon }: {
  label: string; target: number; prefix?: string; suffix?: string; icon: React.ElementType;
}) {
  const [count, setCount] = useState(0);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Phase 1: Animated count-up
  useEffect(() => {
    const duration = 2000;
    const start = Date.now();
    let raf: number;
    const animate = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [target]);

  // Phase 2: Slow deterministic ticks (not random — uses a counter-based pattern)
  useEffect(() => {
    const timeout = setTimeout(() => {
      let tickCount = 0;
      tickRef.current = setInterval(() => {
        tickCount++;
        // Deterministic increment pattern: 1, 2, 1, 3, 2, 1, 2, 3...
        const increments = [1, 2, 1, 3, 2, 1, 2, 3, 1, 2];
        const increment = increments[tickCount % increments.length];
        setCount((c) => c + increment);
      }, 4000);
    }, 2200);
    return () => {
      clearTimeout(timeout);
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, []);

  return (
    <div className="glass-card p-6 flex items-center gap-5">
      <div className="w-14 h-14 rounded-2xl bg-accent/15 flex items-center justify-center shrink-0">
        <Icon className="w-7 h-7 text-accent" />
      </div>
      <div>
        <p className="text-display text-white tabular-nums">
          {prefix}{count.toLocaleString('en-IN')}{suffix}
        </p>
        <p className="text-caption text-gray-400 mt-1">{label}</p>
      </div>
    </div>
  );
}

const MODULE_CARDS = [
  { path: '/scam-classifier', label: 'Scam Call Classifier', desc: 'Real-time AI transcript analysis', icon: Phone, color: 'from-red-500/20 to-red-600/10' },
  { path: '/voice-detector', label: 'Voice Deepfake Detector', desc: 'Synthetic voice identification', icon: AudioWaveform, color: 'from-purple-500/20 to-purple-600/10' },
  { path: '/fraud-shield', label: 'Citizen Fraud Shield', desc: 'Chat-based fraud advisory', icon: Shield, color: 'from-emerald-500/20 to-emerald-600/10' },
  { path: '/counterfeit-scanner', label: 'Counterfeit Scanner', desc: 'Currency note verification', icon: ScanLine, color: 'from-amber-500/20 to-amber-600/10' },
  { path: '/fraud-network', label: 'Fraud Network Graph', desc: 'Interactive fraud network map', icon: Network, color: 'from-blue-500/20 to-blue-600/10' },
  { path: '/demo-mode', label: 'Demo Mode ⭐', desc: 'Full pipeline walkthrough', icon: Play, color: 'from-cyan-500/20 to-cyan-600/10' },
  { path: '/multi-language', label: 'Multi-Language Advisory', desc: 'Safety advisories in 6 languages', icon: Globe, color: 'from-teal-500/20 to-teal-600/10' },
  { path: '/evidence-report', label: 'Evidence Report', desc: 'Auto-generated PDF reports', icon: FileText, color: 'from-indigo-500/20 to-indigo-600/10' },
  { path: '/false-positive', label: 'False-Positive Dashboard', desc: 'Precision & recall metrics', icon: BarChart3, color: 'from-pink-500/20 to-pink-600/10' },
  { path: '/heatmap', label: 'Geospatial Heatmap', desc: 'India-wide fraud density map', icon: Map, color: 'from-orange-500/20 to-orange-600/10' },
];

export default function Home() {
  return (
    <div className="space-y-8">
      {/* Impact Calculator Hero */}
      <div>
        <h2 className="text-heading text-white mb-1">Real-Time Impact</h2>
        <p className="text-body text-gray-400 mb-5">DigitalShield AI is actively protecting citizens across India</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ImpactCounter
            icon={TrendingUp}
            label="Fraud Prevented"
            target={IMPACT_DATA.fraudPrevented.base}
            prefix={IMPACT_DATA.fraudPrevented.prefix}
            suffix={` ${IMPACT_DATA.fraudPrevented.unit}`}
          />
          <ImpactCounter
            icon={Users}
            label="Citizens Protected"
            target={IMPACT_DATA.citizensProtected.base}
          />
          <ImpactCounter
            icon={PhoneOff}
            label="Scam Calls Intercepted"
            target={IMPACT_DATA.callsIntercepted.base}
          />
        </div>
      </div>

      {/* Module Quick Access Grid */}
      <div>
        <h2 className="text-heading text-white mb-1">Intelligence Modules</h2>
        <p className="text-body text-gray-400 mb-5">Access all platform capabilities from a single dashboard</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
          {MODULE_CARDS.map((card, i) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.path}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.3 }}
              >
                <Link
                  to={card.path}
                  className="glass-card-hover block p-5 group h-full"
                >
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-5 h-5 text-gray-200" />
                  </div>
                  <h3 className="text-body font-semibold text-white mb-1 group-hover:text-accent transition-colors">{card.label}</h3>
                  <p className="text-caption text-gray-500">{card.desc}</p>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
