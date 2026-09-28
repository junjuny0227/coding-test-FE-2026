import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from './mocks/node';
import App from './App';

afterEach(() => {
  window.history.replaceState(null, '', '/');
  vi.unstubAllGlobals();
});

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

  it('연속 입력은 마지막 검색어로 한 번만 요청한다', async () => {
    const user = userEvent.setup();
    render(<App />);
    await screen.findByRole('list', { name: '슬라이드 목록' });
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    await user.type(screen.getByRole('searchbox', { name: '슬라이드 검색' }), 'S-2026-0010');
    await waitFor(() => expect(new URLSearchParams(window.location.search).get('q')).toBe('S-2026-0010'));
    await waitFor(() => expect(within(screen.getByRole('list', { name: '슬라이드 목록' })).getAllByRole('button')).toHaveLength(1));
    const searches = fetchSpy.mock.calls
      .map(([input]) => new URL(String(input), window.location.origin))
      .filter((url) => url.pathname === '/api/slides' && url.searchParams.has('q'));
    expect(searches).toHaveLength(1);
    expect(searches[0].searchParams.get('q')).toBe('S-2026-0010');
    fetchSpy.mockRestore();
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
  it('모바일에서 목록 항목을 선택하면 상세로 이동한다', async () => {
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: true })));
    const user = userEvent.setup();
    render(<App />);
    const panel = screen.getByRole('region', { name: '슬라이드 상세' });
    const scrollIntoView = vi.fn();
    Object.defineProperty(panel, 'scrollIntoView', { value: scrollIntoView });
    const items = within(await screen.findByRole('list', { name: '슬라이드 목록' })).getAllByRole('button');
    expect(items).toHaveLength(20);
    await user.click(items[0]);
    await screen.findByRole('img', { name: '슬라이드 원본 이미지' });
    await waitFor(() => expect(scrollIntoView).toHaveBeenCalledWith({ block: 'start', behavior: 'auto' }));
    expect(panel).toHaveFocus();
    await user.click(items[0]);
    expect(scrollIntoView).toHaveBeenCalledTimes(2);
  });

  it('데스크톱에서는 선택해도 화면을 이동하지 않는다', async () => {
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false })));
    const user = userEvent.setup();
    render(<App />);
    const panel = screen.getByRole('region', { name: '슬라이드 상세' });
    const scrollIntoView = vi.fn();
    Object.defineProperty(panel, 'scrollIntoView', { value: scrollIntoView });
    await user.click((await screen.findAllByRole('button', { name: /S-2026-/ }))[0]);
    await screen.findByRole('img', { name: '슬라이드 원본 이미지' });
    expect(scrollIntoView).not.toHaveBeenCalled();
  });

  it('모바일 공유 URL을 열 때는 자동으로 스크롤하지 않는다', async () => {
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: true })));
    window.history.replaceState(null, '', '/?slide=S-2026-0010');
    render(<App />);
    const panel = screen.getByRole('region', { name: '슬라이드 상세' });
    const scrollIntoView = vi.fn();
    Object.defineProperty(panel, 'scrollIntoView', { value: scrollIntoView });
    await screen.findByRole('img', { name: '슬라이드 원본 이미지' });
    expect(scrollIntoView).not.toHaveBeenCalled();
  });

  it('모바일 상세 오류도 선택 후 바로 확인할 수 있다', async () => {
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: true })));
    server.use(http.get('/api/slides/:id', () => HttpResponse.json({ message: 'Internal Server Error' }, { status: 500 })));
    const user = userEvent.setup();
    render(<App />);
    const panel = screen.getByRole('region', { name: '슬라이드 상세' });
    const scrollIntoView = vi.fn();
    Object.defineProperty(panel, 'scrollIntoView', { value: scrollIntoView });
    await user.click((await screen.findAllByRole('button', { name: /S-2026-/ }))[0]);
    await screen.findByRole('button', { name: '상세 다시 시도' });
    await waitFor(() => expect(scrollIntoView).toHaveBeenCalledOnce());
  });

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
    fireEvent.change(screen.getByRole('slider', { name: 'Heatmap 투명도' }), { target: { value: '75' } });
    expect(overlay).toHaveStyle({ opacity: '0.75' });
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

describe('탐색 상태', () => {
  it('공유 URL에서 검색·페이지·선택을 복원한다', async () => {
    window.history.replaceState(null, '', '/?q=S-2026-0010&page=1&slide=S-2026-0010');
    render(<App />);
    expect(screen.getByRole('searchbox', { name: '슬라이드 검색' })).toHaveValue('S-2026-0010');
    expect(await screen.findByRole('img', { name: '슬라이드 원본 이미지' })).toBeInTheDocument();
    expect(within(screen.getByRole('list', { name: '슬라이드 목록' })).getAllByRole('button')).toHaveLength(1);
  });

  it('페이지와 선택을 URL에 반영하고 뒤로가기를 복원한다', async () => {
    const user = userEvent.setup();
    render(<App />);
    await screen.findByRole('list', { name: '슬라이드 목록' });
    await user.click(screen.getByRole('button', { name: '다음 페이지' }));
    expect(await screen.findByText('2 / 3')).toBeInTheDocument();
    expect(new URLSearchParams(window.location.search).get('page')).toBe('2');
    await user.click(within(screen.getByRole('list', { name: '슬라이드 목록' })).getAllByRole('button')[0]);
    expect(new URLSearchParams(window.location.search).get('slide')).toMatch(/^S-2026-/);
    window.history.back();
    window.dispatchEvent(new PopStateEvent('popstate'));
    expect(await screen.findByText('목록에서 슬라이드를 선택해 주세요.')).toBeInTheDocument();
  });

  it('방향키로 다음 항목에 이동하고 Enter로 상세를 연다', async () => {
    const user = userEvent.setup();
    render(<App />);
    const items = within(await screen.findByRole('list', { name: '슬라이드 목록' })).getAllByRole('button');
    items[0].focus();
    await user.keyboard('{ArrowDown}');
    expect(items[1]).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(await screen.findByRole('img', { name: '슬라이드 원본 이미지' })).toBeInTheDocument();
    expect(new URLSearchParams(window.location.search).get('slide')).toBe(items[1].querySelector('strong')?.textContent);
  });
});
