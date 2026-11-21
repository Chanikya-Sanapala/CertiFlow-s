import prisma from "./config/db";
import { redisConnection } from "./config/redis";

/**
 * Controlled Database Cleanup Script
 * Clears all operational records (batches, candidates, certificates, deliveries, approvals, audit logs)
 * while safely preserving the 5 official authentication accounts and training centres.
 */
async function cleanDatabase() {
  console.log("🧹 Starting CertiFlow operational data cleanup...");

  try {
    // 1. Flush Redis queue to eliminate orphan delivery jobs
    try {
      await redisConnection.flushdb();
      console.log("  ✅ Redis queues flushed cleanly.");
    } catch (e) {
      console.warn("  ⚠️ Redis flush skipped or unavailable:", e);
    }

    // 2. Clean operational tables in reverse foreign-key dependency order
    const delDeliveries = await prisma.certificateDelivery.deleteMany();
    const delCertificates = await prisma.certificate.deleteMany();
    const delQuality = await prisma.qualityReview.deleteMany();
    const delApprovals = await prisma.approval.deleteMany();
    const delBatchCandidates = await prisma.batchCandidate.deleteMany();
    const delAuditLogs = await prisma.auditLog.deleteMany();
    const delNotifications = await prisma.notification.deleteMany();
    const delCandidates = await prisma.candidate.deleteMany();
    const delBatches = await prisma.batch.deleteMany();

    console.log(`  ✅ Removed ${delDeliveries.count} certificate delivery records.`);
    console.log(`  ✅ Removed ${delCertificates.count} certificates.`);
    console.log(`  ✅ Removed ${delQuality.count} quality review records.`);
    console.log(`  ✅ Removed ${delApprovals.count} approval records.`);
    console.log(`  ✅ Removed ${delBatchCandidates.count} batch candidate associations.`);
    console.log(`  ✅ Removed ${delCandidates.count} student/candidate records.`);
    console.log(`  ✅ Removed ${delBatches.count} batches.`);
    console.log(`  ✅ Removed ${delAuditLogs.count} audit logs.`);
    console.log(`  ✅ Removed ${delNotifications.count} notifications.`);

    // 3. Verify that official accounts and training centres remain intact
    const remainingUsers = await prisma.user.count();
    const remainingCentres = await prisma.trainingCentre.count();

    console.log(`  🔒 Preserved ${remainingUsers} official accounts (Training Centre & Officers).`);
    console.log(`  🔒 Preserved ${remainingCentres} accredited training centres.`);

    // 4. Verify that operational tables are completely empty (0 records)
    const [
      batchesCount,
      candidatesCount,
      certificatesCount,
      deliveriesCount,
      approvalsCount,
      qualityCount,
    ] = await Promise.all([
      prisma.batch.count(),
      prisma.candidate.count(),
      prisma.certificate.count(),
      prisma.certificateDelivery.count(),
      prisma.approval.count(),
      prisma.qualityReview.count(),
    ]);

    console.log("\n📊 Verification of Clean State (Operational Record Counts):");
    console.log(`   - Batches:             ${batchesCount}`);
    console.log(`   - Candidates:          ${candidatesCount}`);
    console.log(`   - Certificates:        ${certificatesCount}`);
    console.log(`   - Deliveries:          ${deliveriesCount}`);
    console.log(`   - Pending Approvals:   ${approvalsCount}`);
    console.log(`   - Quality Reviews:     ${qualityCount}`);

    if (
      batchesCount === 0 &&
      candidatesCount === 0 &&
      certificatesCount === 0 &&
      deliveriesCount === 0 &&
      approvalsCount === 0 &&
      qualityCount === 0
    ) {
      console.log("\n🎉 Clean state confirmed: All operational tables are at 0 records!");
    } else {
      console.warn("\n⚠️ Warning: Some operational records still remain.");
    }
  } catch (error) {
    console.error("❌ Cleanup failed with error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    try {
      await redisConnection.quit();
    } catch {}
    process.exit(0);
  }
}

cleanDatabase();

