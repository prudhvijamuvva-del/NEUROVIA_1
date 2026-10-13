import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Shield,
  Plus,
  ExternalLink,
  Globe,
  Tag,
  CheckCircle2,
  Trash2,
  Share2,
  Smartphone,
  AlertCircle
} from 'lucide-react';
import { brandService } from '../services/brandService';
import { Brand } from '../types';

export const BrandProfilesPage: React.FC = () => {
  const navigate = useNavigate();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBrands();
  }, []);

  const loadBrands = async () => {
    try {
      const data = await brandService.getBrands();
      setBrands(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete brand profile '${name}'? This will remove all associated threat telemetry.`)) {
      return;
    }
    try {
      await brandService.deleteBrand(id);
      setBrands(brands.filter((b) => b.id !== id));
    } catch (e) {
      alert("Failed to delete brand.");
    }
  };

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Protected Brand Profiles</h1>
          <p className="text-xs text-slate-400 mt-1">
            Define official identity parameters, registered domains, and verified accounts to eliminate false positives.
          </p>
        </div>

        <Link
          to="/app/brands/new"
          className="px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-teal-500/20 transition-all self-start"
        >
          <Plus className="w-4 h-4" /> Register New Brand
        </Link>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400 text-sm">Loading protected brands...</div>
      ) : brands.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800">
          <Shield className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white">No Brand Profiles Configured</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto mb-6">
            Register your first brand profile with its legitimate domains and official handles to begin automated scanning.
          </p>
          <Link
            to="/app/brands/new"
            className="px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add Your Brand Profile
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {brands.map((brand) => (
            <div
              key={brand.id}
              className="p-6 rounded-2xl bg-[#0d1322] border border-slate-800 hover:border-slate-700 shadow-xl transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-600 to-teal-500 flex items-center justify-center font-bold text-slate-950 text-xl shadow-md">
                      {brand.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-base leading-snug">{brand.name}</h3>
                      <span className="text-[11px] text-teal-400 font-medium block">{brand.industry}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDelete(brand.id, brand.name)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    title="Delete Brand"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-xs text-slate-400 line-clamp-2 mb-4 leading-relaxed">
                  {brand.description || 'No extended description recorded.'}
                </p>

                <div className="space-y-2 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <Globe className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                    <a
                      href={brand.website_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-teal-300 hover:underline truncate"
                    >
                      {brand.website_url}
                    </a>
                  </div>

                  {brand.legitimate_domains && brand.legitimate_domains.length > 0 && (
                    <div className="flex items-start gap-2">
                      <Shield className="w-3.5 h-3.5 text-slate-500 flex-shrink-0 mt-0.5" />
                      <div className="flex flex-wrap gap-1">
                        {brand.legitimate_domains.slice(0, 3).map((dom, i) => (
                          <span
                            key={i}
                            className="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-[10px] font-mono text-slate-300"
                          >
                            {dom}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {brand.keywords && brand.keywords.length > 0 && (
                    <div className="flex items-start gap-2 pt-1">
                      <Tag className="w-3.5 h-3.5 text-slate-500 flex-shrink-0 mt-0.5" />
                      <span className="text-[11px] text-slate-400 truncate">
                        Aliases: {brand.keywords.slice(0, 3).join(', ')}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-medium">
                  {brand.asset_count || 0} Official Assets Enrolled
                </span>

                <Link
                  to={`/app/brands/${brand.id}`}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-teal-300 text-xs font-semibold transition-colors flex items-center gap-1"
                >
                  <span>Manage Assets</span> <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
