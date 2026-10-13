import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  User,
  Shield,
  Camera,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock,
  KeyRound,
  FileText
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import { threatService } from '../services/threatService';
import { CameraCaptureModal } from '../components/CameraCaptureModal';

export const SettingsPage: React.FC = () => {
  const { user, organization, refreshUser } = useAuth();
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'PROFILE' | 'FACE_AUTH' | 'AUDIT_LOGS'>('PROFILE');
  const [isFaceModalOpen, setIsFaceModalOpen] = useState(false);
  const [faceMsg, setFaceMsg] = useState<string | null>(null);
  const [faceError, setFaceError] = useState<string | null>(null);
  const [loadingLogs, setLoadingLogs] = useState(false);

  useEffect(() => {
    if (activeTab === 'AUDIT_LOGS') {
      loadAuditLogs();
    }
  }, [activeTab]);

  const loadAuditLogs = async () => {
    setLoadingLogs(true);
    try {
      const data = await threatService.getAuditLogs();
      setAuditLogs(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleFaceEnroll = async (base64Image: string, consent: boolean) => {
    setFaceError(null);
    setFaceMsg(null);
    try {
      const resp = await authService.faceEnroll(base64Image, consent);
      setFaceMsg(resp.message || "Face biometric enrollment successful.");
      await refreshUser();
    } catch (err: any) {
      setFaceError(err.response?.data?.detail || "Failed to enroll face.");
    }
  };

  const handleDeleteFace = async () => {
    if (!window.confirm("Permanently delete your enrolled biometric face template?")) return;
    try {
      await authService.deleteFaceEnrollment();
      setFaceMsg("Biometric template successfully deleted.");
      await refreshUser();
    } catch (e) {
      alert("Failed to delete face enrollment.");
    }
  };

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-white flex items-center gap-2.5">
          <SettingsIcon className="w-6 h-6 text-teal-400" />
          <span>Security & Organization Settings</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Manage user profiles, biometric authentication credentials, and compliance audit logs.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 text-xs font-semibold gap-6">
        <button
          onClick={() => setActiveTab('PROFILE')}
          className={`pb-3 transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'PROFILE'
              ? 'text-teal-400 border-b-2 border-teal-400'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <User className="w-4 h-4" /> User Profile & Role
        </button>
        <button
          onClick={() => setActiveTab('FACE_AUTH')}
          className={`pb-3 transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'FACE_AUTH'
              ? 'text-teal-400 border-b-2 border-teal-400'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Camera className="w-4 h-4" /> Face Biometrics
        </button>
        <button
          onClick={() => setActiveTab('AUDIT_LOGS')}
          className={`pb-3 transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'AUDIT_LOGS'
              ? 'text-teal-400 border-b-2 border-teal-400'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4" /> Audit Logs
        </button>
      </div>

      {/* Profile Tab */}
      {activeTab === 'PROFILE' && (
        <div className="p-6 rounded-2xl bg-[#0d1322] border border-slate-800 shadow-xl space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-600 to-teal-500 flex items-center justify-center text-slate-950 font-bold text-xl shadow-lg">
              {user?.full_name?.charAt(0) || 'U'}
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">{user?.full_name}</h3>
              <p className="text-xs text-slate-400 font-mono">{user?.email}</p>
              <span className="inline-block px-2 py-0.5 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300 text-[10px] font-mono mt-1 uppercase font-semibold">
                {organization?.role || 'ANALYST'} Access Level
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-4 border-t border-slate-800">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-850">
              <span className="text-slate-400 block mb-1">Organization Workspace</span>
              <span className="text-sm font-semibold text-white">{organization?.name || 'Apex Financial Group'}</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-850">
              <span className="text-slate-400 block mb-1">Registered Mobile</span>
              <span className="text-sm font-semibold text-white">{user?.mobile || 'Not configured'}</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-850">
              <span className="text-slate-400 block mb-1">Account Verification Status</span>
              <span className="text-sm font-semibold text-emerald-400 flex items-center gap-1.5 mt-0.5">
                <CheckCircle2 className="w-4 h-4" /> Verified Identity
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-850">
              <span className="text-slate-400 block mb-1">Account Creation Date</span>
              <span className="text-sm font-mono text-slate-300">
                {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Active'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Face Biometrics Tab */}
      {activeTab === 'FACE_AUTH' && (
        <div className="p-6 rounded-2xl bg-[#0d1322] border border-slate-800 shadow-xl space-y-6">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Camera className="w-5 h-5 text-teal-400" />
              <span>Biometric Face Authentication Manager</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Enroll or revoke optional facial recognition authentication for returning logins.
            </p>
          </div>

          {faceMsg && (
            <div className="p-3.5 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{faceMsg}</span>
            </div>
          )}

          {faceError && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{faceError}</span>
            </div>
          )}

          <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-300">Enrollment Status:</span>
                {user?.is_face_enrolled ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-semibold">
                    ✓ Enrolled & Active
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 text-xs font-semibold">
                    Not Enrolled
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 mt-1 max-w-lg">
                Biometric feature vectors are encrypted using salted multi-cell histograms. Raw camera captures are discarded immediately after feature computation.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => setIsFaceModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Camera className="w-4 h-4" /> {user?.is_face_enrolled ? 'Re-enroll Face' : 'Enroll Face'}
              </button>

              {user?.is_face_enrolled && (
                <button
                  onClick={handleDeleteFace}
                  className="px-3.5 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" /> Delete Biometric Data
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Audit Logs Tab */}
      {activeTab === 'AUDIT_LOGS' && (
        <div className="p-6 rounded-2xl bg-[#0d1322] border border-slate-800 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Compliance & Security Audit Trail</h3>

          {loadingLogs ? (
            <div className="p-12 text-center text-slate-400 text-xs">Loading audit events...</div>
          ) : auditLogs.length === 0 ? (
            <p className="text-xs text-slate-500 p-6 text-center">No audit trail records found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-4">Timestamp</th>
                    <th className="py-2.5 px-4">Action</th>
                    <th className="py-2.5 px-4">Actor</th>
                    <th className="py-2.5 px-4">Entity</th>
                    <th className="py-2.5 px-4">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-800/30">
                      <td className="py-3 px-4 text-slate-400">{new Date(log.created_at).toLocaleString()}</td>
                      <td className="py-3 px-4 font-bold text-teal-400">{log.action}</td>
                      <td className="py-3 px-4 text-slate-300">{log.user_email || 'System'}</td>
                      <td className="py-3 px-4 text-slate-400">{log.entity_type}</td>
                      <td className="py-3 px-4 text-slate-300 truncate max-w-[200px]">
                        {JSON.stringify(log.details)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <CameraCaptureModal
        isOpen={isFaceModalOpen}
        onClose={() => setIsFaceModalOpen(false)}
        onCapture={handleFaceEnroll}
        title="Enroll Biometric Face Authentication"
        description="Position your face inside the HUD box. Your mathematical feature descriptor will be securely enrolled."
        requireConsent={true}
      />
    </div>
  );
};
