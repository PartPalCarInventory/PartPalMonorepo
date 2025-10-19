import { render, screen, fireEvent, waitFor } from '../test-utils';
import { PartForm } from './PartForm';
import { useQuery } from '@tanstack/react-query';
import { mockPart } from '../test-utils';

// Mock react-query
jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQuery: jest.fn(),
}));

const mockUseQuery = useQuery as jest.MockedFunction<typeof useQuery>;

describe('PartForm', () => {
  const mockVehiclesData = {
    vehicles: [
      { id: 'v1', year: 2020, make: 'Toyota', model: 'Camry', vin: 'VIN123' },
      { id: 'v2', year: 2019, make: 'Honda', model: 'Accord', vin: 'VIN456' },
    ],
  };

  const mockOnSave = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseQuery.mockReturnValue({
      data: mockVehiclesData,
      isLoading: false,
      error: null,
    } as any);
  });

  describe('Form Rendering', () => {
    it('renders all required fields', () => {
      render(<PartForm onSave={mockOnSave} onCancel={mockOnCancel} isSubmitting={false} />);

      expect(screen.getByText('Vehicle *')).toBeInTheDocument();
      expect(screen.getByText('Category *')).toBeInTheDocument();
      expect(screen.getByText('Part Name *')).toBeInTheDocument();
      expect(screen.getByText('Price (R) *')).toBeInTheDocument();
      expect(screen.getByText('Condition *')).toBeInTheDocument();
      expect(screen.getByText('Description *')).toBeInTheDocument();
    });

    it('renders optional fields', () => {
      render(<PartForm onSave={mockOnSave} onCancel={mockOnCancel} isSubmitting={false} />);

      expect(screen.getByText('Part Number')).toBeInTheDocument();
      expect(screen.getByText('Location')).toBeInTheDocument();
      expect(screen.getByText('Weight (kg)')).toBeInTheDocument();
      expect(screen.getByText('Warranty (months)')).toBeInTheDocument();
      expect(screen.getByText('Installation Notes')).toBeInTheDocument();
    });

    it('renders vehicle dropdown with options', () => {
      render(<PartForm onSave={mockOnSave} onCancel={mockOnCancel} isSubmitting={false} />);

      expect(screen.getByText('2020 Toyota Camry (VIN123)')).toBeInTheDocument();
      expect(screen.getByText('2019 Honda Accord (VIN456)')).toBeInTheDocument();
    });

    it('renders category dropdown with options', () => {
      render(<PartForm onSave={mockOnSave} onCancel={mockOnCancel} isSubmitting={false} />);

      expect(screen.getByText('Engine & Drivetrain')).toBeInTheDocument();
      expect(screen.getByText('Brakes & Suspension')).toBeInTheDocument();
    });

    it('renders condition dropdown with options', () => {
      render(<PartForm onSave={mockOnSave} onCancel={mockOnCancel} isSubmitting={false} />);

      expect(screen.getByText('New')).toBeInTheDocument();
      expect(screen.getByText('Excellent')).toBeInTheDocument();
      expect(screen.getByText('Good')).toBeInTheDocument();
    });
  });

  describe('Form Submission (Add Mode)', () => {
    it('calls onSave with form data when all required fields are filled', async () => {
      render(<PartForm onSave={mockOnSave} onCancel={mockOnCancel} isSubmitting={false} />);

      // Fill required fields - use labels or text to find selects
      const vehicleSelect = screen.getByText('Select Vehicle').closest('select');
      if (vehicleSelect) {
        fireEvent.change(vehicleSelect, { target: { value: 'v1' } });
      }

      const categorySelect = screen.getByText('Select Category').closest('select');
      if (categorySelect) {
        fireEvent.change(categorySelect, { target: { value: 'engine' } });
      }

      fireEvent.change(screen.getByPlaceholderText('e.g., Front Bumper, Alternator'), {
        target: { value: 'Engine Block' },
      });
      fireEvent.change(screen.getByPlaceholderText('Detailed description of the part, including condition notes, compatibility, etc.'), {
        target: { value: 'Test description' },
      });
      fireEvent.change(screen.getByPlaceholderText('0.00'), { target: { value: '1000' } });

      // Submit form
      const form = screen.getByPlaceholderText('e.g., Front Bumper, Alternator').closest('form');
      if (form) {
        fireEvent.submit(form);

        await waitFor(() => {
          expect(mockOnSave).toHaveBeenCalled();
        });
      }
    });

    it('shows error when vehicle is not selected', () => {
      render(<PartForm onSave={mockOnSave} onCancel={mockOnCancel} isSubmitting={false} />);

      const form = screen.getByPlaceholderText('e.g., Front Bumper, Alternator').closest('form');
      if (form) {
        fireEvent.submit(form);
        expect(screen.getByText('Vehicle is required')).toBeInTheDocument();
      }
    });

    it('shows error when part name is empty', () => {
      render(<PartForm onSave={mockOnSave} onCancel={mockOnCancel} isSubmitting={false} />);

      const form = screen.getByPlaceholderText('e.g., Front Bumper, Alternator').closest('form');
      if (form) {
        fireEvent.submit(form);
        expect(screen.getByText('Part name is required')).toBeInTheDocument();
      }
    });

    it('shows error when description is empty', () => {
      render(<PartForm onSave={mockOnSave} onCancel={mockOnCancel} isSubmitting={false} />);

      const form = screen.getByPlaceholderText('e.g., Front Bumper, Alternator').closest('form');
      if (form) {
        fireEvent.submit(form);
        expect(screen.getByText('Description is required')).toBeInTheDocument();
      }
    });

    it('shows error when category is not selected', () => {
      render(<PartForm onSave={mockOnSave} onCancel={mockOnCancel} isSubmitting={false} />);

      const form = screen.getByPlaceholderText('e.g., Front Bumper, Alternator').closest('form');
      if (form) {
        fireEvent.submit(form);
        expect(screen.getByText('Category is required')).toBeInTheDocument();
      }
    });

    it('shows error when price is zero or negative', () => {
      render(<PartForm onSave={mockOnSave} onCancel={mockOnCancel} isSubmitting={false} />);

      const form = screen.getByPlaceholderText('e.g., Front Bumper, Alternator').closest('form');
      if (form) {
        fireEvent.submit(form);
        expect(screen.getByText('Price must be greater than 0')).toBeInTheDocument();
      }
    });
  });

  describe('Form Submission (Edit Mode)', () => {
    const existingPart = mockPart({
      id: 'part-1',
      vehicleId: 'v1',
      name: 'Engine Block',
      partNumber: 'ENG-001',
      description: 'Test description',
      condition: 'EXCELLENT',
      price: 5000,
      location: 'Bay A3',
      categoryId: 'engine',
      weight: 150,
      warranty: 6,
      dimensions: { length: 80, width: 60, height: 70 },
      installationNotes: 'Professional installation required',
    });

    it('populates form with existing part data', () => {
      render(<PartForm part={existingPart} onSave={mockOnSave} onCancel={mockOnCancel} isSubmitting={false} />);

      expect(screen.getByDisplayValue('Engine Block')).toBeInTheDocument();
      expect(screen.getByDisplayValue('ENG-001')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Test description')).toBeInTheDocument();
      expect(screen.getByDisplayValue('5000')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Bay A3')).toBeInTheDocument();
    });

    it('disables vehicle field when editing', () => {
      render(<PartForm part={existingPart} onSave={mockOnSave} onCancel={mockOnCancel} isSubmitting={false} />);

      const vehicleSelect = screen.getByText('Select Vehicle').closest('select');
      expect(vehicleSelect).toBeDisabled();
    });

    it('shows Update Part button text when editing', () => {
      render(<PartForm part={existingPart} onSave={mockOnSave} onCancel={mockOnCancel} isSubmitting={false} />);

      expect(screen.getByText('Update Part')).toBeInTheDocument();
    });
  });

  describe('Form Actions', () => {
    it('renders Cancel button', () => {
      render(<PartForm onSave={mockOnSave} onCancel={mockOnCancel} isSubmitting={false} />);

      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('calls onCancel when Cancel button is clicked', () => {
      render(<PartForm onSave={mockOnSave} onCancel={mockOnCancel} isSubmitting={false} />);

      fireEvent.click(screen.getByText('Cancel'));
      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });

    it('renders Add Part button in add mode', () => {
      render(<PartForm onSave={mockOnSave} onCancel={mockOnCancel} isSubmitting={false} />);

      expect(screen.getByText('Add Part')).toBeInTheDocument();
    });

    it('disables buttons when submitting', () => {
      render(<PartForm onSave={mockOnSave} onCancel={mockOnCancel} isSubmitting={true} />);

      expect(screen.getByText('Cancel')).toBeDisabled();
      expect(screen.getByText('Adding...')).toBeDisabled();
    });

    it('shows loading text when submitting in add mode', () => {
      render(<PartForm onSave={mockOnSave} onCancel={mockOnCancel} isSubmitting={true} />);

      expect(screen.getByText('Adding...')).toBeInTheDocument();
    });

    it('shows loading text when submitting in edit mode', () => {
      const part = mockPart({ id: 'part-1', name: 'Test Part' });
      render(<PartForm part={part} onSave={mockOnSave} onCancel={mockOnCancel} isSubmitting={true} />);

      expect(screen.getByText('Updating...')).toBeInTheDocument();
    });
  });

  describe('Field Validation', () => {
    it('clears error when user starts typing in field with error', () => {
      render(<PartForm onSave={mockOnSave} onCancel={mockOnCancel} isSubmitting={false} />);

      const form = screen.getByPlaceholderText('e.g., Front Bumper, Alternator').closest('form');
      if (form) {
        fireEvent.submit(form);
        expect(screen.getByText('Part name is required')).toBeInTheDocument();

        const nameInput = screen.getByPlaceholderText('e.g., Front Bumper, Alternator');
        fireEvent.change(nameInput, { target: { value: 'Engine' } });

        expect(screen.queryByText('Part name is required')).not.toBeInTheDocument();
      }
    });

    it('converts part number to uppercase', () => {
      render(<PartForm onSave={mockOnSave} onCancel={mockOnCancel} isSubmitting={false} />);

      const partNumberInput = screen.getByPlaceholderText('OEM or aftermarket part number');
      fireEvent.change(partNumberInput, { target: { value: 'eng001' } });

      expect(partNumberInput).toHaveValue('ENG001');
    });
  });

  describe('Optional Fields', () => {
    it('handles weight input', () => {
      render(<PartForm onSave={mockOnSave} onCancel={mockOnCancel} isSubmitting={false} />);

      const weightInput = screen.getByPlaceholderText('Weight in kilograms');
      fireEvent.change(weightInput, { target: { value: '100' } });

      expect(weightInput).toHaveValue(100);
    });

    it('handles warranty input', () => {
      render(<PartForm onSave={mockOnSave} onCancel={mockOnCancel} isSubmitting={false} />);

      const warrantyInput = screen.getByPlaceholderText('Warranty period in months');
      fireEvent.change(warrantyInput, { target: { value: '12' } });

      expect(warrantyInput).toHaveValue(12);
    });

    it('handles installation notes input', () => {
      render(<PartForm onSave={mockOnSave} onCancel={mockOnCancel} isSubmitting={false} />);

      const notesInput = screen.getByPlaceholderText('Special installation requirements or notes for mechanics');
      fireEvent.change(notesInput, { target: { value: 'Requires special tools' } });

      expect(notesInput).toHaveValue('Requires special tools');
    });

    it('handles dimension inputs', () => {
      render(<PartForm onSave={mockOnSave} onCancel={mockOnCancel} isSubmitting={false} />);

      const lengthInput = screen.getByPlaceholderText('Length');
      const widthInput = screen.getByPlaceholderText('Width');
      const heightInput = screen.getByPlaceholderText('Height');

      fireEvent.change(lengthInput, { target: { value: '80' } });
      fireEvent.change(widthInput, { target: { value: '60' } });
      fireEvent.change(heightInput, { target: { value: '70' } });

      expect(lengthInput).toHaveValue(80);
      expect(widthInput).toHaveValue(60);
      expect(heightInput).toHaveValue(70);
    });
  });

  describe('Condition Selection', () => {
    it('defaults to GOOD condition', () => {
      render(<PartForm onSave={mockOnSave} onCancel={mockOnCancel} isSubmitting={false} />);

      const conditionSelect = screen.getByDisplayValue('Good');
      expect(conditionSelect).toBeInTheDocument();
    });

    it('allows changing condition', () => {
      render(<PartForm onSave={mockOnSave} onCancel={mockOnCancel} isSubmitting={false} />);

      const conditionSelect = screen.getByDisplayValue('Good');
      fireEvent.change(conditionSelect, { target: { value: 'EXCELLENT' } });

      expect(screen.getByDisplayValue('Excellent')).toBeInTheDocument();
    });
  });
});
