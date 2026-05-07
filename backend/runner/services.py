import requests
from django.conf import settings


# Mapping de nos langages internes → versions Piston
# Ces versions doivent exister sur l'instance Piston (vérifier via GET /runtimes)
LANGUAGE_VERSIONS = {
    "python": "3.10.0",
    "javascript": "18.15.0",
    "typescript": "5.0.3",
    "java": "15.0.2",
    "c": "10.2.0",
    "cpp": "10.2.0",
}


class PistonError(Exception):
    pass


def execute_code(language: str, code: str, stdin: str = "") -> dict:
    if language not in LANGUAGE_VERSIONS:
        raise PistonError(f"Langage non supporté : {language}")

    if settings.PISTON_URL == "MOCK":
        return {
            "stdout": f"[MOCK] {language}\n{code[:60]}...\n",
            "stderr": "",
            "exit_code": 0,
            "exec_time_ms": 42,
            "compile_output": "",
        }

    # Mapping extension de fichier par langage
    extensions = {"python": "py", "javascript": "js", "typescript": "ts", "java": "java", "c": "c", "cpp": "cpp"}
    ext = extensions.get(language, "txt")

    payload = {
        "language": language,
        "version": LANGUAGE_VERSIONS[language],
        "files": [{"name": f"main.{ext}", "content": code}],
        "stdin": stdin,
        "run_timeout": 3000,
    }

    try:
        response = requests.post(
            f"{settings.PISTON_URL}/execute",
            json=payload,
            timeout=settings.PISTON_TIMEOUT_S,
        )
        response.raise_for_status()
    except requests.RequestException as e:
        # Inclut le message d'erreur de Piston dans la levée
        detail = ""
        if hasattr(e, "response") and e.response is not None:
            try:
                detail = f" — {e.response.text}"
            except Exception:
                pass
        raise PistonError(f"Piston injoignable : {e}{detail}")

    data = response.json()
    run = data.get("run", {})
    compile_data = data.get("compile", {}) or {}

    return {
        "stdout": run.get("stdout", ""),
        "stderr": run.get("stderr", ""),
        "exit_code": run.get("code"),
        "exec_time_ms": 0,
        "compile_output": compile_data.get("output", "") if isinstance(compile_data, dict) else "",
    }