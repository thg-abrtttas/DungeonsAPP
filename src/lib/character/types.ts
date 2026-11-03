/**
 * Universal Character Model - Edition-agnostic representation
 * Normalizes 5e, Pathfinder, OSR, homebrew into a common format
 */

export type AbilityScore = 'strength' | 'dexterity' | 'constitution' | 'intelligence' | 'wisdom' | 'charisma';

export interface AbilityScores {
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
}

export interface AbilityModifiers {
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
}

export interface Skill {
  name: string;
  ability: AbilityScore;
  proficient: boolean;
  expertise: boolean;
  bonus: number;
}

export interface SavingThrow {
  ability: AbilityScore;
  proficient: boolean;
  bonus: number;
}

export interface Attack {
  id: string;
  name: string;
  type: 'melee' | 'ranged' | 'spell';
  ability: AbilityScore;
  proficient: boolean;
  damage: string; // e.g., "1d8+3"
  damageType: string;
  notes?: string;
}

export interface Spell {
  id: string;
  name: string;
  level: number; // 0 = cantrip
  school: string;
  castingTime: string;
  range: string;
  components: string;
  duration: string;
  description: string;
  prepared?: boolean;
  slotsUsed?: number;
}

export interface Spellcasting {
  ability: AbilityScore;
  spellSaveDC: number;
  spellAttackBonus: number;
  spells: Record<number, Spell[]>; // level -> spells
  slots: Record<number, { used: number; total: number }>;
}

export interface Equipment {
  id: string;
  name: string;
  quantity: number;
  weight?: number;
  value?: string;
  description?: string;
  equipped: boolean;
  type: 'weapon' | 'armor' | 'consumable' | 'tool' | 'treasure' | 'other';
}

export interface Feature {
  id: string;
  name: string;
  source: string; // class, race, background, feat, item
  description: string;
  level?: number;
  uses?: { current: number; max: number; reset: 'short' | 'long' | 'none' };
}

export interface Condition {
  id: string;
  name: string;
  description: string;
  duration?: string;
  severity?: 'minor' | 'moderate' | 'severe';
}

export interface Currency {
  cp: number;
  sp: number;
  ep: number;
  gp: number;
  pp: number;
}

export interface CharacterPortrait {
  name: string;
  class: string;
  subclass?: string;
  level: number;
  race: string;
  background: string;
  alignment: string;
  experience: number;
  // Narrative fields
  personalityTraits: string[];
  ideals: string[];
  bonds: string[];
  flaws: string[];
  backstory: string;
  appearance: string;
  // Visual
  imageUrl?: string;
  colorTheme?: string;
}

export interface CharacterStats {
  hp: { current: number; max: number; temp: number };
  hitDice: { total: number; used: number; die: number };
  ac: number;
  initiative: number;
  speed: number;
  proficiencyBonus: number;
  inspiration: boolean;
  deathSaves: { success: number; failure: number };
  exhaustion: number;
}

export interface UniversalCharacter {
  id: string;
  createdAt: string;
  updatedAt: string;
  version: number; // for migration
  // Core identity
  portrait: CharacterPortrait;
  // Mechanics
  abilities: AbilityScores;
  modifiers: AbilityModifiers;
  stats: CharacterStats;
  skills: Skill[];
  savingThrows: SavingThrow[];
  attacks: Attack[];
  spellcasting?: Spellcasting;
  equipment: Equipment[];
  features: Feature[];
  conditions: Condition[];
  currency: Currency;
  // Meta
  sourceFormat?: '5e' | 'pathfinder' | 'osr' | 'homebrew' | 'manual';
  rawData?: Record<string, unknown>; // Original parsed data for re-export
}

export const ABILITIES: AbilityScore[] = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];

export const ABILITY_LABELS: Record<AbilityScore, string> = {
  strength: 'Strength',
  dexterity: 'Dexterity',
  constitution: 'Constitution',
  intelligence: 'Intelligence',
  wisdom: 'Wisdom',
  charisma: 'Charisma',
};

export const ABILITY_ABBREVS: Record<AbilityScore, string> = {
  strength: 'STR',
  dexterity: 'DEX',
  constitution: 'CON',
  intelligence: 'INT',
  wisdom: 'WIS',
  charisma: 'CHA',
};

export function calculateModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

export function calculateModifiers(abilities: AbilityScores): AbilityModifiers {
  return {
    strength: calculateModifier(abilities.strength),
    dexterity: calculateModifier(abilities.dexterity),
    constitution: calculateModifier(abilities.constitution),
    intelligence: calculateModifier(abilities.intelligence),
    wisdom: calculateModifier(abilities.wisdom),
    charisma: calculateModifier(abilities.charisma),
  };
}

export function calculateProficiencyBonus(level: number): number {
  return Math.ceil((level + 1) / 4) + 1; // 1-4: +2, 5-8: +3, 9-12: +4, 13-16: +5, 17-20: +6
}

export function createEmptyCharacter(): Omit<UniversalCharacter, 'id' | 'createdAt' | 'updatedAt' | 'version'> {
  return {
    portrait: {
      name: '',
      class: '',
      level: 1,
      race: '',
      background: '',
      alignment: 'Neutral',
      experience: 0,
      personalityTraits: [],
      ideals: [],
      bonds: [],
      flaws: [],
      backstory: '',
      appearance: '',
    },
    abilities: {
      strength: 10,
      dexterity: 10,
      constitution: 10,
      intelligence: 10,
      wisdom: 10,
      charisma: 10,
    },
    modifiers: {
      strength: 0,
      dexterity: 0,
      constitution: 0,
      intelligence: 0,
      wisdom: 0,
      charisma: 0,
    },
    stats: {
      hp: { current: 10, max: 10, temp: 0 },
      hitDice: { total: 1, used: 0, die: 8 },
      ac: 10,
      initiative: 0,
      speed: 30,
      proficiencyBonus: 2,
      inspiration: false,
      deathSaves: { success: 0, failure: 0 },
      exhaustion: 0,
    },
    skills: [],
    savingThrows: [],
    attacks: [],
    equipment: [],
    features: [],
    conditions: [],
    currency: { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 },
  };
}