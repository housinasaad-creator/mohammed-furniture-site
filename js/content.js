/*
  كل نصوص الموقع (إنجليزي + عربي). المحتوى مفترض للتجربة: علامة وهمية، والدفع تجريبي بالكامل.
  الاتجاه ثابت LTR في اللغتين: الصفحة لا تنقلب، والعربي يُحاذى لليسار.
*/
window.CONTENT = {
  en: {
    lang: 'en',
    title: 'MOHAMMED · Mobilia (concept)',
    brand: 'MOHAMMED',
    nav: { home: 'Home', collection: 'Collection', craft: 'Craft', voices: 'Voices' },
    langBtn: 'العربية',
    soundOn: 'Sound on', soundOff: 'Sound off',
    loader: 'Lighting the atelier',
    scrollCue: 'Scroll — a day begins',
    soundTip: 'Turn the sound on: birds by day, crickets by night',
    chapters: [
      { k: '05:45 · Dawn', t: 'MOHAMMED', s: 'Furniture that lives with the light. Scroll: a whole day passes inside the arches.' },
      { k: '08:35 · Morning', t: 'Soft light, softer curves.', s: 'The Arc sofa wraps the room in bouclé. Watch the room build itself, piece by piece.' },
      { k: '13:00 · Noon', t: 'A table long enough for everyone.', s: 'Walnut and marble on arched legs: the same arch as our mark.' },
      { k: '17:55 · Golden hour', t: 'Let the evening in.', s: 'The low sun stretches through the windows. One by one, the lamps wake up.' },
      { k: '22:20 · Night', t: 'The house exhales.', s: 'A bed under an arch, two lamps, a window of stars. Now make it yours.', cta: 'Shop the collection' }
    ],
    dots: ['Dawn', 'Morning', 'Noon', 'Golden hour', 'Night'],
    shop: {
      k: 'THE COLLECTION', t: 'Touch it. Rebuild it. Light it.',
      s: 'Every piece is live in 3D. Change the wood, the fabric, the size. Take it apart. Move the sun.',
      cur: { drag: 'Drag', rotate: 'Rotate', select: 'Select' },
      tools: { style: 'Style', light: 'Light', anatomy: 'Anatomy', dims: 'Size' },
      styleTip: 'One tap re-dresses the whole home.', lightTip: 'Drag the sun.', anatomyTip: 'Take it apart', dimsTip: 'Show measurements',
      day: 'Day', night: 'Night',
      qty: 'Qty', add: 'Add to bag', added: 'Added to bag', ship: 'Free delivery over $4,000 · made to order in 4–6 weeks',
      options: {
        seats: 'Size', size: 'Size', length: 'Length', top: 'Top', fabric: 'Fabric', wood: 'Wood', stone: 'Stone',
        legs: 'Legs', base: 'Base', marble: 'Marble', frame: 'Frame', headboard: 'Headboard',
        fmt: { seats: (v) => `${v} seats`, orbe: (v) => (v === 2 ? 'Ø 110 cm' : 'Ø 90 cm'), len: (v) => `${v} m`, top: (v) => (v === 'stone' ? 'Marble' : 'Wood'), bed: (v) => `${Math.round(v * 100)} × 200` }
      },
      anatomyTitle: 'Anatomy', dimsLabel: ['Width', 'Depth', 'Height'],
      parts: { legs: 'Solid legs', frame: 'Beech frame', springs: 'Upholstered base', foam: 'Foam cores', cushions: 'Seat cushions', back: 'Back', pillows: 'Pillows', shell: 'Shell', top: 'Top slab', base: 'Fluted base', ring: 'Brass rings', beam: 'Stretcher', brass: 'Brass feet', inlay: 'Brass marks', seat: 'Seat', headboard: 'Channel headboard', mattress: 'Mattress', bedding: 'Bedding', bench: 'Bench' }
    },
    cart: {
      title: 'Your bag', empty: 'Your bag is empty', emptySub: 'Choose a piece from the collection.', browse: 'Browse the collection',
      subtotal: 'Subtotal', shipping: 'Delivery', free: 'Free', discount: 'Discount', total: 'Total', checkout: 'Checkout', remove: 'Remove',
      promo: 'Promo code', apply: 'Apply', promoOk: 'ARCH10 applied: 10% off', promoBad: 'Code not valid. Try ARCH10.', taxes: 'Taxes included', freeAt: 'Free delivery over $4,000',
      close: 'Close', more: 'more to free delivery'
    },
    checkout: {
      title: 'Checkout', steps: ['Details', 'Payment', 'Done'],
      demo: 'Demo checkout · no payment is taken and nothing is sent anywhere.',
      contact: 'Contact', delivery: 'Delivery', email: 'Email', name: 'Full name', phone: 'Phone', address: 'Address', city: 'City', zip: 'Postal code', country: 'Country', gift: 'Note for the atelier (optional)',
      fillDemo: 'Fill demo details', toPay: 'Continue to payment', back: 'Back',
      payTitle: 'Payment', cardNo: 'Card number', holder: 'Name on card', expiry: 'Expiry (MM/YY)', cvc: 'CVC', testHint: 'Use the test card 4242 4242 4242 4242 with any future date and any CVC.', useTest: 'Use test card',
      pay: 'Pay', secure: 'Encrypted demo form · nothing leaves your browser',
      badCard: 'Demo mode accepts test cards only. Try 4242 4242 4242 4242.', badExp: 'Use a future date', badCvc: 'Check the code', req: 'Required', badEmail: 'Check the email',
      processing: 'Sending your order to the workshop…', thanks: 'Thank you', thanksSub: 'Your pieces are in the workshop queue. We will build them the slow way.', orderNo: 'Order', eta: 'Estimated delivery', again: 'Keep exploring', summary: 'Order summary',
      concept: 'This is a concept store: no real order was placed.',
      countries: ['Germany', 'France', 'Netherlands', 'Turkey', 'United Arab Emirates', 'Saudi Arabia', 'United Kingdom', 'United States']
    },
    craft: {
      k: 'THE CRAFT', t: 'Built like architecture.', s: 'Every arch starts as a drawing and ends as a joint you can feel with your hand.',
      steps: [
        { n: '01', t: 'Choose the timber', d: 'Walnut, oak and ash dried for a full year so the board stays honest in every season.' },
        { n: '02', t: 'Cut the arch', d: 'One template, one hand-guided cut. The same arch repeats in the legs, the headboard and the windows.' },
        { n: '03', t: 'Upholster by hand', d: 'Foam, down and bouclé layered by hand, then stitched with seams that follow the curve.' },
        { n: '04', t: 'Test it in the light', d: 'Every piece is checked at dawn, noon and night: grain, shadow and glow.' }
      ]
    },
    voices: {
      k: 'VOICES', t: 'Lived in, not staged.', s: 'Swipe the swatch cards. Each one remembers a home.',
      items: [
        { q: 'The sofa curves around our living room like it was drawn for it.', a: 'Nour A. · Dubai' },
        { q: 'We eat at the arched table every night. The light at six is unreal.', a: 'Karim S. · Istanbul' },
        { q: 'The headboard looks different every hour. I keep taking photos.', a: 'Lina M. · Berlin' },
        { q: 'Delivered in five weeks and exactly the walnut I picked on screen.', a: 'Omar H. · Gaziantep' }
      ]
    },
    makers: {
      k: 'FOR FURNITURE MAKERS', t: 'Your catalogue, alive in 3D.',
      s: 'This whole store is code: no photo shoots, no renders. Every wood, fabric and size is a live option, on phone and desktop.',
      pts: [
        { t: 'Every combination, instantly', d: 'Customers see their exact wood, fabric and size in 3D, without you shooting hundreds of photos.' },
        { t: 'Rooms, not just products', d: 'Living rooms, dining rooms and bedrooms shown the way you sell them: as complete sets.' },
        { t: 'Built around your brand', d: 'Your logo, your palette, your catalogue and prices. Ready to open on any phone.' }
      ],
      cta: 'Talk about your catalogue'
    },
    contact: { k: 'VISIT THE ATELIER', t: 'Be first to the next collection.', s: 'One email when a new piece is finished. Nothing else.', ph: 'Your email', btn: 'Notify me', thanks: 'Thank you. This is a concept demo, nothing was sent.' },
    footer: { made: 'Designed & developed by Muhammed Elhuseyin', concept: 'Concept project: fictional brand, products and reviews. The 3D models are generated in code, and the checkout is a demo where no payment is taken.', rights: '© 2026 Mohammed Mobilia (concept)' },
    products: {
      sofa: { name: 'Arc', tag: 'Sofa · Living', d: 'A curved bouclé sofa drawn in a single gesture. Beech frame, layered foam, down-wrapped cushions.' },
      chair: { name: 'Lune', tag: 'Armchair · Living', d: 'A barrel armchair that holds you like a half moon. Swivel-ready, wrapped in one continuous shell.' },
      coffee: { name: 'Orbe', tag: 'Coffee tables · Living', d: 'Two nesting tables: a stone slab floating on a fluted wood drum with brass rings.' },
      table: { name: 'Atelier', tag: 'Dining table · Dining', d: 'Two solid arches carry the top, the same arch as our mark, joined by a slim stretcher.' },
      dchair: { name: 'Courbe', tag: 'Dining chair · Dining', d: 'A curved back that hugs you, bent rear legs and brass feet. Sold per chair.' },
      bed: { name: 'Nuit', tag: 'Bed · Bedroom', d: 'An arched, channel-tufted headboard on a floating base. Comes with a matching bench.' }
    }
  },

  ar: {
    lang: 'ar',
    title: 'موبيليا محمد · MOHAMMED (مشروع تصميمي)',
    brand: 'موبيليا محمد',
    nav: { home: 'الرئيسية', collection: 'المجموعة', craft: 'الصنعة', voices: 'آراء' },
    langBtn: 'English',
    soundOn: 'الصوت يعمل', soundOff: 'الصوت متوقف',
    loader: 'نُشعل أضواء المشغل',
    scrollCue: 'مرّر: يبدأ يوم كامل',
    soundTip: 'شغّل الصوت: عصافير نهاراً وصراصير ليلاً',
    chapters: [
      { k: '٠٥:٤٥ · الفجر', t: 'موبيليا محمد', s: 'أثاث يعيش مع الضوء. مرّر لتمرّ ساعات يوم كامل داخل الأقواس.' },
      { k: '٠٨:٣٥ · الصباح', t: 'ضوء ناعم، وخطوط أنعم.', s: 'أريكة «قوس» تلفّ الغرفة بقماش البوكليه. شاهد الغرفة وهي تبني نفسها قطعة قطعة.' },
      { k: '١٣:٠٠ · الظهيرة', t: 'طاولة تتّسع للجميع.', s: 'جوز ورخام على أرجل مقوّسة: القوس نفسه في شعارنا.' },
      { k: '١٧:٥٥ · الغروب الذهبي', t: 'دع المساء يدخل.', s: 'الشمس المنخفضة تمتدّ عبر النوافذ، والمصابيح تستيقظ واحداً بعد الآخر.' },
      { k: '٢٢:٢٠ · الليل', t: 'البيت يتنفّس.', s: 'سرير تحت قوس ومصباحان ونافذة من النجوم. الآن اجعله بيتك.', cta: 'تسوّق المجموعة' }
    ],
    dots: ['الفجر', 'الصباح', 'الظهيرة', 'الغروب', 'الليل'],
    shop: {
      k: 'المجموعة', t: 'المسها. أعد بناءها. أضئها.',
      s: 'كل قطعة حيّة بالثلاثي الأبعاد. بدّل الخشب والقماش والمقاس، فكّكها، وحرّك الشمس.',
      cur: { drag: 'اسحب', rotate: 'أدِر', select: 'اختر' },
      tools: { style: 'النمط', light: 'الضوء', anatomy: 'التفكيك', dims: 'الأبعاد' },
      styleTip: 'لمسة واحدة تُلبس البيت كله ثوباً جديداً.', lightTip: 'اسحب الشمس.', anatomyTip: 'فكّك القطعة', dimsTip: 'أظهر المقاسات',
      day: 'نهار', night: 'ليل',
      qty: 'الكمية', add: 'أضف للحقيبة', added: 'أُضيف للحقيبة', ship: 'توصيل مجاني فوق ٤٬٠٠٠$ · يُصنع عند الطلب خلال ٤–٦ أسابيع',
      options: {
        seats: 'المقاس', size: 'المقاس', length: 'الطول', top: 'السطح', fabric: 'القماش', wood: 'الخشب', stone: 'الحجر',
        legs: 'الأرجل', base: 'القاعدة', marble: 'الرخام', frame: 'الهيكل', headboard: 'ظهر السرير',
        fmt: { seats: (v) => `${v} مقاعد`, orbe: (v) => (v === 2 ? 'قطر ١١٠ سم' : 'قطر ٩٠ سم'), len: (v) => `${v} م`, top: (v) => (v === 'stone' ? 'رخام' : 'خشب'), bed: (v) => `${Math.round(v * 100)} × ٢٠٠` }
      },
      anatomyTitle: 'التفكيك', dimsLabel: ['العرض', 'العمق', 'الارتفاع'],
      parts: { legs: 'أرجل صلبة', frame: 'هيكل زان', springs: 'قاعدة منجّدة', foam: 'نوى إسفنج', cushions: 'وسائد المقعد', back: 'الظهر', pillows: 'مخدّات', shell: 'الهيكل الخارجي', top: 'سطح الحجر', base: 'قاعدة مخدّدة', ring: 'حلقات نحاسية', beam: 'عارضة', brass: 'أقدام نحاسية', inlay: 'علامات نحاسية', seat: 'المقعد', headboard: 'ظهر مخدّد', mattress: 'المرتبة', bedding: 'الفراش', bench: 'المقعد' }
    },
    cart: {
      title: 'حقيبتك', empty: 'حقيبتك فارغة', emptySub: 'اختر قطعة من المجموعة.', browse: 'تصفّح المجموعة',
      subtotal: 'المجموع الفرعي', shipping: 'التوصيل', free: 'مجاني', discount: 'الخصم', total: 'الإجمالي', checkout: 'إتمام الشراء', remove: 'إزالة',
      promo: 'رمز الخصم', apply: 'تطبيق', promoOk: 'تم تطبيق ARCH10: خصم ١٠٪', promoBad: 'الرمز غير صالح. جرّب ARCH10.', taxes: 'الضرائب مشمولة', freeAt: 'توصيل مجاني فوق ٤٬٠٠٠$',
      close: 'إغلاق', more: 'للحصول على التوصيل المجاني'
    },
    checkout: {
      title: 'إتمام الشراء', steps: ['البيانات', 'الدفع', 'تم'],
      demo: 'دفع تجريبي · لا يُسحب أي مبلغ ولا يُرسل شيء لأي مكان.',
      contact: 'التواصل', delivery: 'التوصيل', email: 'البريد الإلكتروني', name: 'الاسم الكامل', phone: 'الهاتف', address: 'العنوان', city: 'المدينة', zip: 'الرمز البريدي', country: 'الدولة', gift: 'ملاحظة للمشغل (اختياري)',
      fillDemo: 'املأ بيانات تجريبية', toPay: 'المتابعة للدفع', back: 'رجوع',
      payTitle: 'الدفع', cardNo: 'رقم البطاقة', holder: 'الاسم على البطاقة', expiry: 'الانتهاء (شهر/سنة)', cvc: 'رمز الأمان', testHint: 'استخدم بطاقة الاختبار 4242 4242 4242 4242 مع أي تاريخ قادم وأي رمز.', useTest: 'استخدم بطاقة الاختبار',
      pay: 'ادفع', secure: 'نموذج تجريبي مشفّر · لا شيء يغادر متصفحك',
      badCard: 'الوضع التجريبي يقبل بطاقات الاختبار فقط. جرّب 4242 4242 4242 4242.', badExp: 'استخدم تاريخاً قادماً', badCvc: 'تحقق من الرمز', req: 'مطلوب', badEmail: 'تحقق من البريد',
      processing: 'نرسل طلبك إلى الورشة…', thanks: 'شكراً لك', thanksSub: 'قطعك في طابور الورشة. سنبنيها بالطريقة البطيئة.', orderNo: 'الطلب', eta: 'موعد التوصيل المتوقع', again: 'تابع الاستكشاف', summary: 'ملخّص الطلب',
      concept: 'هذا متجر تجريبي: لم يتم تقديم أي طلب حقيقي.',
      countries: ['ألمانيا', 'فرنسا', 'هولندا', 'تركيا', 'الإمارات', 'السعودية', 'بريطانيا', 'أمريكا']
    },
    craft: {
      k: 'الصنعة', t: 'تُبنى كما تُبنى العمارة.', s: 'كل قوس يبدأ رسماً وينتهي وصلة تحسّها بيدك.',
      steps: [
        { n: '٠١', t: 'اختيار الخشب', d: 'جوز وسنديان وزان يُجفَّف سنة كاملة كي يبقى اللوح صادقاً في كل فصل.' },
        { n: '٠٢', t: 'قصّ القوس', d: 'قالب واحد وقطعة موجَّهة باليد. القوس نفسه يتكرر في الأرجل والظهر والنوافذ.' },
        { n: '٠٣', t: 'تنجيد يدوي', d: 'إسفنج وريش وبوكليه بطبقات باليد، ثم خياطة بدروز تتبع المنحنى.' },
        { n: '٠٤', t: 'اختبار بالضوء', d: 'كل قطعة تُفحص عند الفجر والظهر والليل: العرق والظل والتوهج.' }
      ]
    },
    voices: {
      k: 'آراء', t: 'يُسكن فيه، لا يُعرَض فقط.', s: 'اسحب بطاقات العيّنات. كل واحدة تذكر بيتاً.',
      items: [
        { q: 'الأريكة تلتفّ حول صالوننا كأنها رُسمت له.', a: 'نور ع. · دبي' },
        { q: 'نأكل على الطاولة المقوّسة كل ليلة. ضوء السادسة لا يُصدَّق.', a: 'كريم س. · إسطنبول' },
        { q: 'ظهر السرير يبدو مختلفاً كل ساعة. أظل ألتقط الصور.', a: 'لينا م. · برلين' },
        { q: 'وصلتني بعد خمسة أسابيع، وهي الجوز نفسه الذي اخترته على الشاشة.', a: 'عمر ح. · غازي عنتاب' }
      ]
    },
    makers: {
      k: 'لأصحاب مصانع الأثاث', t: 'كتالوجكم ينبض بالحياة بالثلاثي الأبعاد.',
      s: 'هذا المتجر كله كود: لا جلسات تصوير ولا رندر. كل خشب وقماش ومقاس خيار حيّ، على الهاتف والكمبيوتر.',
      pts: [
        { t: 'كل تركيبة فوراً', d: 'يرى الزبون خشبه وقماشه ومقاسه بالضبط بالثلاثي الأبعاد، دون أن تصوّروا مئات الصور.' },
        { t: 'غرف لا قطع فقط', d: 'صالونات وغرف سفرة وغرف نوم تُعرض كما تبيعونها: أطقماً كاملة.' },
        { t: 'مفصّل على علامتكم', d: 'شعاركم وألوانكم وكتالوجكم وأسعاركم. جاهز للفتح على أي هاتف.' }
      ],
      cta: 'لنتحدث عن كتالوجكم'
    },
    contact: { k: 'زُر المشغل', t: 'كن أول من يرى المجموعة القادمة.', s: 'رسالة واحدة عند انتهاء قطعة جديدة. لا شيء غير ذلك.', ph: 'بريدك الإلكتروني', btn: 'أعلمني', thanks: 'شكراً لك. هذا عرض تجريبي ولم يُرسل شيء.' },
    footer: { made: 'تصميم وتطوير محمد الحسين (Muhammed Elhuseyin)', concept: 'مشروع تصميمي: علامة ومنتجات وآراء وهمية. النماذج ثلاثية الأبعاد مولّدة بالكود، والدفع تجريبي ولا يُسحب أي مبلغ.', rights: '© 2026 موبيليا محمد (مشروع تصميمي)' },
    products: {
      sofa: { name: 'قوس', tag: 'كنبة · الصالون', d: 'كنبة بوكليه منحنية رُسمت بحركة واحدة. هيكل زان وإسفنج بطبقات ووسائد محشوّة بالريش.' },
      chair: { name: 'هلال', tag: 'كرسي · الصالون', d: 'كرسي برميلي يحتضنك كنصف قمر. غلاف واحد متّصل، جاهز للدوران.' },
      coffee: { name: 'فلك', tag: 'طاولتا قهوة · الصالون', d: 'طاولتان متداخلتان: لوح حجر يطفو فوق أسطوانة خشب مخدّدة بحلقات نحاسية.' },
      table: { name: 'مَشغل', tag: 'طاولة سفرة · السفرة', d: 'قوسان صلبان يحملان السطح، القوس نفسه في شعارنا، تربطهما عارضة نحيلة.' },
      dchair: { name: 'انحناءة', tag: 'كرسي سفرة · السفرة', d: 'ظهر منحنٍ يحتضنك وأرجل خلفية مثنية وأقدام نحاسية. تُباع بالقطعة.' },
      bed: { name: 'ليل', tag: 'سرير · غرفة النوم', d: 'ظهر مقوّس مخدّد على قاعدة عائمة، ومعه مقعد مطابق.' }
    }
  },

  tr: {
    lang: 'tr',
    title: 'MOHAMMED · Mobilia (konsept)',
    brand: 'MOHAMMED',
    nav: { home: 'Ana sayfa', collection: 'Koleksiyon', craft: 'Zanaat', voices: 'Yorumlar' },
    langBtn: 'TR',
    soundOn: 'Ses açık', soundOff: 'Ses kapalı',
    loader: 'Atölyenin ışıkları yanıyor',
    scrollCue: 'Kaydır: bir gün başlıyor',
    soundTip: 'Sesi aç: gündüz kuşlar, gece cırcır böcekleri',
    chapters: [
      { k: '05:45 · Şafak', t: 'MOHAMMED', s: 'Işıkla yaşayan mobilya. Kaydır: kemerlerin içinde koca bir gün geçiyor.' },
      { k: '08:35 · Sabah', t: 'Yumuşak ışık, daha yumuşak kıvrımlar.', s: 'Arc koltuk odayı bukle kumaşla sarıyor. Odanın parça parça kendini kurmasını izle.' },
      { k: '13:00 · Öğle', t: 'Herkese yetecek kadar uzun bir masa.', s: 'Kemerli ayaklar üzerinde ceviz ve mermer: logomuzdaki aynı kemer.' },
      { k: '17:55 · Altın saat', t: 'Akşamı içeri al.', s: 'Alçalan güneş pencerelerden uzanıyor. Lambalar tek tek uyanıyor.' },
      { k: '22:20 · Gece', t: 'Ev nefes veriyor.', s: 'Kemer altında bir yatak, iki abajur, yıldızlı bir pencere. Şimdi onu kendine göre yap.', cta: 'Koleksiyonu keşfet' }
    ],
    dots: ['Şafak', 'Sabah', 'Öğle', 'Altın saat', 'Gece'],
    shop: {
      k: 'KOLEKSİYON', t: 'Dokun. Yeniden kur. Aydınlat.',
      s: 'Her parça 3D ve canlı. Ahşabı, kumaşı, ölçüyü değiştir. Parçalarına ayır. Güneşi oynat.',
      cur: { drag: 'Sürükle', rotate: 'Döndür', select: 'Seç' },
      tools: { style: 'Stil', light: 'Işık', anatomy: 'Parçala', dims: 'Ölçü' },
      styleTip: 'Tek dokunuşla tüm evi yeniden giydir.', lightTip: 'Güneşi sürükle.', anatomyTip: 'Parçalarına ayır', dimsTip: 'Ölçüleri göster',
      day: 'Gündüz', night: 'Gece',
      qty: 'Adet', add: 'Sepete ekle', added: 'Sepete eklendi', ship: '4.000$ üzeri ücretsiz teslimat · siparişe özel, 4–6 haftada',
      options: {
        seats: 'Boyut', size: 'Boyut', length: 'Uzunluk', top: 'Tabla', fabric: 'Kumaş', wood: 'Ahşap', stone: 'Taş',
        legs: 'Ayaklar', base: 'Gövde', marble: 'Mermer', frame: 'İskelet', headboard: 'Başlık',
        fmt: { seats: (v) => `${v} kişilik`, orbe: (v) => (v === 2 ? 'Ø 110 cm' : 'Ø 90 cm'), len: (v) => `${v} m`, top: (v) => (v === 'stone' ? 'Mermer' : 'Ahşap'), bed: (v) => `${Math.round(v * 100)} × 200` }
      },
      anatomyTitle: 'Parçalar', dimsLabel: ['Genişlik', 'Derinlik', 'Yükseklik'],
      parts: { legs: 'Masif ayaklar', frame: 'Kayın iskelet', springs: 'Döşemeli taban', foam: 'Sünger çekirdekler', cushions: 'Oturma minderleri', back: 'Sırt', pillows: 'Yastıklar', shell: 'Dış kabuk', top: 'Taş tabla', base: 'Oluklu gövde', ring: 'Pirinç halkalar', beam: 'Bağlantı çıtası', brass: 'Pirinç ayaklar', inlay: 'Pirinç işaretler', seat: 'Oturak', headboard: 'Kanallı başlık', mattress: 'Yatak', bedding: 'Yatak takımı', bench: 'Bank' }
    },
    cart: {
      title: 'Sepetiniz', empty: 'Sepetiniz boş', emptySub: 'Koleksiyondan bir parça seçin.', browse: 'Koleksiyona göz at',
      subtotal: 'Ara toplam', shipping: 'Teslimat', free: 'Ücretsiz', discount: 'İndirim', total: 'Toplam', checkout: 'Ödemeye geç', remove: 'Kaldır',
      promo: 'İndirim kodu', apply: 'Uygula', promoOk: 'ARCH10 uygulandı: %10 indirim', promoBad: 'Kod geçersiz. ARCH10 deneyin.', taxes: 'Vergiler dahil', freeAt: '4.000$ üzeri ücretsiz teslimat',
      close: 'Kapat', more: 'ücretsiz teslimata kaldı'
    },
    checkout: {
      title: 'Ödeme', steps: ['Bilgiler', 'Ödeme', 'Tamam'],
      demo: 'Demo ödeme · hiçbir ücret alınmaz, hiçbir yere veri gönderilmez.',
      contact: 'İletişim', delivery: 'Teslimat', email: 'E-posta', name: 'Ad soyad', phone: 'Telefon', address: 'Adres', city: 'Şehir', zip: 'Posta kodu', country: 'Ülke', gift: 'Atölye için not (isteğe bağlı)',
      fillDemo: 'Demo bilgileri doldur', toPay: 'Ödemeye devam et', back: 'Geri',
      payTitle: 'Ödeme', cardNo: 'Kart numarası', holder: 'Kart üzerindeki ad', expiry: 'Son kullanma (AA/YY)', cvc: 'CVC', testHint: 'Test kartı 4242 4242 4242 4242, gelecekte herhangi bir tarih ve herhangi bir CVC kullanın.', useTest: 'Test kartını kullan',
      pay: 'Öde', secure: 'Şifreli demo form · hiçbir şey tarayıcınızdan çıkmaz',
      badCard: 'Demo modu yalnızca test kartlarını kabul eder. 4242 4242 4242 4242 deneyin.', badExp: 'Gelecek bir tarih girin', badCvc: 'Kodu kontrol edin', req: 'Zorunlu', badEmail: 'E-postayı kontrol edin',
      processing: 'Siparişiniz atölyeye gönderiliyor…', thanks: 'Teşekkürler', thanksSub: 'Parçalarınız atölye sırasında. Onları yavaş yavaş, ustalıkla kuracağız.', orderNo: 'Sipariş', eta: 'Tahmini teslimat', again: 'Keşfetmeye devam et', summary: 'Sipariş özeti',
      concept: 'Bu bir konsept mağazadır: gerçek sipariş verilmedi.',
      countries: ['Almanya', 'Fransa', 'Hollanda', 'Türkiye', 'Birleşik Arap Emirlikleri', 'Suudi Arabistan', 'Birleşik Krallık', 'Amerika Birleşik Devletleri']
    },
    craft: {
      k: 'ZANAAT', t: 'Mimari gibi inşa edilir.', s: 'Her kemer bir çizim olarak başlar, elinizle hissedebileceğiniz bir geçmeyle biter.',
      steps: [
        { n: '01', t: 'Keresteyi seç', d: 'Ceviz, meşe ve dişbudak tam bir yıl kurutulur; tahta her mevsimde dürüst kalır.' },
        { n: '02', t: 'Kemeri kes', d: 'Tek şablon, elle yönlendirilen tek kesim. Aynı kemer ayaklarda, başlıkta ve pencerelerde tekrar eder.' },
        { n: '03', t: 'Elde döşe', d: 'Sünger, tüy ve bukle katman katman elle döşenir, kıvrımı izleyen dikişlerle bitirilir.' },
        { n: '04', t: 'Işıkta test et', d: 'Her parça şafakta, öğlen ve gecede kontrol edilir: damar, gölge ve parıltı.' }
      ]
    },
    voices: {
      k: 'YORUMLAR', t: 'Yaşanan bir ev, sahne değil.', s: 'Kumaş örnek kartlarını kaydır. Her biri bir evi hatırlıyor.',
      items: [
        { q: 'Koltuk, oturma odamızı sanki ona göre çizilmiş gibi sarıyor.', a: 'Nour A. · Dubai' },
        { q: 'Her akşam kemerli masada yemek yiyoruz. Altıdaki ışık inanılmaz.', a: 'Karim S. · İstanbul' },
        { q: 'Yatak başlığı her saat başka görünüyor. Sürekli fotoğraf çekiyorum.', a: 'Lina M. · Berlin' },
        { q: 'Beş haftada geldi ve ekranda seçtiğim cevizin aynısı.', a: 'Omar H. · Gaziantep' }
      ]
    },
    makers: {
      k: 'MOBİLYA ÜRETİCİLERİ İÇİN', t: 'Kataloğunuz 3D’de canlansın.',
      s: 'Bu mağazanın tamamı koddan ibaret: fotoğraf çekimi yok, render yok. Her ahşap, kumaş ve ölçü canlı bir seçenek; telefonda ve bilgisayarda.',
      pts: [
        { t: 'Her kombinasyon anında', d: 'Müşteri seçtiği ahşap, kumaş ve ölçüyü 3D görür; siz yüzlerce fotoğraf çekmek zorunda kalmazsınız.' },
        { t: 'Ürün değil, oda', d: 'Oturma odası, yemek odası ve yatak odası: takımlarınızı sattığınız gibi gösterin.' },
        { t: 'Markanıza göre', d: 'Logonuz, renkleriniz, kataloğunuz ve fiyatlarınız. Her telefonda açılmaya hazır.' }
      ],
      cta: 'Kataloğunuzu konuşalım'
    },
    contact: { k: 'ATÖLYEYİ ZİYARET ET', t: 'Yeni koleksiyonu ilk sen gör.', s: 'Yeni bir parça bittiğinde tek e-posta. Başka hiçbir şey.', ph: 'E-postanız', btn: 'Haber ver', thanks: 'Teşekkürler. Bu bir konsept demodur, hiçbir şey gönderilmedi.' },
    footer: { made: 'Tasarım ve geliştirme: Muhammed Elhuseyin', concept: 'Konsept proje: kurgusal marka, ürünler ve yorumlar. 3D modeller kodla üretilmiştir; ödeme demodur ve hiçbir ücret alınmaz.', rights: '© 2026 Mohammed Mobilia (konsept)' },
    products: {
      sofa: { name: 'Arc', tag: 'Koltuk · Oturma odası', d: 'Tek hamlede çizilmiş kıvrımlı bukle koltuk. Kayın iskelet, katmanlı sünger, tüy dolgulu minderler.' },
      chair: { name: 'Lune', tag: 'Berjer · Oturma odası', d: 'Sizi yarım ay gibi saran fıçı berjer. Tek parça kesintisiz kabuk, dönmeye hazır.' },
      coffee: { name: 'Orbe', tag: 'Orta sehpalar · Oturma odası', d: 'İç içe iki sehpa: pirinç halkalı oluklu ahşap gövdenin üstünde süzülen taş tabla.' },
      table: { name: 'Atelier', tag: 'Yemek masası · Yemek odası', d: 'İki masif kemer tablayı taşır; logomuzdaki aynı kemer, ince bir çıta ile birleşir.' },
      dchair: { name: 'Courbe', tag: 'Sandalye · Yemek odası', d: 'Sizi saran kıvrımlı sırt, bükümlü arka ayaklar ve pirinç tabanlar. Tane tane satılır.' },
      bed: { name: 'Nuit', tag: 'Yatak · Yatak odası', d: 'Yüzen bir taban üzerinde kemerli, kanallı başlık. Eşleşen bankla birlikte gelir.' }
    }
  }
};

/* رابط التواصل (واتساب/لينكدإن/بريد) للزر في قسم أصحاب المصانع: اتركه فارغاً فيبقى الزر مخفياً */
window.CONTACT_URL = '';
