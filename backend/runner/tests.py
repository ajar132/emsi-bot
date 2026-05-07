import pytest
from runner.models import CodeExecution


pytestmark = pytest.mark.django_db


class TestExecuteEndpoint:
    def test_execute_requires_auth(self, api):
        response = api.post("/api/execute/",
            {"language": "python", "code": "print(1)"}, format="json")
        assert response.status_code == 401

    def test_execute_python_success(self, auth_student, mock_piston):
        response = auth_student.post("/api/execute/",
            {"language": "python", "code": "print('hi')"}, format="json")
        assert response.status_code == 201
        assert response.data["execution"]["stdout"] == "Hello mock\n"
        assert response.data["execution"]["exit_code"] == 0
        assert CodeExecution.objects.count() == 1

    def test_execute_invalid_language(self, auth_student):
        response = auth_student.post("/api/execute/",
            {"language": "brainfuck", "code": "+++"}, format="json")
        assert response.status_code == 400

    def test_execute_code_too_large(self, auth_student):
        response = auth_student.post("/api/execute/",
            {"language": "python", "code": "x" * 11_000}, format="json")
        assert response.status_code == 400

    def test_rate_limit(self, auth_student, mock_piston, settings):
        # On baisse temporairement la limite pour aller plus vite
        from runner import views
        original_max = views.MAX_EXECS_PER_WINDOW
        views.MAX_EXECS_PER_WINDOW = 3
        try:
            for i in range(3):
                response = auth_student.post("/api/execute/",
                    {"language": "python", "code": f"print({i})"}, format="json")
                assert response.status_code == 201
            # 4ème tentative bloquée
            response = auth_student.post("/api/execute/",
                {"language": "python", "code": "print(99)"}, format="json")
            assert response.status_code == 429
        finally:
            views.MAX_EXECS_PER_WINDOW = original_max