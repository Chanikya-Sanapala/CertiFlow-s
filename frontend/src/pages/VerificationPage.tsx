import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../services/api";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import {
  ShieldCheck,
  ShieldAlert,
  Search,
  AlertTriangle,
  Download,
  ArrowLeft,
} from "lucide-react";

export const VerificationPage: React.FC = () => {
  const { certificateNumber: paramCertNumber } = useParams<{ certificateNumber: string }>();
  const [certNumberInput, setCertNumberInput] = useState(paramCertNumber || "");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const performVerification = async (certId: string) => {
    if (!certId.trim()) return;

    try {
      setLoading(true);
      setHasSearched(true);
      const res = await api.get(`/verify/${certId.trim()}`);
      setResult(res.data);
    } catch (err: any) {
      if (err.response?.data) {
        setResult(err.response.data);
      } else {
        setResult({
          success: false,
          status: "NOT_FOUND",
          message: `Certificate '${certId}' is not registered in the Pragati Skills Mission repository.`,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (paramCertNumber) {
      setCertNumberInput(paramCertNumber);
      performVerification(paramCertNumber);
    }
  }, [paramCertNumber]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performVerification(certNumberInput);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#343A40] flex flex-col justify-between select-none">
      <header className="glass-toolbar border-b border-[#CED4DA]/50 py-4 px-4 sm:px-12 flex items-center justify-between sticky top-0 z-30">
        <div>
          <h1 className="font-extrabold text-base text-[#1F2E4A] flex items-center gap-2">
            Pragati Skills Mission
            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
              Official Registry
            </span>
          </h1>
          <p className="text-[11px] text-slate-500 font-medium">
            State Credential Verification & Anti-Fraud Gateway
          </p>
        </div>

        <Link
          to="/dashboard"
          className="text-xs font-semibold text-[#1F2E4A] hover:underline flex items-center gap-1.5"
        >
          <ArrowLeft size={13} />
          <span>Portal Login</span>
        </Link>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8 space-y-6">
        <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-[#CED4DA]/50 shadow-sm text-center space-y-4">
          <h2 className="text-xl sm:text-2xl font-bold text-[#1F2E4A] tracking-tight">
            Verify Skilling Certificate Authenticity
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto">
            Employers, academic bodies, and public authorities can instantly confirm the validity,
            course details, and issuing authority of any Pragati Skills Mission certificate.
          </p>

          <form
            onSubmit={handleSubmit}
            className="flex flex-col sm:flex-row items-center justify-center gap-2 max-w-lg mx-auto pt-2"
          >
            <div className="relative w-full">
              <Search size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type="text"
                value={certNumberInput}
                onChange={(e) => setCertNumberInput(e.target.value)}
                placeholder="Enter Certificate ID (e.g. CRT-2026-N8X92K)"
                className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-xl bg-white border border-[#CED4DA] focus:border-[#1F2E4A] outline-none shadow-xs text-[#1F2E4A] font-medium"
              />
            </div>
            <Button
              type="submit"
              className="w-full sm:w-auto shrink-0"
              isLoading={loading}
              icon={<Search size={15} />}
            >
              Verify Credential
            </Button>
          </form>

          <div className="pt-2 text-center text-xs text-slate-500">
            <span className="inline-flex items-center justify-center gap-1.5 font-medium text-slate-600">
              <ShieldCheck size={14} className="text-emerald-600" />
              Scan the QR code on any official Pragati certificate or enter the Certificate ID above.
            </span>
          </div>
        </div>

        {!hasSearched && (
          <div className="glass-panel rounded-3xl p-8 border border-[#CED4DA]/50 shadow-xs text-center space-y-3 max-w-xl mx-auto animate-in fade-in duration-200">
            <div className="w-12 h-12 rounded-2xl bg-[#1F2E4A]/10 text-[#1F2E4A] flex items-center justify-center mx-auto">
              <Search size={22} className="text-[#1F2E4A]" />
            </div>
            <h3 className="text-base font-bold text-[#1F2E4A]">
              Instant Credential Lookup
            </h3>
            <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
              Pragati Skills Mission maintains an authoritative, tamper-proof state registry. 
              Enter a certificate number above or scan the embedded QR code on any issued certificate to confirm its authenticity.
            </p>
          </div>
        )}

        {hasSearched && (
          <div className="animate-in fade-in duration-300">
            {result?.status === "VALID" ? (
              <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-emerald-300 bg-white/95 shadow-md space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#CED4DA]/50 gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-700 flex items-center justify-center shrink-0">
                      <ShieldCheck size={28} className="text-emerald-700" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-emerald-950">
                          Authentic &amp; Officially Issued Credential
                        </h3>
                        <Badge variant="success" dot>
                          VALID
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Verified by Pragati Skills Directorate Registry on {new Date().toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <a
                    href={`http://localhost:5000/api/certificates/${result.certificate.certificateNumber}/pdf`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="secondary" size="sm" icon={<Download size={13} />}>
                      Download Original PDF
                    </Button>
                  </a>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                  <div className="md:col-span-2 space-y-4 text-xs">
                    <div>
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        Candidate Name
                      </span>
                      <p className="text-base font-bold text-[#1F2E4A]">
                        {result.certificate.candidateName}
                      </p>
                      {result.certificate.fatherName && (
                        <p className="text-slate-500 text-[11px]">
                          S/o / D/o {result.certificate.fatherName}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          Course / Competency
                        </span>
                        <p className="font-semibold text-slate-800">
                          {result.certificate.courseName}
                        </p>
                        <p className="text-[10px] text-slate-500">
                          Code: {result.certificate.courseCode}
                        </p>
                      </div>
                      <div>
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          Assessment Grade
                        </span>
                        <p className="font-semibold text-slate-800">
                          Grade {result.certificate.grade} ({result.certificate.marksObtained}%)
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          Training Centre &amp; District
                        </span>
                        <p className="font-semibold text-slate-800">
                          {result.certificate.trainingCentreName}
                        </p>
                        <p className="text-[10px] text-slate-500">{result.certificate.district}</p>
                      </div>
                      <div>
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          Issuance Date
                        </span>
                        <p className="font-semibold text-slate-800">
                          {new Date(result.certificate.issueDate).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="text-center p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col items-center">
                    {result.certificate.qrCodeImage ? (
                      <img
                        src={result.certificate.qrCodeImage}
                        alt="Verification QR"
                        className="w-28 h-28 rounded-lg shadow-xs"
                      />
                    ) : (
                      <div className="w-28 h-28 bg-slate-200 rounded-lg flex items-center justify-center text-xs text-slate-500">
                        QR Active
                      </div>
                    )}
                    <span className="text-[10px] text-slate-500 font-mono mt-2 font-bold">
                      {result.certificate.certificateNumber}
                    </span>
                    <span className="text-[9px] text-emerald-800 font-semibold mt-0.5">
                      Cryptographically Signed
                    </span>
                  </div>
                </div>
              </div>
            ) : result?.status === "REVOKED" ? (
              <div className="glass-panel rounded-3xl p-6 sm:p-8 border-2 border-rose-400 bg-rose-50/70 shadow-md space-y-5">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center shrink-0">
                    <ShieldAlert size={28} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-rose-950">
                        OFFICIALLY REVOKED CREDENTIAL
                      </h3>
                      <Badge variant="danger" dot>
                        REVOKED
                      </Badge>
                    </div>
                    <p className="text-xs text-rose-900 mt-1 font-semibold">
                      Notice to Employers &amp; Public: This certificate has been declared VOID by
                      the State Skills Mission Directorate and cannot be recognized for employment or
                      benefit claims.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white/90 border border-rose-200 text-xs space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-bold">
                        Certificate Number
                      </span>
                      <p className="font-mono font-bold text-rose-950">
                        {result.certificate.certificateNumber}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-bold">
                        Candidate Name
                      </span>
                      <p className="font-bold text-slate-800">
                        {result.certificate.candidateName}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-rose-100">
                    <span className="text-slate-500 text-[10px] uppercase font-bold">
                      Official Revocation Reason:
                    </span>
                    <p className="font-semibold text-rose-900 mt-0.5">
                      "{result.certificate.revocationReason}"
                    </p>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Revocation Order Executed by: {result.certificate.revokedBy} on{" "}
                      {new Date(result.certificate.revokedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-amber-300 bg-amber-50/70 text-center space-y-3">
                <AlertTriangle size={36} className="mx-auto text-amber-600" />
                <h3 className="text-base font-bold text-amber-950">
                  Unverified Credential – Not in Registry
                </h3>
                <p className="text-xs text-amber-900 max-w-md mx-auto">
                  {result?.message ||
                    `Certificate '${certNumberInput}' could not be located in the Pragati Skills Mission registry. This document may be fraudulent, unissued, or incorrectly entered.`}
                </p>
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="py-6 border-t border-[#CED4DA]/40 text-center text-xs text-slate-500">
        <p>Pragati Skills Mission • Government Skill Certification Registry Framework</p>
        <p className="text-[10px] text-slate-400 mt-0.5">
          All issuance records are electronically signed and cryptographically verifiable.
        </p>
      </footer>
    </div>
  );
};
