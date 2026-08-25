export const BASE_URL = import.meta.env.VITE_BASE_URL || "";
export const SERVER_URL =
  import.meta.env.VITE_SERVER_URL ||
  (typeof window !== "undefined" && window.location.hostname.includes("tcettnp.in")
    ? "https://api.tcettnp.in"
    : "");

export const DEPARTMENTS_TO_DISPLAY = [
  "AI&DS",
  "AI&ML",
  "IoT",
  "COMP",
  "CS&E",
  "E&CS",
  "E&TC",
  "IT",
  "Mech",
  "MME",
  "CIVIL",
  "BBA",
  "MBA",
  "BCA",
  "MCA",
  "BVOC",
];
