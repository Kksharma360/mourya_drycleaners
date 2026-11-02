import os
import json

# Comprehensive database of Gurgaon sectors and localities
LOCATIONS = [
    # DLF Corridors & Townships
    {
        "name": "DLF Phase 1",
        "slug": "dlf-phase-1",
        "landmarks": "Galleria Market, Silver Oaks, Beverly Park, Nathupur, Qutab Plaza",
        "lat": 28.4820, "lng": 77.0980, "pincode": "122002",
        "desc": "premium residential bungalows, designer boutiques, and corporate executives",
        "cluster": "DLF City"
    },
    {
        "name": "DLF Phase 2",
        "slug": "dlf-phase-2",
        "landmarks": "Central Arcade, Oakwood Way, Sikanderpur, Belvedere Towers, Cyber City boundary",
        "lat": 28.4880, "lng": 77.0860, "pincode": "122002",
        "desc": "bustling urban avenues, luxury villas, and multi-story modern condominiums",
        "cluster": "DLF City"
    },
    {
        "name": "DLF Phase 3",
        "slug": "dlf-phase-3",
        "landmarks": "Pink Town House, U-Block, Moulsari Avenue, DLF Cyber City gateway, Ambience Island",
        "lat": 28.4970, "lng": 77.0930, "pincode": "122002",
        "desc": "high-density corporate workforce residences, executive floors, and independent luxury builder floors",
        "cluster": "DLF City"
    },
    {
        "name": "DLF Phase 4",
        "slug": "dlf-phase-4",
        "landmarks": "Galleria Market, Hamilton Court, Ridgewood Estate, Regency Park, Supermart 1",
        "lat": 28.4680, "lng": 77.0850, "pincode": "122009",
        "desc": "prime residential high-rises, thriving commercial hubs, and elite families",
        "cluster": "DLF City"
    },
    {
        "name": "DLF Phase 5",
        "slug": "dlf-phase-5",
        "landmarks": "Horizon Center, The Magnolias, The Aralias, The Camellias, DLF The Crest, Club5",
        "lat": 28.4550, "lng": 77.0950, "pincode": "122009",
        "desc": "ultra-luxury residential estates, haute couture garments, and five-star lifestyle standards",
        "cluster": "DLF City"
    },
    {
        "name": "Cyber City",
        "slug": "cyber-city",
        "landmarks": "Cyber Hub, Infinity Towers, Building 9/10, DLF Epitome, Gateway Tower",
        "lat": 28.4950, "lng": 77.0890, "pincode": "122002",
        "desc": "Gurugram's Fortune 500 corporate epicentre requiring fast 24-hour suit, shirt & corporate garment care",
        "cluster": "Commercial Hubs"
    },
    {
        "name": "Udyog Vihar",
        "slug": "udyog-vihar",
        "landmarks": "Udyog Vihar Phase 1 to 5, Shankar Chowk, Ambience Mall surroundings, DLF Cyber City link",
        "lat": 28.5050, "lng": 77.0870, "pincode": "122016",
        "desc": "premier tech parks, startup headquarters, and export houses needing 24-hour commercial & executive dry cleaning",
        "cluster": "Commercial Hubs"
    },
    {
        "name": "Sushant Lok Phase 1",
        "slug": "sushant-lok-1",
        "landmarks": "Vyapar Kendra, Gold Souk, Paras Hospital, Laburnum, Millennium City Centre Metro",
        "lat": 28.4650, "lng": 77.0780, "pincode": "122009",
        "desc": "central established township with lush residential greens, villas, and boutique apartments",
        "cluster": "Sushant Lok & South City"
    },
    {
        "name": "Sushant Lok Phase 2 & 3",
        "slug": "sushant-lok-2-3",
        "landmarks": "Hong Kong Bazaar, Sector 56/57 boundary, Florence Marvel, Rail Vihar",
        "lat": 28.4350, "lng": 77.0880, "pincode": "122011",
        "desc": "peaceful residential neighborhoods with family homes, gated streets, and active shopping corridors",
        "cluster": "Sushant Lok & South City"
    },
    {
        "name": "South City 1",
        "slug": "south-city-1",
        "landmarks": "Signature Towers, Sector 40/41, 32nd Avenue (32nd Milestone), Unitech Cyber Park",
        "lat": 28.4600, "lng": 77.0600, "pincode": "122001",
        "desc": "classic township known for tree-lined avenues, senior professionals, and luxury independent villas",
        "cluster": "Sushant Lok & South City"
    },
    {
        "name": "South City 2",
        "slug": "south-city-2",
        "landmarks": "Arcadia Market, Sector 49/50, Nirvana Country border, Good Earth City Centre",
        "lat": 28.4250, "lng": 77.0580, "pincode": "122018",
        "desc": "family-friendly community close to major Sohna Road retail centers and prestigious schools",
        "cluster": "Sushant Lok & South City"
    },
    {
        "name": "Palam Vihar",
        "slug": "palam-vihar",
        "landmarks": "Palam Vihar Blocks A-J, Ansals, Krishna Chowk, Chiranjiv Bharati School, Global Foyer Mall",
        "lat": 28.5080, "lng": 77.0380, "pincode": "122017",
        "desc": "expansive premier North Gurugram township with independent kothis and modern high-rise apartments",
        "cluster": "North Gurgaon & Palam Vihar"
    },
    {
        "name": "Nirvana Country",
        "slug": "nirvana-country",
        "landmarks": "Sector 50, Fresco, Unitech Aspen Greens, Deerwood Chase, Baani Square",
        "lat": 28.4230, "lng": 77.0680, "pincode": "122018",
        "desc": "elite gated villa community and luxury apartments requiring delicate designer wear and home upholstery care",
        "cluster": "Sohna Road Corridor"
    },
    {
        "name": "Golf Course Road",
        "slug": "golf-course-road",
        "landmarks": "Sector 42, 43, 53, 54, Central Park, DLF Mega Mall, One Horizon Center",
        "lat": 28.4620, "lng": 77.0920, "pincode": "122002",
        "desc": "Gurugram's most prestigious boulevard home to top business leaders, luxury cars, and fine couture fabrics",
        "cluster": "Golf Course Corridor"
    },
    {
        "name": "Golf Course Extension Road",
        "slug": "golf-course-extension-road",
        "landmarks": "Sector 61-67, M3M Golfestate, Grand Arch, Ireo Skyon, Worldmark Gurugram",
        "lat": 28.4120, "lng": 77.0780, "pincode": "122018",
        "desc": "futuristic luxury residential skyline packed with modern gated societies and corporate hubs",
        "cluster": "Golf Course Extension & SPR"
    },
    {
        "name": "Sohna Road",
        "slug": "sohna-road",
        "landmarks": "Subhash Chowk, Vatika City, Malibu Towne, Vipul Greens, Omaxe Celebration Mall",
        "lat": 28.4300, "lng": 77.0450, "pincode": "122018",
        "desc": "prime central arterial corridor with heavy residential density and rapid 24-hour doorstep pickup demand",
        "cluster": "Sohna Road Corridor"
    },
    {
        "name": "Dwarka Expressway",
        "slug": "dwarka-expressway",
        "landmarks": "Sector 99-115, Sobha City, Puri Diplomatic Greens, Experion Windchants, Upper Dwarka link",
        "lat": 28.5150, "lng": 77.0080, "pincode": "122017",
        "desc": "state-of-the-art 8-lane expressway connecting Delhi and Gurugram, populated by new luxury high-rises",
        "cluster": "Dwarka Expressway Hubs"
    },
    {
        "name": "New Gurgaon",
        "slug": "new-gurgaon",
        "landmarks": "Sector 82, 83, 84, 90, 91, Vatika India Next, DLF New Town Heights, Sapphire 83",
        "lat": 28.3980, "lng": 76.9650, "pincode": "122004",
        "desc": "rapidly booming township along NH-48 with thousands of young families, bachelors, and professionals",
        "cluster": "New Gurgaon & NH-48"
    },

    # Central & Established HUDA Sectors
    {
        "name": "Sector 14",
        "slug": "sector-14",
        "landmarks": "Old DLF, Main Sector 14 Market, Mehrauli Road, MG Road, Vishal Mega Mart",
        "lat": 28.4750, "lng": 77.0450, "pincode": "122001",
        "desc": "famed commercial shopping heart of Gurgaon surrounded by venerable family residences",
        "cluster": "Central & Established Sectors"
    },
    {
        "name": "Sector 15",
        "slug": "sector-15",
        "landmarks": "Civil Lines, 32nd Avenue, Star Mall, Patel Nagar, Part 1 & Part 2",
        "lat": 28.4650, "lng": 77.0420, "pincode": "122001",
        "desc": "peaceful green neighborhood alongside NH-48 with historic bungalows and fine dining hubs",
        "cluster": "Central & Established Sectors"
    },
    {
        "name": "Sector 17",
        "slug": "sector-17",
        "landmarks": "IFFCO Chowk, Bata Chowk, Sector 17 B, Sukhrali, Maruti Suzuki plant vicinity",
        "lat": 28.4800, "lng": 77.0550, "pincode": "122001",
        "desc": "vital central sector near expressway interchanges and corporate regional offices",
        "cluster": "Central & Established Sectors"
    },
    {
        "name": "Sector 21",
        "slug": "sector-21",
        "landmarks": "Palam Vihar border, Kapashera border, Dundahera, Airport approach road",
        "lat": 28.5180, "lng": 77.0600, "pincode": "122016",
        "desc": "convenient border sector home to airline personnel, business travelers, and families",
        "cluster": "North Gurgaon & Palam Vihar"
    },
    {
        "name": "Sector 22",
        "slug": "sector-22",
        "landmarks": "Rotary Public School, Tau Devi Lal Park, Columbia Asia Hospital, Sector 22 Market",
        "lat": 28.5120, "lng": 77.0520, "pincode": "122015",
        "desc": "vibrant residential hub near Udyog Vihar with bustling community markets and green parks",
        "cluster": "North Gurgaon & Palam Vihar"
    },
    {
        "name": "Sector 23",
        "slug": "sector-23",
        "landmarks": "Tau Devi Lal Smriti Udhyan, Palam Vyapar Kendra, Carterpuri, Sector 23A",
        "lat": 28.5100, "lng": 77.0420, "pincode": "122017",
        "desc": "expansive well-planned HUDA locality with spacious bungalows, lush parks, and reputed schools",
        "cluster": "North Gurgaon & Palam Vihar"
    },
    {
        "name": "Sector 27",
        "slug": "sector-27",
        "landmarks": "Galleria Market back road, Sector 28 border, DLF Phase 4 boundary, Hamilton Court",
        "lat": 28.4730, "lng": 77.0820, "pincode": "122009",
        "desc": "upscale central enclave right between Galleria Market and Golf Course Road",
        "cluster": "Central & Established Sectors"
    },
    {
        "name": "Sector 28",
        "slug": "sector-28",
        "landmarks": "Galleria Market, Silver Oaks, MG Road Metro, Regent House",
        "lat": 28.4790, "lng": 77.0850, "pincode": "122009",
        "desc": "premium residential hotspot with immediate access to Gurugram's top retail and dining centers",
        "cluster": "Central & Established Sectors"
    },
    {
        "name": "Sector 29",
        "slug": "sector-29",
        "landmarks": "HUDA City Centre (Millennium City) Metro, Leisure Valley, Kingdom of Dreams, Brewery District",
        "lat": 28.4680, "lng": 77.0650, "pincode": "122001",
        "desc": "Gurugram's premier dining and cultural recreation district with immediate metro connectivity",
        "cluster": "Central & Established Sectors"
    },
    {
        "name": "Sector 30",
        "slug": "sector-30",
        "landmarks": "Star Mall, 32nd Avenue, Silokhera border, Jalvayu Vihar",
        "lat": 28.4620, "lng": 77.0500, "pincode": "122001",
        "desc": "prime highway-facing sector featuring premium residential societies and shopping destinations",
        "cluster": "Central & Established Sectors"
    },
    {
        "name": "Sector 31",
        "slug": "sector-31",
        "landmarks": "Raheja Atlantis, NH-48, Sector 31 Huda Market, Ajanta Public School",
        "lat": 28.4550, "lng": 77.0480, "pincode": "122001",
        "desc": "one of Gurgaon's most prestigious central sectors with luxury high-rise condominiums and high-spending residents",
        "cluster": "Central & Established Sectors"
    },
    {
        "name": "Sector 32",
        "slug": "sector-32",
        "landmarks": "Institutional Area, Medanta corridor, Rajiv Chowk, Sector 32 tech campuses",
        "lat": 28.4520, "lng": 77.0380, "pincode": "122001",
        "desc": "institutional and corporate tech area requiring rapid business formal wear dry cleaning",
        "cluster": "Central & Established Sectors"
    },
    {
        "name": "Sector 38",
        "slug": "sector-38",
        "landmarks": "Medanta The Medicity Hospital, Subhash Chowk, Rajiv Chowk, Tau Devi Lal Stadium",
        "lat": 28.4420, "lng": 77.0350, "pincode": "122001",
        "desc": "strategic healthcare and residential zone catering to doctors, healthcare professionals, and guest houses",
        "cluster": "Central & Established Sectors"
    },
    {
        "name": "Sector 39",
        "slug": "sector-39",
        "landmarks": "Bakhtawar Chowk, Institutional Area, Sector 38/46 border, Unitech Cyber Park link",
        "lat": 28.4450, "lng": 77.0480, "pincode": "122001",
        "desc": "thriving sector combining corporate institutional offices with quiet residential pockets",
        "cluster": "Central & Established Sectors"
    },
    {
        "name": "Sector 40",
        "slug": "sector-40",
        "landmarks": "South City 1, Unitech Cyber Park, Netaji Subhash Marg, Sector 40 Market",
        "lat": 28.4580, "lng": 77.0620, "pincode": "122001",
        "desc": "high-demand residential area packed with IT professionals and established families",
        "cluster": "Central & Established Sectors"
    },
    {
        "name": "Sector 41",
        "slug": "sector-41",
        "landmarks": "South City 1, Millennium City Metro, Fortis Hospital corridor",
        "lat": 28.4620, "lng": 77.0700, "pincode": "122001",
        "desc": "peaceful residential community seconds away from major metro lines and retail malls",
        "cluster": "Central & Established Sectors"
    },
    {
        "name": "Sector 42",
        "slug": "sector-42",
        "landmarks": "Sector 42-43 Rapid Metro, DLF Phase 5, The Belaire, DLF Golf Course",
        "lat": 28.4600, "lng": 77.0950, "pincode": "122002",
        "desc": "luxury Golf Course Road sector with high-end condominiums and couture garment care requirements",
        "cluster": "Golf Course Corridor"
    },
    {
        "name": "Sector 43",
        "slug": "sector-43",
        "landmarks": "Galleria vicinity, Millennium City Metro, Gold Souk, Sushant Lok Phase 1",
        "lat": 28.4550, "lng": 77.0850, "pincode": "122002",
        "desc": "bustling upscale residential sector with luxury builder floors and gated community blocks",
        "cluster": "Golf Course Corridor"
    },
    {
        "name": "Sector 44",
        "slug": "sector-44",
        "landmarks": "Subhash Chowk, Taj City Centre, HUDA Metro, Institutional Area, Fortis Hospital",
        "lat": 28.4520, "lng": 77.0720, "pincode": "122003",
        "desc": "prominent corporate and hospitality hub where professionals need crisp 24-hour express dry cleaning and steam press",
        "cluster": "Central & Established Sectors"
    },
    {
        "name": "Sector 45",
        "slug": "sector-45",
        "landmarks": "Greenwood City, Artemis Hospital, Bakhtawar Chowk, Jalvayu Towers",
        "lat": 28.4450, "lng": 77.0700, "pincode": "122003",
        "desc": "tranquil township with upscale private residences, green gardens, and healthcare professionals",
        "cluster": "Central & Established Sectors"
    },
    {
        "name": "Sector 46",
        "slug": "sector-46",
        "landmarks": "Bakhtawar Chowk, Amity International School, Sector 46 Huda Market, Cybex Gym",
        "lat": 28.4380, "lng": 77.0550, "pincode": "122003",
        "desc": "family-friendly sector famous for its lively market, educational institutions, and residential kothis",
        "cluster": "Central & Established Sectors"
    },
    {
        "name": "Sector 47",
        "slug": "sector-47",
        "landmarks": "Malibu Towne, Bestech Park View City, Subhash Chowk, Unitech Uniworld Gardens",
        "lat": 28.4280, "lng": 77.0420, "pincode": "122018",
        "desc": "sprawling gated township with Mediterranean-style villas, high-rises, and active daily 24-hour laundry pickup",
        "cluster": "Sohna Road Corridor"
    },
    {
        "name": "Sector 48",
        "slug": "sector-48",
        "landmarks": "Central Park Resorts, Vipul Greens, Tatvam Villas, Sohna Road, JMD Megapolis",
        "lat": 28.4200, "lng": 77.0410, "pincode": "122018",
        "desc": "affluent condo belt demanding 24-hour premium doorstep pickup and designer garment care",
        "cluster": "Sohna Road Corridor"
    },
    {
        "name": "Sector 49",
        "slug": "sector-49",
        "landmarks": "Vatika City, Rosewood City, Eros City Square, Sohna Road, Spaze I-Tech Park",
        "lat": 28.4150, "lng": 77.0550, "pincode": "122018",
        "desc": "massive residential cluster with self-contained townships and daily family laundry needs",
        "cluster": "Sohna Road Corridor"
    },
    {
        "name": "Sector 50",
        "slug": "sector-50",
        "landmarks": "Nirvana Country, Baani Square, Unitech Harmony, Fresco, South City 2 border",
        "lat": 28.4190, "lng": 77.0680, "pincode": "122018",
        "desc": "sought-after luxury enclave with cosmopolitan families and elite wardrobe requirements",
        "cluster": "Sohna Road Corridor"
    },
    {
        "name": "Sector 51",
        "slug": "sector-51",
        "landmarks": "Mayfield Garden, Artemis Hospital, Amity Sector 51, Samaspur Village",
        "lat": 28.4320, "lng": 77.0720, "pincode": "122003",
        "desc": "peaceful residential sector surrounded by multi-specialty healthcare and top schools",
        "cluster": "Sohna Road Corridor"
    },
    {
        "name": "Sector 52",
        "slug": "sector-52",
        "landmarks": "Ardee City, Wazirabad, RD City, Sector 52 Rapid Metro, Artemis link",
        "lat": 28.4410, "lng": 77.0820, "pincode": "122003",
        "desc": "dense community of independent villas, high-rise towers, and corporate employees",
        "cluster": "Sohna Road Corridor"
    },
    {
        "name": "Sector 53",
        "slug": "sector-53",
        "landmarks": "DLF The Crest, Parsvnath Exotica, Sector 53-54 Rapid Metro, Golf Course Road",
        "lat": 28.4500, "lng": 77.0990, "pincode": "122002",
        "desc": "home to some of Gurgaon's most prized high-rise condominiums and couture wardrobes",
        "cluster": "Golf Course Corridor"
    },
    {
        "name": "Sector 54",
        "slug": "sector-54",
        "landmarks": "Suncity, Aravalli Hills, DLF Park Place, Golf Course Road, Rapid Metro Station",
        "lat": 28.4420, "lng": 77.1080, "pincode": "122011",
        "desc": "picturesque foothills setting featuring high-profile gated communities and lavish apartments",
        "cluster": "Golf Course Corridor"
    },
    {
        "name": "Sector 55",
        "slug": "sector-55",
        "landmarks": "Sector 55-56 Rapid Metro, Aashirwad Enclave, Aravalli range, Sushant Lok 2",
        "lat": 28.4310, "lng": 77.1050, "pincode": "122011",
        "desc": "well-connected terminal metro sector with residential societies and serene neighborhood lanes",
        "cluster": "Golf Course Corridor"
    },
    {
        "name": "Sector 56",
        "slug": "sector-56",
        "landmarks": "Devinder Vihar, Huda Market Sector 56, Jalvayu Towers, Kendriya Vihar, More Supermarket",
        "lat": 28.4320, "lng": 77.0950, "pincode": "122011",
        "desc": "iconic cooperative group housing hub with thousands of families and heavy dry cleaning demand",
        "cluster": "Golf Course Corridor"
    },
    {
        "name": "Sector 57",
        "slug": "sector-57",
        "landmarks": "Hong Kong Bazaar, Sushant Lok Phase 3, Rail Vihar, Harmony Homes, Scottish High School",
        "lat": 28.4250, "lng": 77.0880, "pincode": "122011",
        "desc": "fast-growing residential locality with luxury builder floors, modern markets, and family residences",
        "cluster": "Golf Course Corridor"
    },
    {
        "name": "Sector 58",
        "slug": "sector-58",
        "landmarks": "Grand Hyatt residences, Ireo Grand View, Golf Course Ext Road, Aravalli greens",
        "lat": 28.4080, "lng": 77.1020, "pincode": "122011",
        "desc": "ultra-luxury hospitality and high-rise living sector at the intersection of modern expressways",
        "cluster": "Golf Course Corridor"
    },

    # Golf Course Extension & SPR
    {
        "name": "Sector 61",
        "slug": "sector-61",
        "landmarks": "Pioneer Park, Pioneer Araya, Smart World Orchard, Golf Course Ext Road",
        "lat": 28.4050, "lng": 77.0880, "pincode": "122011",
        "desc": "luxury residential hub known for expansive towers, green layouts, and bridal wear care",
        "cluster": "Golf Course Extension & SPR"
    },
    {
        "name": "Sector 62",
        "slug": "sector-62",
        "landmarks": "Heritage Xperiential Learning School, Pioneer Presidia, Golf Course Ext Road",
        "lat": 28.4010, "lng": 77.0820, "pincode": "122011",
        "desc": "elite neighborhood populated by corporate leaders and prominent international schooling families",
        "cluster": "Golf Course Extension & SPR"
    },
    {
        "name": "Sector 63",
        "slug": "sector-63",
        "landmarks": "Paras Trinity, Signature Global City, Golf Course Ext, DLF Arbour link",
        "lat": 28.3980, "lng": 77.0750, "pincode": "122011",
        "desc": "dynamic newly-delivered sector with premium residential high-rises and retail plazas",
        "cluster": "Golf Course Extension & SPR"
    },
    {
        "name": "Sector 65",
        "slug": "sector-65",
        "landmarks": "M3M Golfestate, Emerald Hills, Worldmark Gurgaon, Emaar Palm Terraces",
        "lat": 28.3950, "lng": 77.0680, "pincode": "122018",
        "desc": "premier high-fashion lifestyle district featuring golf-themed residences and high-end retail hubs",
        "cluster": "Golf Course Extension & SPR"
    },
    {
        "name": "Sector 66",
        "slug": "sector-66",
        "landmarks": "The Palm Drive, Emaar Marbella, Golf Course Ext Road, AIPL Joy Square",
        "lat": 28.3910, "lng": 77.0620, "pincode": "122018",
        "desc": "luxurious Spanish-inspired villa enclaves and contemporary high-rise towers",
        "cluster": "Golf Course Extension & SPR"
    },
    {
        "name": "Sector 67",
        "slug": "sector-67",
        "landmarks": "Ireo Victory Valley, Bestech Park View Spa Next, M3M Urbana, M3M Merlin",
        "lat": 28.3880, "lng": 77.0550, "pincode": "122018",
        "desc": "architectural skyline landmark featuring Gurugram's tallest residential towers and high buyer demand",
        "cluster": "Golf Course Extension & SPR"
    },
    {
        "name": "Sector 68",
        "slug": "sector-68",
        "landmarks": "Supertech Hues, Pareena, Sohna Road connectivity, SPR bypass",
        "lat": 28.3810, "lng": 77.0420, "pincode": "122018",
        "desc": "rapidly developing sector with modern gated townships and swift transit corridors",
        "cluster": "Golf Course Extension & SPR"
    },
    {
        "name": "Sector 69",
        "slug": "sector-69",
        "landmarks": "Tulip Violet, Tulip White, Tulip Lemon, Southern Peripheral Road",
        "lat": 28.3890, "lng": 77.0320, "pincode": "122018",
        "desc": "lively high-density residential enclave with thousands of families seeking regular 24-hour laundry pickup",
        "cluster": "Golf Course Extension & SPR"
    },
    {
        "name": "Sector 70",
        "slug": "sector-70",
        "landmarks": "Tulip Ivory, GPL Eden, Southern Peripheral Road, Spaze Privy",
        "lat": 28.3920, "lng": 77.0250, "pincode": "122018",
        "desc": "established SPR sector with active markets, modern societies, and daily delivery coverage",
        "cluster": "Golf Course Extension & SPR"
    },
    {
        "name": "Sector 70A",
        "slug": "sector-70a",
        "landmarks": "BPTP Astaire Gardens, Paras Irene, AIPL The Peaceful Homes, BPTP Visionnaire",
        "lat": 28.3880, "lng": 77.0180, "pincode": "122018",
        "desc": "lush low-density township with luxury independent floors, villas, and resort-style living",
        "cluster": "Golf Course Extension & SPR"
    },
    {
        "name": "Sector 71",
        "slug": "sector-71",
        "landmarks": "CHD Avenue 71, Fast SPR connectivity, Signature Global Andour Heights",
        "lat": 28.3990, "lng": 77.0220, "pincode": "122018",
        "desc": "prime SPR residential neighborhood with spacious community living and prompt 24-hour doorstep pickup",
        "cluster": "Golf Course Extension & SPR"
    },
    {
        "name": "Sector 72",
        "slug": "sector-72",
        "landmarks": "Tata Primanti, Spaze Privvy, Vatika Business Park, Sohna Road crossing",
        "lat": 28.4080, "lng": 77.0280, "pincode": "122018",
        "desc": "signature luxury villas and vertical penthouses requiring fine garment and drapery care",
        "cluster": "Golf Course Extension & SPR"
    },
    {
        "name": "Sector 73",
        "slug": "sector-73",
        "landmarks": "Southern Peripheral Road, Sector 72/74 border, DLF Corporate link",
        "lat": 28.4010, "lng": 77.0150, "pincode": "122018",
        "desc": "strategic SPR corridor connecting commercial offices and modern condominiums",
        "cluster": "Golf Course Extension & SPR"
    },
    {
        "name": "Sector 74",
        "slug": "sector-74",
        "landmarks": "DLF Corporate Greens, American Express Campus, SPR junction",
        "lat": 28.4090, "lng": 77.0080, "pincode": "122004",
        "desc": "booming corporate campus destination with executive formal wear cleaning requirements",
        "cluster": "Golf Course Extension & SPR"
    },
    {
        "name": "Sector 75",
        "slug": "sector-75",
        "landmarks": "SPR junction, NH-48 connectivity, Southern Peripheral Road gateway",
        "lat": 28.4120, "lng": 76.9980, "pincode": "122004",
        "desc": "gateway connecting New Gurgaon with Golf Course Extension and NH-48",
        "cluster": "Golf Course Extension & SPR"
    },

    # New Gurgaon & NH-48
    {
        "name": "Sector 76",
        "slug": "sector-76",
        "landmarks": "Corona Optus, Kherki Daula toll proximity, NH-48 bypass",
        "lat": 28.3820, "lng": 76.9950, "pincode": "122004",
        "desc": "tranquil residential foothills sector with panoramic Aravalli views",
        "cluster": "New Gurgaon & NH-48"
    },
    {
        "name": "Sector 77",
        "slug": "sector-77",
        "landmarks": "Emaar Palm Heights, Umang Monsoon Breeze, DLF Privana vicinity",
        "lat": 28.3750, "lng": 76.9880, "pincode": "122004",
        "desc": "scenic luxury township setting in New Gurugram with young families and IT professionals",
        "cluster": "New Gurgaon & NH-48"
    },
    {
        "name": "Sector 78",
        "slug": "sector-78",
        "landmarks": "Raheja Revanta, Umang Winter Hills, Aravalli green corridor",
        "lat": 28.3680, "lng": 76.9820, "pincode": "122004",
        "desc": "sky-high residential towers nestled close to lush southern nature reserves",
        "cluster": "New Gurgaon & NH-48"
    },
    {
        "name": "Sector 79",
        "slug": "sector-79",
        "landmarks": "Godrej Aria, Supertech Araville, Bestech Park View Altura, Signature Global Golf Greens",
        "lat": 28.3620, "lng": 76.9750, "pincode": "122004",
        "desc": "peaceful residential hub favored by golf enthusiasts and families desiring green living",
        "cluster": "New Gurgaon & NH-48"
    },
    {
        "name": "Sector 80",
        "slug": "sector-80",
        "landmarks": "Karma Lakelands, Godrej Frontier, NH-48 Highway frontage",
        "lat": 28.3650, "lng": 76.9550, "pincode": "122004",
        "desc": "exclusive golf resort estate and luxury apartments right on the National Highway",
        "cluster": "New Gurgaon & NH-48"
    },
    {
        "name": "Sector 81",
        "slug": "sector-81",
        "landmarks": "Vipul Lavanya, Bestech Park View Ananda, Miracles Apollo Clinic, Signature Global Synera",
        "lat": 28.3890, "lng": 76.9580, "pincode": "122004",
        "desc": "bustling New Gurgaon core with complete amenities, clinics, and family apartments",
        "cluster": "New Gurgaon & NH-48"
    },
    {
        "name": "Sector 82",
        "slug": "sector-82",
        "landmarks": "Vatika India Next, Vatika City Homes, Town Square, Sector 82 Market",
        "lat": 28.3950, "lng": 76.9620, "pincode": "122004",
        "desc": "epicenter of Vatika India Next township with high resident activity and daily 24-hour pickup runs",
        "cluster": "New Gurgaon & NH-48"
    },
    {
        "name": "Sector 83",
        "slug": "sector-83",
        "landmarks": "Vatika India Next, Sapphire 83 Mall, Kanki, Emaar Palm Gardens",
        "lat": 28.3980, "lng": 76.9720, "pincode": "122004",
        "desc": "commercial and entertainment pulse of New Gurgaon with multiplexes and retail plazas",
        "cluster": "New Gurgaon & NH-48"
    },
    {
        "name": "Sector 84",
        "slug": "sector-84",
        "landmarks": "Antriksh Heights, Spaze Privy AT4, Dwarka Expressway cloverleaf link",
        "lat": 28.4050, "lng": 76.9750, "pincode": "122004",
        "desc": "prime transit crossroads connecting NH-48, CPR, and Dwarka Expressway",
        "cluster": "New Gurgaon & NH-48"
    },
    {
        "name": "Sector 85",
        "slug": "sector-85",
        "landmarks": "Orris Aster Court, SS The Leaf, Sector 85 Market, Orris Carnation Residency",
        "lat": 28.4020, "lng": 76.9580, "pincode": "122004",
        "desc": "well-inhabited residential hub with green open surroundings and vibrant communities",
        "cluster": "New Gurgaon & NH-48"
    },
    {
        "name": "Sector 86",
        "slug": "sector-86",
        "landmarks": "DLF New Town Heights 86, Microtek Greenburg, Ansal Heights",
        "lat": 28.4080, "lng": 76.9510, "pincode": "122004",
        "desc": "prominent DLF residential cluster with thousands of active apartment residents",
        "cluster": "New Gurgaon & NH-48"
    },
    {
        "name": "Sector 88",
        "slug": "sector-88",
        "landmarks": "Commercial Hub New Gurgaon, Multi Utility Corridor, Sector 88A",
        "lat": 28.4200, "lng": 76.9550, "pincode": "122004",
        "desc": "designated grand commercial district of New Gurugram",
        "cluster": "New Gurgaon & NH-48"
    },
    {
        "name": "Sector 89",
        "slug": "sector-89",
        "landmarks": "Smart World Gems, Godrej Air, Ferrous Heights, NBCC Green View",
        "lat": 28.4220, "lng": 76.9450, "pincode": "122004",
        "desc": "new-age gated low-rise and high-rise condominiums with modern community living",
        "cluster": "New Gurgaon & NH-48"
    },
    {
        "name": "Sector 90",
        "slug": "sector-90",
        "landmarks": "DLF New Town Heights 90, Shri Balaji Hospital, Regal Gardens",
        "lat": 28.4120, "lng": 76.9380, "pincode": "122004",
        "desc": "established high-density sector packed with DLF condominiums and community parks",
        "cluster": "New Gurgaon & NH-48"
    },
    {
        "name": "Sector 91",
        "slug": "sector-91",
        "landmarks": "DLF New Town Heights 91, Pace City 2, Ansal Hub 83",
        "lat": 28.4050, "lng": 76.9320, "pincode": "122004",
        "desc": "spacious residential towers located close to industrial research and business nodes",
        "cluster": "New Gurgaon & NH-48"
    },
    {
        "name": "Sector 92",
        "slug": "sector-92",
        "landmarks": "Sare Homes Crescent Parc, Bestech Park View Sanskruti, Signature Global City 92",
        "lat": 28.4150, "lng": 76.9250, "pincode": "122004",
        "desc": "vibrant township with landscaped greens, sports facilities, and high family occupancy",
        "cluster": "New Gurgaon & NH-48"
    },
    {
        "name": "Sector 93",
        "slug": "sector-93",
        "landmarks": "Spaze Boulevard, Signature Global Orchard Avenue, Raheja Navodaya",
        "lat": 28.4220, "lng": 76.9280, "pincode": "122004",
        "desc": "peaceful residential hub on the New Gurgaon outer ring with modern housing societies",
        "cluster": "New Gurgaon & NH-48"
    },
    {
        "name": "Sector 95",
        "slug": "sector-95",
        "landmarks": "Ramsons Kshitij, ROF Ananda, Pataudi Road junction, Sector 95A/95B",
        "lat": 28.4280, "lng": 76.9180, "pincode": "122004",
        "desc": "rapidly growing neighborhood connecting Pataudi Road with modern Dwarka Expressway corridors",
        "cluster": "New Gurgaon & NH-48"
    },

    # Dwarka Expressway & North Gurgaon Hubs
    {
        "name": "Sector 99",
        "slug": "sector-99",
        "landmarks": "Cosmos Express 99, Pivot Dwarka Expressway, Uppal G99",
        "lat": 28.4550, "lng": 76.9480, "pincode": "122001",
        "desc": "strategic expressway sector bridging Old Gurgaon with newly developed bypass arteries",
        "cluster": "Dwarka Expressway Hubs"
    },
    {
        "name": "Sector 102",
        "slug": "sector-102",
        "landmarks": "Shapoorji Pallonji Joyville, BPTP Amstoria, Heritage Max, Conscient Heritage",
        "lat": 28.4680, "lng": 76.9620, "pincode": "122006",
        "desc": "upscale gated developments with sprawling clubhouses and high-density family living",
        "cluster": "Dwarka Expressway Hubs"
    },
    {
        "name": "Sector 103",
        "slug": "sector-103",
        "landmarks": "Indiabulls Centrum Park, Oxirich Chintamani, Ansal Highland Park",
        "lat": 28.4750, "lng": 76.9720, "pincode": "122006",
        "desc": "prominent residential landmark right on the central Dwarka Expressway stretch",
        "cluster": "Dwarka Expressway Hubs"
    },
    {
        "name": "Sector 104",
        "slug": "sector-104",
        "landmarks": "Hero Homes, Godrej Summit, Dwarka Expressway corridor, Puri Emerald Bay",
        "lat": 28.4820, "lng": 76.9820, "pincode": "122006",
        "desc": "premium residential corridor favored by airport employees, airline pilots, and corporates",
        "cluster": "Dwarka Expressway Hubs"
    },
    {
        "name": "Sector 106",
        "slug": "sector-106",
        "landmarks": "Chintels Paradiso, Godrej Meridien, Dwarka Expressway, Paras Dews",
        "lat": 28.4980, "lng": 76.9950, "pincode": "122006",
        "desc": "contemporary luxury residential high-rises with 7-star clubhouses and fine living standards",
        "cluster": "Dwarka Expressway Hubs"
    },
    {
        "name": "Sector 107",
        "slug": "sector-107",
        "landmarks": "Signature Global Solera, M3M Woodshire, Dwarka Expressway approach",
        "lat": 28.5020, "lng": 77.0020, "pincode": "122017",
        "desc": "active community enclave close to Delhi border with regular 24-hour express laundry demand",
        "cluster": "Dwarka Expressway Hubs"
    },
    {
        "name": "Sector 108",
        "slug": "sector-108",
        "landmarks": "Sobha City, Experion The Westerlies, Delhi border, Raheja Vedaanta",
        "lat": 28.5120, "lng": 77.0120, "pincode": "122017",
        "desc": "prestigious urban oasis with luxury high-rise towers and international-grade amenities",
        "cluster": "Dwarka Expressway Hubs"
    },
    {
        "name": "Sector 109",
        "slug": "sector-109",
        "landmarks": "Chintels Serenity, ATS Tourmaline, Sobha International City, Raheja Atharva",
        "lat": 28.5180, "lng": 77.0220, "pincode": "122017",
        "desc": "high-end villa and luxury condo corridor situated minutes away from southwest Delhi",
        "cluster": "Dwarka Expressway Hubs"
    },
    {
        "name": "Sector 110",
        "slug": "sector-110",
        "landmarks": "Puri Diplomatic Greens, Mahindra Aura, Chauma Village, Sector 110A",
        "lat": 28.5220, "lng": 77.0310, "pincode": "122017",
        "desc": "elite gated address with lush green landscaping and high-net-worth resident profiles",
        "cluster": "Dwarka Expressway Hubs"
    },
    {
        "name": "Sector 111",
        "slug": "sector-111",
        "landmarks": "Puri Diplomatic Residences, Kashish Manor One, Delhi 0 km border point",
        "lat": 28.5280, "lng": 77.0380, "pincode": "122017",
        "desc": "closest Gurgaon residential sector to IGI Airport and Aerocity, demanding swift 24-hour pickup services",
        "cluster": "Dwarka Expressway Hubs"
    },
    {
        "name": "Sector 112",
        "slug": "sector-112",
        "landmarks": "Experion Windchants, Tata Gurgaon Gateway, Delhi border intersection",
        "lat": 28.5320, "lng": 77.0450, "pincode": "122017",
        "desc": "architectural marvel condominium featuring skywalks and luxury villa-style sky apartments",
        "cluster": "Dwarka Expressway Hubs"
    },
    {
        "name": "Sector 113",
        "slug": "sector-113",
        "landmarks": "M3M Capital, Smart World One DXP, Dwarka border, Yashobhoomi IICC corridor",
        "lat": 28.5350, "lng": 77.0520, "pincode": "122017",
        "desc": "ultra-modern smart city living directly adjacent to Asia's largest convention centre Yashobhoomi",
        "cluster": "Dwarka Expressway Hubs"
    },

    # Old Gurgaon & Heritage Commercial Clusters
    {
        "name": "Sector 4",
        "slug": "sector-4",
        "landmarks": "Railway Station Road, Laxman Vihar, Dhanwapur, Sector 4/7 Chowk",
        "lat": 28.4720, "lng": 77.0120, "pincode": "122001",
        "desc": "established central Old Gurgaon sector with traditional families and bustling markets",
        "cluster": "Old Gurgaon & Heritage Hubs"
    },
    {
        "name": "Sector 5",
        "slug": "sector-5",
        "landmarks": "Sheetla Colony, Ashok Vihar, Old Railway Road, Sheetla Mata Mandir",
        "lat": 28.4790, "lng": 77.0210, "pincode": "122001",
        "desc": "vibrant cultural and residential hub steeped in Gurgaon's local heritage",
        "cluster": "Old Gurgaon & Heritage Hubs"
    },
    {
        "name": "Sector 7",
        "slug": "sector-7",
        "landmarks": "Krishna Nagar, Dayanand Colony, New Colony, Sector 7 Extension",
        "lat": 28.4680, "lng": 77.0220, "pincode": "122001",
        "desc": "family residential enclave with sprawling independent kothis and neighborhood markets",
        "cluster": "Old Gurgaon & Heritage Hubs"
    },
    {
        "name": "Sector 9",
        "slug": "sector-9",
        "landmarks": "Basai Road, ESI Hospital, Sector 9A Market, Ravi Nagar, Dhobi Ghat vicinity",
        "lat": 28.4620, "lng": 76.9950, "pincode": "122001",
        "desc": "home ground of Mourya Dry Cleaners with ultra-fast 24-hour delivery and community roots",
        "cluster": "Old Gurgaon & Heritage Hubs"
    },
    {
        "name": "Sector 10",
        "slug": "sector-10",
        "landmarks": "Kadipur, Hero Honda Chowk, Sector 10A Market, Meenakshi Hospital",
        "lat": 28.4480, "lng": 77.0010, "pincode": "122001",
        "desc": "bustling residential and business sector with prompt daily 24-hour laundry and dry cleaning demand",
        "cluster": "Old Gurgaon & Heritage Hubs"
    },
    {
        "name": "Sector 12",
        "slug": "sector-12",
        "landmarks": "Old Railway Road, Prem Nagar, Sector 12A, Rajiv Nagar",
        "lat": 28.4780, "lng": 77.0320, "pincode": "122001",
        "desc": "central residential neighborhood adjacent to bus terminal and commercial shopping centers",
        "cluster": "Old Gurgaon & Heritage Hubs"
    },
    {
        "name": "Sadar Bazar Gurgaon",
        "slug": "sadar-bazar",
        "landmarks": "Main Market, Jacobpura, Old Gurgaon, Roshan Pura, Gurudwara Road",
        "lat": 28.4620, "lng": 77.0310, "pincode": "122001",
        "desc": "historic commercial heart of Gurugram renowned for traditional ethnic wear, sarees, and textiles",
        "cluster": "Old Gurgaon & Heritage Hubs"
    },
    {
        "name": "Civil Lines Gurgaon",
        "slug": "civil-lines",
        "landmarks": "DC Residence, Rajiv Chowk, Mor Chowk, Police Lines, Judicial Complex",
        "lat": 28.4550, "lng": 77.0320, "pincode": "122001",
        "desc": "dignified administrative quarter of Gurgaon home to senior bureaucrats, judges, and sprawling heritage bungalows",
        "cluster": "Old Gurgaon & Heritage Hubs"
    },
    {
        "name": "Ashok Vihar Phase 1",
        "slug": "ashok-vihar-phase-1",
        "landmarks": "Old Railway Road, Sheetla Mata Road, Sector 5, Palam Triangle, Main Market",
        "lat": 28.4820, "lng": 77.0180, "pincode": "122001",
        "desc": "vibrant family neighborhood near Old Railway Road with spacious independent houses and local markets",
        "cluster": "Old Gurgaon & Heritage Hubs"
    },
    {
        "name": "Ashok Vihar Phase 2",
        "slug": "ashok-vihar-phase-2",
        "landmarks": "Railway Station Road, Carterpuri Road, Sector 3, Krishna Mandir, Palam Vyapar link",
        "lat": 28.4860, "lng": 77.0190, "pincode": "122001",
        "desc": "established residential enclave with peaceful family blocks and direct transit connectivity",
        "cluster": "Old Gurgaon & Heritage Hubs"
    },
    {
        "name": "Ashok Vihar Phase 3",
        "slug": "ashok-vihar-phase-3",
        "landmarks": "Sheetla Colony border, Old Delhi Road link, Sector 5 extension, Community Park",
        "lat": 28.4890, "lng": 77.0210, "pincode": "122001",
        "desc": "quiet family residential sector with active community hubs and daily 24-hour laundry pickup",
        "cluster": "Old Gurgaon & Heritage Hubs"
    },
    {
        "name": "Basai Village",
        "slug": "basai-village",
        "landmarks": "Dhobi Ghat Basai, Sector 9B, Basai Enclave, Sukhveer Singh Yadav Marg, Water Treatment Plant road",
        "lat": 28.4735, "lng": 76.9950, "pincode": "122001",
        "desc": "home base of Mourya Dry Cleaners workshop with ultra-fast 24-hour express doorstep pickup and premier garment finishing",
        "cluster": "Old Gurgaon & Heritage Hubs"
    },
    {
        "name": "New Palam Vihar",
        "slug": "new-palam-vihar",
        "landmarks": "Bajghera, Sector 110, Dwarka Expressway connection, Phase 1, 2 & 3 blocks, Chauma Road",
        "lat": 28.5140, "lng": 77.0250, "pincode": "122017",
        "desc": "rapidly expanding residential hub along Dwarka Expressway with thousands of families and apartment floors",
        "cluster": "North Gurgaon & Palam Vihar"
    },
    {
        "name": "Sheetla Colony",
        "slug": "sheetla-colony",
        "landmarks": "Sheetla Mata Mandir Road, Sector 5, Ashok Vihar, Gurgaon Bus Stand connectivity",
        "lat": 28.4840, "lng": 77.0240, "pincode": "122001",
        "desc": "historic and densely inhabited cultural hub demanding regular daily 24-hour laundry and traditional ethnic wear dry cleaning",
        "cluster": "Old Gurgaon & Heritage Hubs"
    },
    {
        "name": "Dharam Colony",
        "slug": "dharam-colony",
        "landmarks": "Palam Vihar Extension, Carterpuri, Krishna Chowk, Sector 23 border",
        "lat": 28.5050, "lng": 77.0320, "pincode": "122017",
        "desc": "active residential colony right adjoining Palam Vihar with multi-story builder floors and young professionals",
        "cluster": "North Gurgaon & Palam Vihar"
    }
]

def generate_page_html(loc):
    name = loc["name"]
    slug = loc["slug"]
    landmarks = loc["landmarks"]
    lat = loc["lat"]
    lng = loc["lng"]
    pincode = loc["pincode"]
    desc = loc["desc"]
    cluster = loc["cluster"]

    page_slug = f"dry-cleaners-{slug}-gurgaon.html"
    canonical_url = f"https://mouryadrycleaners.in/locations/{page_slug}"

    # Generate localized FAQs with 24 Hours Turnaround and Synced Price Card
    faqs = [
        {
            "q": f"Do you offer free doorstep dry cleaning pickup and delivery in {name}, Gurgaon?",
            "a": f"Yes, Mourya Dry Cleaners offers 100% free doorstep pickup and delivery across all societies and condominiums in {name}, Gurugram. Whether you reside near {landmarks.split(',')[0]} or surrounding blocks, our van rider collects your garments at your preferred time slot."
        },
        {
            "q": f"What is your standard turnaround time for laundry and dry cleaning in {name}?",
            "a": f"Our turnaround time is 24 Hours! We collect your clothes, professionally clean them using eco-friendly solvents and German steam presses, and deliver them back fresh, sanitized, and ready to wear within 24 hours."
        },
        {
            "q": f"How do you safely clean delicate bridal lehengas, wedding dresses, and sherwanis in {name}?",
            "a": f"We use eco-friendly, fabric-friendly organic hydrocarbon solvents imported specifically for delicate silks, heavy zardozi embroidery, stones, and designer wedding couture. Each piece undergoes custom stain inspection, individual gentle batch treatment, and German steam iron finishing with 24-hour turnaround."
        },
        {
            "q": f"Do you provide blanket cleaning and shoe/sneaker dry cleaning in {name}?",
            "a": f"Yes! We provide deep anti-bacterial dry cleaning for single & double blankets, quilts, and rajais (₹230–₹280), as well as professional sneaker restoration and leather shoe cleaning (₹230–₹350) with free 24-hour doorstep pickup and delivery in {name}."
        },
        {
            "q": f"What are your official rates for laundry and dry cleaning in {name}, Gurugram?",
            "a": f"Our rates are 100% synchronized with our official rate card: Wash & Fold from ₹55/Kg (7+ Kg) to ₹65/Kg, Wash & Iron from ₹75/Kg, Shirts & Trousers dry cleaning at ₹80, 2-Piece Suits at ₹230, Sarees from ₹180, Shoes from ₹230, and Blankets/Quilts from ₹230. Free pickup and drop on orders above ₹350!"
        }
    ]

    faq_schema_entities = []
    for f in faqs:
        faq_schema_entities.append({
            "@type": "Question",
            "name": f["q"],
            "acceptedAnswer": {
                "@type": "Answer",
                "text": f["a"]
            }
        })

    json_ld = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": ["DryCleaningOrLaundry", "LocalBusiness"],
                "@id": f"{canonical_url}#localbusiness",
                "name": f"Mourya Dry Cleaners - {name}",
                "url": canonical_url,
                "telephone": "+919217410047",
                "email": "info@mouryadrycleaners.com",
                "priceRange": "₹₹",
                "image": "https://mouryadrycleaners.in/assets/logo.jpg",
                "paymentAccepted": "Cash, UPI, Credit Card, Debit Card, Net Banking",
                "currenciesAccepted": "INR",
                "address": {
                    "@type": "PostalAddress",
                    "streetAddress": f"Dhobi Ghat, Basai Village (Serving {name})",
                    "addressLocality": "Gurugram",
                    "addressRegion": "Haryana",
                    "postalCode": pincode,
                    "addressCountry": "IN"
                },
                "geo": {
                    "@type": "GeoCoordinates",
                    "latitude": lat,
                    "longitude": lng
                },
                "openingHoursSpecification": [
                    {
                        "@type": "OpeningHoursSpecification",
                        "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
                        "opens": "08:00",
                        "closes": "22:00"
                    }
                ],
                "areaServed": [
                    {
                        "@type": "AdministrativeArea",
                        "name": f"{name}, Gurugram"
                    },
                    {
                        "@type": "AdministrativeArea",
                        "name": "Gurugram"
                    }
                ],
                "makesOffer": [
                    {
                        "@type": "Offer",
                        "itemOffered": {
                            "@type": "Service",
                            "name": "24-Hour Premium Dry Cleaning Service",
                            "description": f"24-Hour organic dry cleaning for suits (₹230), sarees (₹180), lehengas & blazers in {name}."
                        }
                    },
                    {
                        "@type": "Offer",
                        "itemOffered": {
                            "@type": "Service",
                            "name": "24-Hour Wash & Fold Laundry Per Kg",
                            "description": f"24-Hour sanitized machine laundry starting from ₹55/kg with free doorstep pickup in {name}."
                        }
                    },
                    {
                        "@type": "Offer",
                        "itemOffered": {
                            "@type": "Service",
                            "name": "24-Hour Steam Press & Upholstery Cleaning",
                            "description": f"24-Hour steam ironing from ₹30 and deep sanitization for curtains & sofas in {name}."
                        }
                    },
                    {
                        "@type": "Offer",
                        "itemOffered": {
                            "@type": "Service",
                            "name": f"Blanket & Quilt Dry Cleaning in {name}",
                            "description": f"Anti-bacterial deep sanitization for double bed mink blankets, quilts & rajais (₹230–₹280) with 24-hour pickup in {name}."
                        }
                    },
                    {
                        "@type": "Offer",
                        "itemOffered": {
                            "@type": "Service",
                            "name": f"Shoe & Sneaker Cleaning in {name}",
                            "description": f"Expert hand cleaning, midsole whitening & suede restoration for sneakers and leather shoes (₹230–₹350) with 24-hour pickup in {name}."
                        }
                    },
                    {
                        "@type": "Offer",
                        "itemOffered": {
                            "@type": "Service",
                            "name": f"Wedding Dress & Bridal Lehenga Dry Cleaning in {name}",
                            "description": f"Delicate organic solvent cleaning and heritage roll press for wedding dresses, heavy lehengas (₹250–₹700) & sherwanis in {name}."
                        }
                    }
                ]
            },
            {
                "@type": "BreadcrumbList",
                "@id": f"{canonical_url}#breadcrumb",
                "itemListElement": [
                    {
                        "@type": "ListItem",
                        "position": 1,
                        "name": "Home",
                        "item": "https://mouryadrycleaners.in/"
                    },
                    {
                        "@type": "ListItem",
                        "position": 2,
                        "name": "Areas Served",
                        "item": "https://mouryadrycleaners.in/areas-served.html"
                    },
                    {
                        "@type": "ListItem",
                        "position": 3,
                        "name": f"Dry Cleaners in {name}",
                        "item": canonical_url
                    }
                ]
            },
            {
                "@type": "FAQPage",
                "@id": f"{canonical_url}#faq",
                "mainEntity": faq_schema_entities
            }
        ]
    }

    # Related area links (pick 6 nearby or related from same or other clusters)
    related_links = [l for l in LOCATIONS if l["slug"] != slug]
    same_cluster = [l for l in related_links if l["cluster"] == cluster]
    other_clusters = [l for l in related_links if l["cluster"] != cluster]
    curated_related = (same_cluster + other_clusters)[:8]

    related_pills_html = "\n".join([
        f'            <a href="dry-cleaners-{l["slug"]}-gurgaon.html" class="area-link">{l["name"]}</a>'
        for l in curated_related
    ])

    # Compute footer areas text (avoid repeating name if it's already DLF/Golf Course Road/Sohna Road)
    base_areas = ["DLF", "Golf Course Road", "Sohna Road"]
    filtered_areas = [a for a in base_areas if a.lower() not in name.lower()]
    footer_areas = ", ".join([name] + filtered_areas)

    html = f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <meta name="theme-color" content="#0b3d78" />
  <link rel="icon" type="image/png" href="../assets/web_logo.png" />
  <link rel="shortcut icon" type="image/png" href="../assets/web_logo.png" />
  <link rel="apple-touch-icon" href="../assets/web_logo.png" />

  <!-- Primary SEO Meta Tags -->
  <title>Best Dry Cleaners in {name}, Gurgaon (Pin: {pincode}) | Dry Cleaner & Laundry Near Me @ \u20b955/Kg | Mourya</title>
  <meta name="title" content="Best Dry Cleaners in {name}, Gurgaon (Pin: {pincode}) | Dry Cleaner & Laundry Near Me @ \u20b955/Kg | Mourya" />
  <meta name="description" content="Looking for top-rated dry cleaners in {name}, Gurugram? Mourya Dry Cleaners offers premium garment care, laundry from ₹55/kg &amp; 24-hour express delivery. Call +91 92174 10047!" />
  <meta name="keywords" content="dry cleaners in {name} gurgaon, 24 hour laundry service {name} gurugram, best dry cleaners near me {name}, blanket cleaning in {name}, quilt dry cleaning {name}, shoe cleaning near me {name}, sneaker cleaning {name}, wedding dress cleaning {name}, bridal lehenga dry cleaning {name}, rajai dry cleaners near me {name}, doorstep dry cleaning {name}, wash and fold ₹55 per kg {name}, suit dry cleaning ₹230 {name}, sofa cleaning {name}, lehenga dry cleaning {name}" />
  <meta name="author" content="Mourya Dry Cleaners" />
  <meta name="robots" content="index, follow" />
  <meta name="googlebot" content="index, follow" />
  <link rel="canonical" href="{canonical_url}" />

  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website" />
  <meta property="og:url" content="{canonical_url}" />
  <meta property="og:title" content="Best Dry Cleaners in {name}, Gurgaon (Pin: {pincode}) | Dry Cleaner & Laundry Near Me @ \u20b955/Kg | Mourya" />
  <meta property="og:description" content="Official rate card prices: Laundry from ₹55/kg, Suits ₹230, Shirts ₹80. Guaranteed 24-hour turnaround with free doorstep pickup in {name}. Call +91 92174 10047!" />
  <meta property="og:image" content="https://mouryadrycleaners.in/assets/dry-cleaning.jpg" />
  <meta property="og:site_name" content="Mourya Dry Cleaners" />
  <meta property="og:locale" content="en_IN" />

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="Best Dry Cleaners &amp; Laundry Service in {name}, Gurgaon" />
  <meta name="twitter:description" content="Guaranteed 24-hour turnaround across {name}, Gurugram. Official price list synced, eco-friendly solvents, free doorstep pickup. Call +91 92174 10047!" />
  <meta name="twitter:image" content="https://mouryadrycleaners.in/assets/dry-cleaning.jpg" />

  <!-- Geo Local Tags -->
  <meta name="geo.region" content="IN-HR" />
  <meta name="geo.placename" content="{name}, Gurugram, Haryana, India" />
  <meta name="geo.position" content="{lat};{lng}" />
  <meta name="ICBM" content="{lat}, {lng}" />

  <!-- JSON-LD Structured Data -->
  <script type="application/ld+json">
{json.dumps(json_ld, indent=2)}
  </script>

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800;900&family=Playfair+Display:wght@600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="../style.css">
  <style>
    .loc-hero{{background:linear-gradient(135deg,#082f63 0%,#0b3d78 50%,#0877ff 100%);color:#fff;padding:65px 0 55px;text-align:center;position:relative;overflow:hidden}}
    .loc-hero::before{{content:'';position:absolute;inset:0;background:radial-gradient(circle at 20% 30%,rgba(255,255,255,.09),transparent 60%);pointer-events:none}}
    .loc-breadcrumb{{font-size:13px;font-weight:600;color:#93c5fd;margin-bottom:14px;display:flex;align-items:center;justify-content:center;gap:8px}}
    .loc-breadcrumb a{{color:#bfdbfe;text-decoration:none}}.loc-breadcrumb a:hover{{color:#fff}}
    .loc-hero h1{{font-size:clamp(26px,5vw,42px);font-weight:900;margin:0 0 14px;line-height:1.2}}
    .loc-hero h1 span{{color:#7dd3fc}}
    .loc-hero p.sub-headline{{font-size:clamp(15px,2vw,17.5px);color:#e0f2fe;max-width:760px;margin:0 auto 24px;line-height:1.65}}
    .loc-pills{{display:flex;justify-content:center;gap:10px;flex-wrap:wrap;margin-bottom:28px}}
    .loc-pill{{background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.24);padding:6px 14px;border-radius:999px;font-size:13px;font-weight:700}}
    .loc-cta{{display:flex;gap:12px;justify-content:center;flex-wrap:wrap}}
    .loc-section{{padding:60px 0}}
    .prose-block{{background:#fff;border-radius:18px;padding:36px;border:1px solid #dbeafe;box-shadow:0 4px 20px rgba(11,61,120,.05);margin-bottom:45px;line-height:1.8;color:#334155}}
    .prose-block h2{{color:#082f63;font-size:clamp(20px,3.5vw,28px);font-weight:800;margin-top:0;margin-bottom:16px;line-height:1.3}}
    .prose-block p{{margin-bottom:16px;font-size:15.5px}}
    .prose-block strong{{color:#082f63}}
    .svc-grid{{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:20px;margin-bottom:50px}}
    .svc-card{{background:#fff;border-radius:16px;padding:26px 22px;border:1px solid #dbeafe;box-shadow:0 4px 18px rgba(11,61,120,.06);transition:transform .2s,box-shadow .2s}}
    .svc-card:hover{{transform:translateY(-4px);box-shadow:0 10px 28px rgba(8,119,255,.12);border-color:#0877ff}}
    .svc-icon{{font-size:32px;display:block;margin-bottom:12px}}
    .svc-card h3{{font-size:18px;font-weight:800;color:#082f63;margin:0 0 8px}}
    .svc-card p{{font-size:14px;color:#64748b;line-height:1.6;margin:0 0 14px}}
    .svc-card a{{color:#0877ff;font-weight:700;font-size:13.5px;text-decoration:none}}
    .svc-card a:hover{{text-decoration:underline}}
    .rate-table-wrap{{overflow-x:auto;background:#fff;border-radius:18px;border:1px solid #dbeafe;box-shadow:0 4px 20px rgba(11,61,120,.05);margin-bottom:50px;padding:25px}}
    .rate-table-wrap h2{{color:#082f63;font-size:clamp(20px,3.5vw,26px);font-weight:800;margin-top:0;margin-bottom:18px}}
    .rate-table{{width:100%;border-collapse:collapse;text-align:left;font-size:14.5px}}
    .rate-table th{{background:#f0f6ff;color:#082f63;padding:12px 16px;font-weight:800;border-bottom:2px solid #bfdbfe}}
    .rate-table td{{padding:12px 16px;border-bottom:1px solid #f1f5f9;color:#334155}}
    .rate-table tr:hover td{{background:#f8fafc}}
    .rate-price{{color:#0877ff;font-weight:800}}
    .turnaround-badge{{display:inline-block;background:#ecfdf5;color:#059669;padding:4px 10px;border-radius:999px;font-weight:800;font-size:12.5px;border:1px solid #a7f3d0}}
    .reasons-grid{{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:20px;margin-bottom:50px}}
    .reason-box{{background:#f8fafc;border-radius:16px;padding:24px 20px;border-left:4px solid #0877ff}}
    .reason-box h3{{font-size:16.5px;font-weight:800;color:#082f63;margin:0 0 8px}}
    .reason-box p{{font-size:13.5px;color:#64748b;line-height:1.6;margin:0}}
    .faq-list{{display:flex;flex-direction:column;gap:16px;margin-bottom:50px}}
    .faq-item{{background:#fff;border-radius:14px;border:1px solid #dbeafe;padding:20px 24px;box-shadow:0 2px 12px rgba(11,61,120,.04)}}
    .faq-item h3{{font-size:16.5px;font-weight:800;color:#082f63;margin:0 0 10px;display:flex;align-items:center;gap:8px}}
    .faq-item p{{font-size:14px;color:#475569;line-height:1.65;margin:0}}
    .area-links-box{{background:#f0f6ff;border-radius:18px;padding:32px 24px;margin-bottom:45px;text-align:center}}
    .area-links-box h2{{font-size:clamp(19px,3vw,24px);font-weight:800;color:#082f63;margin-top:0;margin-bottom:18px}}
    .area-pills-row{{display:flex;gap:10px;flex-wrap:wrap;justify-content:center}}
    .area-link{{background:#fff;color:#0877ff;font-size:13.5px;font-weight:700;padding:8px 16px;border-radius:999px;border:1px solid #bfdbfe;text-decoration:none;transition:all .2s}}
    .area-link:hover{{background:#0877ff;color:#fff;border-color:#0877ff}}
    .bottom-cta-banner{{background:linear-gradient(135deg,#072954,#0877ff);color:#fff;border-radius:20px;padding:45px 30px;text-align:center}}
    .bottom-cta-banner h2{{font-size:clamp(22px,4vw,32px);font-weight:900;margin:0 0 12px}}
    .bottom-cta-banner p{{color:#bfdbfe;font-size:15px;max-width:580px;margin:0 auto 24px;line-height:1.6}}
  </style>
</head>
<body>
  <div class="progress" id="progress"></div>
  <header class="nav" id="nav">
    <a href="../index.html" class="brand"><img src="../assets/logo.jpg" alt="Mourya Dry Cleaners" width="80" height="80" /></a>
    <button class="menu" id="menu" aria-label="Toggle menu"><span></span><span></span><span></span></button>
    <nav id="navLinks">
      <a href="../index.html">Home</a>
      <a href="../laundry-service-gurugram.html">Laundry Service</a>
      <a href="../dry-cleaning-gurugram.html">Dry Cleaning</a>
      <a href="../pricing.html">Pricing</a>
      <a href="../areas-served.html">Areas Served</a>
      <a href="../faq.html">FAQ</a>
      <a href="../contact.html">Contact</a>
      <a href="../about.html">About Us</a>
    </nav>
    <a class="nav-phone" href="tel:+919217410047">☎ <strong>9217410047</strong></a>
  </header>

  <main>
    <!-- HERO SECTION -->
    <section class="loc-hero">
      <div class="container">
        <div class="loc-breadcrumb">
          <a href="../index.html">Home</a> › <a href="../areas-served.html">Areas Served</a> › <span>{name}</span>
        </div>
        <h1>Best Dry Cleaners &amp; Laundry Near Me in <span>{name}, Gurgaon (Gurugram)</span></h1>
        <p class="sub-headline">Free Doorstep Pickup &amp; Fast 24-Hour Express Turnaround across {landmarks}</p>
        <div class="loc-pills">
          <span class="loc-pill">⚡ Guaranteed 24-Hour Turnaround</span>
          <span class="loc-pill">🚚 100% Free Doorstep Pickup</span>
          <span class="loc-pill">🏷️ Official Rates: Wash &amp; Fold @ ₹55/kg</span>
          <span class="loc-pill">🌿 Eco-Friendly Zero-Toxin Solvents</span>
          <span class="loc-pill">⭐ 4.9/5 Rating (12,000+ Orders Done)</span>
        </div>
        <div class="loc-cta">
          <a class="btn btn-primary" href="../index.html#booking" style="background:#fff;color:#082f63;font-weight:800;border:none;">Book Pickup in {name} →</a>
          <a class="btn btn-wa" target="_blank" href="https://wa.me/919217410047?text=Hi%20Mourya%20Dry%20Cleaners,%20I%20want%20to%20book%20a%20pickup%20in%20{name},%20Gurgaon">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            WhatsApp Pickup
          </a>
          <a class="btn" href="tel:+919217410047" style="background:rgba(255,255,255,.15);color:#fff;font-weight:700;border:1px solid rgba(255,255,255,.3);">☎ +91 92174 10047</a>
        </div>
      </div>
    </section>

    <!-- CONTENT BODY -->
    <section class="loc-section">
      <div class="container">

        <!-- SECTION 1: Locally contextualized description -->
        <article class="prose-block">
          <h2>Best Dry Cleaners &amp; Laundry Near Me in {name}, Gurgaon (Pin Code: {pincode}) \u2014 24-Hour Express Route</h2>
          <p>
            Welcome to <strong>Mourya Dry Cleaners</strong>, the trusted doorstep fabric care partner for households, professionals, and gated condominiums across <strong>{name}, Gurugram</strong>. Known for {desc}, this vibrant neighborhood demands reliable, punctual, and non-toxic garment care with a guaranteed <strong>24-hour turnaround</strong>. Whether you are commuting along the nearby expressways, managing high-stakes corporate commitments, or preparing for family celebrations, our dedicated pickup van connects directly with your residence across landmarks like <em>{landmarks}</em>.
          </p>
          <p>
            Unlike traditional local neighbourhood dhobis or unorganized laundries that employ abrasive chemicals and boil fabrics in communal waters, Mourya Dry Cleaners operates on strict <strong>five-star textile care protocols</strong>. Every garment is treated with specialized organic solvents that preserve rich dyes, protect hand-embroidered zari work, and rejuvenate fabric fibers without chemical odor or fading—delivered fresh within 24 hours.
          </p>
          <p>
            From daily office wear—such as crisp cotton shirts (₹80) and bespoke 2-piece corporate suits (₹230)—to couture bridal lehengas, heavy winter mink blankets (₹230–₹280), and wash &amp; fold laundry starting at just ₹55/kg, we provide comprehensive doorstep solutions with zero pickup or drop-off fees on orders above ₹350.
          </p>
        </article>

        <!-- SECTION 2: Services Offered Cards -->
        <h2 style="color:#082f63;font-size:clamp(22px,3.5vw,30px);font-weight:800;text-align:center;margin-bottom:28px;">
          Dry Cleaning &amp; Laundry Services Available in {name} (24-Hour Turnaround)
        </h2>
        <div class="svc-grid">
          <div class="svc-card">
            <span class="svc-icon">👔</span>
            <h3>Corporate &amp; Formal Suit Dry Cleaning</h3>
            <p>24-Hour organic cleaning for two-piece suits (₹230), 3-piece suits (₹280), blazers (₹180), and ties (₹10). Finished on contoured German steam presses for razor-sharp creases.</p>
            <a href="../dry-cleaning-gurugram.html">Explore Suit Cleaning →</a>
          </div>

          <div class="svc-card">
            <span class="svc-icon">👗</span>
            <h3>Bridal Lehengas &amp; Designer Ethnic Wear</h3>
            <p>24-Hour delicate care for heavy wedding lehengas (₹250–₹700), sherwanis (₹250–₹450), and designer sarees (₹180–₹230) with heritage roll press (charak).</p>
            <a href="../wedding-dress-cleaning-gurugram.html">Explore Bridal Care →</a>
          </div>

          <div class="svc-card">
            <span class="svc-icon">👕</span>
            <h3>Hygienic Laundry Per KG (Wash &amp; Fold)</h3>
            <p>24-Hour turnaround individual batch washing for everyday garments. Transparent official rate of ₹55/kg (7+ kg) or ₹65/kg (below 7 kg). Never mixed with other households.</p>
            <a href="../laundry-service-gurugram.html">View Laundry Per KG →</a>
          </div>

          <div class="svc-card">
            <span class="svc-icon">🛏️</span>
            <h3>Blanket, Quilt &amp; Heavy Comforter Care</h3>
            <p>24-Hour deep anti-bacterial sanitization for single/double bed blankets (₹230–₹280), quilts (₹230–₹280), and bedsheets (₹140) to eliminate dust mites and seasonal allergens.</p>
            <a href="../blanket-cleaning-gurugram.html">View Blanket Cleaning →</a>
          </div>

          <div class="svc-card">
            <span class="svc-icon">🛋️</span>
            <h3>Sofa, Carpet &amp; Curtain Deep Sanitization</h3>
            <p>On-site extraction cleaning for fabric &amp; leather sofas (₹230–₹450/seat), carpets (₹35/sq.ft.), and door-to-door curtain dry cleaning (₹140–₹170/panel) in {name}.</p>
            <a href="../sofa-cleaning-gurugram.html">Book Upholstery Cleaning →</a>
          </div>

          <div class="svc-card">
            <span class="svc-icon">👟</span>
            <h3>Designer Shoe &amp; Sneaker Restoration</h3>
            <p>24-Hour detailed manual wash, midsole whitening, and suede conditioning for sports shoes, leather shoes, and sneakers (₹230–₹350/pair).</p>
            <a href="../shoe-cleaning-gurugram.html">View Shoe Restoration →</a>
          </div>
        </div>

        <!-- SECTION 3: Transparent Pricing Table Synced With Official Rate Card -->
        <div class="rate-table-wrap">
          <h2>Official Rate Card &amp; Pricing for {name} (100% Synced)</h2>
          <p style="color:#64748b;font-size:14.5px;margin-bottom:20px;">
            Enjoy completely transparent, official poster rates with guaranteed <strong>24-Hour Turnaround</strong> and free doorstep pickup across {name}.
          </p>
          <table class="rate-table">
            <thead>
              <tr>
                <th>Garment / Service Category</th>
                <th>Turnaround Time</th>
                <th>Official Price Card Rate</th>
                <th>Packaging Style</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Men's Shirt Dry Clean</strong></td>
                <td><span class="turnaround-badge">⚡ 24 Hours</span></td>
                <td class="rate-price">₹80 / pc</td>
                <td>Custom Hanger / Folded Wrap</td>
              </tr>
              <tr>
                <td><strong>Men's T-Shirt Dry Clean</strong></td>
                <td><span class="turnaround-badge">⚡ 24 Hours</span></td>
                <td class="rate-price">₹70 / pc</td>
                <td>Folded Poly Pack</td>
              </tr>
              <tr>
                <td><strong>Men's Pant / Trouser Dry Clean</strong></td>
                <td><span class="turnaround-badge">⚡ 24 Hours</span></td>
                <td class="rate-price">₹80 / pc</td>
                <td>Crisp Trouser Hanger Pack</td>
              </tr>
              <tr>
                <td><strong>Men's Kurta / Pajama Dry Clean</strong></td>
                <td><span class="turnaround-badge">⚡ 24 Hours</span></td>
                <td class="rate-price">₹180 / pair</td>
                <td>Folded Garment Wrap</td>
              </tr>
              <tr>
                <td><strong>Blazer / Coat Dry Clean</strong></td>
                <td><span class="turnaround-badge">⚡ 24 Hours</span></td>
                <td class="rate-price">₹180 / pc</td>
                <td>Hanger &amp; Suit Cover</td>
              </tr>
              <tr>
                <td><strong>J-Suit 2 Pieces (Coat + Pant)</strong></td>
                <td><span class="turnaround-badge">⚡ 24 Hours</span></td>
                <td class="rate-price">₹230 / suit</td>
                <td>Breathable Garment Suit Cover</td>
              </tr>
              <tr>
                <td><strong>J-Suit 3 Pieces (Coat + Pant + Waistcoat)</strong></td>
                <td><span class="turnaround-badge">⚡ 24 Hours</span></td>
                <td class="rate-price">₹280 / suit</td>
                <td>Executive Garment Bag</td>
              </tr>
              <tr>
                <td><strong>Sherwani (2 Pieces)</strong></td>
                <td><span class="turnaround-badge">⚡ 24 Hours</span></td>
                <td class="rate-price">₹250 – ₹450 / set</td>
                <td>Zip-Locked Protective Cover</td>
              </tr>
              <tr>
                <td><strong>Saree Dry Clean (Standard / Heavy)</strong></td>
                <td><span class="turnaround-badge">⚡ 24 Hours</span></td>
                <td class="rate-price">₹180 – ₹230 / pc</td>
                <td>Acid-Free Tissue Folded Wrap</td>
              </tr>
              <tr>
                <td><strong>Ladies Suit (2 Pcs / 3 Pcs)</strong></td>
                <td><span class="turnaround-badge">⚡ 24 Hours</span></td>
                <td class="rate-price">₹180 – ₹250 / set</td>
                <td>Hanger / Folded Pack</td>
              </tr>
              <tr>
                <td><strong>Lehenga (2 Pcs / 3 Pcs Bridal)</strong></td>
                <td><span class="turnaround-badge">⚡ 24 Hours</span></td>
                <td class="rate-price">₹250 – ₹700 / set</td>
                <td>Protective Heavy Garment Bag</td>
              </tr>
              <tr>
                <td><strong>Wash &amp; Fold Laundry (7+ Kg)</strong></td>
                <td><span class="turnaround-badge">⚡ 24 Hours</span></td>
                <td class="rate-price">₹55 / kg</td>
                <td>Hygienic Neat Stack Bundle</td>
              </tr>
              <tr>
                <td><strong>Wash &amp; Fold Laundry (Below 7 Kg)</strong></td>
                <td><span class="turnaround-badge">⚡ 24 Hours</span></td>
                <td class="rate-price">₹65 / kg</td>
                <td>Hygienic Neat Stack Bundle</td>
              </tr>
              <tr>
                <td><strong>Wash &amp; Steam Iron (7+ Kg)</strong></td>
                <td><span class="turnaround-badge">⚡ 24 Hours</span></td>
                <td class="rate-price">₹75 / kg</td>
                <td>Individual Hanger Pack</td>
              </tr>
              <tr>
                <td><strong>Wash &amp; Steam Iron (3–7 Kg)</strong></td>
                <td><span class="turnaround-badge">⚡ 24 Hours</span></td>
                <td class="rate-price">₹80 – ₹85 / kg</td>
                <td>Individual Hanger Pack</td>
              </tr>
              <tr>
                <td><strong>Blanket (Single / Double) / Quilt</strong></td>
                <td><span class="turnaround-badge">⚡ 24 Hours</span></td>
                <td class="rate-price">₹230 – ₹280 / pc</td>
                <td>Vacuum-Sealed Poly Wrap</td>
              </tr>
              <tr>
                <td><strong>Curtain Cleaning (Per Panel)</strong></td>
                <td><span class="turnaround-badge">⚡ 24 Hours</span></td>
                <td class="rate-price">₹140 – ₹170 / panel</td>
                <td>Dust-Proof Protective Wrap</td>
              </tr>
              <tr>
                <td><strong>Shoes / Sneakers Cleaning</strong></td>
                <td><span class="turnaround-badge">⚡ 24 Hours</span></td>
                <td class="rate-price">₹230 – ₹350 / pair</td>
                <td>Moisture-Protected Shoe Bag</td>
              </tr>
              <tr>
                <td><strong>Steam Ironing (Shirt / Pant)</strong></td>
                <td><span class="turnaround-badge">⚡ 24 Hours</span></td>
                <td class="rate-price">₹30 / pc</td>
                <td>Crisp Steam Hanger Pack</td>
              </tr>
              <tr>
                <td><strong>Steam Ironing (Saree + Blouse)</strong></td>
                <td><span class="turnaround-badge">⚡ 24 Hours</span></td>
                <td class="rate-price">₹120 / set</td>
                <td>Roll Pressed / Folded Tissue</td>
              </tr>
            </tbody>
          </table>
          <p style="margin-top:16px;font-size:13.5px;color:#64748b;text-align:right;">
            * All rates 100% synchronized with the official Mourya Dry Cleaners rate card. Free pickup &amp; delivery for orders above ₹350.
          </p>
        </div>

        <!-- SECTION 4: Why Families in Sector Trust Us -->
        <h2 style="color:#082f63;font-size:clamp(22px,3.5vw,30px);font-weight:800;text-align:center;margin-bottom:28px;">
          Why Families in {name} Trust Mourya Dry Cleaners
        </h2>
        <div class="reasons-grid">
          <div class="reason-box">
            <h3>⚡ Guaranteed 24-Hour Turnaround</h3>
            <p>No waiting 4–5 days for your favorite clothes. We pick up, process with medical-grade care, and return your garments within 24 hours.</p>
          </div>
          <div class="reason-box">
            <h3>🌱 Zero Harsh Perchloroethylene</h3>
            <p>We eliminate hazardous 'Perc' chemicals in favor of medical-grade, dermatologically safe hydrocarbon solvents that are completely safe for sensitive skin and infant wear.</p>
          </div>
          <div class="reason-box">
            <h3>🧼 Dedicated Batch Hygiene</h3>
            <p>Your laundry is never mixed with another client's clothes. Every order is processed in its own computer-metered drum using purified, treated soft water.</p>
          </div>
          <div class="reason-box">
            <h3>💨 Precision German Steam Press</h3>
            <p>Say goodbye to burnt shine, stubborn seam creases, or scorch marks. Our temperature-regulated ergonomic steam irons preserve fabric texture and drape.</p>
          </div>
        </div>

        <!-- SECTION 4B: Popular Searches Keyword Matrix -->
        <div style="margin-top:50px;margin-bottom:40px;">
          <h2 style="color:#082f63;font-size:clamp(22px,3.5vw,30px);font-weight:800;text-align:center;margin-bottom:28px;">
            Popular Garment &amp; Laundry Searches in {name}, Gurgaon ({pincode})
          </h2>
          <div style="display:flex;flex-wrap:wrap;justify-content:center;gap:10px;max-width:900px;margin:0 auto;">
            <span style="background:#f0f7ff;color:#0b3d78;padding:8px 16px;border-radius:999px;font-size:13.5px;font-weight:600;border:1px solid #dbeafe;">Dry Cleaners Near Me in {name}</span>
            <span style="background:#f0f7ff;color:#0b3d78;padding:8px 16px;border-radius:999px;font-size:13.5px;font-weight:600;border:1px solid #dbeafe;">Laundry Service in {name} @ \u20b955/Kg</span>
            <span style="background:#f0f7ff;color:#0b3d78;padding:8px 16px;border-radius:999px;font-size:13.5px;font-weight:600;border:1px solid #dbeafe;">Wash &amp; Steam Iron {name}</span>
            <span style="background:#f0f7ff;color:#0b3d78;padding:8px 16px;border-radius:999px;font-size:13.5px;font-weight:600;border:1px solid #dbeafe;">Bridal Lehenga Dry Cleaning {name}</span>
            <span style="background:#f0f7ff;color:#0b3d78;padding:8px 16px;border-radius:999px;font-size:13.5px;font-weight:600;border:1px solid #dbeafe;">Suit &amp; Blazer Dry Cleaners {name}</span>
            <span style="background:#f0f7ff;color:#0b3d78;padding:8px 16px;border-radius:999px;font-size:13.5px;font-weight:600;border:1px solid #dbeafe;">Silk Saree Roll Polish (Charak) {name}</span>
            <span style="background:#f0f7ff;color:#0b3d78;padding:8px 16px;border-radius:999px;font-size:13.5px;font-weight:600;border:1px solid #dbeafe;">Double Blanket &amp; Razai Dry Cleaning {name}</span>
            <span style="background:#f0f7ff;color:#0b3d78;padding:8px 16px;border-radius:999px;font-size:13.5px;font-weight:600;border:1px solid #dbeafe;">Sofa Shampooing at Home {name}</span>
            <span style="background:#f0f7ff;color:#0b3d78;padding:8px 16px;border-radius:999px;font-size:13.5px;font-weight:600;border:1px solid #dbeafe;">Carpet Dry Cleaning {name}</span>
            <span style="background:#f0f7ff;color:#0b3d78;padding:8px 16px;border-radius:999px;font-size:13.5px;font-weight:600;border:1px solid #dbeafe;">Curtain Dry Cleaning with Re-Hanging {name}</span>
            <span style="background:#f0f7ff;color:#0b3d78;padding:8px 16px;border-radius:999px;font-size:13.5px;font-weight:600;border:1px solid #dbeafe;">White Sneaker &amp; Shoe Laundry {name}</span>
            <span style="background:#f0f7ff;color:#0b3d78;padding:8px 16px;border-radius:999px;font-size:13.5px;font-weight:600;border:1px solid #dbeafe;">Leather Jacket &amp; Handbag Cleaning {name}</span>
            <span style="background:#f0f7ff;color:#0b3d78;padding:8px 16px;border-radius:999px;font-size:13.5px;font-weight:600;border:1px solid #dbeafe;">Steam Ironing Service {name}</span>
            <span style="background:#f0f7ff;color:#0b3d78;padding:8px 16px;border-radius:999px;font-size:13.5px;font-weight:600;border:1px solid #dbeafe;">Same-Day 24hr Express Dry Cleaners {name}</span>
          </div>
        </div>

        <!-- SECTION 5: FAQs -->
        <h2 style="color:#082f63;font-size:clamp(22px,3.5vw,30px);font-weight:800;text-align:center;margin-bottom:28px;">
          Frequently Asked Questions for {name} Residents
        </h2>
        <div class="faq-list">
"""

    for f in faqs:
        html += f"""          <div class="faq-item">
            <h3>❓ {f["q"]}</h3>
            <p>{f["a"]}</p>
          </div>\n"""

    html += f"""        </div>

        <!-- RELATED SECTORS GRID -->
        <div class="area-links-box">
          <h2>Serving Neighboring Sectors &amp; Localities Around {name}</h2>
          <p style="color:#64748b;font-size:14px;margin-bottom:20px;">
            We also provide daily 24-hour doorstep pickup and drop across adjacent Gurugram communities:
          </p>
          <div class="area-pills-row">
{related_pills_html}
            <a href="../areas-served.html" class="area-link" style="background:#0877ff;color:#fff;border-color:#0877ff;">View All 191+ Sectors →</a>
          </div>
        </div>

        <!-- BOTTOM CALL TO ACTION -->
        <div class="bottom-cta-banner">
          <h2>Ready for Free 24-Hour Doorstep Pickup in {name}?</h2>
          <p>Book your dry cleaning or laundry pickup today. Our rider arrives at your doorstep in {name} with fresh sanitized garment bags and returns them in 24 hours.</p>
          <div class="loc-cta">
            <a class="btn btn-primary" href="../index.html#booking" style="background:#fff;color:#082f63;font-weight:800;border:none;">Book Online Now →</a>
            <a class="btn btn-wa" target="_blank" href="https://wa.me/919217410047?text=Hi%20Mourya%20Dry%20Cleaners,%20I%20want%20to%20schedule%20a%2024-hour%20pickup%20in%20{name},%20Gurugram">💬 Instant WhatsApp Booking</a>
            <a class="btn" href="tel:+919217410047" style="background:rgba(255,255,255,.15);color:#fff;font-weight:700;border:1px solid rgba(255,255,255,.3);">☎ Call 92174 10047</a>
          </div>
        </div>

      </div>
    </section>
  </main>

  <!-- FOOTER -->
  <section class="footer-top">
    <div class="container footer-grid">
      <div>
        <img class="footer-logo" src="../assets/logo.jpg" alt="Mourya Dry Cleaners" width="145" height="103" loading="lazy" decoding="async" />
        <p>Gurugram's trusted eco-friendly dry cleaning &amp; laundry service — serving {footer_areas} &amp; all 115 HUDA Sectors with 24-hour delivery.</p>
        <div class="socials">
          <a href="https://wa.me/919217410047" target="_blank" title="WhatsApp">WA</a>
        </div>
      </div>
      <div>
        <h4>Quick Links</h4>
        <a href="../index.html">Home</a>
        <a href="../about.html">About Us</a>
        <a href="../dry-cleaning-gurugram.html">Dry Cleaning</a>
        <a href="../laundry-service-gurugram.html">Laundry Service</a>
        <a href="../pricing.html">Pricing &amp; Rate Card</a>
        <a href="../areas-served.html">Areas We Serve</a>
        <a href="../blog.html">Care Guides &amp; Blog</a>
        <a href="../faq.html">FAQs &amp; Help</a>
        <a href="../contact.html">Contact Us</a>
      </div>
      <div>
        <h4>Our Services</h4>
        <a href="../dry-cleaning-gurugram.html">Suit &amp; Blazer Cleaning</a>
        <a href="../wedding-dress-cleaning-gurugram.html">Wedding Lehenga Cleaning</a>
        <a href="../laundry-service-gurugram.html">Wash &amp; Fold (Per Kg)</a>
        <a href="../blanket-cleaning-gurugram.html">Blanket &amp; Quilt Cleaning</a>
        <a href="../curtain-cleaning-gurugram.html">Curtain Dry Cleaning</a>
        <a href="../sofa-cleaning-gurugram.html">Sofa Deep Cleaning</a>
        <a href="../shoe-cleaning-gurugram.html">Shoe Cleaning</a>
        <a href="../carpet-cleaning-gurugram.html">Carpet &amp; Rug Cleaning</a>
        <a href="../suit-dry-cleaning-gurugram.html">Suit &amp; Blazer Dry Clean</a>
        <a href="../steam-ironing-gurugram.html">Steam Ironing Service</a>
        <a href="../leather-bag-cleaning-gurugram.html">Leather &amp; Bag Care</a>
        <a href="../commercial-laundry-gurugram.html">Commercial Laundry</a>
      </div>
      <div id="contact">
        <h4>Contact Us</h4>
        <a href="tel:+919217410047">☎ &nbsp;+91 92174 10047</a>
        <a href="mailto:info@mouryadrycleaners.com">✉ &nbsp;info@mouryadrycleaners.com</a>
        <a href="https://maps.app.goo.gl/94gUCpQmDEUs6Fpf8" target="_blank">📍 &nbsp;Dhobi Ghat, Basai Village, Sector 9B, Gurugram</a>
        <a href="#">🕒 &nbsp;8:00 AM – 10:00 PM (Monday – Sunday)</a>
      </div>
      <div class="map">
        <iframe src="https://maps.google.com/maps?q=Dhobi+Ghat,+Basai+Village,+Sector+9B,+Gurugram&t=&z=14&ie=UTF8&iwloc=&output=embed" width="100%" height="150" style="border:0;border-radius:10px;" allowfullscreen="" loading="lazy"></iframe>
        <a target="_blank" href="https://maps.app.goo.gl/94gUCpQmDEUs6Fpf8">Open in Google Maps</a>
      </div>
      <div class="footer-neighbourhoods" style="grid-column: 1 / -1; border-top: 1px solid rgba(0,0,0,0.08); margin-top: 20px; padding-top: 14px; text-align: center; font-size: 13.5px; color: #64748b; line-height: 1.8;">
        <span style="font-weight: 700; color: #082f63;">Popular Gurugram Localities:</span>
        <a href="dry-cleaners-dlf-phase-1-gurgaon.html" style="color: #0877ff; font-weight: 600; text-decoration: none; margin: 0 5px;">DLF Phase 1</a> •
        <a href="dry-cleaners-dlf-phase-5-gurgaon.html" style="color: #0877ff; font-weight: 600; text-decoration: none; margin: 0 5px;">DLF Phase 5</a> •
        <a href="dry-cleaners-golf-course-road-gurgaon.html" style="color: #0877ff; font-weight: 600; text-decoration: none; margin: 0 5px;">Golf Course Road</a> •
        <a href="dry-cleaners-sohna-road-gurgaon.html" style="color: #0877ff; font-weight: 600; text-decoration: none; margin: 0 5px;">Sohna Road</a> •
        <a href="dry-cleaners-sector-56-gurgaon.html" style="color: #0877ff; font-weight: 600; text-decoration: none; margin: 0 5px;">Sector 56</a> •
        <a href="dry-cleaners-sector-82-gurgaon.html" style="color: #0877ff; font-weight: 600; text-decoration: none; margin: 0 5px;">Sector 82</a> •
        <a href="dry-cleaners-dwarka-expressway-gurgaon.html" style="color: #0877ff; font-weight: 600; text-decoration: none; margin: 0 5px;">Dwarka Expressway</a> •
        <a href="../areas-served.html" style="color: #0877ff; font-weight: 700; text-decoration: none; margin: 0 5px;">All 115+ Sectors &amp; Localities →</a>
      </div>
    </div>
  </section>

  <footer class="footer-bottom">
    <div class="container">
      <span>© 2026 Mourya Dry Cleaners. All rights reserved.</span>
      <span><a href="#">Privacy Policy</a> &nbsp;|&nbsp; <a href="#">Terms &amp; Conditions</a></span>
      <span>Eco-Friendly Premium Fabric Care in Gurugram • 24-Hour Express Service</span>
    </div>
  </footer>

  <div class="mobile-bar">
    <a href="tel:+919217410047">📞 Call Now</a>
    <a target="_blank" href="https://wa.me/919217410047?text=Hi%20Mourya%20Dry%20Cleaners,%20I%20want%20to%20book%20a%2024-hour%20pickup%20in%20{name},%20Gurgaon">💬 WhatsApp</a>
    <a href="../index.html#booking">📅 Book Pickup</a>
  </div>

  <a href="https://wa.me/919217410047?text=Hi%20Mourya%20Dry%20Cleaners,%20I%20want%20to%20book%20a%2024-hour%20pickup%20in%20{name},%20Gurgaon" class="float-wa" target="_blank" rel="noopener noreferrer" aria-label="Chat on WhatsApp">
    <span class="float-wa-pulse" aria-hidden="true"></span>
    <span class="float-wa-tooltip">Chat with us</span>
    <svg class="float-wa-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="30" height="30" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
    <span class="float-wa-status" title="Online" aria-hidden="true"></span>
  </a>

  <script src="../script.js"></script>
</body>
</html>
"""
    return html

def main():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    locations_dir = os.path.join(base_dir, "locations")
    os.makedirs(locations_dir, exist_ok=True)

    generated_files = []
    print(f"Generating {len(LOCATIONS)} programmatic location landing pages with synchronized official rates & 24h turnaround...")

    for loc in LOCATIONS:
        filename = f"dry-cleaners-{loc['slug']}-gurgaon.html"
        filepath = os.path.join(locations_dir, filename)
        content = generate_page_html(loc)
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(content)
        generated_files.append((filename, loc["name"], loc["slug"]))

    print(f"Successfully re-generated {len(generated_files)} pages in '{locations_dir}' with 100% price card sync & 24-hour turnaround!")

    # Update sitemap.xml
    sitemap_path = os.path.join(base_dir, "sitemap.xml")
    if os.path.exists(sitemap_path):
        with open(sitemap_path, "r", encoding="utf-8") as f:
            sitemap_content = f.read()

        new_urls = []
        for filename, name, slug in generated_files:
            loc_url = f"https://mouryadrycleaners.in/locations/{filename}"
            if loc_url not in sitemap_content:
                new_urls.append(f"""  <url>
    <loc>{loc_url}</loc>
    <lastmod>2026-10-15</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.90</priority>
  </url>""")
        
        if new_urls:
            insertion = "\n" + "\n".join(new_urls) + "\n</urlset>"
            sitemap_content = sitemap_content.replace("</urlset>", insertion)
            with open(sitemap_path, "w", encoding="utf-8") as f:
                f.write(sitemap_content)
            print(f"Added {len(new_urls)} new location URLs to sitemap.xml!")

if __name__ == "__main__":
    main()

