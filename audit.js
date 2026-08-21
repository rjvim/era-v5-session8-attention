const fs=require('fs'),{JSDOM}=require('jsdom');
let html=fs.readFileSync('index.html','utf8')
 .replace('<script src="data.js"></script>','<script>'+fs.readFileSync('data.js','utf8')+'</script>')
 .replace('<script src="visuals.js"></script>','<script>'+fs.readFileSync('visuals.js','utf8')+'</script>');
const w=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true}).window,D=w.document;
D.querySelectorAll('.head').forEach(b=>b.dispatchEvent(new w.MouseEvent('click',{bubbles:true})));
const P=[];
// 1 duplicate ids
const ids={};D.querySelectorAll('[id]').forEach(e=>ids[e.id]=(ids[e.id]||0)+1);
const dup=Object.keys(ids).filter(k=>ids[k]>1);
P.push(['duplicate element ids',dup.length?dup.join(','):'none']);
// 2 social sharing metadata
P.push(['og:title',!!D.querySelector('meta[property="og:title"]')]);
P.push(['og:description',!!D.querySelector('meta[property="og:description"]')]);
P.push(['og:image',!!D.querySelector('meta[property="og:image"]')]);
P.push(['twitter:card',!!D.querySelector('meta[name="twitter:card"]')]);
P.push(['favicon',!!D.querySelector('link[rel*="icon"]')]);
P.push(['lang attr',D.documentElement.getAttribute('lang')]);
P.push(['canonical',!!D.querySelector('link[rel="canonical"]')]);
// 3 accessibility
P.push(['imgs without alt',D.querySelectorAll('img:not([alt])').length]);
P.push(['svgs without role/aria',[...D.querySelectorAll('svg')].filter(s=>!s.getAttribute('role')&&!s.getAttribute('aria-label')).length]);
P.push(['buttons w/o accessible text',[...D.querySelectorAll('button')].filter(b=>!b.textContent.trim()).length]);
P.push(['axis dots keyboard-reachable',[...D.querySelectorAll('.dot')].every(d=>d.hasAttribute('tabindex'))]);
// 4 heading order
const hs=[...D.querySelectorAll('h1,h2,h3,h4')].map(h=>+h.tagName[1]);
let skips=0;for(let i=1;i<hs.length;i++) if(hs[i]-hs[i-1]>1) skips++;
P.push(['h1 count',D.querySelectorAll('h1').length]);
P.push(['heading level skips',skips]);
// 5 link integrity: every arXiv id cited in prose must exist in the data
global.window={};const dat=require('./data.js')||{};
const M=global.window.MECHANISMS||[];
const known=new Set(M.map(m=>m.arxiv).filter(Boolean));
const cited=[...html.matchAll(/arxiv\.org\/abs\/([\d.]+)/g)].map(m=>m[1]);
P.push(['cited arXiv ids not in dataset',[...new Set(cited)].filter(c=>!known.has(c)).join(',')||'none']);
P.push(['links with target=_blank missing rel=noopener',[...D.querySelectorAll('a[target="_blank"]')].filter(a=>!(a.rel||'').includes('noopener')).length]);
P.push(['total external links',D.querySelectorAll('a[href^="http"]').length]);
console.log(P.map(p=>'  '+String(p[0]).padEnd(44)+p[1]).join('\n'));
