from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_home():
    response = client.get("/")
    assert response.status_code == 200
    assert "JUNG JIBUM · PYTHON BACKEND ENGINEER" in response.text
    assert "만들고, 운영하고," in response.text
    assert 'href="/projects"' in response.text
    assert "더 깊은 이야기가 궁금하다면" in response.text
    assert "Selected Systems" not in response.text
    assert 'href="/playground/' not in response.text


def test_home_layout_reserves_sidebar_width():
    base_css = client.get("/static/css/style.css")
    home_css = client.get("/static/css/atlas.css")

    assert base_css.status_code == 200
    assert home_css.status_code == 200
    assert "--site-sidebar-width: 220px" in base_css.text
    assert "width:calc(100% - var(--site-sidebar-width))" in home_css.text
    assert "margin:0 0 0 var(--site-sidebar-width)" in home_css.text
    assert "width:100%;margin-left:0" in home_css.text
    assert "100vw" not in home_css.text


def test_home_static_tech_network_and_lrs_lab_assets_are_connected():
    home = client.get("/")
    lab = client.get("/playground/lrs")
    motion = client.get("/static/js/flow-motion.js")

    assert 'id="skill-explorer"' in home.text
    assert 'class="hero-tech-network"' in home.text
    assert 'class="network-core"' in home.text
    assert 'class="network-category"' in home.text
    assert "/static/js/skill-explorer.js" not in home.text
    assert "DYNAMIC TECH MINDMAP" not in home.text
    assert "VERIFIED EXPERIENCE" not in home.text
    assert 'id="hero-lrs-preview"' not in home.text
    assert 'id="lrs-flow-layer"' in lab.text
    assert "/static/js/flow-motion.js" in lab.text
    assert motion.status_code == 200
    assert "requestAnimationFrame" in motion.text


def test_docs():
    response = client.get("/docs")
    assert response.status_code == 200


def test_health():
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_phase_one_page_routes():
    expected_pages = {
        "/about": "시스템을 만들고,",
        "/projects": "프로젝트 둘러보기",
        "/projects/career": "실무 프로젝트",
        "/projects/personal": "개인 프로젝트",
        "/labs": "독립적인 처리 흐름을 직접 확인합니다.",
        "/contact": "2377325@gmail.com",
    }

    for path, expected_text in expected_pages.items():
        response = client.get(path)
        assert response.status_code == 200
        assert expected_text in response.text


def test_sidebar_projects_dropdown_and_links():
    response = client.get("/projects/career")

    assert response.status_code == 200
    assert "data-projects-toggle" in response.text
    assert 'aria-expanded="true"' in response.text
    assert 'href="/projects/career"' in response.text
    assert 'href="/projects/personal"' in response.text
    assert 'aria-current="page"' in response.text


def test_career_projects_list_contains_verified_catalog():
    response = client.get("/projects/career")
    assert response.status_code == 200
    expected = (
        ("lrs-async-processing", "LRS 이벤트 수신 경로의 처리 비용 분리"),
        ("multi-server-deployment", "다중 서버 환경의 배포 절차 표준화"),
        ("elasticsearch-query-incident", "HTTP 200인데 데이터가 0인 조회 장애 추적"),
        ("service-observability", "인프라 정상과 서비스 정상을 분리한 운영 모니터링"),
        ("offline-installation", "인터넷이 없는 환경에서 반복 가능한 설치 절차 만들기"),
        ("airflow-competency-calculation", "반복되는 역량 계산을 Airflow DAG로 실행"),
    )
    positions = []
    for slug, name in expected:
        assert name in response.text
        assert f'href="/projects/career/{slug}"' in response.text
        positions.append(response.text.index(name))
    assert positions == sorted(positions)


def test_career_project_detail_routes_and_simulation_controls():
    slugs = (
        "lrs-async-processing",
        "multi-server-deployment",
        "elasticsearch-query-incident",
        "service-observability",
        "offline-installation",
        "airflow-competency-calculation",
    )
    for slug in slugs:
        response = client.get(f"/projects/career/{slug}")
        assert response.status_code == 200
        for heading in (
            "Overview",
            "Interactive Architecture",
            "Key Contributions",
            "Results &amp; Verification",
            "Technical Challenges",
        ):
            assert heading in response.text
        assert f'data-career-simulator="{slug}"' in response.text
        assert "BROWSER SIMULATION" in response.text
        assert "실제 운영 시스템과 연결되지 않은" in response.text
        assert "data-sim-run" in response.text
        assert "data-sim-pause" in response.text
        assert "data-sim-reset" in response.text
        assert "/static/js/flow-motion.js" in response.text
        assert "/static/js/career-project-sim.js" in response.text
        assert 'href="/projects/career"' in response.text
        assert 'aria-current="page"' in response.text


def test_unknown_career_project_returns_404():
    assert client.get("/projects/career/not-a-project").status_code == 404


def test_career_simulation_script_contains_verified_scenarios():
    response = client.get("/static/js/career-project-sim.js")
    assert response.status_code == 200
    for slug in (
        "lrs-async-processing",
        "multi-server-deployment",
        "elasticsearch-query-incident",
        "service-observability",
        "offline-installation",
        "airflow-competency-calculation",
    ):
        assert f'"{slug}"' in response.text
    for boundary in (
        "226 → 599",
        "30~40m",
        ".keyword mismatch",
        "Queue → Consumer → Worker → DB",
        "No repository access",
        "Storage/schedule omitted",
    ):
        assert boundary in response.text


def test_personal_projects_list_contains_exact_catalog():
    response = client.get("/projects/personal")

    assert response.status_code == 200
    expected = (
        ("event-data-platform", "Event Data Platform"),
        ("kubernetes-gitops-lab", "Kubernetes GitOps Lab"),
        ("agent-lab", "Agent Lab"),
        ("sis-api", "SIS API"),
    )
    for slug, name in expected:
        assert name in response.text
        assert f'href="/projects/personal/{slug}"' in response.text
        assert f'href="https://github.com/JungJiBum/{slug}"' in response.text
    assert response.text.index("Event Data Platform") < response.text.index(
        "Kubernetes GitOps Lab"
    )
    assert response.text.index("Kubernetes GitOps Lab") < response.text.index(
        "Agent Lab"
    )
    assert response.text.index("Agent Lab") < response.text.index("SIS API")
    assert "Voice Agent Lab" not in response.text
    assert "Backend Lab 자체" not in response.text


def test_personal_project_detail_routes():
    expected = {
        "event-data-platform": ("Raw First", "Transactional Outbox"),
        "kubernetes-gitops-lab": ("환경별 Sync 정책", "로컬 kind"),
        "agent-lab": ("MCP 동적 도구 연결", "자율 복구"),
        "sis-api": ("GET /users", "인증·인가"),
    }

    for slug, texts in expected.items():
        response = client.get(f"/projects/personal/{slug}")
        assert response.status_code == 200
        assert "Overview" in response.text
        assert "Architecture" in response.text
        assert "Key Implementation" in response.text
        assert "Verification" in response.text
        assert "Limitations" in response.text
        assert "data-project-simulator=" in response.text
        assert "data-sim-run" in response.text
        assert "data-sim-pause" in response.text
        assert "data-sim-reset" in response.text
        assert "/static/js/flow-motion.js" in response.text
        assert "/static/js/personal-project-sim.js" in response.text
        assert "BROWSER SIMULATION" in response.text
        assert 'href="/projects/personal"' in response.text
        assert f'href="https://github.com/JungJiBum/{slug}"' in response.text
        for text in texts:
            assert text in response.text
        assert 'aria-expanded="true"' in response.text
        assert 'aria-current="page"' in response.text


def test_unknown_personal_project_returns_404():
    assert client.get("/projects/personal/not-a-project").status_code == 404


def test_personal_project_simulation_script_contains_real_scenarios():
    response = client.get("/static/js/personal-project-sim.js")

    assert response.status_code == 200
    for project in (
        "event-data-platform",
        "kubernetes-gitops-lab",
        "agent-lab",
        "sis-api",
    ):
        assert f'"{project}"' in response.text
    for implementation_boundary in (
        "PENDING → PROCESSING → COMPLETED",
        "DEV Auto Sync",
        "MCP Tool 오류",
        "Redis 연결/Timeout 오류",
        "requestAnimationFrame",
        "prefers-reduced-motion",
    ):
        if implementation_boundary in (
            "requestAnimationFrame",
            "prefers-reduced-motion",
        ):
            motion = client.get("/static/js/flow-motion.js")
            assert implementation_boundary in motion.text
        else:
            assert implementation_boundary in response.text


def test_labs_directory_keeps_existing_playground_links():
    response = client.get("/labs")

    assert response.status_code == 200
    for topic in ("sync-async", "voice-agent"):
        assert f'href="/playground/{topic}"' in response.text
    for integrated_topic in ("lrs", "cicd", "monitoring"):
        assert f'href="/playground/{integrated_topic}"' not in response.text
        assert client.get(f"/playground/{integrated_topic}").status_code == 200
    assert 'href="/projects/career"' in response.text
    assert 'href="/projects/personal"' in response.text


def test_about_uses_verified_profile_sections():
    response = client.get("/about")
    assert response.status_code == 200
    for text in (
        "핵심 역량",
        "기술 스택",
        "경력 요약",
        "문제 해결 방식",
        "주식회사 버블콘",
        "대한광통신",
        "2023.05 — 2026.07",
    ):
        assert text in response.text
    assert 'href="/projects/career"' in response.text
    assert 'href="/projects/personal"' in response.text
    assert "/static/css/about.css" in response.text
    assert "프로젝트에서 더 자세한 경험을 확인해보세요." in response.text
    assert response.text.count('class="capability-icon"') == 4


def test_about_uses_local_svg_icons_without_abbreviation_badges():
    response = client.get("/about")
    assert response.status_code == 200
    for icon in (
        "server",
        "database",
        "boxes",
        "activity",
        "search",
        "git-branch",
        "settings",
        "shield-check",
    ):
        path = f"/static/icons/about/lucide/{icon}.svg"
        assert path in response.text
        assert client.get(path).status_code == 200
    for logo in (
        "python",
        "django",
        "flask",
        "fastapi",
        "postgresql",
        "elasticsearch",
        "redis",
        "rabbitmq",
        "celery",
        "apacheairflow",
        "docker",
        "nginx",
        "linux",
        "jenkins",
        "prometheus",
        "grafana",
        "locust",
        "pytest",
        "playwright",
        "ollama",
        "kubernetes",
        "argo",
    ):
        path = f"/static/icons/about/brands/{logo}.svg"
        assert path in response.text
        assert client.get(path).status_code == 200
    for abbreviation in (">Py<", ">Dj<", ">Pg<", ">Dk<"):
        assert abbreviation not in response.text


def test_contact_actions_and_copy_script():
    response = client.get("/contact")
    script = client.get("/static/js/contact.js")
    assert response.status_code == 200
    assert 'href="mailto:2377325@gmail.com"' in response.text
    assert 'href="https://github.com/JungJiBum"' in response.text
    assert "data-copy-email" in response.text
    assert "data-copy-status" in response.text
    assert "/static/js/contact.js" in response.text
    assert script.status_code == 200
    assert "navigator.clipboard.writeText" in script.text


def test_sidebar_projects_has_direct_collections_without_overview_step():
    response = client.get("/about")
    assert response.status_code == 200
    assert "Projects Overview" not in response.text
    assert 'href="/projects/career"' in response.text
    assert 'href="/projects/personal"' in response.text
    assert "Interactive Labs" not in response.text
    assert 'href="/labs"' not in response.text
    assert client.get("/projects").status_code == 200


def test_project_collection_headings_are_korean():
    career = client.get("/projects/career")
    personal = client.get("/projects/personal")
    assert (
        "실제 업무에서 구축하고 운영한 시스템과 문제 해결 경험을 소개합니다."
        in career.text
    )
    assert (
        "직접 설계하고 구현하며 검증한 개인 개발 프로젝트를 소개합니다."
        in personal.text
    )


def test_contact_uses_local_visual_assets():
    response = client.get("/contact")
    assert response.status_code == 200

    for icon in ("mail", "copy", "github"):
        path = f"/static/icons/contact/{icon}.svg"
        assert path in response.text


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


def test_voice_agent_is_removed_from_home_but_route_is_preserved():
    response = client.get("/")

    assert response.status_code == 200
    assert 'href="/playground/voice-agent"' not in response.text
    assert "Voice Backend" not in response.text
    assert client.get("/playground/voice-agent").status_code == 200


def test_lrs_workbench_controls_and_assets():
    response = client.get("/playground/lrs")

    assert response.status_code == 200
    assert "INTERACTIVE ARCHITECTURE" in response.text
    assert "Experiment settings" in response.text
    assert 'id="lrs-canvas"' in response.text
    assert 'id="event-count"' in response.text
    assert 'id="invalid-count"' in response.text
    assert 'id="lrs-reset"' in response.text
    assert "/static/js/lrs.js" in response.text


def test_voice_agent_playground_script():
    response = client.get("/static/js/voice-agent.js")

    assert response.status_code == 200
    assert "runFlow" in response.text
