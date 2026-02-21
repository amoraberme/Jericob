document.addEventListener("DOMContentLoaded", () => {
    // 1. Custom Cursor Initialization
    const cursorDot = document.querySelector(".cursor-dot");
    const cursorOutline = document.querySelector(".cursor-outline");

    if (window.matchMedia("(pointer: fine)").matches) {
        window.addEventListener("mousemove", (e) => {
            const posX = e.clientX;
            const posY = e.clientY;

            // Dot follows exactly
            cursorDot.style.left = `${posX}px`;
            cursorDot.style.top = `${posY}px`;

            // Outline follows with slight delay using animate
            cursorOutline.animate({
                left: `${posX}px`,
                top: `${posY}px`
            }, { duration: 500, fill: "forwards" });
        });

        // Add hover effects for interactive elements
        const interactables = document.querySelectorAll("a, button, .stack-card, .credential-card");
        interactables.forEach(el => {
            el.addEventListener("mouseenter", () => {
                cursorOutline.classList.add("hovered");
            });
            el.addEventListener("mouseleave", () => {
                cursorOutline.classList.remove("hovered");
            });
        });
    }

    // 2. Navbar Scroll Effect & Scrollspy
    const navbar = document.querySelector(".navbar");
    const sections = document.querySelectorAll("section[id]");
    const navLinks = document.querySelectorAll(".nav-links .nav-link");

    // Scroll Effect
    window.addEventListener("scroll", () => {
        if (window.scrollY > 50) {
            navbar.classList.add("scrolled");
        } else {
            navbar.classList.remove("scrolled");
        }
    });

    // Scrollspy (Intersection Observer)
    if (sections.length > 0) {
        const observerOptions = {
            root: null,
            rootMargin: '-50% 0px -50% 0px',
            threshold: 0
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const id = entry.target.getAttribute('id');

                    // Only process our main sections
                    if (['expertise', 'credentials', 'governance'].includes(id)) {
                        // Remove active class from all links
                        navLinks.forEach(link => {
                            // Don't remove inline active states from non-hash pages
                            if (link.getAttribute('href').includes('#')) {
                                link.classList.remove('active');
                            }
                        });

                        // Add active class to current
                        const activeLink = document.querySelector(`.nav-links .nav-link[href="#${id}"]`) ||
                            document.querySelector(`.nav-links .nav-link[href="index.html#${id}"]`);
                        if (activeLink) {
                            activeLink.classList.add('active');
                        }
                    }
                }
            });
        }, observerOptions);

        sections.forEach(section => {
            observer.observe(section);
        });
    }

    // 3. Dynamic Rotating Verb Logic (GSAP Carousel)
    const verbs = ["Visualize", "Build", "Create"];
    let currentVerbIndex = 0;
    const wrapper = document.querySelector(".dynamic-verb-wrapper");

    if (wrapper) {
        // Create initial elements for verbs
        wrapper.innerHTML = ''; // clear original
        const verbElements = verbs.map(verb => {
            const el = document.createElement("span");
            el.className = "dynamic-verb";
            el.textContent = verb;
            wrapper.appendChild(el);
            return el;
        });

        // Initialize first word
        gsap.set(verbElements[0], { opacity: 1, filter: "blur(0px)" });

        // Carousel function
        setInterval(() => {
            const currentEl = verbElements[currentVerbIndex];
            currentVerbIndex = (currentVerbIndex + 1) % verbs.length;
            const nextEl = verbElements[currentVerbIndex];

            // Animate old word blur and out
            gsap.to(currentEl, {
                opacity: 0,
                filter: "blur(12px)",
                duration: 0.9,
                ease: "power2.inOut"
            });

            // Set up new word to unblur and fade in
            gsap.fromTo(nextEl,
                { opacity: 0, filter: "blur(12px)" },
                { opacity: 1, filter: "blur(0px)", duration: 0.9, ease: "power2.inOut" }
            );

        }, 2250); // Trigger swap every 2.25 seconds
    }

    // 4. GSAP Animations Registration
    gsap.registerPlugin(ScrollTrigger);

    // 4. Initialize Lenis Smooth Scrolling
    const lenis = new Lenis({
        duration: 1.5,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smooth: true,
        smoothTouch: false,
    });

    lenis.on('scroll', ScrollTrigger.update);

    gsap.ticker.add((time) => {
        lenis.raf(time * 1000);
    });

    gsap.ticker.lagSmoothing(0);

    // Initial load animations (Hero)
    const tl = gsap.timeline();

    tl.fromTo(".hero .eyebrow",
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: "power3.out", delay: 0.2 }
    )
        .fromTo(".hero .headline",
            { y: 40, opacity: 0 },
            { y: 0, opacity: 1, duration: 1, ease: "power3.out" },
            "-=0.6"
        )
        .fromTo(".hero .description",
            { y: 30, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" },
            "-=0.6"
        )
        .fromTo(".hero .hero-cta",
            { y: 20, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.6, ease: "power3.out" },
            "-=0.4"
        )
        .fromTo(".scroll-indicator",
            { opacity: 0 },
            { opacity: 0.5, duration: 1, ease: "power2.out" },
            "-=0.2"
        );

    // Scroll Animations for fade-up elements
    const fadeUpElements = document.querySelectorAll(".fade-up");
    fadeUpElements.forEach(el => {
        gsap.fromTo(el,
            { y: 50, opacity: 0 },
            {
                scrollTrigger: {
                    trigger: el,
                    start: "top 85%", // Trigger when top of element is 85% down viewport
                    toggleActions: "play none none reverse"
                },
                y: 0,
                opacity: 1,
                duration: 0.8,
                ease: "power3.out"
            }
        );
    });

    // Strategy for number counters in Governance section
    const counters = document.querySelectorAll(".counter");
    counters.forEach(counter => {
        const target = +counter.getAttribute("data-target");

        ScrollTrigger.create({
            trigger: counter,
            start: "top 85%",
            onEnter: () => {
                let startValue = 0;
                const duration = 2000; // 2 seconds
                const start = performance.now();

                function updateCounter(currentTime) {
                    const elapsed = currentTime - start;
                    const progress = Math.min(elapsed / duration, 1);

                    // Simple easing function
                    const easeOutQuart = 1 - Math.pow(1 - progress, 4);

                    counter.textContent = Math.floor(easeOutQuart * target);

                    if (progress < 1) {
                        requestAnimationFrame(updateCounter);
                    } else {
                        counter.textContent = target; // Ensure exact final value
                    }
                }

                requestAnimationFrame(updateCounter);
            },
            once: true
        });
    });

    // 6. Draggable & Auto-Scrolling Stack track
    const stackTrack = document.getElementById('expertise-track');
    if (stackTrack) {
        const stackItems = stackTrack.querySelector('.stack-items');
        if (stackItems) {
            // Clone items for infinite scrolling
            const clone = stackItems.cloneNode(true);
            clone.setAttribute('aria-hidden', 'true');
            stackTrack.appendChild(clone);

            // Re-apply hover effect for custom cursor on cloned items
            if (window.matchMedia("(pointer: fine)").matches) {
                const cursorOutline = document.querySelector(".cursor-outline");
                clone.querySelectorAll(".stack-card").forEach(el => {
                    el.addEventListener("mouseenter", () => cursorOutline.classList.add("hovered"));
                    el.addEventListener("mouseleave", () => cursorOutline.classList.remove("hovered"));
                });
            }

            let isDown = false;
            let startX;
            let scrollLeft;
            let isHovered = false;

            stackTrack.addEventListener('mouseenter', () => isHovered = true);
            stackTrack.addEventListener('mouseleave', () => {
                isHovered = false;
                isDown = false;
            });

            stackTrack.addEventListener('mousedown', (e) => {
                isDown = true;
                startX = e.pageX - stackTrack.offsetLeft;
                scrollLeft = stackTrack.scrollLeft;
            });

            stackTrack.addEventListener('mouseup', () => {
                isDown = false;
            });

            stackTrack.addEventListener('mousemove', (e) => {
                if (!isDown) return;
                e.preventDefault();
                const x = e.pageX - stackTrack.offsetLeft;
                const walk = (x - startX) * 1.5; // Scroll-fast multiplier

                stackTrack.scrollLeft = scrollLeft - walk;

                // Handle infinite scrolling during drag
                if (stackTrack.scrollLeft <= 0) {
                    stackTrack.scrollLeft += stackItems.offsetWidth;
                    startX = e.pageX - stackTrack.offsetLeft;
                    scrollLeft = stackTrack.scrollLeft;
                } else if (stackTrack.scrollLeft >= stackItems.offsetWidth) {
                    stackTrack.scrollLeft -= stackItems.offsetWidth;
                    startX = e.pageX - stackTrack.offsetLeft;
                    scrollLeft = stackTrack.scrollLeft;
                }
            });

            // Auto loop animation
            function autoScroll() {
                if (!isDown && !isHovered) {
                    stackTrack.scrollLeft += 1;
                }

                // Native Infinite loop boundary checks (when scrolling right normally)
                if (stackTrack.scrollLeft >= stackItems.offsetWidth) {
                    stackTrack.scrollLeft = 0;
                }

                requestAnimationFrame(autoScroll);
            }
            requestAnimationFrame(autoScroll);
        }
    }

    // 7. Contact Modal Logic
    const modalOverlay = document.getElementById('contactModal');
    const contactTriggers = document.querySelectorAll('#openModalBtn, .contact-trigger');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const contactForm = document.getElementById('contactForm');
    const formStatus = document.getElementById('formStatus');
    const submitBtn = document.getElementById('submitBtn');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoader = submitBtn.querySelector('.btn-loader');

    // Open Modal
    if (contactTriggers.length > 0 && modalOverlay) {
        contactTriggers.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                modalOverlay.classList.add('active');
                // Disable body scroll when modal is open
                document.body.style.overflow = 'hidden';
                if (typeof lenis !== 'undefined') lenis.stop();
            });
        });
    }

    // Close Modal Function
    const closeModal = () => {
        modalOverlay.classList.remove('active');
        document.body.style.overflow = '';
        if (typeof lenis !== 'undefined') lenis.start();

        // Reset form state after fade out
        setTimeout(() => {
            contactForm.reset();
            formStatus.className = 'form-status';
            formStatus.textContent = '';
            formStatus.style.display = 'none';
        }, 400);
    };

    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeModal);
    }

    // Close on overlay click
    if (modalOverlay) {
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                closeModal();
            }
        });
    }

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modalOverlay.classList.contains('active')) {
            closeModal();
        }
    });

    // Form Submit Handler (Resend API securely via Serverless Function)
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Set loading state
            btnText.style.display = 'none';
            btnLoader.style.display = 'inline-block';
            submitBtn.disabled = true;
            formStatus.style.display = 'none';

            const formData = new FormData(contactForm);
            const data = {
                name: formData.get('name'),
                email: formData.get('email'),
                message: formData.get('message')
            };

            try {
                // Post to Vercel Serverless Function
                const response = await fetch('/api/send-email', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });

                const result = await response.json();

                if (response.ok) {
                    // Success
                    formStatus.textContent = "Message sent successfully! I'll be in touch soon.";
                    formStatus.className = 'form-status success';
                    formStatus.style.display = 'block';
                    contactForm.reset();
                } else {
                    // Error from API
                    throw new Error(result.error?.message || 'Failed to send message.');
                }
            } catch (error) {
                console.error("Form submission error:", error);
                formStatus.textContent = "Oops! Something went wrong. Please try emailing directly.";
                formStatus.className = 'form-status error';
                formStatus.style.display = 'block';
            } finally {
                // Reset button state
                btnText.style.display = 'inline-block';
                btnLoader.style.display = 'none';
                submitBtn.disabled = false;
            }
        });
    }

    // 8. Bento Grid Stacks Logic
    const stacks = document.querySelectorAll('.bento-stack');
    stacks.forEach(stack => {
        const btn = stack.querySelector('.stack-next-btn');
        const images = stack.querySelectorAll('.stack-images img');
        const currentLabel = stack.querySelector('.stack-indicator .current');
        let currentIndex = 0;

        if (btn && images.length > 0) {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                // Hide current
                images[currentIndex].classList.remove('active');

                // Increment and wrap around
                currentIndex = (currentIndex + 1) % images.length;

                // Show new
                images[currentIndex].classList.add('active');

                // Update indicator
                if (currentLabel) {
                    currentLabel.textContent = currentIndex + 1;
                }
            });
        }
    });

});
