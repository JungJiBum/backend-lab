document.addEventListener("DOMContentLoaded", () => {
    const flows = {
        stt: {
            title: "Audio to Text",
            technology: "FastAPI · Faster-Whisper",
            button: "Run STT Flow",
            complete: ["TEXT OUTPUT", "Transcription complete", 'text: "안녕하세요. 음성 인식 테스트입니다."'],
            nodes: [
                { title: "Audio Input", meta: "Audio", done: "RECEIVED" },
                { title: "Validation", meta: "Audio input", done: "VALID" },
                { title: "STTProvider", meta: "Interface", done: "RESOLVED" },
                { title: "Faster-Whisper", meta: "Local STT", done: "TRANSCRIBED" },
                { title: "Text Output", meta: "Response", done: "COMPLETE" },
            ],
        },
        tts: {
            title: "Text to WAV",
            technology: "FastAPI · sherpa-onnx · Supertonic 3",
            button: "Run TTS Flow",
            complete: ["WAV OUTPUT", "Synthesis complete", "Temporary WAV returned · cleanup complete"],
            nodes: [
                { title: "Text Input", meta: "Text + options", badges: ["voice_id 0–9", "speed 0.5–2.0"], done: "RECEIVED" },
                { title: "Validation", meta: "Text · options", done: "VALID" },
                { title: "TTSProvider", meta: "Interface", done: "RESOLVED" },
                { title: "Supertonic 3", meta: "sherpa-onnx · Local TTS", done: "SYNTHESIZED" },
                { title: "WAV Output", meta: "Response · Cleanup", done: "COMPLETE" },
            ],
        },
    };

    const tabs = [...document.querySelectorAll(".voice-mode-tabs .infra-case-tab")];
    const pipeline = document.querySelector("#voice-pipeline");
    const flowTitle = document.querySelector("#voice-flow-title");
    const technology = document.querySelector("#voice-technology");
    const startButton = document.querySelector("#start-voice-flow");
    const outputState = document.querySelector("#voice-output-state");
    const outputTitle = document.querySelector("#voice-output-title");
    const outputCode = document.querySelector("#voice-output-code");
    const delay = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));
    let activeMode = "stt";
    let isRunning = false;

    function renderFlow(mode) {
        activeMode = mode;
        const flow = flows[mode];
        flowTitle.textContent = flow.title;
        technology.textContent = flow.technology;
        startButton.innerHTML = `<span aria-hidden="true">▶</span> ${flow.button}`;
        pipeline.innerHTML = flow.nodes.map((node, index) => `
            <div class="voice-node" data-index="${index}">
                <span class="voice-node-number">${String(index + 1).padStart(2, "0")}</span>
                <strong>${node.title}</strong>
                <small>${node.meta}</small>
                ${node.badges ? `<span class="voice-option-badges">${node.badges.map((badge) => `<i>${badge}</i>`).join("")}</span>` : ""}
                <b>${index === 0 ? "READY" : "WAITING"}</b>
            </div>
            ${index < flow.nodes.length - 1 ? '<div class="voice-connector" aria-hidden="true"><span class="voice-packet"></span><i>→</i></div>' : ""}
        `).join("");
        tabs.forEach((tab) => {
            const selected = tab.dataset.mode === mode;
            tab.classList.toggle("is-active", selected);
            if (selected) tab.setAttribute("aria-current", "page");
            else tab.removeAttribute("aria-current");
        });
        outputState.textContent = "READY";
        outputTitle.textContent = flow.nodes[0].title;
        outputCode.textContent = `${flow.button}를 눌러 처리 과정을 확인하세요.`;
    }

    async function movePacket(connector) {
        connector.classList.add("is-moving");
        await delay(420);
        connector.classList.remove("is-moving");
        connector.classList.add("is-complete");
    }

    async function runFlow() {
        if (isRunning) return;
        isRunning = true;
        startButton.disabled = true;
        tabs.forEach((tab) => { tab.disabled = true; });
        const flow = flows[activeMode];
        const nodes = [...pipeline.querySelectorAll(".voice-node")];
        const connectors = [...pipeline.querySelectorAll(".voice-connector")];
        nodes.forEach((node, index) => {
            node.classList.remove("is-active", "is-complete");
            node.querySelector("b").textContent = index === 0 ? "READY" : "WAITING";
        });
        connectors.forEach((connector) => connector.classList.remove("is-moving", "is-complete"));

        for (let index = 0; index < nodes.length; index += 1) {
            const node = nodes[index];
            const step = flow.nodes[index];
            node.classList.add("is-active");
            node.querySelector("b").textContent = "PROCESSING";
            outputState.textContent = "PROCESSING";
            outputTitle.textContent = step.title;
            outputCode.textContent = step.meta;
            await delay(650);
            node.classList.remove("is-active");
            node.classList.add("is-complete");
            node.querySelector("b").textContent = step.done;
            if (connectors[index]) await movePacket(connectors[index]);
        }

        [outputState.textContent, outputTitle.textContent, outputCode.textContent] = flow.complete;
        tabs.forEach((tab) => { tab.disabled = false; });
        startButton.disabled = false;
        isRunning = false;
    }

    tabs.forEach((tab) => tab.addEventListener("click", () => {
        if (!isRunning) renderFlow(tab.dataset.mode);
    }));
    startButton.addEventListener("click", runFlow);
    renderFlow(activeMode);
});
