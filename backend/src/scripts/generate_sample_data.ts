import * as XLSX from "xlsx";
import * as fs from "fs";
import * as path from "path";

const targetDir = path.resolve(__dirname, "../../../sample-data");
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// -------------------------------------------------------------
// 1. Generate Valid 10-Student Sample Excel File
// -------------------------------------------------------------
const validStudents = [
  {
    "Full Name": "Aarav Sharma",
    "Father Name": "Ramesh Sharma",
    "National ID": "987654321001",
    "Phone (10 digits)": "+919876543011",
    "Email": "aarav.sharma@example.com",
    "Roll Number": "ROL-2026-N001",
    "Marks (0-100)": 92,
    "Attendance (%)": 96,
    "District": "District North",
  },
  {
    "Full Name": "Pooja Patel",
    "Father Name": "Kirit Patel",
    "National ID": "987654321002",
    "Phone (10 digits)": "+919876543012",
    "Email": "pooja.patel@example.com",
    "Roll Number": "ROL-2026-N002",
    "Marks (0-100)": 88,
    "Attendance (%)": 94,
    "District": "District North",
  },
  {
    "Full Name": "Rahul Verma",
    "Father Name": "Suresh Verma",
    "National ID": "987654321003",
    "Phone (10 digits)": "+919876543013",
    "Email": "rahul.verma@example.com",
    "Roll Number": "ROL-2026-N003",
    "Marks (0-100)": 74,
    "Attendance (%)": 90,
    "District": "District North",
  },
  {
    "Full Name": "Sneha Reddy",
    "Father Name": "Venkat Reddy",
    "National ID": "987654321004",
    "Phone (10 digits)": "+919876543014",
    "Email": "sneha.reddy@example.com",
    "Roll Number": "ROL-2026-N004",
    "Marks (0-100)": 85,
    "Attendance (%)": 98,
    "District": "District North",
  },
  {
    "Full Name": "Vikramaditya Rao",
    "Father Name": "Narayana Rao",
    "National ID": "987654321005",
    "Phone (10 digits)": "+919876543015",
    "Email": "vikram.rao@example.com",
    "Roll Number": "ROL-2026-N005",
    "Marks (0-100)": 78,
    "Attendance (%)": 92,
    "District": "District North",
  },
  {
    "Full Name": "Ananya Gupta",
    "Father Name": "Pradeep Gupta",
    "National ID": "987654321006",
    "Phone (10 digits)": "+919876543016",
    "Email": "ananya.gupta@example.com",
    "Roll Number": "ROL-2026-N006",
    "Marks (0-100)": 90,
    "Attendance (%)": 95,
    "District": "District North",
  },
  {
    "Full Name": "Mohammad Zaid",
    "Father Name": "Tariq Zaid",
    "National ID": "987654321007",
    "Phone (10 digits)": "+919876543017",
    "Email": "mohammad.zaid@example.com",
    "Roll Number": "ROL-2026-N007",
    "Marks (0-100)": 68,
    "Attendance (%)": 88,
    "District": "District North",
  },
  {
    "Full Name": "Deepa Nair",
    "Father Name": "Madhavan Nair",
    "National ID": "987654321008",
    "Phone (10 digits)": "+919876543018",
    "Email": "deepa.nair@example.com",
    "Roll Number": "ROL-2026-N008",
    "Marks (0-100)": 82,
    "Attendance (%)": 91,
    "District": "District North",
  },
  {
    "Full Name": "Rohan Deshmukh",
    "Father Name": "Vilas Deshmukh",
    "National ID": "987654321009",
    "Phone (10 digits)": "+919876543019",
    "Email": "rohan.deshmukh@example.com",
    "Roll Number": "ROL-2026-N009",
    "Marks (0-100)": 76,
    "Attendance (%)": 89,
    "District": "District North",
  },
  {
    "Full Name": "Kavita Meena",
    "Father Name": "Harish Meena",
    "National ID": "987654321010",
    "Phone (10 digits)": "+919876543020",
    "Email": "kavita.meena@example.com",
    "Roll Number": "ROL-2026-N010",
    "Marks (0-100)": 94,
    "Attendance (%)": 97,
    "District": "District North",
  },
];

const instructionsData = [
  { "Section": "Overview", "Details": "CertiFlow Official Batch Upload Template for Accredited Training Centres." },
  { "Section": "Instructions", "Details": "1. Fill candidate data on the first sheet ('Candidate Roster'). Do not alter column headers." },
  { "Section": "Instructions", "Details": "2. Phone numbers can be provided as 10 digits (e.g. 9876543210) or in +91 format (e.g. +919876543210)." },
  { "Section": "Instructions", "Details": "3. Marks must be numerical between 0 and 100. Passing threshold is 40%." },
  { "Section": "Instructions", "Details": "4. Attendance must be numerical percentage between 0 and 100." },
  { "Section": "Instructions", "Details": "5. National IDs and Roll Numbers must be unique across all students within the batch." },
  { "Section": "Instructions", "Details": "6. Any row validation failure triggers an atomic transaction rollback (zero records half-saved)." },
  { "Section": "Demo Credentials", "Details": "Login as Training Centre (training.centre@certiflow.gov) to upload this batch." },
];

const validWb = XLSX.utils.book_new();
const validSheet = XLSX.utils.json_to_sheet(validStudents);
const validInstructionsSheet = XLSX.utils.json_to_sheet(instructionsData);

// Set column widths for readability
validSheet["!cols"] = [
  { wch: 22 }, // Full Name
  { wch: 20 }, // Father Name
  { wch: 18 }, // National ID
  { wch: 20 }, // Phone
  { wch: 28 }, // Email
  { wch: 16 }, // Roll Number
  { wch: 14 }, // Marks
  { wch: 16 }, // Attendance
  { wch: 16 }, // District
];
validInstructionsSheet["!cols"] = [{ wch: 20 }, { wch: 90 }];

XLSX.utils.book_append_sheet(validWb, validSheet, "Candidate Roster");
XLSX.utils.book_append_sheet(validWb, validInstructionsSheet, "Instructions");

const validPath = path.join(targetDir, "CertiFlow_Sample_Candidate_Batch.xlsx");
XLSX.writeFile(validWb, validPath);
console.log(`✅ Generated valid sample batch at: ${validPath}`);

// -------------------------------------------------------------
// 2. Generate Invalid Sample Excel File (for Atomic Rollback Demo)
// -------------------------------------------------------------
const invalidStudents = [
  {
    "Full Name": "Aarav Sharma",
    "Father Name": "Ramesh Sharma",
    "National ID": "987654321001",
    "Phone (10 digits)": "9876543011",
    "Email": "aarav.sharma@example.com",
    "Roll Number": "ROL-2026-N001",
    "Marks (0-100)": 92,
    "Attendance (%)": 96,
    "District": "District North",
  },
  {
    "Full Name": "Pooja Patel",
    "Father Name": "Kirit Patel",
    "National ID": "987654321002",
    "Phone (10 digits)": "12345", // DELIBERATE ERROR: Invalid phone (< 10 digits)
    "Email": "pooja.patel@example.com",
    "Roll Number": "ROL-2026-N002",
    "Marks (0-100)": 88,
    "Attendance (%)": 94,
    "District": "District North",
  },
  {
    "Full Name": "Rahul Verma",
    "Father Name": "Suresh Verma",
    "National ID": "987654321003",
    "Phone (10 digits)": "9876543013",
    "Email": "rahul.verma@example.com",
    "Roll Number": "ROL-2026-N003",
    "Marks (0-100)": -15, // DELIBERATE ERROR: Negative marks (< 0)
    "Attendance (%)": 90,
    "District": "District North",
  },
  {
    "Full Name": "Sneha Reddy",
    "Father Name": "Venkat Reddy",
    "National ID": "987654321001", // DELIBERATE ERROR: Duplicate National ID (repeats Row 1)
    "Phone (10 digits)": "9876543014",
    "Email": "sneha.reddy@example.com",
    "Roll Number": "ROL-2026-N004",
    "Marks (0-100)": 85,
    "Attendance (%)": 150, // DELIBERATE ERROR: Attendance exceeds 100%
    "District": "District North",
  },
];

const invalidInstructionsData = [
  { "Section": "Purpose", "Details": "Test file with DELIBERATE ERRORS to demonstrate Moment 1 (Strict Validation & Atomic Rollback)." },
  { "Section": "Expected Behavior", "Details": "The upload will reject with pinpointed line numbers and column errors. Zero records will be saved in PostgreSQL." },
  { "Section": "Error 1", "Details": "Row 3: Phone number '12345' is invalid (< 10 digits)." },
  { "Section": "Error 2", "Details": "Row 4: Marks '-15' is negative." },
  { "Section": "Error 3", "Details": "Row 5: Duplicate National ID '987654321001' already used in Row 2." },
  { "Section": "Error 4", "Details": "Row 5: Attendance rate '150%' exceeds 100% maximum." },
];

const invalidWb = XLSX.utils.book_new();
const invalidSheet = XLSX.utils.json_to_sheet(invalidStudents);
const invalidInstructionsSheet = XLSX.utils.json_to_sheet(invalidInstructionsData);

invalidSheet["!cols"] = [
  { wch: 22 },
  { wch: 20 },
  { wch: 18 },
  { wch: 20 },
  { wch: 28 },
  { wch: 16 },
  { wch: 14 },
  { wch: 16 },
  { wch: 16 },
];
invalidInstructionsSheet["!cols"] = [{ wch: 20 }, { wch: 90 }];

XLSX.utils.book_append_sheet(invalidWb, invalidSheet, "Invalid Roster (Test)");
XLSX.utils.book_append_sheet(invalidWb, invalidInstructionsSheet, "Expected Errors");

const invalidPath = path.join(targetDir, "CertiFlow_Invalid_Test_Batch.xlsx");
XLSX.writeFile(invalidWb, invalidPath);
console.log(`✅ Generated invalid test batch at: ${invalidPath}`);

