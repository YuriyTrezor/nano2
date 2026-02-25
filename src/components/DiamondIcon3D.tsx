const DiamondIcon3D = ({ className = "" }: { className?: string }) => (
  <div className={`relative inline-flex items-center justify-center ${className}`}>
    <svg
      viewBox="0 0 64 64"
      className="w-full h-full animate-[diamond-float_3s_ease-in-out_infinite] drop-shadow-[0_0_12px_hsl(195,80%,60%)]"
      fill="none"
    >
      {/* Top facet */}
      <polygon
        points="32,4 52,24 32,20 12,24"
        fill="hsl(195, 90%, 65%)"
        opacity="0.95"
      />
      {/* Left facet */}
      <polygon
        points="12,24 32,20 32,60"
        fill="hsl(210, 85%, 50%)"
        opacity="0.85"
      />
      {/* Right facet */}
      <polygon
        points="52,24 32,20 32,60"
        fill="hsl(195, 80%, 55%)"
        opacity="0.9"
      />
      {/* Top-left edge */}
      <polygon
        points="32,4 12,24 32,20"
        fill="hsl(200, 90%, 70%)"
        opacity="0.7"
      />
      {/* Top-right edge */}
      <polygon
        points="32,4 52,24 32,20"
        fill="hsl(190, 85%, 75%)"
        opacity="0.8"
      />
      {/* Shine */}
      <polygon
        points="26,12 32,8 38,12 32,18"
        fill="white"
        opacity="0.4"
        className="animate-[diamond-shine_2s_ease-in-out_infinite]"
      />
    </svg>
  </div>
);

export default DiamondIcon3D;
