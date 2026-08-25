// Role groups and per-role landing pages (T-13).
//
// This mirrors `ROLES` in `base/permissions.py` and the tables in
// `docs/PERMISSIONS.md`. **The API is the security boundary** — these guards
// exist so a user who types another role's URL lands somewhere sensible
// instead of on a page that renders empty panels and console errors. They are
// not a substitute for the server-side check, and widening one here does not
// grant access to anything.
//
// Keep the groups below in step with `base/permissions.py`. If they drift, the
// symptom is a route that renders and then 403s on every request it makes.

export type Role =
  | "student"
  | "faculty"
  | "staff"
  | "training_officer"
  | "placement_officer"
  | "internship_officer"
  | "principal"
  | "system_admin"
  // Retained because existing accounts may still carry them: both were dropped
  // from User.USER_ROLE_TYPE but the strings can persist in the column.
  | "department_coordinator"
  | "program_coordinator";

// A superuser passes every check, exactly as `HasRole.has_permission` does.
export const SUPERUSER_ROLE: Role = "system_admin";

export const ROLE_GROUPS = {
  STUDENT: ["student"],
  PLACEMENT_DRIVE: ["staff", "placement_officer"],
  PLACEMENT_REPORTS: ["placement_officer", "principal"],
  TRAINING_DELIVERY: ["faculty", "program_coordinator"],
  TRAINING_ALL: ["faculty", "program_coordinator", "training_officer"],
  TRAINING_OVERSIGHT: ["training_officer", "principal"],
  DEPARTMENT: ["department_coordinator", "faculty"],
  INTERNSHIP: ["internship_officer", "staff"],
  PRINCIPAL: ["principal"],
} satisfies Record<string, Role[]>;

// Where each role goes when it lands on "/" — and where an unauthorised user
// is sent instead of being shown a blank 403.
const ROLE_HOME: Record<Role, string> = {
  student: "/student",
  faculty: "/faculty_coordinator",
  department_coordinator: "/department_coordinator",
  program_coordinator: "/program_coordinator",
  principal: "/principal",
  staff: "/staff",
  training_officer: "/training_officer",
  internship_officer: "/internship_officer",
  placement_officer: "/placement_officer",
  system_admin: "/admin/",
};

/** The landing route for a role. Falls back to "/student" if unmapped. */
export function homePathForRole(role?: string | null): string {
  if (!role) return "/";
  return ROLE_HOME[role as Role] ?? "/student";
}

export function roleIsAllowed(role: string | undefined | null, allowed: readonly string[]): boolean {
  if (!role) return false;
  return role === SUPERUSER_ROLE || allowed.includes(role);
}
