import { authAtom } from "@/authAtom";
import { useAtomValue } from "jotai";
import { useEffect } from "react";
import { useNavigate } from "react-router";

const Home = () => {
  const authUser = useAtomValue(authAtom);
  const navigate = useNavigate();
  useEffect(() => {
    if (authUser?.role === "student") {
      navigate("/student");
    } else if (authUser?.role === "faculty") {
      navigate("/faculty_coordinator");
    } else if (authUser?.role === "principal") {
      navigate("/principal");
    } else if (authUser?.role === "staff") {
      navigate("/staff");
    } else if (authUser?.role === "training_officer") {
      navigate("/training_officer");
    } else if (authUser?.role === "internship_officer") {
      navigate("/internship_officer");
    } else if (authUser?.role === "placement_officer") {
      navigate("/placement_officer");
    }
  }, [authUser]);
  return <div>Home</div>;
};

export default Home;
