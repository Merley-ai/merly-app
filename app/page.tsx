"use client";

import { useState, useRef } from "react";
import { Paperclip, Facebook, Instagram, Twitter } from "lucide-react";
import { AnimatedImage } from "@/components/AnimatedImage";
import svgPaths from "@/lib/svg-paths";

export default function Home() {
  const [inputValue, setInputValue] = useState("Wide angle full body lookbook shot with monogram tshirt");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
    }
  };

  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="bg-black min-h-screen w-full">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-4 md:px-8 lg:px-[141px] py-6">
        <div className="flex items-center gap-8 md:gap-16">
          <p className="font-['Roboto_Serif'] text-white text-[20px]" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100" }}>
            Merley
          </p>
        </div>
        <div className="flex items-center gap-4 md:gap-6">
          <p className="font-['Roboto:Medium',_sans-serif] text-white text-[14px] hidden sm:block" style={{ fontVariationSettings: "'wdth' 100" }}>
            Pricing
          </p>
          <p className="font-['Roboto:Medium',_sans-serif] text-white text-[14px] hidden sm:block" style={{ fontVariationSettings: "'wdth' 100" }}>
            Sign In
          </p>
          <button className="bg-white rounded-[25px] px-6 py-2 font-['Roboto:Medium',_sans-serif] text-black text-[14px]" style={{ fontVariationSettings: "'wdth' 100" }}>
            Start Creating
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="px-4 pt-16 md:pt-24 pb-8">
        <h1 className="max-w-[775px] mx-auto text-center text-white leading-[45px]">
          <span className="font-['Circular_Std:Medium',_sans-serif] text-[32px] md:text-[48px]">Create </span>
          <span className="font-['Roboto_Serif'] italic text-[32px] md:text-[48px]" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100" }}>
            Editorials
          </span>
          <span className="font-['Circular_Std:Medium',_sans-serif] text-[32px] md:text-[48px]"> for your fashion brand with AI</span>
        </h1>

        {/* Search Bar */}
        <div className="max-w-[556px] mx-auto mt-12 relative">
          <div className="bg-[#474747] opacity-75 rounded-[50px] px-6 py-3 border border-black flex items-center justify-between gap-3">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Wide angle full body lookbook shot with monogram tshirt"
              className="font-['Roboto:Regular',_sans-serif] text-white/50 text-[16px] md:text-[18px] leading-[40px] flex-1 bg-transparent border-none outline-none placeholder:text-white/40"
              style={{ fontVariationSettings: "'wdth' 100" }}
            />
            {uploadedFile && (
              <span className="font-['Roboto:Regular',_sans-serif] text-white/80 text-[14px] hidden sm:block">
                {uploadedFile.name}
              </span>
            )}
            <button
              onClick={handleAttachClick}
              type="button"
              className="flex-none hover:opacity-80 transition-opacity"
              aria-label="Attach file"
            >
              <Paperclip className="size-5 text-[#858585]" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
              className="hidden"
              accept="image/*"
            />
            <button type="submit" className="flex-none rotate-90">
              <svg className="size-[27px]" fill="none" viewBox="0 0 27 27">
                <path d={svgPaths.p81bc480} fill="#858585" />
              </svg>
            </button>
          </div>
        </div>
      </section>

      {/* Main Editorial Images */}
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

      {/* Taste & Quality Section */}
      <section className="px-4 py-16 md:py-24">
        <h2 className="max-w-[775px] mx-auto text-center text-white leading-[40px] md:leading-[60px]">
          <span className="font-['Circular_Std:Medium',_sans-serif] text-[32px] md:text-[48px]"> </span>
          <span className="font-['Roboto_Serif'] italic text-[32px] md:text-[48px]" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100" }}>
            Taste
          </span>
          <span className="font-['Circular_Std:Medium',_sans-serif] text-[32px] md:text-[48px]"> matters. </span>
          <span className="font-['Roboto_Serif'] italic text-[32px] md:text-[48px]" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100" }}>
            Quality
          </span>
          <span className="font-['Circular_Std:Medium',_sans-serif] text-[32px] md:text-[48px]"> counts.</span>
        </h2>
      </section>

      {/* Model Shots Grid */}
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

      {/* Fire Your Photographer Section */}
      <section className="px-4 py-16 md:py-24">
        <h2 className="max-w-[825px] mx-auto text-center text-white leading-[45px]">
          <span className="font-['Circular_Std:Medium',_sans-serif] text-[32px] md:text-[48px]"> </span>
          <span className="font-['Roboto_Serif'] italic text-[32px] md:text-[48px]" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100" }}>
            FIRE
          </span>
          <span className="font-['Circular_Std:Medium',_sans-serif] text-[32px] md:text-[48px]"> your photographer. Create </span>
          <span className="font-['Roboto_Serif'] italic text-[32px] md:text-[48px]" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100" }}>
            AI Models
          </span>
          <span className="font-['Circular_Std:Medium',_sans-serif] text-[32px] md:text-[48px]"> for your brand.</span>
        </h2>
      </section>

      {/* Product Grid */}
      <section className="px-4 md:px-8 lg:px-[141px] pb-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 max-w-[1638px] mx-auto">
          <div className="w-full aspect-[400/398]">
            <AnimatedImage alt="Product shot 1" className="w-full h-full object-cover" src="/images/product-1.png" delay={0} />
          </div>
          <div className="w-full aspect-[400/398]">
            <AnimatedImage alt="Product shot 2" className="w-full h-full object-cover" src="/images/product-2.png" delay={0.1} />
          </div>
          <div className="w-full aspect-[400/398]">
            <AnimatedImage alt="Product shot 3" className="w-full h-full object-contain" src="/images/product-3.png" delay={0.2} />
          </div>
          <div className="w-full aspect-[400/398]">
            <AnimatedImage alt="Product shot 4" className="w-full h-full object-contain" src="/images/product-4.png" delay={0.3} />
          </div>
        </div>
      </section>

      {/* Imagined Can Be Created Section */}
      <section className="px-4 py-16 md:py-24">
        <h2 className="max-w-[594px] mx-auto text-center text-white leading-[45px]">
          <span className="font-['Circular_Std:Medium',_sans-serif] text-[32px] md:text-[48px]">What can be </span>
          <span className="font-['Roboto_Serif'] italic text-[32px] md:text-[48px]" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100" }}>Imagined, </span>
          <span className="font-['Circular_Std:Medium',_sans-serif] text-[32px] md:text-[48px]"> can be </span>
          <span className="font-['Roboto_Serif'] italic text-[32px] md:text-[48px]" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100" }}>
            Created
          </span>
          <span className="font-['Circular_Std:Medium',_sans-serif] text-[32px] md:text-[48px]">.</span>
        </h2>
      </section>

      {/* Final Large Images */}
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
              src="/images/creative-1.png"
              delay={0}
            />
          </div>
          <div className="w-full aspect-[804/1067] overflow-hidden relative">
            <AnimatedImage 
              alt="Creative shot 2" 
              className="absolute inset-0 w-full h-full object-cover pointer-events-none"
              src="/images/creative-2.png"
              delay={0.15}
            />
          </div>
        </div>
      </section>

      {/* Footer */}
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
                <a href="#" aria-label="Facebook" className="text-white/60 hover:text-white transition-colors">
                  <Facebook className="size-5" />
                </a>
                <a href="#" aria-label="Instagram" className="text-white/60 hover:text-white transition-colors">
                  <Instagram className="size-5" />
                </a>
                <a href="#" aria-label="Twitter" className="text-white/60 hover:text-white transition-colors">
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
                <a href="#" className="font-['Roboto:Regular',_sans-serif] text-white/60 hover:text-white text-[14px] transition-colors" style={{ fontVariationSettings: "'wdth' 100" }}>
                  Pricing
                </a>
                <a href="#" className="font-['Roboto:Regular',_sans-serif] text-white/60 hover:text-white text-[14px] transition-colors" style={{ fontVariationSettings: "'wdth' 100" }}>
                  Blog
                </a>
              </div>
              <div className="flex flex-col gap-4">
                <p className="font-['Roboto:Medium',_sans-serif] text-white text-[14px]" style={{ fontVariationSettings: "'wdth' 100" }}>
                  Legal
                </p>
                <a href="#" className="font-['Roboto:Regular',_sans-serif] text-white/60 hover:text-white text-[14px] transition-colors" style={{ fontVariationSettings: "'wdth' 100" }}>
                  Terms & Conditions
                </a>
                <a href="#" className="font-['Roboto:Regular',_sans-serif] text-white/60 hover:text-white text-[14px] transition-colors" style={{ fontVariationSettings: "'wdth' 100" }}>
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
    </div>
  );
}
