"use client";

import { useState, useRef, useEffect, ReactNode } from "react";
import { createPortal } from "react-dom";

interface TooltipProps {
    children: ReactNode;
    text: string;
    position?: "top" | "bottom" | "right";
    disabled?: boolean;
}

/**
 * Reusable Tooltip component
 * 
 * @param children - The element to wrap with tooltip
 * @param text - The tooltip text to display
 * @param position - Position of tooltip relative to element ("top", "bottom", or "right", default: "bottom")
 * @param disabled - Whether to disable the tooltip
 * 
 * @example
 * <Tooltip text="Click me" position="right">
 *   <button>Hover me</button>
 * </Tooltip>
 */
export function Tooltip({ children, text, position = "bottom", disabled = false }: TooltipProps) {
    const [show, setShow] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0 });
    const triggerRef = useRef<HTMLDivElement>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (show && triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            const isTop = position === "top";
            const isRight = position === "right";

            let top = 0;
            let left = 0;

            if (isRight) {
                top = rect.top + rect.height / 2;
                left = rect.right + 14;
            } else if (isTop) {
                top = rect.top - 8;
                left = rect.left + rect.width / 2;
            } else {
                top = rect.bottom + 8;
                left = rect.left + rect.width / 2;
            }

            setCoords({ top, left });
        }
    }, [show, position]);

    if (disabled) {
        return <>{children}</>;
    }

    const isTop = position === "top";
    const isRight = position === "right";

    const tooltipContent = show && mounted ? (
        <div
            className="fixed pointer-events-none z-[9999] whitespace-nowrap"
            style={{
                top: `${coords.top}px`,
                left: `${coords.left}px`,
                transform: isRight
                    ? "translateY(-50%)"
                    : isTop
                        ? "translate(-50%, -100%)"
                        : "translate(-50%, 0)",
            }}
        >
            <div className="relative bg-white rounded-lg px-3 py-2 shadow-lg">
                {/* Arrow */}
                <div
                    className={`absolute ${isRight
                        ? "right-full -mr-px top-1/2 -translate-y-1/2"
                        : `left-1/2 -translate-x-1/2 ${isTop ? "top-full -mt-px" : "bottom-full -mb-px"}`
                        }`}
                >
                    <div
                        className={`border-[6px] border-transparent ${isRight
                            ? "border-r-white"
                            : isTop
                                ? "border-t-white"
                                : "border-b-white"
                            }`}
                    />
                </div>
                {/* Text */}
                <p className="font-['Roboto',_sans-serif] text-black text-[14px] font-normal whitespace-nowrap">
                    {text}
                </p>
            </div>
        </div>
    ) : null;

    return (
        <>
            <div
                ref={triggerRef}
                className="inline-flex"
                onMouseEnter={() => setShow(true)}
                onMouseLeave={() => setShow(false)}
            >
                {children}
            </div>
            {mounted && tooltipContent && createPortal(tooltipContent, document.body)}
        </>
    );
}