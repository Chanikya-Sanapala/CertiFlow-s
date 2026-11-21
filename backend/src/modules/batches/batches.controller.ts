import { Response } from "express";
import * as XLSX from "xlsx";
import { z } from "zod";
import prisma from "../../config/db";
import { AuthenticatedRequest } from "../../middleware/auth";
import { BatchStatus, Role } from "@prisma/client";
import { AuditService } from "../../services/auditService";
import { QUALITY_REVIEW_THRESHOLD } from "../../config/constants";

const candidateRowSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  fatherName: z.string().optional(),
  nationalId: z.string().min(6, "National ID / Aadhaar must be at least 6 digits"),
  phone: z.string().regex(/^\d{10}$/, "Phone must be a valid 10-digit mobile number"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  rollNumber: z.string().min(1, "Roll number is required"),
  marksObtained: z.number().min(0, "Marks cannot be negative").max(100, "Marks cannot exceed 100"),
  attendanceRate: z.number().min(0, "Attendance cannot be negative").max(100, "Attendance cannot exceed 100"),
  district: z.string().min(2, "District is required"),
});

export interface RowValidationError {
  rowNumber: number;
  rollNumber?: string;
  candidateName?: string;
  field: string;
  value: any;
  message: string;
}

export class BatchesController {
  static async downloadTemplate(_req: any, res: Response) {
    const sampleData = [
      {
        "Full Name": "Aarav Sharma",
        "Father Name": "Ramesh Sharma",
        "National ID": "987654321001",
        "Phone (10 digits)": "9876543210",
        "Email": "aarav.sharma@example.com",
        "Roll Number": "ROL-2026-001",
        "Marks (0-100)": 88,
        "Attendance (%)": 95,
        "District": "District North",
      },
      {
        "Full Name": "Pooja Patel",
        "Father Name": "Kirit Patel",
        "National ID": "987654321002",
        "Phone (10 digits)": "9876543211",
        "Email": "pooja.patel@example.com",
        "Roll Number": "ROL-2026-002",
        "Marks (0-100)": 76,
        "Attendance (%)": 92,
        "District": "District North",
      },
      {
        "Full Name": "Rahul Verma",
        "Father Name": "Suresh Verma",
        "National ID": "987654321003",
        "Phone (10 digits)": "9876543212",
        "Email": "rahul.verma@example.com",
        "Roll Number": "ROL-2026-003",
        "Marks (0-100)": 64,
        "Attendance (%)": 86,
        "District": "District North",
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Candidates Template");

    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="CertiFlow_Candidates_Template.xlsx"'
    );
    return res.send(buffer);
  }

  static async uploadBatch(req: AuthenticatedRequest, res: Response) {
    const user = req.user!;
    const { courseName, courseCode, rows } = req.body;

    if (!courseName || !courseCode) {
      return res.status(400).json({
        success: false,
        message: "Course name and course code are required",
      });
    }

    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Spreadsheet rows are required and cannot be empty",
      });
    }

    let trainingCentreId = user.trainingCentreId;
    let trainingCentreDistrict = user.district || "District North";

    if (!trainingCentreId) {
      const tc = await prisma.trainingCentre.findFirst({
        where: user.district ? { district: user.district } : {},
      });
      if (tc) {
        trainingCentreId = tc.id;
        trainingCentreDistrict = tc.district;
      } else {
        return res.status(400).json({
          success: false,
          message: "No associated training centre found for user",
        });
      }
    }

    const errors: RowValidationError[] = [];
    const seenRollNumbers = new Set<string>();
    const seenNationalIds = new Set<string>();

    const validatedRows: Array<{
      fullName: string;
      fatherName?: string;
      nationalId: string;
      phone: string;
      email?: string;
      rollNumber: string;
      marksObtained: number;
      attendanceRate: number;
      district: string;
      grade: string;
      hasPassed: boolean;
    }> = [];

    rows.forEach((rawRow: any, index: number) => {
      const rowNum = index + 2;
      const rowData = {
        fullName: String(rawRow["Full Name"] || rawRow.fullName || "").trim(),
        fatherName: rawRow["Father Name"] || rawRow.fatherName ? String(rawRow["Father Name"] || rawRow.fatherName).trim() : undefined,
        nationalId: String(rawRow["National ID"] || rawRow.nationalId || "").trim(),
        phone: (() => {
          let p = String(rawRow["Phone (10 digits)"] || rawRow["Phone"] || rawRow.phone || "").replace(/\D/g, "");
          if (p.length === 12 && p.startsWith("91")) p = p.substring(2);
          return p;
        })(),
        email: rawRow["Email"] || rawRow.email ? String(rawRow["Email"] || rawRow.email).trim() : undefined,
        rollNumber: String(rawRow["Roll Number"] || rawRow.rollNumber || "").trim(),
        marksObtained: Number(rawRow["Marks (0-100)"] !== undefined ? rawRow["Marks (0-100)"] : rawRow.marksObtained),
        attendanceRate: Number(rawRow["Attendance (%)"] !== undefined ? rawRow["Attendance (%)"] : (rawRow.attendanceRate || 90)),
        district: String(rawRow["District"] || rawRow.district || trainingCentreDistrict).trim(),
      };

      const parseResult = candidateRowSchema.safeParse(rowData);

      if (!parseResult.success) {
        parseResult.error.issues.forEach((err: any) => {
          errors.push({
            rowNumber: rowNum,
            rollNumber: rowData.rollNumber,
            candidateName: rowData.fullName,
            field: err.path.join("."),
            value: (rowData as any)[err.path[0]],
            message: err.message,
          });
        });
        return;
      }

      if (seenRollNumbers.has(rowData.rollNumber)) {
        errors.push({
          rowNumber: rowNum,
          rollNumber: rowData.rollNumber,
          candidateName: rowData.fullName,
          field: "rollNumber",
          value: rowData.rollNumber,
          message: `Duplicate Roll Number '${rowData.rollNumber}' within this batch`,
        });
      } else {
        seenRollNumbers.add(rowData.rollNumber);
      }

      if (seenNationalIds.has(rowData.nationalId)) {
        errors.push({
          rowNumber: rowNum,
          rollNumber: rowData.rollNumber,
          candidateName: rowData.fullName,
          field: "nationalId",
          value: rowData.nationalId,
          message: `Duplicate National ID '${rowData.nationalId}' within this batch`,
        });
      } else {
        seenNationalIds.add(rowData.nationalId);
      }

      let grade = "Pass";
      if (rowData.marksObtained >= 85) grade = "A+";
      else if (rowData.marksObtained >= 70) grade = "A";
      else if (rowData.marksObtained >= 55) grade = "B";

      validatedRows.push({
        ...rowData,
        grade,
        hasPassed: rowData.marksObtained >= 40,
      });
    });

    if (errors.length > 0) {
      return res.status(422).json({
        success: false,
        message: `Validation failed: ${errors.length} error(s) found in uploaded spreadsheet. No data was saved.`,
        errorCount: errors.length,
        errors,
      });
    }

    try {
      const result = await prisma.$transaction(async (tx: any) => {
        const batchCount = await tx.batch.count();
        const batchNumber = `BATCH-${new Date().getFullYear()}-${String(batchCount + 1).padStart(4, "0")}`;
        const isFlaggedForQuality = validatedRows.length >= QUALITY_REVIEW_THRESHOLD;

        const newBatch = await tx.batch.create({
          data: {
            batchNumber,
            trainingCentreId: trainingCentreId!,
            courseName,
            courseCode,
            district: trainingCentreDistrict,
            totalCandidates: validatedRows.length,
            passedCandidates: validatedRows.filter((r) => r.hasPassed).length,
            status: BatchStatus.UNDER_DISTRICT_REVIEW,
            submittedAt: new Date(),
            isFlaggedForQuality,
            qualityReason: isFlaggedForQuality
              ? `Large batch (${validatedRows.length} candidates >= ${QUALITY_REVIEW_THRESHOLD} threshold) requires Quality Team scrutiny`
              : null,
            lastActionAt: new Date(),
          },
        });

        for (const row of validatedRows) {
          const candidate = await tx.candidate.upsert({
            where: { nationalId: row.nationalId },
            update: {
              fullName: row.fullName,
              fatherName: row.fatherName,
              phone: row.phone,
              email: row.email,
              district: row.district,
            },
            create: {
              nationalId: row.nationalId,
              fullName: row.fullName,
              fatherName: row.fatherName,
              phone: row.phone,
              email: row.email,
              district: row.district,
            },
          });

          await tx.batchCandidate.create({
            data: {
              batchId: newBatch.id,
              candidateId: candidate.id,
              rollNumber: row.rollNumber,
              marksObtained: row.marksObtained,
              totalMarks: 100,
              percentage: row.marksObtained,
              grade: row.grade,
              attendanceRate: row.attendanceRate,
              hasPassed: row.hasPassed,
            },
          });
        }

        return newBatch;
      });

      await AuditService.log({
        userId: user.id,
        action: "BATCH_CREATED",
        entityType: "Batch",
        entityId: result.id,
        batchId: result.id,
        details: {
          batchNumber: result.batchNumber,
          candidateCount: validatedRows.length,
          courseName,
        },
        ipAddress: req.ip,
      });

      return res.status(201).json({
        success: true,
        message: `Batch ${result.batchNumber} created successfully with ${validatedRows.length} candidates.`,
        batch: result,
      });
    } catch (dbError: any) {
      console.error("Batch creation transaction failed:", dbError);
      return res.status(500).json({
        success: false,
        message: `Failed to create batch: ${dbError.message}`,
      });
    }
  }

  static async getBatches(req: AuthenticatedRequest, res: Response) {
    const user = req.user!;
    const { status, search, district } = req.query;

    const where: any = {};

    if (user.role === Role.TRAINING_CENTRE && user.trainingCentreId) {
      where.trainingCentreId = user.trainingCentreId;
    } else if (user.role === Role.DISTRICT_OFFICER && user.district) {
      where.district = user.district;
    }

    if (status) {
      where.status = status as BatchStatus;
    }

    if (district && user.role !== Role.DISTRICT_OFFICER) {
      where.district = String(district);
    }

    if (search) {
      where.OR = [
        { batchNumber: { contains: String(search), mode: "insensitive" } },
        { courseName: { contains: String(search), mode: "insensitive" } },
        { courseCode: { contains: String(search), mode: "insensitive" } },
      ];
    }

    const batches = await prisma.batch.findMany({
      where,
      include: {
        trainingCentre: {
          select: { name: true, code: true, district: true },
        },
        approvals: {
          where: { isValid: true },
          include: {
            officer: { select: { fullName: true, role: true, email: true } },
          },
        },
        _count: {
          select: { candidates: true, certificates: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return res.json({
      success: true,
      count: batches.length,
      batches,
    });
  }

  static async getBatchById(req: AuthenticatedRequest, res: Response) {
    const id = String(req.params.id);

    const batch = await prisma.batch.findUnique({
      where: { id },
      include: {
        trainingCentre: true,
        candidates: {
          include: {
            candidate: true,
            certificate: {
              include: { deliveries: true },
            },
          },
          orderBy: { rollNumber: "asc" },
        },
        approvals: {
          include: {
            officer: {
              select: { id: true, fullName: true, role: true, district: true, email: true },
            },
          },
          orderBy: { createdAt: "asc" },
        },
        qualityReviews: {
          include: {
            reviewer: {
              select: { id: true, fullName: true, role: true, email: true },
            },
          },
          orderBy: { createdAt: "asc" },
        },
        auditLogs: {
          include: {
            user: { select: { fullName: true, role: true } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!batch) {
      return res.status(404).json({ success: false, message: "Batch not found" });
    }

    return res.json({ success: true, batch });
  }

  static async submitBatch(req: AuthenticatedRequest, res: Response) {
    const user = req.user!;
    const id = String(req.params.id);

    const batch = await prisma.batch.findUnique({
      where: { id },
      include: { candidates: true },
    });

    if (!batch) {
      return res.status(404).json({ success: false, message: "Batch not found" });
    }

    if (batch.status !== BatchStatus.DRAFT && batch.status !== BatchStatus.RETURNED_TO_CENTRE) {
      return res.status(400).json({
        success: false,
        message: `Batch cannot be submitted from status: ${batch.status}`,
      });
    }

    if (batch.candidates.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot submit an empty batch. Add candidates first.",
      });
    }

    const updated = await prisma.batch.update({
      where: { id },
      data: {
        status: BatchStatus.UNDER_DISTRICT_REVIEW,
        submittedAt: new Date(),
        lastActionAt: new Date(),
      },
    });

    await AuditService.log({
      userId: user.id,
      action: "BATCH_SUBMITTED",
      entityType: "Batch",
      entityId: id,
      batchId: id,
      details: {
        batchNumber: batch.batchNumber,
        totalCandidates: batch.totalCandidates,
      },
      ipAddress: req.ip,
    });

    return res.json({
      success: true,
      message: `Batch ${batch.batchNumber} submitted for District Officer review`,
      batch: updated,
    });
  }
}
