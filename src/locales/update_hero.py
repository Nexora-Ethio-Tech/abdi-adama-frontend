import json
import os

locales_dir = r'z:\AbdiAdama\fix\abdi-adama-frontend\src\locales'

translations = {
    'en': {
        'admissionClosed': 'Admission Closed',
        'studentQuote': '"Abdi Adama School gave me the chance to discover my potential."',
        'studentAuthor': '— Firdos Musa, Top Scorer'
    },
    'am': {
        'admissionClosed': 'ምዝገባ ተዘግቷል',
        'studentQuote': '"አብዲ አዳማ ትምህርት ቤት ሙሉ አቅሜን እንዳውቅ እድል ሰጥቶኛል።"',
        'studentAuthor': '— ፊርዶስ ሙሳ፣ ከፍተኛ ውጤት ያመጣች'
    },
    'om': {
        'admissionClosed': 'Galmeen Cufameera',
        'studentQuote': '"Manni Barumsaa Abdi Adaamaa dandeettii koo guutuu akkan hubadhu carraa naaf kenneera."',
        'studentAuthor': '— Firdoos Muusaa, Qabxii Olaanaa Kan Fide'
    }
}

for lang, vals in translations.items():
    path = os.path.join(locales_dir, f"{lang}.json")
    if os.path.exists(path):
        with open(path, 'r', encoding='utf-8') as f:
            content = json.load(f)
        if 'landing' in content:
            content['landing']['admissionClosed'] = vals['admissionClosed']
            content['landing']['studentQuote'] = vals['studentQuote']
            content['landing']['studentAuthor'] = vals['studentAuthor']
        with open(path, 'w', encoding='utf-8') as f:
            json.dump(content, f, ensure_ascii=False, indent=2)

print('Updated hero translations successfully.')
