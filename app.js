(() => {
'use strict';
const K={products:'dc_products_v2',days:'dc_days_v2',auth:'delite_cravings_auth_v2'};
const defaults=[
 {id:'DR-001',category:'Drinks',name:'Coke 50cl',price:500,opening:20},
 {id:'DR-002',category:'Drinks',name:'Fanta 50cl',price:500,opening:20},
 {id:'DR-003',category:'Drinks',name:'Bottle Water',price:300,opening:30},
 {id:'SN-001',category:'Snacks',name:'Meat Pie',price:700,opening:20},
 {id:'SN-002',category:'Snacks',name:'Sausage Roll',price:500,opening:25},
 {id:'SN-003',category:'Snacks',name:'Chin Chin',price:300,opening:30},
 {id:'BR-001',category:'Bread',name:'Medium Bread',price:1000,opening:15},
 {id:'BR-002',category:'Bread',name:'Large Bread',price:1500,opening:15}
];
const $=id=>document.getElementById(id);
const money=n=>'₦'+Number(n||0).toLocaleString('en-NG',{maximumFractionDigits:2});
const num=v=>Math.max(0,Number(v)||0);
const today=()=>new Date().toISOString().slice(0,10);
const read=(k,f)=>{try{const v=JSON.parse(localStorage.getItem(k));return v??f}catch(e){return f}};
const write=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
let products=read(K.products,defaults);
let days=read(K.days,{});
let currentRows=[];

function toast(msg){const t=$('toast');t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2200)}
function normalize(c){c=String(c||'').trim();if(/^drink$/i.test(c))return'Drinks';if(/^snack$/i.test(c))return'Snacks';if(/^bread$/i.test(c))return'Bread';return c||'Other'}
function escapeHtml(s){return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function getAuth(){return read(K.auth,{username:'admin',pin:'1234'})}
function getDay(date){return days[date]||null}
function buildRows(date){
 const saved=getDay(date);
 const prior=saved?.rows||[];
 return products.map(p=>{
   const old=prior.find(x=>x.id===p.id);
   return {id:p.id,category:p.category,name:p.name,price:Number(p.price)||0,opening:old?num(old.opening):num(p.opening),added:old?num(old.added):0,closing:old?num(old.closing):num(p.opening),sku:p.id};
 });
}
function calc(r){const available=num(r.opening)+num(r.added);const closing=Math.min(num(r.closing),available);const sold=available-closing;return{available,closing,sold,sales:sold*num(r.price)}}
function showTab(name){
 document.querySelectorAll('.nav-btn').forEach(b=>b.classList.toggle('active',b.dataset.tab===name));
 document.querySelectorAll('.tab-section').forEach(s=>s.classList.toggle('active',s.id===name));
 if(name==='sales')renderSales(); if(name==='products')renderProducts(); if(name==='reports')renderReports(); if(name==='analytics')renderAnalytics();
}
function renderSales(){
 const date=$('businessDate').value||today();currentRows=buildRows(date);
 const q=($('salesSearch').value||'').toLowerCase();
 const rows=currentRows.filter(r=>(r.name+' '+r.category+' '+r.id).toLowerCase().includes(q));
 $('salesBody').innerHTML=rows.map(r=>{const c=calc(r);return '<tr>'+
 '<td>'+escapeHtml(r.category)+'</td><td><strong>'+escapeHtml(r.name)+'</strong><small class="muted"> '+escapeHtml(r.id)+'</small></td>'+
 '<td><input class="stock-input" data-id="'+r.id+'" data-field="opening" type="number" min="0" value="'+r.opening+'"></td>'+
 '<td><input class="stock-input" data-id="'+r.id+'" data-field="added" type="number" min="0" value="'+r.added+'"></td>'+
 '<td>'+c.available+'</td><td><input class="stock-input" data-id="'+r.id+'" data-field="closing" type="number" min="0" max="'+c.available+'" value="'+c.closing+'"></td>'+
 '<td><strong>'+c.sold+'</strong></td><td><input class="price-input" data-id="'+r.id+'" type="number" min="0" value="'+r.price+'"></td><td><strong>'+money(c.sales)+'</strong></td></tr>'}).join('');
 document.querySelectorAll('.stock-input,.price-input').forEach(el=>el.addEventListener('input',e=>{const r=currentRows.find(x=>x.id===e.target.dataset.id);if(!r)return;if(e.target.classList.contains('price-input'))r.price=num(e.target.value);else r[e.target.dataset.field]=num(e.target.value);renderSalesTotalsOnly() }));
 renderSalesTotalsOnly();
}
function renderSalesTotalsOnly(){
 let total=0,units=0,added=0,closing=0;const cats={};
 currentRows.forEach(r=>{const c=calc(r);total+=c.sales;units+=c.sold;added+=num(r.added);closing+=c.closing;cats[r.category]??={sales:0,units:0};cats[r.category].sales+=c.sales;cats[r.category].units+=c.sold});
 $('mSales').textContent=money(total);$('mUnits').textContent=units;$('mAdded').textContent=added;$('mClosing').textContent=closing;
 $('categorySummary').innerHTML=Object.entries(cats).map(([k,v])=>'<div class="category-card"><span class="muted">'+escapeHtml(k)+'</span><strong>'+money(v.sales)+'</strong><small>'+v.units+' units sold</small></div>').join('');
 const rows=[...document.querySelectorAll('#salesBody tr')];rows.forEach((tr,i)=>{const r=currentRows.find(x=>x.id===tr.querySelector('[data-id]')?.dataset.id);if(!r)return;const c=calc(r);const cells=tr.querySelectorAll('td');if(cells[4])cells[4].textContent=c.available;if(cells[6])cells[6].querySelector('strong').textContent=c.sold;if(cells[8])cells[8].querySelector('strong').textContent=money(c.sales);const close=tr.querySelector('[data-field="closing"]');if(close){close.max=c.available;if(Number(close.value)>c.available)close.value=c.available}});
}
function saveDay(){
 const date=$('businessDate').value||today();days[date]={date,savedAt:new Date().toISOString(),rows:currentRows.map(r=>({...r,closing:calc(r).closing}))};
 write(K.days,days);products=products.map(p=>{const r=currentRows.find(x=>x.id===p.id);return r?{...p,price:r.price}:p});write(K.products,products);toast('Daily report saved');renderReports();renderAnalytics();
}
function renderProducts(){
 $('productsBody').innerHTML=products.map(p=>'<tr><td><select data-p="'+p.id+'" data-f="category"><option '+(p.category==='Drinks'?'selected':'')+'>Drinks</option><option '+(p.category==='Snacks'?'selected':'')+'>Snacks</option><option '+(p.category==='Bread'?'selected':'')+'>Bread</option></select></td><td><input data-p="'+p.id+'" data-f="name" value="'+escapeHtml(p.name)+'"></td><td>'+escapeHtml(p.id)+'</td><td><input data-p="'+p.id+'" data-f="price" type="number" min="0" value="'+p.price+'"></td><td><input data-p="'+p.id+'" data-f="opening" type="number" min="0" value="'+p.opening+'"></td><td><button class="btn btn-danger remove-product" data-id="'+p.id+'" type="button">Remove</button></td></tr>').join('');
 document.querySelectorAll('#productsBody [data-p]').forEach(el=>el.addEventListener('change',()=>{const p=products.find(x=>x.id===el.dataset.p);if(!p)return;p[el.dataset.f]=el.dataset.f==='category'||el.dataset.f==='name'?el.value:num(el.value);write(K.products,products);renderSales()}));
 document.querySelectorAll('.remove-product').forEach(b=>b.addEventListener('click',()=>{products=products.filter(p=>p.id!==b.dataset.id);write(K.products,products);renderProducts();renderSales();toast('Product removed')}));
}
function addProduct(){const name=prompt('Product name:');if(!name?.trim())return;const category=normalize(prompt('Category: Drinks, Snacks or Bread','Drinks'));const price=num(prompt('Unit price:','0'));const opening=num(prompt('Opening stock:','0'));const id='P-'+Date.now().toString().slice(-7);products.push({id,category,name:name.trim(),price,opening});write(K.products,products);renderProducts();renderSales();toast('Product added')}
function rangeDates(a,b){const out=[];if(!a||!b||a>b)return out;let d=new Date(a+'T00:00:00'),end=new Date(b+'T00:00:00');while(d<=end){out.push(d.toISOString().slice(0,10));d.setDate(d.getDate()+1)}return out}
function totalsFor(dates){let sales=0,units=0,added=0,closing=0;const prod={};const cat={};dates.forEach(date=>{const day=days[date];if(!day)return;day.rows.forEach(r=>{const c=calc(r);sales+=c.sales;units+=c.sold;added+=num(r.added);closing+=c.closing;prod[r.name]=(prod[r.name]||0)+c.sales;cat[r.category]=(cat[r.category]||0)+c.sales})});return{sales,units,added,closing,prod,cat}}
function renderReports(){
 const entries=Object.values(days).sort((a,b)=>b.date.localeCompare(a.date));
 $('reportsBody').innerHTML=entries.map(d=>{const t=totalsFor([d.date]);return '<tr><td>'+d.date+'</td><td>'+money(t.sales)+'</td><td>'+t.units+'</td><td>'+t.added+'</td><td>'+t.closing+'</td><td><button class="btn view-report" data-date="'+d.date+'" type="button">Open</button></td></tr>'}).join('')||'<tr><td colspan="6" class="muted">No saved reports yet.</td></tr>';
 document.querySelectorAll('.view-report').forEach(b=>b.addEventListener('click',()=>{showTab('sales');$('businessDate').value=b.dataset.date;renderSales()}));
 renderCustomReport();
}
function renderCustomReport(){
 const from=$('reportFrom').value,to=$('reportTo').value;if(!from||!to)return;
 const dates=rangeDates(from,to),t=totalsFor(dates),active=dates.filter(d=>days[d]);
 const top=Object.entries(t.prod).sort((a,b)=>b[1]-a[1]).slice(0,8);
 $('customReport').innerHTML='<div class="report-summary"><div class="summary-box"><span>Total Sales</span><strong>'+money(t.sales)+'</strong></div><div class="summary-box"><span>Units Sold</span><strong>'+t.units+'</strong></div><div class="summary-box"><span>Stock Added</span><strong>'+t.added+'</strong></div><div class="summary-box"><span>Saved Days</span><strong>'+active.length+'/'+dates.length+'</strong></div></div><div class="two-col"><div class="panel"><h3>Top Products</h3>'+ (top.map(x=>'<div class="list-row"><span>'+escapeHtml(x[0])+'</span><strong>'+money(x[1])+'</strong></div>').join('')||'<p class="muted">No data.</p>')+'</div><div class="panel"><h3>Category Sales</h3>'+Object.entries(t.cat).sort((a,b)=>b[1]-a[1]).map(x=>'<div class="list-row"><span>'+escapeHtml(x[0])+'</span><strong>'+money(x[1])+'</strong></div>').join('')+'</div></div>';
}
function renderAnalytics(){
 const n=Number($('analyticsRange').value||7),dates=[];for(let i=n-1;i>=0;i--){const d=new Date();d.setDate(d.getDate()-i);dates.push(d.toISOString().slice(0,10))}
 const vals=dates.map(d=>{const t=totalsFor([d]);return{date:d,sales:t.sales,units:t.units}}),active=vals.filter(x=>x.sales||x.units),total=vals.reduce((s,x)=>s+x.sales,0),units=vals.reduce((s,x)=>s+x.units,0),best=[...vals].sort((a,b)=>b.sales-a.sales)[0];
 $('aSales').textContent=money(total);$('aAvg').textContent=money(total/n);$('aUnits').textContent=units;$('aBest').textContent=best&&best.sales?best.date+' '+money(best.sales):'—';
 const max=Math.max(1,...vals.map(x=>x.sales));$('chart').innerHTML=vals.map(x=>'<div class="bar-wrap" title="'+x.date+' — '+money(x.sales)+'"><div class="bar" style="height:'+Math.max(2,(x.sales/max)*210)+'px"></div><div class="bar-label">'+x.date.slice(5)+'</div></div>').join('');
 const p={};const c={};active.forEach(x=>{const day=days[x.date];day?.rows?.forEach(r=>{const z=calc(r);p[r.name]=(p[r.name]||0)+z.sales;c[r.category]=(c[r.category]||0)+z.sales})});
 $('topProducts').innerHTML=Object.entries(p).sort((a,b)=>b[1]-a[1]).slice(0,10).map(x=>'<div class="list-row"><span>'+escapeHtml(x[0])+'</span><strong>'+money(x[1])+'</strong></div>').join('')||'<p class="muted">No saved sales in this period.</p>';
 $('catAnalytics').innerHTML=Object.entries(c).sort((a,b)=>b[1]-a[1]).map(x=>'<div class="list-row"><span>'+escapeHtml(x[0])+'</span><strong>'+money(x[1])+'</strong></div>').join('')||'<p class="muted">No saved sales in this period.</p>';
}
function csv(rows){return rows.map(r=>r.map(v=>'"'+String(v??'').replace(/"/g,'""')+'"').join(',')).join('\n')}
function download(name,text,type='text/csv'){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type}));a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500)}
function exportCustom(){const from=$('reportFrom').value,to=$('reportTo').value;const dates=rangeDates(from,to),rows=[['Date','Category','Product','Opening','Additions','Available','Closing','Sold','Unit Price','Sales']];dates.forEach(d=>(days[d]?.rows||[]).forEach(r=>{const c=calc(r);rows.push([d,r.category,r.name,r.opening,r.added,c.available,c.closing,c.sold,r.price,c.sales])}));download('delite-cravings-report.csv',csv(rows))}
function exportAll(){const rows=[['Date','Category','Product','Opening','Additions','Available','Closing','Sold','Unit Price','Sales']];Object.values(days).sort((a,b)=>a.date.localeCompare(b.date)).forEach(d=>d.rows.forEach(r=>{const c=calc(r);rows.push([d.date,r.category,r.name,r.opening,r.added,c.available,c.closing,c.sold,r.price,c.sales])}));download('delite-cravings-all-reports.csv',csv(rows))}
function importFile(){
 const f=$('excelFile').files[0];if(!f){toast('Select an Excel or CSV file first');return}
 const reader=new FileReader();reader.onload=e=>{try{let data;if(f.name.toLowerCase().endsWith('.csv'))data=e.target.result.trim().split(/\r?\n/).map(x=>x.split(','));else{const wb=XLSX.read(e.target.result,{type:'array'});data=XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]],{header:1,defval:''})}
 if(!data.length)throw Error('Empty file');const h=data[0].map(x=>String(x).trim().toLowerCase()),idx=k=>h.indexOf(k);const ci=idx('category'),pi=idx('product'),pr=idx('unit price'),oi=idx('opening stock'),si=idx('sku');if(pi<0||pr<0||ci<0||oi<0)throw Error('Missing required columns');
 let count=0;data.slice(1).forEach(row=>{const name=String(row[pi]||'').trim();if(!name)return;const sku=String(si>=0?row[si]:'').trim()||('P-'+name.toLowerCase().replace(/[^a-z0-9]+/g,'-'));let p=products.find(x=>x.id===sku)||products.find(x=>x.name.toLowerCase()===name.toLowerCase());if(p){p.category=normalize(row[ci]);p.name=name;p.price=num(row[pr]);p.opening=num(row[oi]);if(si>=0&&String(row[si]).trim())p.id=sku}else products.push({id:sku,category:normalize(row[ci]),name,price:num(row[pr]),opening:num(row[oi])});count++});write(K.products,products);renderProducts();renderSales();$('importMessage').textContent=count+' product(s) imported successfully.';toast('Import complete')}catch(err){$('importMessage').textContent='Import failed: '+err.message}},f.name.toLowerCase().endsWith('.csv')?'text':'arraybuffer');}
function downloadTemplate(){download('delite-cravings-stock-template.csv',csv([['Category','Product','SKU','Unit Price','Opening Stock'],['Drinks','Coke 50cl','DR-001',500,20],['Snacks','Meat Pie','SN-001',700,20],['Bread','Medium Bread','BR-001',1000,15]]))}
function bind(){
 $('businessDate').value=today();
 document.querySelectorAll('.nav-btn').forEach(b=>b.addEventListener('click',()=>showTab(b.dataset.tab)));
 $('salesSearch').addEventListener('input',renderSales);$('businessDate').addEventListener('change',renderSales);$('saveDayBtn').addEventListener('click',saveDay);
 $('addProductBtn').addEventListener('click',addProduct);$('generateReportBtn').addEventListener('click',renderCustomReport);$('reportFrom').addEventListener('change',renderCustomReport);$('reportTo').addEventListener('change',renderCustomReport);$('exportCustomBtn').addEventListener('click',exportCustom);$('exportAllBtn').addEventListener('click',exportAll);$('analyticsRange').addEventListener('change',renderAnalytics);$('importBtn').addEventListener('click',importFile);$('downloadTemplateBtn').addEventListener('click',downloadTemplate);
 $('logoutBtn').addEventListener('click',()=>{sessionStorage.removeItem('dc_logged_in');location.reload()});
 $('saveSettingsBtn').addEventListener('click',()=>{const u=$('newUser').value.trim(),p=$('newPin').value.trim(),c=$('confirmPin').value.trim();if(!u||!p)return $('settingsMessage').textContent='Username and PIN are required.';if(p!==c)return $('settingsMessage').textContent='PIN confirmation does not match.';write(K.auth,{username:u,pin:p});$('settingsMessage').textContent='Login settings saved.';toast('Settings saved')});
 $('resetDataBtn').addEventListener('click',()=>{if(!confirm('Reset all saved products and reports?'))return;localStorage.removeItem(K.products);localStorage.removeItem(K.days);products=defaults.map(x=>({...x}));days={};write(K.products,products);write(K.days,days);renderProducts();renderSales();renderReports();renderAnalytics();toast('App data reset')});
 const a=getAuth();$('userDisplay').textContent='Signed in: '+a.username;$('newUser').value=a.username;renderProducts();renderSales();renderReports();renderAnalytics();
}
document.addEventListener('DOMContentLoaded',()=>{if(sessionStorage.getItem('dc_logged_in')==='1')bind()});
})();