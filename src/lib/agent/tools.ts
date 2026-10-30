import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { markdownToBlocks } from '@/lib/content';

/**
 * संपादकीय एजेंट के टूल। सभी क्वेरी लॉगिन यूज़र के सत्र से चलती हैं,
 * इसलिए RLS तय करता है कि एजेंट क्या पढ़ और बदल सकता है।
 * एजेंट लेख प्रकाशित या सबमिट नहीं कर सकता — सिर्फ़ ड्राफ़्ट सहेज सकता है।
 */

export type ToolDefinition = {
  name: string;
  description: string;
  input_schema: { type: 'object'; properties: Record<string, unknown>; required?: string[] };
};

export const AGENT_TOOLS: ToolDefinition[] = [
  {
    name: 'list_categories',
    description: 'सक्रिय श्रेणियाँ और उप-श्रेणियाँ (id सहित) लौटाता है। ड्राफ़्ट के लिए category_id चुनने से पहले इसे देखें।',
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'search_articles',
    description: 'लेख खोजता है (शीर्षक में query से मिलान)। केवल आपके अपने या (एडमिन हों तो) सभी लेख, RLS के अनुसार।',
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'शीर्षक का हिस्सा; खाली हो तो हाल के लेख' },
        limit: { type: 'number', description: 'अधिकतम परिणाम (1-20), डिफ़ॉल्ट 10' },
      },
    },
  },
  {
    name: 'get_article',
    description: 'एक लेख का पूरा पाठ (markdown) और स्थिति लौटाता है।',
    input_schema: {
      type: 'object',
      properties: { id: { type: 'string', description: 'लेख की UUID' } },
      required: ['id'],
    },
  },
  {
    name: 'save_draft',
    description:
      'ड्राफ़्ट बनाता या अपडेट करता है। id न दें तो नया ड्राफ़्ट बनता है। समीक्षा में या प्रकाशित लेख नहीं बदले जा सकते। यह लेख प्रकाशित या सबमिट नहीं करता।',
    input_schema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'मौजूदा ड्राफ़्ट की UUID (वैकल्पिक)' },
        title_hi: { type: 'string', description: 'हिंदी शीर्षक' },
        excerpt_hi: { type: 'string', description: 'संक्षिप्त सारांश (1-2 वाक्य)' },
        content_md: { type: 'string', description: 'लेख का पूरा पाठ, markdown में (## उपशीर्षक, > उद्धरण, - सूची)' },
        category_id: { type: 'string', description: 'list_categories से मिली श्रेणी की UUID' },
        is_blog: { type: 'boolean', description: 'ब्लॉग हो तो true' },
      },
      required: ['title_hi', 'content_md'],
    },
  },
];

const MAX_RESULT_CHARS = 6000;

const clip = (s: string) => (s.length > MAX_RESULT_CHARS ? s.slice(0, MAX_RESULT_CHARS) + '…' : s);
const asString = (v: unknown) => (typeof v === 'string' ? v.trim() : '');

async function listCategories() {
  const { data, error } = await createClient()
    .from('categories')
    .select('id, slug, name_hi, sub_categories(id, slug, name_hi, is_active)')
    .eq('is_active', true)
    .order('order_index');
  if (error) throw new Error(error.message);
  return (data ?? []).map((c: any) => ({
    id: c.id,
    slug: c.slug,
    name_hi: c.name_hi,
    sub_categories: (c.sub_categories ?? [])
      .filter((s: any) => s.is_active)
      .map((s: any) => ({ id: s.id, name_hi: s.name_hi })),
  }));
}

async function searchArticles(input: Record<string, unknown>) {
  const query = asString(input.query);
  const limit = Math.min(Math.max(Number(input.limit) || 10, 1), 20);
  let q = createClient()
    .from('articles')
    .select('id, title_hi, status, is_blog, updated_at, category:categories(name_hi)')
    .order('updated_at', { ascending: false })
    .limit(limit);
  if (query) q = q.ilike('title_hi', `%${query.replace(/[%_]/g, '')}%`);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return data ?? [];
}

async function getArticle(input: Record<string, unknown>) {
  const id = asString(input.id);
  if (!id) throw new Error('id आवश्यक है');
  const { data, error } = await createClient()
    .from('articles')
    .select('id, title_hi, excerpt_hi, content_hi, status, is_blog, rejection_note, category_id')
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error('लेख नहीं मिला या देखने की अनुमति नहीं है');
  const md = data.content_hi?.md ?? (data.content_hi?.blocks ?? []).map((b: any) => b.text ?? (b.items ?? []).join('\n')).join('\n\n');
  return { ...data, content_hi: undefined, content_md: clip(md) };
}

async function saveDraft(input: Record<string, unknown>, userId: string) {
  const title = asString(input.title_hi);
  const contentMd = typeof input.content_md === 'string' ? input.content_md : '';
  const supabase = createClient();

  const row = {
    title_hi: title || 'बिना शीर्षक का ड्राफ़्ट',
    excerpt_hi: asString(input.excerpt_hi),
    content_hi: { type: 'doc', blocks: markdownToBlocks(contentMd), md: contentMd },
    category_id: asString(input.category_id) || null,
    is_blog: Boolean(input.is_blog),
    status: 'draft' as const,
  };

  const id = asString(input.id);
  if (id) {
    const { data: existing, error: lookupError } = await supabase.from('articles').select('status').eq('id', id).maybeSingle();
    if (lookupError) throw new Error(lookupError.message);
    if (!existing) throw new Error('लेख नहीं मिला या बदलने की अनुमति नहीं है');
    if (existing.status === 'pending' || existing.status === 'published') {
      throw new Error('समीक्षा में या प्रकाशित लेख नहीं बदला जा सकता');
    }
    // A rejected article goes back to draft when edited, the same as the editor does.
    const { error } = await supabase.from('articles').update(row).eq('id', id);
    if (error) throw new Error(error.message);
    return { id, status: 'draft', message: 'ड्राफ़्ट अपडेट हुआ' };
  }

  const slug = `a-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  const { data, error } = await supabase
    .from('articles')
    .insert({ ...row, slug, author_id: userId })
    .select('id')
    .single();
  if (error) throw new Error(error.message);
  return { id: data.id, status: 'draft', message: 'नया ड्राफ़्ट बना' };
}

/** टूल चलाता है। त्रुटि होने पर संदेश लौटाता है ताकि मॉडल उसे समझकर आगे बढ़ सके। */
export async function runTool(name: string, input: Record<string, unknown>, userId: string): Promise<{ content: string; isError: boolean }> {
  try {
    let result: unknown;
    switch (name) {
      case 'list_categories': result = await listCategories(); break;
      case 'search_articles': result = await searchArticles(input); break;
      case 'get_article': result = await getArticle(input); break;
      case 'save_draft': result = await saveDraft(input, userId); break;
      default: throw new Error(`अज्ञात टूल: ${name}`);
    }
    return { content: clip(JSON.stringify(result)), isError: false };
  } catch (error) {
    return { content: error instanceof Error ? error.message : 'टूल विफल रहा', isError: true };
  }
}
