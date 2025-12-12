export function Hero() {
    return (
        <section className="px-4 pt-16 md:pt-24 pb-8">
            <h1 className="max-w-[775px] mx-auto text-center text-white leading-[45px]">
                <span className="font-['Circular_Std:Medium',_sans-serif] text-[32px] md:text-[48px]">Create </span>
                <span className="font-['Roboto_Serif'] italic text-[32px] md:text-[48px]" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100" }}>
                    Editorials
                </span>
                <span className="font-['Circular_Std:Medium',_sans-serif] text-[32px] md:text-[48px]"> for your fashion brand with AI</span>
            </h1>

            <h3 className="max-w-[775px] mx-auto mt-12 text-center text-white/65 leading-[45px]">
                <span className="font-['Circular_Std:Medium',_sans-serif'] italic text-[16px] md:text-[24px]" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100" }}>
                    Produce stunning fashion editorials, campaign shots and model imagery.
                </span>
            </h3>

            {/* Search Bar - Design Element Only */}
            {/* <div className="max-w-[556px] mx-auto mt-12 relative pointer-events-none">
                <div className="bg-[#474747] opacity-75 rounded-[50px] px-6 py-3 border border-black flex items-center justify-between gap-3">
                    <div className="font-['Roboto:Regular',_sans-serif] text-white/50 text-[16px] md:text-[18px] leading-[40px] flex-1">
                        Wide angle full body lookbook shot
                    </div>
                    <div className="flex-none">
                        <Paperclip className="size-5 text-[#858585]" />
                    </div>
                    <div className="flex-none rotate-90">
                        <svg className="size-[27px]" fill="none" viewBox="0 0 27 27">
                            <path d={svgPaths.p81bc480} fill="#858585" />
                        </svg>
                    </div>
                </div>
            </div> */}
        </section>
    );
}

