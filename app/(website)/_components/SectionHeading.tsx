interface SectionHeadingProps {
    segments: Array<{
        text: string;
        isItalic?: boolean;
    }>;
    className?: string;
}

export function SectionHeading({ segments, className = "" }: SectionHeadingProps) {
    return (
        <section className="px-4 py-16 md:py-24">
            <h2 className={`max-w-[775px] mx-auto text-center text-white leading-[40px] md:leading-[60px] ${className}`}>
                {segments.map((segment, index) => (
                    segment.isItalic ? (
                        <span
                            key={index}
                            className="font-['Roboto_Serif'] italic text-[32px] md:text-[48px]"
                            style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100" }}
                        >
                            {segment.text}
                        </span>
                    ) : (
                        <span
                            key={index}
                            className="font-['Circular_Std:Medium',_sans-serif] text-[32px] md:text-[48px]"
                        >
                            {segment.text}
                        </span>
                    )
                ))}
            </h2>
        </section>
    );
}

