import { useEffect, useState } from 'react'

interface Beam {
  id: number
  style: React.CSSProperties
}

export default function AuroraBackground() {
  const [beams, setBeams] = useState<Beam[]>([])

  useEffect(() => {
    setBeams(
      Array.from({ length: 60 }, (_, i) => {
        const riseDuration = Math.random() * 2 + 4
        const fadeDuration = Math.random() * 3 + 3
        return {
          id: i,
          style: {
            left: `${Math.random() * 100}%`,
            width: `${Math.floor(Math.random() * 3) + 1}px`,
            animationDelay: `${Math.random() * 5}s`,
            animationDuration: `${riseDuration}s, ${riseDuration}s, ${fadeDuration}s`,
          },
        }
      })
    )
  }, [])

  return (
    <div
      className="aurora-scene"
      role="img"
      aria-label="Animated aurora background"
    >
      <div className="aurora-floor" />
      <div className="aurora-main-column" />
      <div className="pointer-events-none absolute inset-0">
        {beams.map(b => (
          <div key={b.id} className="aurora-beam" style={b.style} />
        ))}
      </div>
    </div>
  )
}
