"use client";

import { useState, ReactNode } from "react";

interface TooltipProps {
    children: ReactNode;
    text: string;
    position?: "top" | "bottom";
    disabled?: boolean;
}

/**
 * Reusable Tooltip component
 * 
 * @param children - The element to wrap with tooltip
 * @param text - The tooltip text to display
 * @param position - Position of tooltip relative to element ("top" or "bottom", default: "bottom")
 * @param disabled - Whether to disable the tooltip
 * 
 * @example
 * <Tooltip text="Click me" position="bottom">
 *   <button>Hover me</button>
 * </Tooltip>
 */
export function Tooltip({ children, text, position = "bottom", disabled = false }: TooltipProps) {
    const [show, setShow] = useState(false);

    if (disabled) {
        return <>{children}</>;
    }

    const isTop = position === "top";

    return (
        <div
            className="relative inline-flex"
            onMouseEnter={() => setShow(true)}
            onMouseLeave={() => setShow(false)}
        >
            {children}
            {show && (
                <div
                    className={`absolute left-1/2 -translate-x-1/2 pointer-events-none z-[100] whitespace-nowrap ${isTop ? "bottom-full mb-2" : "top-full mt-2"
                        }`}
                >
                    <div className="relative bg-white rounded-lg px-3 py-2 shadow-lg">
                        {/* Arrow */}
                        <div
                            className={`absolute left-1/2 -translate-x-1/2 ${isTop
                                ? "top-full -mt-px"
                                : "bottom-full -mb-px"
                                }`}
                        >
                            <div
                                className={`border-[6px] border-transparent ${isTop ? "border-t-white" : "border-b-white"
                                    }`}
                            />
                        </div>
                        {/* Text */}
                        <p className="font-['Roboto',_sans-serif] text-black text-[14px] font-normal whitespace-nowrap">
                            {text}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}