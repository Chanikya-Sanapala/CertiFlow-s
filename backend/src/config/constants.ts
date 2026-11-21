export const JWT_SECRET = process.env.JWT_SECRET || "certiflow_hackathon_super_secret_jwt_key_2026";
export const JWT_EXPIRES_IN = "24h";

// Configurable required district endorsements (Default: 2 independent officers)
export const REQUIRED_DISTRICT_APPROVALS = Number(process.env.REQUIRED_DISTRICT_APPROVALS) || 2;

// Large batch threshold for mandatory quality scrutiny
export const QUALITY_REVIEW_THRESHOLD = 20;

// SLA threshold: batches untouched past 48 hours are flagged as stuck
export const SLA_HOURS_THRESHOLD = 48;

// WhatsApp Delivery Configuration
export const WHATSAPP_DELIVERY_MODE = process.env.WHATSAPP_DELIVERY_MODE || "DEMO_SIMULATION";
export const SIMULATED_DELIVERY_FAILURE_RATE = Number(process.env.SIMULATED_DELIVERY_FAILURE_RATE) || 0.15;
export const DEMO_MODE_NOTICE = "DEMO MODE — WhatsApp delivery simulated. No actual message was sent.";

// Google OAuth Configuration
export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
export const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";

export const ROLES = {
  TRAINING_CENTRE: "TRAINING_CENTRE",
  DISTRICT_OFFICER: "DISTRICT_OFFICER",
  QUALITY_TEAM: "QUALITY_TEAM",
  STATE_OFFICE: "STATE_OFFICE",
} as const;

// Professional Demo Accounts Definition (NO personal names)
export const DEMO_ACCOUNTS = [
  {
    email: "training.centre@certiflow.gov",
    fullName: "Training Centre",
    role: "TRAINING_CENTRE",
    assignment: "Registered Centre (District North)",
    department: "Vocational Operations",
    district: "District North",
    description: "Uploads batches, manages student rosters, corrects invalid records",
  },
  {
    email: "district.officer1@certiflow.gov",
    fullName: "District Officer 1",
    role: "DISTRICT_OFFICER",
    assignment: "District North",
    department: "District Skills Office - North",
    district: "District North",
    description: "First district endorsement; verifies course attendance & assessment",
  },
  {
    email: "district.officer2@certiflow.gov",
    fullName: "District Officer 2",
    role: "DISTRICT_OFFICER",
    assignment: "District North",
    department: "District Skills Office - North",
    district: "District North",
    description: "Second independent endorsement to reach mandatory 2-officer quorum",
  },
  {
    email: "quality.reviewer@certiflow.gov",
    fullName: "Quality Reviewer",
    role: "QUALITY_TEAM",
    assignment: "State Quality Team",
    department: "Quality Assurance Directorate",
    district: null,
    description: "Audits large candidate cohorts (>20) and verifies assessment integrity",
  },
  {
    email: "state.director@certiflow.gov",
    fullName: "State Director",
    role: "STATE_OFFICE",
    assignment: "State Level",
    department: "State Skills Directorate HQ",
    district: null,
    description: "Final state sign-off, PDF certificate issuance, and credential revocation",
  },
] as const;
