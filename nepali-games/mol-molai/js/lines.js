// Everything said in the bazaar, in both languages: shopkeepers' lines, your lines, tells, thoughts, events, endings, badges.
(() => {
  'use strict';
  window.MM = window.MM || {};

  const LINES = {
    quote: { ne: ['{Item}? रु. {p}। एकदम राम्रो माल छ।', 'यसको रु. {p} पर्छ। यो भन्दा राम्रो बजारमै पाइँदैन।', '{Item}? तपाईंलाई रु. {p}।'], en: ['The {item}? Rs {p}. Top quality.', "That's Rs {p}. You won't find better in the whole bazaar.", 'For you, Rs {p}.'] },
    counter: { ne: ['त्यसमा त घाटा हुन्छ। रु. {p} सम्म दिन सक्छु।', 'ल, तपाईंलाई भनेर रु. {p}।', 'हुँदैन, हुँदैन। रु. {p} दिनुस्।'], en: ["I'd lose money at that. I can do Rs {p}.", 'Fine, just for you: Rs {p}.', 'No, no. Make it Rs {p}.'] },
    stuck: { ne: ['भनिसकेँ नि, रु. {p}।', 'रु. {p} नै हो।'], en: ['I told you, Rs {p}.', 'It stays at Rs {p}.'] },
    accept: { ne: ['ल ठिक छ, लानुस्!', 'हुन्छ। दसैँको बेला हो, लानुस्।', 'ठिकै छ, तपाईंकै कुरा।'], en: ['Alright, take it!', "Okay. It's Dashain, take it.", 'Fine, have it your way.'] },
    insult: { ne: ['के भन्नुभएको? त्यति त मैले किनेकै पर्दैन!', 'ठट्टा गर्नुभएको? रु. {o}?', 'यस्तो दाम भन्ने भए अर्को पसल जानुस्।'], en: ["What? I didn't even pay that much for it!", 'Are you joking? Rs {o}?', "If you're going to name prices like that, try another shop."] },
    lower: { ne: ['अघि त रु. {prev} भन्नुभएको थियो, अहिले झन् तल?', 'उल्टो तल झर्नुहुन्छ? यस्तो मोलमोलाई कहाँ हुन्छ!'], en: ['You said Rs {prev} a minute ago, and now lower?', "Going backwards? That's not how haggling works!"] },
    kick: { ne: ['बस्, भयो! मेरो समय खेर नफाल्नुस्। जानुस्!', 'जानुस्, जानुस्। अरू ग्राहक पर्खिरहेका छन्।'], en: ['Enough! Stop wasting my time. Off you go!', 'Go, go. Other customers are waiting.'] },
    kicked: { ne: 'अघि भर्खर झगडा गर्नुभएको होइन? एकछिनपछि आउनुस्।', en: "Didn't we just argue? Come back later." },
    final: { ne: ['रु. {p}, अन्तिम। यो भन्दा तल मेरो पनि पर्दैन।', 'साँच्चै भन्छु, रु. {p} भन्दा तल सक्दिन।'], en: ['Rs {p}, final. Any lower and I lose money.', "Honestly, I can't go below Rs {p}."] },
    fakeFinal: { ne: ['कसम! रु. {p} भन्दा एक रुपैयाँ पनि तल सक्दिन!', 'रु. {p}। यो मेरो अन्तिम दाम हो, भगवान् साक्षी!'], en: ['I swear! Not one rupee below Rs {p}!', 'Rs {p}. My final price, as God is my witness!'] },
    bluffMatch: { ne: ['{other}ले रु. {n} भन्नुभयो? ल ठिक छ, म रु. {p} मै दिन्छु।', 'हम्म... ल, रु. {p}। तर अरूलाई नभन्नुहोला।'], en: ["{other} said Rs {n}? Fine, I'll do Rs {p}.", "Hmm... okay, Rs {p}. But don't tell anyone."] },
    bluffNo: { ne: ['रु. {n}? त्यसो भए उतै किन्नुस्। म रु. {p} भन्दा तल सक्दिन।', 'त्यति दिनुहुन्छ भने उतै जानुस्। मेरो रु. {p}।'], en: ["Rs {n}? Then buy it there. I can't go below Rs {p}.", "If they'll sell it for that, go there. Mine is Rs {p}."] },
    shout: { ne: '{name}ले गल्लीतिर कराएर सोध्नुभयो: "ए {other}! {item} रु. {n} मा दिन्छौ रे, हो?"', en: '{name} shouts down the lane: "Hey, {other}! Selling the {item} for Rs {n}, are you?"' },
    shoutNo: { ne: '"कहाँ हो! त्यति सस्तोमा कसले दिन्छ!"', en: '"Never! Who would sell that cheap?"' },
    shoutYes: { ne: '"हो, भनेको हो!"', en: '"Yes, I did!"' },
    caught: { ne: ['झुट! {other}ले त्यस्तो भन्नुभएकै छैन। मसँग खेल्ने?', 'हामी सबै एकअर्कालाई चिन्छौँ नि! झुट बोलेर हुन्छ?'], en: ['Liar! {other} never said that. Playing games with me?', "We all know each other here! Lying won't work."] },
    callback: { ne: ['ए, पख्नुस् पख्नुस्! ल, रु. {p} मा लानुस्।', 'कहाँ जानुभयो? आउनुस्, आउनुस्! रु. {p}, अब त ठिक छ?'], en: ['Hey, wait, wait! Okay, take it for Rs {p}.', 'Where are you off to? Come back! Rs {p}, fair enough now?'] },
    back: { ne: ['फेरि आउनुभयो? अघिकै कुरा: रु. {p}।', 'ए, फर्किनुभयो! रु. {p} नै हो।'], en: ['Back again? Same as before: Rs {p}.', "Ah, you're back! Still Rs {p}."] },
    bohani: { ne: 'बोहनी गरिदिनुभयो, धन्यवाद! आजको दिन राम्रो जाला।', en: "My first sale of the day, thank you! It'll be a good day." },
    noBohaniTell: { ne: '{name} बिहानदेखि ग्राहक नआएजस्तो खाली बसिरहनुभएको छ। पसलमा धूप बलिरहेको छ।', en: '{name} sits waiting, with no customers yet today by the look of it. Incense smoulders at the shop.' },
    chatNoBohani: { ne: 'बिहानदेखि बोहनी भएको छैन। आज के हुने हो!', en: 'Not a single sale since morning. What a day.' },
    chatBohani: { ne: 'आज त राम्रै बिक्री भयो, दसैँ हो नि।', en: "Sales have been good today. It's Dashain after all." },
    soldOut: { ne: 'माफ गर्नुस्, अन्तिमचाहिँ भर्खरै अर्को ग्राहकले लग्यो!', en: 'Sorry, someone just took the last one!' },
    noneLeft: { ne: 'सबै बिकिसक्यो। भोलि आउनुस्।', en: 'All sold out. Come back tomorrow.' },
    kindLow: { ne: 'ल, हुन्छ नि... लैजाऊ।', en: "Alright... that's fine. Take it." },
    kindFull: { ne: 'तिमीजस्तो असल केटाकेटी कमै भेटिन्छन्। भगवानले भलो गरून्!', en: 'Few young people are as kind as you. Bless you!' },
    boss: { ne: 'त्यति तल? पख्नुस्, मालिकलाई फोन गर्छु... "हजुर? ...हस्, हस्।" मालिक रिसाउनुभयो। रु. {p} भन्दा तल पाइँदैन।', en: 'That low? Wait, let me phone the owner... "Yes? ...Okay, okay." The owner is not pleased. Nothing below Rs {p}.' },
    nothing: { ne: 'अरू केही चाहियो कि?', en: 'Anything else?' },
    chatty: { ne: 'हाहा, तपाईंसँग गफ गरेर मज्जा आयो!', en: 'Haha, I like chatting with you!' },
  };
  // Personal styles for the haggling counter-offers.
  const KLINES = {
    grumpy: { counter: { ne: ['रु. {p}। लिने भए लिनुस्, नभए जानुस्।', 'हुँदैन। रु. {p}।'], en: ['Rs {p}. Take it or leave it.', 'No. Rs {p}.'] } },
    kind: { counter: { ne: ['ल, रु. {p} देऊ न त।', 'मेरो पनि त घर चलाउनुपर्छ। रु. {p}।'], en: ['Alright, give me Rs {p} then.', 'I have a home to run too. Rs {p}.'] } },
    naive: { counter: { ne: ['अँ... रु. {p}? हुन्छ होला।', 'उम्... रु. {p} सम्म सक्छु जस्तो लाग्छ।'], en: ['Umm... Rs {p}? That should be okay.', 'Uh... I think I can do Rs {p}.'] } },
    cheerful: { counter: { ne: ['हाहा, राम्रो मोलमोलाई! ल रु. {p}।', 'तपाईं त पक्का व्यापारी! रु. {p}।'], en: ['Haha, good haggling! Okay, Rs {p}.', "You're a real trader! Rs {p}."] } },
    poker: { counter: { ne: ['रु. {p}।', '... रु. {p}।'], en: ['Rs {p}.', '... Rs {p}.'] } },
    farmer: { counter: { ne: ['मैले वर्षभरि घाँस काटेर पालेको। रु. {p} त दिनुस्।', 'रु. {p}। यो भन्दा तल त गाउँ फर्किने भाडा पनि पुग्दैन।'], en: ['I cut grass for this goat all year. At least Rs {p}.', "Rs {p}. Any lower and I can't even pay the bus home."] } },
    cunning: { counter: { ne: ['तपाईंलाई मात्र, अरूलाई होइन: रु. {p}।', 'ओहो, मेरो त घाटै भयो। ल रु. {p}।'], en: ['Only for you, nobody else: Rs {p}.', "Oh, I'm losing money here. Fine, Rs {p}."] } },
  };
  const kline = (kind, key) => (KLINES[kind] && KLINES[kind][key]) || LINES[key];

  const ME = {
    askPrice: { ne: '{Item} कति हो?', en: 'How much for the {item}?' },
    offer: { ne: ['रु. {p} मा दिनुहुन्छ?', 'रु. {p} भए लैजान्छु।', 'रु. {p} ठिक छ।'], en: ['Will you do Rs {p}?', "I'll take it for Rs {p}.", 'Rs {p} is fair.'] },
    bluff: { ne: ['{other}ले त रु. {p} भन्नुभयो नि।', '{other}ले रु. {p} मै दिन्छु भन्नुभएको थियो।'], en: ['{other} said Rs {p}, you know.', '{other} offered it to me for Rs {p}.'] },
    accept: { ne: 'ल ठिक छ, रु. {p} मा लिन्छु।', en: "Okay, I'll take it for Rs {p}." },
    walk: { ne: ['पर्दैन, म अरू पसल हेर्छु।', 'महँगो भयो। म जान्छु।'], en: ["Never mind, I'll look elsewhere.", "Too expensive. I'm going."] },
    chat: { ne: 'दसैँको तयारी कस्तो छ?', en: 'How are the Dashain preparations going?' },
  };

  // What you notice about the shopkeeper: how close they are to their real limit.
  const TELLS = {
    far: { ne: ['{name} मुसुक्क हाँस्नुभयो, कुनै हतार छैन जस्तो।', '{name}ले आरामले चिया सुरुप्प पिउनुभयो।', '{name} पछाडि ढल्किएर बस्नुभयो।', '{name}ले अरू ग्राहकतिर हेर्दै हात हल्लाउनुभयो।'], en: ['{name} smiles, in no hurry at all.', '{name} takes a slow sip of tea.', '{name} leans back, relaxed.', '{name} waves at another customer.'] },
    mid: { ne: ['{name}ले टाउको कन्याउनुभयो।', '{name} एकछिन चुप लाग्नुभयो।', '{name}ले क्यालकुलेटरमा केही थिच्नुभयो।', '{name}ले सामानतिर हेर्दै ओठ टोक्नुभयो।'], en: ['{name} pauses, thinking it over.', '{name} goes quiet for a moment.', '{name} taps something into a calculator.', '{name} glances at the goods and bites a lip.'] },
    near: { ne: ['{name}ले लामो सास फेर्नुभयो।', '{name}को निधारमा पसिना देखियो।', '{name}ले बेर्ने कागज झिक्नुभयो।', '{name}ले फेरि फेरि हिसाब गर्नुभयो।'], en: ['{name} lets out a long sigh.', "A bead of sweat appears on {name}'s forehead.", '{name} reaches for the wrapping paper.', '{name} does the sums again, and again.'] },
    annoyed: { ne: ['{name}ले निधार खुम्च्याउनुभयो।', '{name}ले हात बाँध्नुभयो।', '{name} अरू ग्राहकतिर फर्किनुभयो।'], en: ['{name} frowns.', '{name} folds both arms.', '{name} turns toward another customer.'] },
    poker: { ne: ['{name}को अनुहारमा कुनै भाव छैन।', '{name} चुपचाप तपाईंलाई हेरिरहनुभएको छ।'], en: ["{name}'s face gives nothing away.", '{name} just looks at you, silent.'] },
  };

  const THOUGHTS = {
    start: { ne: ['पहिले दुई-तीन पसलमा दाम सोध्छु, अनि मात्र किन्छु।', 'आमा भन्नुहुन्छ: पसलेले भनेको आधाबाट सुरु गर्नू।'], en: ["I'll ask at two or three shops first, then buy.", 'Aama always says: start at half of what they ask.'] },
    near: { ne: ['अब धेरै तल झर्नुहुन्न जस्तो छ...', 'यो त सीमामै पुग्यो जस्तो छ।'], en: ['Not much room left, I think...', 'That looks close to the limit.'] },
    far: { ne: ['अझै धेरै तल झर्न सक्नुहुन्छ जस्तो लाग्छ।', 'यति हाँसिहाँसी बोल्नुहुन्छ, अझै नाफा धेरै होला।'], en: ["There's still plenty of room, it feels like.", 'All smiles... there must be a fat margin in this.'] },
    fake: { ne: '{name}को "कसम" मा कति पत्याउने?', en: 'How much is {name}\'s "I swear" really worth?' },
    trueFinal: { ne: '{name} झुट बोल्ने मान्छे जस्तो लाग्दैन।', en: "{name} doesn't seem the lying type." },
    poker: { ne: 'अनुहारबाट केही थाहा हुँदैन। हिसाबले खेल्नुपर्छ।', en: "Can't read anything from that face. I'll have to go by the numbers." },
    caught: { ne: ['उफ्! अब यो कुरा बजारभरि फैलिन्छ।', 'छी, लाज लाग्यो...'], en: ['Ugh! Now the whole bazaar will hear about this.', 'Oh no, how embarrassing...'] },
    caughtGossip: { ne: 'दिदीसँग झुट बोल्नु हुँदैनथ्यो। दिदीले त सबैलाई भनिहाल्नुहुन्छ!', en: "I shouldn't have lied to Didi. Didi tells everyone!" },
    bluffWin: { ne: ['हेहे, पत्याउनुभयो!', 'अनुहार नबिगारी भनेँ, काम गर्यो।'], en: ['Heh, it worked!', 'Kept a straight face, and it worked.'] },
    kindLow: { ne: 'हजुरआमाको हात काँपिरहेको थियो... त्यति धेरै घटाउनु हुँदैनथ्यो कि?', en: "Hajurama's hands were shaking... maybe I pushed too hard." },
    kindFull: { ne: 'केही रुपैयाँ बढी गयो होला, तर मन हलुका भयो।', en: 'Maybe a few rupees more, but my heart feels lighter.' },
    firstPrice: { ne: 'पहिलो दाममै किनेँ... आमाले थाहा पाउनुभयो भने!', en: 'I paid the very first price... if Aama finds out!' },
    goodDeal: { ne: ['राम्रो मोल भयो!', 'यो त सस्तोमै पर्यो।'], en: ['Good deal!', 'That came out cheap.'] },
    closing: { ne: 'बजार बन्द हुन लाग्यो! छिटो गर्नुपर्छ।', en: 'The bazaar is about to close! I need to hurry.' },
    allDone: { ne: 'सबै सामान किनियो! अब घर गएर आमालाई देखाउँछु।', en: 'Got everything! Time to go home and show Aama.' },
    boss: { ne: 'धेरै तल भनेँ जस्तो छ... अब मालिक पनि आइपुग्नुभयो।', en: 'I went too low... now the owner is involved.' },
    late: { ne: 'साँझ पर्दैछ। गाउँका बालाई घर फर्किने हतार होला।', en: 'It is getting late. Village Ba must be in a hurry to get home.' },
    poor: { ne: 'पैसा पुग्दैन जस्तो छ... अब धेरै होसियार हुनुपर्छ।', en: "I'm running short of money... I need to be careful now." },
    chatty: { ne: 'दाइ गफ गरेर खुसी हुनुभयो। अब अलि सस्तो दिनुहोला।', en: 'Dai enjoyed that chat. Maybe the price will soften now.' },
  };

  const EVENTS = {
    intro: { ne: 'आमाले रु. {b} र सूची हातमा राखिदिनुभयो: "जति बचाउँछौ, त्यो तिम्रै दसैँ खर्च। ठगिएर नआउनू!"', en: 'Aama pressed Rs {b} and the list into your hand: "Whatever you save is your Dashain money. Don\'t get cheated!"' },
    cow: { ne: 'गल्लीको बीचमा एउटा गाई बसेको छ। कसैले हटाउन सकेन, घुमेर जानुपर्यो।', en: 'A cow is lying in the middle of the lane. Nobody can move it, so you take the long way round.' },
    tip: { ne: 'चिनेकी काकीले कानेखुसी गर्नुभयो: "{name}ले {item} रु. {p} भन्दा तल दिनुहुन्न रे।"', en: 'An auntie you know whispers: "They say {name} won\'t sell the {item} below Rs {p}."' },
    friend: { ne: 'साथी भेटियो! उसले {name}बाट {item} रु. {p} मा किनेछ।', en: 'You bump into a friend who just bought a {item} from {name} for Rs {p}.' },
    tourist: { ne: 'एक जना विदेशीले {name}लाई दोब्बर दाम तिरेर गए। {name} आज खुब खुसी हुनुहुन्छ।', en: 'A tourist just paid {name} double. {name} is in a great mood now.' },
    goatSold: { ne: '{name}को एउटा खसी बिक्यो। अब {n} वटा मात्र बाँकी।', en: '{name} just sold a goat. Only {n} left.' },
    goatGone: { ne: '{name}का सबै खसी बिकिसके!', en: '{name} has sold every goat!' },
  };

  const ENDINGS = {
    happy: { title: { ne: 'आमा दङ्ग!', en: 'Aama is thrilled!' }, sub: { ne: 'सबै सामान किनेर रु. {s} बचाएर ल्यायौ!', en: 'You bought everything and brought back Rs {s}!' } },
    ok: { title: { ne: 'घर पुगियो', en: 'Home with everything' }, sub: { ne: 'सबै सामान ल्याइयो, रु. {s} बच्यो।', en: 'You brought everything, with Rs {s} left over.' } },
    scold: { title: { ne: 'आमाले गाली गर्नुभयो', en: 'Aama is not pleased' }, sub: { ne: '{list} त ल्याएनौ नि!', en: 'You forgot the {list}!' } },
  };
  const AAMA = {
    3: { ne: '"यत्रो बचत? अब त तिमी साहुजीलाई पनि उछिन्ने भयौ!"', en: '"You saved all that? Soon you\'ll be out-haggling Sahuji!"' },
    2: { ne: '"शाबास! राम्रो मोलमोलाई गरेछौ।"', en: '"Well done! That was some good haggling."' },
    1: { ne: '"ठिकै छ। अर्को पटक अलि बढी मोलमोलाई गर्नू।"', en: '"Not bad. Haggle a bit harder next time."' },
    0: { ne: '"दसैँमा सामान नै नपुगे कसरी हुन्छ? भोलि फेरि जानुपर्यो।"', en: '"How can we do Dashain without everything? You\'ll have to go back tomorrow."' },
    goat: { ne: '"दसैँमा खसी नै छैन? अब के गर्ने!"', en: '"No goat for Dashain? What are we going to do!"' },
  };

  const BADGES = [
    { id: 'bohani', ne: 'बोहनी गराइयो', en: 'First sale' },
    { id: 'kind', ne: 'ठूलो मन', en: 'Big heart' },
    { id: 'liar', ne: 'झुटको गुरु', en: 'Master bluffer' },
    { id: 'caught', ne: 'पक्राउ!', en: 'Busted!' },
    { id: 'half', ne: 'आधा दाममा', en: 'Half price' },
    { id: 'callback', ne: 'फर्काएर बोलाए', en: 'Called back' },
    { id: 'sahu', ne: 'चलाख साहुलाई जितियो', en: 'Beat a sly trader' },
    { id: 'goat', ne: 'खसी घर पुग्यो', en: 'Goat home' },
    { id: 'three', ne: 'आमा दङ्ग', en: 'Aama amazed' },
  ];

  MM.Lines = { LINES, kline, ME, TELLS, THOUGHTS, EVENTS, ENDINGS, AAMA, BADGES };
})();
