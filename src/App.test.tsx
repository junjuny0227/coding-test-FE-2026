import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from './mocks/node';
import App from './App';

describe('슬라이드 목록', () => {
  it('20건과 페이지 이동을 제공한다', async () => {
    const user = userEvent.setup();
    render(<App />);
    expect(await screen.findByRole('list', { name: '슬라이드 목록' })).toBeInTheDocument();
    expect(within(screen.getByRole('list', { name: '슬라이드 목록' })).getAllByRole('button')).toHaveLength(20);
    await user.click(screen.getByRole('button', { name: '다음 페이지' }));
    expect(await screen.findByText('2 / 3')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '다음 페이지' }));
    expect(await screen.findByText('3 / 3')).toBeInTheDocument();
    expect(within(screen.getByRole('list', { name: '슬라이드 목록' })).getAllByRole('button')).toHaveLength(17);
  });

  it('검색 후 결과가 없으면 빈 상태를 보여준다', async () => {
    const user = userEvent.setup();
    render(<App />);
    await screen.findByRole('list', { name: '슬라이드 목록' });
    await user.type(screen.getByRole('searchbox', { name: '슬라이드 검색' }), '없는환자');
    expect(await screen.findByText('검색 결과가 없습니다.')).toBeInTheDocument();
  });

  it('목록 오류를 보여주고 재시도한다', async () => {
    server.use(http.get('/api/slides', () => HttpResponse.json({ message: 'Internal Server Error' }, { status: 500 })));
    const user = userEvent.setup();
    render(<App />);
    expect(await screen.findByText(/Internal Server Error/)).toBeInTheDocument();
    server.resetHandlers();
    await user.click(screen.getByRole('button', { name: '목록 다시 시도' }));
    expect(await screen.findByRole('list', { name: '슬라이드 목록' })).toBeInTheDocument();
  });
});

describe('슬라이드 상세', () => {
  it('Ki67 0을 결과로 표시하고 heatmap을 조절한다', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.type(screen.getByRole('searchbox', { name: '슬라이드 검색' }), 'S-2026-0010');
    await user.click(await screen.findByRole('button', { name: /S-2026-0010/ }));
    expect(await screen.findByText('0.0%')).toBeInTheDocument();
    expect(screen.getByText('0 / 8,421')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: '슬라이드 원본 이미지' })).toBeInTheDocument();
    const overlay = screen.getByRole('img', { name: 'Heatmap 오버레이' });
    expect(overlay).toHaveStyle({ opacity: '0.5' });
    await user.click(screen.getByRole('checkbox', { name: 'Heatmap 표시' }));
    expect(overlay).not.toBeInTheDocument();
  });

  it('분석 중인 슬라이드는 결과가 없고 heatmap 조작이 비활성화된다', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.type(screen.getByRole('searchbox', { name: '슬라이드 검색' }), 'S-2026-0014');
    await user.click(await screen.findByRole('button', { name: /S-2026-0014/ }));
    expect(await screen.findAllByText('분석 결과 없음')).toHaveLength(2);
    expect(screen.getByRole('checkbox', { name: 'Heatmap 표시' })).toBeDisabled();
    expect(screen.queryByRole('img', { name: 'Heatmap 오버레이' })).not.toBeInTheDocument();
  });

  it('상세 오류에서 재시도할 수 있다', async () => {
    server.use(http.get('/api/slides/:id', () => HttpResponse.json({ message: 'Internal Server Error' }, { status: 500 })));
    const user = userEvent.setup();
    render(<App />);
    await user.click((await screen.findAllByRole('button', { name: /S-2026-/ }))[0]);
    expect(await screen.findByRole('button', { name: '상세 다시 시도' })).toBeInTheDocument();
    server.resetHandlers();
    await user.click(screen.getByRole('button', { name: '상세 다시 시도' }));
    expect(await screen.findByRole('img', { name: '슬라이드 원본 이미지' })).toBeInTheDocument();
  });
});
