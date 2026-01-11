import { useMemo, useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  Handle,
  Position,
  type NodeProps,
  type Edge,
  type Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

interface RequirementNodeData {
  id: string;
  title: string;
  isCurrent: boolean;
  status: string;
  [key: string]: unknown;
}

// Custom Node for Requirements
const RequirementNode = ({ data }: NodeProps<Node<RequirementNodeData>>) => {
  return (
    <div style={{
      padding: '10px',
      borderRadius: '8px',
      border: `2px solid ${data?.isCurrent ? 'var(--accent-color)' : 'var(--border-color)'}`,
      background: 'var(--bg-secondary)',
      width: '180px',
      fontSize: '0.85rem',
      position: 'relative',
      boxShadow: data?.isCurrent ? '0 0 10px rgba(88, 166, 255, 0.3)' : 'none',
    }}>
      <Handle type="target" position={Position.Left} style={{ background: 'var(--accent-color)' }} />
      <div style={{ fontWeight: 'bold', marginBottom: '4px', borderBottom: '1px solid var(--border-color)', paddingBottom: '2px' }}>
        {data?.id as string}
      </div>
      <div style={{ color: 'var(--text-grey)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {data?.title as string}
      </div>
      <div style={{ 
        marginTop: '6px', 
        fontSize: '0.7rem', 
        textTransform: 'uppercase',
        color: data?.status === 'Approved' ? '#3fb950' : data?.status === 'Released' ? '#58a6ff' : '#8b949e'
      }}>
        {data?.status as string}
      </div>
      <Handle type="source" position={Position.Right} style={{ background: 'var(--accent-color)' }} />
    </div>
  );
};

const nodeTypes = {
  requirement: RequirementNode,
};

interface TraceabilityGraphProps {
  currentId: string;
  currentTitle: string;
  currentStatus: string;
  outgoingTraces: { target_id: string; target_title: string }[];
  incomingTraces: { source_id: string; source_title: string }[];
  onNodeClick: (id: string) => void;
}

export default function TraceabilityGraph({ 
  currentId, 
  currentTitle, 
  currentStatus,
  outgoingTraces, 
  incomingTraces, 
  onNodeClick 
}: TraceabilityGraphProps) {
  
  const { nodes, edges } = useMemo(() => {
    const nodes: Node<RequirementNodeData>[] = [];
    const edges: Edge[] = [];

    // Current Node (Center)
    nodes.push({
      id: currentId,
      type: 'requirement',
      data: { id: currentId, title: currentTitle, isCurrent: true, status: currentStatus },
      position: { x: 300, y: 150 },
    });

    // Incoming Nodes (Left)
    incomingTraces.forEach((trace, index) => {
      const id = trace.source_id;
      nodes.push({
        id,
        type: 'requirement',
        data: { id, title: trace.source_title, isCurrent: false, status: 'Linked' }, 
        position: { x: 0, y: (index - (incomingTraces.length - 1) / 2) * 120 + 150 },
      });
      edges.push({
        id: `edge-${id}-${currentId}`,
        source: id,
        target: currentId,
        animated: true,
        style: { stroke: 'var(--accent-color)' },
      });
    });

    // Outgoing Nodes (Right)
    outgoingTraces.forEach((trace, index) => {
      const id = trace.target_id;
      nodes.push({
        id,
        type: 'requirement',
        data: { id, title: trace.target_title, isCurrent: false, status: 'Linked' },
        position: { x: 600, y: (index - (outgoingTraces.length - 1) / 2) * 120 + 150 },
      });
      edges.push({
        id: `edge-${currentId}-${id}`,
        source: currentId,
        target: id,
        animated: true,
        style: { stroke: 'var(--accent-color)' },
      });
    });

    return { nodes, edges };
  }, [currentId, currentTitle, currentStatus, outgoingTraces, incomingTraces]);

  const onInternalNodeClick = useCallback((_: React.MouseEvent | React.TouchEvent, node: Node) => {
    onNodeClick(node.id);
  }, [onNodeClick]);

  return (
    <div style={{ width: '100%', height: '400px', border: '1px solid var(--border-color)', borderRadius: '8px', background: '#0d1117' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodeClick={onInternalNodeClick}
        fitView
      >
        <Background color="#333" gap={16} />
        <Controls />
      </ReactFlow>
    </div>
  );
}
