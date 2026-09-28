import type { ApiError, SlideDetail, SlideListResponse } from './types';

async function getJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(url, { signal });
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as ApiError | null;
    throw new Error(body?.message ?? `요청 실패 (${response.status})`);
  }
  return response.json() as Promise<T>;
}

export function getSlides(
  { page, q }: { page: number; q: string },
  signal?: AbortSignal,
): Promise<SlideListResponse> {
  const params = new URLSearchParams({ page: String(page), pageSize: '20' });
  if (q) params.set('q', q);
  return getJson(`/api/slides?${params}`, signal);
}

export function getSlide(id: string, signal?: AbortSignal): Promise<SlideDetail> {
  return getJson(`/api/slides/${encodeURIComponent(id)}`, signal);
}
