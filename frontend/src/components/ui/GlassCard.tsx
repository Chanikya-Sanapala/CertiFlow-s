import React from "react";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = "",
  onClick,
  hoverable = false,
}) => {
  return (
    <div
      onClick={onClick}
      className={`glass-card rounded-2xl p-6 relative overflow-hidden ${
        hoverable ? "cursor-pointer transition-transform duration-200 hover:-translate-y-0.5" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
};

