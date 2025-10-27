export function Navigation() {
  return (
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
        <a href="/dashboard">
          <button className="bg-white rounded-[25px] px-6 py-2 font-['Roboto:Medium',_sans-serif] text-black text-[14px] cursor-pointer hover:opacity-90 transition-opacity">
            Start Creating
          </button>
        </a>
      </div>
    </nav>
  );
}

