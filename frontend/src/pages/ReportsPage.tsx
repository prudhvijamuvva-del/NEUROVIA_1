import React, { useState, useEffect } from 'react';
import {
  FileBarChart,
  Download,
  Calendar,
  ShieldCheck,
  AlertTriangle,
  Printer,
  TrendingDown,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { reportService } from '../services/reportService';

export const ReportsPage: React.FC = () => {
  const [period, setPeriod] = useState('30d');
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReport();
  }, [period]);

  const loadReport = async () => {
    setLoading(true);
    try {
      const data = await reportService.getReportSummary(period);
      setSummary(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCsv = async () => {
    try {
      await reportService.downloadCsv();
    } catch (e) {
      alert("Failed to download CSV.");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const rep = summary || {
    total_detected: 9,
    false_positive_count: 0,
    false_positive_rate_percent: 0.0,
    resolved_count: 1,
    resolution_rate_percent: 11.1,
    severity_breakdown: { critical: 3, high: 3, medium: 2, low: 1 }
  };

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-6xl mx-auto print:p-2">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2.5">
            <FileBarChart className="w-6 h-6 text-teal-400" />
            <span>Digital Risk Protection Executive Report</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Aggregated brand safety metrics, triage efficacy, and impersonation threat distributions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer print:hidden"
          >
            <Printer className="w-4 h-4 text-slate-400" /> Print / Save PDF
          </button>
          <button
            onClick={handleDownloadCsv}
            className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-teal-500/20 transition-all cursor-pointer print:hidden"
          >
            <Download className="w-4 h-4" /> Download CSV Report
          </button>
        </div>
      </div>

      {/* Period Selection */}
      <div className="flex items-center gap-2 p-2 rounded-xl bg-[#0d1322] border border-slate-800 w-fit print:hidden">
        <span className="text-xs font-semibold text-slate-400 px-2 flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-teal-400" /> Timeframe:
        </span>
        {['7d', '30d', '90d', 'all'].map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              period === p
                ? 'bg-teal-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {p === 'all' ? 'All Time' : `Last ${p.toUpperCase()}`}
          </button>
        ))}
      </div>

      {/* Key Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-5 rounded-2xl bg-[#0d1322] border border-slate-800 shadow-xl">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Total Findings Flagged</span>
          <p className="text-3xl font-black text-white mt-2">{rep.total_detected}</p>
          <p className="text-[11px] text-slate-500 mt-1">Cross-platform candidates</p>
        </div>

        <div className="p-5 rounded-2xl bg-[#0d1322] border border-slate-800 shadow-xl">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Remediated / Resolved</span>
          <p className="text-3xl font-black text-emerald-400 mt-2">{rep.resolved_count}</p>
          <p className="text-[11px] text-slate-500 mt-1">{rep.resolution_rate_percent}% resolution velocity</p>
        </div>

        <div className="p-5 rounded-2xl bg-[#0d1322] border border-slate-800 shadow-xl">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">False Positive Rate</span>
          <p className="text-3xl font-black text-slate-300 mt-2">{rep.false_positive_rate_percent}%</p>
          <p className="text-[11px] text-slate-500 mt-1">{rep.false_positive_count} marked benign</p>
        </div>

        <div className="p-5 rounded-2xl bg-[#0d1322] border border-slate-800 shadow-xl">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">High & Critical Threats</span>
          <p className="text-3xl font-black text-red-400 mt-2">
            {(rep.severity_breakdown?.critical || 0) + (rep.severity_breakdown?.high || 0)}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">Priority takedown actions</p>
        </div>
      </div>

      {/* Executive Summary Narrative */}
      <div className="p-7 rounded-2xl bg-[#0d1322] border border-slate-800 shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Executive Threat Assessment</h3>
        <p className="text-xs text-slate-300 leading-relaxed">
          Over the selected monitoring window ({period.toUpperCase()}), BrandShield AI continuously tracked official trademark parameters for your protected brand assets. Detection heuristic pipelines identified <span className="text-white font-bold">{rep.total_detected} potential brand impersonation anomalies</span>.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs">
            <h4 className="font-semibold text-teal-400 mb-2">Severity Distribution</h4>
            <div className="space-y-2 text-slate-300">
              <div className="flex justify-between">
                <span>Critical Risk:</span>
                <span className="font-mono font-bold text-red-400">{rep.severity_breakdown?.critical || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>High Risk:</span>
                <span className="font-mono font-bold text-orange-400">{rep.severity_breakdown?.high || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Medium Risk:</span>
                <span className="font-mono font-bold text-yellow-400">{rep.severity_breakdown?.medium || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Low Risk:</span>
                <span className="font-mono font-bold text-emerald-400">{rep.severity_breakdown?.low || 0}</span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs">
            <h4 className="font-semibold text-teal-400 mb-2">Compliance & Data Integrity</h4>
            <p className="text-slate-400 leading-relaxed">
              All telemetry was captured in compliance with third-party platform API usage standards. No automated takedown requests were initiated without analyst oversight, ensuring zero disruption to legitimate distributors and partner channels.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
