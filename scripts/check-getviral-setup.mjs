// Run with: node --env-file=.env.local scripts/check-getviral-setup.mjs (Node 20+)
// Safe output: reports configuration validity but never prints credentials.
const required = ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'GV_SITE', 'GV_ENDPOINT', 'GV_PLATFORM', 'GV_KEY', 'GV_SECRET'];
let failures = 0;
for (const name of required) {
  const present = Boolean(process.env[name]?.trim());
  console.log(`${present ? 'PASS' : 'FAIL'} ${name}: ${present ? 'provided' : 'missing'}`);
  if (!present) failures++;
}
const getUrl = name => { try { return new URL(process.env[name]); } catch { return null; } };
const site = getUrl('GV_SITE'), endpoint = getUrl('GV_ENDPOINT'), platform = getUrl('GV_PLATFORM');
for (const [name, url] of [['GV_SITE', site], ['GV_ENDPOINT', endpoint], ['GV_PLATFORM', platform]]) {
  if (url && url.protocol !== 'https:') { console.error(`FAIL ${name}: must use HTTPS`); failures++; }
}
if (site && endpoint && (site.origin !== endpoint.origin || endpoint.pathname !== '/api/receieve' || endpoint.search || endpoint.hash)) {
 console.error('FAIL GV_ENDPOINT: should exactly match the GetViral admin receiver URL and the deployed Next.js route (/api/receieve).'); failures++;
}
if (site && (site.pathname !== '/' || site.search || site.hash)) {console.error('FAIL GV_SITE: HTTPS origin only, no path');failures++;}
if (process.env.GV_KEY && !/^gv_[a-f0-9]{32}$/.test(process.env.GV_KEY)) {console.error('FAIL GV_KEY format');failures++;}
if (process.env.GV_SECRET && (process.env.GV_SECRET.length < 32 || process.env.GV_SECRET.length > 256 || /\s/.test(process.env.GV_SECRET))) {console.error('FAIL GV_SECRET format');failures++;}
console.log('Database migration and dashboard Verify must still be checked on the actual deployed project.');
process.exitCode = failures ? 1 : 0;
