import type { AdSlot, Article, Block, Category, PortfolioProject, Profile, SiteSettings, Story } from './types';
import { blocksToMarkdown } from './content';

/** डेमो मोड का मॉक डेटा — सारी ख़बरें काल्पनिक/डेमो सामग्री हैं। */

const sub = (category_id: string, id: string, name_hi: string, order_index: number) => ({
  id: `sub-${id}`, category_id, name_hi, slug: id, order_index, is_active: true,
});

const cat = (id: string, name_hi: string, order_index: number, subs: [string, string][] = []): Category => ({
  id: `cat-${id}`, name_hi, slug: id, order_index, is_active: true,
  sub_categories: subs.map(([sid, sname], i) => sub(`cat-${id}`, sid, sname, i + 1)),
});

export const MOCK_CATEGORIES: Category[] = [
  cat('desh', 'देश', 1, [['rajniti', 'राजनीति'], ['samaj', 'समाज']]),
  cat('duniya', 'दुनिया', 2),
  cat('rajya', 'राज्य', 3, [['uttar-pradesh', 'उत्तर प्रदेश'], ['delhi', 'दिल्ली']]),
  cat('khel', 'खेल', 4, [['cricket', 'क्रिकेट'], ['football', 'फुटबॉल'], ['hockey', 'हॉकी'], ['athletics', 'एथलेटिक्स']]),
  cat('manoranjan', 'मनोरंजन', 5, [['bollywood', 'बॉलीवुड'], ['tv', 'टीवी'], ['ott', 'ओटीटी']]),
  cat('business', 'बिजनेस', 6, [['share-bazaar', 'शेयर बाज़ार'], ['arthvyavastha', 'अर्थव्यवस्था']]),
  cat('technology', 'टेक्नोलॉजी', 7, [['gadgets', 'गैजेट्स'], ['ai', 'एआई']]),
  cat('auto', 'ऑटो', 8),
  cat('lifestyle', 'लाइफस्टाइल', 9),
  cat('dharm', 'धर्म', 10),
  cat('health', 'स्वास्थ्य', 11, [['wellness', 'वेलनेस'], ['medical', 'मेडिकल']]),
  cat('education', 'शिक्षा', 12, [['school', 'स्कूल'], ['career', 'करियर']]),
  cat('food', 'खाना', 13, [['recipes', 'रेसिपी'], ['food-news', 'फूड न्यूज़']]),
];

const catName = (slug: string) => MOCK_CATEGORIES.find((c) => c.slug === slug)!.name_hi;

const SHARED: Block[] = [
  { type: 'h2', text: 'पूरा मामला' },
  { type: 'p', text: 'यह **डेमो सामग्री** है, जिसे पोर्टल का डिज़ाइन और कार्यक्षमता दिखाने के लिए तैयार किया गया है। असली प्रकाशन में यहाँ संवाददाता की विस्तृत रिपोर्ट दिखाई देगी।' },
  { type: 'quote', text: 'ख़बर वही, जो सच के साथ सबसे पहले आप तक पहुँचे।' },
  { type: 'ul', items: ['घटनाक्रम पर हमारी टीम की नज़र बनी हुई है', 'अगला अपडेट आते ही यह ख़बर अपडेट की जाएगी', 'अपनी राय नीचे साझा करें'] },
  { type: 'p', text: 'ताज़ा अपडेट के लिए दैनिक पत्रिका से जुड़े रहें और हमारे न्यूज़लेटर के लिए सब्सक्राइब करना न भूलें।' },
];

type Seed = [string, string, string, string, string, string | null, number, number, string, string];
// [slug, category, title, lead, p2, subId, hoursAgo, views, authorId, excerpt]
const AUTHORS: Record<string, string> = { a1: 'रवि कुमार', a2: 'सुनीता शर्मा', a3: 'अमित वर्मा' };

const SEEDS: Seed[] = [
  ['new-metro-line-inauguration', 'desh', 'राजधानी में नई मेट्रो लाइन का उद्घाटन, रोज़ाना 5 लाख यात्रियों को मिलेगी राहत',
    'राजधानी में नई मेट्रो लाइन आज यात्रियों के लिए खोल दी गई। शुरुआती दिनों में रियायती किराया लागू रहेगा और स्टेशनों पर अतिरिक्त सुरक्षा कर्मी तैनात किए गए हैं।',
    'अधिकारियों के मुताबिक नई लाइन शहर के पूर्वी और पश्चिमी इलाक़ों को सीधे जोड़ेगी, जिससे सड़कों पर दबाव कम होगा और दफ़्तर जाने वालों का समय बचेगा।', 'sub-samaj', 1, 98400, 'a1',
    'नई मेट्रो लाइन से शहर के दो छोरों के बीच सफ़र का समय आधे से भी कम होगा।'],
  ['winter-session-dates', 'desh', 'संसद के शीतकालीन सत्र की तारीख़ तय, कई अहम विधेयकों पर रहेगी नज़र',
    'शीतकालीन सत्र की तारीख़ें घोषित हो गई हैं और सत्र में कई महत्वपूर्ण विधेयक पेश किए जाने की संभावना है।',
    'सत्र शुरू होने से पहले सर्वदलीय बैठक बुलाई जाएगी, जिसमें कामकाज सुचारु रूप से चलाने पर चर्चा होगी।', 'sub-rajniti', 3, 41200, 'a2',
    'सत्र में कई अहम विधेयकों पर चर्चा संभव, सर्वदलीय बैठक पहले।'],
  ['global-climate-summit-agreement', 'duniya', 'वैश्विक जलवायु सम्मेलन में कार्बन उत्सर्जन घटाने पर बनी नई सहमति',
    'जलवायु सम्मेलन के अंतिम दिन कई देशों ने कार्बन उत्सर्जन घटाने के नए लक्ष्यों पर सहमति जताई।',
    'विशेषज्ञों ने इसे सही दिशा में कदम बताया, लेकिन क्रियान्वयन और फंडिंग को लेकर सवाल बने हुए हैं।', null, 5, 30500, 'a3',
    'कई देशों ने उत्सर्जन घटाने के नए लक्ष्य तय किए, क्रियान्वयन पर सवाल बाक़ी।'],
  ['india-wins-final', 'khel', 'रोमांचक मुक़ाबले में भारत ने जीता फाइनल, आख़िरी ओवर तक चली साँसें थमी',
    'फाइनल मुक़ाबला आख़िरी ओवर तक खिंचा और भारतीय टीम ने शानदार जीत दर्ज कर ट्रॉफ़ी अपने नाम की।',
    'कप्तान ने जीत का श्रेय पूरी टीम की मेहनत और दर्शकों के समर्थन को दिया।', 'sub-cricket', 2, 152000, 'a1',
    'आख़िरी ओवर तक चले मुक़ाबले में भारतीय टीम विजयी रही।'],
  ['athletics-records', 'khel', 'राष्ट्रीय एथलेटिक्स चैंपियनशिप में युवा धावकों ने तोड़े पुराने रिकॉर्ड',
    'तीन दिन की चैंपियनशिप में कई युवा खिलाड़ियों ने पुराने राष्ट्रीय रिकॉर्ड तोड़ दिए।',
    'कोचों का कहना है कि बेहतर प्रशिक्षण सुविधाओं का असर अब मैदान पर दिख रहा है।', 'sub-athletics', 7, 17800, 'a2',
    'युवा धावकों के प्रदर्शन से बढ़ी उम्मीदें।'],
  ['film-box-office-day-one', 'manoranjan', 'इस हफ़्ते की सबसे चर्चित फ़िल्म ने पहले दिन किया रिकॉर्ड कारोबार',
    'रिलीज़ के पहले ही दिन फ़िल्म ने बॉक्स ऑफ़िस पर शानदार शुरुआत की और कई सिनेमाघरों में शो हाउसफ़ुल रहे।',
    'समीक्षकों और दर्शकों दोनों की प्रतिक्रियाएँ सकारात्मक रही हैं, जिससे वीकेंड कलेक्शन बढ़ने की उम्मीद है।', 'sub-bollywood', 4, 87300, 'a3',
    'पहले दिन की कमाई ने बनाया नया रिकॉर्ड।'],
  ['ott-new-web-series', 'manoranjan', 'ओटीटी पर आ रही है नई वेब सीरीज़, ट्रेलर ने बटोरे लाखों व्यूज़',
    'बहुप्रतीक्षित वेब सीरीज़ का ट्रेलर जारी होते ही सोशल मीडिया पर छा गया।',
    'सीरीज़ अगले महीने स्ट्रीमिंग के लिए उपलब्ध होगी और इसमें कई जाने-माने कलाकार नज़र आएँगे।', 'sub-ott', 9, 45200, 'a2',
    'ट्रेलर ने बटोरे लाखों व्यूज़, अगले महीने होगी स्ट्रीमिंग।'],
  ['markets-rally', 'business', 'सेंसेक्स-निफ्टी में तेज़ी, निवेशकों की संपत्ति में बड़ा उछाल',
    'शेयर बाज़ार में आज ज़बरदस्त तेज़ी दिखी और प्रमुख सूचकांक बढ़त के साथ बंद हुए।',
    'बैंकिंग और आईटी शेयरों में सबसे ज़्यादा ख़रीदारी देखी गई।', 'sub-share-bazaar', 2, 64100, 'a1',
    'बाज़ार में तेज़ी से निवेशकों की संपत्ति बढ़ी।'],
  ['rbi-policy-meeting', 'business', 'नीतिगत बैठक आज से शुरू, ब्याज दरों पर टिकी निगाहें',
    'केंद्रीय बैंक की मौद्रिक नीति समिति की बैठक आज से शुरू हो रही है और बाज़ार की नज़र ब्याज दरों पर है।',
    'अर्थशास्त्रियों के बीच इस बात पर मतभेद है कि दरों में बदलाव होगा या नहीं।', 'sub-arthvyavastha', 6, 28900, 'a3',
    'ब्याज दरों पर फ़ैसले का इंतज़ार।'],
  ['ai-smart-classrooms', 'technology', 'AI से बदल रही है पढ़ाई, स्कूलों में शुरू हुए स्मार्ट क्लासरूम',
    'कई स्कूलों ने एआई आधारित स्मार्ट क्लासरूम शुरू किए हैं, जहाँ हर बच्चे की गति के अनुसार पढ़ाई कराई जाती है।',
    'शिक्षकों का कहना है कि इससे कमज़ोर विषयों पर काम करना आसान हुआ है।', 'sub-ai', 8, 22800, 'a1',
    'एआई से हर बच्चे को मिल रही अपनी गति से पढ़ाई।'],
  ['new-smartphone-launch', 'technology', 'नया स्मार्टफोन लॉन्च: 200MP कैमरा और दो दिन चलने वाली बैटरी का दावा',
    'कंपनी ने अपना नया फ़्लैगशिप स्मार्टफोन लॉन्च किया, जिसकी बिक्री अगले हफ़्ते से शुरू होगी।',
    'कंपनी का दावा है कि फ़ोन की बैटरी सामान्य इस्तेमाल में दो दिन तक चल सकती है।', 'sub-gadgets', 11, 36600, 'a2',
    'नए फ़्लैगशिप में दमदार कैमरा और लंबी बैटरी का दावा।'],
  ['ev-sales-surge', 'auto', 'इलेक्ट्रिक कारों की बिक्री में रिकॉर्ड उछाल, चार्जिंग नेटवर्क भी बढ़ा',
    'इस तिमाही में इलेक्ट्रिक वाहनों की बिक्री ने पिछले सभी रिकॉर्ड तोड़ दिए हैं।',
    'देश भर में नए चार्जिंग स्टेशन लगने से ग्राहकों की चिंता कम हुई है।', null, 12, 19400, 'a3',
    'ईवी की बिक्री में रिकॉर्ड उछाल, चार्जिंग नेटवर्क भी बढ़ा।'],
  ['winter-health-tips', 'lifestyle', 'सर्दियों में सेहत का ख़्याल: आसान तरीके जो बढ़ाएँगे आपकी इम्युनिटी',
    'सर्दियों में संतुलित खान-पान, पर्याप्त नींद और हल्की कसरत सेहत के लिए ज़रूरी मानी जाती है।',
    'यह सामान्य जानकारी है, किसी भी स्वास्थ्य समस्या में डॉक्टर से सलाह ज़रूर लें।', null, 14, 18900, 'a2',
    'संतुलित आहार और नींद से बनी रहेगी सेहत।'],
  ['new-expressway-approved', 'rajya', 'राज्य में नई एक्सप्रेसवे परियोजना को मंज़ूरी, कई ज़िलों को मिलेगा फ़ायदा',
    'राज्य सरकार ने नई एक्सप्रेसवे परियोजना को हरी झंडी दे दी है, जिससे कई ज़िले सीधे राजधानी से जुड़ेंगे।',
    'परियोजना के पूरा होने के बाद यात्रा का समय कई घंटे कम हो जाएगा।', 'sub-uttar-pradesh', 10, 33300, 'a1',
    'नई एक्सप्रेसवे परियोजना से जुड़ेंगे कई ज़िले।'],
  ['health-checkup-camps', 'health', 'शहर में स्वास्थ्य जांच शिविरों की बढ़ी संख्या, विशेषज्ञों ने नियमित जांच की दी सलाह',
    'शहर के अलग-अलग इलाकों में मुफ्त स्वास्थ्य जांच शिविर आयोजित किए जा रहे हैं, जहां लोग सामान्य जांच और विशेषज्ञों की सलाह ले रहे हैं।',
    'चिकित्सकों का कहना है कि समय पर जांच से कई स्वास्थ्य समस्याओं की पहचान शुरुआती चरण में की जा सकती है।', 'sub-medical', 3, 26400, 'a2',
    'मुफ्त स्वास्थ्य जांच शिविरों में लोगों की बढ़ी भागीदारी।'],
  ['school-digital-learning', 'education', 'स्कूलों में डिजिटल लर्निंग पर जोर, छात्रों के लिए शुरू हुई नई पहल',
    'कई स्कूलों में डिजिटल संसाधनों के इस्तेमाल से पढ़ाई को अधिक संवादात्मक बनाने की पहल शुरू की गई है।',
    'शिक्षकों के मुताबिक डिजिटल सामग्री के साथ पारंपरिक कक्षा शिक्षण का संतुलन छात्रों के सीखने में मदद कर रहा है।', 'sub-school', 5, 22100, 'a1',
    'डिजिटल संसाधनों से पढ़ाई को बेहतर बनाने की नई पहल।'],
  ['healthy-breakfast-ideas', 'food', 'नाश्ते में शामिल करें ये आसान और पौष्टिक विकल्प, विशेषज्ञों ने बताए फायदे',
    'दिन की शुरुआत पौष्टिक नाश्ते से करने के लिए घर पर आसानी से तैयार होने वाले कई विकल्प मौजूद हैं।',
    'विशेषज्ञ संतुलित भोजन में प्रोटीन, फाइबर और पर्याप्त पानी शामिल करने की सलाह देते हैं।', 'sub-recipes', 4, 31500, 'a3',
    'पौष्टिक नाश्ते के आसान विकल्प और जरूरी सुझाव।'],
  ['festive-markets', 'dharm', 'त्योहार से पहले बाज़ारों में रौनक, परंपरा और आधुनिकता का अनोखा संगम',
    'त्योहारी सीज़न से पहले बाज़ारों में ख़रीदारों की भीड़ उमड़ पड़ी है और दुकानें रोशनी से जगमगा रही हैं।',
    'दुकानदारों का कहना है कि इस बार बिक्री पिछले साल से बेहतर रहने की उम्मीद है।', null, 20, 12700, 'a3',
    'बाज़ारों में त्योहार की रौनक, दुकानदार उत्साहित।'],
];

const hoursAgo = (h: number) => new Date(Date.now() - h * 3600 * 1000).toISOString();

export const MOCK_ARTICLES: Article[] = SEEDS.map(([slug, c, title, lead, p2, subId, h, views, aid, excerpt], i) => {
  const blocks: Block[] = [{ type: 'p', text: lead }, { type: 'p', text: p2 }, ...SHARED];
  return {
    id: `art-${i + 1}`, title_hi: title, slug,
    content_hi: { type: 'doc', blocks, md: blocksToMarkdown(blocks) },
    excerpt_hi: excerpt,
    featured_image: `https://picsum.photos/seed/${slug}/1200/675`,
    status: 'published', author_id: aid, author_name: AUTHORS[aid],
    category_id: `cat-${c}`, category_slug: c, category_name: catName(c),
    sub_category_id: subId, views, published_at: hoursAgo(h),
  };
});

MOCK_ARTICLES.push({
  ...MOCK_ARTICLES[2],
  id: 'blog-demo-1',
  slug: 'mera-pehla-digital-anubhav',
  title_hi: 'मेरा पहला डिजिटल अनुभव: बदलती दुनिया को करीब से देखने की कहानी',
  excerpt_hi: 'एक पाठक की नज़र से तकनीक, समाज और रोज़मर्रा की ज़िंदगी में हो रहे बदलावों पर व्यक्तिगत अनुभव।',
  author_name: 'नेहा शर्मा',
  is_blog: true,
});

/** लेखक डैशबोर्ड और अप्रूवल क्यू के डेमो लेख */
export const MOCK_PENDING: Article[] = [
  ['pend-1', 'शहर में नई साइकिल लेन से बदलेगा सफ़र, पर्यावरण को मिलेगा फ़ायदा', 'lifestyle', 'pending'],
  ['pend-2', 'ज़िला स्तरीय कबड्डी प्रतियोगिता में ग्रामीण टीमों का दबदबा', 'khel', 'pending'],
  ['pend-3', 'स्टार्टअप फ़ंडिंग में आई तेज़ी, छोटे शहरों से निकल रहे नए आइडिया', 'business', 'pending'],
].map(([id, title, c, status], i) => {
  const blocks: Block[] = [
    { type: 'p', text: 'यह एक समीक्षाधीन लेख का डेमो है। लेखक ने इसे प्रकाशन के लिए भेजा है और संपादकीय टीम की मंज़ूरी का इंतज़ार है।' },
    { type: 'p', text: 'लेख में आगे घटनाक्रम का ब्योरा, संबंधित पक्षों के बयान और विशेषज्ञों की राय शामिल की जाएगी।' },
    ...SHARED.slice(0, 3),
  ];
  return {
    id, title_hi: title, slug: id, content_hi: { type: 'doc', blocks, md: blocksToMarkdown(blocks) },
    excerpt_hi: 'समीक्षा के लिए भेजा गया डेमो लेख।', featured_image: `https://picsum.photos/seed/${id}/1200/675`,
    status: status as Article['status'], author_id: `a${(i % 3) + 1}`, author_name: AUTHORS[`a${(i % 3) + 1}`],
    category_id: `cat-${c}`, category_slug: c as string, category_name: catName(c as string),
    sub_category_id: null, views: 0, published_at: hoursAgo(i + 1),
  };
});

export const MOCK_AUTHOR_ARTICLES: Article[] = [
  { ...MOCK_PENDING[0], id: 'mine-1', slug: 'mine-1', status: 'draft', title_hi: 'मेरा ड्राफ़्ट: शहर में बारिश के बाद जलभराव की समस्या' },
  { ...MOCK_PENDING[1], id: 'mine-2', slug: 'mine-2', status: 'pending' },
  { ...MOCK_ARTICLES[0], id: 'mine-3', slug: 'mine-3', status: 'rejected', rejection_note: 'कृपया स्रोतों का उल्लेख जोड़ें और शीर्षक छोटा करें।' },
];

const placeholderAd = '';
export const MOCK_ADS: AdSlot[] = [
  { id: 'ad-1', slot_key: 'header-leaderboard', slot_type: 'header', ad_code: placeholderAd, is_enabled: true, publisher_id: '' },
  { id: 'ad-2', slot_key: 'sidebar-sticky', slot_type: 'sidebar_sticky', ad_code: placeholderAd, is_enabled: true, publisher_id: '' },
  { id: 'ad-3', slot_key: 'in-article-1', slot_type: 'in_article', ad_code: placeholderAd, is_enabled: true, publisher_id: '' },
  { id: 'ad-4', slot_key: 'footer-banner', slot_type: 'footer', ad_code: placeholderAd, is_enabled: false, publisher_id: '' },
];

export const MOCK_SETTINGS: SiteSettings = {
  site_name: 'दैनिक पत्रिका',
  logo_url: null,
  favicon_url: null,
  theme: { accent: '#e2231a', ink: '#111827' },
  seo: {
    title: 'दैनिक पत्रिका | ताज़ा ख़बरें, ब्रेकिंग न्यूज़ हिंदी में',
    description: 'देश, दुनिया, खेल, मनोरंजन और बिजनेस की हर बड़ी ख़बर — सबसे पहले, सबसे सटीक, हिंदी में।',
    keywords: 'हिंदी समाचार, ताज़ा ख़बर, ब्रेकिंग न्यूज़, दैनिक पत्रिका',
    og_image: '',
  },
  header_nav: [{ label: 'हमारे कार्य', href: '/hamare-karya' }],
  footer_nav: [
    { label: 'हमारे बारे में', href: '/hamare-karya' },
    { label: 'गोपनीयता नीति', href: '#' },
    { label: 'संपर्क करें', href: '#' },
    { label: 'विज्ञापन दें', href: '#' },
  ],
  static_pages: [{ slug: 'about', title: 'हमारे बारे में', body: 'दैनिक पत्रिका एक स्वतंत्र हिंदी डिजिटल समाचार मंच है।' }],
};

export const MOCK_PORTFOLIO: PortfolioProject[] = [
  { id: 'p1', client_name: 'भारत भ्रमण ट्रैवल्स', project_type: 'ट्रैवल पोर्टल', thumbnail_url: 'https://picsum.photos/seed/travel/800/500', live_url: 'https://example.com',
    description_hi: 'पर्यटन कंपनी के लिए बुकिंग-रेडी हिंदी वेबसाइट।',
    case_study_markdown: '## चुनौती\n\nकंपनी की साइट मोबाइल पर धीमी थी।\n\n## समाधान\n\nNext.js आधारित नया फ्रंटएंड और Supabase बैकएंड।\n\n- लोड समय 70% कम\n- बुकिंग में 2.1 गुना बढ़ोतरी' },
  { id: 'p2', client_name: 'शिक्षा सेतु', project_type: 'एड-टेक प्लेटफ़ॉर्म', thumbnail_url: 'https://picsum.photos/seed/edu/800/500', live_url: 'https://example.com',
    description_hi: 'ग्रामीण छात्रों के लिए हिंदी माध्यम ऑनलाइन कक्षाएँ।',
    case_study_markdown: '## लक्ष्य\n\nहिंदी माध्यम के छात्रों को सरल डिजिटल कक्षाएँ देना।\n\n> पहले तीन महीनों में 40,000 से अधिक पंजीकरण।' },
  { id: 'p3', client_name: 'स्वाद घर', project_type: 'रेस्टोरेंट ब्रांडिंग', thumbnail_url: 'https://picsum.photos/seed/food/800/500', live_url: 'https://example.com',
    description_hi: 'रेस्टोरेंट चेन के लिए ब्रांड पहचान और ऑनलाइन ऑर्डरिंग।',
    case_study_markdown: '## परिणाम\n\nऑनलाइन ऑर्डर कुल बिक्री का 35% बने।' },
];

export const MOCK_PROFILES: Profile[] = [
  ['u1', 'आरती सिंह', 'arti@example.com', 'super_admin'],
  ['u2', 'मोहन लाल', 'mohan@example.com', 'admin'],
  ['a1', 'रवि कुमार', 'ravi@example.com', 'author'],
  ['a2', 'सुनीता शर्मा', 'sunita@example.com', 'author'],
  ['a3', 'अमित वर्मा', 'amit@example.com', 'author'],
  ['u6', 'नेहा गुप्ता', 'neha@example.com', 'public_visitor'],
  ['u7', 'विकास यादव', 'vikas@example.com', 'public_visitor'],
  ['u8', 'पूजा मिश्रा', 'pooja@example.com', 'public_visitor'],
].map(([id, display_name, email, role], i) => ({
  id, display_name, email, role: role as Profile['role'], created_at: hoursAgo(24 * (30 - i * 3)),
}));

export const MOCK_STORIES: Story[] = [
  { id: 's1', title: 'शहर की सुबह', cover: 'https://picsum.photos/seed/story1/400/700',
    slides: [
      { image: 'https://picsum.photos/seed/story1a/720/1280', text: 'सुबह की पहली किरण के साथ जाग उठा शहर।' },
      { image: 'https://picsum.photos/seed/story1b/720/1280', text: 'चाय की दुकानों पर शुरू हुई दिन की पहली चर्चा।' },
      { image: 'https://picsum.photos/seed/story1c/720/1280', text: 'मेट्रो स्टेशनों पर बढ़ने लगी यात्रियों की भीड़।' },
    ] },
  { id: 's2', title: 'खेल के मैदान से', cover: 'https://picsum.photos/seed/story2/400/700',
    slides: [
      { image: 'https://picsum.photos/seed/story2a/720/1280', text: 'फाइनल की जीत का जश्न मनाते खिलाड़ी।' },
      { image: 'https://picsum.photos/seed/story2b/720/1280', text: 'स्टेडियम में गूँजा तिरंगे का जोश।' },
    ] },
  { id: 's3', title: 'त्योहारी रौनक', cover: 'https://picsum.photos/seed/story3/400/700',
    slides: [
      { image: 'https://picsum.photos/seed/story3a/720/1280', text: 'रोशनी से जगमगाए बाज़ार।' },
      { image: 'https://picsum.photos/seed/story3b/720/1280', text: 'मिठाइयों की दुकानों पर लगी लंबी कतारें।' },
      { image: 'https://picsum.photos/seed/story3c/720/1280', text: 'रंगोली और दीयों से सजे घर-आँगन।' },
    ] },
  { id: 's4', title: 'टेक की दुनिया', cover: 'https://picsum.photos/seed/story4/400/700',
    slides: [
      { image: 'https://picsum.photos/seed/story4a/720/1280', text: 'नया स्मार्टफोन बना चर्चा का केंद्र।' },
      { image: 'https://picsum.photos/seed/story4b/720/1280', text: 'एआई से बदलती कक्षाएँ।' },
    ] },
  { id: 's5', title: 'सेहत की बातें', cover: 'https://picsum.photos/seed/story5/400/700',
    slides: [
      { image: 'https://picsum.photos/seed/story5a/720/1280', text: 'सर्दियों में रोज़ सुबह टहलना फ़ायदेमंद।' },
      { image: 'https://picsum.photos/seed/story5b/720/1280', text: 'मौसमी फल और सब्ज़ियाँ बढ़ाएँ।' },
    ] },
  { id: 's6', title: 'सफ़र और सैर', cover: 'https://picsum.photos/seed/story6/400/700',
    slides: [
      { image: 'https://picsum.photos/seed/story6a/720/1280', text: 'पहाड़ों पर बर्फ़बारी का नज़ारा।' },
      { image: 'https://picsum.photos/seed/story6b/720/1280', text: 'समंदर किनारे की शांत शाम।' },
    ] },
];
