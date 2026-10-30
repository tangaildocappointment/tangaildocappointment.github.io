# Find Your Doctor – Code Guide
Tangail Zila Sadar Hospital & Clinic · doctor search and appointment website

Technology: **HTML + CSS + JavaScript** only (plain JavaScript, no framework, no server, no database).
Extra: the **SheetJS** library (only for the .xlsx file) and the browser's **localStorage** (to save data).

How to run: double-click `index.html`, or open the folder in VS Code and press Ctrl+Shift+B (see `RUN-IN-VSCODE.md`). The internet is needed only for the real .xlsx download (without it, a .csv file is saved).

---

## 1. Folder structure

```
doctor-finder/
├── RUN-IN-VSCODE.md      how to run it from VS Code (Ctrl+Shift+B or Live Server)
├── .vscode/              VS Code settings (tasks.json opens Chrome, settings.json, extensions.json)
├── index.html            HTML: the structure (what is on the page)
├── images/
│   └── doctor.png        the doctor picture shown in every card and profile popup
├── css/
│   └── style.css         CSS: the design (colours, layout, calendar, dropdown, dark mode)
└── js/                   JavaScript: the logic (what the page does)
    ├── data.js           235 doctors of 11 hospitals, 2 demo patients, settings (15 patients per day)
    ├── geo.js            8 divisions > 64 districts > thanas of Bangladesh
    ├── utils.js          small helper functions
    ├── storage.js        save / read data in localStorage, free TG number and serial number
    ├── dropdown.js       the reusable "Select or Search" dropdown
    ├── finder.js         Page 1: filters, doctor cards, scroll animation, profile popup
    ├── booking.js        Page 2: calendar, serial number, patient form, confirm
    ├── slip.js           appointment slip: Print and Download PDF
    ├── mailer.js         sends the 2 e-mails to the patient (booked, confirmed) via Google Apps Script
    ├── appointments.js   Excel export, backup / restore (used by the admin panel)
    ├── admin.js          Admin login, password reset, confirm / cancel, admin panel
    ├── status.js         patient 'Check Appointment' (Reg No. + mobile): status + final serial
    └── main.js           starts the page
```

**Why the order of the `<script>` tags matters:** the data and helpers must load first, then the pages that use them, and `main.js` last because it starts everything.
Order: `data → geo → utils → storage → dropdown → finder → booking → appointments → main`.

---

## 2. What each file does (main functions)

### index.html – structure
| Part | What it is |
|---|---|
| `<header>` + `.filter` + `#grid` | Page 1: title, 4 filter boxes, doctor cards |
| `#ovp` | Popup: doctor profile |
| `#ovm` | Popup: My Appointments (Excel, backup, clear) |
| `#ovb` | Page 2: booking page (1 Choose Specialist, 2 Select Date, 3 Patient Details) |

### data.js – data
- `D` = list of doctors. Each doctor is `[hospital, name, department, speciality, days, time]`.
- `days`: `a` = every day, `u` = not specified, or the week days as digits (0 = Sunday, 1 = Monday ... 5 = Friday, 6 = Saturday). Example: `'5'` = Friday only, `'024'` = Sunday, Tuesday, Thursday, `'012346'` = every day except Friday.
- **One doctor in many hospitals:** add one line for each hospital. Every line is shown as its own card, and the Find page name search shows all hospitals of that doctor. Appointments and serial numbers are counted per doctor *and* hospital.
- To add a doctor, add one line to `D`. A new hospital needs one new constant at the top (like `AH`, `LB`).
- `DEMO` = 2 demo patients (R10001, R10002). `CAP = 15` = patients per doctor per day.

### utils.js – helpers
`esc` (makes text safe for HTML) · `DD` (days code -> text) · `isDay` (does the doctor sit on this week day?) · `dlab` (doctor name + hospital when the same name is in several hospitals) · `match` (search test) · `uniq` (unique + sorted list) · `iso` / `today` / `pad` (dates and 01, 02 numbers) · `open` / `shut` (show or hide a popup).

### storage.js – saving
`jl` reads a list from localStorage, `js` writes a list, `save` adds an appointment.
Two lists are kept: `mem` (appointments) and `pts` (registered patients).

### dropdown.js – dropdown
`CB(id, placeholder, options, onPick)` builds one "Select or Search" dropdown (typing filters, arrow keys, Enter, × to clear).
The same function is used for all 15 dropdowns of the site.

### finder.js – Page 1
- `filt()` filters the doctors, `render()` draws the cards.
- `reveal()` makes the cards slide in one by one while scrolling (IntersectionObserver).
- `prof(i)` opens the profile popup.

### booking.js – Page 2
- `book(i)` opens the booking page for doctor `i`.
- `slot(date)` decides if a date is available (green), full (red) or not available (grey).
- `cnt(doctor, date)` counts bookings, so **serial = cnt + 1**.
- `cal()` draws the calendar.
- `need()` / `chk()` check the form and enable the Confirm button.
- `dup()` / `checkDup()` stop double registration with the same ID.
- `doFind()` loads an old patient by Registration No.
- `setHash()` / `route()` make a link like `#appointment?department=..&doctor=..`.

### slip.js – appointment slip
`printSlip(a)` fills the hidden `#slip` box and opens the print window (CSS `@media print` prints only the slip). `pdfSlip(a)` builds a real PDF with the **jsPDF** library and saves it. Both are shown after booking and in the admin panel.

### appointments.js – Excel and backup
`xrecs` (sort) · `xrows` / `xsum` (the 2 Excel sheets) · `exportExcel` · `saveBackup` / `restoreBackup` (JSON file) · `downloadFile` (saves a file).

### admin.js – Admin panel
- Screens: `vSetup` (create account, first time) · `vLogin` · `vForgot` (reset with the security question) · `vChange` (change password) · `vPanel` (the panel).
- `confirmAppt(a)` makes the appointment **Confirmed** permanently. `cancelAppt(a)` deletes a pending appointment completely.
- `adminList()` draws the numbers and the appointment cards with the filters.
- Patients see only the small 🔒 Admin button. They need the admin password to see anything else.

### main.js
Light/dark button and the first `render()`.

---

## 3. Questions the teacher may ask

**Which search algorithm is used?**
Linear search over the 235 doctors with a case-insensitive substring match (`indexOf`). All filled filters must match (AND). It runs on every key press. It is O(n), which is fine for a list of a few hundred doctors. There is no fuzzy search.

**Where is the data saved?**
In the browser's `localStorage` (keys `fyd_appts` and `fyd_pts`). It stays after closing the browser, but only in that browser. A real system would use a server and a database (for example Java/JSP + MySQL). The Backup / Restore buttons move the data to another browser.

**How does the admin panel work?**
The 🔒 Admin button opens a login. The first time, the admin creates a username, a password and a security question. The password is saved only as a salted SHA-256 hash (`hash()` in `admin.js`), never as plain text. After 5 wrong tries the login is locked for 60 seconds, and an admin session ends after 15 minutes without action. A forgotten password is reset by answering the security question.

**What happens when a patient books?**
The appointment is saved with status **Pending**. The patient gets a slip (Print or Download PDF). The admin calls the patient (the phone number is a call link), then presses **Confirm** or **Cancel**.

**What does Confirm do?**
The status becomes **Confirmed**, permanently. The Confirm and Cancel buttons disappear and `confirmAppt` / `cancelAppt` refuse to change it again.

**What does Cancel do, and what happens to the TG number and the serial?**
The appointment is deleted completely. `removeAppt()` (in `storage.js`) then moves the patients after it up by one: every patient of the same doctor, hospital and date with a bigger serial gets serial - 1, and every appointment with a bigger TG number gets TG number - 1. Example: serials 1, 2, 3, 4 and number 2 cancels -> the old 3 and 4 become 2 and 3. So the TG number is always the count of booked patients, and serials never have a gap. Registration numbers never change.

**How does a patient see the confirmation and the final serial?**
There is no patient login. The 🔎 Check Appointment button (`status.js`) asks for the Registration No. and the mobile number. `myAppts()` finds the appointments that match both and `statusCard()` shows Confirmed / Not confirmed yet and the CURRENT serial number (it moves up when an earlier patient cancels).

**How is the "slot full" decided?**
Each doctor sees 15 patients per day (`CAP`). `slot()` counts the appointments of that doctor on that date. When the count reaches 15 the date turns red and cannot be clicked.

**How is the serial number made?**
`nextSerial()` takes the smallest serial that is not used yet for that doctor on that date. So every doctor and every date starts again from 01. When somebody cancels, the later serials move up by one (`removeAppt`). It is shown as 01, 02, 03 with `pad()`.

**What are the TG number and the Registration number?**
`TG-1001...` counts every appointment (so the total booked is visible). `R10003...` is the patient's own registration number, made once when a new patient registers.

**How is double registration stopped?**
`dup()` checks the ID **type + number**. NID 123 cannot be registered twice, but NID 123 and Passport 123 are different. If it already exists, the page shows an alert, switches to Existing Patient and fills in the old data.

**How does Existing Patient auto-fill work?**
The Registration No. is looked up in `pts` (and `DEMO`). If found, `fillP()` fills every field of the form.

**How do the division > district > thana dropdowns work?**
`GEO` is an object: `GEO[division][district] = [thanas]`. The district dropdown shows only the districts of the chosen division, and the thana dropdown only the thanas of the chosen district.

**How does the scroll animation work?**
Cards start hidden (CSS `opacity: 0`). An `IntersectionObserver` adds the class `in` when a card enters the screen and removes it when it leaves, so the animation repeats every time. The delay between cards is made with `setTimeout`.

**How is the Excel file made?**
The SheetJS library builds an .xlsx with 2 sheets. Sorting: date, then hospital A–Z, then doctor, then serial. The Summary sheet has one line per doctor per date. Without internet, a CSV file is saved.

**How are the buttons and icons made?**
All icons are simple line drawings (SVG) kept in one place at the top of `index.html` (`<symbol id="i-lock">`, ...). A button uses `<svg class="ic"><use href="#i-lock"></use></svg>`, and JavaScript uses the helper `ic('lock')` (in `utils.js`). An icon takes the colour of its text (`stroke="currentColor"`), and the icons work without internet. In `style.css` the section "Buttons: simple and calm" gives two kinds of buttons: the main action is filled green (`.btn.f`), every other button is an outline (`.btn`, `.b`, `.o`), and dangerous actions are a red outline (`.dng`). The only motion is a soft colour change on hover and a 1 px press.

**How does dark mode work?**
Colours are CSS variables (`--bg`, `--ink`, ...). The dark values are used with `prefers-color-scheme: dark` or when the ◐ button sets `data-theme="dark"`.

**How is security handled?**
Everything that a user types is passed through `esc()` before it is put into the page, so it cannot inject HTML or scripts.

---

## 4. Limits (be honest when asked)
- No server and no database: the data lives only in one browser. The admin login is a front-end demo (the password is hashed, but anybody who knows how to use the browser's developer tools on the same computer can still change the data). A real system must check the login on a server.
- Patients on other computers cannot appear in this admin panel, because each browser has its own data. A server and database are needed for that.
- "Slot full" is counted from the bookings in that browser only.
- The PDF slip supports English letters only (other letters are shown as ?).
- One common doctor picture (`images/doctor.png`) is used for every doctor. To use real photos, put each file in `images/` and add a `photo` name to the doctor line.
- Search is exact-spelling (no fuzzy search) and English only.


---

## E-mail
`js/mailer.js` + `email-setup/` (Code.gs, SETUP.md). Mail 1 is sent when the patient books, mail 2 (final serial) when the admin confirms. Follow `email-setup/SETUP.md` once.
