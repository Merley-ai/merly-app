import { cn } from "@/lib/utils/tw-merge";

interface SkeletonProps {
    className?: string;
}

/**
 * Reusable skeleton primitive for loading states
 */
export function Skeleton({ className }: SkeletonProps) {
    return (
        <div
            className={cn(
                "bg-neutral-800 animate-pulse rounded",
                className
            )}
        />
    );
}
