# Karma Aligns — SPA (Vite + React + TS)

Implements the **Adaptive Cosmic Design System (v2.1)** from STYLE_GUIDE, uses the new lightweight API endpoints, and keeps `/compute` compatibility.

## Quick start

```bash
cp .env.example .env.local
# edit VITE_API_BASE if your backend is not at http://127.0.0.1:5000/api/v1
npm i
npm run dev
```

Open http://localhost:5173

## Design system

- Dark mode default (`html.theme-dark`), light mode available via toggle
- Ritual vs Analyst modes toggle
- Glassmorphism cards, gradient orb buttons, floating labels
- Prefers-reduced-motion respected

## Where to add features next

- Add hooks for `/vargas`, `/table`, `/dasha`, `/varsha`, `/acg`
- Create a Leaflet map page to draw ACG lines
- Generate TS types from OpenAPI:
  ```bash
  npx openapi-typescript $VITE_API_BASE/../openapi/sage-astro.yaml -o src/types/openapi.d.ts
  ```
