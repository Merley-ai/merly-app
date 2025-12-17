import { useEffect, useCallback } from "react";

interface UseModalOptions {
    isOpen: boolean;
    onClose: () => void;
}

interface UseModalReturn {
    handleBackdropClick: (e: React.MouseEvent) => void;
}

/**
 * Custom hook for modal behavior
 * 
 * Handles:
 * - Escape key to close modal
 * - Body scroll lock when modal is open
 * - Backdrop click to close modal
 */
export function useModal({ isOpen, onClose }: UseModalOptions): UseModalReturn {
    // Handle escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape" && isOpen) {
                onClose();
            }
        };

        document.addEventListener("keydown", handleEscape);
        return () => document.removeEventListener("keydown", handleEscape);
    }, [isOpen, onClose]);

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [isOpen]);

    // Handle backdrop click
    const handleBackdropClick = useCallback(
        (e: React.MouseEvent) => {
            if (e.target === e.currentTarget) {
                onClose();
            }
        },
        [onClose]
    );

    return { handleBackdropClick };
}
