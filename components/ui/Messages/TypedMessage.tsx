"use client";

import { useState, useEffect } from "react";

interface TypedMessageProps {
    message: string;
    typingSpeed?: number;
    startDelay?: number;
    className?: string;
    showCursor?: boolean;
}

/**
 * Typed Message Component
 * 
 * Displays a message with a typewriter animation effect.
 * Used for welcome messages in empty timeline states.
 */
export function TypedMessage({
    message,
    typingSpeed = 7,
    startDelay = 100,
    className = "",
    showCursor = false
}: TypedMessageProps) {
    const [displayedText, setDisplayedText] = useState("");
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isTyping, setIsTyping] = useState(false);

    useEffect(() => {
        // Start typing after initial delay
        const startTimeout = setTimeout(() => {
            setIsTyping(true);
        }, startDelay);

        return () => clearTimeout(startTimeout);
    }, [startDelay]);

    useEffect(() => {
        if (!isTyping || currentIndex >= message.length) {
            return;
        }

        const timeout = setTimeout(() => {
            setDisplayedText(message.slice(0, currentIndex + 1));
            setCurrentIndex(currentIndex + 1);
        }, typingSpeed);

        return () => clearTimeout(timeout);
    }, [currentIndex, isTyping, message, typingSpeed]);

    return (
        <span className={className}>
            {displayedText}
            {showCursor && isTyping && currentIndex < message.length && (
                <span className="inline-block w-[2px] h-[20px] bg-white/80 ml-[2px] animate-pulse" />
            )}
        </span>
    );
}
