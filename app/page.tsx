"use client";

import { useState } from 'react';

type GenerateResponse = {
  videoUrl: string;
  operationId?: string;
  meta?: Record<string, unknown>;
};

const RES_PRESETS = [
  { label: '8K (7680?4320)', width: 7680, height: 4320 },
  { label: '4K (3840?2160)', width: 3840, height: 2160 },
  { label: '1080p (1920?1080)', width: 1920, height: 1080 },
];

const STYLES = [
  'Cinematic',
  'Photorealistic',
  'Documentary',
  'Aerial',
  'Slow-motion',
  'Dreamlike',
  'Noir',
];

export default function Page() {
  const [prompt, setPrompt] = useState('Ultra-realistic cinematic drone flyover across snow-capped mountains at golden hour, volumetric lighting, anamorphic lens flares, global illumination, filmic tones, 24 fps.');
  const [duration, setDuration] = useState(6);
  const [fps, setFps] = useState(24);
  const [resolutionIndex, setResolutionIndex] = useState(0); // default 8K
  const [style, setStyle] = useState(STYLES[0]);
  const [seed, setSeed] = useState<number | ''>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [opId, setOpId] = useState<string | undefined>();

  const selectedRes = RES_PRESETS[resolutionIndex];

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    setVideoUrl(null);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          durationSeconds: duration,
          fps,
          width: selectedRes.width,
          height: selectedRes.height,
          style,
          seed: seed === '' ? undefined : Number(seed),
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || 'Failed to generate video');
      }

      const data: GenerateResponse = await response.json();
      setVideoUrl(data.videoUrl);
      setOpId(data.operationId);
    } catch (err: any) {
      setError(err?.message || 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="container">
      <section className="card">
        <h1>Generate Ultra?Realistic Cinematic Video</h1>
        <form className="form" onSubmit={onSubmit}>
          <label className="label">Prompt</label>
          <textarea
            className="textarea"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={4}
            required
          />

          <div className="grid">
            <div>
              <label className="label">Duration (seconds)</label>
              <input
                type="number"
                min={2}
                max={20}
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="input"
              />
            </div>
            <div>
              <label className="label">FPS</label>
              <input
                type="number"
                min={12}
                max={60}
                value={fps}
                onChange={(e) => setFps(Number(e.target.value))}
                className="input"
              />
            </div>
            <div>
              <label className="label">Resolution</label>
              <select
                className="input"
                value={resolutionIndex}
                onChange={(e) => setResolutionIndex(Number(e.target.value))}
              >
                {RES_PRESETS.map((r, idx) => (
                  <option key={r.label} value={idx}>{r.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Style</label>
              <select className="input" value={style} onChange={(e) => setStyle(e.target.value)}>
                {STYLES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Seed (optional)</label>
              <input
                type="number"
                value={seed}
                onChange={(e) => setSeed(e.target.value === '' ? '' : Number(e.target.value))}
                className="input"
              />
            </div>
          </div>

          <button className="button" type="submit" disabled={isLoading}>
            {isLoading ? 'Generating?' : 'Generate 8K Cinematic Video'}
          </button>
          <p className="hint">If no API key is configured, a demo video will be shown.</p>
        </form>
      </section>

      {error && (
        <div className="error">{error}</div>
      )}

      {videoUrl && (
        <section className="card">
          <h2>Result</h2>
          <video className="video" src={videoUrl} controls playsInline preload="metadata" />
          {opId && <p className="muted">Operation: {opId}</p>}
          <a className="button secondary" href={videoUrl} download>
            Download MP4
          </a>
        </section>
      )}
    </div>
  );
}
