import { useEffect, useState } from 'react';
import { getSlides } from './api/client';
import type { SlideListResponse } from './api/types';
import { formatDate, maskPatientName, statusLabel } from './utils/format';

export default function App() {
  const [draft, setDraft] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [list, setList] = useState<SlideListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (draft.trim() !== q) {
        setQ(draft.trim());
        setPage(1);
      }
    }, 300);
    return () => window.clearTimeout(timer);
  }, [draft, q]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    getSlides({ page, q }, controller.signal)
      .then(setList)
      .catch((cause: unknown) => {
        if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : '목록을 불러오지 못했습니다.');
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [page, q, retry]);

  const totalPages = Math.max(1, Math.ceil((list?.total ?? 0) / 20));
  return (
    <main className="app">
      <h1>슬라이드 분석 결과 뷰어</h1>
      <section aria-label="검사 목록">
        <label htmlFor="slide-search">슬라이드 검색</label>
        <input id="slide-search" type="search" value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="슬라이드 ID 또는 환자명" />
        {loading && <p role="status">목록을 불러오는 중입니다.</p>}
        {!loading && error && <div role="alert"><p>{error}</p><button type="button" onClick={() => setRetry((value) => value + 1)}>목록 다시 시도</button></div>}
        {!loading && !error && list && (list.items.length === 0 ? <p>검색 결과가 없습니다.</p> : (
          <ul aria-label="슬라이드 목록" className="slide-list">
            {list.items.map((slide) => (
              <li key={slide.id}>
                <button type="button" className="slide-item">
                  <img src={slide.thumbnailUrl} alt="" />
                  <span><strong>{slide.id}</strong><span>{maskPatientName(slide.patientName)}</span><time dateTime={slide.examinedAt}>{formatDate(slide.examinedAt)}</time></span>
                  <span className={`badge ${slide.status}`}>{statusLabel(slide.status)}</span>
                </button>
              </li>
            ))}
          </ul>
        ))}
        {!loading && !error && list && list.total > 0 && (
          <nav aria-label="페이지 이동" className="pagination">
            <button type="button" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>이전 페이지</button>
            <span>{page} / {totalPages}</span>
            <button type="button" disabled={page >= totalPages} onClick={() => setPage((value) => value + 1)}>다음 페이지</button>
          </nav>
        )}
      </section>
    </main>
  );
}
