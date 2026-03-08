# Canonical Documentation

This directory is the **single source of truth** for project documentation.

## Structure

```
canonical/
├── ADR/              # Architecture Decision Records
├── AgentOverview/    # AI agent workflows and processes
├── architecture/     # System architecture docs
├── database/         # Schema and data model docs
├── design/           # UI/UX design documentation
├── features/         # Feature specifications
├── integrations/     # External system integrations
├── onboarding/       # Getting started guides
├── ops/              # Operations and deployment
├── security/         # Security policies and procedures
└── templates/        # Document templates
```

## Guidelines

1. **One source of truth**: If documentation exists elsewhere, it should reference this directory
2. **Keep updated**: Update docs when code changes
3. **Review in PRs**: Documentation changes should be part of code reviews
4. **Use templates**: Start from templates in `templates/` directory

## Document Lifecycle

### Creating New Documents
1. Use appropriate template from `templates/`
2. Place in correct subdirectory
3. Update relevant index files
4. Link from CLAUDE.md if critical

### Superseding Documents
When a document is superseded:
1. Move it to `../archive/`
2. Add a note at the top pointing to the new document
3. Update any references to point to the new document

### Deprecating Documents
When a document is deprecated but not replaced:
1. Move it to `../deprecated/`
2. Add deprecation notice with date and reason
