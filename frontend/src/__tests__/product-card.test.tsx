import { render, screen } from '@testing-library/react';
import ProductCard from '@/components/ProductCard';

jest.mock('next/link', () => {
  return ({ children, href }: any) => (
    <a href={href} data-testid={`link-${href}`}>
      {children}
    </a>
  );
});

const mockProduct = {
  id: 1,
  url: 'https://amazon.com/dp/B123456',
  title: 'Premium Wireless Headphones',
  current_price: 3999.0,
  last_checked: '2026-05-30T10:00:00Z',
  created_at: '2026-05-20T10:00:00Z',
};

describe('ProductCard Component', () => {
  it('displays product title', () => {
    render(<ProductCard product={mockProduct} />);
    
    expect(screen.getByText('Premium Wireless Headphones')).toBeInTheDocument();
  });

  it('displays current price', () => {
    render(<ProductCard product={mockProduct} />);
    
    expect(screen.getByText('₹3999.00')).toBeInTheDocument();
  });

  it('displays current price as N/A when null', () => {
    const productWithoutPrice = { ...mockProduct, current_price: null };
    render(<ProductCard product={productWithoutPrice} />);
    
    expect(screen.getByText('N/A')).toBeInTheDocument();
  });

  it('displays last updated timestamp', () => {
    render(<ProductCard product={mockProduct} />);
    
    expect(screen.getByText(/Last updated:/i)).toBeInTheDocument();
  });

  it('displays tracked since date', () => {
    render(<ProductCard product={mockProduct} />);
    
    expect(screen.getByText(/Tracked since:/i)).toBeInTheDocument();
  });

  it('has link to product detail page', () => {
    render(<ProductCard product={mockProduct} />);
    
    expect(screen.getByTestId('link-/dashboard/products/1')).toBeInTheDocument();
  });

  it('has external link to product URL', () => {
    render(<ProductCard product={mockProduct} />);
    
    const externalLink = screen.getByText('View on site ↗');
    expect(externalLink).toHaveAttribute('href', mockProduct.url);
    expect(externalLink).toHaveAttribute('target', '_blank');
  });

  it('displays untitled product when title is missing', () => {
    const productWithoutTitle = { ...mockProduct, title: '' };
    render(<ProductCard product={productWithoutTitle} />);
    
    expect(screen.getByText('Untitled Product')).toBeInTheDocument();
  });
});
