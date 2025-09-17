export function wittyHouseLine(id:number, stronger:boolean) {
    const map: Record<number,string[]> = {
      7: ["House 7 is vibing harder than your Spotify Wrapped collab."],
      12:["House 12 weak → your inner introvert just rage-quit."],
    };
    const custom = map[id]?.[0];
    if (custom) return custom;
    return stronger ? `House ${id} is in Boss Mode — main-character energy.` : `House ${id} needs a lil boost — low-battery vibes.`;
  }
  
  export const emojiForBucket = {
    boss: "👑", steady: "⚖️", boost: "🪫", support: "🫂",
  };
  