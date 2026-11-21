import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { GlassCard } from "../components/ui/GlassCard";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import {
  Layers,
  Award,
  Users,
  CheckCircle,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  Send,
  Building,
} from "lucide-react";
import { Link } from "react-router-dom";

export const DashboardPage: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isLoading || !user) return;
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const res = await api.get("/dashboard/stats");
        if (res.data?.success) {
          setData(res.data.stats);
        }
      } catch (err) {
        console.error("Dashboard error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();

    const handleFocus = () => {
      fetchDashboard();
    };
    window.addEventListener("focus", handleFocus);
    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, [user?.id, user?.role, isLoading]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center gap-3 text-sm text-[#343A40]/70">
          <div className="w-5 h-5 border-2 border-[#1F2E4A] border-t-transparent rounded-full animate-spin" />
          <span>Loading platform insights...</span>
        </div>
      </div>
    );
  }

  const role = user?.role;
  const roleStats = data?.roleStats || {};
  const stuckBatches = data?.stuckBatches || [];
  const recentLogs = data?.recentAuditLogs || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Top Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#1F2E4A] tracking-tight">
            Welcome back, {user?.fullName}
          </h2>
          <p className="text-xs text-[#343A40]/70 mt-1">
            {user?.department || "State Directorate of Vocational Training"} •{" "}
            {user?.district || "Central State Administration"}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
          {role === "TRAINING_CENTRE" && (
            <Link to="/batches?tab=upload">
              <Button icon={<ArrowUpRight size={16} />}>Upload New Batch</Button>
            </Link>
          )}
          {role === "DISTRICT_OFFICER" && (
            <Link to="/approvals">
              <Button icon={<CheckCircle size={16} />}>Review Pending Batches</Button>
            </Link>
          )}
          {role === "QUALITY_TEAM" && (
            <Link to="/quality">
              <Button icon={<ShieldCheck size={16} />}>Inspect Flagged Batches</Button>
            </Link>
          )}
          {role === "STATE_OFFICE" && (
            <Link to="/approvals">
              <Button icon={<CheckCircle size={16} />}>Final Approvals</Button>
            </Link>
          )}
        </div>
      </div>

      {/* Moment 5: SLA Stuck Batches Alert Banner */}
      {stuckBatches.length > 0 && (
        <div className="glass-card bg-amber-50/90 border-amber-300 rounded-2xl p-5 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-900 flex items-center justify-center shrink-0 mt-0.5">
              <AlertTriangle size={20} className="text-amber-700" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-sm text-amber-900">
                  Automated SLA Escalation: {stuckBatches.length} Batch(es) Untouched &gt; 48 Hours
                </h4>
                <Badge variant="warning" dot>
                  Requires Attention
                </Badge>
              </div>
              <p className="text-xs text-amber-800/80 mt-1">
                The system automatically monitors file stagnation. The following batches have been
                waiting without officer review and have been flagged for senior oversight:
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {stuckBatches.map((b: any) => (
                  <Link
                    key={b.id}
                    to={`/batches/${b.id}`}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/90 border border-amber-200 text-xs font-semibold text-amber-900 hover:bg-white shadow-xs"
                  >
                    <Clock size={12} className="text-amber-600" />
                    <span>{b.batchNumber}</span>
                    <span className="text-[10px] text-slate-500">
                      ({b.trainingCentre?.district || "District"})
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {role === "TRAINING_CENTRE" ? (
          <>
            <GlassCard>
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-semibold uppercase tracking-wider">My Batches</span>
                <Layers size={18} className="text-[#1F2E4A]" />
              </div>
              <div className="text-3xl font-extrabold text-[#1F2E4A] mt-3">
                {roleStats.myBatches || 0}
              </div>
              <div className="text-xs text-[#343A40]/70 mt-1">
                {roleStats.myInReview || 0} currently under review
              </div>
            </GlassCard>

            <GlassCard>
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-semibold uppercase tracking-wider">Approved</span>
                <CheckCircle size={18} className="text-emerald-600" />
              </div>
              <div className="text-3xl font-extrabold text-emerald-800 mt-3">
                {roleStats.myApproved || 0}
              </div>
              <div className="text-xs text-[#343A40]/70 mt-1">Fully certified batches</div>
            </GlassCard>

            <GlassCard>
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-semibold uppercase tracking-wider">Returned / Fix</span>
                <AlertTriangle size={18} className="text-amber-600" />
              </div>
              <div className="text-3xl font-extrabold text-amber-800 mt-3">
                {roleStats.myReturned || 0}
              </div>
              <div className="text-xs text-[#343A40]/70 mt-1">Requires corrections</div>
            </GlassCard>

            <GlassCard>
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-semibold uppercase tracking-wider">Candidates</span>
                <Users size={18} className="text-[#1F2E4A]" />
              </div>
              <div className="text-3xl font-extrabold text-[#1F2E4A] mt-3">
                {data?.totalCandidates || 0}
              </div>
              <div className="text-xs text-[#343A40]/70 mt-1">Total registered students</div>
            </GlassCard>
          </>
        ) : role === "DISTRICT_OFFICER" ? (
          <>
            <GlassCard>
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-semibold uppercase tracking-wider">Awaiting District</span>
                <Clock size={18} className="text-amber-600" />
              </div>
              <div className="text-3xl font-extrabold text-amber-800 mt-3">
                {roleStats.pendingDistrict || 0}
              </div>
              <div className="text-xs text-[#343A40]/70 mt-1">Requires officer endorsement</div>
            </GlassCard>

            <GlassCard>
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-semibold uppercase tracking-wider">My Endorsements</span>
                <CheckCircle size={18} className="text-emerald-600" />
              </div>
              <div className="text-3xl font-extrabold text-emerald-800 mt-3">
                {roleStats.alreadyEndorsedByMe || 0}
              </div>
              <div className="text-xs text-[#343A40]/70 mt-1">Batches endorsed by you</div>
            </GlassCard>

            <GlassCard>
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-semibold uppercase tracking-wider">District Total</span>
                <Building size={18} className="text-[#1F2E4A]" />
              </div>
              <div className="text-3xl font-extrabold text-[#1F2E4A] mt-3">
                {roleStats.districtTotal || 0}
              </div>
              <div className="text-xs text-[#343A40]/70 mt-1">{roleStats.districtName}</div>
            </GlassCard>

            <GlassCard>
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-semibold uppercase tracking-wider">Certificates Issued</span>
                <Award size={18} className="text-[#1F2E4A]" />
              </div>
              <div className="text-3xl font-extrabold text-[#1F2E4A] mt-3">
                {data?.totalCertificates || 0}
              </div>
              <div className="text-xs text-[#343A40]/70 mt-1">Official state credentials</div>
            </GlassCard>
          </>
        ) : (
          <>
            <GlassCard>
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-semibold uppercase tracking-wider">Total Batches</span>
                <Layers size={18} className="text-[#1F2E4A]" />
              </div>
              <div className="text-3xl font-extrabold text-[#1F2E4A] mt-3">
                {data?.totalBatches || 0}
              </div>
              <div className="text-xs text-[#343A40]/70 mt-1">Across all districts</div>
            </GlassCard>

            <GlassCard>
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-semibold uppercase tracking-wider">Certificates Issued</span>
                <Award size={18} className="text-emerald-600" />
              </div>
              <div className="text-3xl font-extrabold text-emerald-800 mt-3">
                {data?.totalCertificates || 0}
              </div>
              <div className="text-xs text-[#343A40]/70 mt-1">Verifiable via QR & portal</div>
            </GlassCard>

            <GlassCard>
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-semibold uppercase tracking-wider">WhatsApp Delivered</span>
                <Send size={18} className="text-emerald-600" />
              </div>
              <div className="text-3xl font-extrabold text-emerald-800 mt-3">
                {data?.deliveredWhatsApp || 0}
              </div>
              <div className="text-xs text-[#343A40]/70 mt-1">Simulated delivery stream</div>
            </GlassCard>

            <GlassCard>
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-semibold uppercase tracking-wider">Revoked Credentials</span>
                <AlertTriangle size={18} className="text-rose-600" />
              </div>
              <div className="text-3xl font-extrabold text-rose-800 mt-3">
                {data?.revokedCertificates || 0}
              </div>
              <div className="text-xs text-[#343A40]/70 mt-1">Instant public blacklist</div>
            </GlassCard>
          </>
        )}
      </div>

      {/* Main Section: Quick Actions + Real-time Audit Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Workflow Overview Card */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-6 border border-[#CED4DA]/40">
          <div className="flex items-center justify-between pb-4 border-b border-[#CED4DA]/40">
            <div>
              <h3 className="font-bold text-base text-[#1F2E4A]">Pragati Skills Workflow Stepper</h3>
              <p className="text-xs text-[#343A40]/70">
                End-to-end governed verification lifecycle
              </p>
            </div>
            <Badge variant="navy">Governed</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <div className="p-4 rounded-xl bg-white/70 border border-[#CED4DA]/50">
              <div className="w-7 h-7 rounded-lg bg-[#1F2E4A]/10 text-[#1F2E4A] font-bold text-xs flex items-center justify-center">
                1
              </div>
              <h5 className="font-bold text-xs text-[#1F2E4A] mt-2.5">Batch Upload</h5>
              <p className="text-[11px] text-[#343A40]/70 mt-1">
                Training Centre uploads Excel with strict atomic validation.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white/70 border border-[#CED4DA]/50">
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-800 font-bold text-xs flex items-center justify-center">
                2
              </div>
              <h5 className="font-bold text-xs text-[#1F2E4A] mt-2.5">District Quorum</h5>
              <p className="text-[11px] text-[#343A40]/70 mt-1">
                Requires 2 distinct district officers to endorse. Concurrency protected.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white/70 border border-[#CED4DA]/50">
              <div className="w-7 h-7 rounded-lg bg-sky-500/10 text-sky-800 font-bold text-xs flex items-center justify-center">
                3
              </div>
              <h5 className="font-bold text-xs text-[#1F2E4A] mt-2.5">Quality Audit</h5>
              <p className="text-[11px] text-[#343A40]/70 mt-1">
                Batches &gt; 20 candidates audited by State Quality Team.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white/70 border border-[#CED4DA]/50">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-800 font-bold text-xs flex items-center justify-center">
                4
              </div>
              <h5 className="font-bold text-xs text-[#1F2E4A] mt-2.5">State & QR Issue</h5>
              <p className="text-[11px] text-[#343A40]/70 mt-1">
                Final approval triggers PDF generation & WhatsApp delivery.
              </p>
            </div>
          </div>
        </div>

        {/* Real-time Activity Feed */}
        <div className="glass-panel rounded-2xl p-6 border border-[#CED4DA]/40">
          <div className="flex items-center justify-between pb-3 border-b border-[#CED4DA]/40">
            <h3 className="font-bold text-sm text-[#1F2E4A]">Recent Activity</h3>
            <Link to="/audit" className="text-xs text-[#1F2E4A] font-semibold hover:underline">
              View all
            </Link>
          </div>

          <div className="mt-4 space-y-3">
            {recentLogs.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center italic">
                No recent activity recorded yet. Activities will appear as batches are processed.
              </p>
            ) : (
              recentLogs.slice(0, 5).map((log: any) => (
                <div key={log.id} className="flex items-start gap-3 text-xs">
                  <div className="w-2 h-2 rounded-full bg-[#1F2E4A] mt-1.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[#1F2E4A] truncate">
                      {log.action.replace(/_/g, " ")}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">
                      {log.user?.fullName || "System"} • {new Date(log.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

