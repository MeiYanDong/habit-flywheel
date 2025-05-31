import * as React from "react";

interface ProgressBarProps {
  current: number;
  max: number;
  showText?: boolean;
  className?: string;
  barColor?: string;
  trackColor?: string;
  label?: string;
}

const ProgressBar = ({
  current,
  max,
  showText = true,
  className = "",
  barColor = "bg-[hsl(var(--apple-blue))]",
  trackColor = "bg-[hsl(var(--apple-light-gray))]",
  label = "能量进度"
}: ProgressBarProps) => {
  const percentage = Math.min(100, (current / max) * 100);
  
  return (
    <div className={`mb-2 ${className}`}>
      {showText && (
        <div className="flex justify-between text-xs mb-1">
          <span className="text-[hsl(var(--apple-gray))]">{label}</span>
          <span className="font-medium">{current}/{max}</span>
        </div>
      )}
      <div className={`h-2 w-full rounded-full ${trackColor} overflow-hidden`}>
        <div 
          className={`h-full rounded-full ${barColor} transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export { ProgressBar }; 