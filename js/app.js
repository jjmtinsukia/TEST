const CONFIG={
 dataUrl:"https://docs.google.com/spreadsheets/d/e/2PACX-1vQR226UpdR-5eA-2i6I81WPnYgOzDCjJfThRZCbjUyc4LZGQ-o5en5PFBXrIofUv43U8IbmMszJ2nC8/pub?gid=0&single=true&output=csv",
 fallback:"data/pwss.csv"
};
const C={
 smt:"SMT ID",imis:"IMIS ID",lac:"New LAC \n [ After De-limitation ]",gp:"GP",scheme:"Name of Scheme",so:"SO NAME",sub:"Sub-Division",
 brain:"Work Status \n[ as per JJM Brain as on 10-08-2026 ]",field:"PWSS Operational Status as per FIELD",
 resolve:"Work will be resolve / done by\n[ For Partially or Non Operative PWSS ]",
 estimate:"Estimate Prepared or Not\n[ For Partially or Non Operative PWSS ]",
 aa:"Whether AA Accorded\n[ For Partially or Non Operative PWSS ]",allot:"Work Allotted or Not\n[ For Partially or Non Operative PWSS ]",
 amount:"Estimate Amount [ in Rs. ]",contractor:"If Work Allotted - Name of the Contractor",
 work:"Work Status for making the PWSS functional [ Not Started / Ongoing / Halted / Completed ]",
 remarks:"Remarks",block:"Block\n [ After Delimitation ]",progress:"Physical progress (in %) as per IMIS\n [ 30-06-2026 ]"
};
let rows=[], filtered=[], charts={}, page="warroom";

const $=s=>document.querySelector(s);
const norm=v=>String(v??"").trim().replace(/\s+/g," ");
const up=v=>norm(v).toUpperCase();
const n=v=>{let x=Number(String(v??"").replace(/[₹,\s]/g,""));return Number.isFinite(x)?x:0};
const pct=(a,b)=>b?a/b*100:0;
const esc=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
function badge(v){let x=up(v),c="b-gray";if(x.includes("NON OPERATIVE")||x==="NO"||x==="HALTED")c="b-red";else if(x.includes("PARTIAL")||x.includes("NOT STARTED")||x.includes("ON PROCESS"))c="b-yellow";else if(x==="YES"||x.includes("ONGOING")||x.includes("COMPLETED"))c="b-green";else if(x.includes("HANDED"))c="b-blue";return `<span class="badge ${c}">${esc(v||"Not Reported")}</span>`}
function group(arr,fn){return Object.entries(arr.reduce((o,r)=>{let k=fn(r);(o[k]??=[]).push(r);return o},{}))}
function count(arr,fn){return group(arr,fn).map(([k,v])=>[k,v.length]).sort((a,b)=>b[1]-a[1])}
function destroy(){Object.values(charts).forEach(x=>x?.destroy());charts={}}
function setStatus(t){$("#dataStatus").textContent=t}
function toast(t){let x=$("#toast");x.textContent=t;x.classList.add("show");setTimeout(()=>x.classList.remove("show"),2200)}

async function load(){
 setStatus("Loading live data…");
 try{let r=await fetch(CONFIG.dataUrl,{cache:"no-store"});if(!r.ok)throw 0;parse(await r.text());setStatus("LIVE CSV · "+new Date().toLocaleTimeString())}
 catch(e){try{let r=await fetch(CONFIG.fallback,{cache:"no-store"});if(!r.ok)throw 0;parse(await r.text());setStatus("LOCAL SNAPSHOT · "+new Date().toLocaleTimeString());toast("Live sheet unavailable — local snapshot loaded.")}catch(x){setStatus("DATA LOAD FAILED")}}
}
function parse(text){
 let p=Papa.parse(text,{header:true,skipEmptyLines:true});
 rows=p.data.map((r,i)=>({...r,_row:i+2}));
 refreshGlobalOptions();
 applyFilters();
}
function scope(){
 return rows.filter(r=>up(r[C.brain])==="HANDED_OVER"&&["NON OPERATIVE","PARTIALLY OPERATIVE"].includes(up(r[C.field])));
}
function refreshGlobalOptions(){
 let base=scope(), subs=[...new Set(base.map(r=>norm(r[C.sub])))].filter(Boolean).sort(), sos=[...new Set(base.map(r=>norm(r[C.so])))].filter(Boolean).sort();
 $("#globalSub").innerHTML='<option value="">All Sub-Divisions</option>'+subs.map(x=>`<option>${esc(x)}</option>`).join("");
 $("#globalSO").innerHTML='<option value="">All Section Officers</option>'+sos.map(x=>`<option>${esc(x)}</option>`).join("");
}
function applyFilters(){
 let base=scope(),sub=up($("#globalSub").value),so=up($("#globalSO").value),field=up($("#globalField").value);
 filtered=base.filter(r=>(!sub||up(r[C.sub])===sub)&&(!so||up(r[C.so])===so)&&(!field||up(r[C.field])===field));
 render();
}
function kpi(label,value,sub="",cls=""){return `<div class="card kpi ${cls}"><div class="label">${label}</div><div class="value">${value}</div><div class="sub">${sub}</div></div>`}
function panel(title,note,body){return `<div class="card panel"><div class="panel-title">${title}</div><div class="panel-note">${note||""}</div>${body}</div>`}
function section(title,note){return `<div class="section-head"><div><div class="section-title">${title}</div><div class="section-note">${note||""}</div></div><div class="scope-chip">${filtered.length} IN CURRENT SCOPE</div></div>`}
function chart(id,type,data,opts={}){charts[id]=new Chart(document.getElementById(id),{type,data,options:{responsive:true,maintainAspectRatio:false,...opts}})}

function render(){
 destroy();renderWarroom();renderPipeline();renderSO();renderSOEstimate();renderSub();renderLAC();renderAgency();renderRegister();renderQuality();renderReports();activate(page);
}
function renderWarroom(){
 let a=filtered,N=a.length,non=a.filter(r=>up(r[C.field])==="NON OPERATIVE").length,part=N-non;
 let est=a.filter(r=>up(r[C.estimate])==="YES").length,all=a.filter(r=>up(r[C.allot])==="YES").length,ongo=a.filter(r=>up(r[C.work])==="ONGOING").length,done=a.filter(r=>up(r[C.work])==="COMPLETED").length;
 let amount=a.reduce((s,r)=>s+n(r[C.amount]),0),missing=a.filter(r=>!norm(r[C.work])).length;
 $("#page-warroom").innerHTML=section("Executive War Room","Management view of the current restoration universe")+`
 <div class="grid g8">
 ${kpi("Affected PWSS",N,"Filtered HANDED_OVER universe","blue")}${kpi("Non-Operative",non,pct(non,N).toFixed(1)+"%","danger")}
 ${kpi("Partially Operative",part,pct(part,N).toFixed(1)+"%","warn")}${kpi("Estimate Prepared",est,pct(est,N).toFixed(1)+"%")}
 ${kpi("Work Allotted",all,pct(all,N).toFixed(1)+"%")}${kpi("Work Ongoing",ongo,pct(ongo,N).toFixed(1)+"%","blue")}
 ${kpi("Completed",done,pct(done,N).toFixed(1)+"%","green")}${kpi("Known Estimate",`₹${(amount/1e7).toFixed(2)} Cr`,a.filter(r=>n(r[C.amount])>0).length+" records")}
 </div>
 <div class="grid g2" style="margin-top:12px">
 ${panel("Restoration Progress","Actual work status",`<div class="chart"><canvas id="wrWork"></canvas></div>`)}
 ${panel("Operational Burden","Field status",`<div class="chart"><canvas id="wrField"></canvas></div>`)}
 </div>
 <div class="grid g2" style="margin-top:12px">
 ${panel("Sub-Division Burden","Affected PWSS by Sub-Division",`<div class="chart"><canvas id="wrSub"></canvas></div>`)}
 ${panel("Immediate Action Queue","Do not confuse missing reporting with Not Started",`
 <div class="grid g2">
 <div class="action-card"><div class="n">${a.filter(r=>up(r[C.work])==="HALTED").length}</div><div class="l">Halted</div><div class="s">Immediate escalation</div></div>
 <div class="action-card"><div class="n">${a.filter(r=>up(r[C.work])==="NOT STARTED").length}</div><div class="l">Not Started</div><div class="s">Work has not commenced</div></div>
 <div class="action-card"><div class="n">${a.filter(r=>up(r[C.allot])==="NO").length}</div><div class="l">Not Allotted</div><div class="s">Allotment action pending</div></div>
 <div class="action-card"><div class="n">${missing}</div><div class="l">Work Status Missing</div><div class="s">Reporting compliance issue</div></div>
 </div>`)}</div>
 <div style="margin-top:12px">${panel("Executive Interpretation","What the current dataset says",`
 <div class="callout info-callout"><strong>${pct(done,N).toFixed(1)}% of affected PWSS are marked Completed.</strong>
 <small>${missing} records have no Column X work status, so reporting coverage must be monitored separately from restoration progress.</small></div>`)}</div>`;
 let ws=["Not Started","Ongoing","Halted","Completed","Not Reported"],wv=ws.map(x=>x==="Not Reported"?a.filter(r=>!norm(r[C.work])).length:a.filter(r=>up(r[C.work])===up(x)).length);
 chart("wrWork","bar",{labels:ws,datasets:[{label:"PWSS",data:wv}]},{plugins:{legend:{display:false}},scales:{y:{beginAtZero:true}}});
 chart("wrField","doughnut",{labels:["Non-Operative","Partially Operative"],datasets:[{data:[non,part]}]},{plugins:{legend:{position:"bottom"}}});
 let sg=count(a,r=>norm(r[C.sub])||"Not Reported");
 chart("wrSub","bar",{labels:sg.map(x=>x[0]),datasets:[{label:"Affected",data:sg.map(x=>x[1])}]},{indexAxis:"y",plugins:{legend:{display:false}},scales:{x:{beginAtZero:true}}});
}
function renderPipeline(){
 let a=filtered,N=a.length,missing=a.filter(r=>!norm(r[C.work])).length;
 let stages=[["Estimate Prepared",a.filter(r=>up(r[C.estimate])==="YES").length],["Estimate Under Process",a.filter(r=>up(r[C.estimate])==="ON PROCESS").length],["Work Allotted",a.filter(r=>up(r[C.allot])==="YES").length],["Work Ongoing",a.filter(r=>up(r[C.work])==="ONGOING").length],["Completed",a.filter(r=>up(r[C.work])==="COMPLETED").length]];
 $("#page-pipeline").innerHTML=section("Restoration Pipeline","Track the intervention pathway; stages are not assumed to be mutually exclusive")+`
 <div class="pipeline">${stages.map(s=>`<div class="stage"><div class="num">${s[1]}</div><div class="name">${s[0]}</div><div class="pct">${pct(s[1],N).toFixed(1)}% of current scope</div></div>`).join("")}</div>
 <div class="grid g2" style="margin-top:12px">${panel("Work Status","Column X",`<div class="chart"><canvas id="plWork"></canvas></div>`)}${panel("Estimate × Allotment","Where cases are getting stuck",`<div class="chart"><canvas id="plMix"></canvas></div>`)}</div>
 <div style="margin-top:12px">${panel("Pipeline Exception Register","Potential bottlenecks",`<div class="table-wrap"><table class="table"><thead><tr><th>Issue</th><th>Count</th><th>Management meaning</th></tr></thead><tbody>
 <tr><td>Work Not Allotted</td><td><b>${a.filter(r=>up(r[C.allot])==="NO").length}</b></td><td>Work-allotment action required</td></tr>
 <tr><td>Work Status Missing</td><td><b>${missing}</b></td><td>SO reporting update required</td></tr>
 <tr><td>Estimate Not Prepared</td><td><b>${a.filter(r=>up(r[C.estimate])==="NO").length}</b></td><td>Estimate preparation required</td></tr>
 <tr><td>Contractor Missing after Allotment</td><td><b>${a.filter(r=>up(r[C.allot])==="YES"&&!norm(r[C.contractor])).length}</b></td><td>Reconcile allotment / contractor details</td></tr>
 </tbody></table></div>`)}</div>`;
 let ws=["Not Started","Ongoing","Halted","Completed","Not Reported"],wv=ws.map(x=>x==="Not Reported"?missing:a.filter(r=>up(r[C.work])===up(x)).length);
 chart("plWork","doughnut",{labels:ws,datasets:[{data:wv}]},{plugins:{legend:{position:"bottom"}}});
 let est=["YES","ON PROCESS","NO","Not Reported"], vals=est.map(e=>a.filter(r=>(norm(r[C.estimate])?up(r[C.estimate]):"Not Reported")===e).length);
 chart("plMix","bar",{labels:est,datasets:[{label:"PWSS",data:vals}]},{plugins:{legend:{display:false}},scales:{y:{beginAtZero:true}}});
}
function renderSO(){
 let a=filtered,N=a.length,g=group(a,r=>norm(r[C.so])||"Not Reported");
 let data=g.map(([so,rs])=>{let done=rs.filter(r=>up(r[C.work])==="COMPLETED").length,miss=rs.filter(r=>!norm(r[C.work])).length,halted=rs.filter(r=>up(r[C.work])==="HALTED").length,started=rs.filter(r=>up(r[C.work])==="NOT STARTED").length,ongoing=rs.filter(r=>up(r[C.work])==="ONGOING").length;return {so,rs,n:rs.length,subs:[...new Set(rs.map(r=>norm(r[C.sub])))].filter(Boolean).join(", ")||"—",non:rs.filter(r=>up(r[C.field])==="NON OPERATIVE").length,partial:rs.filter(r=>up(r[C.field])==="PARTIALLY OPERATIVE").length,est:rs.filter(r=>up(r[C.estimate])==="YES").length,all:rs.filter(r=>up(r[C.allot])==="YES").length,started,ongoing,halted,done,miss,amount:rs.reduce((s,r)=>s+n(r[C.amount]),0),coverage:pct(rs.length-miss,rs.length),progress:pct(done,rs.length)}}).sort((x,y)=>y.n-x.n);
 let avgProg=data.reduce((s,x)=>s+x.progress,0)/(data.length||1),avgCov=data.reduce((s,x)=>s+x.coverage,0)/(data.length||1);
 let row=x=>`<tr data-so="${esc(x.so)}"><td><b>${esc(x.so)}</b></td><td>${esc(x.subs)}</td><td>${x.n}</td><td>${x.non}</td><td>${x.partial}</td><td>${x.est}</td><td>${x.amount?`₹${(x.amount/1e5).toFixed(1)} L`:"—"}</td><td>${x.all}</td><td>${x.started}</td><td>${x.ongoing}</td><td>${x.halted}</td><td>${x.done}</td><td>${x.progress.toFixed(1)}%</td><td>${x.coverage.toFixed(1)}%</td><td><button class="btn btn-light drill" data-so="${esc(x.so)}">View</button></td></tr>`;
 $("#page-so").innerHTML=section("SO NAME-wise Report","Primary field-level accountability and reporting view")+`
 <div class="grid g4">
 ${kpi("Section Officers",data.length,"Distinct SO in current scope","blue")}${kpi("Affected PWSS",N,"Across all Section Officers")}
 ${kpi("Avg. Completion",avgProg.toFixed(1)+"%","Completed / affected")}${kpi("Avg. Data Coverage",avgCov.toFixed(1)+"%","Work status reported","green")}
 </div>
 <div class="filters" style="margin-top:12px"><input id="soSearch" class="search" placeholder="Search Section Officer…">
 <select id="soSort"><option value="n">Sort: Most Affected</option><option value="prog">Sort: Highest Completion</option><option value="miss">Sort: Most Missing Status</option></select></div>
 ${panel("SO Performance Matrix","Restoration progress + reporting coverage per Section Officer",`<div class="table-wrap"><table class="table" id="soTable"><thead><tr><th>SO NAME</th><th>Sub-Division</th><th>Affected</th><th>Non-Op</th><th>Partial</th><th>Estimate</th><th>Est. Amount</th><th>Allotted</th><th>Not Started</th><th>Ongoing</th><th>Halted</th><th>Completed</th><th>Progress</th><th>Data Coverage</th><th></th></tr></thead><tbody>${data.map(row).join("")}</tbody></table></div>`)}
 <div class="grid g2" style="margin-top:12px">
 ${panel("Affected vs Completed","SO burden in the current scope",`<div class="chart"><canvas id="soBurden"></canvas></div>`)}
 ${panel("SO Action Watch","Officers requiring immediate attention",`<div class="table-wrap"><table class="table"><thead><tr><th>SO NAME</th><th>Affected</th><th>Not Started</th><th>Halted</th><th>Status Missing</th><th></th></tr></thead><tbody>
 ${data.filter(x=>x.halted||x.started||x.miss).sort((p,q)=>(q.halted+q.started+q.miss)-(p.halted+p.started+p.miss)).slice(0,6).map(x=>`<tr><td><b>${esc(x.so)}</b></td><td>${x.n}</td><td>${x.started}</td><td>${x.halted}</td><td>${x.miss}</td><td><button class="btn btn-light drill" data-so="${esc(x.so)}">View</button></td></tr>`).join("")||`<tr><td colspan="6"><div class="empty">No immediate attention cases.</div></td></tr>`}
 </tbody></table></div>`)}
 </div>
 <div id="soDetail" style="margin-top:12px"></div>`;
 let search=$("#soSearch"),sort=$("#soSort");
 let apply=()=>{let q=up(search.value),key=sort.value,list=data.filter(x=>!q||up(x.so).includes(q));if(key==="prog")list=[...list].sort((a,b)=>b.progress-a.progress);else if(key==="miss")list=[...list].sort((a,b)=>b.miss-a.miss);else list=[...list].sort((a,b)=>b.n-a.n);$("#soTable tbody").innerHTML=list.map(row).join("");document.querySelectorAll("#soTable .drill").forEach(b=>b.onclick=()=>soDetail(b.dataset.so))};
 search.oninput=apply;sort.onchange=apply;
 document.querySelectorAll(".drill").forEach(b=>b.onclick=()=>soDetail(b.dataset.so));
 chart("soBurden","bar",{labels:data.map(x=>x.so),datasets:[{label:"Affected",data:data.map(x=>x.n)},{label:"Completed",data:data.map(x=>x.done)}]},{indexAxis:"y",plugins:{legend:{position:"bottom"}},scales:{x:{beginAtZero:true}}});
}
function soDetail(so){
 let rs=filtered.filter(r=>(norm(r[C.so])||"Not Reported")===so),done=rs.filter(r=>up(r[C.work])==="COMPLETED").length,miss=rs.filter(r=>!norm(r[C.work])).length,amount=rs.reduce((s,r)=>s+n(r[C.amount]),0);
 $("#soDetail").innerHTML=panel(`SO Drill-down — ${esc(so)}`,"Detailed restoration record for the selected Section Officer",`
 <div class="grid g6">
 ${kpi("Affected",rs.length,"Current scope","blue")}${kpi("Non-Operative",rs.filter(r=>up(r[C.field])==="NON OPERATIVE").length,"","danger")}
 ${kpi("Ongoing",rs.filter(r=>up(r[C.work])==="ONGOING").length,"","warn")}${kpi("Completed",done,pct(done,rs.length).toFixed(1)+"%","green")}
 ${kpi("Est. Amount",`₹${(amount/1e5).toFixed(1)} L`,rs.filter(r=>n(r[C.amount])>0).length+" records with amount")}${kpi("Data Coverage",pct(rs.length-miss,rs.length).toFixed(1)+"%",miss+" missing work status")}
 </div>
 <div style="margin-top:11px" class="table-wrap"><table class="table"><thead><tr><th>SMT ID</th><th>IMIS ID</th><th>Scheme</th><th>GP</th><th>LAC</th><th>Sub-Division</th><th>Field</th><th>Resolve By</th><th>Estimate</th><th>Est. Amount</th><th>AA</th><th>Allotted</th><th>Contractor</th><th>Work Status</th><th>Phys. Progress</th><th>Remarks</th></tr></thead><tbody>
 ${rs.map(r=>`<tr><td>${esc(r[C.smt])}</td><td>${esc(r[C.imis])||"—"}</td><td>${esc(r[C.scheme])}</td><td>${esc(r[C.gp])||"—"}</td><td>${esc(r[C.lac])||"—"}</td><td>${esc(r[C.sub])}</td><td>${badge(r[C.field])}</td><td>${esc(r[C.resolve])||"—"}</td><td>${badge(r[C.estimate])}</td><td>${n(r[C.amount])?`₹${n(r[C.amount]).toLocaleString("en-IN")}`:"—"}</td><td>${badge(r[C.aa])}</td><td>${badge(r[C.allot])}</td><td>${esc(r[C.contractor])||"—"}</td><td>${badge(r[C.work])}</td><td>${norm(r[C.progress])||"—"}</td><td>${esc(r[C.remarks])||"—"}</td></tr>`).join("")}
  </tbody></table></div>`);
}
function renderSOEstimate(){
 let a=filtered,N=a.length,g=group(a,r=>norm(r[C.so])||"Not Reported");
 let data=g.map(([so,rs])=>{let est=rs.filter(r=>up(r[C.estimate])==="YES").length,amount=rs.reduce((s,r)=>s+n(r[C.amount]),0),estAmt=rs.filter(r=>up(r[C.estimate])==="YES").reduce((s,r)=>s+n(r[C.amount]),0);return {so,n:rs.length,est,amount,estAmt,avg:est?estAmt/est:0}}).sort((x,y)=>y.amount-x.amount);
 let totalAmt=a.reduce((s,r)=>s+n(r[C.amount]),0),totalEst=a.filter(r=>up(r[C.estimate])==="YES").length,totalEstAmt=a.filter(r=>up(r[C.estimate])==="YES").reduce((s,r)=>s+n(r[C.amount]),0),overallAvg=totalEst?totalEstAmt/totalEst:0;
 $("#page-soestimate").innerHTML=section("SO Wise Estimation","Estimate preparation and cost position per Section Officer")+`
 <div class="grid g6">
 ${kpi("Section Officers",data.length,"Distinct SO in scope","blue")}${kpi("Affected Schemes",N,"Current filtered universe")}
 ${kpi("Estimates Prepared",totalEst,pct(totalEst,N).toFixed(1)+"% of affected","warn")}${kpi("Total Est. Amount",`₹${(totalAmt/1e7).toFixed(2)} Cr`,"All reported amounts")}
 ${kpi("Avg. Cost / Estimate",`₹${(overallAvg/1e5).toFixed(2)} L`,"When estimate exists")}${kpi("Estimate Coverage",pct(totalEst,N).toFixed(1)+"%","Prepared / affected","green")}
 </div>
 <div class="grid g2" style="margin-top:12px">
 ${panel("SO-wise Estimated Amount","Total estimate value by Section Officer",`<div class="chart"><canvas id="soestChart"></canvas></div>`)}
 ${panel("Average Cost by SO","Estimate value (₹ Lakhs) per prepared estimate",`<div class="chart"><canvas id="soestAvg"></canvas></div>`)}
 </div>
 <div style="margin-top:12px">${panel("SO-wise Estimation Table","Affected schemes, estimates prepared and estimate value per Section Officer",`<div class="table-wrap"><table class="table" id="soestTable"><thead><tr><th>SO Name</th><th>Affected Schemes</th><th>Estimate Count</th><th>Est. Prepared %</th><th>Est. Amount</th><th>Average Cost</th></tr></thead><tbody>
 ${data.map(x=>`<tr><td><b>${esc(x.so)}</b></td><td>${x.n}</td><td>${x.est}</td><td>${pct(x.est,x.n).toFixed(1)}%</td><td>${x.amount?`₹${(x.amount/1e5).toFixed(2)} L`:"—"}</td><td>${x.avg?`₹${(x.avg/1e5).toFixed(2)} L`:"—"}</td></tr>`).join("")}
 </tbody><tfoot><tr><td><b>Total</b></td><td><b>${N}</b></td><td><b>${totalEst}</b></td><td>${pct(totalEst,N).toFixed(1)}%</td><td><b>₹${(totalAmt/1e7).toFixed(2)} Cr</b></td><td><b>₹${(overallAvg/1e5).toFixed(2)} L</b></td></tr></tfoot></table></div>`)}</div>`;
 chart("soestChart","bar",{labels:data.map(x=>x.so),datasets:[{label:"Est. Amount (₹ L)",data:data.map(x=>x.amount/1e5)}]},{indexAxis:"y",plugins:{legend:{display:false}},scales:{x:{beginAtZero:true}}});
 chart("soestAvg","bar",{labels:data.map(x=>x.so),datasets:[{label:"Avg. Cost (₹ L)",data:data.map(x=>x.avg/1e5)}]},{indexAxis:"y",plugins:{legend:{display:false}},scales:{x:{beginAtZero:true}}});
}
function renderSub(){
 let g=group(filtered,r=>norm(r[C.sub])||"Not Reported"),data=g.map(([s,rs])=>({s,n:rs.length,non:rs.filter(r=>up(r[C.field])==="NON OPERATIVE").length,part:rs.filter(r=>up(r[C.field])==="PARTIALLY OPERATIVE").length,est:rs.filter(r=>up(r[C.estimate])==="YES").length,all:rs.filter(r=>up(r[C.allot])==="YES").length,ongo:rs.filter(r=>up(r[C.work])==="ONGOING").length,done:rs.filter(r=>up(r[C.work])==="COMPLETED").length}));
 $("#page-subdivision").innerHTML=section("Sub-Division Report","Division-level comparison of restoration burden and progress")+`
 ${panel("Sub-Division Performance","Affected PWSS",`<div class="table-wrap"><table class="table"><thead><tr><th>Sub-Division</th><th>Affected</th><th>Non-Op</th><th>Partial</th><th>Estimate</th><th>Allotted</th><th>Ongoing</th><th>Completed</th><th>Completion</th></tr></thead><tbody>${data.map(x=>`<tr><td><b>${esc(x.s)}</b></td><td>${x.n}</td><td>${x.non}</td><td>${x.part}</td><td>${x.est}</td><td>${x.all}</td><td>${x.ongo}</td><td>${x.done}</td><td>${pct(x.done,x.n).toFixed(1)}%</td></tr>`).join("")}</tbody></table></div>`)}
 <div class="grid g2" style="margin-top:12px">${panel("Operational Burden","Non-Operative vs Partially Operative",`<div class="chart"><canvas id="sdBurden"></canvas></div>`)}${panel("Completion","Completed / affected",`<div class="chart"><canvas id="sdDone"></canvas></div>`)}</div>`;
 chart("sdBurden","bar",{labels:data.map(x=>x.s),datasets:[{label:"Non-Operative",data:data.map(x=>x.non)},{label:"Partially Operative",data:data.map(x=>x.part)}]},{scales:{y:{beginAtZero:true}}});
 chart("sdDone","bar",{labels:data.map(x=>x.s),datasets:[{label:"Completed",data:data.map(x=>x.done)}]},{plugins:{legend:{display:false}},scales:{y:{beginAtZero:true}}});
}

function renderLAC(){
 let g=group(filtered,r=>norm(r[C.lac])||"Not Reported");
 let data=g.map(([lac,rs])=>{
   let non=rs.filter(r=>up(r[C.field])==="NON OPERATIVE").length, part=rs.filter(r=>up(r[C.field])==="PARTIALLY OPERATIVE").length;
   let est=rs.filter(r=>up(r[C.estimate])==="YES").length, all=rs.filter(r=>up(r[C.allot])==="YES").length;
   let ongoing=rs.filter(r=>up(r[C.work])==="ONGOING").length, done=rs.filter(r=>up(r[C.work])==="COMPLETED").length;
   let missing=rs.filter(r=>!norm(r[C.work])).length, amount=rs.reduce((x,r)=>x+n(r[C.amount]),0);
   return {lac,rs,n:rs.length,non,part,est,all,ongoing,done,missing,amount,completion:pct(done,rs.length),coverage:pct(rs.length-missing,rs.length)};
 }).sort((a,b)=>b.n-a.n);
 $("#page-lac").innerHTML=section("LAC Report","Consolidated monitoring of affected PWSS by New LAC / Assembly Constituency")+`
 <div class="filters"><input id="lacSearch" class="search" placeholder="Search LAC…"></div>
 <div class="grid g6">
 ${kpi("LACs in Scope",data.length,"Distinct Column D values","blue")}
 ${kpi("Affected PWSS",filtered.length,"Current filtered universe")}
 ${kpi("Non-Operative",filtered.filter(r=>up(r[C.field])==="NON OPERATIVE").length,"","danger")}
 ${kpi("Partially Operative",filtered.filter(r=>up(r[C.field])==="PARTIALLY OPERATIVE").length,"","warn")}
 ${kpi("Completed",filtered.filter(r=>up(r[C.work])==="COMPLETED").length,"","green")}
 ${kpi("Known Estimate",`₹${(filtered.reduce((x,r)=>x+n(r[C.amount]),0)/1e7).toFixed(2)} Cr`,"Entered estimate amounts")}
 </div>
 <div class="grid g2" style="margin-top:12px">
 ${panel("Affected PWSS by LAC","Column D · New LAC [ After De-limitation ]",`<div class="chart tall"><canvas id="lacBurden"></canvas></div>`)}
 ${panel("LAC-wise Completed PWSS","Completed / affected",`<div class="chart tall"><canvas id="lacDone"></canvas></div>`)}
 </div>
 <div style="margin-top:12px">${panel("LAC-wise Performance Matrix","Click a LAC to drill down to its affected PWSS",`
 <div class="table-wrap"><table class="table" id="lacTable"><thead><tr>
 <th>LAC</th><th>Affected</th><th>Non-Op</th><th>Partial</th><th>Estimate</th><th>Allotted</th><th>Ongoing</th><th>Completed</th><th>Completion</th><th>Status Coverage</th><th>Known Estimate</th><th></th>
 </tr></thead><tbody>${data.map(x=>`<tr data-lac="${esc(x.lac)}">
 <td><b>${esc(x.lac)}</b></td><td>${x.n}</td><td>${x.non}</td><td>${x.part}</td><td>${x.est}</td><td>${x.all}</td><td>${x.ongoing}</td><td>${x.done}</td>
 <td>${x.completion.toFixed(1)}%</td><td>${x.coverage.toFixed(1)}%</td><td>${x.amount?`₹${x.amount.toLocaleString("en-IN")}`:"—"}</td>
 <td><button class="btn btn-light lac-drill" data-lac="${esc(x.lac)}">View</button></td></tr>`).join("")}</tbody></table></div>`)}</div>
 <div id="lacDetail" style="margin-top:12px"></div>`;
 $("#lacSearch").oninput=()=>{let q=up($("#lacSearch").value);document.querySelectorAll("#lacTable tbody tr").forEach(tr=>tr.style.display=!q||up(tr.dataset.lac).includes(q)?"":"none")};
 document.querySelectorAll(".lac-drill").forEach(b=>b.onclick=()=>lacDetail(b.dataset.lac));
 chart("lacBurden","bar",{labels:data.map(x=>x.lac),datasets:[{label:"Non-Operative",data:data.map(x=>x.non)},{label:"Partially Operative",data:data.map(x=>x.part)}]},
 {indexAxis:"y",plugins:{legend:{position:"bottom"}},scales:{x:{beginAtZero:true}}});
 chart("lacDone","bar",{labels:data.map(x=>x.lac),datasets:[{label:"Completed",data:data.map(x=>x.done)}]},
 {indexAxis:"y",plugins:{legend:{display:false}},scales:{x:{beginAtZero:true}}});
}
function lacDetail(lac){
 let rs=filtered.filter(r=>(norm(r[C.lac])||"Not Reported")===lac);
 $("#lacDetail").innerHTML=panel(`LAC Drill-down — ${esc(lac)}`,"Individual PWSS records under the selected LAC",`
 <div class="grid g4">${kpi("Affected",rs.length)}${kpi("Non-Operative",rs.filter(r=>up(r[C.field])==="NON OPERATIVE").length,"","danger")}
 ${kpi("Ongoing",rs.filter(r=>up(r[C.work])==="ONGOING").length,"","blue")}${kpi("Completed",rs.filter(r=>up(r[C.work])==="COMPLETED").length,"","green")}</div>
 <div style="margin-top:11px" class="table-wrap"><table class="table"><thead><tr>
 <th>SMT ID</th><th>Scheme</th><th>SO</th><th>Sub-Division</th><th>Field Status</th><th>Resolve By</th><th>Estimate</th><th>Allotted</th><th>Contractor</th><th>Work Status</th><th>Remarks</th>
 </tr></thead><tbody>${rs.map(r=>`<tr><td>${esc(r[C.smt])}</td><td>${esc(r[C.scheme])}</td><td>${esc(r[C.so])}</td><td>${esc(r[C.sub])}</td>
 <td>${badge(r[C.field])}</td><td>${esc(r[C.resolve])||"—"}</td><td>${badge(r[C.estimate])}</td><td>${badge(r[C.allot])}</td>
 <td>${esc(r[C.contractor])||"—"}</td><td>${badge(r[C.work])}</td><td>${esc(r[C.remarks])||"—"}</td></tr>`).join("")}</tbody></table></div>`);
}

function renderAgency(){
 let g=count(filtered,r=>norm(r[C.resolve])||"Not Reported"),N=filtered.length;
 $("#page-agency").innerHTML=section("Responsibility / Agency","Who is expected to resolve the functional issue?")+`
 <div class="grid g4">${g.slice(0,4).map((x,i)=>kpi(x[0],x[1],pct(x[1],N).toFixed(1)+"% of scope",i===0?"blue":"")).join("")}</div>
 <div style="margin-top:12px">${panel("Resolution Agency Distribution","Column R",`<div class="chart tall"><canvas id="agChart"></canvas></div>`)}</div>
 <div style="margin-top:12px">${panel("Agency Action Table","Use this to identify coordination-heavy work",`<div class="table-wrap"><table class="table"><thead><tr><th>Agency / Mechanism</th><th>Affected</th><th>%</th><th>Non-Op</th><th>Partial</th><th>Ongoing</th><th>Completed</th><th>Status Missing</th></tr></thead><tbody>${g.map(x=>{let rs=filtered.filter(r=>(norm(r[C.resolve])||"Not Reported")===x[0]);return `<tr><td><b>${esc(x[0])}</b></td><td>${x[1]}</td><td>${pct(x[1],N).toFixed(1)}%</td><td>${rs.filter(r=>up(r[C.field])==="NON OPERATIVE").length}</td><td>${rs.filter(r=>up(r[C.field])==="PARTIALLY OPERATIVE").length}</td><td>${rs.filter(r=>up(r[C.work])==="ONGOING").length}</td><td>${rs.filter(r=>up(r[C.work])==="COMPLETED").length}</td><td>${rs.filter(r=>!norm(r[C.work])).length}</td></tr>`}).join("")}</tbody></table></div>`)}</div>`;
 chart("agChart","bar",{labels:g.map(x=>x[0]),datasets:[{label:"Affected PWSS",data:g.map(x=>x[1])}]},{indexAxis:"y",plugins:{legend:{display:false}},scales:{x:{beginAtZero:true}}});
}
function renderRegister(){
 $("#page-register").innerHTML=section("PWSS Action Register","Operational drill-down; every row is a current-scope restoration case")+`
 <div class="filters"><input id="regSearch" class="search" placeholder="Search SMT ID, scheme, GP, SO, IMIS…">
 <select id="regWork"><option value="">All Work Status</option><option>Not Started</option><option>Ongoing</option><option>Halted</option><option>Completed</option><option value="__M">Not Reported</option></select>
 <select id="regAllot"><option value="">All Allotment</option><option>YES</option><option>NO</option><option value="__M">Not Reported</option></select>
 <select id="regAgency"><option value="">All Agencies</option></select>
 <button class="btn btn-dark" id="exportBtn">Export CSV</button></div>
 <div id="regCount" class="section-note"></div>
 <div class="table-wrap"><table class="table" id="regTable"><thead><tr><th>SMT ID</th><th>Scheme</th><th>SO</th><th>Sub-Division</th><th>Field</th><th>Resolve By</th><th>Estimate</th><th>Amount</th><th>Allotted</th><th>Contractor</th><th>Work Status</th><th>Remarks</th></tr></thead><tbody></tbody></table></div>`;
 let agencies=[...new Set(filtered.map(r=>norm(r[C.resolve])))].filter(Boolean).sort();$("#regAgency").innerHTML+='<option value="">All Agencies</option>'+agencies.map(x=>`<option>${esc(x)}</option>`).join("");
 ["regSearch","regWork","regAllot","regAgency"].forEach(id=>$("#"+id).oninput=updateReg);$("#exportBtn").onclick=exportCSV;updateReg();
}
function updateReg(){
 let q=up($("#regSearch").value),w=$("#regWork").value,a=$("#regAllot").value,ag=up($("#regAgency").value);
 let rs=filtered.filter(r=>{let blob=up([r[C.smt],r[C.imis],r[C.scheme],r[C.gp],r[C.so],r[C.sub]].join(" ")),wv=norm(r[C.work]),av=norm(r[C.allot]);return(!q||blob.includes(q))&&(!w||(w==="__M"?!wv:up(wv)===up(w)))&&(!a||(a==="__M"?!av:up(av)===up(a)))&&(!ag||up(r[C.resolve])===ag)});
 $("#regCount").textContent=`Showing ${rs.length} of ${filtered.length} current-scope PWSS`;window.regRows=rs;
 $("#regTable tbody").innerHTML=rs.map(r=>`<tr><td>${esc(r[C.smt])}</td><td>${esc(r[C.scheme])}</td><td>${esc(r[C.so])}</td><td>${esc(r[C.sub])}</td><td>${badge(r[C.field])}</td><td>${esc(r[C.resolve])||"—"}</td><td>${badge(r[C.estimate])}</td><td>${n(r[C.amount])?`₹${n(r[C.amount]).toLocaleString("en-IN")}`:"—"}</td><td>${badge(r[C.allot])}</td><td>${esc(r[C.contractor])||"—"}</td><td>${badge(r[C.work])}</td><td>${esc(r[C.remarks])||"—"}</td></tr>`).join("")||`<tr><td colspan="12"><div class="empty">No records match the filters.</div></td></tr>`;
}
function exportCSV(){let rs=window.regRows||filtered,cols=[C.smt,C.imis,C.lac,C.scheme,C.gp,C.so,C.sub,C.field,C.resolve,C.estimate,C.aa,C.allot,C.amount,C.contractor,C.work,C.remarks];let csv=Papa.unparse(rs.map(r=>Object.fromEntries(cols.map(c=>[c,r[c]??""]))));let b=new Blob([csv],{type:"text/csv;charset=utf-8"}),a=document.createElement("a");a.href=URL.createObjectURL(b);a.download="PWSS_Restoration_Action_Register.csv";a.click();URL.revokeObjectURL(a.href);toast("Register exported.")}
function renderQuality(){
 let a=filtered,N=a.length,checks=[["Resolution agency missing",a.filter(r=>!norm(r[C.resolve])).length],["Estimate status missing",a.filter(r=>!norm(r[C.estimate])).length],["Estimate amount missing",a.filter(r=>!n(r[C.amount])).length],["Allotment status missing",a.filter(r=>!norm(r[C.allot])).length],["Contractor missing",a.filter(r=>!norm(r[C.contractor])).length],["Work status missing",a.filter(r=>!norm(r[C.work])).length],["Remarks missing",a.filter(r=>!norm(r[C.remarks])).length]];
 let flags=[["Allotted YES + contractor missing",a.filter(r=>up(r[C.allot])==="YES"&&!norm(r[C.contractor])).length],["Completed + field Non-Operative",a.filter(r=>up(r[C.work])==="COMPLETED"&&up(r[C.field])==="NON OPERATIVE").length],["Ongoing + allotment not YES",a.filter(r=>up(r[C.work])==="ONGOING"&&up(r[C.allot])!=="YES").length],["Halted",a.filter(r=>up(r[C.work])==="HALTED").length]];
 $("#page-quality").innerHTML=section("Data Quality & Reconciliation","Separate missing reporting from actual negative responses")+`
 <div class="grid g2">${panel("Completeness","Missing data in current scope",`<div class="table-wrap"><table class="table"><thead><tr><th>Field</th><th>Missing</th><th>Coverage</th></tr></thead><tbody>${checks.map(x=>`<tr><td>${x[0]}</td><td><b>${x[1]}</b></td><td>${pct(N-x[1],N).toFixed(1)}%</td></tr>`).join("")}</tbody></table></div>`)}
 ${panel("Reconciliation Flags","Potential inconsistencies",`<div class="table-wrap"><table class="table"><thead><tr><th>Rule</th><th>Records</th></tr></thead><tbody>${flags.map(x=>`<tr><td>${x[0]}</td><td><b>${x[1]}</b></td></tr>`).join("")}</tbody></table></div>`)}</div>
 <div class="callout info-callout" style="margin-top:12px"><strong>Rule:</strong><small>Blank Work Status is treated as <b>Not Reported</b>, not as Not Started. This preserves the distinction between operational delay and reporting non-compliance.</small></div>`;
}
function renderReports(){
 $("#page-reports").innerHTML=section("Reports","Print-ready management summaries")+`
 <div class="grid g3">
 <div class="card panel"><div class="panel-title">Executive War Room</div><div class="panel-note">Current filtered scope</div><button class="btn btn-dark reportBtn" data-report="warroom">Print Executive Report</button></div>
 <div class="card panel"><div class="panel-title">SO Name-wise Report</div><div class="panel-note">All SOs in current scope</div><button class="btn btn-dark reportBtn" data-report="so">Print SO Report</button></div>
 <div class="card panel"><div class="panel-title">Action Register</div><div class="panel-note">Current filtered rows</div><button class="btn btn-dark" id="reportExport">Export CSV</button></div>
 </div>
 <div style="margin-top:12px">${panel("Recommended Review Pack","Use these sections in weekly restoration meetings",`
 <div class="grid g3"><div class="mini-stat"><b>01</b><span>Executive position</span></div><div class="mini-stat"><b>02</b><span>SO-wise accountability</span></div><div class="mini-stat"><b>03</b><span>Critical action register</span></div></div>`)}</div>`;
 document.querySelectorAll(".reportBtn").forEach(b=>b.onclick=()=>printReport(b.dataset.report));$("#reportExport").onclick=exportCSV;
}
function printReport(type){
 let old=page;
 if(type==="warroom")activate("warroom");else activate("so");
 setTimeout(()=>{window.print();activate(old)},100);
}
function activate(p){page=p;document.querySelectorAll(".page").forEach(x=>x.classList.remove("active"));$("#page-"+p).classList.add("active");document.querySelectorAll(".nav").forEach(x=>x.classList.toggle("active",x.dataset.page===p));window.scrollTo(0,0)}
$("#nav").addEventListener("click",e=>{let b=e.target.closest(".nav");if(b)activate(b.dataset.page)});
$("#globalSub").onchange=applyFilters;$("#globalSO").onchange=applyFilters;$("#globalField").onchange=applyFilters;
$("#clearFilters").onclick=()=>{$("#globalSub").value="";$("#globalSO").value="";$("#globalField").value="";applyFilters()};
$("#refreshBtn").onclick=load;$("#printBtn").onclick=()=>window.print();
load();
