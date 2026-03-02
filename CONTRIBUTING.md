# Contributing to HP Tech CRM

Thank you for contributing! This guide covers our development workflow and standards.

## Getting Started

1. Fork the repository and clone your fork
2. Install dependencies: `npm install` in root, `leadify-backend-main/`, and `leadify-frontend-main/`
3. Copy `.env.example` to `.env` and configure your environment
4. Start development: `pm2 start ecosystem.config.js` or run backend/frontend separately

## Branch Naming

Use the following prefixes:

- `feat/` — New features (e.g., `feat/lead-scoring-v2`)
- `fix/` — Bug fixes (e.g., `fix/login-redirect-loop`)
- `refactor/` — Code refactoring (e.g., `refactor/auth-middleware`)
- `test/` — Adding or updating tests (e.g., `test/deal-pipeline-e2e`)
- `docs/` — Documentation changes (e.g., `docs/api-endpoints`)
- `ci/` — CI/CD changes (e.g., `ci/add-staging-deploy`)
- `chore/` — Maintenance tasks (e.g., `chore/update-dependencies`)

## Commit Messages

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]
```

**Types:** `feat`, `fix`, `refactor`, `test`, `docs`, `ci`, `chore`, `perf`, `style`

**Scopes:** `backend`, `frontend`, `e2e`, `ci`, `docs`

**Examples:**
```
feat(frontend): Add lead scoring dashboard widget
fix(backend): Prevent duplicate deal creation on rapid clicks
test(e2e): Add proposal export flow coverage
refactor(frontend): Migrate useLeads composable to Pinia store
```

## Pull Request Process

1. Create your feature branch from `develop` (or `main` if no develop branch)
2. Write your code following the standards below
3. Add/update tests for your changes
4. Ensure all checks pass: `npm run lint:all`, `npm run test`, `npm run build:all`
5. Push your branch and open a PR using the PR template
6. Request review from at least one team member

## Code Standards

### TypeScript
- **Strict mode is enabled** — do not use `any` type unless absolutely unavoidable
- Do not add `@ts-ignore` — fix the underlying type issue instead
- Define interfaces in `types/` for shared types
- Use proper generics for API responses

### Frontend (Nuxt/Vue)
- Use Composition API with `<script setup lang="ts">`
- Templates use Pug syntax
- All user-facing strings must use i18n (`$t()` in templates, `t()` in script)
- Add both English (`locales/en.json`) and Arabic (`locales/ar.json`) translations
- Use Element Plus components for UI consistency
- State management: Pinia stores for shared state, composables for feature-specific logic

### Backend (Express/TypeScript)
- Use `wrapResult(res, data, status)` for API responses
- Use `BaseError(ERRORS.CODE)` for error handling
- Use `HasPermission()` middleware for route protection
- All models must include `tenantId` scoping

### Testing
- Backend: Jest — place tests in `leadify-backend-main/tests/<module>/`
- Frontend: Vitest — place tests in `leadify-frontend-main/tests/`
- E2E: Playwright — place tests in `tests/e2e/`
- Minimum coverage: 60% for new code

### Security
- Never store tokens in `localStorage` — use HttpOnly cookies
- Never commit secrets or credentials
- Always validate user input at API boundaries
- Use parameterized queries (Sequelize handles this)

## Code Review Checklist

Reviewers should verify:

- [ ] Code follows TypeScript strict mode (no `any`, no `@ts-ignore`)
- [ ] Tests are included and passing
- [ ] i18n strings added for both AR and EN
- [ ] No hardcoded credentials or secrets
- [ ] No `localStorage` token storage
- [ ] API endpoints use proper auth middleware
- [ ] Error handling is present (no empty catch blocks)
- [ ] No console.log left in production code (use proper logger)

## Reporting Issues

- Use GitHub Issues with clear reproduction steps
- Include browser/Node.js version, OS, and error messages
- Label issues appropriately: `bug`, `enhancement`, `security`, etc.
