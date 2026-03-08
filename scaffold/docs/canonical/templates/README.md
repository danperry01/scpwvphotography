# Document Templates

This directory contains templates for common documentation types.

## Available Templates

| Template | Purpose | Location |
|----------|---------|----------|
| ADR Template | Architecture Decision Records | `../ADR/adr-0000-template.md` |
| [Feature Spec](feature-spec-template.md) | Feature specifications | This directory |
| [Integration Doc](integration-template.md) | External system integrations | This directory |
| [Runbook](runbook-template.md) | Operational procedures | This directory |

## Usage

1. Copy the relevant template to the appropriate directory
2. Rename it according to the naming convention
3. Fill in all sections
4. Remove any sections that don't apply
5. Update the relevant index file

## Naming Conventions

| Document Type | Convention | Example |
|---------------|------------|---------|
| ADR | `adr-NNNN-short-title.md` | `adr-0001-use-workers.md` |
| Feature Spec | `feature-name.md` | `user-authentication.md` |
| Integration | `system-name.md` | `salesforce-sync.md` |
| Runbook | `operation-name.md` | `database-backup.md` |
