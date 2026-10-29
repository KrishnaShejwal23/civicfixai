import React from "react";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  showTagline?: boolean;
  light?: boolean;
}

export function Logo({
  className = "",
  size = "md",
  showTagline = false,
  light = false,
}: LogoProps) {
  const iconSizes = {
    sm: "w-7 h-7",
    md: "w-9 h-9",
    lg: "w-12 h-12",
  };

  const textSizes = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl",
  };

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Original Civic Landmark + Location Pin + AI Accent Vector */}
      <div className={`relative flex items-center justify-center shrink-0 ${iconSizes[size]}`}>
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-sm"
        >
          {/* Base Pin / Dome Shield */}
          <path
            d="M24 4C14.0589 4 6 12.0589 6 22C6 32.5 21.6 43.1 23.1 44.1C23.6 44.5 24.4 44.5 24.9 44.1C26.4 43.1 42 32.5 42 22C42 12.0589 33.9411 4 24 4Z"
            fill={light ? "#FFFFFF" : "#10243A"}
          />
          {/* Civic Landmark Pillars / Arch Cutout */}
          <path
            d="M17 28V19C17 18.4 17.4 18 18 18H30C30.6 18 31 18.4 31 19V28"
            stroke={light ? "#10243A" : "#FFFFFF"}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          {/* AI Checkmark Accent in Vibrant Teal */}
          <path
            d="M18 22L22.5 26.5L34 15"
            stroke="#10BFA5"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* AI Pulsing Sparkle Node */}
          <circle cx="34" cy="15" r="2.5" fill="#10BFA5" />
        </svg>
      </div>

      <div className="flex flex-col">
        <div className="flex items-center leading-none">
          <span
            className={`font-bold tracking-tight ${textSizes[size]} ${
              light ? "text-white" : "text-[#10243A]"
            }`}
          >
            CivicFix
          </span>
          <span className={`font-extrabold ml-1 ${textSizes[size]} text-[#10BFA5]`}>
            AI
          </span>
        </div>
        {showTagline && (
          <span
            className={`text-[11px] font-medium tracking-wide mt-0.5 ${
              light ? "text-slate-300" : "text-[#8A94A6]"
            }`}
          >
            Smarter Cities. Better Communities.
          </span>
        )}
      </div>
    </div>
  );
}
