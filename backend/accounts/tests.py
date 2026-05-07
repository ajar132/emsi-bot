import pytest
from django.urls import reverse


pytestmark = pytest.mark.django_db


class TestRegister:
    def test_register_succeeds(self, api):
        url = reverse("register")
        data = {
            "email": "new@emsi-edu.ma",
            "password": "Test1234!",
            "password_confirm": "Test1234!",
            "first_name": "New",
            "last_name": "User",
        }
        response = api.post(url, data, format="json")
        assert response.status_code == 201
        assert response.data["email"] == "new@emsi-edu.ma"
        assert response.data["role"] == "STUDENT"

    def test_register_password_mismatch(self, api):
        response = api.post(reverse("register"), {
            "email": "x@emsi-edu.ma",
            "password": "Test1234!",
            "password_confirm": "Different!",
            "first_name": "X", "last_name": "Y",
        }, format="json")
        assert response.status_code == 400

    def test_register_duplicate_email(self, api, student_user):
        response = api.post(reverse("register"), {
            "email": student_user.email,
            "password": "Test1234!",
            "password_confirm": "Test1234!",
            "first_name": "X", "last_name": "Y",
        }, format="json")
        assert response.status_code == 400


class TestLogin:
    def test_login_succeeds(self, api, student_user):
        response = api.post(reverse("login"),
            {"email": student_user.email, "password": "Test1234!"},
            format="json")
        assert response.status_code == 200
        assert "access" in response.data
        assert "refresh" in response.data
        assert response.data["user"]["email"] == student_user.email

    def test_login_wrong_password(self, api, student_user):
        response = api.post(reverse("login"),
            {"email": student_user.email, "password": "Wrong!"},
            format="json")
        assert response.status_code == 401


class TestMe:
    def test_me_requires_auth(self, api):
        response = api.get(reverse("me"))
        assert response.status_code == 401

    def test_me_returns_profile(self, auth_student, student_user):
        response = auth_student.get(reverse("me"))
        assert response.status_code == 200
        assert response.data["email"] == student_user.email

    def test_patch_me(self, auth_student):
        response = auth_student.patch(reverse("me"),
            {"first_name": "Updated"}, format="json")
        assert response.status_code == 200
        assert response.data["first_name"] == "Updated"