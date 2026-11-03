'use client';

import React from 'react';
import { useState } from 'react';
import { Image, Pen, Heart, Shield, Sword, BookOpen, MapPin, Dice1, Camera, Download, Upload } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { cn, getInitials } from '@/lib/utils';
import type { CharacterPortrait, AbilityScore } from '@/lib/character/types';
import { ABILITY_LABELS, ABILITY_ABBREVS } from '@/lib/character/types';

interface CharacterPortraitProps {
  portrait: CharacterPortrait;
  abilities?: Record<AbilityScore, number>;
  modifiers?: Record<AbilityScore, number>;
  editable?: boolean;
  onChange?: (portrait: CharacterPortrait) => void;
  onImageChange?: (url: string) => void;
  compact?: boolean;
}

const CLASS_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  fighter: Sword,
  wizard: BookOpen,
  cleric: Heart,
  rogue: Dice1,
  ranger: MapPin,
  paladin: Shield,
  barbarian: Sword,
  bard: BookOpen,
  druid: MapPin,
  monk: Heart,
  sorcerer: Dice1,
  warlock: BookOpen,
  artificer: Shield,
};

const DEFAULT_ICON = Dice1;

export function CharacterPortrait({
  portrait,
  abilities,
  modifiers,
  editable = false,
  onChange,
  onImageChange,
  compact = false,
}: CharacterPortraitProps) {
  const [imageUrl, setImageUrl] = useState(portrait.imageUrl || '');
  const [editing, setEditing] = useState(false);
  const [hovering, setHovering] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const url = event.target?.result as string;
        setImageUrl(url);
        onImageChange?.(url);
        if (onChange) {
          onChange({ ...portrait, imageUrl: url });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const updateField = <K extends keyof CharacterPortrait>(field: K, value: CharacterPortrait[K]) => {
    if (onChange) {
      onChange({ ...portrait, [field]: value });
    }
  };

  const ClassIcon = CLASS_ICONS[portrait.class.toLowerCase()] || DEFAULT_ICON;

  if (compact) {
    return (
      <div className="flex items-center gap-3 p-3 bg-parchment-100 rounded-lg border border-ink-200">
        <div
          className="w-12 h-12 rounded-xl bg-candlelight-100 border-2 border-candlelight-300 flex items-center justify-center overflow-hidden flex-shrink-0"
        >
          {imageUrl ? (
            <img src={imageUrl} alt={portrait.name} className="w-full h-full object-cover" />
          ) : (
            <ClassIcon className="w-6 h-6 text-candlelight-600" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-ink-900 truncate">{portrait.name || 'Unnamed'}</p>
          <p className="text-sm text-ink-500">
            Level {portrait.level} {portrait.race} {portrait.class}
            {portrait.subclass && ` (${portrait.subclass})`}
          </p>
        </div>
        {editable && (
          <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
            <Pen className="w-4 h-4" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <Card variant="parchment" padding="md" className={cn('relative', editing && 'ring-2 ring-candlelight-400')}>
      <div className="flex items-start gap-4">
        {/* Portrait Image */}
        <div className="relative flex-shrink-0">
          <div
            className="w-24 h-24 rounded-xl bg-candlelight-100 border-2 border-candlelight-300 overflow-hidden flex items-center justify-center relative"
            onMouseEnter={() => setHovering(true)}
            onMouseLeave={() => setHovering(false)}
          >
            {imageUrl ? (
              <img src={imageUrl} alt={portrait.name} className="w-full h-full object-cover" />
            ) : (
              <ClassIcon className="w-10 h-10 text-candlelight-600" />
            )}

            {editable && hovering && (
              <label className="absolute bottom-0 left-0 right-0 h-8 bg-ink-900/80 text-parchment-50 flex items-center justify-center cursor-pointer transition-opacity">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="sr-only"
                />
                <Camera className="w-4 h-4 mr-1" />
                Change
              </label>
            )}

            {!imageUrl && editable && !hovering && (
              <label className="absolute inset-0 bg-ink-900/50 text-parchment-50 flex flex-col items-center justify-center cursor-pointer p-2 text-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="sr-only"
                />
                <Camera className="w-6 h-6 mb-1" />
                <span className="text-xs">Add Portrait</span>
              </label>
            )}
          </div>

          {editable && imageUrl && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 w-24"
              onClick={(e) => {
                e.stopPropagation();
                setImageUrl('');
                onImageChange?.('');
                onChange?.({ ...portrait, imageUrl: '' });
              }}
            >
              Remove
            </Button>
          )}
        </div>

        {/* Character Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              {editable ? (
                <Input
                  value={portrait.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  placeholder="Character Name"
                  className="w-64"
                  label=""
                />
              ) : (
                <h2 className="text-2xl font-bold text-ink-900">{portrait.name || 'Unnamed Hero'}</h2>
              )}

              <div className="mt-1 flex items-center gap-3 text-sm text-ink-600">
                <span>Level {portrait.level}</span>
                <span className="px-2 py-0.5 bg-candlelight-100 border border-candlelight-300 rounded">
                  {portrait.race}
                </span>
                <span className="px-2 py-0.5 bg-parchment-200 border border-ink-200 rounded">
                  {portrait.class}{portrait.subclass && ` (${portrait.subclass})`}
                </span>
                <span className="px-2 py-0.5 bg-ink-100 border border-ink-200 rounded">
                  {portrait.background}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {editable && !editing && (
                <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
                  <Pen className="w-4 h-4 mr-1" />
                  Edit
                </Button>
              )}
              {editing && (
                <>
                  <Button variant="secondary" size="sm" onClick={() => setEditing(false)}>
                    Done
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
                    Cancel
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Alignment & Experience */}
          <div className="flex items-center gap-4 mb-4 text-sm text-ink-600">
            <span>
              <strong>Alignment:</strong> {portrait.alignment}
            </span>
            <span>
              <strong>XP:</strong> {portrait.experience.toLocaleString()}
            </span>
          </div>

          {/* Ability Scores */}
          {abilities && modifiers && (
            <div className="grid grid-cols-6 gap-2 mb-4 p-3 bg-parchment-50 rounded-lg border border-ink-200">
              {(Object.keys(abilities) as AbilityScore[]).map((ability) => (
                <div key={ability} className="text-center">
                  <div className="text-xs text-ink-500 uppercase tracking-wide">{ABILITY_ABBREVS[ability]}</div>
                  <div className="text-2xl font-bold font-mono text-ink-900">{abilities[ability]}</div>
                  <div className="text-sm font-mono text-candlelight-600">
                    {modifiers[ability] >= 0 ? '+' : ''}{modifiers[ability]}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Narrative Fields */}
          {editing && (
            <div className="space-y-4 animate-slide-up">
              <Textarea
                label="Backstory"
                value={portrait.backstory}
                onChange={(e) => updateField('backstory', e.target.value)}
                placeholder="Where did you come from? What shaped you?"
                rows={3}
              />
              <Textarea
                label="Appearance"
                value={portrait.appearance}
                onChange={(e) => updateField('appearance', e.target.value)}
                placeholder="What do you look like? Distinctive features?"
                rows={2}
              />
              <div className="grid grid-cols-2 gap-4">
                <Textarea
                  label="Personality Traits"
                  value={portrait.personalityTraits.join('\n')}
                  onChange={(e) => updateField('personalityTraits', e.target.value.split('\n').filter(Boolean))}
                  placeholder="One per line"
                  rows={3}
                />
                <Textarea
                  label="Ideals"
                  value={portrait.ideals.join('\n')}
                  onChange={(e) => updateField('ideals', e.target.value.split('\n').filter(Boolean))}
                  placeholder="One per line"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Textarea
                  label="Bonds"
                  value={portrait.bonds.join('\n')}
                  onChange={(e) => updateField('bonds', e.target.value.split('\n').filter(Boolean))}
                  placeholder="One per line"
                  rows={3}
                />
                <Textarea
                  label="Flaws"
                  value={portrait.flaws.join('\n')}
                  onChange={(e) => updateField('flaws', e.target.value.split('\n').filter(Boolean))}
                  placeholder="One per line"
                  rows={3}
                />
              </div>
            </div>
          )}

          {!editing && (portrait.backstory || portrait.appearance || portrait.personalityTraits.length > 0) && (
            <details className="group">
              <summary className="flex items-center gap-2 text-sm font-medium text-ink-600 hover:text-ink-900 cursor-pointer">
                <Dice1 className="w-4 h-4 text-candlelight-600" />
                Character Details
                <span className="ml-auto text-ink-400 group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <div className="mt-3 space-y-3 text-sm text-ink-700">
                {portrait.backstory && (
                  <div>
                    <p className="font-medium text-ink-800">Backstory</p>
                    <p className="mt-1 whitespace-pre-wrap">{portrait.backstory}</p>
                  </div>
                )}
                {portrait.appearance && (
                  <div>
                    <p className="font-medium text-ink-800">Appearance</p>
                    <p className="mt-1 whitespace-pre-wrap">{portrait.appearance}</p>
                  </div>
                )}
                {portrait.personalityTraits.length > 0 && (
                  <div>
                    <p className="font-medium text-ink-800">Traits</p>
                    <ul className="mt-1 list-disc list-inside space-y-0.5">
                      {portrait.personalityTraits.map((t, i) => (
                        <li key={i}>{t}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {portrait.ideals.length > 0 && (
                  <div>
                    <p className="font-medium text-ink-800">Ideals</p>
                    <ul className="mt-1 list-disc list-inside space-y-0.5">
                      {portrait.ideals.map((t, i) => (
                        <li key={i}>{t}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {portrait.bonds.length > 0 && (
                  <div>
                    <p className="font-medium text-ink-800">Bonds</p>
                    <ul className="mt-1 list-disc list-inside space-y-0.5">
                      {portrait.bonds.map((t, i) => (
                        <li key={i}>{t}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {portrait.flaws.length > 0 && (
                  <div>
                    <p className="font-medium text-ink-800">Flaws</p>
                    <ul className="mt-1 list-disc list-inside space-y-0.5">
                      {portrait.flaws.map((t, i) => (
                        <li key={i}>{t}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </details>
          )}
        </div>
      </div>
    </Card>
  );
}