import React, { useState, useRef } from 'react';
import {
  AlertTriangle, Move, Network, Server, Wrench, X,
  ZoomIn, ZoomOut, RotateCcw,
} from 'lucide-react';

/**
 * Interactive SVG topology canvas (FR-2.1). Owns view state (zoom / pan /
 * drag); node data + simulation status flow in from App via props.
 */
export default function TopologyCanvas({
  nodes, onMoveNode, selectedNode, onSelectNode,
  simState, isDarkMode, simulationCount, totalAnomaliesDetected,
}) {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [draggingNodeId, setDraggingNodeId] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const panStartRef = useRef({ x: 0, y: 0 });
  const touchStartDistRef = useRef(null);
  const touchStartZoomRef = useRef(1);
  const canvasRef = useRef(null);

  const isAttacked = simState === 'ATTACKED';
  const isHealing = simState === 'HEALING';

  const getNodePos = (id) => {
    const n = nodes.find((item) => item.id === id);
    return n ? { x: n.x + 110, y: n.y + 45 } : { x: 0, y: 0 };
  };
  const p1 = getNodePos('1');
  const p2 = getNodePos('2');
  const p3 = getNodePos('3');
  const p4 = getNodePos('4');
  const p5 = getNodePos('5');
  const p6 = getNodePos('6');
  const p7 = getNodePos('7');
  const p8 = getNodePos('8');

  const handleMouseDownNode = (e, node) => {
    e.stopPropagation();
    const rect = canvasRef.current.getBoundingClientRect();
    setDraggingNodeId(node.id);
    setDragOffset({
      x: ((e.clientX - rect.left) / zoomLevel) - node.x,
      y: ((e.clientY - rect.top) / zoomLevel) - node.y,
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
      const newX = Math.max(10, Math.min(rect.width / zoomLevel - 240, ((e.clientX - rect.left) / zoomLevel) - dragOffset.x));
      const newY = Math.max(10, Math.min(rect.height / zoomLevel - 100, ((e.clientY - rect.top) / zoomLevel) - dragOffset.y));
      onMoveNode(draggingNodeId, newX, newY);
    } else if (isPanning) {
      setPanOffset({ x: e.clientX - panStartRef.current.x, y: e.clientY - panStartRef.current.y });
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
      setZoomLevel(Math.max(0.6, Math.min(1.8, touchStartZoomRef.current * factor)));
    } else if (e.touches.length === 1 && isPanning) {
      setPanOffset({ x: e.touches[0].clientX - panStartRef.current.x, y: e.touches[0].clientY - panStartRef.current.y });
    }
  };

  const handleTouchEndCanvas = () => {
    touchStartDistRef.current = null;
    setIsPanning(false);
  };

  const handleWheelCanvas = (e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 0.08 : -0.08;
      setZoomLevel((prev) => Math.max(0.6, Math.min(1.8, prev + zoomFactor)));
    }
  };

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.15, 1.8));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.15, 0.6));
  const handleResetZoom = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  return (
    <div className={`border rounded-xl p-6 shadow-2xl relative overflow-hidden transition-colors duration-300 ${
      isDarkMode ? 'bg-[#090d14] border-slate-800' : 'bg-white border-slate-200'
    }`}>
      <div className={`flex justify-between items-center mb-4 pb-3 border-b ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
        <div>
          <h2 className={`text-xs font-bold uppercase tracking-widest flex items-center gap-2 ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
            <Network className="w-4 h-4 text-emerald-500" /> Stochastic NetworkX Digital Twin (Hold Ctrl + Scroll to Zoom)
          </h2>
          <p className={`text-[11px] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Click any node to inspect telemetry. Click canvas background to deselect.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-[10px] px-2 py-1 rounded font-mono ${isDarkMode ? 'bg-slate-900 text-slate-300 border border-slate-800' : 'bg-slate-100 text-slate-700 border border-slate-200'}`}>
            Zoom: {Math.round(zoomLevel * 100)}%
          </span>
          <button onClick={handleZoomIn} title="Zoom In" className={`p-1.5 rounded border transition-all cursor-pointer ${isDarkMode ? 'bg-slate-900 border-slate-800 text-emerald-400 hover:bg-slate-800' : 'bg-white border-slate-200 text-emerald-600 hover:bg-slate-100'}`}>
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button onClick={handleZoomOut} title="Zoom Out" className={`p-1.5 rounded border transition-all cursor-pointer ${isDarkMode ? 'bg-slate-900 border-slate-800 text-emerald-400 hover:bg-slate-800' : 'bg-white border-slate-200 text-emerald-600 hover:bg-slate-100'}`}>
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button onClick={handleResetZoom} title="Reset View" className={`p-1.5 rounded border transition-all cursor-pointer ${isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'}`}>
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

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
        onWheel={handleWheelCanvas}
        className={`w-full h-[540px] rounded-xl border relative overflow-hidden select-none cursor-grab active:cursor-grabbing ${
          isDarkMode ? 'bg-[#030508] border-slate-800/80' : 'bg-slate-100 border-slate-200'
        }`}
      >
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none"></div>

        <div
          className="absolute inset-0 w-full h-full transition-transform duration-75 origin-top-left pointer-events-none"
          style={{ transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})` }}
        >
          <svg className="absolute inset-0 w-[2000px] h-[2000px] pointer-events-none" style={{ zIndex: 0 }}>
            <defs>
              <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill={isHealing ? '#f59e0b' : isAttacked ? '#f43f5e' : '#10b981'} />
              </marker>
            </defs>
            <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke={isAttacked ? '#f43f5e' : '#10b981'} strokeWidth="2" markerEnd="url(#arrow)" />
            <line x1={p2.x} y1={p2.y} x2={p4.x} y2={p4.y} stroke={isAttacked ? '#f43f5e' : '#10b981'} strokeWidth="2.5" strokeDasharray={isAttacked ? '4 4' : 'none'} markerEnd="url(#arrow)" />
            <line x1={p4.x} y1={p4.y} x2={p6.x} y2={p6.y} stroke={isAttacked ? '#f43f5e' : '#10b981'} strokeWidth="3" markerEnd="url(#arrow)" />
            <line x1={p2.x} y1={p2.y} x2={p3.x} y2={p3.y} stroke="#06b6d4" strokeWidth="1.5" strokeDasharray="3 3" markerEnd="url(#arrow)" />
            <line x1={p4.x} y1={p4.y} x2={p5.x} y2={p5.y} stroke="#10b981" strokeWidth="1.5" markerEnd="url(#arrow)" />
            <line x1={p2.x} y1={p2.y} x2={p7.x} y2={p7.y} stroke="#a855f7" strokeWidth="1.5" markerEnd="url(#arrow)" />
            <line x1={p7.x} y1={p7.y} x2={p8.x} y2={p8.y} stroke="#a855f7" strokeWidth="1.5" strokeDasharray="4 4" markerEnd="url(#arrow)" />
            {!isAttacked && !isHealing && (
              <circle r="4" fill="#38bdf8">
                <animateMotion path={`M ${p2.x} ${p2.y} L ${p4.x} ${p4.y}`} dur="2s" repeatCount="indefinite" />
              </circle>
            )}
          </svg>

          {nodes.map((node) => {
            const isCritical = node.status === 'CRITICAL' || node.status === 'WARNING';
            const isPatching = node.status === 'PATCHING';
            const isSelected = selectedNode?.id === node.id;
            return (
              <div
                key={node.id}
                onMouseDown={(e) => handleMouseDownNode(e, node)}
                style={{ left: `${node.x}px`, top: `${node.y}px` }}
                className={`absolute w-56 p-3 rounded-lg border transition-shadow cursor-grab active:cursor-grabbing pointer-events-auto z-10 backdrop-blur-md shadow-xl ${
                  isPatching
                    ? 'border-amber-400 bg-amber-950/90 shadow-[0_0_25px_rgba(245,158,11,0.5)] animate-pulse'
                    : isCritical
                    ? 'border-rose-500 bg-rose-950/90 shadow-[0_0_30px_rgba(244,63,94,0.5)] animate-bounce'
                    : isSelected
                    ? 'border-cyan-400 bg-cyan-950/90 shadow-[0_0_20px_rgba(6,182,212,0.4)]'
                    : isDarkMode
                    ? 'bg-[#080c14]/95 border-slate-700/80 hover:border-emerald-500 text-slate-200'
                    : 'bg-white/95 border-slate-300 hover:border-emerald-500 text-slate-800'
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[9px] text-slate-400 font-mono flex items-center gap-1">
                    <Move className="w-2.5 h-2.5 text-emerald-500" /> {node.tier}
                  </span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                    isPatching ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                    isCritical ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  }`}>
                    {node.status}
                  </span>
                </div>
                <h3 className={`text-xs font-bold mb-1 flex items-center gap-1.5 truncate ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  <Server className={`w-3.5 h-3.5 shrink-0 ${isPatching ? 'text-amber-400' : isCritical ? 'text-rose-400' : 'text-emerald-500'}`} />
                  <span className="truncate">{node.label}</span>
                </h3>
                <div className={`space-y-0.5 text-[10px] border-t pt-1 ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
                  <div className="flex justify-between text-slate-400"><span>CPU:</span> <span className="font-bold text-slate-200">{node.cpu}</span></div>
                  <div className="flex justify-between text-slate-400"><span>Latency:</span> <span className={isCritical ? 'text-rose-400 font-bold' : 'text-slate-200'}>{node.latency}</span></div>
                </div>
                {node.alert && (
                  <div className={`mt-1 pt-1 border-t text-[9px] font-bold flex items-center gap-1 ${isPatching ? 'border-amber-500/30 text-amber-300' : 'border-rose-500/30 text-rose-400'}`}>
                    {isPatching ? <Wrench className="w-3 h-3 shrink-0 animate-spin" /> : <AlertTriangle className="w-3 h-3 shrink-0" />}
                    <span>{node.alert}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className={`mt-4 pt-3 border-t flex justify-between items-center text-[11px] ${isDarkMode ? 'border-slate-800/80 text-slate-400' : 'border-slate-200 text-slate-600'}`}>
        <span>Total Simulation Runs: <strong className="text-emerald-500">{simulationCount}</strong> | Cumulative Anomalies: <strong className="text-rose-400">{totalAnomaliesDetected}</strong></span>
        <div className="flex items-center gap-2">
          <span>Selected Node: <strong className="text-cyan-400">{selectedNode ? `${selectedNode.label} (${selectedNode.ip})` : 'None'}</strong></span>
          {selectedNode && (
            <button
              onClick={() => onSelectNode(null)}
              className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 hover:text-white border border-slate-700 flex items-center gap-1 cursor-pointer text-[10px]"
              title="Clear Selection"
            >
              <X className="w-3 h-3" /> Clear
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
