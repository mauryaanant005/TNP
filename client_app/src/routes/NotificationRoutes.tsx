import { Route } from "react-router";
import CreateNotification from "../pages/notification/create-notification";
import NotificationDetail from "../pages/notification/notification-detail";
import NotificationList from "../pages/notification/notification-list";
import NotificationParent from "../pages/notification/notification-parent";

const NotificationRoutes = () => {
  return (
    <Route path="/notifications" element={<NotificationParent />}>
      <Route index element={<NotificationList />} />
      <Route path="create" element={<CreateNotification />} />
      <Route path=":id" element={<NotificationDetail />} />
    </Route>
  );
};

export default NotificationRoutes;
