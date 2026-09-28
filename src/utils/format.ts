import type { SlideStatus } from '../api/types';

export function maskPatientName(name: string): string {
  const letters = Array.from(name);
  if (letters.length < 2) return name;
  return letters[0] + '*'.repeat(letters.length - 1 - (letters.length > 2 ? 1 : 0)) + (letters.length > 2 ? letters.at(-1) : '');
}

const kstFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: 'Asia/Seoul',
  year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
});

export function formatDate(utc: string | null): string {
  if (utc === null) return '분석 결과 없음';
  const parts = Object.fromEntries(kstFormatter.formatToParts(new Date(utc)).map(({ type, value }) => [type, value]));
  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}`;
}

export function formatKi67(value: number | null): string {
  return value === null ? '분석 결과 없음' : `${value.toFixed(1)}%`;
}

export function formatCells(positive: number | null, total: number | null): string {
  return positive === null || total === null ? '분석 결과 없음' : `${positive.toLocaleString('en-US')} / ${total.toLocaleString('en-US')}`;
}

const labels: Record<SlideStatus, string> = { completed: '완료', processing: '분석 중', failed: '실패' };
export function statusLabel(status: SlideStatus): string {
  return labels[status];
}
