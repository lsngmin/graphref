import json
import time
import urllib.error
import urllib.request
from dataclasses import dataclass, asdict

CAPSOLVER_BASE_URL = "https://api.capsolver.com"

@dataclass
class ReCaptchaV2EnterpriseTaskProxyLess:
    website_url: str
    website_key: str
    s: str
    isInvisible: bool = False
    pageAction: str = "submit"

    def to_dict(self) -> dict:
        return {
            "type": "ReCaptchaV2EnterpriseTaskProxyLess",
            "websiteURL": self.website_url,
            "websiteKey": self.website_key,
            "isInvisible": self.isInvisible,
            "pageAction": self.pageAction,
            "enterprisePayload": {
                "s": self.s,
            },
        }

class CapSolverError(RuntimeError):
    pass

class CapSolverClient:
    def __init__(self, task):
        import os
        self.client_key = os.getenv("CAPSOLVER_API_KEY")
        self.task = task

        if not self.client_key:
            raise CapSolverError("CAPSOLVER_API_KEY not found.")

    def _post_json(self, path: str, payload: dict, timeout: int = 30) -> dict:
        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            CAPSOLVER_BASE_URL + path,
            data = data,
            headers={
                "Content-Type": "application/json",
            }
        )
        try:
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                body = resp.read().decode("utf-8")
        except urllib.error.HTTPError as exc:
            raise CapSolverError(f"HTTP {exc.code} from CapSolver") from exc
        except urllib.error.URLError as exc:
            raise CapSolverError(f"Network error calling CapSolver: {exc.reason}") from exc

        result = json.loads(body)

        if result["errorId"] != 0:
            raise CapSolverError(
                f"CapSolver error {result['errorCode']}: {result['errorDescription']}"
            )

        return result

    def _create_task(self, timeout: int = 30) -> str:
        result = self._post_json(
            "/createTask",
            {
                "clientKey": self.client_key,
                "task" : self.task.to_dict(),
            },
            timeout=timeout
        )
        task_id = result["taskId"]
        if not task_id:
            raise CapSolverError("createTask response missing taskId")
        return str(task_id)

    def _get_task_result(self, task_id: str, timeout: int = 30) -> dict:
        return self._post_json(
            "/getTaskResult",
            {
                "clientKey": self.client_key,
                "taskId": task_id,
            },
            timeout=timeout,
        )

    def solve_task(self, timeout: int = 30, poll_interval: float = 2.6) -> dict:
        task_id = self._create_task()
        deadline = time.time() + timeout

        while True:
            if time.time() > deadline:
                raise CapSolverError(f"Timed out waiting for task {task_id}")
            result = self._get_task_result(task_id)
            status = result["status"]

            if status == "ready":
                solution = result.get("solution")
                if not solution:
                    raise CapSolverError("Task ready but solution is missing")
                return solution

            time.sleep(poll_interval)