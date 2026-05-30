import { render, screen } from '@testing-library/react';
import PriceChart from '@/components/PriceChart';

const mockHistoryData = [
  { id: 1, product: 1, price: 1500.0, timestamp: '2026-05-28T10:00:00Z' },
  { id: 2, product: 1, price: 1450.0, timestamp: '2026-05-29T10:00:00Z' },
  { id: 3, product: 1, price: 1400.0, timestamp: '2026-05-30T10:00:00Z' },
];

jest.mock('recharts', () => ({
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  XAxis: () => <div data-testid="xaxis" />,
  YAxis: () => <div data-testid="yaxis" />,
  CartesianGrid: () => <div data-testid="grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  ResponsiveContainer: ({ children }: any) => (
    <div data-testid="responsive-container">{children}</div>
  ),
}));

describe('PriceChart Component', () => {
  it('renders chart with valid data', () => {
    render(<PriceChart data={mockHistoryData} />);
    
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
  });

  it('displays loading state', () => {
    render(<PriceChart data={[]} loading={true} />);
    
    expect(screen.getByText('Loading chart...')).toBeInTheDocument();
  });

  it('shows empty state when no data', () => {
    render(<PriceChart data={[]} />);
    
    expect(screen.getByText('No price history available yet')).toBeInTheDocument();
  });

  it('renders chart components', () => {
    render(<PriceChart data={mockHistoryData} />);
    
    expect(screen.getByTestId('xaxis')).toBeInTheDocument();
    expect(screen.getByTestId('yaxis')).toBeInTheDocument();
    expect(screen.getByTestId('grid')).toBeInTheDocument();
    expect(screen.getByTestId('tooltip')).toBeInTheDocument();
    expect(screen.getByTestId('legend')).toBeInTheDocument();
  });
});
