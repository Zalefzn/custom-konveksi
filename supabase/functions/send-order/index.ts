// Supabase Edge Function: kirim notifikasi pesanan ke WhatsApp via Fonnte.
//
// Dipanggil dari website setelah pesanan tersimpan: POST { order_id }.
// Data pesanan dibaca ulang dari database (bukan dari body request), dan pesan
// hanya dikirim SEKALI per pesanan, jadi endpoint ini aman walau dipanggil berulang.
//
// Secrets (supabase secrets set ...):
//   FONNTE_TOKEN               token device Fonnte (wajib)
//   ADMIN_WA                   nomor WA admin penerima pesanan, mis. 6281234567890 (wajib)
//   SEND_CUSTOMER_CONFIRMATION "true" untuk kirim WA konfirmasi ke pembeli (default true)
//   FONNTE_ATTACHMENT          "true" bila paket Fonnte mendukung lampiran gambar (default false)

import { createClient } from "jsr:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_AGE_MS = 30 * 60 * 1000; // hanya pesanan yang dibuat <30 menit lalu

const env = (k: string) => Deno.env.get(k) ?? "";
const flag = (k: string, def: boolean) => {
  const v = env(k).toLowerCase();
  return v ? v === "true" || v === "1" : def;
};

const normalizePhone = (p: string) => {
  const d = p.replace(/\D/g, "");
  return d.startsWith("0") ? "62" + d.slice(1) : d;
};

const formatDate = (v: string | null) =>
  v
    ? new Date(`${v}T00:00:00`).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "-";

const DESIGN_LABELS: Record<string, string> = {
  full: "Upload desain sendiri",
  galeri: "Pilih dari galeri",
  jasa: "Jasa desain",
};

// deno-lint-ignore no-explicit-any
type Order = Record<string, any>;

const orderCode = (o: Order) => "RS-" + String(o.id).slice(0, 8).toUpperCase();

function detailLines(details: Record<string, unknown>) {
  return Object.entries(details || {})
    .map(([k, v]) => {
      const val = Array.isArray(v) ? v.join(", ") : String(v ?? "");
      return val ? `• ${k[0].toUpperCase()}${k.slice(1)}: ${val}` : "";
    })
    .filter(Boolean);
}

function adminMessage(o: Order) {
  const sizes = Object.entries(o.sizes || {})
    .filter(([, n]) => Number(n) > 0)
    .map(([s, n]) => `${s} × ${n}`)
    .join(", ");

  let design = DESIGN_LABELS[o.design_type] || "-";
  if (o.design_type === "full") design += ` (${o.design_urls.length} file)`;
  if (o.design_type === "galeri" && o.gallery_choice) design += ` · ${o.gallery_choice}`;

  const L = o.label;
  const label = L
    ? `${L.type} · "${(L.brand || "BRAND KAMU").toUpperCase()}"` +
      (L.type === "Woven" ? ` · ${L.bgName}/${L.fgName}` : ` · teks ${L.fgName}`)
    : null;

  const lines = [
    `🧾 *PESANAN BARU ${orderCode(o)}*`,
    "",
    "*Produk*",
    `• ${o.product}${o.model ? " · " + o.model : ""}`,
    `• Warna: ${o.color_name || "-"} (${o.color_hex || "-"})`,
    ...detailLines(o.details),
    ...(label ? [`• Label leher: ${label}`] : []),
    `• Desain: ${design}`,
    ...(o.brief ? [`• Brief: ${o.brief}`] : []),
    "",
    "*Jumlah*",
    `• Ukuran: ${sizes || "-"}`,
    `• Total: *${o.total_qty} pcs*`,
    `• Dibutuhkan: ${formatDate(o.needed_date)}`,
    ...(o.note ? [`• Catatan: ${o.note}`] : []),
    "",
    "*Pemesan*",
    `• Nama: ${o.customer_name}`,
    `• WA: wa.me/${normalizePhone(o.customer_phone)}`,
    `• Email: ${o.customer_email}`,
    `• Alamat: ${o.address}`,
  ];

  const files = [
    ...(o.preview_url ? [`• Preview: ${o.preview_url}`] : []),
    ...o.design_urls.map((u: string, i: number) => `• File desain ${i + 1}: ${u}`),
    ...(o.label_logo_url ? [`• Logo label: ${o.label_logo_url}`] : []),
  ];
  if (files.length) lines.push("", "*File*", ...files);

  return lines.join("\n");
}

function customerMessage(o: Order) {
  return [
    `Halo ${o.customer_name} 👋`,
    "",
    `Pesanan kamu *${orderCode(o)}* sudah kami terima:`,
    `• ${o.product}${o.model ? " · " + o.model : ""} — ${o.total_qty} pcs`,
    `• Dibutuhkan: ${formatDate(o.needed_date)}`,
    "",
    "Admin RSCustom akan segera menghubungi kamu untuk konfirmasi harga & detail pesanan. Terima kasih! 🙏",
  ].join("\n");
}

async function fonnteSend(target: string, message: string, fileUrl?: string) {
  const body = new FormData();
  body.set("target", target);
  body.set("message", message);
  body.set("countryCode", "62");
  if (fileUrl) body.set("url", fileUrl);

  const res = await fetch("https://api.fonnte.com/send", {
    method: "POST",
    headers: { Authorization: env("FONNTE_TOKEN") },
    body,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.status !== true) {
    throw new Error(`Fonnte: ${data.reason || data.detail || res.status}`);
  }
  return data;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  if (!env("FONNTE_TOKEN") || !env("ADMIN_WA")) {
    return json({ error: "FONNTE_TOKEN / ADMIN_WA belum diset" }, 500);
  }

  const { order_id } = await req.json().catch(() => ({}));
  if (typeof order_id !== "string" || !UUID_RE.test(order_id)) {
    return json({ error: "order_id tidak valid" }, 400);
  }

  const serviceKey = env("SUPABASE_SERVICE_ROLE_KEY") || env("SERVICE_KEY");
  if (!serviceKey) return json({ error: "Service key tidak tersedia" }, 500);

  const db = createClient(env("SUPABASE_URL"), serviceKey, {
    auth: { persistSession: false },
  });

  // Klaim pesanan secara atomik: hanya request pertama yang lolos.
  const since = new Date(Date.now() - MAX_AGE_MS).toISOString();
  const { data: order, error } = await db
    .from("orders")
    .update({ wa_admin_sent_at: new Date().toISOString() })
    .eq("id", order_id)
    .is("wa_admin_sent_at", null)
    .gte("created_at", since)
    .select()
    .maybeSingle();

  if (error) return json({ error: error.message }, 500);
  if (!order) return json({ ok: true, skipped: true }); // sudah terkirim / tidak ditemukan

  const errors: string[] = [];
  const attach = flag("FONNTE_ATTACHMENT", false) ? order.preview_url : undefined;

  try {
    await fonnteSend(env("ADMIN_WA"), adminMessage(order), attach);
  } catch (e) {
    // bila lampiran gagal, coba lagi tanpa lampiran (link gambar sudah ada di pesan)
    if (attach) {
      try {
        await fonnteSend(env("ADMIN_WA"), adminMessage(order));
      } catch (e2) {
        errors.push(`admin: ${(e2 as Error).message}`);
      }
    } else {
      errors.push(`admin: ${(e as Error).message}`);
    }
  }

  const patch: Record<string, unknown> = {};
  if (errors.length) patch.wa_admin_sent_at = null; // biar bisa dikirim ulang

  if (flag("SEND_CUSTOMER_CONFIRMATION", true) && !order.wa_customer_sent_at) {
    try {
      await fonnteSend(normalizePhone(order.customer_phone), customerMessage(order));
      patch.wa_customer_sent_at = new Date().toISOString();
    } catch (e) {
      errors.push(`pembeli: ${(e as Error).message}`);
    }
  }

  patch.wa_error = errors.length ? errors.join(" | ") : null;
  await db.from("orders").update(patch).eq("id", order_id);

  return json({ ok: errors.length === 0, errors }, errors.length ? 502 : 200);
});
