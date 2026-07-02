'use client';
import { createContext, useContext, useEffect, useState, useCallback } from 'react';

type Theme = 'light' | 'dark';
type Settings = {
  theme: Theme;
  setTheme: (t: Theme) => void;
  voiceURI: string;            // '' = browser default
  setVoiceURI: (v: string) => void;
  volume: number;              // 0..1, used for AI speech in voice mode
  setVolume: (v: number) => void;
  voices: SpeechSynthesisVoice[];
};

const Ctx = createContext<Settings | null>(null);
export const useSettings = () => {
  const s = useContext(Ctx);
  if (!s) throw new Error('useSettings must be used inside <SettingsProvider>');
  return s;
};

const LS = { theme: 'dp.theme', voice: 'dp.voiceURI', vol: 'dp.volume' };

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light');
  const [voiceURI, setVoiceURIState] = useState('');
  const [volume, setVolumeState] = useState(1);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  // Hydrate from localStorage once on mount.
  useEffect(() => {
    const t = (localStorage.getItem(LS.theme) as Theme) || 'light';
    setThemeState(t);
    document.documentElement.dataset.theme = t;
    const v = localStorage.getItem(LS.voice);
    if (v) setVoiceURIState(v);
    const vol = localStorage.getItem(LS.vol);
    if (vol != null) setVolumeState(Number(vol));
  }, []);

  // Load the browser's speech-synthesis voices (arrive asynchronously).
  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    const load = () => setVoices(window.speechSynthesis.getVoices());
    load();
    window.speechSynthesis.onvoiceschanged = load;
    return () => { window.speechSynthesis.onvoiceschanged = null; };
  }, []);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    document.documentElement.dataset.theme = t;
    localStorage.setItem(LS.theme, t);
  }, []);
  const setVoiceURI = useCallback((v: string) => {
    setVoiceURIState(v);
    localStorage.setItem(LS.voice, v);
  }, []);
  const setVolume = useCallback((v: number) => {
    setVolumeState(v);
    localStorage.setItem(LS.vol, String(v));
  }, []);

  return (
    <Ctx.Provider value={{ theme, setTheme, voiceURI, setVoiceURI, volume, setVolume, voices }}>
      {children}
    </Ctx.Provider>
  );
}

// Floating gear button + settings panel, available on every screen.
export function SettingsButton() {
  const { theme, setTheme, voiceURI, setVoiceURI, volume, setVolume, voices } = useSettings();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        className="settings-fab"
        aria-label="Settings"
        title="Settings"
        onClick={() => setOpen((o) => !o)}
      >
        ⚙
      </button>

      {open && (
        <>
          <div className="settings-scrim" onClick={() => setOpen(false)} />
          <div className="settings-panel" role="dialog" aria-label="Settings">
            <div className="settings-head">
              <h3>Settings</h3>
              <button className="settings-x" aria-label="Close settings" onClick={() => setOpen(false)}>✕</button>
            </div>

            <label className="settings-row">
              <span>Appearance</span>
              <div className="seg">
                <button className={theme === 'light' ? 'on' : ''} onClick={() => setTheme('light')}>Light</button>
                <button className={theme === 'dark' ? 'on' : ''} onClick={() => setTheme('dark')}>Dark</button>
              </div>
            </label>

            <label className="settings-row">
              <span>AI voice <em>(voice mode)</em></span>
              <select value={voiceURI} onChange={(e) => setVoiceURI(e.target.value)}>
                <option value="">Browser default</option>
                {voices.map((v) => (
                  <option key={v.voiceURI} value={v.voiceURI}>{v.name} ({v.lang})</option>
                ))}
              </select>
            </label>

            <label className="settings-row">
              <span>Volume <em>{Math.round(volume * 100)}%</em></span>
              <input
                type="range" min={0} max={1} step={0.05} value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
              />
            </label>

            {voices.length === 0 && (
              <p className="settings-note">No speech voices detected in this browser — voice mode audio may be unavailable.</p>
            )}
          </div>
        </>
      )}
    </>
  );
}
