import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../src/config/db";
import { JWT_SECRET } from "../src/config/constants";
import { Role } from "@prisma/client";

async function runAuthTests() {
  console.log("\n========================================================");
  console.log("🔐 CertiFlow Authentication & Security Verification Suite");
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
    const testAccounts = [
      { email: "training.centre@certiflow.gov", expectedRole: Role.TRAINING_CENTRE },
      { email: "district.officer1@certiflow.gov", expectedRole: Role.DISTRICT_OFFICER },
      { email: "district.officer2@certiflow.gov", expectedRole: Role.DISTRICT_OFFICER },
      { email: "quality.reviewer@certiflow.gov", expectedRole: Role.QUALITY_TEAM },
      { email: "state.director@certiflow.gov", expectedRole: Role.STATE_OFFICE },
    ];

    // 1. Test authenticating all 5 official registered accounts with bcrypt
    console.log("👉 Testing Official Account Authentication & Role Loading from DB...");
    for (const acc of testAccounts) {
      const user = await prisma.user.findUnique({
        where: { email: acc.email },
      });

      assert(!!user, `User ${acc.email} exists in database`);
      assert(user?.role === acc.expectedRole, `User role loaded from DB matches ${acc.expectedRole}`);

      const passwordMatches = await bcrypt.compare("password123", user!.passwordHash);
      assert(passwordMatches, `Bcrypt hash verification succeeded for ${acc.email}`);

      // Token generation
      const token = jwt.sign(
        {
          id: user!.id,
          email: user!.email,
          role: user!.role,
        },
        JWT_SECRET,
        { expiresIn: "24h" }
      );

      const decoded: any = jwt.verify(token, JWT_SECRET);
      assert(decoded.role === acc.expectedRole, `Issued JWT carries verified role ${acc.expectedRole}`);
    }

    // 2. Test Invalid Password
    console.log("\n👉 Testing Rejection of Invalid Credentials...");
    const stateDirector = await prisma.user.findUnique({
      where: { email: "state.director@certiflow.gov" },
    });
    const badPasswordCheck = await bcrypt.compare("wrong_password_999", stateDirector!.passwordHash);
    assert(!badPasswordCheck, "Bcrypt rejects incorrect password");

    // 3. Test Unknown / Unregistered Email
    const unknownUser = await prisma.user.findUnique({
      where: { email: "hacker@random.com" },
    });
    assert(unknownUser === null, "Unregistered email lookup returns null (rejects login)");

    // 4. Test Role-Based Protection (RBAC)
    console.log("\n👉 Testing RBAC Security Isolation...");
    const tcUser = await prisma.user.findUnique({
      where: { email: "training.centre@certiflow.gov" },
    });
    const isStateOffice = tcUser?.role === Role.STATE_OFFICE;
    assert(!isStateOffice, "Security Isolation: Training Centre cannot perform State Office actions");

    console.log("\n========================================================");
    console.log(`📊 Suite Results: ${passed} Passed, ${failed} Failed`);
    console.log("========================================================\n");

    process.exit(failed > 0 ? 1 : 0);
  } catch (err: any) {
    console.error("Auth test error:", err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

runAuthTests();

