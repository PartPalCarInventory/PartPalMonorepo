import { render, screen, fireEvent } from '../test-utils';
import { MobileLayout, MobileCard, MobileButton } from './MobileLayout';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/router';

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

// Mock AuthContext
jest.mock('../contexts/AuthContext');

// Mock MobileNavigation and MobileBottomNav components
jest.mock('./MobileNavigation', () => ({
  MobileNavigation: ({ isOpen, onClose }: any) => (
    isOpen ? (
      <div data-testid="mobile-navigation">
        <button onClick={onClose}>Close Nav</button>
      </div>
    ) : null
  ),
  MobileBottomNav: () => <div data-testid="mobile-bottom-nav">Bottom Nav</div>,
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockPush = jest.fn();

describe('MobileLayout', () => {
  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      pathname: '/dashboard',
      query: {},
      asPath: '/dashboard',
      route: '/dashboard',
    });

    mockUseAuth.mockReturnValue({
      user: { id: '1', email: 'test@example.com', name: 'John Doe' },
      login: jest.fn(),
      logout: jest.fn(),
      isLoading: false,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Header', () => {
    it('renders mobile header with title', () => {
      render(
        <MobileLayout title="Test Page">
          <div>Content</div>
        </MobileLayout>
      );

      expect(screen.getByText('Test Page')).toBeInTheDocument();
    });

    it('displays user avatar with first letter of name', () => {
      render(
        <MobileLayout title="Test Page">
          <div>Content</div>
        </MobileLayout>
      );

      expect(screen.getByText('J')).toBeInTheDocument();
    });

    it('displays U when user has no name', () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', email: 'test@example.com', name: '' },
        login: jest.fn(),
        logout: jest.fn(),
        isLoading: false,
      });

      render(
        <MobileLayout title="Test Page">
          <div>Content</div>
        </MobileLayout>
      );

      expect(screen.getByText('U')).toBeInTheDocument();
    });

    it('renders menu button', () => {
      render(
        <MobileLayout title="Test Page">
          <div>Content</div>
        </MobileLayout>
      );

      const menuButton = screen.getByRole('button');
      expect(menuButton).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('opens mobile navigation when menu button is clicked', () => {
      render(
        <MobileLayout title="Test Page">
          <div>Content</div>
        </MobileLayout>
      );

      const menuButton = screen.getByRole('button');
      fireEvent.click(menuButton);

      expect(screen.getByTestId('mobile-navigation')).toBeInTheDocument();
    });

    it('closes mobile navigation when close is called', () => {
      render(
        <MobileLayout title="Test Page">
          <div>Content</div>
        </MobileLayout>
      );

      // Open nav
      const menuButton = screen.getByRole('button');
      fireEvent.click(menuButton);
      expect(screen.getByTestId('mobile-navigation')).toBeInTheDocument();

      // Close nav
      const closeButton = screen.getByText('Close Nav');
      fireEvent.click(closeButton);
      expect(screen.queryByTestId('mobile-navigation')).not.toBeInTheDocument();
    });

    it('does not render mobile navigation when closed', () => {
      render(
        <MobileLayout title="Test Page">
          <div>Content</div>
        </MobileLayout>
      );

      expect(screen.queryByTestId('mobile-navigation')).not.toBeInTheDocument();
    });
  });

  describe('Content', () => {
    it('renders children content', () => {
      render(
        <MobileLayout title="Test Page">
          <div>Test Content</div>
        </MobileLayout>
      );

      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = render(
        <MobileLayout title="Test Page" className="custom-class">
          <div>Content</div>
        </MobileLayout>
      );

      const layout = container.querySelector('.custom-class');
      expect(layout).toBeInTheDocument();
    });
  });

  describe('Bottom Navigation', () => {
    it('renders bottom navigation by default', () => {
      render(
        <MobileLayout title="Test Page">
          <div>Content</div>
        </MobileLayout>
      );

      expect(screen.getByTestId('mobile-bottom-nav')).toBeInTheDocument();
    });

    it('renders bottom navigation when showBottomNav is true', () => {
      render(
        <MobileLayout title="Test Page" showBottomNav={true}>
          <div>Content</div>
        </MobileLayout>
      );

      expect(screen.getByTestId('mobile-bottom-nav')).toBeInTheDocument();
    });

    it('does not render bottom navigation when showBottomNav is false', () => {
      render(
        <MobileLayout title="Test Page" showBottomNav={false}>
          <div>Content</div>
        </MobileLayout>
      );

      expect(screen.queryByTestId('mobile-bottom-nav')).not.toBeInTheDocument();
    });
  });
});

describe('MobileCard', () => {
  describe('Basic Rendering', () => {
    it('renders children content', () => {
      render(<MobileCard>Card Content</MobileCard>);
      expect(screen.getByText('Card Content')).toBeInTheDocument();
    });

    it('applies default medium padding', () => {
      const { container } = render(<MobileCard>Content</MobileCard>);
      const card = container.querySelector('.p-4');
      expect(card).toBeInTheDocument();
    });

    it('applies small padding when specified', () => {
      const { container } = render(<MobileCard padding="sm">Content</MobileCard>);
      const card = container.querySelector('.p-3');
      expect(card).toBeInTheDocument();
    });

    it('applies large padding when specified', () => {
      const { container } = render(<MobileCard padding="lg">Content</MobileCard>);
      const card = container.querySelector('.p-6');
      expect(card).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = render(<MobileCard className="custom-class">Content</MobileCard>);
      const card = container.querySelector('.custom-class');
      expect(card).toBeInTheDocument();
    });
  });

  describe('Interactive Behavior', () => {
    it('calls onClick when clicked', () => {
      const handleClick = jest.fn();
      render(<MobileCard onClick={handleClick}>Clickable Card</MobileCard>);

      const card = screen.getByRole('button');
      fireEvent.click(card);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('renders as button role when onClick is provided', () => {
      render(<MobileCard onClick={() => {}}>Clickable Card</MobileCard>);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('does not render as button role when onClick is not provided', () => {
      render(<MobileCard>Non-clickable Card</MobileCard>);
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('handles Enter key press when onClick is provided', () => {
      const handleClick = jest.fn();
      render(<MobileCard onClick={handleClick}>Card</MobileCard>);

      const card = screen.getByRole('button');
      fireEvent.keyDown(card, { key: 'Enter' });

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('handles Space key press when onClick is provided', () => {
      const handleClick = jest.fn();
      render(<MobileCard onClick={handleClick}>Card</MobileCard>);

      const card = screen.getByRole('button');
      fireEvent.keyDown(card, { key: ' ' });

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('does not call onClick on other key presses', () => {
      const handleClick = jest.fn();
      render(<MobileCard onClick={handleClick}>Card</MobileCard>);

      const card = screen.getByRole('button');
      fireEvent.keyDown(card, { key: 'a' });

      expect(handleClick).not.toHaveBeenCalled();
    });
  });
});

describe('MobileButton', () => {
  describe('Basic Rendering', () => {
    it('renders children content', () => {
      render(<MobileButton>Button Text</MobileButton>);
      expect(screen.getByText('Button Text')).toBeInTheDocument();
    });

    it('renders as button element', () => {
      render(<MobileButton>Click Me</MobileButton>);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  describe('Variants', () => {
    it('applies primary variant by default', () => {
      const { container } = render(<MobileButton>Primary</MobileButton>);
      const button = container.querySelector('.bg-blue-600');
      expect(button).toBeInTheDocument();
    });

    it('applies secondary variant styling', () => {
      const { container } = render(<MobileButton variant="secondary">Secondary</MobileButton>);
      const button = container.querySelector('.bg-white');
      expect(button).toBeInTheDocument();
    });

    it('applies danger variant styling', () => {
      const { container } = render(<MobileButton variant="danger">Danger</MobileButton>);
      const button = container.querySelector('.bg-red-600');
      expect(button).toBeInTheDocument();
    });
  });

  describe('Sizes', () => {
    it('applies medium size by default', () => {
      const { container } = render(<MobileButton>Medium</MobileButton>);
      const button = container.querySelector('.px-4.py-3');
      expect(button).toBeInTheDocument();
    });

    it('applies small size styling', () => {
      const { container } = render(<MobileButton size="sm">Small</MobileButton>);
      const button = container.querySelector('.px-3.py-2');
      expect(button).toBeInTheDocument();
    });

    it('applies large size styling', () => {
      const { container } = render(<MobileButton size="lg">Large</MobileButton>);
      const button = container.querySelector('.px-6.py-4');
      expect(button).toBeInTheDocument();
    });
  });

  describe('Width', () => {
    it('does not apply full width by default', () => {
      const { container } = render(<MobileButton>Button</MobileButton>);
      const button = screen.getByRole('button');
      expect(button).not.toHaveClass('w-full');
    });

    it('applies full width when specified', () => {
      render(<MobileButton fullWidth={true}>Full Width</MobileButton>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('w-full');
    });
  });

  describe('Disabled State', () => {
    it('is not disabled by default', () => {
      render(<MobileButton>Button</MobileButton>);
      expect(screen.getByRole('button')).not.toBeDisabled();
    });

    it('can be disabled', () => {
      render(<MobileButton disabled={true}>Disabled</MobileButton>);
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('does not call onClick when disabled', () => {
      const handleClick = jest.fn();
      render(<MobileButton disabled={true} onClick={handleClick}>Disabled</MobileButton>);

      fireEvent.click(screen.getByRole('button'));

      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('Click Handling', () => {
    it('calls onClick when clicked', () => {
      const handleClick = jest.fn();
      render(<MobileButton onClick={handleClick}>Click Me</MobileButton>);

      fireEvent.click(screen.getByRole('button'));

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('works without onClick handler', () => {
      render(<MobileButton>Button</MobileButton>);
      expect(() => fireEvent.click(screen.getByRole('button'))).not.toThrow();
    });
  });

  describe('Custom Styling', () => {
    it('applies custom className', () => {
      const { container } = render(<MobileButton className="custom-class">Button</MobileButton>);
      const button = container.querySelector('.custom-class');
      expect(button).toBeInTheDocument();
    });
  });
});
