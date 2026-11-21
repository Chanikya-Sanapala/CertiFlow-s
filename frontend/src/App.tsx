import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { AppLayout } from "./components/layout/AppLayout";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { BatchesPage } from "./pages/BatchesPage";
import { BatchDetailPage } from "./pages/BatchDetailPage";
import { CertificatesPage } from "./pages/CertificatesPage";
import { VerificationPage } from "./pages/VerificationPage";
import { AuditLogsPage } from "./pages/AuditLogsPage";

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Verification Route (No authentication required) */}
          <Route path="/verify" element={<VerificationPage />} />
          <Route path="/verify/:certificateNumber" element={<VerificationPage />} />

          {/* Authentication Route */}
          <Route path="/login" element={<LoginPage />} />

          {/* Authenticated Application Shell */}
          <Route element={<AppLayout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/batches" element={<BatchesPage />} />
            <Route path="/batches/:id" element={<BatchDetailPage />} />
            <Route path="/approvals" element={<BatchesPage />} />
            <Route path="/quality" element={<BatchesPage />} />
            <Route path="/certificates" element={<CertificatesPage />} />
            <Route path="/audit" element={<AuditLogsPage />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
