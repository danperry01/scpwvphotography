# Skills Directory

This directory contains skill files that provide Claude with specialized knowledge for specific tasks.

## What is a Skill?

A skill is a markdown file that contains:
- Domain-specific knowledge
- Step-by-step procedures
- Code patterns and examples
- Common pitfalls and solutions

## Creating a Skill

1. Identify a repeatable task or domain area
2. Create a new `.md` file with a descriptive name
3. Structure it with clear sections
4. Include code examples where applicable
5. Reference from CLAUDE.md

## Skill Template

```markdown
# [Skill Name] Skill

## Purpose
What this skill helps with.

## When to Use
- Scenario 1
- Scenario 2

## Key Concepts
Important background knowledge.

## Procedures

### Task 1: [Name]

Steps:
1. Step one
2. Step two

```code
// Example code
```

### Task 2: [Name]

...

## Common Issues

### Issue: [Description]
**Solution**: How to fix it

## References
- [Link to docs]
```

## Naming Convention

Use lowercase with hyphens: `skill-name.md`

Examples:
- `salesforce-deployment.md`
- `database-migration.md`
- `api-integration.md`
