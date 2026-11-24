import {
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import DashboardLayout from "../components/layout/DashboardLayout";

import ProtectedRoute from "./ProtectedRoute";
import RoleProtectedRoute from "./RoleProtectedRoute";

import DashboardPage from "../pages/dashboard/DashboardPage";

import EmployeesPage from "../pages/employees/EmployeesPage";

import InventoryPage from "../pages/inventory/InventoryPage";

import SalesPage from "../pages/sales/SalesPage";

import FinancePage from "../pages/finance/FinancePage";

import LoginPage from "../pages/auth/LoginPage";

import RegisterPage from "../pages/auth/RegisterPage";

import ForgotPasswordPage from "../pages/auth/ForgotPasswordPage";

import ResetPasswordPage from "../pages/auth/ResetPasswordPage";

import LeavesPage from "../pages/leaves/LeavesPage";

import PermissionsPage from "../pages/permissions/PermissionsPage";

import HolidayCalendar from "../pages/HolidayCalendar/HolidayCalendar";

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}

      <Route
        path="/login"
        element={<LoginPage />}
      />

      <Route
        path="/register"
        element={<RegisterPage />}
      />

      <Route
        path="/forgot-password"
        element={<ForgotPasswordPage />}
      />

      <Route
        path="/reset-password/:token"
        element={<ResetPasswordPage />}
      />

      {/* Protected routes */}

      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route
          path="/"
          element={<DashboardPage />}
        />

        <Route
          path="/inventory"
          element={<InventoryPage />}
        />

        <Route
          path="/sales"
          element={<SalesPage />}
        />

        <Route
          path="/holidays"
          element={<HolidayCalendar />}
        />

        <Route
          path="/leaves"
          element={
            <RoleProtectedRoute
              allowedRoles={[
                "admin",
                "user",
              ]}
            >
              <LeavesPage />
            </RoleProtectedRoute>
          }
        />

        <Route
          path="/permissions"
          element={
            <RoleProtectedRoute
              allowedRoles={[
                "admin",
                "user",
              ]}
            >
              <PermissionsPage />
            </RoleProtectedRoute>
          }
        />

        <Route
          path="/employees"
          element={
            <RoleProtectedRoute
              allowedRoles={["admin"]}
            >
              <EmployeesPage />
            </RoleProtectedRoute>
          }
        />

        <Route
          path="/finance"
          element={
            <RoleProtectedRoute
              allowedRoles={["admin"]}
            >
              <FinancePage />
            </RoleProtectedRoute>
          }
        />
      </Route>

      <Route
        path="*"
        element={<Navigate to="/" replace />}
      />
    </Routes>
  );
}

export default AppRoutes;