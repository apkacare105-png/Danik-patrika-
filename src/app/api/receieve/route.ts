import { NextResponse } from "next/server";
import {
  createClient,
  type SupabaseClient,
} from "@supabase/supabase-js";
import {
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ingestionSecret = process.env.NEWS_INGESTION_SECRET;

function isAuthorized(request: Request) {
  if (!ingestionSecret) {
    return false;
  }

  const apiKey = request.headers
    .get("x-news-api-key")
    ?.trim();

  const authorization = request.headers
    .get("authorization")
    ?.trim();

  const bearer = authorization
    ?.toLowerCase()
    .startsWith("bearer ")
    ? authorization.slice(7).trim()
    : "";

  return (
    apiKey === ingestionSecret ||
    bearer === ingestionSecret
  );
}

function firstString(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return "";
}

function slugify(value: string) {
  const slug = value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);

  return slug || `news-${Date.now().toString(36)}`;
}

function parseDate(value: unknown) {
  if (
    typeof value !== "string" &&
    typeof value !== "number"
  ) {
    return new Date().toISOString();
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? new Date().toISOString()
    : date.toISOString();
}

function categorySlug(value: unknown) {
  const raw = String(value ?? "")
    .trim()
    .toLowerCase();

  const map: Record<string, string> = {
    india: "desh",
    national: "desh",
    nation: "desh",
    देश: "desh",

    world: "duniya",
    international: "duniya",
    दुनिया: "duniya",

    state: "rajya",
    states: "rajya",
    राज्य: "rajya",

    sports: "khel",
    sport: "khel",
    cricket: "khel",
    खेल: "khel",

    entertainment: "manoranjan",
    bollywood: "manoranjan",
    मनोरंजन: "manoranjan",

    business: "business",
    finance: "business",
    economy: "business",

    technology: "technology",
    tech: "technology",
    ai: "technology",

    jobs: "naukri",
    job: "naukri",
    employment: "naukri",
    careers: "naukri",
    career: "naukri",
    नौकरी: "naukri",

    health: "health",
    healthcare: "health",
    medical: "health",
    स्वास्थ्य: "health",

    education: "education",
    शिक्षा: "education",

    food: "food",
    खाना: "food",
    recipes: "food",
    recipe: "food",

    religion: "dharm",
    धर्म: "dharm",
  };

  return map[raw] ?? raw.replace(/\s+/g, "-");
}

async function saveArticle(
  payload: Record<string, unknown>,
  originalPayload: unknown,
  supabase: SupabaseClient,
  stableSlug?: string
) {
  const title = firstString(
    payload.title_hi,
    payload.title,
    payload.headline,
    payload.name
  );

  if (!title) {
    throw new Error("A title/headline is required");
  }

  const description = firstString(
    payload.excerpt_hi,
    payload.excerpt,
    payload.description,
    payload.summary,
    payload.subtitle
  );

  const content = firstString(
    payload.content_hi,
    payload.content,
    payload.body,
    payload.article_text,
    description
  );

  const image = firstString(
    payload.featured_image,
    payload.image,
    payload.image_url,
    payload.thumbnail,
    payload.urlToImage
  );

  const sourceUrl = firstString(
    payload.source_url,
    payload.url,
    payload.link,
    payload.article_url
  );

  const sourceName = firstString(
    payload.source_name,
    payload.source
  );

  const externalId = firstString(
    payload.external_id,
    payload.id,
    payload.guid,
    payload.uuid
  );

  const incomingCategory = firstString(
    payload.category_slug,
    payload.category,
    payload.section,
    payload.topic
  );

  const publishedAt = parseDate(
    payload.published_at ??
      payload.publishedAt ??
      payload.pubDate ??
      payload.date
  );

  const slug = categorySlug(incomingCategory);

  let categoryId: string | null = null;

  // Find requested category.
  if (slug) {
    const categoryResult = await supabase
      .from("categories")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (categoryResult.error) {
      throw new Error(
        `Category lookup failed: ${categoryResult.error.message}`
      );
    }

    const categoryData =
      categoryResult.data as { id: string } | null;

    categoryId = categoryData?.id ?? null;
  }

  // Fall back to "desh" if no matching category exists.
  if (!categoryId) {
    const categoryResult = await supabase
      .from("categories")
      .select("id")
      .eq("slug", "desh")
      .maybeSingle();

    if (categoryResult.error) {
      throw new Error(
        `Default category lookup failed: ${categoryResult.error.message}`
      );
    }

    const categoryData =
      categoryResult.data as { id: string } | null;

    categoryId = categoryData?.id ?? null;
  }

  const articleSlug =
    stableSlug ?? `${slugify(title)}-${Date.now().toString(36)}`;

  const contentBlocks = {
    type: "doc",
    blocks: content
      ? [{ type: "p", text: content }]
      : [],
    source: sourceName || undefined,
    external_id: externalId || undefined,
  };

  const article = {
    title_hi: title,
    slug: articleSlug,
    content_hi: contentBlocks,
    excerpt_hi: description,
    featured_image: image || null,
    status: "published",
    author_id: null,
    category_id: categoryId,
    published_at: publishedAt,
    is_blog: false,

    source_url: sourceUrl || null,
    source_name: sourceName || null,
    external_id: externalId || null,
    ingestion_payload: originalPayload,
  };

  let result;

  if (sourceUrl) {
    result = await supabase
      .from("articles")
      .upsert(article, {
        onConflict: "source_url",
      })
      .select("id, slug")
      .single();
  } else if (externalId) {
    result = await supabase
      .from("articles")
      .upsert(article, {
        onConflict: "external_id",
      })
      .select("id, slug")
      .single();
  } else {
    result = await supabase
      .from("articles")
      .insert(article)
      .select("id, slug")
      .single();
  }

  if (result.error) {
    throw new Error(result.error.message);
  }

  return result.data as {
    id: string;
    slug: string;
  };
}

type GetViralConfig = {
  site: string;
  endpoint: URL;
  platform: URL;
  key: string;
  secret: string;
};

function getGetViralConfig(): GetViralConfig | null {
  const siteValue = process.env.GV_SITE;
  const endpointValue = process.env.GV_ENDPOINT;
  const platformValue = process.env.GV_PLATFORM;
  const key = process.env.GV_KEY;
  const secret = process.env.GV_SECRET;

  if (!siteValue || !endpointValue || !platformValue || !key || !secret) {
    return null;
  }

  try {
    const siteUrl = new URL(siteValue);
    const endpoint = new URL(endpointValue);
    const platform = new URL(platformValue);
    const site = siteUrl.origin;

    if (
      siteUrl.protocol !== "https:" ||
      siteUrl.pathname !== "/" ||
      siteUrl.search ||
      siteUrl.hash ||
      endpoint.protocol !== "https:" ||
      endpoint.origin !== site ||
      endpoint.search ||
      endpoint.hash ||
      platform.protocol !== "https:"
    ) {
      return null;
    }

    return { site, endpoint, platform, key, secret };
  } catch {
    return null;
  }
}

function getViralSignature(
  secret: string,
  method: string,
  target: string,
  key: string,
  site: string,
  timestamp: string,
  nonce: string,
  body: Uint8Array
) {
  const bodyHash = createHash("sha256").update(body).digest("hex");

  return createHmac("sha256", secret)
    .update(
      ["GV1", method, target, key, site, timestamp, nonce, bodyHash].join("\n")
    )
    .digest("hex");
}

class RequestTooLargeError extends Error {}

async function readRawBody(request: Request) {
  const maximumSize = 15 * 1024 * 1024;
  const contentLength = request.headers.get("content-length");

  if (contentLength && Number(contentLength) > maximumSize) {
    throw new RequestTooLargeError();
  }

  if (!request.body) {
    return Buffer.alloc(0);
  }

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maximumSize) {
        await reader.cancel();
        throw new RequestTooLargeError();
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  return Buffer.concat(chunks, size);
}

async function claimGetViralNonce(
  supabase: SupabaseClient,
  key: string,
  nonce: string
) {
  const expiredBefore = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const cleanup = await supabase
    .from("getviral_delivery_nonces")
    .delete()
    .lt("created_at", expiredBefore);

  if (cleanup.error) {
    throw new Error(`Nonce cleanup failed: ${cleanup.error.message}`);
  }

  const claim = await supabase
    .from("getviral_delivery_nonces")
    .insert({ key_id: key, nonce });

  if (claim.error?.code === "23505") {
    return false;
  }
  if (claim.error) {
    throw new Error(`Nonce claim failed: ${claim.error.message}`);
  }
  return true;
}

async function isGetViralAuthorized(config: GetViralConfig) {
  const timestamp = String(Math.floor(Date.now() / 1000));
  const nonce = randomBytes(24).toString("hex");
  const path = "/api/auto-post-api/status";
  const signature = getViralSignature(
    config.secret,
    "GET",
    path,
    config.key,
    config.site,
    timestamp,
    nonce,
    Buffer.alloc(0)
  );
  const response = await fetch(new URL(path, config.platform), {
    redirect: "error",
    signal: AbortSignal.timeout(10_000),
    headers: {
      "X-GV-Key": config.key,
      "X-GV-Site": config.site,
      "X-GV-Timestamp": timestamp,
      "X-GV-Nonce": nonce,
      "X-GV-Signature": signature,
    },
  });

  if (!response.ok) return false;

  const data = (await response.json()) as {
    success?: boolean;
    website?: string;
    expires_at?: string;
  };
  return (
    data.success === true &&
    data.website === config.site &&
    Number.isFinite(new Date(data.expires_at ?? "").getTime()) &&
    new Date(data.expires_at ?? "").getTime() > Date.now()
  );
}

async function handleGetViralRequest(
  request: Request,
  supabase: SupabaseClient
) {
  const config = getGetViralConfig();
  if (!config) {
    return NextResponse.json(
      { success: false, error: "Receiver is not configured" },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }

  const requestUrl = new URL(request.url);
  const contentType = request.headers
    .get("content-type")
    ?.split(";")[0]
    .trim()
    .toLowerCase();
  const timestamp = request.headers.get("x-gv-timestamp") ?? "";
  const nonce = request.headers.get("x-gv-nonce") ?? "";
  const suppliedSignature = request.headers.get("x-gv-signature") ?? "";

  if (
    contentType !== "application/json" ||
    requestUrl.pathname !== config.endpoint.pathname ||
    requestUrl.search ||
    request.headers.get("x-gv-key") !== config.key ||
    request.headers.get("x-gv-site") !== config.site ||
    !/^\d{10}$/.test(timestamp) ||
    Math.abs(Date.now() / 1000 - Number(timestamp)) > 60 ||
    !/^[a-f0-9]{48}$/.test(nonce) ||
    !/^[a-f0-9]{64}$/.test(suppliedSignature)
  ) {
    return NextResponse.json(
      { success: false },
      { status: 401, headers: { "Cache-Control": "no-store" } }
    );
  }

  let rawBody: Buffer;
  try {
    rawBody = await readRawBody(request);
  } catch (error) {
    if (error instanceof RequestTooLargeError) {
      return NextResponse.json(
        { success: false, error: "Request body is too large" },
        { status: 413, headers: { "Cache-Control": "no-store" } }
      );
    }
    throw error;
  }

  const expectedSignature = getViralSignature(
    config.secret,
    "POST",
    config.endpoint.href,
    config.key,
    config.site,
    timestamp,
    nonce,
    rawBody
  );
  if (
    !timingSafeEqual(
      Buffer.from(suppliedSignature, "hex"),
      Buffer.from(expectedSignature, "hex")
    )
  ) {
    return NextResponse.json(
      { success: false },
      { status: 401, headers: { "Cache-Control": "no-store" } }
    );
  }

  let payload: Record<string, unknown>;
  try {
    const parsed: unknown = JSON.parse(rawBody.toString("utf8"));
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("Expected a JSON object");
    }
    payload = parsed as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { success: false, error: "Request body must be a JSON object" },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }

  const validUntil = new Date(String(payload.expires_at ?? "")).getTime();
  if (
    payload.website !== config.site ||
    !Number.isFinite(validUntil) ||
    validUntil <= Date.now()
  ) {
    return NextResponse.json(
      { success: false },
      { status: 403, headers: { "Cache-Control": "no-store" } }
    );
  }

  if (!(await claimGetViralNonce(supabase, config.key, nonce))) {
    return NextResponse.json(
      { success: false },
      { status: 401, headers: { "Cache-Control": "no-store" } }
    );
  }

  if (
    payload.event === "connection.verify" &&
    typeof payload.challenge === "string" &&
    /^[a-f0-9]{64}$/.test(payload.challenge)
  ) {
    const proof = createHmac("sha256", config.secret)
      .update(
        ["GV1-VERIFY", payload.challenge, config.site, config.endpoint.href].join(
          "\n"
        )
      )
      .digest("hex");
    return NextResponse.json(
      { success: true, challenge: payload.challenge, proof },
      { headers: { "Cache-Control": "no-store" } }
    );
  }

  const article =
    payload.article &&
    typeof payload.article === "object" &&
    !Array.isArray(payload.article)
      ? (payload.article as Record<string, unknown>)
      : null;

  if (payload.event !== "article.publish" || !article) {
    return NextResponse.json(
      { success: false, error: "Invalid article payload" },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }

  const publishId =
    typeof article.publish_id === "string" ? article.publish_id.trim() : "";
  const title = typeof article.title === "string" ? article.title.trim() : "";
  const content = typeof article.content === "string" ? article.content : "";

  if (!publishId || publishId.length > 256 || !title || !content.trim()) {
    return NextResponse.json(
      { success: false, error: "Invalid article payload" },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }

  try {
    if (!(await isGetViralAuthorized(config)) || validUntil <= Date.now()) {
      return NextResponse.json(
        { success: false },
        { status: 403, headers: { "Cache-Control": "no-store" } }
      );
    }

    const externalId = `getviral:${publishId}`;
    const articlePayload = {
      title,
      content,
      image_url: article.image_url,
      category: article.category,
      external_id: externalId,
    };
    const slug = `gv-${createHash("sha256")
      .update(publishId)
      .digest("hex")}`;
    const stored = await saveArticle(
      articlePayload,
      article,
      supabase,
      slug
    );

    return NextResponse.json(
      { success: true, post_id: stored.id, publish_id: publishId },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error(
      "GetViral delivery failed:",
      error instanceof Error ? error.message : "Unknown receiver error"
    );
    return NextResponse.json(
      { success: false },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }
}

export async function POST(request: Request) {
  const isGetViralRequest = [
    "x-gv-key",
    "x-gv-site",
    "x-gv-timestamp",
    "x-gv-nonce",
    "x-gv-signature",
  ].some((name) => request.headers.has(name));

  if (!isGetViralRequest && !isAuthorized(request)) {
    return NextResponse.json(
      {
        ok: false,
        error: "Unauthorized",
      },
      { status: 401 }
    );
  }

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      {
        ok: false,
        error: "Server is missing Supabase configuration",
      },
      { status: 500 }
    );
  }

  const supabase = createClient(
    supabaseUrl,
    serviceRoleKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );

  if (isGetViralRequest) {
    try {
      return await handleGetViralRequest(request, supabase);
    } catch (error) {
      console.error(
        "GetViral receiver failed:",
        error instanceof Error ? error.message : "Unknown receiver error"
      );
      return NextResponse.json(
        { success: false },
        { status: 503, headers: { "Cache-Control": "no-store" } }
      );
    }
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: "Request body must be valid JSON",
      },
      { status: 400 }
    );
  }

  const root =
    body &&
    typeof body === "object" &&
    !Array.isArray(body)
      ? (body as Record<string, unknown>)
      : null;

  const batch = Array.isArray(root?.articles)
    ? root.articles
    : Array.isArray(root?.news)
    ? root.news
    : Array.isArray(root?.data)
    ? root.data
    : null;

  const items = batch ?? [body];

  const stored: Array<{
    id: string;
    slug: string;
  }> = [];

  try {
    for (const item of items) {
      const payload =
        item &&
        typeof item === "object" &&
        !Array.isArray(item)
          ? (item as Record<string, unknown>)
          : {};

      stored.push(
        await saveArticle(
          payload,
          item,
          supabase
        )
      );
    }
  } catch (error) {
    console.error(
      "News ingestion failed:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "News could not be stored",
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    message: `${stored.length} news item(s) received successfully`,
    articles: stored,
  });
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    endpoint: "Dainik Patrika news receiver",
    method: "POST",
  });
}  
// ending yahi h 