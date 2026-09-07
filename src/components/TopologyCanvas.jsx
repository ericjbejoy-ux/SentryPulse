import React, { useState, useRef, useEffect } from 'react';
import {
  Network, ZoomIn, ZoomOut, RotateCcw, Move,
  AlertTriangle, Wrench, X
} from 'lucide-react';

export default function TopologyCanvas({
  nodes, setNodes,
  selectedNode, onSelectNode,
  simState, isDarkMode
}) {
  // Canvas zoom & pan state
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0 });

  const canvasRef = useRef(null);
  const [draggingNodeId, setDraggingNodeId] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Touch tracking refs
  const touchStartDistRef = useRef(null);
  const touchStartZoomRef = useRef(1);

  const isAttacked = simState === 'ATTACKED';
  const isHealing = simState === 'HEALING';

  // Native wheel listener with { passive:false } so preventDefault works for Ctrl+scroll zoom
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const onWheel = (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        setZoomLevel(prev => Math.max(0.6, Math.min(1.8, prev + (e.deltaY < 0 ? 0.08 : -0.08))));
      }
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  const getNodePos = (id) => {
    const n = nodes.find(item => item.id === id);
    return n ? { x: n.x + 125, y: n.y + 55 } : { x: 0, y: 0 };
  };

  const handleMouseDownNode = (e, node) => {
    e.stopPropagation();
    const rect = canvasRef.current.getBoundingClientRect();
    setDraggingNodeId(node.id);
    setDragOffset({
      x: ((e.clientX - rect.left) / zoomLevel) - node.x,
      y: ((e.clientY - rect.top) / zoomLevel) - node.y
    });
    onSelectNode(node);
  };

  const handleMouseDownCanvas = (e) => {
    if (e.target === canvasRef.current || e.target.tagName === 'svg' || (e.target.tagName === 'DIV' && e.target.dataset.panningArea)) {
      onSelectNode(null);
      setIsPanning(true);
      panStartRef.current = { x: e.clientX - panOffset.x, y: e.clientY - panOffset.y };
    }
  };

  const handleMouseMoveCanvas = (e) => {
    if (draggingNodeId && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const newX = Math.max(10, Math.min(rect.width / zoomLevel - 260, ((e.clientX - rect.left) / zoomLevel) - dragOffset.x));
      const newY = Math.max(10, Math.min(rect.height / zoomLevel - 120, ((e.clientY - rect.top) / zoomLevel) - dragOffset.y));
      setNodes(prev => prev.map(n => n.id === draggingNodeId ? { ...n, x: newX, y: newY } : n));
    } else if (isPanning) {
      setPanOffset({
        x: e.clientX - panStartRef.current.x,
        y: e.clientY - panStartRef.current.y
      });
    }
  };

  const handleMouseUpCanvas = () => {
    setDraggingNodeId(null);
    setIsPanning(false);
  };

  const handleTouchStartCanvas = (e) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchStartDistRef.current = dist;
      touchStartZoomRef.current = zoomLevel;
    } else if (e.touches.length === 1 && (e.target === canvasRef.current || e.target.tagName === 'svg' || e.target.dataset?.panningArea)) {
      onSelectNode(null);
      setIsPanning(true);
      panStartRef.current = { x: e.touches[0].clientX - panOffset.x, y: e.touches[0].clientY - panOffset.y };
    }
  };

  const handleTouchMoveCanvas = (e) => {
    if (e.touches.length === 2 && touchStartDistRef.current) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const factor = dist / touchStartDistRef.current;
      const newZoom = Math.max(0.6, Math.min(1.8, touchStartZoomRef.current * factor));
      setZoomLevel(newZoom);
    } else if (e.touches.length === 1 && isPanning) {
      setPanOffset({
        x: e.touches[0].clientX - panStartRef.current.x,
        y: e.touches[0].clientY - panStartRef.current.y
      });
    }
  };

  const handleTouchEndCanvas = () => {
    touchStartDistRef.current = null;
    setIsPanning(false);
  };

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.15, 1.8));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.15, 0.6));
  const handleResetZoom = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  const p1 = getNodePos('1');
  const p2 = getNodePos('2');
  const p3 = getNodePos('3');
  const p4 = getNodePos('4');
  const p5 = getNodePos('5');
  const p6 = getNodePos('6');
  const p7 = getNodePos('7');
  const p8 = getNodePos('8');

  return (
    <div className={`border rounded-lg p-5 relative overflow-hidden shadow-sm transition-colors duration-200 ${
      isDarkMode ? 'bg-[#0a0f1f] border-[#1f2c4d]' : 'bg-white border-slate-300'
    }`}>
      <div className={`flex justify-between items-center mb-4 pb-3.5 border-b ${isDarkMode ? 'border-[#1f2c4d]' : 'border-slate-300'}`}>
        <div>
          <h2 className={`text-sm font-extrabold uppercase tracking-wider flex items-center gap-2.5 ${isDarkMode ? 'text-grad' : 'text-slate-900'}`}>
            <Network className={`w-5 h-5 ${isDarkMode ? 'text-emerald-400 drop-emerald' : 'text-emerald-400'}`} /> NetworkX Topology Digital Twin
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Ctrl+Scroll or pinch to zoom. Drag nodes to rearrange. Shortcuts:
            <kbd className={`px-1 rounded border ml-1 ${isDarkMode ? 'border-[#2a3a5c] bg-[#0a0f1f] text-cyan-300' : 'border-slate-300 bg-slate-100'}`}>S</kbd> simulate ·
            <kbd className={`px-1 rounded border ${isDarkMode ? 'border-[#2a3a5c] bg-[#0a0f1f] text-cyan-300' : 'border-slate-300 bg-slate-100'}`}>R</kbd> reset ·
            <kbd className={`px-1 rounded border ${isDarkMode ? 'border-[#2a3a5c] bg-[#0a0f1f] text-cyan-300' : 'border-slate-300 bg-slate-100'}`}>T</kbd> theme
          </p>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-2">
          <span className={`text-xs px-3 py-1.5 rounded-md font-mono font-bold ${isDarkMode ? 'bg-[#0a0f1f] text-cyan-300 border border-[#2a3a5c]' : 'bg-slate-200 text-slate-800 border border-slate-300'}`}>
            {Math.round(zoomLevel * 100)}%
          </span>
          <button onClick={handleZoomIn} title="Zoom In" className={`p-2.5 rounded-md border transition-all cursor-pointer ${isDarkMode ? 'bg-[#0a0f1f] border-[#2a3a5c] text-slate-200 hover:border-cyan-400/50 hover:shadow-[0_0_12px_-4px_rgba(34,211,238,0.6)]' : 'bg-white border-slate-300 text-slate-900 hover:bg-slate-100'}`}>
            <ZoomIn className="w-4 h-4" />
          </button>
          <button onClick={handleZoomOut} title="Zoom Out" className={`p-2.5 rounded-md border transition-all cursor-pointer ${isDarkMode ? 'bg-[#0a0f1f] border-[#2a3a5c] text-slate-200 hover:border-cyan-400/50 hover:shadow-[0_0_12px_-4px_rgba(34,211,238,0.6)]' : 'bg-white border-slate-300 text-slate-900 hover:bg-slate-100'}`}>
            <ZoomOut className="w-4 h-4" />
          </button>
          <button onClick={handleResetZoom} title="Reset View" className={`p-2.5 rounded-md border transition-all cursor-pointer ${isDarkMode ? 'bg-[#0a0f1f] border-[#2a3a5c] text-slate-200 hover:border-cyan-400/50 hover:shadow-[0_0_12px_-4px_rgba(34,211,238,0.6)]' : 'bg-white border-slate-300 text-slate-900 hover:bg-slate-100'}`}>
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* SVG Canvas Area */}
      <div
        ref={canvasRef}
        data-panning-area="true"
        onMouseDown={handleMouseDownCanvas}
        onMouseMove={handleMouseMoveCanvas}
        onMouseUp={handleMouseUpCanvas}
        onMouseLeave={handleMouseUpCanvas}
        onTouchStart={handleTouchStartCanvas}
        onTouchMove={handleTouchMoveCanvas}
        onTouchEnd={handleTouchEndCanvas}
        style={{ touchAction: 'none' }}
        className={`w-full h-[520px] rounded-md border relative overflow-hidden select-none cursor-grab active:cursor-grabbing ${
          isDarkMode ? 'bg-[#040714] border-[#1f2c4d] shadow-[inset_0_0_60px_rgba(34,211,238,0.045)]' : 'bg-[#fafbfc] border-slate-300'
        }`}
      >
        <div
          className={`absolute inset-0 pointer-events-none ${isDarkMode ? 'opacity-60' : 'opacity-40'}`}
          style={{
            backgroundImage: `radial-gradient(${isDarkMode ? 'rgba(34,211,238,0.28)' : 'rgba(100,116,139,0.4)'} 1.1px, transparent 1.1px)`,
            backgroundSize: '24px 24px'
          }}
        ></div>

        {/* Status Legend Overlay */}
        <div className="absolute top-3 left-3 z-20 flex flex-wrap items-center gap-1.5 pointer-events-none">
          {[
            ['NOMINAL', 'bg-emerald-400'],
            ['WARNING', 'bg-amber-400'],
            ['CRITICAL', 'bg-rose-500'],
            ['PATCHING', 'bg-cyan-400']
          ].map(([label, dot]) => (
            <span key={label} className={`flex items-center gap-1.5 text-[10px] font-bold tracking-wider uppercase px-2 py-1 rounded border backdrop-blur-sm ${isDarkMode ? 'bg-[#0a0f1f]/80 border-[#2a3a5c] text-slate-300' : 'bg-white/80 border-slate-300 text-slate-600'}`}>
              <span className={`w-2 h-2 rounded-full ${dot} ${label === 'PATCHING' ? 'animate-pulse' : ''}`}></span>
              {label}
            </span>
          ))}
        </div>

        {/* Transform Container */}
        <div
          className="absolute inset-0 w-full h-full transition-transform duration-75 origin-top-left pointer-events-none"
          style={{
            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`
          }}
        >
          <svg className="absolute inset-0 w-[2000px] h-[2000px] pointer-events-none" style={{ zIndex: 0 }}>
            <defs>
              <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill={isHealing ? "#fbbf24" : isAttacked ? "#fb7185" : isDarkMode ? "#38518a" : "#94a3b8"} />
              </marker>
            </defs>

            <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke={isAttacked ? "#fb7185" : isDarkMode ? "#2a3a5c" : "#cbd5e1"} strokeWidth="2" markerEnd="url(#arrow)" style={{ filter: isAttacked ? 'drop-shadow(0 0 6px rgba(251,113,133,0.9))' : undefined }} />
            <line x1={p2.x} y1={p2.y} x2={p4.x} y2={p4.y} stroke={isAttacked ? "#fb7185" : isDarkMode ? "#2a3a5c" : "#cbd5e1"} strokeWidth="2" strokeDasharray={isAttacked ? "4 4" : "none"} markerEnd="url(#arrow)" style={{ filter: isAttacked ? 'drop-shadow(0 0 6px rgba(251,113,133,0.9))' : undefined }} />
            <line x1={p4.x} y1={p4.y} x2={p6.x} y2={p6.y} stroke={isAttacked ? "#fb7185" : isDarkMode ? "#2a3a5c" : "#cbd5e1"} strokeWidth="2" markerEnd="url(#arrow)" style={{ filter: isAttacked ? 'drop-shadow(0 0 6px rgba(251,113,133,0.9))' : undefined }} />
            <line x1={p2.x} y1={p2.y} x2={p3.x} y2={p3.y} stroke={isDarkMode ? "#2a3a5c" : "#cbd5e1"} strokeWidth="1.5" strokeDasharray="3 3" markerEnd="url(#arrow)" />
            <line x1={p4.x} y1={p4.y} x2={p5.x} y2={p5.y} stroke={isDarkMode ? "#2a3a5c" : "#cbd5e1"} strokeWidth="1.5" markerEnd="url(#arrow)" />
            <line x1={p2.x} y1={p2.y} x2={p7.x} y2={p7.y} stroke={isDarkMode ? "#2a3a5c" : "#cbd5e1"} strokeWidth="1.5" markerEnd="url(#arrow)" />
            <line x1={p7.x} y1={p7.y} x2={p8.x} y2={p8.y} stroke={isDarkMode ? "#2a3a5c" : "#cbd5e1"} strokeWidth="1.5" strokeDasharray="3 3" markerEnd="url(#arrow)" />

            {!isAttacked && !isHealing && (
              <circle r="4.5" fill="#10b981">
                <animateMotion path={`M ${p2.x} ${p2.y} L ${p4.x} ${p4.y}`} dur="3s" repeatCount="indefinite" />
              </circle>
            )}
          </svg>

          {/* Nodes */}
          {nodes.map((node) => {
            const isCritical = node.status === 'CRITICAL' || node.status === 'WARNING';
            const isPatching = node.status === 'PATCHING';
            const isSelected = selectedNode?.id === node.id;
            return (
              <div
                key={node.id}
                onMouseDown={(e) => handleMouseDownNode(e, node)}
                style={{ left: `${node.x}px`, top: `${node.y}px` }}
                className={`absolute w-68 p-4 rounded-lg border transition-shadow cursor-grab active:cursor-grabbing pointer-events-auto z-10 ${
                  isPatching
                    ? 'border-amber-500 bg-amber-950/30 shadow-[0_0_18px_-4px_rgba(251,191,36,0.6)]'
                    : isCritical
                      ? 'border-rose-500 bg-rose-950/30 shadow-[0_0_18px_-4px_rgba(251,113,133,0.65)]'
                      : isSelected
                        ? 'border-emerald-500 bg-emerald-950/25 shadow-[0_0_18px_-4px_rgba(52,211,153,0.8)]'
                        : isDarkMode
                          ? 'bg-[#0c1322] border-[#2a3a5c] hover:border-cyan-400/60 text-slate-100 hover:shadow-[0_0_14px_-4px_rgba(34,211,238,0.45)]'
                          : 'bg-white border-slate-300 hover:border-slate-500 text-slate-900'
                }`}
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-slate-400 font-mono flex items-center gap-1.5 font-bold">
                    <Move className="w-3.5 h-3.5 text-slate-400" /> {node.tier}
                  </span>
                  <span className={`text-xs font-extrabold px-2.5 py-0.5 rounded font-mono ${
                    isPatching ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                    isCritical ? `bg-rose-500/20 text-rose-300 border border-rose-500/40 ${node.status === 'CRITICAL' ? 'animate-pulse' : ''}` :
                    isDarkMode ? 'bg-slate-800 text-slate-200 border border-slate-700' : 'bg-slate-100 text-slate-800 border border-slate-300'
                  }`}>
                    {node.status}
                  </span>
                </div>

                <h3 className={`text-sm font-extrabold mb-2.5 truncate ${isDarkMode ? 'text-slate-100' : 'text-slate-950'}`}>
                  {node.label}
                </h3>

                <div className={`space-y-1.5 text-xs border-t pt-2 font-mono ${isDarkMode ? 'border-[#1f2c4d] text-slate-300' : 'border-slate-200 text-slate-700'}`}>
                  <div className="flex justify-between font-semibold"><span>CPU:</span> <span className={isDarkMode ? 'text-white font-extrabold' : 'text-slate-950 font-extrabold'}>{node.cpu}</span></div>
                  <div className="flex justify-between font-semibold"><span>Latency:</span> <span className={isCritical ? 'text-rose-400 font-extrabold' : isDarkMode ? 'text-white font-extrabold' : 'text-slate-950 font-extrabold'}>{node.latency}</span></div>
                </div>

                {node.alert && (
                  <div className={`mt-2.5 pt-2 border-t text-xs font-bold flex items-center gap-2 font-mono ${isPatching ? 'border-amber-500/40 text-amber-300' : 'border-rose-500/40 text-rose-300'}`}>
                    {isPatching ? <Wrench className="w-4 h-4 shrink-0 animate-spin" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
                    <span className="truncate">{node.alert}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className={`mt-4 pt-3 border-t flex justify-between items-center text-xs md:text-sm font-mono font-semibold ${isDarkMode ? 'border-[#1f2c4d] text-slate-300' : 'border-slate-300 text-slate-700'}`}>
        <span>
          Selected Node: <strong className={isDarkMode ? 'text-white font-bold' : 'text-slate-950 font-bold'}>
            {selectedNode ? `${selectedNode.label} (${selectedNode.ip})` : 'None'}
          </strong>
        </span>
        {selectedNode && (
          <button
            onClick={() => onSelectNode(null)}
            className={`px-3 py-1.5 rounded border flex items-center gap-2 cursor-pointer text-xs font-bold ${
              isDarkMode ? 'bg-[#0c1322] text-slate-200 hover:text-white border-[#2a3a5c] hover:border-rose-400/50' : 'bg-slate-100 text-slate-700 hover:text-slate-950 border-slate-300'
            }`}
          >
            <X className="w-4 h-4" /> Clear Selection
          </button>
        )}
      </div>
    </div>
  );
}