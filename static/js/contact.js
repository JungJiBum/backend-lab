document.addEventListener("DOMContentLoaded", () => {
    const button = document.querySelector("[data-copy-email]");
    const status = document.querySelector("[data-copy-status]");
    if (!button || !status) return;
    button.addEventListener("click", async () => {
        try {
            await navigator.clipboard.writeText(button.dataset.email);
            status.textContent = "이메일 주소를 복사했습니다.";
            button.textContent = "복사 완료";
        } catch (_error) {
            status.textContent = "복사할 수 없습니다. 이메일 주소를 직접 선택해 주세요.";
        }
    });
});
