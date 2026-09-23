# TCET Training Attendance & Performance Dataset Documentation

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
| **ACT Technical** | **10 Sessions** (`Session 1` to `Session 10`) | Bi-weekly | Semester 5/7/8 | OS, DBMS, DSA, CN, OOPS |
| **ACT Aptitude** | **8 Sessions** (`Session 1` to `Session 8`) | Weekly | Semester 5/7/8 | Arithmetic, Logical, Verbal, Probability |
| **SDP** (Skill Dev Program) | **6 Sessions** (`Session 1` to `Session 6`) | Weekly | Semester 5/7/8 | Soft Skills, Communication & Domain Projects |
| **Coding Contest** | **5 Sessions** (`Session 1` to `Session 5`) | Bi-weekly | Semester 5/7/8 | LeetCode / Competitive Programming |

---

## 3. Mathematical Consistency & Attendance Distribution

The session records are derived from the student's holistic performance profile:
* **Top Performers (90–100% attendance):** E.g., Aarav Sharma (`24-IT-A01-28`, 92.5%), Sneha Nair (`22-IT-A10-26`, 94.0%), Kabir Malhotra (`24-AI&DSA01-28`, 91.5%).
* **Good Performers (80–90% attendance):** E.g., Ananya Patel (`24-IT-A02-28`, 88.0%), Aditya Deshmukh (`23-IT-A07-27`, 85.5%), Diya Kapoor (`23-CMPNA04-27`, 86.0%).
* **Average Performers (70–80% attendance):** E.g., Rohan Gupta (`24-IT-A03-28`, 78.5%), Priya Verma (`24-IT-A04-28`, 81.0%), Yash Mehta (`23-IT-B09-27`, 80.0%).
* **Low / KT Performers (55–70% attendance):** E.g., Neha Joshi (`24-IT-B06-28`, 68.0%), Aryan Chopda (`24-AI&DSB03-28`, 65.0%), Shruti Gaikwad (`24-MECHA02-28`, 64.0%).

For every session and batch:
$$\text{Total Students} = \text{Total Present} + \text{Total Absent}$$
$$\text{Attendance \%} = \left( \frac{\text{Total Present}}{\text{Total Sessions}} \right) \times 100$$

---

## 4. Worksheets Inside `Training_Attendance_Dummy.xlsx`

1. **`Session_Attendance`**: Granular session-level log containing UID, Full Name, Branch, Batch, Program Name, Session, Status (`Present` / `Absent`), Late Status (`Late` / `Not Late`), and Date.
2. **`Student_Aggregate`**: Per-student summary displaying percentage attendance across all 4 training programs and the combined training average.
3. **`Batch_Summary`**: Program Coordinator summary displaying Batch, Program Name, Year, Total Students, Total Present, Total Absent, Total Late, and Average Attendance %.
4. **`Dept_Attendance_Format`**: Direct import format for Department Coordinator (`uid`, `semester`, `attendance`).

---

## 5. Program Coordinator Module Verification Steps

1. Navigate to **Program Coordinator** $\rightarrow$ **Attendance & Marks** (`/program_coordinator/attendance-and-marks`).
2. Select **Program Name** (e.g. `ACT Technical`, `ACT Aptitude`, `SDP`, `Coding Contest`).
3. Observe the calculated table dynamically render batches `2028`, `2027`, and `2026` with session columns and exact Present/Absent/Late counts.
4. Click **DOWNLOAD EXCEL** to export the structured attendance report.
