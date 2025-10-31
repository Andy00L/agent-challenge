import React from "react";
import { type VariantProps } from "class-variance-authority";
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@radix-ui/react-tooltip";
import { buttonVariants, Button } from "./ui/button";

interface ButtonWithTooltipProps
  extends React.ComponentProps<"button">,
    VariantProps<typeof buttonVariants> {
  tooltipContent: string;
  children: React.ReactNode;
  asChild?: boolean;
}

export function ButtonWithTooltip({
  tooltipContent,
  children,
  ...buttonProps
}: ButtonWithTooltipProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button {...buttonProps}>{children}</Button>
        </TooltipTrigger>
        <TooltipContent>{tooltipContent}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
