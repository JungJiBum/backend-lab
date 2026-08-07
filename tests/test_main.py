from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_home():
    response = client.get("/")
    assert response.status_code == 200


def test_docs():
    response = client.get("/docs")
    assert response.status_code == 200


def test_health():
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_fastapi_playground():
    response = client.get("/playground/fastapi")

    assert response.status_code == 200
    assert "Portfolio Platform" in response.text
    assert "/static/js/fastapi.js" in response.text


def test_fastapi_playground_script():
    response = client.get("/static/js/fastapi.js")

    assert response.status_code == 200
    assert "runLifecycle" in response.text
