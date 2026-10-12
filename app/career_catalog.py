CAREER_PROJECTS = {
    "lrs-async-processing": {
        "name": "LRS 이벤트 수신 경로의 처리 비용 분리",
        "category": "BACKEND / PERFORMANCE",
        "period": "2024–2025 중심",
        "role": "Python / Django Backend",
        "summary": "이벤트 원본 저장과 무거운 관계 데이터 후처리를 분리해 수신 경로의 처리 비용과 Batch 실패 범위를 줄였습니다.",
        "stack": [
            "Django",
            "PostgreSQL",
            "RabbitMQ",
            "Celery",
            "Celery Beat",
            "Elasticsearch",
            "Locust",
        ],
        "highlights": [
            "FullStatement 원본과 요청 UUID 우선 저장 후 비동기 처리",
            "개별 실패 UUID·ID와 상태 기반 처리 추적",
            "동일 조건 RPS 226→599, 평균 응답 22.5s→9.3s",
        ],
        "background": "xAPI Statement 수신 요청에서 관계 데이터 검증·저장과 정규화까지 함께 수행해 후처리 비용이 API 응답시간과 수신 처리량에 직접 영향을 주고 있었습니다.",
        "contributions": [
            {
                "title": "요청 경로 책임 분리",
                "body": "요청 UUID와 FullStatement 원본을 먼저 저장하고 관계 데이터 검증·정규화 작업은 RabbitMQ와 Celery Worker로 전달하도록 변경했습니다.",
            },
            {
                "title": "처리 상태 추적",
                "body": "PENDING → PROCESSING → COMPLETED/RETRY/FAILED 상태와 check_count를 이용해 후처리 진행 상태를 확인할 수 있게 했습니다.",
            },
            {
                "title": "개별 실패 격리",
                "body": "failed_uuids, failed_ids, error_counts로 실패 항목을 분리해 일부 검증 실패가 전체 Batch 처리 실패로 이어지는 범위를 줄였습니다.",
            },
        ],
        "results": [
            "동일 조건 Locust 비교에서 RPS 226 → 599",
            "평균 응답시간 22.5초 → 9.3초",
            "원본과 처리 상태를 재처리 기준점으로 보존",
            "실패 영향 범위를 Batch 전체에서 개별 데이터 단위로 축소",
        ],
        "challenges": [
            "API 응답과 후처리 비용이 결합된 호출 경로를 단계별로 추적",
            "원본 저장과 비동기 후처리 사이의 책임 경계 정의",
            "다건 입력에서 성공 데이터와 실패 데이터를 함께 추적할 상태 모델 구성",
        ],
    },
    "multi-server-deployment": {
        "name": "다중 서버 환경의 배포 절차 표준화",
        "category": "DEVOPS / DEPLOYMENT",
        "period": "2024",
        "role": "Backend · DevOps · 성능 검증",
        "summary": "Load Balancer 뒤 최대 9대 서버를 두 그룹으로 나눠 트래픽 전환과 Jenkins 배포·검증 순서를 표준화했습니다.",
        "stack": [
            "NCP",
            "Load Balancer",
            "ACG",
            "Docker",
            "Nginx",
            "Jenkins",
            "Locust",
        ],
        "highlights": [
            "4대·5대 그룹별 순차 트래픽 전환",
            "Jenkins image 전달·pull·container 배포",
            "설치·배포·검증 약 2시간→30~40분",
        ],
        "background": "동일 이미지를 여러 Application Server에 반복 배포하고 기능·성능을 검증해야 했으며, 수동 절차는 약 2시간이 걸리고 반복 작업의 일관성을 유지하기 어려웠습니다.",
        "contributions": [
            {
                "title": "두 배포 그룹 구성",
                "body": "최대 9대 서버를 4대·5대 두 그룹으로 나누고 전체 서버를 동시에 변경하지 않도록 LB 전환 순서를 구성했습니다.",
            },
            {
                "title": "순차 배포 절차",
                "body": "1그룹 LB 제외·배포 후 트래픽을 전환하고, 이어서 2그룹을 제외·배포·재연결하는 순서를 정형화했습니다.",
            },
            {
                "title": "배포와 검증 연결",
                "body": "Jenkins에서 image 전달·pull과 container 배포를 실행하고 이후 Locust와 AIDT LRS BMT 기능·성능 검증으로 연결했습니다.",
            },
        ],
        "results": [
            "수동 약 2시간이던 설치·배포·검증을 30~40분으로 단축",
            "다중 서버 배포를 반복 가능한 순서로 표준화",
            "Nginx, Django/uWSGI, Celery/RabbitMQ, PostgreSQL 계층별 검증 수행",
        ],
        "challenges": [
            "서비스 중단 범위를 줄이기 위한 트래픽과 배포 순서 결정",
            "두 그룹의 서비스 상태와 LB 연결 상태를 단계별로 확인",
            "배포 완료와 실제 기능·성능 정상 여부를 별도 검증",
        ],
    },
    "elasticsearch-query-incident": {
        "name": "HTTP 200인데 데이터가 0인 조회 장애 추적",
        "category": "TROUBLESHOOTING / SEARCH",
        "period": "2026",
        "role": "운영 · 장애 분석",
        "summary": "정상 HTTP 응답 뒤에 숨은 query·mapping과 검색 대상 환경 설정 불일치를 전체 조회 경로 추적으로 분리했습니다.",
        "stack": ["Elasticsearch", "GraphQL", "Search API", "Docker", "Linux"],
        "highlights": [
            "Dashboard부터 Elasticsearch까지 호출 경로 추적",
            ".keyword query와 실제 mapping 불일치 수정",
            "잘못된 INDEX_URL 수정 후 사용자 화면 재검증",
        ],
        "background": "API는 HTTP 200을 반환했지만 Dashboard chart의 데이터는 0이었습니다. 서버 오류가 없었기 때문에 HTTP 상태만으로 장애 원인을 확인할 수 없었습니다.",
        "contributions": [
            {
                "title": "조회 경로 분해",
                "body": "Dashboard → GraphQL/Search API → Elasticsearch query → index mapping → 환경 설정 순서로 호출 경로를 추적했습니다.",
            },
            {
                "title": "Query와 Mapping 정합성",
                "body": "actor_id·verb_id·content_id의 .keyword query가 실제 index mapping과 일치하지 않는 부분을 확인하고 mapping에 맞게 수정했습니다.",
            },
            {
                "title": "검색 대상 환경 수정",
                "body": "Search settings.ini의 INDEX_URL이 대상 데이터와 다른 환경을 가리키는 문제를 수정하고 Search를 재기동했습니다.",
            },
        ],
        "results": [
            "validation 환경에서 수정된 조회 결과 확인",
            "Dashboard 담당자와 실제 사용자 화면의 데이터 정상 노출 확인",
            "HTTP 성공 여부 대신 전체 데이터 조회 경로를 기준으로 원인 분리",
        ],
        "challenges": [
            "오류 응답 없이 빈 결과만 반환되는 장애의 관측 지점 선정",
            "Query 문법과 index mapping 문제, 환경 설정 문제를 독립적으로 분리",
            "수정 후 API뿐 아니라 최종 Dashboard 화면까지 동일 경로 재검증",
        ],
    },
    "service-observability": {
        "name": "인프라 정상과 서비스 정상을 분리한 운영 모니터링",
        "category": "OBSERVABILITY / OPERATIONS",
        "period": "2023–2026",
        "role": "운영 · 모니터링 개선",
        "summary": "서버 자원 지표와 실제 이벤트 수집·검색·Dashboard 처리 상태를 함께 확인하는 운영 점검 흐름을 구성했습니다.",
        "stack": [
            "Prometheus",
            "Grafana",
            "Node Exporter",
            "RabbitMQ",
            "Elasticsearch",
            "Playwright",
        ],
        "highlights": [
            "인프라 지표와 서비스 처리 상태 분리",
            "Queue→Consumer→Worker→PostgreSQL 순 병목 추적",
            "수집 target 이상과 실제 서비스 장애 구분",
        ],
        "background": "CPU·메모리·디스크가 정상이어도 이벤트 수집, 검색, Dashboard 조회는 실패할 수 있어 인프라 지표만으로 사용자 기능의 정상 여부를 판단하기 어려웠습니다.",
        "contributions": [
            {
                "title": "서비스 관점 점검",
                "body": "자원 지표 외에 RabbitMQ Queue/Consumer, Elasticsearch heap/OOM, Dashboard·GraphQL·Search API, 수집량과 최신 데이터 시각을 함께 확인했습니다.",
            },
            {
                "title": "처리 경로 기반 병목 추적",
                "body": "Queue 증가 시 Consumer → Celery Worker → PostgreSQL 적재 순서로 내려가며 어느 단계에서 처리가 멈췄는지 좁혔습니다.",
            },
            {
                "title": "모니터링 자체 검증",
                "body": "Prometheus target과 series 수집 상태를 별도로 확인해 지표 수집 이상과 실제 서비스 이상을 구분했습니다.",
            },
        ],
        "results": [
            "서버 생존 여부와 사용자의 실제 기능 이용 가능 여부를 분리",
            "장애 범위를 인프라·메시지·처리·저장·조회 단계로 좁히는 운영 방식 정리",
        ],
        "challenges": [
            "서로 다른 계층의 지표를 하나의 장애 흐름으로 연결",
            "Queue 적체가 Broker, Consumer, Worker, DB 중 어디서 시작됐는지 구분",
            "관측 시스템 자체 이상이 잘못된 장애 판단으로 이어지지 않도록 확인",
        ],
    },
    "offline-installation": {
        "name": "인터넷이 없는 환경에서 반복 가능한 설치 절차 만들기",
        "category": "INFRASTRUCTURE / OFFLINE",
        "period": "2023.12",
        "role": "Backend · DevOps 구축",
        "summary": "외부 package repository에 접근할 수 없는 환경에서 OS별 패키지와 의존성, 설치 순서를 사전 구성했습니다.",
        "stack": ["Linux", "Docker", "Docker Compose", "Shell"],
        "highlights": [
            "대상 OS별 Docker 패키지·dependency 사전 구성",
            "이동식 매체를 통한 설치 파일 반입",
            "서버 세팅·설치 자동화와 수행 절차 문서화",
        ],
        "background": "외부 package repository를 사용할 수 없고 OS별 RPM과 dependency가 달라, 온라인 설치 명령 대신 필요한 파일과 순서를 사전에 확정해야 했습니다.",
        "contributions": [
            {
                "title": "설치 자산 사전 구성",
                "body": "대상 OS 버전에 맞는 Docker, Docker Compose 패키지와 dependency를 외부 연결이 가능한 환경에서 준비했습니다.",
            },
            {
                "title": "오프라인 반입",
                "body": "준비한 설치 파일을 이동식 매체로 폐쇄망에 반입해 외부 네트워크 없이 사용할 수 있도록 구성했습니다.",
            },
            {
                "title": "자동화와 문서화",
                "body": "서버 세팅과 설치 과정을 Shell script로 구성하고 실제 수행 순서와 사내 티켓을 반복 가능한 절차로 정리했습니다.",
            },
        ],
        "results": [
            "실제 폐쇄망에서 준비한 절차와 script로 설치 수행",
            "외부 네트워크에 의존하지 않는 LRS 설치 절차 구성",
            "고객사 환경 구축 완료",
        ],
        "challenges": [
            "대상 OS와 package dependency의 사전 정합성 확인",
            "폐쇄망 진입 전에 누락 파일과 설치 순서를 확정",
            "내부 보안 세부사항을 노출하지 않으면서 반복 가능한 운영 문서 작성",
        ],
    },
    "airflow-competency-calculation": {
        "name": "반복되는 역량 계산을 Airflow DAG로 실행",
        "category": "DATA WORKFLOW / AIRFLOW",
        "period": "기간 미기재",
        "role": "Airflow DAG 구현",
        "summary": "전달받은 5대·6대 역량별 산식을 Python 계산 작업과 Airflow DAG로 구성해 반복 실행했습니다.",
        "stack": ["Python", "Apache Airflow"],
        "highlights": [
            "전략팀 정의 산식을 역량별 DAG로 구현",
            "Python 계산을 반복 실행 가능한 Task로 구성",
            "DAG 실행 상태와 계산 결과 운영 확인",
        ],
        "background": "전략팀이 정의한 5대·6대 역량별 산식을 실제 시스템에서 반복 실행하고 결과를 산출할 작업 구성이 필요했습니다.",
        "contributions": [
            {
                "title": "산식의 실행 단위화",
                "body": "전략팀에서 전달받은 역량과 산식을 Python 계산 작업으로 옮겨 반복 실행 가능한 단위로 구성했습니다.",
            },
            {
                "title": "역량별 DAG 구현",
                "body": "5대·6대 역량별 계산 작업을 Airflow DAG로 구현해 스케줄러에서 실행할 수 있도록 했습니다.",
            },
            {
                "title": "실행 결과 운영",
                "body": "DAG 실행 상태와 계산 결과를 확인하며 반복 산출 흐름을 운영했습니다.",
            },
        ],
        "results": [
            "정의된 산식을 기준으로 5대·6대 역량별 계산 결과를 반복 산출하는 실행 흐름 구현"
        ],
        "challenges": [
            "업무 산식을 변경 가능한 실행 단위로 옮기는 과정",
            "역량별 계산 작업의 실행 상태와 결과를 독립적으로 확인",
            "Notion 원본에 입력 데이터 저장소와 세부 스케줄은 명시되지 않아 공개 시각화에서 제외",
        ],
    },
}

CAREER_PROJECT_ORDER = tuple(CAREER_PROJECTS)


def career_project_list():
    return [dict(CAREER_PROJECTS[slug], slug=slug) for slug in CAREER_PROJECT_ORDER]
