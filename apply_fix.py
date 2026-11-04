from pathlib import Path
import shutil
import sys

path = Path('src/app/api/receieve/route.ts')
if not path.exists():
    sys.exit('ERROR: Run this file from Danik-patrika- project root (where package.json is).')
s = path.read_text(encoding='utf-8')
if 'GV_AUTH_DIAGNOSTICS_V1' in s:
    sys.exit('Already applied. No changes needed.')
start = s.find('async function isGetViralAuthorized(config: GetViralConfig) {')
end = s.find('\nasync function handleGetViralRequest(',start)
if start < 0 or end < 0:
    sys.exit('ERROR: Authorization function differs from inspected GitHub version. No file changed.')
new_fn = '''// GV_AUTH_DIAGNOSTICS_V1: preserve fail-closed authorization; report safe reasons.
type GetViralAuthResult = { authorized: boolean; reason: string; status?: number };
async function isGetViralAuthorized(config: GetViralConfig): Promise<GetViralAuthResult> {
  const timestamp = String(Math.floor(Date.now() / 1000));
  const nonce = randomBytes(24).toString("hex");
  const path = "/api/auto-post-api/status";
  const signature = getViralSignature(
    config.secret, "GET", path, config.key, config.site,
    timestamp, nonce, Buffer.alloc(0)
  );
  let response: Response;
  try {
    response = await fetch(new URL(path, config.platform), {
      redirect: "error",
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
      headers: {
        "X-GV-Key": config.key,
        "X-GV-Site": config.site,
        "X-GV-Timestamp": timestamp,
        "X-GV-Nonce": nonce,
        "X-GV-Signature": signature,
      },
    });
  } catch (error) {
    console.error("GetViral status callback network failure:", error instanceof Error ? error.message : "unknown");
    return { authorized: false, reason: "status_callback_network_failure" };
  }
  if (!response.ok) {
    console.warn("GetViral status callback denied:", response.status);
    return { authorized: false, reason: "status_callback_http_" + response.status, status: response.status };
  }
  let data: { success?: boolean; website?: string; expires_at?: string };
  try {
    data = await response.json();
  } catch {
    return { authorized: false, reason: "status_callback_invalid_json" };
  }
  if (data.success !== true) return { authorized: false, reason: "status_callback_not_successful" };
  if (data.website !== config.site) return { authorized: false, reason: "status_callback_site_mismatch" };
  const expiry = new Date(data.expires_at ?? "").getTime();
  if (!Number.isFinite(expiry)) return { authorized: false, reason: "status_callback_invalid_expiry" };
  if (expiry <= Date.now()) return { authorized: false, reason: "status_callback_expired" };
  return { authorized: true, reason: "authorized" };
}
'''
s = s[:start] + new_fn + s[end:]
old = '''    if (!(await isGetViralAuthorized(config)) || validUntil <= Date.now()) {
      return NextResponse.json(
        { success: false },
        { status: 403, headers: { "Cache-Control": "no-store" } }
      );
    }'''
new = '''    const authorization = await isGetViralAuthorized(config);
    if (!authorization.authorized || validUntil <= Date.now()) {
      const reason = validUntil <= Date.now() ? "delivery_expired" : authorization.reason;
      console.warn("GetViral publish authorization denied:", reason);
      return NextResponse.json(
        { success: false, message: "GetViral publish authorization denied: " + reason },
        { status: 403, headers: { "Cache-Control": "no-store" } }
      );
    }'''
if old not in s:
    sys.exit('ERROR: Publish authorization block differs from inspected version. No file changed.')
s=s.replace(old,new,1)
old2='''    return NextResponse.json(
      { success: false },
      { status: 403, headers: { "Cache-Control": "no-store" } }
    );
  }

  if (!(await claimGetViralNonce'''
new2='''    const reason = payload.website !== config.site ? "delivery_site_mismatch" : "delivery_expired_or_invalid";
    console.warn("GetViral delivery rejected:", reason);
    return NextResponse.json(
      { success: false, message: "GetViral delivery rejected: " + reason },
      { status: 403, headers: { "Cache-Control": "no-store" } }
    );
  }

  if (!(await claimGetViralNonce'''
if old2 not in s:
    sys.exit('ERROR: Delivery expiry block differs from inspected version. No file changed.')
s=s.replace(old2,new2,1)
backup=path.with_suffix('.ts.before-gv403-fix.bak')
shutil.copy2(path,backup)
path.write_text(s,encoding='utf-8')
print('SUCCESS: Updated',path)
print('Backup:',backup)
print('Next: npm run build, then commit/push to GitHub and redeploy Vercel.')
