# موبيليا محمد · MOHAMMED Mobilia (مشروع تصميمي)

موقع أثاث مفترض (علامة وهمية) مبني بالكامل بالثلاثي الأبعاد الحيّ، ومصمَّم ليكون عرضاً لأصحاب مصانع الأثاث (بورصة/إينيغول): **كتالوجكم يعيش بالـ3D**.

**الفكرة:** "يوم في بيت محمد": التمرير = مرور اليوم (الفجر ← الصباح ← الظهيرة ← الغروب ← الليل). الشمس تعبر خلف نوافذ مقوّسة (القوس هو شعار العلامة) فتزحف بقع الضوء وظلال الأقواس على أرضية ترافرتين عاكسة، والمصابيح تشتعل عند الغروب، والصوت عصافير نهاراً وصراصير ليلاً.

## ما يميّزه
- **القطع تبني نفسها**: عند وصول الكاميرا لكل غرفة تتجمّع الأريكة والطاولة والسرير من أجزائها (أرجل، هيكل، إسفنج، وسائد...).
- **إعادة طلاء حيّة**: تغيير القماش/الخشب/الحجر يمرّر حلقة ضوء تُعيد كسوة القطعة، وأنماط البيت الأربعة (رمل، واحة، ليل، وردي طيني) تُلبس البيت كله بموجة واحدة.
- **التفكيك (Anatomy)** مع مسمّيات، و**الأبعاد (Dimensions)** بالسنتيمتر، و**اسحب الشمس** بشريط الضوء.
- متجر كامل: خيارات حيّة (مقاس/خشب/قماش/رخام) وأسعار تتحدّث، سلة بلقطة حقيقية للقطعة بإعدادها، دفع تجريبي (بطاقات الاختبار فقط).
- ثلاث لغات: English، **Türkçe**، العربية (بدون قلب الاتجاه). افتراضياً تُختار لغة المتصفح؛ للرابط التركي أضف `?lang=tr`.
- يعمل على الهاتف: تركيب عمودي، لوحة سفلية، جيروسكوب لتحريك الزاوية، وجودة تتكيّف تلقائياً.

## كل شيء مولَّد بالكود (بلا ملفات نماذج أو صور خامات)
- three.js r172 (مضمّنة في `js/vendor`، بلا CDN).
- الخامات (خشب، جص، ترافرتين، بوكليه، قطيفة، كتّان، جلد، رخام، صوف) تُولَّد على كرت الشاشة ثم تُلوَّن بخريطة تدرّج.
- أرائك منحنية بمسح مقطع حول قوس، ظهر سرير مخدّد يتبع القوس، أرجل طاولة على شكل قوس.
- ظلال الشمس/القمر، انعكاس مستوي للأرضية، أعمدة ضوء حجمية وغبار، تألّق (bloom) وACES وحبيبات فيلم.

## تشغيل محلي
انقر مرتين على `run-site.bat` (يشغّل خادماً على المنفذ 3500 ويفتح كروم). يحتاج خادماً لأن الموقع يستخدم وحدات ES وimportmap.

## هيكل المجلد
- `index.html`, `css/`, `js/` (الواجهة: `app.js`، السلة: `store.js`، النصوص: `content.js`، الكتالوج والأسعار: `catalog.js`).
- `js/gl/`: `core.js` (العالم والإضاءة)، `gallery.js` (المعرض والمناطق)، `furniture.js` (القطع)، `decor.js`، `outdoors.js` (سماء وأعمدة ضوء)، `materials.js` + `texgen.js` (الخامات)، `post.js`، `experience.js` (الكاميرا والتفاعل)، `sfx.js`.
- `dev.html` + `js/dev.js`: صفحة اختبار للّقطات (`?cam=x,y,z,tx,ty,tz&hour=..&zones=..`).

## للتعديل لاحقاً
- زر "لنتحدث عن كتالوجكم" في قسم أصحاب المصانع مخفي حتى تضع رابط التواصل (واتساب/لينكدإن/بريد) في آخر `js/content.js` داخل `window.CONTACT_URL`.
- الألوان والخامات والأنماط: `js/gl/data.js`. الأسعار والخيارات: `js/catalog.js`.

## ملاحظات صدق
علامة ومنتجات وآراء وهمية. النماذج مولّدة بالكود. الدفع تجريبي بالكامل ولا يرسل شيئاً لأي مكان (يقبل بطاقات الاختبار المعروفة فقط).

## Hero: looping video, one screen (2026-10-24)
The hero is one screen: the first headline over a light looping video (`assets/hero/loop-desktop.mp4` 1920x1080, `assets/hero/loop-phone.mp4` 720 wide, about 15 s, roughly 1-6 MB), rendered offline from the live 3D scene at constant speed (no stops, no easing) and looped with a short cross-dissolve from the end of the journey back into its start, so it repeats with no cut. It has nothing to do with scrolling: `js/hero-video.js` sets it to `loop`, plays it while the hero is on screen, pauses it as soon as the hero leaves the viewport and removes the source (frees the memory) when the visitor is far from the hero. Scrolling is plain native scrolling. The poster (first frame of the loop) stays until the video plays (and on browsers that block autoplay, such as iPhone Low Power Mode, until the first touch). `?hero=off`, data-saver and reduced motion keep the still poster. Earlier versions: tall pinned story with the looping video, four-stop clips (`_clips_four_stop_version/`), image sequence, live 3D (`_live3d_version/`, git history). Re-render with `_hero_video_tools/capture_loop.py` (original 3D versions are extracted to C:\l3d\<site> with git archive) then `encode_loop2.py`.
