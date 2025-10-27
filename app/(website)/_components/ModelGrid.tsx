import { AnimatedImage } from "@/components/ui/AnimatedImage";

export function ModelGrid() {
  return (
    <section className="px-4 md:px-8 lg:px-[142px] pb-16">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 max-w-[1636px] mx-auto">
        <div className="w-full aspect-[399/530]">
          <AnimatedImage alt="Model shot 1" className="w-full h-full object-cover" src="/images/model-1.png" delay={0} />
        </div>
        <div className="w-full aspect-[399/530]">
          <AnimatedImage alt="Model shot 2" className="w-full h-full object-contain" src="/images/model-2.png" delay={0.1} />
        </div>
        <div className="w-full aspect-[399/530]">
          <AnimatedImage alt="Model shot 3" className="w-full h-full object-cover" src="/images/model-3.png" delay={0.2} />
        </div>
        <div className="w-full aspect-[399/530]">
          <AnimatedImage alt="Model shot 4" className="w-full h-full object-contain" src="/images/model-4.png" delay={0.3} />
        </div>
      </div>
    </section>
  );
}

