#!/usr/bin/env python3
"""Pawplay stage 22 — გამოშვების სკრიპტი.
გამოყენება (გაუშვი pawplay_demo საქაღალდეში, სასურველია ასლზე):
  python release.py --domain https://pawplay.example --email me@example.com
  python release.py --domain https://pawplay.example --email me@example.com --selfhost-fonts
  python release.py --check          # მხოლოდ შემოწმება, არაფერს ცვლის
"""
import argparse, re, sys, os, io

def rd(p): return io.open(p, encoding='utf8').read()
def wr(p, s): io.open(p, 'w', encoding='utf8', newline='').write(s)

FONT_LINK = re.compile(r'<link href="https://fonts\.googleapis\.com/[^"]*"[^>]*>')
PRECONNECT = re.compile(r'<link rel="preconnect" href="https://fonts\.g[a-z]+\.com"(?: crossorigin)?>')
PLACEHOLDER = '[ჩაწერე შენი ელფოსტა]'
OLD_FONT_SENTENCE = ('ფონტების ჩასატვირთად საიტი იყენებს Google Fonts-ს. ამ დროს შენი ბრაუზერი უკავშირდება '
                     'Google-ის სერვერებს და Google-მა შეიძლება დაინახოს შენი IP მისამართი.')
NEW_FONT_SENTENCE = ('ფონტები იტვირთება ამავე საიტის სერვერიდან და ამ მიზნით მესამე მხარესთან კავშირი არ ხდება. '
                     'ონლაინ რეჟიმში გამოიყენება Firebase (იხ. ქვემოთ).')

def check():
    bad = 0
    for f in ('privacy.html', 'terms.html'):
        if PLACEHOLDER in rd(f): print('✗', f, ': ელფოსტა ჯერ ჩაუწერელია'); bad += 1
    idx = rd('index.html')
    for k in ('og:url', 'rel="canonical"'):
        if k not in idx: print('✗ index.html:', k, 'არ არის'); bad += 1
    if re.search(r'property="og:image" content="(?!https?://)', idx): print('✗ og:image ფარდობითია — უნდა იყოს აბსოლუტური https URL'); bad += 1
    for f in ('index.html', 'privacy.html', 'terms.html'):
        if 'fonts.googleapis.com' in rd(f): print('! ', f, ': ჯერ კიდევ Google Fonts-ს იყენებს'); 
    if 'PAWPLAY_FIREBASE=null' in rd('config.js').replace(' ', ''): print('! config.js: ონლაინ რეჟიმი გამორთულია (Firebase კონფიგი ცარიელია)')
    print('OK' if not bad else f'{bad} პრობლემა'); return bad

def main():
    a = argparse.ArgumentParser()
    a.add_argument('--domain'); a.add_argument('--email'); a.add_argument('--selfhost-fonts', action='store_true'); a.add_argument('--check', action='store_true')
    o = a.parse_args()
    if o.check: sys.exit(1 if check() else 0)
    if not (o.domain and o.email): a.error('საჭიროა --domain და --email')
    d = o.domain.rstrip('/')
    if not d.startswith('https://'): sys.exit('domain უნდა იწყებოდეს https://-ით')
    if not re.match(r'^[^@\s]+@[^@\s]+\.[^@\s]+$', o.email): sys.exit('ელფოსტა არასწორია')

    # 1. ელფოსტა
    for f in ('privacy.html', 'terms.html'):
        t = rd(f); wr(f, t.replace(PLACEHOLDER, o.email))
    # 2. og:url, canonical, აბსოლუტური og:image / twitter:image
    t = rd('index.html')
    t = re.sub(r'<meta property="og:url"[^>]*>|<link rel="canonical"[^>]*>', '', t)
    t = re.sub(r'(<meta property="og:image" content=")[^"]*(")', r'\g<1>%s/og.png\2' % d, t, count=1)
    add = '<meta property="og:url" content="%s/"><link rel="canonical" href="%s/">' % (d, d)
    if 'name="twitter:image"' not in t: add += '<meta name="twitter:image" content="%s/og.png">' % d
    t = t.replace('<meta property="og:type" content="website">', '<meta property="og:type" content="website">' + add, 1)
    wr('index.html', t)
    # 3. ფონტები
    files = ['fonts.css'] + ['fonts/' + n for n in ('Manrope-Variable.woff2', 'NotoSansGeorgian-Variable.woff2')]
    if o.selfhost_fonts:
        miss = [x for x in files if not os.path.exists(x)]
        if miss: sys.exit('ვერ ვპოულობ: ' + ', '.join(miss) + ' — ფონტები ჯერ ჩაწერე fonts/-ში (იხ. RELEASE.md)')
        for f in ('index.html', 'privacy.html', 'terms.html'):
            t = rd(f); t = PRECONNECT.sub('', t)
            t = FONT_LINK.sub('<link rel="stylesheet" href="fonts.css">' if 'fonts.css' not in t else '', t)
            wr(f, t)
        p = rd('privacy.html'); wr('privacy.html', p.replace(OLD_FONT_SENTENCE, NEW_FONT_SENTENCE))
        s = rd('sw.js')
        if 'fonts.css' not in s:
            s = s.replace("'privacy.html'", "'fonts.css','fonts/Manrope-Variable.woff2','fonts/NotoSansGeorgian-Variable.woff2','privacy.html'", 1)
        wr('sw.js', s)
    # 4. SW ვერსია
    s = rd('sw.js'); m = re.search(r"pawplay-v(\d+)", s)
    if m: wr('sw.js', s.replace(m.group(0), 'pawplay-v%d' % (int(m.group(1)) + 1), 1))
    # 5. robots.txt — sitemap არ გვაქვს, მხოლოდ დომენი
    print('მზადაა.'); check()

if __name__ == '__main__': main()
