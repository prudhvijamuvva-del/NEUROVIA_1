import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Shield,
  Share2,
  Smartphone,
  AlertTriangle,
  FolderSearch,
  FileBarChart,
  Bell,
  Settings,
  HelpCircle,
  LogOut,
  Database,
  ChevronLeft,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, setCollapsed }) => {
  const { user, organization, logout } = useAuth();

  const navItems = [
    { name: 'Dashboard', path: '/app/dashboard', icon: LayoutDashboard },
    { name: 'Brand Profiles', path: '/app/brands', icon: Shield },
    { name: 'Social Monitoring', path: '/app/social', icon: Share2 },
    { name: 'App Store Monitoring', path: '/app/apps', icon: Smartphone },
    { name: 'Threat Intelligence', path: '/app/threats', icon: AlertTriangle },
    { name: 'Investigations', path: '/app/investigations', icon: FolderSearch },
    { name: 'Reports', path: '/app/reports', icon: FileBarChart },
    { name: 'Notifications', path: '/app/notifications', icon: Bell },
    { name: 'Data Sources', path: '/app/sources', icon: Database },
    { name: 'Settings', path: '/app/settings', icon: Settings },
    { name: 'Help & Documentation', path: '/app/docs', icon: HelpCircle },
  ];

  return (
    <aside
      className={`h-screen sticky top-0 bg-[#090d16] border-r border-slate-800/80 flex flex-col transition-all duration-300 z-30 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-slate-800/60">
        {!collapsed ? (
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-teal-400 flex items-center justify-center shadow-lg shadow-teal-500/20">
              <ShieldAlert className="w-5 h-5 text-slate-950 font-bold" />
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-white block">
                Brand<span className="text-teal-400">Shield</span> AI
              </span>
              <span className="text-[10px] text-slate-400 tracking-wider uppercase font-semibold">
                Digital Risk Protection
              </span>
            </div>
          </div>
        ) : (
          <div className="mx-auto w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-teal-400 flex items-center justify-center shadow-lg">
            <ShieldAlert className="w-5 h-5 text-slate-950 font-bold" />
          </div>
        )}

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 py-4 px-3 overflow-y-auto space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                  isActive
                    ? 'bg-teal-500/15 text-teal-400 border border-teal-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
                }`
              }
              title={collapsed ? item.name : undefined}
            >
              <Icon className="w-5 h-5 flex-shrink-0 group-hover:scale-110 transition-transform" />
              {!collapsed && <span>{item.name}</span>}
            </NavLink>
          );
        })}
      </div>

      {/* User / Org Footer */}
      <div className="p-3 border-t border-slate-800/80 bg-[#070b13]">
        {!collapsed ? (
          <div className="mb-2 px-2 py-1.5 rounded-lg bg-slate-900/60 border border-slate-800">
            <p className="text-[11px] text-slate-400 font-medium truncate">{organization?.name || 'Protected Workspace'}</p>
            <p className="text-[10px] text-teal-400/90 font-mono uppercase">{organization?.role || 'ANALYST'} ACCESS</p>
          </div>
        ) : null}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-semibold text-teal-300">
              {user?.full_name?.charAt(0) || 'U'}
            </div>
            {!collapsed && (
              <div className="truncate">
                <p className="text-xs font-semibold text-slate-200 truncate">{user?.full_name || 'Security Analyst'}</p>
                <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
              </div>
            )}
          </div>

          <button
            onClick={logout}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
