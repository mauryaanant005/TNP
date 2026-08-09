import { useAtomValue } from "jotai";
import { Navigate, Outlet } from "react-router";

import { authAtom, authStatusAtom } from "@/authAtom";
import { homePathForRole, roleIsAllowed } from "@/lib/roles";

/**
 * Route guard (T-13). Before this, `grep -rn "role" client_app/src/routes/`
 * returned nothing across all ten route groups: any signed-in user could open
 * any role's pages and see them render.
 *
 * An unauthorised user is redirected to *their own* home rather than shown a
 * blank 403 — landing on a working page beats staring at an error for someone
 * who simply followed a stale link or a bookmark from a shared machine.
 *
 * This is defence in depth, not the boundary. Every endpoint behind these
 * pages is gated by `HasRole` on the server; see `docs/PERMISSIONS.md`.
 */
const RequireRole = ({ allowed }: { allowed: readonly string[] }) => {
  const authUser = useAtomValue(authAtom);
  const status = useAtomValue(authStatusAtom);

  // Still resolving /api/ — render nothing rather than redirecting on
  // incomplete information.
  if (status === "loading") return null;

  // App.tsx already sends unauthenticated users to the Django login page; this
  // only catches a render that beats that redirect.
  if (status === "anonymous" || !authUser) return null;

  if (!roleIsAllowed(authUser.role, allowed)) {
    return <Navigate to={homePathForRole(authUser.role)} replace />;
  }

  return <Outlet />;
};

export default RequireRole;
