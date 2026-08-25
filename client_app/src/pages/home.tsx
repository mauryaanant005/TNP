import { authAtom, authStatusAtom } from "@/authAtom";
import { useAtomValue } from "jotai";
import { useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { homePathForRole } from "@/lib/roles";
import { GlobalBootScreen } from "@/components/GlobalBootScreen";
import { SERVER_URL } from "@/constant";
import { Capitalize } from "@/utils";

const Home = () => {
  const authUser = useAtomValue(authAtom);
  const status = useAtomValue(authStatusAtom);
  const navigate = useNavigate();
  const redirectedRef = useRef(false);

  useEffect(() => {
    if (redirectedRef.current) return;

    if (status === "anonymous") {
      redirectedRef.current = true;
      window.location.replace(`${SERVER_URL}/auth/login/`);
    } else if (status === "authenticated" && authUser?.role) {
      const target = homePathForRole(authUser.role);
      redirectedRef.current = true;
      if (target.startsWith("/admin") || target.startsWith("http")) {
        window.location.replace(`${SERVER_URL}${target}`);
      } else {
        navigate(target, { replace: true });
      }
    }
  }, [status, authUser, navigate]);

  if (status === "anonymous") {
    return <GlobalBootScreen message="Redirecting to TCET Login Portal..." />;
  }

  if (status === "authenticated" && authUser?.role) {
    return (
      <GlobalBootScreen
        message={`Opening ${Capitalize(authUser.role)} Dashboard...`}
        subMessage={authUser.email}
      />
    );
  }

  return <GlobalBootScreen message="Verifying session & initializing workspace..." />;
};

export default Home;

