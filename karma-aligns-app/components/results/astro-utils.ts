export const SIGNS = [
    "Aries","Taurus","Gemini","Cancer","Leo","Virgo",
    "Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces",
  ];
  
  export function signFromLon(lon: number | null | undefined): number | null {
    if (typeof lon !== "number" || !isFinite(lon)) return null;
    let x = lon % 360; if (x < 0) x += 360;
    return Math.floor(x / 30); // 0..11
  }
  
  export function fmtDeg(dm: number) {
    if (!isFinite(dm)) return "—";
    let d = Math.floor(dm);
    const mfloat = (dm - d) * 60;
    const m = Math.floor(mfloat);
    const s = Math.round((mfloat - m) * 60);
    return `${d}°${m.toString().padStart(2,"0")}'${s.toString().padStart(2,"0")}"`;
  }
  
  export function degInSign(lon: number) {
    let x = lon % 360; if (x < 0) x += 360;
    const signIdx = Math.floor(x / 30);
    const within = x - signIdx * 30;
    return { signIdx, within };
  }
  