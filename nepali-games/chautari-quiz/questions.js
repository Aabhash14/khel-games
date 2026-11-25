/* Question bank, graded 1 (easiest) to 15 (hardest). Question N in a game is
   always drawn from level N, so every correct answer leads to a harder one.
   Each level holds at least three questions so "Swap question" always works.
   Entry: en/np question, four [english, nepali] answers, c = index of the right one. */
window.QUESTIONS = [
  /* 1 */ [
    { en: 'What is the capital of Nepal?', np: 'नेपालको राजधानी कुन हो?',
      a: [['Kathmandu', 'काठमाडौं'], ['Pokhara', 'पोखरा'], ['Biratnagar', 'विराटनगर'], ['Lalitpur', 'ललितपुर']], c: 0 },
    { en: 'Which is the highest mountain in the world?', np: 'संसारको सबैभन्दा अग्लो हिमाल कुन हो?',
      a: [['Mount Everest (Sagarmatha)', 'सगरमाथा'], ['K2', 'के२'], ['Kangchenjunga', 'कञ्चनजङ्घा'], ['Lhotse', 'ल्होत्से']], c: 0 },
    { en: 'What do honeybees make?', np: 'मौरीले के बनाउँछ?',
      a: [['Honey', 'मह'], ['Silk', 'रेशम'], ['Milk', 'दूध'], ['Ghee', 'घिउ']], c: 0 }
  ],
  /* 2 */ [
    { en: 'How many legs does a spider have?', np: 'माकुराका कति वटा खुट्टा हुन्छन्?',
      a: [['8', '८'], ['6', '६'], ['10', '१०'], ['12', '१२']], c: 0 },
    { en: 'How many days are there in a leap year?', np: 'लिप वर्षमा कति दिन हुन्छन्?',
      a: [['366', '३६६'], ['365', '३६५'], ['364', '३६४'], ['367', '३६७']], c: 0 },
    { en: 'At what temperature does water freeze?', np: 'पानी कति तापक्रममा जम्छ?',
      a: [['0 °C', '० डिग्री सेल्सियस'], ['10 °C', '१० डिग्री सेल्सियस'], ['100 °C', '१०० डिग्री सेल्सियस'], ['−10 °C', '−१० डिग्री सेल्सियस']], c: 0 }
  ],
  /* 3 */ [
    { en: 'What is the national flower of Nepal?', np: 'नेपालको राष्ट्रिय फूल कुन हो?',
      a: [['Rhododendron (Lali Gurans)', 'लालीगुराँस'], ['Lotus', 'कमल'], ['Marigold', 'सयपत्री'], ['Rose', 'गुलाफ']], c: 0 },
    { en: 'Which planet is known as the Red Planet?', np: 'कुन ग्रहलाई रातो ग्रह भनिन्छ?',
      a: [['Mars', 'मंगल'], ['Venus', 'शुक्र'], ['Jupiter', 'बृहस्पति'], ['Saturn', 'शनि']], c: 0 },
    { en: 'How many continents are there on Earth?', np: 'पृथ्वीमा कति वटा महादेश छन्?',
      a: [['7', '७'], ['5', '५'], ['6', '६'], ['8', '८']], c: 0 }
  ],
  /* 4 */ [
    { en: 'Which Nepali festival is known as the festival of lights?', np: 'नेपालमा बत्तीको चाड भनेर कुन पर्व चिनिन्छ?',
      a: [['Tihar', 'तिहार'], ['Dashain', 'दशैं'], ['Holi', 'होली'], ['Teej', 'तीज']], c: 0 },
    { en: 'Which is the largest ocean on Earth?', np: 'संसारको सबैभन्दा ठूलो महासागर कुन हो?',
      a: [['Pacific Ocean', 'प्रशान्त महासागर'], ['Atlantic Ocean', 'एट्लान्टिक महासागर'], ['Indian Ocean', 'हिन्द महासागर'], ['Arctic Ocean', 'आर्कटिक महासागर']], c: 0 },
    { en: 'What shape is the national flag of Nepal?', np: 'नेपालको राष्ट्रिय झण्डा कस्तो आकारको छ?',
      a: [['Two stacked triangles', 'दुई त्रिकोण मिलेको'], ['Rectangle', 'आयत'], ['Square', 'वर्ग'], ['Circle', 'वृत्त']], c: 0 }
  ],
  /* 5 */ [
    { en: 'Where was Gautama Buddha born?', np: 'गौतम बुद्धको जन्म कहाँ भएको हो?',
      a: [['Lumbini', 'लुम्बिनी'], ['Kathmandu', 'काठमाडौं'], ['Bodh Gaya', 'बोधगया'], ['Janakpur', 'जनकपुर']], c: 0 },
    { en: 'What is the national animal of Nepal?', np: 'नेपालको राष्ट्रिय जनावर कुन हो?',
      a: [['Cow', 'गाई'], ['Tiger', 'बाघ'], ['Rhinoceros', 'गैंडा'], ['Yak', 'चौंरी']], c: 0 },
    { en: 'Which is the largest planet in our solar system?', np: 'हाम्रो सौर्यमण्डलको सबैभन्दा ठूलो ग्रह कुन हो?',
      a: [['Jupiter', 'बृहस्पति'], ['Saturn', 'शनि'], ['Neptune', 'वरुण'], ['Earth', 'पृथ्वी']], c: 0 }
  ],
  /* 6 */ [
    { en: 'How many players does one football team have on the field?', np: 'फुटबल खेलमा एउटा टोलीका कति जना खेलाडी मैदानमा हुन्छन्?',
      a: [['11', '११'], ['9', '९'], ['10', '१०'], ['12', '१२']], c: 0 },
    { en: 'How many provinces does Nepal have?', np: 'नेपालमा कति वटा प्रदेश छन्?',
      a: [['7', '७'], ['5', '५'], ['9', '९'], ['14', '१४']], c: 0 },
    { en: 'Which Nepali city is famous for Phewa Lake and views of Machhapuchhre?', np: 'फेवा ताल र माछापुच्छ्रेको दृश्यका लागि प्रसिद्ध सहर कुन हो?',
      a: [['Pokhara', 'पोखरा'], ['Bhaktapur', 'भक्तपुर'], ['Dharan', 'धरान'], ['Butwal', 'बुटवल']], c: 0 }
  ],
  /* 7 */ [
    { en: 'Which national park in Nepal is famous for the one-horned rhinoceros?', np: 'एकसिङ्गे गैंडाका लागि प्रसिद्ध नेपालको राष्ट्रिय निकुञ्ज कुन हो?',
      a: [['Chitwan National Park', 'चितवन राष्ट्रिय निकुञ्ज'], ['Sagarmatha National Park', 'सगरमाथा राष्ट्रिय निकुञ्ज'], ['Rara National Park', 'रारा राष्ट्रिय निकुञ्ज'], ['Shey Phoksundo National Park', 'शे-फोक्सुण्डो राष्ट्रिय निकुञ्ज']], c: 0 },
    { en: 'Which gas do plants take from the air for photosynthesis?', np: 'बोटबिरुवाले प्रकाश संश्लेषणका लागि हावाबाट कुन ग्यास लिन्छन्?',
      a: [['Carbon dioxide', 'कार्बन डाइअक्साइड'], ['Oxygen', 'अक्सिजन'], ['Nitrogen', 'नाइट्रोजन'], ['Hydrogen', 'हाइड्रोजन']], c: 0 },
    { en: 'Who painted the Mona Lisa?', np: 'मोनालिसाको चित्र कसले बनाएका हुन्?',
      a: [['Leonardo da Vinci', 'लियोनार्डो दा भिन्ची'], ['Michelangelo', 'माइकल एन्जेलो'], ['Pablo Picasso', 'पाब्लो पिकासो'], ['Vincent van Gogh', 'भिन्सेन्ट भ्यान गग']], c: 0 }
  ],
  /* 8 */ [
    { en: 'Who reached the summit of Everest with Edmund Hillary in 1953?', np: 'सन् १९५३ मा एडमण्ड हिलारीसँगै सगरमाथाको चुचुरोमा पुग्ने व्यक्ति को हुन्?',
      a: [['Tenzing Norgay Sherpa', 'तेन्जिङ नोर्गे शेर्पा'], ['Pasang Lhamu Sherpa', 'पासाङ ल्हामु शेर्पा'], ['Apa Sherpa', 'आपा शेर्पा'], ['Ang Rita Sherpa', 'आङ रिता शेर्पा']], c: 0 },
    { en: 'What is the hardest natural substance?', np: 'प्राकृतिक रूपमा पाइने सबैभन्दा कडा पदार्थ कुन हो?',
      a: [['Diamond', 'हीरा'], ['Iron', 'फलाम'], ['Quartz', 'क्वार्ट्ज'], ['Granite', 'ग्रेनाइट']], c: 0 },
    { en: 'Who discovered penicillin?', np: 'पेनिसिलिन कसले पत्ता लगाएका हुन्?',
      a: [['Alexander Fleming', 'अलेक्जेन्डर फ्लेमिङ'], ['Louis Pasteur', 'लुई पाश्चर'], ['Marie Curie', 'मारी क्युरी'], ['Edward Jenner', 'एडवर्ड जेनर']], c: 0 }
  ],
  /* 9 */ [
    { en: 'Who wrote "Muna Madan"?', np: '"मुनामदन" कसले लेखेका हुन्?',
      a: [['Laxmi Prasad Devkota', 'लक्ष्मीप्रसाद देवकोटा'], ['Bhanubhakta Acharya', 'भानुभक्त आचार्य'], ['Parijat', 'पारिजात'], ['Lekhnath Paudyal', 'लेखनाथ पौड्याल']], c: 0 },
    { en: 'What is the chemical symbol for gold?', np: 'सुनको रासायनिक संकेत के हो?',
      a: [['Au', 'Au'], ['Ag', 'Ag'], ['Gd', 'Gd'], ['Go', 'Go']], c: 0 },
    { en: 'What is the SI unit of electric current?', np: 'विद्युत् प्रवाहको SI एकाइ के हो?',
      a: [['Ampere', 'एम्पियर'], ['Volt', 'भोल्ट'], ['Ohm', 'ओम'], ['Watt', 'वाट']], c: 0 }
  ],
  /* 10 */ [
    { en: 'What is the largest organ of the human body?', np: 'मानव शरीरको सबैभन्दा ठूलो अङ्ग कुन हो?',
      a: [['Skin', 'छाला'], ['Liver', 'कलेजो'], ['Lungs', 'फोक्सो'], ['Brain', 'मस्तिष्क']], c: 0 },
    { en: 'Which is the longest river in Nepal?', np: 'नेपालको सबैभन्दा लामो नदी कुन हो?',
      a: [['Karnali', 'कर्णाली'], ['Koshi', 'कोशी'], ['Gandaki', 'गण्डकी'], ['Bagmati', 'बागमती']], c: 0 },
    { en: 'Which is the largest lake in Nepal?', np: 'नेपालको सबैभन्दा ठूलो ताल कुन हो?',
      a: [['Rara Lake', 'रारा ताल'], ['Phewa Lake', 'फेवा ताल'], ['Begnas Lake', 'बेगनास ताल'], ['Tilicho Lake', 'तिलिचो ताल']], c: 0 }
  ],
  /* 11 */ [
    { en: 'Who is known as the "Adikavi", the first poet of the Nepali language?', np: 'नेपाली भाषाका आदिकवि भनेर कसलाई चिनिन्छ?',
      a: [['Bhanubhakta Acharya', 'भानुभक्त आचार्य'], ['Laxmi Prasad Devkota', 'लक्ष्मीप्रसाद देवकोटा'], ['Motiram Bhatta', 'मोतीराम भट्ट'], ['Lekhnath Paudyal', 'लेखनाथ पौड्याल']], c: 0 },
    { en: 'In which year did Nepal become a federal democratic republic, ending the monarchy?', np: 'राजतन्त्र अन्त्य गरी नेपाल संघीय लोकतान्त्रिक गणतन्त्र कुन सालमा बन्यो?',
      a: [['2008', 'सन् २००८'], ['1990', 'सन् १९९०'], ['2006', 'सन् २००६'], ['2015', 'सन् २०१५']], c: 0 },
    { en: 'Which country hosted the first modern Olympic Games in 1896?', np: 'सन् १८९६ मा पहिलो आधुनिक ओलम्पिक खेल कुन देशमा भयो?',
      a: [['Greece', 'ग्रीस'], ['France', 'फ्रान्स'], ['England', 'इङ्ल्यान्ड'], ['United States', 'अमेरिका']], c: 0 }
  ],
  /* 12 */ [
    { en: 'In which year was the current Constitution of Nepal promulgated?', np: 'नेपालको वर्तमान संविधान कुन साल जारी भयो?',
      a: [['2015', 'सन् २०१५'], ['2007', 'सन् २००७'], ['2008', 'सन् २००८'], ['1990', 'सन् १९९०']], c: 0 },
    { en: 'Who was the first Nepali woman to climb Mount Everest?', np: 'सगरमाथा चढ्ने पहिलो नेपाली महिला को हुन्?',
      a: [['Pasang Lhamu Sherpa', 'पासाङ ल्हामु शेर्पा'], ['Lakpa Sherpa', 'ल्हाक्पा शेर्पा'], ['Maya Sherpa', 'माया शेर्पा'], ['Purnima Shrestha', 'पूर्णिमा श्रेष्ठ']], c: 0 },
    { en: 'Which blood group is known as the universal donor?', np: 'सबैलाई रगत दिन मिल्ने "युनिभर्सल डोनर" रक्त समूह कुन हो?',
      a: [['O negative', 'O नेगेटिभ'], ['AB positive', 'AB पोजिटिभ'], ['A positive', 'A पोजिटिभ'], ['B negative', 'B नेगेटिभ']], c: 0 },
    { en: 'Roughly how fast does light travel?', np: 'प्रकाशको गति लगभग कति हुन्छ?',
      a: [['300,000 km per second', 'प्रति सेकेन्ड ३ लाख किलोमिटर'], ['30,000 km per second', 'प्रति सेकेन्ड ३० हजार किलोमिटर'], ['3,000,000 km per second', 'प्रति सेकेन्ड ३० लाख किलोमिटर'], ['150,000 km per second', 'प्रति सेकेन्ड डेढ लाख किलोमिटर']], c: 0 }
  ],
  /* 13 */ [
    { en: 'In which year did Prithvi Narayan Shah conquer Kathmandu?', np: 'पृथ्वीनारायण शाहले काठमाडौं कुन साल विजय गरे?',
      a: [['1768', 'सन् १७६८'], ['1743', 'सन् १७४३'], ['1816', 'सन् १८१६'], ['1792', 'सन् १७९२']], c: 0 },
    { en: 'Which treaty ended the Anglo-Nepal War in 1816?', np: 'सन् १८१६ मा नेपाल-अंग्रेज युद्ध अन्त्य गर्ने सन्धि कुन हो?',
      a: [['Treaty of Sugauli', 'सुगौली सन्धि'], ['Treaty of Titalia', 'तितालिया सन्धि'], ['Treaty of Betrawati', 'बेत्रावती सन्धि'], ['Treaty of Thapathali', 'थापाथली सन्धि']], c: 0 },
    { en: 'Which is the smallest bone in the human body?', np: 'मानव शरीरको सबैभन्दा सानो हड्डी कुन हो?',
      a: [['Stapes (in the ear)', 'स्टेपिज (कानभित्र)'], ['Patella (kneecap)', 'पटेला (घुँडाको चक्की)'], ['Radius', 'रेडियस'], ['Coccyx', 'ककिक्स']], c: 0 },
    { en: 'What height for Mount Everest did Nepal and China jointly announce in 2020?', np: 'सन् २०२० मा नेपाल र चीनले संयुक्त रूपमा घोषणा गरेको सगरमाथाको उचाइ कति हो?',
      a: [['8,848.86 m', '८,८४८.८६ मिटर'], ['8,848 m', '८,८४८ मिटर'], ['8,850 m', '८,८५० मिटर'], ['8,844.43 m', '८,८४४.४३ मिटर']], c: 0 }
  ],
  /* 14 */ [
    { en: 'How many monument zones make up the Kathmandu Valley UNESCO World Heritage Site?', np: 'काठमाडौं उपत्यकाको युनेस्को विश्व सम्पदा क्षेत्रमा कति वटा स्मारक क्षेत्र छन्?',
      a: [['7', '७'], ['5', '५'], ['4', '४'], ['10', '१०']], c: 0 },
    { en: 'Who wrote the lyrics of Nepal’s national anthem "Sayaun Thunga Phulka"?', np: 'राष्ट्रिय गान "सयौं थुँगा फूलका हामी" का गीतकार को हुन्?',
      a: [['Byakul Maila (Pradeep Kumar Rai)', 'व्याकुल माईला (प्रदीपकुमार राई)'], ['Amber Gurung', 'अम्बर गुरुङ'], ['Madhav Prasad Ghimire', 'माधवप्रसाद घिमिरे'], ['Bhupi Sherchan', 'भूपी शेरचन']], c: 0 },
    { en: 'The lowest point in Nepal lies in which district?', np: 'नेपालको सबैभन्दा होचो स्थान कुन जिल्लामा पर्छ?',
      a: [['Jhapa', 'झापा'], ['Morang', 'मोरङ'], ['Saptari', 'सप्तरी'], ['Bara', 'बारा']], c: 0 },
    { en: 'Who wrote the Nepali epic poem "Shakuntal" (1945)?', np: 'नेपाली महाकाव्य "शाकुन्तल" (सन् १९४५) कसले लेखेका हुन्?',
      a: [['Laxmi Prasad Devkota', 'लक्ष्मीप्रसाद देवकोटा'], ['Lekhnath Paudyal', 'लेखनाथ पौड्याल'], ['Bhanubhakta Acharya', 'भानुभक्त आचार्य'], ['Balkrishna Sama', 'बालकृष्ण सम']], c: 0 },
    { en: 'Which is the deepest lake in Nepal?', np: 'नेपालको सबैभन्दा गहिरो ताल कुन हो?',
      a: [['Shey Phoksundo Lake', 'शे-फोक्सुण्डो ताल'], ['Rara Lake', 'रारा ताल'], ['Tilicho Lake', 'तिलिचो ताल'], ['Gosaikunda', 'गोसाइँकुण्ड']], c: 0 },
    { en: 'Who became Nepal’s first elected Prime Minister in 1959?', np: 'सन् १९५९ मा नेपालको पहिलो निर्वाचित प्रधानमन्त्री को बने?',
      a: [['B.P. Koirala', 'बी.पी. कोइराला'], ['Matrika Prasad Koirala', 'मातृकाप्रसाद कोइराला'], ['Tanka Prasad Acharya', 'टंकप्रसाद आचार्य'], ['Kirti Nidhi Bista', 'कीर्तिनिधि विष्ट']], c: 0 },
    { en: 'Which planet has the shortest day, spinning fastest on its axis?', np: 'आफ्नो अक्षमा सबैभन्दा छिटो घुम्ने, सबैभन्दा छोटो दिन भएको ग्रह कुन हो?',
      a: [['Jupiter', 'बृहस्पति'], ['Saturn', 'शनि'], ['Earth', 'पृथ्वी'], ['Mercury', 'बुध']], c: 0 }
  ],
  /* 15 */ [
    { en: 'In which year did Nepal become a member of the United Nations?', np: 'नेपाल कुन साल संयुक्त राष्ट्रसंघको सदस्य बन्यो?',
      a: [['1955', 'सन् १९५५'], ['1945', 'सन् १९४५'], ['1951', 'सन् १९५१'], ['1961', 'सन् १९६१']], c: 0 },
    { en: 'Nepal Sambat, the lunar calendar of the Newar community, began in which year?', np: 'नेवार समुदायको चान्द्र पात्रो नेपाल सम्वत् कुन सालदेखि सुरु भएको हो?',
      a: [['879 AD', 'सन् ८७९'], ['57 BC', 'ईसापूर्व ५७'], ['1768 AD', 'सन् १७६८'], ['1903 AD', 'सन् १९०३']], c: 0 },
    { en: 'In which year did Prime Minister Chandra Shumsher announce the abolition of slavery in Nepal?', np: 'प्रधानमन्त्री चन्द्रशमशेरले नेपालमा दास प्रथा उन्मूलनको घोषणा कुन साल गरे?',
      a: [['1924', 'सन् १९२४'], ['1910', 'सन् १९१०'], ['1934', 'सन् १९३४'], ['1951', 'सन् १९५१']], c: 0 },
    { en: 'In which year was Lumbini inscribed as a UNESCO World Heritage Site?', np: 'लुम्बिनी कुन साल युनेस्को विश्व सम्पदा सूचीमा सूचीकृत भयो?',
      a: [['1997', 'सन् १९९७'], ['1979', 'सन् १९७९'], ['1984', 'सन् १९८४'], ['2006', 'सन् २००६']], c: 0 },
    { en: 'Which was the first country to establish diplomatic relations with Nepal?', np: 'नेपालसँग कूटनीतिक सम्बन्ध स्थापना गर्ने पहिलो देश कुन हो?',
      a: [['United Kingdom', 'बेलायत'], ['India', 'भारत'], ['China', 'चीन'], ['United States', 'अमेरिका']], c: 0 }
  ]
];
