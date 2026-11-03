/**
 * Voice Profile System for DungeonsAPP
 * Defines voice profiles for DM narrator, NPCs, monsters, etc.
 * Uses Web Speech API (SpeechSynthesis)
 */

export type VoiceRole = 'narrator' | 'npc' | 'monster' | 'custom';

export interface VoiceProfile {
  id: string;
  name: string;
  voiceURI: string;
  lang: string;
  rate: number;      // 0.1 - 10, default 1
  pitch: number;     // 0 - 2, default 1
  volume: number;    // 0 - 1, default 1
  role: VoiceRole;
  isDefault?: boolean;
}

export interface VoiceProfileState {
  profiles: VoiceProfile[];
  activeProfileId: string;
  enabled: boolean;
}

// Default voice profiles - will be populated with actual voices at runtime
export const DEFAULT_VOICE_PROFILES: Omit<VoiceProfile, 'voiceURI'>[] = [
  {
    id: 'narrator',
    name: 'DM Narrator',
    lang: 'en-US',
    rate: 0.95,
    pitch: 1.0,
    volume: 1.0,
    role: 'narrator',
    isDefault: true,
  },
  {
    id: 'npc-female',
    name: 'NPC Female',
    lang: 'en-US',
    rate: 1.0,
    pitch: 1.2,
    volume: 1.0,
    role: 'npc',
  },
  {
    id: 'npc-male',
    name: 'NPC Male',
    lang: 'en-US',
    rate: 1.0,
    pitch: 0.9,
    volume: 1.0,
    role: 'npc',
  },
  {
    id: 'monster',
    name: 'Monster / Villain',
    lang: 'en-US',
    rate: 0.85,
    pitch: 0.6,
    volume: 1.0,
    role: 'monster',
  },
  {
    id: 'custom-1',
    name: 'Custom Voice 1',
    lang: 'en-US',
    rate: 1.0,
    pitch: 1.0,
    volume: 1.0,
    role: 'custom',
  },
];

export function createVoiceProfiles(voices: SpeechSynthesisVoice[]): VoiceProfile[] {
  const profileMap = new Map(DEFAULT_VOICE_PROFILES.map(p => [p.id, p]));

  // Try to find good matches for each role
  const narratorVoice = voices.find(v =>
    v.lang.startsWith('en') &&
    (v.name.toLowerCase().includes('google') || v.name.toLowerCase().includes('microsoft') || v.name.toLowerCase().includes('alex') || v.name.toLowerCase().includes('daniel'))
  ) || voices.find(v => v.lang.startsWith('en')) || voices[0];

  const femaleVoice = voices.find(v =>
    v.lang.startsWith('en') &&
    (v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('samantha') || v.name.toLowerCase().includes('victoria') || v.name.toLowerCase().includes('karen'))
  ) || voices.find(v => v.lang.startsWith('en') && !v.name.toLowerCase().includes('male')) || narratorVoice;

  const maleVoice = voices.find(v =>
    v.lang.startsWith('en') &&
    (v.name.toLowerCase().includes('male') || v.name.toLowerCase().includes('alex') || v.name.toLowerCase().includes('daniel') || v.name.toLowerCase().includes('tom'))
  ) || voices.find(v => v.lang.startsWith('en')) || narratorVoice;

  const monsterVoice = voices.find(v =>
    v.lang.startsWith('en') &&
    (v.name.toLowerCase().includes('deep') || v.name.toLowerCase().includes('bass') || v.name.toLowerCase().includes('dark'))
  ) || maleVoice;

  return [
    { ...profileMap.get('narrator')!, voiceURI: narratorVoice?.voiceURI || '' },
    { ...profileMap.get('npc-female')!, voiceURI: femaleVoice?.voiceURI || '' },
    { ...profileMap.get('npc-male')!, voiceURI: maleVoice?.voiceURI || '' },
    { ...profileMap.get('monster')!, voiceURI: monsterVoice?.voiceURI || '' },
    { ...profileMap.get('custom-1')!, voiceURI: voices[0]?.voiceURI || '' },
  ];
}

export function getDefaultVoiceProfiles(): VoiceProfile[] {
  // Return defaults without voiceURI - will be populated when voices load
  return DEFAULT_VOICE_PROFILES.map(p => ({ ...p, voiceURI: '' }));
}

export const VOICE_ROLE_LABELS: Record<VoiceRole, string> = {
  narrator: 'DM Narrator',
  npc: 'NPC',
  monster: 'Monster',
  custom: 'Custom',
};

export const VOICE_ROLE_ICONS: Record<VoiceRole, string> = {
  narrator: '📖',
  npc: '🎭',
  monster: '🐉',
  custom: '✨',
};