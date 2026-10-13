import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FolderSearch,
  Search,
  Filter,
  Download,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldAlert
} from 'lucide-react';
import { threatService } from '../services/threatService';
import { reportService } from '../services/reportService';
import { Detection, ThreatStatus } from '../types';
import { SeverityBadge, StatusBadge } from '../components/SeverityBadge';

export const InvestigationsPage: React.FC = () => {
  const [detections, setDetections] = useState<Detection[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<string>('ALL');

  useEffect(() => {
    loadDetections();
  }, []);

  const loadDetections = async () => {
    setLoading(true);
    try {
      const data = await threatService.getDetections();
      setDetections(data);
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
      alert("Failed to export report CSV.");
    }
  };

  const handleQuickStatusChange = async (detId: string, newStatus: string) => {
    try {
      await threatService.updateDetection(detId, { status: newStatus });
      setDetections(
        detections.map((d) => (d.id === detId ? { ...d, status: newStatus as ThreatStatus } : d))
      );
    } catch (e) {
      alert("Failed to change status.");
    }
  };

  const filtered = detections.filter((d) => {
    const matchesSearch =
      d.target_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.target_identifier.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.brand_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'ALL' || d.status === selectedStatus;
    const matchesSeverity = selectedSeverity === 'ALL' || d.severity === selectedSeverity;
    const matchesType = selectedType === 'ALL' || d.detection_type === selectedType;
    return matchesSearch && matchesStatus && matchesSeverity && matchesType;
  });

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2.5">
            <FolderSearch className="w-6 h-6 text-teal-400" />
            <span>Investigation Workspace & Threat Intelligence</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Review, prioritize, and manage triage workflows for all digital risk detections across the brand portfolio.
          </p>
        </div>

        <button
          onClick={handleDownloadCsv}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 font-semibold text-xs border border-slate-700 transition-colors flex items-center gap-1.5 self-start cursor-pointer"
        >
          <Download className="w-4 h-4" /> Export Detections (CSV)
        </button>
      </div>

      {/* Filter Ribbon */}
      <div className="p-4 rounded-2xl bg-[#0d1322] border border-slate-800 flex flex-col lg:flex-row items-center justify-between gap-4">
        <div className="relative w-full lg:w-80">
          <input
            type="text"
            placeholder="Search brand, target, or handle..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3.5 py-2 text-xs focus:ring-1 focus:ring-teal-400 pl-9"
          />
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-white text-xs rounded-xl px-3 py-2 focus:ring-1 focus:ring-teal-400 cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="NEW">New</option>
            <option value="INVESTIGATING">Under Investigation</option>
            <option value="CONFIRMED">Confirmed Threat</option>
            <option value="FALSE_POSITIVE">False Positive</option>
            <option value="RESOLVED">Resolved</option>
          </select>

          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-white text-xs rounded-xl px-3 py-2 focus:ring-1 focus:ring-teal-400 cursor-pointer"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-white text-xs rounded-xl px-3 py-2 focus:ring-1 focus:ring-teal-400 cursor-pointer"
          >
            <option value="ALL">All Types</option>
            <option value="SOCIAL_PROFILE">Social Media</option>
            <option value="MOBILE_APP">Mobile App</option>
          </select>
        </div>
      </div>

      {/* Detections Master Table */}
      <div className="p-6 rounded-2xl bg-[#0d1322] border border-slate-800 shadow-xl">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">Loading investigation records...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <CheckCircle2 className="w-10 h-10 text-teal-400 mx-auto mb-2 opacity-80" />
            <p className="text-sm font-semibold text-white">No detections matching the active filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Entity & Handle</th>
                  <th className="py-3 px-4">Brand</th>
                  <th className="py-3 px-4">Channel / Store</th>
                  <th className="py-3 px-4">Risk Score</th>
                  <th className="py-3 px-4">Severity</th>
                  <th className="py-3 px-4">Triage Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filtered.map((det) => (
                  <tr key={det.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center font-bold text-teal-400 text-xs">
                          {det.target_name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-white text-xs">{det.target_name}</p>
                          <span className="text-[10px] text-slate-400 font-mono truncate block max-w-[180px]">
                            {det.target_identifier || det.target_url}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-teal-300">{det.brand_name}</td>
                    <td className="py-3.5 px-4 font-medium text-slate-200">{det.platform_or_store}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-white">
                      <span className="bg-slate-950 px-2 py-1 rounded border border-slate-800">
                        {det.risk_score}/100
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <SeverityBadge severity={det.severity} size="sm" />
                    </td>
                    <td className="py-3.5 px-4">
                      <select
                        value={det.status}
                        onChange={(e) => handleQuickStatusChange(det.id, e.target.value)}
                        className="bg-slate-950 border border-slate-800 text-slate-200 text-[11px] rounded-lg px-2 py-1 cursor-pointer focus:ring-1 focus:ring-teal-400"
                      >
                        <option value="NEW">New</option>
                        <option value="INVESTIGATING">Investigating</option>
                        <option value="CONFIRMED">Confirmed Threat</option>
                        <option value="FALSE_POSITIVE">False Positive</option>
                        <option value="RESOLVED">Resolved</option>
                      </select>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        to={`/app/threats/${det.id}`}
                        className="px-3 py-1.5 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 font-semibold border border-teal-500/20 transition-colors inline-block"
                      >
                        Triage Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
