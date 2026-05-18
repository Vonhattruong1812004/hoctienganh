import { etsPracticeParts, questionNumbers, type EtsPracticePart } from './ets-practice-library';

export type EtsToeicType = 'lr' | 'sw';

export type EtsAttemptPayload = {
  id: string;
  type: EtsToeicType;
  testNumber: number;
  partIds: string[];
  startedAt: string;
  finishedAt: string;
  durationSecondsUsed: number;
  totalDurationSeconds: number;
  answers: Record<string, string>;
  keyText: string;
};

export const etsAttemptStoragePrefix = 'englishpro.ets.practice.attempt.';

export const etsFullPartIds = etsPracticeParts.map((part) => part.id);

export function getEtsPartsByIds(partIds: string[]) {
  const ordered = etsPracticeParts.filter((part) => partIds.includes(part.id));
  return ordered.length ? ordered : etsPracticeParts;
}

export function getEtsQuestionList(parts: EtsPracticePart[]) {
  return parts.flatMap((part) => questionNumbers(part.from, part.to));
}

export function getEtsDurationMinutes(parts: EtsPracticePart[]) {
  const isFullLr = parts.length === etsPracticeParts.length && etsPracticeParts.every((part) => parts.some((item) => item.id === part.id));
  return isFullLr ? 120 : parts.reduce((total, part) => total + part.durationMinutes, 0);
}

export function parseEtsPartIds(value: string | null) {
  const ids = (value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  const validIds = ids.filter((id) => etsPracticeParts.some((part) => part.id === id));
  return validIds.length ? validIds : etsFullPartIds;
}

export function parseEtsKeyText(value: string, activeQuestions: number[]) {
  const letters = value.toUpperCase().match(/[A-D]/g) ?? [];
  return activeQuestions.reduce<Record<number, string>>((result, question, index) => {
    if (letters[index]) result[question] = letters[index];
    return result;
  }, {});
}

export function formatEtsClock(totalSeconds: number) {
  const safeSeconds = Math.max(0, totalSeconds);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60)
    .toString()
    .padStart(2, '0');
  const seconds = (safeSeconds % 60).toString().padStart(2, '0');
  return hours > 0 ? `${hours}:${minutes}:${seconds}` : `${minutes}:${seconds}`;
}

export function etsAttemptStorageKey(attemptId: string) {
  return `${etsAttemptStoragePrefix}${attemptId}`;
}
