import React, { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { Badge, type BadgeVariant } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import {
  Upload,
  Download,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Filter,
  Search,
  Sparkles,
} from "lucide-react";
import * as XLSX from "xlsx";

export const BatchesPage: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");

  const [isUploadOpen, setIsUploadOpen] = useState(searchParams.get("tab") === "upload");
  const [courseName, setCourseName] = useState("Solar PV Installation Technician");
  const [courseCode, setCourseCode] = useState("SOL-PV-L4");
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadErrors, setUploadErrors] = useState<any[]>([]);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  const fetchBatches = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (statusFilter) params.status = statusFilter;
      if (searchTerm) params.search = searchTerm;
      const res = await api.get("/batches", { params });
      if (res.data?.success) {
        setBatches(res.data.batches);
      }
    } catch (err) {
      console.error("Failed to load batches:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoading || !user) return;
    fetchBatches();
  }, [statusFilter, user?.id, user?.role, isLoading]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchBatches();
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; variant: BadgeVariant }> = {
      DRAFT: { label: "Draft", variant: "default" },
      SUBMITTED: { label: "Submitted", variant: "info" },
      UNDER_DISTRICT_REVIEW: { label: "District Review", variant: "warning" },
      DISTRICT_APPROVED: { label: "District Approved", variant: "info" },
      UNDER_QUALITY_REVIEW: { label: "Quality Audit", variant: "warning" },
      QUALITY_APPROVED: { label: "Quality Passed", variant: "info" },
      UNDER_STATE_REVIEW: { label: "State Review", variant: "warning" },
      APPROVED: { label: "Approved & Issued", variant: "success" },
      REJECTED: { label: "Rejected", variant: "danger" },
      RETURNED_TO_CENTRE: { label: "Returned for Fix", variant: "danger" },
    };
    const c = config[status] || { label: status, variant: "default" };
    return <Badge variant={c.variant} dot>{c.label}</Badge>;
  };

  const handleDownloadTemplate = () => {
    window.open("http://localhost:5000/api/batches/template", "_blank");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const parsedRows = XLSX.utils.sheet_to_json(ws);
        submitParsedRows(parsedRows);
      } catch (err) {
        setUploadErrors([
          { rowNumber: 0, field: "file", message: "Failed to parse spreadsheet file." },
        ]);
      }
    };
    reader.readAsBinaryString(file);
  };

  const submitParsedRows = async (rows: any[]) => {
    setUploadLoading(true);
    setUploadErrors([]);
    setUploadSuccess(null);

    try {
      const res = await api.post("/batches/upload", {
        courseName,
        courseCode,
        rows,
      });

      if (res.data?.success) {
        setUploadSuccess(res.data.message);
        fetchBatches();
        setTimeout(() => {
          setIsUploadOpen(false);
          setUploadSuccess(null);
        }, 2000);
      }
    } catch (err: any) {
      if (err.response?.status === 422 && err.response?.data?.errors) {
        setUploadErrors(err.response.data.errors);
      } else {
        setUploadErrors([
          {
            rowNumber: 0,
            field: "general",
            message: err.response?.data?.message || "Failed to upload batch",
          },
        ]);
      }
    } finally {
      setUploadLoading(false);
    }
  };

  const loadGoodDemoBatch = () => {
    const goodRows = Array.from({ length: 22 }).map((_, i) => ({
      "Full Name": `Certified Technician ${i + 1}`,
      "Father Name": `Guardian ${i + 1}`,
      "National ID": `9988${String(1000 + i)}${Math.floor(1000 + Math.random() * 9000)}`,
      "Phone (10 digits)": `98765${String(10000 + i)}`,
      "Email": `tech_${i + 1}@example.com`,
      "Roll Number": `ROL-2026-N${String(100 + i)}`,
      "Marks (0-100)": 75 + (i % 20),
      "Attendance (%)": 92,
      "District": "District North",
    }));
    submitParsedRows(goodRows);
  };

  const loadBadRowsDemoBatch = () => {
    const badRows = [
      {
        "Full Name": "Aarav Sharma",
        "National ID": "987654321001",
        "Phone (10 digits)": "9876543210",
        "Roll Number": "ROL-BAD-001",
        "Marks (0-100)": 88,
        "Attendance (%)": 95,
        "District": "District North",
      },
      {
        "Full Name": "Suresh Patel",
        "National ID": "987654321002",
        "Phone (10 digits)": "12345",
        "Roll Number": "ROL-BAD-002",
        "Marks (0-100)": -15,
        "Attendance (%)": 120,
        "District": "District North",
      },
      {
        "Full Name": "Kavita Rao",
        "National ID": "987654321003",
        "Phone (10 digits)": "9876543213",
        "Roll Number": "ROL-BAD-001",
        "Marks (0-100)": 72,
        "Attendance (%)": 85,
        "District": "District North",
      },
    ];
    submitParsedRows(badRows);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#1F2E4A] tracking-tight">Candidate Batches</h2>
          <p className="text-xs text-[#343A40]/70 mt-1">
            Review submitted candidate cohorts, verify assessments, and track endorsement status
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            icon={<Download size={15} />}
            onClick={handleDownloadTemplate}
          >
            Template (XLSX)
          </Button>
          {(user?.role === "TRAINING_CENTRE" || user?.role === "STATE_OFFICE") && (
            <Button icon={<Upload size={15} />} onClick={() => setIsUploadOpen(true)}>
              Upload Batch
            </Button>
          )}
        </div>
      </div>

      <div className="glass-panel rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 border border-[#CED4DA]/40">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <Search size={15} className="absolute left-3.5 top-3 text-[#343A40]/50" />
          <input
            type="text"
            placeholder="Search by batch # or course..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-white/80 border border-[#CED4DA] focus:border-[#1F2E4A] outline-none text-[#343A40]"
          />
        </form>

        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
          <Filter size={14} className="text-[#343A40]/50 shrink-0" />
          <button
            onClick={() => setStatusFilter("")}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium cursor-pointer transition-colors ${
              statusFilter === "" ? "bg-[#1F2E4A] text-white" : "bg-white/60 text-[#343A40] hover:bg-white"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setStatusFilter("UNDER_DISTRICT_REVIEW")}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium cursor-pointer transition-colors ${
              statusFilter === "UNDER_DISTRICT_REVIEW"
                ? "bg-[#1F2E4A] text-white"
                : "bg-white/60 text-[#343A40] hover:bg-white"
            }`}
          >
            District Review
          </button>
          <button
            onClick={() => setStatusFilter("UNDER_QUALITY_REVIEW")}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium cursor-pointer transition-colors ${
              statusFilter === "UNDER_QUALITY_REVIEW"
                ? "bg-[#1F2E4A] text-white"
                : "bg-white/60 text-[#343A40] hover:bg-white"
            }`}
          >
            Quality Audit
          </button>
          <button
            onClick={() => setStatusFilter("APPROVED")}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium cursor-pointer transition-colors ${
              statusFilter === "APPROVED"
                ? "bg-[#1F2E4A] text-white"
                : "bg-white/60 text-[#343A40] hover:bg-white"
            }`}
          >
            Approved
          </button>
        </div>
      </div>

      <div className="glass-panel rounded-2xl overflow-hidden border border-[#CED4DA]/40">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/70 border-b border-[#CED4DA]/60 text-[#343A40]/80 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-5">Batch Number</th>
                <th className="py-3.5 px-5">Course / Trade</th>
                <th className="py-3.5 px-5">Training Centre</th>
                <th className="py-3.5 px-5">District</th>
                <th className="py-3.5 px-5 text-center">Candidates</th>
                <th className="py-3.5 px-5">Status</th>
                <th className="py-3.5 px-5">District Quorum</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#CED4DA]/40 bg-white/40">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    Loading batches...
                  </td>
                </tr>
              ) : batches.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    {searchTerm || statusFilter
                      ? "No batches found matching filter criteria."
                      : "No batches uploaded yet. Training Centres can upload candidate rosters using 'Upload Batch'."}
                  </td>
                </tr>
              ) : (
                batches.map((batch) => {
                  const approvalsCount = (batch.approvals || []).length;
                  return (
                    <tr
                      key={batch.id}
                      className="hover:bg-white/80 transition-colors duration-100"
                    >
                      <td className="py-4 px-5 font-bold text-[#1F2E4A]">
                        <Link
                          to={`/batches/${batch.id}`}
                          className="hover:underline flex items-center gap-1.5"
                        >
                          {batch.batchNumber}
                        </Link>
                      </td>
                      <td className="py-4 px-5">
                        <div className="font-semibold text-[#1F2E4A]">{batch.courseName}</div>
                        <div className="text-[10px] text-slate-500">{batch.courseCode}</div>
                      </td>
                      <td className="py-4 px-5 text-slate-700">
                        {batch.trainingCentre?.name || "Apex Skill Institute"}
                      </td>
                      <td className="py-4 px-5 text-slate-700 font-medium">
                        {batch.district}
                      </td>
                      <td className="py-4 px-5 text-center">
                        <span className="font-bold text-[#1F2E4A]">
                          {batch.passedCandidates}
                        </span>
                        <span className="text-slate-400"> / {batch.totalCandidates}</span>
                      </td>
                      <td className="py-4 px-5">{getStatusBadge(batch.status)}</td>
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`inline-block w-2 h-2 rounded-full ${
                              approvalsCount >= 2
                                ? "bg-emerald-500"
                                : approvalsCount === 1
                                ? "bg-amber-500"
                                : "bg-slate-300"
                            }`}
                          />
                          <span className="font-medium text-slate-700">
                            {approvalsCount}/2 Officers
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-5 text-right">
                        <Link to={`/batches/${batch.id}`}>
                          {user?.role === "DISTRICT_OFFICER" && batch.status === "UNDER_DISTRICT_REVIEW" ? (
                            <Button size="sm" variant="primary" icon={<ArrowRight size={13} />}>
                              Review & Endorse
                            </Button>
                          ) : user?.role === "QUALITY_TEAM" && batch.status === "UNDER_QUALITY_REVIEW" ? (
                            <Button size="sm" variant="primary" icon={<ArrowRight size={13} />}>
                              Audit & Pass
                            </Button>
                          ) : user?.role === "STATE_OFFICE" && batch.status === "UNDER_STATE_REVIEW" ? (
                            <Button size="sm" variant="primary" className="bg-emerald-700 hover:bg-emerald-800 border-emerald-700 text-white" icon={<ArrowRight size={13} />}>
                              Authorize & Issue
                            </Button>
                          ) : (
                            <Button size="sm" variant="secondary" icon={<ArrowRight size={13} />}>
                              View
                            </Button>
                          )}
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        title="Upload Passed Candidate Batch"
        maxWidth="xl"
      >
        <div className="space-y-5">
          <p className="text-xs text-slate-600">
            Upload candidate assessment spreadsheets (.xlsx or .csv). Data will undergo strict
            row-level validation before submission.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#1F2E4A] mb-1">Course Name</label>
              <input
                type="text"
                value={courseName}
                onChange={(e) => setCourseName(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-[#CED4DA] focus:border-[#1F2E4A] outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1F2E4A] mb-1">
                Curriculum Code
              </label>
              <input
                type="text"
                value={courseCode}
                onChange={(e) => setCourseCode(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-[#CED4DA] focus:border-[#1F2E4A] outline-none"
              />
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="text-[11px] font-bold text-[#1F2E4A] flex items-center gap-1.5 uppercase tracking-wider">
              <Sparkles size={13} className="text-amber-500" />
              <span>One-Click Hackathon Demonstrations:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={loadGoodDemoBatch}
                isLoading={uploadLoading}
              >
                1-Click Valid Batch (22 Candidates &gt; Quality Threshold)
              </Button>
              <Button
                size="sm"
                variant="secondary"
                className="text-rose-700 border-rose-200 hover:bg-rose-50"
                onClick={loadBadRowsDemoBatch}
                isLoading={uploadLoading}
              >
                1-Click Moment 1 Test (Trigger Bad Rows Rollback)
              </Button>
            </div>
          </div>

          <div className="border-2 border-dashed border-[#CED4DA] rounded-2xl p-6 text-center hover:border-[#1F2E4A] transition-colors bg-white/50">
            <Upload size={28} className="mx-auto text-slate-400 mb-2" />
            <p className="text-xs font-semibold text-[#1F2E4A]">
              Drag and drop your candidate spreadsheet here
            </p>
            <p className="text-[11px] text-slate-500 mt-1">Accepts Excel (.xlsx) or CSV files</p>
            <label className="mt-3 inline-block">
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileUpload}
                className="hidden"
              />
              <span className="px-4 py-2 rounded-xl text-xs font-semibold bg-white border border-[#CED4DA] shadow-xs hover:bg-slate-50 cursor-pointer inline-flex items-center gap-1.5">
                Browse File
              </span>
            </label>
          </div>

          {uploadSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-medium flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              <span>{uploadSuccess}</span>
            </div>
          )}

          {uploadErrors.length > 0 && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 text-xs space-y-3">
              <div className="flex items-center gap-2 font-bold text-rose-950">
                <AlertCircle size={16} className="text-rose-600 shrink-0" />
                <span>
                  Moment 1 Verification: {uploadErrors.length} Error(s) Detected. Transaction
                  Safely Rolled Back.
                </span>
              </div>
              <p className="text-[11px] text-rose-800">
                Zero candidate records were saved to PostgreSQL. Review the exact errors below, fix
                them in your spreadsheet, and re-upload.
              </p>
              <div className="max-h-48 overflow-y-auto rounded-lg border border-rose-200 bg-white">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-rose-100/70 text-rose-900 font-bold sticky top-0">
                    <tr>
                      <th className="py-2 px-3">Row #</th>
                      <th className="py-2 px-3">Candidate / Roll</th>
                      <th className="py-2 px-3">Field</th>
                      <th className="py-2 px-3">Error Cause</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-rose-100 text-rose-950">
                    {uploadErrors.map((err, i) => (
                      <tr key={i} className="hover:bg-rose-50/50">
                        <td className="py-2 px-3 font-bold text-rose-700">Row {err.rowNumber}</td>
                        <td className="py-2 px-3">{err.candidateName || err.rollNumber || "—"}</td>
                        <td className="py-2 px-3 font-semibold text-slate-700">{err.field}</td>
                        <td className="py-2 px-3 text-rose-800">{err.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};
