// Edge Function "Website" — verstuurt formulieren van deekmanenterprises.com naar info@ via Resend.
// Aanmaken in Supabase met de naam: Website   (Verify JWT: UIT)
// Secrets die gebruikt worden:
//   RESEND_API_KEY   (verplicht, bestaat al in het Leerpuls-project)
//   NOTIFY_EMAIL     (optioneel, standaard info@deekmanenterprises.com)
//   SITE_MAIL_FROM   (optioneel, standaard "Deekman Enterprises <noreply@deekmanenterprises.com>")
//   SITE_ORIGINS     (optioneel, komma-gescheiden lijst van toegestane websites)

const NOTIFY = Deno.env.get("NOTIFY_EMAIL") || "info@deekmanenterprises.com";
const FROM = Deno.env.get("SITE_MAIL_FROM") || "Deekman Enterprises <noreply@deekmanenterprises.com>";
const ORIGINS = (Deno.env.get("SITE_ORIGINS") ||
  "https://deekmanenterprises.com,https://www.deekmanenterprises.com,https://deekman-enterprises.github.io")
  .split(",").map((s) => s.trim()).filter(Boolean);

// Eenvoudige rem op misbruik: max 10 berichten per IP per uur (per draaiende instantie)
const hits = new Map<string, number[]>();
function tooMany(ip: string): boolean {
  const now = Date.now();
  const list = (hits.get(ip) || []).filter((t) => now - t < 3600_000);
  list.push(now);
  hits.set(ip, list);
  return list.length > 10;
}

function cors(origin: string | null): Record<string, string> {
  const allowed = origin && (ORIGINS.includes(origin) || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin));
  return {
    "Access-Control-Allow-Origin": allowed ? origin! : ORIGINS[0],
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "content-type",
    "Vary": "Origin",
  };
}

function json(body: unknown, status: number, headers: Record<string, string>) {
  return new Response(JSON.stringify(body), { status, headers: { ...headers, "Content-Type": "application/json" } });
}

function clean(v: unknown, max = 2000): string {
  return String(v ?? "").replace(/\r/g, "").trim().slice(0, max);
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

async function mail(to: string, subject: string, htmlBody: string, replyTo?: string) {
  const key = Deno.env.get("RESEND_API_KEY");
  if (!key) throw new Error("RESEND_API_KEY ontbreekt");
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: FROM, to: [to], subject, html: htmlBody, ...(replyTo ? { reply_to: replyTo } : {}) }),
  });
  if (!r.ok) throw new Error(`Resend ${r.status}: ${await r.text()}`);
}

function wrap(title: string, inner: string): string {
  return `<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#12172B">
<div style="background:#12172B;color:#F6F5F1;padding:20px 24px;border-radius:12px 12px 0 0;font-weight:bold;font-size:18px">Deekman Enterprises</div>
<div style="background:#ffffff;border:1px solid #E3E1D9;border-top:0;padding:24px;border-radius:0 0 12px 12px">
<h2 style="margin:0 0 16px;font-size:20px">${esc(title)}</h2>${inner}</div></div>`;
}

function rows(pairs: [string, string][]): string {
  return `<table style="border-collapse:collapse;width:100%;font-size:15px">${pairs
    .filter(([, v]) => v)
    .map(([k, v]) =>
      `<tr><td style="padding:8px 12px 8px 0;color:#4A5068;vertical-align:top;white-space:nowrap">${esc(k)}</td><td style="padding:8px 0;white-space:pre-wrap">${esc(v)}</td></tr>`
    ).join("")}</table>`;
}

Deno.serve(async (req) => {
  const headers = cors(req.headers.get("origin"));
  if (req.method === "OPTIONS") return new Response("ok", { headers });
  if (req.method !== "POST") return json({ ok: false, error: "method" }, 405, headers);

  let b: Record<string, unknown>;
  try { b = await req.json(); } catch { return json({ ok: false, error: "json" }, 400, headers); }

  // Honeypot: robots vullen dit verborgen veld in. Doe alsof het gelukt is.
  if (clean(b.website)) return json({ ok: true }, 200, headers);

  const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "onbekend";
  if (tooMany(ip)) return json({ ok: false, error: "rate" }, 429, headers);

  const type = clean(b.type, 20);
  const email = clean(b.email, 200);
  if (!EMAIL_RE.test(email)) return json({ ok: false, error: "email" }, 400, headers);

  try {
    if (type === "contact") {
      const naam = clean(b.naam, 120);
      const bericht = clean(b.bericht, 5000);
      if (!naam || !bericht) return json({ ok: false, error: "velden" }, 400, headers);
      const onderwerp = clean(b.onderwerp, 100);
      await mail(NOTIFY, `Nieuw bericht via de website: ${onderwerp || "contact"} (${naam})`,
        wrap("Nieuw contactformulier", rows([
          ["Naam", naam], ["Bedrijf", clean(b.bedrijf, 160)], ["E-mail", email], ["Onderwerp", onderwerp], ["Bericht", bericht],
        ]) + `<p style="margin:20px 0 0;color:#4A5068;font-size:14px">Beantwoord deze mail om direct te reageren.</p>`), email);
      await mail(email, "We hebben je bericht ontvangen",
        wrap(`Bedankt, ${naam}!`, `<p style="line-height:1.6">We hebben je bericht ontvangen en nemen zo snel mogelijk contact met je op.</p>
<p style="line-height:1.6;color:#4A5068">Met vriendelijke groet,<br>Deekman Enterprises</p>`));
    } else if (type === "bouwer") {
      const naam = clean(b.naam, 120);
      if (!naam) return json({ ok: false, error: "velden" }, 400, headers);
      const k = (b.keuzes || {}) as Record<string, unknown>;
      const lijst = (v: unknown) => Array.isArray(v) ? v.map((x) => clean(x, 60)).join(", ") : "";
      await mail(NOTIFY, `Nieuwe websitewensen: ${clean(b.bedrijf, 160) || naam}`,
        wrap("Nieuwe aanvraag via de website-bouwer", rows([
          ["Naam", naam], ["E-mail", email], ["Bedrijf", clean(b.bedrijf, 160)],
          ["Soort website", clean(k.type, 60)], ["Kleuren", clean(k.kleur, 60)], ["Stijl", clean(k.stijl, 60)],
          ["Pagina's", lijst(k.paginas)], ["Hulp bij", lijst(k.hulp)], ["Opmerking", clean(b.bericht, 3000)],
        ])), email);
      await mail(email, "Je websitewensen zijn binnen",
        wrap(`Bedankt, ${naam}!`, `<p style="line-height:1.6">We hebben je wensen ontvangen:</p>
<p style="line-height:1.6;background:#F6F5F1;padding:12px 16px;border-radius:8px">${esc(clean(k.samenvatting, 500))}</p>
<p style="line-height:1.6">We bekijken je keuzes en nemen contact met je op om ze samen door te nemen.</p>
<p style="line-height:1.6;color:#4A5068">Met vriendelijke groet,<br>Deekman Enterprises</p>`));
    } else if (type === "updates") {
      await mail(NOTIFY, "Nieuwe aanmelding voor updates via de website",
        wrap("Nieuwe aanmelding", rows([["E-mail", email]]) +
          `<p style="margin:20px 0 0;color:#4A5068;font-size:14px">Deze persoon wil een bericht als er iets nieuws live staat.</p>`), email);
    } else {
      return json({ ok: false, error: "type" }, 400, headers);
    }
    return json({ ok: true }, 200, headers);
  } catch (e) {
    console.error(e);
    return json({ ok: false, error: "mail" }, 500, headers);
  }
});
