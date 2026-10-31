# Contributing

Clone `https://github.com/ATLURI0001/LMS.git` and create a feature branch. Pick one edition, follow its README, and use disposable data while developing. Keep corresponding API behavior consistent across editions; the common acceptance scenarios document the intended contract.

Before proposing a change:

- Run `npm ci`, `npm test` and `npm run build` in the affected `frontend/`.
- Python: install `backend/requirements.txt`, run `python -m unittest discover -s backend/tests -v`, then `python tests/run_local.py python` from `python-fullstack/`.
- Java: run `mvn -B -f backend/pom.xml package`, then `python tests/run_local.py java` from `java-fullstack/`.
- MERN: run `npm ci` and `npm test` in `mern-fullstack/backend/`. This launches a temporary real MongoDB replica set and requires Python 3.
- Update API/setup documentation when behavior changes. Add behavior tests for authorization, grading, enrollment or persistence changes.

Do not commit `.env`, credentials, student data, dependencies or generated database/build files. Preserve third-party license notices. Keep `legacy/` unchanged unless a separate maintenance task explicitly targets the archived prototype. Report vulnerabilities according to [SECURITY.md](SECURITY.md).

A pull request should describe the problem, resulting behavior, affected editions and validation performed. CI runs the three frontend builds and all native API suites. A passing build is not a browser accessibility, visual or deployment audit.
