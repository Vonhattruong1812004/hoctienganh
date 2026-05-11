import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function loadEnvironmentFile(filePath: string) {
  if (!existsSync(filePath)) return;

  const lines = readFileSync(filePath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex === -1) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    if (!key || process.env[key] !== undefined) continue;

    let value = trimmed.slice(separatorIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  }
}

function loadEnvironmentFiles() {
  const visited = new Set<string>();
  let currentDirectory = process.cwd();

  for (let depth = 0; depth < 6; depth += 1) {
    for (const filename of ['.env.local', '.env']) {
      const candidate = resolve(currentDirectory, filename);
      if (!visited.has(candidate)) {
        visited.add(candidate);
        loadEnvironmentFile(candidate);
      }
    }

    const parentDirectory = resolve(currentDirectory, '..');
    if (parentDirectory === currentDirectory) break;
    currentDirectory = parentDirectory;
  }
}

loadEnvironmentFiles();

const { PrismaClient } = require('@prisma/client') as typeof import('@prisma/client');

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
