(() => {
  "use strict";

  const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

  /* =======================================================
     Navbar: scrolled state, mobile menu, active link
     ======================================================= */

  const header = document.querySelector(".site-header");
  const navToggle = document.querySelector(".nav-toggle");

  const onScroll = () => {
    if (header) header.classList.toggle("scrolled", window.scrollY > 20);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  const setNav = (open) => {
    if (!header || !navToggle) return;
    header.classList.toggle("nav-open", open);
    navToggle.setAttribute("aria-expanded", String(open));
    navToggle.setAttribute("aria-label", open ? "Tutup menu" : "Buka menu");
  };

  if (header && navToggle) {
    navToggle.addEventListener("click", () =>
      setNav(!header.classList.contains("nav-open"))
    );
    header
      .querySelectorAll(".nav-menu a")
      .forEach((a) => a.addEventListener("click", () => setNav(false)));
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") setNav(false);
    });
    document.addEventListener("click", (e) => {
      if (header.classList.contains("nav-open") && !header.contains(e.target)) {
        setNav(false);
      }
    });
    window.addEventListener("resize", () => {
      if (window.innerWidth > 900) setNav(false);
    });
  }

  // Menu single page: tandai link sesuai section yang sedang terlihat (hanya di Beranda)
  const currentPage = window.location.pathname.split("/").pop() || "index.html";
  const menuLinks = [...document.querySelectorAll(".menu a")];
  const navCta = document.querySelector(".nav-cta");

  if (navCta && currentPage === "customDesign.html") {
    navCta.setAttribute("aria-current", "page");
  }



  const setActive = (id) =>
    menuLinks.forEach((link) => {
      const on = link.hash === "#" + id;
      link.classList.toggle("active", on);
      if (on) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });

  // halaman detail Tentang Kami: tetap tandai menu "Tentang"
  if (currentPage === "tentang.html") setActive("tentang");
  if (currentPage === "panduan.html") setActive("cara-order");

  if (currentPage === "index.html") {
    const spySections = menuLinks
      .map((l) => document.getElementById(l.hash.slice(1)))
      .filter(Boolean);

    const spy = () => {
      // section aktif = section terakhir yang bagian atasnya sudah melewati 40% layar
      const line = window.innerHeight * 0.4;
      let current = spySections[0];
      spySections.forEach((sec) => {
        if (sec.getBoundingClientRect().top <= line) current = sec;
      });
      // di dasar halaman, tandai section terakhir
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) {
        current = spySections[spySections.length - 1];
      }
      if (current) setActive(current.id);
    };

    window.addEventListener("scroll", spy, { passive: true });
    window.addEventListener("resize", spy);
    spy();
  }

  /* =======================================================
     Scroll animations (only on pages that load AOS)
     ======================================================= */

  if (window.AOS) {
    window.AOS.init({
      duration: 600,
      easing: "ease-out-cubic",
      once: true,
      offset: 40,
    });
  }

  /* =======================================================
     Order wizard (customDesign.html only)
     ======================================================= */

  const wizard = document.getElementById("orderWizard");
  if (wizard) initWizard(wizard);

  function initWizard(wizard) {
    const panels = [...wizard.querySelectorAll(".wizard-panel")];
    const stepper = document.getElementById("stepper");
    const steps = [...stepper.querySelectorAll(".step")];

    const state = {
      step: 0,
      finished: false,
      product: null,
      model: null,
      color: "#ffffff",
      colorName: "Putih",
      designType: null,
      galleryChoice: null,
      brief: "",
      details: null, // { kerah: "O-Neck", tambahan: [...] , ... }
      label: {
        type: "Woven",
        brand: "",
        sub: "Made in Indonesia",
        bg: "#1d1d1d",
        bgName: "Hitam",
        fg: "#ffffff",
        fgName: "Putih",
        showSize: true,
        logo: null,
      },
      detailsFor: null,
    };

    const MODELS = {
      Kaos: [
        { name: "Kaos Pendek", desc: "Model klasik untuk harian", art: "tee" },
        { name: "Kaos Lengan Panjang", desc: "Lebih tertutup & rapi", art: "long" },
        { name: "Kaos Reglan", desc: "Lengan beda warna, sporty", art: "raglan" },
        { name: "Kaos Oversize", desc: "Potongan longgar kekinian", art: "oversize" },
      ],
      Jaket: [
        { name: "Bomber", desc: "Kerah & rib elastis", art: "bomber" },
        { name: "Jaket Hoodie", desc: "Bertudung + kantong depan", art: "hoodie" },
        { name: "Windbreaker", desc: "Ringan & tahan angin", art: "windbreaker" },
        { name: "Sweater", desc: "Hangat tanpa resleting", art: "sweater" },
      ],
      Topi: [
        { name: "Snapback", desc: "Brim datar, strap belakang", art: "snapback" },
        { name: "Trucker", desc: "Belakang jaring, adem", art: "trucker" },
        { name: "Topi Polos", desc: "Simpel & mudah dipadukan", art: "cap" },
      ],
      Jersey: [
        { name: "Jersey Bola", desc: "Kerah V dengan stripe", art: "bola" },
        { name: "Jersey Basket", desc: "Tanpa lengan, leluasa", art: "basket" },
        { name: "Jersey eSports", desc: "Panel dinamis full print", art: "esports" },
        { name: "Jersey Custom", desc: "Nama & nomor sesukamu", art: "custom" },
      ],
    };

    // Ilustrasi garis tiap model (viewBox 0 0 100 100).
    // .m-body mengikuti warna kaos terpilih, .m-accent memakai warna brand.
    const SHAPE = {
      tee: "M35 15Q50 23 65 15L82 24 90 40 78 45 74 38V88H26V38L22 45 10 40 18 24Z",
      long: "M35 15Q50 23 65 15L80 22 92 72 82 75 74 42V88H26V42L18 75 8 72 20 22Z",
      over: "M37 13Q50 21 63 13L88 22 95 47 81 51 78 42V91H22V42L19 51 5 47 12 22Z",
      tank: "M36 12Q50 32 64 12L71 13Q70 32 77 40V88H23V40Q30 32 29 13Z",
      crown: "M14 64Q16 30 46 28Q72 30 76 64Z",
    };
    const body = (d) => `<path class="m-body" d="${d}"/>`;
    const acc = (d) => `<path class="m-accent" d="${d}"/>`;
    const line = (d) => `<path class="m-line" d="${d}"/>`;
    const collar = line("M35 15Q50 23 65 15");
    const capBase = body(SHAPE.crown) + line("M46 28V64") + '<circle class="m-accent" cx="46" cy="28" r="2.5"/>';
    const ART = {
      tee: body(SHAPE.tee) + collar,
      long: body(SHAPE.long) + collar,
      raglan:
        body(SHAPE.tee) +
        acc("M38 17 35 15 18 24 10 40 22 45 26 38Z") +
        acc("M62 17 65 15 82 24 90 40 78 45 74 38Z") +
        collar,
      oversize: body(SHAPE.over) + line("M37 13Q50 21 63 13") + line("M22 42 12 22M78 42 88 22"),
      bomber:
        body(SHAPE.long) +
        acc("M26 82H74V88H26Z") +
        acc("M8 72 18 75 17 80 7 77Z") +
        acc("M92 72 82 75 83 80 93 77Z") +
        acc("M35 15Q50 23 65 15L62 20Q50 27 38 20Z") +
        line("M50 22V82"),
      hoodie:
        body(SHAPE.long) +
        acc("M35 15Q37 1 50 1Q63 1 65 15Q50 25 35 15Z") +
        line("M36 62H64L68 78H32Z") +
        line("M45 21 44 34M55 21 56 34"),
      windbreaker:
        body(SHAPE.long) +
        acc("M26 32H74V46H26Z") +
        acc("M19 32 31 32 29 46 16 44Z") +
        acc("M81 32 69 32 71 46 84 44Z") +
        line("M50 20V88") +
        collar,
      sweater:
        body(SHAPE.long) +
        acc("M35 15Q50 23 65 15L63 19Q50 26 37 19Z") +
        line("M26 83H74M27 85.5H73") +
        line("M9 68 19 71M91 68 81 71"),
      snapback: capBase + acc("M70 64H97V69.5H70Z") + acc("M22 46h18v10H22Z"),
      trucker:
        capBase +
        line("M18 52 28 42M17 60 33 44M23 63 40 46M31 63 44 50M39 63 45 57") +
        acc("M70 64Q86 62 97 70L95 74Q84 67 70 69Z"),
      cap: capBase + body("M70 64Q86 62 97 70L95 74Q84 67 70 69Z"),
      bola:
        body(SHAPE.tee) +
        acc("M43 30H47V88H43ZM53 30H57V88H53Z") +
        acc("M41 16 50 29 59 16 56 15 50 24 44 15Z"),
      basket:
        body(SHAPE.tank) +
        line("M36 12Q50 32 64 12") +
        '<text class="m-num" x="50" y="66" text-anchor="middle">23</text>',
      esports:
        body(SHAPE.tee) +
        acc("M26 62 74 40V52L26 74Z") +
        acc("M78 45 74 38 82 30 90 40Z") +
        collar,
      custom:
        body(SHAPE.tee) +
        collar +
        acc("M38 34H62V40H38Z") +
        '<text class="m-num" x="50" y="70" text-anchor="middle">10</text>',
    };

    const GALLERY = [
      { name: "Bara Prima — Hitam", src: "./assets/desain-kaos.png" },
      { name: "Bara Prima — Merah", src: "./assets/desain-kaos (1).png" },
    ];

    const DESIGN_LABELS = {
      full: "Full Order",
      galeri: "Galeri Desain",
      jasa: "Jasa Desain",
    };

    const escapeHtml = (s) =>
      s.replace(/[&<>"']/g, (c) =>
        ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]
      );

    /* ---------- Navigation ---------- */

    function showError(msg) {
      const el = panels[state.step]?.querySelector(".form-error");
      if (!el) return;
      el.innerHTML = msg
        ? `<i class="fas fa-circle-exclamation"></i> ${msg}`
        : "";
      el.classList.toggle("is-visible", Boolean(msg));
    }

    function scrollToWizard() {
      const top = stepper.getBoundingClientRect().top;
      const offset = (header ? header.offsetHeight : 0) + 16;
      if (top < offset || top > window.innerHeight * 0.4) {
        window.scrollTo({ top: window.scrollY + top - offset, behavior: "smooth" });
      }
    }

    function goTo(index) {
      showError("");
      state.step = index;
      panels.forEach((p, i) => p.classList.toggle("is-active", i === index));
      steps.forEach((s, i) => {
        s.classList.toggle("is-active", i === index);
        s.classList.toggle("is-done", i < index);
      });
      const stepCount = document.getElementById("stepCount");
      if (stepCount) stepCount.textContent = index + 1;
      if (index === 1) {
        renderDetails();
        drawShirt();
      }
      if (index === 3) renderSummary();
      scrollToWizard();
    }

    const validators = [
      () => {
        if (!state.product) return "Pilih jenis produk terlebih dahulu.";
        if (!state.model) return `Pilih model ${state.product} terlebih dahulu.`;
        return "";
      },
      () => {
        if (!state.designType) return "Pilih metode desain terlebih dahulu.";
        if (state.designType === "full" && designs.length === 0)
          return "Upload minimal satu file desain.";
        if (state.designType === "galeri" && !state.galleryChoice)
          return "Pilih salah satu desain dari galeri.";
        return "";
      },
      () => {
        if (getTotal() === 0) return "Isi jumlah minimal 1 pcs pada salah satu ukuran.";
        if (!dateInput.value) {
          dateInput.classList.add("is-invalid");
          return "Pilih tanggal pesanan dibutuhkan.";
        }
        if (dateInput.value < dateInput.min) {
          dateInput.classList.add("is-invalid");
          return "Tanggal tidak boleh sebelum hari ini.";
        }
        return "";
      },
      () => validateCheckout(),
    ];

    wizard.addEventListener("click", (e) => {
      if (e.target.closest("[data-next]")) {
        const err = validators[state.step]();
        if (err) return showError(err);
        goTo(state.step + 1);
      } else if (e.target.closest("[data-prev]")) {
        goTo(state.step - 1);
      }
    });

    steps.forEach((s, i) =>
      s.addEventListener("click", () => {
        if (!state.finished && i < state.step) goTo(i);
      })
    );

    /* ---------- Step 1: product & model ---------- */

    /* ---------- Detail produk: kerah, lengan, tambahan ---------- */

    // Ilustrasi close-up (viewBox 0 -10 60 50)
    const TOP = "M2 40V16L18 6Q30 18 42 6L58 16V40Z";
    const btnDots = (ys) => ys.map((y) => `<circle class="m-accent" cx="30" cy="${y}" r="1.6"/>`).join("");
    const capBack = body("M6 36Q6 4 30 4Q54 4 54 36Z") + '<path class="m-hole" d="M20 36Q20 22 30 22Q40 22 40 36Z"/>';
    const DART = {
      oneck: body(TOP) + acc("M18 6Q30 18 42 6L40 3.5Q30 14 20 3.5Z"),
      vneck: body("M2 40V16L18 6L30 24 42 6 58 16V40Z") + acc("M18 6 30 24 42 6 39 5 30 19 21 5Z"),
      polo:
        body(TOP) + line("M27 13V32H33V13") + btnDots([19, 26]) +
        acc("M18 6 13 17 28 15 30 8Z") + acc("M42 6 47 17 32 15 30 8Z"),
      henley: body(TOP) + acc("M18 6Q30 18 42 6L40 3.5Q30 14 20 3.5Z") + line("M27 13V30H33V13") + btnDots([18, 24]),
      hood: body(TOP) + acc("M18 6Q19-8 30-8Q41-8 42 6Q30 16 18 6Z") + line("M26 12 25 23M34 12 35 23"),
      rib: body(TOP) + acc("M18 6Q30 18 42 6L41 1Q30 13 19 1Z") + line("M30 13V40"),
      stand: body("M2 40V16L18 6H42L58 16V40Z") + acc("M19-3H41V7H19Z") + line("M30-3V40"),
      shirt: body(TOP) + acc("M18 6 13 17 28 15 30 8Z") + acc("M42 6 47 17 32 15 30 8Z") + line("M30 14V40"),
      snap: capBack + acc("M17 30H43V35H17Z") + '<circle class="m-body" cx="23" cy="32.5" r="1.3"/><circle class="m-body" cx="30" cy="32.5" r="1.3"/><circle class="m-body" cx="37" cy="32.5" r="1.3"/>',
      strap: capBack + acc("M15 30H45V34H15Z") + line("M34 27.5H40V36.5H34Z"),
      velcro: capBack + acc("M17 30H43V35H17Z") + line("M20 34 23 31M25 34 28 31M30 34 33 31M35 34 38 31"),
    };

    const COLLAR_COLORS = [
      ["Sama dengan badan", null],
      ["Putih", "#ffffff"],
      ["Hitam", "#1d1d1d"],
      ["Merah", "#ff4b4b"],
      ["Navy", "#1e2a5a"],
      ["Kuning", "#f2c230"],
    ];

    const DETAILS = {
      Kaos: [
        { key: "kerah", label: "Jenis Kerah", type: "art", options: [["O-Neck", "oneck"], ["V-Neck", "vneck"], ["Polo", "polo"], ["Henley", "henley"]] },
        { key: "warnaKerah", label: "Warna Kerah", type: "color", options: COLLAR_COLORS },
        { key: "lengan", label: "Ujung Lengan", type: "pill", options: ["Standar", "Rib / Manset", "Lipat (Cuff)"] },
        { key: "tambahan", label: "Tambahan", type: "multi", options: ["Saku dada", "Label leher custom", "Hangtag"] },
      ],
      Jersey: [
        { key: "kerah", label: "Jenis Kerah", type: "art", options: [["O-Neck", "oneck"], ["V-Neck", "vneck"], ["Polo", "polo"], ["Henley", "henley"]] },
        { key: "warnaKerah", label: "Warna Kerah & List", type: "color", options: COLLAR_COLORS },
        { key: "lengan", label: "Ujung Lengan", type: "pill", options: ["Standar", "Rib", "List kontras"] },
        { key: "tambahan", label: "Tambahan", type: "multi", options: ["Nama & nomor punggung", "Logo sponsor", "Label leher custom"] },
      ],
      Jaket: [
        { key: "kerah", label: "Jenis Kerah", type: "art", options: [["Hoodie", "hood"], ["Rib", "rib"], ["Stand Collar", "stand"], ["Kerah Kemeja", "shirt"]] },
        { key: "resleting", label: "Resleting", type: "pill", options: ["Full zip", "Half zip", "Tanpa (pullover)"] },
        { key: "lengan", label: "Ujung Lengan", type: "pill", options: ["Rib / Manset", "Standar"] },
        { key: "tambahan", label: "Tambahan", type: "multi", options: ["Saku samping", "Saku dalam", "Label custom"] },
      ],
      Topi: [
        { key: "penutup", label: "Penutup Belakang", type: "art", options: [["Snap", "snap"], ["Strap Gesper", "strap"], ["Velcro", "velcro"]] },
        { key: "logo", label: "Teknik Logo", type: "pill", options: ["Sablon", "Bordir", "Patch"] },
        { key: "tambahan", label: "Tambahan", type: "multi", options: ["Bordir samping", "Label dalam"] },
      ],
    };

    // Kerah awal mengikuti model bila relevan (mis. Bomber -> Rib)
    const MODEL_DEFAULTS = {
      Bomber: { kerah: "Rib" },
      "Jaket Hoodie": { kerah: "Hoodie" },
      Windbreaker: { kerah: "Stand Collar" },
      Sweater: { kerah: "Rib", resleting: "Tanpa (pullover)" },
      "Jersey Bola": { kerah: "V-Neck" },
    };

    const detailOptionsEl = document.getElementById("detailOptions");
    const detailHint = document.getElementById("detailHint");
    const specChips = document.getElementById("specChips");

    function detailText(group) {
      const v = state.details[group.key];
      if (group.type === "multi") return v.length ? v.join(", ") : "-";
      return v;
    }

    function renderSpecChips() {
      if (!specChips || !state.details) return;
      const groups = DETAILS[state.product] || [];
      specChips.innerHTML = "";
      groups.forEach((g) => {
        const text = detailText(g);
        if (text === "-") return;
        const chip = document.createElement("span");
        chip.className = "spec-chip";
        chip.textContent = `${g.label}: ${text}`;
        specChips.appendChild(chip);
      });
    }

    function renderDetails() {
      const groups = DETAILS[state.product];
      if (!groups || !detailOptionsEl) return;

      if (state.detailsFor !== `${state.product}|${state.model}`) {
        const defaults = MODEL_DEFAULTS[state.model] || {};
        state.details = {};
        groups.forEach((g) => {
          if (g.type === "multi") state.details[g.key] = [];
          else if (g.type === "art") state.details[g.key] = defaults[g.key] || g.options[0][0];
          else if (g.type === "color") state.details[g.key] = g.options[0][0];
          else state.details[g.key] = defaults[g.key] || g.options[0];
        });
        state.detailsFor = `${state.product}|${state.model}`;
      }

      detailHint.textContent =
        state.product === "Topi" ? "Penutup, logo & tambahan" : "Kerah, lengan & tambahan";
      detailOptionsEl.style.setProperty("--m-body", state.color);
      detailOptionsEl.innerHTML = "";

      groups.forEach((g) => {
        const row = document.createElement("div");
        row.className = `detail-row is-${g.type}`;
        const label = document.createElement("span");
        label.className = "detail-label";
        label.textContent = g.label;
        const opts = document.createElement("div");
        opts.className = "detail-options";
        opts.setAttribute("role", "group");
        opts.setAttribute("aria-label", g.label);

        const isOn = (value) =>
          g.type === "multi" ? state.details[g.key].includes(value) : state.details[g.key] === value;

        const options = g.type === "art" || g.type === "color" ? g.options : g.options.map((o) => [o]);
        options.forEach(([value, extra]) => {
          const b = document.createElement("button");
          b.type = "button";
          b.dataset.value = value;
          if (g.type === "art") {
            b.className = "detail-art";
            b.innerHTML = `<svg viewBox="0 -10 60 50" aria-hidden="true">${DART[extra]}</svg><span></span>`;
            b.querySelector("span").textContent = value;
          } else if (g.type === "color") {
            b.className = "detail-color" + (extra ? "" : " is-same");
            b.style.setProperty("--c", extra || state.color);
            b.title = value;
            b.setAttribute("aria-label", value);
          } else {
            b.className = g.type === "multi" ? "detail-pill is-check" : "detail-pill";
            b.textContent = value;
          }
          b.classList.toggle("is-selected", isOn(value));
          b.setAttribute("aria-pressed", String(isOn(value)));

          b.addEventListener("click", () => {
            if (g.type === "multi") {
              const list = state.details[g.key];
              const i = list.indexOf(value);
              if (i >= 0) list.splice(i, 1);
              else list.push(value);
            } else {
              state.details[g.key] = value;
            }
            opts.querySelectorAll("button").forEach((o) => {
              const on = isOn(o.dataset.value);
              o.classList.toggle("is-selected", on);
              o.setAttribute("aria-pressed", String(on));
            });
            if (g.type === "color") label.dataset.value = value;
            renderSpecChips();
            if (g.key === "tambahan") updateLabelVisibility(true);
          });
          opts.appendChild(b);
        });

        if (g.type === "color") label.dataset.value = state.details[g.key];
        row.append(label, opts);
        detailOptionsEl.appendChild(row);
      });

      renderSpecChips();
      updateLabelVisibility();
    }

    /* ---------- Desain label leher ---------- */

    const LABEL_OPTIONS = ["Label leher custom", "Label custom"];
    const LABEL_BG = [["Hitam", "#1d1d1d"], ["Putih", "#ffffff"], ["Merah", "#ff4b4b"], ["Navy", "#1e2a5a"], ["Krem", "#f3e3c3"]];
    const LABEL_FG = [["Putih", "#ffffff"], ["Hitam", "#1d1d1d"], ["Emas", "#d4a72c"], ["Merah", "#ff4b4b"]];

    const labelDesigner = document.getElementById("labelDesigner");
    const lbl = labelDesigner && {
      svg: document.getElementById("labelSvg"),
      bg: document.getElementById("lblBg"),
      stitch: document.getElementById("lblStitch"),
      logo: document.getElementById("lblLogo"),
      brand: document.getElementById("lblBrand"),
      sub: document.getElementById("lblSub"),
      size: document.getElementById("lblSize"),
      badge: document.getElementById("labelTypeBadge"),
      brandInput: document.getElementById("labelBrand"),
      subInput: document.getElementById("labelSub"),
      sizeInput: document.getElementById("labelShowSize"),
      logoInput: document.getElementById("labelLogo"),
      logoText: document.getElementById("labelLogoText"),
      logoRemove: document.getElementById("labelLogoRemove"),
      bgField: document.getElementById("labelBgField"),
    };

    const labelEnabled = () =>
      Boolean(state.details && state.details.tambahan && state.details.tambahan.some((t) => LABEL_OPTIONS.includes(t)));

    function renderLabel() {
      if (!lbl) return;
      const L = state.label;
      const woven = L.type === "Woven";
      lbl.svg.style.setProperty("--shirt", state.color);
      lbl.svg.style.setProperty("--lbl-bg", L.bg);
      lbl.svg.style.setProperty("--lbl-fg", L.fg);
      lbl.svg.classList.toggle("is-tagless", !woven);
      lbl.badge.textContent = woven ? "Woven · dijahit" : "Sablon · tagless";
      lbl.bgField.hidden = !woven;

      lbl.brand.textContent = (L.brand || "BRAND KAMU").toUpperCase();
      lbl.sub.textContent = L.sub;
      lbl.size.textContent = L.showSize ? "M" : "";

      // tata letak menyesuaikan ada/tidaknya logo
      const hasLogo = Boolean(L.logo);
      if (hasLogo) lbl.logo.setAttribute("href", L.logo);
      else lbl.logo.removeAttribute("href");
      lbl.logo.style.display = hasLogo ? "" : "none";
      lbl.brand.setAttribute("y", hasLogo ? 70 : 64);
      lbl.sub.setAttribute("y", hasLogo ? 80 : 75);
      lbl.size.setAttribute("y", hasLogo ? 90 : 87);
    }

    function swatchRow(containerId, list, key, nameKey) {
      const wrap = document.getElementById(containerId);
      if (!wrap) return;
      wrap.innerHTML = "";
      list.forEach(([name, hex]) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "detail-color";
        b.style.setProperty("--c", hex);
        b.title = name;
        b.setAttribute("aria-label", name);
        const on = state.label[key] === hex;
        b.classList.toggle("is-selected", on);
        b.setAttribute("aria-pressed", String(on));
        b.addEventListener("click", () => {
          state.label[key] = hex;
          state.label[nameKey] = name;
          wrap.querySelectorAll("button").forEach((o) => {
            o.classList.toggle("is-selected", o === b);
            o.setAttribute("aria-pressed", String(o === b));
          });
          renderLabel();
          renderSpecChips();
        });
        wrap.appendChild(b);
      });
    }

    function updateLabelVisibility(scroll = false) {
      if (!labelDesigner) return;
      const on = labelEnabled();
      const wasHidden = labelDesigner.hidden;
      labelDesigner.hidden = !on;
      if (on) renderLabel();
      if (on && wasHidden && scroll) {
        labelDesigner.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }

    if (lbl) {
      swatchRow("labelBgColors", LABEL_BG, "bg", "bgName");
      swatchRow("labelFgColors", LABEL_FG, "fg", "fgName");
      lbl.subInput.value = state.label.sub;

      document.querySelectorAll("#labelType button").forEach((b, _, all) =>
        b.addEventListener("click", () => {
          state.label.type = b.dataset.value;
          all.forEach((o) => {
            o.classList.toggle("is-selected", o === b);
            o.setAttribute("aria-pressed", String(o === b));
          });
          renderLabel();
          renderSpecChips();
        })
      );

      lbl.brandInput.addEventListener("input", () => {
        state.label.brand = lbl.brandInput.value.trim();
        renderLabel();
      });
      lbl.subInput.addEventListener("input", () => {
        state.label.sub = lbl.subInput.value.trim();
        renderLabel();
      });
      lbl.sizeInput.addEventListener("change", () => {
        state.label.showSize = lbl.sizeInput.checked;
        renderLabel();
      });

      lbl.logoInput.addEventListener("change", () => {
        const file = lbl.logoInput.files[0];
        lbl.logoInput.value = "";
        if (!file) return;
        if (!/^image\/(png|jpeg|svg\+xml)$/.test(file.type)) return showError("Logo label harus berupa PNG, JPG, atau SVG.");
        if (file.size > 2 * 1024 * 1024) return showError("Ukuran logo label maksimal 2 MB.");
        const reader = new FileReader();
        reader.onload = () => {
          state.label.logo = reader.result;
          lbl.logoText.textContent = file.name.length > 18 ? file.name.slice(0, 15) + "…" : file.name;
          lbl.logoRemove.hidden = false;
          showError("");
          renderLabel();
        };
        reader.readAsDataURL(file);
      });

      lbl.logoRemove.addEventListener("click", () => {
        state.label.logo = null;
        lbl.logoText.textContent = "Upload logo";
        lbl.logoRemove.hidden = true;
        renderLabel();
      });
    }

    const productBtns = wizard.querySelectorAll("#productOptions .choice");
    const modelWrapper = document.getElementById("modelWrapper");
    const modelOptions = document.getElementById("modelOptions");
    const modelTitle = document.getElementById("modelTitle");

    productBtns.forEach((btn) => {
      btn.setAttribute("aria-pressed", "false");
      btn.addEventListener("click", () => {
        if (state.product === btn.dataset.product) return;
        productBtns.forEach((b) => {
          b.classList.toggle("is-selected", b === btn);
          b.setAttribute("aria-pressed", String(b === btn));
        });
        state.product = btn.dataset.product;
        state.model = null;
        modelTitle.textContent = `Pilih Model ${state.product}`;
        modelOptions.replaceChildren(
          ...MODELS[state.product].map(({ name, desc, art }) => {
            const card = document.createElement("button");
            card.type = "button";
            card.className = "model-card";
            card.setAttribute("aria-pressed", "false");
            card.innerHTML = `
              <span class="model-check" aria-hidden="true"></span>
              <span class="model-art"><svg viewBox="0 0 100 100" aria-hidden="true">${ART[art]}</svg></span>
              <span class="model-name"></span>
              <span class="model-desc"></span>`;
            card.querySelector(".model-name").textContent = name;
            card.querySelector(".model-desc").textContent = desc;
            card.addEventListener("click", () => {
              modelOptions.querySelectorAll(".model-card").forEach((c) => {
                c.classList.toggle("is-selected", c === card);
                c.setAttribute("aria-pressed", String(c === card));
              });
              state.model = name;
              showError("");
            });
            return card;
          })
        );
        modelOptions.dataset.count = MODELS[state.product].length;
        modelWrapper.hidden = false;
        showError("");
      });
    });

    // Pre-select product from Beranda link, e.g. customDesign.html?produk=Kaos
    const preselect = new URLSearchParams(window.location.search).get("produk");
    const preBtn = [...productBtns].find((b) => b.dataset.product === preselect);
    if (preBtn) {
      preBtn.click();
      window.addEventListener("load", scrollToWizard);
    }

    /* ---------- Step 2: canvas preview ---------- */

    const canvas = document.getElementById("shirtCanvas");
    const ctx = canvas.getContext("2d");
    const deleteBtn = document.getElementById("deleteDesignBtn");
    const resetBtn = document.getElementById("resetDesignBtn");
    const downloadBtn = document.getElementById("downloadDesignBtn");
    const colorNameEl = document.getElementById("colorName");
    const methodContainer = document.getElementById("designFormContainer");

    const HANDLE = 28; // in canvas pixels
    const designs = [];
    let active = null;
    let mode = null; // "drag" | "resize" | null
    let dragOffset = { x: 0, y: 0 };

    const shirtImg = new Image();
    shirtImg.onload = () => drawShirt();
    shirtImg.src = "./assets/kaos.png";

    function drawShirt(showUi = true) {
      const W = canvas.width;
      const H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      if (shirtImg.complete && shirtImg.naturalWidth) {
        ctx.fillStyle = state.color;
        ctx.fillRect(0, 0, W, H);
        ctx.globalCompositeOperation = "multiply";
        ctx.drawImage(shirtImg, 0, 0, W, H);
        ctx.globalCompositeOperation = "destination-in";
        ctx.drawImage(shirtImg, 0, 0, W, H);
        ctx.globalCompositeOperation = "source-over";
      }

      designs.forEach((d, i) => {
        ctx.drawImage(d.img, d.x, d.y, d.w, d.h);
        if (showUi && i === active) {
          ctx.save();
          ctx.setLineDash([8, 6]);
          ctx.lineWidth = 2;
          ctx.strokeStyle = "#ff4b4b";
          ctx.strokeRect(d.x, d.y, d.w, d.h);
          ctx.restore();

          const hx = d.x + d.w - HANDLE / 2;
          const hy = d.y + d.h - HANDLE / 2;
          ctx.fillStyle = "#ff4b4b";
          ctx.fillRect(hx, hy, HANDLE, HANDLE);
          ctx.lineWidth = 3;
          ctx.strokeStyle = "#ffffff";
          ctx.strokeRect(hx, hy, HANDLE, HANDLE);
        }
      });

      deleteBtn.disabled = active === null;
      resetBtn.disabled = designs.length === 0;
    }

    function renderThumbs() {
      const list = document.getElementById("thumbList");
      if (!list) return;
      list.replaceChildren(
        ...designs.map((d, i) => {
          const b = document.createElement("button");
          b.type = "button";
          b.className = "thumb" + (i === active ? " is-active" : "");
          b.title = `Desain ${i + 1}`;
          const img = document.createElement("img");
          img.src = d.src;
          img.alt = `Desain ${i + 1}`;
          b.append(img);
          b.addEventListener("click", () => {
            active = i;
            drawShirt();
            renderThumbs();
          });
          return b;
        })
      );
    }

    function addDesign(src) {
      const img = new Image();
      img.onload = () => {
        const ratio = img.width / img.height;
        let w = canvas.width * 0.22;
        let h = w / ratio;
        if (h > canvas.height * 0.35) {
          h = canvas.height * 0.35;
          w = h * ratio;
        }
        const n = designs.length;
        // Default position: chest of the front shirt (left half of the mockup)
        const x = clamp(canvas.width * 0.255 - w / 2 + n * 16, 0, canvas.width - w);
        const y = clamp(canvas.height * 0.38 - h / 2 + n * 16, 0, canvas.height - h);
        designs.push({ img, src, x, y, w, h, ratio });
        active = designs.length - 1;
        drawShirt();
        renderThumbs();
        showError("");
      };
      img.src = src;
    }

    function handleFiles(fileList) {
      const files = [...fileList].filter((f) => /^image\/(png|jpe?g)$/.test(f.type));
      if (files.length === 0) {
        showError("Format file harus JPG atau PNG.");
        return;
      }
      files.forEach((f) => addDesign(URL.createObjectURL(f)));
    }

    function removeActive() {
      if (active === null) return;
      designs.splice(active, 1);
      active = null;
      drawShirt();
      renderThumbs();
    }

    const toCanvasPoint = (e) => {
      const r = canvas.getBoundingClientRect();
      return {
        x: (e.clientX - r.left) * (canvas.width / r.width),
        y: (e.clientY - r.top) * (canvas.height / r.height),
      };
    };
    const hitHandle = (d, p) =>
      Math.abs(p.x - (d.x + d.w)) <= HANDLE && Math.abs(p.y - (d.y + d.h)) <= HANDLE;
    const hitBody = (d, p) =>
      p.x >= d.x && p.x <= d.x + d.w && p.y >= d.y && p.y <= d.y + d.h;

    canvas.addEventListener("pointerdown", (e) => {
      const p = toCanvasPoint(e);
      mode = null;
      if (active !== null && hitHandle(designs[active], p)) {
        mode = "resize";
      } else {
        active = null;
        for (let i = designs.length - 1; i >= 0; i--) {
          if (hitBody(designs[i], p)) {
            active = i;
            mode = "drag";
            break;
          }
        }
      }
      if (mode) {
        const d = designs[active];
        dragOffset = { x: p.x - d.x, y: p.y - d.y };
        canvas.setPointerCapture(e.pointerId);
        e.preventDefault();
      }
      drawShirt();
      renderThumbs();
    });

    canvas.addEventListener("pointermove", (e) => {
      const p = toCanvasPoint(e);
      if (!mode) {
        let cursor = "default";
        if (active !== null && hitHandle(designs[active], p)) cursor = "nwse-resize";
        else if (designs.some((d) => hitBody(d, p))) cursor = "move";
        canvas.style.cursor = cursor;
        return;
      }
      const d = designs[active];
      if (mode === "drag") {
        d.x = clamp(p.x - dragOffset.x, 0, canvas.width - d.w);
        d.y = clamp(p.y - dragOffset.y, 0, canvas.height - d.h);
      } else {
        // keep aspect ratio while resizing
        const maxW = Math.min(canvas.width - d.x, (canvas.height - d.y) * d.ratio);
        d.w = clamp(p.x - d.x, 40, maxW);
        d.h = d.w / d.ratio;
      }
      drawShirt();
    });

    const endPointer = () => {
      mode = null;
    };
    canvas.addEventListener("pointerup", endPointer);
    canvas.addEventListener("pointercancel", endPointer);

    document.addEventListener("keydown", (e) => {
      if (state.step !== 1 || active === null) return;
      if (e.target.closest("input, textarea, select, [contenteditable]")) return;
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        removeActive();
      }
    });

    deleteBtn.addEventListener("click", removeActive);
    resetBtn.addEventListener("click", () => {
      designs.length = 0;
      active = null;
      drawShirt();
      renderThumbs();
    });

    downloadBtn.addEventListener("click", () => {
      drawShirt(false);
      try {
        const a = document.createElement("a");
        a.download = `desain-${(state.product || "kaos").toLowerCase()}.png`;
        a.href = canvas.toDataURL("image/png");
        a.click();
      } catch (err) {
        showError("Preview tidak bisa diunduh. Buka halaman lewat server lokal (http://), bukan file://.");
      }
      drawShirt();
    });

    const colorDot = document.getElementById("colorDot");
    const swatchBtns = [...wizard.querySelectorAll("#colorOptions button.swatch")];
    const customSwatch = wizard.querySelector(".swatch-custom");
    const customInput = document.getElementById("customColor");

    function applyColor(hex, name, activeEl) {
      swatchBtns.forEach((o) => {
        o.classList.toggle("is-active", o === activeEl);
        o.setAttribute("aria-pressed", String(o === activeEl));
      });
      if (customSwatch) customSwatch.classList.toggle("is-active", activeEl === customSwatch);
      state.color = hex;
      state.colorName = name;
      colorNameEl.textContent = name;
      if (colorDot) colorDot.style.background = hex;
      // ilustrasi model ikut warna kaos terpilih
      modelOptions.style.setProperty("--m-body", hex);
      if (detailOptionsEl) {
        detailOptionsEl.style.setProperty("--m-body", hex);
        detailOptionsEl.querySelectorAll(".detail-color.is-same").forEach((b) => b.style.setProperty("--c", hex));
      }
      if (labelEnabled()) renderLabel();
      drawShirt();
    }

    swatchBtns.forEach((sw) => {
      sw.setAttribute("aria-pressed", String(sw.classList.contains("is-active")));
      sw.addEventListener("click", () => applyColor(sw.dataset.color, sw.dataset.name, sw));
    });

    if (customInput) {
      customInput.addEventListener("input", () => {
        const hex = customInput.value;
        customSwatch.style.setProperty("--c", hex);
        applyColor(hex, `Custom (${hex.toUpperCase()})`, customSwatch);
      });
    }

    if (colorDot) colorDot.style.background = state.color;

    /* ---------- Step 2: design method ---------- */

    const typeBtns = wizard.querySelectorAll("#designTypeOptions .method");
    typeBtns.forEach((btn) =>
      btn.addEventListener("click", () => {
        typeBtns.forEach((b) => b.classList.toggle("is-selected", b === btn));
        state.designType = btn.dataset.type;
        showError("");
        renderMethod(state.designType);
      })
    );

    function renderMethod(type) {
      if (type === "full") {
        methodContainer.innerHTML = `
          <label class="upload-zone" id="uploadZone">
            <i class="fas fa-cloud-arrow-up"></i>
            <strong>Klik atau seret file ke sini</strong>
            <span>JPG / PNG · bisa lebih dari satu file</span>
            <input type="file" accept="image/png,image/jpeg" multiple hidden />
          </label>
          <div class="thumb-list" id="thumbList"></div>`;
        const zone = methodContainer.querySelector("#uploadZone");
        const input = zone.querySelector("input");
        input.addEventListener("change", () => {
          handleFiles(input.files);
          input.value = "";
        });
        ["dragenter", "dragover"].forEach((ev) =>
          zone.addEventListener(ev, (e) => {
            e.preventDefault();
            zone.classList.add("is-dragover");
          })
        );
        ["dragleave", "drop"].forEach((ev) =>
          zone.addEventListener(ev, (e) => {
            e.preventDefault();
            zone.classList.remove("is-dragover");
          })
        );
        zone.addEventListener("drop", (e) => handleFiles(e.dataTransfer.files));
        renderThumbs();
      } else if (type === "galeri") {
        methodContainer.innerHTML = `
          <div class="gallery-grid">
            ${GALLERY.map(
              (g, i) => `
              <button type="button" class="gallery-item${state.galleryChoice === g.name ? " is-selected" : ""}" data-index="${i}">
                <img src="${g.src}" alt="${g.name}" loading="lazy" />
                <span>${g.name}</span>
              </button>`
            ).join("")}
          </div>`;
        const items = methodContainer.querySelectorAll(".gallery-item");
        items.forEach((item) =>
          item.addEventListener("click", () => {
            items.forEach((x) => x.classList.toggle("is-selected", x === item));
            state.galleryChoice = GALLERY[item.dataset.index].name;
            showError("");
          })
        );
      } else {
        methodContainer.innerHTML = `
          <div class="info-box">
            <i class="fas fa-circle-info"></i>
            <div>Tim desainer kami akan membuatkan desain sesuai brief kamu, lalu mengirim draf via WhatsApp untuk disetujui.</div>
          </div>
          <div class="field">
            <label for="designBrief">Brief Desain <small>(opsional)</small></label>
            <textarea id="designBrief" class="input" placeholder="Ceritakan konsep, teks, warna, atau referensi desain yang kamu mau..."></textarea>
          </div>`;
        const brief = methodContainer.querySelector("#designBrief");
        brief.value = state.brief;
        brief.addEventListener("input", () => {
          state.brief = brief.value;
        });
      }
    }

    /* ---------- Step 3: sizes & details ---------- */

    const sizeCards = [...wizard.querySelectorAll("#sizeGrid .size-card")];
    const totalEl = document.getElementById("totalQty");
    const dateInput = document.getElementById("orderDate");
    const noteInput = document.getElementById("orderNote");

    const getQty = (card) =>
      Math.max(0, parseInt(card.querySelector("input").value, 10) || 0);
    const getTotal = () => sizeCards.reduce((sum, c) => sum + getQty(c), 0);

    function updateTotal() {
      sizeCards.forEach((c) => c.classList.toggle("has-value", getQty(c) > 0));
      totalEl.textContent = getTotal();
    }

    sizeCards.forEach((card) => {
      const input = card.querySelector("input");
      card.querySelectorAll("[data-qty]").forEach((b) =>
        b.addEventListener("click", () => {
          input.value = Math.max(0, getQty(card) + Number(b.dataset.qty));
          updateTotal();
          showError("");
        })
      );
      input.addEventListener("input", updateTotal);
      input.addEventListener("blur", () => {
        input.value = getQty(card);
        updateTotal();
      });
    });

    const today = new Date();
    today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
    dateInput.min = today.toISOString().slice(0, 10);
    dateInput.addEventListener("input", () => dateInput.classList.remove("is-invalid"));

    /* ---------- Step 4: checkout ---------- */

    const nameInput = document.getElementById("custName");
    const phoneInput = document.getElementById("custPhone");
    const emailInput = document.getElementById("custEmail");
    const addressInput = document.getElementById("custAddress");
    const summaryEl = document.getElementById("orderSummary");
    const summaryTotal = document.getElementById("summaryTotal");

    [nameInput, phoneInput, emailInput, addressInput].forEach((el) =>
      el.addEventListener("input", () => el.classList.remove("is-invalid"))
    );

    function validateCheckout() {
      const rules = [
        [nameInput, (v) => v.trim().length >= 2, "Nama pemesan wajib diisi."],
        [
          phoneInput,
          (v) => /^(\+?62|0)8\d{7,12}$/.test(v.replace(/[\s-]/g, "")),
          "Nomor WhatsApp tidak valid (contoh: 081234567890).",
        ],
        [
          emailInput,
          (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()),
          "Format email tidak valid.",
        ],
        [
          addressInput,
          (v) => v.trim().length >= 10,
          "Alamat pengiriman wajib diisi dengan lengkap.",
        ],
      ];
      let firstError = "";
      rules.forEach(([el, isValid, msg]) => {
        const bad = !isValid(el.value);
        el.classList.toggle("is-invalid", bad);
        if (bad && !firstError) {
          firstError = msg;
          el.focus();
        }
      });
      return firstError;
    }

    const formatDate = (v) =>
      v
        ? new Date(`${v}T00:00:00`).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })
        : "-";

    // Preview desain di checkout: render kanvas tanpa kotak seleksi lalu salin sebagai gambar
    const summaryPreview = document.getElementById("summaryPreview");
    const summaryPreviewWrap = document.getElementById("summaryPreviewWrap");
    const summaryPreviewNote = document.getElementById("summaryPreviewNote");

    function renderCheckoutPreview() {
      if (!summaryPreview) return;
      const galleryItem =
        state.designType === "galeri" && GALLERY.find((g) => g.name === state.galleryChoice);

      if (galleryItem) {
        // desain galeri berupa mockup jadi, tampilkan gambarnya langsung
        summaryPreview.src = galleryItem.src;
        summaryPreviewWrap.hidden = false;
      } else {
        drawShirt(false);
        try {
          summaryPreview.src = canvas.toDataURL("image/png");
          summaryPreviewWrap.hidden = false;
        } catch (err) {
          summaryPreviewWrap.hidden = true; // mis. dibuka via file:// sehingga kanvas "tainted"
        }
        drawShirt();
      }

      let note = "";
      if (state.designType === "jasa") note = "Desain akan dibuatkan tim kami sesuai brief kamu.";
      else if (galleryItem) note = `Desain galeri: ${galleryItem.name}`;
      else if (state.designType === "full" && designs.length === 0) note = "Belum ada file desain.";
      summaryPreviewNote.textContent = note;
      summaryPreviewNote.hidden = !note;
    }

    document.getElementById("editDesignBtn")?.addEventListener("click", () => goTo(1));

    const summaryLabel = document.getElementById("summaryLabel");

    function renderSummaryLabel() {
      if (!summaryLabel) return;
      const on = labelEnabled() && lbl;
      summaryLabel.hidden = !on;
      if (!on) return;
      renderLabel();
      const clone = lbl.svg.cloneNode(true);
      clone.removeAttribute("id");
      // id unik untuk clipPath agar tidak bentrok dengan SVG asli
      clone.querySelectorAll("[id]").forEach((el) => el.removeAttribute("id"));
      const clip = clone.querySelector("clipPath");
      clip.id = "neckClipSummary";
      clone.querySelector("g[clip-path]").setAttribute("clip-path", "url(#neckClipSummary)");
      summaryLabel.querySelector(".summary-label-art").replaceChildren(clone);
    }

    function renderSummary() {
      renderCheckoutPreview();
      renderSummaryLabel();
      const sizes = sizeCards
        .filter((c) => getQty(c) > 0)
        .map((c) => `${c.dataset.size} × ${getQty(c)}`)
        .join(", ");

      let designInfo = DESIGN_LABELS[state.designType] || "-";
      if (state.designType === "full") designInfo += ` (${designs.length} file)`;
      if (state.designType === "galeri") designInfo += ` · ${state.galleryChoice}`;

      const rows = [
        ["Produk", `${state.product} · ${state.model}`],
        [
          "Warna",
          `<span class="dot-color" style="background:${state.color}"></span>${state.colorName}`,
        ],
        ...(DETAILS[state.product] || []).map((g) => [g.label, escapeHtml(detailText(g))]),
        ...(labelEnabled()
          ? [[
              "Label Leher",
              escapeHtml(
                `${state.label.type} · "${(state.label.brand || "BRAND KAMU").toUpperCase()}"` +
                  (state.label.type === "Woven" ? ` · ${state.label.bgName}/${state.label.fgName}` : ` · teks ${state.label.fgName}`) +
                  (state.label.logo ? " · + logo" : "")
              ),
            ]]
          : []),
        ["Desain", designInfo],
        ["Ukuran", sizes || "-"],
        ["Dibutuhkan", formatDate(dateInput.value)],
      ];
      const note = noteInput.value.trim();
      if (note) rows.push(["Catatan", escapeHtml(note)]);

      summaryEl.innerHTML = rows
        .map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`)
        .join("");
      summaryTotal.textContent = getTotal();
    }

    /* ---------- Kirim pesanan: Supabase + WhatsApp (Fonnte) ---------- */

    const finishBtn = document.getElementById("finishBtn");
    const finishBtnHtml = finishBtn.innerHTML;
    const BUCKET = "order-designs";
    const MAX_FILE = 5 * 1024 * 1024;

    function getSupabase() {
      const cfg = window.RS_SUPABASE;
      if (!window.supabase || !cfg || /ISI_/.test(cfg.url + cfg.key)) return null;
      if (!getSupabase.client) getSupabase.client = window.supabase.createClient(cfg.url, cfg.key);
      return getSupabase.client;
    }

    const canvasBlob = () =>
      new Promise((resolve) => {
        drawShirt(false);
        try {
          canvas.toBlob((b) => {
            drawShirt();
            resolve(b);
          }, "image/png");
        } catch (err) {
          drawShirt();
          resolve(null); // kanvas "tainted" (file://)
        }
      });

    const srcToBlob = async (src) => {
      try {
        const res = await fetch(src);
        return res.ok ? await res.blob() : null;
      } catch (err) {
        return null;
      }
    };

    async function uploadImage(sb, orderId, name, blob) {
      if (!blob || blob.size > MAX_FILE || !/^image\/(png|jpe?g)$/.test(blob.type)) return null;
      const ext = blob.type === "image/png" ? "png" : "jpg";
      const path = `${orderId}/${name}.${ext}`;
      const { error } = await sb.storage
        .from(BUCKET)
        .upload(path, blob, { contentType: blob.type, upsert: false });
      if (error) throw error;
      return sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
    }

    async function submitOrder(sb) {
      const orderId = crypto.randomUUID();
      const galleryItem =
        state.designType === "galeri" && GALLERY.find((g) => g.name === state.galleryChoice);

      // 1) upload gambar
      const previewBlob = galleryItem ? await srcToBlob(galleryItem.src) : await canvasBlob();
      const previewUrl = await uploadImage(sb, orderId, "preview", previewBlob);

      const designUrls = [];
      if (state.designType === "full") {
        for (let i = 0; i < designs.length; i++) {
          const url = await uploadImage(sb, orderId, `desain-${i + 1}`, await srcToBlob(designs[i].src));
          if (url) designUrls.push(url);
        }
      }

      const label = labelEnabled() ? { ...state.label, logo: undefined } : null;
      const labelLogoUrl =
        label && state.label.logo
          ? await uploadImage(sb, orderId, "logo-label", await srcToBlob(state.label.logo))
          : null;

      // 2) simpan pesanan (tanpa .select(): pengunjung memang tidak punya akses baca)
      const { error } = await sb.from("orders").insert({
        id: orderId,
        product: state.product,
        model: state.model,
        color_name: state.colorName,
        color_hex: state.color,
        details: state.details || {},
        label,
        design_type: state.designType,
        gallery_choice: state.galleryChoice,
        brief: state.brief || null,
        sizes: Object.fromEntries(sizeCards.map((c) => [c.dataset.size, getQty(c)])),
        total_qty: getTotal(),
        needed_date: dateInput.value || null,
        note: noteInput.value.trim() || null,
        customer_name: nameInput.value.trim(),
        customer_phone: phoneInput.value.replace(/[\s-]/g, ""),
        customer_email: emailInput.value.trim(),
        address: addressInput.value.trim(),
        preview_url: previewUrl,
        design_urls: designUrls,
        label_logo_url: labelLogoUrl,
      });
      if (error) throw error;

      // 3) kirim WA. Pesanan sudah tersimpan, jadi kegagalan di sini tidak membatalkan pesanan.
      const { error: fnError } = await sb.functions.invoke("send-order", {
        body: { order_id: orderId },
      });
      if (fnError) console.warn("[RSCustom] Notifikasi WA gagal:", fnError);

      return orderId;
    }

    /* ---------- Status pesanan realtime (WebSocket / Supabase Realtime) ---------- */

    const STATUS_TEXT = {
      baru: "Pesanan diterima, menunggu konfirmasi admin",
      dikonfirmasi: "Dikonfirmasi admin",
      diproses: "Sedang diproduksi",
      dikirim: "Dalam pengiriman",
      selesai: "Selesai",
      dibatalkan: "Dibatalkan",
    };

    function watchOrderStatus(sb, orderId) {
      const box = document.getElementById("orderStatus");
      const text = document.getElementById("orderStatusText");
      const live = document.getElementById("orderStatusLive");
      if (!box) return;
      document.getElementById("orderCode").textContent = "RS-" + orderId.slice(0, 8).toUpperCase();
      box.hidden = false;

      const setStatus = (s) => {
        box.dataset.status = s;
        text.textContent = STATUS_TEXT[s] || s;
      };
      setStatus("baru");

      sb.channel(`order-${orderId}`)
        .on("broadcast", { event: "status" }, ({ payload }) => setStatus(payload.status))
        .subscribe((s) => {
          const on = s === "SUBSCRIBED";
          live.classList.toggle("is-on", on);
          live.title = on ? "Terhubung realtime" : "Menghubungkan…";
        });
    }

    finishBtn.addEventListener("click", async () => {
      const err = validateCheckout();
      if (err) return showError(err);
      showError("");

      const sb = getSupabase();
      if (!sb) {
        return showError("Sistem pemesanan belum dikonfigurasi. Silakan hubungi admin via WhatsApp.");
      }

      finishBtn.disabled = true;
      finishBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Mengirim…';
      let orderId;
      try {
        orderId = await submitOrder(sb);
      } catch (e) {
        console.error("[RSCustom] Gagal mengirim pesanan:", e);
        finishBtn.disabled = false;
        finishBtn.innerHTML = finishBtnHtml;
        return showError("Pesanan gagal dikirim. Periksa koneksi internet lalu coba lagi.");
      }

      state.finished = true;
      panels.forEach((p) => p.classList.remove("is-active"));
      steps.forEach((s) => {
        s.classList.remove("is-active");
        s.classList.add("is-done");
      });
      document.getElementById("successName").textContent = nameInput.value.trim();
      document.getElementById("orderSuccess").hidden = false;
      watchOrderStatus(sb, orderId);
      scrollToWizard();
    });

    drawShirt();
  }
})();

/* =========================================================
   Testimoni: slider otomatis
   ========================================================= */
(function () {
  "use strict";

  const slider = document.getElementById("testiSlider");
  if (!slider) return;

  const track = slider.querySelector(".testi-track");
  const cards = [...track.children];
  const dotsWrap = slider.querySelector(".testi-dots");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const DELAY = 4500;

  let index = 0;
  let timer = null;

  const perView = () =>
    parseInt(getComputedStyle(slider).getPropertyValue("--per-view"), 10) || 1;
  const maxIndex = () => Math.max(0, cards.length - perView());
  const step = () => {
    const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    return cards[0].getBoundingClientRect().width + gap;
  };

  function buildDots() {
    dotsWrap.innerHTML = "";
    for (let i = 0; i <= maxIndex(); i++) {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.setAttribute("role", "tab");
      dot.setAttribute("aria-label", `Testimoni ${i + 1}`);
      dot.addEventListener("click", () => {
        go(i);
        restart();
      });
      dotsWrap.appendChild(dot);
    }
  }

  function go(i) {
    const max = maxIndex();
    index = i > max ? 0 : i < 0 ? max : i;
    track.style.transform = `translateX(${-index * step()}px)`;

    // kartu tengah (atau satu-satunya) yang terlihat diberi aksen merah
    const featured = index + Math.floor(perView() / 2);
    cards.forEach((c, n) => {
      c.classList.toggle("is-featured", n === featured);
      c.setAttribute("aria-hidden", n < index || n >= index + perView() ? "true" : "false");
    });
    [...dotsWrap.children].forEach((d, n) =>
      d.setAttribute("aria-selected", n === index ? "true" : "false")
    );
  }

  function start() {
    if (reduceMotion || timer) return;
    timer = setInterval(() => go(index + 1), DELAY);
  }

  function stop() {
    clearInterval(timer);
    timer = null;
  }

  function restart() {
    stop();
    start();
  }

  slider.querySelectorAll(".testi-btn").forEach((btn) =>
    btn.addEventListener("click", () => {
      go(index + Number(btn.dataset.dir));
      restart();
    })
  );

  // jeda saat kursor / fokus berada di slider
  slider.addEventListener("mouseenter", stop);
  slider.addEventListener("mouseleave", start);
  slider.addEventListener("focusin", stop);
  slider.addEventListener("focusout", start);
  document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));

  // geser (swipe) dengan jari / mouse
  let startX = 0;
  let dx = 0;
  let dragging = false;

  track.addEventListener("pointerdown", (e) => {
    if (e.button !== 0) return;
    dragging = true;
    startX = e.clientX;
    dx = 0;
    track.classList.add("is-dragging");
    track.setPointerCapture(e.pointerId);
    stop();
  });

  track.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    dx = e.clientX - startX;
    track.style.transform = `translateX(${-index * step() + dx}px)`;
  });

  const endDrag = () => {
    if (!dragging) return;
    dragging = false;
    track.classList.remove("is-dragging");
    if (Math.abs(dx) > 50) go(index + (dx < 0 ? 1 : -1));
    else go(index);
    start();
  };
  track.addEventListener("pointerup", endDrag);
  track.addEventListener("pointercancel", endDrag);

  let lastPerView = perView();
  window.addEventListener("resize", () => {
    if (perView() !== lastPerView) {
      lastPerView = perView();
      buildDots();
    }
    go(Math.min(index, maxIndex()));
  });

  buildDots();
  go(0);
  start();
})();

/* =========================================================
   Tombol melayang: scroll to top + chatbot
   ========================================================= */
(function () {
  "use strict";

  const WA_LINK = "index.html#kontak"; // ganti dengan https://wa.me/62xxxxxxxxxx bila nomor sudah ada
  const ORDER_LINK = "customDesign.html";

  const root = document.createElement("div");
  root.className = "fab-root";
  root.innerHTML = `
    <section class="chat-panel" id="chatPanel" role="dialog" aria-modal="false" aria-labelledby="chatTitle" aria-hidden="true">
      <header class="chat-head">
        <span class="chat-avatar"><i class="fas fa-robot"></i></span>
        <div>
          <strong id="chatTitle">RS Assistant</strong>
          <small>Online · biasanya membalas instan</small>
        </div>
        <button type="button" class="chat-close" aria-label="Tutup chat"><i class="fas fa-xmark"></i></button>
      </header>
      <div class="chat-body" id="chatBody" aria-live="polite"></div>
      <div class="chat-quick" id="chatQuick"></div>
      <form class="chat-form" id="chatForm" autocomplete="off">
        <input type="text" id="chatInput" placeholder="Tulis pertanyaanmu..." aria-label="Tulis pesan" maxlength="300" />
        <button type="submit" aria-label="Kirim pesan"><i class="fas fa-paper-plane"></i></button>
      </form>
      <p class="chat-note">Asisten otomatis · untuk detail pesanan hubungi admin</p>
    </section>
    <div class="fab-stack">
      <button type="button" class="fab fab-top" id="scrollTopBtn" aria-label="Kembali ke atas">
        <svg viewBox="0 0 36 36" aria-hidden="true"><circle cx="18" cy="18" r="16" pathLength="100"/></svg>
        <i class="fas fa-arrow-up"></i>
      </button>
      <button type="button" class="fab fab-chat" id="chatToggle" aria-label="Buka chat bantuan" aria-expanded="false" aria-controls="chatPanel">
        <i class="fas fa-comments"></i><i class="fas fa-xmark"></i>
        <span class="fab-badge" aria-hidden="true"></span>
      </button>
    </div>`;
  document.body.appendChild(root);

  /* ---------- Scroll to top ---------- */

  const topBtn = root.querySelector("#scrollTopBtn");

  function onScroll() {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const pct = max > 0 ? Math.min(window.scrollY / max, 1) : 0;
    topBtn.classList.toggle("is-visible", window.scrollY > 400);
    topBtn.style.setProperty("--progress-offset", String(100 - pct * 100));
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  topBtn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

  /* ---------- Chatbot (berbasis kata kunci, tanpa server) ---------- */

  const panel = root.querySelector("#chatPanel");
  const toggle = root.querySelector("#chatToggle");
  const body = root.querySelector("#chatBody");
  const quick = root.querySelector("#chatQuick");
  const form = root.querySelector("#chatForm");
  const input = root.querySelector("#chatInput");
  const badge = root.querySelector(".fab-badge");

  const QUICK = ["Cara order", "Harga", "Pesan satuan?", "Format file", "Pengiriman", "Hubungi admin"];

  const RULES = [
    {
      keys: ["satuan", "minimal", "minimum", "min order", "1 pcs", "grosir", "lusin"],
      reply: "Bisa pesan satuan maupun grosir, cocok untuk personal, komunitas, sampai brand.",
    },
    {
      keys: ["lama", "berapa hari", "estimasi", "kapan jadi", "durasi", "proses produksi", "deadline"],
      reply: "Lama produksi tergantung jumlah dan antrean pesanan. Isi tanggal dibutuhkan saat order, admin akan mengonfirmasi estimasinya.",
    },
    {
      keys: ["cara order", "cara pesan", "gimana pesan", "bagaimana pesan", "order", "pesan", "langkah"],
      reply: `Cara order cukup 4 langkah:
1. Pilih produk & model
2. Atur desain (warna, upload/galeri/jasa desain)
3. Isi jumlah per ukuran & tanggal
4. Checkout dengan data pemesan

Mulai di halaman <a href="${ORDER_LINK}">Custom Design</a> ya!`,
    },
    {
      keys: ["harga", "biaya", "berapa", "price", "murah", "ongkos produksi"],
      reply: `Harga tergantung jenis produk, bahan, jumlah, dan area sablon. Setelah kamu kirim pesanan lewat <a href="${ORDER_LINK}">Custom Design</a>, admin akan mengirim rincian harga via WhatsApp.`,
    },
    {
      keys: ["format", "file", "png", "jpg", "jpeg", "resolusi", "upload"],
      reply: "File desain yang diterima: JPG dan PNG. Untuk hasil terbaik gunakan PNG dengan latar transparan dan resolusi tinggi.",
    },
    {
      keys: ["belum punya desain", "tidak punya desain", "galeri", "jasa desain", "dibuatkan", "desainer"],
      reply: "Belum punya desain? Pilih metode Galeri Desain untuk memakai desain contoh, atau Jasa Desain agar tim kami membuatkan sesuai brief kamu.",
    },
    {
      keys: ["kirim", "pengiriman", "ongkir", "luar kota", "ekspedisi", "alamat"],
      reply: "Kami melayani pengiriman ke seluruh Indonesia. Ongkos kirim menyesuaikan alamat dan berat paket, nanti dikonfirmasi admin.",
    },
    {
      keys: ["gagal", "rusak", "cacat", "garansi", "jaminan", "retur", "cetak ulang"],
      reply: "Tenang, ada jaminan cetak ulang jika terjadi kegagalan produksi dari pihak kami.",
    },
    {
      keys: ["warna", "color"],
      reply: "Tersedia 19+ pilihan warna kaos — dari netral (putih, abu, hitam, krem), cerah (merah, oranye, tosca, pink), sampai gelap (maroon, navy, army). Ada juga pilihan warna bebas, dan semuanya bisa dicoba langsung di live preview.",
    },
    {
      keys: ["ukuran", "size", "xl", "xxl"],
      reply: "Ukuran tersedia dari S sampai XXXL, dan kamu bisa mengisi jumlah untuk tiap ukuran sekaligus.",
    },
    {
      keys: ["produk", "jaket", "topi", "jersey", "hoodie", "kaos", "bomber"],
      reply: `Produk yang bisa dicustom: Kaos, Jaket (bomber, hoodie, windbreaker), Topi (snapback, trucker, topi polos), dan Jersey. Lihat semua di <a href="index.html#produk">Produk Kami</a>.`,
    },
    {
      keys: ["admin", "whatsapp", "wa", "kontak", "hubungi", "cs", "manusia", "telepon"],
      reply: `Siap! Kamu bisa langsung ngobrol dengan admin kami lewat <a href="${WA_LINK}">kontak kami</a>.`,
    },
    {
      keys: ["halo", "hai", "hi", "hello", "pagi", "siang", "sore", "malam", "assalam"],
      reply: "Halo juga! 👋 Ada yang bisa aku bantu soal kaos, jaket, topi, atau jersey custom?",
    },
    {
      keys: ["terima kasih", "makasih", "thanks", "thx", "oke", "ok", "sip"],
      reply: "Sama-sama! 😊 Kalau ada pertanyaan lain, tanya aja ya.",
    },
  ];

  const FALLBACK = `Maaf, aku belum paham pertanyaan itu 🙏 Coba pilih topik di bawah, atau hubungi admin lewat <a href="${WA_LINK}">kontak kami</a>.`;

  function answer(text) {
    const q = ` ${text.toLowerCase()} `;
    // kata kunci harus diawali batas kata; kata pendek (<= 3 huruf) harus utuh
    const match = (k) =>
      new RegExp(`[^a-z0-9]${k}${k.length <= 3 ? "[^a-z0-9]" : ""}`).test(q);
    const hit = RULES.find((r) => r.keys.some(match));
    return hit ? hit.reply : FALLBACK;
  }

  function scrollChat() {
    body.scrollTop = body.scrollHeight;
  }

  function addMsg(content, who) {
    const el = document.createElement("div");
    el.className = `chat-msg ${who}`;
    // pesan pengguna selalu sebagai teks biasa; balasan bot berasal dari daftar di atas
    if (who === "user") el.textContent = content;
    else el.innerHTML = content;
    body.appendChild(el);
    scrollChat();
  }

  function botReply(text) {
    const typing = document.createElement("div");
    typing.className = "chat-msg bot chat-typing";
    typing.innerHTML = "<span></span><span></span><span></span>";
    body.appendChild(typing);
    scrollChat();
    setTimeout(() => {
      typing.remove();
      addMsg(answer(text), "bot");
    }, 650);
  }

  function send(text) {
    const value = text.trim();
    if (!value) return;
    addMsg(value, "user");
    botReply(value);
  }

  QUICK.forEach((label) => {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = label;
    b.addEventListener("click", () => send(label));
    quick.appendChild(b);
  });

  let greeted = false;

  function setChat(open) {
    root.classList.toggle("chat-open", open);
    panel.setAttribute("aria-hidden", String(!open));
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Tutup chat bantuan" : "Buka chat bantuan");
    if (open) {
      badge.hidden = true;
      if (!greeted) {
        greeted = true;
        addMsg("Halo! Aku RS Assistant 👋\nAku bisa bantu jawab seputar cara order, harga, format file, dan pengiriman. Mau tanya apa?", "bot");
      }
      setTimeout(() => input.focus(), 250);
    }
  }

  toggle.addEventListener("click", () => setChat(!root.classList.contains("chat-open")));
  root.querySelector(".chat-close").addEventListener("click", () => {
    setChat(false);
    toggle.focus();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && root.classList.contains("chat-open")) setChat(false);
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    send(input.value);
    input.value = "";
  });

  // tutup panel saat tautan di dalam chat diklik (mis. pindah ke section lain)
  body.addEventListener("click", (e) => {
    if (e.target.closest("a")) setChat(false);
  });
})();

/* =========================================================
   Panduan ukuran: tab produk + pilih ukuran -> update diagram
   ========================================================= */
(function () {
  "use strict";

  const table = document.getElementById("sizeTable");
  const dataEl = document.getElementById("sizeChartData");
  if (!table || !dataEl) return;

  const charts = JSON.parse(dataEl.textContent);
  const tabs = [...document.querySelectorAll(".size-tab")];
  const rows = [...table.tBodies[0].rows];
  const dimA = document.getElementById("dimA");
  const dimB = document.getElementById("dimB");
  const picked = document.getElementById("sizePicked");

  let chart = "kaos";
  let row = 1;

  function flash(el) {
    el.classList.remove("is-updated");
    void el.getBBox(); // restart animasi
    el.classList.add("is-updated");
  }

  function render() {
    const c = charts[chart];
    rows.forEach((tr, i) => {
      tr.querySelector('[data-col="w"]').textContent = c.w[i];
      tr.querySelector('[data-col="l"]').textContent = c.l[i];
      tr.classList.toggle("is-active", i === row);
      tr.setAttribute("aria-selected", String(i === row));
    });
    dimA.textContent = `A · ${c.w[row]} cm`;
    dimB.textContent = `B · ${c.l[row]} cm`;
    picked.textContent = rows[row].cells[0].textContent;
    flash(dimA);
    flash(dimB);
  }

  tabs.forEach((tab) =>
    tab.addEventListener("click", () => {
      chart = tab.dataset.chart;
      tabs.forEach((t) => {
        const on = t === tab;
        t.classList.toggle("is-active", on);
        t.setAttribute("aria-selected", String(on));
      });
      render();
    })
  );

  rows.forEach((tr, i) => {
    tr.tabIndex = 0;
    tr.addEventListener("click", () => {
      row = i;
      render();
    });
    tr.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        row = i;
        render();
      }
    });
  });

  render();
})();

/* =========================================================
   Tentang Kami: garis timeline proses terisi mengikuti scroll
   ========================================================= */
(function () {
  "use strict";

  const zz = document.getElementById("zigzag");
  if (!zz) return;

  const items = [...zz.querySelectorAll(".zz-item")];
  let ticking = false;

  function update() {
    ticking = false;
    const rect = zz.getBoundingClientRect();
    const line = window.innerHeight * 0.6; // titik acuan: 60% tinggi layar
    const progress = Math.min(Math.max((line - rect.top) / rect.height, 0), 1);
    zz.style.setProperty("--zz-progress", progress.toFixed(3));

    items.forEach((item) => {
      const dot = item.querySelector(".zz-dot").getBoundingClientRect();
      item.classList.toggle("is-reached", dot.top + dot.height / 2 <= line);
    });
  }

  const onScroll = () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  update();
})();

/* =========================================================
   Panduan: daftar isi mengikuti scroll + progres baca
   ========================================================= */
(function () {
  "use strict";

  const toc = document.getElementById("tocList");
  if (!toc) return;

  const links = [...toc.querySelectorAll("a")];
  const blocks = links.map((a) => document.querySelector(a.hash)).filter(Boolean);
  const bar = document.getElementById("tocProgress");
  const content = document.querySelector(".guide-content");
  let ticking = false;

  function update() {
    ticking = false;
    const line = window.innerHeight * 0.3;
    let current = blocks[0];
    blocks.forEach((b) => {
      if (b.getBoundingClientRect().top <= line) current = b;
    });
    links.forEach((a) => {
      const on = current && a.hash === "#" + current.id;
      a.classList.toggle("is-active", on);
      if (on) {
        a.setAttribute("aria-current", "true");
        // di layar kecil daftar isi berupa bar geser: pastikan link aktif terlihat
        if (toc.scrollWidth > toc.clientWidth) {
          toc.scrollTo({ left: a.offsetLeft - 24, behavior: "smooth" });
        }
      } else {
        a.removeAttribute("aria-current");
      }
    });

    if (bar && content) {
      const r = content.getBoundingClientRect();
      const pct = Math.min(Math.max((window.innerHeight * 0.5 - r.top) / r.height, 0), 1);
      bar.style.width = `${(pct * 100).toFixed(1)}%`;
    }
  }

  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    },
    { passive: true }
  );
  window.addEventListener("resize", update);
  update();
})();
