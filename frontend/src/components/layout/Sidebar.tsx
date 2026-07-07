import { NavLink, useLocation } from 'react-router-dom';
import {
  Phone, AudioWaveform, Shield, ScanLine, Network, Play,
  Globe, FileText, BarChart3, Map, Home, ShieldCheck
} from 'lucide-react';
import { useState, useEffect } from 'react';

const NAV_ITEMS = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/scam-classifier', label: 'Scam Call Classifier', icon: Phone },
  { path: '/voice-detector', label: 'Voice Deepfake Detector', icon: AudioWaveform },
  { path: '/fraud-shield', label: 'Citizen Fraud Shield', icon: Shield },
  { path: '/counterfeit-scanner', label: 'Counterfeit Scanner', icon: ScanLine },
  { path: '/fraud-network', label: 'Fraud Network Graph', icon: Network },
  { path: '/demo-mode', label: 'Demo Mode ⭐', icon: Play },
  { path: '/multi-language', label: 'Multi-Language Advisory', icon: Globe },
  { path: '/evidence-report', label: 'Evidence Report', icon: FileText },
  { path: '/false-positive', label: 'False-Positive Dashboard', icon: BarChart3 },
  { path: '/heatmap', label: 'Geospatial Heatmap', icon: Map },
];

export default function Sidebar() {
  const location = useLocation();
  const [threatLevel, setThreatLevel] = useState<'MODERATE' | 'HIGH' | 'ELEVATED'>('HIGH');

  useEffect(() => {
    const interval = setInterval(() => {
      setThreatLevel((prev) => {
        const levels: Array<'MODERATE' | 'HIGH' | 'ELEVATED'> = ['MODERATE', 'HIGH', 'ELEVATED'];
        const idx = levels.indexOf(prev);
        return levels[(idx + 1) % levels.length];
      });
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const threatColors = {
    MODERATE: 'bg-warning/20 text-warning border-warning/40',
    HIGH: 'bg-danger/20 text-danger border-danger/40',
    ELEVATED: 'bg-orange-500/20 text-orange-400 border-orange-500/40',
  };

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-navy-950 border-r border-white/[0.06] flex flex-col z-50">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-accent to-cyan-400 flex items-center justify-center shadow-lg shadow-accent/20">
            <ShieldCheck className="w-5 h-5 text-navy-900" />
          </div>
          <div>
            <h1 className="text-body-lg font-bold text-white leading-tight">DigitalShield</h1>
            <p className="text-[11px] text-accent font-medium tracking-wider uppercase">AI Platform</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-200 group ${
                isActive
                  ? 'bg-accent/15 text-accent border border-accent/20'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-white/[0.04] border border-transparent'
              }`}
            >
              <Icon className={`w-[18px] h-[18px] shrink-0 ${isActive ? 'text-accent' : 'text-gray-500 group-hover:text-gray-400'}`} />
              <span className="truncate">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Threat Level Indicator */}
      <div className="px-4 py-4 border-t border-white/[0.06]">
        <div className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg border text-caption font-semibold tracking-wide ${threatColors[threatLevel]}`}>
          <span className="relative flex h-2 w-2">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
              threatLevel === 'HIGH' ? 'bg-danger' : threatLevel === 'ELEVATED' ? 'bg-orange-400' : 'bg-warning'
            }`}></span>
            <span className={`relative inline-flex rounded-full h-2 w-2 ${
              threatLevel === 'HIGH' ? 'bg-danger' : threatLevel === 'ELEVATED' ? 'bg-orange-400' : 'bg-warning'
            }`}></span>
          </span>
          Threat Level: {threatLevel}
        </div>
      </div>
    </aside>
  );
}
