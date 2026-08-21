// Bakes the rendered timeline into index.html so the page has real content
// before any script runs. render() overwrites it on load; behaviour is identical,
// but crawlers, JS-off browsers and script failures still get the full document.
const fs=require('fs'),{JSDOM}=require('jsdom');
const src=fs.readFileSync('index.src.html','utf8');
const inline=src.replace('<script src="data.js"></script>','<script>'+fs.readFileSync('data.js','utf8')+'</script>')
                .replace('<script src="visuals.js"></script>','<script>'+fs.readFileSync('visuals.js','utf8')+'</script>');
const D=new JSDOM(inline,{runScripts:'dangerously',pretendToBeVisual:true}).window.document;
const baked={ledger:D.getElementById('ledger').innerHTML,finds:D.getElementById('finds').innerHTML,
             axis:D.getElementById('axis').innerHTML,arc:D.getElementById('arc').innerHTML,
             budget:D.getElementById('budget').innerHTML,ct:D.getElementById('ct').textContent};
let out=src
 .replace('<main class="wrap" id="ledger"></main>','<main class="wrap" id="ledger">'+baked.ledger+'</main>')
 .replace('<div id="finds"></div>','<div id="finds">'+baked.finds+'</div>')
 .replace('<div id="axis"></div>','<div id="axis">'+baked.axis+'</div>')
 .replace('<div id="arc"></div>','<div id="arc">'+baked.arc+'</div>')
 .replace('<p class="budget" id="budget" aria-live="polite"></p>','<p class="budget" id="budget" aria-live="polite">'+baked.budget+'</p>')
 .replace(/id="ct">\d+</,'id="ct">'+baked.ct+'<');
fs.writeFileSync('index.html',out);
// single-file build
fs.writeFileSync('attention-timeline-standalone.html',
  out.replace('<script src="data.js"></script>','<script>'+fs.readFileSync('data.js','utf8')+'</script>')
     .replace('<script src="visuals.js"></script>','<script>'+fs.readFileSync('visuals.js','utf8')+'</script>'));
console.log('baked: ledger',baked.ledger.length,'finds',baked.finds.length,'axis',baked.axis.length,'ct',baked.ct);
