const H=D.h,CV=D.cv,SN=D.sn,NM=D.nm;
function gc(i){return i<7?'mort':i<12?'comp':'read';}
const catN={mort:'Mortality',comp:'Safety & Complications',read:'Readmissions'};
const inp=document.getElementById('search'),dd=document.getElementById('dd'),res=document.getElementById('results');
let cur=null,cCat='mort';

inp.addEventListener('input',function(){
  const raw=this.value.toLowerCase().trim();
  if(raw.length<2){dd.classList.remove('show');return;}
  const tokens=raw.split(/\s+/).filter(t=>t.length>0);
  const m=[];
  for(let i=0;i<H.length&&m.length<8;i++){
    const h=H[i];
    const hay=(h.n+' '+h.c+' '+h.s).toLowerCase();
    const hayNoSpace=hay.replace(/\s+/g,'');
    if(tokens.every(t=>hay.includes(t)||hayNoSpace.includes(t)))m.push([i,h]);
  }
  if(!m.length){dd.classList.remove('show');return;}
  dd.innerHTML=m.map(([i,h])=>{
    const col=h.d<=3?'var(--teal)':h.d<=6?'var(--amber)':h.d<=8?'var(--rose)':'#dc2626';
    return`<div class="dd-i" data-i="${i}"><div class="dd-n">${h.n}<span class="dd-b" style="background:${col}18;color:${col};border:1px solid ${col}33;">D${h.d}</span></div><div class="dd-l">${h.c}, ${h.s} · ${h.dl}</div></div>`;
  }).join('');
  dd.classList.add('show');
  dd.querySelectorAll('.dd-i').forEach(el=>el.onclick=function(){show(H[+this.dataset.i]);dd.classList.remove('show');inp.value=H[+this.dataset.i].n;});
});
document.addEventListener('click',e=>{if(!e.target.closest('.search-outer'))dd.classList.remove('show');});

// Modal
const overlay=document.getElementById('overlay');
const fAgree=document.getElementById('fAgree'),mSubmit=document.getElementById('mSubmit');
function openModal(){
  if(!cur)return;
  document.getElementById('fHosp').value=cur.n+' — '+cur.c+', '+cur.s;
  document.getElementById('mForm').style.display='';
  document.getElementById('mOk').style.display='none';
  fAgree.checked=false;mSubmit.disabled=true;
  overlay.classList.add('open');document.body.style.overflow='hidden';
}
function closeModal(){overlay.classList.remove('open');document.body.style.overflow='';}
document.getElementById('ctaBtn').onclick=openModal;
document.getElementById('mClose').onclick=closeModal;
overlay.onclick=function(e){if(e.target===overlay)closeModal();};
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal();});
fAgree.onchange=function(){mSubmit.disabled=!this.checked;};
mSubmit.onclick=function(){
  if(!fAgree.checked)return;
  const d={hospital:document.getElementById('fHosp').value,name:document.getElementById('fName').value,
    title:document.getElementById('fTitle').value,email:document.getElementById('fEmail').value,
    phone:document.getElementById('fPhone').value,note:document.getElementById('fNote').value,
    decile:cur?cur.d:null,state:cur?cur.s:null,ts:new Date().toISOString()};
  if(!d.name.trim()||!d.email.trim()){alert('Please enter your name and email.');return;}
  if(!d.email.includes('@')){alert('Please enter a valid email address.');return;}
  const s=JSON.parse(localStorage.getItem('heirloom_leads')||'[]');s.push(d);
  localStorage.setItem('heirloom_leads',JSON.stringify(s));
  fetch('https://hooks.zapier.com/hooks/catch/26496010/ucmrtvk/',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(d)}).catch(()=>{});
  document.getElementById('mForm').style.display='none';
  document.getElementById('mOk').style.display='';
  document.getElementById('okHosp').textContent=cur.n;
};

function show(h){
  cur=h;res.classList.remove('hidden');
  document.getElementById('hN').textContent=h.n;
  document.getElementById('hL').textContent=h.c+', '+h.s;
  const dc=h.d<=3?'var(--teal)':h.d<=6?'var(--amber)':h.d<=8?'var(--rose)':'#dc2626';
  let bd=`<span class="bg" style="border-color:${dc}33;color:${dc};">Decile ${h.d} · ${h.dl}</span>`;
  if(h.ruca)bd+=`<span class="bg">RUCA ${h.ruca}</span>`;
  document.getElementById('hB').innerHTML=bd;

  const r=h.r||0;
  const rc=r<-0.3?'c-teal':r>0.3?'c-rose':'c-amber';
  const pc=h.pp<=33?'c-teal':h.pp<=67?'c-amber':'c-rose';
  const ps=h.p?'$'+h.p.toLocaleString():'—';
  const pyc=h.p&&h.pmp?(h.p>=h.pmp?'c-teal':'c-amber'):'c-white';
  let kh=`
    <div class="kpi"><div class="kl">GRI Decile</div><div class="kv" style="color:${dc}">${h.d}</div><div class="ks">${h.dl}</div></div>
    <div class="kpi"><div class="kl">Mortality Gap</div><div class="kv ${rc}">${r>=0?'+':''}${r.toFixed(1)}<small style="font-size:12px">pp</small></div><div class="ks">${r<-0.5?'Outperforming geography':r>0.5?'Opportunity vs peers':'Near expected'}</div></div>
    <div class="kpi"><div class="kl">Peer Rank</div><div class="kv ${pc}">${h.pp}<small style="font-size:12px">th</small></div><div class="ks">Among ${h.pn} D${h.d} hospitals</div></div>
    <div class="kpi"><div class="kl">$/Case</div><div class="kv ${pyc}">${ps}</div><div class="ks">${h.pmp?'Peer median: $'+h.pmp.toLocaleString():''}</div></div>
    <div class="kpi"><div class="kl">Volume</div><div class="kv c-sky">${h.cs.toLocaleString()}</div><div class="ks">Medicare discharges</div></div>`;
  if(h.sv&&h.sv.overall!=null){
    const sc=h.sv.overall>0.7?'c-rose':h.sv.overall>0.4?'c-amber':'c-teal';
    kh+=`<div class="kpi"><div class="kl">Vulnerability</div><div class="kv ${sc}">${(h.sv.overall*100).toFixed(0)}<small style="font-size:12px">th</small></div><div class="ks">More vulnerable than ${(h.sv.overall*100).toFixed(0)}% of US communities</div></div>`;
  }
  document.getElementById('kpis').innerHTML=kh;

  document.getElementById('gPin').style.left=((h.d-0.5)/10*100)+'%';
  document.getElementById('gPin').dataset.label='D'+h.d+' — You';

  const gc2=r<=0?'c-teal':'c-rose';
  document.getElementById('mRow').innerHTML=`
    <div class="mort-c" style="background:var(--teal-dim);border:1px solid rgba(45,212,191,0.15);"><div class="ml">Actual</div><div class="mv c-teal">${h.m}%</div></div>
    <div class="mort-arr">→</div>
    <div class="mort-c" style="background:var(--amber-dim);border:1px solid rgba(251,191,36,0.15);"><div class="ml">GRI Expected</div><div class="mv c-amber">${h.e}%</div></div>
    <div class="mort-arr">→</div>
    <div class="mort-gap" style="text-align:center;"><div class="mv ${gc2}">${r>=0?'+':''}${r.toFixed(1)}pp</div><div class="ml">Residual</div></div>`;

  document.getElementById('curve').innerHTML=CV.map(c=>{
    const ht=((c.m-10)/6)*120;const me=c.d===h.d;
    const col=me?'var(--teal)':`hsl(${175-(c.d-1)*15},50%,${48-c.d*2}%)`;
    return`<div class="cb-w"><div class="cb-v">${c.m}%</div><div class="cb${me?' you':''}" style="height:${Math.max(ht,4)}px;background:${col};"></div><div class="cb-l">D${c.d}${me?'<br>▲':''}</div></div>`;
  }).join('');

  rTabs();rScores('mort');rComm(h);

  // Top DRGs
  const ds=document.getElementById('sDrg'),dw=document.getElementById('drgW');
  if(h.ts&&h.ts.length){
    ds.classList.remove('hidden');
    dw.innerHTML='<div style="display:flex;flex-wrap:wrap;gap:6px;">'+h.ts.map(d=>`<span class="tag" style="background:var(--bg);border:1px solid var(--border);color:var(--text);">${d[0]} <span style="color:var(--teal);font-weight:700;">${d[1]}</span></span>`).join('')+'</div>';
  }else{ds.classList.add('hidden');}

  res.scrollIntoView({behavior:'smooth',block:'start'});
}

function rTabs(){
  document.getElementById('tabs').innerHTML=['mort','comp','read'].map(c=>`<div class="tab${c===cCat?' act':''}" data-c="${c}">${catN[c]}</div>`).join('');
  document.getElementById('tabs').querySelectorAll('.tab').forEach(t=>t.onclick=function(){cCat=this.dataset.c;rTabs();rScores(this.dataset.c);});
}
function rScores(cat){
  const w=document.getElementById('sWrap');
  if(!cur||!cur.sc||!cur.sc.length){w.innerHTML='<div class="empty">No CMS scores available.</div>';return;}
  const sc=cur.sc.filter(s=>gc(s[0])===cat);
  if(!sc.length){w.innerHTML='<div class="empty">No scores in this category.</div>';return;}
  sc.sort((a,b)=>a[0]-b[0]);
  const pm=D.dm&&D.dm[''+h.d]?D.dm[''+h.d]:{};
  let t='<table class="stbl"><tr><th>Measure</th><th class="r">Score</th><th class="r">Peer D'+cur.d+'</th><th class="r">National</th><th class="r">vs National</th><th class="r">vs Peers</th></tr>';
  for(const s of sc){
    const cl=s[2]===1?'s-g':s[2]===-1?'s-r':'s-n';
    const dt=s[2]===1?'dot-g':s[2]===-1?'dot-r':'dot-y';
    const tx=s[2]===1?'Better':s[2]===-1?'Worse':'Same';
    const pv=pm[s[0]]!=null?pm[s[0]]:null;
    let pcl='s-n',pdt='dot-y',ptx='—';
    if(pv!=null){
      const diff=s[1]-pv;
      if(diff<-0.3){pcl='s-g';pdt='dot-g';ptx='Better';}
      else if(diff>0.3){pcl='s-r';pdt='dot-r';ptx='Worse';}
      else{pcl='s-n';pdt='dot-y';ptx='Same';}
    }
    t+=`<tr><td>${SN[s[0]]}</td><td class="r ${cl}">${s[1]}</td><td class="r" style="color:var(--teal)">${pv!=null?pv:'—'}</td><td class="r" style="color:var(--text3)">${s.length>3?s[3]:'—'}</td><td class="r"><span class="dot ${dt}"></span><span class="${cl}">${tx}</span></td><td class="r"><span class="dot ${pdt}"></span><span class="${pcl}">${ptx}</span></td></tr>`;
  }
  w.innerHTML=t+'</table>';
}
function rComm(h){
  const el=document.getElementById('bars');
  if(!h.ch){el.innerHTML='<div class="empty">No community data for this ZIP.</div>';return;}
  const order=['Hypertension','Obesity','Diabetes','Depression','COPD','Heart Disease','Smoking','Disability','No Health Insurance'];
  const mx=60;
  const pm=D.dm&&D.dm[h.d]?D.dm[h.d]:{};
  el.innerHTML=order.filter(k=>h.ch[k]!=null).map(k=>{
    const v=h.ch[k],n=NM[k]||0,p=pm[k]||null;
    const pct=Math.min(v/mx*100,100),npct=Math.min(n/mx*100,100);
    const ppct=p?Math.min(p/mx*100,100):null;
    const col=v>n*1.15?'var(--rose)':v<n*0.85?'var(--teal)':'var(--amber)';
    let markers=`<div class="br-m" style="left:${npct}%;"></div>`;
    if(ppct!=null)markers+=`<div class="br-p" style="left:${ppct}%;"></div>`;
    return`<div class="br"><div class="br-l">${k}</div><div class="br-t"><div class="br-f" style="width:${pct}%;background:${col};"></div>${markers}<div class="br-v" style="color:${col};">${v}%</div></div></div>`;
  }).join('');
}
