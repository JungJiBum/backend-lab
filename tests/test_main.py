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


def test_voice_agent_playground():
    response = client.get("/playground/voice-agent")

    assert response.status_code == 200
    assert "Voice Agent Lab" in response.text
    assert "Faster-Whisper" in response.text
    assert "/static/js/voice-agent.js" in response.text


def test_voice_agent_card_links_to_playground():
    response = client.get("/")

    assert response.status_code == 200
    assert 'href="/playground/voice-agent"' in response.text
    assert "View Lab" in response.text


def test_voice_agent_playground_script():
    response = client.get("/static/js/voice-agent.js")

    assert response.status_code == 200
    assert "runFlow" in response.text
