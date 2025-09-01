import { useEffect, useState } from 'react'

export default function ModeToggle() {
  const [dark, setDark] = useState(true)
  const [ritual, setRitual] = useState(true)
  useEffect(() => {
    const html = document.documentElement
    html.classList.toggle('theme-dark', dark)
    html.classList.toggle('theme-light', !dark)
    html.classList.toggle('mode-ritual', ritual)
    html.classList.toggle('mode-analyst', !ritual)
  }, [dark, ritual])
  return (
    <div className="flex items-center gap-2">
      <button className="btn-secondary px-3 py-1 text-sm" onClick={() => setDark(v => !v)}>{dark? 'Dark' : 'Light'}</button>
      <button className="btn-secondary px-3 py-1 text-sm" onClick={() => setRitual(v => !v)}>{ritual? 'Ritual' : 'Analyst'}</button>
    </div>
  )
}
