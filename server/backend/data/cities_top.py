TOP50_CITIES = [
    # --- Americas (15) ---
    {"key":"nyc",            "name":"New York",        "country":"USA",          "lat":40.7128,  "lon":-74.0060},
    {"key":"los_angeles",    "name":"Los Angeles",     "country":"USA",          "lat":34.0522,  "lon":-118.2437},
    {"key":"chicago",        "name":"Chicago",         "country":"USA",          "lat":41.8781,  "lon":-87.6298},
    {"key":"san_francisco",  "name":"San Francisco",   "country":"USA",          "lat":37.7749,  "lon":-122.4194},
    {"key":"houston",        "name":"Houston",         "country":"USA",          "lat":29.7604,  "lon":-95.3698},
    {"key":"miami",          "name":"Miami",           "country":"USA",          "lat":25.7617,  "lon":-80.1918},
    {"key":"toronto",        "name":"Toronto",         "country":"Canada",       "lat":43.6532,  "lon":-79.3832},
    {"key":"vancouver",      "name":"Vancouver",       "country":"Canada",       "lat":49.2827,  "lon":-123.1207},
    {"key":"mexico_city",    "name":"Mexico City",     "country":"Mexico",       "lat":19.4326,  "lon":-99.1332},
    {"key":"sao_paulo",      "name":"São Paulo",       "country":"Brazil",       "lat":-23.5505, "lon":-46.6333},
    {"key":"rio_de_janeiro", "name":"Rio de Janeiro",  "country":"Brazil",       "lat":-22.9068, "lon":-43.1729},
    {"key":"buenos_aires",   "name":"Buenos Aires",    "country":"Argentina",    "lat":-34.6037, "lon":-58.3816},
    {"key":"santiago",       "name":"Santiago",        "country":"Chile",        "lat":-33.4489, "lon":-70.6693},
    {"key":"bogota",         "name":"Bogotá",          "country":"Colombia",     "lat":4.7110,   "lon":-74.0721},
    {"key":"lima",           "name":"Lima",            "country":"Peru",         "lat":-12.0464, "lon":-77.0428},

    # --- Europe (18) ---
    {"key":"london",         "name":"London",          "country":"UK",           "lat":51.5074,  "lon":-0.1278},
    {"key":"paris",          "name":"Paris",           "country":"France",       "lat":48.8566,  "lon":2.3522},
    {"key":"berlin",         "name":"Berlin",          "country":"Germany",      "lat":52.5200,  "lon":13.4050},
    {"key":"madrid",         "name":"Madrid",          "country":"Spain",        "lat":40.4168,  "lon":-3.7038},
    {"key":"barcelona",      "name":"Barcelona",       "country":"Spain",        "lat":41.3851,  "lon":2.1734},
    {"key":"rome",           "name":"Rome",            "country":"Italy",        "lat":41.9028,  "lon":12.4964},
    {"key":"milan",          "name":"Milan",           "country":"Italy",        "lat":45.4642,  "lon":9.1900},
    {"key":"amsterdam",      "name":"Amsterdam",       "country":"Netherlands",  "lat":52.3676,  "lon":4.9041},
    {"key":"istanbul",       "name":"Istanbul",        "country":"Türkiye",      "lat":41.0082,  "lon":28.9784},
    {"key":"vienna",         "name":"Vienna",          "country":"Austria",      "lat":48.2082,  "lon":16.3738},
    {"key":"munich",         "name":"Munich",          "country":"Germany",      "lat":48.1351,  "lon":11.5820},
    {"key":"zurich",         "name":"Zurich",          "country":"Switzerland",  "lat":47.3769,  "lon":8.5417},
    {"key":"stockholm",      "name":"Stockholm",       "country":"Sweden",       "lat":59.3293,  "lon":18.0686},
    {"key":"copenhagen",     "name":"Copenhagen",      "country":"Denmark",      "lat":55.6761,  "lon":12.5683},
    {"key":"warsaw",         "name":"Warsaw",          "country":"Poland",       "lat":52.2297,  "lon":21.0122},
    {"key":"prague",         "name":"Prague",          "country":"Czechia",      "lat":50.0755,  "lon":14.4378},
    {"key":"budapest",       "name":"Budapest",        "country":"Hungary",      "lat":47.4979,  "lon":19.0402},
    {"key":"lisbon",         "name":"Lisbon",          "country":"Portugal",     "lat":38.7223,  "lon":-9.1393},

    # --- Middle East & Africa (8) ---
    {"key":"cairo",          "name":"Cairo",           "country":"Egypt",        "lat":30.0444,  "lon":31.2357},
    {"key":"lagos",          "name":"Lagos",           "country":"Nigeria",      "lat":6.5244,   "lon":3.3792},
    {"key":"nairobi",        "name":"Nairobi",         "country":"Kenya",        "lat":-1.2921,  "lon":36.8219},
    {"key":"johannesburg",   "name":"Johannesburg",    "country":"South Africa", "lat":-26.2041, "lon":28.0473},
    {"key":"casablanca",     "name":"Casablanca",      "country":"Morocco",      "lat":33.5731,  "lon":-7.5898},
    {"key":"dubai",          "name":"Dubai",           "country":"UAE",          "lat":25.2048,  "lon":55.2708},
    {"key":"riyadh",         "name":"Riyadh",          "country":"Saudi Arabia", "lat":24.7136,  "lon":46.6753},
    {"key":"tel_aviv",       "name":"Tel Aviv",        "country":"Israel",       "lat":32.0853,  "lon":34.7818},

    # --- Asia–Pacific (9) ---
    {"key":"delhi",          "name":"Delhi",           "country":"India",        "lat":28.6139,  "lon":77.2090},
    {"key":"mumbai",         "name":"Mumbai",          "country":"India",        "lat":19.0760,  "lon":72.8777},
    {"key":"bangalore",      "name":"Bengaluru",       "country":"India",        "lat":12.9716,  "lon":77.5946},
    {"key":"beijing",        "name":"Beijing",         "country":"China",        "lat":39.9042,  "lon":116.4074},
    {"key":"shanghai",       "name":"Shanghai",        "country":"China",        "lat":31.2304,  "lon":121.4737},
    {"key":"tokyo",          "name":"Tokyo",           "country":"Japan",        "lat":35.6895,  "lon":139.6917},
    {"key":"osaka",          "name":"Osaka",           "country":"Japan",        "lat":34.6937,  "lon":135.5023},
    {"key":"seoul",          "name":"Seoul",           "country":"South Korea",  "lat":37.5665,  "lon":126.9780},
    {"key":"singapore",      "name":"Singapore",       "country":"Singapore",    "lat":1.3521,   "lon":103.8198},
]

EXTRA_CITIES = [
    # --- Asia (28) ---
    {"key":"chennai","name":"Chennai","country":"India","lat":13.0827,"lon":80.2707},
    {"key":"hyderabad","name":"Hyderabad","country":"India","lat":17.3850,"lon":78.4867},
    {"key":"kolkata","name":"Kolkata","country":"India","lat":22.5726,"lon":88.3639},
    {"key":"pune","name":"Pune","country":"India","lat":18.5204,"lon":73.8567},
    {"key":"ahmedabad","name":"Ahmedabad","country":"India","lat":23.0225,"lon":72.5714},
    {"key":"karachi","name":"Karachi","country":"Pakistan","lat":24.8607,"lon":67.0011},
    {"key":"lahore","name":"Lahore","country":"Pakistan","lat":31.5204,"lon":74.3587},
    {"key":"dhaka","name":"Dhaka","country":"Bangladesh","lat":23.8103,"lon":90.4125},
    {"key":"colombo","name":"Colombo","country":"Sri Lanka","lat":6.9271,"lon":79.8612},
    {"key":"kathmandu","name":"Kathmandu","country":"Nepal","lat":27.7172,"lon":85.3240},
    {"key":"yangon","name":"Yangon","country":"Myanmar","lat":16.8409,"lon":96.1735},
    {"key":"bangkok","name":"Bangkok","country":"Thailand","lat":13.7563,"lon":100.5018},
    {"key":"hanoi","name":"Hanoi","country":"Vietnam","lat":21.0278,"lon":105.8342},
    {"key":"ho_chi_minh_city","name":"Ho Chi Minh City","country":"Vietnam","lat":10.8231,"lon":106.6297},
    {"key":"manila","name":"Manila","country":"Philippines","lat":14.5995,"lon":120.9842},
    {"key":"kuala_lumpur","name":"Kuala Lumpur","country":"Malaysia","lat":3.1390,"lon":101.6869},
    {"key":"jakarta","name":"Jakarta","country":"Indonesia","lat":-6.2088,"lon":106.8456},
    {"key":"surabaya","name":"Surabaya","country":"Indonesia","lat":-7.2575,"lon":112.7521},
    {"key":"hong_kong","name":"Hong Kong","country":"China (SAR)","lat":22.3193,"lon":114.1694},
    {"key":"taipei","name":"Taipei","country":"Taiwan","lat":25.0330,"lon":121.5654},
    {"key":"shenzhen","name":"Shenzhen","country":"China","lat":22.5431,"lon":114.0579},
    {"key":"guangzhou","name":"Guangzhou","country":"China","lat":23.1291,"lon":113.2644},
    {"key":"chengdu","name":"Chengdu","country":"China","lat":30.5728,"lon":104.0668},
    {"key":"chongqing","name":"Chongqing","country":"China","lat":29.5630,"lon":106.5516},
    {"key":"wuhan","name":"Wuhan","country":"China","lat":30.5928,"lon":114.3055},
    {"key":"nanjing","name":"Nanjing","country":"China","lat":32.0603,"lon":118.7969},
    {"key":"xian","name":"Xi'an","country":"China","lat":34.3416,"lon":108.9398},
    {"key":"hangzhou","name":"Hangzhou","country":"China","lat":30.2741,"lon":120.1551},

    # --- Europe (1) ---
    {"key":"frankfurt","name":"Frankfurt am Main","country":"Germany","lat":50.11092,"lon":8.682127},

    # --- Oceania (5) ---
    {"key":"sydney","name":"Sydney","country":"Australia","lat":-33.8688,"lon":151.2093},
    {"key":"melbourne","name":"Melbourne","country":"Australia","lat":-37.8136,"lon":144.9631},
    {"key":"brisbane","name":"Brisbane","country":"Australia","lat":-27.4698,"lon":153.0251},
    {"key":"perth","name":"Perth","country":"Australia","lat":-31.9523,"lon":115.8613},
    {"key":"auckland","name":"Auckland","country":"New Zealand","lat":-36.8485,"lon":174.7633},

    # --- Middle East (5) ---
    {"key":"tehran","name":"Tehran","country":"Iran","lat":35.6892,"lon":51.3890},
    {"key":"baghdad","name":"Baghdad","country":"Iraq","lat":33.3152,"lon":44.3661},
    {"key":"doha","name":"Doha","country":"Qatar","lat":25.2854,"lon":51.5310},
    {"key":"abu_dhabi","name":"Abu Dhabi","country":"UAE","lat":24.4539,"lon":54.3773},
    {"key":"muscat","name":"Muscat","country":"Oman","lat":23.5880,"lon":58.3829},

    # --- Africa (4) ---
    {"key":"dakar","name":"Dakar","country":"Senegal","lat":14.7167,"lon":-17.4677},
    {"key":"abidjan","name":"Abidjan","country":"Côte d’Ivoire","lat":5.3520,"lon":-4.0078},
    {"key":"dar_es_salaam","name":"Dar es Salaam","country":"Tanzania","lat":-6.7924,"lon":39.2083},
    {"key":"tunis","name":"Tunis","country":"Tunisia","lat":36.8065,"lon":10.1815},

    # --- Americas (8) ---
    {"key":"austin","name":"Austin","country":"USA","lat":30.2672,"lon":-97.7431},
    {"key":"san_antonio","name":"San Antonio","country":"USA","lat":29.4241,"lon":-98.4936},
    {"key":"charlotte","name":"Charlotte","country":"USA","lat":35.2271,"lon":-80.8431},
    {"key":"orlando","name":"Orlando","country":"USA","lat":28.5383,"lon":-81.3792},
    {"key":"tampa","name":"Tampa","country":"USA","lat":27.9506,"lon":-82.4572},
    {"key":"las_vegas","name":"Las Vegas","country":"USA","lat":36.1699,"lon":-115.1398},
    {"key":"brasilia","name":"Brasília","country":"Brazil","lat":-15.8267,"lon":-47.9218},
    {"key":"belo_horizonte","name":"Belo Horizonte","country":"Brazil","lat":-19.9167,"lon":-43.9345},
]

# Exposed list used by /api/v1/acg/cities
TOP_CITIES = TOP50_CITIES + EXTRA_CITIES
# Sanity check (leave as comment): assert len(TOP100_CITIES) == 100

