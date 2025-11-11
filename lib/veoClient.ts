type GenerateParams = {
  apiKey: string;
  prompt: string;
  durationSeconds: number;
  fps: number;
  width: number;
  height: number;
  style?: string;
  seed?: number;
};

export async function generateVideoWithVeo(params: GenerateParams): Promise<{ videoUrl: string; operationId?: string; meta?: Record<string, unknown> }> {
  const {
    apiKey,
    prompt,
    durationSeconds,
    fps,
    width,
    height,
    style,
    seed,
  } = params;

  // Hypothetical Google AI Studio Veo endpoint (subject to change).
  // If using Vertex AI, adapt baseUrl and auth accordingly (OAuth2 instead of key).
  const baseUrl = process.env.VEO_API_BASE || 'https://generativelanguage.googleapis.com/v1beta/models/veo-3.1:generateVideo';

  const styleSnippet = style ? `\nStyle: ${style}` : '';
  const compositePrompt = `${prompt}${styleSnippet}`;

  const body = {
    prompt: compositePrompt,
    videoConfig: {
      durationSeconds,
      frameRate: fps,
      resolution: { width, height },
      seed,
    },
  } as const;

  const url = new URL(baseUrl);
  url.searchParams.set('key', apiKey);

  const start = await fetch(url.toString(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!start.ok) {
    const errText = await start.text();
    throw new Error(`Veo start failed: ${start.status} ${errText}`);
  }

  const startJson = await start.json();

  // Try to support both immediate and LRO responses.
  // Immediate result path
  const immediateUrl = safeExtractVideoUrl(startJson);
  if (immediateUrl) {
    return { videoUrl: immediateUrl, meta: { transport: 'immediate' } };
  }

  // Long-running operation path
  const opName: string | undefined = startJson?.name || startJson?.operation || startJson?.operationId;
  if (!opName) {
    throw new Error('Veo response missing operation name and direct result.');
  }

  const opBase = process.env.VEO_OPERATIONS_BASE || 'https://generativelanguage.googleapis.com/v1/operations/';

  const maxWaitMs = 15 * 60 * 1000; // 15 min
  const startTime = Date.now();
  let backoffMs = 1500;
  const maxBackoff = 8000;

  while (true) {
    if (Date.now() - startTime > maxWaitMs) {
      throw new Error('Timeout waiting for Veo operation to complete');
    }

    // eslint-disable-next-line no-await-in-loop
    const opRes = await fetch(`${opBase}${encodeURIComponent(opName)}?key=${encodeURIComponent(apiKey)}`);
    if (!opRes.ok) {
      const t = await opRes.text();
      throw new Error(`Failed polling Veo operation: ${opRes.status} ${t}`);
    }
    // eslint-disable-next-line no-await-in-loop
    const opJson = await opRes.json();
    if (opJson?.done) {
      const videoUrl = safeExtractVideoUrl(opJson) || safeExtractVideoUrl(opJson?.response) || safeExtractVideoUrl(opJson?.result);
      if (!videoUrl) {
        const err = opJson?.error?.message || 'Operation done but no video URL found';
        throw new Error(err);
      }
      return { videoUrl, operationId: opName, meta: { transport: 'operation' } };
    }

    // not done yet; wait with backoff
    // eslint-disable-next-line no-await-in-loop
    await wait(backoffMs);
    backoffMs = Math.min(maxBackoff, Math.floor(backoffMs * 1.5));
  }
}

function safeExtractVideoUrl(obj: any): string | undefined {
  if (!obj || typeof obj !== 'object') return undefined;
  // Common possible shapes
  if (typeof obj.videoUrl === 'string') return obj.videoUrl;
  if (typeof obj.uri === 'string' && obj.uri.startsWith('http')) return obj.uri;
  if (obj.video && typeof obj.video.uri === 'string') return obj.video.uri;
  if (obj.result && typeof obj.result.videoUrl === 'string') return obj.result.videoUrl;
  if (obj.result && obj.result.video && typeof obj.result.video.uri === 'string') return obj.result.video.uri;
  if (obj.media && Array.isArray(obj.media)) {
    const m = obj.media.find((x: any) => x?.type?.toLowerCase() === 'video' && typeof x?.uri === 'string');
    if (m) return m.uri;
  }
  return undefined;
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
