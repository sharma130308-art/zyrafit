# fit ai

CORE FEATURES (MVP ONLY)

1. 🍔 FOOD LOGGING SYSTEM

Users must be able to:

 Add food manually

 Enter food name + calories + macros

 Select quantity

 Assign meal type:

 Breakfast

 Lunch

 Dinner

 Snack

2. 🔥 DAILY CALORIE TRACKER

Show:

 Total calories consumed

 Daily calorie goal

 Remaining calories

Formula:
Remaining = Goal - Consumed

3. 🥗 MACRO TRACKING

Track and display:

 Protein (g)

 Carbs (g)

 Fat (g)

Update instantly when food is added.

4. 📊 DASHBOARD (HOME SCREEN)

Design a premium dashboard with:

 Large calorie counter (center focus)

 Progress ring showing calories used

 Remaining calories clearly visible

 Macro breakdown (bars or numbers)

 Meal sections:

 Breakfast

 Lunch

 Dinner

 Snacks

Each section shows foods added

5. ➕ ADD FOOD FLOW

Flow:

 Tap “+ Add Food”

 Go to Add Food screen

 Enter:

 Food name

 Calories

 Protein

 Carbs

 Fat

 Quantity

 Save → return to dashboard → update instantly

🧱 DATABASE STRUCTURE

Create clean, scalable schema:

User

 id

 name

 email

 daily_calorie_goal

FoodEntry

 id

 user_id

 name

 calories

 protein

 carbs

 fat

 quantity

 meal_type

 date

⚙️ BACKEND LOGIC

When food is added:

 Save entry

 Recalculate totals for the day

 Return updated values:

 total calories

 remaining calories

 macro totals

🎨 UI / UX REQUIREMENTS

 Native mobile feel (iOS + Android)

 Minimal, clean, premium design

 Smooth animations

 Fast interactions

Design style:

 Soft shadows

 Rounded cards

 Progress ring for calories

 Bottom navigation (Home, Add Food, Profile)

⚡ PERFORMANCE

 Instant UI updates (no lag)

 Offline support (store locally, sync later)

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://zyrafit.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/26243190-be17-49c7-ac1c-6de0c51231ee).

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
