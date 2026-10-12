document.addEventListener("DOMContentLoaded", () => {
    const root = document.querySelector("#hero-lrs-preview");
    if (!root || !window.FlowMotion) return;
    if (window.FlowMotion.reducedMotion()) {
        root.querySelectorAll(".preview-node").forEach((node) => node.classList.add("is-complete"));
        root.querySelectorAll(".flow-svg-path").forEach((path) => path.classList.add("is-complete"));
        return;
    }
    let cycle = 0;
    let visible = true;
    const wait = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));
    const packet = root.querySelector("#hero-packet");
    const errorPacket = root.querySelector("#hero-error-packet");
    const setNode = (name, state = "") => {
        const node = root.querySelector(`[data-preview-node="${name}"]`);
        node?.classList.remove("is-active", "is-complete");
        if (state) node?.classList.add(state);
    };
    async function travel(pathId, target, movingPacket, activeCycle) {
        const path = root.querySelector(`#${pathId}`);
        path.classList.add(target === "error" ? "is-error" : "is-active");
        await FlowMotion.travel({ path, packet: movingPacket, duration: 620, isCancelled: () => activeCycle !== cycle || !visible });
        path.classList.remove("is-active");
        path.classList.add(target === "error" ? "is-error" : "is-complete");
        setNode(target, "is-active"); await wait(220); setNode(target, "is-complete");
    }
    async function play() {
        const activeCycle = ++cycle;
        FlowMotion.reset(root);
        root.querySelectorAll(".preview-node").forEach((node) => node.classList.remove("is-active", "is-complete"));
        try {
            setNode("event", "is-active"); await wait(300); setNode("event", "is-complete");
            await travel("hero-p1", "receiver", packet, activeCycle);
            await travel("hero-p2", "validation", packet, activeCycle);
            await Promise.all([travel("hero-pass", "storage", packet, activeCycle), travel("hero-fail", "error", errorPacket, activeCycle)]);
            await travel("hero-post1", "beat", packet, activeCycle);
            await travel("hero-post2", "transform", packet, activeCycle);
            await travel("hero-post3", "analytics", packet, activeCycle);
            await wait(1300); if (visible && activeCycle === cycle) play();
        } catch (error) { if (error.message !== "cancelled") throw error; }
    }
    new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; if (visible) play(); else cycle += 1; }, { threshold: .2 }).observe(root);
});
