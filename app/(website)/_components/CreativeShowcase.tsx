import { AnimatedImage } from "@/components/ui/AnimatedImage";

export function CreativeShowcase() {
  return (
    <section className="px-4 md:px-8 lg:px-[142px] pb-16 md:pb-24">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-[1636px] mx-auto">
        <div className="w-full aspect-[806/1069] overflow-hidden relative">
          <AnimatedImage
            alt="Creative shot 1"
            className="absolute max-w-none pointer-events-none"
            style={{
              width: '123.66%',
              height: '123.66%',
              left: '-11.53%',
              top: '-15.17%'
            }}
            src="https://qylfthczyqbnkxjvnzli.supabase.co/storage/v1/object/public/MerleyStorageBucket/PublicAssets/creative-1.png"
            delay={0}
          />
        </div>
        <div className="w-full aspect-[804/1067] overflow-hidden relative">
          <AnimatedImage
            alt="Creative shot 2"
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
            src="https://qylfthczyqbnkxjvnzli.supabase.co/storage/v1/object/public/MerleyStorageBucket/PublicAssets/creative-2.png"
            delay={0.15}
          />
        </div>
      </div>
    </section>
  );
}

