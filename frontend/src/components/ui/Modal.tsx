import React, { useEffect } from "react";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "4xl";
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = "lg",
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "4xl": "max-w-4xl",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/35 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={`w-full ${maxWidthClasses[maxWidth]} glass-panel rounded-2xl bg-white/95 p-6 shadow-2xl border border-[#CED4DA] relative`}
      >
        <div className="flex items-center justify-between pb-4 border-b border-[#CED4DA]/50">
          <h3 className="text-lg font-semibold text-[#1F2E4A]">{title}</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-[#343A40] hover:bg-slate-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <div className="pt-4 max-h-[80vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};

