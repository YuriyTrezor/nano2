const DiamondIcon3D = ({ className = "" }: { className?: string }) => (
  <div className={`relative inline-flex items-center justify-center ${className}`}>
    {/* Glow ring */}
    <div className="absolute inset-0 rounded-full bg-[hsl(195,80%,60%)]/20 blur-xl animate-[diamond-pulse_2s_ease-in-out_infinite]" />
    <svg
      viewBox="0 0 64 64"
      className="w-full h-full animate-[diamond-float_3s_ease-in-out_infinite] drop-shadow-[0_0_16px_hsl(195,80%,60%)]"
      fill="none"
      style={{ filter: "drop-shadow(0 0 8px hsl(195 80% 60% / 0.5))" }}
    >
      {/* Bottom facet (deepest) */}
      <polygon
        points="12,24 32,60 32,28"
        fill="hsl(220, 85%, 35%)"
        opacity="0.9"
      />
      <polygon
        points="52,24 32,60 32,28"
        fill="hsl(200, 80%, 40%)"
        opacity="0.9"
      />
      {/* Top crown */}
      <polygon
        points="32,4 12,24 24,24"
        fill="hsl(200, 90%, 72%)"
        opacity="0.85"
      />
      <polygon
        points="32,4 52,24 40,24"
        fill="hsl(190, 85%, 78%)"
        opacity="0.9"
      />
      <polygon
        points="24,24 32,4 40,24"
        fill="hsl(195, 95%, 68%)"
        opacity="0.95"
      />
      {/* Middle table facets */}
      <polygon
        points="12,24 24,24 32,28"
        fill="hsl(210, 85%, 50%)"
        opacity="0.85"
      />
      <polygon
        points="52,24 40,24 32,28"
        fill="hsl(195, 80%, 55%)"
        opacity="0.9"
      />
      <polygon
        points="24,24 40,24 32,28"
        fill="hsl(200, 90%, 60%)"
        opacity="0.95"
      />
      {/* Highlight shine */}
      <polygon
        points="28,10 32,6 36,10 32,16"
        fill="white"
        opacity="0.5"
        className="animate-[diamond-shine_2s_ease-in-out_infinite]"
      />
      {/* Edge highlights */}
      <line x1="32" y1="4" x2="12" y2="24" stroke="hsl(195, 90%, 80%)" strokeWidth="0.5" opacity="0.6" />
      <line x1="32" y1="4" x2="52" y2="24" stroke="hsl(195, 90%, 80%)" strokeWidth="0.5" opacity="0.6" />
      <line x1="12" y1="24" x2="32" y2="60" stroke="hsl(210, 80%, 60%)" strokeWidth="0.3" opacity="0.4" />
      <line x1="52" y1="24" x2="32" y2="60" stroke="hsl(195, 80%, 60%)" strokeWidth="0.3" opacity="0.4" />
    </svg>
  </div>
);

export default DiamondIcon3D;
