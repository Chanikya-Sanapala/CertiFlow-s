import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  LayoutDashboard,
  Layers,
  CheckCircle2,
  ShieldAlert,
  Award,
  Search,
  History,
  Building2,
  X,
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const role = user?.role;

  const navItems = [
    {
      label: "Dashboard",
      path: "/dashboard",
      icon: <LayoutDashboard size={18} />,
      roles: ["TRAINING_CENTRE", "DISTRICT_OFFICER", "QUALITY_TEAM", "STATE_OFFICE"],
    },
    {
      label: role === "TRAINING_CENTRE" ? "Upload & Batches" : "Batches",
      path: "/batches",
      icon: <Layers size={18} />,
      roles: ["TRAINING_CENTRE", "DISTRICT_OFFICER", "QUALITY_TEAM", "STATE_OFFICE"],
    },
    {
      label: "District Approvals",
      path: "/approvals",
      icon: <CheckCircle2 size={18} />,
      roles: ["DISTRICT_OFFICER", "STATE_OFFICE"],
    },
    {
      label: "Quality Review",
      path: "/quality",
      icon: <ShieldAlert size={18} />,
      roles: ["QUALITY_TEAM", "STATE_OFFICE"],
    },
    {
      label: "Certificates",
      path: "/certificates",
      icon: <Award size={18} />,
      roles: ["TRAINING_CENTRE", "DISTRICT_OFFICER", "QUALITY_TEAM", "STATE_OFFICE"],
    },
    {
      label: "Public Verification",
      path: "/verify",
      icon: <Search size={18} />,
      roles: ["TRAINING_CENTRE", "DISTRICT_OFFICER", "QUALITY_TEAM", "STATE_OFFICE"],
    },
    {
      label: "Audit Logs",
      path: "/audit",
      icon: <History size={18} />,
      roles: ["DISTRICT_OFFICER", "QUALITY_TEAM", "STATE_OFFICE"],
    },
  ];

  const filteredItems = navItems.filter((item) => role && item.roles.includes(role));

  const roleLabels: Record<string, string> = {
    TRAINING_CENTRE: "Training Centre",
    DISTRICT_OFFICER: "District Officer",
    QUALITY_TEAM: "Quality Assurance",
    STATE_OFFICE: "State Directorate",
  };

  return (
    <aside
      className={`w-64 max-w-[80vw] glass-panel border-r border-[#CED4DA]/50 flex flex-col h-screen fixed left-0 top-0 z-50 transition-transform duration-200 ease-in-out md:translate-x-0 ${
        isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
      } select-none`}
    >
      {/* Brand Header without extra icon logo - Pure Clean Apple Typography */}
      <div className="p-6 border-b border-[#CED4DA]/40 flex items-center justify-between">
        <div>
          <h1 className="font-extrabold text-xl text-[#1F2E4A] tracking-tight flex items-center gap-2">
            CertiFlow
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#1F2E4A]/10 text-[#1F2E4A]">
              Gov
            </span>
          </h1>
          <p className="text-[11px] text-[#343A40]/70 font-semibold tracking-wide mt-0.5">
            Pragati Skills Mission
          </p>
        </div>

        {/* Mobile Close Button */}
        <button
          onClick={onClose}
          className="md:hidden p-1.5 rounded-lg text-slate-500 hover:text-[#1F2E4A] hover:bg-slate-100 transition-colors"
          aria-label="Close menu"
        >
          <X size={20} />
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-5 space-y-1.5 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-[#343A40]/50">
          Navigation
        </div>
        {filteredItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                isActive
                  ? "bg-[#1F2E4A] text-white shadow-sm shadow-[#1F2E4A]/25"
                  : "text-[#343A40] hover:bg-white/80 hover:text-[#1F2E4A]"
              }`
            }
          >
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Current User Role Footer */}
      <div className="p-4 border-t border-[#CED4DA]/40 bg-white/50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#1F2E4A]/10 text-[#1F2E4A] font-bold flex items-center justify-center text-xs border border-[#1F2E4A]/20 shrink-0">
            {user?.fullName?.charAt(0) || "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-[#1F2E4A] truncate">
              {user?.fullName || "User"}
            </p>
            <p className="text-[11px] text-[#343A40]/70 truncate flex items-center gap-1 font-medium">
              <Building2 size={11} className="shrink-0" />
              <span className="truncate">
                {role ? roleLabels[role] : "Officer"}
                {user?.district ? ` • ${user.district.replace("District ", "")}` : ""}
              </span>
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
};
