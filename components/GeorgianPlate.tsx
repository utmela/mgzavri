"use client";

export type PlateSize = "sm" | "md" | "lg";

interface Props {
  plate: string;
  size?: PlateSize;
}

export default function GeorgianPlate({ plate, size = "md" }: Props) {
  if (!plate) return null;

  const cfg = {
    sm: {
      stripW: 24, sw: 9, sr: 3, sd: 1.3,
      geoSize: 5.5, flagSize: 9,
      padH: 10, padV: 4, minW: 80,
      fontSize: 14, subSize: 5,
      radius: 5, border: 1.5, screwR: 2.5,
    },
    md: {
      stripW: 36, sw: 13, sr: 4.5, sd: 2,
      geoSize: 8, flagSize: 14,
      padH: 16, padV: 6, minW: 118,
      fontSize: 22, subSize: 6.5,
      radius: 8, border: 2, screwR: 3.5,
    },
    lg: {
      stripW: 50, sw: 18, sr: 6, sd: 2.5,
      geoSize: 10, flagSize: 19,
      padH: 24, padV: 9, minW: 158,
      fontSize: 32, subSize: 9,
      radius: 11, border: 3, screwR: 5,
    },
  }[size];

  // Realistic white plate — very subtle warm-white gradient
  const plateGrad = "linear-gradient(170deg, #FFFFFF 0%, #F8F8F8 50%, #FFFFFF 100%)";
  const stripGrad = "linear-gradient(180deg, #0038A8 0%, #002D99 55%, #002080 100%)";

  function Screw({ side }: { side: "left" | "right" }) {
    return (
      <div style={{
        position: "absolute",
        [side]: cfg.screwR + 3,
        top: "50%",
        transform: "translateY(-50%)",
        width: cfg.screwR * 2,
        height: cfg.screwR * 2,
        borderRadius: "50%",
        background: "radial-gradient(circle at 35% 35%, #e8e8e8, #b0b0b0 55%, #888)",
        border: "0.5px solid #aaa",
        boxShadow: "0 1px 2px rgba(0,0,0,0.3), inset 0 0.5px 0 rgba(255,255,255,0.7)",
        zIndex: 2,
      }}>
        {/* Phillips cross */}
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{
            position: "absolute",
            width: cfg.screwR * 0.9, height: cfg.screwR * 0.18,
            background: "rgba(0,0,0,0.3)", borderRadius: 1,
          }} />
          <div style={{
            position: "absolute",
            width: cfg.screwR * 0.18, height: cfg.screwR * 0.9,
            background: "rgba(0,0,0,0.3)", borderRadius: 1,
          }} />
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "stretch",
        overflow: "hidden",
        border: `${cfg.border}px solid #888`,
        borderRadius: cfg.radius,
        boxShadow: `
          0 2px 8px rgba(0,0,0,0.22),
          0 1px 2px rgba(0,0,0,0.12),
          inset 0 1px 0 rgba(255,255,255,0.5)
        `,
        userSelect: "none",
        fontFamily: "'Arial Black', 'Arial Bold', Arial, sans-serif",
        position: "relative",
      }}
    >
      {/* ── Blue EU strip ── */}
      <div style={{
        width: cfg.stripW,
        background: stripGrad,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "5px 3px 4px",
        gap: 3,
        flexShrink: 0,
        borderRight: "1.5px solid #001a6e",
        boxShadow: "inset -1px 0 3px rgba(0,0,0,0.25)",
      }}>
        {/* Georgian flag SVG — top */}
        <svg
          width={cfg.stripW * 0.72}
          height={cfg.stripW * 0.5}
          viewBox="0 0 30 20"
          style={{ display: "block", borderRadius: 1, overflow: "hidden", flexShrink: 0 }}
        >
          <rect width="30" height="20" fill="#fff" />
          <rect x="0" y="8" width="30" height="4" fill="#E31C23" />
          <rect x="13" y="0" width="4" height="20" fill="#E31C23" />
          <rect x="3" y="2" width="6" height="1.5" fill="#E31C23" />
          <rect x="5.75" y="0.5" width="1.5" height="5" fill="#E31C23" />
          <rect x="21" y="2" width="6" height="1.5" fill="#E31C23" />
          <rect x="23.75" y="0.5" width="1.5" height="5" fill="#E31C23" />
          <rect x="3" y="16.5" width="6" height="1.5" fill="#E31C23" />
          <rect x="5.75" y="14.5" width="1.5" height="5" fill="#E31C23" />
          <rect x="21" y="16.5" width="6" height="1.5" fill="#E31C23" />
          <rect x="23.75" y="14.5" width="1.5" height="5" fill="#E31C23" />
        </svg>

        {/* GEO text */}
        <span style={{
          color: "#FFD700",
          fontSize: cfg.geoSize,
          fontWeight: 900,
          letterSpacing: "0.1em",
          lineHeight: 1,
          textShadow: "0 0 5px rgba(255,215,0,0.4)",
        }}>GEO</span>


      </div>

      {/* ── White plate body ── */}
      <div style={{
        position: "relative",
        background: plateGrad,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: `${cfg.padV}px ${cfg.padH}px`,
        minWidth: cfg.minW,
        boxShadow: "inset 0 1px 4px rgba(0,0,0,0.04), inset 0 -1px 2px rgba(0,0,0,0.03)",
      }}>
        <Screw side="left" />
        <Screw side="right" />

        {/* Plate number */}
        <span style={{
          fontSize: cfg.fontSize,
          fontWeight: 900,
          letterSpacing: "0.15em",
          color: "#111",
          lineHeight: 1,
          textShadow: `
            0 1px 0 rgba(255,255,255,0.95),
            0 -0.5px 0 rgba(0,0,0,0.1),
            1px 1px 0 rgba(0,0,0,0.06)
          `,
        }}>
          {plate}
        </span>
      </div>
    </div>
  );
}