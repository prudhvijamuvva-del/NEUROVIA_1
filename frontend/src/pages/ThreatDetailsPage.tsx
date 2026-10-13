import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ShieldAlert,
  ArrowLeft,
  ExternalLink,
  Clock,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  FileCheck,
  Send,
  MessageSquare,
  AlertCircle,
  HelpCircle,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import { threatService } from '../services/threatService';
import { Detection } from '../types';
import { SeverityBadge, StatusBadge } from '../components/SeverityBadge';

export const ThreatDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [detection, setDetection] = useState<Detection | null>(null);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);

  useEffect(() => {
    if (id) loadDetection(id);
  }, [id]);

  const loadDetection = async (detId: string) => {
    setLoading(true);
    try {
      const data = await threatService.getDetection(detId);
      setDetection(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!detection) return;
    setStatusUpdating(true);
    try {
      const updated = await threatService.updateDetection(detection.id, { status: newStatus });
      setDetection(updated);
    } catch (e) {
      alert("Failed to update investigation status.");
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!detection || !newNote.trim()) return;
    setSubmittingNote(true);
    try {
      await threatService.addNote(detection.id, newNote.trim());
      setNewNote('');
      loadDetection(detection.id);
    } catch (e) {
      alert("Failed to post investigation note.");
    } finally {
      setSubmittingNote(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-slate-400 text-sm">Loading threat analysis and AI evidence telemetry...</div>;
  }

  if (!detection) {
    return (
      <div className="p-12 text-center">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-white">Detection Not Found</h2>
        <Link to="/app/threats" className="text-teal-400 text-xs mt-2 hover:underline inline-block">
          Return to Threat Intelligence
        </Link>
      </div>
    );
  }

  const ai = detection.ai_explanation;

  return (
    <div className="p-6 sm:p-8 space-y-8 max-w-6xl mx-auto">
      {/* Top Bar Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/app/threats"
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-400">ID: {detection.id.slice(0, 8)}...</span>
              <SeverityBadge severity={detection.severity} size="sm" />
              <StatusBadge status={detection.status} />
            </div>
            <h1 className="text-2xl font-extrabold text-white mt-0.5">{detection.target_name}</h1>
          </div>
        </div>

        {/* Status Action Buttons */}
        <div className="flex items-center flex-wrap gap-2">
          {detection.status !== 'CONFIRMED' && (
            <button
              onClick={() => handleStatusChange('CONFIRMED')}
              disabled={statusUpdating}
              className="px-3 py-1.5 rounded-lg bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-300 text-xs font-semibold transition-colors cursor-pointer"
            >
              Confirm Threat
            </button>
          )}

          {detection.status !== 'FALSE_POSITIVE' && (
            <button
              onClick={() => handleStatusChange('FALSE_POSITIVE')}
              disabled={statusUpdating}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
            >
              Mark False Positive
            </button>
          )}

          {detection.status !== 'RESOLVED' && (
            <button
              onClick={() => handleStatusChange('RESOLVED')}
              disabled={statusUpdating}
              className="px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-semibold transition-colors cursor-pointer"
            >
              Mark Resolved
            </button>
          )}

          {detection.official_reporting_url && (
            <a
              href={detection.official_reporting_url}
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-1.5 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
            >
              <span>Platform Takedown Portal</span> <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>

      {/* Grid: Risk Score Card & Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Risk Score Card */}
        <div className="p-6 rounded-2xl bg-[#0d1322] border border-slate-800 shadow-xl flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Composite Risk Score</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-5xl font-black text-white">{detection.risk_score}</span>
              <span className="text-slate-500 font-mono text-sm">/ 100</span>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Confidence level: <span className="font-semibold text-teal-400">{detection.confidence}</span>
            </p>
          </div>

          <div className="space-y-3 mt-6 pt-5 border-t border-slate-800">
            <div>
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>Name Similarity (25%)</span>
                <span className="font-mono text-slate-200">{detection.name_score}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                <div className="bg-teal-400 h-full rounded-full" style={{ width: `${detection.name_score}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>Logo / Icon Match (20%)</span>
                <span className="font-mono text-slate-200">{detection.logo_score ? `${detection.logo_score}%` : 'N/A'}</span>
              </div>
              <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                <div className="bg-cyan-400 h-full rounded-full" style={{ width: `${detection.logo_score || 0}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>Description / Bio Match (15%)</span>
                <span className="font-mono text-slate-200">{detection.desc_score ? `${detection.desc_score}%` : 'N/A'}</span>
              </div>
              <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                <div className="bg-blue-400 h-full rounded-full" style={{ width: `${detection.desc_score || 0}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>Domain Risk (15%)</span>
                <span className="font-mono text-slate-200">{detection.domain_score ? `${detection.domain_score}%` : 'N/A'}</span>
              </div>
              <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                <div className="bg-red-400 h-full rounded-full" style={{ width: `${detection.domain_score || 0}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Entity Metadata Card */}
        <div className="md:col-span-2 p-6 rounded-2xl bg-[#0d1322] border border-slate-800 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Candidate Profile Intelligence</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-850">
              <span className="text-slate-400 block mb-0.5">Platform / Storefront</span>
              <span className="font-bold text-white text-sm">{detection.platform_or_store}</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-850">
              <span className="text-slate-400 block mb-0.5">Protected Target Brand</span>
              <span className="font-bold text-teal-300 text-sm">{detection.brand_name}</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-850">
              <span className="text-slate-400 block mb-0.5">Candidate Handle / Identifier</span>
              <span className="font-mono text-slate-200">{detection.target_identifier || 'N/A'}</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-850">
              <span className="text-slate-400 block mb-0.5">External Source URL</span>
              <a
                href={detection.target_url}
                target="_blank"
                rel="noreferrer"
                className="text-teal-400 hover:underline font-mono truncate block"
              >
                {detection.target_url}
              </a>
            </div>
          </div>

          <div className="pt-2 text-xs text-slate-400 flex items-center gap-6">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>First Discovered: {new Date(detection.first_seen_at).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>Last Synchronized: {new Date(detection.last_seen_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* AI Threat Explanation Panel (Section 10) */}
      {ai && (
        <div className="p-7 rounded-2xl bg-gradient-to-b from-[#0e172a] to-[#0a1120] border border-teal-500/30 shadow-2xl">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-5 h-5 text-teal-400" />
              <h3 className="font-bold text-white text-base">AI Threat Narrative & Remediation Guidance</h3>
            </div>
            <span className="text-xs font-mono text-teal-400 bg-teal-500/10 px-2.5 py-1 rounded-full border border-teal-500/20">
              {ai.generator || 'Deterministic AI Engine'}
            </span>
          </div>

          <p className="mt-4 font-semibold text-slate-200 text-sm italic">
            "{ai.summary_headline}"
          </p>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-300">
            {/* Column 1 */}
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
                <h4 className="font-bold text-teal-400 uppercase tracking-wider text-[11px] mb-1">
                  1. What was detected?
                </h4>
                <p className="leading-relaxed">{ai.what_detected}</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
                <h4 className="font-bold text-teal-400 uppercase tracking-wider text-[11px] mb-1">
                  2. Why was it flagged?
                </h4>
                <p className="leading-relaxed whitespace-pre-line">{ai.why_flagged}</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
                <h4 className="font-bold text-teal-400 uppercase tracking-wider text-[11px] mb-1">
                  3. Supporting Evidence
                </h4>
                <ul className="list-disc list-inside space-y-1 text-slate-400">
                  {ai.supporting_evidence_points?.map((pt, i) => (
                    <li key={i} className="leading-relaxed">{pt}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Column 2 */}
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-950/70 border border-amber-500/20">
                <h4 className="font-bold text-amber-400 uppercase tracking-wider text-[11px] mb-1 flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5" /> 4. Why might this be a false positive?
                </h4>
                <ul className="list-disc list-inside space-y-1 text-slate-400">
                  {ai.false_positive_considerations?.map((pt, i) => (
                    <li key={i} className="leading-relaxed">{pt}</li>
                  ))}
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
                <h4 className="font-bold text-teal-400 uppercase tracking-wider text-[11px] mb-1">
                  5. Potential Threat Impact
                </h4>
                <p className="leading-relaxed">{ai.possible_impact}</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/70 border border-emerald-500/20">
                <h4 className="font-bold text-emerald-400 uppercase tracking-wider text-[11px] mb-1 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" /> 6. Recommended Organization Next Steps
                </h4>
                <p className="leading-relaxed whitespace-pre-line text-slate-300">{ai.recommended_next_steps}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Evidence History Table */}
      <div className="p-6 rounded-2xl bg-[#0d1322] border border-slate-800 shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Detailed Evidence Attribution</h3>

        {detection.evidences && detection.evidences.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-4">Signal Category</th>
                  <th className="py-2.5 px-4">Evidence Title</th>
                  <th className="py-2.5 px-4">Detailed Signal Finding</th>
                  <th className="py-2.5 px-4">Score Impact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {detection.evidences.map((ev) => (
                  <tr key={ev.id} className="hover:bg-slate-800/30">
                    <td className="py-3 px-4 font-mono font-semibold text-teal-400">{ev.category}</td>
                    <td className="py-3 px-4 font-medium text-white">{ev.title}</td>
                    <td className="py-3 px-4 text-slate-400">{ev.details}</td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-200">
                      {ev.score_contribution ? `+${ev.score_contribution.toFixed(0)}` : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs text-slate-500">No telemetry evidence records attached.</p>
        )}
      </div>

      {/* Internal Analyst Notes Thread */}
      <div className="p-6 rounded-2xl bg-[#0d1322] border border-slate-800 shadow-xl space-y-5">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-teal-400" />
          <span>Internal Analyst Investigation Notes</span>
        </h3>

        {/* Existing notes */}
        <div className="space-y-3">
          {detection.notes && detection.notes.length > 0 ? (
            detection.notes.map((n) => (
              <div key={n.id} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-semibold text-teal-300">{n.author_name || n.author_email}</span>
                  <span className="text-[10px] text-slate-500">{new Date(n.created_at).toLocaleString()}</span>
                </div>
                <p className="text-slate-300 leading-relaxed">{n.note_text}</p>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-500">No notes recorded yet. Add initial investigation observations below.</p>
          )}
        </div>

        {/* Note input form */}
        <form onSubmit={handleAddNote} className="space-y-2 pt-2">
          <textarea
            rows={2}
            placeholder="Document threat review notes, takedown ticket reference, or partner verification..."
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3.5 py-2.5 text-xs focus:ring-1 focus:ring-teal-400"
          />
          <button
            type="submit"
            disabled={submittingNote || !newNote.trim()}
            className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-slate-950 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ml-auto"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{submittingNote ? 'Saving...' : 'Post Investigation Note'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
