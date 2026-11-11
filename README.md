# Orarsfnicolae

Build a mobile-first timetable web app (PWA) for school students. Interface languages: Romanian and English only.



## Design language

Minimal, Apple-style "morphed glass":

- Soft gradient background (light: #EEF0F7 → #DFE6F5, dark: #16161C → #0B0B10).

- Glass cards: semi-transparent white (light 70% / dark 12%), 1px white border (light 90% / dark 16%), backdrop-blur, 24px radius, very soft shadow.

- Capsule (pill) elements for chips, tabs and buttons. Primary accent #0A84FF.

- Font: Inter. Large bold titles, generous spacing, subtle animations.

- Each subject gets a small colored dot; the same subject name always gets the same color from this palette: #4F7CFF, #F2555F, #2FBF7A, #9B6BFF, #FF9A3D, #14B8A6, #F5B700, #EC5CB8.

- Light/dark mode follows the system automatically, with a manual toggle (Auto / Light / Dark).



## Languages

- Auto-detect: Romanian if the browser language is "ro", otherwise English. Add a RO/EN switch in Settings.

- Translate all UI text, including day names (Luni/Monday … Vineri/Friday). Subject names are user data and are never translated.



## Screens (bottom tab bar with 3 capsule tabs)



### 1. Today ("Azi" / "Today") — widget-style home

- Top capsule with the school name and class name (e.g. "Școala Gimnazială Sfântul Nicolae Nr. 175 · V-A").

- A large glass "Now" card that updates every 30 seconds:

  - During a lesson: "Acum / Now: <subject>" + minutes left + progress bar + "Urmează / Next: <subject>".

  - During a break: "Pauză / Break" + minutes until the next lesson.

  - Before school: "Începe la / Starts at HH:MM" + first subject + countdown.

  - After school and on weekends: show the next school day's lessons ("Mâine / Tomorrow" or the day name).

- Below: today's lessons as a list (colored dot, time, subject); the current one is highlighted, past ones are dimmed.



### 2. Week ("Săptămâna" / "Week")

- A compact 5-column grid (Mon–Fri) like a home-screen widget: day name + start time at the top of each column, lessons as glass pills with a colored dot and a short subject name.

- Today's column is highlighted with an accent border.



### 3. Edit ("Editează" / "Edit")

- Fields: school name, class name, lesson length in minutes (default 50), break length in minutes (default 10).

- One glass card per weekday. Each lesson is a row:

  [time chip — tapping it opens a native 24h time picker] [subject text field with autocomplete from subjects already entered] [✕ remove]

- "+ Adaugă oră / + Add lesson" capsule button under each day; the new row's time = previous row's time + lesson length + break.

- Drag to reorder lessons. "Copy from another day" option.

- Sticky blue capsule "Salvează / Save" button with a toast confirmation.



## Data

- No login, no backend. Store everything in localStorage on the device.

- Settings: Export / Import the timetable as a JSON file, and Export to calendar (.ics file with weekly recurring events and a 5-minute reminder before each lesson, timezone Europe/Bucharest).

- First launch: an empty state with a "Load example" button that fills in this example timetable (class V-A, lessons 50 min, breaks 10 min):

  - Luni (11:00): Matematică, Ed. fizică, Biologie, Limba engleză, Ed. plastică, Opțional mediu

  - Marți (11:00): Istorie, Religie, Matematică, Limba română, Ed. muzicală

  - Miercuri (11:00): Istorie, Ed. fizică, Limba română, Limba franceză, Dirigenție

  - Joi (12:00): Ed. socială, Matematică, TIC, Limba franceză, Limba română

  - Vineri (11:00): Matematică, Limba engleză, Limba română, Geografie, Ed. tehnologică



## PWA

- Installable to the home screen (manifest + service worker, works offline), standalone display, app name "Orar", theme color #0A84FF, clean glass-style icon.

- On first visit on mobile, show a small dismissible hint explaining how to "Add to Home screen".

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://orarsfnicolae.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/ea2ae001-e13b-44df-acf3-70c21861428a).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
