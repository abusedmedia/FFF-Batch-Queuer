# Agent & contributor guide

## Repository and deployment

This project is an **npm workspaces monorepo** (`packages/*`). 

---

## Frontend App

Follow these conventions so new work stays consistent and deployable.

### Stack and tooling

- **React 18**, **TypeScript**, **Vite**, **React Router v6**.
- **Mantine v7** is the **UI component library** for the admin app. For any admin UI work—layout, forms, tables, feedback, overlays, navigation—**use Mantine** (`@mantine/core`, `@mantine/hooks`, `@mantine/form`, and other `@mantine/*` packages already in the project). Do not introduce another component kit or build parallel UI from scratch unless there is an explicit, documented exception.
- Follow **component-library best practices**: compose Mantine primitives instead of one-off styled wrappers; align spacing, typography, and colors with **`adminTheme`** and Mantine theme tokens; use Mantine’s patterns for forms, accessibility (labels, `aria-*` where docs recommend), and responsive behavior; prefer official Mantine APIs and hooks over reimplementing behavior the library already provides.

### App structure and UI

- **Routing:** Register routes in `src/App.tsx`. 
- **Layout:** **`AdminLayout`** uses Mantine **`AppShell`** with **`AppHeader`** and **`ContextualSidebar`**—extend navigation and sections in the same pattern (sidebar entries matching routes).
- **Theming:** Use **`adminTheme`** from `src/theme.ts` and Mantine primitives; keep spacing, typography, and primary styling aligned with the existing admin shell. New screens should stay visually consistent with this Mantine-based shell.
- **Main content styling:** Do not wrap page body content in a bordered outer container/card; prefer clean AppShell main content and only use borders for inner components when needed (e.g. tables, inline panels).

