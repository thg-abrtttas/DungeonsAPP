'use client';

import React from 'react';
import { useState, useCallback } from 'react';
import { ArrowLeft, ArrowRight, Sparkles, Heart, Shield, Sword, BookOpen, MapPin, Dice1, User, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { CharacterPortrait } from '@/components/CharacterPortrait';
import { DiceRoller } from '@/components/DiceRoller';
import { saveCharacter } from '@/lib/storage/indexeddb';
import { calculateModifiers, calculateProficiencyBonus, ABILITIES, ABILITY_LABELS, ABILITY_ABBREVS, type UniversalCharacter, type AbilityScore, createEmptyCharacter } from '@/lib/character/types';
import { cn, generateId } from '@/lib/utils';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const CLASS_ARCHETYPES = [
  { id: 'fighter', name: 'Fighter', icon: Sword, desc: 'Master of weapons and armor', style: 'Combat & durability' },
  { id: 'wizard', name: 'Wizard', icon: BookOpen, desc: 'Scholar of arcane magic', style: 'Spellcasting & utility' },
  { id: 'cleric', name: 'Cleric', icon: Heart, desc: 'Divine servant and healer', style: 'Support & magic' },
  { id: 'rogue', name: 'Rogue', icon: Dice1, desc: 'Stealthy skill specialist', style: 'Skills & precision' },
  { id: 'ranger', name: 'Ranger', icon: MapPin, desc: 'Wilderness hunter', style: 'Exploration & ranged' },
  { id: 'paladin', name: 'Paladin', icon: Shield, desc: 'Holy warrior', style: 'Combat & support' },
  { id: 'barbarian', name: 'Barbarian', icon: Sword, desc: 'Primal rage warrior', style: 'Pure damage' },
  { id: 'bard', name: 'Bard', icon: BookOpen, desc: 'Charismatic performer', style: 'Social & magic' },
  { id: 'druid', name: 'Druid', icon: MapPin, desc: 'Nature shapeshifter', style: 'Versatile magic' },
  { id: 'monk', name: 'Monk', icon: Heart, desc: 'Martial artist', style: 'Speed & control' },
  { id: 'sorcerer', name: 'Sorcerer', icon: Dice1, desc: 'Innate magic wielder', style: 'Raw spell power' },
  { id: 'warlock', name: 'Warlock', icon: BookOpen, desc: 'Pact-bound mystic', style: 'Eldritch blasts' },
];

const RACES = [
  'Human', 'Elf', 'Dwarf', 'Halfling', 'Dragonborn', 'Tiefling', 'Gnome', 'Half-Elf', 'Half-Orc', 'Aasimar', 'Firbolg', 'Genasi', 'Tabaxi', 'Custom...'
];

const BACKGROUNDS = [
  'Acolyte', 'Charlatan', 'Criminal', 'Entertainer', 'Folk Hero', 'Guild Artisan', 'Hermit', 'Noble', 'Outlander', 'Sage', 'Sailor', 'Soldier', 'Urchin', 'Custom...'
];

const ALIGNMENTS = [
  'Lawful Good', 'Neutral Good', 'Chaotic Good',
  'Lawful Neutral', 'True Neutral', 'Chaotic Neutral',
  'Lawful Evil', 'Neutral Evil', 'Chaotic Evil',
];

const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8];

const QUESTIONS = [
  {
    id: 'concept',
    label: 'Describe your hero in one sentence',
    placeholder: 'A former city guard who found a mysterious sword...',
    type: 'textarea' as const,
  },
  {
    id: 'moment',
    label: 'A moment that defined them',
    placeholder: 'When they stood alone against the raiders to protect the village...',
    type: 'textarea' as const,
  },
  {
    id: 'motivation',
    label: 'What drives them to adventure?',
    placeholder: 'Redemption, knowledge, protecting others, fame, revenge...',
    type: 'textarea' as const,
  },
  {
    id: 'fear',
    label: 'What do they secretly fear?',
    placeholder: 'Losing control, being forgotten, failing those they love...',
    type: 'textarea' as const,
  },
];

export default function CreateCharacterPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [archetype, setArchetype] = useState<string>('');
  const [character, setCharacter] = useState<UniversalCharacter>(() => {
    const empty = createEmptyCharacter();
    // Pre-fill with standard array
    const abilities: Record<AbilityScore, number> = {
      strength: 10, dexterity: 10, constitution: 10,
      intelligence: 10, wisdom: 10, charisma: 10,
    };
    const now = new Date().toISOString();
    return {
      ...empty,
      id: '',
      createdAt: now,
      updatedAt: now,
      version: 1,
      abilities,
      modifiers: calculateModifiers(abilities),
      stats: { ...empty.stats, proficiencyBonus: 2 },
    };
  });

  const steps = [
    { title: 'Who Are You?', desc: 'Answer a few questions to discover your hero', icon: Sparkles },
    { title: 'Choose Your Path', desc: 'Pick an archetype that fits your vision', icon: User },
    { title: 'Define Abilities', desc: 'Assign your strengths and weaknesses', icon: Dice1 },
    { title: 'Final Touches', desc: 'Race, background, and finishing details', icon: Heart },
  ];

  const handleAnswerChange = (id: string, value: string) => {
    setAnswers(prev => ({ ...prev, [id]: value }));
  };

  const handleArchetypeSelect = (id: string) => {
    setArchetype(id);
    const arch = CLASS_ARCHETYPES.find(a => a.id === id);
    if (arch) {
      setCharacter(prev => ({
        ...prev,
        portrait: { ...prev.portrait, class: arch.name },
      }));
    }
  };

  const handleAbilityChange = (ability: AbilityScore, value: number) => {
    setCharacter(prev => {
      const newAbilities = { ...prev.abilities, [ability]: value };
      return {
        ...prev,
        abilities: newAbilities,
        modifiers: calculateModifiers(newAbilities),
      };
    });
  };

  const handlePortraitChange = (field: keyof UniversalCharacter['portrait'], value: unknown) => {
    setCharacter(prev => ({
      ...prev,
      portrait: { ...prev.portrait, [field]: value },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Merge answers into portrait
      const portrait = {
        ...character.portrait,
        personalityTraits: answers.concept ? [answers.concept] : [],
        backstory: [answers.moment, answers.motivation, answers.fear].filter(Boolean).join('\n\n'),
      };

      const finalChar = {
        ...character,
        id: generateId(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: 1,
        portrait,
      };

      await saveCharacter(finalChar);
      router.push(`/character/${finalChar.id}`);
      router.refresh();
    } catch (error) {
      console.error('Failed to save character:', error);
      alert('Failed to save character. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 0: return Object.values(answers).some(v => v.trim().length > 0);
      case 1: return archetype.length > 0;
      case 2: return true; // Always can proceed, uses defaults
      case 3: return character.portrait.name.length > 0 && character.portrait.race.length > 0;
      default: return false;
    }
  };

  return (
    <div className="min-h-screen bg-parchment-50">
      {/* Progress Header */}
      <header className="sticky top-0 z-10 bg-parchment-50/80 backdrop-blur-sm border-b border-ink-200">
        <div className="page-container py-4">
          <div className="flex items-center justify-between mb-4">
            <Link href="/" className="flex items-center gap-2 text-ink-600 hover:text-ink-900">
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back</span>
            </Link>
            <div className="flex items-center gap-2">
              {steps.map((s, i) => (
                <div key={i} className="flex items-center gap-1">
                  <div
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all',
                      i < step
                        ? 'bg-candlelight-400 text-ink-900'
                        : i === step
                        ? 'bg-ink-900 text-parchment-50 ring-2 ring-ink-900 ring-offset-2 ring-offset-parchment-50'
                        : 'bg-parchment-200 text-ink-400 border border-ink-300'
                    )}
                  >
                    {i < step ? <span className="w-4 h-4">✓</span> : i + 1}
                  </div>
                  {i < steps.length - 1 && (
                    <div
                      className={cn(
                        'w-16 h-0.5 rounded transition-colors',
                        i < step ? 'bg-candlelight-400' : 'bg-ink-200'
                      )}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-ink-900">{steps[step].title}</h1>
            <p className="text-ink-600 mt-1">{steps[step].desc}</p>
          </div>
        </div>
      </header>

      <main className="page-container py-8">
        <div className="max-w-3xl mx-auto animate-fade-in">
          {/* Step 0: Questions */}
          {step === 0 && (
            <Card variant="parchment" padding="lg">
              <div className="space-y-6">
                {QUESTIONS.map((q, i) => (
                  <div key={q.id} className={cn('animate-slide-up', { style: { animationDelay: `${i * 100}ms` } })}>
                    <label className="block text-sm font-medium text-ink-700 mb-2">{q.label}</label>
                    {q.type === 'textarea' ? (
                      <Textarea
                        value={answers[q.id] || ''}
                        onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                        placeholder={q.placeholder}
                        rows={3}
                        className="font-narrative"
                      />
                    ) : (
                      <Input
                        value={answers[q.id] || ''}
                        onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                        placeholder={q.placeholder}
                      />
                    )}
                  </div>
                ))}

                <div className="pt-4 border-t border-ink-200">
                  <p className="text-sm text-ink-500 text-center">
                    Don't overthink it — there are no wrong answers. This just helps shape your character.
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Step 1: Archetype */}
          {step === 1 && (
            <Card variant="parchment" padding="lg">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {CLASS_ARCHETYPES.map((arch) => {
                  const selected = archetype === arch.id;
                  const Icon = arch.icon;
                  return (
                    <button
                      key={arch.id}
                      onClick={() => handleArchetypeSelect(arch.id)}
                      className={cn(
                        'relative p-4 rounded-xl border-2 transition-all text-left group',
                        selected
                          ? 'border-candlelight-400 bg-candlelight-50 shadow-[0_0_0_2px_rgba(232,159,26,0.2)]'
                          : 'border-ink-200 bg-parchment-50 hover:border-candlelight-300 hover:bg-candlelight-50'
                      )}
                    >
                      <div className={cn(
                        'w-10 h-10 rounded-lg flex items-center justify-center mb-3 transition-colors',
                        selected ? 'bg-candlelight-200 text-candlelight-700' : 'bg-ink-100 text-ink-600 group-hover:text-candlelight-600'
                      )}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <h4 className="font-bold text-ink-900 mb-1">{arch.name}</h4>
                      <p className="text-xs text-ink-500 mb-1">{arch.desc}</p>
                      <p className="text-xs text-candlelight-700 font-medium">{arch.style}</p>
                      {selected && (
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-candlelight-400 text-ink-900 rounded-full flex items-center justify-center text-xs font-bold">
                          ✓
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Step 2: Abilities */}
          {step === 2 && (
            <>
              <Card variant="parchment" padding="lg">
                <div className="mb-6">
                  <h3 className="font-bold text-ink-900 mb-2">Assign Your Scores</h3>
                  <p className="text-sm text-ink-600">
                    Use the standard array: <strong className="font-mono">15, 14, 13, 12, 10, 8</strong>.
                    Click an ability to cycle through values, or drag to assign.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-6">
                  {ABILITIES.map((ability) => {
                    const score = character.abilities[ability];
                    const mod = character.modifiers[ability];
                    const used = STANDARD_ARRAY.includes(score) &&
                      Object.values(character.abilities).filter(v => v === score).length <= STANDARD_ARRAY.filter(v => v === score).length;

                    return (
                      <button
                        key={ability}
                        onClick={() => {
                          // Cycle through standard array
                          const currentIndex = STANDARD_ARRAY.indexOf(score);
                          const nextIndex = (currentIndex + 1) % STANDARD_ARRAY.length;
                          handleAbilityChange(ability, STANDARD_ARRAY[nextIndex]);
                        }}
                        className={cn(
                          'p-4 rounded-xl border-2 text-center transition-all font-narrative',
                          used ? 'border-candlelight-400 bg-candlelight-50' : 'border-ink-200 bg-parchment-50 hover:border-candlelight-300'
                        )}
                      >
                        <div className="text-xs text-ink-500 uppercase tracking-wide mb-1">{ABILITY_ABBREVS[ability]}</div>
                        <div className="text-3xl font-bold font-mono text-ink-900">{score}</div>
                        <div className="text-lg font-mono text-candlelight-600">{mod >= 0 ? '+' : ''}{mod}</div>
                        <div className="text-xs text-ink-500 mt-1">{ABILITY_LABELS[ability]}</div>
                      </button>
                    );
                  })}
                </div>

                <div className="p-3 bg-parchment-50 rounded-lg border border-ink-200">
                  <p className="text-sm text-ink-600">
                    <strong>Proficiency Bonus:</strong> +{character.stats.proficiencyBonus} (Level 1)
                    {' | '}
                    <strong>HP:</strong> {character.stats.hp.max} (10 + CON mod)
                  </p>
                </div>
              </Card>

              {/* Quick reference */}
              <Card variant="parchment" padding="md">
                <h4 className="font-bold text-ink-900 mb-3">What Each Ability Means</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="p-3 bg-parchment-50 rounded-lg"><strong className="text-ink-900">STR</strong><br/>Lifting, breaking, melee attacks</div>
                  <div className="p-3 bg-parchment-50 rounded-lg"><strong className="text-ink-900">DEX</strong><br/>Stealth, ranged attacks, AC, initiative</div>
                  <div className="p-3 bg-parchment-50 rounded-lg"><strong className="text-ink-900">CON</strong><br/>HP, concentration, poison resistance</div>
                  <div className="p-3 bg-parchment-50 rounded-lg"><strong className="text-ink-900">INT</strong><br/>Memory, investigation, wizard spells</div>
                  <div className="p-3 bg-parchment-50 rounded-lg"><strong className="text-ink-900">WIS</strong><br/>Perception, insight, cleric/druid spells</div>
                  <div className="p-3 bg-parchment-50 rounded-lg"><strong className="text-ink-900">CHA</strong><br/>Persuasion, deception, bard/sorcerer spells</div>
                </div>
              </Card>
            </>
          )}

          {/* Step 3: Final Touches */}
          {step === 3 && (
            <Card variant="parchment" padding="lg">
              <div className="space-y-6">
                <CharacterPortrait
                  portrait={character.portrait}
                  abilities={character.abilities}
                  modifiers={character.modifiers}
                  editable
                  onChange={(p) => setCharacter(prev => ({ ...prev, portrait: p }))}
                  compact
                />

                <div className="grid md:grid-cols-2 gap-4">
                  <Input
                    label="Name"
                    value={character.portrait.name}
                    onChange={(e) => handlePortraitChange('name', e.target.value)}
                    placeholder="Your hero's name"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={character.portrait.race}
                      onChange={(e) => handlePortraitChange('race', e.target.value)}
                      className="input-field"
                    >
                      <option value="">Race</option>
                      {RACES.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                    <select
                      value={character.portrait.background}
                      onChange={(e) => handlePortraitChange('background', e.target.value)}
                      className="input-field"
                    >
                      <option value="">Background</option>
                      {BACKGROUNDS.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                  <select
                    value={character.portrait.alignment}
                    onChange={(e) => handlePortraitChange('alignment', e.target.value)}
                    className="input-field md:col-span-2"
                  >
                    {ALIGNMENTS.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>

                <Textarea
                  label="A Final Detail (Optional)"
                  value={character.portrait.appearance}
                  onChange={(e) => handlePortraitChange('appearance', e.target.value)}
                  placeholder="A distinctive feature, mannerism, or quirk..."
                  rows={2}
                />
              </div>
            </Card>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-6 border-t border-ink-200">
            <Button
              variant="secondary"
              onClick={() => setStep(s => Math.max(0, s - 1))}
              disabled={step === 0}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>

            {step < steps.length - 1 ? (
              <Button
                onClick={() => setStep(s => Math.min(steps.length - 1, s + 1))}
                disabled={!canProceed()}
              >
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSave}
                loading={saving}
                size="lg"
              >
                <Save className="w-5 h-5 mr-2" />
                {saving ? 'Saving...' : 'Create Character'}
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}