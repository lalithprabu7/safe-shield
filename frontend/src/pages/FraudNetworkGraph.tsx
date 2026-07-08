import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, AlertTriangle } from 'lucide-react';

// Lazy-load ForceGraph3D to avoid SSR issues
import ForceGraph3D from 'react-force-graph-3d';
import * as THREE from 'three';

interface GraphNode {
  id: string;
  label: string;
  type: string;
  risk: string;
  group: number;
  riskExplanation?: string;
  fraudAmount?: string;
  lastActive?: string;
  x?: number;
  y?: number;
  z?: number;
}

interface GraphLink {
  source: string | GraphNode;
  target: string | GraphNode;
  type: string;
}

interface Cluster {
  id: number;
  name: string;
  riskScore: number;
  totalTransactions: number;
  estimatedLoss: string;
  activeMembers: number;
  lastActivity: string;
}

const RISK_COLORS: Record<string, string> = {
  critical: '#EF4444',
  high: '#F59E0B',
  medium: '#06B6D4',
  low: '#10B981',
};

const TYPE_SHAPES: Record<string, string> = {
  phone: '📱',
  bank: '🏦',
  device: '💻',
  identity: '🪪',
  upi: '💳',
};

export default function FraudNetworkGraph() {
  const [graphData, setGraphData] = useState<{ nodes: GraphNode[]; links: GraphLink[] }>({ nodes: [], links: [] });
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [selectedCluster, setSelectedCluster] = useState<Cluster | null>(null);
  const [loading, setLoading] = useState(true);
  const [highlightGroup, setHighlightGroup] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const resp = await fetch('/api/fraud-graph/data');
        const data = await resp.json();
        setGraphData({ nodes: data.nodes, links: data.links });
        setClusters(data.clusters);
      } catch {
        // Fallback to empty
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({
          width: rect.width,
          height: Math.max(rect.height, 400),
        });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [loading]);

  const handleNodeClick = useCallback((node: any) => {
    setSelectedNode(node);
    setHighlightGroup(node.group);
    const cluster = clusters.find((c) => c.id === node.group);
    setSelectedCluster(cluster || null);
  }, [clusters]);

  const closePanel = () => {
    setSelectedNode(null);
    setSelectedCluster(null);
    setHighlightGroup(null);
  };

  if (loading) {
    return (
      <div className="glass-card p-8 flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative">
      <div ref={containerRef} className="glass-card overflow-hidden" style={{ height: 'calc(100vh - 10rem)' }}>
        <ForceGraph3D
          graphData={graphData}
          width={dimensions.width}
          height={dimensions.height}
          backgroundColor="#0B1120"
          nodeColor={(node: any) => RISK_COLORS[node.risk] || '#6B7280'}
          nodeOpacity={0.8}
          nodeResolution={16}
          linkColor={(link: any) => {
            if (highlightGroup === null) return 'rgba(107,114,128,0.3)';
            const src = typeof link.source === 'object' ? link.source : graphData.nodes.find((n) => n.id === link.source);
            const tgt = typeof link.target === 'object' ? link.target : graphData.nodes.find((n) => n.id === link.target);
            if (src?.group === highlightGroup || tgt?.group === highlightGroup) return 'rgba(6,182,212,0.6)';
            return 'rgba(107,114,128,0.05)';
          }}
          linkWidth={(link: any) => {
            const src = typeof link.source === 'object' ? link.source : graphData.nodes.find((n) => n.id === link.source);
            const tgt = typeof link.target === 'object' ? link.target : graphData.nodes.find((n) => n.id === link.target);
            return (src?.group === highlightGroup || tgt?.group === highlightGroup) ? 2 : 0.5;
          }}
          onNodeClick={handleNodeClick}
          linkDirectionalParticles={2}
          linkDirectionalParticleSpeed={0.005}
          cooldownTicks={100}
        />
      </div>

      {/* Legend */}
      <div className="absolute top-3 left-3 glass-card p-3 space-y-1.5">
        {Object.entries(RISK_COLORS).map(([level, color]) => (
          <div key={level} className="flex items-center gap-2 text-caption text-gray-400">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
            <span className="capitalize">{level}</span>
          </div>
        ))}
      </div>

      {/* Side Panel */}
      <AnimatePresence>
        {selectedNode && selectedCluster && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="absolute top-0 right-0 bottom-0 w-[360px] glass-card border-l border-white/10 flex flex-col"
          >
            <div className="p-5 border-b border-white/[0.06] flex items-center justify-between shrink-0">
              <h3 className="text-body-lg font-semibold text-white">Forensic Node Inspector</h3>
              <button onClick={closePanel} className="text-gray-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1 custom-scrollbar space-y-5">
              {/* Node Info */}
              <div className="space-y-4">
                <div className="bg-navy-700/50 rounded-lg p-3 border border-white/5">
                  <p className="text-[10px] uppercase text-gray-500 font-semibold tracking-wider mb-1">Entity Identifier</p>
                  <p className="text-body font-mono text-white">{selectedNode.label}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-navy-700/50 rounded-lg p-3 border border-white/5">
                    <p className="text-[10px] uppercase text-gray-500 font-semibold tracking-wider mb-1">Entity Type</p>
                    <p className="text-body text-white capitalize">{TYPE_SHAPES[selectedNode.type] || ''} {selectedNode.type}</p>
                  </div>
                  <div className={`rounded-lg p-3 border ${selectedNode.risk === 'critical' ? 'bg-danger/10 border-danger/30' : selectedNode.risk === 'high' ? 'bg-warning/10 border-warning/30' : 'bg-navy-700/50 border-white/5'}`}>
                    <p className="text-[10px] uppercase text-gray-500 font-semibold tracking-wider mb-1">Threat Level</p>
                    <span className="text-body font-bold capitalize" style={{ color: RISK_COLORS[selectedNode.risk] }}>
                      {selectedNode.risk}
                    </span>
                  </div>
                </div>

                {/* Node Risk Explanation */}
                {selectedNode.riskExplanation && (
                  <div className="bg-navy-800 rounded-lg p-3 border border-white/5">
                    <p className="text-[10px] uppercase text-gray-500 font-semibold tracking-wider mb-2">AI Risk Analysis</p>
                    <p className="text-caption text-gray-300 leading-relaxed">{selectedNode.riskExplanation}</p>
                  </div>
                )}
                
                {selectedNode.fraudAmount && (
                  <div className="bg-navy-800 rounded-lg p-3 border border-white/5">
                    <p className="text-[10px] uppercase text-gray-500 font-semibold tracking-wider mb-1">Estimated Financial Impact</p>
                    <p className="text-body-lg font-bold text-danger">{selectedNode.fraudAmount}</p>
                  </div>
                )}

                {/* Actionable SOP */}
                {(selectedNode.risk === 'critical' || selectedNode.risk === 'high') && (
                  <div className="glass-card p-4 border border-danger/30 bg-danger/5 mt-2">
                      <h3 className="text-caption font-semibold text-danger uppercase tracking-wider mb-2 flex items-center gap-2">
                          <AlertTriangle className="w-3.5 h-3.5" /> Recommended SOP
                      </h3>
                      <ul className="space-y-1.5 text-caption text-gray-200">
                          <li className="flex items-start gap-2"><span className="text-danger mt-0.5">•</span> Freeze associated accounts immediately via INSACOG integration.</li>
                          <li className="flex items-start gap-2"><span className="text-danger mt-0.5">•</span> Extract all connected nodes (1-hop radius) for proactive monitoring.</li>
                      </ul>
                  </div>
                )}
              </div>

              {/* Cluster Info */}
              <div className="border-t border-white/[0.06] pt-5 mt-5">
                <h4 className="text-caption font-semibold text-gray-400 uppercase tracking-wider mb-4">Network Cluster Topology</h4>
                <div className="bg-navy-800 rounded-xl p-4 border border-white/5 space-y-3">
                    <p className="text-body font-semibold text-white mb-2">{selectedCluster.name}</p>
                    <div className="grid grid-cols-2 gap-y-3 gap-x-4">
                        <div>
                            <span className="text-[10px] uppercase text-gray-500 font-semibold tracking-wider block">Aggregate Risk</span>
                            <span className={`text-body font-semibold ${selectedCluster.riskScore >= 80 ? 'text-danger' : selectedCluster.riskScore >= 60 ? 'text-warning' : 'text-accent'}`}>
                                {selectedCluster.riskScore}/100
                            </span>
                        </div>
                        <div>
                            <span className="text-[10px] uppercase text-gray-500 font-semibold tracking-wider block">Est. Exposure</span>
                            <span className="text-body font-semibold text-danger">{selectedCluster.estimatedLoss}</span>
                        </div>
                        <div>
                            <span className="text-[10px] uppercase text-gray-500 font-semibold tracking-wider block">Active Entities</span>
                            <span className="text-body font-semibold text-white">{selectedCluster.activeMembers}</span>
                        </div>
                        <div>
                            <span className="text-[10px] uppercase text-gray-500 font-semibold tracking-wider block">Tx Volume</span>
                            <span className="text-body font-semibold text-white">{selectedCluster.totalTransactions.toLocaleString()}</span>
                        </div>
                    </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
