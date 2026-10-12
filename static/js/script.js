/* ==========================================================
   CONTACT MODAL
========================================================== */


document.addEventListener(
    "DOMContentLoaded",
    () => {

        const navToggle = document.querySelector("[data-nav-toggle]");
        const sidebar = document.querySelector(".site-sidebar");
        const projectsMenu = document.querySelector("[data-projects-menu]");
        const projectsToggle = document.querySelector("[data-projects-toggle]");
        const projectsSubmenu = document.getElementById("projects-submenu");

        const setProjectsMenu = (open, returnFocus = false) => {
            if (!projectsMenu || !projectsToggle || !projectsSubmenu) return;
            projectsMenu.classList.toggle("is-open", open);
            projectsToggle.setAttribute("aria-expanded", String(open));
            projectsSubmenu.hidden = !open;
            if (returnFocus) projectsToggle.focus();
        };

        projectsToggle?.addEventListener("click", () => {
            setProjectsMenu(projectsToggle.getAttribute("aria-expanded") !== "true");
        });
        navToggle?.addEventListener("click", () => {
            const open = sidebar?.classList.toggle("is-open") ?? false;
            navToggle.setAttribute("aria-expanded", String(open));
            navToggle.setAttribute("aria-label", open ? "메뉴 닫기" : "메뉴 열기");
        });
        sidebar?.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => {
            sidebar.classList.remove("is-open");
            navToggle?.setAttribute("aria-expanded", "false");
        }));

        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape" && projectsToggle?.getAttribute("aria-expanded") === "true") {
                setProjectsMenu(false, true);
            }
        });


        const modal =
            document.getElementById("contact-modal");

        const openButton =
            document.querySelector("[data-contact-open]");

        const closeButton =
            modal?.querySelector("[data-contact-close]");

        const modalBox =
            modal?.querySelector(".contact-box");



        if (!modal || !openButton || !closeButton || !modalBox) {

            return;

        }

        const openContact = () => {
            modal.classList.add("active");
            modal.setAttribute("aria-hidden", "false");
            document.body.classList.add("modal-open");
            modalBox.focus();
        };

        const closeContact = () => {
            modal.classList.remove("active");
            modal.setAttribute("aria-hidden", "true");
            document.body.classList.remove("modal-open");
            openButton.focus();
        };

        openButton.addEventListener("click", openContact);
        closeButton.addEventListener("click", closeContact);



        // modal background click

        modal.addEventListener(
            "click",
            (event) => {


                if (event.target === modal) {

                    closeContact();

                }


            }
        );




        // ESC close

        document.addEventListener(
            "keydown",
            (event) => {


                if (event.key === "Escape" && modal.classList.contains("active")) {

                    closeContact();

                }


            }
        );


    }
);
