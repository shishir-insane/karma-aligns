"use client"

import { useEffect } from "react"

export default function AnimatedFavicon() {
  // Toggle with env var; default off to save CPU
  const enabled = typeof window !== "undefined" && process.env.NEXT_PUBLIC_ANIMATED_FAVICON === "1"

  useEffect(() => {
    if (!enabled) return

    const size = 64 // enough for crisp scaling to 16/32
    const cvs = document.createElement("canvas")
    cvs.width = size
    cvs.height = size
    const ctx = cvs.getContext("2d")!

    const img = new Image()
    img.src = "/karma-wheel.svg"
    let raf = 0
    let angle = 0
    const step = () => {
      // draw
      ctx.clearRect(0, 0, size, size)
      ctx.save()
      ctx.translate(size / 2, size / 2)
      ctx.rotate(angle)
      const scale = 0.9
      const d = size * scale
      ctx.drawImage(img, -d / 2, -d / 2, d, d)
      ctx.restore()

      // swap favicon
      const linkId = "ka-animated-favicon"
      let link = document.getElementById(linkId) as HTMLLinkElement | null
      if (!link) {
        link = document.createElement("link")
        link.id = linkId
        link.rel = "icon"
        link.type = "image/png"
        document.head.appendChild(link)
      }
      link.href = cvs.toDataURL("image/png")

      // next frame (≈ 10 FPS to keep it light)
      angle += (Math.PI * 2) / 360 // 1 deg per frame
      raf = window.setTimeout(step, 100)
    }

    const onLoad = () => { step() }
    if (img.complete) onLoad()
    else img.addEventListener("load", onLoad)

    return () => {
      window.clearTimeout(raf)
      img.removeEventListener("load", onLoad)
    }
  }, [enabled])

  return null
}
