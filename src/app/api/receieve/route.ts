import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ingestionSecret = process.env.NEWS_INGESTION_SECRET;

function isAuthorized(request: Request) {
  if (!ingestionSecret) return false;

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

  return apiKey === ingestionSecret || bearer === ingestionSecret;
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
  if (typeof value !== "string" && typeof value !== "number") {
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
    technology: "technology",
    tech: "technology",
    ai: "technology",

    auto: "auto",
    automobile: "auto",

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
  supabase: ReturnType<typeof createClient>
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

  if (slug) {
    const { data } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    categoryId = data?.id ?? null;
  }

  if (!categoryId) {
    const { data } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", "desh")
      .maybeSingle();

    categoryId = data?.id ?? null;
  }

  const articleSlug =
    `${slugify(title)}-${Date.now().toString(36)}`;

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

  return result.data;
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
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
 