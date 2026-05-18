import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import path from 'node:path';
import { NextRequest } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const etsRoot = path.resolve(process.cwd(), '../../ETS');

const contentTypes: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.heic': 'image/heic',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
};

function safeAssetPath(segments: string[]) {
  const requested = path.resolve(etsRoot, ...segments);
  if (!requested.startsWith(etsRoot)) {
    return null;
  }
  return requested;
}

function parseRange(rangeHeader: string | null, fileSize: number) {
  if (!rangeHeader?.startsWith('bytes=')) return null;
  const [startValue, endValue] = rangeHeader.replace('bytes=', '').split('-');
  const start = Number.parseInt(startValue, 10);
  const end = endValue ? Number.parseInt(endValue, 10) : fileSize - 1;

  if (Number.isNaN(start) || Number.isNaN(end) || start < 0 || end >= fileSize || start > end) {
    return null;
  }

  return { start, end };
}

export async function GET(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const params = await context.params;
  const assetPath = safeAssetPath(params.path ?? []);

  if (!assetPath) {
    return Response.json({ message: 'Invalid ETS asset path' }, { status: 400 });
  }

  try {
    const fileStat = await stat(assetPath);
    if (!fileStat.isFile()) {
      return Response.json({ message: 'ETS asset not found' }, { status: 404 });
    }

    const extension = path.extname(assetPath).toLowerCase();
    const contentType = contentTypes[extension] ?? 'application/octet-stream';
    const range = parseRange(request.headers.get('range'), fileStat.size);

    if (range) {
      const stream = createReadStream(assetPath, { start: range.start, end: range.end });
      return new Response(stream as unknown as BodyInit, {
        status: 206,
        headers: {
          'Accept-Ranges': 'bytes',
          'Content-Length': String(range.end - range.start + 1),
          'Content-Range': `bytes ${range.start}-${range.end}/${fileStat.size}`,
          'Content-Type': contentType,
        },
      });
    }

    const stream = createReadStream(assetPath);
    return new Response(stream as unknown as BodyInit, {
      headers: {
        'Accept-Ranges': 'bytes',
        'Content-Length': String(fileStat.size),
        'Content-Type': contentType,
      },
    });
  } catch {
    return Response.json({ message: 'ETS asset not found' }, { status: 404 });
  }
}
