import json
import os

locales_dir = r'z:\AbdiAdama\fix\abdi-adama-frontend\src\locales'

translations = {
    'en': {
        'schoolTourTitle': 'SCHOOL TOUR',
        'schoolTourDesc': 'Take a look at our campus and facilities'
    },
    'am': {
        'schoolTourTitle': 'የትምህርት ቤቱ ጉብኝት',
        'schoolTourDesc': 'ግቢያችንን እና መገልገያዎቻችንን ይመልከቱ'
    },
    'om': {
        'schoolTourTitle': 'DAAWACHAA MANA BARUMSAA',
        'schoolTourDesc': 'Mooraa fi tajaajiloota keenya daawwadhaa'
    }
}

for lang, vals in translations.items():
    path = os.path.join(locales_dir, f"{lang}.json")
    if os.path.exists(path):
        with open(path, 'r', encoding='utf-8') as f:
            content = json.load(f)
        if 'landing' in content and 'media' in content['landing']:
            content['landing']['media']['schoolTourTitle'] = vals['schoolTourTitle']
            content['landing']['media']['schoolTourDesc'] = vals['schoolTourDesc']
        with open(path, 'w', encoding='utf-8') as f:
            json.dump(content, f, ensure_ascii=False, indent=2)

print('Updated school tour translations successfully.')
