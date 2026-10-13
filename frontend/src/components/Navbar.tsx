import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bell,
  Plus,
  Play,
  Shield,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronDown,
  Sparkles
} from 'lucide-react';
import { Brand } from '../types';
import { brandService } from '../services/brandService';
import { monitoringService } from '../services/monitoringService';
import { threatService } from '../services/threatService';

interface NavbarProps {
  selectedBrand: Brand | null;
  setSelectedBrand: (brand: Brand | null) => void;
  brands: Brand[];
  onScanComplete?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  selectedBrand,
  setSelectedBrand,
  brands,
  onScanComplete
}) => {
  const navigate = useNavigate();
  const [unreadNotifications, setUnreadNotifications] = useState<number>(0);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchNotificationsCount();
  }, []);

  const fetchNotificationsCount = async () => {
    try {
      const items = await threatService.getNotifications();
      const unread = items.filter((n) => !n.is_read).length;
      setUnreadNotifications(unread);
    } catch (e) {
      // ignore
    }
  };

  const handleRunScan = async () => {
    if (!selectedBrand) {
      alert("Please create or select a brand profile first.");
      return;
    }
    setIsScanning(true);
    setScanMessage("Executing look-alike and impersonation scan...");
    try {
      await monitoringService.triggerSocialScan(selectedBrand.id);
      await monitoringService.triggerAppScan(selectedBrand.id);
      setScanMessage("Scan completed! Detections updated.");
      fetchNotificationsCount();
      if (onScanComplete) onScanComplete();
      setTimeout(() => setScanMessage(null), 3500);
    } catch (e: any) {
      setScanMessage(e.response?.data?.detail || "Scan execution failed.");
      setTimeout(() => setScanMessage(null), 4000);
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <header className="h-16 bg-[#090e1a]/90 backdrop-blur-md border-b border-slate-800/80 px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Brand Selector */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-teal-400" />
          <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Active Brand:</span>
          {brands.length > 0 ? (
            <div className="relative">
              <select
                value={selectedBrand?.id || ''}
                onChange={(e) => {
                  const b = brands.find((x) => x.id === e.target.value);
                  if (b) setSelectedBrand(b);
                }}
                className="bg-slate-900 border border-slate-700/80 text-white text-sm font-semibold rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-400 cursor-pointer pr-8"
              >
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.industry})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <span className="text-sm font-semibold text-amber-400">No brand profiles registered</span>
          )}
        </div>

        {/* Demo Telemetry Indicator */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-mono">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Demo & Heuristic Engine Active</span>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex items-center gap-3">
        {scanMessage && (
          <span className="text-xs text-teal-300 font-medium bg-teal-500/10 border border-teal-500/20 px-3 py-1 rounded-lg animate-fade-in">
            {scanMessage}
          </span>
        )}

        <button
          onClick={handleRunScan}
          disabled={isScanning || !selectedBrand}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-slate-950 text-sm font-semibold shadow-lg shadow-teal-500/20 transition-all cursor-pointer"
        >
          <Play className={`w-4 h-4 fill-current ${isScanning ? 'animate-spin' : ''}`} />
          <span>{isScanning ? 'Scanning...' : 'Run Scan'}</span>
        </button>

        <Link
          to="/app/brands/new"
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium border border-slate-700 transition-colors"
        >
          <Plus className="w-4 h-4 text-teal-400" />
          <span>Add Brand</span>
        </Link>

        {/* Notifications Icon */}
        <Link
          to="/app/notifications"
          className="relative p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          title="Notifications"
        >
          <Bell className="w-5 h-5" />
          {unreadNotifications > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center animate-pulse">
              {unreadNotifications}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
};
