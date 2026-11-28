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
  -- More known names: Indian players without a 2026 IPL deal, and overseas T20 regulars --
  Mayank Agarwal|-|IND|BAT|68|1
  Deepak Hooda|-|IND|AR|66|1
  Umesh Yadav|-|IND|PACE|66|1
  Mohit Sharma|-|IND|PACE|68|1
  Navdeep Saini|-|IND|PACE|64|1
  Chetan Sakariya|-|IND|PACE|64|1
  Vijay Shankar|-|IND|AR|64|1
  KS Bharat|-|IND|WK|62|1
  Mandeep Singh|-|IND|BAT|60|1
  Sandeep Warrier|-|IND|PACE|60|1
  Kumar Kartikeya|-|IND|SPIN|63|0
  Akash Madhwal|-|IND|PACE|67|0
  Simarjeet Singh|-|IND|PACE|61|0
  Abhinav Manohar|-|IND|BAT|64|0
  Mahipal Lomror|-|IND|BAT|65|0
  Atharva Taide|-|IND|BAT|64|0
  Shams Mulani|-|IND|AR|60|0
  Tanush Kotian|-|IND|AR|62|0
  Anmolpreet Singh|-|IND|BAT|63|0
  Yash Dhull|-|IND|BAT|62|0
  Rajvardhan Hangargekar|-|IND|AR|60|0
  Vidwath Kaverappa|-|IND|PACE|62|0
  Lalit Yadav|-|IND|AR|60|0
  Darshan Nalkande|-|IND|PACE|58|0
  Swastik Chikara|-|IND|BAT|60|0
  Andre Siddarth|-|IND|BAT|58|0
  Vansh Bedi|-|IND|WK|58|0
  Shaik Rasheed|-|IND|BAT|60|0
  Priyam Garg|-|IND|BAT|58|0
  Suyash Prabhudessai|-|IND|BAT|58|0
  Mayank Dagar|-|IND|SPIN|58|0
  Vivrant Sharma|-|IND|AR|60|0
  Sanvir Singh|-|IND|AR|57|0
  Raj Limbani|-|IND|PACE|58|0
  Ishan Porel|-|IND|PACE|58|0
  Jonny Bairstow|-|ENG|WK|76|1
  Moeen Ali|-|ENG|AR|72|1
  Chris Woakes|-|ENG|PACE|72|1
  Jamie Smith|-|ENG|WK|72|1
  Saqib Mahmood|-|ENG|PACE|72|1
  Reece Topley|-|ENG|PACE|70|1
  Tymal Mills|-|ENG|PACE|70|1
  James Vince|-|ENG|BAT|70|1
  Rehan Ahmed|-|ENG|SPIN|68|1
  Chris Jordan|-|ENG|PACE|68|1
  Tom Curran|-|ENG|AR|66|1
  Dan Lawrence|-|ENG|BAT|66|1
  Sam Billings|-|ENG|WK|66|1
  Josh Tongue|-|ENG|PACE|66|1
  David Warner|-|AUS|BAT|74|1
  Sean Abbott|-|AUS|PACE|72|1
  Jason Behrendorff|-|AUS|PACE|70|1
  Jhye Richardson|-|AUS|PACE|70|1
  Tanveer Sangha|-|AUS|SPIN|70|1
  Riley Meredith|-|AUS|PACE|68|1
  Kane Richardson|-|AUS|PACE|68|1
  Ben McDermott|-|AUS|BAT|68|1
  Ashton Agar|-|AUS|AR|66|1
  Josh Philippe|-|AUS|WK|66|1
  Daniel Sams|-|AUS|AR|66|1
  Beau Webster|-|AUS|AR|66|1
  Rassie van der Dussen|-|SA|BAT|72|1
  Rilee Rossouw|-|SA|BAT|72|1
  Faf du Plessis|-|SA|BAT|72|1
  Wiaan Mulder|-|SA|AR|68|1
  George Linde|-|SA|AR|68|1
  Bjorn Fortuin|-|SA|SPIN|68|1
  Tony de Zorzi|-|SA|BAT|68|1
  Lizaad Williams|-|SA|PACE|68|1
  Nqaba Peter|-|SA|SPIN|64|1
  Senuran Muthusamy|-|SA|SPIN|64|1
  Mark Chapman|-|NZ|BAT|70|1
  Will ORourke|-|NZ|PACE|70|1
  Jimmy Neesham|-|NZ|AR|70|1
  Ben Sears|-|NZ|PACE|68|1
  Mitchell Hay|-|NZ|WK|64|1
  Tim Robinson|-|NZ|BAT|64|1
  Josh Clarkson|-|NZ|AR|62|1
  Shamar Joseph|-|WI|PACE|72|1
  Evin Lewis|-|WI|BAT|72|1
  Kyle Mayers|-|WI|AR|70|1
  Roston Chase|-|WI|AR|68|1
  Obed McCoy|-|WI|PACE|68|1
  Johnson Charles|-|WI|WK|68|1
  Oshane Thomas|-|WI|PACE|66|1
  Matthew Forde|-|WI|PACE|66|1
  Fabian Allen|-|WI|AR|64|1
  Jayden Seales|-|WI|PACE|64|1
  Keacy Carty|-|WI|BAT|62|1
  Kusal Perera|-|SL|WK|72|1
  Dunith Wellalage|-|SL|AR|70|1
  Dasun Shanaka|-|SL|AR|68|1
  Bhanuka Rajapaksa|-|SL|BAT|68|1
  Avishka Fernando|-|SL|BAT|68|1
  Jeffrey Vandersay|-|SL|SPIN|68|1
  Binura Fernando|-|SL|PACE|64|1
  Sediqullah Atal|-|AFG|BAT|68|1
  Gulbadin Naib|-|AFG|AR|66|1
  Karim Janat|-|AFG|AR|66|1
  Najibullah Zadran|-|AFG|BAT|66|1
  Fareed Ahmad|-|AFG|PACE|66|1
  Qais Ahmad|-|AFG|SPIN|66|1
  Darwish Rasooli|-|AFG|BAT|62|1
  Shakib Al Hasan|-|BAN|AR|70|1
  Nahid Rana|-|BAN|PACE|68|1
  Mehidy Hasan Miraz|-|BAN|AR|66|1
  Tanzim Hasan Sakib|-|BAN|PACE|66|1
  Shoriful Islam|-|BAN|PACE|66|1
  Parvez Hossain Emon|-|BAN|BAT|64|1
  Jaker Ali|-|BAN|WK|64|1
  Brian Bennett|-|ZIM|BAT|66|1
  Ryan Burl|-|ZIM|AR|64|1
  Richard Ngarava|-|ZIM|PACE|64|1
  Harry Tector|-|IRE|BAT|66|1
  Curtis Campher|-|IRE|AR|66|1
  Mark Adair|-|IRE|PACE|66|1
  Barry McCarthy|-|IRE|PACE|62|1
  Sundeep Jora|-|NEP|BAT|62|1
  Abinash Bohara|-|NEP|PACE|62|1
  Aarif Sheikh|-|NEP|BAT|60|1
  Kamal Singh Airee|-|NEP|AR|60|1
  Corey Anderson|-|USA|AR|66|1
  Steven Taylor|-|USA|BAT|62|1
  Nosthush Kenjige|-|USA|SPIN|62|1
  Vikramjit Singh|-|NED|BAT|62|1
  Michael Leask|-|SCO|AR|64|1
  Safyaan Sharif|-|SCO|PACE|62|1
  Alishan Sharafu|-|UAE|BAT|64|1
  Junaid Siddique|-|UAE|PACE|62|1
  Jatinder Singh|-|OMA|BAT|60|1
  `;

  // Playing styles (our reading of how each plays, not official data).
  // Batting: P = power hitter (big strike rate, more risk), A = anchor (builds an innings, fewer sixes early).
  // Bowling: D = death-overs specialist, N = new-ball / powerplay bowler.
  const POWER = 'Abhishek Sharma|Travis Head|Heinrich Klaasen|Nicholas Pooran|Phil Salt|Suryakumar Yadav|Rishabh Pant|Jos Buttler|Tim David|Shimron Hetmyer|Rinku Singh|Shivam Dube|Liam Livingstone|Glenn Maxwell|Harry Brook|Jake Fraser-McGurk|Vaibhav Sooryavanshi|Priyansh Arya|Prabhsimran Singh|Shashank Singh|Ashutosh Sharma|Dewald Brevis|Rovman Powell|Marcus Stoinis|Hardik Pandya|Sunil Narine|Cameron Green|Ishan Kishan|Yashasvi Jaiswal|Will Jacks|Finn Allen|Romario Shepherd|Sherfane Rutherford|Abdul Samad|Aniket Verma|Mitchell Marsh|Sanju Samson|Rahmanullah Gurbaz|Tristan Stubbs|David Miller|Sikandar Raza|Dipendra Singh Airee|Kushal Malla|Rohit Sharma|Venkatesh Iyer|Naman Dhir|Jitesh Sharma|Ayush Mhatre|Urvil Patel|Rajat Patidar|Ryan Rickelton|Josh Inglis|Quinton de Kock|Brandon King|Jonny Bairstow|Evin Lewis|David Warner|Rilee Rossouw|Kyle Mayers|Kusal Perera|Jimmy Neesham|Corey Anderson|Bhanuka Rajapaksa|Faf du Plessis|Abhinav Manohar|Deepak Hooda|Mahipal Lomror|Jamie Smith|Sediqullah Atal|Ryan Burl';
  const ANCHOR = 'Virat Kohli|Shubman Gill|Ruturaj Gaikwad|Sai Sudharsan|KL Rahul|Kane Williamson|Joe Root|Steve Smith|Ajinkya Rahane|Devdutt Padikkal|Aiden Markram|Devon Conway|Pathum Nissanka|Ibrahim Zadran|Reeza Hendricks|Rohit Paudel|Kusal Mendis|Shai Hope|Daryl Mitchell|Karun Nair|Sarfaraz Khan|Ben Duckett|Rachin Ravindra|Tilak Varma|Paul Stirling|Aasif Sheikh|Rassie van der Dussen|Mayank Agarwal|Mark Chapman|Tony de Zorzi|Atharva Taide|Harry Tector|Najibullah Zadran|James Vince';
  const DEATH = 'Jasprit Bumrah|Arshdeep Singh|Matheesha Pathirana|T Natarajan|Harshal Patel|Mitchell Starc|Avesh Khan|Mustafizur Rahman|Prasidh Krishna|Sandeep Sharma|Pat Cummins|Kagiso Rabada|Yash Dayal|Harshit Rana|Anrich Nortje|Lockie Ferguson|Naveen-ul-Haq|Nathan Ellis|Alzarri Joseph|Mohsin Khan|Tushar Deshpande|Mohit Sharma|Akash Madhwal|Tymal Mills|Chris Jordan|Obed McCoy|Nahid Rana|Kane Richardson';
  const NEWBALL = 'Trent Boult|Bhuvneshwar Kumar|Mohammed Siraj|Deepak Chahar|Josh Hazlewood|Mohammed Shami|Khaleel Ahmed|Jofra Archer|Fazalhaq Farooqi|Mitchell Starc|Matt Henry|Mukesh Kumar|Ishant Sharma|Akash Deep|Mark Wood|Marco Jansen|Josh Little|Saurabh Netravalkar|Sompal Kami|Chris Woakes|Reece Topley|Jason Behrendorff|Umesh Yadav|Shamar Joseph|Will ORourke|Mark Adair';
  const has = (list, n) => list.split('|').includes(n);

  // Batting and bowling skill (0-100), our reading of each player. The headline rating stays the
  // player's overall T20 value; these two decide what he actually does with bat and ball.
  // Only players who differ from the defaults below are listed: an all-rounder as bat/bowl, a bowler
  // who can bat as bat/ (Rashid Khan), a batter who bowls a bit as /bowl (Markram's off-spin).
  const SKILL = 'Shivam Dube:82/50|Jamie Overton:62/72|Ramakrishna Ghosh:54/56|Prashant Veer:62/64|Zak Foulkes:55/66|Matthew Short:74/55|Aman Khan:56/48|Axar Patel:76/86|Madhav Tiwari:52/54|Ajay Mandal:50/57|Rahul Tewatia:72/52|Washington Sundar:70/80|Glenn Phillips:78/58|Arshad Khan:55/62|Nishant Sindhu:56/56|Jason Holder:62/78|Sunil Narine:74/87|Ramandeep Singh:66/50|Anukul Roy:50/60|Cameron Green:84/76|Rachin Ravindra:80/62|Daksh Kamra:50/52|Mitchell Marsh:84/60|Shahbaz Ahmed:60/66|Arjun Tendulkar:42/58|Arshin Kulkarni:56/52|Hardik Pandya:84/82|Will Jacks:80/62|Naman Dhir:72/48|Shardul Thakur:58/72|Mitchell Santner:60/83|Corbin Bosch:58/68|Raj Angad Bawa:54/54|Mayank Rawat:50/52|Atharva Ankolekar:50/54|Marcus Stoinis:80/66|Marco Jansen:68/84|Mitchell Owen:74/55|Azmatullah Omarzai:70/78|Musheer Khan:58/54|Suryansh Shedge:60/50|Cooper Connolly:72/60|Riyan Parag:82/62|Ravindra Jadeja:76/85|Sam Curran:72/79|Krunal Pandya:66/78|Jacob Bethell:76/62|Romario Shepherd:70/70|Swapnil Singh:46/58|Venkatesh Iyer:77/45|Satvik Deswal:52/50|Kanishk Chouhan:46/55|Abhishek Sharma:92/58|Nitish Kumar Reddy:76/68|Kamindu Mendis:74/62|Liam Livingstone:80/64|Jack Edwards:60/70|Ben Stokes:78/76|Liam Dawson:60/72|Glenn Maxwell:79/68|Aaron Hardie:64/66|Daryl Mitchell:80/50|Michael Bracewell:66/70|Mohammad Nabi:66/74|Sikandar Raza:76/72|Dipendra Singh Airee:72/62|Kushal Malla:68/52|Gulsan Jha:56/64|Bas de Leede:66/70|Logan van Beek:54/68|Brandon McMullen:68/62|Gerhard Erasmus:64/62|JJ Smit:58/64|Aqib Ilyas:60/58|Deepak Hooda:66/52|Vijay Shankar:64/56|Shams Mulani:52/60|Tanush Kotian:54/62|Rajvardhan Hangargekar:52/60|Lalit Yadav:60/54|Vivrant Sharma:60/52|Sanvir Singh:56/54|Moeen Ali:70/70|Tom Curran:55/66|Ashton Agar:58/66|Daniel Sams:58/66|Beau Webster:64/62|Wiaan Mulder:64/66|George Linde:58/68|Jimmy Neesham:68/64|Josh Clarkson:62/56|Kyle Mayers:70/62|Roston Chase:62/68|Fabian Allen:60/62|Dunith Wellalage:58/70|Dasun Shanaka:66/62|Gulbadin Naib:62/64|Karim Janat:62/64|Shakib Al Hasan:64/72|Mehidy Hasan Miraz:60/66|Ryan Burl:62/60|Curtis Campher:64/62|Kamal Singh Airee:58/58|Corey Anderson:66/58|Michael Leask:62/60|Rashid Khan:62/|Pat Cummins:58/|Mitchell Starc:46/|Bhuvneshwar Kumar:46/|Deepak Chahar:50/|Harshal Patel:50/|Kyle Jamieson:52/|Jofra Archer:48/|Akeal Hosein:48/|Shreyas Gopal:48/|Chris Woakes:56/|Sean Abbott:50/|Chris Jordan:50/|Wanindu Hasaranga:56/|Noor Ahmad:34/|Yuzvendra Chahal:30/|Varun Chakravarthy:30/|Jasprit Bumrah:34/|Josh Hazlewood:34/|T Natarajan:30/|Mustafizur Rahman:30/|Kuldeep Yadav:42/|Ravi Bishnoi:34/|Aiden Markram:/62|Tilak Varma:/50|Nitish Rana:/52|Ayush Badoni:/48|Travis Head:/48|Rohit Paudel:/48|Kushal Bhurtel:/44';
  const SK = {};
  for (const x of SKILL.split('|')) { const [n, v] = x.split(':'); const [b, w] = v.split('/'); SK[n] = [b === '' ? null : +b, w === '' ? null : +w]; }
  // Defaults: a batter is all bat, a specialist bowler bats like a tail-ender, an all-rounder is a bit of both.
  function skills(role, r, name) {
    const o = SK[name] || [null, null];
    const bat = o[0] != null ? o[0] : role === 'BAT' || role === 'WK' ? r : role === 'AR' ? Math.round(r * 0.9) : 40;
    const bowl = o[1] != null ? o[1] : role === 'PACE' || role === 'SPIN' ? r : role === 'AR' ? Math.round(r * 0.86) : role === 'BAT' ? 38 : 30;
    return { bat, bowl };
  }

  const PLAYERS = RAW.trim().split('\n').filter((l) => !l.trim().startsWith('--')).map((line, i) => {
    const [name, team, country, role, r, capped] = line.trim().split('|');
    return { id: i, name, team, country, role, r: +r, ...skills(role, +r, name), capped: capped === '1', os: country !== 'IND', bs: has(POWER, name) ? 'P' : has(ANCHOR, name) ? 'A' : '', ws: has(DEATH, name) ? 'D' : has(NEWBALL, name) ? 'N' : '' };
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
  IPLA.data = { SEASON, TEAMS, PLAYERS, teamById, COUNTRIES, VENUES, skills };
})();
