/// <reference types="vite/client" />

declare module 'leaflet.heat' {
  import * as L from 'leaflet';
  function heatLayer(
    latlngs: Array<[number, number, number?]>,
    options?: {
      minOpacity?: number;
      maxZoom?: number;
      max?: number;
      radius?: number;
      blur?: number;
      gradient?: Record<number, string>;
    }
  ): L.Layer;
  export default heatLayer;
}

declare module 'react-force-graph-2d' {
  import { Component } from 'react';
  interface ForceGraph2DProps {
    graphData: { nodes: any[]; links: any[] };
    nodeLabel?: string | ((node: any) => string);
    nodeColor?: string | ((node: any) => string);
    nodeVal?: number | string | ((node: any) => number);
    linkColor?: string | ((link: any) => string);
    linkWidth?: number | ((link: any) => number);
    onNodeClick?: (node: any, event: MouseEvent) => void;
    onNodeHover?: (node: any | null, prevNode: any | null) => void;
    width?: number;
    height?: number;
    backgroundColor?: string;
    nodeCanvasObject?: (node: any, ctx: CanvasRenderingContext2D, globalScale: number) => void;
    linkDirectionalParticles?: number;
    linkDirectionalParticleSpeed?: number;
    cooldownTicks?: number;
    d3AlphaDecay?: number;
    d3VelocityDecay?: number;
    warmupTicks?: number;
    enableNodeDrag?: boolean;
    enableZoomInteraction?: boolean;
    enablePanInteraction?: boolean;
    [key: string]: any;
  }
  const ForceGraph2D: React.FC<ForceGraph2DProps>;
  export default ForceGraph2D;
}
