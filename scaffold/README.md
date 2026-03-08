# Photography Portfolio + Booking Website

> A portfolio showcase and client booking site for [PHOTOGRAPHER_NAME].

## Quick Start

```bash
# Navigate to the working project
cd site

# Install dependencies
npm install        # or: pnpm install / bun install

# Set up environment
cp .env.example .env.local
# Edit .env.local with your values

# Run development server
npm run dev
```

## Project Structure

```
SCPWeb/
├── scaffold/               # Guardrails, docs, and AI context (this folder)
│   ├── .claude/            # Claude Code commands and skills
│   │   └── commands/       # /refresh, /verify, /progress, /learn, /commit
│   ├── docs/
│   │   ├── canonical/      # Source of truth documentation
│   │   │   ├── ADR/        # Architecture Decision Records
│   │   │   ├── architecture/
│   │   │   ├── AgentOverview/
│   │   │   └── templates/
│   │   └── PROGRESS_TRACKER.md
│   ├── CLAUDE.md           # AI assistant context and project rules
│   └── GUARDRAILS.md       # Development rules and coding standards
└── site/                   # Working project (actual website code)
```

## Documentation

- [CLAUDE.md](CLAUDE.md) - AI assistant context and project rules
- [GUARDRAILS.md](GUARDRAILS.md) - Development rules and coding standards
- [Progress Tracker](docs/PROGRESS_TRACKER.md) - Current status and tasks
- [Architecture Decisions](docs/canonical/ADR/) - ADRs
- [Development Workflow](docs/canonical/AgentOverview/DEV-Workflow-Guide.md)

## Development

### Prerequisites

- Node.js 20+ (or Bun)
- Package manager: npm / pnpm / bun (TBD)

### Commands

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build locally
npm run lint     # Run linter
```

### Branch Strategy

- `main` - Production releases
- `develop` - Integration branch
- `feature/*` - New features
- `fix/*` - Bug fixes

## Deployment

See [Deployment Guide](docs/canonical/ops/deployment.md) for detailed instructions.
Hosting platform TBD (Vercel, Netlify, or self-hosted).
