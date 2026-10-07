import { Config } from '@/payload-types'

export type Language = Config['locale']

type Translations = Record<string, Partial<Record<Language, string>>>

const _translation: Record<string, Partial<Record<Language, string>>> = {
  'IFLY WAIVER OF LIABILITY': {
    en: 'IFLY WAIVER OF LIABILITY',
    ar: 'التنازل عن المسؤولية',
  },
  'LASER OASIS WAIVER OF LIABILITY': {
    en: 'LASER OASIS WAIVER OF LIABILITY',
    ar: 'LASER OASIS WAIVER OF LIABILITY AR',
  },
  Checklist: {
    en: 'Checklist',
    ar: 'قائمة تدقيق',
  },
  Notes: {
    en: 'Notes',
    ar: 'ملحوظات',
  },
  'Terms and Conditions': {
    en: 'Terms and Conditions',
    ar: 'الأحكام والشروط',
  },
  'YOUR INFORMATION': {
    en: 'YOUR INFORMATION',
    ar: 'معلوماتك',
  },
  'DEPENDENTS / CHILDREN': {
    en: 'DEPENDENTS / CHILDREN',
    ar: 'المُعالون / الأطفال',
  },
  'Remove Dependents / Child': {
    en: 'Remove Dependents / Child',
    ar: 'إزالة المعالين / الطفل',
  },
  'Add Dependents / Child': {
    en: 'Add Dependents / Child',
    ar: 'إضافة المُعالين / الطفل',
  },
  Signature: {
    en: 'Signature',
    ar: 'إمضاء',
  },
  'Clear Signature': {
    en: 'Clear Signature',
    ar: 'مسح التوقيع',
  },
  Name: {
    en: 'Name',
    ar: 'اسم',
  },
  'Participant of parent/guardian': {
    en: 'Participant of parent/guardian',
    ar: 'مشارك من الوالدين / الوصي',
  },
  "Child's Name": {
    en: "Child's Name",
    ar: 'اسم الطفل',
  },
  'QID/Passport#': {
    en: 'QID/Passport#',
    ar: 'البطاقة الشخصية / جواز السفر#',
  },
  'Your residence permit ID or passport number.': {
    en: 'Your residence permit ID or passport number.',
    ar: 'رقم تصريح الإقامة أو رقم جواز السفر.',
  },
  "Child's residence permit ID or passport number.": {
    en: "Child's residence permit ID or passport number.",
    ar: 'بطاقة هوية إقامة الطفل أو رقم جواز السفر.',
  },
  Phone: {
    en: 'Phone',
    ar: 'هاتف',
  },
  'ex. 0097411222211, 97411222211 or 11223344': {
    en: 'ex. 0097411222211, 97411222211 or 11223344',
    ar: 'السابق. 0097411222211 أو 97411222211 أو 11223344',
  },
  'By submitting this form means you comply and understand above listed checklist, terms and conditions':
    {
      en: 'By submitting this form means you comply and understand above listed checklist, terms and conditions',
      ar: 'من خلال تقديم هذا النموذج يعني أنك تلتزم وتفهم قائمة المراجعة والشروط والأحكام المذكورة أعلاه',
    },
  Submit: {
    en: 'Submit',
    ar: 'إرسال',
  },
  'Submitting...': {
    en: 'Submitting...',
    ar: 'تقديم...',
  },
  'Thank you! Your Form ID is:': {
    en: 'Thank you! Your Form ID is:',
    ar: 'شكرًا لك! معرف النموذج الخاص بك هو:',
  },
  'iFly Waiver form has been submitted': {
    en: 'iFly Waiver form has been submitted',
    ar: 'تم تقديم نموذج التنازل عن iFly',
  },
  'Laser Oasis Waiver form has been submitted': {
    en: 'Laser Oasis Waiver form has been submitted',
    ar: 'Laser Oasis Waiver form has been submitted AR',
  },
  'Submit new waiver form': {
    en: 'Submit new waiver form',
    ar: 'تقديم نموذج تنازل جديد',
  },
  'Any comments or feedback?': {
    en: 'Any comments or feedback?',
    ar: 'أي تعليقات أو تعليقات؟',
    fr: 'Any comments or feedback?',
  },
  'Survey F&B': {
    en: 'Survey F&B',
    ar: 'استبيان تقييم المطعم',
  },
  'Your Voice, Our Improvement': {
    en: 'Your Voice, Our Improvement',
    ar: 'صوتك، تطورنا',
  },
  'Share your dining experience to help us serve you better!': {
    en: 'Share your dining experience to help us serve you better!',
    ar: 'شارك تجربتك لمساعدتنا في خدمتك بشكل أفضل!',
  },
  'Meal Period': {
    en: 'Meal Period',
    ar: 'فترة الوجبة',
  },
  Breakfast: {
    en: 'Breakfast',
    ar: 'فطور الصباح',
  },
  Lunch: {
    en: 'Lunch',
    ar: 'الغداء',
  },
  Dinner: {
    en: 'Dinner',
    ar: 'العشاء',
  },
  'How often do you visit our restaurant?': {
    en: 'How often do you visit our restaurant?',
    ar: 'كم مرة تزور مطعمنا؟',
  },
  Daily: {
    en: 'Daily',
    ar: 'يوميًا',
  },
  Weekly: {
    en: 'Weekly',
    ar: 'أسبوعيًا',
  },
  Monthly: {
    en: 'Monthly',
    ar: 'شهريًا',
  },
  'First Time': {
    en: 'First Time',
    ar: 'أول مرة',
  },
  'How would you rate your dining experience?': {
    en: 'How would you rate your dining experience?',
    ar: 'كيف تقيم تجربتك ؟',
  },
  Greeting: {
    en: 'Greeting',
    ar: 'الترحيب',
  },
  Service: {
    en: 'Service',
    ar: 'الخدمة',
  },
  Food: {
    en: 'Food',
    ar: 'الأكل',
  },
  Beverage: {
    en: 'Beverage',
    ar: 'المشروبات',
  },
  'Value for Money': {
    en: 'Value for Money',
    ar: 'القيمة مقابل المال',
  },
  Cleanliness: {
    en: 'Cleanliness',
    ar: 'النظافة',
  },
  'How did you come to know about us?': {
    en: 'How did you come to know about us?',
    ar: 'من أين سمعت عنا؟',
  },
  'Please choose': {
    en: 'Please choose',
    ar: 'اختارمن فضلك يرجى الاختيار',
  },
  'Social Media': {
    en: 'Social Media',
    ar: 'وسائل التواصل الاجتماعي',
  },
  'Influencer Recommendation': {
    en: 'Influencer Recommendation',
    ar: 'توصية من أحد المؤثرين',
  },
  'Search Engines like Google, Bing, etc...': {
    en: 'Search Engines like Google, Bing, etc...',
    ar: 'محركات البحث مثل جوجل، بينغ، إلخ...',
  },
  'Word of Mouth': {
    en: 'Word of Mouth',
    ar: 'التوصية الشفوية',
  },
  Website: {
    en: 'Website',
    ar: 'الموقع إلكتروني',
  },
  Advertisement: {
    en: 'Advertisement',
    ar: 'إعلان',
  },
  SMS: {
    en: 'SMS',
    ar: 'رسالة نصية قصيرة',
  },
  Other: {
    en: 'Other',
    ar: 'شيء آخر',
  },
  'Dining satisfaction survey': {
    en: 'Dining satisfaction survey',
    ar: 'استبيان تقييم المطعم',
  },
  'Would you visit this restaurant again?': {
    en: 'Would you visit this restaurant again?',
    ar: 'هل ستزور هذا المطعم مرة أخرى؟',
  },
  Yes: {
    en: 'Yes',
    ar: 'نعم',
  },
  No: {
    en: 'No',
    ar: 'لا',
  },
  'Did the manager/supervisor visit your table?': {
    en: 'Did the manager/supervisor visit your table?',
    ar: 'هل زار المدير/المشرف طاولتك؟',
  },
  'Customer information': {
    en: 'Customer information',
    ar: 'معلومات العميل',
  },
  'Full Name': {
    en: 'Full Name',
    ar: 'الاسم الكامل',
  },
  'Enter Here': {
    en: 'Enter Here',
    ar: 'أدخل هنا',
  },
  'Country Code': {
    en: 'Country Code',
    ar: 'رمز الدولة',
  },
  'Phone Number': {
    en: 'Phone Number',
    ar: 'رقم الهاتف',
  },
  'Birth date': {
    en: 'Birth date',
    ar: 'تاريخ الميلاد',
  },
  'mm/dd/yyyy': {
    en: 'mm/dd/yyyy',
    ar: 'mm/dd/yyyy',
  },
  'Email Address': {
    en: 'Email Address',
    ar: 'البريد الإلكتروني',
  },
  'How Did We Do Today?': {
    en: 'How Did We Do Today?',
    ar: 'كيف كان أداؤنا اليوم؟',
  },
  'Please rate us.': {
    en: 'Please rate us.',
    ar: 'من فضلك قم بتقييمنا',
  },
  'Your Comments': {
    en: 'Your Comments',
    ar: 'تعليقاتك؟',
  },
  'Your comments?': {
    en: 'Your comments?',
    ar: 'تعليقاتك؟',
  },
  'Select rating': { en: 'Select rating', ar: 'حدد التقييم' },
  Poor: { en: 'Poor', ar: 'غير مرضٍ' },
  Good: { en: 'Good', ar: 'جيد' },
  Average: { en: 'Average', ar: 'متوسط' },
  'Very Good': { en: 'Very Good', ar: 'جيد جدًا' },
  Excellent: { en: 'Excellent', ar: 'ممتاز' },
  'Would you allow us to contact you for any future promotions, events and informations about our restaurants?':
    {
      en: 'Would you allow us to contact you for any future promotions, events and informations about our restaurants?',
      ar: 'هل توافق على أن نتواصل معك بخصوص العروض والفعاليات والمعلومات المستقبلية عن مطاعمنا؟',
    },

  'Follow us on social media or visit our website for updates and offers.': {
    en: 'Follow us on social media or visit our website for updates and offers.',
    ar: 'تابعنا عبر وسائل التواصل الاجتماعي أو قم بزيارة موقعنا لمعرفة أحدث التحديثات والعروض.',
  },
  'We Appreciate Your Input!': {
    en: 'We Appreciate Your Input!',
    ar: 'نقدّر مساهمتك',
  },
  'Thanks for taking the time to share your thoughts with us.': {
    en: 'Thanks for taking the time to share your thoughts with us.',
    ar: 'شكرًا على تخصيص وقتكم لمشاركة أفكاركم معنا.',
  },
  'Stay connected with us': {
    en: 'Stay connected with us',
    ar: 'ابقَ على تواصل معنا',
  },
  'Share your shopping experience to help us serve you better!': {
    en: 'Share your shopping experience to help us serve you better!',
    ar: 'شارك تجربتك في التسوق لمساعدتنا في خدمتك بشكل أفضل!',
  },
  'Store Ambience & Cleanliness': {
    en: 'Store Ambience & Cleanliness',
    ar: 'الجو العام ونظافة المتجر',
  },
  'How would you rate the store ambience and cleanliness?': {
    en: 'How would you rate the store ambience and cleanliness?',
    ar: 'كيف تُقيّم الجو العام ونظافة المتجر؟',
  },
  'Product Availability & Variety': {
    en: 'Product Availability & Variety',
    ar: 'توفر وتنوّع المنتجات',
  },
  'Did you find what you were looking for?': {
    en: 'Did you find what you were looking for?',
    ar: 'هل وجدت ما كنت تبحث عنه؟',
  },
  'How would you rate the variety of brands and products available?': {
    en: 'How would you rate the variety of brands and products available?',
    ar: 'كيف تُقيّم تنوّع العلامات التجارية والمنتجات المتوفرة؟',
  },
  'Customer Service': {
    en: 'Customer Service',
    ar: 'خدمة العملاء',
  },
  'How satisfied are you with the assitance provided by our staff?': {
    en: 'How satisfied are you with the assitance provided by our staff?',
    ar: 'ما مدى رضاك عن المساعدة التي قدمها لك فريق العمل؟',
  },
  'Were our staff members helpful and knowledgeable?': {
    en: 'Were our staff members helpful and knowledgeable?',
    ar: 'هل كان فريق العمل متعاونًا ويمتلك المعرفة الكافية؟',
  },
  'Checkout & Payment Process': {
    en: 'Checkout & Payment Process',
    ar: 'عملية الدفع وإتمام الشراء',
  },
  'How smooth was the checkout process?': {
    en: 'How smooth was the checkout process?',
    ar: 'ما مدى سلاسة عملية الدفع وإتمام الشراء؟',
  },
  'Loyalty Program': {
    en: 'Loyalty Program',
    ar: 'برنامج الولاء',
  },
  'Are you a member of Club Printemps?': {
    en: 'Are you a member of Club Printemps?',
    ar: 'هل أنت عضو في نادي برنتان؟',
  },
  'If yes, how satisfied are you with the loyalty benefits?': {
    en: 'If yes, how satisfied are you with the loyalty benefits?',
    ar: 'إذا كانت الإجابة نعم، ما مدى رضاك عن مزايا برنامج الولاء؟',
  },
  'Communication & Promotions': {
    en: 'Communication & Promotions',
    ar: 'التواصل والعروض الترويجية',
  },
  'How do you prefer to receive updates about promotions and events?': {
    en: 'How do you prefer to receive updates about promotions and events?',
    ar: 'كيف تفضّل أن يتم إعلامك عن العروض والفعاليات؟',
  },
  'Overall Experience': {
    en: 'Overall Experience',
    ar: 'التجربة العامة',
  },
  'How satisfied are you with your experience at Printemps Doha': {
    en: 'How satisfied are you with your experience at Printemps Doha',
    ar: 'ما مدى رضاك عن تجربتك في برنتان الدوحة؟',
  },
  'Areas for Improvement': {
    en: 'Areas for Improvement',
    ar: 'مجالات التحسين',
  },
  'What would you like us to improve?': {
    en: 'What would you like us to improve?',
    ar: 'ما الذي ترغب في أن نقوم بتحسينه؟',
  },

  'Let us know your human': {
    en: "Let us know you're human",
    ar: 'إثبات أنك لست روبوتًا',
  },
  'Please verify that you are human': {
    en: 'Please verify that you are human',
    ar: 'يرجى التحقق من أنك إنسان',
  },
  'Enter verification code': {
    en: 'Enter verification code',
    ar: 'أدخل رمز التحقق',
  },
  'Enter code': {
    en: 'Enter code',
    ar: 'أدخل الرمز',
  },
  Refresh: {
    en: 'Refresh',
    ar: 'تحديث',
  },
  'Click refresh if unreadable': {
    en: 'Click refresh if unreadable',
    ar: 'انقر فوق تحديث إذا كان غير قابل للقراءة',
  },
  '1 - Very Dissatisfied to 5 - Very Satisfied': {
    en: '1 - Very Dissatisfied to 5 - Very Satisfied',
    ar: '1 - غير راضي كلياً إلى 5 - راضٍ جداً',
  },
  'Very Dissatisfied': {
    en: 'Very Dissatisfied',
    ar: 'غير راضي كلياً',
  },
  Dissatisfied: {
    en: 'Dissatisfied',
    ar: 'غير راضٍ',
  },
  Neutral: {
    en: 'Neutral',
    ar: 'محايد ',
  },
  Satisfied: {
    en: 'Satisfied',
    ar: 'راضٍ',
  },
  'Very Satisfied': {
    en: 'Very Satisfied',
    ar: 'راضٍ جداً',
  },
  Whatsapp: {
    en: 'Whatsapp',
    ar: 'واتساب',
  },
  Email: {
    en: 'Email',
    ar: 'البريد الإلكتروني',
  },

  'Fill Out the Details Below:': {
    en: 'Fill Out the Details Below:',
    ar: 'يرجى تعبئة التفاصيل أدناه:',
  },
  'VISIT DATE': {
    en: 'VISIT DATE',
    ar: 'تاريخ الزيارة',
  },
  'Only for Ages 18 and above.': {
    en: 'Only for Ages 18 and above.',
    ar: 'مخصص للأعمار 18 سنة وما فوق.',
  },
  AGE: {
    en: 'AGE',
    ar: 'العمر',
  },
  'NA IF NONE.': {
    en: 'NA IF NONE.',
    ar: 'غير متوفر إذا لا يوجد',
  },
  'Ages under 18 are considered as Dependents/Children': {
    en: 'Ages under 18 are considered as Dependents/Children',
    ar: 'الأعمار تحت 18 تعتبر تابعة/أطفال.',
  },
  'Please select a package': {
    en: 'Please select a package',
    ar: 'يرجى اختيار الباقة',
  },
  'Photo/Video Permission': {
    en: 'Photo/Video Permission',
    ar: 'إذن بالتصوير الفوتوغرافي/الفيديو',
  },
  'If “No” is selected, Quest will make reasonable efforts to avoid directed recording; however, incidental appearance in background/crowd imagery may still occur.':
    {
      en: 'If “No” is selected, Quest will make reasonable efforts to avoid directed recording; however, incidental appearance in background/crowd imagery may still occur.',
      ar: 'في حال تم اختيار "لا"، سيبذل كويست جهودًا معقولة لتجنب التصوير المباشر؛ ومع ذلك، قد يظهر الشخص بشكل عارض في خلفية الصور/الفيديوهات الجماعي',
    },
  'Please select packages and consent media appearance': {
    en: 'Please select packages and consent media appearance',
    ar: 'يرجى اختيار الباقات والموافقة على الظهور الإعلامي.',
  },
  'Roller Skating Waiver form has been submitted': {
    en: 'Roller Skating Waiver form has been submitted',
    ar: 'تم إرسال نموذج إقرار التزلج على العجلات',
  },
  // Need Translations
  'YOURS / GUARDIAN or PARENT INFORMATION': {
    en: 'YOURS / GUARDIAN or PARENT INFORMATION',
    ar: 'معلوماتك / معلومات الوصي أو ولي الأمر',
  },
  "Emergency Contact's Name": {
    en: "Emergency Contact's Name",
    ar: 'اسم جهة الاتصال في حالات الطوارئ',
  },
  "Emergency Contact's Phone": {
    en: "Emergency Contact's Phone",
    ar: 'هاتف جهة الاتصال في حالات الطوارئ',
  },
  'Yes, I consent': {
    en: 'Yes, I consent',
    ar: 'نعم، أوافق',
  },
  'No, I do not consent': {
    en: 'No, I do not consent',
    ar: 'لا، لا أوافق',
  },
  'Training Only (8 sessions)': {
    en: 'Training Only (8 sessions)',
    ar: 'التدريب فقط (٨ جلسات)',
  },
  'QAR 399 (Juniors 4–12 or Adults 13+)': {
    en: 'QAR 399 (Juniors 4–12 or Adults 13+)',
    ar: '٣٩٩ ر.ق (للأطفال من ٤–١٢ سنة أو الكبار ١٣+)',
  },
  'Training + Park Admission': {
    en: 'Training + Park Admission',
    ar: 'التدريب + دخول كويست',
  },
  'QAR 799 (Adults 13+)': {
    en: 'QAR 799 (Adults 13+)',
    ar: '٧٩٩ ر.ق (للكبار ١٣+)',
  },
  'Training + Park Admission (+Accompanying Guest)': {
    en: 'Training + Park Admission (+Accompanying Guest)',
    ar: 'التدريب + دخول كويست (+ ضيف مرافق)',
  },
  'QAR 1,499 (Juniors 4–12 or Adults 13 + one 18+ accompanying guest; non-transferable)': {
    en: 'QAR 1,499 (Juniors 4–12 or Adults 13 + one 18+ accompanying guest; non-transferable)',
    ar: '١,٤٩٩ ر.ق (للأطفال من ٤–١٢ سنة أو الكبار ١٣+ مع ضيف مرافق ١٨+؛ غير قابلة للتحويل)',
  },
  'How will you rate the visual presentation/look of the store?': {
    en: 'How will you rate the visual presentation/look of the store?',
    ar: 'كيف تقيّم المظهر العام والانطباع في المتجر؟',
  },
  // New
  'Search menu': {
    en: 'Search menu',
    ar: 'ابحث في القائمة',
  },
  'Read more': {
    en: 'Read more',
    ar: 'اقرأ المزيد',
  },
  All: {
    en: 'All',
    ar: 'الكل',
  },
  'All Day': {
    en: 'All Day',
    ar: 'طوال اليوم',
  },
  Allergens: {
    en: 'Allergens',
    ar: 'مسببات الحساسية',
  },
  None: {
    en: 'None',
    ar: 'لا يوجد',
  },
  'Out of stock': {
    en: 'Out of stock',
    ar: 'نفدت الكمية',
  },
  'Add to cart': {
    en: 'Add to cart',
    ar: 'أضف إلى السلة',
  },
  Item: {
    en: 'Item',
    ar: 'أضف إلى السلة',
  },
  'Select table to order': {
    en: 'Select table to order',
    ar: 'اختر الطاولة للطلب',
  },

  // Need Translations (fnb/menu ordering — cart-bar, item-quantity-control,
  // notification-prompt, order-tracker, seat-picker, table-picker)
  'Your order': { en: 'Your order', ar: 'Your order AR' },
  Table: { en: 'Table', ar: 'Table AR' },
  Seat: { en: 'Seat', ar: 'Seat AR' },
  'Switch table?': { en: 'Switch table?', ar: 'Switch table? AR' },
  'Change seat?': { en: 'Change seat?', ar: 'Change seat? AR' },
  optional: { en: 'optional', ar: 'optional AR' },
  'So staff know whose order this is': {
    en: 'So staff know whose order this is',
    ar: 'So staff know whose order this is AR',
  },
  'Special requests': { en: 'Special requests', ar: 'Special requests AR' },
  'Allergies, no ice, extra napkins…': {
    en: 'Allergies, no ice, extra napkins…',
    ar: 'Allergies, no ice, extra napkins… AR',
  },
  Total: { en: 'Total', ar: 'Total AR' },
  Order: { en: 'Order', ar: 'Order AR' },
  'placed! The kitchen has received your order.': {
    en: 'placed! The kitchen has received your order.',
    ar: 'placed! The kitchen has received your order. AR',
  },
  item: { en: 'item', ar: 'item AR' },
  items: { en: 'items', ar: 'items AR' },
  'Placing order...': { en: 'Placing order...', ar: 'Placing order... AR' },
  'Failed to place order': { en: 'Failed to place order', ar: 'Failed to place order AR' },
  'Remove one': { en: 'Remove one', ar: 'Remove one AR' },
  'Get notified when your order is ready': {
    en: 'Get notified when your order is ready',
    ar: 'Get notified when your order is ready AR',
  },
  Enable: { en: 'Enable', ar: 'Enable AR' },
  'Dismiss notification prompt': {
    en: 'Dismiss notification prompt',
    ar: 'Dismiss notification prompt AR',
  },
  'Select your seat': { en: 'Select your seat', ar: 'Select your seat AR' },
  Close: { en: 'Close', ar: 'Close AR' },
  'Loading seats...': { en: 'Loading seats...', ar: 'Loading seats... AR' },
  'No seats available for this table.': {
    en: 'No seats available for this table.',
    ar: 'No seats available for this table. AR',
  },
  'Select your table': { en: 'Select your table', ar: 'Select your table AR' },
  'Loading tables...': { en: 'Loading tables...', ar: 'Loading tables... AR' },
  'No tables available.': { en: 'No tables available.', ar: 'No tables available. AR' },
  'Select seat to order': { en: 'Select seat to order', ar: 'Select seat to order AR' },
  'Order placed': { en: 'Order placed', ar: 'Order placed AR' },
  Confirmed: { en: 'Confirmed', ar: 'Confirmed AR' },
  Preparing: { en: 'Preparing', ar: 'Preparing AR' },
  'Ready to serve': { en: 'Ready to serve', ar: 'Ready to serve AR' },
  Served: { en: 'Served', ar: 'Served AR' },
  Completed: { en: 'Completed', ar: 'Completed AR' },
  Cancelled: { en: 'Cancelled', ar: 'Cancelled AR' },
  'is being prepared': { en: 'is being prepared', ar: 'is being prepared AR' },
  'The kitchen has started on your order.': {
    en: 'The kitchen has started on your order.',
    ar: 'The kitchen has started on your order. AR',
  },
  'is ready': { en: 'is ready', ar: 'is ready AR' },
  'has been served': { en: 'has been served', ar: 'has been served AR' },
  'Enjoy your meal!': { en: 'Enjoy your meal!', ar: 'Enjoy your meal! AR' },
  'was cancelled': { en: 'was cancelled', ar: 'was cancelled AR' },
  'Your order was cancelled.': {
    en: 'Your order was cancelled.',
    ar: 'Your order was cancelled. AR',
  },
  'reconnecting...': { en: 'reconnecting...', ar: 'reconnecting... AR' },
  Placed: { en: 'Placed', ar: 'Placed AR' },
  For: { en: 'For', ar: 'For AR' },
  Note: { en: 'Note', ar: 'Note AR' },
  'Cancelling...': { en: 'Cancelling...', ar: 'Cancelling... AR' },
  'Cancel order': { en: 'Cancel order', ar: 'Cancel order AR' },
  Dismiss: { en: 'Dismiss', ar: 'Dismiss AR' },
  'Dismiss all': { en: 'Dismiss all', ar: 'Dismiss all AR' },

  // Need Translations (fnb/menu static text — Phase 1)
  // search-overlay.tsx
  'Close search': { en: 'Close search', ar: 'Close search AR' },
  Loading: { en: 'Loading', ar: 'Loading AR' },
  'No items found': { en: 'No items found', ar: 'No items found AR' },
  // blocks/filter.tsx
  Filter: { en: 'Filter', ar: 'Filter AR' },
  // blocks/header.tsx
  Search: { en: 'Search', ar: 'Search AR' },
  // scroll-to-top-button.tsx
  'Scroll to top': { en: 'Scroll to top', ar: 'Scroll to top AR' },
  // forms renderer + survey gate (TECH-0107 Phase 5)
  'Pick an option': { en: 'Pick an option', ar: 'اختر أحد الخيارات' },
  'Select a country': { en: 'Select a country', ar: 'اختر الدولة' },
  'Select Date': { en: 'Select Date', ar: 'اختر التاريخ' },
  'Select Time': { en: 'Select Time', ar: 'اختر الوقت' },
  Review: { en: 'Review', ar: 'مراجعة' },
  'Review & Submit': { en: 'Review & Submit', ar: 'المراجعة والإرسال' },
  of: { en: 'of', ar: 'من' },
  Resubmit: { en: 'Resubmit', ar: 'إعادة الإرسال' },
  Back: { en: 'Back', ar: 'رجوع' },
  Continue: { en: 'Continue', ar: 'متابعة' },
  'Save & Back to Review': { en: 'Save & Back to Review', ar: 'حفظ والعودة إلى المراجعة' },
  Edit: { en: 'Edit', ar: 'تعديل' },
  'Review Your Submission': { en: 'Review Your Submission', ar: 'مراجعة بياناتك' },
  'Submission Details': { en: 'Submission Details', ar: 'تفاصيل الطلب' },
  'Please review your entries carefully. You can edit any section before submitting.': {
    en: 'Please review your entries carefully. You can edit any section before submitting.',
    ar: 'يرجى مراجعة بياناتك بعناية. يمكنك تعديل أي قسم قبل الإرسال.',
  },
  'This is a read-only view of the submitted form.': {
    en: 'This is a read-only view of the submitted form.',
    ar: 'هذه نسخة للقراءة فقط من النموذج المقدّم.',
  },
  Entry: { en: 'Entry', ar: 'المُدخل' },
  Step: { en: 'Step', ar: 'الخطوة' },
  'Your Submission': { en: 'Your Submission', ar: 'إجاباتك' },
  General: { en: 'General', ar: 'عام' },
  'Additional Info': { en: 'Additional Info', ar: 'معلومات إضافية' },
  Section: { en: 'Section', ar: 'القسم' },
  'Type here...': { en: 'Type here...', ar: 'اكتب هنا...' },
  'Not answered': { en: 'Not answered', ar: 'لم تتم الإجابة' },
  'No rating': { en: 'No rating', ar: 'بدون تقييم' },
  'I agree to the Terms and Conditions': {
    en: 'I agree to the Terms and Conditions',
    ar: 'أوافق على الشروط والأحكام',
  },
  'Please fill in the required field': {
    en: 'Please fill in the required field',
    ar: 'يرجى ملء الحقل المطلوب',
  },
  'This field is required': { en: 'This field is required', ar: 'هذا الحقل مطلوب' },
  'You must be logged in to submit this form.': {
    en: 'You must be logged in to submit this form.',
    ar: 'يجب تسجيل الدخول لإرسال هذا النموذج.',
  },
  'Please accept the Terms and Conditions to continue.': {
    en: 'Please accept the Terms and Conditions to continue.',
    ar: 'يرجى الموافقة على الشروط والأحكام للمتابعة.',
  },
  'Please accept the Terms and Conditions to submit.': {
    en: 'Please accept the Terms and Conditions to submit.',
    ar: 'يرجى الموافقة على الشروط والأحكام لإرسال النموذج.',
  },
  'Please wait for files to finish uploading.': {
    en: 'Please wait for files to finish uploading.',
    ar: 'يرجى الانتظار حتى يكتمل رفع الملفات.',
  },
  'Your submission has been received successfully.': {
    en: 'Your submission has been received successfully.',
    ar: 'تم استلام مشاركتك بنجاح.',
  },
  'This is a survey. Enter the invitation code from your email to continue.': {
    en: 'This is a survey. Enter the invitation code from your email to continue.',
    ar: 'هذا استبيان. يُرجى إدخال رمز الدعوة المرسل إلى بريدك الإلكتروني للمتابعة.',
  },
  'Please enter your invitation code.': {
    en: 'Please enter your invitation code.',
    ar: 'يُرجى إدخال رمز الدعوة الخاص بك.',
  },
  'Invalid or expired code.': {
    en: 'Invalid or expired code.',
    ar: 'رمز غير صالح أو منتهي الصلاحية.',
  },
  'Use a different code': { en: 'Use a different code', ar: 'استخدام رمز آخر' },
  'Loading survey': { en: 'Loading survey', ar: 'جاري تحميل الاستبيان' },
  'Delete Last': { en: 'Delete Last', ar: 'حذف الأخير' },
  Add: { en: 'Add', ar: 'إضافة' },
  'Set by your invitation': { en: 'Set by your invitation', ar: 'محدد من خلال دعوتك' },
  'This question is required.': {
    en: 'This question is required.',
    ar: 'هذا السؤال مطلوب.',
  },
  'Please answer the highlighted question.': {
    en: 'Please answer the highlighted question.',
    ar: 'يرجى الإجابة على السؤال المحدد.',
  },
  'Please answer the {count} highlighted questions.': {
    en: 'Please answer the {count} highlighted questions.',
    ar: 'يرجى الإجابة على الأسئلة المحددة ({count}).',
  },
}

// Built once at module load instead of re-scanning `_translation` on every `t()` call.
const lowerCasedIndex = new Map<string, Translations[string]>()
for (const key in _translation) {
  lowerCasedIndex.set(key.toLowerCase(), _translation[key])
}

export const t = (text: string, language: Language): string => {
  const entry = lowerCasedIndex.get(text.toLowerCase())

  if (!entry) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`[translations] No entry for "${text}" — showing raw text.`)
    }
    return text
  }

  // Fall back to English rather than an empty string when a locale (e.g. `fr`)
  // hasn't been translated yet for this entry.
  const translated = entry[language] ?? entry.en
  if (translated === undefined) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`[translations] "${text}" has no "${language}" or "en" value.`)
    }
    return text
  }

  return translated
}
