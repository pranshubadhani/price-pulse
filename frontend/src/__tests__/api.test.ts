import * as api from '@/lib/api';

// Mock fetch
global.fetch = jest.fn();

const mockToken = 'test-token-123';

describe('API Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  describe('getProducts', () => {
    it('fetches products successfully', async () => {
      const mockProducts = [
        {
          id: 1,
          url: 'https://amazon.com/dp/B123456',
          title: 'Test Product',
          current_price: 1500.0,
          last_checked: '2026-05-30T10:00:00Z',
          created_at: '2026-05-20T10:00:00Z',
        },
      ];

      localStorage.setItem('pricepulse_access', mockToken);
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockProducts,
      });

      const result = await api.getProducts();

      expect(result).toEqual(mockProducts);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/products/'),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: `Bearer ${mockToken}`,
          }),
        })
      );
    });

    it('throws error on API failure', async () => {
      localStorage.setItem('pricepulse_access', mockToken);
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: async () => ({ detail: 'Not found' }),
      });

      await expect(api.getProducts()).rejects.toThrow('Not found');
    });
  });

  describe('getProductHistory', () => {
    it('fetches product history successfully', async () => {
      const mockHistory = [
        { id: 1, product: 1, price: 1500.0, timestamp: '2026-05-28T10:00:00Z' },
        { id: 2, product: 1, price: 1450.0, timestamp: '2026-05-29T10:00:00Z' },
      ];

      localStorage.setItem('pricepulse_access', mockToken);
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockHistory,
      });

      const result = await api.getProductHistory(1);

      expect(result).toEqual(mockHistory);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/products/1/history/'),
        expect.any(Object)
      );
    });
  });

  describe('createProductTracking', () => {
    it('creates product tracking successfully', async () => {
      const mockProduct = {
        id: 1,
        url: 'https://amazon.com/dp/B123456',
        title: 'New Product',
        current_price: 2000.0,
        last_checked: '2026-05-30T10:00:00Z',
        created_at: '2026-05-30T10:00:00Z',
      };

      localStorage.setItem('pricepulse_access', mockToken);
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockProduct,
      });

      const result = await api.createProductTracking('https://amazon.com/dp/B123456', 1500);

      expect(result).toEqual(mockProduct);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/products/'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('https://amazon.com/dp/B123456'),
        })
      );
    });
  });

  describe('updateProductTracking', () => {
    it('updates product tracking successfully', async () => {
      const mockProduct = {
        id: 1,
        url: 'https://amazon.com/dp/B123456',
        title: 'Updated Product',
        current_price: 2000.0,
        last_checked: '2026-05-30T10:00:00Z',
        created_at: '2026-05-20T10:00:00Z',
      };

      localStorage.setItem('pricepulse_access', mockToken);
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockProduct,
      });

      const result = await api.updateProductTracking(1, 1800, true);

      expect(result).toEqual(mockProduct);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/products/1/'),
        expect.objectContaining({
          method: 'PUT',
        })
      );
    });
  });

  describe('Authentication', () => {
    it('includes auth token in requests when available', async () => {
      localStorage.setItem('pricepulse_access', mockToken);
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => [],
      });

      await api.getProducts();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: `Bearer ${mockToken}`,
          }),
        })
      );
    });

    it('works without auth token when not logged in', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => [],
      });

      await api.getProducts();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });
  });
});
