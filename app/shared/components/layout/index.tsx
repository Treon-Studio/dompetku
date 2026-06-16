"use client";

import { TooltipProvider } from "~/shared/components/ui/tooltip";

export default function Layout({ children }: { children: any }) {
	return <TooltipProvider delayDuration={500}>{children}</TooltipProvider>;
}
