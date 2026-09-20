# دليل النشر للإنتاج (Vercel + Supabase)

## 1. قبل النشر — تحقق محلي
```bash
npm test
npm run test:rls
npm run typecheck
npm run lint
npm run build
```
الكل يجب أن يكون أخضر.

## 2. Supabase — إعداد الإنتاج
1. يفضّل مشروع Supabase منفصل للإنتاج (أو نفس المشروع للانطلاق الناعم).
2. نفّذ ملفات الهجرة بالترتيب في SQL Editor:
   `0001_initial_schema.sql` → `0002_storage.sql` → `0003_auth_trigger.sql` →
   `0005_rls_recursion_fix.sql` → `0006_youtube_public.sql` →
   `0007_exam_writes.sql` → `0008_admin.sql`
   (تخطَّ `0004` — استُبدل بـ 0005 + 0006)
3. Authentication → URL Configuration:
   - Site URL = دومين الإنتاج (مثال: `https://app.example.com`)
   - Redirect URLs = أضف `https://app.example.com/**` و `http://localhost:3000/**` للتطوير
4. فعّل/اضبط Confirm email حسب سياستك، وجهّز SMTP مخصص قبل الإطلاق العام.
5. أنشئ أول أدمن بالـ SQL ثم احذف بيانات الاختبار (الكورس التجريبي).

## 3. GitHub
```bash
git init
git add -A
git commit -m "edu platform v1"
# أنشئ مستودعاً فارغاً على GitHub ثم:
git remote add origin https://github.com/USERNAME/REPO.git
git branch -M main
git push -u origin main
```

## 4. Cloudflare (Workers — بدل Vercel)
المشروع مهيأ عبر `@opennextjs/cloudflare` + `wrangler.jsonc`.

1. ادفع الكود إلى GitHub (القسم 3).
2. سجّل الدخول: `npx wrangler login`
3. عرّف الأسرار (لا تضعها في الملفات):
```bash
npx wrangler secret put NEXT_PUBLIC_SUPABASE_URL
npx wrangler secret put NEXT_PUBLIC_SUPABASE_ANON_KEY
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
npx wrangler secret put NEXT_PUBLIC_SITE_URL
```
4. البناء والنشر (يُفضَّل على Linux/CI — بناء الويندوز المحلي قد يفشل في حزمة native):
```bash
npm run cf:build
npm run cf:deploy
```
أو اربط المستودع من لوحة Cloudflare → Workers → Create → Import repository
وأمر البناء: `npx opennextjs-cloudflare build`.
5. أضف الدومين المخصص من لوحة Cloudflare → Workers → Custom Domains.
6. في Supabase: حدّث Site URL و Redirect URLs بدومين Cloudflare.

> ملاحظة: `npx opennextjs-cloudflare build` على ويندوز قد يفشل بخطأ
> `ERR_DLOPEN_FAILED` (حزمة native) — هذه مشكلة بيئة محلية فقط،
> وبناء Cloudflare على لينكس يعمل. تحقق محلياً عبر `npm run build`.


## 5. بعد النشر — فحص الدخان
- `/` تفتح بهوية KHOTA
- تسجيل حساب طالب جديد → onboarding → dashboard
- كورس تجريبي: اشتراك → درس → تقدم → امتحان → نتيجة
- لوحة المدرس والأدمن تعمل
- `/sitemap.xml` و `/robots.txt` يعملان

## 6. ما قبل الإطلاق العام
- [ ] نسخة احتياطية يومية لقاعدة البيانات (Supabase Backups)
- [ ] SMTP مخصص + قوالب الإيميل بالعربية
- [ ] تفعيل Confirm email
- [ ] حذف كل بيانات الاختبار والمستخدمين التجريبيين
- [ ] مراجعة RLS مرة أخيرة: `npm run test:rls`
- [ ] مراقبة أخطاء (Sentry أو Vercel Monitoring)
