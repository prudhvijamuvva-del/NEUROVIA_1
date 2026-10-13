import React from 'react';
import {
  HelpCircle,
  ShieldAlert,
  Cpu,
  Layers,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  BookOpen
} from 'lucide-react';

export const HelpDocsPage: React.FC = () => {
  return (
    <div className="p-6 sm:p-8 space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-white flex items-center gap-2.5">
          <BookOpen className="w-6 h-6 text-teal-400" />
          <span>Documentation & Architecture Knowledge Base</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Complete guide to BrandShield AI digital risk protection mechanisms, look-alike algorithms, and risk scoring.
        </p>
      </div>

      {/* Architecture Flow */}
      <div className="p-6 rounded-2xl bg-[#0d1322] border border-slate-800 shadow-xl space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Layers className="w-5 h-5 text-teal-400" />
          <span>Platform Architecture & End-to-End Pipeline</span>
        </h3>
        <p className="text-xs text-slate-300 leading-relaxed">
          BrandShield AI executes an automated heuristic defense pipeline to identify, assess, and prioritize potential brand impersonators:
        </p>

        <div className="p-4 rounded-xl bg-slate-950 border border-slate-850 font-mono text-[11px] text-teal-300 space-y-1 overflow-x-auto">
          <p>Authorized Social/App Sources + Uploaded Datasets</p>
          <p>  ↳ Source Connectors (Rate-limited & Normalized)</p>
          <p>  ↳ Official Asset Exclusion (Whitelists verified brand handles)</p>
          <p>  ↳ Multi-Signal Risk Engines:</p>
          <p>      • Smart Look-Alike Name Matcher (Unicode homoglyphs & Damerau-Levenshtein)</p>
          <p>      • Computer Vision Matcher (Perceptual dHash/pHash & OpenCV Histogram)</p>
          <p>      • NLP Semantics Matcher (TF-IDF Cosine & Affiliation Regex)</p>
          <p>      • Domain Risk Classifier (Typosquatting & Unverified Redirects)</p>
          <p>  ↳ Dynamic Weighted Scoring Engine (0-100 Normalization)</p>
          <p>  ↳ AI Plain-Language Threat Explanation Generation</p>
          <p>  ↳ PostgreSQL / REST APIs ➔ React Analyst Investigation Workspace</p>
        </div>
      </div>

      {/* Look-Alike Name Detection */}
      <div className="p-6 rounded-2xl bg-[#0d1322] border border-slate-800 shadow-xl space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Cpu className="w-5 h-5 text-cyan-400" />
          <span>Smart Look-Alike Name Detection (Section 8)</span>
        </h3>
        <p className="text-xs text-slate-300 leading-relaxed">
          Fraudsters rarely register exact duplicates. The look-alike engine evaluates:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-300">
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <h4 className="font-bold text-teal-400 mb-1">Homoglyphs & Confusables</h4>
            <p className="text-slate-400">
              Detects visual twin characters such as Cyrillic 'а', 'е', 'о' and leetspeak substitutions ('0' for 'o', '@' for 'a').
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <h4 className="font-bold text-teal-400 mb-1">Character Transpositions</h4>
            <p className="text-slate-400">
              Detects accidental or deliberate adjacent character swaps (e.g. AcmePya vs AcmePay) using Damerau-Levenshtein distance.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <h4 className="font-bold text-teal-400 mb-1">Suspicious Customer Affixes</h4>
            <p className="text-slate-400">
              Flags high-risk deceptive terms appended to brand names: "support", "help", "official", "care", "login", "verify".
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <h4 className="font-bold text-teal-400 mb-1">Punctuation & Spacing Normalization</h4>
            <p className="text-slate-400">
              Normalizes hyphens, periods, underscores, and spacing (e.g. Acme-Pay, Acme Pay) into standardized canonical tokens.
            </p>
          </div>
        </div>
      </div>

      {/* Risk Scoring Weights */}
      <div className="p-6 rounded-2xl bg-[#0d1322] border border-slate-800 shadow-xl space-y-4">
        <h3 className="text-base font-bold text-white">Transparent Weighted Scoring Engine (Section 9)</h3>
        <p className="text-xs text-slate-300 leading-relaxed">
          Composite scores (0-100) are computed dynamically. Missing evidence is explicitly reported and dynamically normalized rather than treated as zero risk:
        </p>

        <div className="space-y-2 text-xs">
          <div className="flex justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-850">
            <span className="font-semibold text-white">Name Similarity</span>
            <span className="font-mono text-teal-400">25% Weight</span>
          </div>
          <div className="flex justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-850">
            <span className="font-semibold text-white">Logo / Profile-Image Similarity</span>
            <span className="font-mono text-teal-400">20% Weight</span>
          </div>
          <div className="flex justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-850">
            <span className="font-semibold text-white">Description / Bio Similarity</span>
            <span className="font-mono text-teal-400">15% Weight</span>
          </div>
          <div className="flex justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-850">
            <span className="font-semibold text-white">Publisher / Identity Mismatch</span>
            <span className="font-mono text-teal-400">15% Weight</span>
          </div>
          <div className="flex justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-850">
            <span className="font-semibold text-white">Domain & External Link Risk</span>
            <span className="font-mono text-teal-400">15% Weight</span>
          </div>
          <div className="flex justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-850">
            <span className="font-semibold text-white">Contextual Heuristic Signals</span>
            <span className="font-mono text-teal-400">10% Weight</span>
          </div>
        </div>
      </div>
    </div>
  );
};
