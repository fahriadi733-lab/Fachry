const revealItems = document.querySelectorAll(".reveal");
const menuToggle = document.querySelector(".menu-toggle");
const navigation = document.querySelector(".nav-links");
const year = document.querySelector("#year");
const welcomeScreen = document.querySelector(".welcome-screen");
const scrollProgress = document.querySelector(".scroll-progress span");

if (welcomeScreen) {
  const removeWelcomeScreen = () => welcomeScreen.remove();
  welcomeScreen.addEventListener("animationend", (event) => {
    if (event.animationName === "welcome-exit") removeWelcomeScreen();
  });
  window.setTimeout(removeWelcomeScreen, 3200);
}

if (year) {
  year.textContent = String(new Date().getFullYear());
}

if (scrollProgress) {
  let scrollUpdatePending = false;
  const updateScrollProgress = () => {
    const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = scrollableHeight > 0 ? window.scrollY / scrollableHeight : 0;
    scrollProgress.style.transform = `scaleX(${Math.min(Math.max(progress, 0), 1)})`;
    scrollUpdatePending = false;
  };

  window.addEventListener(
    "scroll",
    () => {
      if (!scrollUpdatePending) {
        scrollUpdatePending = true;
        window.requestAnimationFrame(updateScrollProgress);
      }
    },
    { passive: true },
  );
  window.addEventListener("resize", updateScrollProgress);
  updateScrollProgress();
}

if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.14 },
  );

  revealItems.forEach((item) => revealObserver.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add("is-visible"));
}

if (menuToggle && navigation) {
  menuToggle.addEventListener("click", () => {
    const isExpanded = menuToggle.getAttribute("aria-expanded") === "true";
    menuToggle.setAttribute("aria-expanded", String(!isExpanded));
    navigation.classList.toggle("is-open", !isExpanded);
  });

  navigation.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      menuToggle.setAttribute("aria-expanded", "false");
      navigation.classList.remove("is-open");
    });
  });
}

const cursorGlow = document.querySelector(".cursor-glow");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (!prefersReducedMotion) {
  let previousScrollY = window.scrollY;
  let scrollFramePending = false;
  let clearScrollBlurTimer = 0;

  window.addEventListener(
    "scroll",
    () => {
      if (scrollFramePending) return;
      scrollFramePending = true;
      window.requestAnimationFrame(() => {
        const currentScrollY = window.scrollY;
        const distance = Math.abs(currentScrollY - previousScrollY);
        const blur = Math.min(distance * 0.14, 12);
        previousScrollY = currentScrollY;
        scrollFramePending = false;

        if (blur > 0.3) {
          document.body.style.setProperty("--scroll-blur", `${blur.toFixed(2)}px`);
          document.body.classList.add("is-scrolling");
          window.clearTimeout(clearScrollBlurTimer);
          clearScrollBlurTimer = window.setTimeout(() => {
            document.body.classList.remove("is-scrolling");
            document.body.style.setProperty("--scroll-blur", "0px");
          }, 120);
        }
      });
    },
    { passive: true },
  );
}

if (cursorGlow && !prefersReducedMotion && window.matchMedia("(pointer: fine)").matches) {
  window.addEventListener(
    "pointermove",
    (event) => {
      cursorGlow.style.left = `${event.clientX}px`;
      cursorGlow.style.top = `${event.clientY}px`;
    },
    { passive: true },
  );
}

const starfield = document.querySelector(".starfield");

if (starfield instanceof HTMLCanvasElement) {
  const context = starfield.getContext("2d");

  if (context) {
    const stars = [];
    const shootingStars = [];
    const cursorSparks = [];
    let width = 0;
    let height = 0;
    let animationFrame = 0;
    let nextShootingStar = 0;
    let lastFrameTime = 0;
    let lastPointerPosition = null;
    const maxCursorSparks = 360;

    const addCursorSpark = (x, y, speed = 1) => {
      cursorSparks.push({
        x,
        y,
        previousX: x,
        previousY: y,
        vx: (Math.random() - 0.5) * 110 * speed,
        vy: (Math.random() - 0.5) * 110 * speed,
        life: 0,
        duration: 500 + Math.random() * 500,
        radius: 1.2 + Math.random() * 2.5,
        hue: 255 + Math.random() * 85,
      });
      if (cursorSparks.length > maxCursorSparks) cursorSparks.shift();
    };

    const addCursorBurst = (x, y) => {
      for (let index = 0; index < 48; index += 1) {
        const angle = (Math.PI * 2 * index) / 48 + Math.random() * 0.14;
        const speed = 70 + Math.random() * 230;
        const hue = 255 + Math.random() * 95;
        cursorSparks.push({
          x,
          y,
          previousX: x,
          previousY: y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 0,
          duration: 650 + Math.random() * 650,
          radius: 1.5 + Math.random() * 2.8,
          hue,
        });
      }
      if (cursorSparks.length > maxCursorSparks) {
        cursorSparks.splice(0, cursorSparks.length - maxCursorSparks);
      }
    };

    const resizeStarfield = () => {
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      starfield.width = Math.round(width * pixelRatio);
      starfield.height = Math.round(height * pixelRatio);
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

      const starCount = Math.min(150, Math.round((width * height) / 8500));
      stars.length = 0;
      for (let index = 0; index < starCount; index += 1) {
        stars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          radius: Math.random() * 1.1 + 0.25,
          phase: Math.random() * Math.PI * 2,
        });
      }
    };

    const drawStarfield = (time) => {
      const elapsed = lastFrameTime ? Math.min(time - lastFrameTime, 50) : 16;
      lastFrameTime = time;
      context.clearRect(0, 0, width, height);

      stars.forEach((star) => {
        const opacity = 0.2 + (Math.sin(time / 1000 + star.phase) + 1) * 0.18;
        context.beginPath();
        context.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        context.fillStyle = `rgba(220, 204, 255, ${opacity})`;
        context.fill();
      });

      if (!prefersReducedMotion && time >= nextShootingStar && shootingStars.length < 4) {
        const speed = 420 + Math.random() * 480;
        const angle = Math.PI * (0.2 + Math.random() * 0.2);
        shootingStars.push({
          x: Math.random() * width * 0.9,
          y: Math.random() * height * 0.65,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          length: 85 + Math.random() * 135,
          duration: 700 + Math.random() * 500,
          age: 0,
        });
        nextShootingStar = time + 450 + Math.random() * 750;
      }

      shootingStars.forEach((shootingStar) => {
        shootingStar.age += elapsed;
        const progress = shootingStar.age / shootingStar.duration;
        const x = shootingStar.x + shootingStar.vx * (shootingStar.age / 1000);
        const y = shootingStar.y + shootingStar.vy * (shootingStar.age / 1000);
        const opacity = Math.sin(Math.PI * progress) * 0.85;
        const speed = Math.hypot(shootingStar.vx, shootingStar.vy);
        const tailX = x - (shootingStar.vx / speed) * shootingStar.length;
        const tailY = y - (shootingStar.vy / speed) * shootingStar.length;
        const gradient = context.createLinearGradient(tailX, tailY, x, y);
        gradient.addColorStop(0, "rgba(177, 137, 255, 0)");
        gradient.addColorStop(1, `rgba(239, 229, 255, ${opacity})`);
        context.beginPath();
        context.moveTo(tailX, tailY);
        context.lineTo(x, y);
        context.strokeStyle = gradient;
        context.lineWidth = 1.5;
        context.stroke();
        context.beginPath();
        context.arc(x, y, 1.7, 0, Math.PI * 2);
        context.fillStyle = `rgba(255, 250, 255, ${opacity})`;
        context.fill();
      });

      cursorSparks.forEach((spark) => {
        spark.life += elapsed;
        spark.previousX = spark.x;
        spark.previousY = spark.y;
        spark.x += (spark.vx * elapsed) / 1000;
        spark.y += (spark.vy * elapsed) / 1000;
        spark.vx *= 0.992;
        spark.vy = spark.vy * 0.992 + (elapsed * 0.018);
        const opacity = Math.max(0, 1 - spark.life / spark.duration);
        context.beginPath();
        context.moveTo(spark.previousX, spark.previousY);
        context.lineTo(spark.x, spark.y);
        context.strokeStyle = `hsla(${spark.hue}, 100%, 80%, ${opacity * 0.7})`;
        context.lineWidth = Math.max(0.6, spark.radius * opacity);
        context.stroke();
        context.beginPath();
        context.arc(spark.x, spark.y, spark.radius * opacity, 0, Math.PI * 2);
        context.fillStyle = `hsla(${spark.hue}, 100%, 82%, ${opacity})`;
        context.shadowColor = `hsla(${spark.hue}, 100%, 72%, ${opacity})`;
        context.shadowBlur = 12;
        context.fill();
        context.shadowBlur = 0;
      });

      for (let index = shootingStars.length - 1; index >= 0; index -= 1) {
        if (shootingStars[index].age >= shootingStars[index].duration) {
          shootingStars.splice(index, 1);
        }
      }
      for (let index = cursorSparks.length - 1; index >= 0; index -= 1) {
        if (cursorSparks[index].life >= cursorSparks[index].duration) {
          cursorSparks.splice(index, 1);
        }
      }

      if (!prefersReducedMotion && !document.hidden) {
        animationFrame = window.requestAnimationFrame(drawStarfield);
      }
    };

    const startStarfield = () => {
      if (!animationFrame) {
        animationFrame = window.requestAnimationFrame(drawStarfield);
      }
    };

    window.addEventListener("resize", resizeStarfield);
    if (!prefersReducedMotion && window.matchMedia("(pointer: fine)").matches) {
      window.addEventListener(
        "pointermove",
        (event) => {
          if (event.pointerType === "touch") return;
          if (lastPointerPosition) {
            const dx = event.clientX - lastPointerPosition.x;
            const dy = event.clientY - lastPointerPosition.y;
            const distance = Math.hypot(dx, dy);
            if (distance >= 5) {
              const steps = Math.min(Math.ceil(distance / 7), 12);
              for (let step = 1; step <= steps; step += 1) {
                const progress = step / steps;
                const x = lastPointerPosition.x + dx * progress;
                const y = lastPointerPosition.y + dy * progress;
                addCursorSpark(x, y, Math.min(distance / 25, 2.5));
                if (step % 2 === 0) addCursorSpark(x, y);
              }
            }
          }
          lastPointerPosition = { x: event.clientX, y: event.clientY };
        },
        { passive: true },
      );
      window.addEventListener(
        "pointerdown",
        (event) => {
          if (event.pointerType !== "touch" && event.button === 0) {
            addCursorBurst(event.clientX, event.clientY);
          }
        },
        { passive: true },
      );
    }
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        window.cancelAnimationFrame(animationFrame);
        animationFrame = 0;
      } else {
        startStarfield();
      }
    });

    resizeStarfield();
    startStarfield();
  }
}
