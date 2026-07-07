import { useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { Bell, User, LogOut, ChevronDown } from 'lucide-react';

const PAGE_TITLES: Record<string, string> = {
  '/': 'Command Center',
  '/scam-classifier': 'Live Scam Call Classifier',
  '/voice-detector': 'Voice Deepfake Detector',
  '/fraud-shield': 'Citizen Fraud Shield',
  '/counterfeit-scanner': 'Counterfeit Note Scanner',
  '/fraud-network': 'Fraud Network Graph',
  '/demo-mode': 'Digital Arrest Simulation Demo',
  '/multi-language': 'Multi-Language Advisory',
  '/evidence-report': 'Evidence Report Generator',
  '/false-positive': 'False-Positive Guardrail Dashboard',
  '/heatmap': 'Geospatial Fraud Heatmap',
};

export default function TopBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [time, setTime] = useState(new Date());
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const title = PAGE_TITLES[location.pathname] || 'DigitalShield AI';

  const userName = localStorage.getItem('userName') || 'NCRB Command';
  const userRole = localStorage.getItem('userRole') || 'Lead Agent';

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    localStorage.removeItem('userRole');
    navigate('/login');
  };

  return (
    <header className="h-14 bg-navy-900/80 backdrop-blur-xl border-b border-white/[0.06] flex items-center justify-between px-6 shrink-0 relative z-40">
      <h2 className="text-body-lg font-semibold text-white truncate">{title}</h2>

      <div className="flex items-center gap-5">
        {/* Live Clock */}
        <div className="text-body font-mono text-gray-400 tabular-nums">
          {time.toLocaleTimeString('en-IN', { hour12: false })}
        </div>

        {/* Notification Bell */}
        <button className="relative text-gray-400 hover:text-gray-200 transition-colors">
          <Bell className="w-[18px] h-[18px]" />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-danger rounded-full"></span>
        </button>

        {/* User Dropdown */}
        <div ref={dropdownRef} className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 pl-4 border-l border-white/[0.08] hover:opacity-85 transition-opacity text-left"
          >
            <div className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center">
              <User className="w-3.5 h-3.5 text-accent" />
            </div>
            <div className="hidden lg:block">
              <p className="text-caption font-semibold text-white leading-tight">{userName}</p>
              <p className="text-[10px] text-gray-400 leading-tight">{userRole}</p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400 hidden lg:block" />
          </button>

          {showDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-[#0b1120] border border-white/10 rounded-lg shadow-xl py-1 z-50">
              <div className="px-4 py-2 border-b border-white/[0.06]">
                <p className="text-caption font-semibold text-white truncate">{userName}</p>
                <p className="text-[10px] text-gray-400 truncate">{userRole}</p>
              </div>
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-caption text-danger-light hover:bg-danger/10 transition-colors text-left"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out / Lock
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
