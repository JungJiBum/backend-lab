document.addEventListener("DOMContentLoaded", () => {
    const button = document.querySelector("#start-comparison");
    const delay = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));

    function setNode(id, state, status) {
        const node = document.querySelector(`#${id}`);
        node.classList.remove("is-active", "is-complete");
        if (state) node.classList.add(state);
        if (status) node.querySelector("small").textContent = status;
    }

    async function move(pathId, duration = 520) {
        const path = document.querySelector(`#${pathId}`);
        path.classList.remove("is-moving", "is-complete");
        void path.offsetWidth;
        path.classList.add("is-moving");
        await delay(duration);
        path.classList.remove("is-moving");
        path.classList.add("is-complete");
    }

    function setMessage(id, title, text) {
        const message = document.querySelector(`#${id}`);
        message.querySelector("strong").textContent = title;
        message.querySelector("small").textContent = text;
    }

    function reset() {
        document.querySelectorAll(".system-node").forEach((node) => node.classList.remove("is-active", "is-complete"));
        document.querySelectorAll(".flow-path").forEach((path) => path.classList.remove("is-moving", "is-complete"));
        document.querySelectorAll(".node-progress span").forEach((bar) => bar.classList.remove("is-running"));
        document.querySelector("#sync-client-status").textContent = "Ready";
        document.querySelector("#sync-api-status").textContent = "Waiting";
        document.querySelector("#async-client-status").textContent = "Ready";
        document.querySelector("#async-api-status").textContent = "Waiting";
        document.querySelector("#rabbit-status").textContent = "Message Broker";
        document.querySelector("#worker-status").textContent = "Task Processing";
        document.querySelector("#redis-status").textContent = "Result Backend";
        ["sync-time", "async-time", "worker-time"].forEach((id) => { document.querySelector(`#${id}`).textContent = "—"; });
        document.querySelector("#sync-lane-state").textContent = "RUNNING";
        document.querySelector("#async-lane-state").textContent = "RUNNING";
        document.querySelector("#task-id").textContent = "TASK STATUS";
        setMessage("sync-message", "Request started", "Client의 HTTP 연결이 유지됩니다.");
        setMessage("async-message", "Request started", "FastAPI에 비동기 Task를 요청합니다.");
    }

    async function processNode(nodeId, progressId, statusId) {
        setNode(nodeId, "is-active", "Processing ~5s");
        const progress = document.querySelector(`#${progressId}`);
        void progress.offsetWidth;
        progress.classList.add("is-running");
        await delay(5000);
        setNode(nodeId, "is-complete", "Processing complete");
        document.querySelector(`#${statusId}`).textContent = "Processing complete";
    }

    async function runSync() {
        setNode("sync-client", "is-active", "Sending request");
        await move("sync-request-path");
        setNode("sync-client", "", "Waiting for response");
        setMessage("sync-message", "HTTP connection waiting", "FastAPI 작업이 완료될 때까지 응답을 받을 수 없습니다.");
        await processNode("sync-api", "sync-progress", "sync-api-status");
        document.querySelector("#worker-time").textContent = "~5.00s";
        await move("sync-response-path");
        setNode("sync-client", "is-complete", "HTTP 200 received");
        document.querySelector("#sync-time").textContent = "5.01s";
        document.querySelector("#sync-lane-state").textContent = "HTTP 200";
        setMessage("sync-message", "HTTP 200 Response · 5.01s", "작업이 끝난 뒤 같은 HTTP 요청으로 결과가 반환되었습니다.");
    }

    async function runAsync() {
        setNode("async-client", "is-active", "Sending request");
        await move("path-client-api", 300);
        setNode("async-api", "is-active", "Publishing task");
        await move("path-api-mq", 300);
        setNode("rabbitmq", "is-active", "Task queued");
        document.querySelector("#rabbit-status").textContent = "Queued · task 8f31c2";

        await move("path-http-202", 160);
        setNode("async-api", "is-complete", "Task dispatched");
        setNode("async-client", "is-complete", "HTTP 202 received");
        document.querySelector("#async-time").textContent = "0.06s";
        document.querySelector("#async-lane-state").textContent = "HTTP 202";
        document.querySelector("#task-id").textContent = "TASK 8f31c2";
        setMessage("async-message", "PENDING", "HTTP 202 + task_id는 Worker 완료 전에 Client로 반환되었습니다.");

        await move("path-status", 420);
        document.querySelector("#redis-status").textContent = "PENDING";
        await delay(300);
        await move("path-mq-worker", 420);
        setNode("rabbitmq", "is-complete", "Task consumed");
        await processNode("worker", "worker-progress", "worker-status");
        await move("path-worker-redis", 420);
        setNode("redis", "is-active", "Saving result");
        await delay(350);
        setNode("redis", "is-complete", "SUCCESS · Result stored");

        document.querySelector("#path-status").classList.remove("is-complete");
        await move("path-status", 420);
        document.querySelector("#redis-status").textContent = "SUCCESS · Result stored";
        document.querySelector("#async-lane-state").textContent = "SUCCESS";
        setMessage("async-message", "SUCCESS", "result: { processed: true } · task_id로 완료 결과를 조회했습니다.");
    }

    async function runComparison() {
        button.disabled = true;
        reset();
        await Promise.all([runSync(), runAsync()]);
        button.disabled = false;
    }

    button.addEventListener("click", runComparison);
});
