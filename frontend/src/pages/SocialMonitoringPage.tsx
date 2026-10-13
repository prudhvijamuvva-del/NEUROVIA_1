import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Share2,
  Search,
  Filter,
  Play,
  Upload,
  Plus,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { monitoringService } from '../services/monitoringService';
import { threatService } from '../services/threatService';
import { Brand, Detection } from '../types';
import { SeverityBadge, StatusBadge } from '../components/SeverityBadge';

export const SocialMonitoringPage: React.FC<{ selectedBrand: Brand | null }> = ({ selectedBrand }) => {
  const [detections, setDetections] = useState<Detection[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('ALL');
  const [selectedSeverity, setSelectedSeverity] = useState('ALL');

  // Manual URL modal
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [submitPlatform, setSubmitPlatform] = useState('Instagram');
  const [submitName, setSubmitName] = useState('');
  const [submitHandle, setSubmitHandle] = useState('');
  const [submitUrl, setSubmitUrl] = useState('');
  const [submitBio, setSubmitBio] = useState('');
  const [submitExternalUrl, setSubmitExternalUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadDetections();
  }, [selectedBrand]);

  const loadDetections = async () => {
    setLoading(true);
    try {
      const data = await threatService.getDetections({
        brand_id: selectedBrand?.id,
        type: 'SOCIAL_PROFILE'
      });
      setDetections(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleRunScan = async () => {
    if (!selectedBrand) {
      alert("Please select or create a brand first.");
      return;
    }
    setLoading(true);
    try {
      await monitoringService.triggerSocialScan(selectedBrand.id);
      loadDetections();
    } catch (e) {
      alert("Scan failed.");
      setLoading(false);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBrand) return;
    setIsSubmitting(true);
    try {
      await monitoringService.submitCandidate({
        brand_id: selectedBrand.id,
        candidate_type: 'SOCIAL',
        platform_or_store: submitPlatform,
        target_name: submitName,
        identifier: submitHandle,
        url: submitUrl,
        bio_or_description: submitBio,
        external_url: submitExternalUrl
      });
      setIsSubmitModalOpen(false);
      setSubmitName('');
      setSubmitHandle('');
      setSubmitUrl('');
      setSubmitBio('');
      setSubmitExternalUrl('');
      loadDetections();
    } catch (e) {
      alert("Failed to submit candidate.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredDetections = detections.filter((d) => {
    const matchesSearch =
      d.target_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.target_identifier.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPlatform = selectedPlatform === 'ALL' || d.platform_or_store.toLowerCase().includes(selectedPlatform.toLowerCase());
    const matchesSeverity = selectedSeverity === 'ALL' || d.severity === selectedSeverity;
    return matchesSearch && matchesPlatform && matchesSeverity;
  });

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2.5">
            <Share2 className="w-6 h-6 text-cyan-400" />
            <span>Social Media Monitoring</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Surveillance of look-alike accounts, impersonation profiles, and fake brand pages across social ecosystems.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSubmitModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-teal-400" /> Submit Candidate Profile
          </button>
          <button
            onClick={handleRunScan}
            disabled={loading || !selectedBrand}
            className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-slate-950 text-xs font-bold shadow-lg shadow-teal-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" /> Run Social Scan
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-[#0d1322] border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Search username or display name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3.5 py-2 text-xs focus:ring-1 focus:ring-teal-400 pl-9"
          />
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={selectedPlatform}
            onChange={(e) => setSelectedPlatform(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-white text-xs rounded-xl px-3 py-2 focus:ring-1 focus:ring-teal-400 cursor-pointer"
          >
            <option value="ALL">All Platforms</option>
            <option value="Instagram">Instagram</option>
            <option value="Twitter">X (Twitter)</option>
            <option value="Facebook">Facebook</option>
            <option value="LinkedIn">LinkedIn</option>
            <option value="YouTube">YouTube</option>
            <option value="TikTok">TikTok</option>
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
        </div>
      </div>

      {/* Detections List */}
      <div className="p-6 rounded-2xl bg-[#0d1322] border border-slate-800 shadow-xl">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">Analyzing social candidate intelligence...</div>
        ) : filteredDetections.length === 0 ? (
          <div className="p-12 text-center">
            <CheckCircle2 className="w-10 h-10 text-teal-400 mx-auto mb-2 opacity-80" />
            <p className="text-sm font-semibold text-white">No social impersonations matching your criteria</p>
            <p className="text-xs text-slate-400 mt-1">Run a scan or submit a candidate URL to evaluate threats.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Candidate Profile</th>
                  <th className="py-3 px-4">Platform</th>
                  <th className="py-3 px-4">Name Similarity</th>
                  <th className="py-3 px-4">Risk Score</th>
                  <th className="py-3 px-4">Severity</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredDetections.map((det) => (
                  <tr key={det.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center font-bold text-teal-400 text-xs">
                          {det.target_name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-white text-xs">{det.target_name}</p>
                          <a
                            href={det.target_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[11px] text-teal-400/90 hover:underline font-mono inline-flex items-center gap-1"
                          >
                            <span>{det.target_identifier || det.target_url}</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-200">{det.platform_or_store}</td>
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-semibold text-white">{det.name_score}%</span>
                    </td>
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
        )}
      </div>

      {/* Manual Candidate Submission Modal */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1">Submit Candidate Profile URL</h3>
            <p className="text-xs text-slate-400 mb-4">
              Pass an individual suspicious profile directly through the detection and risk-scoring pipeline.
            </p>

            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Platform *</label>
                <select
                  value={submitPlatform}
                  onChange={(e) => setSubmitPlatform(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-teal-400"
                >
                  <option value="Instagram">Instagram</option>
                  <option value="X (Twitter)">X (Twitter)</option>
                  <option value="Facebook">Facebook</option>
                  <option value="LinkedIn">LinkedIn</option>
                  <option value="YouTube">YouTube</option>
                  <option value="TikTok">TikTok</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Display Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AcmePay Customer Care"
                  value={submitName}
                  onChange={(e) => setSubmitName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-teal-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Handle / Username *</label>
                <input
                  type="text"
                  required
                  placeholder="@acmepay_support"
                  value={submitHandle}
                  onChange={(e) => setSubmitHandle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-teal-400 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Profile URL *</label>
                <input
                  type="url"
                  required
                  placeholder="https://instagram.com/acmepay_support"
                  value={submitUrl}
                  onChange={(e) => setSubmitUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-teal-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Bio / Profile Text</label>
                <textarea
                  rows={2}
                  placeholder="Official customer care service..."
                  value={submitBio}
                  onChange={(e) => setSubmitBio(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-teal-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">External Link in Bio (if present)</label>
                <input
                  type="url"
                  placeholder="https://bit.ly/... or phishing domain"
                  value={submitExternalUrl}
                  onChange={(e) => setSubmitExternalUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-teal-400"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsSubmitModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-bold bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-xl"
                >
                  {isSubmitting ? 'Evaluating...' : 'Analyze Candidate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
