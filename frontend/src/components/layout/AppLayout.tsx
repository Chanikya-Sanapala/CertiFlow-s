import React, { useState } from "react";
import { Outlet, Navigate } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { TopNav } from "./TopNav";
import { useAuth } from "../../context/AuthContext";

export const AppLayout: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center">
        <div className="w-8 h-8 border-3 border-[#1F2E4A] border-t-transparent rounded-full animate-spin mb-3" />
        <h2 className="text-sm font-bold text-[#1F2E4A]">CertiFlow Gov</h2>
        <p className="text-xs text-slate-500 mt-1">Authenticating session credentials...</p>
      </div>
    );
  }

  // Enforce session requirement for application shell
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex text-[#343A40] overflow-x-hidden">
      {/* Mobile Backdrop Overlay */}
      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 md:hidden animate-in fade-in duration-200"
          aria-hidden="true"
        />
      )}

      {/* Translucent Glass Sidebar */}
      <Sidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col pl-0 md:pl-64 min-h-screen w-full min-w-0">
        <TopNav onToggleMobileMenu={() => setIsMobileMenuOpen((prev) => !prev)} />
        <main className="flex-1 pt-20 px-3 sm:px-6 md:px-8 pb-12 max-w-7xl mx-auto w-full min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
