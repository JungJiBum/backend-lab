# Backend Lab

Backend Lab은 Python Backend 개발과 데이터 플랫폼 구축·운영 경험을 소개하고, 관련 시스템 구조와 처리 흐름을 브라우저에서 실행해 볼 수 있도록 구성한 포트폴리오 프로젝트입니다.

FastAPI가 포트폴리오 메인 페이지와 Playground 페이지를 제공하며, 각 Playground는 HTML, CSS, JavaScript로 시스템의 요청·데이터·자동화 흐름을 시각화합니다. 일부 Engineering Lab 카드는 별도 GitHub 프로젝트로 연결됩니다.

## 주요 기술

- Python 3.11
- FastAPI, Uvicorn
- Jinja2 Template Rendering
- HTML, CSS, JavaScript
- Pytest, Ruff, pre-commit
- GitHub Actions

## Playground 구성

### Engineering Experience

| Playground | 내용 |
| --- | --- |
| LRS Event Pipeline | xAPI 학습 이벤트 생성, 수신, 검증, 원본 저장과 내부 처리 흐름을 시각화합니다. |
| CI/CD Pipeline | Commit, Push, Pull Request, GitHub Actions 검증과 배포 흐름을 보여줍니다. |
| Infrastructure Automation | 서버 구성, Docker 실행 환경, 폐쇄망 설치, 반복 운영 작업 자동화 사례를 보여줍니다. |
| Monitoring Pipeline | 여러 서버의 Metric을 Prometheus로 수집하고 Grafana로 조회하는 흐름과 Metric Identity 충돌 해결 과정을 보여줍니다. |

### Engineering Lab

| Lab | 내용 |
| --- | --- |
| Portfolio Platform | FastAPI 애플리케이션 생성부터 Router, Jinja2 Template, Static Resource, CI 검증까지 이 포트폴리오의 요청 흐름과 구성을 보여주는 Playground입니다. |
| Sync / Async Processing | FastAPI 요청 내부의 동기 처리와 RabbitMQ, Celery Worker, Redis를 사용하는 비동기 처리의 응답 시점 및 작업 상태 변화를 비교합니다. |
| Voice Agent Lab | FastAPI 기반 Voice Backend의 Faster-Whisper Local STT, sherpa-onnx와 Supertonic 3 기반 Local TTS, STT/TTS Provider 인터페이스, 입력 Validation과 임시 WAV lifecycle을 보여줍니다. |

Voice Agent Lab의 현재 구현 범위는 STT와 TTS입니다. Agent, Local LLM, Tool Execution은 아직 완료 기능에 포함하지 않습니다.

## 프로젝트 구조

```text
my-fastapi/
├── app/
│   ├── main.py                 # FastAPI 앱, StaticFiles, Router 등록, health endpoint
│   └── routers/
│       ├── home.py             # 포트폴리오 메인 페이지
│       └── playground.py       # /playground/{topic} 동적 페이지
├── static/
│   ├── css/
│   │   ├── style.css           # 메인 페이지 공통 스타일
│   │   └── playground.css      # Playground 스타일
│   └── js/                     # 공통 및 Playground별 상호작용
├── templates/
│   ├── base.html               # 공통 레이아웃
│   ├── index.html              # 포트폴리오 메인 페이지
│   └── playground/             # Playground별 Jinja2 템플릿
├── tests/
│   └── test_main.py            # 메인, 문서, health, 정적 파일 테스트
├── requirements.txt
└── README.md
```

`app/routers/playground.py`는 요청받은 topic과 같은 이름의 템플릿이 `templates/playground/`에 있는지 확인한 뒤 렌더링하며, 템플릿이 없으면 404를 반환합니다.

## 실행 방법

Python 3.11 환경을 기준으로 합니다.

```bash
python -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
uvicorn app.main:app --reload
```

실행 후 다음 주소에서 확인할 수 있습니다.

- 포트폴리오: `http://127.0.0.1:8000/`
- OpenAPI 문서: `http://127.0.0.1:8000/docs`
- Health check: `http://127.0.0.1:8000/health`

## 검사 및 테스트

```bash
ruff check .
pytest
```

GitHub Actions는 `dev` 브랜치 push와 `main` 브랜치 대상 Pull Request에서 FastAPI import, Ruff, Pytest를 실행합니다.
