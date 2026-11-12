(function(){
'use strict';
const translations={
  "نجوم البيت | لوحة الأسرة": "Nogoom Al-Beet | Family Dashboard",
  "★ نجوم البيت": "★ Nogoom Al-Beet",
  "صلاتي • قرآني • مذاكرتي • أخلاقي": "Prayer • Quran • Study • Kindness",
  "اللغة": "Language",
  "العربية": "Arabic",
  "غير مسجل": "Not signed in",
  "خروج": "Log out",
  "إعداد الموقع مطلوب": "Site setup required",
  "أضف بيانات مشروع Firebase داخل ملف": "Add your Firebase project settings in",
  "، ثم انشر الملفات كما هو موضح في دليل التشغيل.": ", then deploy the files as described in the setup guide.",
  "تسجيل دخول الأسرة": "Family sign in",
  "الأب والأم والطفلان لكل منهم حساب خاص.": "Each parent and child has a separate account.",
  "البريد الإلكتروني": "Email",
  "كلمة المرور": "Password",
  "دخول": "Sign in",
  "الطفل": "Child",
  "الطفل الأول (13 سنة)": "Child 1 (13 years)",
  "الطفل الثاني (9 سنوات)": "Child 2 (9 years)",
  "التاريخ": "Date",
  "جارٍ الاتصال...": "Connecting...",
  "الإنجازات اليومية": "Daily achievements",
  "الخصومات والبونص": "Deductions & bonuses",
  "التقارير": "Reports",
  "💰 مصروف السبت": "💰 Saturday allowance",
  "🔔 الإشعارات": "🔔 Notifications",
  "إعدادات الأسرة": "Family settings",
  "نقاط اليوم": "Today’s points",
  "نقاط الصلاة": "Prayer points",
  "مكافأة الشهر": "Monthly reward",
  "صافي خصومات الشهر": "Monthly deductions",
  "مهام اليوم": "Today’s tasks",
  "الصلاة لها الأولوية — 100 نقطة يومياً": "Prayer comes first — 100 points daily",
  "الطفل يسجل الإنجاز، والأب والأم يراجعان ويوقعان. اجعلوا المراجعة تشجيعية دون خصم نقاط الصلاة المكتسبة.": "Children log achievements; parents review and sign. Keep feedback encouraging and do not deduct earned prayer points.",
  "التوقيعات بالقلم": "Handwritten signatures",
  "التوقيع شهادة مراجعة عائلية، وليس توقيعاً قانونياً. يمكن رسمه بقلم التابلت أو الإصبع أو الماوس، ويحفظ على حساب صاحبه فقط.": "Signatures document family reviews, not legal approvals. Sign using a stylus, finger, or mouse; each account saves its own signature.",
  "إدارة المكافآت والخصومات": "Manage rewards and deductions",
  "الإضافة والتعديل للأب والأم فقط. ساعة البلايستيشن من الأم وحدها. كل قرار موثق باسم صاحبه وتاريخه، ويظل السجل ظاهراً حتى بعد الإلغاء.": "Parents alone may add or change decisions. PlayStation time is granted only by Mom. Every decision records its author and date and remains in the history even if canceled.",
  "⭐ بونص مميز: +50 نقطة": "⭐ Special bonus: +50 points",
  "اعتماد بونص 50": "Give 50-point bonus",
  "➖ خصم سلوكي": "➖ Behavior deduction",
  "5 نقاط — تنبيه بسيط": "5 points — Minor warning",
  "10 نقاط — عدم التزام": "10 points — Rule not followed",
  "15 نقطة — سلوك متكرر": "15 points — Repeated behavior",
  "20 نقطة — مخالفة قواعد": "20 points — Rule violation",
  "50 نقطة — موقف استثنائي": "50 points — Exceptional case",
  "سجل الخصم": "Record deduction",
  "📱 خصم استخدام الموبايل بعد النوم": "📱 Phone use after bedtime",
  "خصم ثابت 10 نقاط مع تسجيل التاريخ والسبب.": "Fixed 10-point deduction with date and reason.",
  "تسجيل خصم 10 نقاط": "Deduct 10 points",
  "🎁 رحلة أو هدية من الأب": "🎁 Trip or gift from Dad",
  "رحلة": "Trip",
  "هدية": "Gift",
  "اعتماد مكافأة الأب": "Grant Dad’s reward",
  "مكافأة غير نقدية، لا تضاف لمجموع النقاط أو سقف 10 د.ك.": "A non-cash reward; it does not affect points or the KWD 10 monthly cap.",
  "🎮 مكافأة الأم الخاصة": "🎮 Mom’s special reward",
  "اعتماد ساعة لعب": "Grant one gaming hour",
  "سجل القرارات — للشهر المحدد": "Decision history — selected month",
  "الملخص الأسبوعي": "Weekly summary",
  "المهام": "Tasks",
  "الصلاة": "Prayer",
  "بونص": "Bonus",
  "خصومات": "Deductions",
  "صافي": "Net",
  "التوقيعات": "Signatures",
  "الملخص الشهري": "Monthly summary",
  "الأسبوع": "Week",
  "صافي النقاط": "Net points",
  "البونص": "Bonuses",
  "الخصومات": "Deductions",
  "قيمة تقديرية (د.ك)": "Estimated reward (KWD)",
  "المكافأة الأساسية = أقل قيمة بين 10 د.ك و(10 × صافي النقاط ÷ مجموع النقاط الأساسية المتاحة في أيام الشهر). نقاط البونص تساعد على بلوغ الحد، لكنها لا تتجاوزه. المكافأة غير النقدية منفصلة.": "Cash reward = the lesser of KWD 10 and (10 × net points ÷ available basic points in the month). Bonuses help reach this cap but cannot exceed it. Non-cash rewards are separate.",
  "مقارنة الطفلين": "Compare both children",
  "💰 تذكير المصروف الأسبوعي — كل يوم سبت": "💰 Weekly allowance reminder — every Saturday",
  "هذا التذكير منفصل عن مكافأة النقاط الشهرية (10 د.ك)، ولا يخصم منها أو يضيف إليها. يظهر داخل الموقع ولا يرسل إشعارات للهاتف خارج الموقع.": "This reminder is separate from the KWD 10 monthly reward. It is visible in this site; it does not send phone push notifications while the site is closed.",
  "⏳ في انتظار الصرف": "⏳ Awaiting payment",
  "🔔 ذكّر أبي وأمي بالمصروف": "🔔 Remind Mom & Dad",
  "المبلغ المصروف بالدينار الكويتي (مثلاً 0.500)": "Amount paid in KWD (e.g., 0.500)",
  "✅ تأكيد صرف المصروف": "✅ Confirm allowance paid",
  "لا يُعتبر المصروف مدفوعاً إلا بعد تسجيل الأب أو الأم للصرف. لكل طفل طلب واحد فقط عن كل أسبوع.": "An allowance counts as paid only after a parent confirms payment. One request per child per week.",
  "سجل المصروف الأسبوعي": "Weekly allowance history",
  "🔔 نشاط الأطفال والإشعارات": "🔔 Children’s activity & notifications",
  "يظهر للأب والأم دخول الأطفال وتعديلات مهامهم وطلبات المصروف. سجل مباشر ومحفوظ في Firebase.": "Parents see child sign-ins, task changes, and allowance requests. Live activity history saved in Firebase.",
  "تحديد الكل كمقروء": "Mark all as read",
  "إدارة البنود والنقاط — الأب والأم فقط": "Manage tasks & points — parents only",
  "غيّر أسماء المهام وتصنيفاتها أو نقاطها، أو أوقف بنداً دون حذفه من السجل. البنود الجديدة تُضاف فوراً، وتغييرات نقاط البنود القديمة تبدأ من الغد لحماية النقاط السابقة. نقاط الصلاة ثابتة ومحمية.": "Edit task names, categories, points, or disable a task without deleting history. New tasks are added immediately; point changes to existing tasks start tomorrow. Prayer points are fixed and protected.",
  "النشاط": "Task",
  "التصنيف": "Category",
  "النقاط (من الغد)": "Points (from tomorrow)",
  "التفعيل": "Active",
  "حفظ": "Save",
  "إضافة بند جديد": "Add a new task",
  "+ إضافة البند": "+ Add task",
  "بمجرد الحفظ، يظهر البند على أجهزة الأسرة كلها تلقائياً. تتغير قيمة 10 دنانير الشهرية بحسب إجمالي النقاط المتاحة دون تجاوز السقف.": "After saving, the task appears on all family devices. The KWD 10 monthly cap stays fixed as the available points change.",
  "صلاة الفجر في وقتها": "Fajr prayer on time",
  "صلاة الظهر في وقتها": "Dhuhr prayer on time",
  "صلاة العصر في وقتها": "Asr prayer on time",
  "صلاة المغرب في وقتها": "Maghrib prayer on time",
  "صلاة العشاء في وقتها": "Isha prayer on time",
  "حفظ القرآن الكريم ومراجعته": "Quran memorization & revision",
  "المذاكرة بتركيز": "Focused studying",
  "إنهاء الواجبات المدرسية": "Finish school homework",
  "قراءة أو تعلم شيء جديد": "Reading or learning",
  "ترتيب الغرفة والأغراض": "Tidy room & belongings",
  "الأخلاق واحترام الوالدين": "Good manners & respect",
  "النوم في الموعد": "Go to bed on time",
  "غسيل الأسنان": "Brush teeth",
  "قرآن": "Quran",
  "مذاكرة": "Study",
  "تطوير": "Learning",
  "نظام": "Routine",
  "سلوك": "Behavior",
  "لم يتم تسجيل قرارات": "No decisions recorded",
  "لا توجد إشعارات حتى الآن": "No notifications yet",
  "لا توجد إشعارات جديدة": "No new notifications",
  "الطفل الأول": "Child 1",
  "الطفل الثاني": "Child 2",
  "الأب": "Dad",
  "الأم": "Mom",
  "مفعّل": "Active",
  "نقطة": "point",
  "نقاط": "points",
  "كل يوم فرصة لإنجاز جديد": "Every day, a new opportunity",
  "رحلتنا اليومية نحو العادات الجميلة والإنجازات الصغيرة.": "Our daily journey of good habits and little wins.",
  "د.ك": "KWD",
  "اسم البند (مثلاً: مساعدة البيت)": "Task name (e.g., help at home)",
  "سبب البونص": "Reason for bonus",
  "سبب واضح للخصم": "Reason for deduction",
  "تفاصيل الرحلة أو الهدية وسببها": "Trip or gift details and reason",
  "سبب ساعة البلايستيشن": "Reason for gaming time",
  "مثال: 0.500": "Example: 0.500",
  "عدد نقاط المهمة": "Task points",
  "اسم النشاط": "Task name",
  "تصنيف النشاط": "Task category",
  "عدد النقاط": "Points",
  "خطأ في المزامنة": "Sync error",
  "تم تسجيل التذكير وسيظهر للأب والأم": "Reminder sent to parents",
  "تم تأكيد صرف المصروف ومزامنته بين الأجهزة": "Allowance marked as paid and synced"
};
Object.assign(translations, {
  '👤 ملف الطفل':'👤 Child profile',
  'يمكن للأب أو الأم تغيير الاسم والعمر وإضافة صورة شخصية تظهر لجميع أفراد الأسرة.':'Parents can edit the child’s name, age and profile photo, visible to the whole family.',
  "اسم الطفل / Child's name":"Child’s name",
  'العمر / Age':'Age',
  'الصورة / Photo':'Photo',
  'حفظ الملف الشخصي / Save profile':'Save profile',
  'إزالة الصورة / Remove photo':'Remove photo',
  'الصور يتم تصغيرها تلقائياً للحفاظ على سرعة التطبيق.':'Photos are automatically resized to keep the app fast.',
  'صلاحية التعديل للأب والأم فقط. الطفل يشاهد صورته وبياناته دون تغييرها.':'Only parents can edit; children can view their profile.',
  'يمكنك تعديل الاسم والعمر والصورة، ثم اضغط حفظ.':'Edit the name, age and photo, then press Save.',
  'يمكنك مشاهدة الملف الشخصي؛ التعديل للأب والأم فقط.':'You can view your profile; only parents may edit.',
});
const originalText=new WeakMap();
const renderedText=new WeakMap();
const originalAttr=new WeakMap();
const ignored=new Set(['SCRIPT','STYLE','CODE','TEXTAREA']);
const getLang=()=>{try{return localStorage.getItem('nogoom.language')==='en'?'en':'ar'}catch(_){return'ar'}};
let lang=getLang();
const regexes=[
 [/^(\d+(?:\.\d+)?) نقطة$/,(m,n)=>`${n} points`],
 [/^(\d+(?:\.\d+)?) نقاط$/,(m,n)=>`${n} points`],
 [/^(\d+(?:\.\d+)?) قرار$/,(m,n)=>`${n} decisions`],
 [/^(.+?) — (الأب|الأم|الطفل)$/,(m,n,r)=>`${translations[n]||n} — ${translations[r]||r}`],
 [/^(\d+) نقطة أساسية اليوم، منها (\d+) للصلاة$/,(m,a,b)=>`${a} basic points today, including ${b} for prayer`],
 [/^(\d+(?:\.\d+)?) د\.ك$/,(m,n)=>`${n} KWD`],
 [/^(\d+) \/ (\d+)$/,(m,a,b)=>`${a} / ${b}`],
 [/^● متصل — التحديث مباشر$/ ,()=> '● Connected — live updates'],
 [/^● تعذرت المزامنة$/ ,()=> '● Sync failed'],
 [/^🔑 (الطفل الأول|الطفل الثاني) دخل الموقع$/,(m,k)=>`🔑 ${translations[k]} signed in`],
 [/^💰 (الطفل الأول|الطفل الثاني) طلب مصروف السبت$/,(m,k)=>`💰 ${translations[k]} requested Saturday allowance`],
 [/^📝 (الطفل الأول|الطفل الثاني) (أنجز|ألغى إنجاز): (.+)$/,(m,k,a,t)=>`📝 ${translations[k]} ${a==='أنجز'?'completed':'unchecked'}: ${translations[t]||t}`]
];
const tr=s=>{if(!s)return s;const trimmed=s.trim();let v=translations[trimmed];if(!v){for(const [re,fn] of regexes){if(re.test(trimmed)){v=trimmed.replace(re,fn);break}}}if(v===undefined)return s;return s.replace(trimmed,v)};
function apply(){
 document.documentElement.lang=lang;
 document.documentElement.dir=lang==='en'?'ltr':'rtl';
 const picker=document.getElementById('languageSelect');if(picker&&picker.value!==lang)picker.value=lang;
 const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
 const nodes=[];let node;while((node=walker.nextNode()))nodes.push(node);
 for(const n of nodes){if(!n.parentElement||ignored.has(n.parentElement.tagName))continue;
  if(!originalText.has(n)||n.nodeValue!==renderedText.get(n))originalText.set(n,n.nodeValue);
  const original=originalText.get(n);const updated=lang==='en'?tr(original):original;
  if(n.nodeValue!==updated)n.nodeValue=updated;
  renderedText.set(n,updated);
 }
 for(const el of document.querySelectorAll('[placeholder],[title],[aria-label]')){
  let m=originalAttr.get(el);if(!m){m={};for(const a of ['placeholder','title','aria-label'])if(el.hasAttribute(a))m[a]=el.getAttribute(a);originalAttr.set(el,m)}
  for(const [a,v] of Object.entries(m)){const next=lang==='en'?tr(v):v;if(el.getAttribute(a)!==next)el.setAttribute(a,next)}
 }
}
function setLang(value){lang=value==='en'?'en':'ar';try{localStorage.setItem('nogoom.language',lang)}catch(_){ }apply()}
window.NogoomI18n={apply,setLang,lang:getLang,t:tr};
// Emergency reliability fix: do not watch every DOM mutation or trigger recursive translations.
// app.js invokes apply() after dynamic content updates, and setLang() handles manual switching.
window.addEventListener('DOMContentLoaded',()=>{apply();});
})();
