"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  // base (motion-friendly, high-contrast, focus ring on tokens)
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-0 " +
    "disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] select-none",
  {
    variants: {
      variant: {
        // solid primary (electric blue)
        default:
          "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 border border-primary/80",
        // modern outline
        outline:
          "border border-border bg-background/40 hover:bg-background/70 text-text",
        // quiet background
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/85 border border-secondary/40",
        // subtle glass
        subtle:
          "bg-background/60 text-text border border-border hover:bg-background/80",
        // link-style
        ghost:
          "text-text hover:bg-primary/10 hover:text-primary",
        // danger
        destructive:
          "bg-destructive text-white hover:bg-destructive/90",
      },
      size: {
        sm: "h-8 px-3",
        md: "h-10 px-4",
        lg: "h-11 px-5 text-[15px]",
        icon: "h-10 w-10 p-0",
      },
      round: {
        md: "rounded-xl",
        full: "rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
      round: "md",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, round, asChild = false, loading, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(
          buttonVariants({ variant, size, round }),
          loading && "relative text-transparent pointer-events-none",
          className
        )}
        ref={ref}
        {...props}
      >
        {loading && (
          <span className="absolute inset-0 grid place-items-center">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
          </span>
        )}
        <span className="translate-y-[0]">{children}</span>
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { buttonVariants }
