declare module 'jest-axe' {
  import { AxeResults } from 'axe-core';

  export interface JestAxeMatchers {
    toHaveNoViolations(): void;
  }

  declare global {
    namespace jest {
      interface Matchers<R> {
        toHaveNoViolations(): R;
      }
    }
  }

  export function axe(
    element: Element | Document,
    options?: any
  ): Promise<AxeResults>;

  export function toHaveNoViolations(results: AxeResults): {
    message(): string;
    pass: boolean;
  };
}