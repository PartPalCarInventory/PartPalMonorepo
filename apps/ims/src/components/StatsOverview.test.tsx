import { render, screen } from '../test-utils';
import { StatsOverview } from './StatsOverview';

describe('StatsOverview', () => {
  it('renders all stat cards', () => {
    render(<StatsOverview />);

    expect(screen.getByText('Total Vehicles')).toBeInTheDocument();
    expect(screen.getByText('Total Parts')).toBeInTheDocument();
    expect(screen.getByText('Recent Sales')).toBeInTheDocument();
    expect(screen.getByText('Monthly Revenue')).toBeInTheDocument();
  });

  it('displays zero values when no stats provided', () => {
    render(<StatsOverview />);

    const statValues = screen.getAllByText('0');
    expect(statValues.length).toBeGreaterThan(0);
  });

  it('displays provided stats correctly', () => {
    const stats = {
      totalVehicles: 150,
      totalParts: 2500,
      recentSales: 45,
      monthlyRevenue: 125000,
      lowStockItems: 10,
      pendingOrders: 5,
    };

    render(<StatsOverview stats={stats} />);

    expect(screen.getByText('150')).toBeInTheDocument();
    expect(screen.getByText('2,500')).toBeInTheDocument();
    expect(screen.getByText('45')).toBeInTheDocument();
    expect(screen.getByText('R125,000')).toBeInTheDocument();
  });

  it('formats revenue with currency prefix', () => {
    const stats = {
      totalVehicles: 0,
      totalParts: 0,
      recentSales: 0,
      monthlyRevenue: 5000,
      lowStockItems: 0,
      pendingOrders: 0,
    };

    render(<StatsOverview stats={stats} />);

    expect(screen.getByText('R5,000')).toBeInTheDocument();
  });

  it('shows percentage changes', () => {
    render(<StatsOverview />);

    expect(screen.getByText('+12%')).toBeInTheDocument();
    expect(screen.getByText('+8%')).toBeInTheDocument();
    expect(screen.getByText('+23%')).toBeInTheDocument();
    expect(screen.getByText('+18%')).toBeInTheDocument();
  });
});
