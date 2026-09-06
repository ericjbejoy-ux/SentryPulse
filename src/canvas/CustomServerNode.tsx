import React from 'react';
import { Handle, Position } from 'reactflow';
import { Server, AlertTriangle } from 'lucide-react';

export const CustomServerNode = ({ data }: { data: any }) => {
  const isCritical = data.status === 'CRITICAL';
  const isWarning = data.status === 'WARNING';
  const isLight = data.isLight;

  return (
    <div className={`w-56 rounded-sm border p-3 font-mono text-[11px] transition-all relative z-10 ${
      isCritical
        ? 'border-[#FF5500] bg-[#FF5500]/10 text-[#FF5500]'
        : isWarning
        ? 'border-[#E6A100] bg-[#E6A100]/10 text-[#D97706]'
        : isLight
        ? 'border-slate-300 bg-white text-slate-800 shadow-sm'
        : 'border-[#282D37] bg-[#14171D] text-slate-300'
    }`}>
      <Handle type="target" position={Position.Top} className="!bg-slate-400 !w-2 !h-2 !rounded-none" />
      
      <div className={`flex items-center justify-between border-b pb-1.5 mb-2 ${isLight ? 'border-slate-200' : 'border-[#282D37]'}`}>
        <div className="flex items-center gap-1.5 truncate">
          <Server className={`w-3.5 h-3.5 shrink-0 ${isLight ? 'text-slate-500' : 'text-slate-400'}`} />
          <span className={`font-bold truncate ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>{data.label}</span>
        </div>
        <span className={`text-[9px] px-1.5 py-0.5 border font-bold shrink-0 uppercase ${
          isCritical ? 'bg-[#FF5500]/20 text-[#FF5500] border-[#FF5500]/40' :
          isWarning ? 'bg-[#E6A100]/20 text-[#E6A100] border-[#E6A100]/40' :
          isLight ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
          'bg-emerald-950/40 text-emerald-400 border-emerald-800/50'
        }`}>
          {data.status}
        </span>
      </div>

      <div className={`grid grid-cols-2 gap-x-2 gap-y-1 text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
        <div>CPU: <span className={isLight ? 'text-slate-900 font-bold' : 'text-slate-100'}>{data.cpu || '24%'}</span></div>
        <div>LAT: <span className={isLight ? 'text-slate-900 font-bold' : 'text-slate-100'}>{data.latency || '12ms'}</span></div>
        <div>LOAD: <span className={isLight ? 'text-slate-900 font-bold' : 'text-slate-100'}>{data.load || '0.42'}</span></div>
        <div>PKT/s: <span className={isLight ? 'text-slate-900 font-bold' : 'text-slate-100'}>{data.packets || '1.2k'}</span></div>
      </div>

      {data.alertMessage && (
        <div className={`mt-2 pt-1.5 border-t flex items-center justify-between text-[10px] ${isLight ? 'border-slate-200' : 'border-[#282D37]'}`}>
          <span className="flex items-center gap-1 text-[#FF5500] font-bold truncate">
            <AlertTriangle className="w-3 h-3 shrink-0" />
            <span className="truncate">{data.alertMessage}</span>
          </span>
        </div>
      )}

      <Handle type="source" position={Position.Bottom} className="!bg-slate-400 !w-2 !h-2 !rounded-none" />
    </div>
  );
};