'use client';

import React from 'react';
import { useState } from 'react';
import Link from 'next/link';
import { BookOpen, Plus, Users, Dice1, ArrowRight, Sparkles, Heart, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { getAllCharacters, getAllSessions } from '@/lib/storage/indexeddb';
import { formatDate } from '@/lib/utils';
import { initializeDefaults } from '@/lib/storage/indexeddb';

export default function HomePage() {
  const [chars, setChars] = useState<Awaited<ReturnType<typeof getAllCharacters>>>([]);
  const [sessions, setSessions] = useState<Awaited<ReturnType<typeof getAllSessions>>>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    await initializeDefaults();
    const [characters, sessionList] = await Promise.all([
      getAllCharacters(),
      getAllSessions(),
    ]);
    setChars(characters);
    setSessions(sessionList);
    setLoading(false);
  };

  // Load on mount
  if (typeof window !== 'undefined') {
    loadData();
  }

  const recentSessions = sessions.slice(0, 3);
  const recentChars = chars.slice(0, 3);

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-candlelight-50/50 via-parchment-50 to-parchment-100/50" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20viewBox%3D%220%200%20400%20400%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cfilter%20id%3D%22noiseFilter%22%3E%3CfeTurbulence%20type%3D%22fractalNoise%22%20baseFrequency%3D%220.9%22%20numOctaves%3D%223%22%20stitchTiles%3D%22stitch%22%2F%3E%3C%2Ffilter%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20filter%3D%22url(%23noiseFilter)%22%20opacity%3D%220.02%22%2F%3E%3C%2Fsvg%3E')]" />

        <div className="page-container relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-parchment-100/80 backdrop-blur-sm border border-ink-200 rounded-full mb-6 animate-fade-in">
            <Sparkles className="w-4 h-4 text-candlelight-600" />
            <span className="text-sm font-medium text-ink-700">Built for connection, not rules</span>
          </div>

          <h1 className="text-4xl lg:text-6xl font-bold text-ink-900 mb-6 animate-slide-up text-balance">
            Your Story
            <br />
            <span className="text-candlelight-600">Awaits</span>
          </h1>

          <p className="text-lg lg:text-xl text-ink-600 max-w-2xl mx-auto mb-10 animate-slide-up" style={{ animationDelay: '100ms' }}>
            A D&D companion for creating characters, running sessions, and preserving the moments that matter.
            No rulebooks required — just imagination.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: '200ms' }}>
            <Link href="/create">
              <Button size="lg" className="w-full sm:w-auto group">
                <Plus className="w-5 h-5 mr-2" />
                Create Your Character
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="/ingest">
              <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                <Users className="w-5 h-5 mr-2" />
                Add Their Character
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 lg:py-24 bg-parchment-100/50">
        <div className="page-container">
          <h2 className="text-3xl font-bold text-ink-800 text-center mb-12">Three Ways to Play</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card variant="parchment" padding="lg" className="text-center group hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 mx-auto mb-4 bg-candlelight-100 border-2 border-candlelight-300 rounded-xl flex items-center justify-center group-hover:border-candlelight-400 transition-colors">
                <Dice1 className="w-8 h-8 text-candlelight-600" />
              </div>
              <h3 className="text-xl font-bold text-ink-900 mb-2">Create Together</h3>
              <p className="text-ink-600">Guided character creation that asks questions, not forms. Build a hero with a story, not just stats.</p>
            </Card>

            <Card variant="parchment" padding="lg" className="text-center group hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 mx-auto mb-4 bg-candlelight-100 border-2 border-candlelight-300 rounded-xl flex items-center justify-center group-hover:border-candlelight-400 transition-colors">
                <BookOpen className="w-8 h-8 text-candlelight-600" />
              </div>
              <h3 className="text-xl font-bold text-ink-900 mb-2">Play Freely</h3>
              <p className="text-ink-600">Scene-based play, not initiative tracking. Combat, conversation, exploration — all in one flow.</p>
            </Card>

            <Card variant="parchment" padding="lg" className="text-center group hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 mx-auto mb-4 bg-candlelight-100 border-2 border-candlelight-300 rounded-xl flex items-center justify-center group-hover:border-candlelight-400 transition-colors">
                <Heart className="w-8 h-8 text-candlelight-600" />
              </div>
              <h3 className="text-xl font-bold text-ink-900 mb-2">Remember Forever</h3>
              <p className="text-ink-600">Auto-generated story journal with photos, dice rolls, and quotes. A keepsake of your adventure.</p>
            </Card>
          </div>
        </div>
      </section>

      {/* Recent Activity */}
      {(chars.length > 0 || sessions.length > 0) && (
        <section className="py-16 lg:py-24">
          <div className="page-container">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold text-ink-800">Continue Your Adventure</h2>
              <div className="flex gap-2">
                <Link href="/characters">
                  <Button variant="ghost" size="sm">All Characters</Button>
                </Link>
                <Link href="/sessions">
                  <Button variant="ghost" size="sm">All Sessions</Button>
                </Link>
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
              {/* Recent Characters */}
              {chars.length > 0 && (
                <Card variant="parchment" padding="lg">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-ink-900 flex items-center gap-2">
                      <Users className="w-5 h-5 text-candlelight-600" />
                      Your Heroes
                    </h3>
                    <Link href="/create">
                      <Button variant="ghost" size="sm">+ New</Button>
                    </Link>
                  </div>
                  <div className="space-y-3">
                    {recentChars.map((char) => (
                      <Link
                        key={char.id}
                        href={`/character/${char.id}`}
                        className="block p-3 bg-parchment-50 border border-ink-200 rounded-lg hover:border-candlelight-300 hover:bg-candlelight-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-candlelight-100 border border-candlelight-300 flex items-center justify-center flex-shrink-0">
                            <Dice1 className="w-5 h-5 text-candlelight-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-ink-900 truncate">{char.portrait.name}</p>
                            <p className="text-sm text-ink-500">
                              Level {char.portrait.level} {char.portrait.race} {char.portrait.class}
                            </p>
                          </div>
                          <span className="text-xs text-ink-400">Updated {formatDate(char.updatedAt)}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </Card>
              )}

              {/* Recent Sessions */}
              {sessions.length > 0 && (
                <Card variant="parchment" padding="lg">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-ink-900 flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-candlelight-600" />
                      Recent Sessions
                    </h3>
                    <Link href="/sessions/new">
                      <Button variant="ghost" size="sm">+ New</Button>
                    </Link>
                  </div>
                  <div className="space-y-3">
                    {recentSessions.map((session) => (
                      <Link
                        key={session.id}
                        href={`/play/${session.id}`}
                        className="block p-3 bg-parchment-50 border border-ink-200 rounded-lg hover:border-candlelight-300 hover:bg-candlelight-50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-ink-900">Session with {session.characterIds.length} hero{session.characterIds.length !== 1 ? 'es' : ''}</p>
                            <p className="text-sm text-ink-500">Started {formatDate(session.createdAt)}</p>
                          </div>
                          <Dice1 className="w-5 h-5 text-candlelight-600" />
                        </div>
                      </Link>
                    ))}
                  </div>
                </Card>
              )}

              {/* Empty state for characters */}
              {chars.length === 0 && sessions.length > 0 && (
                <Card variant="parchment" padding="lg" className="lg:col-span-2 text-center">
                  <Users className="w-12 h-12 mx-auto text-ink-300 mb-4" />
                  <h3 className="text-xl font-bold text-ink-900 mb-2">No Characters Yet</h3>
                  <p className="text-ink-600 mb-6">Create your hero to begin the adventure.</p>
                  <Link href="/create">
                    <Button size="lg">
                      <Plus className="w-5 h-5 mr-2" />
                      Create Your Character
                    </Button>
                  </Link>
                </Card>
              )}

              {/* Empty state for sessions */}
              {sessions.length === 0 && chars.length > 0 && (
                <Card variant="parchment" padding="lg" className="lg:col-span-2 text-center">
                  <BookOpen className="w-12 h-12 mx-auto text-ink-300 mb-4" />
                  <h3 className="text-xl font-bold text-ink-900 mb-2">No Sessions Yet</h3>
                  <p className="text-ink-600 mb-6">Start a new adventure with your characters.</p>
                  <Link href="/sessions/new">
                    <Button size="lg">
                      <Plus className="w-5 h-5 mr-2" />
                      New Session
                    </Button>
                  </Link>
                </Card>
              )}

              {/* Completely empty */}
              {chars.length === 0 && sessions.length === 0 && (
                <Card variant="parchment" padding="lg" className="lg:col-span-2 text-center">
                  <Sparkles className="w-12 h-12 mx-auto text-candlelight-400 mb-4" />
                  <h3 className="text-xl font-bold text-ink-900 mb-2">Ready to Begin?</h3>
                  <p className="text-ink-600 mb-6">Your first adventure starts with a single character.</p>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
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
              )}
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="py-12 border-t border-ink-200 bg-parchment-100/50">
        <div className="page-container text-center">
          <p className="text-ink-500 text-sm">
            Made for shared stories. No tracking, no accounts, no pressure.
            <br />
            <span className="text-ink-400">Works offline. Your data stays on your device.</span>
          </p>
        </div>
      </footer>
    </main>
  );
}