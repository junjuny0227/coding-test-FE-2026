import { useEffect, useState } from 'react';
import { getSlide, getSlides } from './api/client';
import type { SlideDetail, SlideListResponse } from './api/types';
import { formatDate, maskPatientName, statusLabel } from './utils/format';
import { SlideDetailPanel } from './SlideDetailPanel';

export default function App() {
  const [draft, setDraft] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [list, setList] = useState<SlideListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<SlideDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [detailRetry, setDetailRetry] = useState(0);

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

  useEffect(() => {
    if (!selectedId) return;
    const controller = new AbortController();
    setDetail(null);
    setDetailError(null);
    setDetailLoading(true);
    getSlide(selectedId, controller.signal)
      .then((result) => { if (!controller.signal.aborted) setDetail(result); })
      .catch((cause: unknown) => {
        if (!controller.signal.aborted) setDetailError(cause instanceof Error ? cause.message : '상세를 불러오지 못했습니다.');
      })
      .finally(() => { if (!controller.signal.aborted) setDetailLoading(false); });
    return () => controller.abort();
  }, [selectedId, detailRetry]);

  const totalPages = Math.max(1, Math.ceil((list?.total ?? 0) / 20));
  return (
    <main className="app">
      <h1>슬라이드 분석 결과 뷰어</h1>
      <div className="viewer-layout"><section className="list-panel" aria-label="검사 목록">
        <label htmlFor="slide-search">슬라이드 검색</label>
        <input id="slide-search" type="search" value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="슬라이드 ID 또는 환자명" />
        {loading && <p role="status">목록을 불러오는 중입니다.</p>}
        {!loading && error && <div role="alert"><p>{error}</p><button type="button" onClick={() => setRetry((value) => value + 1)}>목록 다시 시도</button></div>}
        {!loading && !error && list && (list.items.length === 0 ? <p>검색 결과가 없습니다.</p> : (
          <ul aria-label="슬라이드 목록" className="slide-list">
            {list.items.map((slide) => (
              <li key={slide.id}>
                <button type="button" className="slide-item" aria-pressed={selectedId === slide.id} onClick={() => setSelectedId(slide.id)}>
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
      <section className="detail-panel" aria-label="슬라이드 상세">
        {!selectedId && <p className="detail-empty">목록에서 슬라이드를 선택해 주세요.</p>}
        {selectedId && detailLoading && <p role="status">상세를 불러오는 중입니다.</p>}
        {selectedId && !detailLoading && detailError && <div role="alert"><p>{detailError}</p><button type="button" onClick={() => setDetailRetry((value) => value + 1)}>상세 다시 시도</button></div>}
        {selectedId && !detailLoading && !detailError && detail?.id === selectedId && <SlideDetailPanel key={selectedId} slide={detail} />}
      </section></div>
    </main>
  );
}
