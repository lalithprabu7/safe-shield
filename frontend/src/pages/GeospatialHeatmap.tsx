import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Loader2, Play, Pause } from 'lucide-react';
import { motion } from 'framer-motion';

interface CityData {
  name: string;
  lat: number;
  lng: number;
  complaints: number;
  topScams: string[];
  severity: string;
}

// Fix Leaflet default icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const SEVERITY_COLORS: Record<string, string> = {
  critical: '#EF4444',
  high: '#F59E0B',
  medium: '#06B6D4',
  low: '#10B981',
};

function createIcon(severity: string) {
  const color = SEVERITY_COLORS[severity] || '#6B7280';
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      width: 24px; height: 24px; border-radius: 50%;
      background: ${color}; border: 3px solid rgba(255,255,255,0.8);
      box-shadow: 0 0 10px ${color}80, 0 2px 8px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -16],
  });
}

function HeatLayer({ cities, dayMultiplier }: { cities: CityData[], dayMultiplier: number }) {
  const map = useMap();

  useEffect(() => {
    const circles: L.Circle[] = [];
    cities.forEach((city) => {
      // Scale complaints based on current day out of 30
      const activeComplaints = city.complaints * dayMultiplier;
      if (activeComplaints < 100) return; // Don't show very small activity early on

      const intensity = activeComplaints / 5500;
      const radius = 15000 + intensity * 80000;
      const color = SEVERITY_COLORS[city.severity] || '#06B6D4';
      const circle = L.circle([city.lat, city.lng], {
        radius,
        fillColor: color,
        fillOpacity: 0.15 + intensity * 0.2,
        stroke: false,
      }).addTo(map);
      circles.push(circle);
    });
    return () => {
      circles.forEach((c) => map.removeLayer(c));
    };
  }, [map, cities, dayMultiplier]);

  return null;
}

export default function GeospatialHeatmap() {
  const [cities, setCities] = useState<CityData[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Timeline state
  const [day, setDay] = useState(30);
  const [isPlaying, setIsPlaying] = useState(false);
  const TOTAL_DAYS = 30;

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isPlaying) {
      interval = setInterval(() => {
        setDay(prev => {
          if (prev >= TOTAL_DAYS) {
            setIsPlaying(false);
            return TOTAL_DAYS;
          }
          return prev + 1;
        });
      }, 300);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const togglePlay = () => {
    if (day >= TOTAL_DAYS && !isPlaying) {
      setDay(1);
    }
    setIsPlaying(!isPlaying);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const resp = await fetch('/api/heatmap/data');
        if (!resp.ok) throw new Error('Failed');
        const data = await resp.json();
        setCities(data.cities);
      } catch {
        // empty
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="glass-card p-8 flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
      </div>
    );
  }

  const dayMultiplier = day / TOTAL_DAYS;

  return (
    <div className="space-y-5">
      {/* Timeline Controls */}
      <div className="glass-card p-4">
        <div className="flex items-center gap-4">
          <button
            onClick={togglePlay}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-accent hover:bg-accent/80 text-white transition-colors"
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-1" />}
          </button>
          
          <div className="flex-1 px-4">
            <div className="flex justify-between text-caption text-gray-400 mb-2">
              <span>Day 1</span>
              <span className="text-white font-semibold">Day {day}</span>
              <span>Day 30</span>
            </div>
            <div className="relative h-2 bg-gray-700 rounded-full cursor-pointer">
              <motion.div 
                className="absolute top-0 left-0 h-full bg-accent rounded-full"
                style={{ width: `${(day / TOTAL_DAYS) * 100}%` }}
                layout
              />
              <input 
                type="range" 
                min="1" 
                max="30" 
                value={day}
                onChange={(e) => {
                  setDay(parseInt(e.target.value));
                  setIsPlaying(false);
                }}
                className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card overflow-hidden" style={{ height: 'calc(100vh - 16rem)' }}>
        <MapContainer
          center={[22.5, 78.5]}
          zoom={5}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
          zoomControl={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <HeatLayer cities={cities} dayMultiplier={dayMultiplier} />
          {cities.filter(city => city.complaints * dayMultiplier > 100).map((city) => (
            <Marker
              key={city.name}
              position={[city.lat, city.lng]}
              icon={createIcon(city.severity)}
            >
              <Popup>
                <div className="min-w-[200px]">
                  <h3 className="font-bold text-sm text-gray-900 mb-1">{city.name}</h3>
                  <p className="text-xs text-gray-600 mb-2">
                    <span className="font-semibold">{Math.round(city.complaints * dayMultiplier).toLocaleString()}</span> complaints reported
                  </p>
                  <p className="text-xs font-semibold text-gray-700 mb-1">Top Scam Types:</p>
                  <ul className="text-xs text-gray-600 space-y-0.5">
                    {city.topScams.map((scam, i) => (
                      <li key={i}>• {scam}</li>
                    ))}
                  </ul>
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold text-white`}
                      style={{ backgroundColor: SEVERITY_COLORS[city.severity] }}>
                      {city.severity.toUpperCase()}
                    </span>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Legend */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h3 className="text-body font-semibold text-gray-400">Severity Legend</h3>
          <div className="flex gap-5">
            {Object.entries(SEVERITY_COLORS).map(([level, color]) => (
              <div key={level} className="flex items-center gap-2 text-caption text-gray-400">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                <span className="capitalize">{level}</span>
              </div>
            ))}
          </div>
          <p className="text-caption text-gray-500">Showing active clusters • Data scaled by timeline (Day {day})</p>
        </div>
      </div>
    </div>
  );
}
