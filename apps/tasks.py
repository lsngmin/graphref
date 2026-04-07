import os
import subprocess
from pathlib import Path
import shutil


def run_job(payload: dict) -> dict:
    search_keyword = (payload or {}).get("search_keyword")
    target_domain = (payload or {}).get("target_domain")
    if not search_keyword or not target_domain:
        return {"status": "failed", "error": "missing search_keyword or target_domain"}

    project_root = Path(__file__).resolve().parents[1]
    run_py = project_root / "run.py"
    if not run_py.exists():
        return {"status": "failed", "error": f"run.py not found at {run_py}"}

    python_bin = os.getenv("PYTHON_BIN", "python3")
    base_cmd = [python_bin, str(run_py), search_keyword, target_domain]

    use_xvfb = os.getenv("USE_XVFB", "").lower()
    in_docker = Path("/.dockerenv").exists() or os.getenv("IN_DOCKER") == "1"
    has_xvfb = shutil.which("xvfb-run") is not None

    if use_xvfb in ("1", "true", "yes"):
        cmd = ["xvfb-run", "-a", "-s", "-screen 0 1280x720x24"] + base_cmd
    elif use_xvfb in ("0", "false", "no"):
        cmd = base_cmd
    else:
        # Default: use Xvfb only inside Docker when available
        cmd = ["xvfb-run", "-a", "-s", "-screen 0 1280x720x24"] + base_cmd if (in_docker and has_xvfb) else base_cmd

    env = os.environ.copy()
    env.setdefault("PYTHONUNBUFFERED", "1")

    result = subprocess.run(
        cmd,
        cwd=str(project_root),
        env=env,
        capture_output=True,
        text=True,
    )

    return {
        "status": "ok" if result.returncode == 0 else "failed",
        "code": result.returncode,
        "stdout": result.stdout[-4000:],
        "stderr": result.stderr[-4000:],
    }
