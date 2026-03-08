# Development Workflow Guide

This guide outlines the standard development workflow for the project.

## Workflow Phases

### DEV1: Requirements
- Review issue/feature request
- Clarify requirements with stakeholders
- Document acceptance criteria

### DEV2: Design
- Research existing patterns
- Draft technical approach
- Review architecture implications
- Create/update ADR if significant

### DEV3: Implementation
- Create feature branch from `develop`
- Implement changes following established patterns
- Write tests alongside code
- Keep commits atomic and well-described

### DEV4: Self-Review
- Run `/verify` checklist
- Review own code for issues
- Ensure documentation is updated
- Check for security concerns

### DEV5: Testing
- Run full test suite
- Perform manual testing
- Test edge cases
- Verify in QA environment if applicable

### DEV6: Code Review
- Create pull request
- Address review feedback
- Ensure CI passes

### DEV7: Merge
- Squash and merge to `develop`
- Delete feature branch
- Update related issues

### DEV8: Deploy
- Deploy to staging/QA
- Verify deployment
- Monitor for issues

### DEV9: Document
- Update progress tracker
- Close related issues
- Run `/learn` if applicable

## Branch Naming

```
feature/short-description
fix/issue-number-description
hotfix/critical-issue
docs/documentation-update
```

## Commit Messages

Follow conventional commits:
```
type: short description

Optional longer description

Co-Authored-By: Claude <noreply@anthropic.com>
```

## Pull Request Template

```markdown
## Summary
Brief description of changes.

## Changes
- Change 1
- Change 2

## Testing
- [ ] Test case 1
- [ ] Test case 2

## Documentation
- [ ] Docs updated
- [ ] ADR written (if applicable)

## Checklist
- [ ] Code compiles
- [ ] Tests pass
- [ ] No security issues
```
