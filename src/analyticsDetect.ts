export interface ToolStatus {
  name: string;
  installed: boolean;
  type: "native_app" | "hardcode" | "hybrid" | "not_detected";
  statusText: string;
  status: "pass" | "warn" | "fail";
  channel: string;
}

interface WebPixel {
  id?: string;
  type?: string;
  apiClientId?: string | number;
  configuration?: string;
  privacyPurposes?: string[];
}

interface VendorHit {
  native: boolean;
  hardcode: boolean;
  ids: string[];
  details: string[];
}

const KNOWN_APP_IDS: Record<string, "google" | "meta" | "tiktok" | "clarity"> = {
  "1780363": "google",
  "2329312": "meta",
  "1354745": "meta",
  "123074": "clarity",
  "2210228": "tiktok",
  "686433": "tiktok",
};

function extractBalancedArray(html: string, needle: string): string | null {
  const idx = html.indexOf(needle);
  if (idx === -1) return null;
  let i = idx + needle.length;
  while (i < html.length && html[i] !== "[") i += 1;
  if (html[i] !== "[") return null;

  let depth = 0;
  let inStr = false;
  let esc = false;
  for (let j = i; j < html.length; j += 1) {
    const ch = html[j];
    if (inStr) {
      if (esc) {
        esc = false;
        continue;
      }
      if (ch === "\\") {
        esc = true;
        continue;
      }
      if (ch === '"') inStr = false;
      continue;
    }
    if (ch === '"') {
      inStr = true;
      continue;
    }
    if (ch === "[") depth += 1;
    else if (ch === "]") {
      depth -= 1;
      if (depth === 0) return html.slice(i, j + 1);
    }
  }
  return null;
}

export function extractWebPixels(html: string): WebPixel[] {
  const raw = extractBalancedArray(html, "webPixelsConfigList:");
  if (!raw) return [];
  try {
    return JSON.parse(raw) as WebPixel[];
  } catch {
    return [];
  }
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function vendorsFromPixel(pixel: WebPixel): { vendors: string[]; ids: string[] } {
  const stubIds = new Set(["shopify-app-pixel", "shopify-custom-pixel"]);
  if (pixel.id && stubIds.has(pixel.id) && !pixel.configuration) {
    return { vendors: [], ids: [] };
  }

  const appId = String(pixel.apiClientId ?? "");
  const cfg = pixel.configuration || "";
  const vendors = new Set<string>();
  const ids: string[] = [];

  const mapped = KNOWN_APP_IDS[appId];
  if (mapped) vendors.add(mapped);

  const ga4 = cfg.match(/G-[A-Z0-9]+/g) || [];
  const ads = cfg.match(/AW-\d+/g) || [];
  const gtm = cfg.match(/GTM-[A-Z0-9]+/g) || [];
  const gt = cfg.match(/GT-[A-Z0-9]+/g) || [];
  ids.push(...ga4, ...ads, ...gtm, ...gt);

  if (
    mapped === "google" ||
    /google_tag_ids|gtag_events|googletagmanager|google_tag/i.test(cfg) ||
    ga4.length > 0
  ) {
    vendors.add("google");
  }

  const metaId = cfg.match(/"pixel_id"\s*:\s*"(\d{8,})"/);
  if (metaId) ids.push(metaId[1]);
  if (
    mapped === "meta" ||
    /facebook_pixel|pixel_type"\s*:\s*"facebook|fbevents|facebook\.com\/tr/i.test(cfg)
  ) {
    vendors.add("meta");
  }

  const tt = cfg.match(/"pixelCode"\s*:\s*"([^"]+)"/i) || cfg.match(/"pixel_code"\s*:\s*"([^"]+)"/i);
  if (tt) ids.push(tt[1]);
  if (mapped === "tiktok" || /tiktok|analytics\.tiktok|ttq\./i.test(cfg)) {
    vendors.add("tiktok");
  }

  const clarityId = cfg.match(/"accountID"\s*:\s*"([^"]+)"/i);
  if (mapped === "clarity" || /clarity\.ms/i.test(cfg)) {
    vendors.add("clarity");
    if (clarityId) ids.push(clarityId[1]);
  } else if (appId === "123074" && clarityId) {
    vendors.add("clarity");
    ids.push(clarityId[1]);
  }

  return { vendors: [...vendors], ids: unique(ids) };
}

function stripWebPixelsConfig(html: string): string {
  const raw = extractBalancedArray(html, "webPixelsConfigList:");
  if (!raw) return html;
  return html.replace(raw, "[]");
}

function emptyHit(): VendorHit {
  return { native: false, hardcode: false, ids: [], details: [] };
}

function methodOf(hit: VendorHit): ToolStatus["type"] {
  if (hit.native && hit.hardcode) return "hybrid";
  if (hit.native) return "native_app";
  if (hit.hardcode) return "hardcode";
  return "not_detected";
}

function idsSuffix(ids: string[]): string {
  return ids.length ? ` ID: ${ids.slice(0, 4).join(", ")}` : "";
}

export function detectAnalyticsFromHtml(html: string): ToolStatus[] {
  const pixels = extractWebPixels(html);
  const themeHtml = stripWebPixelsConfig(html);
  const hasShopifyConsent =
    /customerPrivacy|consent-tracking-api|consent-tracking/i.test(html);
  const hasGoogleConsentMode =
    /gtag\(\s*['"]consent['"]/i.test(themeHtml) || /consent\/v2/i.test(themeHtml);

  const hits: Record<string, VendorHit> = {
    google: emptyHit(),
    meta: emptyHit(),
    tiktok: emptyHit(),
    clarity: emptyHit(),
  };

  for (const pixel of pixels) {
    const { vendors, ids } = vendorsFromPixel(pixel);
    for (const vendor of vendors) {
      const hit = hits[vendor] || emptyHit();
      hit.native = true;
      hit.ids = unique([...hit.ids, ...ids]);
      hit.details.push(`App pixel ${pixel.apiClientId ?? pixel.id ?? "unknown"}`);
      hits[vendor] = hit;
    }
  }

  if (
    /googletagmanager\.com\/gtag\/js/i.test(themeHtml) ||
    /googletagmanager\.com\/gtm\.js/i.test(themeHtml) ||
    /google-analytics\.com\/analytics\.js/i.test(themeHtml) ||
    /gtag\(\s*['"]config['"]/i.test(themeHtml)
  ) {
    hits.google.hardcode = true;
    hits.google.details.push("gtag/GTM у вихідному HTML теми");
    const extra = themeHtml.match(/G-[A-Z0-9]+/g) || [];
    hits.google.ids = unique([...hits.google.ids, ...extra]);
  }

  if (
    /connect\.facebook\.net/i.test(themeHtml) ||
    /fbevents\.js/i.test(themeHtml) ||
    /fbq\(\s*['"]init['"]/i.test(themeHtml)
  ) {
    hits.meta.hardcode = true;
    hits.meta.details.push("fbq()/fbevents.js у HTML теми");
  }

  if (
    /analytics\.tiktok\.com/i.test(themeHtml) ||
    /ttq\.load/i.test(themeHtml) ||
    /ttq\(\s*['"]load['"]/i.test(themeHtml)
  ) {
    hits.tiktok.hardcode = true;
    hits.tiktok.details.push("ttq у HTML теми");
  }

  const clarityHard =
    /clarity\.ms\/tag/i.test(themeHtml) && !/\?ref=shopify/i.test(themeHtml);
  if (clarityHard) {
    hits.clarity.hardcode = true;
    hits.clarity.details.push("clarity.ms без Shopify App Pixel");
  } else if (/clarity\.ms\/tag/i.test(themeHtml) && hits.clarity.native) {
    hits.clarity.details.push("Clarity SDK з міткою ref=shopify (нативний додаток)");
  }

  const customCount = pixels.filter(
    (p) => p.type === "CUSTOM" && p.id !== "shopify-custom-pixel"
  ).length;

  const google = hits.google;
  const googleMethod = methodOf(google);
  const googleInstalled = google.native || google.hardcode;
  let googleStatus: ToolStatus["status"] = "fail";
  let googleText = "Не знайдено GA4 ні в Shopify Web Pixels, ні як gtag у темі. Рекламні кампанії Google не отримають повну атрибуцію.";
  if (googleMethod === "native_app") {
    googleStatus = "pass";
    googleText = `Підключено через Shopify Google Channel / Web Pixels.${idsSuffix(google.ids)} Це рекомендований шлях для Checkout Extensibility.`;
  } else if (googleMethod === "hybrid") {
    googleStatus = "warn";
    googleText = `Дубль: нативний Web Pixel і хардкод gtag у темі.${idsSuffix(google.ids)} Подвійні page_view ламають ROAS і моделі атрибуції.`;
  } else if (googleMethod === "hardcode") {
    googleStatus = "warn";
    googleText = `Прямий gtag/GTM у темі замість Shopify Google App.${idsSuffix(google.ids)} Хардкод не працює на новому checkout і дає розрив атрибуції.`;
  }

  const meta = hits.meta;
  const metaMethod = methodOf(meta);
  const metaInstalled = meta.native || meta.hardcode;
  let metaStatus: ToolStatus["status"] = "warn";
  let metaText = "Meta Pixel не виявлено. Якщо є Meta Ads — бюджет іде без клієнтської атрибуції.";
  if (metaMethod === "native_app") {
    metaStatus = "pass";
    metaText = `Нативний Shopify Facebook/Instagram App Pixel.${idsSuffix(meta.ids)} Браузерний піксель підтверджено; Server-Side CAPI з вітрини не видно.`;
  } else if (metaMethod === "hybrid") {
    metaStatus = "warn";
    metaText = `Нативний pixel + хардкод fbq() у темі.${idsSuffix(meta.ids)} Дубльовані Purchase-події завищують Meta Ads і ризикують баном.`;
  } else if (metaMethod === "hardcode") {
    metaStatus = "warn";
    metaText = `Прямий fbq() у theme.liquid.${idsSuffix(meta.ids)} Не працює на Checkout Extensibility; CAPI з HTML не підтверджується.`;
  }

  const tiktok = hits.tiktok;
  const tiktokMethod = methodOf(tiktok);
  const tiktokInstalled = tiktok.native || tiktok.hardcode;
  let tiktokStatus: ToolStatus["status"] = "warn";
  let tiktokText =
    "TikTok Pixel не виявлено. Це нормально, якщо TikTok Ads немає; якщо реклама йде в TikTok — атрибуція та Events API відсутні.";
  if (tiktokMethod === "native_app") {
    tiktokStatus = "pass";
    tiktokText = `Підключено через Shopify Web Pixel / TikTok App.${idsSuffix(tiktok.ids)}`;
  } else if (tiktokMethod === "hybrid") {
    tiktokStatus = "warn";
    tiktokText = `Нативний pixel + хардкод ttq у темі.${idsSuffix(tiktok.ids)} Дубль подій псує оптимізацію кампаній.`;
  } else if (tiktokMethod === "hardcode") {
    tiktokStatus = "warn";
    tiktokText = `Прямий скрипт TikTok у темі.${idsSuffix(tiktok.ids)} Cookie _ttp може ставитись до згоди; Events API з HTML не видно.`;
  }

  const clarity = hits.clarity;
  const clarityMethod = methodOf(clarity);
  const clarityInstalled = clarity.native || clarity.hardcode;
  let clarityStatus: ToolStatus["status"] = "pass";
  let clarityText = "Clarity не використовується.";
  if (clarityMethod === "native_app") {
    clarityStatus = hasShopifyConsent ? "pass" : "warn";
    clarityText = hasShopifyConsent
      ? `Microsoft Clarity через Shopify App Pixel.${idsSuffix(clarity.ids)} Є Shopify Customer Privacy API — піксель має чекати згоди.`
      : `Clarity через Shopify App, але Customer Privacy / Consent API у HTML не знайдено.${idsSuffix(clarity.ids)} Ризик записів сесій відвідувачів ЄС без згоди.`;
  } else if (clarityMethod === "hardcode" || clarityMethod === "hybrid") {
    clarityStatus = "fail";
    clarityText = `Clarity вантажиться з теми (хардкод).${idsSuffix(clarity.ids)} Кука CLID до банера cookie — юридичний ризик штрафів GDPR.`;
  }

  const tools: ToolStatus[] = [
    {
      name: "Google Analytics 4 (GA4)",
      installed: googleInstalled,
      type: googleMethod,
      statusText: googleText,
      status: googleStatus,
      channel: googleInstalled ? (google.native ? "Web Pixel" : "Theme HTML") : "—",
    },
    {
      name: "Meta Pixel (Facebook / Instagram)",
      installed: metaInstalled,
      type: metaMethod,
      statusText: metaText,
      status: metaStatus,
      channel: metaInstalled ? (meta.native ? "Web Pixel" : "Browser / theme") : "—",
    },
    {
      name: "TikTok Pixel",
      installed: tiktokInstalled,
      type: tiktokMethod,
      statusText: tiktokText,
      status: tiktokStatus,
      channel: tiktokInstalled ? (tiktok.native ? "Web Pixel" : "Browser / theme") : "—",
    },
    {
      name: "Microsoft Clarity",
      installed: clarityInstalled,
      type: clarityMethod,
      statusText: clarityText,
      status: clarityStatus,
      channel: clarityInstalled ? "Session replay" : "—",
    },
    {
      name: "Google Search Console",
      installed: /google-site-verification/i.test(html),
      type: /google-site-verification/i.test(html) ? "native_app" : "not_detected",
      statusText: /google-site-verification/i.test(html)
        ? "Мета-тег google-site-verification присутній."
        : "Верифікаційний тег у HTML відсутній (часто підтверджують через DNS — це не помилка).",
      status: /google-site-verification/i.test(html) ? "pass" : "warn",
      channel: "Search",
    },
  ];

  if (metaInstalled || tiktokInstalled) {
    tools.push({
      name: "Server-Side CAPI / Events API",
      installed: false,
      type: "not_detected",
      statusText:
        "CAPI і TikTok Events API не перевіряються з публічного HTML: це server-to-server. Браузерний піксель не доводить і не спростовує серверний трекінг. Для iOS/ITP звіряйте Events Manager (Browser vs Server).",
      status: "warn",
      channel: "Server (недоступно з вітрини)",
    });
  }

  if (!hasGoogleConsentMode && (google.hardcode || meta.hardcode || tiktok.hardcode)) {
    tools.push({
      name: "Google Consent Mode v2",
      installed: false,
      type: "not_detected",
      statusText:
        "У темі є хардкод маркетингових тегів, а gtag('consent') / Consent Mode v2 не знайдено. Трекери можуть стартувати до кліку в банері — ризик штрафів GDPR і розриву з Google Ads.",
      status: "fail",
      channel: "Consent",
    });
  } else if (hasShopifyConsent) {
    tools.push({
      name: "Google Consent Mode v2 / Shopify Privacy",
      installed: true,
      type: "native_app",
      statusText: hasGoogleConsentMode
        ? "Знайдено Shopify Customer Privacy API та ознаки Google Consent Mode."
        : "Є Shopify Customer Privacy / consent-tracking API. Нативні App Pixels gated платформою; хардкод у темі цей захист обходить.",
      status: google.hardcode || meta.hardcode || tiktok.hardcode ? "warn" : "pass",
      channel: "Consent",
    });
  }

  if (customCount > 0) {
    tools.push({
      name: "Custom Web Pixel",
      installed: true,
      type: "native_app",
      statusText: `У webPixelsConfigList є ${customCount} custom pixel(s). Код у пісочниці, вендор з HTML вітрини не читається — перевірте Customer events у Shopify Admin.`,
      status: "warn",
      channel: "Sandbox",
    });
  }

  return tools;
}

export function applyNetworkEvidence(tools: ToolStatus[], networkUrls: string[]): ToolStatus[] {
  if (!networkUrls.length) return tools;
  const blob = networkUrls.join(" ").toLowerCase();

  const firing: Record<string, boolean> = {
    "Google Analytics 4 (GA4)":
      /google-analytics\.com|analytics\.google\.com|googletagmanager\.com/.test(blob),
    "Meta Pixel (Facebook / Instagram)":
      /facebook\.com\/tr|connect\.facebook\.net|fbevents/.test(blob),
    "TikTok Pixel": /analytics\.tiktok\.com|tiktokw\.us/.test(blob),
    "Microsoft Clarity": /clarity\.ms/.test(blob),
  };

  return tools.map((tool) => {
    const didFire = firing[tool.name];
    if (didFire === undefined) return tool;
    if (!tool.installed && didFire) {
      return {
        ...tool,
        installed: true,
        type: tool.type === "not_detected" ? "native_app" : tool.type,
        status: tool.status === "fail" ? "warn" : tool.status,
        channel: `${tool.channel} · Lighthouse: запити є`,
        statusText: `${tool.statusText} Lighthouse зафіксував мережеві виклики сервісу (піксель реально стріляє).`,
      };
    }
    if (tool.installed && didFire) {
      return {
        ...tool,
        channel: `${tool.channel} · запити підтверджено`,
        statusText: `${tool.statusText} Мережеві запити Lighthouse підтверджують, що тег не лише прописаний, а й викликається.`,
      };
    }
    if (tool.installed && !didFire) {
      return {
        ...tool,
        status: tool.status === "fail" ? "fail" : "warn",
        statusText: `${tool.statusText} У HTML/Web Pixels є підключення, але Lighthouse не зафіксував мережевий виклик (consent, sandbox iframe або блокування). Це «підключено», не гарантія «працює на 100%».`,
      };
    }
    return tool;
  });
}
