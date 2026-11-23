PAWPLAY — responsive front-end concept demo

Open index.html in a modern browser. Internet connection is recommended for Google Fonts; the site otherwise uses local HTML/CSS/JS.

Included:
- Responsive landing page
- Seven distinct question categories
- Game setup modal (category, question count, player names)
- Demo question flow (front-end only)
- Custom question creation saved in browser localStorage
- Mobile responsive layout

Important limitations:
This is a front-end prototype, not a production multiplayer website. Real accounts, invitations, simultaneous two-player sessions, server-side question bank, moderation, persistent user history, live spectators, chat, and secure answer comparison require a backend and database. The current built-in question arrays are illustrative samples, not the promised 100+ reviewed questions per category. The production version should expand each category to 100+ unique reviewed questions and use a server-side matching dictionary/normalization rules. The demo intentionally does not claim to detect truth; it only illustrates how answer matching can work.

--- Stage notes ---
Before publishing: (1) put your real e-mail into privacy.html and terms.html (search "ჩაწერე შენი ელფოსტა"); (2) have the legal pages reviewed by a lawyer; (3) optional: self-host Manrope and Noto Sans Georgian (download from fonts.google.com, add @font-face in style.css, remove the Google Fonts <link> tags and update privacy.html).

--- Online mode (Firebase) ---
1. console.firebase.google.com -> new project -> add Web app -> copy the config.
2. Build -> Realtime Database -> create (start in test mode, then set rules below).
3. Paste the config into config.js (window.PAWPLAY_FIREBASE={...}). Online buttons then appear in the "create game" window.
4. Rules (minimum): {"rules":{"rooms":{"$room":{".read":true,".write":true}}}}  -- this is open; tighten before heavy use.
5. Update the FAQ in index.html ("ონლაინ თამაში: ჯერ არა") and test with two real devices.
Known limits: players can technically read each other's hidden answers via dev tools; old rooms are not deleted automatically.


--- Stage 13 (additions only; nothing earlier was removed) ---
New files: extras.js, extras.css, questions_extra.js, manifest.json, sw.js, icon-192.png, icon-512.png, og.png, robots.txt, firebase-rules.json.
index.html got only extra <link>/<meta>/<script> lines; app.js, style.css and questions.js are untouched.
What was added:
- Categories 6 and 7 now have 100+ questions each (questions_extra.js).
- Leaving a running game (outside click, X, Esc) asks for confirmation first.
- Questions of the form "A თუ B?" show two tap buttons (free text still possible).
- Result screen: per-question recap list, share text with the site link, downloadable/shareable result image.
- Custom questions: export/import as a JSON file, length limits.
- Modals: focus is kept inside and returned afterwards; labelled dialogs; polite toast announcements.
- FAQ text updates itself (question counts; online mode wording when Firebase is configured).
- Installable app (manifest + service worker; works only over https or localhost) with an offline copy.
- OG/Twitter meta tags. TODO: og:image must be an absolute URL after you know your domain, e.g. https://YOURSITE/og.png. Also add og:url.
- firebase-rules.json: stricter database rules (room-code format, field validation, 24-hour expiry, no room listing). Paste them in Firebase console -> Realtime Database -> Rules and test in the Rules Playground. They are untested against a live project. Hidden answers are still readable by a determined player; real secrecy needs a backend.
Still to do by you: real e-mail in privacy.html and terms.html, lawyer review, hosting over https.


--- Stage 14 (additions only) ---
New files: stage14.js, stage14.css. Edited minimally: index.html (one <link>, one <script>), sw.js (cache list + version), privacy.html (two paragraphs; one sentence about names/answers made precise because the history now stores names and scores locally).
- 14.1 Even question counts for the normal modes (fair number of guesses); the duel category is unchanged.
- 14.2 Optional answer timer (20/30/45 s). When time runs out an empty answer is skipped (or sent as "time is up" when skipping is not possible).
- 14.3 Result history on this device (last 100 games), "this pair" score line on the result screen, a "your results" section on the main page, clear button. Can be switched off in the game window.
- 14.4 Sound and vibration (correct, wrong, win, last 3 seconds of the timer); toggle in the game window and a speaker button in the running game.


--- Stage 15 (additions only) ---
New files: stage15.js, stage15.css. Edited minimally: index.html (one <link>, one <script>), sw.js (cache list + version), stage14.js (one line: the timer key now also includes the swap count, so the timer restarts on a new question).
- 15.1 "🔄 სხვა კითხვა" button: while the answering player has not answered yet, the current question can be replaced by another unused question from the same category (custom questions included). Max 3 swaps per game; the button shows how many are left and disappears when none remain. The replaced question can return later only after all unused ones. The result recap and history use the question actually played.
Not yet: online (Firebase) mode - the room's questions are fixed when it is created.


--- Stage 16 (additions only) ---
New file: stage16.js. Edited minimally: index.html (one <script>), sw.js (cache list + version).
- 16.1 "🔁 რევანში" on the result screen (one-device mode): starts a new game with the same category, question count and players; the players swap places so the other one answers first.
- 16.2 Player names are remembered on this device and pre-filled in the game window. Only when "save results on this device" is on; clearing the history also forgets the names.
TODO (privacy.html): add a short sentence that last player names are stored locally too.
privacy.html: one sentence added about remembered names (done).


--- Stage 17 (additions only) ---
New file: stage17.js. Edited minimally: index.html (one <script>), sw.js (cache list + version).
- 17.1 New "შერეული" (mixed) category: random questions from all normal categories (duel excluded, custom questions included), no duplicates. Game length options are capped at 50. Works in one-device and online mode, with swap-question and rematch. It cannot be chosen for adding custom questions (they belong to a real category).


--- Stage 18 (additions only) ---
New file: stage18.js. Edited minimally: index.html (one <script>), sw.js (cache list + version), stage14.js (online timer key now includes the current question text, so the timer restarts after a swap), extras.js (one line exposing a reset for the end-of-game recap list).
- 18.1 \"🔄 სხვა კითხვა\" in online rooms: only the player who is answering, before sending the answer; max 3 per player per game. The room does not store its category, so the pool is inferred from the room's questions (one category -> that category, several -> mixed, duel flag -> duel). If it cannot be inferred, the button is not shown.
- 18.2 \"🔁 რევანში ამავე ოთახში\" on the online result screen: either player can start it (second tap confirms); the same room is reset with new questions, same players, same number of questions. Players do NOT swap places online (the seat order is fixed in the room).
- firebase-rules.json is unchanged: only existing fields are written. Tested against an in-memory Firebase stand-in, NOT against a real project - please test with two real devices.


--- Stage 19 (additions only) ---
New files: stage19.js, stage19.css. Edited minimally: index.html (one <link>, one <script>), sw.js (cache list + version), stage14.js (timer also waits while window.pawPaused), extras.js (one line exposing a way to remove the last recap entry).
- 19.1 "↩" button (one-device mode): takes back one step (typed answer, hand-over, guess, or a scored question including its point). Hidden answers are never brought back onto the screen. Not available on the result screen or in online rooms.
- 19.2 "⏸" button (one-device mode): stops the answer timer and covers the question; "▶ გაგრძელება" continues.
- Not done yet (moved to stage 20): favourite questions.


--- Stage 20 (additions only) ---
New files: stage20.js, stage20.css. Edited minimally: index.html (one <link>, one <script>), sw.js (cache list + version), stage18.js (one line: a room played from favourites is recognised), privacy.html (one sentence about favourites).
- 20.1 "☆/⭐" button in the game window (one-device and online): add / remove the current question to favourites. Kept on this device (localStorage, max 100). Duel questions cannot be starred.
- 20.2 New category "⭐ ფავორიტები": play only with your starred questions (needs at least 2). Works with timer, swap, undo, rematch, online.
- 20.3 Favourites list with delete buttons in the "custom question" window.
Note: in online rooms every player has their own favourites; the star saves the question on the device that taps it.


--- Stage 21 (quality pass; additions only) ---
New file: stage21.css. Edited minimally: index.html (one <link>), sw.js (cache list + version).
Checked and found OK (no change needed): question bank (no exact or normalized duplicates across 7 categories; the only near-duplicate pair has opposite meaning; every non-duel category is written in first person; the 108 entries without "?" are duel tasks; no questions asking for personal data, money/health/politics/religion/intimate topics); no duplicate element ids; every button/input has an accessible name; page has lang="ka"; no real horizontal scrolling (the wide decorative glow/orbit shapes are clipped).
Fixed in stage21.css:
- Phones (<=600px): the game window toolbar (star, pause, undo, sound, close) sits in its own row and no longer covers the "PAWPLAY" label on 320px screens; tap targets are 38px (menu button 44px); action buttons wrap instead of breaking "შემდეგი →" into two lines.
- 20-character names and a 150-character answer without spaces no longer make the game/result window scroll sideways.
- No text below 11px any more (tags, counters, notes, footer).
- Visible green focus ring for keyboard users.
Known/unchanged: tested in Chromium only (no real iPhone/Safari here); fonts still load from Google Fonts (see stage 22).


--- Stage 22 (release preparation; additions only) ---
New files: fonts.css, fonts/ (empty - put the font files here), release.py, RELEASE.md. No existing file was changed.
release.py (run it in this folder, preferably on a copy): writes your e-mail into privacy.html/terms.html, adds og:url + canonical, makes og:image/twitter:image absolute, optionally switches to self-hosted fonts (--selfhost-fonts: replaces the Google Fonts links with fonts.css, updates the privacy sentence, adds the font files to sw.js) and bumps the service-worker version. "python release.py --check" only reports what is still missing. Tested on a copy with dummy font files; NOT tested with real fonts, a real domain or real devices.
Things only you can do: lawyer review, https hosting, Firebase project + config.js + rules, two-device test. See RELEASE.md.


--- Stage 23 (additions only) ---
New files: stage23.js, stage23.css. Edited minimally: index.html (one <link>, one <script>), sw.js (cache list + version v22).
- 23.1 Own question count: a number field under the count list. Limits: min 2, max = number of questions in the chosen category (mixed: 50); an odd number is lowered by one (fair turns) except in the duel category. Out-of-range values are corrected with a short hint.
- 23.2 Own timer: a number field under the timer list, 5-300 seconds; remembered on this device.
- Works in one-device and online mode (the typed number is put into the existing <select> as an extra option, so earlier scripts are untouched). Tested in Chromium (desktop-sized phone viewport) only; not tested online or on real devices.
Note: release.py raises the service-worker version again when run, which is fine.


--- Stage 24 (additions only) ---
New files: stage24.js, stage24.css. Edited minimally: index.html (one <link>, one <script>), sw.js (cache list + version v23), stage15.js (swap limit now 3 + G.swx; exposes window.pawMoreSwapsLocal), stage18.js (swap limit now 3 + extra[room]; exposes window.pawMoreSwapsOnline; extra reset on room rematch).
- 24.1 "＋" button next to "🔄 სხვა კითხვა": each tap adds one more allowed swap. No fixed upper limit; it is offered only while unused questions remain in the pool. When the 3 swaps are used up, a wide "＋ კიდევ ერთი შეცვლა" button is shown instead. The answer timer is NOT restarted by "＋" (a real swap still restarts it, as before). A half-typed answer is kept.
- Tested in Chromium for one-device mode. The online path (stage18 hook) is NOT tested against a real Firebase room - test it with two devices.


--- Stage 25 (additions only) ---
New files: stage25.js, stage25.css. Edited minimally: index.html (one <link>, one <script>), sw.js (cache list + version v24), app.js (one expression: who answers is now window.pawA(G) when available, else the old G.i%2), extras.js (same one expression, for the recap).
- 25.1 "კითხვების თანმიმდევრობა" in the game window (one-device mode):
  * მონაცვლეობით (default, old behaviour);
  * მხოლოდ P1 ეკითხება · P2 პასუხობს  /  მხოლოდ P2 ეკითხება · P1 პასუხობს (the one who ASKS is the one who guesses);
  * საკუთარი თანმიმდევრობა: type how many questions in a row each player answers (1-20) and who starts, e.g. 2 + 3 = A answers 2, B answers 3, repeat. A live preview shows the order. The choice is remembered on this device.
- Online rooms keep strict alternation (the room does not store a pattern yet); a note says so in the window.


--- Stage 26 (small change) ---
Edited: stage14.js (timerHook: three lines), sw.js (version v25).
- 26.1 The answer timer now runs only for the player who GUESSES. The player who answers about himself/herself has no timer (one-device and online). In the duel category the same rule applies: the first player's task has no timer, the second player's turn does.


--- Stage 27 (text only) ---
index.html: the sample names "გიორგი" replaced by "თორნიკე" (result example + name placeholder). sw.js version v26.


--- Stage 28 (small change) ---
app.js (createGame: one check), sw.js v27. One-device game cannot start until both names are typed, so the placeholders "მოთამაშე 1/2" never appear in the game; the typed names are shown everywhere. Online mode unchanged.


--- Stage 29 (text/emoji only) ---
index.html: hero cards now show people (👨 თორნიკე, 👩 ანა) instead of the dog/cat (Max/Luna); the three small avatars under the button show three ages (👦 child, 👩 adult, 👴 elder). sw.js v28. The paw brand logo and the og.png image are unchanged.


--- Stage 30 (additions only) ---
New files: stage30.js, stage30.css. Edited minimally: index.html (one <link>, one <script>), sw.js (cache list + v29).
- 30.1 Button "👥 2-ზე მეტი ადამიანის თამაში" in the game window opens a group window: category cards, 3 or 4 players (free), names, one chosen ANSWERER, number of questions.
  Round: the answerer writes a hidden answer; each other player in turn writes a hidden guess; then the answerer confirms for every guesser ✓/✗ (the system's match is preselected). Each correct guess = 1 point; the answerer scores nothing; result screen with ranking, ties and share text.
- 30.2 5, 6, 7, 8 players are shown as locked (🔒, paid). NO payment system exists: tapping them only shows an information box. Real payments need a payment provider + a server.
- Not included in the group game: answer timer, undo/pause, swap-question, favourites star, history, online rooms (one device only). The category list has no duel category.


--- Stage 31 ---
index.html: the hero art (CSS cards, orbits, VS, tags) replaced by one picture, hero-art.webp (converted from your PNG, 46 KB). New stage31.css. sw.js v30. The old card styles stay in style.css, unused.


--- Stage 32 (group window gets the 2-player settings) ---
Edited: stage30.js (rewritten), stage14.js (renderHist shows group entries; exposes window.pawRenderHist), sw.js v31.
The group window now has the same settings as the 2-player window: all categories (incl. duel "გამოწვევები და დავალებები", mixed, favourites), question count + own count (2..max), timer + own seconds (5-300; shared with the 2-player setting; only for the guessers), sound/vibration, save results, and question order:
  * one fixed answerer for the whole game (choose who);
  * rotating: the answerer changes every question (everybody in turn, starting with the chosen player);
  * own order: the answerer changes every N questions (1-20).
Duel category in a group: everybody answers in turn (hidden; the timer runs for all but the first player of a question), then the group taps 🏆 for the winner of that question or "tie".
Results of group games are saved in the same history list (when the switch is on) and shown as "ჯგუფი".


--- Stage 33 ---
index.html: the 2nd and 3rd small avatars are now the faces of თორნიკე and ანა (avatar-tornike.webp, avatar-ana.webp, cropped from the hero picture); the first stays 👦. stage33.css, sw.js v32.


--- Stage 34 (text only) ---
index.html: hero eyebrow + lead, proof line, meta/og descriptions, stats strip (2–4), how-it-works texts, first FAQ answer and the second-name label now talk about 2 or more players and friends / couples / groups. sw.js v33.


--- Stage 35 (Google sign-in + sync; additions only) ---
New files: stage35.js, stage35.css. Edited: index.html (css/script links, stats "09", FAQ answer about stored data), app.js (loadFB no longer loads/initialises Firebase twice), sw.js v34, firebase-rules.json (users/{uid}), privacy.html, terms.html, manifest.json (texts).
- Works only when config.js has a full Firebase config. In Firebase console: Authentication -> Sign-in method -> Google -> Enable; Authorized domains -> add your domain; paste the new firebase-rules.json.
- "Google-ით შესვლა" button in the top bar; signed in: name + menu (sign out, delete account).
- Favourites, custom questions and result history sync through users/{uid}/data. First sign-in on a device merges (nothing lost); later cloud wins when newer. Another account on the same device never gets this device's data mixed in.
- users/{uid}/plan can only be written from the Firebase console / admin (clients can read it): window.pawUser.plan is "free" by default. NO payment exists; the 5-8 player locks are unchanged.
- Online rooms are untouched (still open to anyone with the code). NOT tested against a real Firebase project / real Google login.


--- Stage 38 (game name / profile; additions only) ---
New files: stage38.js, stage38.css. Edited: stage35.js (fires 'pawauth' event; account deletion also removes users/{uid}/profile), app.js (joiner gets " (2)" if the host has the identical name), firebase-rules.json (users/{uid}/profile), index.html, sw.js v37, privacy.html.
- Signed-in players choose a game name (max 18) + optional tag/initials (max 8), shown as "Name (tag)". Change any time: account menu -> "სახელის შეცვლა". First sign-in without a profile opens the picker automatically.
- Online rooms (create/join) always use the profile name. One-device mode: the name only pre-fills the first field.
- Uniqueness is NOT enforced (no backend); tags are for telling same-named players apart.
- IMPORTANT: paste the new firebase-rules.json into Firebase console -> Realtime Database -> Rules and press Publish, otherwise saving a profile is rejected.

--- Stage 39 (online room settings; additions only) ---
New files: stage39.js, stage39.css. Edited: app.js (startOnline uses the chosen settings; drawOnline asks pawAOn who answers), stage14.js (timer comes from the room), stage18.js (swap/rematch follow the room's categories and order), extras.js (recap), firebase-rules.json (room fields tm, cs, ord), index.html, sw.js v38.
- "ოთახის შექმნა" now opens a settings window BEFORE the code appears: several categories at once (duel and favourites are separate modes), number of questions (own number allowed), who answers (alternate / random / only me / only the friend) and the timer (own seconds allowed).
- The host's choices are saved in the room (tm = timer seconds, cs = category list, ord = who answers each question), so both players get the same timer and order.
- IMPORTANT: paste the new firebase-rules.json into Firebase console -> Realtime Database -> Rules and press Publish, otherwise creating a room is rejected.
- Not tested in a real browser or against a live Firebase project - please test with two devices.
