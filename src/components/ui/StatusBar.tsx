import React, { useState, useEffect } from 'react';
import { Wifi, Battery } from 'lucide-react';

export const StatusBar: React.FC = () => {
  const [timeStr, setTimeStr] = useState('9:41');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const h = now.getHours();
      const m = String(now.getMinutes()).padStart(2, '0');
      setTimeStr(`${h}:${m}`);
    };
    update();
    const interval = setInterval(update, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full flex items-center justify-between px-6 py-1.5 text-xs font-semibold text-white/90 select-none pointer-events-none z-30">
      <span className="tracking-tight">{timeStr}</span>
      <div className="flex items-center gap-2">
        {/* Signal Bars */}
        <div className="flex items-end gap-0.5 h-3">
          <div className="w-0.5 h-1.5 bg-white rounded-full"></div>
          <div className="w-0.5 h-2 bg-white rounded-full"></div>
          <div className="w-0.5 h-2.5 bg-white rounded-full"></div>
          <div className="w-0.5 h-3 bg-white rounded-full"></div>
        </div>
        <Wifi className="w-3.5 h-3.5" />
        <div className="flex items-center gap-1">
          <Battery className="w-4 h-4 fill-white" />
        </div>
      </div>
    </div>
  );
};
