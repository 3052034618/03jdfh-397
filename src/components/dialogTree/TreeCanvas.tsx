import { useRef, useEffect, useState } from 'react';
import { clsx } from 'clsx';
import { useDialogStore } from '../../store/useDialogStore';
import type { DialogNode, NodeType } from '../../types';

const typeStyle: Record<NodeType, { shape: 'circle' | 'diamond' | 'square' | 'hex'; stroke: string; fill: string; label: string; }> = {
  dialog: {
    shape: 'circle',
    stroke: '#a81212',
    fill: 'rgba(107, 0, 0, 0.55)',
    label: '对白',
  },
  choice: {
    shape: 'diamond',
    stroke: '#c9a227',
    fill: 'rgba(168, 128, 42, 0.45)',
    label: '抉择',
  },
  ending: {
    shape: 'square',
    stroke: '#301854',
    fill: 'rgba(48, 24, 84, 0.7)',
    label: '结局',
  },
  condition: {
    shape: 'hex',
    stroke: '#1a2f1a',
    fill: 'rgba(26, 47, 26, 0.65)',
    label: '条件',
  },
};

function getNodeShape(node: DialogNode, isSelected: boolean, size = 44) {
  const style = typeStyle[node.type];
  const half = size / 2;
  const strokeW = isSelected ? 2.5 : 1.5;
  const commonProps = {
    stroke: isSelected ? '#c41e1e' : style.stroke,
    strokeWidth: strokeW,
    fill: style.fill,
    className: clsx('transition-all duration-200', isSelected && 'animate-breath'),
  };
  switch (style.shape) {
    case 'diamond':
      return (
        <polygon
          points={`${half},0 ${size},${half} ${half},${size} 0,${half}`}
          {...commonProps}
        />
      );
    case 'square':
      return <rect x={0} y={0} width={size} height={size} rx={3} {...commonProps} />;
    case 'hex':
      return (
        <polygon
          points={`${size * 0.25},0 ${size * 0.75},0 ${size},${half} ${size * 0.75},${size} ${size * 0.25},${size} 0,${half}`}
          {...commonProps}
        />
      );
    default:
      return <circle cx={half} cy={half} r={half - 1} {...commonProps} />;
  }
}

export function TreeCanvas() {
  const {
    currentChapterId,
    selectedNodeId,
    nodes,
    viewport,
    setViewport,
    selectNode,
    getChapterNodes,
  } = useDialogStore();

  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const chapterNodes = currentChapterId ? getChapterNodes(currentChapterId) : [];
  const nodeMap = Object.fromEntries(chapterNodes.map((n) => [n.id, n]));

  const edges: Array<{ from: DialogNode; to: DialogNode; label?: string; key: string }> = [];
  chapterNodes.forEach((node) => {
    if (node.nextNodeId && nodeMap[node.nextNodeId]) {
      edges.push({ from: node, to: nodeMap[node.nextNodeId], key: `${node.id}-${node.nextNodeId}` });
    }
    node.choices?.forEach((c) => {
      if (nodeMap[c.nextNodeId]) {
        edges.push({
          from: node,
          to: nodeMap[c.nextNodeId],
          label: c.label.slice(0, 10),
          key: `${node.id}-${c.id}`,
        });
      }
    });
  });

  useEffect(() => {
    if (!containerRef.current) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.92 : 1.08;
      const newZoom = Math.max(0.3, Math.min(2, viewport.zoom * delta));
      setViewport({ ...viewport, zoom: newZoom });
    };
    const el = containerRef.current;
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [viewport, setViewport]);

  const onMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[data-node]')) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - viewport.x, y: e.clientY - viewport.y });
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setViewport({ ...viewport, x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };
  const onMouseUp = () => setIsDragging(false);

  return (
    <div
      ref={containerRef}
      className="flex-1 h-full relative overflow-hidden bg-abyss-950/60 select-none cursor-move"
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
    >
      <div className="absolute inset-0 bg-noise pointer-events-none opacity-60" />
      <div
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle at center, rgba(139,0,0,0.08) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          transform: `translate(${viewport.x * 0.1}px, ${viewport.y * 0.1}px)`,
        }}
      />

      <svg
        ref={svgRef}
        className="absolute inset-0 w-full h-full"
        style={{
          transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
          transformOrigin: '0 0',
        }}
      >
        <defs>
          <marker
            id="arrow"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#8b0000" opacity="0.7" />
          </marker>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {edges.map(({ from, to, label, key }) => {
          const size = 44;
          const sx = from.position.x + size / 2;
          const sy = from.position.y + size / 2;
          const tx = to.position.x + size / 2;
          const ty = to.position.y;
          const cy = (sy + ty) / 2;
          const isHighlighted =
            selectedNodeId === from.id || selectedNodeId === to.id;
          return (
            <g key={key}>
              <path
                d={`M ${sx} ${sy} C ${sx} ${cy}, ${tx} ${cy}, ${tx} ${ty}`}
                fill="none"
                stroke={isHighlighted ? '#c41e1e' : 'rgba(139, 0, 0, 0.35)'}
                strokeWidth={isHighlighted ? 2 : 1.2}
                strokeDasharray={to.type === 'ending' ? '4 4' : undefined}
                markerEnd="url(#arrow)"
                filter={isHighlighted ? 'url(#glow)' : undefined}
                className="transition-all duration-300"
              />
              {label && (
                <g transform={`translate(${(sx + tx) / 2 - 50}, ${cy - 8})`}>
                  <rect
                    x={0}
                    y={0}
                    width={100}
                    height={16}
                    rx={2}
                    fill="rgba(10, 10, 15, 0.85)"
                    stroke="rgba(168, 128, 42, 0.4)"
                    strokeWidth={0.5}
                  />
                  <text
                    x={50}
                    y={11}
                    textAnchor="middle"
                    fontSize={9}
                    fill="#c9a227"
                    className="font-sans"
                  >
                    {label.length >= 10 ? label + '…' : label}
                  </text>
                </g>
              )}
            </g>
          );
        })}

        {chapterNodes.map((node) => {
          const isSelected = selectedNodeId === node.id;
          const size = 44;
          const highControversy = (node.controversy ?? 0) >= 75;
          return (
            <g
              key={node.id}
              data-node
              transform={`translate(${node.position.x}, ${node.position.y})`}
              onClick={(e) => {
                e.stopPropagation();
                selectNode(node.id);
              }}
              className="cursor-pointer"
              style={{ filter: isSelected ? 'url(#glow)' : undefined }}
            >
              {highControversy && (
                <circle
                  cx={size / 2}
                  cy={size / 2}
                  r={size / 2 + 6}
                  fill="none"
                  stroke="#c41e1e"
                  strokeWidth={1}
                  strokeDasharray="2 3"
                  opacity={0.7}
                  className="animate-pulse-slow"
                />
              )}
              {getNodeShape(node, isSelected, size)}
              <text
                x={size / 2}
                y={size / 2 + 3}
                textAnchor="middle"
                fontSize={10}
                fill="#e8e6e3"
                className="font-serif font-medium pointer-events-none"
              >
                {typeStyle[node.type].label}
              </text>
              <g transform={`translate(0, ${size + 6})`}>
                <rect
                  x={-10}
                  y={0}
                  width={size + 20}
                  height={30}
                  rx={2}
                  fill="rgba(10, 10, 15, 0.75)"
                  stroke={isSelected ? 'rgba(196, 30, 30, 0.5)' : 'rgba(37, 37, 58, 0.5)'}
                />
                <text
                  x={size / 2}
                  y={13}
                  textAnchor="middle"
                  fontSize={10}
                  fill={isSelected ? '#f0eeea' : '#b5b1ab'}
                  className="font-sans font-medium pointer-events-none"
                >
                  {node.speaker}
                </text>
                <text
                  x={size / 2}
                  y={25}
                  textAnchor="middle"
                  fontSize={8.5}
                  fill="#8a8780"
                  className="font-sans pointer-events-none"
                >
                  {node.text.length > 14 ? node.text.slice(0, 14) + '…' : node.text}
                </text>
              </g>
            </g>
          );
        })}
      </svg>

      <div className="absolute top-4 right-4 flex flex-col gap-2 items-end z-10">
        <div className="gothic-card px-3 py-2 flex items-center gap-2 text-[10px] text-ghost-700 font-mono">
          缩放 <span className="text-blood-400 font-semibold">{(viewport.zoom * 100).toFixed(0)}%</span>
        </div>
        <div className="gothic-card flex flex-col overflow-hidden">
          <button
            className="px-3 py-1.5 text-xs text-ghost-500 hover:bg-blood-800/30 hover:text-ghost-300 transition-colors border-b border-abyss-600/50"
            onClick={() => setViewport({ ...viewport, zoom: Math.min(2, viewport.zoom * 1.2) })}
          >＋</button>
          <button
            className="px-3 py-1.5 text-xs text-ghost-500 hover:bg-blood-800/30 hover:text-ghost-300 transition-colors border-b border-abyss-600/50"
            onClick={() => setViewport({ ...viewport, zoom: Math.max(0.3, viewport.zoom / 1.2) })}
          >－</button>
          <button
            className="px-3 py-1.5 text-xs text-ghost-500 hover:bg-blood-800/30 hover:text-ghost-300 transition-colors"
            onClick={() => setViewport({ x: 0, y: 0, zoom: 0.85 })}
          >⟳</button>
        </div>
      </div>

      <div className="absolute bottom-4 left-4 gothic-card p-3 flex gap-4 text-[10px] z-10">
        {(Object.keys(typeStyle) as NodeType[]).map((t) => (
          <div key={t} className="flex items-center gap-1.5">
            <svg width={12} height={12} viewBox="0 0 44 44">
              {(() => {
                const n = { type: t } as DialogNode;
                return getNodeShape(n, false, 44);
              })()}
            </svg>
            <span className="text-ghost-700">{typeStyle[t].label}</span>
          </div>
        ))}
        <div className="w-px bg-abyss-600/60 mx-1" />
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full border border-dashed border-blood-500 animate-pulse-slow" />
          <span className="text-ghost-700">高争议</span>
        </div>
      </div>

      {!currentChapterId && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-5xl mb-4 opacity-20 animate-float">🦇</div>
            <p className="text-ghost-900 font-serif tracking-wider">
              请先选择一个章节，开始编辑你的黑暗故事…
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
