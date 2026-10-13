import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Shield,
  Plus,
  CheckCircle2,
  XCircle,
  Trash2,
  Globe,
  Share2,
  Smartphone,
  ArrowLeft,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Building
} from 'lucide-react';
import { brandService } from '../services/brandService';
import { Brand, OfficialAsset } from '../types';

export const BrandDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = id === 'new' || !id;

  const [brand, setBrand] = useState<Brand | null>(null);
  const [loading, setLoading] = useState(!isNew);

  // Form states for brand create / update
  const [name, setName] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [industry, setIndustry] = useState('Financial Services & FinTech');
  const [description, setDescription] = useState('');
  const [keywordsInput, setKeywordsInput] = useState('');
  const [domainsInput, setDomainsInput] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Asset creation modal
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [assetType, setAssetType] = useState<'SOCIAL_ACCOUNT' | 'MOBILE_APP'>('SOCIAL_ACCOUNT');
  const [platform, setPlatform] = useState('TWITTER_X');
  const [identifier, setIdentifier] = useState('');
  const [officialUrl, setOfficialUrl] = useState('');
  const [publisherName, setPublisherName] = useState('');
  const [isVerified, setIsVerified] = useState(true);

  useEffect(() => {
    if (!isNew && id) {
      loadBrand(id);
    }
  }, [id, isNew]);

  const loadBrand = async (brandId: string) => {
    setLoading(true);
    try {
      const data = await brandService.getBrand(brandId);
      setBrand(data);
      setName(data.name);
      setWebsiteUrl(data.website_url);
      setIndustry(data.industry);
      setDescription(data.description || '');
      setKeywordsInput((data.keywords || []).join(', '));
      setDomainsInput((data.legitimate_domains || []).join(', '));
      setLogoUrl(data.logo_url || '');
    } catch (e) {
      setError("Failed to load brand profile.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const keywords = keywordsInput
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean);

    const legitimate_domains = domainsInput
      .split(',')
      .map((d) => d.trim().toLowerCase())
      .filter(Boolean);

    try {
      if (isNew) {
        const created = await brandService.createBrand({
          name,
          website_url: websiteUrl,
          industry,
          description,
          keywords,
          legitimate_domains,
          logo_url: logoUrl
        });
        navigate(`/app/brands/${created.id}`);
      } else if (brand) {
        const updated = await brandService.updateBrand(brand.id, {
          name,
          website_url: websiteUrl,
          industry,
          description,
          keywords,
          legitimate_domains,
          logo_url: logoUrl
        });
        setBrand(updated);
        alert("Brand profile updated successfully!");
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to save brand profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleAddAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brand) return;
    try {
      await brandService.addAsset(brand.id, {
        asset_type: assetType,
        platform,
        identifier,
        official_url: officialUrl,
        publisher_or_developer_name: publisherName,
        is_verified: isVerified
      });
      setIsAssetModalOpen(false);
      setIdentifier('');
      setOfficialUrl('');
      setPublisherName('');
      loadBrand(brand.id);
    } catch (e: any) {
      alert("Failed to add official asset.");
    }
  };

  const handleToggleVerify = async (assetId: string) => {
    try {
      await brandService.toggleVerifyAsset(assetId);
      if (brand) loadBrand(brand.id);
    } catch (e) {
      alert("Failed to toggle verification status.");
    }
  };

  const handleDeleteAsset = async (assetId: string) => {
    if (!window.confirm("Remove this asset from your official registry?")) return;
    try {
      await brandService.deleteAsset(assetId);
      if (brand) loadBrand(brand.id);
    } catch (e) {
      alert("Failed to delete asset.");
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-slate-400 text-sm">Loading brand parameters...</div>;
  }

  return (
    <div className="p-6 sm:p-8 space-y-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-3">
        <Link
          to="/app/brands"
          className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold text-white">
            {isNew ? 'Register Protected Brand' : `Brand Profile: ${brand?.name}`}
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {isNew
              ? 'Configure official brand assets and domains for automated impersonation scanning.'
              : 'Manage official parameters and exclude trusted accounts from threat alerts.'}
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Brand Configuration Form */}
      <div className="p-6 sm:p-8 rounded-2xl bg-[#0d1322] border border-slate-800 shadow-xl">
        <form onSubmit={handleSaveBrand} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Brand / Trademark Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. AcmePay"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-teal-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Official Website URL *</label>
              <input
                type="url"
                required
                placeholder="https://acmepay.com"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-teal-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Industry Vertical</label>
              <select
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-teal-400"
              >
                <option value="Financial Services & FinTech">Financial Services & FinTech</option>
                <option value="E-Commerce & Retail">E-Commerce & Retail</option>
                <option value="Healthcare & Life Sciences">Healthcare & Life Sciences</option>
                <option value="Technology & SaaS">Technology & SaaS</option>
                <option value="Gaming & Entertainment">Gaming & Entertainment</option>
                <option value="Cryptocurrency & Web3">Cryptocurrency & Web3</option>
                <option value="Hospitality & Travel">Hospitality & Travel</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Official Logo Image URL</label>
              <input
                type="url"
                placeholder="https://acmepay.com/assets/logo.png"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-teal-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Legitimate Domain Whitelist (comma separated)
            </label>
            <input
              type="text"
              placeholder="acmepay.com, acmepay.io, acme-financial.com"
              value={domainsInput}
              onChange={(e) => setDomainsInput(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-teal-400 font-mono"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              External links pointing to these domains will not be flagged as phishing or domain mismatches.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Brand Keywords & Aliases (comma separated)
            </label>
            <input
              type="text"
              placeholder="AcmePay, Acme Pay, AcmePay Wallet, AcmePay Instant, Acme-Pay"
              value={keywordsInput}
              onChange={(e) => setKeywordsInput(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-teal-400"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Used by the look-alike engine for fuzzy matching, character swap detection, and phonetic transposition analysis.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Brand Description</label>
            <textarea
              rows={3}
              placeholder="Brief summary of legitimate products and business operations..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-teal-400 leading-relaxed"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-slate-950 font-bold text-sm shadow-lg shadow-teal-500/20 transition-all cursor-pointer"
            >
              {saving ? 'Saving Profile...' : isNew ? 'Create Brand Profile' : 'Update Brand Parameters'}
            </button>
          </div>
        </form>
      </div>

      {/* Official Assets Section (Only for existing brands) */}
      {!isNew && brand && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-teal-400" />
                <span>Enrolled Official Brand Assets</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Accounts and app store packages confirmed as verified are strictly excluded from impersonation alerts.
              </p>
            </div>

            <button
              onClick={() => setIsAssetModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 font-semibold text-xs border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-teal-400" /> Add Official Asset
            </button>
          </div>

          <div className="p-6 rounded-2xl bg-[#0d1322] border border-slate-800 shadow-xl">
            {brand.official_assets && brand.official_assets.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Asset Type</th>
                      <th className="py-3 px-4">Platform / Store</th>
                      <th className="py-3 px-4">Identifier / Package ID</th>
                      <th className="py-3 px-4">Official URL</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {brand.official_assets.map((asset) => (
                      <tr key={asset.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-4 font-semibold text-white">
                          {asset.asset_type === 'SOCIAL_ACCOUNT' ? (
                            <span className="inline-flex items-center gap-1.5 text-sky-400">
                              <Share2 className="w-3.5 h-3.5" /> Social Profile
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-teal-400">
                              <Smartphone className="w-3.5 h-3.5" /> Mobile App
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-medium">{asset.platform}</td>
                        <td className="py-3.5 px-4 font-mono text-slate-200">{asset.identifier}</td>
                        <td className="py-3.5 px-4">
                          <a
                            href={asset.official_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-teal-400 hover:underline inline-flex items-center gap-1 truncate max-w-[200px]"
                          >
                            <span>{asset.official_url}</span>
                            <ExternalLink className="w-3 h-3 flex-shrink-0" />
                          </a>
                        </td>
                        <td className="py-3.5 px-4">
                          <button
                            onClick={() => handleToggleVerify(asset.id)}
                            className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all cursor-pointer ${
                              asset.is_verified
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                : 'bg-slate-800 text-slate-400 border-slate-700'
                            }`}
                          >
                            {asset.is_verified ? '✓ Verified (Whitelisted)' : 'Unverified'}
                          </button>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => handleDeleteAsset(asset.id)}
                            className="p-1 rounded-lg text-slate-500 hover:text-red-400 transition-colors"
                            title="Remove Asset"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-slate-400">
                No official assets enrolled yet. Click "Add Official Asset" above to whitelist your legitimate social profiles or mobile app package IDs.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Asset Modal */}
      {isAssetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1">Add Official Brand Asset</h3>
            <p className="text-xs text-slate-400 mb-4">
              Whitelisted assets are permanently excluded from suspicious impersonation detections.
            </p>

            <form onSubmit={handleAddAsset} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Asset Type</label>
                <select
                  value={assetType}
                  onChange={(e) => setAssetType(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-teal-400"
                >
                  <option value="SOCIAL_ACCOUNT">Official Social Account</option>
                  <option value="MOBILE_APP">Official Mobile App</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Platform / Store</label>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-teal-400"
                >
                  {assetType === 'SOCIAL_ACCOUNT' ? (
                    <>
                      <option value="TWITTER_X">X (Twitter)</option>
                      <option value="INSTAGRAM">Instagram</option>
                      <option value="FACEBOOK">Facebook</option>
                      <option value="LINKEDIN">LinkedIn</option>
                      <option value="YOUTUBE">YouTube</option>
                      <option value="TIKTOK">TikTok</option>
                    </>
                  ) : (
                    <>
                      <option value="GOOGLE_PLAY">Google Play Store</option>
                      <option value="APPLE_APP_STORE">Apple App Store</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Identifier ({assetType === 'SOCIAL_ACCOUNT' ? 'Username / Handle' : 'Package ID / Bundle ID'}) *
                </label>
                <input
                  type="text"
                  required
                  placeholder={assetType === 'SOCIAL_ACCOUNT' ? '@acmepay' : 'com.acmepay.wallet'}
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-teal-400 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Official Asset URL *</label>
                <input
                  type="url"
                  required
                  placeholder="https://..."
                  value={officialUrl}
                  onChange={(e) => setOfficialUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-teal-400"
                />
              </div>

              {assetType === 'MOBILE_APP' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Official Publisher / Developer Name
                  </label>
                  <input
                    type="text"
                    placeholder="Acme Financial Corp"
                    value={publisherName}
                    onChange={(e) => setPublisherName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-teal-400"
                  />
                </div>
              )}

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="confirmLegit"
                  checked={isVerified}
                  onChange={(e) => setIsVerified(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-800 text-teal-500 focus:ring-teal-400"
                />
                <label htmlFor="confirmLegit" className="text-xs text-slate-300 cursor-pointer">
                  Confirm ownership and mark as verified official asset
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAssetModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-xl"
                >
                  Save Asset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
