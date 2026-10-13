import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldAlert, Lock, Mail, Eye, EyeOff, Camera, ArrowRight, AlertCircle, KeyRound } from 'lucide-react';
import { authService } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import { CameraCaptureModal } from '../components/CameraCaptureModal';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { setUserAndOrg } = useAuth();

  const [emailOrMobile, setEmailOrMobile] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Face auth modal state
  const [isFaceModalOpen, setIsFaceModalOpen] = useState(false);
  const [faceError, setFaceError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data = await authService.login(emailOrMobile, password, rememberMe);
      if (data.user && data.organization) {
        setUserAndOrg(data.user, data.organization);
        navigate('/app/dashboard');
      }
    } catch (err: any) {
      if (err.response?.data?.requires_verification) {
        navigate('/verify-otp', {
          state: {
            destination: err.response.data.destination,
            purpose: 'REGISTRATION',
            message: 'Your account requires email/SMS OTP verification before login.'
          }
        });
      } else {
        setError(err.response?.data?.detail || 'Invalid email/mobile or password.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFaceCapture = async (base64Image: string) => {
    setFaceError(null);
    setLoading(true);
    try {
      const data = await authService.faceVerify(base64Image, emailOrMobile || undefined);
      if (data.user && data.organization) {
        setUserAndOrg(data.user, data.organization);
        navigate('/app/dashboard');
      }
    } catch (err: any) {
      setFaceError(err.response?.data?.detail || 'Face verification failed. Please check camera alignment or use password.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoCredentials = () => {
    setEmailOrMobile('analyst@brandshield.ai');
    setPassword('BrandShield@2026!');
  };

  return (
    <div className="min-h-screen bg-[#070b14] flex flex-col justify-center items-center p-6 relative">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-cyan-500 to-teal-400 flex items-center justify-center shadow-lg shadow-teal-500/25">
              <ShieldAlert className="w-6 h-6 text-slate-950 font-bold" />
            </div>
            <span className="font-extrabold text-2xl tracking-tight text-white">
              Brand<span className="text-teal-400">Shield</span> AI
            </span>
          </Link>
          <h2 className="text-xl font-bold text-white">Security Operations Sign In</h2>
          <p className="text-xs text-slate-400 mt-1">Authenticate to access protected organization telemetry</p>
        </div>

        {/* Demo Credentials Pill */}
        <div className="mb-6 p-3 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-between text-xs text-teal-300">
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-teal-400 flex-shrink-0" />
            <span>Reviewer Demo Account Ready</span>
          </div>
          <button
            type="button"
            onClick={fillDemoCredentials}
            className="px-2.5 py-1 rounded bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold cursor-pointer transition-colors"
          >
            Auto Fill
          </button>
        </div>

        {/* Form Card */}
        <div className="p-8 rounded-2xl bg-[#0d1322] border border-slate-800 shadow-2xl">
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {faceError && (
            <div className="mb-5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{faceError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email or Mobile Number</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="analyst@brandshield.ai or +1..."
                  value={emailOrMobile}
                  onChange={(e) => setEmailOrMobile(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-teal-400 pl-10"
                />
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-300">Password</label>
                <Link to="/forgot-password" className="text-xs text-teal-400 hover:text-teal-300 transition-colors">
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••••••"
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

            <div className="flex items-center justify-between py-1">
              <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-900 text-teal-500 focus:ring-teal-400"
                />
                <span>Remember this terminal</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-slate-950 font-bold text-sm shadow-lg shadow-teal-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? 'Authenticating...' : 'Sign In'} <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Biometric Alternative */}
          <div className="mt-6 pt-5 border-t border-slate-800/80 text-center">
            <button
              type="button"
              onClick={() => setIsFaceModalOpen(true)}
              className="w-full py-2.5 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-teal-500/30 text-slate-300 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Camera className="w-4 h-4 text-teal-400" />
              <span>Sign In with Face Biometrics</span>
            </button>
          </div>
        </div>

        {/* Footer Link */}
        <p className="text-center text-xs text-slate-400 mt-6">
          Don't have an organization account?{' '}
          <Link to="/register" className="text-teal-400 font-semibold hover:underline">
            Register now
          </Link>
        </p>
      </div>

      <CameraCaptureModal
        isOpen={isFaceModalOpen}
        onClose={() => setIsFaceModalOpen(false)}
        onCapture={handleFaceCapture}
        title="Biometric Face Login"
        description="Align your face within the frame for real-time OpenCV feature comparison."
        requireConsent={false}
      />
    </div>
  );
};
