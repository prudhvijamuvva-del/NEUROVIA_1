import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, ArrowRight, RefreshCw, AlertCircle, KeyRound } from 'lucide-react';
import { authService } from '../services/authService';
import { useAuth } from '../context/AuthContext';

export const OtpVerifyPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { setUserAndOrg } = useAuth();

  const state = location.state || {};
  const destination = state.destination || '';
  const purpose = state.purpose || 'REGISTRATION';
  const channel = state.channel || 'EMAIL';
  const initialHint = state.dev_otp_hint || null;

  const [otp, setOtp] = useState('');
  const [devOtpHint, setDevOtpHint] = useState<string | null>(initialHint);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(state.message || null);
  const [cooldown, setCooldown] = useState(60);

  useEffect(() => {
    let timer: any;
    if (cooldown > 0) {
      timer = setInterval(() => setCooldown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim()) return;
    setError(null);
    setLoading(true);

    try {
      const data = await authService.verifyOtp(destination, otp.trim(), purpose);
      if (purpose === 'REGISTRATION' && data.user && data.organization) {
        setUserAndOrg(data.user, data.organization);
        navigate('/app/dashboard');
      } else if (purpose === 'PASSWORD_RESET') {
        navigate('/reset-password', {
          state: { destination, otp: otp.trim() }
        });
      } else {
        navigate('/login', { state: { message: "Account verified. Please sign in." } });
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid or expired verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    setError(null);
    try {
      const res = await authService.resendOtp(destination, purpose, channel);
      setSuccessMsg("A new verification code has been dispatched.");
      if (res.otp_details?.dev_otp_hint) {
        setDevOtpHint(res.otp_details.dev_otp_hint);
      }
      setCooldown(60);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to resend code.');
    }
  };

  const autoFillOtp = () => {
    if (devOtpHint) {
      setOtp(devOtpHint);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b14] flex flex-col justify-center items-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-400 border border-teal-500/20 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-teal-500/15">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white">One-Time Password Verification</h2>
          <p className="text-xs text-slate-400 mt-1">
            Verification code sent to <span className="text-teal-300 font-mono">{destination || 'your destination'}</span>
          </p>
        </div>

        {/* Development Mode OTP Banner */}
        {devOtpHint && (
          <div className="mb-6 p-3.5 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs shadow-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-teal-400 flex-shrink-0" />
              <div>
                <span className="font-semibold block">Dev Test Code: {devOtpHint}</span>
                <span className="text-[10px] text-teal-400/80">SMTP/SMS bypassed for instant local testing</span>
              </div>
            </div>
            <button
              type="button"
              onClick={autoFillOtp}
              className="px-2.5 py-1 rounded bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold cursor-pointer transition-colors"
            >
              Fill
            </button>
          </div>
        )}

        <div className="p-8 rounded-2xl bg-[#0d1322] border border-slate-800 shadow-2xl">
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && !error && (
            <div className="mb-5 p-3 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs">
              {successMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">Enter 6-Digit Code</label>
              <input
                type="text"
                maxLength={6}
                required
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                className="w-full text-center tracking-widest font-mono text-2xl font-bold bg-slate-950 border border-slate-800 text-teal-300 rounded-xl py-3 focus:outline-none focus:ring-2 focus:ring-teal-400"
              />
            </div>

            <button
              type="submit"
              disabled={loading || otp.length < 6}
              className="w-full py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-slate-950 font-bold text-sm shadow-lg shadow-teal-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? 'Verifying...' : 'Confirm & Activate'} <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Resend Cooldown */}
          <div className="mt-6 pt-5 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>Didn't receive the code?</span>
            <button
              type="button"
              disabled={cooldown > 0}
              onClick={handleResend}
              className="text-teal-400 hover:text-teal-300 disabled:text-slate-600 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${cooldown === 0 ? 'hover:rotate-180 transition-transform' : ''}`} />
              {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Code'}
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-slate-500 mt-6">
          <Link to="/login" className="text-slate-400 hover:text-white underline">
            Return to Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};
