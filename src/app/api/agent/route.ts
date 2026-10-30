import { NextResponse } from 'next/server';
import { createClient, hasSupabase } from '@/lib/supabase/server';
import { isAgentConfigured, runAgent, type ChatMessage } from '@/lib/agent/run';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_MESSAGES = 30;
const MAX_CHARS = 4000;
const STAFF_ROLES = ['author', 'admin', 'super_admin'];

function parseHistory(body: unknown): ChatMessage[] | null {
  const messages = (body as { messages?: unknown })?.messages;
  if (!Array.isArray(messages) || messages.length === 0 || messages.length > MAX_MESSAGES) return null;

  const parsed: ChatMessage[] = [];
  for (const m of messages) {
    if (!m || typeof m !== 'object') return null;
    const { role, content } = m as { role?: unknown; content?: unknown };
    if ((role !== 'user' && role !== 'assistant') || typeof content !== 'string') return null;
    const text = content.trim();
    if (!text || text.length > MAX_CHARS) return null;
    parsed.push({ role, content: text });
  }
  // The conversation must end with the user's new message.
  return parsed[parsed.length - 1].role === 'user' ? parsed : null;
}

export async function POST(request: Request) {
  if (!hasSupabase()) {
    return NextResponse.json({ ok: false, error: 'डेमो मोड में एजेंट उपलब्ध नहीं है।' }, { status: 503 });
  }
  if (!isAgentConfigured()) {
    return NextResponse.json({ ok: false, error: 'एजेंट सेटअप नहीं है (ANTHROPIC_API_KEY गायब है)।' }, { status: 503 });
  }

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: 'कृपया पहले लॉगिन करें।' }, { status: 401 });
  }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (!profile || !STAFF_ROLES.includes(profile.role)) {
    return NextResponse.json({ ok: false, error: 'यह सुविधा केवल लेखकों और एडमिन के लिए है।' }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'अनुरोध valid JSON नहीं है।' }, { status: 400 });
  }

  const history = parseHistory(body);
  if (!history) {
    return NextResponse.json({ ok: false, error: 'संदेश का प्रारूप गलत है।' }, { status: 400 });
  }

  try {
    const reply = await runAgent(history, user.id);
    return NextResponse.json({ ok: true, reply });
  } catch (error) {
    console.error('Editorial agent failed:', error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'एजेंट विफल रहा।' },
      { status: 500 },
    );
  }
}
