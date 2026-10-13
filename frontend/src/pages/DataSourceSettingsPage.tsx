import React, { useState, useEffect } from 'react';
import { Database, CheckCircle2, AlertTriangle, RefreshCw, Layers, Shield, Sparkles } from 'lucide-react';
import { monitoringService } from '../services/monitoringService';
import { DataSource } from '../types';

export const DataSourceSettingsPage: React.FC = () => {
  const [sources, setSources] = useState<DataSource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSources();
  }, []);

  const loadSources = async () => {
    setLoading(true);
    try {
      const data = await monitoringService.getDataSources();
      setSources(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const toggleSource = async (src: DataSource) => {
    try {
      const updated = await monitoringService.updateDataSource(src.id, { is_enabled: !src.is_enabled });
      setSources(sources.map((s) => (s.id === src.id ? updated : s)));
    } catch (e) {
      alert("Failed to toggle connector.");
    }
  };

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-white flex items-center gap-2.5">
          <Database className="w-6 h-6 text-teal-400" />
          <span>Monitoring Connectors & Data Sources</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Configure API connectors, rate limits, and dataset ingestion pipelines. All sources clearly report their connection state.
        </p>
      </div>

      <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs flex items-center gap-3">
        <Sparkles className="w-5 h-5 flex-shrink-0" />
        <span>
          <strong>Zero Simulated Illusions:</strong> When external platform API keys are not supplied in .env, connectors gracefully operate on synthetic demonstration datasets with full detection pipeline execution.
        </span>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400 text-sm">Loading connector configuration...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {sources.map((src) => (
            <div
              key={src.id}
              className="p-5 rounded-2xl bg-[#0d1322] border border-slate-800 shadow-xl flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-teal-400">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-sm">{src.name}</h3>
                      <span className="text-[10px] text-slate-500 font-mono uppercase">{src.platform_type}</span>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                      src.status === 'LIVE_API'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : src.status === 'DEMO_DATA'
                        ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    {src.status === 'LIVE_API' ? 'Live API Connected' : src.status === 'DEMO_DATA' ? 'Synthetic Demo Mode' : 'Unavailable'}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-slate-400 mt-4">
                  <div className="flex justify-between">
                    <span>Connector Identifier:</span>
                    <span className="font-mono text-slate-300">{src.source_id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Rate Limit Allocation:</span>
                    <span className="font-mono text-slate-300">{src.rate_limit_info}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Active Telemetry Status:</span>
                    <span className={src.is_enabled ? 'text-emerald-400 font-semibold' : 'text-slate-500'}>
                      {src.is_enabled ? 'Active Surveillance' : 'Paused'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between">
                <span className="text-[11px] text-slate-500">
                  {src.status === 'LIVE_API' ? 'Production Mode' : 'Evaluation Mode'}
                </span>

                <button
                  onClick={() => toggleSource(src)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                    src.is_enabled
                      ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                      : 'bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold'
                  }`}
                >
                  {src.is_enabled ? 'Disable Source' : 'Enable Source'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
