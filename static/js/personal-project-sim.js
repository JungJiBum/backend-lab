document.addEventListener("DOMContentLoaded", () => {
    const simulator = document.querySelector("[data-project-simulator]");
    if (!simulator || !window.FlowMotion) return;

    const node = (id, label, subtitle, x, y, role, tone = "") => ({ id, label, subtitle, x, y, role, tone });
    const edge = (id, from, to, tone = "") => ({ id, from, to, tone });
    const activate = (id, active, complete = "COMPLETE", tone = "complete") => ({ type: "node", id, active, complete, tone });
    const move = (id, label = "", tone = "") => ({ type: "move", id, label, tone });
    const fact = (title, value) => ({ title, value });

    const configs = {
        "event-data-platform": {
            nodes: [
                node("client", "Python Client", "Sample event generator", 10, 15, "운동·휴식 sample event를 만들고 POST /events로 전송합니다."),
                node("collector", "FastAPI Collector", "Validate · persist · publish", 28, 15, "필수 필드와 timezone timestamp를 검증하고 신규 event를 Raw에 먼저 저장합니다."),
                node("postgres", "PostgreSQL", "raw · processed · mart", 50, 15, "하나의 application DB 안에서 raw_events, processed_events, daily_actor_stats를 관리합니다.", "database"),
                node("rabbit", "RabbitMQ", "event_id only", 72, 15, "Raw commit 이후 payload 전체가 아닌 event_id만 전달받는 Message Broker입니다."),
                node("worker", "Celery Worker", "Read · transform · store", 88, 42, "Raw payload를 조회해 구조화하고 processed_events에 저장합니다."),
                node("airflow", "Airflow DAG", "Scheduled every 2 min", 35, 59, "이벤트 처리와 별개로 실행 날짜가 속한 UTC 하루 전체를 사용자별로 집계합니다."),
                node("streamlit", "Streamlit", "Data Mart dashboard", 66, 59, "daily_actor_stats를 직접 조회해 분석 결과를 표시합니다."),
                node("prometheus", "Prometheus", "Metrics collection", 31, 84, "Collector, PostgreSQL exporter, RabbitMQ metrics endpoint를 scrape합니다.", "observe"),
                node("grafana", "Grafana", "Operations dashboard", 57, 84, "Provisioning된 운영 Dashboard에서 수집 지표를 조회합니다.", "observe"),
            ],
            edges: [
                edge("client-collector", "client", "collector"), edge("collector-client", "collector", "client"),
                edge("collector-postgres", "collector", "postgres"), edge("postgres-rabbit", "postgres", "rabbit"),
                edge("rabbit-worker", "rabbit", "worker"), edge("worker-postgres", "worker", "postgres"),
                edge("postgres-airflow", "postgres", "airflow", "scheduled"), edge("airflow-postgres", "airflow", "postgres", "scheduled"),
                edge("postgres-streamlit", "postgres", "streamlit", "scheduled"),
                edge("collector-prometheus", "collector", "prometheus", "metrics"), edge("postgres-prometheus", "postgres", "prometheus", "metrics"),
                edge("rabbit-prometheus", "rabbit", "prometheus", "metrics"), edge("prometheus-grafana", "prometheus", "grafana", "metrics"),
            ],
            scenarios: {
                valid: { label: "정상 이벤트 · 202", result: ["HTTP 202 accepted", "Raw status: COMPLETED"], facts: [fact("Response", "202 accepted"), fact("Raw lifecycle", "PENDING → PROCESSING → COMPLETED"), fact("Queue payload", "event_id only")], steps: [
                    activate("client", "GENERATING"), move("client-collector", "event JSON"), activate("collector", "VALIDATING"),
                    move("collector-postgres", "payload"), activate("postgres", "PENDING", "PENDING"),
                    move("postgres-rabbit", "event_id"), activate("rabbit", "PUBLISHING", "QUEUED"), move("collector-client", "202"),
                    move("rabbit-worker", "event_id"), activate("worker", "PROCESSING"), move("worker-postgres", "structured"),
                    activate("postgres", "PROCESSING", "COMPLETED"),
                    move("collector-prometheus", "metrics", "metrics"), move("prometheus-grafana", "scrape", "metrics"),
                ]},
                invalid: { label: "유효하지 않은 이벤트 · 422", result: ["HTTP 422 validation error", "DB와 Queue는 호출되지 않음"], facts: [fact("Response", "422"), fact("Raw write", "Not executed"), fact("Queue publish", "Not executed")], steps: [
                    activate("client", "SENDING"), move("client-collector", "invalid"), activate("collector", "VALIDATING", "REJECTED", "error"), move("collector-client", "422", "error"),
                ]},
                duplicate: { label: "중복 event_id · 200", result: ["HTTP 200 duplicate", "기존 payload 유지 · 작업 재발행 없음"], facts: [fact("Response", "200 duplicate"), fact("Existing raw", "Unchanged"), fact("Celery task", "Not published")], steps: [
                    activate("client", "SENDING"), move("client-collector", "same id"), activate("collector", "CHECKING"), move("collector-postgres", "event_id"), activate("postgres", "CONFLICT", "EXISTS", "warning"), move("collector-client", "200"),
                ]},
                batch: { label: "Airflow 예약 집계 · 별도 실행", result: ["daily_actor_stats upsert", "Streamlit은 Data Mart를 직접 조회"], facts: [fact("Schedule", "*/2 * * * *"), fact("Range", "UTC date"), fact("Write", "Upsert")], steps: [
                    activate("postgres", "PROCESSED READY", "READY"), move("postgres-airflow", "schedule", "scheduled"), activate("airflow", "AGGREGATING"), move("airflow-postgres", "upsert", "scheduled"), activate("postgres", "MART UPDATE", "UPSERTED"), move("postgres-streamlit", "query", "scheduled"), activate("streamlit", "REFRESHING", "VISIBLE"),
                ]},
            },
            defaultScenario: "valid", secondaryScenario: "batch",
        },
        "kubernetes-gitops-lab": {
            nodes: [
                node("source", "Source Change", "dev → main", 10, 18, "개발 변경을 Pull Request로 main에 반영합니다."),
                node("actions", "GitHub Actions", "Test · path filter", 26, 18, "PR/main에서 테스트하고 이미지 관련 변경 여부를 판별합니다."),
                node("build", "Docker Buildx", "amd64 · arm64", 46, 18, "이미지 관련 변경일 때만 multi-architecture 이미지를 빌드합니다."),
                node("ghcr", "GHCR", "Commit SHA tag", 66, 18, "검증한 이미지를 commit SHA tag로 보관합니다."),
                node("manifest", "GitOps Manifest", "Kustomize overlay", 85, 18, "환경별 overlay에 배포할 불변 image SHA를 선언합니다."),
                node("argo", "Argo CD", "Git state observer", 46, 56, "main의 overlay와 cluster 상태를 비교하고 Sync합니다."),
                node("dev", "DEV", "Auto Sync", 20, 83, "automated, prune, selfHeal 정책으로 변경을 자동 반영합니다."),
                node("stg", "STG", "Manual Sync", 49, 83, "OutOfSync를 확인한 뒤 사용자가 수동 Sync합니다.", "manual"),
                node("prod", "PROD", "Manual Sync · replica 2", 78, 83, "STG에서 검증한 동일 SHA를 수동 Sync합니다.", "manual"),
            ],
            edges: [edge("source-actions", "source", "actions"), edge("actions-build", "actions", "build"), edge("build-ghcr", "build", "ghcr"), edge("ghcr-manifest", "ghcr", "manifest"), edge("actions-manifest", "actions", "manifest", "skip"), edge("manifest-argo", "manifest", "argo"), edge("argo-dev", "argo", "dev"), edge("argo-stg", "argo", "stg", "manual"), edge("argo-prod", "argo", "prod", "manual")],
            scenarios: {
                app: { label: "Application change · DEV 자동 배포", result: ["Image Build/Push 완료", "DEV Auto Sync"], facts: [fact("CI", "Tests + Build"), fact("Image", "Commit SHA"), fact("Deploy", "DEV automatic")], steps: [activate("source", "PR / MERGE"), move("source-actions", "push"), activate("actions", "TESTING"), move("actions-build", "image change"), activate("build", "BUILDING"), move("build-ghcr", "SHA"), activate("ghcr", "PUSHING"), move("ghcr-manifest", "tag"), activate("manifest", "DEV UPDATE"), move("manifest-argo", "desired state"), activate("argo", "SYNCING"), move("argo-dev", "auto"), activate("dev", "ROLLING OUT", "SYNCED") ]},
                docs: { label: "Manifest/문서 변경 · Image build skip", result: ["Python Tests 실행", "Build/Push와 DEV tag update 생략"], facts: [fact("Tests", "Executed"), fact("Image build", "Skipped"), fact("Reason", "No image path change")], steps: [activate("source", "PUSH"), move("source-actions", "change"), activate("actions", "PATH FILTER", "TESTED"), move("actions-manifest", "build skipped", "skip"), activate("manifest", "GIT UPDATED", "RECORDED") ]},
                stg: { label: "검증 SHA를 STG로 수동 승격", result: ["OutOfSync 감지", "수동 Sync 후 Synced / Healthy"], facts: [fact("Image", "Same verified SHA"), fact("Before", "OutOfSync"), fact("Action", "Manual Sync")], steps: [activate("manifest", "STG SHA UPDATE"), move("manifest-argo", "desired state"), activate("argo", "OUT OF SYNC", "OUT OF SYNC", "warning"), move("argo-stg", "manual approval", "manual"), activate("stg", "ROLLING OUT", "SYNCED") ]},
                prod: { label: "동일 SHA를 PROD로 수동 승격", result: ["STG와 같은 SHA", "PROD replica 2 rollout"], facts: [fact("Artifact", "No rebuild"), fact("Approval", "Manual Sync"), fact("Replica", "2")], steps: [activate("manifest", "PROD SHA UPDATE"), move("manifest-argo", "desired state"), activate("argo", "OUT OF SYNC", "OUT OF SYNC", "warning"), move("argo-prod", "manual approval", "manual"), activate("prod", "ROLLING OUT", "SYNCED") ]},
            }, defaultScenario: "app",
        },
        "agent-lab": {
            nodes: [
                node("user", "User Request", "Prepared prompt", 10, 18, "사용자가 일반 질문 또는 Docker 진단 요청을 전송합니다."),
                node("api", "FastAPI", "POST /chat", 27, 18, "설정에 맞는 LLMProvider를 선택해 chat 요청을 전달합니다."),
                node("llm", "Ollama · Qwen3", "Tool decision", 48, 18, "응답하거나, 진단에 필요한 읽기 전용 MCP 도구와 인자를 선택합니다."),
                node("answer", "LLM Response", "Observed facts · action", 81, 18, "도구 결과를 포함한 대화를 바탕으로 한국어 진단 답변을 반환합니다."),
                node("mcpclient", "MCP Client", "Schema · call", 31, 59, "stdio MCP Server에서 schema를 읽고 선택된 도구를 호출합니다."),
                node("mcpserver", "FastMCP Server", "Read-only tools", 52, 59, "호스트·컨테이너 상태, 상세, 로그 조회 도구만 제공합니다."),
                node("metrics", "Host Metrics API", "host.docker.internal", 73, 59, "Docker CLI에 접근 가능한 호스트에서 관측 데이터를 제공합니다."),
                node("docker", "Docker CLI", "stats · inspect · logs", 52, 86, "실행 상태와 로그를 읽으며 컨테이너를 변경하지 않습니다."),
            ],
            edges: [edge("user-api", "user", "api"), edge("api-llm", "api", "llm"), edge("llm-answer", "llm", "answer"), edge("llm-mcpclient", "llm", "mcpclient"), edge("mcpclient-mcpserver", "mcpclient", "mcpserver"), edge("mcpserver-metrics", "mcpserver", "metrics"), edge("metrics-docker", "metrics", "docker"), edge("docker-metrics", "docker", "metrics"), edge("mcpclient-llm", "mcpclient", "llm")],
            scenarios: {
                tool: { label: "종료된 컨테이너 진단 · Tool 필요", result: ["상태와 로그를 도구로 확인", "관측 사실과 권장 조치를 구분"], facts: [fact("Tool", "details + logs"), fact("Access", "Read only"), fact("Cache", "Same call reused")], steps: [activate("user", "ASKING"), move("user-api", "diagnose"), activate("api", "ROUTING"), move("api-llm", "message"), activate("llm", "DECIDING", "TOOL CALL"), move("llm-mcpclient", "tool + args"), activate("mcpclient", "CALLING"), move("mcpclient-mcpserver", "stdio"), activate("mcpserver", "DISPATCHING"), move("mcpserver-metrics", "HTTP"), activate("metrics", "QUERYING"), move("metrics-docker", "inspect/logs"), activate("docker", "READING"), move("docker-metrics", "observations"), move("mcpclient-llm", "tool result"), activate("llm", "REASONING"), move("llm-answer", "diagnosis"), activate("answer", "RESPONDING", "READY") ]},
                chat: { label: "일반 대화 · Tool 호출 없음", result: ["LLM이 직접 응답", "MCP 경로는 실행되지 않음"], facts: [fact("Tool call", "None"), fact("MCP", "Not executed"), fact("Response", "LLM content")], steps: [activate("user", "ASKING"), move("user-api", "message"), activate("api", "ROUTING"), move("api-llm", "message"), activate("llm", "DECIDING", "NO TOOL"), move("llm-answer", "content"), activate("answer", "RESPONDING", "READY") ]},
                error: { label: "MCP Tool 오류 · 오류 정보를 LLM에 전달", result: ["Tool 예외를 구조화", "LLM이 오류 정보를 포함해 응답"], facts: [fact("Tool", "Failed"), fact("Handling", "Exception → tool result"), fact("Container action", "None")], steps: [activate("user", "ASKING"), move("user-api", "diagnose"), move("api-llm", "message"), activate("llm", "TOOL CALL"), move("llm-mcpclient", "tool + args"), activate("mcpclient", "CALLING", "TOOL ERROR", "error"), move("mcpclient-llm", "error object", "error"), activate("llm", "EXPLAINING"), move("llm-answer", "error-aware"), activate("answer", "RESPONDING", "READY") ]},
            }, defaultScenario: "tool",
        },
        "sis-api": {
            nodes: [
                node("client", "Client", "email query", 10, 22, "GET /users?email=... 요청을 보냅니다."),
                node("api", "FastAPI", "GET /users", 29, 22, "요청 validation과 repository 호출, HTTP 오류 변환을 담당합니다."),
                node("validation", "Input Validation", "normalize email", 50, 22, "공백을 제거하고 domain을 소문자로 정규화하며 이메일 형식을 검증합니다."),
                node("repository", "Redis Repository", "Hash + model validation", 71, 22, "Redis Hash를 조회하고 저장 데이터도 UserMetadata 모델로 다시 검증합니다."),
                node("redis", "Redis", "sis:user:email:*", 90, 22, "정규화한 email key에 사용자 metadata Hash를 저장합니다."),
                node("response", "HTTP Response", "200 · 404 · 422 · 500 · 503", 50, 70, "성공 데이터 또는 원인을 구분한 HTTP 응답을 반환합니다."),
            ],
            edges: [edge("client-api", "client", "api"), edge("api-validation", "api", "validation"), edge("validation-repository", "validation", "repository"), edge("repository-redis", "repository", "redis"), edge("redis-repository", "redis", "repository"), edge("api-response", "api", "response"), edge("validation-response", "validation", "response", "error"), edge("repository-response", "repository", "response", "error")],
            scenarios: {
                success: { label: "정상 사용자 조회 · 200", result: ["UserMetadata 반환", "추가 저장 필드는 응답에서 제외"], facts: [fact("Request", "student@example.com"), fact("Redis", "Hash found"), fact("Response", "200")], steps: [activate("client", "REQUESTING"), move("client-api", "email"), activate("api", "RECEIVING"), move("api-validation", "query"), activate("validation", "NORMALIZING"), move("validation-repository", "normalized"), activate("repository", "LOOKUP"), move("repository-redis", "HGETALL"), activate("redis", "READING", "FOUND"), move("redis-repository", "hash"), activate("repository", "VALIDATING", "VALID"), move("api-response", "200"), activate("response", "SERIALIZING", "200 OK") ]},
                invalid: { label: "잘못된 email · 422", result: ["FastAPI validation error", "Redis command 실행 안 함"], facts: [fact("Request", "invalid-email"), fact("Redis calls", "0"), fact("Response", "422")], steps: [activate("client", "REQUESTING"), move("client-api", "invalid"), activate("api", "RECEIVING"), move("api-validation", "query"), activate("validation", "CHECKING", "INVALID", "error"), move("validation-response", "422", "error"), activate("response", "ERROR", "422", "error") ]},
                missing: { label: "사용자 미존재 · 404", result: ["USER_NOT_FOUND", "정상 오류 contract 반환"], facts: [fact("Redis", "Empty hash"), fact("Response", "404"), fact("Code", "USER_NOT_FOUND")], steps: [activate("client", "REQUESTING"), move("client-api", "email"), move("api-validation", "query"), activate("validation", "NORMALIZING"), move("validation-repository", "normalized"), activate("repository", "LOOKUP"), move("repository-redis", "HGETALL"), activate("redis", "READING", "NOT FOUND", "warning"), move("repository-response", "404", "error"), activate("response", "ERROR", "404", "error") ]},
                unavailable: { label: "Redis 연결/Timeout 오류 · 503", result: ["USER_STORE_UNAVAILABLE", "Redis 예외 원문은 응답에 노출하지 않음"], facts: [fact("Store", "Unavailable"), fact("Retry", "Disabled"), fact("Response", "503")], steps: [activate("client", "REQUESTING"), move("client-api", "email"), move("api-validation", "query"), activate("validation", "VALID", "VALID"), move("validation-repository", "normalized"), activate("repository", "LOOKUP"), move("repository-redis", "connect"), activate("redis", "CONNECTING", "UNAVAILABLE", "error"), move("repository-response", "503", "error"), activate("response", "ERROR", "503", "error") ]},
                corrupt: { label: "잘못된 저장 데이터 · 500", result: ["INVALID_USER_DATA", "저장 데이터 검증 실패"], facts: [fact("Redis", "Hash returned"), fact("Model", "Invalid"), fact("Response", "500")], steps: [activate("client", "REQUESTING"), move("client-api", "email"), move("api-validation", "query"), activate("validation", "VALID", "VALID"), move("validation-repository", "normalized"), move("repository-redis", "HGETALL"), activate("redis", "READING", "FOUND"), move("redis-repository", "invalid hash"), activate("repository", "MODEL CHECK", "INVALID", "error"), move("repository-response", "500", "error"), activate("response", "ERROR", "500", "error") ]},
            }, defaultScenario: "success",
        },
    };

    const config = configs[simulator.dataset.projectSimulator];
    if (!config) return;
    const stage = simulator.querySelector("[data-sim-stage]");
    const nodesRoot = simulator.querySelector("[data-sim-nodes]");
    const pathsRoot = simulator.querySelector("[data-sim-paths]");
    const packetsRoot = simulator.querySelector("[data-sim-packets]");
    const svg = simulator.querySelector("[data-sim-svg]");
    const scenarioSelect = simulator.querySelector("[data-sim-scenario]");
    const runButton = simulator.querySelector("[data-sim-run]");
    const pauseButton = simulator.querySelector("[data-sim-pause]");
    const resetButton = simulator.querySelector("[data-sim-reset]");
    const secondaryButton = simulator.querySelector("[data-sim-secondary]");
    const runtime = simulator.querySelector("[data-sim-runtime]");
    const inspector = simulator.querySelector("[data-sim-inspector]");
    const resultTitle = simulator.querySelector("[data-sim-result-title]");
    const resultText = simulator.querySelector("[data-sim-result]");
    const facts = simulator.querySelector("[data-sim-facts]");
    let runId = 0;
    let running = false;
    let paused = false;
    let selectedNode = "";
    const states = {};

    config.nodes.forEach((item) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = `simulator-node ${item.tone ? `is-${item.tone}` : ""}`;
        button.dataset.node = item.id;
        button.style.setProperty("--node-x", `${item.x}%`);
        button.style.setProperty("--node-y", `${item.y}%`);
        button.innerHTML = `<span>${item.subtitle}</span><strong>${item.label}</strong><b>WAITING</b>`;
        nodesRoot.append(button);
    });
    Object.entries(config.scenarios).forEach(([value, scenario]) => scenarioSelect.add(new Option(scenario.label, value)));
    scenarioSelect.value = config.defaultScenario;
    if (config.secondaryScenario) {
        secondaryButton.hidden = false;
        secondaryButton.addEventListener("click", () => {
            scenarioSelect.value = config.secondaryScenario;
            runSimulation();
        });
    }

    function buildFlowLayer() {
        const rect = stage.getBoundingClientRect();
        svg.setAttribute("viewBox", `0 0 ${stage.clientWidth} ${stage.clientHeight}`);
        pathsRoot.innerHTML = "";
        packetsRoot.innerHTML = "";
        config.edges.forEach((item) => {
            const from = stage.querySelector(`[data-node="${item.from}"]`).getBoundingClientRect();
            const to = stage.querySelector(`[data-node="${item.to}"]`).getBoundingClientRect();
            const start = { x: from.left - rect.left + from.width / 2, y: from.top - rect.top + from.height / 2 };
            const end = { x: to.left - rect.left + to.width / 2, y: to.top - rect.top + to.height / 2 };
            const horizontal = Math.abs(end.x - start.x) >= Math.abs(end.y - start.y);
            if (horizontal) {
                start.x += Math.sign(end.x - start.x) * from.width / 2;
                end.x -= Math.sign(end.x - start.x) * to.width / 2;
            } else {
                start.y += Math.sign(end.y - start.y) * from.height / 2;
                end.y -= Math.sign(end.y - start.y) * to.height / 2;
            }
            const curve = horizontal
                ? `C ${start.x + (end.x - start.x) * .45} ${start.y}, ${start.x + (end.x - start.x) * .55} ${end.y}, ${end.x} ${end.y}`
                : `C ${start.x} ${start.y + (end.y - start.y) * .45}, ${end.x} ${start.y + (end.y - start.y) * .55}, ${end.x} ${end.y}`;
            pathsRoot.insertAdjacentHTML("beforeend", `<path id="sim-edge-${item.id}" class="flow-svg-path ${item.tone ? `is-${item.tone}-path` : ""}" d="M ${start.x} ${start.y} ${curve}" marker-end="url(#sim-arrow-${simulator.dataset.projectSimulator})"/>`);
            packetsRoot.insertAdjacentHTML("beforeend", `<g id="sim-packet-${item.id}" class="flow-svg-packet ${item.tone ? `is-${item.tone}-packet` : ""}" hidden><circle r="10"/><text y="1"></text></g>`);
        });
    }

    const wait = async (duration, activeRun) => {
        let remaining = window.FlowMotion.reducedMotion() ? 0 : duration;
        while (remaining > 0) {
            if (activeRun !== runId) throw new Error("cancelled");
            if (paused) { await new Promise((resolve) => window.setTimeout(resolve, 40)); continue; }
            const slice = Math.min(remaining, 40);
            await new Promise((resolve) => window.setTimeout(resolve, slice));
            remaining -= slice;
        }
    };

    function updateInspector(id) {
        const item = config.nodes.find((entry) => entry.id === id);
        if (!item) return;
        inspector.querySelector("span").textContent = states[id]?.status || "COMPONENT";
        inspector.querySelector("strong").textContent = item.label;
        inspector.querySelector("p").textContent = item.role;
    }

    function setNode(id, state, status) {
        const element = stage.querySelector(`[data-node="${id}"]`);
        element.classList.remove("is-active", "is-complete", "is-error", "is-warning");
        if (state) element.classList.add(`is-${state}`);
        element.querySelector("b").textContent = status;
        states[id] = { state, status };
        if (selectedNode === id) updateInspector(id);
    }

    async function runStep(step, activeRun) {
        if (step.type === "node") {
            setNode(step.id, "active", step.active);
            await wait(440, activeRun);
            setNode(step.id, step.tone, step.complete);
            return;
        }
        const path = stage.querySelector(`#sim-edge-${step.id}`);
        const packet = stage.querySelector(`#sim-packet-${step.id}`);
        packet.querySelector("text").textContent = step.label;
        path.classList.add(step.tone === "error" ? "is-error" : "is-active");
        await window.FlowMotion.travel({ path, packet, duration: 520, isPaused: () => paused, isCancelled: () => activeRun !== runId });
        path.classList.remove("is-active");
        path.classList.add(step.tone === "error" ? "is-error" : "is-complete");
    }

    function renderFacts(items = []) {
        facts.innerHTML = "";
        items.forEach((item) => {
            const wrapper = document.createElement("div");
            const term = document.createElement("dt");
            const value = document.createElement("dd");
            term.textContent = item.title;
            value.textContent = item.value;
            wrapper.append(term, value);
            facts.append(wrapper);
        });
    }

    function resetView(clearResult = true) {
        runId += 1;
        running = false;
        paused = false;
        Object.keys(states).forEach((key) => delete states[key]);
        stage.querySelectorAll("[data-node]").forEach((element) => {
            element.classList.remove("is-active", "is-complete", "is-error", "is-warning", "is-selected");
            element.querySelector("b").textContent = "WAITING";
        });
        selectedNode = "";
        inspector.querySelector("span").textContent = "SELECT A COMPONENT";
        inspector.querySelector("strong").textContent = "Node inspector";
        inspector.querySelector("p").textContent = "노드를 선택하면 역할과 현재 상태를 확인할 수 있습니다.";
        window.FlowMotion.reset(stage);
        runtime.textContent = "IDLE";
        runButton.disabled = false;
        pauseButton.disabled = true;
        pauseButton.textContent = "Pause";
        scenarioSelect.disabled = false;
        secondaryButton.disabled = false;
        if (clearResult) {
            resultTitle.textContent = "Ready";
            resultText.textContent = "시나리오를 선택하고 Run을 눌러 흐름을 확인하세요.";
            renderFacts();
        }
    }

    async function runSimulation() {
        if (running) return;
        resetView(false);
        running = true;
        const activeRun = ++runId;
        const scenario = config.scenarios[scenarioSelect.value];
        runtime.textContent = "RUNNING";
        resultTitle.textContent = scenario.label;
        resultText.textContent = "각 단계의 상태와 데이터 이동을 실행하고 있습니다.";
        renderFacts(scenario.facts);
        runButton.disabled = true;
        pauseButton.disabled = false;
        scenarioSelect.disabled = true;
        secondaryButton.disabled = true;
        try {
            for (const step of scenario.steps) await runStep(step, activeRun);
            runtime.textContent = "COMPLETE";
            resultTitle.textContent = scenario.result[0];
            resultText.textContent = scenario.result[1];
        } catch (error) {
            if (error.message !== "cancelled") throw error;
        } finally {
            if (activeRun === runId) {
                running = false;
                runButton.disabled = false;
                pauseButton.disabled = true;
                scenarioSelect.disabled = false;
                secondaryButton.disabled = false;
            }
        }
    }

    runButton.addEventListener("click", runSimulation);
    resetButton.addEventListener("click", () => resetView());
    scenarioSelect.addEventListener("change", () => resetView());
    pauseButton.addEventListener("click", () => {
        paused = !paused;
        pauseButton.textContent = paused ? "Resume" : "Pause";
        runtime.textContent = paused ? "PAUSED" : "RUNNING";
    });
    nodesRoot.addEventListener("click", (event) => {
        const target = event.target.closest("[data-node]");
        if (!target) return;
        stage.querySelectorAll("[data-node]").forEach((item) => item.classList.remove("is-selected"));
        target.classList.add("is-selected");
        selectedNode = target.dataset.node;
        updateInspector(selectedNode);
    });
    let resizeTimer;
    window.addEventListener("resize", () => {
        window.clearTimeout(resizeTimer);
        resizeTimer = window.setTimeout(() => { if (!running) buildFlowLayer(); }, 120);
    });
    buildFlowLayer();
    resetView();
});
