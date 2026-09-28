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
