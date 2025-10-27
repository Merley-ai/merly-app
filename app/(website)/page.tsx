import { Navigation } from "./_components/Navigation";
import { Hero } from "./_components/Hero";
import { EditorialShowcase } from "./_components/EditorialShowcase";
import { SectionHeading } from "./_components/SectionHeading";
import { ModelGrid } from "./_components/ModelGrid";
import { ProductGrid } from "./_components/ProductGrid";
import { CreativeShowcase } from "./_components/CreativeShowcase";
import { Footer } from "./_components/Footer";

export default function Home() {
    return (
        <div className="bg-black min-h-screen w-full">
            <Navigation />
            <Hero />
            <EditorialShowcase />

            <SectionHeading
                segments={[
                    { text: " ", isItalic: false },
                    { text: "Taste", isItalic: true },
                    { text: " matters. ", isItalic: false },
                    { text: "Quality", isItalic: true },
                    { text: " counts.", isItalic: false },
                ]}
            />

            <ModelGrid />

            <SectionHeading
                segments={[
                    { text: " ", isItalic: false },
                    { text: "FIRE", isItalic: true },
                    { text: " your photographer. Create ", isItalic: false },
                    { text: "AI Models", isItalic: true },
                    { text: " for your brand.", isItalic: false },
                ]}
            />

            <ProductGrid />

            <SectionHeading
                segments={[
                    { text: "What can be ", isItalic: false },
                    { text: "Imagined, ", isItalic: true },
                    { text: " can be ", isItalic: false },
                    { text: "Created", isItalic: true },
                    { text: ".", isItalic: false },
                ]}
            />

            <CreativeShowcase />
            <Footer />
        </div>
    );
}

