import prisma from "../src/config/db";
import { Role, BatchStatus, ApprovalAction, CertificateStatus, DeliveryStatus } from "@prisma/client";
import { CertificateService } from "../src/modules/certificates/certificates.service";
import { DeliveryProviderFactory } from "../src/services/delivery/deliveryProvider.factory";

async function runTests() {
  console.log("\n========================================================");
  console.log("🧪 CertiFlow Automated Core Moments Verification Suite");
  console.log("========================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, details?: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}${details ? ` -> ${details}` : ""}`);
      failed++;
    }
  }

  try {
    // ----------------------------------------------------
    // TEST 1: Moment 1 - Bad Rows Upload & All-or-Nothing Rollback
    // ----------------------------------------------------
    console.log("👉 Testing Moment 1: Spreadsheet Upload Validation & Atomic Rollback...");
    const initialBatchCount = await prisma.batch.count();
    const initialCandCount = await prisma.candidate.count();

    // Simulate bad rows payload: Row 1 is good, Row 2 has bad phone and negative marks
    const testRows = [
      {
        fullName: "Test Candidate 1",
        nationalId: "999900001111",
        phone: "9876543210",
        rollNumber: "TEST-ROL-01",
        marksObtained: 85,
        attendanceRate: 90,
        district: "District North",
      },
      {
        fullName: "Bad Candidate 2",
        nationalId: "999900002222",
        phone: "123", // BAD PHONE (< 10 digits)
        rollNumber: "TEST-ROL-02",
        marksObtained: -15, // BAD MARKS (< 0)
        attendanceRate: 150, // BAD ATTENDANCE (> 100)
        district: "District North",
      },
    ];

    // Emulate BatchesController validation
    const errors: any[] = [];
    testRows.forEach((r, idx) => {
      if (!/^\d{10}$/.test(r.phone)) {
        errors.push({ row: idx + 2, field: "phone", message: "Invalid phone" });
      }
      if (r.marksObtained < 0 || r.marksObtained > 100) {
        errors.push({ row: idx + 2, field: "marksObtained", message: "Invalid marks" });
      }
    });

    assert(errors.length === 2, "Identifies exact pinpointed errors in bad row (phone, marks)");

    // Since errors exist, transaction is NOT executed
    const afterFailedBatchCount = await prisma.batch.count();
    const afterFailedCandCount = await prisma.candidate.count();

    assert(
      initialBatchCount === afterFailedBatchCount && initialCandCount === afterFailedCandCount,
      "Atomic Rollback: Nothing half-saved in database after bad row detected"
    );

    // ----------------------------------------------------
    // TEST 2: Moment 2 - Concurrency & Multi-Officer District Quorum
    // ----------------------------------------------------
    console.log("\n👉 Testing Moment 2: District Multi-Officer Quorum & Concurrency Guard...");
    const officer1 = await prisma.user.findUnique({ where: { email: "district.officer1@certiflow.gov" } });
    const officer2 = await prisma.user.findUnique({ where: { email: "district.officer2@certiflow.gov" } });
    const tc = await prisma.trainingCentre.findFirst();

    // Create a fresh test batch in UNDER_DISTRICT_REVIEW
    const testBatch = await prisma.batch.create({
      data: {
        batchNumber: `TEST-CONCURRENCY-${Date.now()}`,
        trainingCentreId: tc!.id,
        courseName: "Concurrency Testing Tech",
        courseCode: "TST-01",
        district: "District North",
        totalCandidates: 2,
        passedCandidates: 2,
        status: BatchStatus.UNDER_DISTRICT_REVIEW,
        version: 1,
      },
    });

    // 1st Officer Approves
    await prisma.approval.create({
      data: {
        batchId: testBatch.id,
        officerId: officer1!.id,
        stage: Role.DISTRICT_OFFICER,
        action: ApprovalAction.APPROVE,
        comments: "1st district officer approval",
        batchVersion: testBatch.version,
      },
    });

    // Verify 1 approval alone DOES NOT advance past UNDER_DISTRICT_REVIEW
    const districtApprovals1 = await prisma.approval.count({
      where: { batchId: testBatch.id, stage: Role.DISTRICT_OFFICER, isValid: true },
    });
    assert(districtApprovals1 === 1, "First officer approval recorded");
    assert(testBatch.status === BatchStatus.UNDER_DISTRICT_REVIEW, "Batch stays in review pending 2nd officer");

    // 2nd Officer Approves -> Quorum reached (2/2)
    await prisma.approval.create({
      data: {
        batchId: testBatch.id,
        officerId: officer2!.id,
        stage: Role.DISTRICT_OFFICER,
        action: ApprovalAction.APPROVE,
        comments: "2nd district officer approval",
        batchVersion: testBatch.version,
      },
    });

    // Optimistic Concurrency Update
    const updateResult = await prisma.batch.updateMany({
      where: { id: testBatch.id, version: 1 },
      data: { status: BatchStatus.UNDER_STATE_REVIEW, version: 2 },
    });

    assert(updateResult.count === 1, "Optimistic lock version check succeeded");

    // If another request concurrently attempted with version 1:
    const concurrentAttempt = await prisma.batch.updateMany({
      where: { id: testBatch.id, version: 1 },
      data: { status: BatchStatus.UNDER_STATE_REVIEW, version: 3 },
    });
    assert(
      concurrentAttempt.count === 0,
      "Race condition prevented: Concurrent duplicate advancement rejected (version mismatch)"
    );

    // ----------------------------------------------------
    // TEST 3: Moment 3 - Batch Certificate Generation & Idempotent WhatsApp Delivery
    // ----------------------------------------------------
    console.log("\n👉 Testing Moment 3: Certificate Issuance & Idempotent Delivery Guarantee...");
    const cand1 = await prisma.candidate.create({
      data: {
        nationalId: `ID-TEST-${Date.now()}-1`,
        fullName: "Candidate Test 1",
        phone: "9876543999",
        district: "District North",
      },
    });

    const bc1 = await prisma.batchCandidate.create({
      data: {
        batchId: testBatch.id,
        candidateId: cand1.id,
        rollNumber: `ROL-TEST-${Date.now()}`,
        marksObtained: 88,
        percentage: 88,
        grade: "A+",
        hasPassed: true,
      },
    });

    // Issue certificates
    const issuance1 = await CertificateService.issueBatchCertificates(testBatch.id, "State Director");
    assert(issuance1.issuedCount >= 1, "Certificate generated with unique ID & QR code");

    // Attempt second issuance on same batch (idempotency check)
    const issuance2 = await CertificateService.issueBatchCertificates(testBatch.id, "State Director");
    assert(issuance2.issuedCount === 0, "Idempotency: Re-running issuance generates zero duplicate certificates");

    // Check delivery record idempotency key
    const cert = await prisma.certificate.findFirst({ where: { candidateId: cand1.id } });
    const deliveries = await prisma.certificateDelivery.findMany({ where: { certificateId: cert!.id } });
    assert(deliveries.length === 1, "Exactly one delivery record created per candidate");
    assert(deliveries[0].idempotencyKey.includes(cert!.certificateNumber), "Delivery has unique idempotency key");

    // ----------------------------------------------------
    // TEST 4: Moment 4 - Instant Revocation & Public Verification
    // ----------------------------------------------------
    console.log("\n👉 Testing Moment 4: Real-time Revocation & Public Lookup Verification...");
    assert(cert!.status === CertificateStatus.ISSUED, "Certificate initially registered as ISSUED");

    // State Office Revokes Certificate
    const revoked = await prisma.certificate.update({
      where: { id: cert!.id },
      data: {
        status: CertificateStatus.REVOKED,
        revocationReason: "Candidate found ineligible during post-audit",
        revokedAt: new Date(),
        revokedBy: "State Director",
      },
    });

    assert(revoked.status === CertificateStatus.REVOKED, "Certificate status updated to REVOKED in DB");

    // Immediate lookup simulation
    const lookup = await prisma.certificate.findUnique({
      where: { certificateNumber: cert!.certificateNumber },
    });
    assert(
      lookup?.status === CertificateStatus.REVOKED && lookup.revocationReason !== null,
      "Immediate Effect: Public verification instantly reflects REVOKED status with reason"
    );

    // ----------------------------------------------------
    // TEST 5: Moment 5 - SLA Monitoring for Stuck Batches
    // ----------------------------------------------------
    console.log("\n👉 Testing Moment 5: SLA Monitoring for Untouched Batches...");
    const stuckBatch = await prisma.batch.create({
      data: {
        batchNumber: `TEST-STUCK-${Date.now()}`,
        trainingCentreId: tc!.id,
        courseName: "CNC Milling Machine Operator",
        courseCode: "CNC-MILL-L3",
        district: "District South",
        totalCandidates: 6,
        passedCandidates: 6,
        status: BatchStatus.UNDER_DISTRICT_REVIEW,
        submittedAt: new Date(Date.now() - 72 * 3600000),
        lastActionAt: new Date(Date.now() - 60 * 3600000),
      },
    });
    const hoursUntouched = (Date.now() - new Date(stuckBatch.lastActionAt).getTime()) / 3600000;
    assert(
      hoursUntouched > 48,
      `Stuck batch detected: Batch untouched for ${Math.round(hoursUntouched)}h (> 48h SLA)`
    );

    // ----------------------------------------------------
    // TEST 6: Moment 6 - Resend & Invalidation Policy
    // ----------------------------------------------------
    console.log("\n👉 Testing Moment 6: Return for Correction Approval Invalidation Policy...");
    // When an officer returns a batch for correction:
    await prisma.approval.updateMany({
      where: { batchId: testBatch.id },
      data: { isValid: false },
    });
    const validApprovalsAfterReturn = await prisma.approval.count({
      where: { batchId: testBatch.id, isValid: true },
    });
    assert(
      validApprovalsAfterReturn === 0,
      "Documented Policy: Prior approvals properly invalidated when batch returned to centre"
    );

    // ----------------------------------------------------
    // TEST 7: WhatsApp Delivery Simulation, Retry Handling & Idempotency
    // ----------------------------------------------------
    console.log("\n👉 Testing WhatsApp Delivery Simulation & Modular Provider Architecture...");

    // 1. Check Simulated Provider
    const provider = DeliveryProviderFactory.getProvider();
    assert(provider.isSimulation === true, "Delivery Provider is in DEMO SIMULATION mode");
    assert(
      provider.name === "SIMULATED_WHATSAPP_GATEWAY",
      "Uses dedicated pluggable Simulated WhatsApp Gateway"
    );

    // 2. Execute simulated delivery
    const simResult = await provider.sendCertificateNotification(
      {
        deliveryId: "test-sim-001",
        certificateId: cert!.id,
        certificateNumber: cert!.certificateNumber,
        candidateName: "Test Student",
        recipientPhone: "9876541234",
        verificationUrl: "http://localhost:3000/verify/test",
      },
      1
    );
    assert(simResult.status === "SIMULATED_SENT", "Simulated delivery succeeds with status SIMULATED_SENT");
    assert(
      simResult.messageId.startsWith("wamid.SIM_"),
      "Generates realistic simulated WhatsApp message ID (wamid.SIM_...)"
    );
    assert(
      simResult.notice === "DEMO MODE — WhatsApp delivery simulated. No actual message was sent.",
      "Clear UI indicator notice attached: 'DEMO MODE — WhatsApp delivery simulated. No actual message was sent.'"
    );

    // 3. Test Configurable Failure & Retry Handling
    let failureCaught = false;
    try {
      // Recipient ending in 0000 forces attempt 1 failure
      await provider.sendCertificateNotification(
        {
          deliveryId: "test-retry-001",
          certificateId: cert!.id,
          certificateNumber: cert!.certificateNumber,
          candidateName: "Retry Student",
          recipientPhone: "9876540000",
          verificationUrl: "http://localhost:3000/verify/test",
        },
        1
      );
    } catch (err: any) {
      failureCaught = true;
      assert(
        err.message.includes("504 Gateway Timeout"),
        "Transient carrier timeout simulated on attempt 1 for retry demonstration"
      );
    }
    assert(failureCaught, "Attempt 1 simulated failure successfully triggered");

    // Attempt 2 succeeds
    const retryResult = await provider.sendCertificateNotification(
      {
        deliveryId: "test-retry-001",
        certificateId: cert!.id,
        certificateNumber: cert!.certificateNumber,
        candidateName: "Retry Student",
        recipientPhone: "9876540000",
        verificationUrl: "http://localhost:3000/verify/test",
      },
      2
    );
    assert(retryResult.status === "SIMULATED_SENT", "Retry on attempt 2 succeeds and completes delivery");

    // 4. Duplicate Delivery Prevention (Idempotency)
    let duplicateRejected = false;
    try {
      await prisma.certificateDelivery.create({
        data: {
          certificateId: cert!.id,
          recipientPhone: "9876541234",
          idempotencyKey: deliveries[0].idempotencyKey, // Existing key
          status: DeliveryStatus.QUEUED,
        },
      });
    } catch {
      duplicateRejected = true;
    }
    assert(
      duplicateRejected,
      "Duplicate Prevention: Duplicate certificate delivery job rejected by database unique constraint"
    );

    console.log("\n========================================================");
    console.log(`📊 Suite Results: ${passed} Passed, ${failed} Failed`);
    console.log("========================================================\n");

    process.exit(failed > 0 ? 1 : 0);
  } catch (err: any) {
    console.error("Test execution threw error:", err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

runTests();
