// components/copy/bhavabalaCopy.ts

type HouseId =
  | "1st" | "2nd" | "3rd" | "4th" | "5th" | "6th"
  | "7th" | "8th" | "9th" | "10th" | "11th" | "12th";

function bucket(score: number) {
  if (score >= 0.85) return "S";
  if (score >= 0.70) return "A";
  if (score >= 0.55) return "B";
  if (score >= 0.40) return "C";
  return "D";
}

/** Gen-Z one-liner for house cards / quick reads */
export function wittyHouseLine(id: HouseId, score: number): string {
  const b = bucket(score);
  const pct = Math.round(score * 100);

  const lines: Record<HouseId, Record<string, string>> = {
    "1st": {
      S: "Main-character energy unlocked.",
      A: "You’re the moment—own the room.",
      B: "Glow’s on; keep it steady.",
      C: "Low battery—mini vitality ritual.",
      D: "Rest, hydrate, reboot avatar.",
    },
    "2nd": {
      S: "Money voice is loud & clear.",
      A: "Resources stacking—speak your value.",
      B: "Solid—track & tweak.",
      C: "Tidy the money inbox.",
      D: "Freeze impulse spend; plan one meal.",
    },
    "3rd": {
      S: "DMs bold, reps strong. Ship it.",
      A: "Say it out loud—then again.",
      B: "Keep the reps rolling.",
      C: "One brave message today.",
      D: "Micro-write 10 minutes.",
    },
    "4th": {
      S: "Home = charging dock at 100%.",
      A: "Cozy core online—protect it.",
      B: "Good base—sleep on schedule.",
      C: "Reset one corner.",
      D: "Early wind-down & screens off.",
    },
    "5th": {
      S: "Creative main quest, no side quests.",
      A: "Sparkling—share the draft.",
      B: "Warm—make a tiny demo.",
      C: "10-min play sprint.",
      D: "Consume less, doodle more.",
    },
    "6th": {
      S: "Systems purring; chores speed-run.",
      A: "Admin beast mode—batch it.",
      B: "Checklists doing work.",
      C: "Do one boring essential.",
      D: "Start a 5-min clean slate.",
    },
    "7th": {
      S: "Allies assemble—win together.",
      A: "Mirror strong—negotiate kindly.",
      B: "Sync up, set expectations.",
      C: "Repair one thread.",
      D: "Ask small, clear, kind.",
    },
    "8th": {
      S: "Alchemist arc—transform & level up.",
      A: "Deep work, deep trust.",
      B: "Name the risks; proceed.",
      C: "Document one risk, one boundary.",
      D: "Simplify; cut one entanglement.",
    },
    "9th": {
      S: "Luck loves your prep—go long.",
      A: "Belief + reps = momentum.",
      B: "Stay curious; note insights.",
      C: "Read 10 mins; one takeaway.",
      D: "Shrink goals; keep faith practical.",
    },
    "10th": {
      S: "Public scoreboard going brrr.",
      A: "Ship visibly; archive the W.",
      B: "Steady output beats noise.",
      C: "Post one tiny win.",
      D: "Scope ruthlessly; one tile today.",
    },
    "11th": {
      S: "Network compounding—introduce two.",
      A: "Collab lane is green.",
      B: "Light pings keep it warm.",
      C: "Nudge one ally.",
      D: "Declutter channels; reply kindly.",
    },
    "12th": {
      S: "Quiet luxury: your nervous system.",
      A: "Sacred off-time = superpower.",
      B: "Protect margins.",
      C: "Schedule 15 min solitude.",
      D: "Log off; breathe; reset.",
    },
  };

  const text = lines[id][b] ?? "Signal incoming.";
  return `${text} (${pct}%)`;
}

/** Spotlight: meaning of each house */
export const houseSignificance: Record<HouseId, string> = {
  "1st": "Self, vitality, identity, the way you start anything.",
  "2nd": "Resources, voice, values, cashflow and nourishment.",
  "3rd": "Communication, siblings, skills through repetition.",
  "4th": "Home, roots, rest, emotional security.",
  "5th": "Creativity, play, romance, children, performance.",
  "6th": "Habits, service, health, daily maintenance.",
  "7th": "Partnerships, contracts, mirrors, clients.",
  "8th": "Mergers, shared resources, transformations, taboos.",
  "9th": "Beliefs, higher learning, long journeys, luck.",
  "10th": "Career, reputation, public output, authority.",
  "11th": "Allies, networks, communities, aspirations.",
  "12th": "Solitude, endings, sleep, surrender, the unconscious.",
};

/** Spotlight panel: if this house is strong, do… */
export const ifStrongHouse: Record<HouseId, string[]> = {
  "1st": ["Lead visibly.", "Start the thing now.", "Lock sleep + sunlight."],
  "2nd": ["Price confidently.", "Batch financial hygiene.", "Eat for energy, not drama."],
  "3rd": ["Publish tiny, often.", "Stack reps on one skill.", "Say the brave thing kindly."],
  "4th": ["Optimize sleep ritual.", "Declutter one hotspot.", "Cook a comfort meal."],
  "5th": ["Make art public.", "Play produces breakthroughs.", "Date night / creative sprint."],
  "6th": ["Automate chores.", "One checklist to rule them all.", "Pomodoro the admin."],
  "7th": ["Renegotiate kindly.", "Plan co-wins.", "Make one clear ask."],
  "8th": ["Consolidate debt / subs.", "Therapy / shadow work.", "Build an emergency buffer."],
  "9th": ["Outline a long arc.", "Read + annotate daily.", "Teach what you learn."],
  "10th": ["Ship a portfolio tile.", "Ask for testimonials.", "Present the roadmap."],
  "11th": ["Host a tiny circle.", "Make 2 intros.", "Write a ‘help wanted’."],
  "12th": ["Book a retreat day.", "No-screen block nightly.", "Journal & release."],
};

/** Spotlight panel: if this house is weak, try… */
export const ifWeakHouse: Record<HouseId, string[]> = {
  "1st": ["Micro-walk + water.", "Dress for momentum.", "One decision → action."],
  "2nd": ["Freeze impulse buys.", "Reconcile one account.", "Cook once; leftovers twice."],
  "3rd": ["Send one message.", "5-sentence journal.", "Practice 10 minutes."],
  "4th": ["Clear one drawer.", "Early lights-out.", "One comfort call."],
  "5th": ["Sketch ugly for 10 minutes.", "Copy a master once.", "Share to one friend."],
  "6th": ["One boring essential.", "Set meds/supps reminder.", "Two-minute tidy rule."],
  "7th": ["Write a repair note.", "Name your boundary.", "Ask small, specific, kind."],
  "8th": ["Cancel one unused sub.", "Name a fear out loud.", "Simplify a commitment."],
  "9th": ["Read 2 pages.", "Write one note.", "Talk to a mentor."],
  "10th": ["Scope to 25 minutes.", "Share progress not perfection.", "Batch admin, then create."],
  "11th": ["Reply to one DM.", "Thank a collaborator.", "Join a tiny cohort."],
  "12th": ["Phone on airplane.", "10 slow breaths.", "Close one loop before sleep."],
};
