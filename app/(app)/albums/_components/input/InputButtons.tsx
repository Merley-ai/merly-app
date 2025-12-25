"use client";

import { useRef, useState } from "react";
import dashboardSvgPaths from "@/lib/constants/dashboard-svg-paths";
import { Tooltip } from "@/components/ui/ToolTip/Tooltip";
import {
    PreferencesPopover,
    type PreferencesState
} from "@/components/ui/Menus/PreferencesPopover";
import { StyleSelectModal } from "@/components/ui/Modals/StyleSelectModal";
import { Settings2 } from "lucide-react";
import type { StyleTemplate } from "@/types";

interface InputButtonsProps {
    onAttachClick: () => void;
    onSendClick: () => void;
    isSendDisabled: boolean;
    onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onPreferencesChange?: (preferences: PreferencesState) => void;
    availableStyles?: StyleTemplate[];
    selectedStyle?: StyleTemplate | null;
    onStyleSelect?: (style: StyleTemplate | null) => void;
}

/**
 * Chat CTA Component
 * 
 * Sticky button bar at the bottom of the chat input area.
 * Contains Upload and Send buttons, easily extensible for more actions.
 */
export function InputButtons({
    onAttachClick,
    onSendClick,
    isSendDisabled,
    onFileChange,
    onPreferencesChange,
    availableStyles,
    selectedStyle,
    onStyleSelect,
}: InputButtonsProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isStyleModalOpen, setIsStyleModalOpen] = useState(false);

    const handleAttachClick = () => {
        // Reset the input value to allow selecting the same file again
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        fileInputRef.current?.click();
        onAttachClick();
    };

    return (
        <div className="flex items-center justify-end gap-3 pt-3">
            {/* Style Template Modal Trigger */}
            <Tooltip text="Select Style Template" position="top">
                <button
                    type="button"
                    onClick={() => setIsStyleModalOpen(true)}
                    className="flex-none transition-all duration-200 hover:scale-110 cursor-pointer relative"
                    aria-label="Select style"
                >
                    <Settings2 className="size-[20px] text-[#dddddd]" />
                    {selectedStyle && (
                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-teal-200 rounded-full" />
                    )}
                </button>
            </Tooltip>

            {/* Style Select Modal */}
            <StyleSelectModal
                isOpen={isStyleModalOpen}
                onClose={() => setIsStyleModalOpen(false)}
                styles={availableStyles || []}
                selectedStyle={selectedStyle}
                onStyleSelect={onStyleSelect || (() => { })}
            />

            {/* Preferences Popover */}
            <PreferencesPopover onPreferencesChange={onPreferencesChange} />


            {/* Upload Button with Tooltip */}
            <Tooltip text="Upload image" position="top">
                <button
                    onClick={handleAttachClick}
                    type="button"
                    className="flex-none transition-all duration-200 hover:scale-110 cursor-pointer"
                    aria-label="Upload image"
                >
                    <svg className="size-[18px]" fill="none" viewBox="0 0 18 18">
                        <path d={dashboardSvgPaths.p110a4400} fill="#ddddddff" />
                    </svg>
                </button>
            </Tooltip>

            <input
                ref={fileInputRef}
                type="file"
                onChange={onFileChange}
                className="hidden"
                accept="image/*"
                multiple
            />

            {/* Send Button with Tooltip */}
            <Tooltip text="Send" position="top" disabled={isSendDisabled}>
                <button
                    onClick={onSendClick}
                    type="button"
                    disabled={isSendDisabled}
                    className={`flex-none transition-all duration-200 ${isSendDisabled
                        ? 'opacity-30 cursor-not-allowed'
                        : 'hover:scale-110 cursor-pointer'
                        }`}
                    aria-label="Send"
                >
                    <svg className="size-[28px]" fill="none" viewBox="0 0 28 28">
                        <path d={dashboardSvgPaths.p3865f100} fill="#ddddddff" />
                    </svg>
                </button>
            </Tooltip>
        </div>
    );
}
