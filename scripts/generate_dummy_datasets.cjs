const path = require("path");
const XLSX = require(path.resolve(__dirname, "..", "client_app", "node_modules", "xlsx"));
const fs = require("fs");

// Directories
const rootDir = path.resolve(__dirname, "..");
const progCoordDir = path.join(rootDir, "Program_Coordinator_Dummy_Data");
const internOfficerDir = path.join(rootDir, "Internship_Officer_Dummy_Data");

if (!fs.existsSync(progCoordDir)) fs.mkdirSync(progCoordDir, { recursive: true });
if (!fs.existsSync(internOfficerDir)) fs.mkdirSync(internOfficerDir, { recursive: true });

// 25 Master Students Dataset
const masterStudents = [
  {
    uid: "24-IT-A01-28",
    fullName: "Aarav Sharma",
    branch: "IT-A",
    dept: "IT",
    div: "A",
    batch: "2028",
    academicYear: "TE",
    cgpa: 9.42,
    attendance: 92.5,
    isKt: false,
    tech: { os: 88, dbms: 92, dsa: 95, cn: 86, oops: 94 },
    apt: { arithmetic: 90, logical: 94, probability: 88, verbalAbility: 92, verbalReasoning: 90 },
    coding: 96,
  },
  {
    uid: "24-IT-A02-28",
    fullName: "Ananya Patel",
    branch: "IT-A",
    dept: "IT",
    div: "A",
    batch: "2028",
    academicYear: "TE",
    cgpa: 8.85,
    attendance: 88.0,
    isKt: false,
    tech: { os: 84, dbms: 86, dsa: 89, cn: 82, oops: 90 },
    apt: { arithmetic: 86, logical: 88, probability: 82, verbalAbility: 85, verbalReasoning: 86 },
    coding: 88,
  },
  {
    uid: "24-IT-A03-28",
    fullName: "Rohan Gupta",
    branch: "IT-A",
    dept: "IT",
    div: "A",
    batch: "2028",
    academicYear: "TE",
    cgpa: 7.65,
    attendance: 78.5,
    isKt: false,
    tech: { os: 72, dbms: 75, dsa: 70, cn: 74, oops: 76 },
    apt: { arithmetic: 74, logical: 76, probability: 70, verbalAbility: 78, verbalReasoning: 72 },
    coding: 75,
  },
  {
    uid: "24-IT-A04-28",
    fullName: "Priya Verma",
    branch: "IT-A",
    dept: "IT",
    div: "A",
    batch: "2028",
    academicYear: "TE",
    cgpa: 7.90,
    attendance: 81.0,
    isKt: false,
    tech: { os: 76, dbms: 80, dsa: 78, cn: 75, oops: 82 },
    apt: { arithmetic: 78, logical: 80, probability: 75, verbalAbility: 82, verbalReasoning: 79 },
    coding: 80,
  },
  {
    uid: "24-IT-B05-28",
    fullName: "Siddharth Iyer",
    branch: "IT-B",
    dept: "IT",
    div: "B",
    batch: "2028",
    academicYear: "TE",
    cgpa: 9.15,
    attendance: 90.0,
    isKt: false,
    tech: { os: 90, dbms: 91, dsa: 93, cn: 88, oops: 92 },
    apt: { arithmetic: 92, logical: 91, probability: 89, verbalAbility: 90, verbalReasoning: 92 },
    coding: 94,
  },
  {
    uid: "24-IT-B06-28",
    fullName: "Neha Joshi",
    branch: "IT-B",
    dept: "IT",
    div: "B",
    batch: "2028",
    academicYear: "TE",
    cgpa: 6.20,
    attendance: 68.0,
    isKt: true,
    tech: { os: 55, dbms: 58, dsa: 52, cn: 54, oops: 60 },
    apt: { arithmetic: 58, logical: 60, probability: 52, verbalAbility: 62, verbalReasoning: 56 },
    coding: 54,
  },
  {
    uid: "23-IT-A07-27",
    fullName: "Aditya Deshmukh",
    branch: "IT-A",
    dept: "IT",
    div: "A",
    batch: "2027",
    academicYear: "BE",
    cgpa: 8.70,
    attendance: 85.5,
    isKt: false,
    tech: { os: 85, dbms: 88, dsa: 84, cn: 86, oops: 89 },
    apt: { arithmetic: 84, logical: 86, probability: 80, verbalAbility: 88, verbalReasoning: 85 },
    coding: 86,
  },
  {
    uid: "23-IT-A08-27",
    fullName: "Tanvi Kulkarni",
    branch: "IT-A",
    dept: "IT",
    div: "A",
    batch: "2027",
    academicYear: "BE",
    cgpa: 7.45,
    attendance: 76.0,
    isKt: false,
    tech: { os: 70, dbms: 72, dsa: 68, cn: 74, oops: 75 },
    apt: { arithmetic: 72, logical: 75, probability: 68, verbalAbility: 76, verbalReasoning: 74 },
    coding: 72,
  },
  {
    uid: "23-IT-B09-27",
    fullName: "Yash Mehta",
    branch: "IT-B",
    dept: "IT",
    div: "B",
    batch: "2027",
    academicYear: "BE",
    cgpa: 7.80,
    attendance: 80.0,
    isKt: false,
    tech: { os: 78, dbms: 79, dsa: 76, cn: 77, oops: 80 },
    apt: { arithmetic: 76, logical: 78, probability: 74, verbalAbility: 80, verbalReasoning: 78 },
    coding: 78,
  },
  {
    uid: "22-IT-A10-26",
    fullName: "Sneha Nair",
    branch: "IT-A",
    dept: "IT",
    div: "A",
    batch: "2026",
    academicYear: "BE",
    cgpa: 9.30,
    attendance: 94.0,
    isKt: false,
    tech: { os: 92, dbms: 95, dsa: 94, cn: 90, oops: 96 },
    apt: { arithmetic: 91, logical: 95, probability: 90, verbalAbility: 94, verbalReasoning: 93 },
    coding: 95,
  },
  {
    uid: "24-CMPNA01-28",
    fullName: "Vihaan Jain",
    branch: "CMPN-A",
    dept: "CMPN",
    div: "A",
    batch: "2028",
    academicYear: "TE",
    cgpa: 9.05,
    attendance: 89.0,
    isKt: false,
    tech: { os: 89, dbms: 90, dsa: 92, cn: 87, oops: 91 },
    apt: { arithmetic: 88, logical: 90, probability: 86, verbalAbility: 91, verbalReasoning: 89 },
    coding: 93,
  },
  {
    uid: "24-CMPNA02-28",
    fullName: "Ishita Roy",
    branch: "CMPN-A",
    dept: "CMPN",
    div: "A",
    batch: "2028",
    academicYear: "TE",
    cgpa: 7.55,
    attendance: 77.0,
    isKt: false,
    tech: { os: 74, dbms: 76, dsa: 72, cn: 75, oops: 77 },
    apt: { arithmetic: 75, logical: 76, probability: 71, verbalAbility: 78, verbalReasoning: 75 },
    coding: 76,
  },
  {
    uid: "24-CMPNB03-28",
    fullName: "Manav Shah",
    branch: "CMPN-B",
    dept: "CMPN",
    div: "B",
    batch: "2028",
    academicYear: "TE",
    cgpa: 7.10,
    attendance: 74.5,
    isKt: false,
    tech: { os: 68, dbms: 70, dsa: 66, cn: 71, oops: 72 },
    apt: { arithmetic: 70, logical: 72, probability: 66, verbalAbility: 74, verbalReasoning: 70 },
    coding: 70,
  },
  {
    uid: "23-CMPNA04-27",
    fullName: "Diya Kapoor",
    branch: "CMPN-A",
    dept: "CMPN",
    div: "A",
    batch: "2027",
    academicYear: "BE",
    cgpa: 8.60,
    attendance: 86.0,
    isKt: false,
    tech: { os: 83, dbms: 85, dsa: 87, cn: 81, oops: 88 },
    apt: { arithmetic: 85, logical: 87, probability: 81, verbalAbility: 86, verbalReasoning: 84 },
    coding: 87,
  },
  {
    uid: "22-COMPA05-26",
    fullName: "Aniket Patel",
    branch: "COMP-A",
    dept: "COMP",
    div: "A",
    batch: "2026",
    academicYear: "BE",
    cgpa: 7.85,
    attendance: 82.0,
    isKt: false,
    tech: { os: 77, dbms: 81, dsa: 79, cn: 78, oops: 83 },
    apt: { arithmetic: 79, logical: 81, probability: 76, verbalAbility: 83, verbalReasoning: 80 },
    coding: 82,
  },
  {
    uid: "24-AI&DSA01-28",
    fullName: "Kabir Malhotra",
    branch: "AI&DS-A",
    dept: "AI&DS",
    div: "A",
    batch: "2028",
    academicYear: "TE",
    cgpa: 9.25,
    attendance: 91.5,
    isKt: false,
    tech: { os: 91, dbms: 94, dsa: 96, cn: 89, oops: 95 },
    apt: { arithmetic: 93, logical: 95, probability: 91, verbalAbility: 92, verbalReasoning: 94 },
    coding: 97,
  },
  {
    uid: "24-AI&DSA02-28",
    fullName: "Riya Sengupta",
    branch: "AI&DS-A",
    dept: "AI&DS",
    div: "A",
    batch: "2028",
    academicYear: "TE",
    cgpa: 7.70,
    attendance: 79.0,
    isKt: false,
    tech: { os: 75, dbms: 78, dsa: 74, cn: 76, oops: 79 },
    apt: { arithmetic: 77, logical: 79, probability: 73, verbalAbility: 81, verbalReasoning: 77 },
    coding: 78,
  },
  {
    uid: "24-AI&DSB03-28",
    fullName: "Aryan Chopda",
    branch: "AI&DS-B",
    dept: "AI&DS",
    div: "B",
    batch: "2028",
    academicYear: "TE",
    cgpa: 5.90,
    attendance: 65.0,
    isKt: true,
    tech: { os: 52, dbms: 54, dsa: 48, cn: 50, oops: 55 },
    apt: { arithmetic: 54, logical: 56, probability: 48, verbalAbility: 58, verbalReasoning: 52 },
    coding: 50,
  },
  {
    uid: "23-AI&DSA04-27",
    fullName: "Kritika Saxena",
    branch: "AI&DS-A",
    dept: "AI&DS",
    div: "A",
    batch: "2027",
    academicYear: "BE",
    cgpa: 8.90,
    attendance: 87.5,
    isKt: false,
    tech: { os: 86, dbms: 89, dsa: 91, cn: 84, oops: 90 },
    apt: { arithmetic: 88, logical: 89, probability: 84, verbalAbility: 89, verbalReasoning: 87 },
    coding: 90,
  },
  {
    uid: "24-AIMLA01-28",
    fullName: "Devansh Trivedi",
    branch: "AI&ML-A",
    dept: "AI&ML",
    div: "A",
    batch: "2028",
    academicYear: "TE",
    cgpa: 8.95,
    attendance: 88.5,
    isKt: false,
    tech: { os: 87, dbms: 90, dsa: 92, cn: 85, oops: 91 },
    apt: { arithmetic: 89, logical: 91, probability: 87, verbalAbility: 90, verbalReasoning: 88 },
    coding: 92,
  },
  {
    uid: "24-AIMLA02-28",
    fullName: "Meera Nambiar",
    branch: "AI&ML-A",
    dept: "AI&ML",
    div: "A",
    batch: "2028",
    academicYear: "TE",
    cgpa: 7.35,
    attendance: 75.5,
    isKt: false,
    tech: { os: 71, dbms: 74, dsa: 70, cn: 72, oops: 75 },
    apt: { arithmetic: 73, logical: 75, probability: 69, verbalAbility: 77, verbalReasoning: 73 },
    coding: 74,
  },
  {
    uid: "24-EXTCA01-28",
    fullName: "Harshit Agarwal",
    branch: "EXTC-A",
    dept: "EXTC",
    div: "A",
    batch: "2028",
    academicYear: "TE",
    cgpa: 7.40,
    attendance: 76.5,
    isKt: false,
    tech: { os: 69, dbms: 71, dsa: 67, cn: 78, oops: 72 },
    apt: { arithmetic: 76, logical: 77, probability: 72, verbalAbility: 78, verbalReasoning: 75 },
    coding: 71,
  },
  {
    uid: "23-EXTCA02-27",
    fullName: "Pooja Bhatt",
    branch: "EXTC-A",
    dept: "EXTC",
    div: "A",
    batch: "2027",
    academicYear: "BE",
    cgpa: 6.45,
    attendance: 69.5,
    isKt: true,
    tech: { os: 56, dbms: 59, dsa: 54, cn: 62, oops: 58 },
    apt: { arithmetic: 60, logical: 62, probability: 55, verbalAbility: 64, verbalReasoning: 59 },
    coding: 56,
  },
  {
    uid: "24-MECHA01-28",
    fullName: "Varun Patil",
    branch: "MECH-A",
    dept: "MECH",
    div: "A",
    batch: "2028",
    academicYear: "TE",
    cgpa: 7.25,
    attendance: 77.0,
    isKt: false,
    tech: { os: 65, dbms: 66, dsa: 62, cn: 64, oops: 68 },
    apt: { arithmetic: 78, logical: 76, probability: 74, verbalAbility: 75, verbalReasoning: 73 },
    coding: 65,
  },
  {
    uid: "24-MECHA02-28",
    fullName: "Shruti Gaikwad",
    branch: "MECH-A",
    dept: "MECH",
    div: "A",
    batch: "2028",
    academicYear: "TE",
    cgpa: 5.80,
    attendance: 64.0,
    isKt: true,
    tech: { os: 48, dbms: 50, dsa: 45, cn: 47, oops: 52 },
    apt: { arithmetic: 55, logical: 57, probability: 50, verbalAbility: 59, verbalReasoning: 53 },
    coding: 48,
  },
];

// Helper to set column widths & sheet view properties
function formatSheet(ws, colWidths) {
  ws["!cols"] = colWidths.map((w) => ({ wch: w }));
  ws["!views"] = [{ state: "frozen", ySplit: 1 }];
}

// -----------------------------------------------------------------------------
// 1. Technical Training Performance Dummy XLSX
// Headers: UID, Full Name, Branch, OS, DBMS, DSA, CN, OOPS
// -----------------------------------------------------------------------------
const techHeaders = ["UID", "Full Name", "Branch", "OS", "DBMS", "DSA", "CN", "OOPS"];
const techRows = masterStudents.map((s) => [
  s.uid,
  s.fullName,
  s.branch,
  s.tech.os,
  s.tech.dbms,
  s.tech.dsa,
  s.tech.cn,
  s.tech.oops,
]);

const techWb = XLSX.utils.book_new();
const techWs = XLSX.utils.aoa_to_sheet([techHeaders, ...techRows]);
formatSheet(techWs, [18, 22, 14, 10, 10, 10, 10, 10]);
XLSX.utils.book_append_sheet(techWb, techWs, "Technical_Performance");

const techPath = path.join(progCoordDir, "Technical_Training_Performance_Dummy.xlsx");
XLSX.writeFile(techWb, techPath);
console.log(`[CREATED] ${techPath} (${techRows.length} rows)`);

// -----------------------------------------------------------------------------
// 2. Aptitude Training Performance Dummy XLSX
// Headers: UID, Full Name, Branch, Arithmetic, Logical Reasoning, Probability, Verbal Ability, Verbal Reasoning
// -----------------------------------------------------------------------------
const aptHeaders = [
  "UID",
  "Full Name",
  "Branch",
  "Arithmetic",
  "Logical Reasoning",
  "Probability",
  "Verbal Ability",
  "Verbal Reasoning",
];
const aptRows = masterStudents.map((s) => [
  s.uid,
  s.fullName,
  s.branch,
  s.apt.arithmetic,
  s.apt.logical,
  s.apt.probability,
  s.apt.verbalAbility,
  s.apt.verbalReasoning,
]);

const aptWb = XLSX.utils.book_new();
const aptWs = XLSX.utils.aoa_to_sheet([aptHeaders, ...aptRows]);
formatSheet(aptWs, [18, 22, 14, 14, 20, 14, 16, 18]);
XLSX.utils.book_append_sheet(aptWb, aptWs, "Aptitude_Performance");

const aptPath = path.join(progCoordDir, "Aptitude_Training_Performance_Dummy.xlsx");
XLSX.writeFile(aptWb, aptPath);
console.log(`[CREATED] ${aptPath} (${aptRows.length} rows)`);

// -----------------------------------------------------------------------------
// 3. Coding Assessment Dummy XLSX
// Headers: UID, Full Name, Branch, Coding Marks
// -----------------------------------------------------------------------------
const codingHeaders = ["UID", "Full Name", "Branch", "Coding Marks"];
const codingRows = masterStudents.map((s) => [
  s.uid,
  s.fullName,
  s.branch,
  s.coding,
]);

const codingWb = XLSX.utils.book_new();
const codingWs = XLSX.utils.aoa_to_sheet([codingHeaders, ...codingRows]);
formatSheet(codingWs, [18, 22, 14, 16]);
XLSX.utils.book_append_sheet(codingWb, codingWs, "Coding_Assessment");

const codingPath = path.join(progCoordDir, "Coding_Assessment_Dummy.xlsx");
XLSX.writeFile(codingWb, codingPath);
console.log(`[CREATED] ${codingPath} (${codingRows.length} rows)`);

// -----------------------------------------------------------------------------
// 4. Internship Officer Test Drives XLSX
// Headers: name, batch, domain, min_cgpa, min_attendance, is_kt, departments, position, stipend, type
// -----------------------------------------------------------------------------
const internHeaders = [
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

const internDrives = [
  {
    name: "TechNova Solutions",
    batch: "2028",
    domain: "it",
    min_cgpa: 7.0,
    min_attendance: 75.0,
    is_kt: false,
    departments: "IT,CMPN,AI&DS",
    position: "Software Engineering Intern",
    stipend: 25000,
    type: "Full-time",
  },
  {
    name: "Amazon AWS",
    batch: "2028",
    domain: "it",
    min_cgpa: 8.5,
    min_attendance: 80.0,
    is_kt: false,
    departments: "all",
    position: "Cloud Infrastructure Intern",
    stipend: 45000,
    type: "Full-time",
  },
  {
    name: "TCS Digital",
    batch: "2027",
    domain: "it",
    min_cgpa: 6.5,
    min_attendance: 70.0,
    is_kt: false,
    departments: "IT,CMPN,AI&DS,EXTC",
    position: "System Engineer Intern",
    stipend: 20000,
    type: "Full-time",
  },
  {
    name: "Deloitte",
    batch: "2026",
    domain: "it",
    min_cgpa: 7.5,
    min_attendance: 75.0,
    is_kt: false,
    departments: "all",
    position: "Cyber & Analytics Intern",
    stipend: 35000,
    type: "Full-time",
  },
  {
    name: "Larsen & Toubro",
    batch: "2028",
    domain: "core",
    min_cgpa: 6.5,
    min_attendance: 70.0,
    is_kt: true,
    departments: "MECH,EXTC",
    position: "Automation & Robotics Intern",
    stipend: 18000,
    type: "Part-time",
  },
  {
    name: "Accenture",
    batch: "2028",
    domain: "it",
    min_cgpa: 7.2,
    min_attendance: 75.0,
    is_kt: false,
    departments: "AI&DS,AI&ML,IT,CMPN",
    position: "AI/ML Solutions Intern",
    stipend: 30000,
    type: "Full-time",
  },
];

const internRows = internDrives.map((d) => [
  d.name,
  d.batch,
  d.domain,
  d.min_cgpa,
  d.min_attendance,
  d.is_kt,
  d.departments,
  d.position,
  d.stipend,
  d.type,
]);

const internWb = XLSX.utils.book_new();
const internWs = XLSX.utils.aoa_to_sheet([internHeaders, ...internRows]);
formatSheet(internWs, [22, 10, 10, 12, 16, 10, 24, 30, 12, 14]);
XLSX.utils.book_append_sheet(internWb, internWs, "Internship_Drives");

const internPath = path.join(internOfficerDir, "Internship_Officer_Test_Drives.xlsx");
XLSX.writeFile(internWb, internPath);
console.log(`[CREATED] ${internPath} (${internRows.length} drives)`);

// -----------------------------------------------------------------------------
// 5. Training Attendance Multi-Program Dataset (Training_Attendance_Dummy.xlsx)
// Programs: ACT Technical (10), ACT Aptitude (8), SDP (6), Coding Contest (5)
// -----------------------------------------------------------------------------
const programConfigs = [
  { name: "ACT Technical", sessions: 10, startDate: "2025-07-05" },
  { name: "ACT Aptitude", sessions: 8, startDate: "2025-07-20" },
  { name: "SDP", sessions: 6, startDate: "2025-08-10" },
  { name: "Coding Contest", sessions: 5, startDate: "2025-08-25" },
];

const attSummaryHeaders = [
  "UID",
  "Full Name",
  "Branch",
  "Batch",
  "Program Name",
  "Session",
  "Attendance Status",
  "Late Status",
  "Date",
];

const attSummaryRows = [];
const studentAggRows = [];
const batchAggMap = {};

masterStudents.forEach((s) => {
  const progPctMap = {};

  programConfigs.forEach((prog) => {
    const numSessions = prog.sessions;
    const targetPresent = Math.max(1, Math.min(numSessions, Math.round((s.attendance / 100.0) * numSessions)));
    let presentCount = 0;

    for (let sessIdx = 1; sessIdx <= numSessions; sessIdx++) {
      const sessName = `Session ${sessIdx}`;
      // Deterministic hash based on student and session
      const charSum = s.uid.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
      const seedHash = (charSum + sessIdx * 7 + numSessions * 13) % numSessions;
      const isPresent = seedHash < targetPresent ? "Present" : "Absent";
      const isLate = isPresent === "Present" && seedHash % 6 === 0 ? "Late" : "Not Late";

      if (isPresent === "Present") presentCount++;

      // Session date calculation
      const sessDate = new Date(prog.startDate);
      sessDate.setDate(sessDate.getDate() + (sessIdx - 1) * 3);
      const dateStr = sessDate.toISOString().split("T")[0];

      attSummaryRows.push([
        s.uid,
        s.fullName,
        s.branch,
        s.batch,
        prog.name,
        sessName,
        isPresent,
        isLate,
        dateStr,
      ]);

      // Aggregate for batch summary
      const aggKey = `${s.batch}__${prog.name}__${s.batch}`;
      if (!batchAggMap[aggKey]) {
        batchAggMap[aggKey] = {
          batch: s.batch,
          program: prog.name,
          year: s.batch,
          students: new Set(),
          present: 0,
          absent: 0,
          late: 0,
        };
      }
      batchAggMap[aggKey].students.add(s.uid);
      if (isPresent === "Present") batchAggMap[aggKey].present++;
      else batchAggMap[aggKey].absent++;
      if (isLate === "Late") batchAggMap[aggKey].late++;
    }

    progPctMap[prog.name] = Number(((presentCount / numSessions) * 100).toFixed(1));
  });

  const overallAtt = Number(
    (
      (progPctMap["ACT Technical"] * 10 +
        progPctMap["ACT Aptitude"] * 8 +
        progPctMap["SDP"] * 6 +
        progPctMap["Coding Contest"] * 5) /
      29
    ).toFixed(1)
  );

  const semStr = s.batch === "2028" ? "Semester 5" : s.batch === "2027" ? "Semester 7" : "Semester 8";

  studentAggRows.push([
    s.uid,
    s.fullName,
    s.branch,
    s.batch,
    s.academicYear,
    semStr,
    progPctMap["ACT Technical"],
    progPctMap["ACT Aptitude"],
    progPctMap["SDP"],
    progPctMap["Coding Contest"],
    overallAtt,
  ]);
});

// Batch Program Summary rows
const batchSummaryHeaders = [
  "Batch",
  "Program Name",
  "Year",
  "Total Students",
  "Total Present",
  "Total Absent",
  "Total Late",
  "Average Attendance (%)",
];

const batchSummaryRows = Object.values(batchAggMap).map((b) => {
  const totalSessions = b.present + b.absent;
  const avgPct = totalSessions > 0 ? Number(((b.present / totalSessions) * 100).toFixed(1)) : 0;
  return [
    b.batch,
    b.program,
    b.year,
    b.students.size,
    b.present,
    b.absent,
    b.late,
    avgPct,
  ];
});

// Department Coordinator format sheet (uid, semester, attendance)
const deptAttHeaders = ["uid", "semester", "attendance"];
const deptAttRows = masterStudents.map((s) => {
  const semStr = s.batch === "2028" ? "Semester 5" : s.batch === "2027" ? "Semester 7" : "Semester 8";
  return [s.uid, semStr, s.attendance];
});

// Create Training_Attendance_Dummy.xlsx workbook
const attWb = XLSX.utils.book_new();

// Sheet 1: Session Attendance
const attWs1 = XLSX.utils.aoa_to_sheet([attSummaryHeaders, ...attSummaryRows]);
formatSheet(attWs1, [18, 22, 14, 10, 18, 14, 18, 14, 14]);
XLSX.utils.book_append_sheet(attWb, attWs1, "Session_Attendance");

// Sheet 2: Student Aggregate Attendance
const studentAggHeaders = [
  "UID",
  "Full Name",
  "Branch",
  "Batch",
  "Academic Year",
  "Semester",
  "ACT Technical (%)",
  "ACT Aptitude (%)",
  "SDP (%)",
  "Coding Contest (%)",
  "Overall Training Att (%)",
];
const attWs2 = XLSX.utils.aoa_to_sheet([studentAggHeaders, ...studentAggRows]);
formatSheet(attWs2, [18, 22, 14, 10, 14, 14, 18, 18, 12, 18, 22]);
XLSX.utils.book_append_sheet(attWb, attWs2, "Student_Aggregate");

// Sheet 3: Batch Program Summary
const attWs3 = XLSX.utils.aoa_to_sheet([batchSummaryHeaders, ...batchSummaryRows]);
formatSheet(attWs3, [10, 18, 10, 16, 14, 14, 14, 22]);
XLSX.utils.book_append_sheet(attWb, attWs3, "Batch_Summary");

// Sheet 4: Department Coordinator Format
const attWs4 = XLSX.utils.aoa_to_sheet([deptAttHeaders, ...deptAttRows]);
formatSheet(attWs4, [18, 16, 16]);
XLSX.utils.book_append_sheet(attWb, attWs4, "Dept_Attendance_Format");

const attPath = path.join(progCoordDir, "Training_Attendance_Dummy.xlsx");
XLSX.writeFile(attWb, attPath);
console.log(`[CREATED] ${attPath} (${attSummaryRows.length} session records across 4 sheets)`);

// -----------------------------------------------------------------------------
// 6. Generate Training_Attendance_Dataset_README.md
// -----------------------------------------------------------------------------
const readmeContent = `# TCET Training Attendance & Performance Dataset Documentation

## Overview
This dummy dataset provides comprehensive, mathematically consistent training attendance and assessment performance data for **25 master students** across the Training & Placement (T&P) automation portal.

The students and identifiers strictly align with the existing **Technical**, **Aptitude**, **Coding**, and **Internship** dummy datasets to enable seamless cross-module student tracing and analytics.

---

## 1. Master Students Cohort Summary

| Total Students | Batches Covered | Academic Years | Departments Covered | Total Sessions |
| :--- | :--- | :--- | :--- | :--- |
| **25 Students** | **2028** (18), **2027** (5), **2026** (2) | **TE** (18), **BE** (7) | IT, CMPN, COMP, AI&DS, AI&ML, EXTC, MECH | **29 Sessions / Student** (725 Total) |

---

## 2. Training Programs & Session Structure

| Program Name | Number of Sessions | Schedule Cadence | Semester Tag | Target Focus |
| :--- | :--- | :--- | :--- | :--- |
| **ACT Technical** | **10 Sessions** (\`Session 1\` to \`Session 10\`) | Bi-weekly | Semester 5/7/8 | OS, DBMS, DSA, CN, OOPS |
| **ACT Aptitude** | **8 Sessions** (\`Session 1\` to \`Session 8\`) | Weekly | Semester 5/7/8 | Arithmetic, Logical, Verbal, Probability |
| **SDP** (Skill Dev Program) | **6 Sessions** (\`Session 1\` to \`Session 6\`) | Weekly | Semester 5/7/8 | Soft Skills, Communication & Domain Projects |
| **Coding Contest** | **5 Sessions** (\`Session 1\` to \`Session 5\`) | Bi-weekly | Semester 5/7/8 | LeetCode / Competitive Programming |

---

## 3. Mathematical Consistency & Attendance Distribution

The session records are derived from the student's holistic performance profile:
* **Top Performers (90–100% attendance):** E.g., Aarav Sharma (\`24-IT-A01-28\`, 92.5%), Sneha Nair (\`22-IT-A10-26\`, 94.0%), Kabir Malhotra (\`24-AI&DSA01-28\`, 91.5%).
* **Good Performers (80–90% attendance):** E.g., Ananya Patel (\`24-IT-A02-28\`, 88.0%), Aditya Deshmukh (\`23-IT-A07-27\`, 85.5%), Diya Kapoor (\`23-CMPNA04-27\`, 86.0%).
* **Average Performers (70–80% attendance):** E.g., Rohan Gupta (\`24-IT-A03-28\`, 78.5%), Priya Verma (\`24-IT-A04-28\`, 81.0%), Yash Mehta (\`23-IT-B09-27\`, 80.0%).
* **Low / KT Performers (55–70% attendance):** E.g., Neha Joshi (\`24-IT-B06-28\`, 68.0%), Aryan Chopda (\`24-AI&DSB03-28\`, 65.0%), Shruti Gaikwad (\`24-MECHA02-28\`, 64.0%).

For every session and batch:
$$\\text{Total Students} = \\text{Total Present} + \\text{Total Absent}$$
$$\\text{Attendance \\%} = \\left( \\frac{\\text{Total Present}}{\\text{Total Sessions}} \\right) \\times 100$$

---

## 4. Worksheets Inside \`Training_Attendance_Dummy.xlsx\`

1. **\`Session_Attendance\`**: Granular session-level log containing UID, Full Name, Branch, Batch, Program Name, Session, Status (\`Present\` / \`Absent\`), Late Status (\`Late\` / \`Not Late\`), and Date.
2. **\`Student_Aggregate\`**: Per-student summary displaying percentage attendance across all 4 training programs and the combined training average.
3. **\`Batch_Summary\`**: Program Coordinator summary displaying Batch, Program Name, Year, Total Students, Total Present, Total Absent, Total Late, and Average Attendance %.
4. **\`Dept_Attendance_Format\`**: Direct import format for Department Coordinator (\`uid\`, \`semester\`, \`attendance\`).

---

## 5. Program Coordinator Module Verification Steps

1. Navigate to **Program Coordinator** $\\rightarrow$ **Attendance & Marks** (\`/program_coordinator/attendance-and-marks\`).
2. Select **Program Name** (e.g. \`ACT Technical\`, \`ACT Aptitude\`, \`SDP\`, \`Coding Contest\`).
3. Observe the calculated table dynamically render batches \`2028\`, \`2027\`, and \`2026\` with session columns and exact Present/Absent/Late counts.
4. Click **DOWNLOAD EXCEL** to export the structured attendance report.
`;

const readmePath = path.join(progCoordDir, "Training_Attendance_Dataset_README.md");
fs.writeFileSync(readmePath, readmeContent);
console.log(`[CREATED] ${readmePath}`);

console.log("\n--- EXCEL DATASETS & ATTENDANCE GENERATION FINISHED SUCCESSFULLY ---");

