interface Props {
  size?: number
  className?: string
  style?: React.CSSProperties
}

/* Aggressive pixel-robot face — custom SVG, 32×32 grid */
export default function BotAvatar({ size = 24, className = '', style = {} }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
      aria-hidden="true"
    >
      {/* ── Head ── */}
      <rect x="4" y="9" width="24" height="17" rx="0"
        fill="currentColor" fillOpacity="0.12" stroke="currentColor" strokeWidth="1.6"/>

      {/* ── Antenna ── */}
      <line x1="16" y1="9" x2="16" y2="5" stroke="currentColor" strokeWidth="1.8"/>
      <rect x="13" y="3" width="6" height="2.5" fill="currentColor"/>
      {/* antenna blink dot */}
      <rect x="15" y="2" width="2" height="1.5" fill="currentColor" opacity="0.6"/>

      {/* ── Left eye block ── */}
      <rect x="7" y="13" width="6" height="5" rx="0" fill="currentColor"/>
      {/* inner glare */}
      <rect x="11.5" y="13.5" width="1" height="2" fill="currentColor" fillOpacity="0.25"/>

      {/* ── Right eye block ── */}
      <rect x="19" y="13" width="6" height="5" rx="0" fill="currentColor"/>
      <rect x="23.5" y="13.5" width="1" height="2" fill="currentColor" fillOpacity="0.25"/>

      {/* ── Angry brows — V pointing inward ── */}
      <polyline points="7,12  10,10  13,12"
        stroke="currentColor" strokeWidth="2.2" fill="none"
        strokeLinejoin="miter" strokeLinecap="square"/>
      <polyline points="19,12  22,10  25,12"
        stroke="currentColor" strokeWidth="2.2" fill="none"
        strokeLinejoin="miter" strokeLinecap="square"/>

      {/* ── Grill mouth ── */}
      <rect x="8" y="21" width="16" height="3" rx="0" fill="currentColor" fillOpacity="0.8"/>
      {/* grill slots (dark cutouts) */}
      <line x1="11"  y1="21" x2="11"  y2="24" stroke="#020c02" strokeWidth="1.4"/>
      <line x1="13.5" y1="21" x2="13.5" y2="24" stroke="#020c02" strokeWidth="1.4"/>
      <line x1="16"  y1="21" x2="16"  y2="24" stroke="#020c02" strokeWidth="1.4"/>
      <line x1="18.5" y1="21" x2="18.5" y2="24" stroke="#020c02" strokeWidth="1.4"/>
      <line x1="21"  y1="21" x2="21"  y2="24" stroke="#020c02" strokeWidth="1.4"/>

      {/* ── Side ear connectors ── */}
      <rect x="0"  y="14" width="4" height="2" fill="currentColor"/>
      <rect x="0"  y="18" width="4" height="2" fill="currentColor"/>
      <rect x="28" y="14" width="4" height="2" fill="currentColor"/>
      <rect x="28" y="18" width="4" height="2" fill="currentColor"/>

      {/* ── Chin bolts ── */}
      <rect x="9"  y="26" width="3" height="2" fill="currentColor" fillOpacity="0.7"/>
      <rect x="20" y="26" width="3" height="2" fill="currentColor" fillOpacity="0.7"/>
    </svg>
  )
}
