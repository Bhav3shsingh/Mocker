# Mocker for EXAMS

Rapid mock exam practice. Mocker is designed to be a distraction-free, utility-first testing environment that turns raw data into live exams instantly.
Theme inspired from official Government Exams, Entrance Exams including JEE, MHT-CET, etc.

This project was **vibe coded**—prioritizing intuitive flow, mechanical speed, and real-world utility over traditional corporate bloat.

---

## 🚀 How to Use Mocker

Mocker follows a simple "Knowledge-to-Data" pipeline to bridge the gap between your study material and active testing.

### Step 1: Generate your Data
Mocker doesn't use a database; it uses raw JSON. To get your questions in the right format:
1. Open the [Mocker Feeder Gem](https://gemini.google.com/gem/1-yZgHKfw5VfcSRG9ODM2SF3COsaLreBZ?usp=sharing).
2. Upload your syllabus, a PDF chapter, or even a photo of a textbook page.
3. The Gem will output a specialized **JSON Codeblock**. Click **Copy**.

### Step 2: Sync the Engine
1. Open the **Mocker** site.
2. Open the Hamburger Menu (top-left) and click **Load Questions**.
3. Paste your copied JSON into the **TEXT_POWER** area.
4. Set your desired time limit (e.g., 60 minutes).
5. Hit **EXECUTE_SYNC**.

### Step 3: Take the Test
* **Question Palette:** Use the sidebar to jump between questions. 
    * *Hexagons* = Answered.
    * *Circles* = Marked for Review.
    * *Arrows* = Unanswered.
* **Navigation:** Use the "Next" and "Previous" buttons or click directly on the palette grid.

### Step 4: Submit & Review
1. Once finished, hit **SUBMIT_TEST**.
2. The engine will lock and flip into **Review Mode**.
3. You can now see your score and go back through each question to see the correct answer (Green) versus your selection (Red).

---

## 🛠️ Key Features

* **⚡ Zero-Account Sync:** No logins required. Pure JSON injection for instant privacy.
* **⏳ Configurable Timer:** Customize your session intensity on the fly.
* **🎨 Intuitive Palette:** Geometric shapes provide a clear visual heat-map of your progress.
* **🔎 Deep-Dive Review:** Analytical post-exam state that reveals the logic behind every answer.

---

## 📂 Project Structure

```text
├── index.html      # UI Layout & Control Center
├── style.css       # Design System & Palette Shapes
├── script.js       # Core Logic (Timer, Sync Engine, Review State)
└── README.md       # Project Documentation
