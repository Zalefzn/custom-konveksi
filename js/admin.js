/* =========================================================
   Dashboard admin pesanan: login + daftar pesanan realtime.
   Realtime memakai Supabase Realtime (WebSocket): setiap INSERT/UPDATE
   di tabel `orders` langsung muncul tanpa refresh.
   ========================================================= */
(() => {
  "use strict";

  const cfg = window.RS_SUPABASE;
  if (!window.supabase || !cfg || /ISI_/.test(cfg.url + cfg.key)) {
    document.getElementById("configError").hidden = false;
    return;
  }
  const sb = window.supabase.createClient(cfg.url, cfg.key);

  const STATUSES = [
    ["baru", "Baru"],
    ["dikonfirmasi", "Dikonfirmasi"],
    ["diproses", "Diproses"],
    ["dikirim", "Dikirim"],
    ["selesai", "Selesai"],
    ["dibatalkan", "Dibatalkan"],
  ];
  const DESIGN_LABELS = { full: "Upload sendiri", galeri: "Galeri", jasa: "Jasa desain" };

  const $ = (id) => document.getElementById(id);
  const loginView = $("loginView");
  const appView = $("appView");
  const listEl = $("orderList");
  const tabsEl = $("statusTabs");
  const liveBadge = $("liveBadge");
  const baseTitle = document.title;

  const orders = new Map(); // id -> order
  let filter = "semua";
  let channel = null;
  let unseen = 0;

  const esc = (s) =>
    String(s ?? "").replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]
    );
  const safeUrl = (u) => (/^https:\/\//.test(u || "") ? esc(u) : "");
  const code = (o) => "RS-" + o.id.slice(0, 8).toUpperCase();
  const waNumber = (p) => {
    const d = String(p).replace(/\D/g, "");
    return d.startsWith("0") ? "62" + d.slice(1) : d;
  };
  const fmtTime = (v) =>
    new Date(v).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
  const fmtDate = (v) =>
    v ? new Date(`${v}T00:00:00`).toLocaleDateString("id-ID", { dateStyle: "long" }) : "-";

  /* ---------- Render ---------- */

  function renderTabs() {
    const all = [...orders.values()];
    const count = (s) => all.filter((o) => o.status === s).length;
    tabsEl.innerHTML = [["semua", "Semua", all.length], ...STATUSES.map(([k, l]) => [k, l, count(k)])]
      .map(
        ([k, l, n]) =>
          `<button type="button" data-filter="${k}" class="${k === filter ? "is-active" : ""}">${l} <b>${n}</b></button>`
      )
      .join("");
  }

  function waBadge(o) {
    if (o.wa_error) return `<span class="order-wa is-error"><i class="fas fa-triangle-exclamation"></i> WA gagal: ${esc(o.wa_error)}</span>`;
    if (o.wa_admin_sent_at) return `<span class="order-wa"><i class="fab fa-whatsapp"></i> Notifikasi WA terkirim</span>`;
    return `<span class="order-wa is-pending"><i class="fas fa-clock"></i> Menunggu notifikasi WA</span>`;
  }

  function cardHtml(o) {
    const sizes = Object.entries(o.sizes || {})
      .filter(([, n]) => n > 0)
      .map(([s, n]) => `${s}×${n}`)
      .join(", ");
    const details = Object.entries(o.details || {}).map(([k, v]) => [
      k[0].toUpperCase() + k.slice(1),
      Array.isArray(v) ? v.join(", ") : v,
    ]);
    const L = o.label;
    const rows = [
      ["Warna", `${o.color_name || "-"} (${o.color_hex || "-"})`],
      ...details,
      ...(L ? [["Label leher", `${L.type} · "${(L.brand || "BRAND KAMU").toUpperCase()}" · ${L.bgName}/${L.fgName}`]] : []),
      ["Desain", (DESIGN_LABELS[o.design_type] || "-") + (o.gallery_choice ? ` · ${o.gallery_choice}` : "")],
      ...(o.brief ? [["Brief", o.brief]] : []),
      ["Ukuran", sizes || "-"],
      ...(o.note ? [["Catatan", o.note]] : []),
      ["Email", o.customer_email],
      ["Alamat", o.address],
    ];
    const files = [o.preview_url, ...(o.design_urls || []), o.label_logo_url].filter((u) => safeUrl(u));
    const preview = safeUrl(o.preview_url);

    return `
      ${preview ? `<img class="order-thumb" src="${preview}" alt="Preview ${code(o)}" loading="lazy" />` : `<div class="order-thumb order-thumb-empty"><i class="fas fa-shirt"></i></div>`}
      <div class="order-info">
        <div class="order-head"><strong>${code(o)}</strong><time datetime="${esc(o.created_at)}">${fmtTime(o.created_at)}</time></div>
        <p class="order-title">${esc(o.product)}${o.model ? " · " + esc(o.model) : ""} — ${o.total_qty} pcs</p>
        <p class="order-meta"><i class="fas fa-user"></i> ${esc(o.customer_name)} · <i class="fas fa-calendar"></i> ${fmtDate(o.needed_date)}</p>
        ${waBadge(o)}
      </div>
      <div class="order-side">
        <select class="status-select" data-id="${o.id}" aria-label="Status ${code(o)}">
          ${STATUSES.map(([k, l]) => `<option value="${k}" ${k === o.status ? "selected" : ""}>${l}</option>`).join("")}
        </select>
        <a class="btn btn-ghost btn-sm" href="https://wa.me/${waNumber(o.customer_phone)}" target="_blank" rel="noopener">
          <i class="fab fa-whatsapp"></i> Chat pembeli
        </a>
      </div>
      <details>
        <summary>Detail pesanan</summary>
        <dl class="order-detail">${rows.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join("")}</dl>
        ${files.length ? `<div class="order-files">${files.map((u) => `<a href="${safeUrl(u)}" target="_blank" rel="noopener"><img src="${safeUrl(u)}" alt="File desain" loading="lazy" /></a>`).join("")}</div>` : ""}
      </details>`;
  }

  function render(highlightId) {
    renderTabs();
    const list = [...orders.values()]
      .filter((o) => filter === "semua" || o.status === filter)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));

    // pertahankan <details> yang sedang terbuka
    const open = new Set([...listEl.querySelectorAll("details[open]")].map((d) => d.closest(".order-card").dataset.id));

    listEl.replaceChildren(
      ...list.map((o) => {
        const card = document.createElement("article");
        card.className = "order-card" + (o.id === highlightId ? " is-new" : "");
        card.dataset.id = o.id;
        card.innerHTML = cardHtml(o);
        if (open.has(o.id)) card.querySelector("details").open = true;
        return card;
      })
    );
    $("emptyState").hidden = list.length > 0;
  }

  /* ---------- Data & realtime ---------- */

  async function loadOrders() {
    const { data, error } = await sb
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) {
      console.error(error);
      return;
    }
    orders.clear();
    data.forEach((o) => orders.set(o.id, o));
    render();
  }

  function setLive(on, text) {
    liveBadge.classList.toggle("is-on", on);
    liveBadge.querySelector("span").textContent = text;
  }

  function beep() {
    try {
      const ac = new AudioContext();
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.frequency.value = 880;
      g.gain.setValueAtTime(0.15, ac.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.4);
      o.connect(g).connect(ac.destination);
      o.start();
      o.stop(ac.currentTime + 0.4);
    } catch (err) {
      /* browser memblokir audio sebelum ada interaksi */
    }
  }

  function subscribe() {
    channel = sb
      .channel("admin-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, ({ eventType, new: row, old }) => {
        if (eventType === "DELETE") {
          if (old?.id && orders.delete(old.id)) render();
          return;
        }
        if (!row?.id) return;
        orders.set(row.id, row);
        if (eventType === "INSERT") {
          beep();
          if (document.hidden) {
            unseen++;
            document.title = `(${unseen}) Pesanan baru · ${baseTitle}`;
          }
          render(row.id);
        } else {
          render();
        }
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setLive(true, "Realtime aktif");
          loadOrders(); // sinkron ulang setelah (re)connect agar tidak ada yang terlewat
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
          setLive(false, "Terputus, menyambung ulang…");
        }
      });
  }

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      unseen = 0;
      document.title = baseTitle;
    }
  });

  tabsEl.addEventListener("click", (e) => {
    const b = e.target.closest("[data-filter]");
    if (!b) return;
    filter = b.dataset.filter;
    render();
  });

  listEl.addEventListener("change", async (e) => {
    const sel = e.target.closest(".status-select");
    if (!sel) return;
    const o = orders.get(sel.dataset.id);
    const prev = o.status;
    sel.disabled = true;
    const { error } = await sb.from("orders").update({ status: sel.value }).eq("id", o.id);
    sel.disabled = false;
    if (error) {
      sel.value = prev;
      alert("Gagal mengubah status: " + error.message);
    }
  });

  /* ---------- Auth ---------- */

  async function showApp(session) {
    const loggedIn = Boolean(session);
    loginView.hidden = loggedIn;
    appView.hidden = !loggedIn;
    if (loggedIn && !channel) {
      subscribe();
    } else if (!loggedIn && channel) {
      await sb.removeChannel(channel);
      channel = null;
      orders.clear();
    }
  }

  $("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const err = $("loginError");
    err.textContent = "";
    const { error } = await sb.auth.signInWithPassword({
      email: $("loginEmail").value.trim(),
      password: $("loginPass").value,
    });
    if (error) err.textContent = "Email atau password salah.";
  });

  $("logoutBtn").addEventListener("click", () => sb.auth.signOut());

  sb.auth.onAuthStateChange((_event, session) => {
    // jalankan di luar callback agar tidak deadlock dengan auth lock supabase-js
    setTimeout(() => showApp(session), 0);
  });
})();
