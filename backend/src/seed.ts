import bcrypt from "bcryptjs";
import prisma from "./config/db";
import { Role } from "@prisma/client";
import { redisConnection } from "./config/redis";

async function main() {
  console.log("🌱 Starting CertiFlow database initialization (Official Accounts Only)...");

  // Flush Redis queue to eliminate orphan jobs
  try {
    await redisConnection.flushdb();
    console.log("🧹 Redis queue flushed.");
  } catch (e) {
    console.warn("Could not flush Redis during seed:", e);
  }

  // Clear existing operational data cleanly in reverse dependency order
  await prisma.certificateDelivery.deleteMany();
  await prisma.certificate.deleteMany();
  await prisma.qualityReview.deleteMany();
  await prisma.approval.deleteMany();
  await prisma.batchCandidate.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.candidate.deleteMany();
  await prisma.batch.deleteMany();

  const defaultPasswordHash = await bcrypt.hash("password123", 10);

  // 1. Create or ensure Accredited Training Centres exist
  const apexCentre = await prisma.trainingCentre.upsert({
    where: { code: "TC-NO-01" },
    update: {
      name: "Apex Skill Development Institute",
      district: "District North",
      contactEmail: "contact@apexskills.org",
      contactPhone: "9876543001",
      address: "Plot 42, Industrial Area Phase II, North Zone",
    },
    create: {
      code: "TC-NO-01",
      name: "Apex Skill Development Institute",
      district: "District North",
      contactEmail: "contact@apexskills.org",
      contactPhone: "9876543001",
      address: "Plot 42, Industrial Area Phase II, North Zone",
    },
  });

  const vanguardCentre = await prisma.trainingCentre.upsert({
    where: { code: "TC-SO-02" },
    update: {
      name: "Vanguard Technical Academy",
      district: "District South",
      contactEmail: "info@vanguardacademy.edu",
      contactPhone: "9876543002",
      address: "109 Knowledge Park, South Zone",
    },
    create: {
      code: "TC-SO-02",
      name: "Vanguard Technical Academy",
      district: "District South",
      contactEmail: "info@vanguardacademy.edu",
      contactPhone: "9876543002",
      address: "109 Knowledge Park, South Zone",
    },
  });

  // 2. Create or ensure the 5 Official Authentication Accounts exist
  const users = [
    {
      email: "training.centre@certiflow.gov",
      fullName: "Training Centre",
      role: Role.TRAINING_CENTRE,
      district: "District North",
      department: "Vocational Operations",
      trainingCentreId: apexCentre.id,
      phone: "9876500001",
    },
    {
      email: "district.officer1@certiflow.gov",
      fullName: "District Officer 1",
      role: Role.DISTRICT_OFFICER,
      district: "District North",
      department: "District Skills Office - North",
      phone: "9876500002",
    },
    {
      email: "district.officer2@certiflow.gov",
      fullName: "District Officer 2",
      role: Role.DISTRICT_OFFICER,
      district: "District North",
      department: "District Skills Office - North",
      phone: "9876500003",
    },
    {
      email: "quality.reviewer@certiflow.gov",
      fullName: "Quality Reviewer",
      role: Role.QUALITY_TEAM,
      district: null,
      department: "Quality Assurance & Compliance Directorate",
      phone: "9876500004",
    },
    {
      email: "state.director@certiflow.gov",
      fullName: "State Director",
      role: Role.STATE_OFFICE,
      district: null,
      department: "State Skills Mission Headquarters",
      phone: "9876500005",
    },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {
        fullName: u.fullName,
        role: u.role,
        district: u.district,
        department: u.department,
        trainingCentreId: u.trainingCentreId || null,
        phone: u.phone,
      },
      create: {
        email: u.email,
        passwordHash: defaultPasswordHash,
        fullName: u.fullName,
        role: u.role,
        district: u.district,
        department: u.department,
        trainingCentreId: u.trainingCentreId || null,
        phone: u.phone,
      },
    });
  }

  console.log("✅ 5 Official Government Authentication Accounts initialized successfully.");
  console.log("✅ Zero operational batches or certificates seeded (Clean Canvas).");
}

main()
  .catch((e) => {
    console.error("Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    try {
      await redisConnection.quit();
    } catch {}
    process.exit(0);
  });
