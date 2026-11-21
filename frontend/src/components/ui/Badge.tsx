import React from "react";

export type BadgeVariant =
  | "default"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "navy";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "default",
  className = "",
  dot = false,
}) => {
  const styles: Record<BadgeVariant, { bg: string; text: string; dot: string; border: string }> = {
    default: {
      bg: "bg-[#F8F9FA]",
      text: "text-[#343A40]",
      dot: "bg-[#CED4DA]",
      border: "border-[#CED4DA]/60",
    },
    success: {
      bg: "bg-emerald-50",
      text: "text-emerald-800",
      dot: "bg-emerald-500",
      border: "border-emerald-200",
    },
    warning: {
      bg: "bg-amber-50",
      text: "text-amber-800",
      dot: "bg-amber-500",
      border: "border-amber-200",
    },
    danger: {
      bg: "bg-rose-50",
      text: "text-rose-800",
      dot: "bg-rose-500",
      border: "border-rose-200",
    },
    info: {
      bg: "bg-sky-50",
      text: "text-sky-800",
      dot: "bg-sky-500",
      border: "border-sky-200",
    },
    navy: {
      bg: "bg-[#1F2E4A]/10",
      text: "text-[#1F2E4A]",
      dot: "bg-[#1F2E4A]",
      border: "border-[#1F2E4A]/25",
    },
  };

  const current = styles[variant];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${current.bg} ${current.text} ${current.border} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${current.dot}`} />}
      {children}
    </span>
  );
};

