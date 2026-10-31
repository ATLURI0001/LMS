"""Start a disposable Python or Java server, run acceptance.py, then stop it.
Run from a project root: python tests/run_local.py python|java
Python uses the interpreter running this script. Java requires mvn package first.
"""

import pathlib, sys, os, subprocess, tempfile, time, urllib.request

root = pathlib.Path(__file__).resolve().parents[1]
stack = sys.argv[1]
with tempfile.TemporaryDirectory(prefix="ascent-test-") as tmp:
    env = {
        **os.environ,
        "DEMO_MODE": "true",
        "APP_ENV": "development",
        "COOKIE_SECURE": "false",
        "DEMO_PASSWORD": "AscentDemo!2026",
        "PORT": "8011",
        "DATABASE_PATH": str(pathlib.Path(tmp) / "ascent.db"),
        "DATABASE_URL": "jdbc:h2:file:"
        + str(pathlib.Path(tmp) / "ascent")
        + ";DB_CLOSE_ON_EXIT=FALSE",
    }
    cmd = (
        [
            sys.executable,
            "-m",
            "uvicorn",
            "main:app",
            "--host",
            "127.0.0.1",
            "--port",
            "8011",
        ]
        if stack == "python"
        else ["java", "-jar", "target/ascent-lms-1.0.0.jar"]
    )
    with open(pathlib.Path(tmp) / "server.log", "w+") as log:
        p = subprocess.Popen(
            cmd, cwd=root / "backend", env=env, stdout=log, stderr=subprocess.STDOUT
        )
        try:
            http = urllib.request.build_opener(urllib.request.ProxyHandler({}))
            for _ in range(200):
                if p.poll() is not None:
                    raise RuntimeError("Server exited during startup")
                try:
                    http.open("http://127.0.0.1:8011/api/health", timeout=1)
                    break
                except Exception:
                    time.sleep(0.15)
            else:
                raise RuntimeError("Server did not become ready")
            subprocess.run(
                [
                    sys.executable,
                    str(root / "tests/acceptance.py"),
                    "http://127.0.0.1:8011",
                ],
                check=True,
            )
        except Exception:
            log.flush()
            log.seek(0)
            print(log.read()[-16000:])
            raise
        finally:
            p.terminate()
            try:
                p.wait(timeout=8)
            except subprocess.TimeoutExpired:
                p.kill()
                p.wait()
