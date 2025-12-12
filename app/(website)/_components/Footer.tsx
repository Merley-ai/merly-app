import { Facebook, Instagram, Twitter } from "lucide-react";

export function Footer() {
    return (
        <footer className="border-t border-white/10 px-4 md:px-8 lg:px-[141px] py-12 md:py-16">
            <div className="max-w-[1638px] mx-auto">
                {/* Main Footer Content */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 pb-8 md:pb-12">
                    {/* Left Side - Brand and Social */}
                    <div className="flex flex-col gap-6">
                        <p className="font-['Roboto_Serif:Medium',_sans-serif] text-white text-[20px]" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100" }}>
                            Merley
                        </p>
                        <p className="font-['Roboto:Regular',_sans-serif] text-white/60 text-[14px] max-w-[400px]" style={{ fontVariationSettings: "'wdth' 100" }}>
                            Create stunning fashion editorials with AI-powered technology. Bring your creative vision to life.
                        </p>
                        <div className="flex items-center gap-4">
                            <a href="https://facebook.com" aria-label="Facebook" className="text-white/60 hover:text-white transition-colors">
                                <Facebook className="size-5" />
                            </a>
                            <a href="https://instagram.com" aria-label="Instagram" className="text-white/60 hover:text-white transition-colors">
                                <Instagram className="size-5" />
                            </a>
                            <a href="https://twitter.com" aria-label="Twitter" className="text-white/60 hover:text-white transition-colors">
                                <Twitter className="size-5" />
                            </a>
                        </div>
                    </div>

                    {/* Right Side - Links */}
                    <div className="grid grid-cols-2 gap-8">
                        <div className="flex flex-col gap-4">
                            <p className="font-['Roboto:Medium',_sans-serif] text-white text-[14px]" style={{ fontVariationSettings: "'wdth' 100" }}>
                                Product
                            </p>
                            <a href="/pricing" className="font-['Roboto:Regular',_sans-serif] text-white/60 hover:text-white text-[14px] transition-colors" style={{ fontVariationSettings: "'wdth' 100" }}>
                                Pricing
                            </a>
                            <a href="/blog" className="font-['Roboto:Regular',_sans-serif] text-white/60 hover:text-white text-[14px] transition-colors" style={{ fontVariationSettings: "'wdth' 100" }}>
                                Blog
                            </a>
                        </div>
                        <div className="flex flex-col gap-4">
                            <p className="font-['Roboto:Medium',_sans-serif] text-white text-[14px]" style={{ fontVariationSettings: "'wdth' 100" }}>
                                Legal
                            </p>
                            <a href="/terms" className="font-['Roboto:Regular',_sans-serif] text-white/60 hover:text-white text-[14px] transition-colors" style={{ fontVariationSettings: "'wdth' 100" }}>
                                Terms & Conditions
                            </a>
                            <a href="/privacy" className="font-['Roboto:Regular',_sans-serif] text-white/60 hover:text-white text-[14px] transition-colors" style={{ fontVariationSettings: "'wdth' 100" }}>
                                Privacy Policy
                            </a>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="font-['Roboto:Regular',_sans-serif] text-white/40 text-[14px]" style={{ fontVariationSettings: "'wdth' 100" }}>
                        © 2025 Merley. All rights reserved.
                    </p>
                    <a href="mailto:support@merley.co" className="font-['Roboto:Regular',_sans-serif] text-white/60 hover:text-white text-[14px] transition-colors" style={{ fontVariationSettings: "'wdth' 100" }}>
                        support@merley.co
                    </a>
                </div>
            </div>
        </footer>
    );
}

