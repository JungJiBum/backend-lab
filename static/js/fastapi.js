document.addEventListener("DOMContentLoaded", () => {
    const steps = {
        source: {
            title: "Source Code",
            role: "포트폴리오 Backend와 Interactive Playground의 구현 코드를 관리합니다.",
            details: ["app/ FastAPI 애플리케이션", "templates/ Jinja2 화면", "static/ CSS·JavaScript", "tests/ Endpoint 검증"],
            code: "app/\ntemplates/\nstatic/\ntests/",
            result: "source ready"
        },
        application: {
            title: "FastAPI Application",
            role: "서비스 진입점에서 애플리케이션과 공통 구성을 연결합니다.",
            details: ["FastAPI App 생성", "StaticFiles를 /static에 Mount", "Home Router와 Playground Router Include", "/health Endpoint 제공"],
            code: "app = FastAPI()\n\napp.mount(\"/static\", StaticFiles(directory=\"static\"), name=\"static\")\napp.include_router(home_router)\napp.include_router(playground_router)",
            result: "app configured"
        },
        router: {
            title: "Router",
            role: "포트폴리오 페이지 요청을 Endpoint와 Template에 연결합니다.",
            details: ["APIRouter 기반 Home·Playground 분리", "/playground/{topic} 동적 라우팅", "Template 존재 여부 확인", "없는 페이지는 404 응답"],
            code: "router = APIRouter(prefix=\"/playground\")\n\n@router.get(\"/{topic}\")\ndef playground(topic: str, request: Request):",
            result: "routes connected"
        },
        template: {
            title: "Template Rendering",
            role: "Jinja2 Template으로 포트폴리오와 Playground 화면을 Server Side Rendering합니다.",
            details: ["Jinja2Templates 사용", "base.html 공통 Layout 상속", "Request와 topic Context 전달", "동적 HTML Response 생성"],
            code: "templates.TemplateResponse(\n    request=request,\n    name=f\"playground/{topic}.html\",\n    context={\"topic\": topic},\n)",
            result: "pages rendered"
        },
        static: {
            title: "Static Resource Delivery",
            role: "Interactive Playground에 필요한 CSS와 JavaScript Asset을 제공합니다.",
            details: ["static/css 공통·Playground 스타일 관리", "static/js 페이지별 Interaction 관리", "FastAPI StaticFiles Mount", "Template의 url_for로 Asset 경로 생성"],
            code: "<link rel=\"stylesheet\" href=\"{{ url_for('static', path='/css/playground.css') }}\">\n<script src=\"{{ url_for('static', path='/js/fastapi.js') }}\"></script>",
            result: "assets delivered"
        },
        ci: {
            title: "CI Verification",
            role: "코드 변경 사항이 포트폴리오 서비스에 반영되기 전에 실행 가능성과 품질을 검증합니다.",
            details: ["GitHub Actions Workflow", "FastAPI Application Import 확인", "Ruff Lint", "Pytest Endpoint 테스트"],
            code: "Verify FastAPI\n  ↓\nRuff Lint\n  ↓\nPytest\n  ↓\nCI Passed",
            result: "ci passed"
        },
        deployment: {
            title: "Deployment",
            role: "검증된 Repository를 Render Hosting 환경에 연결해 포트폴리오 서비스를 제공합니다.",
            details: ["GitHub Repository 기반 배포", "Render Hosting 환경", "FastAPI 애플리케이션 실행", "배포된 포트폴리오 페이지 제공"],
            code: "GitHub Repository\n  ↓\nRender Hosting\n  ↓\nFastAPI Application\n  ↓\nPortfolio Online",
            result: "service deployed"
        }
    };

    const lifecycle = document.querySelector("#fastapi-lifecycle");
    const nodes = [...lifecycle.querySelectorAll(".fastapi-node")];
    const connectors = [...lifecycle.querySelectorAll(".fastapi-connector")];
    const startButton = document.querySelector("#start-request-flow");
    const detailTitle = document.querySelector("#fastapi-detail-title");
    const detailRole = document.querySelector("#fastapi-detail-role");
    const detailList = document.querySelector("#fastapi-detail-list");
    const detailCode = document.querySelector("#fastapi-detail-code code");
    const liveStatus = document.querySelector("#fastapi-live-status");
    const delay = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));
    let isRunning = false;

    function selectStep(stepKey) {
        const step = steps[stepKey];
        if (!step) return;
        nodes.forEach((node) => {
            const selected = node.dataset.step === stepKey;
            node.classList.toggle("is-selected", selected);
            node.setAttribute("aria-pressed", String(selected));
        });
        detailTitle.textContent = step.title;
        detailRole.textContent = step.role;
        detailList.innerHTML = step.details.map((item) => `<li>${item}</li>`).join("");
        detailCode.textContent = step.code;
    }

    async function movePacket(connector) {
        connector.classList.remove("is-moving");
        void connector.offsetWidth;
        connector.classList.add("is-moving");
        await delay(520);
        connector.classList.remove("is-moving");
        connector.classList.add("is-complete");
    }

    async function runLifecycle() {
        if (isRunning) return;
        isRunning = true;
        startButton.disabled = true;
        nodes.forEach((node, index) => {
            node.classList.remove("is-active", "is-complete");
            node.querySelector(".fastapi-node-status").textContent = index === 0 ? "READY" : "WAITING";
        });
        connectors.forEach((connector) => connector.classList.remove("is-moving", "is-complete"));

        for (let index = 0; index < nodes.length; index += 1) {
            const node = nodes[index];
            const step = steps[node.dataset.step];
            selectStep(node.dataset.step);
            node.classList.add("is-active");
            node.querySelector(".fastapi-node-status").textContent = "PROCESSING";
            liveStatus.textContent = `${step.title} — ${step.role}`;
            await delay(650);
            node.classList.remove("is-active");
            node.classList.add("is-complete");
            node.querySelector(".fastapi-node-status").textContent = step.result;
            if (connectors[index]) await movePacket(connectors[index]);
        }

        liveStatus.textContent = "Source Code부터 CI 검증과 Render 배포 환경까지 포트폴리오 플랫폼 구성이 완료되었습니다.";
        startButton.disabled = false;
        isRunning = false;
    }

    nodes.forEach((node) => node.addEventListener("click", () => selectStep(node.dataset.step)));
    startButton.addEventListener("click", runLifecycle);
    selectStep("source");
});
