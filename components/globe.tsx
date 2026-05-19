"use client"

import { useEffect, useRef, useState, useCallback } from "react"

// Continent outlines as [lat, lon] pairs
const CONTINENTS: [number, number][][] = [
  // North America
  [[60,-140],[70,-130],[72,-100],[65,-85],[50,-55],[45,-60],[30,-80],[25,-90],[20,-87],[18,-70],[25,-80],[30,-95],[25,-110],[30,-117],[40,-124],[50,-126],[60,-140]],
  // South America
  [[10,-75],[8,-60],[5,-53],[0,-50],[-5,-35],[-10,-38],[-20,-40],[-30,-52],[-35,-58],[-52,-68],[-55,-65],[-40,-62],[-25,-48],[-15,-75],[0,-78],[10,-75]],
  // Europe
  [[70,25],[65,14],[58,5],[44,-8],[36,-6],[36,28],[42,28],[48,38],[60,30],[65,25],[70,25]],
  // Africa
  [[36,-5],[36,10],[30,32],[10,44],[0,42],[-10,40],[-34,25],[-20,14],[-10,13],[0,8],[10,15],[20,37],[30,32],[36,10]],
  // Asia
  [[70,30],[68,40],[55,40],[45,38],[38,42],[28,57],[22,60],[10,78],[5,100],[10,105],[22,120],[30,121],[40,120],[50,142],[60,163],[70,150],[75,105],[80,60],[70,30]],
  // Australia
  [[-15,130],[-12,136],[-15,145],[-25,153],[-38,147],[-38,140],[-32,115],[-22,114],[-20,119],[-15,130]],
]

// City markers [lat, lon]
const CITIES: [number, number][] = [
  [40.7, -74.0],   // New York
  [51.5, -0.1],    // London
  [48.9, 2.35],    // Paris
  [55.7, 37.6],    // Moscow
  [35.7, 139.7],   // Tokyo
  [-33.9, 151.2],  // Sydney
  [1.3, 103.8],    // Singapore
  [37.8, -122.4],  // San Francisco
  [-23.5, -46.6],  // São Paulo
  [28.6, 77.2],    // Delhi
  [31.2, 121.5],   // Shanghai
  [-26.2, 28.0],   // Johannesburg
  [19.4, -99.1],   // Mexico City
  [41.0, 28.9],    // Istanbul
  [25.2, 55.3],    // Dubai
  [-1.3, 36.8],    // Nairobi
]

interface OrbitDot {
  theta: number
  incl: number
  r: number
  speed: number
  size: number
  isCyan: boolean
}

function makeOrbitDots(count: number, R: number): OrbitDot[] {
  return Array.from({ length: count }, (_, i) => ({
    theta: (i / count) * Math.PI * 2,
    incl: (Math.random() - 0.5) * 1.2,
    r: R + 22 + Math.random() * 18,
    speed: (0.003 + Math.random() * 0.005) * (Math.random() > 0.5 ? 1 : -1),
    size: 2.5 + Math.random() * 2.5,
    isCyan: Math.random() > 0.5,
  }))
}

interface GlobeProps {
  size?: number
  orbitDotCount?: number
  className?: string
}

export default function Globe({
  size = 380,
  orbitDotCount = 12,
  className = "",
}: GlobeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const phiRef = useRef(0)
  const rafRef = useRef<number>(0)
  const draggingRef = useRef(false)
  const lastXRef = useRef(0)

  const [speed, setSpeed] = useState(0.005)
  const [showDots, setShowDots] = useState(true)
  const [showOrbit, setShowOrbit] = useState(true)
  const [showGrid, setShowGrid] = useState(true)

  const R = size / 2 - 20
  const CX = size / 2
  const CY = size / 2
  const TILT = 0.38

  // Stable orbit dots — recreated only when R changes
  const orbitDotsRef = useRef<OrbitDot[]>(makeOrbitDots(orbitDotCount, R))

  const project = useCallback(
    (lat: number, lon: number, phi: number) => {
      const laR = (lat * Math.PI) / 180
      const loR = (lon * Math.PI) / 180
      const x = Math.cos(laR) * Math.sin(loR)
      const y = Math.sin(laR)
      const z = Math.cos(laR) * Math.cos(loR)
      const x2 = x * Math.cos(phi) + z * Math.sin(phi)
      const z2 = -x * Math.sin(phi) + z * Math.cos(phi)
      const y2 = y * Math.cos(TILT) - z2 * Math.sin(TILT)
      const z3 = y * Math.sin(TILT) + z2 * Math.cos(TILT)
      return { sx: CX + x2 * R, sy: CY - y2 * R, z: z3, visible: z3 > 0 }
    },
    [CX, CY, R, TILT]
  )

  // Keep a ref to the latest state values so the animation loop always reads current
  const stateRef = useRef({ speed, showDots, showOrbit, showGrid })
  useEffect(() => {
    stateRef.current = { speed, showDots, showOrbit, showGrid }
  }, [speed, showDots, showOrbit, showGrid])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const dots = orbitDotsRef.current

    const draw = () => {
      const { speed: spd, showDots: sDots, showOrbit: sOrbit, showGrid: sGrid } = stateRef.current
      const dark = window.matchMedia("(prefers-color-scheme: dark)").matches
      const phi = phiRef.current
      const t = Date.now() * 0.001

      ctx.clearRect(0, 0, size, size)

      // Ocean gradient
      const g = ctx.createRadialGradient(CX - R * 0.38, CY - R * 0.42, R * 0.04, CX, CY, R)
      if (dark) {
        g.addColorStop(0, "#162638")
        g.addColorStop(0.5, "#0b1820")
        g.addColorStop(1, "#050e15")
      } else {
        g.addColorStop(0, "#cce8ff")
        g.addColorStop(0.5, "#7ec4f5")
        g.addColorStop(1, "#3a9ee0")
      }
      ctx.beginPath()
      ctx.arc(CX, CY, R, 0, Math.PI * 2)
      ctx.fillStyle = g
      ctx.fill()

      // Grid lines
      if (sGrid) {
        ctx.strokeStyle = dark ? "rgba(80,150,220,0.1)" : "rgba(50,110,180,0.15)"
        ctx.lineWidth = 0.5
        for (let lat = -75; lat <= 75; lat += 30) {
          ctx.beginPath()
          let first = true
          for (let lon = -180; lon <= 180; lon += 4) {
            const p = project(lat, lon, phi)
            if (p.visible) {
              if (first) { ctx.moveTo(p.sx, p.sy); first = false }
              else ctx.lineTo(p.sx, p.sy)
            } else first = true
          }
          ctx.stroke()
        }
        for (let lon = -180; lon < 180; lon += 30) {
          ctx.beginPath()
          let first = true
          for (let lat = -85; lat <= 85; lat += 4) {
            const p = project(lat, lon, phi)
            if (p.visible) {
              if (first) { ctx.moveTo(p.sx, p.sy); first = false }
              else ctx.lineTo(p.sx, p.sy)
            } else first = true
          }
          ctx.stroke()
        }
      }

      // Continents
      for (const cont of CONTINENTS) {
        ctx.beginPath()
        let started = false
        for (const [la, lo] of cont) {
          const p = project(la, lo, phi)
          if (p.visible) {
            if (!started) { ctx.moveTo(p.sx, p.sy); started = true }
            else ctx.lineTo(p.sx, p.sy)
          } else {
            if (started) ctx.lineTo(p.sx, p.sy)
            started = false
          }
        }
        ctx.closePath()
        ctx.fillStyle = dark ? "rgba(40,165,100,0.55)" : "rgba(45,135,70,0.65)"
        ctx.fill()
        ctx.strokeStyle = dark ? "rgba(60,210,130,0.5)" : "rgba(25,100,50,0.6)"
        ctx.lineWidth = 0.7
        ctx.stroke()
      }

      // City dots
      if (sDots) {
        CITIES.forEach(([la, lo], i) => {
          const p = project(la, lo, phi)
          if (!p.visible) return
          const pulse = 1 + Math.sin(t * 2.5 + i * 0.9) * 0.5
          ctx.beginPath()
          ctx.arc(p.sx, p.sy, 4.5 * pulse, 0, Math.PI * 2)
          ctx.fillStyle = dark ? "rgba(255,90,30,0.15)" : "rgba(200,40,0,0.13)"
          ctx.fill()
          ctx.beginPath()
          ctx.arc(p.sx, p.sy, 2.2, 0, Math.PI * 2)
          ctx.fillStyle = dark ? "#ff6030" : "#cc2a00"
          ctx.fill()
        })
      }

      // Advance orbit dots
      dots.forEach(d => { d.theta += d.speed })

      // Split orbit dots behind / front
      type DotEntry = { sx: number; sy: number; oz: number; d: OrbitDot }
      const behind: DotEntry[] = []
      const front: DotEntry[] = []

      dots.forEach(d => {
        const ox = d.r * Math.cos(d.theta) * Math.cos(d.incl)
        const oy = d.r * Math.sin(d.incl)
        const oz = d.r * Math.sin(d.theta) * Math.cos(d.incl)
        const sx = CX + ox
        const sy = CY - oy
        ;(oz < 0 ? behind : front).push({ sx, sy, oz, d })
      })

      const drawDot = (e: DotEntry, alpha: number) => {
        const { sx, sy, d } = e
        const pulse = 1 + Math.sin(t * 3 + d.theta) * 0.3
        const base = d.isCyan
          ? dark ? `rgba(80,220,255,${alpha})` : `rgba(20,130,210,${alpha})`
          : dark ? `rgba(255,160,60,${alpha})` : `rgba(210,90,10,${alpha})`
        const glow = d.isCyan
          ? dark ? `rgba(80,220,255,${alpha * 0.2})` : `rgba(20,130,210,${alpha * 0.15})`
          : dark ? `rgba(255,160,60,${alpha * 0.2})` : `rgba(210,90,10,${alpha * 0.15})`
        ctx.beginPath()
        ctx.arc(sx, sy, d.size * 2.5 * pulse, 0, Math.PI * 2)
        ctx.fillStyle = glow
        ctx.fill()
        ctx.beginPath()
        ctx.arc(sx, sy, d.size * pulse, 0, Math.PI * 2)
        ctx.fillStyle = base
        ctx.fill()
      }

      behind.forEach(e => drawDot(e, 0.35))

      // Gloss overlay (renders on top of behind-dots, below front-dots)
      const gl = ctx.createRadialGradient(CX - R * 0.4, CY - R * 0.4, R * 0.03, CX, CY, R)
      gl.addColorStop(0, dark ? "rgba(140,205,255,0.1)" : "rgba(255,255,255,0.38)")
      gl.addColorStop(0.35, "rgba(255,255,255,0)")
      gl.addColorStop(1, dark ? "rgba(0,15,40,0.25)" : "rgba(5,45,110,0.12)")
      ctx.beginPath()
      ctx.arc(CX, CY, R, 0, Math.PI * 2)
      ctx.fillStyle = gl
      ctx.fill()

      // Globe border
      ctx.beginPath()
      ctx.arc(CX, CY, R, 0, Math.PI * 2)
      ctx.strokeStyle = dark ? "rgba(80,160,255,0.25)" : "rgba(20,85,170,0.2)"
      ctx.lineWidth = 1
      ctx.stroke()

      front.forEach(e => drawDot(e, 0.92))

      // Orbit ring + satellite
      if (sOrbit) {
        ctx.save()
        ctx.translate(CX, CY)
        ctx.rotate(-0.32)
        ctx.scale(1, 0.26)
        ctx.beginPath()
        ctx.arc(0, 0, R + 28, 0, Math.PI * 2)
        ctx.strokeStyle = dark ? "rgba(80,200,255,0.18)" : "rgba(20,100,190,0.16)"
        ctx.lineWidth = 1 / 0.26
        ctx.setLineDash([6, 10])
        ctx.stroke()
        ctx.setLineDash([])
        ctx.restore()

        const sa = t * 0.65
        ctx.save()
        ctx.translate(CX, CY)
        ctx.rotate(-0.32)
        const sox = (R + 28) * Math.cos(sa)
        const soy = (R + 28) * 0.26 * Math.sin(sa)
        ctx.beginPath()
        ctx.arc(sox, soy, 5.5, 0, Math.PI * 2)
        ctx.fillStyle = dark ? "#44d4ff" : "#1265cc"
        ctx.fill()
        ctx.beginPath()
        ctx.arc(sox, soy, 10, 0, Math.PI * 2)
        ctx.fillStyle = dark ? "rgba(68,212,255,0.2)" : "rgba(18,101,204,0.18)"
        ctx.fill()
        ctx.restore()
      }

      if (!draggingRef.current) phiRef.current += spd

      rafRef.current = requestAnimationFrame(draw)
    }

    rafRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(rafRef.current)
  }, [project, CX, CY, R, size])

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    draggingRef.current = true
    lastXRef.current = e.clientX
    canvasRef.current?.setPointerCapture(e.pointerId)
  }
  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!draggingRef.current) return
    phiRef.current += (e.clientX - lastXRef.current) * 0.009
    lastXRef.current = e.clientX
  }
  const onPointerUp = () => { draggingRef.current = false }

  const btnBase =
    "rounded-full border border-neutral-300 dark:border-neutral-600 px-4 py-1.5 text-xs font-mono tracking-wider transition-all duration-150 cursor-pointer"
  const btnActive =
    "bg-neutral-900 text-white border-transparent dark:bg-white dark:text-neutral-900"
  const btnInactive =
    "bg-white text-neutral-600 dark:bg-neutral-900 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"

  return (
    <div className={`flex flex-col items-center gap-5 select-none ${className}`}>
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        style={{ width: size, height: size, borderRadius: "50%", cursor: "grab", display: "block" }}
      />

      <div className="flex flex-wrap justify-center gap-2">
        {[
          { label: "SLOW", active: speed === 0.005, onClick: () => setSpeed(0.005) },
          { label: "FAST", active: speed === 0.022, onClick: () => setSpeed(0.022) },
          { label: showDots ? "DOTS ON" : "DOTS OFF", active: showDots, onClick: () => setShowDots(v => !v) },
          { label: showOrbit ? "ORBIT ON" : "ORBIT OFF", active: showOrbit, onClick: () => setShowOrbit(v => !v) },
          { label: showGrid ? "GRID ON" : "GRID OFF", active: showGrid, onClick: () => setShowGrid(v => !v) },
        ].map(({ label, active, onClick }) => (
          <button
            key={label}
            onClick={onClick}
            className={`${btnBase} ${active ? btnActive : btnInactive}`}
          >
            {label}
          </button>
        ))}
      </div>

      <p className="text-[10px] font-mono tracking-widest text-neutral-400 dark:text-neutral-600 uppercase">
        Drag to spin · Interactive Globe
      </p>
    </div>
  )
}