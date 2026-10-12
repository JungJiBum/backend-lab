document.addEventListener("DOMContentLoaded", () => {
    const $ = (selector) => document.querySelector(selector);
    const $$ = (selector) => [...document.querySelectorAll(selector)];
    const runButton = $("#lrs-run");
    const pauseButton = $("#lrs-pause");
    const resetButton = $("#lrs-reset");
    const eventCount = $("#event-count");
    const invalidCount = $("#invalid-count");
    const speed = $("#lrs-speed");
    const postProcessing = $("#post-processing");
    const log = $("#lrs-log");
    const stateLabel = $("#lrs-runtime-state");
    const nodeDetail = $("#lrs-node-detail");
    const controls = [eventCount, invalidCount, speed, postProcessing];
    let runId = 0;
    let paused = false;
    let running = false;
    let elapsed = 0;
    const nodeDetails = {
        event: ["Learning Event", "학습 플랫폼에서 사용자의 활동을 xAPI Statement로 생성합니다."],
        receiver: ["LRS Receiver", "외부 Learning Platform이 전송한 Statement를 수신합니다."],
        validation: ["xAPI Validation", "actor, verb, object 등 필수 필드와 데이터 형식을 확인합니다."],
        storage: ["Raw Storage", "검증을 통과한 Statement를 변경하지 않은 원본 형태로 저장합니다."],
        error: ["Error Response", "잘못된 Statement를 저장하지 않고 오류 응답으로 분기합니다."],
        beat: ["Celery Beat", "저장된 원본 데이터에 대한 후속 처리 Task를 호출합니다."],
        processing: ["Statement Processing", "원본 데이터를 서비스에서 활용할 수 있도록 처리합니다."],
        transform: ["Statement Transform", "xAPI 주요 영역을 분석 가능한 구조로 변환합니다."],
        analytics: ["Analytics / Search", "구조화된 데이터를 분석과 검색 단계에서 활용합니다."],
    };
    const canvas = $("#lrs-canvas");
    const flowLayer = $("#lrs-flow-layer");
    const flowPaths = $("#lrs-flow-paths");
    const flowPackets = $("#lrs-flow-packets");
    const edgePairs = {
        "event-receiver": ["event", "receiver"],
        "receiver-validation": ["receiver", "validation"],
        "validation-storage": ["validation", "storage"],
        "validation-error": ["validation", "error"],
        "storage-beat": ["storage", "beat"],
        "beat-processing": ["beat", "processing"],
        "processing-transform": ["processing", "transform"],
        "transform-analytics": ["transform", "analytics"],
    };

    function buildFlowLayer() {
        const canvasRect = canvas.getBoundingClientRect();
        const layerWidth = Math.max(canvas.clientWidth, canvas.scrollWidth);
        const layerHeight = Math.max(canvas.clientHeight, canvas.scrollHeight);
        flowLayer.setAttribute("viewBox", `0 0 ${layerWidth} ${layerHeight}`);
        flowLayer.style.width = `${layerWidth}px`;
        flowLayer.style.height = `${layerHeight}px`;
        flowPaths.innerHTML = "";
        flowPackets.innerHTML = "";
        Object.entries(edgePairs).forEach(([key, [fromName, toName]]) => {
            const from = canvas.querySelector(`[data-node="${fromName}"]`).getBoundingClientRect();
            const to = canvas.querySelector(`[data-node="${toName}"]`).getBoundingClientRect();
            const start = { x: from.left - canvasRect.left + canvas.scrollLeft + from.width / 2, y: from.top - canvasRect.top + canvas.scrollTop + from.height / 2 };
            const end = { x: to.left - canvasRect.left + canvas.scrollLeft + to.width / 2, y: to.top - canvasRect.top + canvas.scrollTop + to.height / 2 };
            const horizontal = Math.abs(end.x - start.x) >= Math.abs(end.y - start.y);
            if (horizontal) {
                start.x += Math.sign(end.x - start.x) * from.width / 2;
                end.x -= Math.sign(end.x - start.x) * to.width / 2;
            } else {
                start.y += Math.sign(end.y - start.y) * from.height / 2;
                end.y -= Math.sign(end.y - start.y) * to.height / 2;
            }
            const bend = horizontal ? `C ${start.x + (end.x - start.x) * .45} ${start.y}, ${start.x + (end.x - start.x) * .55} ${end.y}, ${end.x} ${end.y}` : `C ${start.x} ${start.y + (end.y - start.y) * .45}, ${end.x} ${start.y + (end.y - start.y) * .55}, ${end.x} ${end.y}`;
            flowPaths.insertAdjacentHTML("beforeend", `<path id="flow-${key}" class="flow-svg-path" d="M ${start.x} ${start.y} ${bend}" marker-end="url(#lrs-svg-arrow)"/>`);
            const packetClass = key.endsWith("error") ? "flow-svg-packet is-error-packet" : "flow-svg-packet";
            flowPackets.insertAdjacentHTML("beforeend", `<g id="packet-${key}" class="${packetClass}" hidden><circle r="12"/><text class="lrs-flow-count" y="1"></text></g>`);
        });
    }

    const delay = async (base, activeRun) => {
        let remaining = base * Number(speed.value);
        while (remaining > 0) {
            if (activeRun !== runId) throw new Error("cancelled");
            if (paused) {
                await new Promise((resolve) => window.setTimeout(resolve, 50));
                continue;
            }
            const slice = Math.min(remaining, 50);
            await new Promise((resolve) => window.setTimeout(resolve, slice));
            remaining -= slice;
            elapsed += slice;
        }
    };

    function updateInputs() {
        invalidCount.max = eventCount.value;
        if (Number(invalidCount.value) > Number(eventCount.value)) invalidCount.value = eventCount.value;
        $("#event-count-value").value = eventCount.value;
        $("#invalid-count-value").value = invalidCount.value;
    }

    function timestamp() {
        const seconds = Math.floor(elapsed / 1000).toString().padStart(2, "0");
        const hundredths = Math.floor((elapsed % 1000) / 10).toString().padStart(2, "0");
        return `00:${seconds}.${hundredths}`;
    }

    function addLog(source, message, status = "") {
        if (log.children.length === 1 && log.firstElementChild.querySelector("b")?.textContent === "SYSTEM") log.innerHTML = "";
        const item = document.createElement("li");
        if (status) item.className = `is-${status}`;
        item.innerHTML = `<time>${timestamp()}</time><b>${source}</b><span>${message}</span>`;
        log.append(item);
        log.scrollTop = log.scrollHeight;
    }

    function setNode(name, state, label) {
        const node = $(`[data-node="${name}"]`);
        if (!node) return;
        node.classList.remove("is-active", "is-complete", "is-error");
        if (state) node.classList.add(`is-${state}`);
        const status = node.querySelector("b");
        if (status) status.textContent = label;
    }

    async function activate(name, label, done, activeRun, duration = 430) {
        setNode(name, "active", label);
        await delay(duration, activeRun);
        setNode(name, done === "REJECTED" ? "error" : "complete", done);
    }

    async function move(edgeKey, activeRun, duration = 360, count = "") {
        const edge = $(`#flow-${edgeKey}`);
        const packet = $(`#packet-${edgeKey}`);
        packet.querySelector("text").textContent = count;
        edge.classList.add(edgeKey.endsWith("error") ? "is-error" : "is-active");
        await window.FlowMotion.travel({ path: edge, packet, duration: duration * Number(speed.value), isPaused: () => paused, isCancelled: () => activeRun !== runId });
        edge.classList.remove("is-active");
        edge.classList.add(edgeKey.endsWith("error") ? "is-error" : "is-complete");
    }

    function setMetrics(received = 0, stored = 0, rejected = 0, processed = 0) {
        $("#metric-received").textContent = received;
        $("#metric-stored").textContent = stored;
        $("#metric-rejected").textContent = rejected;
        $("#metric-processed").textContent = processed;
    }

    function resetView(clearLog = true) {
        runId += 1;
        running = false;
        paused = false;
        elapsed = 0;
        $$("[data-node]").forEach((node) => node.classList.remove("is-active", "is-complete", "is-error", "is-selected"));
        nodeDetail.classList.add("is-hidden");
        $$(".lrs-system-node b").forEach((status, index) => { status.textContent = index === 0 ? "READY" : "WAITING"; });
        $$(".lrs-edge,.lrs-branch-edge").forEach((edge) => edge.classList.remove("is-moving"));
        $$(".lrs-branch").forEach((branch) => branch.classList.remove("is-current"));
        window.FlowMotion?.reset(canvas);
        setMetrics();
        $("#result-title").textContent = "Ready";
        $("#result-summary").textContent = "아직 실행된 Simulation이 없습니다.";
        stateLabel.textContent = "IDLE";
        runButton.disabled = false;
        pauseButton.disabled = true;
        pauseButton.textContent = "Pause";
        controls.forEach((control) => { control.disabled = false; });
        if (clearLog) log.innerHTML = '<li><time>00:00.00</time><b>SYSTEM</b><span>실행 조건을 설정하고 Simulation을 시작하세요.</span></li>';
    }

    async function runPostProcessing(count, activeRun) {
        const sequence = [
            ["beat", "storage-beat", "SCHEDULER", `${count}개의 저장된 Statement에 대한 후속 Task를 호출합니다.`],
            ["processing", "beat-processing", "PROCESSING", `${count}개의 원본 데이터를 처리합니다.`],
            ["transform", "processing-transform", "TRANSFORM", "actor, verb, object 등 주요 영역을 구조화합니다."],
            ["analytics", "transform-analytics", "DESTINATION", `${count}개의 구조화된 데이터를 활용 단계로 전달합니다.`],
        ];
        for (const [name, edge, source, message] of sequence) {
            await move(edge, activeRun, 360, count);
            await activate(name, "PROCESSING", "COMPLETE", activeRun, 330);
            addLog(source, message, "success");
        }
    }

    async function runSimulation() {
        if (running) return;
        running = true;
        const activeRun = ++runId;
        elapsed = 0;
        const total = Number(eventCount.value);
        const rejected = Number(invalidCount.value);
        const stored = total - rejected;
        resetView(false);
        running = true;
        runId = activeRun;
        log.innerHTML = "";
        runButton.disabled = true;
        pauseButton.disabled = false;
        controls.forEach((control) => { control.disabled = true; });
        stateLabel.textContent = "RUNNING";
        $("#result-title").textContent = "Running";

        try {
            addLog("INPUT", `${total}개의 Demo Event를 생성했습니다. invalid=${rejected}`);
            await activate("event", "GENERATING", "COMPLETE", activeRun);
            await move("event-receiver", activeRun, 360, total);
            await activate("receiver", "RECEIVING", "COMPLETE", activeRun);
            setMetrics(total, 0, 0, 0);
            addLog("RECEIVER", `${total}개의 Statement를 수신했습니다.`);
            await move("receiver-validation", activeRun, 360, total);
            await activate("validation", "VALIDATING", "COMPLETE", activeRun, 520);
            addLog("VALIDATION", `${stored}개 통과 · ${rejected}개 실패`, rejected ? "error" : "success");

            if (stored > 0) {
                $('[data-branch="pass"]').classList.add("is-current");
                await move("validation-storage", activeRun, 420, stored);
                await activate("storage", "STORING", "COMPLETE", activeRun);
                setMetrics(total, stored, rejected, 0);
                addLog("STORAGE", `${stored}개의 검증된 원본 Statement를 저장했습니다.`, "success");
            }
            if (rejected > 0) {
                $('[data-branch="fail"]').classList.add("is-current");
                await move("validation-error", activeRun, 420, rejected);
                await activate("error", "REJECTING", "REJECTED", activeRun);
                addLog("HTTP 400", `${rejected}개의 잘못된 Statement에 오류를 반환했습니다.`, "error");
            }
            if (postProcessing.checked && stored > 0) await runPostProcessing(stored, activeRun);
            setMetrics(total, stored, rejected, postProcessing.checked ? stored : 0);
            stateLabel.textContent = "COMPLETE";
            $("#result-title").textContent = rejected ? "Completed with rejects" : "Completed";
            $("#result-summary").textContent = `${total}개 수신 · ${stored}개 저장 · ${rejected}개 거부${postProcessing.checked ? ` · ${stored}개 후속 처리` : " · 후속 처리 생략"}`;
            addLog("SYSTEM", "Simulation이 완료되었습니다. 표시된 시간과 건수는 Demo 값입니다.", "success");
        } catch (error) {
            if (error.message !== "cancelled") throw error;
        } finally {
            if (activeRun === runId) {
                running = false;
                runButton.disabled = false;
                pauseButton.disabled = true;
                controls.forEach((control) => { control.disabled = false; });
            }
        }
    }

    eventCount.addEventListener("input", updateInputs);
    invalidCount.addEventListener("input", updateInputs);
    runButton.addEventListener("click", runSimulation);
    resetButton.addEventListener("click", () => resetView());
    pauseButton.addEventListener("click", () => {
        paused = !paused;
        pauseButton.textContent = paused ? "Resume" : "Pause";
        stateLabel.textContent = paused ? "PAUSED" : "RUNNING";
        addLog("SYSTEM", paused ? "Simulation을 일시정지했습니다." : "Simulation을 재개했습니다.");
    });
    $$("[data-node]").forEach((node) => node.addEventListener("click", () => {
        const detail = nodeDetails[node.dataset.node];
        if (!detail) return;
        $$("[data-node]").forEach((item) => item.classList.remove("is-selected"));
        node.classList.add("is-selected");
        $("#lrs-node-detail strong").textContent = detail[0];
        $("#lrs-node-detail p").textContent = detail[1];
        nodeDetail.classList.remove("is-hidden");
    }));
    nodeDetail.querySelector("button").addEventListener("click", () => {
        nodeDetail.classList.add("is-hidden");
        $$("[data-node]").forEach((node) => node.classList.remove("is-selected"));
    });
    updateInputs();
    buildFlowLayer();
    let resizeTimer;
    window.addEventListener("resize", () => {
        window.clearTimeout(resizeTimer);
        resizeTimer = window.setTimeout(() => {
            if (!running) buildFlowLayer();
        }, 120);
    });
    resetView();
});
