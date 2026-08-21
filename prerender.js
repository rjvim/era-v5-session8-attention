// Execute the page in jsdom, then dump the fully-rendered static DOM so a
// non-JS renderer can screenshot the true post-JS layout.
const fs=require('fs'),{JSDOM}=require('jsdom');
const html=fs.readFileSync('attention-timeline-standalone.html','utf8');
const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true});
const D=dom.window.document;
if(process.argv[2]==='open') D.querySelectorAll('.head').forEach(b=>b.dispatchEvent(new dom.window.MouseEvent('click',{bubbles:true})));
D.querySelectorAll('script').forEach(s=>s.remove());
fs.writeFileSync(process.argv[3]||'prerendered.html','<!DOCTYPE html>'+D.documentElement.outerHTML);
console.log('rows',D.querySelectorAll('.row').length,'dots',D.querySelectorAll('.dot').length,'ct',D.getElementById('ct').textContent);
