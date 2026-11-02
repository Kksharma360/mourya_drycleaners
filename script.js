const $=s=>document.querySelector(s), $$=s=>document.querySelectorAll(s);
const progress=$('#progress');
window.addEventListener('scroll',()=>{const h=document.documentElement.scrollHeight-innerHeight;progress.style.width=(scrollY/h*100)+'%'; const navLinks=$$('#navLinks a'); let current='home'; $$('#navLinks a').forEach(a=>{const id=a.getAttribute('href').slice(1), el=document.getElementById(id); if(el && scrollY>=el.offsetTop-120) current=id}); navLinks.forEach(a=>a.classList.toggle('active',a.getAttribute('href')==='#'+current));});
const io=new IntersectionObserver(entries=>entries.forEach(e=>e.isIntersecting&&e.target.classList.add('show')),{threshold:.12}); $$('.reveal').forEach(x=>io.observe(x));
$('#menu').addEventListener('click',()=>$('#navLinks').classList.toggle('open')); $$('#navLinks a').forEach(a=>a.addEventListener('click',()=>$('#navLinks').classList.remove('open')));
// Multi-Select Services State & UI
const serviceWrapper=$('#serviceSelectWrapper'), serviceTrigger=$('#serviceTrigger'), serviceTriggerText=$('#serviceTriggerText'), serviceCheckboxes=$$('input[name="services"]'), chipButtons=$$('.chip-btn'), msClearBtn=$('#msClearBtn');
function getSelectedServices(){const sel=[]; serviceCheckboxes.forEach(cb=>{if(cb.checked) sel.push(cb.value);}); return sel;}
function updateServicesUI(){const sel=getSelectedServices(); if(serviceTriggerText){if(sel.length===0){serviceTriggerText.textContent='Choose service(s)...'; serviceTriggerText.classList.add('is-placeholder');} else if(sel.length<=2){serviceTriggerText.textContent=sel.join(', '); serviceTriggerText.classList.remove('is-placeholder');} else {serviceTriggerText.textContent=`${sel.length} Services (${sel.slice(0,2).join(', ')}...)`; serviceTriggerText.classList.remove('is-placeholder');}} chipButtons.forEach(chip=>{const sName=chip.dataset.service; if(sel.includes(sName)){chip.classList.add('active'); chip.textContent='✓ '+sName;} else {chip.classList.remove('active'); chip.textContent='+ '+sName;}});}
if(serviceTrigger&&serviceWrapper){serviceTrigger.addEventListener('click',e=>{e.stopPropagation(); const isOpen=serviceWrapper.classList.toggle('is-open'); serviceTrigger.setAttribute('aria-expanded',isOpen);}); document.addEventListener('click',e=>{if(serviceWrapper&&!serviceWrapper.contains(e.target)){serviceWrapper.classList.remove('is-open'); serviceTrigger.setAttribute('aria-expanded','false');}});}
serviceCheckboxes.forEach(cb=>cb.addEventListener('change',updateServicesUI));
chipButtons.forEach(chip=>chip.addEventListener('click',()=>{const sName=chip.dataset.service; const cb=$(`input[name="services"][value="${sName}"]`); if(cb){cb.checked=!cb.checked; updateServicesUI();}}));
if(msClearBtn) msClearBtn.addEventListener('click',e=>{e.stopPropagation(); serviceCheckboxes.forEach(cb=>cb.checked=false); updateServicesUI();});
$$('.service-card a[data-service]').forEach(a=>a.addEventListener('click',()=>{const sName=a.dataset.service; const cb=$(`input[name="services"][value="${sName}"]`); if(cb){cb.checked=true; updateServicesUI();}}));

// ==========================================================
// INTERACTIVE MAP PICKER (SWIGGY / BLINKIT STYLE PINNING)
// ==========================================================
// ==========================================================
// COMPREHENSIVE GURUGRAM DATABASE & SMART SEARCH ENGINE
// ==========================================================
const GURUGRAM_DATABASE = [
  // Workshop & Nearby
  { name: 'Dhobi Ghat, Basai (Mourya Workshop)', sub: 'Sukhveer Singh Yadav Marg, Near Educrest School', tags: 'workshop mourya dry cleaners basai sector 9b sukhveer educrest dhobi ghat', cat: 'Workshop', lat: 28.4735, lon: 76.9950, sectorKey: 'Sector 9B / Basai Village' },
  { name: 'Basai Village & Enclave', tags: 'basai village road 9b chungi enclave', sub: 'Sector 9B, Gurugram', cat: 'Locality', lat: 28.4735, lon: 76.9950, sectorKey: 'Sector 9B / Basai Village' },

  // Sectors 4 - 20
  { name: 'Sector 4', sub: 'Railway Station Road, Laxman Vihar', tags: 'sector 4 sec 4 railway station laxman vihar', cat: 'Sector', lat: 28.4820, lon: 77.0120, sectorKey: 'Sector 4 / 7 / 7 Ext' },
  { name: 'Sector 5', sub: 'Sheetla Mata Road, Sheetla Colony', tags: 'sector 5 sec 5 sheetla mata road colony', cat: 'Sector', lat: 28.4890, lon: 77.0180, sectorKey: 'Sector 4 / 7 / 7 Ext' },
  { name: 'Sector 7 / 7 Extension', sub: 'Krishna Nagar, Huda Market', tags: 'sector 7 sec 7 ext krishna nagar', cat: 'Sector', lat: 28.4700, lon: 77.0150, sectorKey: 'Sector 4 / 7 / 7 Ext' },
  { name: 'Sector 9 / 9A', sub: 'ESIC Hospital, Ravi Nagar, Basai Road', tags: 'sector 9 sec 9 9a ravi nagar esic hospital', cat: 'Sector', lat: 28.4780, lon: 77.0050, sectorKey: 'Sector 9 / 9A' },
  { name: 'Sector 9B', sub: 'Near Basai Village & Flyover', tags: 'sector 9b sec 9b basai enclave', cat: 'Sector', lat: 28.4735, lon: 76.9950, sectorKey: 'Sector 9B / Basai Village' },
  { name: 'Sector 10 / 10A', sub: 'Hero Honda Chowk, Pace City 1', tags: 'sector 10 sec 10 10a civil hospital hero honda chowk pace city khandsa', cat: 'Sector', lat: 28.4520, lon: 77.0020, sectorKey: 'Sector 10 / 10A / Hero Honda Chowk' },
  { name: 'Sector 11 / 11A', sub: 'Shivaji Nagar, Jail Road', tags: 'sector 11 sec 11 11a shivaji nagar', cat: 'Sector', lat: 28.4610, lon: 77.0250, sectorKey: 'Other Gurugram Location' },
  { name: 'Sector 12 / 12A', sub: 'Old Bus Stand Road, Prem Nagar', tags: 'sector 12 sec 12 12a bus stand prem nagar', cat: 'Sector', lat: 28.4680, lon: 77.0320, sectorKey: 'Other Gurugram Location' },
  { name: 'Sector 14', sub: 'Main Market, Mehrauli-Gurgaon Road', tags: 'sector 14 sec 14 main market mg road mehrauli om sweets', cat: 'Sector', lat: 28.4740, lon: 77.0430, sectorKey: 'Sector 14 / 15 / 17' },
  { name: 'Sector 15 Part 1 & Part 2', sub: 'NH-48, 32nd Avenue / Milestone', tags: 'sector 15 sec 15 part 1 part 2 nh8 nh48 32nd milestone avenue', cat: 'Sector', lat: 28.4620, lon: 77.0420, sectorKey: 'Sector 14 / 15 / 17' },
  { name: 'Sector 17 / 17A / 17B', sub: 'IFFCO Chowk, Bata Chowk, Air Force School', tags: 'sector 17 sec 17 bata chowk air force iffco', cat: 'Sector', lat: 28.4830, lon: 77.0490, sectorKey: 'Sector 14 / 15 / 17' },

  // Sectors 21 - 40
  { name: 'Sector 21', sub: 'Dundahera, Old Delhi Gurgaon Road', tags: 'sector 21 sec 21 palam vihar dundahera', cat: 'Sector', lat: 28.5130, lon: 77.0620, sectorKey: 'Sector 21 / 22 / 23 / 23A' },
  { name: 'Sector 22 / 22A / 22B', sub: 'Maruti Udyog, Near Palam Vihar', tags: 'sector 22 sec 22 22a maruti udyog', cat: 'Sector', lat: 28.5080, lon: 77.0650, sectorKey: 'Sector 21 / 22 / 23 / 23A' },
  { name: 'Sector 23 / 23A', sub: 'Near Columbia Asia / Manipal Hospital', tags: 'sector 23 sec 23 23a cart road huda market', cat: 'Sector', lat: 28.5080, lon: 77.0480, sectorKey: 'Sector 21 / 22 / 23 / 23A' },
  { name: 'Sector 24 (DLF Phase 3)', sub: 'Moulsari Avenue, Cyber City, U Block', tags: 'sector 24 sec 24 dlf phase 3 cyber city moulsari u block ambrosia', cat: 'DLF', lat: 28.4980, lon: 77.0980, sectorKey: 'DLF Phase 1 / 2 / 3 / 4 / 5' },
  { name: 'Sector 25 (DLF Phase 2)', sub: 'MG Road, IFFCO Chowk Metro, Belvedere', tags: 'sector 25 sec 25 dlf phase 2 mg road iffco chowk metro', cat: 'DLF', lat: 28.4850, lon: 77.0870, sectorKey: 'DLF Phase 1 / 2 / 3 / 4 / 5' },
  { name: 'Sector 26 (DLF Phase 1)', sub: 'Sikanderpur Metro, Golf Course Road Entry', tags: 'sector 26 sec 26 dlf phase 1 sikanderpur metro golf course road silver oaks', cat: 'DLF', lat: 28.4790, lon: 77.1020, sectorKey: 'DLF Phase 1 / 2 / 3 / 4 / 5' },
  { name: 'Sector 27', sub: 'Galleria Market, Sushant Lok 1', tags: 'sector 27 sec 27 galleria market sushant lok 1 peach tree', cat: 'Sector', lat: 28.4680, lon: 77.0860, sectorKey: 'DLF Phase 1 / 2 / 3 / 4 / 5' },
  { name: 'Sector 28', sub: 'DLF Phase 4, Hamilton Court, Regency Park', tags: 'sector 28 sec 28 dlf phase 4 chakkarpur hamilton regency', cat: 'DLF', lat: 28.4720, lon: 77.0920, sectorKey: 'DLF Phase 1 / 2 / 3 / 4 / 5' },
  { name: 'Sector 29', sub: 'Leisure Valley Park, Food Hub, Huda Metro', tags: 'sector 29 sec 29 leisure valley kingdom of dreams huda city centre restaurants', cat: 'Commercial', lat: 28.4680, lon: 77.0650, sectorKey: 'Sector 31 / 32 / 38 / 39' },
  { name: 'Sector 30', sub: 'Uniworld City, The Palms, Star Mall', tags: 'sector 30 sec 30 uniworld city residency palms star mall', cat: 'Sector', lat: 28.4590, lon: 77.0620, sectorKey: 'Sector 31 / 32 / 38 / 39' },
  { name: 'Sector 31', sub: 'Huda Market, Near Rajiv Chowk', tags: 'sector 31 sec 31 huda market rajiv chowk nh48 om sweets', cat: 'Sector', lat: 28.4550, lon: 77.0500, sectorKey: 'Sector 31 / 32 / 38 / 39' },
  { name: 'Sector 32', sub: 'Institutional Area, Near Medanta Hospital', tags: 'sector 32 sec 32 institutional area medanta', cat: 'Institutional', lat: 28.4480, lon: 77.0420, sectorKey: 'Sector 31 / 32 / 38 / 39' },
  { name: 'Sector 33', sub: 'Subhash Chowk, Sohna Road Entry', tags: 'sector 33 sec 33 subhash chowk sohna road islampur', cat: 'Sector', lat: 28.4380, lon: 77.0320, sectorKey: 'Sohna Road / Subhash Chowk' },
  { name: 'Sector 34', sub: 'Infocity, Hero Honda Industrial Area', tags: 'sector 34 sec 34 infocity hero honda', cat: 'Industrial', lat: 28.4350, lon: 77.0180, sectorKey: 'Sector 10 / 10A / Hero Honda Chowk' },
  { name: 'Sector 37 / 37C / 37D', sub: 'Pace City 2, Ramprastha, Corona Optus', tags: 'sector 37 sec 37 37c 37d pace city 2 ramprastha corona imperia bpte', cat: 'Sector', lat: 28.4450, lon: 76.9850, sectorKey: 'Other Gurugram Location' },
  { name: 'Sector 38', sub: 'Medanta The Medicity, Bakhtawar Chowk', tags: 'sector 38 sec 38 medanta the medicity hospital bakhtawar chowk', cat: 'Sector', lat: 28.4380, lon: 77.0450, sectorKey: 'Sector 31 / 32 / 38 / 39' },
  { name: 'Sector 39', sub: 'Unitech Cyber Park, Bakhtawar Chowk', tags: 'sector 39 sec 39 unitech cyber park bakhtawar', cat: 'Sector', lat: 28.4420, lon: 77.0560, sectorKey: 'Sector 31 / 32 / 38 / 39' },
  { name: 'Sector 40', sub: 'South City 1, Near Unitech Cyber Park', tags: 'sector 40 sec 40 south city 1 unitech', cat: 'Sector', lat: 28.4520, lon: 77.0650, sectorKey: 'Sector 45 / 46 / 47 / 48 / 49' },

  // Sectors 41 - 60
  { name: 'Sector 41', sub: 'South City 1, Near Millennium City Metro', tags: 'sector 41 sec 41 south city 1 huda city centre metro', cat: 'Sector', lat: 28.4570, lon: 77.0720, sectorKey: 'Sector 45 / 46 / 47 / 48 / 49' },
  { name: 'Sector 42', sub: 'DLF Phase 5, Rapid Metro, Central Plaza', tags: 'sector 42 sec 42 dlf phase 5 golf course road rapid metro central plaza', cat: 'DLF', lat: 28.4610, lon: 77.0980, sectorKey: 'Golf Course Road & Ext' },
  { name: 'Sector 43', sub: 'Sushant Lok 1, Global Foyer, Gold Souk', tags: 'sector 43 sec 43 sushant lok 1 global foyer gold souk', cat: 'Sector', lat: 28.4540, lon: 77.0850, sectorKey: 'DLF Phase 1 / 2 / 3 / 4 / 5' },
  { name: 'Sector 44', sub: 'Taj City Centre, Institutional Area', tags: 'sector 44 sec 44 taj city centre institutional metro', cat: 'Institutional', lat: 28.4500, lon: 77.0750, sectorKey: 'Sector 45 / 46 / 47 / 48 / 49' },
  { name: 'Sector 45', sub: 'Greenwood City, Near Artemis Hospital', tags: 'sector 45 sec 45 greenwoods city unitech', cat: 'Sector', lat: 28.4420, lon: 77.0720, sectorKey: 'Sector 45 / 46 / 47 / 48 / 49' },
  { name: 'Sector 46', sub: 'Amity International School, Huda Market', tags: 'sector 46 sec 46 amity international huda market', cat: 'Sector', lat: 28.4350, lon: 77.0650, sectorKey: 'Sector 45 / 46 / 47 / 48 / 49' },
  { name: 'Sector 47', sub: 'Malibu Towne, Kohli Market, Subhash Chowk', tags: 'sector 47 sec 47 malibu towne subhash chowk kohli market', cat: 'Sector', lat: 28.4280, lon: 77.0500, sectorKey: 'Sector 45 / 46 / 47 / 48 / 49' },
  { name: 'Sector 48', sub: 'Sohna Road, Vipul Greens, Central Park 2', tags: 'sector 48 sec 48 sohna road vipul greens central park universal trade tower jmd megapolis', cat: 'Sector', lat: 28.4180, lon: 77.0420, sectorKey: 'Sector 45 / 46 / 47 / 48 / 49' },
  { name: 'Sector 49', sub: 'Vatika City, South City 2, Rosewood City', tags: 'sector 49 sec 49 vatika city south city 2 eros rosewood city eros city square', cat: 'Sector', lat: 28.4120, lon: 77.0580, sectorKey: 'Sector 45 / 46 / 47 / 48 / 49' },
  { name: 'Sector 50', sub: 'Nirvana Country, Baani Square, Fresco', tags: 'sector 50 sec 50 nirvana country unitech baani square south city 2 fresco deerwood aspen', cat: 'Sector', lat: 28.4180, lon: 77.0700, sectorKey: 'Sector 50 / 51 / 52 / 53 / 54 / 56' },
  { name: 'Sector 51', sub: 'Artemis Hospital, Mayfield Gardens', tags: 'sector 51 sec 51 artemis hospital mayfield garden samaspur', cat: 'Sector', lat: 28.4250, lon: 77.0780, sectorKey: 'Sector 50 / 51 / 52 / 53 / 54 / 56' },
  { name: 'Sector 52 / 52A', sub: 'Ardee City, Wazirabad, Koyal Vihar', tags: 'sector 52 sec 52 ardee city wazirabad ardee mall', cat: 'Sector', lat: 28.4350, lon: 77.0850, sectorKey: 'Sector 50 / 51 / 52 / 53 / 54 / 56' },
  { name: 'Sector 53', sub: 'DLF Phase 5, One Horizon Center, Aralias', tags: 'sector 53 sec 53 dlf phase 5 the aralias the magnolias one horizon center albatross', cat: 'DLF', lat: 28.4480, lon: 77.1020, sectorKey: 'Golf Course Road & Ext' },
  { name: 'Sector 54', sub: 'Suncity, Aravali Hills, Golf Course Road', tags: 'sector 54 sec 54 suncity golf course road aravali rapid metro', cat: 'Sector', lat: 28.4400, lon: 77.1120, sectorKey: 'Golf Course Road & Ext' },
  { name: 'Sector 55 / 56', sub: 'Devinder Vihar, Huda Market, More Hypermarket', tags: 'sector 55 sec 55 56 huda market devinder vihar more market metro', cat: 'Sector', lat: 28.4280, lon: 77.1050, sectorKey: 'Sector 50 / 51 / 52 / 53 / 54 / 56' },
  { name: 'Sector 57', sub: 'Sushant Lok 3, Hong Kong Bazaar, Rail Vihar', tags: 'sector 57 sec 57 sushant lok 3 hong kong bazaar rail vihar', cat: 'Sector', lat: 28.4200, lon: 77.0880, sectorKey: 'Sector 50 / 51 / 52 / 53 / 54 / 56' },

  // Sectors 60 - 110
  { name: 'Sector 62', sub: 'Golf Course Extension Road, Pioneer Park', tags: 'sector 62 sec 62 golf course ext pioneer park heritage school', cat: 'Sector', lat: 28.4100, lon: 77.1000, sectorKey: 'Golf Course Road & Ext' },
  { name: 'Sector 65', sub: 'M3M Golfestate, Emaar Emerald Hills', tags: 'sector 65 sec 65 emaar emerald hills m3m golfestate dlf', cat: 'Sector', lat: 28.3980, lon: 77.0720, sectorKey: 'Golf Course Road & Ext' },
  { name: 'Sector 66 / 67', sub: 'Ireo Victory Valley, Bestech Park View', tags: 'sector 66 67 sec 66 sec 67 ireo victory valley bestech park view sohna road', cat: 'Sector', lat: 28.3850, lon: 77.0580, sectorKey: 'Sohna Road / Subhash Chowk' },
  { name: 'Sector 70 / 70A', sub: 'Southern Peripheral Road (SPR), BPTP', tags: 'sector 70 sec 70 70a spr southern peripheral road bptp astaire', cat: 'Sector', lat: 28.3920, lon: 77.0180, sectorKey: 'Other Gurugram Location' },
  { name: 'Sector 82 / 83', sub: 'Vatika India Next, New Gurgaon', tags: 'sector 82 sec 82 83 vatika india next new gurgaon highway', cat: 'Sector', lat: 28.3850, lon: 76.9620, sectorKey: 'Other Gurugram Location' },
  { name: 'Sector 84 / 85 / 86', sub: 'Dwarka Expressway Entry, SS The Leaf', tags: 'sector 84 sec 84 85 86 dwarka expressway microtek ss', cat: 'Sector', lat: 28.3920, lon: 76.9450, sectorKey: 'Other Gurugram Location' },
  { name: 'Sector 102 / 103 / 104', sub: 'Dwarka Expressway, Hero Homes, Puri Emerald', tags: 'sector 102 sec 102 103 104 dwarka expressway hero homes puri emerald', cat: 'Sector', lat: 28.4850, lon: 76.9650, sectorKey: 'Other Gurugram Location' },

  // Famous Societies & Landmarks
  { name: 'Palam Vihar (Blocks A to J)', sub: 'Ansal Palam Vihar, Vyapar Kendra, Chiranjiv', tags: 'palam vihar block a b c d e f g h i j vyapar kendra ansal', cat: 'Society', lat: 28.5080, lon: 77.0300, sectorKey: 'Palam Vihar / Carterpuri' },
  { name: 'Sushant Lok Phase 1', sub: 'Galleria Market, Vyapar Kendra, Sector 27/43', tags: 'sushant lok 1 phase 1 galleria vyapar kendra', cat: 'Society', lat: 28.4620, lon: 77.0820, sectorKey: 'DLF Phase 1 / 2 / 3 / 4 / 5' },
  { name: 'Sushant Lok Phase 2 & 3', sub: 'Hong Kong Bazaar, Sector 57', tags: 'sushant lok 2 3 phase 2 3 hong kong bazar', cat: 'Society', lat: 28.4250, lon: 77.0850, sectorKey: 'Sector 50 / 51 / 52 / 53 / 54 / 56' },
  { name: 'Ardee City', sub: 'Sector 52, Ardee Mall, Gates 1-3', tags: 'ardee city gate 1 2 3 sector 52 ardee mall', cat: 'Society', lat: 28.4350, lon: 77.0820, sectorKey: 'Sector 50 / 51 / 52 / 53 / 54 / 56' },
  { name: 'Nirvana Country', sub: 'Sector 50, Baani Square, Aspen, Deerwood', tags: 'nirvana country aspen deerwood fresco courtyards baani square sector 50', cat: 'Society', lat: 28.4180, lon: 77.0700, sectorKey: 'Sector 50 / 51 / 52 / 53 / 54 / 56' },
  { name: 'South City 1', sub: 'Sector 40 / 41, Arcade Market, Signature Tower', tags: 'south city 1 arcade sector 41 signature tower', cat: 'Society', lat: 28.4550, lon: 77.0680, sectorKey: 'Sector 45 / 46 / 47 / 48 / 49' },
  { name: 'South City 2', sub: 'Sector 49, Arcadia Market, Sohna Road', tags: 'south city 2 f block arcadia sector 49 sohna road', cat: 'Society', lat: 28.4120, lon: 77.0580, sectorKey: 'Sector 45 / 46 / 47 / 48 / 49' },
  { name: 'Malibu Towne', sub: 'Sector 47, Sohna Road, Country Club', tags: 'malibu towne country club sector 47 sohna road', cat: 'Society', lat: 28.4280, lon: 77.0500, sectorKey: 'Sector 45 / 46 / 47 / 48 / 49' },
  { name: 'DLF Cyber Hub & Cyber City', sub: 'DLF Phase 2 / 3, Rapid Metro, Belvedere', tags: 'cyber hub cyber city dlf phase 2 3 belvedere infinity towers', cat: 'Commercial', lat: 28.4950, lon: 77.0880, sectorKey: 'DLF Phase 1 / 2 / 3 / 4 / 5' },
  { name: 'Ambience Mall Gurugram', sub: 'NH-48, Ambience Lagoon, Leela Hotel', tags: 'ambience mall island lagoon dlf phase 3 nh48 leela', cat: 'Mall', lat: 28.5040, lon: 77.0970, sectorKey: 'DLF Phase 1 / 2 / 3 / 4 / 5' },
  { name: 'Galleria Market DLF 4', sub: 'Sector 28, Fountain Chowk', tags: 'galleria market dlf phase 4 sector 28', cat: 'Market', lat: 28.4670, lon: 77.0820, sectorKey: 'DLF Phase 1 / 2 / 3 / 4 / 5' },
  { name: 'Sadar Bazar / Old Railway Road', sub: 'New Colony, Jama Masjid, Khandsa Chowk', tags: 'sadar bazar old railway road new colony khandsa road jacobpura', cat: 'Market', lat: 28.4600, lon: 77.0280, sectorKey: 'Old Railway Road / New Colony / Sadar' },
  { name: 'Rajiv Chowk (Gurugram)', sub: 'NH-48, Mini Secretariat, Courts', tags: 'rajiv chowk mini secretariat court sohna chowk nh48', cat: 'Chowk', lat: 28.4520, lon: 77.0350, sectorKey: 'Other Gurugram Location' },
  { name: 'Subhash Chowk', sub: 'Sohna Road, Islampur Village', tags: 'subhash chowk sohna road islampur', cat: 'Chowk', lat: 28.4350, lon: 77.0380, sectorKey: 'Sohna Road / Subhash Chowk' },
  { name: 'Hero Honda Chowk', sub: 'Khandsa, NH-48, Sector 10A / 34', tags: 'hero honda chowk khandsa sector 10a 34', cat: 'Chowk', lat: 28.4350, lon: 77.0080, sectorKey: 'Sector 10 / 10A / Hero Honda Chowk' },
  { name: 'Sheetla Mata Mandir', sub: 'Sector 5, Sheetla Mata Road', tags: 'sheetla mata mandir road sector 5 temple', cat: 'Landmark', lat: 28.4850, lon: 77.0220, sectorKey: 'Sector 4 / 7 / 7 Ext' },
  { name: 'Huda City Centre (Millennium City)', sub: 'Yellow Line Metro, Fortis & Max Hospital', tags: 'huda city centre millennium metro station fortis max hospital', cat: 'Metro', lat: 28.4590, lon: 77.0720, sectorKey: 'Sector 31 / 32 / 38 / 39' },
  { name: 'Vatika City', sub: 'Sector 49, Sohna Road', tags: 'vatika city sohna road sector 49', cat: 'Society', lat: 28.4120, lon: 77.0580, sectorKey: 'Sector 45 / 46 / 47 / 48 / 49' },
  { name: 'Vipul Greens', sub: 'Sector 48, Sohna Road', tags: 'vipul greens sohna road sector 48', cat: 'Society', lat: 28.4180, lon: 77.0420, sectorKey: 'Sector 45 / 46 / 47 / 48 / 49' }
];
let leafletMap = null;
let currentPinnedCoords = { lat: 28.4735, lon: 76.9950 };
let currentPinnedAddress = 'Dhobi Ghat, Sukhveer Singh Yadav Marg, Basai Village, Sector 9B, Gurugram';
let geocodeDebounceTimer = null;
let gpsAccuracyCircle = null;

const mapModal = $('#mapModalBackdrop');
const btnOpenMap = $('#btnOpenMapModal');
const btnCloseMap = $('#btnCloseMapModal');
const btnConfirmLocation = $('#btnConfirmLocation');
const btnLocateGps = $('#btnLocateGps');
const mapSearchInput = $('#mapSearchInput');
const mapSearchClear = $('#mapSearchClear');
const mapSearchDropdown = $('#mapSearchDropdown');
const addrInput = $('#address');

function updateLiveCoordsDisplay(lat, lon) {
  const coordsEl = $('#modalCoordsText');
  if (coordsEl) coordsEl.textContent = `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
}

// Nominatim Reverse Geocoding with BigDataCloud fallback (100% Free, reliable)
function reverseGeocodeNominatim(lat, lon) {
  const modalAddressText = $('#modalAddressText');
  if (modalAddressText) modalAddressText.textContent = 'Locating building & street address...';

  fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`, {
    headers: { 'Accept-Language': 'en' }
  })
  .then(res => {
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return res.json();
  })
  .then(data => {
    if (data && data.display_name) {
      currentPinnedAddress = data.display_name;
      if (modalAddressText) modalAddressText.textContent = currentPinnedAddress;
    } else {
      fallbackAddress(lat, lon);
    }
  })
  .catch(() => {
    // BigDataCloud client API fallback (instant, generous limits)
    fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`)
      .then(r => r.json())
      .then(bdc => {
        const parts = [];
        if (bdc.locality && bdc.locality !== bdc.city) parts.push(bdc.locality);
        if (bdc.city) parts.push(bdc.city);
        if (bdc.principalSubdivision) parts.push(bdc.principalSubdivision);
        const match = GURUGRAM_DATABASE.find(item => Math.hypot(item.lat - lat, item.lon - lon) < 0.015);
        if (match) {
          currentPinnedAddress = `${match.name}, ${parts.join(', ') || 'Gurugram'}`;
        } else if (parts.length > 0) {
          currentPinnedAddress = `${parts.join(', ')} (${lat.toFixed(4)}, ${lon.toFixed(4)})`;
        } else {
          fallbackAddress(lat, lon);
        }
        if (modalAddressText) modalAddressText.textContent = currentPinnedAddress;
      })
      .catch(() => {
        fallbackAddress(lat, lon);
      });
  });
}

function fallbackAddress(lat, lon) {
  const modalAddressText = $('#modalAddressText');
  const match = GURUGRAM_DATABASE.find(item => Math.hypot(item.lat - lat, item.lon - lon) < 0.005);
  if (match) {
    currentPinnedAddress = `${match.name}, Gurugram`;
  } else {
    currentPinnedAddress = `Pinned Location (${lat.toFixed(4)}, ${lon.toFixed(4)}), Gurugram`;
  }
  if (modalAddressText) modalAddressText.textContent = currentPinnedAddress;
}

function populateQuickChips() {
  const chipsContainer = $('#mapQuickChips');
  if (!chipsContainer || chipsContainer.children.length > 1) return;

  const keyQuickSectors = [
    { name: 'Basai / Sec 9B (Workshop)', lat: 28.4735, lon: 76.9950 },
    { name: 'Sector 9 / 9A', lat: 28.4780, lon: 77.0050 },
    { name: 'Sector 4 / 7', lat: 28.4700, lon: 77.0150 },
    { name: 'Sector 14 / 15', lat: 28.4710, lon: 77.0450 },
    { name: 'Sector 10 / 10A', lat: 28.4520, lon: 77.0020 },
    { name: 'Sector 21 / 22 / 23', lat: 28.5080, lon: 77.0500 },
    { name: 'Palam Vihar', lat: 28.5080, lon: 77.0300 },
    { name: 'Sector 48 / Sohna Rd', lat: 28.4180, lon: 77.0420 },
    { name: 'Nirvana / Sec 50', lat: 28.4180, lon: 77.0700 },
    { name: 'DLF Cyber City / Ph 3', lat: 28.4950, lon: 77.0900 },
    { name: 'Golf Course Rd', lat: 28.4550, lon: 77.1000 }
  ];

  keyQuickSectors.forEach(sec => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'map-chip';
    chip.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="#1a73e8" style="vertical-align: middle; flex-shrink: 0;"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg><span>${sec.name}</span>`;
    chip.addEventListener('click', () => {
      if (leafletMap) {
        leafletMap.setView([sec.lat, sec.lon], 16);
      }
    });
    chipsContainer.appendChild(chip);
  });
}

// Full Gurugram Search via Nominatim API (shows ALL real locations like Google Maps)
function setupLocalSearch() {
  if (!mapSearchInput || !mapSearchDropdown) return;

  let searchDebounce = null;
  let nominatimAbort = null;

  const pinSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="#EA4335"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>`;
  const searchSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="#1a73e8"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>`;
  const spinnerSvg = `<svg class="spin-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2.5"><circle cx="12" cy="12" r="9" stroke-dasharray="45" stroke-dashoffset="15" stroke-linecap="round"></circle></svg>`;

  function attachResultClicks() {
    mapSearchDropdown.querySelectorAll('.search-result-item').forEach(el => {
      el.addEventListener('click', () => {
        const lat = parseFloat(el.dataset.lat);
        const lon = parseFloat(el.dataset.lon);
        if (leafletMap) leafletMap.setView([lat, lon], 17);
        mapSearchInput.value = el.querySelector('.s-item-title').textContent;
        mapSearchDropdown.style.display = 'none';
        if (mapSearchClear) mapSearchClear.style.display = 'block';
      });
    });
  }

  mapSearchInput.addEventListener('input', () => {
    const q = mapSearchInput.value.trim();
    if (mapSearchClear) mapSearchClear.style.display = q ? 'block' : 'none';

    clearTimeout(searchDebounce);
    if (nominatimAbort) { nominatimAbort.abort(); nominatimAbort = null; }

    if (q.length < 2) {
      mapSearchDropdown.style.display = 'none';
      mapSearchDropdown.innerHTML = '';
      return;
    }

    // Show loading state
    mapSearchDropdown.innerHTML = `<div class="search-result-item" style="opacity: 0.6; pointer-events: none;">
      <div class="s-item-left"><span class="s-item-icon">${spinnerSvg}</span><div><div class="s-item-title">Searching "${q}" in Gurugram...</div></div></div>
    </div>`;
    mapSearchDropdown.style.display = 'block';

    searchDebounce = setTimeout(() => {
      nominatimAbort = new AbortController();
      const searchQuery = encodeURIComponent(q + ', Gurugram');

      fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&q=${searchQuery}&countrycodes=in&viewbox=76.85,28.55,77.15,28.35&bounded=1&limit=10&addressdetails=1`, {
        headers: { 'Accept-Language': 'en' },
        signal: nominatimAbort.signal
      })
      .then(res => res.json())
      .then(data => {
        if (!data || data.length === 0) {
          mapSearchDropdown.innerHTML = `<div class="search-result-item" style="opacity: 0.6; pointer-events: none;">
            <div class="s-item-left"><span class="s-item-icon">${searchSvg}</span><div><div class="s-item-title">No results found for "${q}"</div><div class="s-item-sub">Try a different name, e.g. "DLF Phase 3" or "Medanta Hospital"</div></div></div>
          </div>`;
          mapSearchDropdown.style.display = 'block';
          return;
        }

        mapSearchDropdown.innerHTML = data.map(place => {
          const name = place.name || place.display_name.split(',')[0];
          const parts = place.display_name.split(',');
          const sub = parts.slice(1, 4).join(',').trim();
          const rawType = (place.type || place.category || 'place').replace(/_/g, ' ');
          const badge = rawType.charAt(0).toUpperCase() + rawType.slice(1);
          return `<div class="search-result-item" data-lat="${place.lat}" data-lon="${place.lon}">
            <div class="s-item-left">
              <span class="s-item-icon">${pinSvg}</span>
              <div>
                <div class="s-item-title">${name}</div>
                <div class="s-item-sub">${sub}</div>
              </div>
            </div>
            <span class="s-item-badge">${badge}</span>
          </div>`;
        }).join('');

        mapSearchDropdown.style.display = 'block';
        attachResultClicks();
      })
      .catch(err => {
        if (err.name !== 'AbortError') console.warn('Search error:', err);
      });
    }, 300);
  });

  mapSearchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const first = mapSearchDropdown.querySelector('.search-result-item:not([style*="pointer-events"])');
      if (first) first.click();
    }
  });

  document.addEventListener('click', (e) => {
    if (!mapSearchInput.contains(e.target) && !mapSearchDropdown.contains(e.target)) {
      mapSearchDropdown.style.display = 'none';
    }
  });

  if (mapSearchClear) {
    mapSearchClear.addEventListener('click', () => {
      mapSearchInput.value = '';
      mapSearchClear.style.display = 'none';
      mapSearchDropdown.style.display = 'none';
      mapSearchDropdown.innerHTML = '';
      if (nominatimAbort) { nominatimAbort.abort(); nominatimAbort = null; }
    });
  }
}

// Initialize Leaflet Map with Google Roadmap Tiles (100% Free)
function initLeafletMap() {
  const mapEl = document.getElementById('interactiveLeafletMap');
  if (!mapEl || leafletMap) return;

  leafletMap = L.map(mapEl, {
    center: [currentPinnedCoords.lat, currentPinnedCoords.lon],
    zoom: 16,
    zoomControl: false,
    attributionControl: true
  });

  // Google Roadmap Tiles (free, no API key needed)
  L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
    maxZoom: 20,
    attribution: '&copy; Google Maps'
  }).addTo(leafletMap);

  // Zoom control bottom-left
  L.control.zoom({ position: 'topleft' }).addTo(leafletMap);

  const centerPinEl = $('#swiggyCenterPin');

  leafletMap.on('movestart', () => {
    if (centerPinEl) centerPinEl.classList.add('is-dragging');
  });

  leafletMap.on('moveend', () => {
    if (centerPinEl) centerPinEl.classList.remove('is-dragging');
    const center = leafletMap.getCenter();
    const lat = center.lat;
    const lon = center.lng;
    currentPinnedCoords = { lat, lon };
    updateLiveCoordsDisplay(lat, lon);

    clearTimeout(geocodeDebounceTimer);
    geocodeDebounceTimer = setTimeout(() => {
      reverseGeocodeNominatim(lat, lon);
    }, 400);
  });

  setupLocalSearch();
  populateQuickChips();
}

function openMapModal() {
  if (mapModal) {
    mapModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';

    if (!leafletMap) {
      setTimeout(() => {
        initLeafletMap();
        if (leafletMap) {
          reverseGeocodeNominatim(currentPinnedCoords.lat, currentPinnedCoords.lon);
        }
      }, 100);
    } else {
      setTimeout(() => {
        leafletMap.invalidateSize();
        leafletMap.setView([currentPinnedCoords.lat, currentPinnedCoords.lon], leafletMap.getZoom());
        reverseGeocodeNominatim(currentPinnedCoords.lat, currentPinnedCoords.lon);
      }, 100);
    }
  }
}

function closeMapModal() {
  if (mapModal) {
    mapModal.style.display = 'none';
    document.body.style.overflow = '';
  }
}

if (btnOpenMap) btnOpenMap.addEventListener('click', openMapModal);
if (btnCloseMap) btnCloseMap.addEventListener('click', closeMapModal);
if (mapModal) {
  mapModal.addEventListener('click', (e) => {
    if (e.target === mapModal) closeMapModal();
  });
}

// ==========================================================
// HIGH-PRECISION 1-CLICK GPS DETECTION (Google Maps Doorstep Accuracy)
// ==========================================================
let gpsWatchId = null;
let gpsSafetyTimeout = null;
let isLocatingGps = false;

function locateHighAccuracyGps() {
  if (isLocatingGps) return;

  if (!navigator.geolocation) {
    alert('Location / GPS is not supported by your browser.');
    return;
  }

  // Clear any existing active watch
  if (gpsWatchId !== null) {
    navigator.geolocation.clearWatch(gpsWatchId);
    gpsWatchId = null;
  }
  if (gpsSafetyTimeout !== null) {
    clearTimeout(gpsSafetyTimeout);
    gpsSafetyTimeout = null;
  }

  const iconGpsCrosshair = `<svg class="icon-gps-crosshair" width="18" height="18" viewBox="0 0 24 24" fill="#1a73e8" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3A8.994 8.994 0 0 0 13 3.06V1h-2v2.06A8.994 8.994 0 0 0 3.06 11H1v2h2.06A8.994 8.994 0 0 0 11 20.94V23h2v-2.06A8.994 8.994 0 0 0 20.94 13H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/>
  </svg>`;
  const iconGpsSpinner = `<svg class="spin-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1a73e8" stroke-width="2.5" style="vertical-align: middle;">
    <circle cx="12" cy="12" r="9" stroke-dasharray="45" stroke-dashoffset="15" stroke-linecap="round"></circle>
  </svg>`;

  isLocatingGps = true;
  if (btnLocateGps) {
    btnLocateGps.innerHTML = `${iconGpsSpinner} <span id="btnLocateText">Detecting GPS...</span>`;
    btnLocateGps.disabled = true;
  }

  let bestPosition = null;
  let hasPannedMap = false;

  const cleanup = () => {
    isLocatingGps = false;
    if (gpsWatchId !== null) {
      navigator.geolocation.clearWatch(gpsWatchId);
      gpsWatchId = null;
    }
    if (gpsSafetyTimeout !== null) {
      clearTimeout(gpsSafetyTimeout);
      gpsSafetyTimeout = null;
    }
    if (btnLocateGps) {
      btnLocateGps.innerHTML = `${iconGpsCrosshair} <span id="btnLocateText">Your Location</span>`;
      btnLocateGps.disabled = false;
    }
  };

  const applyGpsFix = (pos, isFinal) => {
    const lat = pos.coords.latitude;
    const lon = pos.coords.longitude;
    const acc = Math.round(pos.coords.accuracy || 20);

    currentPinnedCoords = { lat, lon };
    updateLiveCoordsDisplay(lat, lon);

    if (leafletMap) {
      if (gpsAccuracyCircle) {
        leafletMap.removeLayer(gpsAccuracyCircle);
      }
      gpsAccuracyCircle = L.circle([lat, lon], {
        color: '#1a73e8',
        fillColor: '#4285f4',
        fillOpacity: 0.15,
        weight: 2,
        radius: Math.min(Math.max(acc, 15), 350)
      }).addTo(leafletMap);

      leafletMap.setView([lat, lon], acc < 100 ? 18 : 17);
    }

    reverseGeocodeNominatim(lat, lon);

    if (isFinal) {
      cleanup();
    }
  };

  // Continuous high-accuracy GPS watch to get exact doorstep coordinates
  gpsWatchId = navigator.geolocation.watchPosition(
    (pos) => {
      const acc = pos.coords.accuracy;

      if (!bestPosition || acc < bestPosition.coords.accuracy) {
        bestPosition = pos;
      }

      // Immediately center map on first fix
      if (!hasPannedMap) {
        hasPannedMap = true;
        applyGpsFix(pos, false);
      }

      // If high accuracy (< 65m) is reached, lock immediately
      if (acc <= 65) {
        applyGpsFix(pos, true);
      }
    },
    (err) => {
      // Silently ignore transient errors while acquiring satellite lock
      console.warn('GPS scanning attempt:', err.code, err.message);
      if (err.code === 1) { // PERMISSION_DENIED
        cleanup();
        alert('Location access is blocked. Please allow Location in your browser address bar.');
      }
    },
    {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 15000
    }
  );

  // Safety lock after 7 seconds: finalize with the best reading acquired
  gpsSafetyTimeout = setTimeout(() => {
    if (bestPosition) {
      applyGpsFix(bestPosition, true);
    } else {
      // Fallback to standard network position if satellite takes too long
      navigator.geolocation.getCurrentPosition(
        (networkPos) => {
          applyGpsFix(networkPos, true);
        },
        (networkErr) => {
          cleanup();
          if (networkErr.code === 1) {
            alert('Location permission was denied. Please enable Location in your browser address bar.');
          } else {
            alert('Could not lock GPS location. Please turn ON Device Location / GPS or search your area above.');
          }
        },
        {
          enableHighAccuracy: false,
          timeout: 5000
        }
      );
    }
  }, 7000);
}

if (btnLocateGps) {
  btnLocateGps.addEventListener('click', locateHighAccuracyGps);
}

// Confirm Location Button
if (btnConfirmLocation) {
  btnConfirmLocation.addEventListener('click', () => {
    const gpsLinkInput = $('#gpsLink');
    const pinnedLocInput = $('#pinnedLocation');
    const gpsStatus = $('#gpsStatusText');
    const gpsRow = $('#gpsStatusRow');
    const gpsViewLink = $('#gpsViewLink');
    const btnMapPinLabel = $('#btnMapPinLabel');
    const locAreaSelect = $('#locationArea');

    const lat = currentPinnedCoords.lat, lon = currentPinnedCoords.lon;
    const mapUrl = `https://maps.google.com/?q=${lat},${lon}`;

    if (pinnedLocInput) {
      pinnedLocInput.value = `${currentPinnedAddress} (${lat.toFixed(4)}, ${lon.toFixed(4)})`;
    }
    if (gpsLinkInput) gpsLinkInput.value = mapUrl;

    if (btnMapPinLabel) btnMapPinLabel.textContent = '✓ Location Pinned on Map';
    if (btnOpenMap) btnOpenMap.classList.add('is-captured');

    if (gpsStatus) {
      gpsStatus.textContent = `✓ Pinned: ${currentPinnedAddress || (lat.toFixed(4) + ', ' + lon.toFixed(4))}`;
    }
    if (gpsViewLink) gpsViewLink.href = mapUrl;
    if (gpsRow) gpsRow.style.display = 'flex';

    // Auto-match sector dropdown if empty or not selected
    if (locAreaSelect && (!locAreaSelect.value || locAreaSelect.value === '')) {
      const match = GURUGRAM_DATABASE.find(s => {
        const dist = Math.hypot(s.lat - lat, s.lon - lon);
        return dist < 0.022; // ~1.8km radius
      });
      if (match && match.sectorKey) {
        locAreaSelect.value = match.sectorKey;
      }
    }

    closeMapModal();

    // Auto-focus on address input so user writes their exact house/flat number immediately
    setTimeout(() => {
      const addrEl = $('#address');
      if (addrEl) {
        addrEl.focus();
        addrEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 250);
  });
}

// Pickup Date Calendar (Strictly Today or Tomorrow, dynamic every day)
const pickupDateInput = $('#pickupDate');
const dateHiddenInput = $('#date');
const dateHintTag = $('#dateHintTag');
const dateHintSub = $('#dateHintSub');
const dateDisplayHint = $('#dateDisplayHint');

const padZero = n => String(n).padStart(2, '0');
const toISODate = d => `${d.getFullYear()}-${padZero(d.getMonth() + 1)}-${padZero(d.getDate())}`;

const fmtPrettyDate = d => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${days[d.getDay()]}, ${padZero(d.getDate())} ${months[d.getMonth()]} ${d.getFullYear()}`;
};

function initPickupCalendar() {
  const now = new Date();
  const tom = new Date();
  tom.setDate(now.getDate() + 1);

  const todayISO = toISODate(now);
  const tomISO = toISODate(tom);

  if (pickupDateInput) {
    pickupDateInput.min = todayISO;
    pickupDateInput.max = tomISO;
    pickupDateInput.value = todayISO;

    // Pop native calendar open on any click
    pickupDateInput.addEventListener('click', () => {
      try {
        if (pickupDateInput.showPicker) {
          pickupDateInput.showPicker();
        }
      } catch (err) {}
    });

    const handleDateChange = () => {
      let val = pickupDateInput.value;
      if (!val) {
        val = todayISO;
        pickupDateInput.value = val;
      }

      // Enforce strictly today or tomorrow
      if (val < todayISO) {
        val = todayISO;
        pickupDateInput.value = val;
      } else if (val > tomISO) {
        val = tomISO;
        pickupDateInput.value = val;
      }

      const isToday = (val === todayISO);
      const isTom = (val === tomISO);

      let chosenDateObj;
      const parts = val.split('-');
      if (parts.length === 3) {
        chosenDateObj = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      } else {
        chosenDateObj = isToday ? now : tom;
      }

      const prettyDate = fmtPrettyDate(chosenDateObj);

      if (isTom) {
        if (dateHintTag) dateHintTag.textContent = 'Tomorrow (कल)';
        if (dateDisplayHint) dateDisplayHint.classList.add('is-tomorrow');
        if (dateHintSub) dateHintSub.textContent = prettyDate;
        if (dateHiddenInput) dateHiddenInput.value = `Tomorrow (${prettyDate})`;
      } else {
        if (dateHintTag) dateHintTag.textContent = 'Today (आज)';
        if (dateDisplayHint) dateDisplayHint.classList.remove('is-tomorrow');
        if (dateHintSub) dateHintSub.textContent = prettyDate;
        if (dateHiddenInput) dateHiddenInput.value = `Today (${prettyDate})`;
      }
    };

    pickupDateInput.addEventListener('change', handleDateChange);
    pickupDateInput.addEventListener('input', handleDateChange);
    handleDateChange();
  }
}

initPickupCalendar();

function bookingData(){
  const notesEl=$('#notes'), locEl=$('#locationArea'), addrEl=$('#address'), pinnedEl=$('#pinnedLocation'), gpsEl=$('#gpsLink');
  return {
    name: $('#name') ? $('#name').value.trim() : '',
    phone: $('#phone') ? $('#phone').value.trim() : '',
    services: getSelectedServices(),
    location: locEl ? locEl.value : '',
    pinnedLocation: pinnedEl ? pinnedEl.value.trim() : '',
    address: addrEl ? addrEl.value.trim() : '',
    gps: gpsEl ? gpsEl.value : '',
    date: $('#date') ? $('#date').value : '',
    time: $('#time') ? $('#time').value : '',
    notes: notesEl ? notesEl.value.trim() : ''
  };
}

function valid(b, isWhatsAppDirect = false){
  if(!b.name){ alert('Please enter your Name.'); $('#name')&&$('#name').focus(); return false; }
  if(!b.phone || !/^\d{10}$/.test(b.phone.replace(/\D/g,''))){ alert('Please enter a valid 10-digit mobile number.'); $('#phone')&&$('#phone').focus(); return false; }
  
  if (isWhatsAppDirect) {
    if(!b.services || b.services.length === 0) b.services = ['Dry Cleaning / Laundry'];
    if(!b.location) b.location = 'Gurugram';
    if(!b.address) b.address = 'Shared on WhatsApp chat';
    if(!b.date) b.date = 'Today / Earliest available slot';
    return true;
  }

  if(b.services.length === 0){ alert('Please select at least one Service.'); return false; }
  if(!b.location){ alert('Please select your Location / Sector in Gurugram (Mandatory).'); $('#locationArea')&&$('#locationArea').focus(); return false; }
  if(!b.gps && !b.pinnedLocation){
    alert('Please open the map and pin your doorstep location (Mandatory).');
    openMapModal();
    return false;
  }
  if(!b.address || b.address.length < 3){
    alert('Please enter your complete House / Flat No., Society / Building Address (Mandatory).');
    $('#address')&&$('#address').focus();
    return false;
  }
  if(!b.date){ alert('Please select your Pickup Date (Today or Tomorrow).'); return false; }
  return true;
}

// Firebase initialization for customer bookings
const mdcFirebaseConfig = {
  apiKey: "AIzaSyAAKvT-Ta4WauKWD9pFSaWxjKKr9KdhlCE",
  authDomain: "mourya-drycleaners-46036.firebaseapp.com",
  projectId: "mourya-drycleaners-46036",
  storageBucket: "mourya-drycleaners-46036.firebasestorage.app",
  messagingSenderId: "489158981671",
  appId: "1:489158981671:web:23269f5307891a43c33602"
};

function getMdcFirestore() {
  if (typeof firebase !== 'undefined' && firebase.apps) {
    if (!firebase.apps.length) {
      firebase.initializeApp(mdcFirebaseConfig);
    }
    return firebase.firestore();
  }
  return null;
}

function generateUniqueBookingId() {
  // Guaranteed collision-proof: millisecond timestamp + 4-digit cryptographic/math entropy
  const timestamp = Date.now();
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `BOOK-${timestamp}-${randomSuffix}`;
}

async function saveBookingOrder(b) {
  const fullAddress = b.address + (b.pinnedLocation ? ` [Map Pin: ${b.pinnedLocation}]` : '');
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const monthStr = `${yyyy}-${mm}`;
  const dateStr = `${yyyy}-${mm}-${dd}`;
  const bookingId = b.bookingId || generateUniqueBookingId();
  b.bookingId = bookingId;

  const payload = {
    id: bookingId,
    bookingId: bookingId,
    name: b.name || '',
    phone: b.phone || '',
    services: b.services || [],
    location: b.location || '',
    sector: b.location || '',
    address: fullAddress,
    pinnedLocation: b.pinnedLocation || '',
    gps: b.gps || '',
    date: b.date || '',
    pickupDate: dateStr,
    time: b.time || 'Flexible',
    notes: b.notes || '',
    pickupDone: false,
    paymentDone: false,
    deliveryDone: false,
    paymentScreenshot: '',
    receivedAt: now.toISOString(),
    createdAt: now.toISOString(),
    month: monthStr
  };

  try {
    const db = getMdcFirestore();
    if (db) {
      // Hierarchy: bookings -> month -> date -> bookingId
      await db.collection('bookings').doc(monthStr).collection(dateStr).doc(bookingId).set(payload);
      await db.collection('bookings').doc(monthStr).set({
        month: monthStr,
        dates: firebase.firestore.FieldValue.arrayUnion(dateStr),
        lastUpdated: now.toISOString()
      }, { merge: true });
      console.log('[Firebase] Order saved in Firestore at bookings/' + monthStr + '/' + dateStr + '/' + bookingId);
    }
  } catch (err) {
    console.warn('[Firebase] Order save notice:', err.message);
  }
}

function getBookingWAMsg(b){
  const lines = [
    'Hi Mourya Dry Cleaners, I want to book a pickup.',
    ...(b.bookingId ? [`📄 *Booking Ref:* ${b.bookingId}`] : []),
    '',
    `• Name: ${b.name}`,
    `• Phone: ${b.phone}`,
    `• Services: ${b.services && b.services.length ? b.services.join(', ') : 'Dry Cleaning / Laundry'}`,
    `• Location / Sector: ${b.location || 'Gurugram'}`,
    `• House/Flat & Doorstep Address: ${b.address}`
  ];
  if(b.pinnedLocation){ lines.push(`• Pinned Area: ${b.pinnedLocation}`); }
  if(b.gps){ lines.push(`• Google Map Direct Pin: ${b.gps}`); }
  lines.push(`• Pickup Date: ${b.date || 'Earliest slot'}`);
  lines.push(`• Preferred Time: ${b.time || 'Flexible'}`);
  if(b.notes){ lines.push(`• Additional Note: ${b.notes}`); }
  return encodeURIComponent(lines.join('\n'));
}

async function handleBookingSubmission(triggerBtn, isWhatsAppDirect = false) {
  const b = bookingData();
  if (!valid(b, isWhatsAppDirect)) return;
  b.bookingId = generateUniqueBookingId();

  const originalHtml = triggerBtn.innerHTML;
  triggerBtn.disabled = true;
  triggerBtn.innerHTML = '<span>💬</span> Opening WhatsApp...';

  // Save booking to database
  try {
    saveBookingOrder(b);
  } catch(e) {}

  // Open WhatsApp in new tab / app directly
  const waUrl = 'https://wa.me/919217410047?text=' + getBookingWAMsg(b);
  
  try {
    const waWin = window.open(waUrl, '_blank');
    if (!waWin || waWin.closed || typeof waWin.closed === 'undefined') {
      window.location.href = waUrl;
    }
  } catch(e) {
    window.location.href = waUrl;
  }

  setTimeout(() => {
    triggerBtn.disabled = false;
    triggerBtn.innerHTML = originalHtml;
  }, 1000);
}

if ($('#bookBtn')) {
  $('#bookBtn').onclick = (e) => {
    e.preventDefault();
    handleBookingSubmission($('#bookBtn'), false);
  };
}

if ($('#waBtn')) {
  $('#waBtn').onclick = (e) => {
    e.preventDefault();
    handleBookingSubmission($('#waBtn'), true);
  };
}

// Hero Laundry Wash & Steam Press Animation Controller
const heroCopy = $('#heroCopy');
const btnReplay = $('#btnReplay');

function playFullSequence() {
  if (!heroCopy) return;
  heroCopy.classList.remove('animating');
  void heroCopy.offsetWidth; // Force CSS reflow to restart full cycle
  heroCopy.classList.add('animating');
}

if (btnReplay) {
  btnReplay.addEventListener('click', playFullSequence);
}
const washHeading = $('.wash-heading');
if (washHeading) {
  washHeading.addEventListener('click', playFullSequence);
}

// Rate Card Interactive Filters & Search
const rateSearch = $('#rateCardSearchInput');
const rateClear = $('#rateSearchClear');
const rateCards = $$('.rc-card');
const noRateMatch = $('#noRateMatch');
const rateQueryText = $('#rateQueryText');
const tabButtons = $$('#rateTabs .tab-btn');

function filterRateCard() {
  const query = rateSearch ? rateSearch.value.trim().toLowerCase() : '';
  const activeTab = $('#rateTabs .tab-btn.active')?.dataset.tab || 'all';

  if (rateClear) {
    rateClear.style.display = query ? 'flex' : 'none';
  }

  let totalVisibleItems = 0;

  rateCards.forEach(card => {
    const cardCat = card.dataset.category;
    const matchesTab = activeTab === 'all' || activeTab === cardCat;

    if (!matchesTab) {
      card.classList.add('is-hidden');
      return;
    }

    const items = card.querySelectorAll('.rc-item');
    let cardVisibleCount = 0;

    items.forEach(item => {
      const text = item.textContent.toLowerCase();
      if (!query || text.includes(query)) {
        item.classList.remove('is-match-hidden');
        cardVisibleCount++;
      } else {
        item.classList.add('is-match-hidden');
      }
    });

    if (cardVisibleCount > 0) {
      card.classList.remove('is-hidden');
      totalVisibleItems += cardVisibleCount;
    } else {
      card.classList.add('is-hidden');
    }
  });

  if (noRateMatch) {
    if (totalVisibleItems === 0) {
      noRateMatch.style.display = 'block';
      if (rateQueryText) rateQueryText.textContent = query;
    } else {
      noRateMatch.style.display = 'none';
    }
  }
}

if (rateSearch) {
  rateSearch.addEventListener('input', filterRateCard);
}

if (rateClear) {
  rateClear.addEventListener('click', () => {
    rateSearch.value = '';
    filterRateCard();
    rateSearch.focus();
  });
}

tabButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    tabButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    filterRateCard();
  });
});

// Print Rate Card
const modalPrintRate = $('#modalPrintRateBtn');
if (modalPrintRate) {
  modalPrintRate.addEventListener('click', () => {
    document.body.classList.add('printing-ratecard-poster');
    window.print();
    setTimeout(() => document.body.classList.remove('printing-ratecard-poster'), 1000);
  });
}
const btnPrintRate = $('#btnPrintRateCard');
if (btnPrintRate) {
  btnPrintRate.addEventListener('click', () => {
    document.body.classList.add('printing-ratecard-poster');
    window.print();
    setTimeout(() => document.body.classList.remove('printing-ratecard-poster'), 1000);
  });
}

// Rate Poster Modal
const modal = $('#ratePosterModal');
const btnOpenModal = $('#btnOpenCardModal');
const btnCloseModal = $('#closeCardModalBtn');

function openModal() {
  if (modal) modal.classList.add('is-open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  if (modal) modal.classList.remove('is-open');
  document.body.style.overflow = '';
}

if (btnOpenModal) btnOpenModal.addEventListener('click', openModal);
if (btnCloseModal) btnCloseModal.addEventListener('click', closeModal);
if (modal) {
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });
}
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && modal && modal.classList.contains('is-open')) {
    closeModal();
  }
});

// ==========================================================
// GOOGLE REVIEWS / TESTIMONIALS AUTO-SLIDER CONTROLLER
// ==========================================================
(function initGoogleReviewsSlider() {
  const track = document.getElementById('track');
  const prevBtn = document.getElementById('prev');
  const nextBtn = document.getElementById('next');
  const dotsContainer = document.getElementById('dots');
  if (!track) return;

  const cards = track.querySelectorAll('.testimonial');
  const dots = dotsContainer ? dotsContainer.querySelectorAll('span') : [];
  if (!cards.length) return;

  let currentIndex = 0;
  let autoSlideTimer = null;
  const slideInterval = 3800; // 3.8 seconds auto slide

  function getCardsPerView() {
    if (window.innerWidth <= 600) return 1;
    if (window.innerWidth <= 900) return 2;
    return 3;
  }

  function getMaxIndex() {
    const perView = getCardsPerView();
    return Math.max(0, cards.length - perView);
  }

  function updateSlider(index, smooth = true) {
    const maxIdx = getMaxIndex();
    if (index > maxIdx) {
      currentIndex = 0;
    } else if (index < 0) {
      currentIndex = maxIdx;
    } else {
      currentIndex = index;
    }

    const card = cards[0];
    const gap = 15;
    const cardWidth = card ? card.getBoundingClientRect().width : 300;
    const scrollAmount = currentIndex * (cardWidth + gap);

    track.scrollTo({
      left: scrollAmount,
      behavior: smooth ? 'smooth' : 'auto'
    });

    // Update active dot
    dots.forEach((dot, idx) => {
      dot.classList.toggle('on', idx === currentIndex);
    });
  }

  function nextSlide() {
    const maxIdx = getMaxIndex();
    if (currentIndex >= maxIdx) {
      updateSlider(0);
    } else {
      updateSlider(currentIndex + 1);
    }
  }

  function prevSlide() {
    const maxIdx = getMaxIndex();
    if (currentIndex <= 0) {
      updateSlider(maxIdx);
    } else {
      updateSlider(currentIndex - 1);
    }
  }

  function startAutoSlide() {
    stopAutoSlide();
    autoSlideTimer = setInterval(nextSlide, slideInterval);
  }

  function stopAutoSlide() {
    if (autoSlideTimer) {
      clearInterval(autoSlideTimer);
      autoSlideTimer = null;
    }
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      nextSlide();
      startAutoSlide();
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      prevSlide();
      startAutoSlide();
    });
  }

  dots.forEach((dot, idx) => {
    dot.addEventListener('click', () => {
      updateSlider(idx);
      startAutoSlide();
    });
  });

  // Pause when user hovers over reviews to read them
  track.addEventListener('mouseenter', stopAutoSlide);
  track.addEventListener('mouseleave', startAutoSlide);

  // Touch swipe gestures for mobile & tablet
  let touchStartX = 0;
  let touchEndX = 0;
  track.addEventListener('touchstart', (e) => {
    stopAutoSlide();
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });

  track.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    if (touchStartX - touchEndX > 45) {
      nextSlide();
    } else if (touchEndX - touchStartX > 45) {
      prevSlide();
    }
    startAutoSlide();
  }, { passive: true });

  window.addEventListener('resize', () => {
    updateSlider(currentIndex, false);
  });

  // Start automatic sliding
  startAutoSlide();
})();




// ==========================================================
// ANIMATED COUNTER CONTROLLER (Clothes Washed & Customers)
// Bot-safe: Googlebot / crawlers see final values instantly
// ==========================================================
(function initCounterAnimation() {
  var isCrawler = (typeof navigator !== 'undefined') &&
    (navigator.webdriver === true ||
     /bot|googlebot|crawler|spider|robot|crawling|lighthouse|headless/i.test(navigator.userAgent));

  function startCounters() {
    const statCounts = document.querySelectorAll('.stat-count');
    if (!statCounts.length) return;

    // Crawlers & bots: show final values immediately, no animation
    if (isCrawler || !('IntersectionObserver' in window)) {
      statCounts.forEach(el => {
        el.innerText = el.getAttribute('data-display') || el.innerText;
      });
      return;
    }

    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateStat(entry.target);
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });

    statCounts.forEach(el => observer.observe(el));
  }

  function animateStat(el) {
    const targetType = el.getAttribute('data-type') || 'number';
    const targetVal = parseFloat(el.getAttribute('data-target') || '0');
    const finalDisplay = el.getAttribute('data-display') || el.innerText;
    const duration = 900; // 900ms fast count-up (was 2000ms)
    const startFraction = 0.5; // Start from 50% of target (never 0.0)
    let startTime = null;

    function step(currentTime) {
      if (!startTime) startTime = currentTime;
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutExpo for dramatic rolling number effect
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      // Blend from startFraction to 1.0 so DOM never shows "0.0" or "0+"
      const blended = startFraction + ease * (1 - startFraction);

      if (targetType === 'lac') {
        if (progress < 1) {
          const cur = (blended * targetVal).toFixed(1);
          el.innerText = cur + ' Lac+';
        } else {
          el.innerText = finalDisplay; // '2 Lac+'
          el.classList.add('counter-celebrate');
        }
      } else if (targetType === 'number') {
        if (progress < 1) {
          const cur = Math.floor(blended * targetVal);
          el.innerText = cur.toLocaleString('en-IN') + '+';
        } else {
          el.innerText = finalDisplay; // '10,000+'
          el.classList.add('counter-celebrate');
        }
      }

      if (progress < 1) {
        requestAnimationFrame(step);
      }
    }

    requestAnimationFrame(step);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startCounters);
  } else {
    startCounters();
  }
})();
