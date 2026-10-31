import React from 'react';

export interface Og3DLogoProps {
  id?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | number;
  variant?: 'logo' | 'credit' | 'emblem';
  animated?: boolean;
  glow?: boolean;
  className?: string;
  showText?: boolean;
}

const sizeMap = {
  xs: 20,
  sm: 28,
  md: 38,
  lg: 52,
  xl: 72,
  '2xl': 96
};

/**
 * 3D OG AI Ultra-Refined Master Brandmark & Holographic Emblem
 * True-3D isometric volumetric construction with multi-faceted metallic chassis,
 * cyan/magenta quantum refractive lighting, chamfered bevels, titanium depth extrusions,
 * and holographic core optics.
 */
export const Og3DLogo: React.FC<Og3DLogoProps> = ({
  size = 'md',
  variant = 'logo',
  animated = false,
  glow = true,
  className = '',
  showText = false
}) => {
  const pixelSize = typeof size === 'number' ? size : sizeMap[size] || 38;

  // Multi-tier volumetric drop shadows & neon ambient flare
  const glowStyle = glow
    ? variant === 'credit'
      ? `drop-shadow(0 4px ${Math.max(4, pixelSize * 0.18)}px rgba(0,0,0,0.85)) drop-shadow(0 0 ${Math.max(3, pixelSize * 0.16)}px rgba(245, 158, 11, 0.85)) drop-shadow(0 0 ${Math.max(6, pixelSize * 0.35)}px rgba(234, 179, 8, 0.5))`
      : `drop-shadow(0 4px ${Math.max(4, pixelSize * 0.18)}px rgba(0,0,0,0.9)) drop-shadow(0 0 ${Math.max(3, pixelSize * 0.2)}px rgba(6, 182, 212, 0.85)) drop-shadow(0 0 ${Math.max(8, pixelSize * 0.4)}px rgba(168, 85, 247, 0.55))`
    : `drop-shadow(0 4px ${Math.max(3, pixelSize * 0.14)}px rgba(0,0,0,0.7))`;

  return (
    <div
      className={`inline-flex items-center gap-2.5 select-none align-middle group cursor-pointer ${
        animated ? 'animate-star-pulse' : ''
      } ${className}`}
    >
      <span
        style={{
          width: pixelSize,
          height: pixelSize,
          filter: glowStyle,
          perspective: '600px'
        }}
        className="relative inline-flex items-center justify-center shrink-0 transition-all duration-300 transform-gpu group-hover:scale-110 group-hover:-translate-y-0.5"
      >
        <svg
          viewBox="0 0 140 140"
          width={pixelSize}
          height={pixelSize}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full overflow-visible transition-transform duration-300 group-hover:rotate-[2deg]"
        >
          <defs>
            {/* Deep Volumetric Ambient Occlusion */}
            <filter id="og3dShadow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="8" stdDeviation="6" floodColor="#000000" floodOpacity="0.95" />
              <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000000" floodOpacity="0.8" />
            </filter>

            {/* Micro Bevel Lighting Filter */}
            <filter id="og3dSpecular" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur in="SourceAlpha" stdDeviation="1.5" result="blur" />
              <feSpecularLighting in="blur" surfaceScale="2" specularConstant="1.2" specularExponent="20" lightingColor="#ffffff" result="specOut">
                <fePointLight x="40" y="20" z="80" />
              </feSpecularLighting>
              <feComposite in="specOut" in2="SourceAlpha" operator="in" result="specOut" />
              <feComposite in="SourceGraphic" in2="specOut" operator="over" />
            </filter>

            {/* 3D Cyan Electric Bevel Gradient */}
            <linearGradient id="ogCyan3DElectric" x1="15%" y1="0%" x2="85%" y2="100%">
              <stop offset="0%" stopColor="#A5F3FC" />
              <stop offset="25%" stopColor="#22D3EE" />
              <stop offset="60%" stopColor="#06B6D4" />
              <stop offset="100%" stopColor="#083344" />
            </linearGradient>

            {/* 3D Hyper Violet Magenta Gradient */}
            <linearGradient id="ogViolet3D" x1="15%" y1="0%" x2="85%" y2="100%">
              <stop offset="0%" stopColor="#FDA4AF" />
              <stop offset="20%" stopColor="#F43F5E" />
              <stop offset="55%" stopColor="#C026D3" />
              <stop offset="85%" stopColor="#7C3AED" />
              <stop offset="100%" stopColor="#312E81" />
            </linearGradient>

            {/* Minted 3D Solar Gold Gradient */}
            <linearGradient id="ogGold3DMinted" x1="20%" y1="0%" x2="80%" y2="100%">
              <stop offset="0%" stopColor="#FEF9C3" />
              <stop offset="25%" stopColor="#FDE047" />
              <stop offset="55%" stopColor="#F59E0B" />
              <stop offset="85%" stopColor="#B45309" />
              <stop offset="100%" stopColor="#451A03" />
            </linearGradient>

            {/* Extruded 3D Side Walls (Shadow facet) */}
            <linearGradient id="ogExtrudeWall" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#0F172A" />
              <stop offset="100%" stopColor="#020617" />
            </linearGradient>

            {/* Titanium Chassis Face */}
            <radialGradient id="ogPlate3D" cx="42%" cy="32%" r="70%">
              <stop offset="0%" stopColor="#1E293B" />
              <stop offset="35%" stopColor="#0F172A" />
              <stop offset="75%" stopColor="#070C18" />
              <stop offset="100%" stopColor="#020408" />
            </radialGradient>

            {/* Glass Glare Specular Sheen */}
            <linearGradient id="ogGlassGlareSheen" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.85" />
              <stop offset="30%" stopColor="#FFFFFF" stopOpacity="0.25" />
              <stop offset="60%" stopColor="#38BDF8" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0" />
            </linearGradient>

            {/* Golden Glare */}
            <linearGradient id="ogGoldGlare" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
              <stop offset="30%" stopColor="#FEF08A" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* ======================================================== */}
          {/* LAYER 1: 3D VOLUMETRIC EXTRUDED HEXAGON BASE PLATFORM   */}
          {/* ======================================================== */}
          <g filter="url(#og3dShadow)">
            {/* 3D Extrusion Side Walls (Bottom Depth Thickness) */}
            <path
              d="M 70,12 L 122,40 L 122,98 L 70,126 L 18,98 L 18,40 Z"
              fill="url(#ogExtrudeWall)"
              stroke="#000000"
              strokeWidth="2"
              transform="translate(0, 7)"
            />
            {/* Extruded bottom facet highlight */}
            <path
              d="M 18,98 L 18,105 L 70,133 L 122,105 L 122,98 L 70,126 Z"
              fill={variant === 'credit' ? '#78350F' : '#083344'}
              opacity="0.9"
            />

            {/* Main Front Hexagon Face */}
            <path
              d="M 70,12 L 122,40 L 122,98 L 70,126 L 18,98 L 18,40 Z"
              fill="url(#ogPlate3D)"
              stroke={variant === 'credit' ? 'url(#ogGold3DMinted)' : 'url(#ogCyan3DElectric)'}
              strokeWidth="3.5"
              strokeLinejoin="round"
            />

            {/* Chamfered Top Bevel Ridge (Light reflection on top edges) */}
            <path
              d="M 18,40 L 70,12 L 122,40"
              stroke="#FFFFFF"
              strokeWidth="2"
              strokeLinecap="round"
              strokeOpacity="0.85"
            />

            {/* Recessed Inner Micro-Hexagon with Cyber Circuit Ticks */}
            <path
              d="M 70,22 L 112,45 L 112,93 L 70,116 L 28,93 L 28,45 Z"
              fill={variant === 'credit' ? 'rgba(245, 158, 11, 0.08)' : 'rgba(6, 182, 212, 0.06)'}
              stroke={variant === 'credit' ? '#F59E0B' : '#00F5FF'}
              strokeWidth="1.2"
              strokeDasharray={variant === 'credit' ? '5 4' : '6 4'}
              strokeOpacity="0.65"
              strokeLinejoin="round"
            />

            {/* Corner Tech Anchors & Fasteners */}
            <circle cx="70" cy="18" r="2.2" fill={variant === 'credit' ? '#FDE047' : '#67E8F9'} />
            <circle cx="116" cy="43" r="2.2" fill={variant === 'credit' ? '#FDE047' : '#67E8F9'} />
            <circle cx="116" cy="95" r="2.2" fill={variant === 'credit' ? '#FDE047' : '#67E8F9'} />
            <circle cx="70" cy="120" r="2.2" fill={variant === 'credit' ? '#FDE047' : '#67E8F9'} />
            <circle cx="24" cy="95" r="2.2" fill={variant === 'credit' ? '#FDE047' : '#67E8F9'} />
            <circle cx="24" cy="43" r="2.2" fill={variant === 'credit' ? '#FDE047' : '#67E8F9'} />
          </g>

          {/* ======================================================== */}
          {/* LAYER 2: 3D EXTRUDED "O" TORUS MONOGRAM                  */}
          {/* ======================================================== */}
          <g transform="translate(0, -1)">
            {/* "O" 3D Extrusion Cast Shadow */}
            <path
              d="M 46,38 C 56,38 64,45 64,55 L 64,83 C 64,93 56,100 46,100 C 36,100 28,93 28,83 L 28,55 C 28,45 36,38 46,38 Z"
              fill="none"
              stroke="#000000"
              strokeWidth="12"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.9"
              transform="translate(0, 4)"
            />

            {/* "O" 3D Isometric Body */}
            <path
              d="M 46,38 C 56,38 64,45 64,55 L 64,83 C 64,93 56,100 46,100 C 36,100 28,93 28,83 L 28,55 C 28,45 36,38 46,38 Z"
              fill="none"
              stroke={variant === 'credit' ? 'url(#ogGold3DMinted)' : 'url(#ogCyan3DElectric)'}
              strokeWidth="10"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* "O" Precision 3D Specular Highlight Ridge */}
            <path
              d="M 31,62 L 31,54 C 31,46 37,40 46,40 C 55,40 61,46 61,54 L 61,68"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="2.8"
              strokeLinecap="round"
              opacity="0.9"
            />

            {/* "O" Core Reactor Gem */}
            <circle cx="46" cy="69" r="5" fill={variant === 'credit' ? '#F59E0B' : '#00F5FF'} opacity="0.35" />
            <circle cx="46" cy="69" r="2.4" fill="#FFFFFF" />
          </g>

          {/* ======================================================== */}
          {/* LAYER 3: 3D EXTRUDED "G" KINETIC MONOGRAM                */}
          {/* ======================================================== */}
          <g transform="translate(3, -1)">
            {/* "G" 3D Extrusion Cast Shadow */}
            <path
              d="M 103,52 L 103,47 C 103,39 96,34 85,34 C 73,34 66,42 66,54 L 66,84 C 66,95 73,103 85,103 C 97,103 104,96 104,85 L 104,67 L 84,67"
              fill="none"
              stroke="#000000"
              strokeWidth="12"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.9"
              transform="translate(0, 4)"
            />

            {/* "G" 3D Dynamic Metallic Body */}
            <path
              d="M 103,52 L 103,47 C 103,39 96,34 85,34 C 73,34 66,42 66,54 L 66,84 C 66,95 73,103 85,103 C 97,103 104,96 104,85 L 104,67 L 84,67"
              fill="none"
              stroke={variant === 'credit' ? 'url(#ogGold3DMinted)' : 'url(#ogViolet3D)'}
              strokeWidth="10"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* "G" Specular Top Bevel Curve */}
            <path
              d="M 101,47 C 101,41 95,36 85,36 C 75,36 68,43 68,54"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="2.8"
              strokeLinecap="round"
              opacity="0.9"
            />

            {/* "G" Forward Horizontal Cross-Bar Laser Beam */}
            <line
              x1="85"
              y1="67"
              x2="103"
              y2="67"
              stroke="#FFFFFF"
              strokeWidth="3.2"
              strokeLinecap="round"
            />
          </g>

          {/* ======================================================== */}
          {/* LAYER 4: QUANTUM FUSION BRIDGE & OPTICAL MICRO-BADGE     */}
          {/* ======================================================== */}
          {/* Central Interlocking Singularity Node */}
          <g transform="translate(68, 68)">
            <circle cx="0" cy="0" r="5" fill="#020617" stroke={variant === 'credit' ? '#FBBF24' : '#22D3EE'} strokeWidth="1.8" />
            <circle cx="0" cy="0" r="2.5" fill={variant === 'credit' ? '#FEF08A' : '#FFFFFF'} />
          </g>

          {/* Micro 3D "AI" Quantum Precision Badge */}
          <g transform="translate(98, 25)">
            <rect
              x="-2"
              y="-2"
              width="26"
              height="15"
              rx="4.5"
              fill="#020617"
              stroke={variant === 'credit' ? '#F59E0B' : '#00F5FF'}
              strokeWidth="1.4"
              opacity="0.95"
            />
            {/* "A" */}
            <path
              d="M 3,10 L 6.5,3.5 L 10,10 M 4.8,7.8 L 8.2,7.8"
              stroke={variant === 'credit' ? '#FEF08A' : '#A5F3FC'}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* "I" */}
            <path
              d="M 14,3.5 L 19,3.5 M 16.5,3.5 L 16.5,10 M 14,10 L 19,10"
              stroke={variant === 'credit' ? '#FEF08A' : '#A5F3FC'}
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </g>

          {/* Diagonal 3D Holographic Refraction Glare */}
          <path
            d="M 26,40 C 48,25 92,25 114,40 C 92,54 48,54 26,40 Z"
            fill={variant === 'credit' ? 'url(#ogGoldGlare)' : 'url(#ogGlassGlareSheen)'}
            opacity="0.8"
            pointerEvents="none"
          />

          {/* Horizon Specular Edge */}
          <path
            d="M 45,118 C 61,123 79,123 95,118"
            stroke={variant === 'credit' ? '#FEF08A' : '#67E8F9'}
            strokeWidth="1.8"
            strokeLinecap="round"
            opacity="0.7"
          />
        </svg>
      </span>

      {showText && (
        <span className="flex flex-col leading-none">
          <span className="font-display font-black text-sm tracking-tight text-white flex items-center gap-1 drop-shadow-[0_0_10px_rgba(6,182,212,0.6)]">
            OG AI<span className="text-cyan-400 font-mono text-[10px]">.pro</span>
          </span>
          <span className="text-[9px] font-mono uppercase tracking-widest text-slate-400">
            {variant === 'credit' ? 'OG Stars 3D' : 'Autonomous Suite'}
          </span>
        </span>
      )}
    </div>
  );
};

export default Og3DLogo;
