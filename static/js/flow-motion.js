window.FlowMotion = (() => {
    const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function place(packet, path, progress) {
        const length = path.getTotalLength();
        const point = path.getPointAtLength(length * progress);
        packet.setAttribute("transform", `translate(${point.x} ${point.y})`);
    }

    function travel({ path, packet, duration = 600, isPaused = () => false, isCancelled = () => false }) {
        if (!path || !packet) return Promise.resolve();
        packet.hidden = false;
        packet.classList.add("is-visible");
        if (reducedMotion()) {
            place(packet, path, 1);
            packet.classList.remove("is-visible");
            packet.hidden = true;
            return Promise.resolve();
        }
        return new Promise((resolve, reject) => {
            let started;
            let pausedAt;
            let pausedTotal = 0;
            const frame = (time) => {
                if (isCancelled()) {
                    packet.classList.remove("is-visible");
                    packet.hidden = true;
                    reject(new Error("cancelled"));
                    return;
                }
                if (isPaused()) {
                    pausedAt ??= time;
                    requestAnimationFrame(frame);
                    return;
                }
                if (pausedAt) {
                    pausedTotal += time - pausedAt;
                    pausedAt = undefined;
                }
                started ??= time;
                const progress = Math.min((time - started - pausedTotal) / duration, 1);
                place(packet, path, progress);
                if (progress < 1) requestAnimationFrame(frame);
                else {
                    packet.classList.remove("is-visible");
                    packet.hidden = true;
                    resolve();
                }
            };
            requestAnimationFrame(frame);
        });
    }

    function reset(root) {
        root?.querySelectorAll(".flow-svg-packet").forEach((packet) => {
            packet.classList.remove("is-visible");
            packet.hidden = true;
            packet.removeAttribute("transform");
        });
        root?.querySelectorAll(".flow-svg-path").forEach((path) => path.classList.remove("is-active", "is-complete", "is-error"));
    }

    return { travel, reset, reducedMotion };
})();
