import React from "react";
import { useAuth } from "../../context/AuthContext";
import {
  ExternalLink,
  Menu,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

interface TopNavProps {
  onToggleMobileMenu: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({ onToggleMobileMenu }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const roleDisplayLabels: Record<string, string> = {
    TRAINING_CENTRE: "Training Centre",
    DISTRICT_OFFICER: "District Officer",
    QUALITY_TEAM: "Quality Assurance",
    STATE_OFFICE: "State Directorate",
  };

  return (
    <header className="glass-toolbar h-16 fixed top-0 right-0 left-0 md:left-64 z-20 px-3 sm:px-6 md:px-8 flex items-center justify-between border-b border-[#CED4DA]/40 select-none">
      {/* Left: Mobile hamburger menu toggle + Portal Title */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <button
          onClick={onToggleMobileMenu}
          className="md:hidden p-2 rounded-xl glass-card text-[#1F2E4A] hover:bg-white transition-colors cursor-pointer shrink-0"
          aria-label="Toggle navigation menu"
        >
          <Menu size={18} />
        </button>

        <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-[#1F2E4A]/8 text-[#1F2E4A] border border-[#1F2E4A]/15 whitespace-nowrap">
          Pragati Skill Portal
        </span>
        <span className="hidden sm:inline text-[#CED4DA]">•</span>
        <span className="hidden sm:inline text-xs font-semibold text-[#343A40] truncate max-w-[200px]">
          {user?.department || "State Directorate"}
        </span>
      </div>

      {/* Right Controls: Authenticated Role Display + Public Verify Link + Sign Out */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        {/* Active Role Indicator */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl glass-card border border-[#CED4DA]/60 bg-white/70 text-xs">
          <ShieldCheck size={14} className="text-[#1F2E4A]" />
          <div className="flex flex-col text-left leading-tight">
            <span className="font-bold text-[#1F2E4A]">
              {user?.fullName || (user?.role ? roleDisplayLabels[user.role] : "Official Account")}
            </span>
            <span className="text-[10px] text-slate-500 font-medium">
              {user?.district || user?.trainingCentre?.name || "Official Portal"}
            </span>
          </div>
        </div>

        {/* Public Verification Link */}
        <Link
          to="/verify"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold glass-card border border-[#CED4DA] text-[#343A40] hover:text-[#1F2E4A] hover:bg-white transition-all cursor-pointer shadow-xs"
          title="Open Public Certificate Verification in new tab"
        >
          <span>Verify</span>
          <ExternalLink size={12} className="text-slate-400" />
        </Link>

        {/* Independent Sign Out */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors cursor-pointer shadow-xs"
          title="Sign out of your official account"
        >
          <LogOut size={13} />
          <span className="hidden sm:inline">Sign Out</span>
        </button>
      </div>
    </header>
  );
};
