/**
 * LLM Integration - Character parsing, rules guidance, narrative suggestions
 * Uses Vercel AI SDK with OpenAI GPT-4o-mini
 */

import type { UniversalCharacter, AbilityScore } from '@/lib/character/types';
import { getSettings } from '@/lib/storage/indexeddb';
import { generateObject, generateText, streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

// Character parsing schema
const CharacterParseSchema = z.object({
  portrait: z.object({
    name: z.string(),
    class: z.string(),
    subclass: z.string().optional(),
    level: z.number().int().min(1).max(20),
    race: z.string(),
    background: z.string(),
    alignment: z.string(),
    experience: z.number().int().min(0),
    personalityTraits: z.array(z.string()),
    ideals: z.array(z.string()),
    bonds: z.array(z.string()),
    flaws: z.array(z.string()),
    backstory: z.string(),
    appearance: z.string(),
  }),
  abilities: z.object({
    strength: z.number().int().min(1).max(30),
    dexterity: z.number().int().min(1).max(30),
    constitution: z.number().int().min(1).max(30),
    intelligence: z.number().int().min(1).max(30),
    wisdom: z.number().int().min(1).max(30),
    charisma: z.number().int().min(1).max(30),
  }),
  stats: z.object({
    hp: z.object({ current: z.number().int(), max: z.number().int(), temp: z.number().int() }),
    hitDice: z.object({ total: z.number().int(), used: z.number().int(), die: z.number().int() }),
    ac: z.number().int(),
    initiative: z.number().int(),
    speed: z.number().int(),
    proficiencyBonus: z.number().int(),
    inspiration: z.boolean(),
    deathSaves: z.object({ success: z.number().int(), failure: z.number().int() }),
    exhaustion: z.number().int(),
  }),
  skills: z.array(z.object({
    name: z.string(),
    ability: z.enum(['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma']),
    proficient: z.boolean(),
    expertise: z.boolean(),
    bonus: z.number().int(),
  })),
  savingThrows: z.array(z.object({
    ability: z.enum(['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma']),
    proficient: z.boolean(),
    bonus: z.number().int(),
  })),
  attacks: z.array(z.object({
    id: z.string(),
    name: z.string(),
    type: z.enum(['melee', 'ranged', 'spell']),
    ability: z.enum(['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma']),
    proficient: z.boolean(),
    damage: z.string(),
    damageType: z.string(),
    notes: z.string().optional(),
  })),
  spellcasting: z.object({
    ability: z.enum(['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma']),
    spellSaveDC: z.number().int(),
    spellAttackBonus: z.number().int(),
    spells: z.record(z.number(), z.array(z.object({
      id: z.string(),
      name: z.string(),
      level: z.number().int().min(0).max(9),
      school: z.string(),
      castingTime: z.string(),
      range: z.string(),
      components: z.string(),
      duration: z.string(),
      description: z.string(),
      prepared: z.boolean().optional(),
      slotsUsed: z.number().int().optional(),
    }))),
    slots: z.record(z.number(), z.object({ used: z.number().int(), total: z.number().int() })),
  }).optional(),
  equipment: z.array(z.object({
    id: z.string(),
    name: z.string(),
    quantity: z.number().int(),
    weight: z.number().optional(),
    value: z.string().optional(),
    description: z.string().optional(),
    equipped: z.boolean(),
    type: z.enum(['weapon', 'armor', 'consumable', 'tool', 'treasure', 'other']),
  })),
  features: z.array(z.object({
    id: z.string(),
    name: z.string(),
    source: z.string(),
    description: z.string(),
    level: z.number().int().optional(),
    uses: z.object({ current: z.number().int(), max: z.number().int(), reset: z.enum(['short', 'long', 'none']) }).optional(),
  })),
  conditions: z.array(z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    duration: z.string().optional(),
    severity: z.enum(['minor', 'moderate', 'severe']).optional(),
  })),
  currency: z.object({
    cp: z.number().int(),
    sp: z.number().int(),
    ep: z.number().int(),
    gp: z.number().int(),
    pp: z.number().int(),
  }),
  sourceFormat: z.enum(['5e', 'pathfinder', 'osr', 'homebrew', 'manual']).optional(),
  rawData: z.record(z.unknown()).optional(),
});

const RulesGuidanceSchema = z.object({
  ruling: z.string(),
  explanation: z.string(),
  relevantRules: z.array(z.string()),
  alternatives: z.array(z.string()),
  confidence: z.number().min(0).max(1),
});

const NarrativeSuggestionsSchema = z.object({
  suggestions: z.array(z.object({
    type: z.string(),
    title: z.string(),
    description: z.string(),
    hooks: z.array(z.string()),
    difficulty: z.string().optional(),
  })),
  tone: z.string(),
  themes: z.array(z.string()),
});

const NPCSchema = z.object({
  name: z.string(),
  race: z.string(),
  role: z.string(),
  personality: z.array(z.string()),
  appearance: z.string(),
  motivation: z.string(),
  secret: z.string(),
  stats: z.object({
    hp: z.number().int(),
    ac: z.number().int(),
    attacks: z.array(z.string()),
  }),
});

async function getApiKey(): Promise<string | undefined> {
  const settings = await getSettings();
  return settings.llmApiKey;
}

function getModel() {
  return openai('gpt-4o-mini');
}

/**
 * Parse character sheet from text/OCR output into UniversalCharacter
 */
export async function parseCharacterFromText(text: string): Promise<UniversalCharacter> {
  const apiKey = await getApiKey();
  if (!apiKey) {
    throw new Error('LLM API key not configured. Add it in Settings.');
  }

  const { object } = await generateObject({
    model: getModel(),
    schema: CharacterParseSchema,
    system: `You are an expert D&D character parser. Convert messy character sheet text into a structured UniversalCharacter.
    Handle 5e, Pathfinder, OSR, and homebrew formats. Be flexible with input formats.
    For missing fields, use sensible defaults (level 1, standard array abilities, etc.).
    Always include all required fields in the output.`,
    prompt: `Parse this character sheet text into a UniversalCharacter:\n\n${text}`,
    temperature: 0.1,
  });

  // Calculate modifiers from abilities
  const calculateModifier = (score: number) => Math.floor((score - 10) / 2);
  const modifiers = {
    strength: calculateModifier(object.abilities.strength),
    dexterity: calculateModifier(object.abilities.dexterity),
    constitution: calculateModifier(object.abilities.constitution),
    intelligence: calculateModifier(object.abilities.intelligence),
    wisdom: calculateModifier(object.abilities.wisdom),
    charisma: calculateModifier(object.abilities.charisma),
  };

  const now = new Date().toISOString();
  return {
    ...object,
    modifiers,
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
    version: 1,
  } as UniversalCharacter;
}

/**
 * Get rules guidance for a situation
 */
export async function getRulesGuidance(
  situation: string,
  character?: UniversalCharacter
): Promise<{
  ruling: string;
  explanation: string;
  relevantRules: string[];
  alternatives: string[];
  confidence: number;
}> {
  const apiKey = await getApiKey();
  if (!apiKey) {
    throw new Error('LLM API key not configured.');
  }

  const characterContext = character
    ? `\n\nCharacter Context:\n- Name: ${character.portrait.name}\n- Class: ${character.portrait.class} ${character.portrait.subclass ? `(${character.portrait.subclass})` : ''} Level ${character.portrait.level}\n- Race: ${character.portrait.race}\n- Key Abilities: Str ${character.abilities.strength}, Dex ${character.abilities.dexterity}, Con ${character.abilities.constitution}, Int ${character.abilities.intelligence}, Wis ${character.abilities.wisdom}, Cha ${character.abilities.charisma}\n- Proficiency: +${character.stats.proficiencyBonus}`
    : '';

  const { object } = await generateObject({
    model: getModel(),
    schema: RulesGuidanceSchema,
    system: `You are a D&D rules expert. Provide clear, practical rulings for the DM.
    Base rulings on D&D 5e rules primarily, but note when other editions differ.
    Always cite relevant rulebook sections when possible.
    Be concise but thorough. Give the DM confidence to rule at the table.`,
    prompt: `Situation: ${situation}${characterContext}\n\nProvide a ruling with explanation, relevant rules, alternatives, and confidence (0-1).`,
    temperature: 0.2,
  });

  return object;
}

/**
 * Get narrative suggestions for the current scene
 */
export async function getNarrativeSuggestions(
  context: {
    sceneType: 'combat' | 'social' | 'exploration' | 'rest' | 'revelation';
    location: string;
    npcs: string[];
    partyLevel: number;
    partyComposition: string[];
    recentEvents: string[];
    tone?: string;
  }
): Promise<{
  suggestions: Array<{
    type: string;
    title: string;
    description: string;
    hooks: string[];
    difficulty?: string;
  }>;
  tone: string;
  themes: string[];
}> {
  const apiKey = await getApiKey();
  if (!apiKey) {
    throw new Error('LLM API key not configured.');
  }

  const { object } = await generateObject({
    model: getModel(),
    schema: NarrativeSuggestionsSchema,
    system: `You are a D&D narrative designer. Generate evocative scene suggestions for the DM.
    Match the scene type, location, and party level. Provide concrete hooks the players can act on.
    Include variety: combat, mystery, social, environmental, discovery.`,
    prompt: `Scene Type: ${context.sceneType}
Location: ${context.location}
NPCs Present: ${context.npcs.join(', ') || 'None'}
Party Level: ${context.partyLevel}
Party: ${context.partyComposition.join(', ')}
Recent Events: ${context.recentEvents.join('; ') || 'None'}
Tone: ${context.tone || 'adventure'}

Generate 3-5 narrative suggestions with hooks.`,
    temperature: 0.7,
  });

  return object;
}

/**
 * Generate a quick NPC
 */
export async function generateNPC(prompt: string): Promise<{
  name: string;
  race: string;
  role: string;
  personality: string[];
  appearance: string;
  motivation: string;
  secret: string;
  stats: { hp: number; ac: number; attacks: string[] };
}> {
  const apiKey = await getApiKey();
  if (!apiKey) {
    throw new Error('LLM API key not configured.');
  }

  const { object } = await generateObject({
    model: getModel(),
    schema: NPCSchema,
    system: `You are a D&D NPC generator. Create memorable, usable NPCs quickly.
    Include distinctive personality, appearance, motivation, and a secret.
    Provide basic stats for potential combat. Keep it concise but evocative.`,
    prompt: `Generate an NPC: ${prompt}`,
    temperature: 0.8,
  });

  return object;
}

/**
 * Stream a narrative response (for real-time feel)
 */
export async function* streamNarrative(
  prompt: string,
  systemPrompt: string = 'You are a D&D narrator. Write evocative, sensory prose. Second person. Present tense. Show, don\'t tell. Keep paragraphs short.'
) {
  const apiKey = await getApiKey();
  if (!apiKey) {
    throw new Error('LLM API key not configured.');
  }

  const { textStream } = await streamText({
    model: getModel(),
    system: systemPrompt,
    prompt,
    temperature: 0.8,
    maxTokens: 500,
  });

  for await (const chunk of textStream) {
    yield chunk;
  }
}