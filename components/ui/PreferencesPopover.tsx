"use client";
import {
    aspectRatio,
    imageCount,
    models,
    ASPECT_RATIO_LABELS,
    IMAGE_COUNT_LABELS,
    MODEL_OPTIONS_LABELS,
} from "@/types/image-generation";

import * as React from "react";
import {
    MoreHorizontal,
    ChevronRight,
    RotateCcw,
    Check,
} from "lucide-react";

import { Button } from "@/components/ui/Button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/Popover";
import { Separator } from "@/components/ui/Separator";
import { cn } from "@/lib/utils/tw-merge";


export interface PreferencesState {
    count: imageCount;
    aspectRatio: aspectRatio;
    model: models;
}

interface OptionItem<T> {
    value: T;
    label: string;
}

// Option configurations
const countOptions: OptionItem<imageCount>[] = [
    { value: "Default", label: "Default" },
    ...IMAGE_COUNT_LABELS.map((count) => ({
        value: String(count.value) as imageCount,
        label: count.label,
    })),
];

const aspectRatioOptions: OptionItem<aspectRatio>[] = [
    { value: "Default", label: "Default" },
    ...ASPECT_RATIO_LABELS.map((ratio) => ({
        value: ratio.value as aspectRatio,
        label: ratio.label,
    })),
];

const modelOptions: OptionItem<models>[] = [
    ...MODEL_OPTIONS_LABELS.map((model) => ({
        value: model.value as models,
        label: model.label,
    })),
];

export const DEFAULT_PREFERENCES: PreferencesState = {
    count: "Default",
    aspectRatio: "Default",
    model: "Default",
};

// Default values when "Default" is selected
export const DEFAULT_COUNT = 2;
export const DEFAULT_ASPECT_RATIO = "3:4";
export const DEFAULT_MODEL = "fal-ai/reve";

/**
 * Resolves preferences to actual API values
 * Converts "Default" selections to their actual default values
 */
export function resolvePreferences(preferences: PreferencesState): {
    count: number;
    aspectRatio: string;
    model: string;
} {
    return {
        count: preferences.count === "Default"
            ? DEFAULT_COUNT
            : parseInt(preferences.count, 10),
        aspectRatio: preferences.aspectRatio === "Default"
            ? DEFAULT_ASPECT_RATIO
            : preferences.aspectRatio,
        model: preferences.model === "Default"
            ? DEFAULT_MODEL
            : preferences.model.toLowerCase(),
    };
}

// Helper to format display value
function formatCountDisplay(value: imageCount): string {
    if (value === "Default") return "Default";
    return value === "2" ? "2 images" : `${value} images`;
}

// Row component for preference items
interface PreferenceRowProps {
    label: string;
    value?: string;
    disabled?: boolean;
    disabledText?: string;
    onClick?: () => void;
    children?: React.ReactNode;
}

function PreferenceRow({
    label,
    value,
    disabled = false,
    disabledText,
    onClick,
    children,
}: PreferenceRowProps) {
    const content = (
        <button
            type="button"
            onClick={disabled ? undefined : onClick}
            disabled={disabled}
            className={cn(
                "flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-sm",
                disabled
                    ? "cursor-not-allowed opacity-50"
                    : "hover:bg-muted/70 cursor-pointer"
            )}
        >
            <span>{label}</span>
            <span className="flex items-center gap-1 text-muted-foreground">
                {disabledText && disabled ? (
                    <span className="text-xs">{disabledText}</span>
                ) : (
                    <>
                        <span>{value}</span>
                        <ChevronRight className="h-4 w-4" />
                    </>
                )}
            </span>
        </button>
    );

    if (children && !disabled) {
        return children;
    }

    return content;
}

// Nested option popover component
interface NestedOptionPopoverProps<T extends string> {
    label: string;
    value: T;
    options: OptionItem<T>[];
    onSelect: (value: T) => void;
    formatDisplay?: (value: T) => string;
}

function NestedOptionPopover<T extends string>({
    label,
    value,
    options,
    onSelect,
    formatDisplay,
}: NestedOptionPopoverProps<T>) {
    const [open, setOpen] = React.useState(false);
    const displayValue = formatDisplay ? formatDisplay(value) : value;

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    className="-mx-2 flex w-[calc(100%+1rem)] items-center justify-between rounded-lg px-2 py-2 text-left text-sm hover:bg-white/10 cursor-pointer"
                >
                    <span>{label}</span>
                    <span className="flex items-center gap-1 text-white/60">
                        <span>{displayValue}</span>
                        <ChevronRight className="h-4 w-4" />
                    </span>
                </button>
            </PopoverTrigger>
            <PopoverContent
                side="right"
                align="center"
                className="w-44 p-2 rounded-2xl"
            >
                <div className="flex flex-col gap-1">
                    {options.map((option) => (
                        <button
                            key={option.value}
                            type="button"
                            onClick={() => {
                                onSelect(option.value);
                                setOpen(false);
                            }}
                            className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm hover:bg-white/10 cursor-pointer"
                        >
                            <span>{option.label}</span>
                            {value === option.value && (
                                <Check className="h-4 w-4 text-white" />
                            )}
                        </button>
                    ))}
                </div>
            </PopoverContent>
        </Popover>
    );
}

// Main PreferencesPopover component
export interface PreferencesPopoverProps {
    className?: string;
    onPreferencesChange?: (preferences: PreferencesState) => void;
}

export function PreferencesPopover({
    className,
    onPreferencesChange,
}: PreferencesPopoverProps) {
    const [open, setOpen] = React.useState(false);
    const [preferences, setPreferences] =
        React.useState<PreferencesState>(DEFAULT_PREFERENCES);

    const updatePreference = <K extends keyof PreferencesState>(
        key: K,
        value: PreferencesState[K]
    ) => {
        const newPreferences = { ...preferences, [key]: value };
        setPreferences(newPreferences);
        onPreferencesChange?.(newPreferences);
    };

    const handleReset = () => {
        setPreferences(DEFAULT_PREFERENCES);
        onPreferencesChange?.(DEFAULT_PREFERENCES);
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    className={cn(
                        "flex-none transition-all duration-200 hover:scale-110 cursor-pointer",
                        className
                    )}
                    aria-label="Preferences"
                >
                    <MoreHorizontal className="size-[18px] text-[#dddddd]" />
                </button>
            </PopoverTrigger>
            <PopoverContent
                side="top"
                align="end"
                className="w-80 px-4 py-5 rounded-2xl"
            >
                {/* Header */}
                <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Preferences</span>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={handleReset}
                        aria-label="Reset preferences"
                    >
                        <RotateCcw className="h-4 w-4" />
                    </Button>
                </div>

                <Separator className="mt-2 mb-3 bg-white/20" />

                {/* Preference options */}
                <div className="flex flex-col gap-1">
                    {/* Count */}
                    <NestedOptionPopover
                        label="Count"
                        value={preferences.count}
                        options={countOptions}
                        onSelect={(value) => updatePreference("count", value)}
                        formatDisplay={formatCountDisplay}
                    />

                    {/* Aspect Ratio */}
                    <NestedOptionPopover
                        label="Aspect ratio"
                        value={preferences.aspectRatio}
                        options={aspectRatioOptions}
                        onSelect={(value) => updatePreference("aspectRatio", value)}
                    />

                    {/* Apply Style - Disabled */}
                    {/* <PreferenceRow
                        label="Apply style"
                        disabled
                        disabledText="Coming soon"
                    /> */}

                    {/* Model */}
                    <NestedOptionPopover
                        label="Model"
                        value={preferences.model}
                        options={modelOptions}
                        onSelect={(value) => updatePreference("model", value)}
                    />
                </div>
            </PopoverContent>
        </Popover>
    );
}
