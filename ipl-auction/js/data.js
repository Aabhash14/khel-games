// Player pool: the ten IPL 2026 squads (retentions, trades and the December 2025 auction buys).
// The 2026 team is each player's "former team" for retention and RTM in this mega auction.
// Ratings (0-100) are our own estimate of current T20 value, not official numbers.
// Update this file each season; nothing else needs to change.
//
// Line format: Name | 2026 team | country | role | rating | capped (1) or uncapped (0)
// Roles: BAT batter, WK wicketkeeper, AR all-rounder, PACE fast bowler, SPIN spinner.
(() => {
  'use strict';
  const IPLA = (globalThis.IPLA = globalThis.IPLA || {});

  const SEASON = 2027;

  // style: what a franchise values more. bid: how it behaves at the table —
  // aggressive (quick, jump bids, not scared off by jumps), patient (joins once a fight is on),
  // sniper (comes in at "going once"), bluffer (sometimes pushes the price on players it doesn't need).
  const TEAMS = [
    { id: 'CSK', name: 'Chennai Super Kings', c1: '#f9cd05', c2: '#1d3c8f', ink: '#14213d', style: { AR: 1.15, SPIN: 1.1, old: 1.1 }, bid: 'patient' },
    { id: 'DC', name: 'Delhi Capitals', c1: '#1b4fb8', c2: '#e2242b', ink: '#ffffff', style: { BAT: 1.05, SPIN: 1.05 }, bid: 'bluffer' },
    { id: 'GT', name: 'Gujarat Titans', c1: '#1c2a4a', c2: '#c8a85c', ink: '#ffffff', style: { PACE: 1.12, SPIN: 1.08 }, bid: 'patient' },
    { id: 'KKR', name: 'Kolkata Knight Riders', c1: '#3b1f63', c2: '#d4b54a', ink: '#ffffff', style: { AR: 1.15, overseas: 1.1, star: 1.12 }, bid: 'aggressive' },
    { id: 'LSG', name: 'Lucknow Super Giants', c1: '#0a7cc4', c2: '#f28a1c', ink: '#ffffff', style: { PACE: 1.1, WK: 1.08, star: 1.08 }, bid: 'bluffer' },
    { id: 'MI', name: 'Mumbai Indians', c1: '#0b4ea2', c2: '#d9b04a', ink: '#ffffff', style: { PACE: 1.12, young: 1.1 }, bid: 'sniper' },
    { id: 'PBKS', name: 'Punjab Kings', c1: '#d4202c', c2: '#d8d8d8', ink: '#ffffff', style: { star: 1.15, BAT: 1.05 }, bid: 'aggressive' },
    { id: 'RR', name: 'Rajasthan Royals', c1: '#e3197f', c2: '#22409a', ink: '#ffffff', style: { young: 1.18, SPIN: 1.05 }, bid: 'sniper' },
    { id: 'RCB', name: 'Royal Challengers Bengaluru', c1: '#a8001c', c2: '#1a1a1a', ink: '#ffffff', style: { BAT: 1.1, star: 1.1 }, bid: 'bluffer' },
    { id: 'SRH', name: 'Sunrisers Hyderabad', c1: '#f26522', c2: '#1a1a1a', ink: '#ffffff', style: { BAT: 1.12, WK: 1.05 }, bid: 'aggressive' },
  ];

  const RAW = `
  Ruturaj Gaikwad|CSK|IND|BAT|84|1
  Sanju Samson|CSK|IND|WK|86|1
  Shivam Dube|CSK|IND|AR|81|1
  Noor Ahmad|CSK|AFG|SPIN|84|1
  Khaleel Ahmed|CSK|IND|PACE|77|1
  MS Dhoni|CSK|IND|WK|74|0
  Anshul Kamboj|CSK|IND|PACE|72|0
  Dewald Brevis|CSK|SA|BAT|79|1
  Gurjapneet Singh|CSK|IND|PACE|64|0
  Nathan Ellis|CSK|AUS|PACE|76|1
  Jamie Overton|CSK|ENG|AR|73|1
  Mukesh Choudhary|CSK|IND|PACE|62|0
  Ramakrishna Ghosh|CSK|IND|AR|60|0
  Shreyas Gopal|CSK|IND|SPIN|62|0
  Ayush Mhatre|CSK|IND|BAT|74|0
  Urvil Patel|CSK|IND|WK|68|0
  Sarfaraz Khan|CSK|IND|BAT|70|1
  Matt Henry|CSK|NZ|PACE|79|1
  Rahul Chahar|CSK|IND|SPIN|72|1
  Akeal Hosein|CSK|WI|SPIN|74|1
  Prashant Veer|CSK|IND|AR|68|0
  Kartik Sharma|CSK|IND|WK|68|0
  Zak Foulkes|CSK|NZ|AR|66|1
  Matthew Short|CSK|AUS|AR|72|1
  Aman Khan|CSK|IND|AR|58|0
  Axar Patel|DC|IND|AR|88|1
  KL Rahul|DC|IND|WK|87|1
  Kuldeep Yadav|DC|IND|SPIN|87|1
  Mitchell Starc|DC|AUS|PACE|85|1
  T Natarajan|DC|IND|PACE|75|1
  Tristan Stubbs|DC|SA|WK|81|1
  Mukesh Kumar|DC|IND|PACE|74|1
  Nitish Rana|DC|IND|BAT|72|1
  Abhishek Porel|DC|IND|WK|74|0
  Ashutosh Sharma|DC|IND|BAT|73|0
  Sameer Rizvi|DC|IND|BAT|66|0
  Dushmantha Chameera|DC|SL|PACE|72|1
  Karun Nair|DC|IND|BAT|70|1
  Madhav Tiwari|DC|IND|AR|58|0
  Ajay Mandal|DC|IND|AR|58|0
  Tripurana Vijay|DC|IND|SPIN|57|0
  Vipraj Nigam|DC|IND|SPIN|68|0
  David Miller|DC|SA|BAT|78|1
  Prithvi Shaw|DC|IND|BAT|66|1
  Ben Duckett|DC|ENG|BAT|78|1
  Auqib Nabi|DC|IND|PACE|67|0
  Pathum Nissanka|DC|SL|BAT|77|1
  Kyle Jamieson|DC|NZ|PACE|73|1
  Lungi Ngidi|DC|SA|PACE|75|1
  Sahil Parekh|DC|IND|BAT|55|0
  Rashid Khan|GT|AFG|SPIN|89|1
  Shubman Gill|GT|IND|BAT|91|1
  Jos Buttler|GT|ENG|WK|89|1
  Mohammed Siraj|GT|IND|PACE|84|1
  Kagiso Rabada|GT|SA|PACE|85|1
  Prasidh Krishna|GT|IND|PACE|82|1
  Sai Sudharsan|GT|IND|BAT|88|1
  Rahul Tewatia|GT|IND|AR|72|0
  Shahrukh Khan|GT|IND|BAT|71|0
  Washington Sundar|GT|IND|AR|80|1
  Sai Kishore|GT|IND|SPIN|75|1
  Glenn Phillips|GT|NZ|AR|78|1
  Arshad Khan|GT|IND|AR|63|0
  Gurnoor Brar|GT|IND|PACE|60|0
  Ishant Sharma|GT|IND|PACE|68|1
  Jayant Yadav|GT|IND|SPIN|60|1
  Kumar Kushagra|GT|IND|WK|58|0
  Anuj Rawat|GT|IND|WK|60|0
  Manav Suthar|GT|IND|SPIN|60|0
  Nishant Sindhu|GT|IND|AR|60|0
  Ashok Sharma|GT|IND|PACE|58|0
  Jason Holder|GT|WI|AR|76|1
  Tom Banton|GT|ENG|WK|72|1
  Prithvi Raj|GT|IND|PACE|55|0
  Luke Wood|GT|ENG|PACE|68|1
  Rinku Singh|KKR|IND|BAT|81|1
  Sunil Narine|KKR|WI|AR|85|1
  Varun Chakravarthy|KKR|IND|SPIN|88|1
  Harshit Rana|KKR|IND|PACE|78|1
  Ramandeep Singh|KKR|IND|AR|66|0
  Angkrish Raghuvanshi|KKR|IND|BAT|72|0
  Vaibhav Arora|KKR|IND|PACE|72|0
  Ajinkya Rahane|KKR|IND|BAT|75|1
  Rovman Powell|KKR|WI|BAT|72|1
  Manish Pandey|KKR|IND|BAT|64|1
  Umran Malik|KKR|IND|PACE|63|1
  Anukul Roy|KKR|IND|AR|60|0
  Cameron Green|KKR|AUS|AR|87|1
  Rachin Ravindra|KKR|NZ|AR|79|1
  Finn Allen|KKR|NZ|BAT|76|1
  Akash Deep|KKR|IND|PACE|72|1
  Matheesha Pathirana|KKR|SL|PACE|82|1
  Tejasvi Singh|KKR|IND|WK|60|0
  Kartik Tyagi|KKR|IND|PACE|60|0
  Prashant Solanki|KKR|IND|SPIN|56|0
  Rahul Tripathi|KKR|IND|BAT|66|1
  Tim Seifert|KKR|NZ|WK|71|1
  Mustafizur Rahman|KKR|BAN|PACE|78|1
  Sarthak Ranjan|KKR|IND|BAT|55|0
  Daksh Kamra|KKR|IND|AR|55|0
  Rishabh Pant|LSG|IND|WK|87|1
  Nicholas Pooran|LSG|WI|WK|89|1
  Mayank Yadav|LSG|IND|PACE|76|1
  Mohammed Shami|LSG|IND|PACE|80|1
  Avesh Khan|LSG|IND|PACE|76|1
  Abdul Samad|LSG|IND|BAT|72|0
  Ayush Badoni|LSG|IND|BAT|76|0
  Mohsin Khan|LSG|IND|PACE|70|0
  Mitchell Marsh|LSG|AUS|AR|84|1
  Shahbaz Ahmed|LSG|IND|AR|68|1
  Aiden Markram|LSG|SA|BAT|84|1
  Manimaran Siddharth|LSG|IND|SPIN|60|0
  Matthew Breetzke|LSG|SA|BAT|72|1
  Akash Singh|LSG|IND|PACE|58|0
  Arjun Tendulkar|LSG|IND|AR|56|0
  Arshin Kulkarni|LSG|IND|AR|58|0
  Himmat Singh|LSG|IND|BAT|57|0
  Digvesh Rathi|LSG|IND|SPIN|74|0
  Prince Yadav|LSG|IND|PACE|62|0
  Wanindu Hasaranga|LSG|SL|SPIN|82|1
  Anrich Nortje|LSG|SA|PACE|78|1
  Mukul Choudhary|LSG|IND|WK|58|0
  Naman Tiwari|LSG|IND|PACE|58|0
  Josh Inglis|LSG|AUS|WK|80|1
  Akshat Raghuwanshi|LSG|IND|BAT|60|0
  Jasprit Bumrah|MI|IND|PACE|97|1
  Hardik Pandya|MI|IND|AR|88|1
  Suryakumar Yadav|MI|IND|BAT|90|1
  Rohit Sharma|MI|IND|BAT|85|1
  Trent Boult|MI|NZ|PACE|86|1
  Deepak Chahar|MI|IND|PACE|76|1
  Tilak Varma|MI|IND|BAT|85|1
  Will Jacks|MI|ENG|AR|80|1
  Naman Dhir|MI|IND|AR|72|0
  Allah Ghazanfar|MI|AFG|SPIN|74|1
  Sherfane Rutherford|MI|WI|BAT|75|1
  Shardul Thakur|MI|IND|AR|72|1
  Mitchell Santner|MI|NZ|AR|80|1
  Ryan Rickelton|MI|SA|WK|79|1
  Corbin Bosch|MI|SA|AR|68|1
  Robin Minz|MI|IND|WK|57|0
  Raj Angad Bawa|MI|IND|AR|58|0
  Ashwani Kumar|MI|IND|PACE|66|0
  Raghu Sharma|MI|IND|SPIN|56|0
  Mayank Markande|MI|IND|SPIN|62|0
  Quinton de Kock|MI|SA|WK|80|1
  Danish Malewar|MI|IND|BAT|58|0
  Mayank Rawat|MI|IND|AR|55|0
  Mohammad Izhar|MI|IND|PACE|55|0
  Atharva Ankolekar|MI|IND|AR|56|0
  Shreyas Iyer|PBKS|IND|BAT|90|1
  Arshdeep Singh|PBKS|IND|PACE|90|1
  Yuzvendra Chahal|PBKS|IND|SPIN|83|1
  Marcus Stoinis|PBKS|AUS|AR|80|1
  Marco Jansen|PBKS|SA|AR|83|1
  Shashank Singh|PBKS|IND|BAT|77|0
  Nehal Wadhera|PBKS|IND|BAT|72|0
  Prabhsimran Singh|PBKS|IND|WK|79|0
  Priyansh Arya|PBKS|IND|BAT|79|0
  Mitchell Owen|PBKS|AUS|AR|72|1
  Azmatullah Omarzai|PBKS|AFG|AR|78|1
  Lockie Ferguson|PBKS|NZ|PACE|77|1
  Vijaykumar Vyshak|PBKS|IND|PACE|66|0
  Yash Thakur|PBKS|IND|PACE|64|0
  Harpreet Brar|PBKS|IND|SPIN|68|0
  Vishnu Vinod|PBKS|IND|WK|58|0
  Xavier Bartlett|PBKS|AUS|PACE|72|1
  Pyla Avinash|PBKS|IND|BAT|55|0
  Harnoor Pannu|PBKS|IND|BAT|56|0
  Musheer Khan|PBKS|IND|AR|60|0
  Suryansh Shedge|PBKS|IND|AR|60|0
  Ben Dwarshuis|PBKS|AUS|PACE|72|1
  Praveen Dubey|PBKS|IND|SPIN|56|0
  Cooper Connolly|PBKS|AUS|AR|72|1
  Vishal Nishad|PBKS|IND|SPIN|55|0
  Yashasvi Jaiswal|RR|IND|BAT|91|1
  Riyan Parag|RR|IND|AR|81|1
  Ravindra Jadeja|RR|IND|AR|86|1
  Dhruv Jurel|RR|IND|WK|80|1
  Jofra Archer|RR|ENG|PACE|84|1
  Shimron Hetmyer|RR|WI|BAT|78|1
  Tushar Deshpande|RR|IND|PACE|70|1
  Sandeep Sharma|RR|IND|PACE|74|1
  Nandre Burger|RR|SA|PACE|72|1
  Sam Curran|RR|ENG|AR|80|1
  Kwena Maphaka|RR|SA|PACE|70|1
  Vaibhav Sooryavanshi|RR|IND|BAT|82|0
  Donovan Ferreira|RR|SA|WK|68|1
  Shubham Dubey|RR|IND|BAT|62|0
  Yudhvir Singh|RR|IND|PACE|60|0
  Lhuan-dre Pretorius|RR|SA|WK|66|1
  Ravi Bishnoi|RR|IND|SPIN|80|1
  Sushant Mishra|RR|IND|PACE|58|0
  Yash Raj Punja|RR|IND|SPIN|55|0
  Vignesh Puthur|RR|IND|SPIN|62|0
  Adam Milne|RR|NZ|PACE|70|1
  Kuldeep Sen|RR|IND|PACE|62|1
  Aman Rao|RR|IND|BAT|55|0
  Ravi Singh|RR|IND|WK|55|0
  Brijesh Sharma|RR|IND|PACE|55|0
  Virat Kohli|RCB|IND|BAT|93|1
  Josh Hazlewood|RCB|AUS|PACE|88|1
  Phil Salt|RCB|ENG|WK|86|1
  Rajat Patidar|RCB|IND|BAT|81|1
  Jitesh Sharma|RCB|IND|WK|76|1
  Bhuvneshwar Kumar|RCB|IND|PACE|81|1
  Rasikh Salam|RCB|IND|PACE|68|0
  Krunal Pandya|RCB|IND|AR|78|1
  Yash Dayal|RCB|IND|PACE|72|0
  Tim David|RCB|AUS|BAT|80|1
  Suyash Sharma|RCB|IND|SPIN|72|0
  Jacob Bethell|RCB|ENG|AR|76|1
  Devdutt Padikkal|RCB|IND|BAT|76|1
  Nuwan Thushara|RCB|SL|PACE|70|1
  Romario Shepherd|RCB|WI|AR|74|1
  Swapnil Singh|RCB|IND|AR|58|0
  Abhinandan Singh|RCB|IND|PACE|56|0
  Venkatesh Iyer|RCB|IND|AR|76|1
  Jacob Duffy|RCB|NZ|PACE|72|1
  Jordan Cox|RCB|ENG|WK|64|1
  Satvik Deswal|RCB|IND|AR|55|0
  Vicky Ostwal|RCB|IND|SPIN|58|0
  Mangesh Yadav|RCB|IND|PACE|62|0
  Vihaan Malhotra|RCB|IND|BAT|58|0
  Kanishk Chouhan|RCB|IND|AR|55|0
  Heinrich Klaasen|SRH|SA|WK|90|1
  Pat Cummins|SRH|AUS|PACE|87|1
  Travis Head|SRH|AUS|BAT|89|1
  Abhishek Sharma|SRH|IND|AR|91|1
  Ishan Kishan|SRH|IND|WK|82|1
  Harshal Patel|SRH|IND|PACE|80|1
  Nitish Kumar Reddy|SRH|IND|AR|79|1
  Eshan Malinga|SRH|SL|PACE|68|1
  Brydon Carse|SRH|ENG|PACE|72|1
  Jaydev Unadkat|SRH|IND|PACE|68|1
  Kamindu Mendis|SRH|SL|AR|74|1
  Zeeshan Ansari|SRH|IND|SPIN|60|0
  Smaran Ravichandran|SRH|IND|BAT|60|0
  Aniket Verma|SRH|IND|BAT|70|0
  Harsh Dubey|SRH|IND|SPIN|64|0
  Liam Livingstone|SRH|ENG|AR|80|1
  Shivam Mavi|SRH|IND|PACE|64|1
  Shivang Kumar|SRH|IND|SPIN|55|0
  Salil Arora|SRH|IND|WK|60|0
  Sakib Hussain|SRH|IND|PACE|58|0
  Onkar Tarmale|SRH|IND|PACE|55|0
  Amit Kumar|SRH|IND|SPIN|55|0
  Praful Hinge|SRH|IND|PACE|56|0
  Krains Fuletra|SRH|IND|SPIN|55|0
  Jack Edwards|SRH|AUS|AR|70|1
  -- International players outside the 2026 IPL squads, and the best of the associate nations --
  Harry Brook|-|ENG|BAT|85|1
  Ben Stokes|-|ENG|AR|82|1
  Adil Rashid|-|ENG|SPIN|80|1
  Mark Wood|-|ENG|PACE|79|1
  Gus Atkinson|-|ENG|PACE|74|1
  Joe Root|-|ENG|BAT|74|1
  Liam Dawson|-|ENG|AR|72|1
  Adam Zampa|-|AUS|SPIN|82|1
  Glenn Maxwell|-|AUS|AR|79|1
  Steve Smith|-|AUS|BAT|76|1
  Jake Fraser-McGurk|-|AUS|BAT|76|1
  Spencer Johnson|-|AUS|PACE|74|1
  Aaron Hardie|-|AUS|AR|70|1
  Daryl Mitchell|-|NZ|AR|78|1
  Kane Williamson|-|NZ|BAT|77|1
  Devon Conway|-|NZ|WK|77|1
  Ish Sodhi|-|NZ|SPIN|74|1
  Michael Bracewell|-|NZ|AR|72|1
  Gerald Coetzee|-|SA|PACE|76|1
  Tabraiz Shamsi|-|SA|SPIN|76|1
  Keshav Maharaj|-|SA|SPIN|74|1
  Reeza Hendricks|-|SA|BAT|73|1
  Ottniel Baartman|-|SA|PACE|70|1
  Shai Hope|-|WI|WK|77|1
  Alzarri Joseph|-|WI|PACE|76|1
  Brandon King|-|WI|BAT|74|1
  Gudakesh Motie|-|WI|SPIN|72|1
  Rahmanullah Gurbaz|-|AFG|WK|79|1
  Fazalhaq Farooqi|-|AFG|PACE|77|1
  Mujeeb Ur Rahman|-|AFG|SPIN|75|1
  Naveen-ul-Haq|-|AFG|PACE|75|1
  Mohammad Nabi|-|AFG|AR|74|1
  Ibrahim Zadran|-|AFG|BAT|74|1
  Maheesh Theekshana|-|SL|SPIN|78|1
  Kusal Mendis|-|SL|WK|76|1
  Charith Asalanka|-|SL|BAT|74|1
  Dilshan Madushanka|-|SL|PACE|72|1
  Taskin Ahmed|-|BAN|PACE|74|1
  Litton Das|-|BAN|WK|72|1
  Towhid Hridoy|-|BAN|BAT|72|1
  Rishad Hossain|-|BAN|SPIN|70|1
  Sikandar Raza|-|ZIM|AR|77|1
  Blessing Muzarabani|-|ZIM|PACE|72|1
  Josh Little|-|IRE|PACE|74|1
  Paul Stirling|-|IRE|BAT|72|1
  Lorcan Tucker|-|IRE|WK|68|1
  Sandeep Lamichhane|-|NEP|SPIN|76|1
  Dipendra Singh Airee|-|NEP|AR|72|1
  Rohit Paudel|-|NEP|BAT|70|1
  Kushal Bhurtel|-|NEP|BAT|68|1
  Kushal Malla|-|NEP|AR|68|1
  Aasif Sheikh|-|NEP|WK|67|1
  Gulsan Jha|-|NEP|AR|65|1
  Sompal Kami|-|NEP|PACE|65|1
  Karan KC|-|NEP|PACE|64|1
  Lalit Rajbanshi|-|NEP|SPIN|64|1
  Saurabh Netravalkar|-|USA|PACE|70|1
  Aaron Jones|-|USA|BAT|68|1
  Ali Khan|-|USA|PACE|68|1
  Andries Gous|-|USA|WK|68|1
  Monank Patel|-|USA|WK|67|1
  Harmeet Singh|-|USA|SPIN|66|1
  Bas de Leede|-|NED|AR|72|1
  Logan van Beek|-|NED|AR|68|1
  Max ODowd|-|NED|BAT|67|1
  Scott Edwards|-|NED|WK|67|1
  Paul van Meekeren|-|NED|PACE|67|1
  Roelof van der Merwe|-|NED|SPIN|66|1
  Brandon McMullen|-|SCO|AR|70|1
  George Munsey|-|SCO|BAT|68|1
  Mark Watt|-|SCO|SPIN|66|1
  Richie Berrington|-|SCO|BAT|66|1
  Muhammad Waseem|-|UAE|BAT|69|1
  Gerhard Erasmus|-|NAM|AR|67|1
  Ruben Trumpelmann|-|NAM|PACE|66|1
  JJ Smit|-|NAM|AR|66|1
  Aqib Ilyas|-|OMA|AR|63|1
  Nicholas Kirton|-|CAN|BAT|64|1
  `;

  const PLAYERS = RAW.trim().split('\n').filter((l) => !l.trim().startsWith('--')).map((line, i) => {
    const [name, team, country, role, r, capped] = line.trim().split('|');
    return { id: i, name, team, country, role, r: +r, capped: capped === '1', os: country !== 'IND' };
  });


  // Country names (English, Nepali) and a colour for players who have no IPL team yet.
  const COUNTRIES = {
    IND: ['India', 'भारत', '#1f6fd1'], AUS: ['Australia', 'अस्ट्रेलिया', '#f2b600'], ENG: ['England', 'इङ्ल्यान्ड', '#1d3c8f'],
    SA: ['South Africa', 'दक्षिण अफ्रिका', '#0c7a43'], NZ: ['New Zealand', 'न्युजिल्यान्ड', '#222222'], WI: ['West Indies', 'वेस्ट इन्डिज', '#7b1e3a'],
    SL: ['Sri Lanka', 'श्रीलंका', '#183a8a'], AFG: ['Afghanistan', 'अफगानिस्तान', '#1565c0'], BAN: ['Bangladesh', 'बङ्गलादेश', '#00704a'],
    ZIM: ['Zimbabwe', 'जिम्बाब्वे', '#c8102e'], IRE: ['Ireland', 'आयरल्यान्ड', '#169b62'], NEP: ['Nepal', 'नेपाल', '#dc143c'],
    USA: ['USA', 'अमेरिका', '#22356f'], NED: ['Netherlands', 'नेदरल्यान्ड्स', '#f36c21'], SCO: ['Scotland', 'स्कटल्यान्ड', '#3b4f9b'],
    UAE: ['UAE', 'युएई', '#00732f'], NAM: ['Namibia', 'नामिबिया', '#003580'], OMA: ['Oman', 'ओमान', '#c8102e'], CAN: ['Canada', 'क्यानडा', '#d52b1e'],
  };

  // Home grounds. runs: scoring factor; spin: extra help for spinners.
  const VENUES = {
    CSK: { name: 'MA Chidambaram Stadium, Chennai', runs: 0.93, spin: 5 },
    DC: { name: 'Arun Jaitley Stadium, Delhi', runs: 1.05, spin: 0 },
    GT: { name: 'Narendra Modi Stadium, Ahmedabad', runs: 1.0, spin: 1 },
    KKR: { name: 'Eden Gardens, Kolkata', runs: 1.03, spin: 2 },
    LSG: { name: 'Ekana Stadium, Lucknow', runs: 0.94, spin: 4 },
    MI: { name: 'Wankhede Stadium, Mumbai', runs: 1.06, spin: 0 },
    PBKS: { name: 'New PCA Stadium, Mullanpur', runs: 0.98, spin: 0 },
    RR: { name: 'Sawai Mansingh Stadium, Jaipur', runs: 0.97, spin: 3 },
    RCB: { name: 'M Chinnaswamy Stadium, Bengaluru', runs: 1.12, spin: 0 },
    SRH: { name: 'Rajiv Gandhi Stadium, Hyderabad', runs: 1.08, spin: 1 },
  };

  const teamById = Object.fromEntries(TEAMS.map((t) => [t.id, t]));
  IPLA.data = { SEASON, TEAMS, PLAYERS, teamById, COUNTRIES, VENUES };
})();
