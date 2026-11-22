# Pawplay — გამოშვების ჩამონათვალი (Stage 22)

## 1. ფონტები საკუთარ სერვერზე
1. fonts.google.com → **Manrope** და **Noto Sans Georgian** → Download (variable TTF).
2. გადააკეთე woff2-ად: `pip install fonttools brotli` და შემდეგ
   `fonttools ttLib.woff2 compress Manrope[wght].ttf` (იგივე მეორე ფონტზე).
3. ჩააგდე `fonts/`-ში ზუსტად ამ სახელებით:
   `Manrope-Variable.woff2`, `NotoSansGeorgian-Variable.woff2`.
4. გაუშვი `release.py --selfhost-fonts` (ქვემოთ). შემდეგ გახსენი საიტი DevTools → Network-ით: `fonts.googleapis.com`-ზე მოთხოვნა აღარ უნდა იყოს და ქართული ტექსტი უნდა გამოჩნდეს.

## 2. ელფოსტა, დომენი, og:url
```
python release.py --domain https://შენი-დომენი --email შენი@ელფოსტა --selfhost-fonts
python release.py --check
```
ჯერ ასლზე გაუშვი. დომენი უნდა იყოს სრული https მისამართი, ბოლოში `/`-ის გარეშე.

## 3. იურისტი
privacy.html და terms.html იურისტს მიეცი. კონკრეტულად აჩვენე: localStorage-ში შენახული მონაცემები (სახელები, ისტორია, ფავორიტები), Firebase-ში 24 საათამდე შენახული ონლაინ ოთახის მონაცემები და ის, რომ ონლაინ რეჟიმში პასუხები ტექნიკურად წაკითხვადია. ტექსტი შემდეგ შეცვალე და „განახლებულია“ თარიღი განაახლე.

## 4. https ჰოსტინგი
სტატიკური ჰოსტინგი ნებისმიერი (Netlify, Cloudflare Pages, GitHub Pages, Firebase Hosting). საჭიროა https, წინააღმდეგ შემთხვევაში service worker და „დააყენე აპად“ არ იმუშავებს.

## 5. ონლაინ რეჟიმი და ორი მოწყობილობა
1. Firebase პროექტი → Web app → კონფიგი ჩასვი `config.js`-ში.
2. Realtime Database → Rules → ჩასვი `firebase-rules.json` (Rules Playground-ში ჯერ გატესტე; რეალურ პროექტზე არ შემოწმებულა).
3. Firebase Authentication/Authorized domains თუ გამოიყენებ — დაამატე შენი დომენი.
4. გატესტე ორ რეალურ მოწყობილობაზე (სასურველია iPhone/Safari + Android/Chrome, სხვადასხვა ქსელი):
   - ოთახის შექმნა და კოდით შესვლა
   - პასუხი → გამოცნობა → გამოვლენა, ორივე მხარეს
   - „სხვა კითხვა“ და „რევანში ამავე ოთახში“
   - ქსელის გაწყვეტა თამაშის შუაში და დაბრუნება
   - ორი ერთნაირი სახელი, ძალიან გრძელი სახელი/პასუხი
   - აპად დაყენება და ოფლაინში გახსნა
5. გამოშვების შემდეგ ბრაუზერში ერთხელ გააკეთე hard refresh, რომ service worker-მა ახალი ვერსია აიღოს.
