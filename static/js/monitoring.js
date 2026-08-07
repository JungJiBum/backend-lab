document.addEventListener("DOMContentLoaded", () => {
    const details = {
        server: {
            title: "Node Exporter",
            summary: "서버 내부 Metric을 수집하여 Prometheus가 Scrape 가능한 형태로 제공합니다.",
            role: "각 Linux 서버의 시스템 상태를 표준 Metric으로 노출합니다.",
            data: "CPU · Memory · Disk · Network",
            communication: "Server → node-exporter → /metrics → Prometheus Scrape",
            config: "listen: :9100\nendpoint: /metrics\nscrape: HTTP",
            flow: ["Server", "Node Exporter", "/metrics", "Prometheus"]
        },
        prometheus: {
            title: "Prometheus",
            summary: "여러 Target의 Metric endpoint를 주기적으로 Scrape하고 시계열 데이터로 저장합니다.",
            role: "Target discovery, Metric scraping, TSDB 저장과 Target Health를 담당합니다.",
            data: "node_cpu_seconds_total · node_memory_available_bytes · node_filesystem_avail_bytes",
            communication: "Prometheus → Target /metrics → TSDB → PromQL",
            config: "scrape_interval: 15s\ntargets: [lrs01:9100, lrs02:9100, lrs03:9100]",
            flow: ["Target /metrics", "Scrape", "Prometheus TSDB", "PromQL"]
        },
        grafana: {
            title: "Grafana",
            summary: "Prometheus의 시계열 데이터를 조회해 서버 상태와 장애 징후를 Dashboard로 시각화합니다.",
            role: "운영자가 여러 서버의 상태와 추이를 한 화면에서 비교하고 탐색할 수 있게 합니다.",
            data: "CPU Usage · Memory Usage · Disk Usage · Target Health",
            communication: "Grafana → PromQL Query → Prometheus → Dashboard Panel",
            config: "datasource: Prometheus\nrefresh: 30s\ntime range: last 6h",
            flow: ["Grafana", "PromQL", "Prometheus", "Dashboard"]
        }
    };

    const $ = (selector) => document.querySelector(selector);
    const startButton = $("#start-monitoring");
    const failureToggle = $("#monitoring-failure");
    const serverCards = [...document.querySelectorAll(".monitoring-server-card")];
    const paths = [...document.querySelectorAll(".monitoring-metric-path")];
    const prometheusCard = $("#prometheus-card");
    const grafanaCard = $("#grafana-card");
    const resolutionPanel = $("#monitoring-resolution");
    const modal = $("#monitoring-modal");
    const modalCard = modal.querySelector(".monitoring-modal-card");
    let lastFocused = null;
    let isRunning = false;
    let isResolved = false;
    const delay = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));

    function setStatus(title, message, state = "") {
        $("#monitoring-status-title").textContent = title;
        $("#monitoring-live-status").textContent = message;
        $("#monitoring-status-dot").className = state;
    }

    function setService(card, state, label) {
        card.classList.remove("is-active", "is-healthy", "is-error");
        if (state) card.classList.add(state);
        card.querySelector(".monitoring-service-state").textContent = label;
    }

    function resetArchitecture() {
        serverCards.forEach((card) => card.classList.remove("is-active", "is-sending", "is-error"));
        paths.forEach((path) => path.classList.remove("is-moving", "is-complete", "is-error"));
        setService(prometheusCard, "", "STANDBY");
        setService(grafanaCard, "", "STANDBY");
        $("#prometheus-result").textContent = "Targets ready";
        $("#grafana-result").textContent = "Dashboard waiting";
    }

    function updateFailureView() {
        const failed = failureToggle.checked && !isResolved;
        $("[data-server=\"lrs02\"] .monitoring-identity").textContent = failed ? "instance=lrs01" : "instance=lrs02";
        resolutionPanel.hidden = !failureToggle.checked && !isResolved;
        $("#monitoring-architecture").classList.toggle("has-failure", failed);
        if (failed) {
            $("#resolution-state").textContent = "COLLISION DETECTED";
            $("#resolution-state").className = "monitoring-resolution-state is-error";
            $("#monitoring-error-text").textContent = "duplicate time series · out of order samples";
            $("#apply-monitoring-resolution").disabled = false;
            $("#apply-monitoring-resolution").textContent = "Apply Identity Resolution →";
            setStatus("Failure mode ready", "LRS02 alias를 LRS01과 동일하게 설정했습니다. Monitoring을 실행해 충돌을 확인하세요.");
        } else if (isResolved) {
            $("#resolution-state").textContent = "RESOLVED · TARGETS HEALTHY";
            $("#resolution-state").className = "monitoring-resolution-state is-resolved";
            $("#monitoring-error-text").textContent = "identity separated · scraping recovered";
            $("#apply-monitoring-resolution").disabled = true;
            $("#apply-monitoring-resolution").textContent = "Resolution Applied ✓";
        } else {
            setStatus("Ready", "Normal 모드에서 Metric 수집 구조를 실행하거나 Failure를 재현해 보세요.");
        }
    }

    async function animatePaths(failed) {
        paths.forEach((path) => {
            path.classList.remove("is-moving");
            void path.offsetWidth;
            path.classList.add("is-moving");
        });
        await delay(900);
        paths.forEach((path) => {
            path.classList.remove("is-moving");
            path.classList.add("is-complete");
        });
        if (failed) {
            const collisionPath = $("[data-path=\"lrs02\"]");
            collisionPath.classList.remove("is-complete");
            collisionPath.classList.add("is-error");
        }
    }

    async function startMonitoring() {
        if (isRunning) return;
        isRunning = true;
        isResolved = false;
        startButton.disabled = true;
        failureToggle.disabled = true;
        resetArchitecture();
        const failed = failureToggle.checked;
        updateFailureView();

        setStatus("Exporter active", "각 서버의 Node Exporter가 CPU, Memory, Disk, Network Metric을 생성합니다.", "is-running");
        serverCards.forEach((card) => card.classList.add("is-active"));
        await delay(700);
        setStatus("Metrics generated", "세 서버의 /metrics endpoint에서 시계열 데이터가 준비되었습니다.", "is-running");
        serverCards.forEach((card) => card.classList.add("is-sending"));
        await animatePaths(failed);

        setService(prometheusCard, "is-active", "SCRAPING");
        setStatus("Prometheus scraping", "Prometheus가 세 Target의 Metric endpoint를 Scrape하고 Identity를 확인합니다.", "is-running");
        await delay(850);
        if (failed) {
            setService(prometheusCard, "is-error", "ERROR");
            $("#prometheus-result").textContent = "duplicate time series";
            $("#grafana-result").textContent = "Query data inconsistent";
            $("[data-server=\"lrs02\"]").classList.add("is-error");
            setStatus("Metric Identity Collision", "LRS01과 LRS02가 instance=lrs01로 수집되어 out of order samples 오류가 발생했습니다.", "is-error");
        } else {
            setService(prometheusCard, "is-healthy", "HEALTHY");
            $("#prometheus-result").textContent = "3 / 3 Targets Healthy";
            await delay(450);
            setService(grafanaCard, "is-active", "QUERYING");
            setStatus("Dashboard updating", "Grafana가 PromQL로 저장된 Metric을 조회해 Dashboard를 갱신합니다.", "is-running");
            await delay(750);
            setService(grafanaCard, "is-healthy", "UPDATED");
            $("#grafana-result").textContent = "Dashboard synchronized";
            serverCards.forEach((card) => card.classList.remove("is-active", "is-sending"));
            setStatus("Monitoring active", "모든 Target이 Healthy 상태이며 최신 Metric이 Dashboard에 반영되었습니다.", "is-healthy");
        }
        startButton.disabled = false;
        failureToggle.disabled = false;
        isRunning = false;
    }

    async function resolveCollision() {
        if (isRunning) return;
        isRunning = true;
        $("#apply-monitoring-resolution").disabled = true;
        $("[data-server=\"lrs02\"] .monitoring-identity").textContent = "instance=lrs02";
        setStatus("Applying external_labels", "LRS02에 고유 instance를 적용하고 Prometheus 설정을 다시 로드합니다.", "is-running");
        await delay(700);
        $("[data-path=\"lrs02\"]").classList.remove("is-error");
        $("[data-path=\"lrs02\"]").classList.add("is-complete");
        $("[data-server=\"lrs02\"]").classList.remove("is-error");
        setService(prometheusCard, "is-healthy", "HEALTHY");
        $("#prometheus-result").textContent = "3 / 3 Targets Healthy";
        setService(grafanaCard, "is-healthy", "UPDATED");
        $("#grafana-result").textContent = "Dashboard synchronized";
        setStatus("Identity collision resolved", "서버별 Metric Identity가 분리되어 정상 수집과 Dashboard 조회가 복구되었습니다.", "is-healthy");
        isResolved = true;
        updateFailureView();
        isRunning = false;
    }

    function openModal(key, source) {
        const isServer = key.startsWith("lrs");
        const detail = details[isServer ? "server" : key];
        if (!detail) return;
        lastFocused = source;
        $("#monitoring-modal-title").textContent = isServer ? `${key.toUpperCase()} · ${detail.title}` : detail.title;
        $("#monitoring-modal-summary").textContent = detail.summary;
        $("#monitoring-detail-role").textContent = detail.role;
        $("#monitoring-detail-data").textContent = detail.data;
        $("#monitoring-detail-communication").textContent = detail.communication;
        $("#monitoring-detail-config").textContent = isServer ? `${detail.config}\ninstance: ${key}` : detail.config;
        $("#monitoring-detail-flow").innerHTML = detail.flow.map((item, index) => `<span class="monitoring-detail-node">${item}</span>${index < detail.flow.length - 1 ? '<span class="monitoring-detail-arrow" aria-hidden="true">→</span>' : ""}`).join("");
        modal.classList.add("is-open");
        modal.setAttribute("aria-hidden", "false");
        document.body.classList.add("modal-open");
        modalCard.focus();
    }

    function closeModal() {
        modal.classList.remove("is-open");
        modal.setAttribute("aria-hidden", "true");
        document.body.classList.remove("modal-open");
        if (lastFocused) lastFocused.focus();
    }

    document.querySelectorAll("[data-component]").forEach((element) => element.addEventListener("click", () => openModal(element.dataset.component, element)));
    failureToggle.addEventListener("change", () => { isResolved = false; resetArchitecture(); updateFailureView(); });
    startButton.addEventListener("click", startMonitoring);
    $("#apply-monitoring-resolution").addEventListener("click", resolveCollision);
    $("#monitoring-modal-close").addEventListener("click", closeModal);
    modal.addEventListener("click", (event) => { if (event.target === modal) closeModal(); });
    document.addEventListener("keydown", (event) => { if (event.key === "Escape" && modal.classList.contains("is-open")) closeModal(); });
    updateFailureView();
});
