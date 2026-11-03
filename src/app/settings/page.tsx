'use client';

import React from 'react';
import { useState, useEffect } from 'react';
import { Save, Mic, Volume2, VolumeX, Download, Upload, Trash2, AlertCircle, CheckCircle, Key, Palette, SlidersHorizontal, BookOpen, ArrowLeft, Sparkles, TestTube } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { getSettings, saveSettings, exportAllData, importAllData } from '@/lib/storage/indexeddb';
import type { AppSettings } from '@/lib/storage/indexeddb';
import { useVoice, useVoices } from '@/hooks/useVoice';
import type { VoiceProfile } from '@/lib/voice/voiceProfiles';
import { VOICE_ROLE_LABELS, VOICE_ROLE_ICONS, createVoiceProfiles } from '@/lib/voice/voiceProfiles';

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings>({
    id: 'settings',
    theme: 'auto',
    soundEnabled: true,
    hapticsEnabled: true,
    autoSave: true,
    llmEnabled: true,
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [importFile, setImportFile] = useState<File | null>(null);

  // Voice state
  const {
    profiles: voiceProfiles,
    voicesLoaded,
    enabled: voiceEnabled,
    setEnabled: setVoiceEnabled,
    activeProfileId,
    setActiveProfile,
    setProfiles,
    testProfile,
    getProfile,
    voices,
  } = useVoice();

  const allVoices = useVoices();
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<VoiceProfile>>({});

  // Load settings on mount
  useEffect(() => {
    getSettings().then(s => {
      setSettings(s);
      // Apply voice settings
      if (s.llmEnabled !== undefined) {
        // Voice enabled is separate from LLM enabled
      }
    });
  }, []);

  // Sync voice profiles with settings
  useEffect(() => {
    if (voicesLoaded && voiceProfiles.length > 0) {
      // Initialize profiles with available voices if not set
      const hasVoiceURIs = voiceProfiles.some(p => p.voiceURI);
      if (!hasVoiceURIs && allVoices.length > 0) {
        const newProfiles = createVoiceProfiles(allVoices);
        setProfiles(newProfiles);
      }
    }
  }, [voicesLoaded, voiceProfiles, allVoices, setProfiles]);

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      await saveSettings(settings);
      setMessage({ type: 'success', text: 'Settings saved!' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

  const handleExport = async () => {
    try {
      const json = await exportAllData();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dungeonsapp-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setMessage({ type: 'success', text: 'Backup downloaded!' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Export failed' });
    }
  };

  const handleImport = async () => {
    if (!importFile) return;
    try {
      const text = await importFile.text();
      await importAllData(text);
      setMessage({ type: 'success', text: 'Data imported! Reloading...' });
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      setMessage({ type: 'error', text: 'Import failed - invalid file' });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportFile(e.target.files?.[0] || null);
  };

  const handleVoiceProfileEdit = (profile: VoiceProfile) => {
    setEditingProfileId(profile.id);
    setEditForm({
      name: profile.name,
      lang: profile.lang,
      rate: profile.rate,
      pitch: profile.pitch,
      volume: profile.volume,
    });
  };

  const handleVoiceProfileSave = (profileId: string) => {
    const updatedProfiles = voiceProfiles.map(p =>
      p.id === profileId ? { ...p, ...editForm } : p
    );
    setProfiles(updatedProfiles);
    setEditingProfileId(null);
    setEditForm({});
    setMessage({ type: 'success', text: 'Voice profile updated!' });
  };

  const handleVoiceProfileCancel = () => {
    setEditingProfileId(null);
    setEditForm({});
  };

  const handleTestProfile = (profile: VoiceProfile) => {
    testProfile(profile);
    setMessage({ type: 'success', text: `Testing ${profile.name}...` });
  };

  const sections = [
    { id: 'voice', label: 'Voice DM', icon: Mic, desc: 'Configure narrator & character voices' },
    { id: 'llm', label: 'AI Features', icon: Sparkles, desc: 'OpenAI API for narrative & rules' },
    { id: 'app', label: 'App Settings', icon: SlidersHorizontal, desc: 'Theme, sound, haptics, auto-save' },
    { id: 'data', label: 'Data & Backup', icon: BookOpen, desc: 'Export, import, clear data' },
  ];
  const [activeSection, setActiveSection] = useState('voice');

  return (
    <div className="min-h-screen bg-parchment-50">
      <header className="sticky top-0 z-10 bg-parchment-50/80 backdrop-blur-sm border-b border-ink-200">
        <div className="page-container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <a href="/" className="flex items-center gap-2 text-ink-600 hover:text-ink-900">
                <ArrowLeft className="w-5 h-5" />
                <span className="font-medium">Back</span>
              </a>
              <div className="h-6 w-px bg-ink-200" />
              <h1 className="text-xl font-bold text-ink-900">Settings</h1>
            </div>
            <Button onClick={handleSaveSettings} loading={saving} size="sm">
              <Save className="w-4 h-4 mr-1" />
              Save All
            </Button>
          </div>
        </div>
      </header>

      {message && (
        <div className="page-container px-4 py-2">
          <div className={`flex items-center gap-2 px-4 py-3 rounded-lg max-w-3xl mx-auto animate-slide-up ${
            message.type === 'success' ? 'bg-candlelight-100 border border-candlelight-300 text-candlelight-800' : 'bg-ink-100 border border-ink-300 text-ink-800'
          }`}>
            {message.type === 'success' ? <CheckCircle className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
            <span className="text-sm">{message.text}</span>
            <Button variant="ghost" size="sm" onClick={() => setMessage(null)} className="ml-auto">
              ✕
            </Button>
          </div>
        </div>
      )}

      <main className="page-container py-8">
        <div className="max-w-4xl mx-auto">
          {/* Section Tabs */}
          <div className="flex flex-wrap gap-2 mb-6 border-b border-ink-200 pb-2">
            {sections.map(s => {
              const Icon = s.icon;
              return (
                <Button
                  key={s.id}
                  variant={activeSection === s.id ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveSection(s.id)}
                  className="gap-2"
                >
                  <Icon className="w-4 h-4" />
                  <span>{s.label}</span>
                </Button>
              );
            })}
          </div>

          {/* Voice DM Section */}
          {activeSection === 'voice' && (
            <div className="space-y-6 animate-fade-in">
              <Card variant="parchment" padding="lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mic className="w-5 h-5 text-candlelight-600" />
                    Voice Dungeon Master
                  </CardTitle>
                  <p className="text-ink-600 text-sm mt-1">
                    Configure voices for the DM narrator, NPCs, and monsters. Uses your browser's built-in voices (Web Speech API) — completely free, works offline.
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 mb-6 p-4 bg-parchment-50 rounded-lg border border-ink-200">
                    <Button
                      variant={voiceEnabled ? 'primary' : 'secondary'}
                      onClick={() => setVoiceEnabled(!voiceEnabled)}
                      className="flex items-center gap-2"
                    >
                      {voiceEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                      {voiceEnabled ? 'Voice Enabled' : 'Voice Disabled'}
                    </Button>
                    <span className="text-sm text-ink-500 ml-2">
                      {voiceEnabled ? 'Voice will play for AI narrative, rules, and NPC dialogue' : 'All speech synthesis disabled'}
                    </span>
                  </div>

                  {!voicesLoaded && (
                    <div className="p-4 bg-candlelight-50 border border-candlelight-200 rounded-lg text-center text-sm text-ink-600">
                      <span className="animate-spin inline-block mr-2">⟳</span>
                      Loading available voices...
                    </div>
                  )}

                  <div className="space-y-4">
                    {voiceProfiles.map(profile => {
                      const Icon = VOICE_ROLE_ICONS[profile.role];
                      const isActive = activeProfileId === profile.id;
                      const isEditing = editingProfileId === profile.id;

                      return (
                        <Card key={profile.id} variant="parchment" padding="md" className={isActive ? 'ring-2 ring-candlelight-400' : ''}>
                          {isEditing ? (
                            <div className="space-y-4">
                              <div className="flex items-center gap-4">
                                <span className="text-2xl">{Icon}</span>
                                <Input
                                  label="Profile Name"
                                  value={editForm.name || ''}
                                  onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                  className="flex-1"
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="text-xs font-medium text-ink-600">Voice</label>
                                  <select
                                    value={editForm.voiceURI || ''}
                                    onChange={e => setEditForm({ ...editForm, voiceURI: e.target.value })}
                                    className="input-field w-full mt-1 text-sm"
                                  >
                                    <option value="">Auto-select best match</option>
                                    {allVoices.map(v => (
                                      <option key={v.voiceURI} value={v.voiceURI}>
                                        {v.name} ({v.lang}) {v.default ? '⭐' : ''}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <label className="text-xs font-medium text-ink-600">Language</label>
                                  <select
                                    value={editForm.lang || ''}
                                    onChange={e => setEditForm({ ...editForm, lang: e.target.value })}
                                    className="input-field w-full mt-1 text-sm"
                                  >
                                    <option value="en-US">English (US)</option>
                                    <option value="en-GB">English (UK)</option>
                                    <option value="en-AU">English (Australia)</option>
                                  </select>
                                </div>
                              </div>
                              <div className="grid grid-cols-3 gap-4">
                                <div>
                                  <label className="text-xs font-medium text-ink-600">Rate: {editForm.rate?.toFixed(2) || '1.00'}</label>
                                  <input
                                    type="range"
                                    min="0.1"
                                    max="2"
                                    step="0.05"
                                    value={editForm.rate || 1}
                                    onChange={e => setEditForm({ ...editForm, rate: parseFloat(e.target.value) })}
                                    className="w-full mt-1 accent-candlelight-500"
                                  />
                                </div>
                                <div>
                                  <label className="text-xs font-medium text-ink-600">Pitch: {editForm.pitch?.toFixed(2) || '1.00'}</label>
                                  <input
                                    type="range"
                                    min="0"
                                    max="2"
                                    step="0.05"
                                    value={editForm.pitch || 1}
                                    onChange={e => setEditForm({ ...editForm, pitch: parseFloat(e.target.value) })}
                                    className="w-full mt-1 accent-candlelight-500"
                                  />
                                </div>
                                <div>
                                  <label className="text-xs font-medium text-ink-600">Volume: {editForm.volume?.toFixed(2) || '1.00'}</label>
                                  <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.05"
                                    value={editForm.volume || 1}
                                    onChange={e => setEditForm({ ...editForm, volume: parseFloat(e.target.value) })}
                                    className="w-full mt-1 accent-candlelight-500"
                                  />
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button size="sm" onClick={() => handleVoiceProfileSave(profile.id)}>
                                  <CheckCircle className="w-4 h-4 mr-1" /> Save
                                </Button>
                                <Button variant="secondary" size="sm" onClick={handleVoiceProfileCancel}>
                                  Cancel
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => handleTestProfile({ ...profile, ...editForm })}>
                                  <Mic className="w-4 h-4 mr-1" /> Test
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex items-center gap-4 flex-1">
                                <span className="text-3xl" role="img" aria-label={VOICE_ROLE_LABELS[profile.role]}>{Icon}</span>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-ink-900">{profile.name}</span>
                                    {profile.isDefault && <span className="px-2 py-0.5 text-xs bg-candlelight-100 border border-candlelight-300 rounded text-candlelight-700">Default</span>}
                                    {isActive && <span className="px-2 py-0.5 text-xs bg-ink-900 text-parchment-50 rounded">Active</span>}
                                  </div>
                                  <div className="text-xs text-ink-500 flex flex-wrap gap-4 mt-1">
                                    <span>Voice: {profile.voiceURI ? 'Selected' : 'Auto'}</span>
                                    <span>Lang: {profile.lang}</span>
                                    <span>Rate: {profile.rate.toFixed(2)}</span>
                                    <span>Pitch: {profile.pitch.toFixed(2)}</span>
                                    <span>Vol: {profile.volume.toFixed(2)}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button variant="secondary" size="sm" onClick={() => handleTestProfile(profile)}>
                                  <Mic className="w-4 h-4 mr-1" /> Test
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => handleVoiceProfileEdit(profile)}>
                                  <SlidersHorizontal className="w-4 h-4" />
                                </Button>
                                {profile.id !== 'narrator' && (
                                  <Button
                                    variant={isActive ? 'primary' : 'ghost'}
                                    size="sm"
                                    onClick={() => setActiveProfile(profile.id)}
                                  >
                                    {isActive ? <CheckCircle className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                                  </Button>
                                )}
                              </div>
                            </div>
                          )}
                        </Card>
                      );
                    })}
                  </div>

                  <div className="mt-6 p-4 bg-parchment-100 border border-ink-200 rounded-lg">
                    <h4 className="font-bold text-ink-900 mb-2 flex items-center gap-2">
                      <TestTube className="w-4 h-4 text-candlelight-600" />
                      Quick Test All Voices
                    </h4>
                    <p className="text-sm text-ink-600 mb-3">Click each to hear how they sound:</p>
                    <div className="flex flex-wrap gap-2">
                      {voiceProfiles.map(profile => (
                        <Button
                          key={profile.id}
                          variant="secondary"
                          size="sm"
                          onClick={() => handleTestProfile(profile)}
                        >
                          {VOICE_ROLE_ICONS[profile.role]} {profile.name}
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* LLM/AI Features Section */}
          {activeSection === 'llm' && (
            <div className="space-y-6 animate-fade-in">
              <Card variant="parchment" padding="lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-candlelight-600" />
                    AI Features (OpenAI GPT-4o-mini)
                  </CardTitle>
                  <p className="text-ink-600 text-sm mt-1">
                    Enable AI-powered narrative generation, rules lookup, NPC creation, and character parsing.
                    Requires an OpenAI API key. <strong>Your key is stored locally in your browser only.</strong>
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4 mb-4 p-4 bg-parchment-50 rounded-lg border border-ink-200">
                    <Button
                      variant={settings.llmEnabled ? 'primary' : 'secondary'}
                      onClick={() => setSettings({ ...settings, llmEnabled: !settings.llmEnabled })}
                      className="flex items-center gap-2"
                    >
                      {settings.llmEnabled ? <Sparkles className="w-5 h-5" /> : <Sparkles className="w-5 h-5 opacity-50" />}
                      {settings.llmEnabled ? 'AI Features Enabled' : 'AI Features Disabled'}
                    </Button>
                    <span className="text-sm text-ink-500 ml-2">
                      {settings.llmEnabled ? 'Narrative, rules, NPCs, and character parsing use GPT-4o-mini' : 'All AI features disabled - works fully offline without API'}
                    </span>
                  </div>

                  <Input
                    label="OpenAI API Key"
                    type="password"
                    value={settings.llmApiKey || ''}
                    onChange={e => setSettings({ ...settings, llmApiKey: e.target.value })}
                    placeholder="sk-..."
                    helperText="Get your key at platform.openai.com/api-keys • GPT-4o-mini costs ~$0.15 per 1M tokens"
                  />

                  <div className="p-4 bg-candlelight-50 border border-candlelight-200 rounded-lg">
                    <h4 className="font-bold text-ink-900 mb-2 flex items-center gap-2">
                      <Key className="w-4 h-4 text-candlelight-600" />
                      Features Powered by AI
                    </h4>
                    <ul className="space-y-1 text-sm text-ink-700">
                      <li className="flex items-center gap-2"><span className="text-candlelight-600">•</span> <strong>Narrate Scene:</strong> AI writes evocative narrative for current scene</li>
                      <li className="flex items-center gap-2"><span className="text-candlelight-600">•</span> <strong>Rules Helper:</strong> Ask rules questions, get cited answers</li>
                      <li className="flex items-center gap-2"><span className="text-candlelight-600">•</span> <strong>Generate NPC:</strong> Create detailed NPCs on the fly</li>
                      <li className="flex items-center gap-2"><span className="text-candlelight-600">•</span> <strong>Parse Character:</strong> Convert pasted text/OCR to character sheet</li>
                    </ul>
                    <p className="text-xs text-ink-500 mt-3">Cost estimate: A typical 3-hour session uses ~50k-100k tokens (~$0.01-0.02)</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* App Settings Section */}
          {activeSection === 'app' && (
            <div className="space-y-6 animate-fade-in">
              <Card variant="parchment" padding="lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="w-5 h-5 text-candlelight-600" />
                    Appearance & Behavior
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-ink-700">Theme</label>
                    <select
                      value={settings.theme}
                      onChange={e => setSettings({ ...settings, theme: e.target.value as 'light' | 'dark' | 'auto' })}
                      className="input-field mt-1 w-full md:w-48"
                    >
                      <option value="auto">Auto (System)</option>
                      <option value="light">Light (Parchment)</option>
                      <option value="dark">Dark (Ink)</option>
                    </select>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <label className="flex items-center gap-3 p-3 bg-parchment-50 border border-ink-200 rounded-lg cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.soundEnabled}
                        onChange={e => setSettings({ ...settings, soundEnabled: e.target.checked })}
                        className="w-4 h-4 accent-candlelight-500"
                      />
                      <span className="text-ink-900 font-medium">Sound Effects</span>
                      <span className="text-xs text-ink-500 ml-auto">Dice rolls, UI sounds</span>
                    </label>
                    <label className="flex items-center gap-3 p-3 bg-parchment-50 border border-ink-200 rounded-lg cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.hapticsEnabled}
                        onChange={e => setSettings({ ...settings, hapticsEnabled: e.target.checked })}
                        className="w-4 h-4 accent-candlelight-500"
                      />
                      <span className="text-ink-900 font-medium">Haptics</span>
                      <span className="text-xs text-ink-500 ml-auto">Vibration on mobile</span>
                    </label>
                    <label className="flex items-center gap-3 p-3 bg-parchment-50 border border-ink-200 rounded-lg cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.autoSave}
                        onChange={e => setSettings({ ...settings, autoSave: e.target.checked })}
                        className="w-4 h-4 accent-candlelight-500"
                      />
                      <span className="text-ink-900 font-medium">Auto-Save</span>
                      <span className="text-xs text-ink-500 ml-auto">Save changes automatically</span>
                    </label>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Data & Backup Section */}
          {activeSection === 'data' && (
            <div className="space-y-6 animate-fade-in">
              <Card variant="parchment" padding="lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Download className="w-5 h-5 text-candlelight-600" />
                    Export Backup
                  </CardTitle>
                  <p className="text-ink-600 text-sm mt-1">
                    Download a complete JSON backup of all characters, sessions, journal entries, and settings.
                  </p>
                </CardHeader>
                <CardContent>
                  <Button variant="secondary" onClick={handleExport} className="w-full sm:w-auto">
                    <Download className="w-4 h-4 mr-2" />
                    Export All Data (JSON)
                  </Button>
                  <p className="text-xs text-ink-500 mt-2">Includes: characters, sessions, journal, settings</p>
                </CardContent>
              </Card>

              <Card variant="parchment" padding="lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="w-5 h-5 text-candlelight-600" />
                    Import Backup
                  </CardTitle>
                  <p className="text-ink-600 text-sm mt-1">
                    Restore from a previously exported JSON file. <strong>This will overwrite all current data.</strong>
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleFileSelect}
                      className="sr-only"
                      id="import-file"
                    />
                    <label htmlFor="import-file" className="cursor-pointer">
                      <Button variant="secondary" className="w-full sm:w-auto">
                        <Upload className="w-4 h-4 mr-2" />
                        Choose Backup File
                      </Button>
                    </label>
                    {importFile && (
                      <div className="flex items-center justify-between p-3 bg-parchment-50 border border-ink-200 rounded-lg">
                        <span className="text-sm text-ink-700">{importFile.name} ({(importFile.size / 1024).toFixed(1)} KB)</span>
                        <Button size="sm" onClick={handleImport} variant="primary">
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Import Now
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card variant="inked" padding="lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-rose-400">
                    <Trash2 className="w-5 h-5" />
                    Danger Zone
                  </CardTitle>
                  <p className="text-ink-300 text-sm mt-1">Irreversible actions</p>
                </CardHeader>
                <CardContent>
                  <Button variant="secondary" className="bg-rose-100 border-rose-300 text-rose-800 hover:bg-rose-200">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear All Data (Coming Soon)
                  </Button>
                  <p className="text-xs text-ink-400 mt-2">Deletes all characters, sessions, journal, and settings. Cannot be undone.</p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}