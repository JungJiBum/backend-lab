document.addEventListener("DOMContentLoaded", () => {
    const cases = {
        provisioning: {
            title: "다중 서버 표준 구성 자동화",
            technology: "Ansible · Linux",
            completeMessage: "3대 서버의 표준 구성을 적용하고 변경 결과를 검증했습니다.",
            steps: [
                { id: "inventory", title: "Inventory Load", summary: "대상 서버 그룹 로드", context: "서버별 설정 차이를 줄이고 동일한 환경을 반복 적용하기 위해 대상 서버 정보를 자동화 코드와 분리합니다.", execution: "Inventory에서 역할별 서버 그룹과 접속 정보를 불러와 이번 작업의 적용 대상을 확정합니다.", result: "웹 서버 3대가 작업 대상으로 로드되고 실행 범위가 명확해집니다.", status: "3 targets loaded", code: `[web]\nserver01\nserver02\nserver03\n\nloaded: 3 targets` },
                { id: "connectivity", title: "Connectivity Check", summary: "접속 가능 여부 사전 확인", context: "구성 작업 전에 접속 장애를 분리해 확인해야 일부 서버에만 변경이 적용되는 상황을 예방할 수 있습니다.", execution: "관리 노드에서 대상 서버의 SSH 연결과 자동화 계정 권한을 점검합니다.", result: "모든 대상의 연결 가능 여부가 확인되어 안전하게 다음 단계로 진행합니다.", status: "3 hosts reachable", code: `server01  reachable\nserver02  reachable\nserver03  reachable` },
                { id: "state", title: "Current State Check", summary: "현재 구성과 목표 상태 비교", context: "이미 올바른 서버에는 불필요한 변경을 하지 않고, 실제 차이가 있는 대상만 식별해야 합니다.", execution: "패키지 버전, 설정 파일, 서비스 상태를 수집해 Playbook에 정의된 목표 상태와 비교합니다.", result: "변경 필요 대상과 유지 가능한 대상을 구분합니다.", status: "drift detected", code: `server01  config drift\nserver02  desired state\nserver03  service stopped` },
                { id: "apply", title: "Configuration Apply", summary: "필요한 변경만 적용", context: "수동 작업의 순서 누락과 서버별 편차 없이 표준 구성을 일관되게 반영해야 합니다.", execution: "Inventory 그룹을 기준으로 패키지, 설정, 서비스 작업을 멱등하게 실행합니다.", result: "대상별 changed, skipped, failed 결과가 기록되어 변경 이력을 추적할 수 있습니다.", status: "changes applied", code: `server01  changed\nserver02  skipped\nserver03  changed (recovered)` },
                { id: "validation", title: "Service Validation", summary: "서비스 상태 최종 검증", context: "자동화 명령의 성공만으로는 실제 서비스가 정상이라고 판단할 수 없습니다.", execution: "프로세스, 포트, 상태 엔드포인트를 확인해 적용 후 서비스 가용성을 검증합니다.", result: "3대 서버가 모두 표준 구성과 정상 서비스 상태에 도달합니다.", status: "3 hosts healthy", code: `server01  healthy\nserver02  healthy\nserver03  healthy\n\nresult: validation passed` }
            ]
        },
        docker: {
            title: "서비스 실행환경 재현 자동화",
            technology: "Docker · Docker Compose",
            completeMessage: "환경 차이를 제거한 서비스 실행 구성을 재현하고 상태를 확인했습니다.",
            steps: [
                { id: "environment", title: "Environment Config", summary: "환경별 실행 조건 분리", context: "개발·검증·운영 환경의 설정 차이로 발생하는 실행 오류를 줄일 필요가 있습니다.", execution: "환경 변수와 서비스별 설정을 이미지 외부에서 주입할 수 있도록 구성합니다.", result: "동일 이미지로도 환경에 맞는 실행 조건을 일관되게 재현할 수 있습니다.", status: "config loaded", code: `environment: production\nconfig: validated\nsecrets: injected` },
                { id: "image", title: "Image Build / Verify", summary: "실행 이미지 빌드 및 검증", context: "호스트마다 다른 라이브러리와 런타임 버전이 서비스 동작에 영향을 주지 않아야 합니다.", execution: "애플리케이션과 의존성을 이미지로 빌드하고 태그, 크기, 무결성을 검증합니다.", result: "검증된 하나의 이미지가 모든 대상 환경의 실행 기준이 됩니다.", status: "image verified", code: `app:2026.08  built\ndigest        verified\nbase image    approved` },
                { id: "container", title: "Container Create", summary: "격리된 서비스 인스턴스 생성", context: "검증된 실행환경을 호스트 구성에 의존하지 않고 반복 생성해야 합니다.", execution: "Compose 정의와 환경 설정을 기준으로 애플리케이션 컨테이너를 생성합니다.", result: "동일한 설정과 런타임을 가진 서비스 인스턴스가 준비됩니다.", status: "container created", code: `app       created\nproxy     created\nrestart   unless-stopped` },
                { id: "resources", title: "Network / Volume Setup", summary: "연결과 영속 데이터 구성", context: "서비스 간 통신 경로와 재시작 후에도 유지할 데이터를 명시적으로 관리해야 합니다.", execution: "전용 네트워크를 연결하고 설정 및 데이터 볼륨을 올바른 경로에 마운트합니다.", result: "서비스 연결과 영속 데이터 경로가 환경마다 동일하게 구성됩니다.", status: "resources ready", code: `network  service-net attached\nvolume   app-data mounted\nproxy → app reachable` },
                { id: "health", title: "Health Check", summary: "요청 처리 가능 상태 확인", context: "컨테이너가 실행 중인 상태와 서비스가 요청을 처리할 수 있는 상태는 다릅니다.", execution: "Health endpoint와 의존 서비스 연결을 점검하고 준비 완료까지 대기합니다.", result: "서비스가 트래픽을 받을 수 있는 healthy 상태로 전환됩니다.", status: "health check passed", code: `app     healthy\nproxy   healthy\nGET /health  200 OK` }
            ]
        },
        "closed-network": {
            title: "폐쇄망 설치 및 환경 구성 자동화",
            technology: "Offline Package · Script",
            completeMessage: "외부 인터넷 없이 의존성 설치부터 서비스 검증까지 완료했습니다.",
            steps: [
                { id: "bundle", title: "Package Bundle Prepare", summary: "패키지와 의존성 사전 준비", context: "인터넷 접근이 제한된 환경에서는 설치 중 필요한 파일을 외부에서 내려받을 수 없습니다.", execution: "대상 OS와 버전에 맞는 패키지, 의존성, 설정 템플릿, 설치 스크립트를 하나의 번들로 구성합니다.", result: "외부 저장소 없이 설치 가능한 이관 단위가 준비됩니다.", status: "bundle prepared", code: `offline-bundle/\n├── packages/\n├── configs/\n├── manifest.txt\n└── install.sh` },
                { id: "checksum", title: "Checksum Verify", summary: "반입 파일 무결성 검증", context: "망 간 파일 이동 과정에서 누락되거나 손상된 패키지가 설치 실패로 이어질 수 있습니다.", execution: "Manifest에 기록된 해시와 번들의 모든 파일을 대조합니다.", result: "반입 전에 파일 완전성과 위변조 여부를 확인합니다.", status: "package verified", code: `packages  42/42 verified\nconfigs    6/6 verified\nchecksum   passed` },
                { id: "transfer", title: "Offline Transfer", summary: "승인된 번들 폐쇄망 반입", context: "보안 절차를 준수하면서 설치에 필요한 산출물을 빠짐없이 전달해야 합니다.", execution: "검증된 단일 번들을 승인된 매체와 반입 절차를 통해 대상 환경으로 이동합니다.", result: "설치에 필요한 동일 산출물이 폐쇄망 서버에 안전하게 배치됩니다.", status: "bundle transferred", code: `source  staging\ntarget  offline-server\nfiles   51 transferred` },
                { id: "dependency", title: "Dependency Check", summary: "설치 전 조건 및 의존성 확인", context: "폐쇄망에서는 설치 도중 누락된 의존성을 즉시 보완하기 어렵기 때문에 사전 검증이 중요합니다.", execution: "OS 버전, 디스크, 권한과 패키지 의존 관계를 설치 전에 점검합니다.", result: "누락 없이 설치 가능한 상태임을 확인하고 실패 가능성을 사전에 제거합니다.", status: "dependency resolved", code: `OS version    supported\ndisk space    sufficient\ndependencies  resolved` },
                { id: "install", title: "Install Script Execute", summary: "반복 가능한 설치 절차 실행", context: "작업자마다 달라질 수 있는 수동 설치 순서를 표준화해야 합니다.", execution: "스크립트가 패키지 설치, 설정 반영, 권한 설정, 서비스 등록을 정해진 순서로 수행합니다.", result: "동일 절차로 재실행 가능한 환경 구성이 완료되고 실행 로그가 남습니다.", status: "installation completed", code: `[1/4] packages installed\n[2/4] config applied\n[3/4] permission set\n[4/4] service registered` },
                { id: "validation", title: "Service Validation", summary: "외부망 없이 정상 동작 검증", context: "설치 완료 후 서비스가 외부 네트워크 의존 없이 독립적으로 동작하는지 확인해야 합니다.", execution: "서비스 프로세스, 포트, 로컬 Health endpoint와 재기동 동작을 검증합니다.", result: "폐쇄망 안에서 서비스가 정상 실행되고 요청 처리 가능한 상태가 됩니다.", status: "service validated", code: `service   active\nhealth    passed\nrestart   passed\ninternet  not required` }
            ]
        },
        operations: {
            title: "반복 운영 작업 자동화",
            technology: "Scheduler · Script",
            completeMessage: "정기 운영 데이터를 수집하고 보고서 생성과 알림까지 완료했습니다.",
            steps: [
                { id: "schedule", title: "Schedule Trigger", summary: "정해진 주기에 작업 시작", context: "매일 반복되는 점검을 작업자의 기억과 수동 실행에 의존하지 않아야 합니다.", execution: "Scheduler가 지정된 시간과 실행 조건에 따라 운영 작업을 자동으로 시작합니다.", result: "누락 없이 정해진 시점에 점검 작업이 실행됩니다.", status: "scheduled", code: `job       daily-operation-check\nschedule  09:00 KST\ntrigger   started` },
                { id: "script", title: "Automation Script", summary: "표준 운영 절차 실행", context: "반복 점검의 순서와 판단 기준을 일관되게 유지할 필요가 있습니다.", execution: "스크립트가 대상 확인, 오류 처리, 재시도 규칙을 포함한 표준 절차를 수행합니다.", result: "작업자와 무관하게 동일한 운영 절차와 실행 기록이 유지됩니다.", status: "script executed", code: `targets  8 loaded\nchecks   5 enabled\nretry    2 attempts` },
                { id: "collection", title: "Data Collection", summary: "서비스와 시스템 상태 수집", context: "장애 징후를 파악하려면 분산된 운영 상태를 한 번에 확인할 수 있어야 합니다.", execution: "서비스 상태, 작업 결과, 자원 사용량과 오류 로그를 대상 시스템에서 수집합니다.", result: "8개 시스템의 현재 상태가 구조화된 데이터로 집계됩니다.", status: "collecting complete", code: `service status   8/8\njob results      collected\nresource usage   collected` },
                { id: "report", title: "Report Generation", summary: "점검 결과 요약 및 기록", context: "수집 데이터는 이상 여부와 추세를 빠르게 판단할 수 있는 형태로 정리되어야 합니다.", execution: "정상, 경고, 실패 기준을 적용해 일일 운영 보고서를 생성하고 이력을 보관합니다.", result: "담당자가 즉시 검토할 수 있는 운영 현황과 예외 항목이 만들어집니다.", status: "report generated", code: `systems checked  8\nhealthy          7\nwarning          1\nreport           saved` },
                { id: "notification", title: "Notification", summary: "결과와 예외 상황 전달", context: "점검이 자동화되어도 이상 상태가 담당자에게 제때 전달되지 않으면 대응이 늦어집니다.", execution: "보고서 링크와 우선 확인이 필요한 경고 항목을 운영 채널로 전송합니다.", result: "담당자가 결과를 확인하고 필요한 후속 조치를 바로 시작할 수 있습니다.", status: "notification sent", code: `channel   operations\nreport    delivered\nwarning   1 highlighted` }
            ]
        }
    };

    const pipeline = document.querySelector("#infra-pipeline");
    const tabs = [...document.querySelectorAll(".infra-case-tab")];
    const flowTitle = document.querySelector("#infra-flow-title");
    const technology = document.querySelector("#infra-technology");
    const startButton = document.querySelector("#start-automation");
    const title = document.querySelector("#infra-detail-title");
    const context = document.querySelector("#infra-context");
    const execution = document.querySelector("#infra-execution");
    const result = document.querySelector("#infra-result");
    const code = document.querySelector("#infra-code code");
    const progressBar = document.querySelector("#infra-progress-bar");
    const progressLabel = document.querySelector("#infra-progress-label");
    const liveStatus = document.querySelector("#infra-live-status");
    const delay = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));
    let activeCaseKey = "provisioning";
    let isRunning = false;

    const currentCase = () => cases[activeCaseKey];

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
        context.textContent = step.context;
        execution.textContent = step.execution;
        result.textContent = step.result;
        code.textContent = step.code;
    }

    function renderCase(caseKey) {
        activeCaseKey = caseKey;
        const selectedCase = currentCase();
        flowTitle.textContent = selectedCase.title;
        technology.textContent = selectedCase.technology;
        pipeline.innerHTML = selectedCase.steps.map((step, index) => `
            <button class="infra-node${index === 0 ? " is-selected" : ""}" type="button"
                data-step="${step.id}" aria-pressed="${index === 0}">
                <span class="infra-node-number">${String(index + 1).padStart(2, "0")}</span>
                <span class="infra-node-copy"><strong>${step.title}</strong><small>${step.summary}</small></span>
                <span class="infra-node-status">${index === 0 ? "READY" : "QUEUED"}</span>
            </button>
            ${index < selectedCase.steps.length - 1 ? '<div class="infra-connector" aria-hidden="true"><span class="infra-packet"></span></div>' : ""}
        `).join("");

        pipeline.querySelectorAll(".infra-node").forEach((node) => node.addEventListener("click", () => selectStep(node.dataset.step)));
        tabs.forEach((tab) => {
            const selected = tab.dataset.case === caseKey;
            tab.classList.toggle("is-active", selected);
            if (selected) tab.setAttribute("aria-current", "page");
            else tab.removeAttribute("aria-current");
        });
        selectStep(selectedCase.steps[0].id);
        setProgress(0);
        liveStatus.textContent = "단계를 선택해 운영 맥락을 확인하거나 자동화를 실행해 보세요.";
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
            node.querySelector(".infra-node-status").textContent = index === 0 ? "READY" : "QUEUED";
        });
        connectors.forEach((connector) => connector.classList.remove("is-moving", "is-complete"));
        setProgress(0);

        for (let index = 0; index < nodes.length; index += 1) {
            const node = nodes[index];
            const step = selectedCase.steps[index];
            selectStep(step.id);
            node.classList.add("is-active");
            node.querySelector(".infra-node-status").textContent = "EXECUTING";
            liveStatus.textContent = `${step.title} — ${step.execution}`;
            await delay(700);
            node.classList.remove("is-active");
            node.classList.add("is-complete");
            node.querySelector(".infra-node-status").textContent = step.status;
            liveStatus.textContent = `${step.status} — ${step.result}`;
            setProgress(Math.round(((index + 1) / nodes.length) * 100));
            await delay(280);
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
