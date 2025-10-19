// UI Components
export { Button, buttonVariants } from './components/ui/Button';
export type { ButtonProps } from './components/ui/Button';

export { Input, inputVariants } from './components/ui/Input';
export type { InputProps } from './components/ui/Input';

export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  cardVariants
} from './components/ui/Card';
export type { CardProps } from './components/ui/Card';

export { Badge, badgeVariants } from './components/ui/Badge';
export type { BadgeProps } from './components/ui/Badge';

export {
  Spinner,
  Loading,
  Skeleton,
  Dots,
  spinnerVariants,
  loadingContainerVariants,
  skeletonVariants
} from './components/ui/Loading';
export type { SpinnerProps, LoadingProps, SkeletonProps, DotsProps } from './components/ui/Loading';

export { Alert, Toast, alertVariants, toastVariants } from './components/ui/Alert';
export type { AlertProps, ToastProps } from './components/ui/Alert';

// Advanced UI Components
export {
  Select,
  selectTriggerVariants
} from './components/ui/Select';
export type { SelectProps, SelectOption } from './components/ui/Select';

export {
  Modal,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalContent,
  ModalFooter,
  ConfirmModal,
  modalVariants,
  overlayVariants
} from './components/ui/Modal';
export type { ModalProps, ConfirmModalProps } from './components/ui/Modal';

export {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  TabWithIcon,
  ScrollTabs,
  tabsListVariants,
  tabsTriggerVariants,
  tabsContentVariants
} from './components/ui/Tabs';
export type { TabsProps, TabsListProps, TabsTriggerProps, TabsContentProps, TabWithIconProps, ScrollTabsProps } from './components/ui/Tabs';

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
  tableVariants
} from './components/ui/Table';
export type { TableProps, TableColumn, PaginationConfig, SortConfig, SortDirection } from './components/ui/Table';

export {
  Tooltip,
  SimpleTooltip,
  RichTooltip,
  tooltipContentVariants
} from './components/ui/Tooltip';
export type { TooltipProps, SimpleTooltipProps, RichTooltipProps, TooltipSide, TooltipAlign } from './components/ui/Tooltip';

// Form Components
export {
  FormField,
  Textarea,
  Checkbox,
  RadioGroup,
  FormSection,
  FormGrid,
  formFieldVariants
} from './components/forms/Form';
export type { FormFieldProps, TextareaProps, CheckboxProps, RadioGroupProps, RadioOption, ValidationRule, FieldError } from './components/forms/Form';

// Layout Components
export { ResponsiveContainer, ResponsiveGrid, TouchFriendly } from './components/layout/ResponsiveContainer';

// Accessibility
export {
  AccessibilityProvider,
  useAccessibilityContext,
  ScreenReaderOnly,
  VisuallyHidden,
  FocusRing,
  Landmark,
  RovingTabIndex,
  Description,
  ErrorMessage
} from './components/accessibility/AccessibilityProvider';

export {
  useFocusManagement,
  useKeyboardNavigation,
  useAnnouncement,
  useReducedMotion,
  useHighContrast,
  useRovingTabIndex,
  useDisclosure,
  useSkipLinks,
  useId
} from './hooks/useAccessibility';

export {
  auditAccessibility,
  testKeyboardNavigation,
  generateAccessibilityReport,
  logAccessibilityReport,
  checkFocusManagement,
  checkAriaAttributes,
  checkColorContrast,
  checkKeyboardNavigation,
  checkSemanticStructure,
  checkPartPalPatterns
} from './utils/accessibility-testing';
export type { AccessibilityReport, AccessibilityIssue } from './utils/accessibility-testing';

// Utilities
export { cn } from './utils/cn';

// Styles
import './styles/globals.css';