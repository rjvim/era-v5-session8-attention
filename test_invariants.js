// Asserts every claim the README and the app make. Run: node test_invariants.js
global.window={}; require('./data.js'); require('./visuals.js');
const M=window.MECHANISMS, E=window.ERAS; let fail=0;
const ok=(c,m)=>{console.log((c?'[PASS] ':'[FAIL] ')+m); if(!c)fail++;};

ok(M.length===24,'24 mechanisms present');
ok(M.every((m,i)=>i===0||m.date>=M[i-1].date),'strictly chronological by date');
ok(M.every(m=>['id','name','date','disp','who','problem','how','when','era'].every(k=>m[k])),'all required fields present');
ok(M.every(m=>m.cons&&m.cons.length>=2),'every mechanism lists >=2 costs (no marketing)');
ok(M.every(m=>m.pros&&m.pros.length>=2),'every mechanism lists >=2 benefits');
ok(M.every(m=>E[m.era]),'every mechanism maps to a known era');
// VERBATIM from the brief's "At minimum cover:" sentence. A dedicated card is
// required for each -- being mentioned inside another card does not count.
const brief={
 'standard attention':'scaled_dot_product','absolute learned positions':'learned_abs_pos',
 'sinusoidal':'sinusoidal','RoPE':'rope','ALiBi':'alibi','MQA':'mqa','GQA':'gqa',
 'sliding window':'sliding_window','attention sinks':'attn_sinks','NTK-aware scaling':'ntk_aware',
 'YaRN':'yarn','linear attention':'linear_attn','the delta rule':'delta_rule',
 'Gated DeltaNet':'gated_deltanet','MLA':'mla','sparse attention':'sparse_attn',
 'top-k attention':'topk','compressed+sparse (DeepSeek) - NSA':'nsa',
 'compressed+sparse (DeepSeek) - DSA':'dsa','DroPE':'drope'};
const have=new Set(M.map(m=>m.id));
Object.keys(brief).forEach(function(k){ ok(have.has(brief[k]),'brief item has a dedicated card: '+k); });
ok(Object.keys(brief).length===20,'all 20 brief items checked individually');
ok(M.find(m=>m.id==='learned_abs_pos').date < M.find(m=>m.id==='scaled_dot_product').date,'ConvS2S predates the Transformer (finding 1)');
const gap=(new Date(M.find(m=>m.id==='gqa').date)-new Date(M.find(m=>m.id==='alibi').date))/86400000;
ok(gap>600,'ALiBi->GQA gap exceeds 600 days (finding 2): '+Math.round(gap)+' days');
const fa=M.find(m=>m.id==='flashattention').date;
ok(fa>M.find(m=>m.id==='alibi').date && fa<M.find(m=>m.id==='gqa').date,'FlashAttention falls inside the gap (finding 2)');
ok(M.find(m=>m.id==='ntk_aware').arxiv===null,'NTK-aware correctly recorded as having no paper (finding 3)');
ok(M.find(m=>m.id==='nsa').date!==M.find(m=>m.id==='dsa').date,'NSA and DSA are separate dated entries');
ok(M.find(m=>m.id==='drope').date>M.find(m=>m.id==='yarn').date,'DroPE post-dates the RoPE patches it argues against (finding 5)');
ok(M[M.length-1].id==='csa_hca','CSA+HCA is the newest entry (finding 6)');
ok(M.filter(m=>m.date==='2017-06-12').length===2,'Transformer and sinusoidal share a date and both have cards');
ok(M.find(m=>m.id==='topk').date<M.find(m=>m.id==='dsa').date,'top-k predates the DSA that industrialises it');
ok(M.find(m=>m.id==='csa_hca').date>M.find(m=>m.id==='dsa').date,'CSA+HCA post-dates DSA it descends from');
ok(M.find(m=>m.id==='mqa').date==='2019-11-06','MQA resolved to day precision');

// ---- visual layer ----
ok(typeof window.patternSVG==='function','pattern diagram generator loaded');
ok(typeof window.axisSVG==='function','proportional time axis generator loaded');
ok(M.every(function(m){return window.PATTERN[m.id];}),'every mechanism is assigned a diagram type');
var noSvg=M.filter(function(m){var s=window.patternSVG(m.id);return !s||s.indexOf('<svg')!==0;});
ok(noSvg.length===0,'every mechanism renders a real SVG diagram'+(noSvg.length?': missing '+noSvg.map(function(m){return m.id}).join(','):''));
var ax=window.axisSVG();
ok(ax.indexOf('<svg')===0,'time axis renders an SVG');
ok((ax.match(/class="dot"/g)||[]).length===M.length,'time axis plots every mechanism');
ok(ax.indexOf('633 days')>-1,'time axis labels the gap to scale');
ok(Object.keys(window.PATTERN).length===M.length,'no orphan diagram assignments');


// ---- gap arithmetic: finding 2 must survive its own obvious rebuttal ----
var tt=function(d){return Date.parse(d.length===7?d+'-15':d);};
var gaps=[]; for(var i=1;i<M.length;i++) gaps.push({d:Math.round((tt(M[i].date)-tt(M[i-1].date))/86400000),a:M[i-1].date,b:M[i].date});
var srt=gaps.slice().sort(function(x,y){return y.d-x.d;});
ok(srt[0].d===680&&srt[0].a==='2017-06-12','longest silence is 680 days (2017-2019), acknowledged not hidden');
var L=M.filter(function(m){return m.id!=='flashattention';}), g2=[];
for(var i=1;i<L.length;i++) g2.push({d:Math.round((tt(L[i].date)-tt(L[i-1].date))/86400000),a:L[i-1].date});
g2.sort(function(x,y){return y.d-x.d;});
ok(g2[1].d===633&&g2[1].a==='2021-08-27','second-longest silence is the 633-day gap');
ok(g2[0].d===680,'both long silences identified; finding 2 does not overclaim');


// ---- workload regimes: the brief asks the app to say when a mechanism is right ----
ok(typeof window.REGIME==='object'&&window.REGIME!==null,'workload regime map loaded');
ok(M.every(function(m){var r=window.REGIME[m.id];return r&&r.length>0;}),'every mechanism is tagged with at least one workload');
var VALID=['2K','32K','1M'];
ok(M.every(function(m){return window.REGIME[m.id].every(function(r){return VALID.indexOf(r)>-1;});}),'all workload tags are valid');
['2K','32K','1M'].forEach(function(r){
  var n=M.filter(function(m){return window.REGIME[m.id].indexOf(r)>-1;}).length;
  ok(n>0&&n<M.length,'workload '+r+' selects a meaningful subset ('+n+'/'+M.length+')');
});
ok(window.REGIME.scaled_dot_product.indexOf('1M')===-1,'vanilla attention is NOT recommended at 1M scale');
ok(window.REGIME.gated_deltanet.indexOf('2K')===-1,'Gated DeltaNet is NOT recommended at 2K scale');


// ---- forward-looking sections ----
ok(typeof window.arcSVG==='function','trade-off arc generator loaded');
var arc=window.arcSVG();
ok(arc.indexOf('<svg')===0,'arc renders an SVG');
['exactness','memory','length'].forEach(function(k){ ok(arc.indexOf('>'+k+'<')>-1,'arc labels the "'+k+'" lane'); });
var anchors=(arc.match(/x="([-\d.]+)" y="[\d.]+" text-anchor="end"/g)||[]).map(function(s){return +s.match(/x="([-\d.]+)"/)[1];});
ok(anchors.length===3&&Math.min.apply(null,anchors)-58>=0,'arc lane labels fit inside the viewBox (not clipped)');
var fs=require('fs'), page=fs.readFileSync('index.html','utf8');
ok((page.match(/class="pred"/g)||[]).length===3,'three predictions present');
ok((page.match(/What would falsify it/g)||[]).length===3,'every prediction states what would falsify it');
ok(page.indexOf('Check my work')>-1,'verification instructions published for the reader');
ok(/\.arcsec,\.predict,\.verify\{margin:60px auto 0/.test(page),'wide sections stay horizontally centred');
ok(/\.findings\{margin:64px auto 0/.test(page),'findings section stays horizontally centred');


// ---- quantitative claims must not overclaim ----
var flat=[];
M.forEach(function(m){
  (m.pros||[]).concat(m.cons||[]).forEach(function(s){
    // a bare NNx speedup with no hedge, where the source paper says "up to"
    if(/\b(22\.2x|9\.0x|4000x)/.test(s) && !/up to/i.test(s)) flat.push(m.id+': '+s.slice(0,40));
  });
});
ok(flat.length===0,'headline speedups carry the paper\'s own "up to" hedge'+(flat.length?': '+flat.join('; '):''));
ok(/trained at 1024, evaluated at 2048/.test(JSON.stringify(M.find(function(m){return m.id==='alibi';}))),'ALiBi figure states its comparison basis');


// ---- shipping hygiene: metadata, a11y, link integrity ----
var fsx=require('fs'), pg=fsx.readFileSync('index.html','utf8');
['og:title','og:description','og:image','og:url'].forEach(function(k){
  ok(pg.indexOf('property="'+k+'"')>-1,'social metadata present: '+k); });
ok(pg.indexOf('name="twitter:card"')>-1,'twitter card metadata present');
ok(pg.indexOf('rel="canonical"')>-1,'canonical URL declared');
ok(pg.indexOf('rel="icon"')>-1,'favicon present (inline SVG, no extra request)');
ok(fsx.existsSync('og-image.png'),'social preview image exists');
ok(pg.indexOf("dt.setAttribute('tabindex','0')")>-1,'timeline dots are keyboard reachable');
ok(pg.indexOf("e.key==='Enter'")>-1,'timeline dots respond to Enter/Space');
ok(pg.indexOf('<h4>')===-1,'no heading levels skipped (no stray h4 under h2)');
var ph=(pg.match(/REPLACE-WITH-YOUR-URL/g)||[]).length;
ok(ph===0,'no unfilled URL placeholders remain ('+ph+' found)');
var og=(pg.match(/property="og:url" content="([^"]+)"/)||[])[1]||'';
ok(/^https:\/\/[^\s"]+$/.test(og)&&og.indexOf('REPLACE')===-1,'og:url is a real absolute URL: '+og);
var can=(pg.match(/rel="canonical" href="([^"]+)"/)||[])[1]||'';
ok(can.indexOf('REPLACE')===-1&&/^https:\/\//.test(can),'canonical is a real absolute URL');


// ---- robustness: the page must not depend on JS to be readable ----
var built=require('fs').readFileSync('index.html','utf8');
ok(built.indexOf('<noscript>')>-1,'noscript fallback present');
var ledgerStart=built.indexOf('id="ledger"'), ledgerEnd=built.indexOf('</main>',ledgerStart);
var baked=built.slice(ledgerStart,ledgerEnd);
ok(baked.length>20000,'timeline content is baked into the HTML, not JS-only ('+baked.length+' chars)');
ok((baked.match(/class="row/g)||[]).length===M.length,'every mechanism present in the static HTML');
ok(/id="ct">24</.test(built),'static mechanism count matches the data');
ok(/@media\s*print/.test(built),'print stylesheet present');
ok(/name="color-scheme"/.test(built),'colour scheme declared so browsers do not force-darken');
var ogsize=require('fs').statSync('og-image.png').size;
ok(ogsize<300*1024,'social image under 300KB ('+Math.round(ogsize/1024)+'KB) so platforms will render it');


// ---- repo hygiene ----
var F=require('fs');
ok(F.existsSync('.gitignore')&&/node_modules/.test(F.readFileSync('.gitignore','utf8')),'.gitignore excludes node_modules');
ok(F.existsSync('LICENSE'),'LICENSE present');
ok(F.existsSync('package.json'),'package.json present so `npm run audit` works on a fresh clone');
ok(F.existsSync('index.src.html'),'source file shipped alongside the generated page');
ok(F.readFileSync('README.md','utf8').indexOf('docs/preview.png')>-1,'README shows a preview image');


// ---- generated file must match its source ----
// index.html is produced by build.js from index.src.html. If either is edited
// directly they drift silently. This check needs jsdom (`npm install`); without
// it the check SKIPS rather than fails, so the core suite stays dependency-free.
(function(){
  var F=require('fs'), cp=require('child_process');
  try{ require.resolve('jsdom'); }
  catch(e){ console.log('[SKIP] index.html/index.src.html sync check (run `npm install` to enable)'); return; }
  var before=F.readFileSync('index.html','utf8'), ok_sync=false, note='';
  try{
    cp.execSync('node build.js',{stdio:'ignore'});
    ok_sync=F.readFileSync('index.html','utf8')===before;
    if(!ok_sync) note=' (run `node build.js` and commit the result)';
  }catch(e){ note=' (build.js failed)'; }
  finally{ F.writeFileSync('index.html',before); }
  ok(ok_sync,'index.html is in sync with index.src.html'+note);
})();

console.log(fail? '\n'+fail+' FAILED':'\nAll invariants hold.'); process.exit(fail?1:0);
