import {firebaseConfig,familyId} from './firebase-config.js';
import {initializeApp} from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js';
import {getAuth,onAuthStateChanged,signInWithEmailAndPassword,signOut} from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js';
import {getFirestore,doc,getDoc,setDoc,updateDoc,collection,query,where,onSnapshot,serverTimestamp,writeBatch,addDoc,orderBy,limit} from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js';

const $=id=>document.getElementById(id);
// معرف ثابت لكل مهمة: حتى لو غيّر الأهل ترتيب البنود لن تختلط علامات الماضي.
const LEGACY_TASKS=[
 ['صلاة الفجر في وقتها',20,'صلاة'],['صلاة الظهر في وقتها',20,'صلاة'],['صلاة العصر في وقتها',20,'صلاة'],['صلاة المغرب في وقتها',20,'صلاة'],['صلاة العشاء في وقتها',20,'صلاة'],
 ['حفظ القرآن الكريم ومراجعته',15,'قرآن'],['المذاكرة بتركيز',15,'مذاكرة'],['إنهاء الواجبات المدرسية',8,'مذاكرة'],['قراءة أو تعلم شيء جديد',4,'تطوير'],['ترتيب الغرفة والأغراض',3,'نظام'],['الأخلاق واحترام الوالدين',3,'سلوك'],['النوم في الموعد',2,'نظام']
];
const isoToday=()=>{const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')};
const DEFAULT_CATALOG=[...LEGACY_TASKS.map(([name,points,group],i)=>({id:'t'+i,name,group,active:true,activation:[{from:'0000-01-01',active:true}],history:[{from:'0000-01-01',points},...(i===5?[{from:'2026-11-11',points:25}]:[])]})),{id:'t12',name:'غسيل الأسنان',group:'نظام',active:true,activation:[{from:'2026-11-11',active:true}],history:[{from:'2026-11-11',points:5}]}];
let catalog=structuredClone(DEFAULT_CATALOG);
const catalogRef=()=>doc(store,base(),'settings','taskCatalog');
const taskAt=id=>catalog.find(t=>t.id===id);
const normalizeId=v=>typeof v==='number'?'t'+v:String(v);
const taskPoints=(t,day)=>{const activeHistory=(t?.history||[]).filter(h=>h.from<=day).sort((a,b)=>b.from.localeCompare(a.from));return activeHistory.length?activeHistory[0].points:0};
const activeAt=(t,day)=>{const xs=(t.activation||[]).filter(x=>x.from<=day).sort((a,b)=>b.from.localeCompare(a.from));return xs.length?xs[0].active:(t.active!==false)};
const pointsMax=day=>catalog.filter(t=>activeAt(t,day)&&taskPoints(t,day)>0).reduce((n,t)=>n+taskPoints(t,day),0);
const earnedFor=(e,day)=>[...new Set((e.checks||[]).map(normalizeId))].reduce((n,v)=>{const t=taskAt(normalizeId(v));return n+taskPoints(t,day)},0);
const isPrayer=t=>['t0','t1','t2','t3','t4'].includes(t?.id);

const ROLES=[['child','الطفل'],['father','الأب'],['mother','الأم']];
const today=isoToday;
const dateParts=d=>new Date(d+'T12:00:00');
const formatDate=d=>[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
const safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const explainError=e=>({"auth/invalid-credential":"البريد الإلكتروني أو كلمة المرور غير صحيحة.","auth/too-many-requests":"محاولات كثيرة، يرجى المحاولة لاحقاً.","permission-denied":"ليس لديك صلاحية لهذه العملية. تحقق من إعداد الأعضاء والقواعد.","unavailable":"تعذر الاتصال. تأكد من الإنترنت."}[e?.code]||e?.message||'حدث خطأ غير متوقع');
let app,auth,store,person,user,selectedKid='a',selectedDate=today(),daily=[],events=[],signatures=[],members=[],allowances=[],notices=[],listeners=[],tab='daily',catalogReady=false;
const parent=()=>person?.role==='father'||person?.role==='mother';
const childMember=k=>members.find(m=>m.role==='child'&&m.kidId===k);
let draftPhoto=null,removePhoto=false,profileTarget=null,profileSeenKey=null;

const accessKid=k=>parent()||person?.kidId===k;
const base=()=>`families/${familyId}`;
const dref=(k,d)=>doc(store,base(),'daily',`${k}_${d}`);
const eref=id=>doc(store,base(),'events',id);
const sref=(k,d,r)=>doc(store,base(),'signatures',`${k}_${d}_${r}`);
const aref=(k,week)=>doc(store,base(),'allowances',`${k}_${week}`);
const noticeCol=()=>collection(store,base(),'notifications');
// أسبوع المصروف يبدأ يوم السبت ويظل الطلب ظاهراً حتى تأكيد الصرف.
const weekSaturday=(day)=>{const d=dateParts(day);d.setDate(d.getDate()-(d.getDay()+1)%7);return formatDate(d)};
const show=(id,v)=>$(id).hidden=!v;
function toast(s){$('toast').textContent=s;$('toast').classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('toast').classList.remove('show'),4800)}
function monthKey(d){return d.slice(0,7)}
function recordsForKid(arr,k){return arr.filter(x=>x.kidId===k)}
function entry(k,d){return daily.find(x=>x.kidId===k&&x.date===d)||{checks:[]}}
function dailyEvents(k,d){return events.filter(x=>x.kidId===k&&x.date===d&&x.active)}
function dailySignatures(k,d){return signatures.filter(x=>x.kidId===k&&x.date===d&&x.image)}
function basePoints(e,d){return earnedFor(e,d)}
function prayerPoints(e,d){return [...new Set((e.checks||[]).map(normalizeId))].reduce((s,i)=>{const t=taskAt(normalizeId(i));return s+(isPrayer(t)?taskPoints(t,d):0)},0)}
function bonus(es){return es.some(e=>e.type==='bonus')?50:0}
function deduct(es){return es.filter(e=>e.type==='deduction').reduce((s,e)=>s+e.points,0)}
function points(k,d){const e=entry(k,d),pr=prayerPoints(e,d),es=dailyEvents(k,d);return pr+Math.max(0,basePoints(e,d)-pr+bonus(es)-deduct(es))}
function daysInMonth(d){const [y,m]=monthKey(d).split('-').map(Number);return new Date(y,m,0).getDate()}
function monthTotals(k,d){const key=monthKey(d);let total=0,bs=0,ds=0,pr=0,max=0;for(let i=1;i<=daysInMonth(d);i++){const x=`${key}-${String(i).padStart(2,'0')}`;const es=dailyEvents(k,x);total+=points(k,x);bs+=bonus(es);ds+=deduct(es);pr+=prayerPoints(entry(k,x),x);max+=pointsMax(x)}return {points:total,bonus:bs,deductions:ds,prayer:pr,max,money:max?Math.min(10,10*total/max):0}}
function whoDid(uid){return members.find(m=>m.id===uid)?.name|| (uid===user?.uid?person?.name:'أحد الوالدين')||'مستخدم'}
function unsubscribeAll(){listeners.forEach(u=>u());listeners=[]}
function startListeners(){unsubscribeAll();daily=[];events=[];signatures=[];members=[];allowances=[];catalog=structuredClone(DEFAULT_CATALOG);catalogReady=false;const col=n=>collection(store,base(),n);const childFilter=person.role==='child';const kidFilter=childFilter?[where('kidId','==',person.kidId)]:[];
 for(const [name,setter] of [['daily',v=>daily=v],['events',v=>events=v],['signatures',v=>signatures=v],['allowances',v=>allowances=v],['members',v=>members=v]]){
  const q=name==='members'?(childFilter?doc(store,base(),'members',user.uid):col(name)):query(col(name),...kidFilter);
  const unsub=onSnapshot(q,snap=>{setter(snap.docs?snap.docs.map(x=>({id:x.id,...x.data()})):(snap.exists()?[{id:snap.id,...snap.data()}]:[]));if(name==='members'&&person?.role==='child'){const updated=members.find(m=>m.id===user.uid);if(updated){person={...updated,uid:user.uid};$('who').textContent=`${person.name} — الطفل`}}render();$('sync').textContent='● متصل — التحديث مباشر'},err=>{$('sync').textContent='● تعذرت المزامنة';toast('خطأ في المزامنة: '+explainError(err));});listeners.push(unsub);
 }
 if(parent()){
  const noticeQ=query(noticeCol(),orderBy('createdAt','desc'),limit(150));
  const nu=onSnapshot(noticeQ,snap=>{notices=snap.docs.map(x=>({id:x.id,...x.data()}));renderNotifications()},err=>{toast('تعذر تحميل الإشعارات: '+explainError(err))});
  listeners.push(nu);
 }
 const configUnsub=onSnapshot(catalogRef(),snap=>{catalog=snap.exists()&&Array.isArray(snap.data().tasks)?snap.data().tasks:structuredClone(DEFAULT_CATALOG);catalogReady=true;render();renderSettings()},err=>{toast('تعذر تحميل إعدادات الأنشطة: '+explainError(err))});listeners.push(configUnsub);
}
function render(){if(!person)return;renderProfiles();const dailyRecord=entry(selectedKid,selectedDate);const m=monthTotals(selectedKid,selectedDate);$('todayPoints').textContent=`${points(selectedKid,selectedDate)} / ${pointsMax(selectedDate)}`;$('prayerPoints').textContent=`${prayerPoints(dailyRecord,selectedDate)} / ${catalog.filter(isPrayer).reduce((n,t)=>n+taskPoints(t,selectedDate),0)}`;$('monthMoney').textContent=`${m.money.toFixed(3)} د.ك`;$('monthDeductions').textContent=`${m.deductions} نقطة`;renderTasks(dailyRecord);renderEvents();renderSummary();renderSignatures();renderAllowance();window.NogoomI18n?.apply()}
function renderTasks(e){const list=$('taskList');list.replaceChildren();catalog.filter(t=>activeAt(t,selectedDate)&&taskPoints(t,selectedDate)>0).forEach(t=>{const label=t.name,n=taskPoints(t,selectedDate),group=t.group,id=t.id;const row=document.createElement('label');row.className='task appear';row.style.setProperty('--stagger',Math.min(220,list.children.length*24)+'ms');const input=document.createElement('input');input.type='checkbox';input.checked=(e.checks||[]).some(v=>normalizeId(v)===id);input.addEventListener('change',async()=>{input.disabled=true;const checked=input.checked;const checks=[...new Set((entry(selectedKid,selectedDate).checks||[]).map(normalizeId))];const next=checked?[...checks.filter(x=>x!==id),id]:checks.filter(x=>x!==id);try{
 const sorted=next.sort((a,b)=>Number(a.slice(1))-Number(b.slice(1)));
 if(person.role==='child'){
  const batch=writeBatch(store);
  batch.set(dref(selectedKid,selectedDate),{kidId:selectedKid,date:selectedDate,checks:sorted,updatedBy:user.uid,updatedAt:serverTimestamp()},{merge:true});
  batch.set(doc(noticeCol()),{kidId:selectedKid,kind:'task',actorUid:user.uid,date:selectedDate,taskId:id,taskCompleted:checked,createdAt:serverTimestamp(),seenBy:{}});
  await batch.commit();
 }else await setDoc(dref(selectedKid,selectedDate),{kidId:selectedKid,date:selectedDate,checks:sorted,updatedBy:user.uid,updatedAt:serverTimestamp()},{merge:true});
 }catch(err){toast(explainError(err));render()}});const name=document.createElement('span');name.textContent=label;const desc=document.createElement('small');desc.textContent=group;name.append(desc);const pts=document.createElement('b');pts.textContent=n+' نقطة';row.append(input,name,pts);list.append(row)})}
function eventText(e){return e.type==='bonus'?'⭐ بونص 50 نقطة':e.type==='play'?'🎮 ساعة بلايستيشن':e.type==='reward'?(e.rewardKind==='trip'?'🚌 رحلة من الأب':'🎁 هدية من الأب'):'➖ خصم '+e.points+' نقطة'}
function renderEvents(){const key=monthKey(selectedDate);const scoped=events.filter(e=>e.kidId===selectedKid&&monthKey(e.date)===key).sort((a,b)=>b.date.localeCompare(a.date)||b.id.localeCompare(a.id));$('eventCount').textContent=scoped.length+' قرار';const wrap=$('eventsList');wrap.replaceChildren();if(!scoped.length){wrap.textContent='لا توجد خصومات أو مكافآت مسجلة في هذا الشهر.';return}scoped.forEach(e=>{const row=document.createElement('div');row.className='event'+(e.active?'':' inactive');const text=document.createElement('div');const bold=document.createElement('b');bold.textContent=eventText(e)+(e.active?'':' (ملغى)');bold.className=e.type==='deduction'?'negative':'positive';const reason=document.createElement('p');reason.textContent=e.reason;const who=document.createElement('small');who.textContent=`${e.date} — بواسطة ${whoDid(e.createdBy)}`+(e.updatedBy?` — آخر تعديل: ${whoDid(e.updatedBy)}`:'');text.append(bold,reason,who);row.append(text);if(parent()&&(e.type!=='play'||person.role==='mother')&&(e.type!=='reward'||person.role==='father')){const btn=document.createElement('button');btn.textContent=e.active?'إلغاء القرار':'إعادة التفعيل';btn.addEventListener('click',async()=>{if(!confirm('تأكيد تغيير حالة القرار؟'))return;try{await updateDoc(eref(e.id),{active:!e.active,updatedBy:user.uid,updatedAt:serverTimestamp()});toast('تم تحديث القرار')}catch(err){toast(explainError(err))}});row.append(btn)}wrap.append(row)})}
function renderSummary(){const d=dateParts(selectedDate),dow=(d.getDay()+6)%7,start=new Date(d);start.setDate(d.getDate()-dow);const end=new Date(start);end.setDate(start.getDate()+6);$('weekRange').textContent=`من ${formatDate(start)} إلى ${formatDate(end)}`;const wb=$('weekBody');wb.replaceChildren();for(let i=0;i<7;i++){const day=new Date(start);day.setDate(start.getDate()+i);const ds=formatDate(day),e=entry(selectedKid,ds),es=dailyEvents(selectedKid,ds),sig=dailySignatures(selectedKid,ds);addRow(wb,[ds,basePoints(e,ds),prayerPoints(e,ds),bonus(es),deduct(es),points(selectedKid,ds),sig.length+'/3'])}const m=monthTotals(selectedKid,selectedDate);$('monthSummary').textContent=`الشهر ${monthKey(selectedDate)}: ${m.points} من ${m.max} نقطة — الصلاة ${m.prayer} نقطة — بونص ${m.bonus} نقطة — خصومات ${m.deductions} نقطة — المكافأة ${m.money.toFixed(3)} د.ك من سقف 10 د.ك.`;
 const mb=$('monthBody');mb.replaceChildren();const key=monthKey(selectedDate);for(let j=1;j<=daysInMonth(selectedDate);j+=7){let p=0,b=0,x=0;const last=Math.min(j+6,daysInMonth(selectedDate));for(let i=j;i<=last;i++){const ds=`${key}-${String(i).padStart(2,'0')}`,es=dailyEvents(selectedKid,ds);p+=points(selectedKid,ds);b+=bonus(es);x+=deduct(es)}addRow(mb,[`${j}–${last}`,p,b,x,(m.max?Math.min(10,10*p/m.max):0).toFixed(3)])}
 if(parent()){$('familyCards').replaceChildren();for(const k of ['a','b']){const t=monthTotals(k,selectedDate);const div=document.createElement('div');div.className='metric';const label=document.createElement('span');label.textContent=k==='a'?'الطفل الأول — 13 سنة':'الطفل الثاني — 9 سنوات';const amt=document.createElement('b');amt.textContent=t.money.toFixed(3)+' د.ك';const note=document.createElement('span');note.textContent=`${t.points} نقطة • خصومات ${t.deductions}`;div.append(label,amt,note);$('familyCards').append(div)}}}
function addRow(tbody,cells){const tr=document.createElement('tr');cells.forEach(v=>{const td=document.createElement('td');td.textContent=v;tr.append(td)});tbody.append(tr)}
function renderSignatures(){const wrap=$('signatureList');wrap.replaceChildren();for(const [role,label] of ROLES){const item=signatures.find(s=>s.kidId===selectedKid&&s.date===selectedDate&&s.role===role);const allowed=person.role===role&&(role!=='child'||person.kidId===selectedKid);const card=document.createElement('div');card.className='sig';const head=document.createElement('div');head.className='sig-head';const title=document.createElement('strong');title.textContent='توقيع '+label;head.append(title);card.append(head);if(allowed){const canvas=document.createElement('canvas');canvas.width=600;canvas.height=270;const ctx=canvas.getContext('2d');ctx.strokeStyle='#13566a';ctx.lineWidth=4;ctx.lineCap='round';ctx.lineJoin='round';if(item?.image){const img=new Image();img.onload=()=>ctx.drawImage(img,0,0,600,270);img.src=item.image}let drawing=false,changed=false;const pos=ev=>{const rect=canvas.getBoundingClientRect();return {x:(ev.clientX-rect.left)*canvas.width/rect.width,y:(ev.clientY-rect.top)*canvas.height/rect.height}};canvas.onpointerdown=ev=>{if(ev.pointerType==='mouse'&&ev.button!==0)return;drawing=true;changed=true;canvas.setPointerCapture(ev.pointerId);const p=pos(ev);ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p.x+.1,p.y+.1);ctx.stroke();ev.preventDefault()};canvas.onpointermove=ev=>{if(!drawing)return;const p=pos(ev);ctx.lineTo(p.x,p.y);ctx.stroke();ev.preventDefault()};canvas.onpointerup=()=>drawing=false;canvas.onpointercancel=()=>drawing=false;card.append(canvas);const foot=document.createElement('div');foot.className='sig-foot';const save=document.createElement('button');save.className='primary';save.textContent='حفظ توقيعي';save.onclick=async()=>{if(!changed){toast('ارسم توقيعك أولاً');return}try{await setDoc(sref(selectedKid,selectedDate,role),{kidId:selectedKid,date:selectedDate,role,image:canvas.toDataURL('image/png'),signedBy:user.uid,updatedAt:serverTimestamp()});toast('تم حفظ التوقيع')}catch(err){toast(explainError(err))}};const clear=document.createElement('button');clear.textContent='مسح الرسم';clear.onclick=()=>{ctx.clearRect(0,0,600,270);changed=true};foot.append(save,' ',clear);card.append(foot)}else{if(item?.image){const img=document.createElement('img');img.className='sig-preview';img.alt='توقيع '+label;img.src=item.image;card.append(img)}else{const blank=document.createElement('div');blank.className='sig-foot';blank.style.padding='54px 8px';blank.textContent='لم يوقّع بعد';card.append(blank)}const f=document.createElement('div');f.className='sig-foot';f.textContent=item?'تم التوقيع ✓':'بانتظار توقيع صاحب الحساب';card.append(f)}wrap.append(card)}}
async function saveEvent(type){if(!parent())return;const reasonId=type==='bonus'?'bonusReason':type==='play'?'playReason':type==='reward'?'rewardReason':'deductReason';const reason=$(reasonId).value.trim();if(!reason){toast('يرجى كتابة سبب القرار');return}if(type==='play'&&person.role!=='mother'){toast('هذه المكافأة تعتمدها الأم فقط');return}if(type==='reward'&&person.role!=='father'){toast('الرحلة أو الهدية من الأب فقط');return}const points=type==='bonus'?50:type==='play'||type==='reward'?0:Number($('deductAmount').value);const id=type==='deduction'||type==='reward'?`${type}_${selectedKid}_${selectedDate}_${crypto.randomUUID().replaceAll('-','')}`:`${type}_${selectedKid}_${selectedDate}`;try{const ref=eref(id),old=await getDoc(ref);if(old.exists()){if(old.data().active){toast('هذه المكافأة معتمدة بالفعل لهذا اليوم');return}await updateDoc(ref,{active:true,updatedBy:user.uid,updatedAt:serverTimestamp()});}else{await setDoc(ref,{kidId:selectedKid,date:selectedDate,type,points,reason,createdBy:user.uid,createdAt:serverTimestamp(),active:true,...(type==='reward'?{rewardKind:$('rewardKind').value}:{})})}$(reasonId).value='';toast('تم حفظ القرار ومزامنته')}catch(err){toast(explainError(err))}}
function allowanceRecord(k,w){return allowances.find(x=>x.kidId===k&&x.weekStart===w)}
function renderAllowance(){
 const week=weekSaturday(today()),rec=allowanceRecord(selectedKid,week);
 const isSat=dateParts(today()).getDay()===6;
 const status=$('allowanceStatus'),message=$('allowanceMessage'),request=$('requestAllowance'),paid=$('markAllowancePaid'),amt=$('allowanceAmount'),history=$('allowanceHistory'),banner=$('allowanceBanner');
 $('allowanceWeek').textContent=`أسبوع السبت ${week} إلى الجمعة ${formatDate(new Date(dateParts(week).getTime()+6*86400000))}`;
 status.textContent=rec?.status==='paid'?'✅ تم صرف المصروف':rec?.status==='requested'?'📬 تم إرسال التذكير للأب والأم':'⏳ لم يُصرف المصروف بعد';
 message.textContent=rec?.status==='paid'?`تم تسجيل صرف ${Number(rec.amount||0).toFixed(3)} د.ك بواسطة ${whoDid(rec.paidBy)}.`:rec?.status==='requested'?'الطلب ظاهر للأب والأم في نفس الموقع حتى يتم تسجيل الصرف.':isSat?'اليوم السبت! افتح التبويب وذكّر الأب والأم بالمصروف الأسبوعي.':'الموعد الأسبوعي يوم السبت. ويمكن تسجيل تذكير واحد لهذا الأسبوع.';
 const unpaid=rec?.status!=='paid';request.hidden=!(person.role==='child'&&unpaid&&!rec);paid.hidden=!(parent()&&unpaid);
 amt.hidden=!parent();$('allowanceAmountLabel').hidden=!parent();
 banner.hidden=!(isSat&&unpaid);banner.textContent=person.role==='child'?'🔔 اليوم السبت: لا تنسَ تذكير الأب والأم بالمصروف الأسبوعي!':'🔔 اليوم السبت: حان موعد مصروف الأسبوع للطفل المحدد.';
 history.replaceChildren();const rows=allowances.filter(x=>x.kidId===selectedKid).sort((a,b)=>b.weekStart.localeCompare(a.weekStart)).slice(0,12);
 if(!rows.length){history.textContent='لا توجد سجلات مصروف أسبوعي حتى الآن.';return}
 rows.forEach(x=>{const div=document.createElement('div');div.className='event';const body=document.createElement('div');const title=document.createElement('b');title.textContent=`السبت ${x.weekStart} — ${x.status==='paid'?'تم الصرف':'في انتظار الصرف'}`;const detail=document.createElement('p');detail.textContent=x.status==='paid'?`${Number(x.amount||0).toFixed(3)} د.ك • سجله ${whoDid(x.paidBy)}`:`طلب تذكير بواسطة ${whoDid(x.requestedBy)}`;body.append(title,detail);div.append(body);history.append(div)})
}
$('requestAllowance').onclick=async()=>{
 if(person?.role!=='child')return;const week=weekSaturday(today());try{
  const batch=writeBatch(store);
  batch.set(aref(selectedKid,week),{kidId:selectedKid,weekStart:week,status:'requested',requestedBy:user.uid,requestedAt:serverTimestamp()});
  batch.set(doc(noticeCol()),{kidId:selectedKid,kind:'allowance',actorUid:user.uid,date:today(),weekStart:week,createdAt:serverTimestamp(),seenBy:{}});
  await batch.commit();toast('تم تسجيل التذكير وسيظهر للأب والأم')
 }catch(err){toast('تعذر تسجيل التذكير: '+explainError(err))}
};
$('markAllowancePaid').onclick=async()=>{
 if(!parent())return;const value=Number($('allowanceAmount').value);
 if(!Number.isFinite(value)||value<=0||value>100||Math.round(value*1000)!==value*1000){toast('أدخل المبلغ بالدينار الكويتي (حتى 3 خانات عشرية)');return}
 if(!confirm(`تأكيد صرف ${value.toFixed(3)} د.ك للطفل عن هذا الأسبوع؟`))return;
 const week=weekSaturday(today()),ref=aref(selectedKid,week);
 try{const old=await getDoc(ref);if(old.exists()){
 if(old.data().status==='paid'){toast('مصروف هذا الأسبوع مسجل بالفعل');return}
 await updateDoc(ref,{status:'paid',amount:value,paidBy:user.uid,paidAt:serverTimestamp()});
 }else await setDoc(ref,{kidId:selectedKid,weekStart:week,status:'paid',amount:value,paidBy:user.uid,paidAt:serverTimestamp()});
 toast('تم تأكيد صرف المصروف ومزامنته بين الأجهزة')
 }catch(err){toast('تعذر تسجيل الصرف: '+explainError(err))}
};
function nextDay(){const d=dateParts(today());d.setDate(d.getDate()+1);return formatDate(d)}
function renderSettings(){if(!parent())return;const wrap=$('settingsTasks');if(!wrap)return;wrap.replaceChildren();const n=pointsMax(today());$('currentMax').textContent=`${n} نقطة أساسية اليوم، منها ${catalog.filter(isPrayer).reduce((sum,t)=>sum+taskPoints(t,today()),0)} للصلاة`;
 catalog.forEach(t=>{const row=document.createElement('div');row.className='setting-row';const name=document.createElement('input');name.value=t.name;name.maxLength=75;name.setAttribute('aria-label','اسم النشاط');const group=document.createElement('input');group.value=t.group;group.maxLength=25;group.setAttribute('aria-label','تصنيف النشاط');const pts=document.createElement('input');pts.type='number';pts.min='0';pts.max='100';pts.step='1';pts.value=taskPoints(t,nextDay());pts.setAttribute('aria-label','عدد النقاط');const active=document.createElement('input');active.type='checkbox';active.checked=activeAt(t,nextDay());active.setAttribute('aria-label','مفعّل');if(isPrayer(t)){pts.disabled=true;active.disabled=true;name.disabled=true;group.disabled=true}
 const save=document.createElement('button');save.textContent='حفظ';save.className='primary';save.onclick=async()=>{if(!name.value.trim()||!group.value.trim()){toast('أدخل اسم المهمة والتصنيف');return}const value=Number(pts.value);if(!Number.isInteger(value)||value<0||value>100){toast('النقاط بين 0 و100');return}const tasks=structuredClone(catalog);const found=tasks.find(x=>x.id===t.id);found.name=name.value.trim();found.group=group.value.trim();found.active=active.checked;found.activation=found.activation||[{from:'0000-01-01',active:true}];const activeRec=found.activation.find(x=>x.from===nextDay());if(activeRec)activeRec.active=active.checked;else found.activation.push({from:nextDay(),active:active.checked});const existing=found.history.find(x=>x.from===nextDay());if(existing)existing.points=value;else found.history.push({from:nextDay(),points:value});await saveCatalog(tasks,'تم تحديث المهمة. النقاط الجديدة تبدأ من الغد.')};
 const label=document.createElement('label');label.append(active,' مفعّل');row.append(name,group,pts,label,save);wrap.append(row)});
}
async function saveCatalog(tasks,success){if(!parent())return;try{await setDoc(catalogRef(),{tasks,updatedBy:user.uid,updatedAt:serverTimestamp()});toast(success)}catch(err){toast(explainError(err))}}
$('addTask').onclick=async()=>{if(!parent())return;const name=$('newTaskName').value.trim(),group=$('newTaskGroup').value.trim(),p=Number($('newTaskPoints').value);if(!name||!group){toast('اكتب اسم النشاط وتصنيفه');return}if(!Number.isInteger(p)||p<1||p>100){toast('أدخل نقاطاً من 1 إلى 100');return}const ids=new Set(catalog.map(t=>t.id));let id='';for(let i=13;i<40;i++){if(!ids.has('t'+i)){id='t'+i;break}}if(!id){toast('وصلت للحد الأقصى 40 نشاطاً');return}const tasks=[...structuredClone(catalog),{id,name,group,active:true,activation:[{from:today(),active:true}],history:[{from:today(),points:p}]}];await saveCatalog(tasks,'تمت إضافة النشاط، ويظهر الآن.');$('newTaskName').value='';$('newTaskPoints').value='5'};

function uiForPerson(){const canParent=parent();$('who').textContent=`${person.name||'فرد الأسرة'} — ${person.role==='father'?'الأب':person.role==='mother'?'الأم':'الطفل'}`;show('logout',true);show('app',true);show('login',false);show('parentActions',canParent);show('familySummary',canParent);show('motherCard',person.role==='mother');show('fatherRewardCard',person.role==='father');show('settingsTabButton',canParent);show('profilesTabButton',true);show('notificationsTabButton',canParent);show('notificationBell',canParent);document.querySelectorAll('[data-tab]').forEach(t=>t.classList.toggle('active',t.dataset.tab==='daily'));document.querySelectorAll('.tabpage').forEach(t=>t.hidden=t.id!=='daily');tab='daily';renderNotifications();if(!canParent)$('settingsTasks').replaceChildren();$('kidSelect').disabled=!canParent;selectedKid=canParent?$('kidSelect').value:(person.kidId||'a');$('kidSelect').value=selectedKid;$('dateSelect').value=selectedDate;startListeners()}
$('kidSelect').onchange=e=>{selectedKid=e.target.value;render()};$('dateSelect').onchange=e=>{selectedDate=e.target.value||today();render()};
for(const b of document.querySelectorAll('[data-tab]'))b.onclick=()=>{tab=b.dataset.tab;document.querySelectorAll('[data-tab]').forEach(t=>t.classList.toggle('active',t.dataset.tab===tab));document.querySelectorAll('.tabpage').forEach(s=>s.hidden=s.id!==tab)};
$('giveBonus').onclick=()=>saveEvent('bonus');$('giveDeduction').onclick=()=>saveEvent('deduction');$('givePlay').onclick=()=>saveEvent('play');$('giveReward').onclick=()=>saveEvent('reward');
$('nightPhoneDeduct').onclick=()=>{$('deductAmount').value='10';$('deductReason').value='استخدام الموبايل بعد موعد النوم';saveEvent('deduction')};

$('loginForm').onsubmit=async e=>{e.preventDefault();$('loginError').textContent='';try{await signInWithEmailAndPassword(auth,$('email').value.trim(),$('password').value)}catch(err){$('loginError').textContent=explainError(err)}};
$('logout').onclick=async()=>{await signOut(auth)};
$('notificationBell').onclick=()=>{if(!parent())return;document.querySelector('[data-tab="notifications"]').click()};
$('markNoticesRead').onclick=async()=>{
 if(!parent())return;
 const unread=notices.filter(n=>!n.seenBy?.[user.uid]);
 if(!unread.length)return toast('لا توجد إشعارات جديدة');
 try{for(let i=0;i<unread.length;i+=250){const batch=writeBatch(store);unread.slice(i,i+250).forEach(n=>batch.update(doc(noticeCol(),n.id),{[`seenBy.${user.uid}`]:true}));await batch.commit()}toast('تم تحديد الإشعارات كمقروءة')}
 catch(err){toast('تعذر تحديث الإشعارات: '+explainError(err))}
};
function renderNotifications(){
 const badge=$('notificationBadge'),count=$('tabNoticeCount'),wrap=$('notificationList');if(!badge||!count||!wrap)return;
 const unseen=parent()?notices.filter(n=>!n.seenBy?.[user.uid]).length:0;
 badge.hidden=!unseen;badge.textContent=unseen>99?'99+':String(unseen);
 count.textContent=unseen?`(${unseen})`:'';wrap.replaceChildren();
 if(!parent())return;
 if(!notices.length){const msg=document.createElement('div');msg.className='notice-empty';msg.textContent='لا توجد إشعارات حتى الآن';wrap.append(msg);return}
 for(const n of notices){const row=document.createElement('div');row.className='event notice-item'+(!n.seenBy?.[user.uid]?' unread':'');const details=document.createElement('div');
 const title=document.createElement('b');const kid=n.kidId==='a'?'الطفل الأول':'الطفل الثاني';const desc=n.kind==='login'?`🔑 ${kid} دخل الموقع`:n.kind==='allowance'?`💰 ${kid} طلب مصروف السبت`:`📝 ${kid} ${n.taskCompleted?'أنجز':'ألغى إنجاز'}: ${taskAt(n.taskId)?.name||'نشاط'}`;
 title.textContent=desc;const when=document.createElement('time');when.textContent=n.createdAt?.toDate?.().toLocaleString(window.NogoomI18n?.lang()==='en'?'en-GB':'ar-KW')||'جارٍ تحديد الوقت';details.append(title,when);
 if(n.kind==='task'){const d=document.createElement('small');d.textContent=n.date;details.append(d)}
 row.append(details);wrap.append(row)}
 window.NogoomI18n?.apply();
}
async function recordChildLogin(){
 if(person?.role!=='child')return;
 try{await addDoc(noticeCol(),{kidId:person.kidId,kind:'login',actorUid:user.uid,date:today(),createdAt:serverTimestamp(),seenBy:{}})}
 catch(err){toast('تعذر تسجيل إشعار الدخول: '+explainError(err))}
}

if(!firebaseConfig.apiKey||firebaseConfig.apiKey.includes('PASTE_')||firebaseConfig.projectId==='YOUR_PROJECT_ID'||familyId==='your-private-family-id'){show('setup',true)}else{
 try{app=initializeApp(firebaseConfig);auth=getAuth(app);store=getFirestore(app);onAuthStateChanged(auth,async u=>{unsubscribeAll();user=u;person=null;if(!u){show('login',true);show('app',false);show('logout',false);$('who').textContent='غير مسجل';return}try{const snap=await getDoc(doc(store,base(),'members',u.uid));if(!snap.exists())throw Error('الحساب موجود لكن لم يتم تعيينه كعضو في الأسرة. أضف ملف العضو من Firebase Console.');person={...snap.data(),uid:u.uid};if(!['father','mother','child'].includes(person.role)||person.role==='child'&&!['a','b'].includes(person.kidId))throw Error('بيانات صلاحية العضو غير مكتملة.');uiForPerson();if(person.role==='child')recordChildLogin()}catch(err){show('app',false);show('login',false);show('setup',true);$('setup').querySelector('p').textContent=explainError(err)}})}catch(err){show('setup',true);$('setup').querySelector('p').textContent=explainError(err)}
}


// Family profiles are stored in the existing members documents, not in public web files.
function renderProfiles(){
  const member=childMember(selectedKid);
  const displayName=member?.name|| (selectedKid==='a'?'الطفل الأول':'الطفل الثاني');
  const picker=$('kidSelect');
  for(const kid of ['a','b']){const m=childMember(kid);const option=picker.querySelector(`option[value="${kid}"]`);if(option)option.textContent=(m?.name||(kid==='a'?'الطفل الأول':'الطفل الثاني'))+(m?.age?` (${m.age})`:'');}
  $('selectedProfileName').textContent=displayName;
  $('selectedProfileAvatar').replaceChildren();
  const small=member?.avatar;
  if(small){const img=document.createElement('img');img.src=small;img.alt='';$('selectedProfileAvatar').append(img)}else $('selectedProfileAvatar').textContent=displayName.trim().charAt(0)||'★';
  const big=$('profileAvatar'),initial=$('profileInitial');
  const profileKey=`${selectedKid}|${member?.id||''}|${member?.name||''}|${member?.age||''}`;
  const targetChanged=profileTarget!==selectedKid;
  const editingText=[$('profileName'),$('profileAge')].includes(document.activeElement);
  if(targetChanged){draftPhoto=null;removePhoto=false;profileTarget=selectedKid;$('profilePhoto').value='';}
  if(targetChanged||(profileSeenKey!==profileKey&&!editingText&&!draftPhoto)){
    $('profileName').value=member?.name||'';$('profileAge').value=member?.age|| (selectedKid==='a'?13:9);profileSeenKey=profileKey;
  }
  const isEditing=profileTarget===selectedKid && (draftPhoto||removePhoto);
  const photo=isEditing?(removePhoto?'':draftPhoto):small;
  big.hidden=!photo;initial.hidden=!!photo;
  if(photo)big.src=photo;else {big.removeAttribute('src');initial.textContent=displayName.trim().charAt(0)||'★'}
  for(const id of ['profileName','profileAge','profilePhoto','profileSave','profileRemovePhoto'])$(id).disabled=!parent()||!member;
  $('profileInfo').textContent=parent()? (member?'يمكنك تعديل الاسم والعمر والصورة، ثم اضغط حفظ.':'لم يتم العثور على حساب الطفل في members.'):'يمكنك مشاهدة الملف الشخصي؛ التعديل للأب والأم فقط.';
}
async function compressProfilePhoto(file){
  if(file.size>12*1024*1024)throw Error('حجم الصورة الأصلية كبير جداً (الحد 12MB).');
  // The browser decodes supported image formats. JPEG output avoids Firestore Storage setup.
  let image;
  if('createImageBitmap' in window){image=await createImageBitmap(file)}else{
    image=await new Promise((resolve,reject)=>{const img=new Image();const u=URL.createObjectURL(file);img.onload=()=>{URL.revokeObjectURL(u);resolve(img)};img.onerror=()=>{URL.revokeObjectURL(u);reject(Error('تعذر قراءة الصورة'))};img.src=u});
  }
  const w=image.width||image.naturalWidth,h=image.height||image.naturalHeight;
  if(!w||!h)throw Error('صورة غير صالحة');
  const side=Math.min(w,h),canvas=document.createElement('canvas');canvas.width=240;canvas.height=240;
  const ctx=canvas.getContext('2d');ctx.drawImage(image,(w-side)/2,(h-side)/2,side,side,0,0,240,240);
  if(image.close)image.close();
  let encoded=canvas.toDataURL('image/jpeg',0.68);
  if(encoded.length>85000)encoded=canvas.toDataURL('image/jpeg',0.44);
  if(encoded.length>85000)throw Error('الصورة كبيرة بعد ضغطها؛ اختر صورة أخرى.');
  return encoded;
}
$('profilePhoto').onchange=async e=>{
  if(!parent())return;const file=e.target.files?.[0];if(!file)return;
  try{draftPhoto=await compressProfilePhoto(file);removePhoto=false;profileTarget=selectedKid;renderProfiles();$('profileInfo').textContent='✓ الصورة جاهزة. اضغط حفظ الملف الشخصي.'}
  catch(err){draftPhoto=null;e.target.value='';toast(err.message||'تعذر معالجة الصورة')}
};
$('profileRemovePhoto').onclick=()=>{if(!parent())return;draftPhoto=null;removePhoto=true;profileTarget=selectedKid;renderProfiles();$('profileInfo').textContent='ستتم إزالة الصورة عند الضغط على حفظ.'};
$('profileSave').onclick=async()=>{
  if(!parent())return;const m=childMember(selectedKid);if(!m){toast('ملف الطفل غير موجود');return}
  const name=$('profileName').value.trim(),age=Number($('profileAge').value);
  if(!name||name.length>60){toast('أدخل اسماً لا يتجاوز 60 حرفاً');return}
  if(!Number.isInteger(age)||age<1||age>20){toast('أدخل عمراً صحيحاً من 1 إلى 20');return}
  const changes={name,age};if(draftPhoto)changes.avatar=draftPhoto;else if(removePhoto)changes.avatar='';
  try{await updateDoc(doc(store,base(),'members',m.id),changes);draftPhoto=null;removePhoto=false;profileTarget=null;$('profilePhoto').value='';toast('✓ تم حفظ ملف الطفل ومزامنته');renderProfiles()}
  catch(err){toast('تعذر حفظ الملف: '+explainError(err))}
};

// Language picker changes only presentation; records keep stable Arabic task IDs.
const languagePicker=$('languageSelect');
if(languagePicker){languagePicker.value=window.NogoomI18n?.lang()||'ar';languagePicker.addEventListener('change',e=>{window.NogoomI18n?.setLang(e.target.value);renderNotifications()})}
// Animate changing metric values, but honor OS reduced-motion preference.
if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches){
 for(const el of document.querySelectorAll('.metric b')){
  const observer=new MutationObserver(()=>{el.classList.remove('value-changed');void el.offsetWidth;el.classList.add('value-changed')});
  observer.observe(el,{childList:true,characterData:true,subtree:true});
 }
}
