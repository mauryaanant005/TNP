import { useEffect } from "react";
import { Outlet, useNavigate } from "react-router";
import { useAtomValue } from "jotai";
import { authAtom } from "@/authAtom";
const FacultyLayout = () => {
  const authUser = useAtomValue(authAtom);
  const navigate = useNavigate();
  useEffect(() => {
    if (!authUser || authUser.role !== "faculty") {
      navigate("/");
    }
  }, []);
  return <Outlet />;
};

export default FacultyLayout;
