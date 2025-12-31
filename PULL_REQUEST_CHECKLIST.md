# Pull Request Checklist

Before submitting your pull request, please review and check all of these items:

## Code Quality
- [ ] Code follows the project's style guidelines
- [ ] ESLint shows no errors or warnings
- [ ] Code is properly formatted (Prettier)
- [ ] No console.log statements left in code
- [ ] No commented-out code blocks
- [ ] Complex logic is documented with comments

## Testing
- [ ] All existing tests pass
- [ ] New tests added for new features
- [ ] Edge cases are covered
- [ ] Manual testing completed
- [ ] Test coverage is maintained or improved

## Documentation
- [ ] README updated if needed
- [ ] API documentation updated
- [ ] Code comments are clear and helpful
- [ ] CHANGELOG updated
- [ ] Type definitions updated

## Security
- [ ] No sensitive data in code
- [ ] Input validation added
- [ ] Security best practices followed
- [ ] Dependencies are up to date
- [ ] No known vulnerabilities

## Database
- [ ] Migrations are reversible
- [ ] Database indexes are appropriate
- [ ] No data loss scenarios
- [ ] Migration tested locally

## Performance
- [ ] No N+1 queries
- [ ] Appropriate caching used
- [ ] Database queries optimized
- [ ] No performance regressions

## Git
- [ ] Commits are atomic and well-described
- [ ] Commit messages follow convention
- [ ] Branch is up to date with main
- [ ] No merge conflicts

## Review
- [ ] Self-review completed
- [ ] Breaking changes documented
- [ ] Backward compatibility considered
- [ ] Ready for code review
