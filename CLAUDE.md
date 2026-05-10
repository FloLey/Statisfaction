# Development Guidelines

## Documentation

- Always update the `README.md` when adding, changing, or removing features, API endpoints, configuration, or project structure.
- Keep inline code comments up to date when modifying logic.

## Testing

- Always add tests for new functionality and update existing tests when behavior changes.
- Verify all tests pass before committing:
  - **Backend:** `cd backend && TEST_DATABASE_URL=postgresql://statisfaction:statisfaction@localhost:5490/statisfactiondb_test pytest`
  - **Frontend:** `cd frontend && npm test`
- Never commit code that breaks existing tests.

## Linting

- Always lint before committing:
  - **Backend:** `cd backend && ruff check . && black --check .`
  - **Frontend:** `cd frontend && npx tsc --noEmit`
- Fix all lint errors before pushing. Do not suppress or ignore lint rules without justification.
- **Black version must match CI exactly.** Install dev dependencies from `requirements-dev.txt` (`pip install -r backend/requirements-dev.txt`) — do not install black independently or you risk a version mismatch. The pinned version is `black==26.3.1`. To auto-fix formatting run `black .` from the `backend/` directory.

## Workflow Summary

Before every commit:
1. Update docs and README if applicable
2. Add or update tests
3. Run tests and confirm they pass
4. Run linters and fix any issues
