document.addEventListener("DOMContentLoaded", () => {
    const cases = {
        provisioning: {
            title: "Ansible Server Automation",
            completeMessage: "대상 서버 구성이 적용되고 검증되었습니다.",
            steps: [
                { id: "inventory", title: "Inventory", summary: "관리 대상 서버 정보 정의", description: "관리 대상 서버 정보를 정의하는 파일입니다.", code: `[web]\nweb01\nweb02\n\n[database]\ndb01` },
                { id: "playbook", title: "Playbook", summary: "원하는 서버 상태 정의", description: "서버에 적용할 구성과 작업 순서를 YAML 형식으로 정의합니다.", code: `- name: Configure server\n  tasks:\n    - install package\n    - copy config\n    - restart service` },
                { id: "task", title: "Task Execution", summary: "구성 작업 순차 실행", description: "정의된 Package 설치, 설정 반영, Service 작업을 순서대로 실행합니다.", code: `TASK [Install Package]   changed\nTASK [Copy Config]       changed\nTASK [Restart Service]   changed` },
                { id: "target", title: "Target Server", summary: "Linux 서버 상태 변경", description: "자동화 작업이 Target Server에 전달되어 실제 시스템 상태를 변경합니다.", code: `Target: customer-server-01\n\nPackage   Installed\nConfig    Applied\nService   Running` },
                { id: "validation", title: "Validation", summary: "적용 결과 및 상태 검증", description: "설정과 서비스 상태가 정의한 목표 상태와 일치하는지 확인합니다.", code: `✓ Package installed\n✓ Configuration applied\n✓ Service is healthy` }
            ]
        },
        docker: {
            title: "Docker Environment Setup",
            completeMessage: "Container 기반 서비스 환경이 실행 상태가 되었습니다.",
            steps: [
                { id: "image", title: "Image", summary: "실행 환경 이미지 준비", description: "애플리케이션과 실행에 필요한 의존성을 Container Image로 준비합니다.", code: `Image\n\napp:latest\nbase: python-slim\nstatus: ready` },
                { id: "compose", title: "Compose", summary: "서비스 구성 정의", description: "여러 Container의 실행 조건, Network, Volume과 환경 변수를 정의합니다.", code: `services:\n  app:\n    image: app:latest\n  proxy:\n    image: nginx:stable` },
                { id: "container", title: "Container", summary: "격리된 실행 환경 생성", description: "정의된 Image와 설정을 기반으로 Container 실행 환경을 생성합니다.", code: `Creating app ... done\nCreating proxy ... done\nNetwork attached` },
                { id: "service", title: "Service Running", summary: "서비스 실행 상태 확인", description: "Container가 정상적으로 기동되고 서비스 요청을 처리할 수 있는지 확인합니다.", code: `app     Up (healthy)\nproxy   Up\n\nGET /health  200 OK` }
            ]
        },
        "closed-network": {
            title: "Closed Network Installation",
            completeMessage: "외부 네트워크 없이 설치와 서비스 준비가 완료되었습니다.",
            steps: [
                { id: "offline-package", title: "Offline Package", summary: "설치 파일 사전 준비", description: "외부 접근 없이 설치할 수 있도록 Package와 필요한 파일을 Bundle로 준비합니다.", code: `offline-bundle/\n├── packages/\n├── configs/\n└── install.sh` },
                { id: "install-script", title: "Install Script", summary: "반복 설치 작업 실행", description: "고객사 폐쇄망 환경에서 동일한 설치 절차를 재현할 수 있도록 Script를 실행합니다.", code: `$ ./install.sh\n\n[1/3] Copy packages\n[2/3] Apply config\n[3/3] Register service` },
                { id: "dependency", title: "Dependency Check", summary: "필수 의존성 검증", description: "필요한 Package, 파일 권한과 설정 값이 올바르게 준비되었는지 확인합니다.", code: `✓ Required packages\n✓ File permissions\n✓ Environment config` },
                { id: "service-ready", title: "Service Ready", summary: "폐쇄망 서비스 준비 완료", description: "설치된 서비스가 폐쇄망 환경에서 정상적으로 실행되고 응답하는지 확인합니다.", code: `Service: active\nHealth: passed\nExternal network: not required` }
            ]
        },
        operations: {
            title: "Operation Automation",
            completeMessage: "운영 데이터 수집과 보고서 생성이 완료되었습니다.",
            steps: [
                { id: "scheduler", title: "Scheduler", summary: "반복 운영 작업 예약", description: "상태 점검과 데이터 수집 작업을 지정된 주기에 맞춰 자동으로 실행합니다.", code: `Schedule\n\njob: daily-operation-check\ncron: 0 9 * * *\nstatus: enabled` },
                { id: "collection", title: "Data Collection", summary: "운영 상태 데이터 수집", description: "서비스 상태, 처리 결과와 운영 지표를 대상 시스템에서 수집합니다.", code: `Collecting\n\n✓ Service status\n✓ Job result\n✓ Resource usage` },
                { id: "report", title: "Report", summary: "수집 결과 보고서 생성", description: "수집된 운영 데이터를 정리하여 확인 가능한 결과 보고서를 생성합니다.", code: `Daily Operation Report\n\nSystems checked: 8\nHealthy: 8\nIssues: 0` }
            ]
        }
    };

    const pipeline = document.querySelector("#infra-pipeline");
    const tabs = [...document.querySelectorAll(".infra-case-tab")];
    const flowTitle = document.querySelector("#infra-flow-title");
    const startButton = document.querySelector("#start-automation");
    const title = document.querySelector("#infra-detail-title");
    const description = document.querySelector("#infra-description");
    const code = document.querySelector("#infra-code code");
    const progressBar = document.querySelector("#infra-progress-bar");
    const progressLabel = document.querySelector("#infra-progress-label");
    const liveStatus = document.querySelector("#infra-live-status");
    const delay = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));
    let activeCaseKey = "provisioning";
    let isRunning = false;

    function currentCase() {
        return cases[activeCaseKey];
    }

    function setProgress(value) {
        progressBar.style.width = `${value}%`;
        progressLabel.textContent = `${value}%`;
    }

    function selectStep(stepId) {
        const step = currentCase().steps.find((item) => item.id === stepId);
        if (!step) return;
        pipeline.querySelectorAll(".infra-node").forEach((node) => {
            const selected = node.dataset.step === stepId;
            node.classList.toggle("is-selected", selected);
            node.setAttribute("aria-pressed", String(selected));
        });
        title.textContent = step.title;
        description.textContent = step.description;
        code.textContent = step.code;
    }

    function renderCase(caseKey) {
        activeCaseKey = caseKey;
        const selectedCase = currentCase();
        flowTitle.textContent = selectedCase.title;
        pipeline.innerHTML = selectedCase.steps.map((step, index) => `
            <button class="infra-node${index === 0 ? " is-selected" : ""}" type="button"
                data-step="${step.id}" aria-pressed="${index === 0}">
                <span class="infra-node-number">${String(index + 1).padStart(2, "0")}</span>
                <span class="infra-node-copy"><strong>${step.title}</strong><small>${step.summary}</small></span>
                <span class="infra-node-status">${index === 0 ? "Ready" : "Waiting"}</span>
            </button>
            ${index < selectedCase.steps.length - 1 ? '<div class="infra-connector" aria-hidden="true"><span class="infra-packet"></span></div>' : ""}
        `).join("");

        pipeline.querySelectorAll(".infra-node").forEach((node) => {
            node.addEventListener("click", () => selectStep(node.dataset.step));
        });
        tabs.forEach((tab) => {
            const selected = tab.dataset.case === caseKey;
            tab.classList.toggle("is-active", selected);
            if (selected) tab.setAttribute("aria-current", "page");
            else tab.removeAttribute("aria-current");
        });
        selectStep(selectedCase.steps[0].id);
        setProgress(0);
        liveStatus.textContent = "단계를 선택하거나 자동화를 실행해 보세요.";
    }

    async function movePacket(connector) {
        connector.classList.remove("is-moving");
        void connector.offsetWidth;
        connector.classList.add("is-moving");
        await delay(560);
        connector.classList.remove("is-moving");
        connector.classList.add("is-complete");
    }

    async function startAutomation() {
        if (isRunning) return;
        isRunning = true;
        startButton.disabled = true;
        tabs.forEach((tab) => { tab.disabled = true; });

        const selectedCase = currentCase();
        const nodes = [...pipeline.querySelectorAll(".infra-node")];
        const connectors = [...pipeline.querySelectorAll(".infra-connector")];
        nodes.forEach((node, index) => {
            node.classList.remove("is-active", "is-complete");
            node.querySelector(".infra-node-status").textContent = index === 0 ? "Ready" : "Waiting";
        });
        connectors.forEach((connector) => connector.classList.remove("is-moving", "is-complete"));
        setProgress(0);

        for (let index = 0; index < nodes.length; index += 1) {
            const node = nodes[index];
            const step = selectedCase.steps[index];
            selectStep(step.id);
            node.classList.add("is-active");
            node.querySelector(".infra-node-status").textContent = "Running";
            liveStatus.textContent = `${step.title} 작업 실행 중...`;
            await delay(650);
            node.classList.remove("is-active");
            node.classList.add("is-complete");
            node.querySelector(".infra-node-status").textContent = "Complete";
            setProgress(Math.round(((index + 1) / nodes.length) * 100));
            if (connectors[index]) await movePacket(connectors[index]);
        }

        liveStatus.textContent = selectedCase.completeMessage;
        tabs.forEach((tab) => { tab.disabled = false; });
        startButton.disabled = false;
        isRunning = false;
    }

    tabs.forEach((tab) => tab.addEventListener("click", () => {
        if (!isRunning) renderCase(tab.dataset.case);
    }));
    startButton.addEventListener("click", startAutomation);
    renderCase(activeCaseKey);
});
