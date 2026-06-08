# Padhaaku — Agent Notes

## Project status

This repository is **greenfield**: it currently contains only `README.md` (product tagline: *"Your study buddy that helps you understand any topic"*). There is no application source, dependency manifest, Docker config, or test suite yet.

Until application code and a stack are added, cloud agents can verify the VM toolchain but cannot start Padhaaku itself.

## Cursor Cloud specific instructions

### Available VM tooling

The cloud VM ships with working:

- **Node.js** v22.x and **npm** / **pnpm**
- **Python** 3.12.x
- **git**

No repo-specific install step is required today because there are no tracked dependencies.

### Services

| Service | Status | Notes |
|---------|--------|-------|
| Padhaaku app | Not present | No `package.json`, `pyproject.toml`, or server entrypoint in the repo yet |

### When application code is added

1. Add the project's dependency file(s) (`package.json`, `requirements.txt`, etc.).
2. Update the VM **update script** (via SetupVmEnvironment) to run the matching install command, e.g. `npm install` or `pip install -r requirements.txt`.
3. Document the dev server command and port in this section (do not duplicate full README setup if already documented there).
4. Run lint/test/build commands from the new manifests before claiming the environment is ready.

### Lint / test / run (current)

There are no project scripts to run. Use standard toolchain smoke checks only until code lands:

```bash
node --version && npm --version && python3 --version && git status
```
