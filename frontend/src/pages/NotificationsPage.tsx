import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bell, CheckCheck, AlertTriangle, Info, ShieldAlert, Clock, ArrowRight } from 'lucide-react';
import { threatService } from '../services/threatService';
import { AppNotification } from '../types';

export const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const data = await threatService.getNotifications();
      setNotifications(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await threatService.markAllNotificationsRead();
      setNotifications(notifications.map((n) => ({ ...n, is_read: true })));
    } catch (e) {
      alert("Failed to mark notifications as read.");
    }
  };

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2.5">
            <Bell className="w-6 h-6 text-teal-400" />
            <span>Alert & Notification Center</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time security telemetry notifications for newly detected high and critical risks.
          </p>
        </div>

        <button
          onClick={handleMarkAllRead}
          className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 font-semibold text-xs border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <CheckCheck className="w-4 h-4" /> Mark All as Read
        </button>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">Loading security notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800">
            <Bell className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-white">No notifications at this time</p>
            <p className="text-xs text-slate-400 mt-1">You will receive alerts here when high or critical threats are detected.</p>
          </div>
        ) : (
          notifications.map((item) => (
            <div
              key={item.id}
              className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-4 ${
                !item.is_read
                  ? 'bg-slate-900/90 border-teal-500/30 shadow-lg shadow-teal-500/5'
                  : 'bg-[#0d1322] border-slate-800/80'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`p-2 rounded-xl border mt-0.5 ${
                    item.severity === 'CRITICAL'
                      ? 'bg-red-500/10 text-red-400 border-red-500/20'
                      : item.severity === 'WARNING'
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      : 'bg-teal-500/10 text-teal-400 border-teal-500/20'
                  }`}
                >
                  {item.severity === 'CRITICAL' ? (
                    <ShieldAlert className="w-4 h-4" />
                  ) : item.severity === 'WARNING' ? (
                    <AlertTriangle className="w-4 h-4" />
                  ) : (
                    <Info className="w-4 h-4" />
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold text-white">{item.title}</h3>
                    {!item.is_read && (
                      <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
                    )}
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">{item.message}</p>
                  <span className="text-[10px] text-slate-500 flex items-center gap-1 mt-1.5">
                    <Clock className="w-3 h-3" /> {new Date(item.created_at).toLocaleString()}
                  </span>
                </div>
              </div>

              {item.threat_id && (
                <Link
                  to={`/app/threats/${item.threat_id}`}
                  className="px-3 py-1.5 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 font-semibold text-xs border border-teal-500/20 transition-colors flex items-center gap-1 flex-shrink-0"
                >
                  <span>Investigate</span> <ArrowRight className="w-3 h-3" />
                </Link>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
