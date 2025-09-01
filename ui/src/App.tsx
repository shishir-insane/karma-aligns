import { Routes, Route, Link } from 'react-router-dom'
import Home from './pages/Home'
import ModeToggle from './components/ModeToggle'
import SoundToggle from './components/SoundToggle'

export default function App() {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 backdrop-blur bg-black/20 border-b border-white/10">
        <div className="max-w-6xl mx-auto flex items-center justify-between p-4">
          <Link to="/" className="font-display text-xl">Karma Aligns</Link>
          <div className="flex items-center gap-3">
            <ModeToggle />
            <SoundToggle />
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto p-4 md:p-6">
        <Routes>
          <Route path="/" element={<Home />} />
        </Routes>
      </main>
    </div>
  )
}
