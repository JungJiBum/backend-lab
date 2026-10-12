PERSONAL_PROJECTS = {
    "event-data-platform": {
        "name": "Event Data Platform",
        "category": "BACKEND / DATA ENGINEERING",
        "summary": "이벤트 수집부터 비동기 처리, 배치 집계, 분석과 운영 모니터링까지 연결한 로컬 실행형 데이터 플랫폼입니다.",
        "github": "https://github.com/JungJiBum/event-data-platform",
        "stack": [
            "FastAPI",
            "PostgreSQL",
            "RabbitMQ",
            "Celery",
            "Airflow",
            "Streamlit",
            "Prometheus",
            "Grafana",
        ],
        "highlights": [
            "Raw 저장을 먼저 commit한 뒤 event_id만 비동기 작업으로 전달",
            "Celery 이벤트 처리와 Airflow 날짜 단위 집계의 책임 분리",
            "분석 Dashboard와 서비스·인프라 Monitoring 화면 분리",
        ],
        "purpose": "운동·휴식 이벤트를 sample domain으로 사용해, 백엔드 수집 계층과 비동기 처리, Data Mart, 분석·운영 화면의 책임을 하나의 실행 가능한 환경에서 분리해 검증했습니다.",
        "problem": "수집 요청에서 구조화 처리까지 모두 수행하면 HTTP 처리와 후처리가 강하게 결합됩니다. 원본 이벤트 보존, 이벤트 단위 처리, 스케줄 집계가 서로 다른 수명주기를 갖도록 설계했습니다.",
        "architecture": [
            {
                "label": "EVENT PROCESSING",
                "nodes": [
                    "Python Client",
                    "FastAPI Collector",
                    "raw_events",
                    "RabbitMQ",
                    "Celery Worker",
                    "processed_events",
                ],
            },
            {
                "label": "SCHEDULED ANALYTICS",
                "nodes": [
                    "processed_events",
                    "Airflow DAG",
                    "daily_actor_stats",
                    "Streamlit",
                ],
            },
            {
                "label": "OBSERVABILITY",
                "nodes": ["Collector · PostgreSQL · RabbitMQ", "Prometheus", "Grafana"],
            },
        ],
        "architecture_note": "세 application 테이블은 같은 PostgreSQL application DB에 있고 Airflow metadata는 같은 서버의 별도 DB를 사용합니다. Collector는 Raw commit 후 payload 전체가 아닌 event_id만 RabbitMQ에 전달합니다.",
        "implementation": [
            {
                "title": "Raw First와 중복 방어",
                "body": "Pydantic 검증을 통과한 payload를 JSONB로 먼저 저장합니다. event_id 충돌 시 기존 데이터를 덮어쓰거나 작업을 재발행하지 않고 HTTP 200 duplicate를 반환합니다.",
            },
            {
                "title": "비동기 처리 상태",
                "body": "Worker가 Raw payload를 조회해 PENDING → PROCESSING → COMPLETED 상태를 기록하고 분석 가능한 필드를 processed_events에 저장합니다.",
            },
            {
                "title": "이벤트 처리와 배치 분리",
                "body": "Celery는 이벤트 한 건의 구조화를, Airflow는 실행 날짜가 속한 UTC 하루 전체의 사용자별 집계와 upsert를 담당합니다.",
            },
            {
                "title": "분석과 운영 화면 분리",
                "body": "Streamlit은 daily_actor_stats를 조회하고 Prometheus·Grafana는 Collector HTTP, PostgreSQL, RabbitMQ 지표를 별도로 수집·표시합니다.",
            },
            {
                "title": "실행 환경 재현",
                "body": "Alembic migration과 세 Docker Compose 구성을 공통 network로 연결하고 Makefile로 core, pipeline, monitoring 실행을 관리합니다.",
            },
        ],
        "verification": [
            "Collector 검증 스크립트로 422 입력 오류, 신규 202, 중복 200, 동시 중복 요청과 Worker 저장 흐름 확인",
            "Airflow 검증 스크립트로 UTC 날짜 경계, 최신 actor name 선택, 재실행 upsert와 지연 이벤트 수동 재집계 확인",
            "Grafana 검증 스크립트로 빈 storage에서 datasource와 6개 dashboard panel provisioning 확인",
            "README에 fresh Compose 환경의 Raw → Queue → Worker → Data Mart 종단 검증 절차 기록",
        ],
        "limitations": [
            "Raw commit과 queue publish를 원자적으로 연결하는 Transactional Outbox는 미구현",
            "명시적 Worker retry, DLQ, PROCESSING 고착 상태 자동 복구는 미구현",
            "지연 이벤트의 과거 날짜 자동 재집계와 production 보존 정책은 범위 밖",
            "검증 데이터는 로컬 sample이며 처리량·지연 성능 benchmark가 아님",
        ],
    },
    "kubernetes-gitops-lab": {
        "name": "Kubernetes GitOps Lab",
        "category": "DEVOPS / KUBERNETES / CI/CD",
        "summary": "FastAPI 이미지를 GitHub Actions와 Argo CD로 전달하고 환경별 자동·수동 승격 정책을 검증한 GitOps 실습입니다.",
        "github": "https://github.com/JungJiBum/kubernetes-gitops-lab",
        "stack": [
            "FastAPI",
            "Docker Buildx",
            "GitHub Actions",
            "GHCR",
            "Kubernetes",
            "Kustomize",
            "Argo CD",
            "kind",
        ],
        "highlights": [
            "이미지 관련 변경만 멀티 아키텍처 Build/Push 수행",
            "DEV 자동 Sync, STG·PROD 수동 Sync 정책 분리",
            "검증한 동일 Commit SHA 이미지를 환경별로 승격",
        ],
        "purpose": "코드 변경부터 테스트, 이미지 생성, Git 상태 갱신, Kubernetes 반영까지 CI와 CD의 책임을 분리하고 환경별 승인 정책을 로컬 kind 클러스터에서 검증했습니다.",
        "problem": "환경마다 이미지를 다시 만들거나 CI가 클러스터를 직접 변경하면 승격 대상과 배포 책임이 불명확해집니다. 불변 이미지와 Git 선언 상태를 기준으로 배포 흐름을 구성했습니다.",
        "architecture": [
            {
                "label": "CONTINUOUS INTEGRATION",
                "nodes": [
                    "Pull Request",
                    "pytest",
                    "Path Filter",
                    "Docker Buildx",
                    "GHCR · SHA Tag",
                    "DEV Overlay Update",
                ],
            },
            {
                "label": "GITOPS DELIVERY",
                "nodes": [
                    "Kustomize Overlays",
                    "Argo CD",
                    "DEV · Auto Sync",
                    "STG · Manual Sync",
                    "PROD · Manual Sync",
                ],
            },
        ],
        "architecture_note": "GitHub Actions는 이미지 생성과 DEV manifest 갱신을 담당하고 Argo CD는 Git과 클러스터 상태를 동기화합니다. STG와 PROD는 DEV에서 검증한 동일 SHA를 다시 빌드하지 않고 수동 Sync합니다.",
        "implementation": [
            {
                "title": "변경 범위 기반 CI",
                "body": "PR과 main push에서 Python 테스트를 수행하고 app, Dockerfile, requirements 변경이 있을 때만 멀티 아키텍처 이미지를 Build/Push합니다.",
            },
            {
                "title": "Base와 Overlay 분리",
                "body": "공통 Deployment·Service는 Kustomize Base로, namespace·replica·APP_ENV·image tag는 DEV/STG/PROD Overlay로 관리합니다.",
            },
            {
                "title": "환경별 Sync 정책",
                "body": "DEV Application은 prune·selfHeal을 포함한 자동 Sync를 사용하고 STG·PROD는 OutOfSync 확인 후 수동 Sync하도록 구성했습니다.",
            },
            {
                "title": "배포 상태 확인 API",
                "body": "FastAPI가 환경·버전, liveness, readiness endpoint를 제공하고 Kubernetes Probe가 이를 사용합니다.",
            },
        ],
        "verification": [
            "FastAPI root, live, ready, version endpoint에 대한 pytest 4개 구성",
            "GitHub Actions에서 변경 감지와 Python Tests 성공, 이미지 비관련 변경의 Build/Push skip 확인",
            "로컬 kind에서 DEV 자동 Sync와 STG·PROD OutOfSync → 수동 Sync → Synced/Healthy 확인",
            "STG·PROD에 동일 Commit SHA 이미지가 배포된 결과와 Argo CD/GitHub Actions 화면을 저장소에 기록",
        ],
        "limitations": [
            "macOS Docker Desktop의 로컬 kind 검증이며 실제 cloud production 운영이 아님",
            "STG·PROD 승격 PR과 branch protection은 미구현",
            "배포 실패·rollback 시나리오와 Ingress·운영 보안·고가용성은 미검증",
            "배포 확인용 /web 문구는 환경별 동적 값이 아닌 정적 DEV 문구",
        ],
    },
    "agent-lab": {
        "name": "Agent Lab",
        "category": "AI AGENT / LLM / MCP",
        "summary": "Docker 상태와 로그를 읽기 전용 MCP 도구로 조회해 로컬 LLM의 장애 진단을 보조하는 Agent 실험입니다.",
        "github": "https://github.com/JungJiBum/agent-lab",
        "stack": [
            "FastAPI",
            "Ollama",
            "Qwen3:8b",
            "MCP",
            "Tool Calling",
            "Docker CLI",
            "HTTPX",
            "pytest",
        ],
        "highlights": [
            "MCP 도구 스키마를 동적으로 조회해 Ollama Tool Calling에 연결",
            "Host Metrics API를 통해 Docker 상태·로그를 읽기 전용 조회",
            "종료·연결 실패 Fault Lab과 Mock 기반 자동화 테스트 구성",
        ],
        "purpose": "운영 데이터 수집, MCP 도구 인터페이스, LLM Tool Calling을 연결해 관측된 Docker 상태와 로그를 근거로 장애 진단을 보조하는 구조를 검증했습니다.",
        "problem": "일반 챗봇은 실제 컨테이너 상태를 알 수 없습니다. LLM이 필요한 도구를 선택하고, 별도 Host Metrics API가 Docker CLI 결과를 제공하도록 실행 권한과 대화 계층을 분리했습니다.",
        "architecture": [
            {
                "label": "DIAGNOSIS REQUEST",
                "nodes": [
                    "User",
                    "FastAPI /chat",
                    "LLMProvider",
                    "Ollama · Qwen3:8b",
                    "Diagnostic Answer",
                ],
            },
            {
                "label": "READ-ONLY TOOL PATH",
                "nodes": [
                    "Ollama Tool Call",
                    "MCP Client",
                    "FastMCP · stdio",
                    "Host Metrics API",
                    "Docker CLI",
                ],
            },
        ],
        "architecture_note": "MCP Server가 Docker에 직접 접근하지 않고 host.docker.internal의 Host Metrics API를 호출합니다. 현재 Docker 조작 도구는 없으며 상태·상세·로그·호스트 지표 조회만 제공합니다.",
        "implementation": [
            {
                "title": "Provider 인터페이스",
                "body": "LLMProvider 추상 인터페이스와 Ollama·OpenAI 구현체를 분리했습니다. MCP 다단계 Tool Calling과 캐시는 현재 Ollama Provider에 구현되어 있습니다.",
            },
            {
                "title": "MCP 동적 도구 연결",
                "body": "stdio로 FastMCP Server를 실행해 tool schema를 읽고 Ollama 형식으로 변환하며 structured result를 다시 대화에 전달합니다.",
            },
            {
                "title": "안전한 읽기 전용 범위",
                "body": "Docker stats, inspect, logs를 조회하되 재시작·삭제·설정 변경 기능은 제공하지 않습니다. 로그 tail은 1~200줄, 응답은 최대 20,000자로 제한합니다.",
            },
            {
                "title": "대화 제어",
                "body": "동일 요청의 같은 도구·인자 결과를 캐시하고 tool round를 10회로 제한하며 도구 예외도 구조화해 LLM에 전달합니다.",
            },
            {
                "title": "Fault Lab",
                "body": "필수 환경변수 누락으로 종료되는 컨테이너와 Running 상태의 내부 연결 실패 컨테이너를 별도 Compose로 재현했습니다.",
            },
        ],
        "verification": [
            "Docker CLI, MCP process, Ollama API를 Mock으로 대체한 자동화 테스트 13개 통과 기록",
            "컨테이너 상태 parsing, exited 상세, 로그 제한, Docker CLI 오류 검증",
            "MCP schema 변환, structured result, tool error와 Ollama 다단계 호출·캐시·round limit 검증",
            "Fault Lab 두 시나리오는 실제 Docker 환경에서 별도 수동 검증",
        ],
        "limitations": [
            "완전한 자율 복구가 아닌 읽기 전용 장애 진단 보조 실험",
            "자동화 테스트는 Mock 기반이며 Fault Lab만 실제 Docker에서 수동 검증",
            "Host Metrics API 인증·접근 제어·로그 비식별화는 미구현",
            "OpenAI Provider는 기본 chat 호출만 구현되어 MCP Tool Calling 진단 경로와 동일하지 않음",
            "로컬 CPU의 Qwen3:8b 다단계 호출은 응답 지연이 발생할 수 있음",
        ],
    },
    "sis-api": {
        "name": "SIS API",
        "category": "BACKEND API / REDIS",
        "summary": "이메일로 Redis Hash의 사용자 메타데이터를 검증·조회하고 실패 원인을 HTTP 상태로 구분하는 FastAPI입니다.",
        "github": "https://github.com/JungJiBum/sis-api",
        "stack": [
            "FastAPI",
            "Pydantic",
            "Redis",
            "redis-py",
            "fakeredis",
            "HTTPX",
            "pytest",
            "Docker Compose",
        ],
        "highlights": [
            "이메일 정규화와 Redis 저장 데이터의 응답 모델 검증",
            "404·422·500·503 실패 원인을 구분하고 내부 예외 비노출",
            "Mock/fakeredis 단위 테스트와 실제 Redis 인수 테스트 분리",
        ],
        "purpose": "실무에서 구현하지 못했던 사용자 메타데이터 조회 요구사항을 회사 코드와 시스템을 재사용하지 않고 독립적인 개인 프로젝트로 다시 설계했습니다.",
        "problem": "외부 입력뿐 아니라 Redis에 이미 저장된 데이터도 신뢰할 수 없으므로 조회 키 정규화, 저장 데이터 검증, 저장소 장애와 미존재 응답을 명확히 분리해야 했습니다.",
        "architecture": [
            {
                "label": "USER LOOKUP",
                "nodes": [
                    "Client",
                    "GET /users",
                    "Email Validation",
                    "RedisUserRepository",
                    "Redis Hash",
                    "UserMetadata Response",
                ],
            },
            {
                "label": "ERROR CONTRACT",
                "nodes": [
                    "Invalid Input · 422",
                    "Not Found · 404",
                    "Invalid Stored Data · 500",
                    "Redis Unavailable · 503",
                ],
            },
        ],
        "architecture_note": "업무 API는 GET /users 하나입니다. email의 앞뒤 공백을 제거하고 domain만 소문자로 정규화한 뒤 Redis Hash를 조회하며, 응답 전에 저장 데이터도 Pydantic 모델로 다시 검증합니다.",
        "implementation": [
            {
                "title": "입력과 키 정규화",
                "body": "이메일 길이·형식을 검증하고 로컬 부분의 대소문자는 보존한 채 domain만 소문자로 정규화해 동일 규칙의 Redis key를 조회합니다.",
            },
            {
                "title": "저장 데이터 검증",
                "body": "필수 필드 누락, 이메일 불일치, 잘못된 숫자, Hash가 아닌 값과 UTF-8 오류를 INVALID_USER_DATA로 처리하고 추가 필드는 응답에서 제외합니다.",
            },
            {
                "title": "오류 경계",
                "body": "사용자 미존재 404, 입력 오류 422, 저장 데이터 오류 500, Redis 연결·권한·timeout 오류 503을 구분하며 Redis 예외 원문을 응답에 노출하지 않습니다.",
            },
            {
                "title": "Redis lifecycle",
                "body": "환경변수로 연결 URL과 timeout을 설정하고 FastAPI lifespan 종료 시 비동기 Redis client를 정리합니다. 자동 retry는 사용하지 않습니다.",
            },
            {
                "title": "로컬 검증 도구",
                "body": "localhost 계열 Redis만 허용하는 sample seed와 독립 Redis container·Uvicorn process를 사용하는 black-box acceptance script를 제공합니다.",
            },
        ],
        "verification": [
            "AsyncMock, TestClient, fakeredis 기반 테스트 27개 통과 기록과 의존성 deprecation warning 2개 기록",
            "정상 조회, 선택 필드, 추가 필드 제외, 입력 시 Redis 미호출, 404·500·503 및 설정 검증",
            "실제 Redis 인수 테스트에서 정상 사용자, 미존재, 잘못된 email, Redis 중지 후 연속 503의 4개 기준 PASS 기록",
            "인수 테스트가 실행 전후 app source hash를 비교하고 임시 process·container를 정리하도록 구성",
        ],
        "limitations": [
            "인증·인가와 사용자 등록·수정·삭제 API는 미구현",
            "LRS/SIS 동기화와 리사이클링 API는 현재 범위 밖",
            "성능·부하 테스트 결과가 없으며 실제 개인정보를 사용하는 외부 공개 서비스가 아님",
            "email query parameter가 HTTP access log에 남을 수 있고 Redis 자동 retry는 비활성화",
            "저장소 README의 최근 점검에서는 Docker daemon 부재로 인수 테스트를 재실행하지 못하고 기존 4/4 결과를 확인",
        ],
    },
}


PERSONAL_PROJECT_ORDER = (
    "event-data-platform",
    "kubernetes-gitops-lab",
    "agent-lab",
    "sis-api",
)


def personal_project_list():
    return [dict(PERSONAL_PROJECTS[slug], slug=slug) for slug in PERSONAL_PROJECT_ORDER]
