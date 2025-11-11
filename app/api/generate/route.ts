import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { generateVideoWithVeo } from '@/lib/veoClient';

const schema = z.object({
  prompt: z.string().min(4),
  durationSeconds: z.number().int().min(2).max(20),
  fps: z.number().int().min(12).max(60).default(24),
  width: z.number().int().min(512).max(7680),
  height: z.number().int().min(512).max(4320),
  style: z.string().optional(),
  seed: z.number().int().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const input = schema.parse(json);

    const apiKey = process.env.GOOGLE_API_KEY;

    if (!apiKey) {
      // Demo fallback: return a public sample video
      return NextResponse.json(
        {
          videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
          operationId: 'demo-fallback',
        },
        { status: 200 },
      );
    }

    const result = await generateVideoWithVeo({
      apiKey,
      prompt: input.prompt,
      durationSeconds: input.durationSeconds,
      fps: input.fps,
      width: input.width,
      height: input.height,
      style: input.style,
      seed: input.seed,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    const message = err?.message || 'Unexpected error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
