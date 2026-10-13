import React from 'react';
import { SeverityLevel, ThreatStatus } from '../types';

export const SeverityBadge: React.FC<{ severity: SeverityLevel; size?: 'sm' | 'md' }> = ({ severity, size = 'md' }) => {
  const configs = {
    CRITICAL: {
      bg: 'bg-red-500/10 text-red-400 border-red-500/30',
      dot: 'bg-red-500',
      label: 'Critical'
    },
    HIGH: {
      bg: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
      dot: 'bg-orange-500',
      label: 'High'
    },
    MEDIUM: {
      bg: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
      dot: 'bg-yellow-500',
      label: 'Medium'
    },
    LOW: {
      bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      dot: 'bg-emerald-500',
      label: 'Low'
    }
  };

  const c = configs[severity] || configs.LOW;
  const padding = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${c.bg} ${padding}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot} animate-pulse`} />
      {c.label}
    </span>
  );
};

export const StatusBadge: React.FC<{ status: ThreatStatus }> = ({ status }) => {
  const configs = {
    NEW: {
      bg: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
      label: 'New Detection'
    },
    INVESTIGATING: {
      bg: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
      label: 'Investigating'
    },
    CONFIRMED: {
      bg: 'bg-red-500/10 text-red-400 border-red-500/30',
      label: 'Confirmed Threat'
    },
    FALSE_POSITIVE: {
      bg: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
      label: 'False Positive'
    },
    RESOLVED: {
      bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      label: 'Resolved'
    }
  };

  const c = configs[status] || configs.NEW;

  return (
    <span className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-md border ${c.bg}`}>
      {c.label}
    </span>
  );
};
