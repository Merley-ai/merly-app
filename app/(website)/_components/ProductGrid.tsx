import { AnimatedImage } from "@/components/ui/Animated Images/AnimatedImage";

export function ProductGrid() {
    return (
        <section className="px-4 md:px-8 lg:px-[141px] pb-16">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 max-w-[1638px] mx-auto">
                <div className="w-full aspect-[400/398]">
                    <AnimatedImage alt="Product shot 1" className="w-full h-full object-cover" src="https://qylfthczyqbnkxjvnzli.supabase.co/storage/v1/object/public/MerleyStorageBucket/PublicAssets/product-1.png" delay={0} />
                </div>
                <div className="w-full aspect-[400/398]">
                    <AnimatedImage alt="Product shot 2" className="w-full h-full object-cover" src="https://qylfthczyqbnkxjvnzli.supabase.co/storage/v1/object/public/MerleyStorageBucket/PublicAssets/product-2.png" delay={0.1} />
                </div>
                <div className="w-full aspect-[400/398]">
                    <AnimatedImage alt="Product shot 3" className="w-full h-full object-contain" src="https://qylfthczyqbnkxjvnzli.supabase.co/storage/v1/object/public/MerleyStorageBucket/PublicAssets/product-3.png" delay={0.2} />
                </div>
                <div className="w-full aspect-[400/398]">
                    <AnimatedImage alt="Product shot 4" className="w-full h-full object-contain" src="https://qylfthczyqbnkxjvnzli.supabase.co/storage/v1/object/public/MerleyStorageBucket/PublicAssets/product-4.png" delay={0.3} />
                </div>
            </div>
        </section>
    );
}

