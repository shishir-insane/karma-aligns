import { useEffect, useRef, useState } from 'react'

export default function SoundToggle() {
  const [on, setOn] = useState(() => (localStorage.getItem('sound:on') ?? '1') === '1')
  const audioRef = useRef<HTMLAudioElement | null>(null)
  useEffect(() => {
    localStorage.setItem('sound:on', on ? '1' : '0')
    const a = audioRef.current
    if (!a) return
    if (on) { a.volume = 0.2; a.loop = true; a.play().catch(()=>{}) }
    else { a.pause() }
    const vis = () => { if (document.hidden) a?.pause(); else if (on) a?.play().catch(()=>{}) }
    document.addEventListener('visibilitychange', vis)
    return () => document.removeEventListener('visibilitychange', vis)
  }, [on])
  return (
    <div className="flex items-center gap-2">
      <button className="btn-secondary px-3 py-1 text-sm" onClick={() => setOn(v => !v)}>{on ? '🔊' : '🔇'}</button>
      {/* Place your ambient file at public/audio/ambient.mp3 */}
      <audio ref={audioRef} src="/audio/ambient.mp3" preload="none" />
    </div>
  )
}
