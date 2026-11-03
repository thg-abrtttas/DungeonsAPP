'use client';

import React from 'react';
import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Play, Sparkles, Heart, Users, MapPin, Dice1, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { CharacterPortrait } from '@/components/CharacterPortrait';
import { getAllCharacters, createSession, type Session } from '@/lib/storage/indexeddb';
import type { UniversalCharacter } from '@/lib/character/types';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NewSessionPage() {
  const router = useRouter();
  const [characters, setCharacters] = useState<UniversalCharacter[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    async function load() {
      const chars = await getAllCharacters();
      setCharacters(chars);
      // Select first two by default if available
      if (chars.length >= 2) {
        setSelectedIds([chars[0].id, chars[1].id]);
      } else if (chars.length === 1) {
        setSelectedIds([chars[0].id]);
      }
      setLoading(false);
    }
    load();
  }, []);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleStartSession = async () => {
    if (selectedIds.length === 0) return;

    setStarting(true);
    try {
      const session = await createSession(selectedIds);
      router.push(`/play/${session.id}`);
    } catch (error) {
      console.error('Failed to create session:', error);
      alert('Failed to start session');
    } finally {
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-parchment-50 flex items-center justify-center">
        <div className="text-center">
          <Dice1 className="w-8 h-8 text-candlelight-600 animate-spin mx-auto mb-2" />
          <p className="text-ink-600 font-medium">Loading characters...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-parchment-50">
      <header className="sticky top-0 z-10 bg-parchment-50/80 backdrop-blur-sm border-b border-ink-200">
        <div className="page-container py-4">
          <Link href="/" className="flex items-center gap-2 text-ink-600 hover:text-ink-900 mb-4 inline-flex">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back</span>
          </Link>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-ink-900">Start New Session</h1>
            <p className="text-ink-600 mt-1">Select the heroes entering this chapter of the story</p>
          </div>
        </div>
      </header>

      <main className="page-container py-8">
        <div className="max-w-3xl mx-auto">
          {characters.length === 0 ? (
            <Card variant="parchment" padding="lg" className="text-center">
              <Users className="w-12 h-12 mx-auto text-ink-300 mb-4" />
              <h3 className="text-xl font-bold text-ink-900 mb-2">No Characters Found</h3>
              <p className="text-ink-600 mb-6">Create at least one character before starting a session.</p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Link href="/create">
                  <Button size="lg">
                    <Plus className="w-5 h-5 mr-2" />
                    Create Your Character
                  </Button>
                </Link>
                <Link href="/ingest">
                  <Button variant="secondary" size="lg">
                    <Users className="w-5 h-5 mr-2" />
                    Add Their Character
                  </Button>
                </Link>
              </div>
            </Card>
          ) : (
            <>
              <div className="space-y-4 mb-8">
                {characters.map((char) => {
                  const selected = selectedIds.includes(char.id);
                  return (
                    <button
                      key={char.id}
                      onClick={() => toggleSelect(char.id)}
                      className="w-full text-left"
                    >
                      <Card
                        variant="parchment"
                        padding="md"
                        className={selected ? 'ring-2 ring-candlelight-400 bg-candlelight-50/50' : 'hover:border-candlelight-300'}
                      >
                        <div className="flex items-center gap-4">
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() => {}} // handled by button onClick
                            className="w-5 h-5 rounded border-ink-300 text-candlelight-600 focus:ring-candlelight-400"
                          />
                          <CharacterPortrait
                            portrait={char.portrait}
                            abilities={char.abilities}
                            modifiers={char.modifiers}
                            compact
                          />
                        </div>
                      </Card>
                    </button>
                  );
                })}
              </div>

              {selectedIds.length < 2 && (
                <div className="p-4 bg-candlelight-50 border border-candlelight-200 rounded-lg mb-6 flex items-center gap-3">
                  <Heart className="w-5 h-5 text-candlelight-600 flex-shrink-0" />
                  <p className="text-sm text-ink-700">
                    <strong>Tip:</strong> D&D is best with two or more heroes! You can start with just one, but adding both your characters creates shared moments.
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-3">
                <Link href="/">
                  <Button variant="secondary">Cancel</Button>
                </Link>
                <Button
                  onClick={handleStartSession}
                  disabled={selectedIds.length === 0}
                  loading={starting}
                  size="lg"
                >
                  <Play className="w-5 h-5 mr-2" />
                  Begin Session ({selectedIds.length} Hero{selectedIds.length !== 1 ? 'es' : ''})
                </Button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}