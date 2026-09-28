import { useState } from 'react';
import type { SlideDetail } from './api/types';
import { formatCells, formatDate, formatKi67, maskPatientName, statusLabel } from './utils/format';

export function SlideDetailPanel({ slide }: { slide: SlideDetail }) {
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [opacity, setOpacity] = useState(50);
  const available = slide.heatmapUrl !== null;

  return (
    <>
      <header className="detail-heading">
        <div><span className="eyebrow">SLIDE DETAIL</span><h2>{slide.id}</h2></div>
        <span className={`badge ${slide.status}`}>{statusLabel(slide.status)}</span>
      </header>
      <div className="image-stage">
        <img src={slide.imageUrl} alt="슬라이드 원본 이미지" />
        {available && showHeatmap && <img className="heatmap" src={slide.heatmapUrl!} alt="Heatmap 오버레이" style={{ opacity: opacity / 100 }} />}
      </div>
      <div className="heatmap-controls">
        <label><input type="checkbox" checked={available && showHeatmap} disabled={!available} onChange={(event) => setShowHeatmap(event.target.checked)} /> Heatmap 표시</label>
        <label htmlFor="heatmap-opacity">투명도 {opacity}%</label>
        <input id="heatmap-opacity" aria-label="Heatmap 투명도" type="range" min="0" max="100" value={opacity} disabled={!available} onChange={(event) => setOpacity(Number(event.target.value))} />
      </div>
      <dl className="analysis-grid">
        <div><dt>환자명</dt><dd>{maskPatientName(slide.patientName)}</dd></div>
        <div><dt>검사일시</dt><dd><time dateTime={slide.examinedAt}>{formatDate(slide.examinedAt)}</time></dd></div>
        <div><dt>분석 상태</dt><dd>{statusLabel(slide.status)}</dd></div>
        <div><dt>Ki67 양성률</dt><dd>{formatKi67(slide.analysis.ki67Index)}</dd></div>
        <div><dt>양성 / 전체 세포 수</dt><dd>{formatCells(slide.analysis.positiveCells, slide.analysis.totalCells)}</dd></div>
        <div><dt>분석 완료 일시</dt><dd>{slide.analysis.analyzedAt ? formatDate(slide.analysis.analyzedAt) : '—'}</dd></div>
      </dl>
    </>
  );
}
