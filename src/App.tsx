import React, { ReactNode } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import DashboardLayout from "./components/DashboardLayout";
import Patients from "./pages/Patients";
//import Appointments from "./pages/Appointments";
import Users from "./pages/Users";
import AppointmentsCalendar from "./pages/AppointmentsCalendar";
import Doctors from "./pages/Doctors";
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";
import Branches from "./pages/Branches";

const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  return user ? <>{children}</> : <Navigate to="/login" replace />;
};

/* --- 🔀 APPLICATION ROUTER SHELL --- */

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Dashboard />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/patients"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Patients />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/appointments"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <AppointmentsCalendar />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctors"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Doctors />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/users"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Users />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Settings />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/branches"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Branches />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Catch-all gateway routing fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
