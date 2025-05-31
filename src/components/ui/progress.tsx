import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "@/lib/utils"

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(({ className, value, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
      "relative h-4 w-full overflow-hidden rounded-full bg-secondary",
      className
    )}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className="h-full w-full flex-1 bg-primary transition-all"
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </ProgressPrimitive.Root>
))
Progress.displayName = ProgressPrimitive.Root.displayName

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

export { Progress, ProgressBar }
