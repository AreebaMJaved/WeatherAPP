# 🌦️ SkyScope — Weather App

A weather app that doesn't just show numbers — the whole screen relights itself to match what's actually happening outside, and you can drag through the next 24 hours instead of just reading a static list.

Built with React + Vite + Tailwind CSS. No backend, no API keys, no signup — powered entirely by [Open-Meteo](https://open-meteo.com/), which is free and doesn't require an account.

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white&style=flat-square)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white&style=flat-square)
![TailwindCSS](https://img.shields.io/badge/Tailwind-v4-06B6D4?logo=tailwindcss&logoColor=white&style=flat-square)
![License](https://img.shields.io/badge/license-MIT-lightgrey?style=flat-square)

---

## ✨ What makes it different

Most weather apps are a static card with a number on it. This one has two things I wanted to build myself instead of copying the usual template:

### 🌧️ A sky that's actually alive
There's a `<canvas>` layer sitting behind the UI, driven by `requestAnimationFrame`, that renders real rain streaks, drifting snow, fog haze, or soft floating clouds — picked based on the *actual* weather code returned by the API. Wind speed changes how fast and how sideways the particles drift. Thunderstorms get the occasional lightning flash. It's all hand-rolled canvas physics, no animation library.

### 👆 Drag through the day
Instead of a boring hour-by-hour list, there's an SVG temperature curve you can **click-and-drag or swipe** across. As you move, it snaps to the nearest hour and updates the reading live — like scrubbing a video timeline, but for tomorrow's weather.

### 🌅 Sunrise-to-sunset arc
A small arc tracks exactly where "now" sits between sunrise and sunset, with the sun/moon position moving along it in real time.

### 🎨 Condition-aware theming
13 hand-picked color themes (clear / cloudy / rain / snow / storm / fog × day / night) — the gradient, icon, and accent color all swap automatically depending on what's happening right now in the searched city.

---

## 🖥️ Tech Stack

| Layer | Tool |
|---|---|
| Framework | React 18 (Vite) |
| Styling | Tailwind CSS v4 |
| Icons | [lucide-react](https://lucide.dev/) |
| Weather data | [Open-Meteo](https://open-meteo.com/) (Forecast + Geocoding API — free, no key) |
| Animation | Native Canvas API + `requestAnimationFrame` (no external animation lib) |

---

## 📦 Getting Started

### 1. Clone and install
```bash
git clone https://github.com/your-username/skyscope-weather.git
cd skyscope-weather
npm install
```

### 2. Run locally
```bash
npm run dev
```
App will be running at `http://localhost:5173`

### 3. Build for production
```bash
npm run build
```
Outputs a static `dist/` folder — deployable anywhere (Vercel, Netlify, GitHub Pages, etc.)

No `.env` file, no API keys, no config needed. It just works out of the box.

---

## 📁 Project Structure

```
skyscope-weather/
├── src/
│   ├── App.jsx          # Renders WeatherApp
│   ├── WeatherApp.jsx   # Main component — search, canvas sky, hourly scrubber
│   ├── main.jsx         # Entry point
│   └── index.css        # Tailwind import
├── vite.config.js
├── package.json
└── README.md
```

---

## 🔍 How the data flows

1. User types a city name → hits **Geocoding API** to resolve it to lat/lng
2. Coordinates go to the **Forecast API** for current conditions, today's hourly temps, and daily sunrise/sunset
3. Weather code (WMO standard) gets mapped to one of 7 condition groups: `clear`, `partly`, `cloudy`, `fog`, `rain`, `snow`, `storm`
4. That group + whether it's day or night picks a theme and feeds the canvas particle system

---

## 🚀 Deployment

Deploys cleanly to **Vercel** with zero config — it auto-detects the Vite build:

```bash
npm i -g vercel
vercel
```

Build command: `npm run build` · Output directory: `dist`

---

## 🛣️ Possible next steps

- [ ] 7-day forecast view
- [ ] Geolocation ("use my current location")
- [ ] Saved / favorite cities
- [ ] Unit toggle (°C / °F)
- [ ] Air quality index

---

## 📄 License

MIT — use it, modify it, ship it.

---

<p align="center">Built with React, a lot of canvas math, and zero API keys.</p>