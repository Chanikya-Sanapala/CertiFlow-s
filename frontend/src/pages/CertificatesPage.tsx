import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import {
  Search,
  ExternalLink,
  ShieldAlert,
  Send,
  RotateCw,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Info,
  Clock,
  History,
  XCircle,
  Sparkles,
} from "lucide-react";

export const CertificatesPage: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [certificates, setCertificates] = useState<any[]>([]);
  const [deliveryStats, setDeliveryStats] = useState<any>({
    total: 0,
    queued: 0,
    processing: 0,
    simulatedSent: 0,
    retrying: 0,
    failed: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [revokeModalOpen, setRevokeModalOpen] = useState(false);
  const [selectedCert, setSelectedCert] = useState<any>(null);
  const [revokeReason, setRevokeReason] = useState("");
  const [revokeLoading, setRevokeLoading] = useState(false);

  // Delivery log modal
  const [logModalOpen, setLogModalOpen] = useState(false);
  const [activeDelivery, setActiveDelivery] = useState<any>(null);

  const [notification, setNotification] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchCertificatesAndStats = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (statusFilter) params.status = statusFilter;
      if (searchTerm) params.search = searchTerm;

      const [certRes, deliveryRes] = await Promise.all([
        api.get("/certificates", { params }),
        api.get("/certificates/deliveries/summary"),
      ]);

      if (certRes.data?.success) {
        setCertificates(certRes.data.certificates);
      }
      if (deliveryRes.data?.success) {
        setDeliveryStats(deliveryRes.data.stats || {});
      }
    } catch (err) {
      console.error("Failed to fetch certificates or delivery data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoading || !user) return;
    fetchCertificatesAndStats();
  }, [statusFilter, user?.id, isLoading]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCertificatesAndStats();
  };

  const handleRevokeConfirm = async () => {
    if (!selectedCert || !revokeReason.trim()) return;

    try {
      setRevokeLoading(true);
      const res = await api.post(`/certificates/${selectedCert.id}/revoke`, {
        reason: revokeReason,
      });

      if (res.data?.success) {
        setNotification({
          type: "success",
          text: `Certificate ${selectedCert.certificateNumber} revoked. Public lookup now immediately reflects REVOKED status.`,
        });
        setRevokeModalOpen(false);
        setRevokeReason("");
        setSelectedCert(null);
        fetchCertificatesAndStats();
      }
    } catch (err: any) {
      setNotification({
        type: "error",
        text: err.response?.data?.message || "Failed to revoke certificate",
      });
    } finally {
      setRevokeLoading(false);
    }
  };

  const handleRetryDelivery = async (deliveryId: string) => {
    try {
      setActionLoading(true);
      const res = await api.post(`/certificates/deliveries/${deliveryId}/retry`);
      if (res.data?.success) {
        setNotification({ type: "success", text: res.data.message });
        setLogModalOpen(false);
        fetchCertificatesAndStats();
      }
    } catch (err: any) {
      setNotification({
        type: "error",
        text: err.response?.data?.message || "Failed to retry delivery",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSimulateTest = async (behavior: "retry" | "success" | "permanent_fail") => {
    try {
      setActionLoading(true);
      const res = await api.post("/certificates/deliveries/simulate-test", { behavior });
      if (res.data?.success) {
        setNotification({ type: "success", text: res.data.message });
        setTimeout(() => fetchCertificatesAndStats(), 1000);
      }
    } catch (err: any) {
      setNotification({
        type: "error",
        text: err.response?.data?.message || "Failed to simulate test delivery",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const role = user?.role;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#1F2E4A] tracking-tight">
            Issued Credentials & Delivery Hub
          </h2>
          <p className="text-xs text-[#343A40]/70 mt-1">
            Browse authentic Pragati Skills Mission credentials, monitor simulated WhatsApp background jobs, or execute instant revocation
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/verify" target="_blank" rel="noopener noreferrer">
            <Button variant="secondary" icon={<ExternalLink size={14} />}>
              Test Public Verification Portal
            </Button>
          </Link>
        </div>
      </div>

      {notification && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center justify-between gap-2 animate-in fade-in ${
            notification.type === "success"
              ? "bg-emerald-50 text-emerald-900 border-emerald-300"
              : "bg-rose-50 text-rose-900 border-rose-300"
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === "success" ? (
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle size={16} className="text-rose-600 shrink-0" />
            )}
            <span>{notification.text}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-xs font-bold text-slate-400 hover:text-slate-700"
          >
            ×
          </button>
        </div>
      )}

      {/* WhatsApp Delivery Stream & Background Worker Dashboard (Requirement 10 & 11) */}
      <div className="glass-panel p-5 sm:p-6 rounded-2xl border border-sky-200/80 bg-gradient-to-br from-white/95 via-sky-50/50 to-white/95 shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-sky-100">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-[#1F2E4A] text-white shrink-0 shadow-sm mt-0.5">
              <Send size={18} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-extrabold text-sm text-[#1F2E4A]">
                  WhatsApp Delivery Stream (BullMQ Background Worker)
                </span>
                <span className="text-[10px] font-extrabold uppercase tracking-wide px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                  Demo Simulation Active
                </span>
              </div>
              <p className="text-xs text-sky-950/80 font-bold mt-1 flex items-center gap-1.5">
                <Info size={13} className="text-sky-600 shrink-0" />
                <span>DEMO MODE — WhatsApp delivery simulated. No actual message was sent.</span>
              </p>
            </div>
          </div>

          {/* Interactive Simulation Controls for Reviewers */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleSimulateTest("retry")}
              disabled={actionLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white hover:bg-amber-50 text-amber-900 border border-amber-300 transition-colors shadow-xs cursor-pointer disabled:opacity-50"
              title="Dispatches a test job with 504 Gateway Timeout on attempt 1 to demonstrate BullMQ automatic retry"
            >
              <RotateCw size={13} className={actionLoading ? "animate-spin" : "text-amber-600"} />
              <span>Simulate Carrier Timeout & Retry</span>
            </button>
            <button
              onClick={() => handleSimulateTest("success")}
              disabled={actionLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white hover:bg-emerald-50 text-emerald-900 border border-emerald-300 transition-colors shadow-xs cursor-pointer disabled:opacity-50"
              title="Dispatches an instant successful simulated delivery"
            >
              <Sparkles size={13} className="text-emerald-600" />
              <span>Simulate Instant Success</span>
            </button>
          </div>
        </div>

        {/* 6 Delivery Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 mt-4">
          <div className="bg-white/90 p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Recipients</span>
            <span className="text-2xl font-extrabold text-[#1F2E4A] mt-1 block">
              {deliveryStats.total || 0}
            </span>
            <span className="text-[10px] text-slate-400 font-medium">1 job per candidate</span>
          </div>

          <div className="bg-white/90 p-3.5 rounded-xl border border-amber-200/80 shadow-xs">
            <span className="text-[10px] uppercase font-bold text-amber-700 block">Queued</span>
            <span className="text-2xl font-extrabold text-amber-800 mt-1 block">
              {deliveryStats.queued || 0}
            </span>
            <span className="text-[10px] text-amber-600 font-medium">Awaiting worker pick</span>
          </div>

          <div className="bg-white/90 p-3.5 rounded-xl border border-blue-200/80 shadow-xs">
            <span className="text-[10px] uppercase font-bold text-blue-700 block">Processing</span>
            <span className="text-2xl font-extrabold text-blue-800 mt-1 block">
              {deliveryStats.processing || 0}
            </span>
            <span className="text-[10px] text-blue-600 font-medium">Active in BullMQ</span>
          </div>

          <div className="bg-white/90 p-3.5 rounded-xl border border-emerald-200/80 shadow-xs">
            <span className="text-[10px] uppercase font-bold text-emerald-700 block">Simulated Sent</span>
            <span className="text-2xl font-extrabold text-emerald-800 mt-1 block">
              {deliveryStats.simulatedSent || 0}
            </span>
            <span className="text-[10px] text-emerald-600 font-medium">Delivered (Simulated)</span>
          </div>

          <div className="bg-white/90 p-3.5 rounded-xl border border-orange-200/80 shadow-xs">
            <span className="text-[10px] uppercase font-bold text-orange-700 block">Retrying</span>
            <span className="text-2xl font-extrabold text-orange-800 mt-1 block">
              {deliveryStats.retrying || 0}
            </span>
            <span className="text-[10px] text-orange-600 font-medium">Backoff active</span>
          </div>

          <div className="bg-white/90 p-3.5 rounded-xl border border-rose-200/80 shadow-xs">
            <span className="text-[10px] uppercase font-bold text-rose-700 block">Failed</span>
            <span className="text-2xl font-extrabold text-rose-800 mt-1 block">
              {deliveryStats.failed || 0}
            </span>
            <span className="text-[10px] text-rose-600 font-medium">Max attempts exceeded</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 border border-[#CED4DA]/40">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <Search size={15} className="absolute left-3.5 top-3 text-[#343A40]/50" />
          <input
            type="text"
            placeholder="Search certificate # or candidate..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-white/80 border border-[#CED4DA] focus:border-[#1F2E4A] outline-none text-[#343A40]"
          />
        </form>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setStatusFilter("")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
              statusFilter === "" ? "bg-[#1F2E4A] text-white" : "bg-white/60 text-[#343A40] hover:bg-white"
            }`}
          >
            All Credentials
          </button>
          <button
            onClick={() => setStatusFilter("ISSUED")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
              statusFilter === "ISSUED" ? "bg-[#1F2E4A] text-white" : "bg-white/60 text-[#343A40] hover:bg-white"
            }`}
          >
            Valid (Issued)
          </button>
          <button
            onClick={() => setStatusFilter("REVOKED")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
              statusFilter === "REVOKED"
                ? "bg-[#1F2E4A] text-white"
                : "bg-white/60 text-[#343A40] hover:bg-white"
            }`}
          >
            Revoked
          </button>
        </div>
      </div>

      {/* Credentials and WhatsApp Deliveries Table */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-[#CED4DA]/40 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/70 border-b border-[#CED4DA]/60 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-5">Certificate ID</th>
                <th className="py-3.5 px-5">Candidate Name</th>
                <th className="py-3.5 px-5">Course / Trade</th>
                <th className="py-3.5 px-5">District</th>
                <th className="py-3.5 px-5">WhatsApp Status</th>
                <th className="py-3.5 px-5">Registry State</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#CED4DA]/40 bg-white/40">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-[#1F2E4A] border-t-transparent rounded-full animate-spin" />
                      <span>Loading credentials and delivery statuses...</span>
                    </div>
                  </td>
                </tr>
              ) : certificates.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    {searchTerm || statusFilter
                      ? "No certificates found matching filter criteria."
                      : "No certificates have been issued yet. Certificates will appear here once batches receive State Director final authorization."}
                  </td>
                </tr>
              ) : (
                certificates.map((cert) => {
                  const delivery = cert.deliveries?.[0];
                  const isRevoked = cert.status === "REVOKED";

                  // Delivery status rendering
                  let deliveryBadge = (
                    <span className="text-slate-400 text-[11px]">No Delivery Record</span>
                  );

                  if (delivery) {
                    if (
                      delivery.status === "SIMULATED_SENT" ||
                      delivery.status === "DELIVERED"
                    ) {
                      deliveryBadge = (
                        <button
                          onClick={() => {
                            setActiveDelivery(delivery);
                            setLogModalOpen(true);
                          }}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-[11px] hover:bg-emerald-100 cursor-pointer transition-colors"
                          title="Click to view simulated delivery receipt and payload logs"
                        >
                          <Send size={11} className="text-emerald-600" />
                          <span>Simulated Sent</span>
                        </button>
                      );
                    } else if (delivery.status === "RETRYING") {
                      deliveryBadge = (
                        <button
                          onClick={() => {
                            setActiveDelivery(delivery);
                            setLogModalOpen(true);
                          }}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-orange-50 text-orange-800 border border-orange-200 font-bold text-[11px] hover:bg-orange-100 cursor-pointer transition-colors"
                          title="Click to view failure cause and scheduled retry"
                        >
                          <RotateCw size={11} className="text-orange-600 animate-spin" />
                          <span>Retrying ({delivery.attempts}/3)</span>
                        </button>
                      );
                    } else if (delivery.status === "FAILED") {
                      deliveryBadge = (
                        <button
                          onClick={() => {
                            setActiveDelivery(delivery);
                            setLogModalOpen(true);
                          }}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 text-rose-800 border border-rose-200 font-bold text-[11px] hover:bg-rose-100 cursor-pointer transition-colors"
                          title="Click to view permanent error log"
                        >
                          <XCircle size={11} className="text-rose-600" />
                          <span>Failed (3/3)</span>
                        </button>
                      );
                    } else if (
                      delivery.status === "PROCESSING" ||
                      delivery.status === "SENDING"
                    ) {
                      deliveryBadge = (
                        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 border border-blue-200 font-bold text-[11px]">
                          <div className="w-2.5 h-2.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                          <span>Processing...</span>
                        </span>
                      );
                    } else {
                      deliveryBadge = (
                        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-bold text-[11px]">
                          <Clock size={11} />
                          <span>Queued</span>
                        </span>
                      );
                    }
                  }

                  return (
                    <tr
                      key={cert.id}
                      className={`hover:bg-white/80 transition-colors ${
                        isRevoked ? "bg-rose-50/20" : ""
                      }`}
                    >
                      <td className="py-4 px-5 font-mono font-bold text-[#1F2E4A]">
                        {cert.certificateNumber}
                      </td>
                      <td className="py-4 px-5">
                        <div className="font-semibold text-slate-800">
                          {cert.candidate?.fullName}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {cert.candidate?.phone}
                        </div>
                      </td>
                      <td className="py-4 px-5">
                        <div className="font-medium text-slate-800">{cert.courseName}</div>
                        <div className="text-[10px] text-slate-500">
                          Grade {cert.grade} ({cert.marksObtained}%)
                        </div>
                      </td>
                      <td className="py-4 px-5 text-slate-700 font-medium">{cert.district}</td>
                      <td className="py-4 px-5">{deliveryBadge}</td>
                      <td className="py-4 px-5">
                        {isRevoked ? (
                          <Badge variant="danger">Revoked</Badge>
                        ) : (
                          <Badge variant="success">Issued</Badge>
                        )}
                      </td>
                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Official PDF Download */}
                          <a
                            href={`http://localhost:5000/api/certificates/${cert.certificateNumber}/pdf`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg border border-[#CED4DA] bg-white hover:bg-slate-50 text-[#1F2E4A] transition-colors inline-flex items-center gap-1 text-[11px] font-bold shadow-xs"
                            title="Download Official PDF Certificate"
                          >
                            <FileText size={13} />
                            <span className="hidden sm:inline">PDF</span>
                          </a>

                          {/* Public Verification Link */}
                          <Link
                            to={`/verify/${cert.certificateNumber}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg border border-[#CED4DA] bg-white hover:bg-slate-50 text-[#1F2E4A] transition-colors inline-flex items-center text-[11px] font-bold shadow-xs"
                            title="Open Public Verification"
                          >
                            <ExternalLink size={13} />
                          </Link>

                          {/* State Office Revoke Action */}
                          {role === "STATE_OFFICE" && !isRevoked && (
                            <button
                              onClick={() => {
                                setSelectedCert(cert);
                                setRevokeModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 transition-colors inline-flex items-center text-[11px] font-bold cursor-pointer shadow-xs"
                              title="Revoke Certificate"
                            >
                              <ShieldAlert size={13} />
                              <span className="hidden sm:inline ml-1">Revoke</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Revocation Modal */}
      <Modal
        isOpen={revokeModalOpen}
        onClose={() => setRevokeModalOpen(false)}
        title="Revoke Official Skill Certificate"
      >
        <div className="space-y-4">
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs">
            <span className="font-bold block mb-1">
              Warning: Revocation takes immediate effect on the Public Portal
            </span>
            Revoking certificate <code className="font-mono font-bold">{selectedCert?.certificateNumber}</code> for candidate <span className="font-bold">{selectedCert?.candidate?.fullName}</span> will invalidate it permanently. Prospective employers scanning the QR code will be warned immediately.
          </div>

          <div>
            <label className="block text-xs font-bold text-[#1F2E4A] mb-1">
              Official Revocation Reason (Publicly Disclosed)
            </label>
            <textarea
              value={revokeReason}
              onChange={(e) => setRevokeReason(e.target.value)}
              placeholder="e.g. Biometric attendance fraud confirmed during State Audit investigation #SAR-2026-90."
              rows={3}
              className="w-full p-3 rounded-xl border border-[#CED4DA] text-xs outline-none focus:border-[#1F2E4A] text-[#343A40]"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setRevokeModalOpen(false)}
              disabled={revokeLoading}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleRevokeConfirm}
              disabled={revokeLoading || !revokeReason.trim()}
              icon={<ShieldAlert size={14} />}
            >
              {revokeLoading ? "Revoking..." : "Confirm Revocation"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delivery History & Audit Log Inspector Modal */}
      <Modal
        isOpen={logModalOpen}
        onClose={() => setLogModalOpen(false)}
        title="WhatsApp Delivery Job Inspector & History"
      >
        <div className="space-y-4 text-xs">
          <div className="p-3.5 rounded-xl bg-sky-50 border border-sky-200 text-sky-950 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-sky-700 block">Delivery Channel</span>
              <span className="font-mono font-bold text-sm">WHATSAPP_SIMULATED</span>
              <span className="text-[10px] text-sky-800 block mt-0.5">
                DEMO MODE — Delivery simulated via BullMQ background worker
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-sky-700 block">Current Status</span>
              <span className="font-bold text-xs uppercase px-2 py-0.5 rounded-md bg-white border border-sky-300">
                {activeDelivery?.status || "UNKNOWN"}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 bg-white p-3 rounded-xl border border-slate-200">
            <div>
              <span className="text-slate-400 text-[10px] block">Recipient Phone</span>
              <span className="font-mono font-bold text-slate-800">{activeDelivery?.recipientPhone}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] block">Idempotency Key</span>
              <span className="font-mono font-bold text-slate-800">{activeDelivery?.idempotencyKey}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] block">Simulated Message ID</span>
              <span className="font-mono font-bold text-emerald-700">
                {activeDelivery?.simulatedMessageId || "None"}
              </span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] block">Total Attempts</span>
              <span className="font-bold text-slate-800">
                {activeDelivery?.attempts || 0} / {activeDelivery?.maxAttempts || 3}
              </span>
            </div>
          </div>

          {activeDelivery?.lastError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900">
              <span className="font-bold block mb-1">Last Error Logged:</span>
              <code className="text-[11px] font-mono break-all">{activeDelivery.lastError}</code>
            </div>
          )}

          {/* Attempt History Timeline */}
          <div>
            <h4 className="font-bold text-slate-700 mb-2 flex items-center gap-1.5">
              <History size={14} />
              <span>Processing History Logs</span>
            </h4>
            <div className="space-y-2 border-l-2 border-slate-200 pl-3 ml-1.5">
              {(() => {
                let logs: any[] = [];
                try {
                  if (activeDelivery?.logs) {
                    logs = typeof activeDelivery.logs === "string" ? JSON.parse(activeDelivery.logs) : activeDelivery.logs;
                  }
                } catch {
                  logs = [];
                }

                if (logs.length === 0) {
                  return (
                    <div className="text-slate-400 text-[11px] italic">
                      Job dispatched with idempotency key {activeDelivery?.idempotencyKey}.
                    </div>
                  );
                }

                return logs.map((log: any, idx: number) => (
                  <div key={idx} className="relative pb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#1F2E4A]">Attempt {log.attempt}</span>
                      <span className="text-[10px] text-slate-400">
                        {log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : ""}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                          log.status === "SIMULATED_SENT" || log.status === "DELIVERED"
                            ? "bg-emerald-100 text-emerald-800"
                            : log.status === "RETRYING"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {log.status}
                      </span>
                    </div>
                    {log.messageId && (
                      <p className="text-[10px] font-mono text-emerald-700 mt-0.5">
                        Receipt: {log.messageId}
                      </p>
                    )}
                    {log.error && (
                      <p className="text-[10px] font-mono text-rose-700 mt-0.5">
                        Error: {log.error}
                      </p>
                    )}
                  </div>
                ));
              })()}
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-200">
            <span className="text-[11px] text-slate-500">
              Provider: <code className="font-bold text-[#1F2E4A]">SimulatedGateway</code> (Meta API pluggable)
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setLogModalOpen(false)}
              >
                Close
              </Button>
              {activeDelivery?.status !== "SIMULATED_SENT" && activeDelivery?.status !== "DELIVERED" && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleRetryDelivery(activeDelivery.id)}
                  disabled={actionLoading}
                  icon={<RotateCw size={13} />}
                >
                  {actionLoading ? "Enqueuing..." : "Force Retry Job"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};
