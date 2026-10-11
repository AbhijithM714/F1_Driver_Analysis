# Contributing to Formula 1 Race Analytics Platform

Thank you for your interest in contributing to the **Formula 1 Race Analytics Platform**!

## Core Engineering Principles

1. **Zero Synthetic Data Policy**:
   - Never hardcode Formula 1 statistics or generate random/fake telemetry values.
   - Every chart, leaderboard, and KPI must be dynamically computed from verified datasets in `data/`.
   - When an optional dataset (such as 100Hz car telemetry or tyre stints) is unavailable for a historical race, use the `<EmptyState />` component to display required columns and acquisition instructions.

2. **Layered Architecture**:
   - **Data Layer (`data/`)**: Raw CSV and GeoJSON files.
   - **Service Layer (`src/services/`)**: Pure TypeScript analytical calculations and `mtime`-cached indexing.
   - **API Layer (`src/app/api/`)**: Next.js Route Handlers returning structured JSON (`{ success: boolean, data?: T, error?: string }`).
   - **Presentation Layer (`src/app/`, `src/components/`)**: Accessible React components and Apache ECharts visualizations.

## Development Workflow

1. Fork the repository and create a feature branch:
   ```bash
   git checkout -b feat/your-feature-name
   ```
2. Install dependencies and run the development server:
   ```bash
   npm install
   npm run dev
   ```
3. Verify code quality and production build before submitting a Pull Request:
   ```bash
   npm run lint
   npm run build
   ```

## Commit Message Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` New analytical capability or visualization module
- `fix:` Bug fix or calculation correction
- `refactor:` Code restructuring without changing external behavior
- `docs:` Documentation, architecture diagrams, or README updates
- `perf:` Memory indexing or rendering optimization

