# ETBToChallenger UI/UX Rules

## Desktop-First Design Philosophy

This application is designed primarily for **desktop use**.

### Cursor Pointer Policy

- **ALWAYS** add `cursor-pointer` class to interactive elements (buttons, tabs, cards, etc.)
- Users expect clear visual feedback that elements are clickable
- Apply to:
  - All buttons and button-like elements
  - Tab selectors
  - Clickable cards
  - Navigation links
  - Any element with onClick handlers

### Component Architecture

#### Don't Repeat Yourself (DRY)

- **NEVER** duplicate code across components
- Always create reusable components when patterns emerge
- Extract common logic into shared utilities or hooks
- If you're copying code, you're doing it wrong

#### Component Separation

- **Keep files focused and manageable** (ideally < 200 lines)
- Separate concerns clearly:
  - **JSX/UI Components**: Pure presentation, minimal logic
  - **Custom Hooks**: Stateful logic, side effects, data fetching
  - **Utils**: Pure functions, transformations, calculations
  - **Data/Constants**: Static configuration, type definitions

#### File Organization

- Split large components into smaller, focused sub-components
- Co-locate related components in feature folders
- Extract business logic from UI components
- Use composition over large monolithic components

#### Examples

- ✅ Good: `<PlayerCard>` uses `usePlayerStats()` hook + `formatPlayerName()` util
- ❌ Bad: 500-line component with inline data fetching and formatting
- ✅ Good: Shared `<StatCard>` component used across Dashboard and Team Analytics
- ❌ Bad: Duplicated stat card JSX in multiple files
