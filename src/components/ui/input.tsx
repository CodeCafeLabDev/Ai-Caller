'use client';
import * as React from "react"
import { Eye, EyeOff } from "lucide-react"

import { cn } from "@/lib/cn"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input"> & { showPasswordToggle?: boolean }>(
  ({ className, type, showPasswordToggle, ...props }, ref) => {
    const [show, setShow] = React.useState(false);
    const isPassword = type === "password" && showPasswordToggle;
    return (
      <div className="relative">
        <input
          type={isPassword ? (show ? "text" : "password") : type}
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            className
          )}
          ref={ref}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            tabIndex={-1}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground focus:outline-none"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? "Hide password" : "Show password"}
          >
            {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }
