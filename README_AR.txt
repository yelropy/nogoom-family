إصلاح تعلّق صفحة نجوم البيت — نسخة طوارئ

1. ارفع الملفات الثلاثة index.html وi18n.js وservice-worker.js إلى جذر GitHub:
https://github.com/yelropy/nogoom-family
Add file → Upload files → Commit changes
2. لا ترفع ملف ZIP نفسه، ولا تغيّر إعدادات Firebase أو app.js.
3. بعد النشر افتح نافذة خاصة (Ctrl+Shift+N) ثم:
https://yelropy.github.io/nogoom-family/
4. إذا استمر التعليق: افتح أدوات المطور F12 → Console وصوّر أول رسالة حمراء.

الإصلاح يوقف مراقبة الترجمة المستمرة ويعطّل التخزين المؤقت مؤقتاً. البيانات السحابية لا تُمس. بعض النصوص التي تُضاف ديناميكياً قد تظهر بالعربية حتى في وضع English إلى حين إعادة تطبيق ترجمتها.
