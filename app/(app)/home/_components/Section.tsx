"use client";

import { cn } from "@/lib/utils/tw-merge";

interface SectionProps {
    children: React.ReactNode;
    className?: string;
}

/**
 * Reusable Section wrapper component
 * 
 * Provides consistent padding across all homepage sections
 */
export function Section({ children, className }: SectionProps) {
    return (
        <section className={cn("py-12 px-8 md:px-12 lg:px-16", className)}>
            {children}
        </section>
    );
}
