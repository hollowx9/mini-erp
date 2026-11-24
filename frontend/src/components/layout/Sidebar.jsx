import { Link, useLocation } from "react-router-dom";

import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  DollarSign,
  CalendarDays,
  ShieldCheck,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";

function Sidebar() {
  const { user } = useAuth();

  const location = useLocation();

  const isActive = (path) =>
    location.pathname === path;

  return (
    <aside className="sidebar">
      <div className="sidebar-profile">
        <div className="profile-avatar">
          {user?.name?.charAt(0)?.toUpperCase() ||
            "U"}
        </div>

        <div>
          <span className="profile-role">
            {user?.role || "user"}
          </span>

          <h3>{user?.name || "User"}</h3>
        </div>
      </div>

      <nav className="nav-links">
        <Link
          to="/"
          className={isActive("/") ? "active" : ""}
        >
          <LayoutDashboard size={20} />
          Dashboard
        </Link>

        {user?.role === "admin" && (
          <Link
            to="/employees"
            className={
              isActive("/employees")
                ? "active"
                : ""
            }
          >
            <Users size={20} />
            Employees
          </Link>
        )}

        <Link
          to="/inventory"
          className={
            isActive("/inventory")
              ? "active"
              : ""
          }
        >
          <Package size={20} />
          Inventory
        </Link>

        <Link
          to="/sales"
          className={
            isActive("/sales") ? "active" : ""
          }
        >
          <ShoppingCart size={20} />
          Sales
        </Link>

        {user?.role === "admin" && (
          <Link
            to="/finance"
            className={
              isActive("/finance")
                ? "active"
                : ""
            }
          >
            <DollarSign size={20} />
            Finance
          </Link>
        )}

        <Link
          to="/leaves"
          className={
            isActive("/leaves") ? "active" : ""
          }
        >
          <CalendarDays size={20} />
          Leaves
        </Link>

        <Link
          to="/permissions"
          className={
            isActive("/permissions")
              ? "active"
              : ""
          }
        >
          <ShieldCheck size={20} />
          Permissions
        </Link>

        <Link
          to="/holidays"
          className={
            isActive("/holidays")
              ? "active"
              : ""
          }
        >
          <CalendarDays size={20} />
          Holidays
        </Link>
      </nav>
    </aside>
  );
}

export default Sidebar;