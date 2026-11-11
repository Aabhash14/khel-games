// Know Me: content, in English and Nepali. Every text is [en, ne].
// Axis scores: positive = first pole (a), negative = second pole (b).

const COLORS = {
  bold: '#ff5a36', steady: '#10b39c',
  social: '#ffbf1a', solo: '#7b61ff',
  head: '#139bff', heart: '#ff4f9a',
  plan: '#34c759', flow: '#b45cff',
};

const AXES = [
  { id: 'd', a: { key: 'B', label: ['Bold', 'साहसी'], color: 'bold' },    b: { key: 'S', label: ['Steady', 'स्थिर'], color: 'steady' } },
  { id: 'e', a: { key: 'O', label: ['Social', 'सामाजिक'], color: 'social' }, b: { key: 'I', label: ['Solo', 'एकल'], color: 'solo' } },
  { id: 'c', a: { key: 'H', label: ['Head', 'दिमाग'], color: 'head' },    b: { key: 'R', label: ['Heart', 'मन'], color: 'heart' } },
  { id: 'p', a: { key: 'P', label: ['Planner', 'योजना'], color: 'plan' },  b: { key: 'F', label: ['Flow', 'बहाव'], color: 'flow' } },
];

// id: never reuse or renumber (challenge links store them, one base-36 character each, so 0-35 max).
// Every question is a real situation; the 4 answers are 4 different moves, not a scale of the same one.
// o: [en, ne, effects]. Main-axis weights per question: +2, +1, -1, -2.
const SCENARIOS = [
  // Drive (Bold / Steady)
  { id: 0, axis: 'd', q: ['Friend texts: “Secret trip. Bus leaves in 3 hours.”', 'साथीको म्यासेज: “सिक्रेट ट्रिप। ३ घण्टामा बस छुट्छ।”'], o: [
    ['Packing already. Don’t tell me where.', 'प्याक गर्दैछु। कहाँ भनेर नभन।', { d: 2, p: -1 }],
    ['Who else is coming? Then I’m in.', 'अरू को-को जाँदैछ? अनि म पनि।', { d: 1, e: 1 }],
    ['Asking my parents first.', 'पहिले घरमा सोध्छु।', { d: -1, p: 1 }],
    ['Sending “have fun” and a pic of my bed.', '“रमाइलो गर” र मेरो बेडको फोटो पठाउँछु।', { d: -2, e: -1 }],
  ] },
  { id: 1, axis: 'd', q: ['One dish on the menu. Nobody can even read its name.', 'मेनुमा एउटा डिस छ। कसैले नाम नै पढ्न सक्दैन।'], o: [
    ['Ordering it. Obviously.', 'त्यही अर्डर। पक्का।', { d: 2 }],
    ['Ask what is in it first.', 'पहिले के-के हाल्छ सोध्छु।', { d: 1, c: 1 }],
    ['Get whatever sells the most.', 'जुन सबैभन्दा बिक्छ, त्यही।', { d: -1, e: 1 }],
    ['Momo. I came to eat, not to gamble.', 'मःम। खान आएको, जुवा खेल्न होइन।', { d: -2 }],
  ] },
  { id: 2, axis: 'd', q: ['School team tryouts are today. You have not practised.', 'आज स्कूल टिमको छनोट छ। तिमीले अभ्यास गरेका छैनौ।'], o: [
    ['Going. Worst case, a funny story.', 'जान्छु। नभए एउटा रमाइलो कथा त बन्छ।', { d: 2 }],
    ['Practise at lunch, then go.', 'टिफिनमा अभ्यास, अनि जान्छु।', { d: 1, p: 1 }],
    ['Skip it. Train properly for next year.', 'यसपालि छोड्छु। अर्को वर्षका लागि राम्ररी तयारी।', { d: -1, p: 1 }],
    ['Go cheer for my friend instead.', 'बरु साथीलाई चियर गर्न जान्छु।', { d: -2, c: -1 }],
  ] },
  { id: 3, axis: 'd', q: ['Your phone dies in a city you have never been to.', 'नयाँ सहरमा फोनको ब्याट्री सकियो।'], o: [
    ['Wander around. Getting lost is fun.', 'डुल्छु। हराउनु पनि मज्जा हो।', { d: 2, p: -1 }],
    ['Ask random people for directions.', 'अपरिचितलाई बाटो सोध्छु।', { d: 1, e: 1 }],
    ['Relax, I memorised the route.', 'ढुक्क, बाटो मैले याद गरिसकेको छु।', { d: -1, p: 2 }],
    ['Find a café and charge it.', 'कुनै क्याफे खोजेर चार्ज गर्छु।', { d: -2 }],
  ] },
  { id: 4, axis: 'd', q: ['Friend: “Let’s sell our own T-shirts.” You have Rs 5,000 saved.', 'साथी: “आफ्नै टी-सर्ट बेचौं।” तिमीसँग रु ५,००० बचत छ।'], o: [
    ['In. Designing tonight.', 'म तयार। आजै डिजाइन।', { d: 2, p: -1 }],
    ['In, but we test 10 shirts first.', 'तयार, तर पहिले १० वटा बेचेर हेरौं।', { d: 1, p: 1 }],
    ['First: how do we split the money?', 'पहिले भनौं: पैसा कसरी बाँड्ने?', { d: -1, c: 2 }],
    ['Keeping my money. I’ll buy one shirt.', 'पैसा आफैंसँग राख्छु। एउटा सर्ट किनिदिन्छु।', { d: -2, c: -1 }],
  ] },
  { id: 5, axis: 'd', q: ['The fair ride looks a bit... homemade.', 'मेलाको झुला अलि... घरमै बनाएको जस्तो छ।'], o: [
    ['Front seat. Hands up.', 'अगाडिको सिट। हात माथि।', { d: 2 }],
    ['Only if my friend sits with me.', 'साथी सँगै बसे मात्र।', { d: 1, e: 1 }],
    ['Watch one round first.', 'पहिले एक राउन्ड हेर्छु।', { d: -1, c: 1 }],
    ['I will hold everyone’s bags.', 'सबैको झोला म समात्छु।', { d: -2 }],
  ] },
  { id: 24, axis: 'd', q: ['Teacher asks a question. You think you know, but you’re not sure.', 'शिक्षकले प्रश्न सोध्नुभयो। उत्तर आउँछ जस्तो छ, तर पक्का छैन।'], o: [
    ['Hand up. Fast.', 'तुरुन्तै हात उठाउँछु।', { d: 2 }],
    ['Say it out loud like a joke.', 'ठट्टा जसरी ठूलो स्वरले भन्छु।', { d: 1, e: 1 }],
    ['Wait for someone else to try first.', 'पहिले अरूले भनून् भनेर पर्खन्छु।', { d: -1 }],
    ['Write it down. Right, but privately.', 'कापीमा लेख्छु। मनमनै सही।', { d: -2, e: -1 }],
  ] },
  { id: 25, axis: 'd', q: ['Friends want to check out the “haunted” empty house at night.', 'साथीहरू राति “भूत लाग्ने” खाली घर हेर्न जाने रे।'], o: [
    ['Leading the way with my phone torch.', 'फोनको टर्च बालेर अगाडि म।', { d: 2, e: 1 }],
    ['Go, and hide to scare the others.', 'जान्छु, अनि लुकेर अरूलाई तर्साउँछु।', { d: 1, p: -1 }],
    ['Wait outside and keep watch.', 'बाहिरै बसेर पहरा दिन्छु।', { d: -1, c: 1 }],
    ['Going home. Ghosts or not, it’s someone’s house.', 'घर जान्छु। भूत होस् या नहोस्, अरूको घर हो।', { d: -2, c: 1 }],
  ] },
  { id: 26, axis: 'd', q: ['Dashain kite fight. Your kite is losing.', 'दशैंमा चङ्गा लडाइँ। तिम्रो चङ्गा हार्दैछ।'], o: [
    ['Go for the cut. All or nothing.', 'चेट हान्छु। कि जित, कि हार।', { d: 2 }],
    ['Try the trick I saw a senior do.', 'सिनियरले गरेको ट्रिक चलाउँछु।', { d: 1, c: 1 }],
    ['Pull it down. Save the kite.', 'तानेर झार्छु। चङ्गा बचाउँछु।', { d: -1, p: 1 }],
    ['Hand the string to my cousin.', 'धागो कजिनलाई दिन्छु।', { d: -2, e: 1 }],
  ] },

  // Energy (Social / Solo)
  { id: 6, axis: 'e', q: ['Party dare: sing solo on the mic.', 'पार्टीमा डेयर: एक्लै माइकमा गाउनु पर्ने।'], o: [
    ['Grab the mic. Instantly.', 'तुरुन्तै माइक समात्छु।', { e: 2, d: 1 }],
    ['Only if someone sings with me.', 'कोही सँगै गाए मात्र।', { e: 1 }],
    ['Pass. I’ll pick the next victim.', 'पास। अर्को सिकार म छान्छु।', { e: -1, d: 1 }],
    ['No way. I will film it.', 'कहिल्यै होइन। म भिडियो खिच्छु।', { e: -2 }],
  ] },
  { id: 7, axis: 'e', q: ['Your Friday plans just got cancelled.', 'शुक्रबारको प्लान क्यान्सिल भयो।'], o: [
    ['Text five people. Something will happen.', 'पाँच जनालाई म्यासेज। केही त हुन्छ।', { e: 2, p: -1 }],
    ['Invite one close friend over.', 'एउटा मिल्ने साथीलाई बोलाउँछु।', { e: 1 }],
    ['Finally, time for my own project.', 'ल, आफ्नो काम गर्ने समय मिल्यो।', { e: -1, p: 1 }],
    ['Secretly happy. Blanket and snacks.', 'भित्रभित्रै खुसी। कम्बल र खाजा।', { e: -2 }],
  ] },
  { id: 8, axis: 'e', q: ['A party where you only know the host.', 'पार्टीमा होस्टबाहेक कसैलाई चिन्दैनौ।'], o: [
    ['Say hi to the biggest group.', 'सबैभन्दा ठूलो समूहलाई हाइ भन्छु।', { e: 2, d: 1 }],
    ['Find someone standing alone. Talk to them.', 'एक्लै उभिएको कोही खोजेर गफ गर्छु।', { e: 1, c: -1 }],
    ['Help the host. Having a job makes it easier.', 'होस्टलाई सघाउँछु। काम भए सजिलो।', { e: -1, p: 1 }],
    ['Find the dog. Befriend the dog.', 'कुकुर खोज्छु। कुकुरसँग साथी।', { e: -2, c: -1 }],
  ] },
  { id: 9, axis: 'e', q: ['A new student’s first day. They sit next to you, very quiet.', 'नयाँ विद्यार्थीको पहिलो दिन। तिम्रो छेउको सिट, एकदम चुप।'], o: [
    ['Show them around. Introduce everyone.', 'सबैतिर घुमाउँछु। सबैसँग चिनाउँछु।', { e: 2 }],
    ['Ask what music they like.', 'कस्तो गीत मन पर्छ भनेर सोध्छु।', { e: 1 }],
    ['Smile and slide over my notes.', 'मुस्कुराएर आफ्नो नोट दिन्छु।', { e: -1, c: -1 }],
    ['Give them space. First days are a lot.', 'ठाउँ दिन्छु। पहिलो दिन गाह्रो हुन्छ।', { e: -2 }],
  ] },
  { id: 10, axis: 'e', q: ['Cousin’s wedding. 300 guests. You know 6.', 'कजिनको बिहे। ३०० पाहुना। चिनेको ६ जना।'], o: [
    ['Dance floor. I’ll know 300 by the end.', 'डान्स फ्लोर। अन्त्यसम्म ३०० जना चिन्छु।', { e: 2, d: 1 }],
    ['Stick with my cousins and gossip.', 'कजिनहरूसँगै बसेर गफ।', { e: 1 }],
    ['Help in the kitchen. Fewer people, better food.', 'भान्सामा सघाउँछु। मान्छे कम, खाना राम्रो।', { e: -1, p: 1 }],
    ['Corner seat, phone, wait for dinner.', 'कुनाको सिट, फोन, खानाको पर्खाइ।', { e: -2 }],
  ] },
  { id: 11, axis: 'e', q: ['Unknown number calling.', 'नचिनेको नम्बरबाट फोन आयो।'], o: [
    ['Answer. Could be fun.', 'उठाउँछु। मज्जा हुन सक्छ।', { e: 2, d: 1 }],
    ['Answer, but stay silent first.', 'उठाउँछु, तर पहिले चुप।', { e: 1, c: 1 }],
    ['Ignore it, then search the number.', 'उठाउँदिनँ, पछि नम्बर खोज्छु।', { e: -1, p: 1 }],
    ['Ignore. If it matters, they will text.', 'उठाउँदिनँ। जरुरी भए म्यासेज आउँछ।', { e: -2 }],
  ] },
  { id: 27, axis: 'e', q: ['The class group chat is going crazy at 11pm.', 'राति ११ बजे क्लासको ग्रुप च्याट तातेको छ।'], o: [
    ['Jump in with memes.', 'मिम लिएर पसिहाल्छु।', { e: 2, p: -1 }],
    ['One joke, then sleep.', 'एउटा जोक, अनि सुत्छु।', { e: 1, p: 1 }],
    ['Read it all. Say nothing.', 'सबै पढ्छु, केही बोल्दिनँ।', { e: -1, c: 1 }],
    ['Muted since day one.', 'पहिलो दिनदेखि म्युट।', { e: -2 }],
  ] },
  { id: 28, axis: 'e', q: ['You win a prize and have to go up on stage.', 'पुरस्कार जित्यौ, स्टेजमा जानुपर्ने।'], o: [
    ['Wave, bow, maybe a speech.', 'हात हल्लाउने, नमस्ते, सायद भाषण पनि।', { e: 2, d: 1 }],
    ['Point at my friends and shout their names.', 'साथीहरूतिर देखाएर नाम कराउँछु।', { e: 1 }],
    ['Grab it and walk off fast.', 'लिन्छु र छिटो ओर्लिन्छु।', { e: -1 }],
    ['Ask a friend to collect it for me.', 'साथीलाई लिइदेऊ भन्छु।', { e: -2, d: -1 }],
  ] },
  { id: 29, axis: 'e', q: ['Five-hour bus ride to the village.', 'गाउँसम्म पाँच घण्टाको बस यात्रा।'], o: [
    ['Chat with whoever sits next to me.', 'छेउमा बस्ने जोसुकैसँग गफ।', { e: 2 }],
    ['Share earphones with my friend.', 'साथीसँग इयरफोन बाँड्छु।', { e: 1 }],
    ['Window seat, music, hills.', 'झ्यालको सिट, गीत, पहाड।', { e: -1, c: -1 }],
    ['Sleep. Wake me up when we’re there.', 'सुत्छु। पुगेपछि उठाइदेऊ।', { e: -2, p: -1 }],
  ] },

  // Compass (Head / Heart)
  { id: 12, axis: 'c', q: ['Your friend’s new logo is... not good.', 'साथीको नयाँ लोगो... राम्रो छैन।'], o: [
    ['Tell them straight.', 'सिधै भन्छु।', { c: 2, d: 1 }],
    ['Suggest one fix, gently.', 'बिस्तारै एउटा सुझाव दिन्छु।', { c: 1 }],
    ['Start with what is good about it.', 'पहिले राम्रो कुरा भन्छु।', { c: -1 }],
    ['“I love it!” (I do not.)', '“एकदम राम्रो!” (होइन।)', { c: -2 }],
  ] },
  { id: 13, axis: 'c', q: ['A friend is venting. You know exactly how to fix it.', 'साथी आफ्नो दुःख सुनाउँदैछ। उपाय तिमीलाई थाहा छ।'], o: [
    ['Give them the 3-step fix right away.', 'तुरुन्तै ३ स्टेपको उपाय।', { c: 2 }],
    ['Ask: advice, or should I just listen?', 'सोध्छु: सल्लाह चाहियो कि सुनूँ मात्र?', { c: 1, p: 1 }],
    ['Tell them it happened to me too.', 'मलाई पनि यस्तै भएको थियो भन्छु।', { c: -1, e: 1 }],
    ['Just listen, and get angry with them.', 'सुन्छु, र उसको पक्षमा रिसाउँछु।', { c: -2 }],
  ] },
  { id: 14, axis: 'c', q: ['You find a wallet with cash and an ID inside.', 'पैसा र आइडी भएको पर्स भेटियो।'], o: [
    ['Return it, keep a small reward. Fair.', 'फर्काउँछु, अलिकति इनाम राख्छु। ठिकै त हो।', { c: 2, d: 1 }],
    ['Hand it to the police.', 'प्रहरीलाई बुझाउँछु।', { c: 1, p: 1 }],
    ['Find them online and message them.', 'अनलाइन खोजेर म्यासेज गर्छु।', { c: -1, e: -1 }],
    ['Return it in person. I want to see them smile.', 'आफैं गएर दिन्छु। उसको खुसी हेर्न।', { c: -2, e: 1 }],
  ] },
  { id: 15, axis: 'c', q: ['Two friends fight. Both send you their side.', 'दुई साथीबीच झगडा भयो। दुवैले आफ्नो कुरा पठाए।'], o: [
    ['Screenshots, please. Facts first.', 'स्क्रिनसट देखाओ। पहिले तथ्य।', { c: 2 }],
    ['Put them in one chat to sort it out.', 'दुवैलाई एउटै च्याटमा राखेर मिलाउँछु।', { c: 1, e: 1 }],
    ['Comfort whoever is more upset.', 'जो बढी दुखी छ, उसलाई सम्झाउँछु।', { c: -1 }],
    ['Stay out of it. I love them both.', 'बीचमा पर्दिनँ। दुवै प्यारा।', { c: -2, e: -1 }],
  ] },
  { id: 16, axis: 'c', q: ['Your friend wants to copy your homework. Again.', 'साथीलाई फेरि तिम्रो होमवर्क सार्नु छ।'], o: [
    ['No. They need to learn it.', 'अहँ। उसले आफैं सिक्नुपर्छ।', { c: 2, d: 1 }],
    ['I’ll explain it instead.', 'बरु बुझाइदिन्छु।', { c: 1, e: 1 }],
    ['Send it. Last time. (It’s not.)', 'पठाइदिन्छु। अन्तिम पटक। (होइन।)', { c: -1 }],
    ['Send it with a sticker. Friends help friends.', 'स्टिकरसहित पठाउँछु। साथी भनेको यही हो।', { c: -2, e: 1 }],
  ] },
  { id: 17, axis: 'c', q: ['Your team loses because of one player’s mistake.', 'एक जनाको गल्तीले टिम हार्यो।'], o: [
    ['Check the stats. It was not just them.', 'तथ्यांक हेर्छु। उसको मात्र गल्ती होइन।', { c: 2 }],
    ['Talk it through so it does not happen again.', 'फेरि नहोस् भनेर कुरा गर्छु।', { c: 1, p: 1 }],
    ['Send them a “don’t worry” text.', '“चिन्ता नगर” भनेर म्यासेज।', { c: -1, e: -1 }],
    ['Nobody loses alone. Pizza on me.', 'हार सबैको हो। पिज्जा मेरो तर्फबाट।', { c: -2, e: 1 }],
  ] },
  { id: 30, axis: 'c', q: ['Your little cousin breaks Mum’s favourite cup. “Please don’t tell!”', 'सानो कजिनबाट आमाको मनपर्ने कप फुट्यो। “प्लिज नभन!”'], o: [
    ['Tell the truth. Hiding makes it worse.', 'सत्य भन्छु। लुकाए झन् बिग्रिन्छ।', { c: 2 }],
    ['Help them say sorry together.', 'सँगै गएर सरी भन्न सघाउँछु।', { c: 1, e: 1 }],
    ['Glue it and hope.', 'ग्लुले टाँसेर आशा गर्छु।', { c: -1, p: -1 }],
    ['Say I broke it. Protect the kid.', 'मैले फुटाएँ भन्छु। सानोलाई बचाउँछु।', { c: -2, d: 1 }],
  ] },
  { id: 31, axis: 'c', q: ['Everyone online is buying a “life-changing” gadget.', 'अनलाइनमा सबैले “जिन्दगी बदल्ने” ग्याजेट किन्दैछन्।'], o: [
    ['Check reviews and the old price.', 'रिभ्यु र पुरानो मूल्य जाँच्छु।', { c: 2, p: 1 }],
    ['Ask a friend who already has one.', 'किनिसकेको साथीलाई सोध्छु।', { c: 1, e: 1 }],
    ['Buy it. The video felt so real.', 'किन्छु। भिडियो एकदम सच्चा लाग्यो।', { c: -1, d: 1 }],
    ['Buy two. One for my best friend.', 'दुईटा किन्छु। एउटा बेस्टीलाई।', { c: -2, e: 1 }],
  ] },
  { id: 32, axis: 'c', q: ['Your best friend’s birthday. What gift?', 'बेस्टीको जन्मदिन। के उपहार?'], o: [
    ['Something useful they actually need.', 'साँच्चै काम लाग्ने चीज।', { c: 2 }],
    ['Ask their family what they want.', 'उसको घरमा सोध्छु के चाहिएको छ।', { c: 1, p: 1 }],
    ['A handmade card full of old photos.', 'पुराना फोटोले भरिएको हातले बनाएको कार्ड।', { c: -1, p: 1 }],
    ['A surprise that makes them cry (happy).', 'रुवाउने सरप्राइज (खुसीले)।', { c: -2, d: 1 }],
  ] },

  // Pace (Planner / Flow)
  { id: 18, axis: 'p', q: ['“Storage full.” Again.', '“स्टोरेज फुल।” फेरि।'], o: [
    ['Back up and sort everything properly.', 'सबै ब्याकअप गरेर मिलाउँछु।', { p: 2 }],
    ['Delete the biggest apps first.', 'सबैभन्दा ठूला एप पहिले हटाउँछु।', { p: 1, c: 1 }],
    ['Delete random photos till it works.', 'जे पायो त्यही फोटो डिलिट।', { p: -1 }],
    ['Ignore it. The phone will survive.', 'वास्ता गर्दिनँ। फोन बाँचिहाल्छ।', { p: -2, d: 1 }],
  ] },
  { id: 19, axis: 'p', q: ['Exam in one week. Your move?', 'एक हप्तामा परीक्षा। तिम्रो चाल?'], o: [
    ['Timetable on the wall. Tick every day.', 'भित्तामा टाइमटेबल। दिनदिनै टिक।', { p: 2 }],
    ['Study with a friend so we both show up.', 'साथीसँग पढ्छु, दुवैले नछोडौं भनेर।', { p: 1, e: 1 }],
    ['Quick videos the day before.', 'अघिल्लो दिन छोटा भिडियो।', { p: -1, c: 1 }],
    ['Night before. Chiya, panic, magic.', 'अघिल्लो रात। चिया, आत्तिने, जादु।', { p: -2, d: 1 }],
  ] },
  { id: 20, axis: 'p', q: ['Guests arrive in 10 minutes. Your room?', '१० मिनेटमा पाहुना आउँदैछन्। तिम्रो कोठा?'], o: [
    ['Already clean. No stress.', 'सफा नै छ। टेन्सन छैन।', { p: 2 }],
    ['10-minute speed clean. Done.', '१० मिनेटको फटाफट सफाइ। सकियो।', { p: 1, d: 1 }],
    ['Everything goes in the cupboard.', 'सबै दराजमा कोच्छु।', { p: -1 }],
    ['Close the door. Nobody goes in.', 'ढोका बन्द। कोही भित्र छिर्दैन।', { p: -2, e: -1 }],
  ] },
  { id: 21, axis: 'p', q: ['The group cannot decide where to eat.', 'कहाँ खाने भनेर ग्रुपले टुंगो लगाउन सकेन।'], o: [
    ['Pick a place, book it, done.', 'ठाउँ छान्छु, बुक गर्छु, सकियो।', { p: 2, d: 1 }],
    ['Send a poll.', 'पोल पठाउँछु।', { p: 1, e: 1 }],
    ['“Anything works.” And I mean it.', '“जे भए पनि हुन्छ।” साँच्चै।', { p: -1, c: -1 }],
    ['Walk until something smells good.', 'राम्रो बास्ना आउने ठाउँसम्म हिँडौं।', { p: -2, d: 1 }],
  ] },
  { id: 22, axis: 'p', q: ['Someone changes your weekend plan last minute.', 'कसैले अन्तिम घडीमा बिदाको प्लान फेर्यो।'], o: [
    ['Annoyed. I had it all planned.', 'रिस उठ्छ। सबै मिलाइसकेको थिएँ।', { p: 2 }],
    ['Ask why, then adjust.', 'किन भनेर सोध्छु, अनि मिलाउँछु।', { p: 1, c: 1 }],
    ['Cool. New plan.', 'ठिक छ। नयाँ प्लान।', { p: -1 }],
    ['What plan? I never had one.', 'कुन प्लान? मेरो त थिएन।', { p: -2, d: 1 }],
  ] },
  { id: 23, axis: 'p', q: ['You need a new phone.', 'नयाँ फोन किन्नु छ।'], o: [
    ['Read 12 reviews and compare specs.', '१२ वटा रिभ्यु पढ्छु, स्पेक तुलना गर्छु।', { p: 1, c: 2 }],
    ['Same brand as always. It works.', 'सधैँ जस्तै उही ब्रान्ड। चल्छ।', { p: 1, d: -2 }],
    ['The one that feels nice in my hand.', 'हातमा राम्रो लाग्ने छान्छु।', { p: -1, c: -1 }],
    ['Whatever is on sale. Done in 5 minutes.', 'जुन सेलमा छ, ५ मिनेटमा सकियो।', { p: -2, d: 1 }],
  ] },
  { id: 33, axis: 'p', q: ['15 minutes to get to school.', 'स्कूल पुग्न १५ मिनेट बाँकी।'], o: [
    ['Bag packed last night. Walking out calm.', 'ब्याग हिजै प्याक। ढुक्कले निस्कन्छु।', { p: 2 }],
    ['Quick check: ID, bag, lunch. Go.', 'छिटो जाँच: आइडी, ब्याग, टिफिन। हिँड।', { p: 1 }],
    ['Run. Eat on the way.', 'दौडिन्छु। बाटोमै खाजा।', { p: -1, d: 1 }],
    ['Wait… is today even a school day?', 'पख… आज स्कूल छ र?', { p: -2 }],
  ] },
  { id: 34, axis: 'p', q: ['You get Rs 2,000 at Dashain tika.', 'दशैंको टीकामा रु २,००० दक्षिणा पायौ।'], o: [
    ['Save half. Plan the rest.', 'आधा बचत। बाँकीको प्लान।', { p: 2, c: 1 }],
    ['Buy the thing I’ve wanted for months.', 'महिनौंदेखि चाहेको चीज किन्छु।', { p: 1 }],
    ['Treat my friends. Money is for fun.', 'साथीहरूलाई खुवाउँछु। पैसा रमाइलोका लागि हो।', { p: -1, e: 1 }],
    ['It’s gone. No idea where.', 'सकियो। कहाँ गयो थाहा छैन।', { p: -2 }],
  ] },
  { id: 35, axis: 'p', q: ['Packing for a 3-day school trip.', '३ दिनको स्कूल ट्रिपका लागि प्याकिङ।'], o: [
    ['Checklist. Every item ticked.', 'चेकलिस्ट। सबै टिक।', { p: 2 }],
    ['Copy whatever my friend packs.', 'साथीले जे प्याक गर्छ, त्यही।', { p: 1, e: 1 }],
    ['Throw stuff in. Figure it out there.', 'जे पायो हाल्छु। बाँकी उतै।', { p: -1, d: 1 }],
    ['Forgot my toothbrush. Bought one there.', 'ब्रस बिर्सें। उतै किनें।', { p: -2 }],
  ] },
];

// Key = Drive + Energy + Compass + Pace poles, e.g. "BOHP". The order here is the card number (#01-#16).
const ARCHETYPES = {
  BOHP: { name: ['The Captain', 'कप्तान'], tag: ['Makes the plan. Leads the way.', 'प्लान बनाउँछ, बाटो देखाउँछ।'],
    power: ['Turns chaos into a plan in one minute.', 'एक मिनेटमै अलमललाई प्लानमा बदल्छ।'], weak: ['Not everyone wants a captain.', 'सबैलाई कप्तान चाहिँदैन।'] },
  BOHF: { name: ['The Maverick', 'जुगाडी'], tag: ['Talks their way into anything.', 'जहाँ पनि बोलेरै छिर्छ।'],
    power: ['Genius under pressure.', 'प्रेसरमा जिनियस।'], weak: ['Starts 10 things, finishes 3.', '१० काम सुरु, ३ सकिन्छ।'] },
  BORP: { name: ['The Torchbearer', 'जोसिलो'], tag: ['Fights loud for their people.', 'आफ्ना मान्छेका लागि ठूलो स्वरमा लड्छ।'],
    power: ['Makes everyone feel part of something.', 'सबैलाई टिमको हिस्सा भएको महसुस गराउँछ।'], weak: ['Takes on every battle at once.', 'सबै लडाइँ एकैचोटि लिन्छ।'] },
  BORF: { name: ['The Spark', 'फिलिंगो'], tag: ['Turns a normal day into a story.', 'साधारण दिनलाई कथा बनाउँछ।'],
    power: ['Strangers become friends in minutes.', 'मिनेटमै अपरिचित साथी बन्छ।'], weak: ['Plans? Never heard of them.', 'प्लान? के हो त्यो?'] },
  BIHP: { name: ['The Strategist', 'रणनीतिकार'], tag: ['Quietly ten moves ahead.', 'चुपचाप दस कदम अगाडि।'],
    power: ['Sees the long game.', 'लामो खेल देख्छ।'], weak: ['Tells nobody the plan.', 'प्लान कसैलाई भन्दैन।'] },
  BIHF: { name: ['The Inventor', 'आविष्कारक'], tag: ['Takes things apart to see what happens.', 'के हुन्छ भनेर चीज खोलेर हेर्छ।'],
    power: ['Endless original ideas.', 'नयाँ आइडियाको खानी।'], weak: ['Gets bored once it works.', 'चल्न थालेपछि बोर हुन्छ।'] },
  BIRP: { name: ['The Quiet Rebel', 'शान्त विद्रोही'], tag: ['Soft voice. Strong principles.', 'मसिनो आवाज, बलियो सिद्धान्त।'],
    power: ['Does the right thing when nobody is watching.', 'कसैले नहेर्दा पनि सही काम गर्छ।'], weak: ['Carries too much alone.', 'धेरै कुरा एक्लै बोक्छ।'] },
  BIRF: { name: ['The Wanderer', 'घुमन्ते'], tag: ['Goes where the feeling points.', 'मनले देखाएतिर हिँड्छ।'],
    power: ['Finds magic in detours.', 'घुमाउरो बाटोमा जादु भेट्छ।'], weak: ['Disappears when life gets heavy.', 'जीवन गाह्रो हुँदा हराउँछ।'] },
  SOHP: { name: ['The Organiser', 'आयोजक'], tag: ['Runs the calendar and the group chat.', 'क्यालेन्डर र ग्रुप च्याट दुवै सम्हाल्छ।'],
    power: ['Makes hard things easy.', 'गाह्रो कामलाई सजिलो बनाउँछ।'], weak: ['Stressed when plans change.', 'प्लान फेरिँदा तनाव।'] },
  SOHF: { name: ['The Fixer', 'मिस्त्री'], tag: ['Calm in a crisis, funny after.', 'संकटमा शान्त, पछि हँसाउने।'],
    power: ['Fixes real problems on the spot.', 'तुरुन्तै समस्या सुल्झाउँछ।'], weak: ['Gives a fix when you wanted a hug.', 'अँगालो चाहिँदा पनि उपाय दिन्छ।'] },
  SORP: { name: ['The Host', 'आतिथेय'], tag: ['Remembers your birthday and your order.', 'तिम्रो जन्मदिन र अर्डर दुवै याद।'],
    power: ['Makes everyone feel they belong.', 'सबैलाई आफ्नो जस्तो महसुस गराउँछ।'], weak: ['Says yes even when tired.', 'थाकेको बेला पनि हुन्छ भन्छ।'] },
  SORF: { name: ['The Glue', 'ग्रुपको गम'], tag: ['The friend everyone has in common.', 'सबैको साझा साथी।'],
    power: ['Keeps the peace and the fun.', 'शान्ति पनि, रमाइलो पनि।'], weak: ['Avoids fights until they explode.', 'झगडा टार्दाटार्दै पड्किन्छ।'] },
  SIHP: { name: ['The Keeper', 'भरपर्दो'], tag: ['Does it properly. Every time.', 'हरेक पटक राम्ररी गर्छ।'],
    power: ['100% reliable.', '१००% भरपर्दो।'], weak: ['Waits for perfect.', 'पर्फेक्टको पर्खाइमा।'] },
  SIHF: { name: ['The Observer', 'जासुस'], tag: ['Notices everything. Says a little.', 'सबै देख्छ, थोरै बोल्छ।'],
    power: ['Reads any room.', 'जुनसुकै माहोल बुझ्छ।'], weak: ['Stays on the sidelines.', 'किनारामै बसिरहन्छ।'] },
  SIRP: { name: ['The Guardian', 'संरक्षक'], tag: ['Loyal to the end, quietly.', 'चुपचाप, अन्त्यसम्म वफादार।'],
    power: ['Unbreakable loyalty.', 'नटुट्ने वफादारी।'], weak: ['Holds grudges a bit too long.', 'रिस अलि लामो पाल्छ।'] },
  SIRF: { name: ['The Dreamer', 'सपना बुन्ने'], tag: ['Half here, half in a better world.', 'आधा यहाँ, आधा सपनाको संसारमा।'],
    power: ['Empathy like magic.', 'जादु जस्तो सहानुभूति।'], weak: ['Gets lost in what-ifs.', '“यस्तो भए” मा हराउँछ।'] },
};

// Per axis: [both first pole, both second pole, opposite].
const COMPAT_LINES = {
  d: [['Both Bold: great adventures, bad insurance.', 'दुवै साहसी: रमाइलो साहस, बिमा चाहिन्छ।'], ['Both Steady: nothing ever catches fire.', 'दुवै स्थिर: कहिल्यै आगो लाग्दैन।'], ['Bold + Steady: one pushes, one brakes. It works.', 'साहसी + स्थिर: एउटा धकेल्छ, अर्को ब्रेक। ठिक्क।']],
  e: [['Both Social: last to leave every party.', 'दुवै सामाजिक: हरेक पार्टीबाट अन्तिममा निस्कने।'], ['Both Solo: two people, zero talking, perfect evening.', 'दुवै एकल: दुई जना, शून्य कुरा, उत्तम साँझ।'], ['Social + Solo: one brings the crowd, one brings the calm.', 'सामाजिक + एकल: एउटा भिड ल्याउँछ, अर्को शान्ति।']],
  c: [['Both Head: you argue with facts.', 'दुवै दिमाग: तथ्यले झगडा गर्छौ।'], ['Both Heart: you cry at the same videos.', 'दुवै मन: उही भिडियोमा रुन्छौ।'], ['Head + Heart: one fixes it, one makes it feel OK.', 'दिमाग + मन: एउटा मिलाउँछ, अर्को सान्त्वना दिन्छ।']],
  p: [['Both Planners: shared calendar, colour-coded.', 'दुवै योजनाकार: रङ्गीन साझा क्यालेन्डर।'], ['Both Flow: always late, always together.', 'दुवै बहावमा: सधैँ ढिला, सधैँ सँगै।'], ['Planner + Flow: one packs a week early, one packs in the taxi.', 'योजना + बहाव: एउटा हप्ता अघि प्याक, अर्को ट्याक्सीमा।']],
};

const FRIEND_TIERS = [
  [90, ['Mind reader', 'मन पढ्ने'], ['Kinda scary how well you know them.', 'यति राम्रो चिन्छौ, अलि डरलाग्दो।']],
  [70, ['Bestie level', 'बेस्टी लेभल'], ['You have been paying attention.', 'तिमीले ध्यान दिएका रहेछौ।']],
  [50, ['Good friend', 'राम्रो साथी'], ['You know the basics. Some surprises.', 'मुख्य कुरा थाहा छ। केही सरप्राइज।']],
  [30, ['Just classmates', 'खाली क्लासमेट'], ['You know their face, not their mind.', 'अनुहार चिन्छौ, मन होइन।']],
  [0, ['Who are you?', 'तिमी को हौ?'], ['Time for a long chat together.', 'लामो गफ गर्ने बेला भयो।']],
];

const UI = {
  brand: ['Know Me', 'मलाई चिन'],
  packLine: ['8 cards inside. One of them is you.', 'भित्र ८ कार्ड। एउटा तिमी हौ।'],
  tear: ['Tear open the pack', 'प्याक च्यात'],
  howLong: ['8 quick questions · 1 minute', '८ छोटा प्रश्न · १ मिनेट'],
  yourCard: ['Your last card', 'तिम्रो पछिल्लो कार्ड'],
  card: ['Card', 'कार्ड'],
  quit: ['Quit', 'छोड'],
  back: ['Back', 'पछाडि'],
  tapFlip: ['Tap the card to flip it', 'पल्टाउन कार्ड थिच'],
  power: ['Superpower', 'खास शक्ति'],
  weak: ['Weakness', 'कमजोरी'],
  saveStory: ['Save for your story', 'स्टोरीका लागि सेभ'],
  saving: ['Making image…', 'तस्बिर बन्दैछ…'],
  saved: ['Saved', 'सेभ भयो'],
  challengeH: ['Who really knows you?', 'तिमीलाई साँच्चै कसले चिन्छ?'],
  challengeP: ['Friends guess your 8 answers. Send them your card face down.', 'साथीले तिम्रा ८ उत्तर अनुमान गर्छन्। कार्ड घोप्टो पारेर पठाऊ।'],
  yourName: ['Your first name', 'तिम्रो नाम'],
  needName: ['Add your name first', 'पहिले नाम लेख'],
  send: ['Send challenge', 'च्यालेन्ज पठाऊ'],
  copy: ['Copy link', 'लिंक कपी'],
  copied: ['Copied', 'कपी भयो'],
  again: ['Open a new pack', 'नयाँ प्याक खोल'],
  shareCardText: ['I pulled {type} in Know Me. What is your card?', 'Know Me मा मेरो कार्ड {type} आयो। तिम्रो कुन?'],
  challengeText: ['How well do you know me? Guess my 8 answers.', 'मलाई कति चिन्छौ? मेरा ८ उत्तर अनुमान गर।'],
  // friend
  faceDown: ['{name}’s card is face down', '{name} को कार्ड घोप्टो छ'],
  guessIntro: ['Guess what {name} picked on 8 cards. Score enough and you will know them for real.', '{name} ले ८ कार्डमा के छान्यो अनुमान गर। धेरै मिल्यो भने साँच्चै चिन्छौ।'],
  rules: ['Exact pick +2 · Same vibe +1', 'ठ्याक्कै +२ · उस्तै +१'],
  startGuess: ['Start guessing', 'अनुमान सुरु'],
  skipGuess: ['Skip, get my own card', 'छोड, आफ्नै कार्ड लिन्छु'],
  whatPick: ['What did {name} pick?', '{name} ले के छान्यो?'],
  theirPick: ['{name}’s pick', '{name} को छनोट'],
  exact: ['Exact!', 'ठ्याक्कै!'],
  close: ['Same vibe', 'उस्तै'],
  miss: ['Nope', 'अहँ'],
  next: ['Next', 'अर्को'],
  seeScore: ['Flip their card', 'उसको कार्ड पल्टाऊ'],
  youKnow: ['You know {name}', 'तिमी {name} लाई चिन्छौ'],
  shareScore: ['Share my score', 'स्कोर सेयर'],
  scoreText: ['I know {name} {pct}% on Know Me ({tier}). Beat me:', 'Know Me मा म {name} लाई {pct}% चिन्छु ({tier})। मलाई जित:'],
  getMine: ['Now get your own card', 'अब आफ्नो कार्ड लेऊ'],
  thenMatch: ['Then see how well you and {name} match.', 'अनि {name} सँग कति मिल्छ हेर।'],
  played: ['Last time you scored {pct}%. Beat it?', 'पोहोर तिमीले {pct}% पायौ। जित्छौ?'],
  // match
  matchWith: ['You + {name}', 'तिमी + {name}'],
  match: ['match', 'मिल्छ'],
  twins: ['Basically twins', 'जुम्ल्याहा जस्तै'],
  easy: ['Easy match', 'सजिलै मिल्ने'],
  balance: ['Good balance', 'राम्रो सन्तुलन'],
  opposite: ['Opposites. Interesting.', 'उल्टो। रोचक।'],
  shareMatch: ['Share our match', 'हाम्रो जोडी सेयर'],
  matchText: ['{name} and I are a {pct}% match on Know Me.', 'Know Me मा म र {name} {pct}% मिल्छौं।'],
  storyFoot: ['What is your card?', 'तिम्रो कार्ड कुन?'],
  friend: ['Your friend', 'तिम्रो साथी'],
  notTest: ['Just for fun. Not a real psychology test.', 'रमाइलोका लागि मात्र। वास्तविक मनोवैज्ञानिक परीक्षण होइन।'],
};
