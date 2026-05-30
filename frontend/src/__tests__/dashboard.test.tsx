import { render, screen, waitFor } from '@testing-library/react';
import DashboardPage from '@/app/dashboard/page';
import * as api from '@/lib/api';

jest.mock('@/lib/api');

const mockProducts = [
  {
    id: 1,
    url: 'https://amazon.com/dp/B123456',
    title: 'Test Product 1',
    current_price: 1500.0,
    last_checked: '2026-05-30T10:00:00Z',
    created_at: '2026-05-20T10:00:00Z',
  },
  {
    id: 2,
    url: 'https://flipkart.com/p/ABC123',
    title: 'Test Product 2',
    current_price: 2500.0,
    last_checked: '2026-05-30T10:30:00Z',
    created_at: '2026-05-25T10:00:00Z',
  },
];

describe('Dashboard Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders dashboard header', async () => {
    (api.getProducts as jest.Mock).mockResolvedValue(mockProducts);
    
    render(await DashboardPage());
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Track and monitor your product prices')).toBeInTheDocument();
  });

  it('displays add product button', async () => {
    (api.getProducts as jest.Mock).mockResolvedValue(mockProducts);
    
    render(await DashboardPage());
    
    expect(screen.getByText('+ Add Product')).toBeInTheDocument();
  });

  it('displays product statistics', async () => {
    (api.getProducts as jest.Mock).mockResolvedValue(mockProducts);
    
    render(await DashboardPage());
    
    expect(screen.getByText('Total Products')).toBeInTheDocument();
    expect(screen.getByText('Average Price')).toBeInTheDocument();
    expect(screen.getByText('Last Updated')).toBeInTheDocument();
  });

  it('shows message when no products tracked', async () => {
    (api.getProducts as jest.Mock).mockResolvedValue([]);
    
    render(await DashboardPage());
    
    expect(screen.getByText('No products tracked yet')).toBeInTheDocument();
    expect(screen.getByText('Start Tracking')).toBeInTheDocument();
  });

  it('handles API errors gracefully', async () => {
    (api.getProducts as jest.Mock).mockRejectedValue(new Error('API Error'));
    
    render(await DashboardPage());
    
    expect(screen.getByText('API Error')).toBeInTheDocument();
  });
});
