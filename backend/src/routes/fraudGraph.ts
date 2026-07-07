import { Router } from 'express';
import fs from 'fs';
import path from 'path';

const router = Router();
const dataPath = path.join(__dirname, '../../data/fraudNetwork.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

// GET /api/fraud-graph/data — return the full fraud network graph
router.get('/data', (_req, res) => {
  try {
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load fraud graph data' });
  }
});

// GET /api/fraud-graph/cluster/:id — return cluster details with nodes
router.get('/cluster/:id', (req, res) => {
  try {
    const clusterId = parseInt(req.params.id);
    const cluster = data.clusters.find((c: any) => c.id === clusterId);
    if (!cluster) {
      return res.status(404).json({ error: 'Cluster not found' });
    }
    const clusterNodes = data.nodes.filter((n: any) => n.group === clusterId);
    const nodeIds = new Set(clusterNodes.map((n: any) => n.id));
    const clusterLinks = data.links.filter((l: any) =>
      nodeIds.has(l.source) || nodeIds.has(l.target)
    );
    res.json({ ...cluster, nodes: clusterNodes, links: clusterLinks });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load cluster data' });
  }
});

// GET /api/fraud-graph/node/:id — return individual node details with explanation
router.get('/node/:id', (req, res) => {
  try {
    const node = data.nodes.find((n: any) => n.id === req.params.id);
    if (!node) {
      return res.status(404).json({ error: 'Node not found' });
    }
    // Find connected nodes
    const connectedLinks = data.links.filter((l: any) =>
      l.source === node.id || l.target === node.id
    );
    const connectedNodeIds = connectedLinks.map((l: any) =>
      l.source === node.id ? l.target : l.source
    );
    const connectedNodes = data.nodes.filter((n: any) =>
      connectedNodeIds.includes(n.id)
    );
    // Find cluster info
    const cluster = data.clusters.find((c: any) => c.id === node.group);

    res.json({
      ...node,
      connections: connectedNodes.map((cn: any) => ({
        id: cn.id,
        label: cn.label,
        type: cn.type,
        risk: cn.risk,
        linkType: connectedLinks.find((l: any) => l.source === cn.id || l.target === cn.id)?.type || 'unknown',
      })),
      cluster: cluster ? {
        name: cluster.name,
        riskScore: cluster.riskScore,
        scamType: cluster.scamType,
        recommendedAction: cluster.recommendedAction,
      } : null,
      investigationNotes: `Node ${node.id} (${node.type}) is part of ${cluster?.name || 'unknown cluster'}. Risk level: ${node.risk}. ${node.riskExplanation || 'No additional details.'}`,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load node data' });
  }
});

export { router as fraudGraphRoutes };
