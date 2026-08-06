/* ==========================================================
   CONTACT MODAL
========================================================== */


document.addEventListener(
    "DOMContentLoaded",
    () => {


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
