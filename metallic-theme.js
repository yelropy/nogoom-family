/* NOGO0M - localized, accessible light/dark theme; local to each device. */
(()=>{
  const KEY='nogoom-ui-theme';
  const root=document.documentElement;
  let selected='light';
  try{selected=localStorage.getItem(KEY)==='dark'?'dark':'light'}catch{}
  function apply(mode){
    root.setAttribute('data-theme',mode);
    const btn=document.getElementById('themeToggle');
    const icon=document.getElementById('themeIcon');
    const label=document.getElementById('themeLabel');
    const lang=document.documentElement.lang||'ar';
    if(icon)icon.textContent=mode==='dark'?'☀':'☾';
    if(label)label.textContent=mode==='dark'?(lang==='en'?'Light':'فاتح'):(lang==='en'?'Dark':'داكن');
    if(btn){btn.setAttribute('aria-pressed',String(mode==='dark'));btn.setAttribute('aria-label',lang==='en'?'Switch to '+(mode==='dark'?'light':'dark')+' mode':'التبديل إلى الوضع '+(mode==='dark'?'الفاتح':'الداكن'));}
    const meta=document.querySelector('meta[name="theme-color"]');
    if(meta)meta.setAttribute('content',mode==='dark'?'#171326':'#f8f5ff');
  }
  apply(selected);
  document.addEventListener('DOMContentLoaded',()=>{
    apply(selected);
    const btn=document.getElementById('themeToggle');
    btn?.addEventListener('click',()=>{
      selected=selected==='dark'?'light':'dark';
      try{localStorage.setItem(KEY,selected)}catch{}
      apply(selected);
    });
    document.getElementById('languageSelect')?.addEventListener('change',()=>setTimeout(()=>apply(selected),0));
    const observer=new MutationObserver(()=>apply(selected));
    observer.observe(root,{attributes:true,attributeFilter:['lang']});
  });
})();
