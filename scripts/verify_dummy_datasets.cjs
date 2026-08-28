const path = require("path");
const XLSX = require(path.resolve(__dirname, "..", "client_app", "node_modules", "xlsx"));
const fs = require("fs");

const rootDir = path.resolve(__dirname, "..");
const progCoordDir = path.join(rootDir, "Program_Coordinator_Dummy_Data");
const internOfficerDir = path.join(rootDir, "Internship_Officer_Dummy_Data");

const UID_REGEX = /^\d{2}-[A-Za-z&0-9_-]+-\d{2}$/;

function validateTrainingFile(filename, expectedHeaders, subcategoryCount) {
  const filePath = path.join(progCoordDir, filename);
  if (!fs.existsSync(filePath)) {
    throw new Error(`File missing: ${filePath}`);
  }

  const wb = XLSX.readFile(filePath);
  const sheetName = wb.SheetNames[0];
  const sheet = wb.Sheets[sheetName];
  const rawRows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  const headers = rawRows[0];
  console.log(`\nValidating ${filename}...`);
  console.log("Headers Found:", headers);
  console.log("Expected Headers:", expectedHeaders);

  if (JSON.stringify(headers) !== JSON.stringify(expectedHeaders)) {
    throw new Error(`Header mismatch in ${filename}`);
  }

  const dataRows = rawRows.slice(1);
  console.log(`Total Rows: ${dataRows.length}`);

  const uids = new Set();
  const studentMap = {};

  dataRows.forEach((row, idx) => {
    const rowNum = idx + 2;
    const [uid, fullName, branch, ...marks] = row;

    if (!uid || !UID_REGEX.test(uid)) {
      throw new Error(`Row ${rowNum}: Invalid UID format '${uid}'`);
    }
    if (uids.has(uid)) {
      throw new Error(`Row ${rowNum}: Duplicate UID '${uid}'`);
    }
    uids.add(uid);

    if (!fullName || typeof fullName !== "string" || fullName.trim().length === 0) {
      throw new Error(`Row ${rowNum}: Invalid Full Name '${fullName}'`);
    }
    if (!branch || typeof branch !== "string" || branch.trim().length === 0) {
      throw new Error(`Row ${rowNum}: Invalid Branch '${branch}'`);
    }

    if (marks.length !== subcategoryCount) {
      throw new Error(`Row ${rowNum}: Expected ${subcategoryCount} marks, found ${marks.length}`);
    }

    marks.forEach((m, mIdx) => {
      if (typeof m !== "number" || isNaN(m) || m < 0 || m > 100) {
        throw new Error(`Row ${rowNum}: Invalid mark at column ${expectedHeaders[3 + mIdx]}: ${m}`);
      }
    });

    studentMap[uid] = { fullName, branch, marks };
  });

  console.log(`[PASS] ${filename} passed all structural & data validation checks!`);
  return { uids, studentMap };
}

function validateInternshipFile() {
  const filename = "Internship_Officer_Test_Drives.xlsx";
  const filePath = path.join(internOfficerDir, filename);
  if (!fs.existsSync(filePath)) {
    throw new Error(`File missing: ${filePath}`);
  }

  const wb = XLSX.readFile(filePath);
  const sheetName = wb.SheetNames[0];
  const sheet = wb.Sheets[sheetName];
  const rawRows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  const expectedHeaders = [
    "name",
    "batch",
    "domain",
    "min_cgpa",
    "min_attendance",
    "is_kt",
    "departments",
    "position",
    "stipend",
    "type",
  ];

  const headers = rawRows[0];
  console.log(`\nValidating ${filename}...`);
  console.log("Headers Found:", headers);

  if (JSON.stringify(headers) !== JSON.stringify(expectedHeaders)) {
    throw new Error(`Header mismatch in ${filename}`);
  }

  const dataRows = rawRows.slice(1);
  console.log(`Total Drives: ${dataRows.length}`);

  dataRows.forEach((row, idx) => {
    const rowNum = idx + 2;
    const [name, batch, domain, minCgpa, minAtt, isKt, depts, pos, stipend, type] = row;

    if (!name || typeof name !== "string") throw new Error(`Row ${rowNum}: Invalid name`);
    if (!["2026", "2027", "2028"].includes(String(batch))) throw new Error(`Row ${rowNum}: Invalid batch ${batch}`);
    if (!["it", "core"].includes(domain.toLowerCase())) throw new Error(`Row ${rowNum}: Invalid domain ${domain}`);
    if (typeof minCgpa !== "number" || minCgpa < 0 || minCgpa > 10) throw new Error(`Row ${rowNum}: Invalid min_cgpa ${minCgpa}`);
    if (typeof minAtt !== "number" || minAtt < 0 || minAtt > 100) throw new Error(`Row ${rowNum}: Invalid min_attendance ${minAtt}`);
    if (typeof isKt !== "boolean") throw new Error(`Row ${rowNum}: Invalid is_kt ${isKt}`);
    if (!depts || typeof depts !== "string") throw new Error(`Row ${rowNum}: Invalid departments ${depts}`);
    if (!pos || typeof pos !== "string") throw new Error(`Row ${rowNum}: Invalid position ${pos}`);
    if (typeof stipend !== "number" || stipend < 0) throw new Error(`Row ${rowNum}: Invalid stipend ${stipend}`);
    if (!["Full-time", "Part-time"].includes(type)) throw new Error(`Row ${rowNum}: Invalid type ${type}`);
  });

  console.log(`[PASS] ${filename} passed all structural & data validation checks!`);
}

function runAllValidations() {
  console.log("================================================================================");
  console.log("VALIDATING GENERATED DUMMY DATASETS AGAINST BACKEND SPECIFICATIONS");
  console.log("================================================================================");

  // 1. Technical
  const techRes = validateTrainingFile(
    "Technical_Training_Performance_Dummy.xlsx",
    ["UID", "Full Name", "Branch", "OS", "DBMS", "DSA", "CN", "OOPS"],
    5
  );

  // 2. Aptitude
  const aptRes = validateTrainingFile(
    "Aptitude_Training_Performance_Dummy.xlsx",
    ["UID", "Full Name", "Branch", "Arithmetic", "Logical Reasoning", "Probability", "Verbal Ability", "Verbal Reasoning"],
    5
  );

  // 3. Coding
  const codingRes = validateTrainingFile(
    "Coding_Assessment_Dummy.xlsx",
    ["UID", "Full Name", "Branch", "Coding Marks"],
    1
  );

  // Cross-File Consistency Verification
  console.log("\nVerifying Cross-File Consistency across Technical, Aptitude, and Coding files...");
  const techUids = Array.from(techRes.uids);
  if (techUids.length !== aptRes.uids.size || techUids.length !== codingRes.uids.size) {
    throw new Error("Student UID counts differ across training files!");
  }

  for (const uid of techUids) {
    if (!aptRes.uids.has(uid)) throw new Error(`UID ${uid} found in Technical but missing in Aptitude!`);
    if (!codingRes.uids.has(uid)) throw new Error(`UID ${uid} found in Technical but missing in Coding!`);

    const techStud = techRes.studentMap[uid];
    const aptStud = aptRes.studentMap[uid];
    const codingStud = codingRes.studentMap[uid];

    if (techStud.fullName !== aptStud.fullName || techStud.fullName !== codingStud.fullName) {
      throw new Error(`Full Name mismatch for UID ${uid}: '${techStud.fullName}' vs '${aptStud.fullName}' vs '${codingStud.fullName}'`);
    }

    if (techStud.branch !== aptStud.branch || techStud.branch !== codingStud.branch) {
      throw new Error(`Branch mismatch for UID ${uid}: '${techStud.branch}' vs '${aptStud.branch}' vs '${codingStud.branch}'`);
    }
  }
  console.log("[PASS] 100% Cross-File Student UID, Full Name, and Branch consistency verified!");

  // 4. Internship Drives
  validateInternshipFile();

  console.log("\n================================================================================");
  console.log("ALL DUMMY DATASETS SUCCESSFULLY VALIDATED AGAINST TCET SPECIFICATIONS!");
  console.log("================================================================================");
}

runAllValidations();
