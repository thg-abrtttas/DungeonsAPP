'use client';

import React from 'react';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Dice1, Sparkles, Heart, Shield, Sword, BookOpen, MapPin, Plus, Send, HelpCircle, Check, AlertCircle, Camera, Bookmark, Settings as SettingsIcon, Mic, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { CharacterPortrait } from '@/components/CharacterPortrait';
import { DiceRoller } from '@/components/DiceRoller';
import { VoiceControls, FloatingVoicePanel } from '@/components/VoiceControls';
import { getSession, getCharacter, addJournalEntry, getJournalEntries, updateSession, type Session, type JournalEntry } from '@/lib/storage/indexeddb';
import type { UniversalCharacter } from '@/lib/character/types';
import { getRulesGuidance, getNarrativeSuggestions, streamNarrative } from '@/lib/llm';
import { cn, formatDate } from '@/lib/utils';
import Link from 'next/link';

type SceneType = 'combat' | 'social' | 'exploration' | 'rest' | 'revelation';

const SCENE_TYPES: { id: SceneType; label: string; icon: React.ComponentType<{ className?: string }>; color: string }[] = [
  { id: 'exploration', label: 'Exploration', icon: MapPin, color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  { id: 'social', label: 'Social / Talk', icon: Heart, color: 'bg-rose-100 text-rose-800 border-rose-300' },
  { id: 'combat', label: 'Combat', icon: Sword, color: 'bg-amber-100 text-amber-800 border-amber-300' },
  { id: 'revelation', label: 'Revelation / Secret', icon: Sparkles, color: 'bg-purple-100 text-purple-800 border-purple-300' },
  { id: 'rest', label: 'Rest & Recover', icon: Shield, color: 'bg-sky-100 text-sky-800 border-sky-300' },
];

export default function PlaySessionPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;

  const [session, setSession] = useState<Session | null>(null);
  const [characters, setCharacters] = useState<UniversalCharacter[]>([]);
  const [journal, setJournal] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Scene state
  const [currentScene, setCurrentScene] = useState<{
    type: SceneType;
    title: string;
    location: string;
    npcs: string[];
    description: string;
  }>({
    type: 'exploration',
    title: 'Beginning the Journey',
    location: 'The Crossroads',
    npcs: [],
    description: 'The road stretches ahead of you under an amber sky...',
  });

  // UI Panel states
  const [activePanel, setActivePanel] = useState<'scene' | 'characters' | 'dice' | 'rules'>('scene');
  const [rulesQuery, setRulesQuery] = useState('');
  const [rulesRuling, setRulesRuling] = useState<Awaited<ReturnType<typeof getRulesGuidance>> | null>(null);
  const [queryingRules, setQueryingRules] = useState(false);

  // Journal entry creation
  const [newEntryTitle, setNewEntryTitle] = useState('');
  const [newEntryContent, setNewEntryContent] = useState('');
  const [newEntryType, setNewEntryType] = useState<SceneType>('exploration');

  // AI Narrative stream
  const [narrativeStream, setNarrativeStream] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState(false);

  useEffect(() => {
    async function load() {
      if (!sessionId) return;
      const s = await getSession(sessionId);
      if (!s) {
        alert('Session not found');
        router.push('/');
        return;
      }
      setSession(s);

      const chars = await Promise.all(s.characterIds.map(id => getCharacter(id)));
      setCharacters(chars.filter((c): c is UniversalCharacter => c !== undefined));

      const entries = await getJournalEntries(sessionId);
      setJournal(entries);

      setLoading(false);
    }
    load();
  }, [sessionId, router]);

  const handleAddJournalEntry = async () => {
    if (!newEntryTitle.trim() || !newEntryContent.trim() || !session) return;

    const entry: Omit<JournalEntry, 'id'> = {
      sessionId: session.id,
      timestamp: new Date().toISOString(),
      type: newEntryType,
      title: newEntryTitle,
      content: newEntryContent,
      participants: characters.map(c => c.id),
      tags: [currentScene.location, newEntryType],
    };

    await addJournalEntry(entry);
    const updated = await getJournalEntries(session.id);
    setJournal(updated);

    setNewEntryTitle('');
    setNewEntryContent('');
  };

  const handleRulesLookup = async () => {
    if (!rulesQuery.trim()) return;
    setQueryingRules(true);
    try {
      const guidance = await getRulesGuidance(rulesQuery, characters[0]);
      setRulesRuling(guidance);
    } catch (err) {
      console.error('Rules error:', err);
    } finally {
      setQueryingRules(false);
    }
  };

  const handleGenerateNarrative = async () => {
    setIsStreaming(true);
    setNarrativeStream('');
    try {
      const prompt = `Scene: ${currentScene.title} at ${currentScene.location}. Type: ${currentScene.type}. Description: ${currentScene.description}. What happens next?`;
      for await (const chunk of streamNarrative(prompt)) {
        setNarrativeStream(prev => prev + chunk);
      }
    } catch (err) {
      console.error('Narrative error:', err);
    } finally {
      setIsStreaming(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-parchment-50 flex items-center justify-center">
        <div className="text-center">
          <Dice1 className="w-8 h-8 text-candlelight-600 animate-spin mx-auto mb-2" />
          <p className="text-ink-600 font-medium">Loading session workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-parchment-50 flex flex-col">
      {/* Top Bar */}
      <header className="bg-parchment-100/80 backdrop-blur-sm border-b border-ink-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Exit
            </Button>
          </Link>
          <div className="h-4 w-px bg-ink-200" />
          <div>
            <h1 className="font-bold text-ink-900 text-sm md:text-base">{currentScene.title}</h1>
            <p className="text-xs text-ink-500">{currentScene.location} • {characters.length} Heroes</p>
          </div>
        </div>

        {/* Quick Tabs for Mobile */}
        <div className="flex md:hidden items-center gap-1">
          <Button
            variant={activePanel === 'scene' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setActivePanel('scene')}
          >
            Scene
          </Button>
          <Button
            variant={activePanel === 'characters' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setActivePanel('characters')}
          >
            Heroes
          </Button>
          <Button
            variant={activePanel === 'dice' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setActivePanel('dice')}
          >
            Dice
          </Button>
          <Button
            variant={activePanel === 'rules' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setActivePanel('rules')}
          >
            Rules
          </Button>
        </div>

        <div className="hidden md:flex items-center gap-2">
          <Link href="/settings">
            <Button variant="ghost" size="sm">
              <SettingsIcon className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-4 p-4 max-w-7xl mx-auto w-full">
        {/* Left Panel: World & Scene (md:col-span-4) */}
        <div className={cn('md:col-span-4 space-y-4', activePanel !== 'scene' && 'hidden md:block')}>
          <Card variant="parchment" padding="md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-ink-900 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-candlelight-600" />
                Current Scene
              </h2>
              <select
                value={currentScene.type}
                onChange={(e) => setCurrentScene(prev => ({ ...prev, type: e.target.value as SceneType }))}
                className="input-field text-xs py-1 px-2 w-auto"
              >
                {SCENE_TYPES.map(t => (
                  <option key={t.id} value={t.id}>{t.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-3">
              <Input
                label="Location"
                value={currentScene.location}
                onChange={(e) => setCurrentScene(prev => ({ ...prev, location: e.target.value }))}
                placeholder="The Sunken Temple..."
                className="text-sm"
              />
              <Input
                label="Scene Title"
                value={currentScene.title}
                onChange={(e) => setCurrentScene(prev => ({ ...prev, title: e.target.value }))}
                placeholder="The Whispering Door..."
                className="text-sm"
              />
              <Textarea
                label="What's Happening?"
                value={currentScene.description}
                onChange={(e) => setCurrentScene(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Set the scene: atmosphere, sensory details, stakes..."
                rows={3}
                className="text-sm"
              />
            </div>

            <div className="mt-4 pt-4 border-t border-ink-200">
              <Button variant="secondary" size="sm" onClick={handleGenerateNarrative} loading={isStreaming} className="w-full">
                <Sparkles className="w-4 h-4 mr-2 text-candlelight-600" />
                Narrate Scene (AI)
              </Button>
            </div>
          </Card>

          {/* AI Streamed Narrative */}
          {(narrativeStream || isStreaming) && (
            <Card variant="parchment" padding="md" className="border-candlelight-300 bg-candlelight-50/50">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-ink-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-candlelight-600 animate-pulse" />
                  Narrative Prompt
                </h3>
                <VoiceControls
                  profileId="narrator"
                  text={narrativeStream}
                  speakLabel="Narrate"
                  isGenerating={isStreaming}
                  compact
                />
              </div>
              <p className="text-sm text-ink-800 font-narrative whitespace-pre-wrap leading-relaxed">
                {narrativeStream}
                {isStreaming && <span className="inline-block w-2 h-4 bg-candlelight-500 animate-pulse ml-1" />}
              </p>
            </Card>
          )}

          {/* Scene Journal / History */}
          <Card variant="parchment" padding="md">
            <h3 className="font-bold text-ink-900 mb-3 flex items-center gap-2">
              <Bookmark className="w-4 h-4 text-candlelight-600" />
              Scene Moments ({journal.length})
            </h3>
            <div className="space-y-2 max-h-60 overflow-y-auto scrollbar-thin pr-1">
              {journal.length === 0 ? (
                <p className="text-xs text-ink-400 italic text-center py-4">No moments recorded yet. Add one below!</p>
              ) : (
                journal.map((j) => (
                  <div key={j.id} className="p-2.5 bg-parchment-50 rounded border border-ink-200 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-ink-800">{j.title}</span>
                      <span className="text-ink-400 font-mono">{formatDate(j.timestamp).split(',')[1]}</span>
                    </div>
                    <p className="text-ink-600 line-clamp-2">{j.content}</p>
                  </div>
                ))
              )}
            </div>

            {/* Quick Add Moment */}
            <div className="mt-3 pt-3 border-t border-ink-200 space-y-2">
              <Input
                placeholder="Moment title..."
                value={newEntryTitle}
                onChange={(e) => setNewEntryTitle(e.target.value)}
                className="text-xs py-1.5"
              />
              <Textarea
                placeholder="What happened? (e.g. Tharin rolled a 20 and leaped the chasm!)"
                value={newEntryContent}
                onChange={(e) => setNewEntryContent(e.target.value)}
                rows={2}
                className="text-xs py-1.5"
              />
              <Button size="sm" onClick={handleAddJournalEntry} disabled={!newEntryTitle || !newEntryContent} className="w-full text-xs">
                <Plus className="w-3 h-3 mr-1" /> Save Moment
              </Button>
            </div>
          </Card>
        </div>

        {/* Center Panel: Character Sheets & Quick Actions (md:col-span-5) */}
        <div className={cn('md:col-span-5 space-y-4', activePanel !== 'characters' && 'hidden md:block')}>
          {characters.map((char) => (
            <div key={char.id} className="space-y-3">
              <CharacterPortrait
                portrait={char.portrait}
                abilities={char.abilities}
                modifiers={char.modifiers}
                compact
              />

              {/* Quick Actions / Trackers */}
              <Card variant="parchment" padding="sm" className="bg-parchment-50/50">
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2 bg-parchment-100 rounded border border-ink-200">
                    <span className="text-ink-500 block">HP</span>
                    <span className="font-bold font-mono text-sm text-ink-900">{char.stats.hp.current} / {char.stats.hp.max}</span>
                  </div>
                  <div className="p-2 bg-parchment-100 rounded border border-ink-200">
                    <span className="text-ink-500 block">AC</span>
                    <span className="font-bold font-mono text-sm text-ink-900">{char.stats.ac}</span>
                  </div>
                  <div className="p-2 bg-parchment-100 rounded border border-ink-200">
                    <span className="text-ink-500 block">Proficiency</span>
                    <span className="font-bold font-mono text-sm text-candlelight-600">+{char.stats.proficiencyBonus}</span>
                  </div>
                </div>

                {/* Key Attacks / Spells quick list */}
                {char.attacks.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-ink-200">
                    <span className="text-xs font-bold text-ink-700 block mb-1">Attacks</span>
                    <div className="flex flex-wrap gap-1">
                      {char.attacks.map((atk) => (
                        <span key={atk.id} className="px-2 py-0.5 bg-candlelight-100 border border-candlelight-300 rounded text-xs font-mono text-ink-800">
                          {atk.name}: {atk.damage}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            </div>
          ))}
        </div>

        {/* Right Panel: Tools (Dice & Rules) (md:col-span-3) */}
        <div className={cn('md:col-span-3 space-y-4', activePanel !== 'dice' && activePanel !== 'rules' && 'hidden md:block')}>
          {/* Dice Roller */}
          <DiceRoller />

          {/* Rules Assistant */}
          <Card variant="parchment" padding="md">
            <h3 className="font-bold text-ink-900 mb-3 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-candlelight-600" />
              Rules Helper
            </h3>
            <div className="space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="e.g., How does grappled work?"
                  value={rulesQuery}
                  onChange={(e) => setRulesQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleRulesLookup()}
                  className="text-xs py-1.5"
                />
                <Button variant="secondary" size="sm" onClick={handleRulesLookup} loading={queryingRules}>
                  Ask
                </Button>
              </div>

              {rulesRuling && (
                <div className="p-3 bg-candlelight-50 border border-candlelight-200 rounded-lg text-xs space-y-2 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-ink-900">{rulesRuling.ruling}</p>
                    <VoiceControls
                      profileId="narrator"
                      text={`${rulesRuling.ruling}. ${rulesRuling.explanation}`}
                      speakLabel="Read"
                      compact
                    />
                  </div>
                  <p className="text-ink-700">{rulesRuling.explanation}</p>
                  {rulesRuling.relevantRules.length > 0 && (
                    <div className="text-ink-500 font-mono">
                      Ref: {rulesRuling.relevantRules.join(', ')}
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
      <FloatingVoicePanel />
    </div>
  );
}