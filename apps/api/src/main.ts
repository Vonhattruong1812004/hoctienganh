import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { INestApplication } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { AppModule } from './app.module';

type OpenverseImageSearchResponse = {
  results?: Array<{
    title?: string;
    url?: string;
    thumbnail?: string;
  }>;
};

const mediaImageQueries: Record<string, string> = {
  'classroom-objects.png': 'classroom objects',
  'family-tree.png': 'family',
  'father.png': 'father',
  'greetings-scene.png': 'greeting',
  'mother.png': 'mother',
  'pets-zoo.png': 'cute pets animals dog cat rabbit turtle fish penguin',
  'colors-shapes.png': 'colors shapes red blue yellow green circle square',
  'weather-flashcards.png': 'weather sunny rainy cloudy windy',
  'dog.png': 'dog animal',
  'cat.png': 'cat animal',
  'rabbit.png': 'rabbit animal',
  'turtle.png': 'turtle animal',
  'fish.png': 'fish animal',
  'penguin.png': 'penguin animal',
  'brush.png': 'child brushing teeth morning routine',
  'get-up.png': 'child waking up in bed morning routine',
  'go-to-school.png': 'student walking to school backpack',
  'sleep.png': 'child sleeping in bed night routine',
  'study.png': 'student studying English at desk',
  'daily-routines.png': 'daily routine student morning evening',
};

const mediaImageCache = new Map<string, { url: string; expiresAt: number }>();

function parseCorsOrigins(value: string | undefined) {
  return (value ?? '')
    .split(',')
    .map((origin) => origin.trim().replace(/\/$/, ''))
    .filter(Boolean);
}

function isAllowedCorsOrigin(origin: string | undefined, allowedOrigins: string[]) {
  if (!origin) {
    return true;
  }

  const normalizedOrigin = origin.replace(/\/$/, '');

  return (
    allowedOrigins.includes('*') ||
    allowedOrigins.includes(normalizedOrigin) ||
    /^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(normalizedOrigin)
  );
}

type CuratedMediaImage = {
  title: string;
  subtitle: string;
  accent: string;
  scene: string;
};

const curatedMediaImages: Record<string, CuratedMediaImage> = {
  'brush.png': {
    title: 'brush',
    subtitle: 'I brush my teeth.',
    accent: '#38bdf8',
    scene: `
      <rect x="92" y="114" width="250" height="210" rx="28" fill="#e0f2fe" opacity=".78"/>
      <rect x="135" y="160" width="160" height="92" rx="18" fill="#ffffff" stroke="#bae6fd" stroke-width="4"/>
      <circle cx="214" cy="206" r="42" fill="#fed7aa"/>
      <path d="M184 191 Q214 174 244 191" fill="none" stroke="#92400e" stroke-width="13" stroke-linecap="round"/>
      <circle cx="198" cy="206" r="5" fill="#0f172a"/>
      <circle cx="230" cy="206" r="5" fill="#0f172a"/>
      <path d="M199 226 Q214 239 231 226" fill="none" stroke="#0f172a" stroke-width="4" stroke-linecap="round"/>
      <rect x="372" y="228" width="190" height="44" rx="18" fill="#ffffff" stroke="#7dd3fc" stroke-width="4"/>
      <path d="M308 230 L436 212" stroke="#0ea5e9" stroke-width="10" stroke-linecap="round"/>
      <path d="M425 202 L468 196" stroke="#f8fafc" stroke-width="18" stroke-linecap="round"/>
      <circle cx="520" cy="180" r="13" fill="#bae6fd"/>
      <circle cx="560" cy="136" r="9" fill="#bae6fd"/>
      <circle cx="596" cy="204" r="12" fill="#bae6fd"/>
      <rect x="372" y="286" width="250" height="74" rx="24" fill="#f8fafc" stroke="#bae6fd" stroke-width="4"/>
    `,
  },
  'get-up.png': {
    title: 'get up',
    subtitle: 'I get up at six.',
    accent: '#f97316',
    scene: `
      <rect x="86" y="112" width="720" height="286" rx="34" fill="#fff7ed" opacity=".9"/>
      <rect x="142" y="244" width="394" height="96" rx="26" fill="#fbbf24"/>
      <rect x="150" y="214" width="160" height="72" rx="24" fill="#ffffff"/>
      <circle cx="260" cy="210" r="34" fill="#fed7aa"/>
      <path d="M234 198 Q260 180 286 198" fill="none" stroke="#92400e" stroke-width="12" stroke-linecap="round"/>
      <circle cx="248" cy="212" r="4" fill="#0f172a"/>
      <circle cx="273" cy="212" r="4" fill="#0f172a"/>
      <path d="M252 228 Q262 235 275 226" fill="none" stroke="#0f172a" stroke-width="3.5" stroke-linecap="round"/>
      <path d="M398 206 C440 160 514 166 552 218" fill="none" stroke="#f97316" stroke-width="12" stroke-linecap="round"/>
      <circle cx="654" cy="168" r="54" fill="#fde047"/>
      <path d="M654 80 V116M654 220 V256M566 168 H604M704 168 H742M594 108 L620 134M712 108 L688 134M594 228 L620 202M712 228 L688 202" stroke="#facc15" stroke-width="10" stroke-linecap="round"/>
      <circle cx="648" cy="300" r="42" fill="#38bdf8"/>
      <circle cx="648" cy="300" r="27" fill="#ffffff" opacity=".85"/>
      <path d="M648 300 L648 276M648 300 L668 314" stroke="#0f172a" stroke-width="5" stroke-linecap="round"/>
    `,
  },
  'go-to-school.png': {
    title: 'go to school',
    subtitle: 'I go to school at seven.',
    accent: '#22c55e',
    scene: `
      <rect x="514" y="126" width="250" height="214" rx="18" fill="#fde68a" stroke="#f59e0b" stroke-width="5"/>
      <path d="M492 136 L638 58 L786 136 Z" fill="#ef4444"/>
      <rect x="618" y="238" width="54" height="102" rx="8" fill="#0f172a"/>
      <rect x="548" y="162" width="48" height="46" rx="8" fill="#bfdbfe"/>
      <rect x="684" y="162" width="48" height="46" rx="8" fill="#bfdbfe"/>
      <text x="566" y="121" font-family="Arial, sans-serif" font-size="26" font-weight="900" fill="#ffffff">SCHOOL</text>
      <path d="M0 400 C200 314 390 362 900 290 L900 540 L0 540 Z" fill="#64748b"/>
      <path d="M104 454 C290 386 508 420 820 348" fill="none" stroke="#f8fafc" stroke-width="10" stroke-dasharray="34 28" opacity=".82"/>
      <circle cx="244" cy="250" r="36" fill="#fed7aa"/>
      <path d="M216 238 Q244 216 274 238" fill="none" stroke="#92400e" stroke-width="12" stroke-linecap="round"/>
      <rect x="210" y="286" width="80" height="94" rx="22" fill="#38bdf8"/>
      <rect x="284" y="302" width="38" height="62" rx="14" fill="#f97316"/>
      <path d="M206 370 L170 438M286 370 L316 438" stroke="#0f172a" stroke-width="12" stroke-linecap="round"/>
      <path d="M218 314 L176 344M284 314 L326 342" stroke="#fed7aa" stroke-width="12" stroke-linecap="round"/>
    `,
  },
  'sleep.png': {
    title: 'sleep',
    subtitle: 'I sleep at ten.',
    accent: '#6366f1',
    scene: `
      <rect width="900" height="540" rx="32" fill="#172554" opacity=".9"/>
      <circle cx="690" cy="116" r="54" fill="#fde68a"/>
      <circle cx="714" cy="96" r="54" fill="#172554"/>
      <text x="116" y="126" font-family="Arial, sans-serif" font-size="42" font-weight="900" fill="#e0e7ff">Zzz</text>
      <text x="186" y="184" font-family="Arial, sans-serif" font-size="30" font-weight="900" fill="#c7d2fe">Zz</text>
      <circle cx="120" cy="250" r="4" fill="#f8fafc"/>
      <circle cx="250" cy="100" r="5" fill="#f8fafc"/>
      <circle cx="784" cy="260" r="4" fill="#f8fafc"/>
      <rect x="118" y="300" width="640" height="78" rx="24" fill="#1e293b"/>
      <rect x="178" y="240" width="184" height="78" rx="24" fill="#ffffff"/>
      <circle cx="274" cy="250" r="36" fill="#fed7aa"/>
      <path d="M242 242 Q274 224 304 242" fill="none" stroke="#92400e" stroke-width="12" stroke-linecap="round"/>
      <path d="M257 258 Q274 270 292 258" fill="none" stroke="#0f172a" stroke-width="4" stroke-linecap="round"/>
      <rect x="330" y="250" width="360" height="118" rx="28" fill="#60a5fa"/>
      <path d="M330 286 C440 322 542 300 690 346" fill="none" stroke="#93c5fd" stroke-width="18" stroke-linecap="round"/>
    `,
  },
  'study.png': {
    title: 'study',
    subtitle: 'I study English every day.',
    accent: '#8b5cf6',
    scene: `
      <rect x="92" y="112" width="718" height="276" rx="34" fill="#eef2ff" opacity=".92"/>
      <rect x="154" y="306" width="560" height="34" rx="16" fill="#a16207"/>
      <rect x="214" y="340" width="34" height="88" rx="12" fill="#78350f"/>
      <rect x="620" y="340" width="34" height="88" rx="12" fill="#78350f"/>
      <circle cx="356" cy="224" r="38" fill="#fed7aa"/>
      <path d="M326 212 Q356 190 386 212" fill="none" stroke="#92400e" stroke-width="13" stroke-linecap="round"/>
      <circle cx="342" cy="224" r="4" fill="#0f172a"/>
      <circle cx="370" cy="224" r="4" fill="#0f172a"/>
      <rect x="314" y="266" width="88" height="74" rx="22" fill="#38bdf8"/>
      <path d="M428 270 L572 248 L574 326 L430 348 Z" fill="#ffffff" stroke="#8b5cf6" stroke-width="5"/>
      <path d="M500 258 L502 336" stroke="#c4b5fd" stroke-width="4"/>
      <path d="M450 288 H486M450 310 H486M518 282 H552M518 306 H552" stroke="#64748b" stroke-width="5" stroke-linecap="round"/>
      <path d="M640 294 L700 188" stroke="#facc15" stroke-width="14" stroke-linecap="round"/>
      <circle cx="710" cy="174" r="34" fill="#fde047"/>
      <path d="M288 294 L240 322M406 294 L436 326" stroke="#fed7aa" stroke-width="12" stroke-linecap="round"/>
    `,
  },
};

function escapeSvgText(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function mediaQueryFromFile(fileName: string) {
  return (
    mediaImageQueries[fileName] ??
    `${fileName.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ')} English vocabulary illustration`
  );
}

function createCuratedMediaImage(fileName: string) {
  const image = curatedMediaImages[fileName];
  if (!image) return null;

  const title = escapeSvgText(image.title);
  const subtitle = escapeSvgText(image.subtitle);

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="900" height="540" viewBox="0 0 900 540">
      <defs>
        <linearGradient id="sky" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#e0f2fe"/>
          <stop offset="58%" stop-color="#f8fafc"/>
          <stop offset="100%" stop-color="#ffedd5"/>
        </linearGradient>
        <filter id="softShadow" x="-20%" y="-20%" width="140%" height="150%">
          <feDropShadow dx="0" dy="18" stdDeviation="18" flood-color="#0f172a" flood-opacity=".16"/>
        </filter>
      </defs>
      <rect width="900" height="540" rx="32" fill="url(#sky)"/>
      <circle cx="770" cy="96" r="52" fill="#fde047"/>
      <path d="M0 390 L148 276 L278 358 L408 238 L560 380 L692 292 L900 408 L900 540 L0 540 Z" fill="#86efac" opacity=".38"/>
      <path d="M0 420 H900 V540 H0 Z" fill="#22c55e" opacity=".36"/>
      <g filter="url(#softShadow)">
        ${image.scene}
      </g>
      <rect x="58" y="412" width="784" height="82" rx="24" fill="#ffffff" opacity=".9"/>
      <circle cx="104" cy="453" r="22" fill="${image.accent}"/>
      <text x="142" y="448" font-family="Arial, sans-serif" font-size="32" font-weight="900" fill="#0f172a">${title}</text>
      <text x="142" y="476" font-family="Arial, sans-serif" font-size="19" font-weight="700" fill="#475569">${subtitle}</text>
    </svg>
  `;
}

function createMediaPlaceholder(fileName: string) {
  const title = escapeSvgText(fileName.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' '));

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="900" height="540" viewBox="0 0 900 540">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#bae6fd"/>
          <stop offset="52%" stop-color="#dcfce7"/>
          <stop offset="100%" stop-color="#fed7aa"/>
        </linearGradient>
      </defs>
      <rect width="900" height="540" rx="32" fill="url(#bg)"/>
      <circle cx="744" cy="104" r="54" fill="#fde047"/>
      <path d="M0 392 L156 278 L266 360 L408 236 L560 382 L696 292 L900 410 L900 540 L0 540 Z" fill="#86efac" opacity=".78"/>
      <path d="M0 422 H900 V540 H0 Z" fill="#22c55e" opacity=".86"/>
      <rect x="120" y="116" width="660" height="240" rx="28" fill="#fff" opacity=".9"/>
      <text x="160" y="226" font-family="Arial, sans-serif" font-size="58" font-weight="900" fill="#0f172a">${title}</text>
      <text x="160" y="288" font-family="Arial, sans-serif" font-size="28" font-weight="700" fill="#475569">EnglishPro online image fallback</text>
    </svg>
  `;
}

function registerMediaImageFallback(app: INestApplication) {
  const httpServer = app.getHttpAdapter().getInstance();

  httpServer.get('/media/images/:file', async (request: { params?: { file?: string } }, response: any) => {
    const fileName = String(request.params?.file ?? '').trim();
    const curatedImage = createCuratedMediaImage(fileName);

    if (curatedImage) {
      response.setHeader('Cache-Control', 'public, max-age=3600');
      response.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
      response.send(curatedImage);
      return;
    }

    const cached = mediaImageCache.get(fileName);

    if (cached && cached.expiresAt > Date.now()) {
      response.redirect(302, cached.url);
      return;
    }

    try {
      const url = new URL('https://api.openverse.org/v1/images/');
      url.searchParams.set('q', mediaQueryFromFile(fileName));
      url.searchParams.set('page_size', '1');
      url.searchParams.set('mature', 'false');

      const apiResponse = await fetch(url.toString());
      if (apiResponse.ok) {
        const body = (await apiResponse.json()) as OpenverseImageSearchResponse;
        const imageUrl = body.results?.find((item) => item.thumbnail || item.url);
        const resolvedUrl = imageUrl?.thumbnail ?? imageUrl?.url;

        if (resolvedUrl) {
          mediaImageCache.set(fileName, {
            url: resolvedUrl,
            expiresAt: Date.now() + 1000 * 60 * 60,
          });
          response.redirect(302, resolvedUrl);
          return;
        }
      }
    } catch {
      // Khi API ngoài chậm/mất mạng, hệ thống vẫn trả ảnh SVG để UI không bị vỡ.
    }

    response.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
    response.send(createMediaPlaceholder(fileName));
  });
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  const allowedOrigins = parseCorsOrigins(config.get<string>('CORS_ORIGIN'));

  app.setGlobalPrefix('api');
  app.use((request: Request, response: Response, next: NextFunction) => {
    const origin = request.headers.origin;

    if (typeof origin === 'string' && isAllowedCorsOrigin(origin, allowedOrigins)) {
      response.header('Access-Control-Allow-Origin', origin);
      response.header('Vary', 'Origin');
    }

    response.header('Access-Control-Allow-Credentials', 'true');
    response.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    response.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');

    if (request.method === 'OPTIONS') {
      response.sendStatus(204);
      return;
    }

    next();
  });
  app.enableCors({
    origin: (origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void) => {
      callback(null, isAllowedCorsOrigin(origin, allowedOrigins));
    },
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  registerMediaImageFallback(app);

  const configuredPort = process.env.PORT ?? config.get<string>('API_PORT') ?? '4000';
  const port = Number(configuredPort);
  await app.listen(Number.isNaN(port) ? 4000 : port, '0.0.0.0');
}

void bootstrap();
