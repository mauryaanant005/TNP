import { Link, Outlet } from "react-router";
import {
  CalendarCheck,
  User,
  Menu,
  MessageCircle,
  FileUser,
  LogOutIcon,
  User2Icon,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { logout, redirectToProfile } from "@/utils";
import Logo from "@/assets/tcet_logo_2.png";

const StudentLayout = () => {
  const menuItems = [
    { icon: User, label: "Personal Info", href: "/student/" },
    {
      icon: CalendarCheck,
      label: "Training Attendance",
      href: "/student/session-attendance",
    },
    {
      icon: CalendarCheck,
      label: "Training Performance",
      href: "/student/training-performance",
    },
    {
      icon:FileUser,
      label:"Placement Card",
      href:"/student/placement-card"
    },
     {
      icon:FileUser,
      label:"Internship Summary",
      href:"/student/internships"
    },
    { icon: FileUser, label: "Resume", href: "/student/resume" },
    { icon: MessageCircle, label: "Notifications", href: "/notifications/" },

  ];

  return (
    <div className="absolute top-0 left-0 w-full min-w-fit">
      <header className="min-w-fit bg-[#d17a00] px-4 py-3 shadow-lg flex justify-between items-center">
        <h1 className="text-xl md:text-2xl font-bold text-white flex h-full">
          Student Dashboard
        </h1>
        <img src={Logo} alt="TCET logo" title="TCET logo" className="h-10" />
      </header>
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="my-3 z-40 rounded-full bg-white shadow-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 dark:focus:ring-gray-700"
          >
            <Menu className="h-5 w-5" color="#000000" />
            <span className="sr-only">Open menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[300px] p-0">
          <SheetHeader className="border-b p-6 dark:border-gray-700">
            <SheetTitle className="text-2xl font-bold">Menu</SheetTitle>
          </SheetHeader>
          <div className="flex h-full flex-col justify-between py-6">
            <nav className="space-y-2 px-4 flex flex-col w-full max-h-[calc(100vh-150px)] overflow-y-auto">
              {menuItems.map((item, index) => (
                <Link
                  key={index}
                  to={item.href}
                  className="shadow-xl w-[80%] p-2 text-black no-underline hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white"
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.label}
                </Link>
              ))}
              <button
                onClick={redirectToProfile}
                className="shadow-xl w-[80%] p-2 text-black no-underline bg-white hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white flex justify-start"
              >
                <User2Icon className="mr-3 h-5 w-5" />
                Profile
              </button>
              <button
                onClick={logout}
                className="shadow-xl w-[80%] p-2 text-black no-underline bg-white hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white flex justify-start"
              >
                <LogOutIcon className="mr-3 h-5 w-5" />
                Logout
              </button>
            </nav>
          </div>
        </SheetContent>
      </Sheet>
      <Outlet />
    </div>
  );
};

export default StudentLayout;