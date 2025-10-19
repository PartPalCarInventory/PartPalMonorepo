# PartPal Accessibility Standards

This document outlines the accessibility features and standards implemented in the PartPal shared-ui component library.

## 🎯 Accessibility Goals

- **WCAG 2.1 AA Compliance**: All components meet or exceed WCAG 2.1 AA standards
- **Keyboard Navigation**: Full keyboard accessibility for all interactive elements
- **Screen Reader Support**: Comprehensive ARIA labeling and semantic structure
- **High Contrast Support**: Components work with high contrast mode
- **Reduced Motion**: Respects user's motion preferences
- **Touch Accessibility**: Mobile-first design with proper touch targets (44px minimum)

## 🚀 Getting Started

### Setup AccessibilityProvider

Wrap your application with the `AccessibilityProvider` to enable global accessibility features:

```tsx
import { AccessibilityProvider } from '@partpal/shared-ui';

function App() {
  return (
    <AccessibilityProvider
      skipLinks={[
        { href: '#main-content', label: 'Skip to main content' },
        { href: '#navigation', label: 'Skip to navigation' },
        { href: '#search', label: 'Skip to search' },
      ]}
    >
      <YourApp />
    </AccessibilityProvider>
  );
}
```

### Using Accessibility Hooks

```tsx
import {
  useAnnouncement,
  useKeyboardNavigation,
  useFocusManagement
} from '@partpal/shared-ui';

function MyComponent() {
  const { announce } = useAnnouncement();
  const { trapFocus, restoreFocus } = useFocusManagement();

  const handleSearch = (results: number) => {
    announce(`Found ${results} parts matching your search`);
  };

  return (
    // Component JSX
  );
}
```

## 🧩 Component Accessibility Features

### Button Component
- ✅ Proper ARIA attributes
- ✅ Keyboard navigation (Enter, Space)
- ✅ Focus indicators
- ✅ Touch targets (44px minimum)
- ✅ High contrast support

```tsx
<Button
  variant="primary"
  aria-label="Add part to inventory"
  onClick={handleAddPart}
>
  Add Part
</Button>
```

### Form Components
- ✅ Associated labels for all inputs
- ✅ Error announcements with `role="alert"`
- ✅ Field descriptions with `aria-describedby`
- ✅ Validation feedback
- ✅ Keyboard navigation

```tsx
<FormField
  label="Part Name"
  description="Enter the official part name"
  error={errors.partName}
  required
>
  <Input
    name="partName"
    aria-invalid={!!errors.partName}
    aria-describedby="partName-error partName-description"
  />
</FormField>
```

### Table Component
- ✅ Sortable columns with ARIA sort indicators
- ✅ Keyboard navigation (arrow keys, home, end)
- ✅ Screen reader announcements for sorting
- ✅ Proper table semantics
- ✅ Pagination controls

```tsx
<Table
  columns={columns}
  data={partsData}
  sortConfig={sortConfig}
  onSort={handleSort}
  pagination={{
    current: 1,
    pageSize: 20,
    total: 100,
    showTotal: (total, range) =>
      `Showing ${range[0]}-${range[1]} of ${total} parts`
  }}
/>
```

### Modal Component
- ✅ Focus trapping
- ✅ Escape key handling
- ✅ Return focus to trigger
- ✅ ARIA modal attributes
- ✅ Backdrop click handling

```tsx
<Modal
  isOpen={isOpen}
  onClose={handleClose}
  title="Part Details"
  description="View and edit part information"
>
  <ModalContent>
    {/* Modal content */}
  </ModalContent>
</Modal>
```

### Select Component
- ✅ Combobox ARIA pattern
- ✅ Keyboard navigation (arrows, enter, escape)
- ✅ Screen reader announcements
- ✅ Search functionality
- ✅ Multi-select support

```tsx
<Select
  label="Vehicle Make"
  options={vehicleMakes}
  searchable
  value={selectedMake}
  onChange={setSelectedMake}
  aria-describedby="make-help"
/>
```

## 🔧 Accessibility Utilities

### Screen Reader Only Content

```tsx
import { ScreenReaderOnly } from '@partpal/shared-ui';

<ScreenReaderOnly>
  This content is only available to screen readers
</ScreenReaderOnly>
```

### Focus Management

```tsx
import { useFocusManagement } from '@partpal/shared-ui';

function Modal() {
  const { trapFocus, restoreFocus } = useFocusManagement();
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      const cleanup = trapFocus(modalRef.current);
      return cleanup;
    }
  }, [isOpen, trapFocus]);
}
```

### Announcements

```tsx
import { useAnnouncement } from '@partpal/shared-ui';

function SearchResults() {
  const { announce } = useAnnouncement();

  useEffect(() => {
    announce(`Search completed. Found ${results.length} parts.`);
  }, [results, announce]);
}
```

### Reduced Motion

```tsx
import { useReducedMotion } from '@partpal/shared-ui';

function AnimatedComponent() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className={cn(
      'transition-transform',
      !prefersReducedMotion && 'hover:scale-105'
    )}>
      Content
    </div>
  );
}
```

## 🧪 Testing Accessibility

### Automated Testing

```tsx
import { auditAccessibility, logAccessibilityReport } from '@partpal/shared-ui';

// Test a component
const component = render(<YourComponent />);
const report = auditAccessibility(component.container);

// Log results to console
logAccessibilityReport(report);

// Generate HTML report
const htmlReport = generateAccessibilityReport(report);
```

### Keyboard Navigation Testing

```tsx
import { testKeyboardNavigation } from '@partpal/shared-ui';

test('component is keyboard accessible', async () => {
  const { container } = render(<YourComponent />);
  const isAccessible = await testKeyboardNavigation(container);
  expect(isAccessible).toBe(true);
});
```

## 📋 PartPal-Specific Patterns

### Part Listings
- Use heading structure for part names
- Include price announcements
- Provide part condition information
- Use landmarks for navigation

```tsx
<article aria-labelledby="part-123-name">
  <h3 id="part-123-name">BMW Engine Block</h3>
  <div aria-label="Price: $1,500">$1,500</div>
  <div aria-label="Condition: Used - Good">Used - Good</div>
  <Button aria-label="View details for BMW Engine Block">
    View Details
  </Button>
</article>
```

### Search Interface
- Announce search results
- Provide filter feedback
- Use live regions for dynamic content

```tsx
<div>
  <Input
    type="search"
    aria-label="Search parts"
    aria-describedby="search-help"
  />
  <div id="search-help">
    Search by part name, number, or vehicle
  </div>
  <div aria-live="polite" aria-atomic="true">
    {searchResults.length > 0 &&
      `Found ${searchResults.length} parts`
    }
  </div>
</div>
```

### Inventory Management
- Use table semantics for part lists
- Provide batch action feedback
- Include status announcements

```tsx
<Table
  caption="Parts Inventory"
  onSelectionChange={(selected) =>
    announce(`${selected.length} parts selected`)
  }
/>
```

## 🎨 Styling for Accessibility

### Focus Indicators
All interactive elements include visible focus indicators:

```css
.focus-ring {
  @apply focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2;
}
```

### High Contrast Support
Components adapt to high contrast mode:

```css
@media (prefers-contrast: high) {
  .btn, .form-input, .card {
    @apply border-2 border-current;
  }
}
```

### Reduced Motion
Animations respect user preferences:

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

## 🔍 Manual Testing Checklist

### Keyboard Navigation
- [ ] All interactive elements are reachable with Tab
- [ ] Focus order is logical
- [ ] Focus indicators are visible
- [ ] Escape key works in modals/menus
- [ ] Arrow keys work in complex widgets

### Screen Reader Testing
- [ ] All content is announced properly
- [ ] Form labels are associated correctly
- [ ] Error messages are announced
- [ ] Status changes are announced
- [ ] Landmark navigation works

### Mobile Accessibility
- [ ] Touch targets are at least 44px
- [ ] Zoom to 200% works properly
- [ ] Orientation changes work
- [ ] Voice control works

## 📚 Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Screen Reader Testing](https://webaim.org/articles/screenreader_testing/)
- [Keyboard Accessibility](https://webaim.org/techniques/keyboard/)

## 🐛 Reporting Issues

If you find accessibility issues:

1. Use the built-in testing utilities
2. Document the issue with specific examples
3. Include assistive technology used
4. Suggest solutions when possible

For urgent accessibility issues, please prioritize fixes as they impact user inclusion and may have legal implications.