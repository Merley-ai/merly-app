export function RenderingImageTile() {
    return (
        <div className="relative aspect-[4/5] rounded-lg overflow-hidden">
            {/* Animated gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/30 via-pink-500/30 to-orange-500/30 animate-pulse" />
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/20 via-transparent to-yellow-500/20"
                style={{ animation: 'gradient 3s ease infinite' }} />

            {/* Shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                style={{ animation: 'shimmer 2s infinite' }} />

            {/* Rendering text */}
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4" />
                    <p className="font-['Roboto:Regular',_sans-serif] text-white text-[14px]"
                        style={{ fontVariationSettings: "'wdth' 100" }}>
                        Rendering...
                    </p>
                </div>
            </div>
        </div>
    );
}

