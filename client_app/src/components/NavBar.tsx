import { MoveLeft } from "lucide-react";
import { Button } from "./ui/button";
import { useNavigate } from "react-router";
import Logo from "@/assets/tcet_logo_2.png";
const NavBar = ({ title }: { title: string }) => {
  const navigate = useNavigate();
  return (
    <div className="flex bg-[#4169e1] w-full justify-between absolute top-0 left-0  mb-10">
      <div className="flex items-center gap-2 p-2">
        <Button
          className="bg-[#4169e1] hover:bg-[#4169e1]/80 text-white text-3xl"
          onClick={() => navigate(-1)}
        >
          <MoveLeft size={100} />
        </Button>
        <span className="text-white font-bold text-xl">{title}</span>
      </div>
      <img src={Logo} className="h-12 w-auto object-contain my-auto mr-4" alt="Logo" />
    </div>
  );
};

export default NavBar;
