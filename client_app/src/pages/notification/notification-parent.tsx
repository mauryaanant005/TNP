import { Outlet } from "react-router";
import NavBar from "@/components/NavBar";
const NotificationParent = () => {
  return (
    <div>
      <NavBar title="Notification" />
      <Outlet />
    </div>
  );
};

export default NotificationParent;
