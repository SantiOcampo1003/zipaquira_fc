/** Posición en cancha (%). y=0 arriba (ataque), y=100 abajo (portería). */
export type PitchPoint = { x: number; y: number };

export const FORMATION_OPTIONS = ["4-3-3", "4-1-4-1", "4-4-2", "3-5-2"] as const;

export type FormationId = (typeof FORMATION_OPTIONS)[number];

export const FORMATION_SLOTS: Record<string, Record<string, PitchPoint>> = {
  "4-3-3": {
    GK: { x: 50, y: 90 },
    LB: { x: 14, y: 68 },
    LCB: { x: 32, y: 72 },
    RCB: { x: 68, y: 72 },
    RB: { x: 86, y: 68 },
    LCM: { x: 28, y: 48 },
    CM: { x: 50, y: 44 },
    RCM: { x: 72, y: 48 },
    LW: { x: 18, y: 18 },
    ST: { x: 50, y: 12 },
    RW: { x: 82, y: 18 },
  },
  "4-1-4-1": {
    GK: { x: 50, y: 90 },
    LB: { x: 14, y: 68 },
    LCB: { x: 32, y: 72 },
    RCB: { x: 68, y: 72 },
    RB: { x: 86, y: 68 },
    CDM: { x: 50, y: 56 },
    LM: { x: 16, y: 36 },
    LCM: { x: 38, y: 32 },
    RCM: { x: 62, y: 32 },
    RM: { x: 84, y: 36 },
    ST: { x: 50, y: 12 },
  },
  "4-4-2": {
    GK: { x: 50, y: 90 },
    LB: { x: 14, y: 68 },
    LCB: { x: 32, y: 72 },
    RCB: { x: 68, y: 72 },
    RB: { x: 86, y: 68 },
    LM: { x: 16, y: 42 },
    LCM: { x: 38, y: 46 },
    RCM: { x: 62, y: 46 },
    RM: { x: 84, y: 42 },
    LST: { x: 38, y: 14 },
    RST: { x: 62, y: 14 },
  },
  "3-5-2": {
    GK: { x: 50, y: 90 },
    LCB: { x: 28, y: 72 },
    CB: { x: 50, y: 74 },
    RCB: { x: 72, y: 72 },
    LWB: { x: 12, y: 48 },
    LCM: { x: 32, y: 44 },
    CM: { x: 50, y: 42 },
    RCM: { x: 68, y: 44 },
    RWB: { x: 88, y: 48 },
    LST: { x: 40, y: 14 },
    RST: { x: 60, y: 14 },
  },
};

/** Si el slot no existe en la formación del partido, prueba equivalentes (p. ej. CM → CDM). */
const SLOT_ALIASES: Record<string, string[]> = {
  CM: ["CDM"],
  CDM: ["CM"],
  LW: ["LM"],
  LM: ["LW"],
  RW: ["RM"],
  RM: ["RW"],
  ST: ["LST", "RST"],
  LST: ["ST"],
  RST: ["ST"],
};

const SLOT_REMAP_TO: Record<string, Record<string, string>> = {
  "4-1-4-1": { CM: "CDM", LW: "LM", RW: "RM" },
  "4-4-2": { CM: "LCM", LW: "LM", RW: "RM", ST: "LST" },
  "3-5-2": {
    LB: "LWB",
    RB: "RWB",
    LCB: "LCB",
    RCB: "RCB",
    CM: "CM",
    LW: "LWB",
    RW: "RWB",
    ST: "LST",
  },
  "4-3-3": { CDM: "CM", LM: "LW", RM: "RW", LST: "ST", RST: "ST", LWB: "LB", RWB: "RB", CB: "LCB" },
};

export function getFormationSlotIds(formation: string): string[] {
  const slots = FORMATION_SLOTS[formation];
  if (slots) return Object.keys(slots);
  return Object.keys(FORMATION_SLOTS["4-3-3"]);
}

export function getNextAvailableSlot(formation: string, used: Iterable<string>): string {
  const usedSet = new Set(used);
  for (const slot of getFormationSlotIds(formation)) {
    if (!usedSet.has(slot)) return slot;
  }
  return getFormationSlotIds(formation).at(-1) ?? "CM";
}

export function defaultPitchSlot(formation: string, used: Iterable<string> = []): string {
  return getNextAvailableSlot(formation, used);
}

type SlotMember = {
  player_id: string;
  is_starter: boolean;
  pitch_slot: string | null;
  player?: { position?: string };
};

/** Reparte titulares en posiciones únicas según la formación (GK primero si hay arquero). */
export function normalizeStarterSlots<T extends SlotMember>(squad: T[], formation: string): T[] {
  const slotOrder = getFormationSlotIds(formation);
  const starters = squad.filter((s) => s.is_starter);
  const assignments = new Map<string, string>();
  const usedSlots = new Set<string>();

  const gkSlot = slotOrder.find((s) => s === "GK");
  const gkStarter = starters.find((s) => s.player?.position === "GK");
  if (gkSlot && gkStarter) {
    assignments.set(gkStarter.player_id, gkSlot);
    usedSlots.add(gkSlot);
  }

  for (const starter of starters) {
    if (assignments.has(starter.player_id)) continue;
    const slot = slotOrder.find((s) => !usedSlots.has(s));
    if (!slot) break;
    assignments.set(starter.player_id, slot);
    usedSlots.add(slot);
  }

  return squad.map((member) => {
    if (!member.is_starter) {
      return { ...member, pitch_slot: null };
    }
    return {
      ...member,
      pitch_slot: assignments.get(member.player_id) ?? member.pitch_slot,
    };
  });
}

export function hasDuplicateStarterSlots(
  squad: Array<{ is_starter: boolean; pitch_slot: string | null }>
): boolean {
  const seen = new Set<string>();
  for (const member of squad) {
    if (!member.is_starter || !member.pitch_slot) continue;
    if (seen.has(member.pitch_slot)) return true;
    seen.add(member.pitch_slot);
  }
  return false;
}

export function remapPitchSlot(slot: string, targetFormation: string): string {
  const slots = getFormationSlotIds(targetFormation);
  if (slots.includes(slot)) return slot;

  const mapped = SLOT_REMAP_TO[targetFormation]?.[slot];
  if (mapped && slots.includes(mapped)) return mapped;

  for (const alias of SLOT_ALIASES[slot] ?? []) {
    if (slots.includes(alias)) return alias;
  }

  return defaultPitchSlot(targetFormation, []);
}

export function getPitchPoint(formation: string, slot: string): PitchPoint | null {
  const map = FORMATION_SLOTS[formation] ?? FORMATION_SLOTS["4-3-3"];
  if (map[slot]) return map[slot];

  for (const alias of SLOT_ALIASES[slot] ?? []) {
    if (map[alias]) return map[alias];
  }

  return FORMATION_SLOTS["4-3-3"]?.[slot] ?? null;
}
