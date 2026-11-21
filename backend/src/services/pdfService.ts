import PDFDocument from "pdfkit";
import QRCode from "qrcode";

export interface CertificateData {
  certificateNumber: string;
  candidateName: string;
  fatherName?: string | null;
  rollNumber: string;
  courseName: string;
  courseCode: string;
  trainingCentreName: string;
  district: string;
  marksObtained: number;
  totalMarks: number;
  percentage: number;
  grade: string;
  issueDate: Date | string;
  verificationUrl: string;
}

export class PdfService {
  /**
   * Generates a QR Code as a base64 PNG data URL
   */
  static async generateQrCodeDataUrl(text: string): Promise<string> {
    return QRCode.toDataURL(text, {
      errorCorrectionLevel: "H",
      margin: 1,
      width: 256,
      color: {
        dark: "#1F2E4A", // Deep Navy
        light: "#FFFFFF",
      },
    });
  }

  /**
   * Generates a high-resolution QR Code as a raw PNG buffer
   */
  static async generateQrCodeBuffer(text: string): Promise<Buffer> {
    return QRCode.toBuffer(text, {
      errorCorrectionLevel: "H",
      margin: 1,
      width: 200,
      color: {
        dark: "#1F2E4A",
        light: "#FFFFFF",
      },
    });
  }

  /**
   * Generates an official Certificate PDF in Landscape format using PDFKit
   */
  static async generateCertificatePdf(data: CertificateData): Promise<Buffer> {
    return new Promise(async (resolve, reject) => {
      try {
        const qrBuffer = await this.generateQrCodeBuffer(data.verificationUrl);

        // Standard Landscape A4: 841.89 x 595.28 points
        const doc = new PDFDocument({
          size: "A4",
          layout: "landscape",
          margin: 40,
          info: {
            Title: `Certificate - ${data.certificateNumber}`,
            Author: "Pragati Skills Mission",
            Subject: data.courseName,
          },
        });

        const buffers: Buffer[] = [];
        doc.on("data", buffers.push.bind(buffers));
        doc.on("end", () => resolve(Buffer.concat(buffers)));
        doc.on("error", reject);

        const width = 841.89;
        const height = 595.28;

        // Outer ornate border (Deep Navy #1F2E4A)
        doc
          .lineWidth(3)
          .strokeColor("#1F2E4A")
          .rect(25, 25, width - 50, height - 50)
          .stroke();

        // Inner subtle border (Soft Grey #CED4DA)
        doc
          .lineWidth(1)
          .strokeColor("#CED4DA")
          .rect(32, 32, width - 64, height - 64)
          .stroke();

        // Corner decorative accents
        const cornerSize = 18;
        const corners = [
          [35, 35],
          [width - 35 - cornerSize, 35],
          [35, height - 35 - cornerSize],
          [width - 35 - cornerSize, height - 35 - cornerSize],
        ];
        doc.fillColor("#1F2E4A");
        corners.forEach(([cx, cy]) => {
          doc.rect(cx, cy, cornerSize, cornerSize).fill();
        });

        // Top Header
        doc
          .fontSize(12)
          .fillColor("#343A40")
          .font("Helvetica-Bold")
          .text("GOVERNMENT SKILL DEVELOPMENT & CERTIFICATION AUTHORITY", 0, 55, {
            align: "center",
          });

        doc
          .fontSize(22)
          .fillColor("#1F2E4A")
          .font("Helvetica-Bold")
          .text("PRAGATI SKILLS MISSION", 0, 75, {
            align: "center",
          });

        doc
          .fontSize(10)
          .fillColor("#6C757D")
          .font("Helvetica")
          .text("STATE DIRECTORATE OF VOCATIONAL TRAINING & EMPLOYABILITY", 0, 102, {
            align: "center",
          });

        // Certificate Title Ribbon
        doc
          .fontSize(24)
          .fillColor("#1F2E4A")
          .font("Helvetica-Bold")
          .text("CERTIFICATE OF PROFICIENCY", 0, 135, {
            align: "center",
          });

        doc
          .lineWidth(1.5)
          .strokeColor("#1F2E4A")
          .moveTo(width / 2 - 120, 168)
          .lineTo(width / 2 + 120, 168)
          .stroke();

        // Main Body Prose
        doc
          .fontSize(11)
          .fillColor("#343A40")
          .font("Helvetica")
          .text("This is to formally certify that", 0, 185, {
            align: "center",
          });

        // Candidate Name
        doc
          .fontSize(22)
          .fillColor("#1F2E4A")
          .font("Helvetica-Bold")
          .text(data.candidateName.toUpperCase(), 0, 205, {
            align: "center",
          });

        const fatherText = data.fatherName ? ` S/o / D/o ${data.fatherName}` : "";
        doc
          .fontSize(11)
          .fillColor("#495057")
          .font("Helvetica")
          .text(
            `Roll No: ${data.rollNumber}${fatherText} has successfully cleared the competency assessment for`,
            0,
            235,
            { align: "center" }
          );

        // Course Name
        doc
          .fontSize(16)
          .fillColor("#1F2E4A")
          .font("Helvetica-Bold")
          .text(data.courseName, 0, 255, {
            align: "center",
          });

        doc
          .fontSize(10)
          .fillColor("#6C757D")
          .font("Helvetica-Oblique")
          .text(`Curriculum Framework Code: ${data.courseCode}`, 0, 278, {
            align: "center",
          });

        // Details Block (Centre, District, Grade, Marks)
        doc
          .fontSize(11)
          .fillColor("#343A40")
          .font("Helvetica")
          .text(
            `Conducted at ${data.trainingCentreName} (${data.district}) with Grade `,
            0,
            305,
            { continued: true, align: "center" }
          )
          .font("Helvetica-Bold")
          .fillColor("#1F2E4A")
          .text(`${data.grade} (${data.percentage.toFixed(1)}%)`, { continued: false });

        // QR Code embedding (Lower left)
        const qrX = 70;
        const qrY = 380;
        doc.image(qrBuffer, qrX, qrY, { width: 95, height: 95 });

        doc
          .fontSize(8)
          .fillColor("#6C757D")
          .font("Helvetica")
          .text("Scan QR Code or visit", qrX, qrY + 102, { width: 120 })
          .text("certiflow.gov/verify to validate", qrX, qrY + 112, { width: 150 });

        // Certificate Meta Block (Center lower)
        doc
          .fontSize(9)
          .fillColor("#343A40")
          .font("Helvetica-Bold")
          .text("Certificate ID:", 260, 420)
          .font("Helvetica")
          .text(data.certificateNumber, 350, 420);

        const dateStr =
          typeof data.issueDate === "string"
            ? data.issueDate
            : data.issueDate.toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              });

        doc
          .font("Helvetica-Bold")
          .text("Date of Issuance:", 260, 440)
          .font("Helvetica")
          .text(dateStr, 350, 440);

        doc
          .font("Helvetica-Bold")
          .text("Issuing Mission:", 260, 460)
          .font("Helvetica")
          .text("Pragati Skills Mission Directorate", 350, 460);

        // Signatures (Lower right)
        const sigX = 600;
        const sigY = 430;

        doc
          .lineWidth(1)
          .strokeColor("#343A40")
          .moveTo(sigX, sigY)
          .lineTo(sigX + 170, sigY)
          .stroke();

        doc
          .fontSize(10)
          .fillColor("#1F2E4A")
          .font("Helvetica-Bold")
          .text("State Director", sigX, sigY + 8, { width: 170, align: "center" })
          .fontSize(8)
          .fillColor("#6C757D")
          .font("Helvetica")
          .text("State Mission Director", sigX, sigY + 22, { width: 170, align: "center" })
          .text("State Skills Mission Directorate", sigX, sigY + 34, { width: 170, align: "center" });

        // Bottom security footer
        doc
          .fontSize(7.5)
          .fillColor("#868E96")
          .font("Helvetica")
          .text(
            "This is an electronically verifiable certificate issued under the State Digital Certification Framework. Tampering voids this credential.",
            0,
            550,
            { align: "center" }
          );

        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }
}

