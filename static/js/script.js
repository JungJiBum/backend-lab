// ===============================
// Smooth Scroll
// ===============================

document.querySelectorAll('a[href^="#"]').forEach(anchor => {

    anchor.addEventListener("click", function (e) {

        e.preventDefault();

        const target = document.querySelector(this.getAttribute("href"));

        if (target) {

            target.scrollIntoView({
                behavior: "smooth"
            });

        }

    });

});


// ===============================
// Scroll Animation
// ===============================

const observer = new IntersectionObserver(

    (entries) => {

        entries.forEach(entry => {

            if (entry.isIntersecting) {

                entry.target.classList.add("show");

            }

        });

    },

    {
        threshold: 0.15
    }

);


document.querySelectorAll(".tech-card").forEach(card => {

    observer.observe(card);

});


document.querySelectorAll(".project-card").forEach(card => {

    observer.observe(card);

});


document.querySelectorAll(".about-card").forEach(card => {

    observer.observe(card);

});


// ===============================
// Navbar Background
// ===============================

const navbar = document.querySelector(".navbar");

window.addEventListener("scroll", () => {

    if (window.scrollY > 50) {

        navbar.style.background = "rgba(13,17,23,.95)";

        navbar.style.boxShadow =
            "0 10px 30px rgba(0,0,0,.35)";

    } else {

        navbar.style.background =
            "rgba(13,17,23,.85)";

        navbar.style.boxShadow = "none";

    }

});


// ===============================
// Card Hover Glow
// ===============================

document.querySelectorAll(".tech-card,.project-card").forEach(card => {

    card.addEventListener("mousemove", e => {

        const rect = card.getBoundingClientRect();

        const x = e.clientX - rect.left;

        const y = e.clientY - rect.top;

        card.style.background =
            `radial-gradient(circle at ${x}px ${y}px,
            rgba(88,166,255,.12),
            #161b22 60%)`;

    });

    card.addEventListener("mouseleave", () => {

        card.style.background = "#161b22";

    });

});


// ===============================
// Hero Fade
// ===============================

window.addEventListener("load", () => {

    const hero = document.querySelector(".hero-content");

    hero.style.opacity = "1";

    hero.style.transform = "translateY(0)";

});

console.log("Backend Engineering Playground Loaded");