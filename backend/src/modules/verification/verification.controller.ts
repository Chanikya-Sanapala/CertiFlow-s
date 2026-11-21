import { Request, Response } from "express";
import prisma from "../../config/db";
import { CertificateStatus } from "@prisma/client";

export class VerificationController {
  /**
   * Public Certificate Verification
   * No authentication required.
   * Real-time check: If a certificate was revoked, it is reported immediately as REVOKED.
   */
  static async verifyCertificate(req: Request, res: Response) {
    const certificateNumber = String(req.params.certificateNumber || "").trim();

    if (!certificateNumber) {
      return res.status(400).json({
        success: false,
        status: "INVALID",
        message: "Certificate number is required",
      });
    }

    const cert: any = await prisma.certificate.findFirst({
      where: {
        certificateNumber: {
          equals: certificateNumber,
          mode: "insensitive",
        },
      },
      include: {
        candidate: {
          select: {
            fullName: true,
            fatherName: true,
            district: true,
          },
        },
        batch: {
          select: {
            batchNumber: true,
            courseName: true,
            courseCode: true,
          },
        },
      },
    });

    if (!cert) {
      return res.status(404).json({
        success: false,
        status: "NOT_FOUND",
        message: `Certificate '${certificateNumber}' is NOT registered in the Pragati Skills Mission database. This document may be fraudulent or unissued.`,
      });
    }

    if (cert.status === CertificateStatus.REVOKED) {
      return res.status(200).json({
        success: true,
        status: "REVOKED",
        message: "This certificate has been officially REVOKED by the State Directorate and is no longer valid for employment or verification.",
        certificate: {
          certificateNumber: cert.certificateNumber,
          candidateName: cert.candidate.fullName,
          courseName: cert.courseName,
          trainingCentreName: cert.trainingCentreName,
          district: cert.district,
          issueDate: cert.issueDate,
          revokedAt: cert.revokedAt,
          revokedBy: cert.revokedBy,
          revocationReason: cert.revocationReason,
          status: cert.status,
        },
      });
    }

    return res.status(200).json({
      success: true,
      status: "VALID",
      message: "Certificate is authentic and officially recognized by the Pragati Skills Mission.",
      certificate: {
        certificateNumber: cert.certificateNumber,
        candidateName: cert.candidate.fullName,
        fatherName: cert.candidate.fatherName,
        courseName: cert.courseName,
        courseCode: cert.batch?.courseCode,
        trainingCentreName: cert.trainingCentreName,
        district: cert.district,
        grade: cert.grade,
        marksObtained: cert.marksObtained,
        issueDate: cert.issueDate,
        status: cert.status,
        qrCodeImage: cert.qrCodeImage,
      },
    });
  }
}
