document.addEventListener("DOMContentLoaded", () => {
    const steps = {
        event: {
            title: "Learning Event",
            description: "학습 플랫폼에서 사용자의 활동을 xAPI Statement로 생성합니다.",
            code: `{
  "actor": "student01",
  "verb": "completed",
  "object": "lesson01",
  "timestamp": "2026-08-06T10:30:00Z"
}`
        },
        receiver: {
            title: "LRS Receiver",
            description: "외부 Learning Platform이 전송한 Statement를 LRS Endpoint에서 수신하고 검증 단계로 전달합니다.",
            code: `POST /statements

역할:
• Statement 수신
• xAPI Validation 전달`
        },
        validation: {
            title: "xAPI Validation",
            description: "Statement가 xAPI 규격에 맞는지 필수 필드와 데이터 형식을 확인합니다.",
            code: `Validation Check

✓ actor
✓ verb
✓ object
✓ timestamp

Result: Passed`
        },
        storage: {
            title: "Raw Statement Storage",
            description: "Validation을 통과한 Statement를 변경하지 않은 원본 형태로 저장합니다.",
            code: `Storage Result

status: stored
format: raw statement
validation: passed`
        },
        error: {
            title: "Error Response",
            description: "필수 필드가 누락되거나 형식이 올바르지 않은 Statement에 오류 응답을 반환합니다.",
            code: `HTTP 400 Bad Request

{
  "error": "invalid_statement",
  "field": "timestamp"
}`
        }
    };

    const internalSteps = {
        raw: ["Raw Statement", "검증 후 저장된 원본 이벤트 데이터입니다."],
        beat: ["Celery Beat", "주기적으로 Task를 호출하여 저장된 데이터를 후처리합니다."],
        processing: ["Statement Processing", "Raw 데이터를 서비스에서 활용 가능한 형태로 변환합니다."],
        transform: ["Statement Transform", "actor, verb, object, context, result 등 xAPI 주요 영역으로 구조화합니다."],
        structured: ["Structured Statement", "분석 및 검색을 위한 처리가 완료된 데이터입니다."],
        analytics: ["Analytics / Search / Dashboard", "구조화된 데이터를 분석, 검색, 대시보드에서 활용합니다."]
    };

    const pipeline = document.querySelector("#lrs-pipeline");
    const nodes = [...document.querySelectorAll(".lrs-node")];
    const connectors = [...document.querySelectorAll(".lrs-connector")];
    const generateButton = document.querySelector("#generate-event");
    const failureToggle = document.querySelector("#simulate-failure");
    const detailTitle = document.querySelector("#lrs-detail-title");
    const description = document.querySelector("#lrs-description");
    const code = document.querySelector("#lrs-code code");
    const liveStatus = document.querySelector("#lrs-live-status");

    const delay = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));

    function selectStep(stepId) {
        const step = steps[stepId];
        if (!step) return;

        nodes.forEach((node) => {
            const selected = node.dataset.step === stepId;
            node.classList.toggle("is-selected", selected);
            node.setAttribute("aria-pressed", String(selected));
        });
        detailTitle.textContent = step.title;
        description.textContent = step.description;
        code.textContent = step.code;
    }

    function resetMainFlow() {
        nodes.forEach((node) => {
            node.classList.remove("is-active", "is-complete", "is-error");
            node.querySelector(".lrs-node-status").textContent =
                node.dataset.step === "event" ? "Ready" : "Waiting";
        });
        document.querySelectorAll(".lrs-branch-path").forEach((path) => {
            path.classList.remove("is-active", "is-complete");
        });
        connectors.forEach((connector) => connector.classList.remove("is-moving", "is-complete"));
    }

    async function activateNode(stepId, status = "Processing") {
        const node = pipeline.querySelector(`[data-step="${stepId}"]`);
        selectStep(stepId);
        node.classList.add("is-active");
        node.querySelector(".lrs-node-status").textContent = status;
        liveStatus.textContent = `${steps[stepId].title} 단계 처리 중...`;
        await delay(650);
        node.classList.remove("is-active");
        node.classList.add(stepId === "error" ? "is-error" : "is-complete");
        node.querySelector(".lrs-node-status").textContent = stepId === "error" ? "Rejected" : "Complete";
    }

    async function movePacket(connector) {
        connector.classList.remove("is-moving");
        void connector.offsetWidth;
        connector.classList.add("is-moving");
        await delay(560);
        connector.classList.remove("is-moving");
        connector.classList.add("is-complete");
    }

    async function runMainFlow() {
        generateButton.disabled = true;
        failureToggle.disabled = true;
        resetMainFlow();

        await activateNode("event", "Generated");
        await movePacket(connectors[0]);
        await activateNode("receiver", "Received");
        await movePacket(connectors[1]);
        await activateNode("validation", "Checking");

        const outcome = failureToggle.checked ? "fail" : "pass";
        const target = outcome === "pass" ? "storage" : "error";
        const branch = document.querySelector(`[data-path="${outcome}"]`);
        const branchLine = branch.querySelector(".lrs-branch-line");

        branch.classList.add("is-active");
        await movePacket(branchLine);
        branch.classList.add("is-complete");
        await activateNode(target, outcome === "pass" ? "Storing" : "Rejecting");

        liveStatus.textContent = outcome === "pass"
            ? "Statement가 검증을 통과해 원본 데이터로 저장되었습니다."
            : "Statement 검증에 실패해 오류 응답이 반환되었습니다.";
        generateButton.disabled = false;
        failureToggle.disabled = false;
    }

    nodes.forEach((node) => node.addEventListener("click", () => selectStep(node.dataset.step)));
    generateButton.addEventListener("click", runMainFlow);

    const modal = document.querySelector("#internal-modal");
    const modalCard = modal.querySelector(".lrs-modal-card");
    const openModalButton = document.querySelector("#internal-open");
    const closeModalButton = document.querySelector("#internal-close");
    const replayButton = document.querySelector("#internal-replay");
    const internalNodes = [...document.querySelectorAll(".internal-node")];
    const internalConnectors = [...document.querySelectorAll(".internal-connector")];
    const internalDetail = document.querySelector("#internal-detail");
    let internalRun = 0;

    function showInternalDetail(stepId) {
        const [title, text] = internalSteps[stepId];
        internalDetail.innerHTML = `<strong>${title}</strong><span>${text}</span>`;
    }

    async function runInternalFlow() {
        const runId = ++internalRun;
        replayButton.disabled = true;
        internalNodes.forEach((node) => node.classList.remove("is-active", "is-complete"));
        internalConnectors.forEach((connector) => connector.classList.remove("is-moving", "is-complete"));

        for (let index = 0; index < internalNodes.length; index += 1) {
            if (runId !== internalRun || !modal.classList.contains("is-open")) return;
            const node = internalNodes[index];
            showInternalDetail(node.dataset.internalStep);
            node.classList.add("is-active");
            await delay(520);
            node.classList.remove("is-active");
            node.classList.add("is-complete");
            if (internalConnectors[index]) await movePacket(internalConnectors[index]);
        }
        replayButton.disabled = false;
    }

    function openModal() {
        modal.classList.add("is-open");
        modal.setAttribute("aria-hidden", "false");
        document.body.classList.add("modal-open");
        modalCard.focus();
        runInternalFlow();
    }

    function closeModal() {
        internalRun += 1;
        modal.classList.remove("is-open");
        modal.setAttribute("aria-hidden", "true");
        document.body.classList.remove("modal-open");
        replayButton.disabled = false;
        openModalButton.focus();
    }

    internalNodes.forEach((node) => node.addEventListener("click", () => showInternalDetail(node.dataset.internalStep)));
    openModalButton.addEventListener("click", openModal);
    closeModalButton.addEventListener("click", closeModal);
    replayButton.addEventListener("click", runInternalFlow);
    modal.addEventListener("click", (event) => {
        if (event.target === modal) closeModal();
    });
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && modal.classList.contains("is-open")) closeModal();
    });
});
