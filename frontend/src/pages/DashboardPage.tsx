import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  Share2,
  Smartphone,
  AlertTriangle,
  Play,
  Plus,
  ArrowRight,
  TrendingUp,
  Activity,
  CheckCircle2,
  Clock,
  Layers,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';
import { reportService } from '../services/reportService';
import { DashboardSummary, Brand, Detection } from '../types';
import { SeverityBadge, StatusBadge } from '../components/SeverityBadge';

interface DashboardPageProps {
  selectedBrand: Brand | null;
  onRunScan?: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ selectedBrand }) => {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSummary();
  }, [selectedBrand]);

  const loadSummary = async () => {
    setLoading(true);
    try {
      const summary = await reportService.getDashboardSummary();
      setData(summary);
    } catch (e) {
      console.error("Failed to load dashboard metrics", e);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-400">Loading BrandShield telemetry...</p>
        </div>
      </div>
    );
  }

  const s = data || {
    total_brands: 1,
    social_profiles_scanned: 6,
    apps_scanned: 3,
    total_threats: 9,
    severity_counts: { CRITICAL: 3, HIGH: 3, MEDIUM: 2, LOW: 1 },
    status_counts: { NEW: 5, INVESTIGATING: 2, CONFIRMED: 1, FALSE_POSITIVE: 0, RESOLVED: 1 },
    platform_distribution: [
      { platform_or_store: 'Instagram', count: 1 },
      { platform_or_store: 'Google Play Store', count: 2 },
      { platform_or_store: 'X (Twitter)', count: 1 },
      { platform_or_store: 'Facebook', count: 1 },
      { platform_or_store: 'Apple App Store', count: 1 },
    ],
    type_comparison: [
      { name: 'Social Media', value: 6, color: '#0284c7' },
      { name: 'App Stores', value: 3, color: '#14b8a6' },
    ],
    recent_detections: [],
    threat_trends: [
      { date: 'Oct 06', count: 1 },
      { date: 'Oct 07', count: 2 },
      { date: 'Oct 08', count: 1 },
      { date: 'Oct 09', count: 3 },
      { date: 'Oct 10', count: 4 },
      { date: 'Oct 11', count: 2 },
      { date: 'Oct 12', count: 6 },
    ],
    source_summary: { live_api: 0, demo_data: 8, unavailable: 0, total: 8 },
  };

  return (
    <div className="p-6 sm:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-[#0d1627] via-[#0b1324] to-[#0d1a29] border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-400 animate-ping" />
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-teal-400">
              Surveillance Grid Active
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
            Brand Intelligence & Risk Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            Monitoring impersonation anomalies for protected brand <span className="text-slate-200 font-semibold">{selectedBrand?.name || 'All Registered Brands'}</span> across global social channels and mobile storefronts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/app/threats"
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-1.5"
          >
            <span>View All Threats</span> <ChevronRight className="w-4 h-4" />
          </Link>
          <Link
            to="/app/brands/new"
            className="px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold shadow-lg shadow-teal-500/20 transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> <span>Add Brand</span>
          </Link>
        </div>
      </div>

      {/* Top 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-5 rounded-2xl bg-[#0d1322] border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Protected Brands</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-white mt-3">{s.total_brands}</p>
          <p className="text-[11px] text-slate-400 mt-1">Active enterprise profiles</p>
        </div>

        <div className="p-5 rounded-2xl bg-[#0d1322] border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Social Scanned</span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Share2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-white mt-3">{s.social_profiles_scanned}</p>
          <p className="text-[11px] text-slate-400 mt-1">Profiles across 6 networks</p>
        </div>

        <div className="p-5 rounded-2xl bg-[#0d1322] border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Apps Scanned</span>
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <Smartphone className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-white mt-3">{s.apps_scanned}</p>
          <p className="text-[11px] text-slate-400 mt-1">Google Play & App Store</p>
        </div>

        <div className="p-5 rounded-2xl bg-[#0d1322] border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Potential Threats</span>
            <div className="p-2 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-red-400 mt-3">{s.total_threats}</p>
          <p className="text-[11px] text-slate-400 mt-1">Awaiting investigation review</p>
        </div>
      </div>

      {/* Severity Breakdown Bar */}
      <div className="p-5 rounded-2xl bg-[#0d1322] border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Severity Distribution</h3>
          <span className="text-xs text-slate-400">Total Flagged: {s.total_threats}</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20">
            <span className="text-xs font-semibold text-red-400 block">Critical Risk</span>
            <span className="text-2xl font-black text-white">{s.severity_counts.CRITICAL}</span>
            <span className="text-[10px] text-red-300/80 block mt-0.5">Score 75-100</span>
          </div>

          <div className="p-3.5 rounded-xl bg-orange-500/10 border border-orange-500/20">
            <span className="text-xs font-semibold text-orange-400 block">High Risk</span>
            <span className="text-2xl font-black text-white">{s.severity_counts.HIGH}</span>
            <span className="text-[10px] text-orange-300/80 block mt-0.5">Score 50-74</span>
          </div>

          <div className="p-3.5 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
            <span className="text-xs font-semibold text-yellow-400 block">Medium Risk</span>
            <span className="text-2xl font-black text-white">{s.severity_counts.MEDIUM}</span>
            <span className="text-[10px] text-yellow-300/80 block mt-0.5">Score 30-49</span>
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <span className="text-xs font-semibold text-emerald-400 block">Low Risk</span>
            <span className="text-2xl font-black text-white">{s.severity_counts.LOW}</span>
            <span className="text-[10px] text-emerald-300/80 block mt-0.5">Score 0-29</span>
          </div>
        </div>
      </div>

      {/* Visual Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Area Chart */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-[#0d1322] border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white">Detection Trend Over Time</h3>
              <p className="text-xs text-slate-400">Newly flagged impersonation candidates</p>
            </div>
            <TrendingUp className="w-4 h-4 text-teal-400" />
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={s.threat_trends}>
                <defs>
                  <linearGradient id="colorThreat" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#14b8a6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f293d" vertical={false} />
                <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#090e1a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="count" stroke="#14b8a6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorThreat)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Social vs App Store Donut Chart */}
        <div className="p-6 rounded-2xl bg-[#0d1322] border border-slate-800 shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white">Threat Ecosystem Ratio</h3>
            <p className="text-xs text-slate-400 mb-4">Social accounts vs App Store counterfeits</p>
          </div>

          <div className="h-44 w-full relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={s.type_comparison}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={5}
                >
                  {s.type_comparison.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#090e1a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2 mt-4 pt-4 border-t border-slate-800">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-sky-500" />
                <span className="text-slate-300">Social Media Profiles</span>
              </div>
              <span className="font-mono font-bold text-white">{s.type_comparison[0]?.value || 0}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-teal-500" />
                <span className="text-slate-300">Mobile Applications</span>
              </div>
              <span className="font-mono font-bold text-white">{s.type_comparison[1]?.value || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Detections Table */}
      <div className="p-6 rounded-2xl bg-[#0d1322] border border-slate-800 shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-sm font-bold text-white">Recent Impersonation Detections</h3>
            <p className="text-xs text-slate-400">Heuristic threat scores requiring analyst review</p>
          </div>
          <Link
            to="/app/threats"
            className="text-xs text-teal-400 hover:text-teal-300 font-semibold flex items-center gap-1"
          >
            <span>View Full Threat Intel</span> <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {s.recent_detections && s.recent_detections.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Candidate Entity</th>
                  <th className="py-3 px-4">Platform / Store</th>
                  <th className="py-3 px-4">Risk Score</th>
                  <th className="py-3 px-4">Severity</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {s.recent_detections.map((det) => (
                  <tr key={det.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-white">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center font-bold text-teal-400 text-xs">
                          {det.target_name.charAt(0)}
                        </div>
                        <div>
                          <p className="truncate max-w-[200px]">{det.target_name}</p>
                          <p className="text-[10px] text-slate-500 font-mono truncate">{det.target_identifier}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 font-medium">{det.platform_or_store}</td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-white text-xs">{det.risk_score}/100</span>
                        <div className="w-16 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              det.risk_score >= 75
                                ? 'bg-red-500'
                                : det.risk_score >= 50
                                ? 'bg-orange-500'
                                : det.risk_score >= 30
                                ? 'bg-yellow-500'
                                : 'bg-emerald-500'
                            }`}
                            style={{ width: `${det.risk_score}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <SeverityBadge severity={det.severity} size="sm" />
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={det.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        to={`/app/threats/${det.id}`}
                        className="px-3 py-1.5 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 font-semibold border border-teal-500/20 transition-colors inline-block"
                      >
                        Investigate
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center bg-slate-950/40 rounded-xl border border-slate-800/80">
            <CheckCircle2 className="w-10 h-10 text-teal-400 mx-auto mb-2 opacity-80" />
            <p className="text-sm font-semibold text-slate-200">No active threats detected yet</p>
            <p className="text-xs text-slate-500 mt-1">Run a monitoring scan above to analyze candidate entities against your brand profile.</p>
          </div>
        )}
      </div>

      {/* Telemetry Status Footer */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-400">
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-teal-400" />
            <span>
              Last Scan Completed: {s.last_scan?.completed_at ? new Date(s.last_scan.completed_at).toLocaleString() : 'Recently'}
            </span>
          </div>
          <span className="font-semibold text-slate-200">{s.last_scan?.threats_found || 0} threats identified</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>Monitoring Connectors Status:</span>
          </div>
          <span className="font-mono text-cyan-300 font-semibold">
            {s.source_summary.demo_data} Synthetic Connectors Active
          </span>
        </div>
      </div>
    </div>
  );
};
