import { Outlet } from "react-router-dom";

import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import NotificationWatcher from "../common/NotificationWatcher";

function DashboardLayout() {
  return (
    <div className="app-layout">
      <Sidebar />

      <div className="main-content">
        <Navbar />

        <NotificationWatcher />

        <div className="page-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default DashboardLayout;