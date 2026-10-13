import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldAlert,
  Search,
  Eye,
  FileCheck,
  CheckCircle2,
  Lock,
  ArrowRight,
  Share2,
  Smartphone,
  Cpu,
  Layers,
  Sparkles,
  Camera
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col selection:bg-teal-500 selection:text-black">
      {/* Top Navbar */}
      <nav className="border-b border-slate-800/80 bg-[#090e1a]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-teal-400 flex items-center justify-center shadow-lg shadow-teal-500/25">
              <ShieldAlert className="w-6 h-6 text-slate-950 font-bold" />
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight text-white block">
                Brand<span className="text-teal-400">Shield</span> AI
              </span>
              <span className="text-[10px] text-slate-400 tracking-wider uppercase font-semibold">
                Digital Risk Protection Platform
              </span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#features" className="hover:text-teal-400 transition-colors">Features</a>
            <a href="#ai-engine" className="hover:text-teal-400 transition-colors">AI & Detection</a>
            <a href="#workflow" className="hover:text-teal-400 transition-colors">Investigation</a>
            <a href="#security" className="hover:text-teal-400 transition-colors">Biometric Security</a>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="px-4 py-2 text-sm font-semibold text-slate-300 hover:text-white transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="px-5 py-2.5 text-sm font-semibold bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-xl shadow-lg shadow-teal-500/20 transition-all hover:scale-[1.02]"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-28 border-b border-slate-800/60">
        {/* Glow gradients */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-tr from-teal-500/15 via-cyan-500/10 to-blue-600/15 blur-[120px] pointer-events-none rounded-full" />

        <div className="max-w-6xl mx-auto px-6 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs font-semibold mb-6 shadow-inner">
            <Sparkles className="w-4 h-4" /> Next-Gen Brand Protection & Threat Intelligence
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight sm:leading-tight">
            Stop Brand Impersonators, Fake Socials & Rogue Apps <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-cyan-300 to-blue-400">Before Fraud Strikes</span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Autonomous threat detection using smart look-alike fuzzy matching, perceptual logo hashing, and transparent AI risk scoring across social platforms and mobile app stores.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-400 text-slate-950 font-bold text-base shadow-xl shadow-teal-500/25 hover:brightness-110 transition-all flex items-center justify-center gap-2"
            >
              Launch Live Platform <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white font-semibold text-base transition-colors flex items-center justify-center gap-2"
            >
              Demo Login
            </Link>
          </div>

          {/* Quick metric highlights */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto text-left">
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <p className="text-2xl font-black text-teal-400">100%</p>
              <p className="text-xs text-slate-400 mt-1 font-medium">Transparent Evidence Attribution</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <p className="text-2xl font-black text-cyan-400">Unicode & Typo</p>
              <p className="text-xs text-slate-400 mt-1 font-medium">Homoglyph Confusable Analysis</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <p className="text-2xl font-black text-blue-400">Perceptual Hash</p>
              <p className="text-xs text-slate-400 mt-1 font-medium">Logo & Icon Computer Vision</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <p className="text-2xl font-black text-emerald-400">Zero False Lock</p>
              <p className="text-xs text-slate-400 mt-1 font-medium">Verified Asset Whitelisting</p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Pillars */}
      <section id="features" className="py-20 max-w-7xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl font-bold text-white">Full-Spectrum Digital Risk Protection</h2>
          <p className="text-slate-400 mt-3 text-sm">
            Continuous surveillance of public digital footprints with strict privacy compliance and zero invasive scraping.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-7 rounded-2xl bg-slate-900/40 border border-slate-800 hover:border-teal-500/40 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center mb-5">
              <Share2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Social Media Impersonation</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Detect fake brand accounts, scam support handles, employee profile cloning, and homoglyphic usernames across Instagram, X, Facebook, LinkedIn, YouTube, and TikTok.
            </p>
          </div>

          <div className="p-7 rounded-2xl bg-slate-900/40 border border-slate-800 hover:border-teal-500/40 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20 flex items-center justify-center mb-5">
              <Smartphone className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">App Store Counterfeits</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Scan Google Play and Apple App Store for unauthorized clone apps, look-alike bundle IDs, publisher mismatches, and apps requesting dangerous permissions under your brand name.
            </p>
          </div>

          <div className="p-7 rounded-2xl bg-slate-900/40 border border-slate-800 hover:border-teal-500/40 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center mb-5">
              <Camera className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Biometric Face Authentication</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Enterprise-grade login security using webcam biometric verification with OpenCV feature descriptors, zero plaintext image storage, and informed user consent controls.
            </p>
          </div>
        </div>
      </section>

      {/* AI Threat Explanations Demo */}
      <section id="ai-engine" className="py-20 bg-slate-900/30 border-y border-slate-800/80">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs uppercase tracking-wider font-semibold text-teal-400">Plain-Language Cyber Intelligence</span>
            <h2 className="text-3xl font-bold text-white mt-2">AI-Powered Threat Explanations</h2>
            <p className="text-slate-400 mt-2 text-sm">Every detection is translated into transparent, executive-ready analysis.</p>
          </div>

          <div className="p-8 rounded-2xl bg-slate-950 border border-slate-800 shadow-2xl">
            <div className="flex items-center justify-between pb-6 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/30">
                  Critical Risk: 88 / 100
                </span>
                <span className="text-sm font-semibold text-slate-300">Target: @acmepay_official_help (Instagram)</span>
              </div>
              <span className="text-xs text-teal-400 font-mono">Engine: Heuristic + NLP</span>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-teal-300 text-xs uppercase tracking-wider">What was detected?</h4>
                  <p className="text-slate-300 mt-1 text-xs leading-relaxed">
                    A candidate profile on Instagram mimicking protected brand "AcmePay" using deceptive customer service branding.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-teal-300 text-xs uppercase tracking-wider">Why was it flagged?</h4>
                  <p className="text-slate-300 mt-1 text-xs leading-relaxed">
                    • Brand name combined with customer-facing keyword "official_help".<br />
                    • External URL links to suspicious unverified domain (acmepay-security-portal.xyz).<br />
                    • Perceptual logo hash correlates 85% with official registered brand logo.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-amber-400 text-xs uppercase tracking-wider">Why might this be a false positive?</h4>
                  <p className="text-slate-300 mt-1 text-xs leading-relaxed">
                    Could represent an unlisted regional dealer or customer affiliate not yet enrolled in your organization's verified asset registry.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-teal-300 text-xs uppercase tracking-wider">Recommended Next Step</h4>
                  <p className="text-slate-300 mt-1 text-xs leading-relaxed">
                    Review external phishing link. If confirmed malicious, trigger direct takedown filing via Instagram's official Brand Rights Protection portal.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800/80 bg-[#060911] py-8 text-center text-xs text-slate-500">
        <p>© 2026 BrandShield AI — Digital Risk Protection Platform. Built for Enterprise Brand Security & Hackathon Showcase.</p>
        <p className="mt-2 text-slate-600">All detections represent heuristic risk evaluations and require human verification before takedown actions.</p>
      </footer>
    </div>
  );
};
