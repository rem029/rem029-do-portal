import { Language } from "../types";

const content = {
  en: {
    headers: {},
    customer_rating: [
      {
        icon: "😔",
        label: "Sad",
        value: "detractor",
      },
      {
        icon: "😐",
        label: "Neutral",
        value: "neutral",
      },
      {
        icon: "😊",
        label: "Happy",
        value: "promoter",
      },
    ],
    restaurants: [
      "Crazy pizza",
      "Cova",
      "Twiga",
      "Russo's",
      "Wild and the moon",
      "Pierre Marcolini",
      "Pierre herme",
      "Mosavali",
      "Dar yema",
      "Salon de the",
      "Duck donuts",
    ],
  },
  ar: {},
  fr: {},
};

type Translations = Record<any, Partial<Record<Language, string>>>;

const _translation: Record<string, Partial<Record<Language, string>>> = {
  "IFLY WAIVER OF LIABILITY": {
    en: "IFLY WAIVER OF LIABILITY",
    ar: "التنازل عن المسؤولية",
  },
  "LASER OASIS WAIVER OF LIABILITY": {
    en: "LASER OASIS WAIVER OF LIABILITY",
    ar: "LASER OASIS WAIVER OF LIABILITY AR",
  },
  Checklist: {
    en: "Checklist",
    ar: "قائمة تدقيق",
  },
  Notes: {
    en: "Notes",
    ar: "ملحوظات",
  },
  "Terms and conditions": {
    en: "Terms and conditions",
    ar: "الأحكام والشروط",
  },
  "YOUR INFORMATION": {
    en: "YOUR INFORMATION",
    ar: "معلوماتك",
  },
  "DEPENDENTS / CHILDREN": {
    en: "DEPENDENTS / CHILDREN",
    ar: "المُعالون / الأطفال",
  },
  "Remove Dependents / Child": {
    en: "Remove Dependents / Child",
    ar: "إزالة المعالين / الطفل",
  },
  "Add Dependents / Child": {
    en: "Add Dependents / Child",
    ar: "إضافة المُعالين / الطفل",
  },
  Signature: {
    en: "Signature",
    ar: "إمضاء",
  },
  "Clear Signature": {
    en: "Clear Signature",
    ar: "مسح التوقيع",
  },
  Name: {
    en: "Name",
    ar: "اسم",
  },
  "Participant of parent/guardian": {
    en: "Participant of parent/guardian",
    ar: "مشارك من الوالدين / الوصي",
  },
  "Child's Name": {
    en: "Child's Name",
    ar: "اسم الطفل",
  },
  "QID/Passport#": {
    en: "QID/Passport#",
    ar: "البطاقة الشخصية / جواز السفر#",
  },
  "Your residence permit ID or passport number.": {
    en: "Your residence permit ID or passport number.",
    ar: "رقم تصريح الإقامة أو رقم جواز السفر.",
  },
  "Child's residence permit ID or passport number.": {
    en: "Child's residence permit ID or passport number.",
    ar: "بطاقة هوية إقامة الطفل أو رقم جواز السفر.",
  },
  Phone: {
    en: "Phone",
    ar: "هاتف",
  },
  "ex. 0097411222211, 97411222211 or 11223344": {
    en: "ex. 0097411222211, 97411222211 or 11223344",
    ar: "السابق. 0097411222211 أو 97411222211 أو 11223344",
  },
  "By submitting this form means you comply and understand above listed checklist, terms and conditions": {
    en: "By submitting this form means you comply and understand above listed checklist, terms and conditions",
    ar: "من خلال تقديم هذا النموذج يعني أنك تلتزم وتفهم قائمة المراجعة والشروط والأحكام المذكورة أعلاه",
  },
  Submit: {
    en: "Submit",
    ar: "إرسال",
  },
  "Submitting...": {
    en: "Submitting...",
    ar: "تقديم...",
  },
  "Thank you! Your Form ID is:": {
    en: "Thank you! Your Form ID is:",
    ar: "شكرًا لك! معرف النموذج الخاص بك هو:",
  },
  "iFly Waiver form has been submitted": {
    en: "iFly Waiver form has been submitted",
    ar: "تم تقديم نموذج التنازل عن iFly",
  },
  "Laser Oasis Waiver form has been submitted": {
    en: "Laser Oasis Waiver form has been submitted",
    ar: "Laser Oasis Waiver form has been submitted AR",
  },
  "Submit new waiver form": {
    en: "Submit new waiver form",
    ar: "تقديم نموذج تنازل جديد",
  },
  "Any comments or feedback?": {
    en: "Any comments or feedback?",
    ar: "أي تعليقات أو تعليقات؟",
    fr: "Any comments or feedback?",
  },
  "Survey F&B": {
    en: "Survey F&B",
    ar: "استبيان تقييم المطعم",
  },
  "Your Voice, Our Improvement": {
    en: "Your Voice, Our Improvement",
    ar: "صوتك، تطورنا",
  },
  "Share your dining experience to help us serve you better!": {
    en: "Share your dining experience to help us serve you better!",
    ar: "شارك تجربتك لمساعدتنا في خدمتك بشكل أفضل!",
  },
  "Meal Period": {
    en: "Meal Period",
    ar: "فترة الوجبة",
  },
  Breakfast: {
    en: "Breakfast",
    ar: "فطور الصباح",
  },
  Lunch: {
    en: "Lunch",
    ar: "الغداء",
  },
  Dinner: {
    en: "Dinner",
    ar: "العشاء",
  },
  "How often do you visit our restaurant?": {
    en: "How often do you visit our restaurant?",
    ar: "كم مرة تزور مطعمنا؟",
  },
  Daily: {
    en: "Daily",
    ar: "يوميًا",
  },
  Weekly: {
    en: "Weekly",
    ar: "أسبوعيًا",
  },
  Monthly: {
    en: "Monthly",
    ar: "شهريًا",
  },
  "First Time": {
    en: "First Time",
    ar: "أول مرة",
  },
  "How would you rate your dining experience?": {
    en: "How would you rate your dining experience?",
    ar: "كيف تقيم تجربتك ؟",
  },
  Greeting: {
    en: "Greeting",
    ar: "الترحيب",
  },
  Service: {
    en: "Service",
    ar: "الخدمة",
  },
  Food: {
    en: "Food",
    ar: "الأكل",
  },
  Beverage: {
    en: "Beverage",
    ar: "المشروبات",
  },
  "Value for Money": {
    en: "Value for Money",
    ar: "القيمة مقابل المال",
  },
  Cleanliness: {
    en: "Cleanliness",
    ar: "النظافة",
  },
  "How did you come to know about us?": {
    en: "How did you come to know about us?",
    ar: "من أين سمعت عنا؟",
  },
  "Please choose": {
    en: "Please choose",
    ar: "اختارمن فضلك يرجى الاختيار",
  },
  "Social Media": {
    en: "Social Media",
    ar: "وسائل التواصل الاجتماعي",
  },
  "Influencer Recommendation": {
    en: "Influencer Recommendation",
    ar: "توصية من أحد المؤثرين",
  },
  "Search Engines like Google, Bing, etc...": {
    en: "Search Engines like Google, Bing, etc...",
    ar: "محركات البحث مثل جوجل، بينغ، إلخ...",
  },
  "Word of Mouth": {
    en: "Word of Mouth",
    ar: "التوصية الشفوية",
  },
  Website: {
    en: "Website",
    ar: "الموقع إلكتروني",
  },
  Advertisement: {
    en: "Advertisement",
    ar: "إعلان",
  },
  SMS: {
    en: "SMS",
    ar: "رسالة نصية قصيرة",
  },
  Other: {
    en: "Other",
    ar: "شيء آخر",
  },
  "Dining satisfaction survey": {
    en: "Dining satisfaction survey",
    ar: "استبيان تقييم المطعم",
  },
  "Would you visit this restaurant again?": {
    en: "Would you visit this restaurant again?",
    ar: "هل ستزور هذا المطعم مرة أخرى؟",
  },
  Yes: {
    en: "Yes",
    ar: "نعم",
  },
  No: {
    en: "No",
    ar: "لا",
  },
  "Did the manager/supervisor visit your table?": {
    en: "Did the manager/supervisor visit your table?",
    ar: "هل زار المدير/المشرف طاولتك؟",
  },
  "Customer information": {
    en: "Customer information",
    ar: "معلومات العميل",
  },
  "Full Name": {
    en: "Full Name",
    ar: "الاسم الكامل",
  },
  "Enter Here": {
    en: "Enter Here",
    ar: "أدخل هنا",
  },
  "Country Code": {
    en: "Country Code",
    ar: "رمز الدولة",
  },
  "Phone Number": {
    en: "Phone Number",
    ar: "رقم الهاتف",
  },
  "Birth date": {
    en: "Birth date",
    ar: "تاريخ الميلاد",
  },
  "mm/dd/yyyy": {
    en: "mm/dd/yyyy",
    ar: "mm/dd/yyyy",
  },
  "Email Address": {
    en: "Email Address",
    ar: "البريد الإلكتروني",
  },
  "How Did We Do Today?": {
    en: "How Did We Do Today?",
    ar: "كيف كان أداؤنا اليوم؟",
  },
  "Please rate us.": {
    en: "Please rate us.",
    ar: "من فضلك قم بتقييمنا",
  },
  "Your Comments": {
    en: "Your Comments",
    ar: "تعليقاتك؟",
  },
  "Your comments?": {
    en: "Your comments?",
    ar: "تعليقاتك؟",
  },
  "Select rating": { en: "Select rating", ar: "حدد التقييم" },
  Poor: { en: "Poor", ar: "غير مرضٍ" },
  Good: { en: "Good", ar: "جيد" },
  Average: { en: "Average", ar: "متوسط" },
  "Very Good": { en: "Very Good", ar: "جيد جدًا" },
  Excellent: { en: "Excellent", ar: "ممتاز" },
  "Would you allow us to contact you for any future promotions, events and informations about our restaurants?": {
    en: "Would you allow us to contact you for any future promotions, events and informations about our restaurants?",
    ar: "هل توافق على أن نتواصل معك بخصوص العروض والفعاليات والمعلومات المستقبلية عن مطاعمنا؟",
  },

  "Follow us on social media or visit our website for updates and offers.": {
    en: "Follow us on social media or visit our website for updates and offers.",
    ar: "تابعنا عبر وسائل التواصل الاجتماعي أو قم بزيارة موقعنا لمعرفة أحدث التحديثات والعروض.",
  },
  "We Appreciate Your Input!": {
    en: "We Appreciate Your Input!",
    ar: "نقدّر مساهمتك",
  },
  "Thanks for taking the time to share your thoughts with us.": {
    en: "Thanks for taking the time to share your thoughts with us.",
    ar: "شكرًا على تخصيص وقتكم لمشاركة أفكاركم معنا.",
  },
  "Stay connected with us": {
    en: "Stay connected with us",
    ar: "ابقَ على تواصل معنا",
  },
  "Share your shopping experience to help us serve you better!": {
    en: "Share your shopping experience to help us serve you better!",
    ar: "شارك تجربتك في التسوق لمساعدتنا في خدمتك بشكل أفضل!",
  },
  "Store Ambience & Cleanliness": {
    en: "Store Ambience & Cleanliness",
    ar: "الجو العام ونظافة المتجر",
  },
  "How would you rate the store ambience and cleanliness?": {
    en: "How would you rate the store ambience and cleanliness?",
    ar: "كيف تُقيّم الجو العام ونظافة المتجر؟",
  },
  "Product Availability & Variety": {
    en: "Product Availability & Variety",
    ar: "توفر وتنوّع المنتجات",
  },
  "Did you find what you were looking for?": {
    en: "Did you find what you were looking for?",
    ar: "هل وجدت ما كنت تبحث عنه؟",
  },
  "How would you rate the variety of brands and products available?": {
    en: "How would you rate the variety of brands and products available?",
    ar: "كيف تُقيّم تنوّع العلامات التجارية والمنتجات المتوفرة؟",
  },
  "Customer Service": {
    en: "Customer Service",
    ar: "خدمة العملاء",
  },
  "How satisfied are you with the assitance provided by our staff?": {
    en: "How satisfied are you with the assitance provided by our staff?",
    ar: "ما مدى رضاك عن المساعدة التي قدمها لك فريق العمل؟",
  },
  "Were our staff members helpful and knowledgeable?": {
    en: "Were our staff members helpful and knowledgeable?",
    ar: "هل كان فريق العمل متعاونًا ويمتلك المعرفة الكافية؟",
  },
  "Checkout & Payment Process": {
    en: "Checkout & Payment Process",
    ar: "عملية الدفع وإتمام الشراء",
  },
  "How smooth was the checkout process?": {
    en: "How smooth was the checkout process?",
    ar: "ما مدى سلاسة عملية الدفع وإتمام الشراء؟",
  },
  "Loyalty Program": {
    en: "Loyalty Program",
    ar: "برنامج الولاء",
  },
  "Are you a member of Club Printemps?": {
    en: "Are you a member of Club Printemps?",
    ar: "هل أنت عضو في نادي برنتان؟",
  },
  "If yes, how satisfied are you with the loyalty benefits?": {
    en: "If yes, how satisfied are you with the loyalty benefits?",
    ar: "إذا كانت الإجابة نعم، ما مدى رضاك عن مزايا برنامج الولاء؟",
  },
  "Communication & Promotions": {
    en: "Communication & Promotions",
    ar: "التواصل والعروض الترويجية",
  },
  "How do you prefer to receive updates about promotions and events?": {
    en: "How do you prefer to receive updates about promotions and events?",
    ar: "كيف تفضّل أن يتم إعلامك عن العروض والفعاليات؟",
  },
  "Overall Experience": {
    en: "Overall Experience",
    ar: "التجربة العامة",
  },
  "How satisfied are you with your experience at Printemps Doha": {
    en: "How satisfied are you with your experience at Printemps Doha",
    ar: "ما مدى رضاك عن تجربتك في برنتان الدوحة؟",
  },
  "Areas for Improvement": {
    en: "Areas for Improvement",
    ar: "مجالات التحسين",
  },
  "What would you like us to improve?": {
    en: "What would you like us to improve?",
    ar: "ما الذي ترغب في أن نقوم بتحسينه؟",
  },

  "Let us know your human": {
    en: "Let us know you're human",
    ar: "إثبات أنك لست روبوتًا",
  },
  "Please verify that you are human": {
    en: "Please verify that you are human",
    ar: "يرجى التحقق من أنك إنسان",
  },
  "Enter verification code": {
    en: "Enter verification code",
    ar: "أدخل رمز التحقق",
  },
  "Enter code": {
    en: "Enter code",
    ar: "أدخل الرمز",
  },
  Refresh: {
    en: "Refresh",
    ar: "تحديث",
  },
  "Click refresh if unreadable": {
    en: "Click refresh if unreadable",
    ar: "انقر فوق تحديث إذا كان غير قابل للقراءة",
  },
  "1 - Very Dissatisfied to 5 - Very Satisfied": {
    en: "1 - Very Dissatisfied to 5 - Very Satisfied",
    ar: "1 - غير راضي كلياً إلى 5 - راضٍ جداً",
  },
  "Very Dissatisfied": {
    en: "Very Dissatisfied",
    ar: "غير راضي كلياً",
  },
  Dissatisfied: {
    en: "Dissatisfied",
    ar: "غير راضٍ",
  },
  Neutral: {
    en: "Neutral",
    ar: "محايد ",
  },
  Satisfied: {
    en: "Satisfied",
    ar: "راضٍ",
  },
  "Very Satisfied": {
    en: "Very Satisfied",
    ar: "راضٍ جداً",
  },
  Whatsapp: {
    en: "Whatsapp",
    ar: "واتساب",
  },
  Email: {
    en: "Email",
    ar: "البريد الإلكتروني",
  },

  "Fill Out the Details Below:": {
    en: "Fill Out the Details Below:",
    ar: "يرجى تعبئة التفاصيل أدناه:",
  },
  "VISIT DATE": {
    en: "VISIT DATE",
    ar: "تاريخ الزيارة",
  },
  "Only for Ages 18 and above.": {
    en: "Only for Ages 18 and above.",
    ar: "مخصص للأعمار 18 سنة وما فوق.",
  },
  AGE: {
    en: "AGE",
    ar: "العمر",
  },
  "NA IF NONE.": {
    en: "NA IF NONE.",
    ar: "غير متوفر إذا لا يوجد",
  },
  "Ages under 18 are considered as Dependents/Children": {
    en: "Ages under 18 are considered as Dependents/Children",
    ar: "الأعمار تحت 18 تعتبر تابعة/أطفال.",
  },
  "Please select a package": {
    en: "Please select a package",
    ar: "يرجى اختيار الباقة",
  },
  "Photo/Video Permission": {
    en: "Photo/Video Permission",
    ar: "إذن بالتصوير الفوتوغرافي/الفيديو",
  },
  "If “No” is selected, Quest will make reasonable efforts to avoid directed recording; however, incidental appearance in background/crowd imagery may still occur.":
    {
      en: "If “No” is selected, Quest will make reasonable efforts to avoid directed recording; however, incidental appearance in background/crowd imagery may still occur.",
      ar: 'في حال تم اختيار "لا"، سيبذل كويست جهودًا معقولة لتجنب التصوير المباشر؛ ومع ذلك، قد يظهر الشخص بشكل عارض في خلفية الصور/الفيديوهات الجماعي',
    },
  "Please select packages and consent media appearance": {
    en: "Please select packages and consent media appearance",
    ar: "يرجى اختيار الباقات والموافقة على الظهور الإعلامي.",
  },
  "Roller Skating Waiver form has been submitted": {
    en: "Roller Skating Waiver form has been submitted",
    ar: "تم إرسال نموذج إقرار التزلج على العجلات",
  },
  // Need Translations
  "YOURS / GUARDIAN or PARENT INFORMATION": {
    en: "YOURS / GUARDIAN or PARENT INFORMATION",
    ar: "معلوماتك / معلومات الوصي أو ولي الأمر",
  },
  "Emergency Contact's Name": {
    en: "Emergency Contact's Name",
    ar: "اسم جهة الاتصال في حالات الطوارئ",
  },
  "Emergency Contact's Phone": {
    en: "Emergency Contact's Phone",
    ar: "هاتف جهة الاتصال في حالات الطوارئ",
  },
  "Yes, I consent": {
    en: "Yes, I consent",
    ar: "نعم، أوافق",
  },
  "No, I do not consent": {
    en: "No, I do not consent",
    ar: "لا، لا أوافق",
  },
  "Training Only (8 sessions)": {
    en: "Training Only (8 sessions)",
    ar: "التدريب فقط (٨ جلسات)",
  },
  "QAR 399 (Juniors 4–12 or Adults 13+)": {
    en: "QAR 399 (Juniors 4–12 or Adults 13+)",
    ar: "٣٩٩ ر.ق (للأطفال من ٤–١٢ سنة أو الكبار ١٣+)",
  },
  "Training + Park Admission": {
    en: "Training + Park Admission",
    ar: "التدريب + دخول كويست",
  },
  "QAR 799 (Adults 13+)": {
    en: "QAR 799 (Adults 13+)",
    ar: "٧٩٩ ر.ق (للكبار ١٣+)",
  },
  "Training + Park Admission (+Accompanying Guest)": {
    en: "Training + Park Admission (+Accompanying Guest)",
    ar: "التدريب + دخول كويست (+ ضيف مرافق)",
  },
  "QAR 1,499 (Juniors 4–12 or Adults 13 + one 18+ accompanying guest; non-transferable)": {
    en: "QAR 1,499 (Juniors 4–12 or Adults 13 + one 18+ accompanying guest; non-transferable)",
    ar: "١,٤٩٩ ر.ق (للأطفال من ٤–١٢ سنة أو الكبار ١٣+ مع ضيف مرافق ١٨+؛ غير قابلة للتحويل)",
  },
  "How will you rate the visual presentation/look of the store?": {
    en: "How will you rate the visual presentation/look of the store?",
    ar: "كيف تقيّم المظهر العام والانطباع في المتجر؟",
  },
};

export const t = (text: string, language: Language) => {
  const textLowered = text.toLowerCase();
  const loweredCasedTranslations: Translations = {};

  for (let key in _translation) {
    if (key.toLowerCase() === textLowered) {
      loweredCasedTranslations[textLowered] = _translation[key];
      break;
    }
  }

  if (!loweredCasedTranslations[textLowered]) {
    return text;
  }

  const translatedText = loweredCasedTranslations[textLowered][language] || "";
  return translatedText;
};

export default content;
