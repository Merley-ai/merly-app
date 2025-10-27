import { AnimatedImage } from "@/components/ui/AnimatedImage";

export function EditorialShowcase() {
    return (
        <section className="px-4 md:px-8 lg:px-[141px] py-8 md:py-16">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-[1638px] mx-auto">
                <div className="w-full aspect-[811.268/1076.77]">
                    <AnimatedImage alt="Fashion editorial 1" className="w-full h-full object-cover" src="/images/editorial-1.png" delay={0} />
                </div>
                <div className="w-full aspect-[811.268/1076.77]">
                    <AnimatedImage alt="Fashion editorial 2" className="w-full h-full object-contain" src="/images/editorial-2.png" delay={0.15} />
                </div>
            </div>
        </section>
    );
}

