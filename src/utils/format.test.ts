import { describe, expect, it } from 'vitest';
import { formatCells, formatDate, formatKi67, maskPatientName, statusLabel } from './format';

describe('화면 표시 규칙', () => {
  it('환자명은 첫 글자와 마지막 글자를 남기되 두 글자면 끝을 가린다', () => {
    expect(maskPatientName('홍길동')).toBe('홍*동');
    expect(maskPatientName('김민')).toBe('김*');
    expect(maskPatientName('남궁민수')).toBe('남**수');
  });

  it('UTC 시각을 환경 시간대와 무관하게 KST로 표시한다', () => {
    expect(formatDate('2026-09-01T16:30:00Z')).toBe('2026-09-02 01:30');
  });

  it('Ki67의 0과 null을 구분하고 세포 수에 구분자를 넣는다', () => {
    expect(formatKi67(0)).toBe('0.0%');
    expect(formatKi67(41.16)).toBe('41.2%');
    expect(formatKi67(null)).toBe('분석 결과 없음');
    expect(formatCells(12480, 30321)).toBe('12,480 / 30,321');
  });

  it('상태를 한글로 표시한다', () => {
    expect(statusLabel('completed')).toBe('완료');
    expect(statusLabel('processing')).toBe('분석 중');
    expect(statusLabel('failed')).toBe('실패');
  });
});
