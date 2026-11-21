import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { Badge, type BadgeVariant } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import {
  CheckCircle2,
  AlertTriangle,
  Award,
  ArrowLeft,
  ShieldCheck,
  Send,
  UserCheck,
  RotateCcw,
  ExternalLink,
} from "lucide-react";

export const BatchDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, isLoading } = useAuth();
  const [batch, setBatch] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [comments, setComments] = useState("");
  const [actionModal, setActionModal] = useState<"APPROVE" | "REJECT" | "RETURN_FOR_CORRECTION" | null>(null);

  const fetchBatch = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/batches/${id}`);
      if (res.data?.success) {
        setBatch(res.data.batch);
      }
    } catch (err: any) {
      console.error("Failed to load batch:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoading || !user) return;
    fetchBatch();
  }, [id, user?.id, user?.role, isLoading]);

  const handleSubmitBatch = async () => {
    try {
      setActionLoading(true);
      const res = await api.post(`/batches/${id}/submit`);
      if (res.data?.success) {
        setMessage({ type: "success", text: res.data.message });
        fetchBatch();
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.response?.data?.message || "Failed to submit batch" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDistrictAction = async (action: "APPROVE" | "REJECT" | "RETURN_FOR_CORRECTION") => {
    try {
      setActionLoading(true);
      const res = await api.post(`/approvals/district/${id}`, {
        action,
        comments: comments || (action === "APPROVE" ? "Endorsed by District Officer" : undefined),
      });
      if (res.data?.success) {
        setMessage({ type: "success", text: res.data.message });
        setActionModal(null);
        setComments("");
        fetchBatch();
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.response?.data?.message || "District approval failed" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleQualityAction = async (action: "APPROVE" | "REJECT" | "RETURN_FOR_CORRECTION") => {
    try {
      setActionLoading(true);
      const res = await api.post(`/approvals/quality/${id}`, {
        action,
        comments: comments || "Quality compliance verified",
      });
      if (res.data?.success) {
        setMessage({ type: "success", text: res.data.message });
        setActionModal(null);
        setComments("");
        fetchBatch();
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.response?.data?.message || "Quality review failed" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleStateAction = async (action: "APPROVE" | "REJECT" | "RETURN_FOR_CORRECTION") => {
    try {
      setActionLoading(true);
      const res = await api.post(`/approvals/state/${id}`, {
        action,
        comments: comments || "State Directorate Final Authorization Granted",
      });
      if (res.data?.success) {
        setMessage({ type: "success", text: res.data.message });
        setActionModal(null);
        setComments("");
        fetchBatch();
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.response?.data?.message || "State approval failed" });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-slate-500 text-sm">
        <div className="w-5 h-5 border-2 border-[#1F2E4A] border-t-transparent rounded-full animate-spin mr-3" />
        Loading batch details...
      </div>
    );
  }

  if (!batch) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-500">Batch not found.</p>
        <Link to="/batches" className="text-[#1F2E4A] underline text-xs mt-2 inline-block">
          Back to Batches
        </Link>
      </div>
    );
  }

  const role = user?.role;
  const validDistrictApprovals = (batch.approvals || []).filter(
    (a: any) => a.stage === "DISTRICT_OFFICER" && a.isValid
  );
  const quorumCount = validDistrictApprovals.length;
  const hasUserAlreadyApproved = validDistrictApprovals.some((a: any) => a.officerId === user?.id);

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; variant: BadgeVariant }> = {
      DRAFT: { label: "Draft", variant: "default" },
      SUBMITTED: { label: "Submitted", variant: "info" },
      UNDER_DISTRICT_REVIEW: { label: "Under District Review", variant: "warning" },
      DISTRICT_APPROVED: { label: "District Approved", variant: "info" },
      UNDER_QUALITY_REVIEW: { label: "Under Quality Review", variant: "warning" },
      QUALITY_APPROVED: { label: "Quality Passed", variant: "info" },
      UNDER_STATE_REVIEW: { label: "Awaiting State Approval", variant: "warning" },
      APPROVED: { label: "Approved & Certified", variant: "success" },
      REJECTED: { label: "Rejected", variant: "danger" },
      RETURNED_TO_CENTRE: { label: "Returned for Correction", variant: "danger" },
    };
    const c = config[status] || { label: status, variant: "default" };
    return <Badge variant={c.variant} dot>{c.label}</Badge>;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            to="/batches"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1F2E4A] hover:underline mb-2"
          >
            <ArrowLeft size={13} />
            <span>Back to All Batches</span>
          </Link>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-[#1F2E4A] tracking-tight">
              {batch.batchNumber}
            </h2>
            {getStatusBadge(batch.status)}
            {batch.isFlaggedForQuality && (
              <Badge variant="navy">Flagged for Quality Scrutiny</Badge>
            )}
          </div>
          <p className="text-xs text-slate-600 mt-1">
            {batch.courseName} ({batch.courseCode}) • {batch.trainingCentre?.name} (
            {batch.district})
          </p>
        </div>

        <div className="flex items-center gap-2">
          {role === "TRAINING_CENTRE" &&
            (batch.status === "DRAFT" || batch.status === "RETURNED_TO_CENTRE") && (
              <Button
                icon={<Send size={15} />}
                onClick={handleSubmitBatch}
                isLoading={actionLoading}
              >
                Submit Batch for District Review
              </Button>
            )}

          {role === "DISTRICT_OFFICER" && batch.status === "UNDER_DISTRICT_REVIEW" && (
            <div className="flex items-center gap-2">
              <Button
                variant="primary"
                icon={<CheckCircle2 size={15} />}
                onClick={() => setActionModal("APPROVE")}
                disabled={hasUserAlreadyApproved}
              >
                {hasUserAlreadyApproved ? "Endorsed (Awaiting 2nd Officer)" : "Endorse Batch"}
              </Button>
              <Button
                variant="secondary"
                className="text-amber-700 border-amber-300 hover:bg-amber-50"
                icon={<RotateCcw size={14} />}
                onClick={() => setActionModal("RETURN_FOR_CORRECTION")}
              >
                Return to Centre
              </Button>
              <Button
                variant="danger"
                onClick={() => setActionModal("REJECT")}
              >
                Reject
              </Button>
            </div>
          )}

          {role === "QUALITY_TEAM" && batch.status === "UNDER_QUALITY_REVIEW" && (
            <div className="flex items-center gap-2">
              <Button
                variant="primary"
                icon={<ShieldCheck size={15} />}
                onClick={() => setActionModal("APPROVE")}
              >
                Verify & Pass Quality Audit
              </Button>
              <Button
                variant="secondary"
                icon={<RotateCcw size={14} />}
                onClick={() => setActionModal("RETURN_FOR_CORRECTION")}
              >
                Return for Audit Non-Compliance
              </Button>
            </div>
          )}

          {role === "STATE_OFFICE" && batch.status === "UNDER_STATE_REVIEW" && (
            <div className="flex items-center gap-2">
              <Button
                variant="primary"
                className="bg-emerald-700 hover:bg-emerald-800 border-emerald-700 text-white"
                icon={<Award size={15} />}
                onClick={() => setActionModal("APPROVE")}
              >
                Authorize & Issue Certificates
              </Button>
              <Button
                variant="secondary"
                icon={<RotateCcw size={14} />}
                onClick={() => setActionModal("RETURN_FOR_CORRECTION")}
              >
                Return to Centre
              </Button>
            </div>
          )}
        </div>
      </div>

      {message && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-900 border-emerald-300"
              : "bg-rose-50 text-rose-900 border-rose-300"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle size={16} className="text-rose-600 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {batch.status === "RETURNED_TO_CENTRE" && batch.returnComments && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs space-y-1">
          <div className="font-bold flex items-center gap-1.5 text-amber-950">
            <RotateCcw size={15} className="text-amber-700" />
            <span>Batch Returned for Correction</span>
          </div>
          <p className="text-slate-700">{batch.returnComments}</p>
          <p className="text-[10px] text-amber-800 font-medium">
            Policy Note: Prior approvals have been invalidated. Please review candidate records and
            re-submit.
          </p>
        </div>
      )}

      <div className="glass-panel rounded-2xl p-5 border border-[#CED4DA]/40">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">
          Lifecycle Progression
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div
            className={`p-3 rounded-xl border text-xs ${
              batch.status !== "DRAFT"
                ? "bg-emerald-50 border-emerald-300 text-emerald-950"
                : "bg-white/80 border-[#CED4DA] text-slate-700"
            }`}
          >
            <div className="font-bold flex items-center gap-1">
              <span>1. Batch Submission</span>
              {batch.status !== "DRAFT" && <CheckCircle2 size={13} className="text-emerald-600" />}
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">
              {batch.submittedAt
                ? new Date(batch.submittedAt).toLocaleDateString()
                : "Draft created"}
            </p>
          </div>

          <div
            className={`p-3 rounded-xl border text-xs ${
              quorumCount >= 2
                ? "bg-emerald-50 border-emerald-300 text-emerald-950"
                : batch.status === "UNDER_DISTRICT_REVIEW"
                ? "bg-amber-50 border-amber-300 text-amber-950"
                : "bg-white/80 border-[#CED4DA] text-slate-700"
            }`}
          >
            <div className="font-bold flex items-center gap-1">
              <span>2. District Quorum ({quorumCount}/2)</span>
              {quorumCount >= 2 && <CheckCircle2 size={13} className="text-emerald-600" />}
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">
              {quorumCount >= 2 ? "Quorum Reached" : `${quorumCount} of 2 endorsed`}
            </p>
          </div>

          <div
            className={`p-3 rounded-xl border text-xs ${
              !batch.isFlaggedForQuality
                ? "bg-slate-50 border-slate-200 text-slate-400"
                : batch.qualityReviews?.length > 0
                ? "bg-emerald-50 border-emerald-300 text-emerald-950"
                : batch.status === "UNDER_QUALITY_REVIEW"
                ? "bg-amber-50 border-amber-300 text-amber-950"
                : "bg-white/80 border-[#CED4DA] text-slate-700"
            }`}
          >
            <div className="font-bold flex items-center gap-1">
              <span>3. Quality Audit</span>
              {!batch.isFlaggedForQuality && (
                <span className="text-[9px] font-normal">(Exempt)</span>
              )}
              {batch.qualityReviews?.length > 0 && (
                <CheckCircle2 size={13} className="text-emerald-600" />
              )}
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">
              {batch.isFlaggedForQuality ? "Large batch audit" : "Standard batch"}
            </p>
          </div>

          <div
            className={`p-3 rounded-xl border text-xs ${
              batch.status === "APPROVED"
                ? "bg-emerald-50 border-emerald-300 text-emerald-950"
                : batch.status === "UNDER_STATE_REVIEW"
                ? "bg-amber-50 border-amber-300 text-amber-950"
                : "bg-white/80 border-[#CED4DA] text-slate-700"
            }`}
          >
            <div className="font-bold flex items-center gap-1">
              <span>4. Certified & QR</span>
              {batch.status === "APPROVED" && (
                <CheckCircle2 size={13} className="text-emerald-600" />
              )}
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">
              {batch.status === "APPROVED" ? "Certificates active" : "Pending final sign-off"}
            </p>
          </div>
        </div>
      </div>

      <div className="glass-panel rounded-2xl p-5 border border-[#CED4DA]/40">
        <h4 className="text-xs font-bold uppercase tracking-wider text-[#1F2E4A] mb-3 flex items-center gap-2">
          <UserCheck size={16} className="text-[#1F2E4A]" />
          <span>District Officer Endorsement Record (Quorum Requirement: 2 Officers)</span>
        </h4>

        {validDistrictApprovals.length === 0 ? (
          <p className="text-xs text-slate-500 italic py-2">
            No district approvals submitted yet. Awaiting endorsement by officers in{" "}
            {batch.district}.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {validDistrictApprovals.map((app: any, idx: number) => (
              <div
                key={app.id}
                className="p-3.5 rounded-xl bg-white/90 border border-emerald-200 text-xs shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-950">
                    Endorsement #{idx + 1}: {app.officer?.fullName}
                  </span>
                  <Badge variant="success">Approved</Badge>
                </div>
                <p className="text-[11px] text-slate-600 mt-1 italic">"{app.comments}"</p>
                <p className="text-[10px] text-slate-400 mt-2">
                  {new Date(app.createdAt).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="glass-panel rounded-2xl overflow-hidden border border-[#CED4DA]/40">
        <div className="p-4 border-b border-[#CED4DA]/40 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-[#1F2E4A]">Enrolled Candidate Roster</h3>
            <p className="text-xs text-slate-500">
              {batch.candidates?.length} candidates enrolled • {batch.passedCandidates} cleared
              assessment
            </p>
          </div>
          <Badge variant="navy">{batch.courseCode}</Badge>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/70 border-b border-[#CED4DA]/60 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Roll Number</th>
                <th className="py-3 px-4">Candidate Name</th>
                <th className="py-3 px-4">National ID</th>
                <th className="py-3 px-4">Phone</th>
                <th className="py-3 px-4 text-center">Marks</th>
                <th className="py-3 px-4 text-center">Grade</th>
                <th className="py-3 px-4">Result</th>
                <th className="py-3 px-4 text-right">Certificate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#CED4DA]/40 bg-white/40">
              {batch.candidates?.map((bc: any) => (
                <tr key={bc.id} className="hover:bg-white/80 transition-colors">
                  <td className="py-3 px-4 font-bold text-[#1F2E4A]">{bc.rollNumber}</td>
                  <td className="py-3 px-4 font-medium text-slate-800">
                    {bc.candidate?.fullName}
                  </td>
                  <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                    {bc.candidate?.nationalId}
                  </td>
                  <td className="py-3 px-4 text-slate-600">{bc.candidate?.phone}</td>
                  <td className="py-3 px-4 text-center font-bold text-slate-700">
                    {bc.marksObtained}/100
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#1F2E4A]/10 text-[#1F2E4A]">
                      {bc.grade}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {bc.hasPassed ? (
                      <Badge variant="success">Passed</Badge>
                    ) : (
                      <Badge variant="danger">Failed</Badge>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    {bc.certificate ? (
                      <a
                        href={`http://localhost:5000/api/certificates/${bc.certificate.id}/pdf`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-[#1F2E4A] hover:underline"
                      >
                        <span>PDF</span>
                        <ExternalLink size={11} />
                      </a>
                    ) : (
                      <span className="text-slate-400 text-[11px]">Pending Approval</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {actionModal && (
        <Modal
          isOpen={true}
          onClose={() => setActionModal(null)}
          title={
            actionModal === "APPROVE"
              ? "Endorse / Authorize Batch"
              : actionModal === "RETURN_FOR_CORRECTION"
              ? "Return Batch for Correction"
              : "Reject Batch"
          }
          maxWidth="md"
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-600">
              {actionModal === "APPROVE"
                ? "You are recording your formal official endorsement for this candidate cohort."
                : actionModal === "RETURN_FOR_CORRECTION"
                ? "Document reasons for returning this batch to the training centre. Prior approvals will be marked as invalidated."
                : "Specify the grounds for permanent batch rejection."}
            </p>

            <div>
              <label className="block text-xs font-semibold text-[#1F2E4A] mb-1">
                Official Remarks / Comments{" "}
                {actionModal !== "APPROVE" && <span className="text-rose-600">*</span>}
              </label>
              <textarea
                rows={3}
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Provide official observations, lab check findings, or specific correction requests..."
                className="w-full p-2.5 text-xs rounded-xl bg-white border border-[#CED4DA] focus:border-[#1F2E4A] outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setActionModal(null)}>
                Cancel
              </Button>
              <Button
                variant={actionModal === "REJECT" ? "danger" : "primary"}
                onClick={() => {
                  if (role === "DISTRICT_OFFICER") handleDistrictAction(actionModal);
                  else if (role === "QUALITY_TEAM") handleQualityAction(actionModal);
                  else if (role === "STATE_OFFICE") handleStateAction(actionModal);
                }}
                isLoading={actionLoading}
              >
                Confirm Decision
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
