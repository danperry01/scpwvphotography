# Security Scanning Process

## Overview

This document outlines the security scanning process for the project, including automated dependency scanning and vulnerability management.

## Automated Security Scanning

### 1. Dependabot Configuration

**Location**: `.github/dependabot.yml`

```yaml
version: 2
updates:
  # Frontend dependencies
  - package-ecosystem: "npm"
    directory: "/frontend"
    schedule:
      interval: "weekly"
      day: "monday"
      time: "09:00"
      timezone: "UTC"
    groups:
      development-dependencies:
        dependency-type: "development"
      production-dependencies:
        dependency-type: "production"
    open-pull-requests-limit: 10

  # Backend dependencies
  - package-ecosystem: "npm"
    directory: "/backend"
    schedule:
      interval: "weekly"
      day: "monday"
      time: "09:00"
      timezone: "UTC"
    groups:
      development-dependencies:
        dependency-type: "development"
      production-dependencies:
        dependency-type: "production"
    open-pull-requests-limit: 10

  # GitHub Actions
  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"
      day: "monday"
      time: "09:00"
      timezone: "UTC"
```

### 2. Security Workflow

**Location**: `.github/workflows/security-scan.yml`

```yaml
name: Security Scan

on:
  push:
    branches: [develop, main]
  pull_request:
    branches: [develop, main]
  schedule:
    - cron: '0 2 * * *'  # Daily at 2:00 AM UTC

jobs:
  npm-audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Audit frontend
        run: |
          cd frontend
          npm ci
          npm audit --audit-level=high

      - name: Audit backend
        run: |
          cd backend
          npm ci
          npm audit --audit-level=high

  codeql:
    runs-on: ubuntu-latest
    permissions:
      security-events: write
    steps:
      - uses: actions/checkout@v4

      - name: Initialize CodeQL
        uses: github/codeql-action/init@v3
        with:
          languages: javascript-typescript

      - name: Perform CodeQL Analysis
        uses: github/codeql-action/analyze@v3
```

## Vulnerability Management Process

### High/Critical Vulnerabilities

**Response Time**: Within 24-48 hours

1. Assess impact and exploitability
2. Update dependencies or apply patches
3. Test functionality is not broken
4. Deploy fix to all environments
5. Document in security log

### Moderate Vulnerabilities

**Response Time**: Within 1 week

1. Address during next regular maintenance window
2. Group with other non-critical updates
3. Test and deploy as part of regular release cycle

### Low Vulnerabilities

**Response Time**: Within 1 month

1. Schedule for next maintenance cycle
2. Evaluate if update causes breaking changes
3. Bundle with other updates

### False Positives/Accepted Risks

1. Document decision in security review
2. Add to audit exceptions with justification
3. Set reminder to re-evaluate in 90 days
4. Get sign-off from security lead

## Security Scanning Commands

### Manual Vulnerability Scans

```bash
# Full project scan
npm audit --audit-level=moderate

# Frontend only
cd frontend && npm audit --audit-level=moderate

# Backend only
cd backend && npm audit --audit-level=moderate

# Fix automatically (use with caution - may cause breaking changes)
npm audit fix

# Fix with major version updates (requires testing)
npm audit fix --force
```

### Check for Outdated Dependencies

```bash
# List outdated packages
npm outdated

# Update to latest within semver range
npm update

# Interactive update tool
npx npm-check-updates -i
```

### Security Workflow Testing

```bash
# Run security workflow locally
gh workflow run security-scan.yml --ref develop

# Check workflow status
gh run list --workflow=security-scan.yml
```

## Integration with Development Workflow

### PR Requirements
- [ ] Security scan must pass before merge
- [ ] No new high/critical vulnerabilities introduced
- [ ] Dependency updates reviewed for breaking changes

### Release Requirements
- [ ] Zero high/critical vulnerabilities in production dependencies
- [ ] All Dependabot PRs reviewed and merged or dismissed with reason
- [ ] Security scan green on release branch

### Regular Maintenance
- [ ] Weekly: Review Dependabot PRs
- [ ] Monthly: Review moderate/low vulnerabilities
- [ ] Quarterly: Full dependency audit and cleanup

## Monitoring and Alerts

### GitHub Security Features

| Feature | Configuration |
|---------|---------------|
| **Dependabot Security Updates** | Auto-enabled for critical vulnerabilities |
| **Dependabot Version Updates** | Weekly scans configured |
| **CodeQL Analysis** | JavaScript/TypeScript scanning enabled |
| **Secret Scanning** | Enabled for all supported patterns |
| **Security Advisories** | Email alerts to repository admins |

### Team Notifications

Configure in repository settings:
1. Settings > Security & analysis
2. Enable all security features
3. Set up notification routing to team channels

## Vulnerability Documentation Template

When documenting a vulnerability:

```markdown
## [CVE-ID or Advisory ID]

**Severity**: Critical / High / Moderate / Low
**Package**: package-name@version
**Component**: frontend / backend / shared
**Discovered**: YYYY-MM-DD
**Resolved**: YYYY-MM-DD

### Description
Brief description of the vulnerability.

### Impact
How this affects our application.

### Resolution
- [ ] Updated to package-name@new-version
- [ ] Tested functionality
- [ ] Deployed to all environments

### Notes
Any additional context or considerations.
```

## Related Documentation

- [Security Principles](./security-principles.md)
- [Security Checklist](./security-checklist.md)
- [Incident Response](../ops/incident-response.md)

---

**Last Updated**: YYYY-MM-DD
**Version**: 1.0
**Owner**: Security Team
