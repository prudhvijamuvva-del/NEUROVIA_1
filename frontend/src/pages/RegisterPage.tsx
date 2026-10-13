import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldAlert, Lock, Mail, User, Building, Phone, Eye, EyeOff, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { authService } from '../services/authService';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [termsConsent, setTermsConsent] = useState(false);
  const [channel, setChannel] = useState<'EMAIL' | 'SMS'>('EMAIL');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    if (!termsConsent) {
      setError("You must accept the terms of service and privacy policy.");
      return;
    }

    setLoading(true);

    try {
      const resp = await authService.register({
        full_name: fullName,
        organization_name: organizationName,
        email,
        mobile,
        password,
        confirm_password: confirmPassword,
        terms_consent: termsConsent,
        verification_channel: channel
      });

      const destination = channel === 'EMAIL' ? email : mobile;
      navigate('/verify-otp', {
        state: {
          destination,
          purpose: 'REGISTRATION',
          channel,
          dev_otp_hint: resp.otp_details?.dev_otp_hint,
          notice: resp.otp_details?.notice
        }
      });
    } catch (err: any) {
      const errData = err.response?.data;
      if (errData?.errors) {
        const firstKey = Object.keys(errData.errors)[0];
        setError(`${firstKey}: ${errData.errors[firstKey]}`);
      } else {
        setError(errData?.detail || 'Registration failed. Please check inputs.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b14] flex flex-col justify-center items-center p-6 py-12">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-cyan-500 to-teal-400 flex items-center justify-center shadow-lg shadow-teal-500/25">
              <ShieldAlert className="w-6 h-6 text-slate-950 font-bold" />
            </div>
            <span className="font-extrabold text-2xl tracking-tight text-white">
              Brand<span className="text-teal-400">Shield</span> AI
            </span>
          </Link>
          <h2 className="text-xl font-bold text-white">Register Organization Account</h2>
          <p className="text-xs text-slate-400 mt-1">Setup your digital risk protection workspace and analyst team</p>
        </div>

        <div className="p-8 rounded-2xl bg-[#0d1322] border border-slate-800 shadow-2xl">
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Full Name *</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="Alex Vance"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-teal-400 pl-10"
                  />
                  <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Organization Name *</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="Apex Financial Inc"
                    value={organizationName}
                    onChange={(e) => setOrganizationName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-teal-400 pl-10"
                  />
                  <Building className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Business Email *</label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    placeholder="analyst@domain.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-teal-400 pl-10"
                  />
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Mobile Number (with country code)</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="+1 415 555 0192"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-teal-400 pl-10"
                  />
                  <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                </div>
              </div>
            </div>

            {/* OTP Channel Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Verification Dispatch Channel</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setChannel('EMAIL')}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                    channel === 'EMAIL'
                      ? 'bg-teal-500/15 border-teal-500 text-teal-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  <Mail className="w-3.5 h-3.5" /> Email Verification
                </button>
                <button
                  type="button"
                  onClick={() => setChannel('SMS')}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                    channel === 'SMS'
                      ? 'bg-teal-500/15 border-teal-500 text-teal-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  <Phone className="w-3.5 h-3.5" /> SMS Verification
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password *</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Min 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-teal-400 pl-10 pr-10"
                  />
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Confirm Password *</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Repeat password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-teal-400 pl-10"
                  />
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                </div>
              </div>
            </div>

            {/* Terms and Privacy Consent */}
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <label className="flex items-start gap-2.5 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={termsConsent}
                  onChange={(e) => setTermsConsent(e.target.checked)}
                  className="mt-0.5 rounded border-slate-700 bg-slate-900 text-teal-500 focus:ring-teal-400"
                />
                <span>
                  I consent to the Terms of Service, Acceptable Use Policy, and Digital Risk Protection data processing guidelines.
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-slate-950 font-bold text-sm shadow-lg shadow-teal-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? 'Creating Account...' : 'Continue to Verification'} <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          Already registered?{' '}
          <Link to="/login" className="text-teal-400 font-semibold hover:underline">
            Sign In here
          </Link>
        </p>
      </div>
    </div>
  );
};
