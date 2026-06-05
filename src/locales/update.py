import json
import os

locales_dir = r'z:\AbdiAdama\fix\abdi-adama-frontend\src\locales'

en_sections = {
    'pillars': {
        'subtitle': 'What Sets Us Apart',
        'title': 'The Four Pillars of Our Excellence',
        'desc': 'At Abdi Adama School, we don\'t just teach; we transform. Our distinct educational philosophy is built upon four core pillars.',
        'items': [
            {'title': 'Integrity', 'desc': 'Doing what is right, always. We foster honesty and accountability in every interaction. Character is defined by what you do when no one is watching.'},
            {'title': 'Leadership', 'desc': 'Cultivating the potential within. We empower students to take initiative, find their voice, build confidence, and inspire others.'},
            {'title': 'Success', 'desc': 'A holistic mindset. We define success by resilience and the pursuit of one\'s full potential — not just a GPA.'},
            {'title': 'Lifelong Learning', 'desc': 'Staying curious. Our inquiry-based curriculum moves beyond rote memorization to encourage creative thinking and innovation.'}
        ]
    },
    'vision': {
        'subtitle': 'Our Vision',
        'desc': 'To empower our community through a premier 21st-century learning experience that balances academic rigor with ethical purpose. We strive to cultivate Ethiopia\'s future entrepreneurs, inventors, and scholars — equipping them to lead with innovation, creativity, and integrity.',
        'missionSubtitle': 'Our Mission',
        'missionDesc': 'To stand as a beacon of educational excellence in Ethiopia. Abdi Adama School is a dedicated, learning-centered institution providing world-class education that exceeds national standards while remaining deeply rooted in the rich culture, values, and traditions of Ethiopia.',
        'features': [
            {'label': 'Academic Excellence', 'desc': 'Delivering a curriculum that meets global benchmarks'},
            {'label': 'Cultural Identity', 'desc': 'Celebrating Ethiopian heritage as a foundation for growth'},
            {'label': 'Future-Ready Skills', 'desc': 'Training the next generation of scientists and leaders'},
            {'label': 'Ethical Leadership', 'desc': 'Ensuring success is always guided by strong moral values'}
        ]
    },
    'community': {
        'subtitle': 'The Abdi Adama Community',
        'title': 'Our Values',
        'desc': 'Our strength is our people — a vibrant, purpose-driven ecosystem where students, parents, and educators unite.',
        'quote': '\"Together — as students, parents, and teachers — we don\'t just build a school; we build the future of Ethiopia.\"',
        'tabs': {
            'students': {'tab': 'Our Students', 'title': 'Our Students', 'subtitle': 'Inspired to Learn, Prepared to Lead', 'traits': ['Passionate Learners driven by curiosity', 'Ethical & Reflective with strong moral character', 'Resilient — turning challenges into opportunities', 'Confident Communicators who lead with purpose', 'Collaborative team players who celebrate diversity', 'Boldly Innovative — striving for excellence daily']},
            'parents': {'tab': 'Our Parents', 'title': 'Our Parents', 'subtitle': 'Partners in the Educational Journey', 'traits': ['Valued & Heard — your insights are our cornerstone', 'Informed through transparent, regular updates', 'Confident your child is in a world-class environment', 'Welcomed as active participants in school life', 'True Partners in your child\'s academic evolution']},
            'teachers': {'tab': 'Our Teachers', 'title': 'Our Teachers', 'subtitle': 'Mentors, Role Models, and Visionaries', 'traits': ['Values-Driven with deep empathy and integrity', 'Dynamic & Enthusiastic — making learning infectious', 'Progressive & Innovative with 21st-century methods', 'Deeply Caring — building trusting relationships', 'Ambitious — never settling for less than excellence']}
        }
    },
    'promise': {
        'subtitle': 'Our Promise',
        'title': 'To Every Parent',
        'desc': 'By entrusting us with your child, you place your greatest treasure in our care. We accept this responsibility with profound respect.',
        'items': [
            {'title': 'Trust & Safety', 'desc': 'A safe, supportive sanctuary where every child is seen, heard, and valued.'},
            {'title': '21st-Century Learning', 'desc': 'Critical Thinking, Creativity, Collaboration, and Communication — the 4Cs.'},
            {'title': 'Celebrating the Individual', 'desc': 'Tailored approaches honoring each student\'s unique strengths and learning style.'},
            {'title': 'Open Communication', 'desc': 'Transparent, regular updates keeping you informed every step of the way.'},
            {'title': 'Holistic Growth', 'desc': 'Social, emotional, and physical well-being alongside academic triumphs.'},
            {'title': 'Extracurricular Excellence', 'desc': 'Sports, arts, leadership, and community service cultivating well-rounded individuals.'}
        ]
    },
    'schoolLife': {
        'subtitle': 'School Life',
        'title': 'Beyond the Classroom',
        'uniform': {
            'title': 'School Uniform',
            'desc': 'Our uniform is more than a dress code — it reflects our collective identity, high standards, and commitment to inclusion. When students dress with purpose, they learn with purpose.',
            'items': [
                {'label': 'Unity & Equality', 'desc': 'Moving past social pressures, focusing on shared values'},
                {'label': 'Focus', 'desc': 'Minimizing distractions, maximizing academic achievement'},
                {'label': 'Professionalism', 'desc': 'Instilling pride and discipline for the world ahead'},
                {'label': 'Badge of Pride', 'desc': 'Ambassadors of integrity and excellence'}
            ]
        },
        'transport': {
            'title': 'School Transport',
            'desc': 'A successful school day begins before the first bell. Our premier transport service prioritizes safety, comfort, and punctuality of every student.',
            'items': [
                'Modern fleet with advanced safety features and trained staff',
                'Reliable schedules ensuring students arrive refreshed and on time',
                'Strategic routes serving a wide variety of locations',
                'Building independence, punctuality, and social etiquette'
            ]
        },
        'facilities': {
            'title': 'Our Facilities',
            'items': [
                {'title': 'Football Pitch', 'desc': 'Professionally maintained pitch for PE, training, and tournaments'},
                {'title': 'Basketball Courts', 'desc': 'Year-round courts for skill-building and inter-house competitions'},
                {'title': 'Green Spaces', 'desc': 'Expansive lawns and gardens for outdoor learning and community events'}
            ]
        }
    },
    'team': {
        'subtitle': 'Leadership',
        'title': 'Our Team',
        'desc': 'The dedicated leaders behind the Abdi Adama School network.',
        'members': [
            {'name': 'Ato Girma Lemi', 'role': 'Founder & Owner'},
            {'name': 'W/ro Tigist Abera', 'role': 'Director — Kebele 10'},
            {'name': 'Ato Dawit Mengistu', 'role': 'Director — Mogoro'},
            {'name': 'W/ro Hana Solomon', 'role': 'Vice Director — 180 Village'},
            {'name': 'Ato Yonas Bekele', 'role': 'Director — Awash'}
        ]
    }
}

am_sections = {
    'pillars': {
        'subtitle': 'ከሌሎች የምንለይበት',
        'title': 'አራቱ የልህቀታችን ምሰሶዎች',
        'desc': 'በአብዲ አዳማ ትምህርት ቤት፣ እኛ ማስተማር ብቻ ሳይሆን እንለውጣለን። የተለየ የትምህርት ፍልስፍናችን በአራት ዋና ዋና ምሰሶዎች ላይ የተገነባ ነው።',
        'items': [
            {'title': 'ታማኝነት', 'desc': 'ሁልጊዜ ትክክለኛውን ነገር ማድረግ። በእያንዳንዱ ግንኙነት ውስጥ ታማኝነትን እና ተጠያቂነትን እናሳድጋለን። ባህሪ የሚገለጸው ማንም በማያይህ ጊዜ በምታደርገው ነገር ነው።'},
            {'title': 'አመራር', 'desc': 'የውስጥ እምቅ ችሎታን ማሳደግ። ተማሪዎች ተነሳሽነት እንዲወስዱ፣ ድምፃቸውን እንዲያገኙ፣ በራስ መተማመን እንዲገነቡ እና ሌሎችን እንዲያነሳሱ እናበረታታቸዋለን።'},
            {'title': 'ስኬት', 'desc': 'ሁለንተናዊ አስተሳሰብ። ስኬትን የምንገልጸው በጥንካሬ እና ሙሉ አቅምን ለማሳካት በሚደረግ ጥረት ነው — በውጤት (GPA) ብቻ አይደለም።'},
            {'title': 'የዕድሜ ልክ ትምህርት', 'desc': 'የማወቅ ጉጉትን መጠበቅ። በጥያቄ ላይ የተመሰረተው ስርዓተ ትምህርታችን ከማስታወስ ባለፈ የፈጠራ አስተሳሰብን እና ፈጠራን ለማበረታታት ይረዳል።'}
        ]
    },
    'vision': {
        'subtitle': 'ራዕያችን',
        'desc': 'የአካዳሚክ ጥንካሬን ከስነ-ምግባር ዓላማ ጋር በሚያመዛዝን የ21ኛው ክፍለ ዘመን የመጀመሪያ ደረጃ የመማር ልምድ ማህበረሰባችንን ማብቃት። የኢትዮጵያን የወደፊት ስራ ፈጣሪዎችን፣ ፈጣሪዎችን እና ምሁራንን ለማፍራት እንጥራለን — በፈጠራ፣ በፈጠራ ችሎታ እና በታማኝነት እንዲመሩ እናዘጋጃቸዋለን።',
        'missionSubtitle': 'ተልእኳችን',
        'missionDesc': 'በኢትዮጵያ የትምህርት ልህቀት ብርሃን ሆኖ መቆም። አብዲ አዳማ ትምህርት ቤት የኢትዮጵያን የበለፀገ ባህል፣ እሴት እና ወጎች ጠብቆ ሀገር አቀፍ ደረጃን የጠበቀ ዓለም አቀፍ ደረጃውን የጠበቀ ትምህርት የሚሰጥ የተማሪዎችን ትምህርት ማዕከል ያደረገ ተቋም ነው።',
        'features': [
            {'label': 'የአካዳሚክ ልህቀት', 'desc': 'ዓለም አቀፍ ደረጃዎችን የሚያሟላ ስርዓተ ትምህርት ማቅረብ'},
            {'label': 'የባህል ማንነት', 'desc': 'የኢትዮጵያን ቅርስ እንደ እድገት መሰረት ማክበር'},
            {'label': 'ለወደፊት ዝግጁ የሆኑ ክህሎቶች', 'desc': 'ቀጣዩን የሳይንቲስቶች እና መሪዎች ትውልድ ማሰልጠን'},
            {'label': 'ስነ-ምግባራዊ አመራር', 'desc': 'ስኬት ሁልጊዜ በጠንካራ የሞራል እሴቶች መመራቱን ማረጋገጥ'}
        ]
    },
    'community': {
        'subtitle': 'የአብዲ አዳማ ማህበረሰብ',
        'title': 'እሴቶቻችን',
        'desc': 'ጥንካሬያችን ህዝባችን ነው — ተማሪዎች፣ ወላጆች እና አስተማሪዎች የሚተባበሩበት ንቁ እና ዓላማ ያለው ስነ-ምህዳር።',
        'quote': '\"በአንድነት — እንደ ተማሪዎች፣ ወላጆች እና አስተማሪዎች — ትምህርት ቤት ብቻ አንገነባም፤ የኢትዮጵያን የወደፊት ዕጣ ፈንታ እንገነባለን።\"',
        'tabs': {
            'students': {'tab': 'ተማሪዎቻችን', 'title': 'ተማሪዎቻችን', 'subtitle': 'ለመማር የተነሳሱ፣ ለመምራት የተዘጋጁ', 'traits': ['በማወቅ ጉጉት የሚመሩ ስሜታዊ ተማሪዎች', 'ስነ-ምግባራዊ እና ጠንካራ የሞራል ባህሪ ያላቸው', 'ጠንካራ — ተግዳሮቶችን ወደ እድል የሚቀይሩ', 'በዓላማ የሚመሩ በራስ መተማመን ያላቸው ተግባባዮች', 'ልዩነትን የሚያከብሩ ተባባሪ የቡድን ተጫዋቾች', 'በድፍረት ፈጠራ ያላቸው — በየቀኑ ለልህቀት የሚጥሩ']},
            'parents': {'tab': 'ወላጆቻችን', 'title': 'ወላጆቻችን', 'subtitle': 'በትምህርት ጉዞ ውስጥ አጋሮች', 'traits': ['ዋጋ የተሰጣቸው እና የተሰሙ — የእርስዎ ግንዛቤ የእኛ የማዕዘን ድንጋይ ነው', 'ግልጽ እና መደበኛ በሆኑ ዝመናዎች መረጃ የሚያገኙ', 'ልጅዎ በዓለም አቀፍ ደረጃ ደረጃውን የጠበቀ አካባቢ ውስጥ መሆኑን የሚያምኑ', 'በትምህርት ቤት ህይወት ውስጥ እንደ ንቁ ተሳታፊዎች ተቀባይነት ያላቸው', 'በልጅዎ የትምህርት እድገት ውስጥ እውነተኛ አጋሮች']},
            'teachers': {'tab': 'መምህራኖቻችን', 'title': 'መምህራኖቻችን', 'subtitle': 'አማካሪዎች፣ አርአያዎች እና ባለራዕዮች', 'traits': ['በእሴቶች የሚመሩ በጥልቅ ርህራሄ እና ታማኝነት', 'ተለዋዋጭ እና ቀናተኛ — መማርን ተላላፊ የሚያደርጉ', 'ተራማጅ እና ፈጠራ ያላቸው በ21ኛው ክፍለ ዘመን ዘዴዎች', 'በጥልቅ የሚንከባከቡ — እምነት የሚጣልበት ግንኙነት የሚገነቡ', 'ትልቅ ዓላማ ያላቸው — ከልህቀት ባነሰ የማይረኩ']}
        }
    },
    'promise': {
        'subtitle': 'የእኛ ቃል ኪዳን',
        'title': 'ለእያንዳንዱ ወላጅ',
        'desc': 'ልጅዎን በአደራ ሲሰጡን፣ ትልቁን ሀብትዎን በእንክብካቤያችን ውስጥ ያስቀምጣሉ። ይህንን ሃላፊነት በጥልቅ አክብሮት እንቀበላለን።',
        'items': [
            {'title': 'እምነት እና ደህንነት', 'desc': 'እያንዳንዱ ልጅ የሚታይበት፣ የሚሰማበት እና ዋጋ የሚሰጠው አስተማማኝ፣ ደጋፊ መጠለያ።'},
            {'title': 'የ21ኛው ክፍለ ዘመን ትምህርት', 'desc': 'ትችታዊ አስተሳሰብ፣ ፈጠራ፣ ትብብር እና ግንኙነት — 4ቱ Cs።'},
            {'title': 'ግለሰብን ማክበር', 'desc': 'የእያንዳንዱን ተማሪ ልዩ ጥንካሬዎች እና የመማሪያ ዘይቤን የሚያከብሩ የተጣጣሙ አቀራረቦች።'},
            {'title': 'ግልጽ ግንኙነት', 'desc': 'ግልጽ እና መደበኛ ዝመናዎች በእያንዳንዱ ደረጃ እርስዎን እንዲያውቁ ያደርጋሉ።'},
            {'title': 'ሁለንተናዊ እድገት', 'desc': 'ከአካዳሚክ ድሎች ጎን ለጎን ማህበራዊ፣ ስሜታዊ እና አካላዊ ደህንነት።'},
            {'title': 'ከመደበኛ ትምህርት ውጭ ልህቀት', 'desc': 'ስፖርት፣ ስነ-ጥበብ፣ አመራር እና የማህበረሰብ አገልግሎት ሁለንተናዊ ግለሰቦችን ያፈራሉ።'}
        ]
    },
    'schoolLife': {
        'subtitle': 'የትምህርት ቤት ህይወት',
        'title': 'ከክፍል ውጭ',
        'uniform': {
            'title': 'የትምህርት ቤት የደንብ ልብስ',
            'desc': 'የደንብ ልብሳችን ከአለባበስ ህግ በላይ ነው — የጋራ ማንነታችንን፣ ከፍተኛ ደረጃችንን እና ለአካታችነት ያለንን ቁርጠኝነት ያንፀባርቃል። ተማሪዎች በዓላማ ሲለብሱ፣ በዓላማ ይማራሉ።',
            'items': [
                {'label': 'አንድነት እና እኩልነት', 'desc': 'ማህበራዊ ጫናዎችን ማለፍ፣ በጋራ እሴቶች ላይ ማተኮር'},
                {'label': 'ትኩረት', 'desc': 'ትኩረትን የሚከፋፍሉ ነገሮችን መቀነስ፣ የአካዳሚክ ስኬትን ከፍ ማድረግ'},
                {'label': 'ሙያዊነት', 'desc': 'ለወደፊቱ ዓለም ኩራትን እና ስነ-ስርዓትን ማስረፅ'},
                {'label': 'የኩራት ባጅ', 'desc': 'የታማኝነት እና የልህቀት አምባሳደሮች'}
            ]
        },
        'transport': {
            'title': 'የትምህርት ቤት ትራንስፖርት',
            'desc': 'ስኬታማ የትምህርት ቀን የሚጀምረው ከመጀመሪያው ደወል በፊት ነው። የእኛ ከፍተኛ የትራንስፖርት አገልግሎት ለእያንዳንዱ ተማሪ ደህንነት፣ ምቾት እና ሰዓት አክባሪነት ቅድሚያ ይሰጣል።',
            'items': [
                'የላቀ የደህንነት ባህሪያት እና የሰለጠኑ ሰራተኞች ያሉት ዘመናዊ መርከብ',
                'ተማሪዎች ታድሰው እና በሰዓቱ መድረሳቸውን የሚያረጋግጡ አስተማማኝ የጊዜ ሰሌዳዎች',
                'ለተለያዩ አካባቢዎች የሚያገለግሉ ስልታዊ መስመሮች',
                'ነፃነትን፣ ሰዓት አክባሪነትን እና ማህበራዊ ስነ-ምግባርን መገንባት'
            ]
        },
        'facilities': {
            'title': 'የእኛ መገልገያዎች',
            'items': [
                {'title': 'የእግር ኳስ ሜዳ', 'desc': 'ለስፖርት ትምህርት፣ ስልጠና እና ውድድሮች በሙያዊ የተያዘ ሜዳ'},
                {'title': 'የቅርጫት ኳስ ሜዳዎች', 'desc': 'ለክህሎት ግንባታ እና በቤቶች መካከል ለሚደረጉ ውድድሮች የዓመት-ሙሉ ሜዳዎች'},
                {'title': 'አረንጓዴ ቦታዎች', 'desc': 'ለቤት ውጭ ትምህርት እና ለማህበረሰብ ዝግጅቶች ሰፊ የሣር ሜዳዎች እና የአትክልት ስፍራዎች'}
            ]
        }
    },
    'team': {
        'subtitle': 'አመራር',
        'title': 'የእኛ ቡድን',
        'desc': 'ከአብዲ አዳማ ትምህርት ቤት ኔትወርክ ጀርባ ያሉ ቁርጠኛ መሪዎች።',
        'members': [
            {'name': 'አቶ ግርማ ለሚ', 'role': 'መስራች እና ባለቤት'},
            {'name': 'ወ/ሮ ትዕግስት አበራ', 'role': 'ዳይሬክተር — ቀበሌ 10'},
            {'name': 'አቶ ዳዊት መንግስቱ', 'role': 'ዳይሬክተር — ሞጎሮ'},
            {'name': 'ወ/ሮ ሃና ሰለሞን', 'role': 'ምክትል ዳይሬክተር — 180 መንደር'},
            {'name': 'አቶ ዮናስ በቀለ', 'role': 'ዳይሬክተር — አዋሽ'}
        ]
    }
}

om_sections = {
    'pillars': {
        'subtitle': 'Wanti Nu Adda Taasisu',
        'title': 'Utubaawwan Cimina Keenyaa Arfan',
        'desc': 'Mana Barumsaa Abdi Adaamaatti, nuti hin barsiisnu qofa; ni jijjiirra. Falaasamni barnoota keenyaa adda ta\'e utubaawwan ijoo afran irratti ijaarame.',
        'items': [
            {'title': 'Amanamummaa', 'desc': 'Wanta sirrii ta\'e yeroo hunda raawwachuu. Walqunnamtii hunda keessatti amanamummaa fi itti gaafatamummaa ni jajjabeessina. Amalli kan madaalamu yeroo namni tokkoyyuu isin hin arginetti wanta isin raawwattanini.'},
            {'title': 'Gaggeessummaa', 'desc': 'Dandeettii keessaa guddisuu. Barattoonni dandeettii isaanii akka baasan, sagalee isaanii akka argatan, ofitti amanamummaa akka ijaaratanii fi warra kaan akka kakaasan ni gargaarra.'},
            {'title': 'Milkaa\'ina', 'desc': 'Ilaalcha waliigalaa. Milkaa\'ina kan ibsinu kutannoo fi dandeettii guutuu nama tokkoo hordofuudhaan — qabxii GPA qofaan miti.'},
            {'title': 'Barumsa Umrii Guutuu', 'desc': 'Fedhii beekumsaa qabaachuu. Sirni barnootaa keenya inni qorannoorratti hundaa\'e sammuutti qabachuu bira darbee yaada kalaqaa fi uumuu ni jajjabeessa.'}
        ]
    },
    'vision': {
        'subtitle': 'Mul\'ata Keenya',
        'title': 'Kaayyoo Keenya',
        'desc': 'Muuxannoo barumsaa jaarraa 21ffaa sadarkaa duraa ta\'e, cimina barnootaa fi kaayyoo naamusaa walmadaalchisuun hawaasa keenya humneessuu. Interpariinaroota, kalaqtoota fi hayyoota Itoophiyaa boruu guddisuuf ni hojjenna — kalaqaan, uumuu fi amanamummaan akka gaggeessan isaan qopheessina.',
        'missionSubtitle': 'Ergaa Keenya',
        'missionDesc': 'Itoophiyaa keessatti ibsaa cimina barnootaa taanee dhaabbachuu. Manni Barumsaa Abdi Adaamaa dhaabbata barumsa irratti xiyyeeffate, kan aadaa, duudhaa fi aadaa Itoophiyaa keessatti hundee cimaa qabatee barnoota sadarkaa addunyaa kan ulaagaa biyyaalessaa caalu kennu dha.',
        'features': [
            {'label': 'Cimina Barnootaa', 'desc': 'Sirna barnootaa ulaagaa addunyaa guutu kennuu'},
            {'label': 'Eenyummaa Aadaa', 'desc': 'Dhaala Itoophiyaa akka bu\'uura guddinaatti kabajuu'},
            {'label': 'Dandeettiiwwan Egereef Qophaa\'an', 'desc': 'Dhaloota saayintistootaa fi gaggeessitootaa itti aanu leenjisuu'},
            {'label': 'Gaggeessummaa Naamusaa', 'desc': 'Milkaa\'inni yeroo hunda duudhaalee naamusaa cimaan akka gaggeeffamu mirkaneessuu'}
        ]
    },
    'community': {
        'subtitle': 'Hawaasa Abdi Adaamaa',
        'title': 'Duudhaalee Keenya',
        'desc': 'Ciminni keenya ummata keenya — sirna ikoo jiraataa fi kaayyoodhaan gaggeeffamu kan barattoonni, warrii fi barsiisonni itti tokkooman.',
        'quote': '\"Tokkummaadhaan — akka barattoota, warra fi barsiisotaatti — nuti mana barumsaa qofa hin ijaarru; egeree Itoophiyaa ni ijaarra.\"',
        'tabs': {
            'students': {'tab': 'Barattoota Keenya', 'title': 'Barattoota Keenya', 'subtitle': 'Barachuuf Kan Kaka\'an, Gaggeessuuf Kan Qophaa\'an', 'traits': ['Barattoota miira cimaa qaban kanneen fedhii beekumsaatiin oofaman', 'Naamusaa fi of-ilaaltota amala naamusaa cimaa qaban', 'Kutattoota — rakkoolee gara carraatti kan jijjiiran', 'Wal-qunnamtoota ofitti amanamummaa qaban kanneen kaayyoodhaan gaggeessan', 'Taphattoota garee waliin hojjetan kanneen adda addummaa kabajan', 'Kalaqtoota ija jabeeyyii — guyyuu ciminaaf kan tattaafatan']},
            'parents': {'tab': 'Warra Keenya', 'title': 'Warra Keenya', 'subtitle': 'Hiriyoota Imala Barnootaa Keessatti', 'traits': ['Kan kabajaman fi dhaga\'aman — hubannoon keessan bu\'uura keenya', 'Odeeffannoo ifa fi yeroo yeroon kennamuun kan beeksisaman', 'Mucaan keessan naannoo sadarkaa addunyaa keessa episodic keessa akka jiru kan amanan', 'Hirmoota dammaqoo jireenya mana barumsaa keessatti akka ta\'an kan simataman', 'Hiriyoota dhugaa guddina barnoota mucaa keessanii keessatti']},
            'teachers': {'tab': 'Barsiisota Keenya', 'title': 'Barsiisota Keenya', 'subtitle': 'Gorsitoota, Fakkeenyota, fi Mul\'attoota', 'traits': ['Duudhaadhaan kan gaggeeffaman, rimeessaa fi amanamummaa gadi fagoowwaliin', 'Dammaqoo fi miira cimaa qaban — barumsa akka nama harkisu kan taasisan', 'Tarkaanfatoota fi kalaqtoota maloota jaarraa 21ffaatiin', 'Gadi fageenyaan kan kunuunsan — hariiroo amantaa ijaaran', 'Hawaatiwwan — ciminaa gadiitti matumaa kan hin quufne']}
        }
    },
    'promise': {
        'subtitle': 'Waadaa Keenya',
        'title': 'Warragoota Hundaaf',
        'desc': 'Mucaa keessan nuuf kennuudhaan, qabeenya keessan isa guddaa eegumsa keenya jala keessu. Itti gaafatamummaa kana kabaja guddaan fudhanna.',
        'items': [
            {'title': 'Amantaa & Nageenya', 'desc': 'Naannoo nagaa fi deeggarsa qabu, bakka mucaan hundi itti argamu, dhaga\'amu fi kabajamu.'},
            {'title': 'Barumsa Jaarraa 21ffaa', 'desc': 'Yaada Qeeqaa, Kalaqa, Walta\'iinsa, fi Walqunnamtii — 4Cswwan.'},
            {'title': 'Dhuunfaa Kabajuu', 'desc': 'Tooftaalee adda addaa kanneen ciminaa fi akkaataa barumsaa mucaa hundaa kabajan.'},
            {'title': 'Walqunnamtii Ifa Ta\'e', 'desc': 'Odeeffannoo ifa fi yeroo yeroon kennamu kan sadarkaa hundatti isin beeksisu.'},
            {'title': 'Guddina Waliigalaa', 'desc': 'Nageenya hawaasummaa, miiraa fi qaamaa milkaa\'ina barnootaa cinaatti.'},
            {'title': 'Cimina Barnootaan Alaa', 'desc': 'Ispoortii, aartii, gaggeessummaa, fi tajaajila hawaasaa kanneen namoota guutuu ta\'an oomishan.'}
        ]
    },
    'schoolLife': {
        'subtitle': 'Jireenya Mana Barumsaa',
        'title': 'Kutaa Barnootaatiin Alatti',
        'uniform': {
            'title': 'Uffata Mana Barumsaa',
            'desc': 'Uffanni keenya seera uffannaa qofa miti — eenyummaa gamtaa keenya, sadarkaa olaanaa fi hirmaachisuuf kutannoo keenya calaqqisiisa. Barattoonni yeroo kaayyoodhaan uffatan, kaayyoodhaan baratu.',
            'items': [
                {'label': 'Tokkummaa & Walqixxummaa', 'desc': 'Dhiibbaa hawaasummaa bira darbuun, duudhaalee waliinii irratti xiyyeeffachuu'},
                {'label': 'Xiyyeeffannoo', 'desc': 'Yaada faffacaasuu xiqqeessuu, milkaa\'ina barnootaa guddisuu'},
                {'label': 'Ogummaa', 'desc': 'Addunyaa fuulduraaf boonsaa fi naamusaa barsiisuu'},
                {'label': 'Mallattoo Boonsaa', 'desc': 'Ambaasaaddaroota amanamummaa fi ciminaa'}
            ]
        },
        'transport': {
            'title': 'Geejjiba Mana Barumsaa',
            'desc': 'Guyyaan mana barumsaa milkaa\'aan bilbila jalqabaa dura eegala. Tajaajilli geejjibaa keenya inni duraa nageenya, mijaawummaa, fi yeroo kabajuu barataa hundaa dursa kenna.',
            'items': [
                'Konkolaattota ammayyaa kanneen amala nageenyaa olaanaa qabanii fi hojjettoota leenji\'an',
                'Sagantaalee amansiisaa barattoonni haara\'anii fi yeroon akka ga\'an mirkaneessan',
                'Sarboota tarsiimawaa bakkeewwan adda addaa tajaajilan',
                'Of-danda\'uu, yeroo kabajuu, fi naamusaa hawaasummaa ijaaruu'
            ]
        },
        'facilities': {
            'title': 'Tajaajiloota Keenya',
            'items': [
                {'title': 'Dirree Kubbaa Miilaa', 'desc': 'Dirree ogummaadhaan eegamu kan barumsa qaamaa, leenjii, fi dorgommiif oolu'},
                {'title': 'Dirree Kubbaa Kaachoo', 'desc': 'Dirree waggaa guutuu tajaajilu kan ijaarsa dandeettii fi dorgommii manoota gidduuf oolu'},
                {'title': 'Bakkeewwan Magariisa', 'desc': 'Margaa fi iddoo ashaakiltii bal\'aa barumsa alaa fi qophiiwwan hawaasaaf oolu'}
            ]
        }
    },
    'team': {
        'subtitle': 'Gaggeessummaa',
        'title': 'Garee Keenya',
        'desc': 'Gaggeessitoota kutatoo networkii Mana Barumsaa Abdi Adaamaa duuba jiran.',
        'members': [
            {'name': 'Obbo Girmaa Lammii', 'role': 'Hundeessaa fi Abbaa Qabeenyaa'},
            {'name': 'Aadde Tigisti Abbaraa', 'role': 'Daarektara — Kebele 10'},
            {'name': 'Obbo Daawit Mangistuu', 'role': 'Daarektara — Mogoro'},
            {'name': 'Aadde Haanaa Solomoon', 'role': 'Itti Aantuu Daarektaraa — Ganda 180'},
            {'name': 'Obbo Yonaas Baqqalaa', 'role': 'Daarektara — Awaash'}
        ]
    }
}

for lang, data in [('en', en_sections), ('am', am_sections), ('om', om_sections)]:
    path = os.path.join(locales_dir, f"{lang}.json")
    if os.path.exists(path):
        with open(path, 'r', encoding='utf-8') as f:
            content = json.load(f)
        if 'landing' not in content:
            content['landing'] = {}
        content['landing']['sections'] = data
        with open(path, 'w', encoding='utf-8') as f:
            json.dump(content, f, ensure_ascii=False, indent=2)

print('Translation files updated successfully.')
