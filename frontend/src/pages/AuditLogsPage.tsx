import React, { useState, useEffect } from "react";
import api from "../services/api";
import { Badge } from "../components/ui/Badge";
import { Filter } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export const AuditLogsPage: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState("");

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (actionFilter) params.action = actionFilter;
      const res = await api.get("/audit", { params });
      if (res.data?.success) {
        setLogs(res.data.logs);
      }
    } catch (err) {
      console.error("Failed to load audit logs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoading || !user) return;
    fetchLogs();
  }, [actionFilter, user?.id, isLoading]);

  const getActionBadge = (action: string) => {
    if (action.includes("APPROV")) return <Badge variant="success">{action}</Badge>;
    if (action.includes("REVOK") || action.includes("REJECT"))
      return <Badge variant="danger">{action}</Badge>;
    if (action.includes("RETURN")) return <Badge variant="warning">{action}</Badge>;
    return <Badge variant="navy">{action}</Badge>;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div>
        <h2 className="text-2xl font-bold text-[#1F2E4A] tracking-tight">
          Immutable Audit Trail
        </h2>
        <p className="text-xs text-[#343A40]/70 mt-1">
          Complete, tamper-evident chronological ledger of all administrative decisions, batch
          approvals, and certificate revocations
        </p>
      </div>

      {/* Filter bar */}
      <div className="glass-panel rounded-2xl p-4 flex items-center justify-between gap-4 border border-[#CED4DA]/40">
        <div className="flex items-center gap-2 overflow-x-auto">
          <Filter size={14} className="text-slate-400 shrink-0" />
          <button
            onClick={() => setActionFilter("")}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium cursor-pointer transition-colors ${
              actionFilter === "" ? "bg-[#1F2E4A] text-white" : "bg-white/60 text-[#343A40] hover:bg-white"
            }`}
          >
            All Actions
          </button>
          <button
            onClick={() => setActionFilter("DISTRICT_APPROVE")}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium cursor-pointer transition-colors ${
              actionFilter === "DISTRICT_APPROVE"
                ? "bg-[#1F2E4A] text-white"
                : "bg-white/60 text-[#343A40] hover:bg-white"
            }`}
          >
            District Endorsements
          </button>
          <button
            onClick={() => setActionFilter("STATE_FINAL_APPROVAL")}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium cursor-pointer transition-colors ${
              actionFilter === "STATE_FINAL_APPROVAL"
                ? "bg-[#1F2E4A] text-white"
                : "bg-white/60 text-[#343A40] hover:bg-white"
            }`}
          >
            State Approvals
          </button>
          <button
            onClick={() => setActionFilter("CERTIFICATE_REVOKED")}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium cursor-pointer transition-colors ${
              actionFilter === "CERTIFICATE_REVOKED"
                ? "bg-[#1F2E4A] text-white"
                : "bg-white/60 text-[#343A40] hover:bg-white"
            }`}
          >
            Revocations
          </button>
        </div>
      </div>

      {/* Logs Table */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-[#CED4DA]/40">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/70 border-b border-[#CED4DA]/60 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Officer / User</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Target Entity</th>
                <th className="py-3 px-4">Context Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#CED4DA]/40 bg-white/40">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    Loading audit trail...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    No logs recorded.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/80 transition-colors">
                    <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-[#1F2E4A]">
                      {log.user?.fullName || "System Engine"}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {log.user?.role?.replace(/_/g, " ") || "AUTOMATION"}
                    </td>
                    <td className="py-3.5 px-4">{getActionBadge(log.action)}</td>
                    <td className="py-3.5 px-4 font-medium text-slate-800">
                      {log.entityType}: {log.batch?.batchNumber || log.entityId}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 text-[11px] max-w-xs truncate">
                      {log.details || "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
