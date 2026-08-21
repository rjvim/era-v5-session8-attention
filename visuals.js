// ---- Visual layer: attention pattern grids + proportional time axis ----
// Every mechanism gets a diagram in the SAME visual language (an 8x8 causal
// attention grid) so differences are readable by shape, not just by prose.

window.PATTERN = {
  learned_abs_pos:'pos_abs', scaled_dot_product:'full', sinusoidal:'pos_sin',
  sparse_attn:'strided', mqa:'cache_mqa', sliding_window:'window',
  linear_attn:'state', delta_rule:'state_delta', rope:'pos_rel', topk:'topk',
  alibi:'pos_decay', flashattention:'tiles', gqa:'cache_gqa', ntk_aware:'pos_ext',
  pos_interp:'pos_ext', yarn:'pos_ext', attn_sinks:'sink', mla:'cache_mla',
  deltanet:'state_delta', gated_deltanet:'state_gate', nsa:'compressed',
  dsa:'compressed', drope:'pos_none', csa_hca:'compressed2'
};

(function(){
  var N=8, C=13, PAD=1, W=N*C, INK='var(--ink)', RED='var(--red)', BLUE='var(--blue)', RULE='var(--rule-soft)';

  function cell(i,j,fill,op){
    return '<rect x="'+(j*C+PAD)+'" y="'+(i*C+PAD)+'" width="'+(C-2*PAD)+'" height="'+(C-2*PAD)+
           '" fill="'+fill+'" opacity="'+op+'"/>';
  }
  // deterministic pseudo-random so the diagram never changes between renders
  function rnd(i,j){ var x=Math.sin(i*12.9898+j*78.233)*43758.5453; return x-Math.floor(x); }

  function grid(fn,caption){
    var s='<svg viewBox="0 0 '+(W+2)+' '+(W+2)+'" width="'+(W+2)+'" height="'+(W+2)+'" role="img" aria-label="'+caption+'">';
    for(var i=0;i<N;i++)for(var j=0;j<N;j++){
      if(j>i){ s+=cell(i,j,RULE,.22); continue; }   // masked future
      s+=fn(i,j);
    }
    return s+'</svg>';
  }

  var P={
    full:      function(){return grid(function(i,j){return cell(i,j,INK,.85)},'dense causal attention')},
    tiles:     function(){return grid(function(i,j){
                 var t=(Math.floor(i/3)+Math.floor(j/3))%2;
                 return cell(i,j,INK,t?.9:.55)},'exact attention computed in tiles')},
    strided:   function(){return grid(function(i,j){
                 var on=(i-j)<2||j%3===0; return cell(i,j,on?INK:RULE,on?.85:.18)},'fixed strided sparsity')},
    window:    function(){return grid(function(i,j){
                 var on=(i-j)<3; return cell(i,j,on?INK:RULE,on?.85:.14)},'sliding window band')},
    sink:      function(){return grid(function(i,j){
                 var on=(i-j)<3, sk=j===0;
                 return cell(i,j,sk?RED:(on?INK:RULE),sk?.9:(on?.85:.14))},'window plus permanent initial sink')},
    topk:      function(){return grid(function(i,j){
                 var on=(i-j)<1||rnd(i,j)>0.68;
                 return cell(i,j,on?BLUE:RULE,on?.85:.14)},'content-selected top-k cells')},
    compressed:function(){return grid(function(i,j){
                 var blk=Math.floor(j/2), sel=(blk%2===0)||(i-j)<2;
                 return cell(i,j,sel?BLUE:RULE,sel?.7:.12)},'compressed blocks with sparse selection')},
    compressed2:function(){return grid(function(i,j){
                 var blk=Math.floor(j/2), sel=(blk%2===0)||(i-j)<2, hard=Math.floor(j/4)%2===0;
                 return cell(i,j,sel?BLUE:(hard?INK:RULE),sel?.7:(hard?.3:.1))},'two compression rates interleaved')},
    // ---- positional variants: same causal grid, shaded by positional bias ----
    pos_abs:   function(){return grid(function(i,j){return cell(i,j,BLUE,.25+0.09*j)},'absolute position, per-slot')},
    pos_sin:   function(){return grid(function(i,j){return cell(i,j,BLUE,.25+0.55*Math.abs(Math.sin(j*0.9)))},'sinusoidal, computed per position')},
    pos_rel:   function(){return grid(function(i,j){return cell(i,j,BLUE,.9-0.09*(i-j))},'rotary, depends on relative distance')},
    pos_decay: function(){return grid(function(i,j){return cell(i,j,BLUE,Math.max(.08,.95-0.16*(i-j)))},'linear penalty by distance')},
    pos_ext:   function(){return grid(function(i,j){
                 var far=j>=5; return cell(i,j,far?RED:BLUE,far?.35:.75)},'trained range rescaled to cover a longer one')},
    pos_none:  function(){return grid(function(i,j){return cell(i,j,INK,.7)},'no positional signal; causal mask only')},
    // ---- recurrent state: there is no matrix to draw ----
    state:     function(){return stateSvg(false,false,'fixed-size state, additive updates')},
    state_delta:function(){return stateSvg(true,false,'state corrected by a delta')},
    state_gate:function(){return stateSvg(true,true,'state corrected and gated')},
    // ---- cache shapes ----
    cache_mqa: function(){return cacheSvg(8,1,'eight query heads share one key/value head')},
    cache_gqa: function(){return cacheSvg(8,4,'query heads share key/value heads in groups')},
    cache_mla: function(){return cacheSvg(8,-1,'keys and values compressed to a latent')}
  };

  function stateSvg(delta,gate,cap){
    var s='<svg viewBox="0 0 '+(W+2)+' '+(W+2)+'" width="'+(W+2)+'" height="'+(W+2)+'" role="img" aria-label="'+cap+'">';
    for(var t=0;t<4;t++) s+='<rect x="'+(4+t*22)+'" y="66" width="13" height="13" fill="'+INK+'" opacity="'+(0.25+t*0.2)+'"/>';
    s+='<rect x="26" y="20" width="44" height="30" fill="none" stroke="'+INK+'" stroke-width="2"/>';
    s+='<text x="48" y="40" text-anchor="middle" font-family="monospace" font-size="15" fill="'+INK+'">S</text>';
    for(var t=0;t<4;t++) s+='<line x1="'+(10+t*22)+'" y1="64" x2="48" y2="52" stroke="'+(delta?RED:INK)+'" stroke-width="1.2" opacity="'+(delta?.8:.45)+'"/>';
    if(delta) s+='<text x="80" y="30" font-family="monospace" font-size="11" fill="'+RED+'">Δ</text>';
    if(gate)  s+='<circle cx="26" cy="35" r="5" fill="none" stroke="'+RED+'" stroke-width="1.6"/><text x="26" y="39" text-anchor="middle" font-size="8" font-family="monospace" fill="'+RED+'">α</text>';
    return s+'</svg>';
  }

  function cacheSvg(q,kv,cap){
    var s='<svg viewBox="0 0 '+(W+2)+' '+(W+2)+'" width="'+(W+2)+'" height="'+(W+2)+'" role="img" aria-label="'+cap+'">';
    for(var i=0;i<q;i++) s+='<rect x="'+(i*13+1)+'" y="6" width="11" height="16" fill="'+BLUE+'" opacity=".8"/>';
    s+='<text x="0" y="42" font-family="monospace" font-size="8" fill="var(--ink-soft)">Q</text>';
    if(kv===-1){
      s+='<rect x="34" y="58" width="36" height="18" fill="'+RED+'" opacity=".85"/>';
      s+='<text x="52" y="71" text-anchor="middle" font-family="monospace" font-size="9" fill="#fff">latent</text>';
      for(var i=0;i<q;i++) s+='<line x1="'+(i*13+6)+'" y1="24" x2="52" y2="56" stroke="'+RULE+'" stroke-width="1"/>';
    } else {
      var w=Math.floor(104/kv);
      for(var k=0;k<kv;k++) s+='<rect x="'+(k*w+1)+'" y="58" width="'+(w-3)+'" height="18" fill="'+RED+'" opacity=".85"/>';
      for(var i=0;i<q;i++){
        var tgt=Math.floor(i/(q/kv))*w+(w-3)/2;
        s+='<line x1="'+(i*13+6)+'" y1="24" x2="'+tgt+'" y2="56" stroke="'+RULE+'" stroke-width="1"/>';
      }
    }
    s+='<text x="0" y="88" font-family="monospace" font-size="8" fill="var(--ink-soft)">KV</text>';
    return s+'</svg>';
  }

  window.patternSVG=function(id){
    var t=window.PATTERN[id]; if(!t||!P[t]) return '';
    return P[t]();
  };

  // ---- proportional time axis ----
  window.axisSVG=function(){
    var M=window.MECHANISMS, W2=880, H=132, L=34, R=14;
    var t0=Date.parse('2017-01-01'), t1=Date.parse('2026-09-01');
    var x=function(d){return L+(Date.parse(d)-t0)/(t1-t0)*(W2-L-R);};
    var Y=78;
    var s='<svg viewBox="0 0 '+W2+' '+H+'" width="100%" height="'+H+'" role="img" aria-label="Mechanisms plotted by real elapsed time. Two long silences are visible: 680 days from 2017 to 2019, and 633 days from 2021 to 2023.">';
    // silence 1 - no pressure yet (neutral)
    s+='<rect x="'+x('2017-06-12')+'" y="'+(Y-26)+'" width="'+(x('2019-04-23')-x('2017-06-12'))+'" height="52" fill="var(--ink)" opacity=".07"/>';
    s+='<text x="'+((x('2017-06-12')+x('2019-04-23'))/2)+'" y="'+(Y-14)+'" text-anchor="middle" font-family="monospace" font-size="10" fill="var(--ink-soft)">680 days</text>';
    s+='<text x="'+((x('2017-06-12')+x('2019-04-23'))/2)+'" y="'+(Y+42)+'" text-anchor="middle" font-family="monospace" font-size="9" fill="var(--ink-soft)">no pressure yet</text>';
    // silence 2 - the anomaly (red)
    s+='<rect x="'+x('2021-08-27')+'" y="'+(Y-26)+'" width="'+(x('2023-05-22')-x('2021-08-27'))+'" height="52" fill="var(--red)" opacity=".13"/>';
    s+='<text x="'+((x('2021-08-27')+x('2023-05-22'))/2)+'" y="'+(Y-14)+'" text-anchor="middle" font-family="monospace" font-size="10" fill="var(--red)">633 days</text>';
    s+='<text x="'+((x('2021-08-27')+x('2023-05-22'))/2)+'" y="'+(Y+42)+'" text-anchor="middle" font-family="monospace" font-size="9" fill="var(--red)">peak pressure, nothing shipped</text>';
    s+='<line x1="'+L+'" y1="'+Y+'" x2="'+(W2-R)+'" y2="'+Y+'" stroke="var(--ink)" stroke-width="1.5"/>';
    for(var y=2017;y<=2026;y++){
      var px=x(y+'-01-01');
      s+='<line x1="'+px+'" y1="'+Y+'" x2="'+px+'" y2="'+(Y+7)+'" stroke="var(--rule)" stroke-width="1"/>';
      s+='<text x="'+px+'" y="'+(Y+21)+'" text-anchor="middle" font-family="monospace" font-size="10" fill="var(--ink-soft)">'+y+'</text>';
    }
    M.forEach(function(m){
      var px=x(m.date.length===7?m.date+'-15':m.date);
      var fa=m.id==='flashattention';
      s+='<circle class="dot" data-id="'+m.id+'" data-name="'+m.name+'" cx="'+px+'" cy="'+(fa?(Y-46):Y)+'" r="'+(fa?6:5)+
         '" fill="'+(fa?'var(--red)':'var(--ink)')+'" stroke="var(--paper)" stroke-width="1.5"><title>'+m.disp+' \u2014 '+m.name+'</title></circle>';
    });
    s+='<text x="'+(x('2022-05-27')+11)+'" y="'+(Y-42)+'" font-family="monospace" font-size="10" fill="var(--red)">FlashAttention \u2014 the explanation</text>';
    return s+'</svg>';
  };
})();

// ---- Which workload is each mechanism actually right for? ----
// Answers the brief directly: "A mechanism that is right for a 2K chatbot and
// wrong for a 1M agent is not a bad mechanism, and your app should be able to say so."
window.REGIME = {
  learned_abs_pos:['2K'], scaled_dot_product:['2K'], sinusoidal:['2K'],
  sparse_attn:['32K'], mqa:['2K'], sliding_window:['32K','1M'],
  linear_attn:['1M'], delta_rule:['1M'], rope:['2K','32K'], topk:['32K','1M'],
  alibi:['2K','32K'], flashattention:['2K','32K','1M'], gqa:['2K','32K','1M'],
  ntk_aware:['32K'], pos_interp:['32K'], yarn:['32K','1M'], attn_sinks:['1M'],
  mla:['32K','1M'], deltanet:['1M'], gated_deltanet:['1M'], nsa:['1M'],
  dsa:['1M'], drope:['32K','1M'], csa_hca:['1M']
};
window.REGIME_LABEL={'2K':'2K chatbot','32K':'32K document','1M':'1M agent'};

// ---- What the field was optimising for, over time ----
// Makes the brief's own sentence visible: "first it wants exactness, then it
// wants memory back, then it wants length, then it wants memory back again."
window.arcSVG=function(){
  var W=880,H=150,L=86,R=14,t0=Date.parse('2017-01-01'),t1=Date.parse('2026-09-01');
  var x=function(d){return L+(Date.parse(d)-t0)/(t1-t0)*(W-L-R);};
  var lanes=[{y:34,k:'exactness'},{y:66,k:'memory'},{y:98,k:'length'}];
  var s='<svg viewBox="0 0 '+W+' '+H+'" width="100%" height="'+H+'" role="img" aria-label="What the field optimised for over time, swinging between exactness, memory and length">';
  lanes.forEach(function(l){
    s+='<line x1="'+L+'" y1="'+l.y+'" x2="'+(W-R)+'" y2="'+l.y+'" stroke="var(--rule-soft)" stroke-width="1"/>';
    s+='<text x="'+(L-6)+'" y="'+(l.y+4)+'" text-anchor="end" font-family="monospace" font-size="10" fill="var(--ink-soft)">'+l.k+'</text>';
  });
  // the swing: date -> which concern dominated
  var pts=[['2017-06-12',34],['2019-04-23',98],['2020-06-29',98],['2021-02-22',66],
           ['2022-05-27',34],['2023-05-22',66],['2023-08-31',98],['2024-06-10',66],
           ['2025-02-16',98],['2026-04-26',66]];
  var d='M '+x(pts[0][0])+' '+pts[0][1];
  for(var i=1;i<pts.length;i++){
    var px=x(pts[i][0]),pp=x(pts[i-1][0]),mid=(pp+px)/2;
    d+=' C '+mid+' '+pts[i-1][1]+' '+mid+' '+pts[i][1]+' '+px+' '+pts[i][1];
  }
  s+='<path d="'+d+'" fill="none" stroke="var(--red)" stroke-width="2.5" opacity=".85"/>';
  pts.forEach(function(p){s+='<circle cx="'+x(p[0])+'" cy="'+p[1]+'" r="3.5" fill="var(--red)"/>';});
  for(var y=2017;y<=2026;y++) s+='<text x="'+x(y+'-01-01')+'" y="'+(H-6)+'" text-anchor="middle" font-family="monospace" font-size="9" fill="var(--ink-soft)">'+y+'</text>';
  return s+'</svg>';
};
