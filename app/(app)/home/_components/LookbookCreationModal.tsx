"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { X, Check, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils/tw-merge";
import { useModal } from "@/hooks";
import type { LookbookPreset, StyleTemplate } from "@/types";

interface LookbookCreationModalProps {
    preset: LookbookPreset | null;
    isOpen: boolean;
    onClose: () => void;
    styleTemplates: StyleTemplate[];
    onCreateLookbook: (name: string, selectedStyles: StyleTemplate[]) => void;
}

type Step = 1 | 2;

export function LookbookCreationModal({
    preset,
    isOpen,
    onClose,
    styleTemplates,
    onCreateLookbook,
}: LookbookCreationModalProps) {
    const [step, setStep] = useState<Step>(1);
    const [lookbookName, setLookbookName] = useState("");
    const [selectedStyleIds, setSelectedStyleIds] = useState<Set<string>>(
        new Set()
    );
    const [nameError, setNameError] = useState<string | null>(null);

    const { handleBackdropClick } = useModal({ isOpen, onClose });

    // Reset state when modal opens with new preset
    useEffect(() => {
        if (isOpen && preset) {
            setStep(1);
            setLookbookName(preset.name);
            setSelectedStyleIds(new Set());
            setNameError(null);
        }
    }, [isOpen, preset?.id]);

    const handleContinue = () => {
        if (step === 1) {
            if (!lookbookName.trim()) {
                setNameError("Lookbook name is required");
                return;
            }
            setNameError(null);
            setStep(2);
        } else {
            // Step 2 - Create lookbook
            const selectedStyles = styleTemplates.filter((t) =>
                selectedStyleIds.has(t.id)
            );
            // TODO: Complete the journey - create lookbook and navigate
            onCreateLookbook(lookbookName.trim(), selectedStyles);
            onClose();
        }
    };

    const handleBack = () => {
        if (step === 2) {
            setStep(1);
        }
    };

    const toggleStyleSelection = (styleId: string) => {
        setSelectedStyleIds((prev) => {
            const next = new Set(prev);
            if (next.has(styleId)) {
                next.delete(styleId);
            } else {
                next.add(styleId);
            }
            return next;
        });
    };

    const getButtonText = () => {
        if (step === 1) return "Continue";
        if (selectedStyleIds.size === 0) return "Create Lookbook";
        return `Create Lookbook (${selectedStyleIds.size} style${selectedStyleIds.size > 1 ? "s" : ""})`;
    };

    if (!isOpen || !preset) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
            onClick={handleBackdropClick}
            role="dialog"
            aria-modal="true"
            aria-labelledby="lookbook-modal-title"
        >
            <div className="relative w-full max-w-2xl mx-4 bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors focus:outline-none focus:ring-2 focus:ring-white/20"
                    aria-label="Close modal"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Header */}
                <div className="px-6 pt-6 pb-4 border-b border-neutral-800">
                    <div className="flex items-center gap-3">
                        {step === 2 && (
                            <button
                                onClick={handleBack}
                                className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors focus:outline-none focus:ring-2 focus:ring-white/20"
                                aria-label="Go back"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                        )}
                        <div>
                            <h2
                                id="lookbook-modal-title"
                                className="text-xl font-semibold text-white"
                            >
                                {step === 1 ? "Create Lookbook" : "Select Styles"}
                            </h2>
                            <p className="text-sm text-neutral-400 mt-0.5">
                                Step {step} of 2
                            </p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    {step === 1 ? (
                        /* Step 1: Name Input */
                        <div>
                            <label
                                htmlFor="lookbook-name"
                                className="block text-sm font-medium text-neutral-300 mb-2"
                            >
                                Lookbook Name
                            </label>
                            <input
                                id="lookbook-name"
                                type="text"
                                value={lookbookName}
                                onChange={(e) => {
                                    setLookbookName(e.target.value);
                                    if (nameError) setNameError(null);
                                }}
                                placeholder="Enter lookbook name"
                                className={cn(
                                    "w-full px-4 py-3 rounded-lg bg-neutral-800 border text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-white/20 transition-colors",
                                    nameError ? "border-red-500" : "border-neutral-700"
                                )}
                                autoFocus
                            />
                            {nameError && (
                                <p className="mt-2 text-sm text-red-400">{nameError}</p>
                            )}
                            <p className="mt-3 text-sm text-neutral-500">
                                Based on: {preset.name} ({preset.pageCount} pages)
                            </p>
                        </div>
                    ) : (
                        /* Step 2: Style Selection Grid */
                        <div>
                            <p className="text-sm text-neutral-400 mb-4">
                                Select styles to apply across your lookbook pages
                            </p>
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-[400px] overflow-y-auto pr-1 scrollbar-minimal">
                                {styleTemplates.map((style) => {
                                    const isSelected = selectedStyleIds.has(style.id);
                                    return (
                                        <button
                                            key={style.id}
                                            onClick={() => toggleStyleSelection(style.id)}
                                            className={cn(
                                                "group relative aspect-[3/4] rounded-lg overflow-hidden cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/20 transition-all",
                                                isSelected && "ring-2 ring-white"
                                            )}
                                            aria-pressed={isSelected}
                                            aria-label={`${isSelected ? "Deselect" : "Select"} ${style.name}`}
                                        >
                                            <Image
                                                src={style.previewImage}
                                                alt={style.name}
                                                fill
                                                className="object-cover"
                                                sizes="120px"
                                                quality={75}
                                            />
                                            {/* Overlay */}
                                            <div
                                                className={cn(
                                                    "absolute inset-0 transition-colors",
                                                    isSelected ? "bg-black/40" : "bg-black/20 group-hover:bg-black/40"
                                                )}
                                            />
                                            {/* Checkmark */}
                                            {isSelected && (
                                                <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white flex items-center justify-center">
                                                    <Check className="w-4 h-4 text-black" />
                                                </div>
                                            )}
                                            {/* Name */}
                                            <div className="absolute bottom-0 left-0 right-0 p-2">
                                                <p className="text-xs font-medium text-white truncate">
                                                    {style.name}
                                                </p>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 pb-6 pt-2">
                    <button
                        onClick={handleContinue}
                        className="w-full py-3 px-4 rounded-lg bg-white text-black text-sm font-medium hover:bg-neutral-200 transition-colors focus:outline-none focus:ring-2 focus:ring-white/20"
                    >
                        {getButtonText()}
                    </button>
                </div>
            </div>
        </div>
    );
}
