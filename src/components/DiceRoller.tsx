'use client';

import React from 'react';
import { useState, useCallback } from 'react';
import { Dice1, Dice2, Dice3, Dice4, Dice5, Dice6, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { rollDice, rollDie, advantageRoll, disadvantageRoll, DICE_TYPES, type DiceType } from '@/lib/utils';
import { cn } from '@/lib/utils';

const DICE_LABELS: Record<DiceType, string> = {
  4: 'd4',
  6: 'd6',
  8: 'd8',
  10: 'd10',
  12: 'd12',
  20: 'd20',
  100: 'd%',
};

function getDiceIcon(sides: DiceType) {
  switch (sides) {
    case 4: return <Dice1 className="w-5 h-5" />;
    case 6: return <Dice2 className="w-5 h-5" />;
    case 8: return <Dice3 className="w-5 h-5" />;
    case 10: return <Dice4 className="w-5 h-5" />;
    case 12: return <Dice5 className="w-5 h-5" />;
    case 20: return <Dice6 className="w-5 h-5" />;
    case 100: return <Sparkles className="w-5 h-5" />;
  }
}

function getDiceIconLarge(sides: DiceType) {
  switch (sides) {
    case 4: return <Dice1 className="w-6 h-6" />;
    case 6: return <Dice2 className="w-6 h-6" />;
    case 8: return <Dice3 className="w-6 h-6" />;
    case 10: return <Dice4 className="w-6 h-6" />;
    case 12: return <Dice5 className="w-6 h-6" />;
    case 20: return <Dice6 className="w-6 h-6" />;
    case 100: return <Sparkles className="w-6 h-6" />;
  }
}

interface DiceRollerProps {
  onRoll?: (result: { total: number; rolls: number[]; formula: string }) => void;
  compact?: boolean;
}

export function DiceRoller({ onRoll, compact = false }: DiceRollerProps) {
  const [lastResult, setLastResult] = useState<{ total: number; rolls: number[]; formula: string } | null>(null);
  const [rolling, setRolling] = useState<DiceType | null>(null);
  const [mode, setMode] = useState<'normal' | 'advantage' | 'disadvantage'>('normal');

  const handleRoll = useCallback((sides: DiceType) => {
    setRolling(sides);
    setMode('normal');

    // Small delay for animation feel
    setTimeout(() => {
      const result = rollDice(`1d${sides}`);
      setLastResult(result);
      setRolling(null);
      onRoll?.(result);
    }, 150);
  }, [onRoll]);

  const handleAdvantage = useCallback((sides: DiceType = 20) => {
    setRolling(sides);
    setMode('advantage');

    setTimeout(() => {
      const result = advantageRoll(sides);
      const formatted = { total: result.roll, rolls: result.rolls, formula: `1d${sides} (adv)` };
      setLastResult(formatted);
      setRolling(null);
      onRoll?.(formatted);
    }, 150);
  }, [onRoll]);

  const handleDisadvantage = useCallback((sides: DiceType = 20) => {
    setRolling(sides);
    setMode('disadvantage');

    setTimeout(() => {
      const result = disadvantageRoll(sides);
      const formatted = { total: result.roll, rolls: result.rolls, formula: `1d${sides} (dis)` };
      setLastResult(formatted);
      setRolling(null);
      onRoll?.(formatted);
    }, 150);
  }, [onRoll]);

  const handleCustomRoll = useCallback((formula: string) => {
    const result = rollDice(formula);
    setLastResult(result);
    onRoll?.(result);
  }, [onRoll]);

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {DICE_TYPES.map((sides) => (
          <Button
            key={sides}
            variant="dice"
            size="sm"
            className="w-12 h-12 text-lg"
            onClick={() => handleRoll(sides)}
            disabled={rolling !== null}
            aria-label={`Roll ${DICE_LABELS[sides]}`}
          >
            {rolling === sides ? (
              <span className="animate-spin">⟳</span>
            ) : (
              getDiceIcon(sides)
            )}
          </Button>
        ))}
        {lastResult && (
          <div className="ml-2 px-3 py-1.5 bg-candlelight-100 border border-candlelight-300 rounded-lg font-mono text-ink-800 min-w-[4rem] text-center">
            {lastResult.total}
          </div>
        )}
      </div>
    );
  }

  return (
    <Card variant="parchment" padding="md">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-bold text-ink-800">Dice</h3>
        <div className="flex items-center gap-2">
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as 'normal' | 'advantage' | 'disadvantage')}
            className="input-field text-sm py-1.5 px-3 w-auto"
            aria-label="Roll mode"
          >
            <option value="normal">Normal</option>
            <option value="advantage">Advantage</option>
            <option value="disadvantage">Disadvantage</option>
          </select>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4" role="group" aria-label="Dice types">
        {DICE_TYPES.map((sides) => (
          <Button
            key={sides}
            variant="dice"
            onClick={() => {
              if (mode === 'advantage') handleAdvantage(sides);
              else if (mode === 'disadvantage') handleDisadvantage(sides);
              else handleRoll(sides);
            }}
            disabled={rolling !== null}
            aria-label={`${mode === 'advantage' ? 'Advantage ' : mode === 'disadvantage' ? 'Disadvantage ' : ''}Roll ${DICE_LABELS[sides]}`}
            className={cn(rolling === sides && 'opacity-50')}
          >
            {rolling === sides ? (
              <span className="animate-spin text-2xl">⟳</span>
            ) : (
              getDiceIconLarge(sides)
            )}
          </Button>
        ))}
      </div>

      {/* Custom formula input */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="Custom (e.g., 2d6+3, 4d8-1)"
          className="input-field flex-1 font-mono text-sm"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleCustomRoll(e.currentTarget.value);
              e.currentTarget.value = '';
            }
          }}
          aria-label="Custom dice formula"
        />
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            const input = document.querySelector('input[placeholder*="Custom"]') as HTMLInputElement;
            if (input?.value) handleCustomRoll(input.value);
          }}
        >
          Roll
        </Button>
      </div>

      {/* Last result display */}
      {lastResult && (
        <div className="p-4 bg-candlelight-50 border border-candlelight-200 rounded-lg animate-fade-in">
          <div className="flex items-baseline justify-between gap-4">
            <div>
              <span className="text-4xl font-mono font-bold text-ink-900">{lastResult.total}</span>
              <span className="ml-2 text-sm text-ink-500 font-mono">{lastResult.formula}</span>
            </div>
            {lastResult.rolls.length > 1 && (
              <div className="flex items-center gap-1.5 text-sm text-ink-600">
                <span>Rolls:</span>
                {lastResult.rolls.map((roll, i) => (
                  <span key={i} className="px-2 py-0.5 bg-parchment-200 rounded text-ink-800 font-mono">
                    {roll}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick reference */}
      <details className="mt-4">
        <summary className="text-sm text-ink-500 hover:text-ink-700 cursor-pointer font-medium">
          Quick Reference
        </summary>
        <div className="mt-2 grid grid-cols-2 gap-1 text-xs text-ink-600">
          <div><strong>Ability Check:</strong> d20 + mod + prof</div>
          <div><strong>Attack Roll:</strong> d20 + mod + prof</div>
          <div><strong>Saving Throw:</strong> d20 + mod + prof</div>
          <div><strong>Damage:</strong> XdY + mod</div>
          <div><strong>Adv/Dis:</strong> Roll 2d20, take higher/lower</div>
          <div><strong>Nat 20:</strong> Auto-hit, crit on attack</div>
          <div><strong>Nat 1:</strong> Auto-miss on attack</div>
        </div>
      </details>
    </Card>
  );
}