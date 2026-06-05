import json
import os

locales_dir = r'z:\AbdiAdama\fix\abdi-adama-frontend\src\locales'

translations = {
    'en': {'changePassword': 'Change Password', 'signOut': 'Sign Out'},
    'am': {'changePassword': 'የይለፍ ቃል ቀይር', 'signOut': 'ውጣ'},
    'om': {'changePassword': 'Iccitii Jijjiiri', 'signOut': 'Ba\'i'}
}

for lang, val in translations.items():
    path = os.path.join(locales_dir, f"{lang}.json")
    if os.path.exists(path):
        with open(path, 'r', encoding='utf-8') as f:
            content = json.load(f)
        if 'header' not in content:
            content['header'] = {}
        content['header']['changePassword'] = val['changePassword']
        content['header']['signOut'] = val['signOut']
        with open(path, 'w', encoding='utf-8') as f:
            json.dump(content, f, ensure_ascii=False, indent=2)

print('Updated header successfully.')
