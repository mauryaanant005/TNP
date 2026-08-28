# TCET Training & Placement Automation Portal — Test Datasets Specification & Usage Guide

This package provides realistic, internally consistent dummy Excel datasets designed to populate and test the **Program Coordinator**, **Internship Officer**, and **Department Coordinator** modules of the TCET Training & Placement Automation Portal.

All files strictly conform to the authoritative specifications defined in [`TCET_Student_Excel_Input_Requirements.pdf`](./TCET_Student_Excel_Input_Requirements.pdf).

---

## 1. Directory Structure

```
TNP/
├── Program_Coordinator_Dummy_Data/
│   ├── Technical_Training_Performance_Dummy.xlsx  (25 Students, 5 Technical Modules)
│   ├── Aptitude_Training_Performance_Dummy.xlsx   (25 Students, 5 Aptitude Modules)
│   └── Coding_Assessment_Dummy.xlsx              (25 Students, Practical Coding Assessment)
│
├── Internship_Officer_Dummy_Data/
│   └── Internship_Officer_Test_Drives.xlsx       (6 Corporate Internship Drives)
│
└── DATASET_README.md                             (This Reference Document)
```

---

## 2. Student Cohort Summary

* **Total Students:** 25 Unique Candidates
* **Batches Represented:** `2028` (TE / 3rd Year), `2027` (BE / 4th Year), `2026` (BE / Graduating)
* **Departments & Divisions:**
  * **Information Technology (IT):** `IT-A`, `IT-B` (10 Students)
  * **Computer Engineering (CMPN / COMP):** `CMPN-A`, `CMPN-B`, `COMP-A` (5 Students)
  * **Artificial Intelligence & Data Science (AI&DS):** `AI&DS-A`, `AI&DS-B` (4 Students)
  * **Artificial Intelligence & Machine Learning (AI&ML):** `AI&ML-A` (2 Students)
  * **Electronics & Telecommunication (EXTC):** `EXTC-A` (2 Students)
  * **Mechanical Engineering (MECH):** `MECH-A` (2 Students)
* **Performance Distribution:**
  * **High Performers (85–96 Marks / CGPA 8.5–9.5):** 10 Students
  * **Average Performers (65–84 Marks / CGPA 7.0–8.4):** 11 Students
  * **Lower / Remedial Performers (45–64 Marks / CGPA 5.8–6.9, Live KTs):** 4 Students

---

## 3. Master Students Roster (Cross-File Consistent)

| # | Student UID | Full Name | Branch | Dept | Div | Batch | Year | CGPA | Attd % | KT Status | Profile Tier |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | `24-IT-A01-28` | Aarav Sharma | `IT-A` | IT | A | 2028 | TE | 9.42 | 92.5% | No KT | Tier 1 (High) |
| 2 | `24-IT-A02-28` | Ananya Patel | `IT-A` | IT | A | 2028 | TE | 8.85 | 88.0% | No KT | Tier 1 (High) |
| 3 | `24-IT-A03-28` | Rohan Gupta | `IT-A` | IT | A | 2028 | TE | 7.65 | 78.5% | No KT | Tier 2 (Avg) |
| 4 | `24-IT-A04-28` | Priya Verma | `IT-A` | IT | A | 2028 | TE | 7.90 | 81.0% | No KT | Tier 2 (Avg) |
| 5 | `24-IT-B05-28` | Siddharth Iyer | `IT-B` | IT | B | 2028 | TE | 9.15 | 90.0% | No KT | Tier 1 (High) |
| 6 | `24-IT-B06-28` | Neha Joshi | `IT-B` | IT | B | 2028 | TE | 6.20 | 68.0% | Active KT | Tier 3 (Remedial) |
| 7 | `23-IT-A07-27` | Aditya Deshmukh | `IT-A` | IT | A | 2027 | BE | 8.70 | 85.5% | No KT | Tier 1 (High) |
| 8 | `23-IT-A08-27` | Tanvi Kulkarni | `IT-A` | IT | A | 2027 | BE | 7.45 | 76.0% | No KT | Tier 2 (Avg) |
| 9 | `23-IT-B09-27` | Yash Mehta | `IT-B` | IT | B | 2027 | BE | 7.80 | 80.0% | No KT | Tier 2 (Avg) |
| 10 | `22-IT-A10-26` | Sneha Nair | `IT-A` | IT | A | 2026 | BE | 9.30 | 94.0% | No KT | Tier 1 (High) |
| 11 | `24-CMPNA01-28` | Vihaan Jain | `CMPN-A` | CMPN | A | 2028 | TE | 9.05 | 89.0% | No KT | Tier 1 (High) |
| 12 | `24-CMPNA02-28` | Ishita Roy | `CMPN-A` | CMPN | A | 2028 | TE | 7.55 | 77.0% | No KT | Tier 2 (Avg) |
| 13 | `24-CMPNB03-28` | Manav Shah | `CMPN-B` | CMPN | B | 2028 | TE | 7.10 | 74.5% | No KT | Tier 2 (Avg) |
| 14 | `23-CMPNA04-27` | Diya Kapoor | `CMPN-A` | CMPN | A | 2027 | BE | 8.60 | 86.0% | No KT | Tier 1 (High) |
| 15 | `22-COMPA05-26` | Aniket Patel | `COMP-A` | COMP | A | 2026 | BE | 7.85 | 82.0% | No KT | Tier 2 (Avg) |
| 16 | `24-AI&DSA01-28` | Kabir Malhotra | `AI&DS-A` | AI&DS | A | 2028 | TE | 9.25 | 91.5% | No KT | Tier 1 (High) |
| 17 | `24-AI&DSA02-28` | Riya Sengupta | `AI&DS-A` | AI&DS | A | 2028 | TE | 7.70 | 79.0% | No KT | Tier 2 (Avg) |
| 18 | `24-AI&DSB03-28` | Aryan Chopda | `AI&DS-B` | AI&DS | B | 2028 | TE | 5.90 | 65.0% | Active KT | Tier 3 (Remedial) |
| 19 | `23-AI&DSA04-27` | Kritika Saxena | `AI&DS-A` | AI&DS | A | 2027 | BE | 8.90 | 87.5% | No KT | Tier 1 (High) |
| 20 | `24-AIMLA01-28` | Devansh Trivedi | `AI&ML-A` | AI&ML | A | 2028 | TE | 8.95 | 88.5% | No KT | Tier 1 (High) |
| 21 | `24-AIMLA02-28` | Meera Nambiar | `AI&ML-A` | AI&ML | A | 2028 | TE | 7.35 | 75.5% | No KT | Tier 2 (Avg) |
| 22 | `24-EXTCA01-28` | Harshit Agarwal | `EXTC-A` | EXTC | A | 2028 | TE | 7.40 | 76.5% | No KT | Tier 2 (Avg) |
| 23 | `23-EXTCA02-27` | Pooja Bhatt | `EXTC-A` | EXTC | A | 2027 | BE | 6.45 | 69.5% | Active KT | Tier 3 (Remedial) |
| 24 | `24-MECHA01-28` | Varun Patil | `MECH-A` | MECH | A | 2028 | TE | 7.25 | 77.0% | No KT | Tier 2 (Avg) |
| 25 | `24-MECHA02-28` | Shruti Gaikwad | `MECH-A` | MECH | A | 2028 | TE | 5.80 | 64.0% | Active KT | Tier 3 (Remedial) |

---

## 4. Program Coordinator Training Files

### File 1: `Technical_Training_Performance_Dummy.xlsx`
* **Target Endpoint:** `POST /api/program_coordinator/training-performance/upload/Technical/`
* **Required Columns:** `UID`, `Full Name`, `Branch`, `OS`, `DBMS`, `DSA`, `CN`, `OOPS`
* **Data Types:** String (UID, Name, Branch), Float (0–100 for OS, DBMS, DSA, CN, OOPS).
* **Sample Row:**
  ```
  24-IT-A01-28 | Aarav Sharma | IT-A | 88 | 92 | 95 | 86 | 94
  ```

### File 2: `Aptitude_Training_Performance_Dummy.xlsx`
* **Target Endpoint:** `POST /api/program_coordinator/training-performance/upload/Aptitude/`
* **Required Columns:** `UID`, `Full Name`, `Branch`, `Arithmetic`, `Logical Reasoning`, `Probability`, `Verbal Ability`, `Verbal Reasoning`
* **Data Types:** String (UID, Name, Branch), Float (0–100 for 5 Aptitude subcategories).
* **Sample Row:**
  ```
  24-IT-A01-28 | Aarav Sharma | IT-A | 90 | 94 | 88 | 92 | 90
  ```

### File 3: `Coding_Assessment_Dummy.xlsx`
* **Target Endpoint:** `POST /api/program_coordinator/training-performance/upload/Coding/`
* **Required Columns:** `UID`, `Full Name`, `Branch`, `Coding Marks`
* **Data Types:** String (UID, Name, Branch), Float (0–100 for Practical Coding Marks).
* **Sample Row:**
  ```
  24-IT-A01-28 | Aarav Sharma | IT-A | 96
  ```

---

## 5. Internship Officer Test Drives

### File: `Internship_Officer_Test_Drives.xlsx`
* **Target Endpoint:** `POST /api/internship/company/register/` (Form / JSON API)
* **Required Fields:** `name`, `batch`, `domain`, `min_cgpa`, `min_attendance`, `is_kt`, `departments`, `position`, `stipend`, `type`

| # | Company Name | Batch | Domain | Min CGPA | Min Attd % | Allow KT | Target Departments | Advertised Position | Monthly Stipend | Drive Type | Expected Eligible (Out of 25) |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | **TechNova Solutions** | 2028 | `it` | 7.00 | 75.0% | `false` | `IT,CMPN,AI&DS` | Software Engineering Intern | ₹25,000 | Full-time | **8 Students** (UIDs 1, 2, 3, 4, 5, 11, 12, 16, 17) |
| 2 | **Amazon AWS** | 2028 | `it` | 8.50 | 80.0% | `false` | `all` | Cloud Infrastructure Intern | ₹45,000 | Full-time | **5 Students** (UIDs 1, 2, 5, 11, 16, 20) |
| 3 | **TCS Digital** | 2027 | `it` | 6.50 | 70.0% | `false` | `IT,CMPN,AI&DS,EXTC` | System Engineer Intern | ₹20,000 | Full-time | **4 Students** (UIDs 7, 8, 9, 14, 19) |
| 4 | **Deloitte** | 2026 | `it` | 7.50 | 75.0% | `false` | `all` | Cyber & Analytics Intern | ₹35,000 | Full-time | **2 Students** (UIDs 10, 15) |
| 5 | **Larsen & Toubro** | 2028 | `core` | 6.50 | 70.0% | `true` | `MECH,EXTC` | Automation & Robotics Intern | ₹18,000 | Part-time | **3 Students** (UIDs 22, 24, 25) |
| 6 | **Accenture** | 2028 | `it` | 7.20 | 75.0% | `false` | `AI&DS,AI&ML,IT,CMPN` | AI/ML Solutions Intern | ₹30,000 | Full-time | **9 Students** (UIDs 1, 2, 3, 4, 5, 11, 12, 16, 17, 20, 21) |

---

## 6. Recommended Import Sequence

Follow this step-by-step order to populate and test the application end-to-end:

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Student Master Demographic Roster                        │
│    (Department Coordinator or Historical Import)           │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Technical Training Performance Sheet                     │
│    (POST /api/program_coordinator/training-performance/     │
│     upload/Technical/ -> Semester 5)                        │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Aptitude Training Performance Sheet                      │
│    (POST /api/program_coordinator/training-performance/     │
│     upload/Aptitude/ -> Semester 5)                         │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Coding Assessment Sheet                                  │
│    (POST /api/program_coordinator/training-performance/     │
│     upload/Coding/ -> Semester 5)                           │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. Corporate Internship Drives                              │
│    (POST /api/internship/company/register/ via Form/API)    │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. Verification & Analytics Inspection                      │
│    - Program Coordinator: Verify Averages, Charts, Stats   │
│    - Internship Officer: Verify Cutoffs & Applied Lists     │
│    - Student Dashboard: Verify Personal Scorecard & Notices│
└─────────────────────────────────────────────────────────────┘
```

---

## 7. QA Validation & Test Scenarios

### Test Scenario A: Program Coordinator Multi-Subject Analytics
1. **Action:** Upload all three training files for `Semester 5`.
2. **Expected Result:**
   * `StudentAnalyticsViewSet` returns 25 student records with all 11 subcategories populated.
   * `AggregateAnalyticsView` renders accurate mean, standard deviation, and subject-wise toppers without `NaN` or missing values.
   * Department scoping filters correctly (e.g. IT coordinator sees 10 students, CMPN sees 5 students, AI&DS sees 4 students).

### Test Scenario B: Internship Eligibility Filtering
1. **Action:** Student with UID `24-IT-B06-28` (CGPA: 6.20, Attendance: 68.0%, Active KT) attempts to apply for **Amazon AWS** (Min CGPA: 8.50, Min Attd: 80%, No KTs).
2. **Expected Result:** Application is rejected as ineligible on CGPA, attendance, and KT grounds.
3. **Action:** Student with UID `24-IT-A01-28` (CGPA: 9.42, Attendance: 92.5%, No KT) applies for **Amazon AWS**.
4. **Expected Result:** Application is accepted as eligible.

---

## 8. Compliance & Non-Corruption Guarantee

* **Isolated Identifiers:** All generated test UIDs use standard TCET patterns (`24-IT-A01-28`, etc.) that do not collide with official live student records.
* **No Database Schema Changes:** Generated Excel files strictly match the current Django models and serializers without requiring database migrations.
