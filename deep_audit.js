const fs=require('fs'),{JSDOM}=require('jsdom');
const raw=fs.readFileSync('index.html','utf8');
let html=raw.replace('<script src="data.js"></script>','<script>'+fs.readFileSync('data.js','utf8')+'</script>')
            .replace('<script src="visuals.js"></script>','<script>'+fs.readFileSync('visuals.js','utf8')+'</script>');
const errs=[];
const vc=new (require('jsdom').VirtualConsole)();
vc.on('jsdomError',e=>errs.push(e.message));
const w=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc}).window,D=w.document;
const R=[];const add=(k,v,bad)=>R.push([k,v,bad]);

add('JS errors on load',errs.length?errs.join('; '):'none',errs.length>0);

// --- no-JS fallback: what does a crawler / JS-off user see?
const noJS=new JSDOM(html,{runScripts:'outside-only'}).window.document;
add('content without JS (chars in <main>)',(noJS.getElementById('ledger')||{textContent:''}).textContent.trim().length,
    (noJS.getElementById('ledger')||{textContent:''}).textContent.trim().length===0);
add('<noscript> fallback present',!!noJS.querySelector('noscript'),!noJS.querySelector('noscript'));

// --- stale hardcoded values in the static HTML
const ctStatic=(raw.match(/id="ct">(\d+)</)||[])[1];
global.window={};require('./data.js');const N=global.window.MECHANISMS.length;
add('static fallback count vs real',ctStatic+' vs '+N, String(ctStatic)!==String(N));

// --- README / SUBMISSION consistency with reality
const rd=fs.readFileSync('README.md','utf8'), sb=fs.readFileSync('SUBMISSION.md','utf8');
const nAssert=(fs.readFileSync('test_invariants.js','utf8').match(/\bok\(/g)||[]).length;
[['README',rd],['SUBMISSION',sb]].forEach(([nm,t])=>{
  const claimed=[...t.matchAll(/(\d+) assertions/g)].map(m=>+m[1]);
  add(nm+' assertion count claim',claimed.join(',')+' (file defines '+nAssert+'+ runtime)',false);
  const mech=[...t.matchAll(/(\d+) (?:attention )?mechanisms/g)].map(m=>+m[1]);
  add(nm+' mechanism count claim',mech.join(',')||'none',mech.some(x=>x!==N&&x!==20));
});

// --- typography consistency
var clone=D.body.cloneNode(true); clone.querySelectorAll('script,style,noscript,svg').forEach(function(s){s.remove()});
const body=clone.textContent;
add('straight apostrophes in prose',(body.match(/\w'\w/g)||[]).length,(body.match(/\w'\w/g)||[]).length>0);
add('double spaces',(body.match(/[a-z]  [A-Z]/g)||[]).length,(body.match(/[a-z]  [A-Z]/g)||[]).length>0);
add('hyphen used as dash " - "',(body.match(/ - /g)||[]).length,(body.match(/ - /g)||[]).length>0);

// --- overflow risk: very long unbroken tokens
const longest=[...body.split(/\s+/)].reduce((a,b)=>b.length>a.length?b:a,'');
add('longest unbroken token',longest.length+' ("'+longest.slice(0,30)+'")',longest.length>45);

// --- print + dark mode + motion
add('@media print rules',/(@media\s+print)/.test(raw),!/(@media\s+print)/.test(raw));
add('colour scheme declared',/prefers-color-scheme/.test(raw)||/name="color-scheme"/.test(raw),!(/prefers-color-scheme/.test(raw)||/name="color-scheme"/.test(raw)));
add('prefers-reduced-motion handled',/prefers-reduced-motion/.test(raw),false);

// --- fonts: FOUT / offline behaviour
add('font-display in Google URL',/display=swap/.test(raw),!/display=swap/.test(raw));
add('local font fallbacks declared',/Georgia|system-ui|monospace/.test(raw),false);

// --- interactive completeness
D.querySelectorAll('.head').forEach(b=>b.dispatchEvent(new w.MouseEvent('click',{bubbles:true})));
add('cards with empty body',[...D.querySelectorAll('.body')].filter(b=>b.textContent.trim().length<80).length,
    [...D.querySelectorAll('.body')].filter(b=>b.textContent.trim().length<80).length>0);
add('cards missing "when to pick"',D.querySelectorAll('.row').length-D.querySelectorAll('.pick').length,
    D.querySelectorAll('.row').length!==D.querySelectorAll('.pick').length);
add('cards missing citation',D.querySelectorAll('.row').length-D.querySelectorAll('.cite').length,
    D.querySelectorAll('.row').length!==D.querySelectorAll('.cite').length);

// --- file weight
['index.html','data.js','visuals.js','attention-timeline-standalone.html','og-image.png'].forEach(f=>{
  if(fs.existsSync(f)) add('size '+f,(fs.statSync(f).size/1024).toFixed(1)+' KB',fs.statSync(f).size>400*1024);
});
console.log(R.map(r=>(r[2]?'  ** ':'     ')+String(r[0]).padEnd(40)+r[1]).join('\n'));
console.log('\n** = needs attention');
