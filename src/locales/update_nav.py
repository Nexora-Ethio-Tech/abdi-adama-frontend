import json
import os

locales_dir = r'z:\AbdiAdama\fix\abdi-adama-frontend\src\locales'

translations = {
    'en': 'School Life',
    'am': 'የትምህርት ቤት ህይወት',
    'om': 'Jireenya Mana Barumsaa'
}

for lang, val in translations.items():
    path = os.path.join(locales_dir, f"{lang}.json")
    if os.path.exists(path):
        with open(path, 'r', encoding='utf-8') as f:
            content = json.load(f)
        if 'nav' in content:
            content['nav']['schoolLife'] = val
        with open(path, 'w', encoding='utf-8') as f:
            json.dump(content, f, ensure_ascii=False, indent=2)

print('Updated nav.schoolLife successfully.')
