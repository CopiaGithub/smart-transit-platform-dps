# Transit Display Platform — Web Application User Manual

**For:** School administrators and teachers
**Applies to:** The web console (browser). The phone app is covered by a separate manual.

---

## 1. Purpose of This Manual

This manual explains how to use the Transit Display Platform web application in simple English.

It covers:

- How to log in
- What an Admin can do, and what a Teacher can do
- Every screen, and what each field on it means
- Search, filter and dropdown options
- Common buttons: Add, Edit, View, Delete, Save, Cancel, Search, Clear, Export

You do not need any technical knowledge to follow this manual.

---

## 2. Important: Teacher Access on the Web

**Please read this section before looking for a Teacher module.**

The web application is an **administrator's console**. A Teacher can sign in, but the only screen a Teacher can open is the **Dashboard**. There are no Teacher data-entry screens on the web.

| Role | What they see on the web |
|---|---|
| **Admin** | Dashboard, Reports, and all 20 master screens |
| **Teacher** | Dashboard only |
| **Gate operator** | Dashboard only |
| **Parent** | Dashboard only |

Teachers do their daily work — marking students, watching the board — in the **mobile app**, not here. If a Teacher signs in to the web and sees only the Dashboard, that is correct behaviour and not a fault.

Because of this, Section 4 (Teacher Module) is short by necessity, and Section 5 (Admin Module) contains the bulk of the manual.

---

## 3. Login

Everyone — Admin and Teacher alike — uses the same login page. What you can do afterwards depends on the role stored against your account.

*[Screenshot: Login screen]*

### Fields

| Field | Purpose | Required/Optional | Example |
|---|---|---|---|
| **Username** | Identifies you. You may type **any one of three things**: your email address, your employee code, or your registered mobile number. | Required | `admin@school.com`, `EMP001`, or `9876543210` |
| **Password** | Confirms it is really you. | Required | — |
| **Remember me on this device** | Ticks so the next visit fills in your username for you. It never stores your password. | Optional | — |

### Actions

| Action | Purpose |
|---|---|
| **Sign in** | Checks your details and opens the Dashboard. |
| **Eye icon** (in the password box) | Shows or hides the password so you can check what you typed. |

### Steps to log in

1. Open the web address given to you by your school.
2. Type your username (email, employee code or mobile number).
3. Type your password.
4. Tick **Remember me on this device** if this is your own computer.
5. Click **Sign in**.

### If login fails

| Message | What it means | What to do |
|---|---|---|
| *Invalid username or password.* | One of the two is wrong. | Check for typing mistakes and try again. The eye icon helps. |
| *Cannot reach the server. Check your network connection.* | Your computer cannot reach the school server. | Check your internet or wi-fi, then try again. |
| *Your session has expired. Please sign in again.* | You were signed in but were idle too long. | Sign in again. |

### Difference between Teacher and Admin access

| | Teacher | Admin |
|---|---|---|
| Can sign in to the web | Yes | Yes |
| Sees the Dashboard | Yes | Yes |
| Sees the sidebar menu groups | No | Yes |
| Can open Reports | No | Yes |
| Can add, edit or delete records | No | Yes |

The menu simply does not show screens your role cannot use. This is deliberate — it saves you clicking into a screen that would only refuse you.

---

## 4. Teacher Module

### 4.1 Dashboard

**Purpose:** A one-glance view of how today's dispersal is going.

The Dashboard is read-only for a Teacher. There is nothing to fill in and nothing to save.

**What you see:**

| Card | What it tells you |
|---|---|
| **Yard occupied** | How many platforms are in use, out of the total (e.g. `9 / 23`). Warns you if the yard is full. |
| **Waiting buses** | Buses that have arrived but are holding until a platform frees up. |
| **Departed** | How many buses have already left, out of today's total. |
| **Buses in yard** | How many buses are currently inside the compound. |
| **Out of service** | Buses that cannot run today (maintenance or breakdown). |
| **Displays not online** | LED panels that are not reporting in. |

At the top, a banner tells you whether a **dispersal session** is open. Nothing can be recorded anywhere in the system until a session is open, so this is the first thing to check.

**Actions:** None for a Teacher. The page refreshes itself every 30 seconds while the tab is open.

---

## 5. Admin Module

### 5.1 How every master screen works

Nineteen of the admin screens follow **exactly the same layout**. Learn it once and you know them all.

Every master screen has three parts, top to bottom:

1. **Title bar** — the screen name, and an **Add** button on the right.
2. **Search Filter panel** — the filters for that screen, with **Search** and **Clear**.
3. **List panel** — the table of records, with **Export to Excel** in its header and page arrows at the bottom.

*[Screenshot: A master screen, e.g. Buses Master]*

#### Standard actions on every master screen

| Action | Where it is | Purpose |
|---|---|---|
| **Add [item]** | Top right | Opens a blank form to create a new record. |
| **Search** | Filter panel | Applies the filters you have set and reloads the list. |
| **Clear** | Filter panel | Empties every filter and shows the full list again. |
| **Export to Excel** | List panel header | Downloads the list as a spreadsheet. Only appears when there is something to export. |
| **View** (eye) | On each row | Opens the record in read-only form. Nothing can be changed. |
| **Edit** (pencil) | On each row | Opens the record in an editable form. |
| **Delete** (bin) | On each row | Removes the record, after asking you to confirm. |
| **Save** | In the form | Stores your changes and closes the form. |
| **Cancel** | In the form | Closes the form and throws away your changes. |
| **Page arrows** | Bottom of the list | Move between pages. 25 records are shown per page. |

#### Standard filters

Almost every screen offers these two:

| Filter | Purpose | How to Use |
|---|---|---|
| **Search** | Finds records by typing part of a name, code or number. | Type a few letters and click **Search**. You do not need the whole word. |
| **Status** | Shows only Active or only Inactive records. | Choose **Active** or **Inactive**, then click **Search**. **Leave it blank to see both.** |

> **Tip:** The Status filter is an exact match. If you want to see *everything*, active and inactive together, leave Status empty rather than choosing an option.

#### The Status field on forms

Nearly every form ends with a **Status** switch (Active / Inactive).

- It does **not** appear when you are adding a record — new records are always created Active.
- Setting a record to **Inactive** retires it without deleting it. It stops appearing in dropdowns elsewhere, but its history is kept.

---

### 5.2 Screen index

| Group | Screen | Can you edit it? |
|---|---|---|
| Operations | Dashboard | Read-only (one action) |
| Operations | Reports | Read-only |
| Transport | Routes Master | Yes |
| Transport | Buses Master | Yes |
| Transport | Bus-Route Allocation | Yes |
| Infrastructure | Gate Master | Yes |
| Infrastructure | Platforms Master | Yes |
| Infrastructure | Display Master | Yes |
| Academic | Academic Year Master | Yes |
| Academic | Student Master | Yes |
| Academic | Parent Master | Yes |
| Academic | Student-Parent Mapping | Yes |
| Security & Navigation | Role Master | Yes |
| Security & Navigation | User Master | Yes |
| Security & Navigation | Menu Master | Yes |
| Security & Navigation | Menu Assignment | Yes |
| Location | Country Master | **View only** |
| Location | Region Master | **View only** |
| Location | State Master | **View only** |
| Location | City Master | **View only** |
| Location | PinCode Master | **View only** |

---

### 5.3 Dashboard

**Purpose:** The state of today's dispersal at a glance, plus quick links to the screens you use most.

An Admin sees everything a Teacher sees (Section 4.1), plus:

| Item | Purpose |
|---|---|
| **Open Session** button | Starts today's dispersal for the whole school. Only appears when no session is open. |
| **Quick access tiles** | Shortcuts to the master screens. |

**Steps to open a session:**

1. Look at the banner at the top. If it says *No dispersal session is open*, a session is needed.
2. Click **Open Session**.
3. Read the confirmation message and click **Open Session** again to confirm.
4. The banner turns green and shows how long the session has been running.

> Only one session can be open across the whole school at a time. Gate operators cannot record anything until it is open.

---

### 5.4 Reports

**Purpose:** Today's dispersal log — every bus movement the gates recorded, in the order it happened. This is the audit trail for the day.

*[Screenshot: Reports screen]*

**Summary cards:**

| Card | Meaning |
|---|---|
| **Recorded in** | How many buses were logged in at the entry gate today. |
| **Departed** | How many have left. |
| **On campus** | How many are still inside (arrived or boarding). |
| **Avg dwell** | The average time a bus spent on its platform. Counts only buses that have actually left. Shows `—` until at least one has. |

**Filters:**

| Filter | Purpose | How to Use |
|---|---|---|
| **All** | Shows every bus logged today. | Click it. This is the default. |
| **Departed** | Only buses that have left. | Click it. |
| **On campus** | Only buses still inside. | Click it. |
| **Replaced** | Only buses swapped out for a reserve. | Click it. |

**Columns:**

| Column | Meaning |
|---|---|
| **Bus No.** | The bus number painted on the vehicle. If it was swapped, a note underneath shows which reserve took over. |
| **Route** | The route it was running. |
| **Status** | Waiting, Arrived, Boarding, Departed or Replaced. |
| **Station** | The platform number it was given. |
| **In** | When the entry gate recorded it. |
| **Assigned** | When it was given its platform. |
| **Out** | When the exit gate recorded it leaving. |
| **Dwell** | How long it stayed on the platform. |

**Actions:**

| Action | Purpose |
|---|---|
| **Export CSV** | Downloads what is currently on screen as a spreadsheet. If you have filtered to *Replaced*, only those rows are exported. Greyed out when the list is empty. |

The times shown are the exact moment a guard tapped the screen at the gate. The page refreshes every 30 seconds.

---

### 5.5 Transport Masters

#### Routes Master

**Purpose:** The list of bus routes the school runs.

**Fields:**

| Field | Purpose | Required/Optional | Example |
|---|---|---|---|
| **Route Code** | A short code for the route. | Optional (max 50) | `VS17` |
| **Route Name** | The full name people use. | **Required** (max 100) | `Vashi Sec-17` |
| **LED Display Name** | The short name shown on the LED board. If you leave it blank, the Route Name is used instead. | Optional (max 100) | `VASHI 17` |
| **Status** | Active or Inactive. | Optional | — |

**Filters:** Search, Status.

#### Buses Master

**Purpose:** The school's fleet — every vehicle, its driver, and whether it can run today.

**Two things this screen keeps separate — do not confuse them:**

- **Status (Active/Inactive)** retires a bus from the fleet permanently.
- **Service Status** says whether a bus can run *today*. A bus in Maintenance is still on the roster.

**Fields:**

| Field | Purpose | Required/Optional | Example |
|---|---|---|---|
| **Bus Number** | The short number on the LED board. This is how the bus is identified at the gate. | **Required** (max 20) | `18` |
| **Registration Number** | The RTO number plate. Used for insurance and police, never at the gate. | Optional (max 20) | `MH43 AB 1234` |
| **Route** | The route this bus normally serves. Reserve buses usually have none. | Optional | `Vashi Sec-17` |
| **Bus Type** | **Active** (runs a route daily) or **Reserve** (stands by for breakdowns). | **Required** | `Active` |
| **Service Status** | **In Service**, **Maintenance** or **Breakdown**. | **Required** | `In Service` |
| **Out of Service Reason** | Why it cannot run. Appears — and becomes required — only when Service Status is Maintenance or Breakdown. | Required *when shown* (max 200) | `Clutch replacement` |
| **Capacity** | How many children it seats. | Optional | `45` |
| **Driver Name** | The driver's name. | Optional (max 100) | `Ramesh Patil` |
| **Driver Phone** | Called during a breakdown. | Optional (max 20) | `9876543210` |
| **Driver Licence Number** | For records. | Optional (max 30) | — |
| **Status** | Active or Inactive. | Optional | — |

**Filters:** Search, Route, Status.

#### Bus-Route Allocation

**Purpose:** Answers "which bus runs this route?" — including last-minute swaps.

**Two kinds of allocation:**

- **Standing** — the permanent pairing. It has no end date and runs until you change it.
- **Override** — covers a single date only, and beats the Standing row for that date.

**Fields:**

| Field | Purpose | Required/Optional | Example |
|---|---|---|---|
| **Route** | The route being allocated. | **Required** | `Vashi Sec-17` |
| **Bus** | The bus that will run it. | **Required** | `18` |
| **Allocation Type** | Standing or Override. | **Required** | `Standing` |
| **Effective From** | The first date this applies. | **Required** | `01-Jun-2026` |
| **Effective To** | The last date. Only appears for an Override. | Optional | `12-Aug-2026` |
| **Reason** | Why, for the record. | Optional (max 200) | `Bus 18 in service` |
| **Status** | Active or Inactive. | Optional | — |

**Filters:** Search, Route, Bus, Allocation Type, Status.

**Extra action — Substitute:**

Each row has an amber **Substitute** button for the 11th-hour reserve swap.

| Field in the Substitute box | Purpose | Required/Optional |
|---|---|---|
| **Reserve Bus** | The stand-in bus. Only reserve buses currently in service are offered. | **Required** |
| **Reason** | Why the swap was needed. | Optional (max 200) |

**Steps:**

1. Find the route in the list.
2. Click **Substitute** on that row.
3. Choose the **Reserve Bus** and type a **Reason**.
4. Click **Substitute**, then confirm.

The swap applies to **today only**. The permanent allocation is untouched, so the route goes back to its usual bus tomorrow by itself.

---

### 5.6 Infrastructure Masters

#### Gate Master

**Purpose:** The gates in the school compound — where buses come in, where they leave, and which doors children walk out of.

**Fields:**

| Field | Purpose | Required/Optional | Example |
|---|---|---|---|
| **Gate Code** | Short code for the gate. | **Required** (max 20) | `G6` |
| **Gate Name** | The name staff use. | **Required** (max 100) | `Gate 6` |
| **Gate Type** | **Bus Entry**, **Bus Exit** or **Student Exit**. Student Exit gates are the doors children leave by. | **Required** | `Bus Entry` |
| **Sort Order** | Controls the order gates appear in lists. Lower numbers come first. | Optional | `1` |
| **Status** | Active or Inactive. | Optional | — |

**Filters:** Search, Gate Type, Status.

The list also shows how many **Platforms** and **Displays** belong to each gate. These are counted for you and cannot be typed in.

#### Platforms Master

**Purpose:** The numbered parking bays in the compound where buses wait for children.

**Fields:**

| Field | Purpose | Required/Optional | Example |
|---|---|---|---|
| **Platform Number** | The number painted on the ground — 1 to 23. | **Required** | `23` |
| **Platform Name** | An optional friendly name. | Optional (max 50) | `Near canteen` |
| **Side** | **Left** or **Right** — which arm of the U-shaped compound it is on. | Optional | `Left` |
| **Sort Order** | Display order in lists. | Optional | `23` |
| **Status** | Active or Inactive. | Optional | — |

**Filters:** Search, Status.

> **Warning when you deactivate a platform:** the system will ask you to confirm. Turning a platform off removes it from allocation, which means the yard holds fewer buses and more will end up Waiting.

#### Display Master

**Purpose:** The LED panels around the school — one outdoor near the entrance, and indoor panels at the student exits.

This form has **two tabs**.

**Tab 1 — Panel:**

| Field | Purpose | Required/Optional | Example |
|---|---|---|---|
| **Display Code** | Unique code. The panel uses it to report in, so **changing it disconnects a live panel**. | **Required** (max 20) | `OUT01` |
| **Display Name** | The name staff use. | **Required** (max 100) | `Main entrance board` |
| **Display Type** | **Outdoor** or **Indoor**. | **Required** | `Outdoor` |
| **Gate** | Where the panel physically is. | Optional | `Gate 1` |
| **Filter by Gate** | Leave blank to show every platform. Set it to limit an indoor panel to one student exit. | Optional | `Student Exit A` |
| **Location** | A note about where it is. | Optional (max 50) | `Above reception` |
| **Status** | Active or Inactive. | Optional | — |

**Tab 2 — Hardware:**

| Field | Purpose | Required/Optional | Example |
|---|---|---|---|
| **IP Address** | The panel's network address. | Optional (max 45) | `192.168.1.40` |
| **Screen Size** | Physical size in feet. | Optional (max 20) | `8x8` |
| **Width (px)** | Screen width in pixels. | Optional | `1920` |
| **Height (px)** | Screen height in pixels. | Optional | `1080` |
| **Visible Row Count** | How many board rows fit on the screen at once. | Optional | `10` |

**Filters:** Search, Display Type, Status.

The **Connection** and **Last Heartbeat** columns are filled in by the panels themselves. You cannot edit them — they are how you tell whether a panel is alive.

---

### 5.7 Academic Masters

#### Academic Year Master

**Purpose:** The school years, and which one is currently running.

**Fields:**

| Field | Purpose | Required/Optional | Example |
|---|---|---|---|
| **Year Name** | The year, written as four digits, a dash, four digits. | **Required** (exactly 9 characters) | `2026-2027` |
| **Start Date** | First day of the year. | **Required** | `01-Jun-2026` |
| **End Date** | Last day of the year. | **Required** | `30-Apr-2027` |
| **Current Year** | Marks this as the year in progress. | Optional | — |
| **Status** | Active or Inactive. | Optional | — |

**Filters:** Search, Status.

> **Only one year can be Current at a time.** If you tick Current Year, the system asks you to confirm, then moves the marker off whichever year holds it now. New students default to the current year.

#### Student Master

**Purpose:** Every child in the school, their class, how they travel home, and who may collect them.

This is the largest form. It has **three tabs**.

**Tab 1 — Basic:**

| Field | Purpose | Required/Optional | Example |
|---|---|---|---|
| **Admission Number** | The school's own unique number for the child. | **Required** (max 30) | `2026/0417` |
| **First Name** | Child's first name. | **Required** (max 60) | `Aarav` |
| **Middle Name** | Child's middle name. | Optional (max 60) | `Rajesh` |
| **Last Name** | Child's surname. | **Required** (max 60) | `Sharma` |
| **Grade** | The class. Typed as text, not a number, because it covers Nursery, Jr KG and Sr KG as well as 1 to 12. | **Required** (max 20) | `Sr KG` or `7` |
| **Division** | The section within the grade. | **Required** (max 10) | `B` |
| **Academic Year** | Which school year this record belongs to. | **Required** | `2026-2027` |
| **Class Teacher** | The staff member responsible for the class. | Optional | `Mrs Nair` |
| **Photo** | The child's photograph. | Optional | — |
| **Status** | Active or Inactive. | Optional | — |

**Tab 2 — Transport:**

| Field | Purpose | Required/Optional | Example |
|---|---|---|---|
| **Uses School Transport** | Turn off for a child who is collected privately. Turning it off hides and clears every field below. | Optional (on by default) | — |
| **Route** | The route serving the child's address. **You choose a route, never a bus** — the bus is worked out from whichever vehicle is allocated to that route today. | Optional | `Vashi Sec-17` |
| **Exit Gate** | Which door the child walks out of. The indoor LED panels use this. | Optional | `Student Exit A` |
| **Pickup Stop** | Where the child boards in the morning. | Optional (max 150) | `Sector 17 market` |
| **Drop Stop** | Where the child gets off. | Optional (max 150) | `Sector 17 market` |

**Tab 3 — Parents:**

A list of the child's parents and guardians. Use **Add parent** to add a row.

| Column | Purpose | Required/Optional |
|---|---|---|
| **Parent** | Who they are. **The parent must already exist in Parent Master.** | **Required** |
| **Relation** | Father, Mother, Guardian, Grandfather, Grandmother, Uncle, Aunt, Sibling, Driver or Other. | **Required** |
| **Primary** | The first person to call. Only one per child — choosing another moves it. | Optional |
| **Emergency** | Call them in an emergency. | Optional |
| **Can collect** | Allowed to physically collect the child. | Optional (on by default) |
| **Notify** | Receives messages about the child. | Optional (on by default) |

> **Can collect and Notify are different things.** A parent may be kept informed without being allowed to collect the child.

**Filters:** Search (name or admission number), Academic Year, Class Teacher, Bus, Exit Gate, Status.

#### Parent Master

**Purpose:** Parents and guardians as people. Which child they belong to is recorded separately, because the same father can be the main contact for one child and only an emergency contact for another.

This form has **three tabs**.

**Tab 1 — Contact:**

| Field | Purpose | Required/Optional | Example |
|---|---|---|---|
| **First Name** | Parent's first name. | **Required** (max 60) | `Rajesh` |
| **Middle Name** | Parent's middle name. | Optional (max 60) | — |
| **Last Name** | Parent's surname. | **Required** (max 60) | `Sharma` |
| **Mobile Number** | The parent's identity in the system. Used to avoid creating the same parent twice when they have several children. | **Required** (max 15) | `9876543210` |
| **Alternate Mobile** | A second number. | Optional (max 15) | — |
| **Email** | Email address. | Optional (max 150) | `rajesh@example.com` |
| **Occupation** | Their job. | Optional (max 100) | `Engineer` |
| **WhatsApp Notifications** | Send messages by WhatsApp. | Optional (on by default) | — |
| **SMS Notifications** | Send messages by SMS. | Optional (on by default) | — |
| **Status** | Active or Inactive. | Optional | — |

**Tab 2 — Address:**

| Field | Purpose | Required/Optional | Example |
|---|---|---|---|
| **Address Line 1** | Street address. | Optional (max 200) | `Flat 402, Sai Residency` |
| **Address Line 2** | Continued address. | Optional (max 200) | `Sector 17` |
| **State** | Their state. | Optional | `Maharashtra` |
| **City** | Their city. **Choose a State first** — the city list depends on it. | Optional | `Navi Mumbai` |
| **PinCode** | Their postcode. **Choose a City first.** | Optional | `400703` |
| **ID Proof Type** | Aadhaar, PAN or Driving Licence. Checked when they collect a child at the gate. | Optional | `Aadhaar` |
| **ID Proof Number** | The number on that document. | Optional (max 50) | — |
| **Photo** | Their photograph. | Optional | — |

**Tab 3 — Children:**

The same links as the Parents tab on Student Master, seen from the other side. Use **Link a child**. The columns are the same as described above, except you pick a **Student** instead of a Parent.

**Filters:** Search (name, mobile or email), Status.

The **Verified** column shows whether the parent has confirmed their mobile number in the parent app. You cannot set it by hand.

#### Student-Parent Mapping

**Purpose:** The links between children and parents, all in one list. Useful for checking and correcting links in bulk.

**Fields:**

| Field | Purpose | Required/Optional |
|---|---|---|
| **Student** | The child. **Locked once saved** — see the note below. | **Required** |
| **Parent** | The parent or guardian. **Locked once saved.** | **Required** |
| **Relation** | Father, Mother, Guardian, and so on. | **Required** |
| **Primary Contact** | The first person to call for this child. | Optional |
| **Emergency Contact** | Call in an emergency. | Optional |
| **Authorised for Pickup** | May physically collect the child. | Optional (on by default) |
| **Receives Notifications** | Gets messages about this child. | Optional (on by default) |
| **Contact Priority** | Who to call first. 1 is highest. | Optional (default 1) |
| **Status** | Active or Inactive. | Optional |

> **You cannot move a link to a different child or parent.** Once saved, Student and Parent are fixed. To correct a mistake, delete the link and create a new one.

**Filters:** Search, Student, Parent, Status.

---

### 5.8 Security & Navigation

#### Role Master

**Purpose:** The kinds of user the system knows about: Admin, Teacher, Parent, Gate 6 Operator and Gate 1 Operator.

**Fields:**

| Field | Purpose | Required/Optional | Example |
|---|---|---|---|
| **Role Name** | The name of the role. A gate operator's post is part of the name. | **Required** (max 50) | `Gate 6 Operator` |
| **Description** | What the role is for. | Optional (max 200) | `Records buses arriving` |
| **Status** | Active or Inactive. | Optional | — |

**Filters:** Search, Status.

> **Warning when you rename a role:** the system asks you to confirm. The apps find the words "Gate 6" and "Gate 1" inside the role name to decide which gate screen to show. Renaming carelessly can send a guard to the wrong screen.

#### User Master

**Purpose:** School staff — admins, teachers and gate operators.

> Parents are **not** here. They live in Parent Master.

**Fields:**

| Field | Purpose | Required/Optional | Example |
|---|---|---|---|
| **Name** | The person's full name. | **Required** (max 100) | `Sunita Nair` |
| **Employee Code** | The school's staff number. Must be unique. **Can be used to log in.** | Optional (max 50) | `EMP004` |
| **Email** | Email address. **Can be used to log in.** | Optional (max 100) | `sunita@school.com` |
| **Contact** | Mobile number. **Can be used to log in.** | Optional (max 20) | `9876543210` |
| **Password** | Their sign-in password. | **Required when adding.** When editing, leave blank to keep the current password. | — |
| **Role** | What they are allowed to do. | **Required** | `Teacher` |
| **Address** | Home address. | Optional (max 250) | — |
| **Status** | Active or Inactive. | Optional | — |

**Filters:** Search (name, email or employee code), Role, Status.

> A member of staff can sign in with **any one** of their employee code, email or contact number. Give them at least one, or they cannot log in at all.

#### Menu Master

**Purpose:** The sidebar menu itself — what appears in it, and in what order. Shown as a tree, because menus have parents and children.

**Fields:**

| Field | Purpose | Required/Optional | Example |
|---|---|---|---|
| **Menu Name** | The wording shown in the sidebar. | **Required** (max 100) | `Buses Master` |
| **Parent Menu** | The group it sits under. Leave blank for a top-level entry. | Optional | `Transport Masters` |
| **Route** | The screen address it opens. | Optional (max 200) | `/mainlayout/master/buses-master` |
| **Icon** | The small picture beside the name. | Optional (max 100) | `directions_bus` |
| **Order No** | Position among its siblings. Lower numbers come first. | **Required** | `2` |
| **Status** | Active or Inactive. | Optional | — |

You can also move an item up or down among its siblings directly in the tree.

#### Menu Assignment

**Purpose:** Decides which menus each role can see. Roles are listed on the left; the menu tree with tick boxes is on the right.

**Steps:**

1. Click a role in the left-hand list.
2. Tick the menus that role should see. Unticking a parent clears everything beneath it.
3. Click **Save**.

> Ticking a child automatically ticks its parents — a submenu you cannot reach is a submenu nobody can click.
>
> Saving **replaces** that role's whole menu list. Whatever is ticked when you press Save becomes the complete set.

---

### 5.9 Location Masters — view only

**Country Master, Region Master, State Master, City Master, PinCode Master.**

**Purpose:** The geography every other screen points at: Country → Region → State → City → PinCode.

**These five screens are browse-and-view only.** There is no Add, Edit or Delete button. The data is set up once when the system is installed. Editing a row here would silently re-point live parent and student records at the wrong place, so the ability was deliberately removed.

You can still **Search**, **filter**, **View** a row, and **Export to Excel**.

| Screen | Main fields shown | Filters |
|---|---|---|
| **Country Master** | Country Code, Country Name, Status | Search, Status |
| **Region Master** | Region Code, Region Name, Country, Status | Search, Country, Status |
| **State Master** | State Code, State Name, Country, Region, Status | Search, Country, Region, Status |
| **City Master** | City Code, City Name, State, Region, Status | Search, State, Region, Status |
| **PinCode Master** | PinCode, City, Status | Search, City, Status |

If a country, city or pincode is missing, contact your system administrator — it cannot be added from this screen.

---

## 6. Important Rules

### Mandatory fields

A field marked **Required** must be filled before the form will save. If you try to save without it, the field turns red and a short message appears underneath telling you what is missing. Fix it and click **Save** again.

### Valid and invalid values

Some fields only accept a certain shape:

| Field | Rule |
|---|---|
| **Year Name** | Exactly `YYYY-YYYY`, e.g. `2026-2027`. |
| **PinCode** | Exactly 6 digits. |
| **Email** | Must contain `@` and a domain. |
| **Number fields** (Capacity, Order No, Platform Number) | Digits only. |

Most text fields also have a maximum length, shown in the tables above. The box simply stops accepting characters once you reach it.

### Dropdown fields

A dropdown offers a fixed list — you cannot type your own value.

Some dropdowns **depend on another one**. For example, City only fills in after you have chosen a State. Until then it shows *Select State first*. If you change the State, the City clears itself, because the old city may not belong to the new state.

### Search and filters

- Filters do nothing until you click **Search**.
- Filters combine: choosing Route *and* Status shows only records matching both.
- **Clear** empties every filter and shows the full list.
- Search matches part of a word, so `vash` finds `Vashi Sec-17`.
- Leaving a filter blank means "no restriction" — this is how you see Active and Inactive together.

### Error messages

Errors appear in a red box and always show the reason the server gave. Common ones:

| Message | Meaning |
|---|---|
| *Could not load this list* | The list failed to load. Click **Retry**. |
| *You appear to be offline* | Your internet connection has dropped. |
| *You do not have permission to perform this action.* | Your role is not allowed to do this. |
| *Your session has expired. Please sign in again.* | Sign in again. |
| Duplicate warnings | A record with that code, number or name already exists. |

### Success messages

A green tick box confirms a save, an update or a delete, for example *Bus 18 deleted.* Click **OK** to close it.

### Delete confirmation

Delete always asks first, naming the record: *Delete "Bus 18"?*

Deleting is a **soft delete**. The record is hidden from lists but kept in the database, so past history and reports stay correct. Click **Delete** to go ahead or **Cancel** to stop.

### Save and Submit behaviour

- **Save** stores the record and closes the form.
- Some saves ask you to confirm first, because they affect more than the record in front of you — making an academic year Current, renaming a role, or deactivating a platform. Read the message before continuing.
- **Cancel** closes the form and throws away everything you typed. Nothing is stored.

### Logout

1. Click your name in the top right corner.
2. Click **Log out**.

You are returned to the login page and your session ends. Always log out on a shared computer.

> **Change password** appears in this menu but is greyed out. Password reset is not available yet — ask your administrator to set a new password for you in User Master.

---

## 7. Navigation

### Getting around

| To go here | Do this |
|---|---|
| **Dashboard** | Click **Home** at the top of the sidebar. |
| **Any master screen** | Click its group in the sidebar (e.g. *Transport Masters*), then the screen name. |
| **Reports** | Click **Reports** in the sidebar. |
| **Back to a previous screen** | Use the breadcrumb trail at the top left, e.g. *Home › Reports*. Click any part of it to jump there. |
| **Log out** | Click your name in the top right, then **Log out**. |

### Moving between add, edit and view

All three open as a **box on top of the list** — you never leave the screen you are on.

| To do this | Steps |
|---|---|
| **Add a record** | 1. Click **Add [item]** at the top right. 2. Fill in the form. 3. Click **Save**. |
| **Edit a record** | 1. Find the row. 2. Click the **pencil** icon. 3. Change what you need. 4. Click **Save**. |
| **View a record** | 1. Find the row. 2. Click the **eye** icon. 3. Read it. 4. Click **Cancel** to close. Nothing can be changed in this mode. |
| **Delete a record** | 1. Find the row. 2. Click the **bin** icon. 3. Read the confirmation. 4. Click **Delete**. |

### Always-visible information

At the top of every screen you will see:

- **Breadcrumbs** — where you are.
- **Session pill** — *Session open* (green) or *No session open* (grey). This governs every screen: nothing operational can be recorded until a session is open.
- **Your name and role** — click it for the account menu and Log out.

---

## 8. Quick Reference — Buttons

| Button | What happens when you click it |
|---|---|
| **Add [item]** | Opens a blank form for a new record. |
| **Save** | Stores the record and closes the form. |
| **Cancel** | Closes the form. Nothing is saved. |
| **Search** | Applies your filters and reloads the list. |
| **Clear** | Empties all filters and shows everything. |
| **View** (eye) | Opens the record read-only. |
| **Edit** (pencil) | Opens the record for changes. |
| **Delete** (bin) | Removes the record, after confirming. |
| **Export to Excel** | Downloads the list as a spreadsheet. |
| **Export CSV** (Reports) | Downloads the log currently on screen. |
| **Substitute** (Bus-Route Allocation) | Swaps in a reserve bus for today only. |
| **Retry** | Tries to load the list again after a failure. |
| **Open Session** (Dashboard) | Starts today's dispersal for the school. |
| **Log out** | Ends your session and returns to the login page. |
