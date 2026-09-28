import { http, HttpResponse } from 'msw';
import { server } from '../mocks/node';
import { getSlide, getSlides } from './client';

describe('slide API', () => {
  it('목록 페이지와 상세 정보를 가져온다', async () => {
    const list = await getSlides({ page: 1, q: '홍길동' });
    expect(list.pageSize).toBe(20);
    expect(list.items.some((item) => item.patientName === '홍길동')).toBe(true);
    const detail = await getSlide(list.items[0].id);
    expect(detail.imageUrl).toMatch(/^\/slides\//);
  });

  it('HTTP 에러를 성공 데이터로 취급하지 않는다', async () => {
    server.use(
      http.get('/api/slides', () =>
        HttpResponse.json({ message: 'Internal Server Error' }, { status: 500 }),
      ),
    );
    await expect(getSlides({ page: 1, q: '' })).rejects.toThrow('Internal Server Error');
  });
});
