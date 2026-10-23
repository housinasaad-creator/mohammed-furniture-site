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

## Hero: four-stop video (2026-10-23)
The hero is rendered offline (60 fps) from the live 3D scene and shipped as eight short H.264 clips per device class in `assets/hero/desktop|phone/` (`f0..f3` play forward from one stop to the next, `r0..r3` are the same frames in reverse order, so going back is a clip played forward, never reverse playback or seeking). `js/hero-video.js` plays them on one canvas in exactly four scroll gestures: each wheel notch / swipe / arrow key / dot plays the next clip by itself and stops on its last frame; a gesture in the same direction mid-clip speeds it up and chains, the opposite direction continues from the same frame in the mirrored clip. Clips are loaded as blobs (forward ones in the background, the reverse one when a stop is reached), at most three video elements exist at a time, and everything is released from memory when the hero is far away. The live 3D scene stays in the files and the earlier live-3D versions of the changed files are in `_live3d_version/`; `?live3d` or a video failure falls back to the live hero. Re-render with `_hero_video_tools/capture.py` + `encode_site_clips.py`.
