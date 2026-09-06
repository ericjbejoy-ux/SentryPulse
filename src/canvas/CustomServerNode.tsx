import React from 'react';
import { Handle, Position } from 'reactflow';
import { Server, AlertTriangle } from 'lucide-react';

export const CustomServerNode = ({ data }: { data: any }) => {
  const isCritical = data.status === 'CRITICAL';
  const isWarning = data.status === 'WARNING';

  return (
    <div className={`w-56 rounded-sm border p-3 font-mono text-[11px] transition-all ${
      isCritical ? 'border-[#FF5500] bg-[#1A0E08] text-[#FF884D]' :
      isWarning ? 'border-[#E6A100] bg-[#1A1608] text-[#FFD680]' :
      'border-[#282D37] bg-[#14171D] text-slate-300'
    }`}>
      <Handle type="target" position={Position.Top} className="!bg-[#282D37] !w-2 !h-2 !rounded-none" />
      
      <div className="flex items-center justify-between border-b border-[#282D37] pb-1.5 mb-2">
        <div className="flex items-center gap-1.5 truncate">
          <Server className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="font-bold text-slate-100 truncate">{data.label}</span>
        </div>
        <span className={`text-[9px] px-1.5 py-0.5 border font-bold shrink-0 uppercase ${
          isCritical ? 'bg-[#FF5500]/20 text-[#FF5500] border-[#FF5500]/40' :
          isWarning ? 'bg-[#E6A100]/20 text-[#E6A100] border-[#E6A100]/40' :
          'bg-[#00B36B]/20 text-[#00B36B] border-[#00B36B]/40'
        }`}>
          {data.status}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-slate-400 text-[10px]">
        <div>CPU: <span className="text-slate-100">{data.cpu || '24%'}</span></div>
        <div>LAT: <span className="text-slate-100">{data.latency || '12ms'}</span></div>
        <div>LOAD: <span className="text-slate-100">{data.load || '0.42'}</span></div>
        <div>PKT/s: <span className="text-slate-100">{data.packets || '1.2k'}</span></div>
      </div>

      {data.alertMessage && (
        <div className="mt-2 pt-1.5 border-t border-[#282D37] flex items-center justify-between text-[10px]">
          <span className="flex items-center gap-1 text-[#FF5500] font-bold truncate">
            <AlertTriangle className="w-3 h-3 shrink-0" />
            <span className="truncate">{data.alertMessage}</span>
          </span>
        </div>
      )}

      <Handle type="source" position={Position.Bottom} className="!bg-[#282D37] !w-2 !h-2 !rounded-none" />
    </div>
  );
};