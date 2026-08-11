import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  Search, MapPin, Loader2, Sun, Moon, Cloud, CloudRain,
  CloudSnow, CloudLightning, CloudFog, Wind, Droplets, Sunrise, Sunset,
} from "lucide-react";

/* ---------------------------------------------------------
   Weather-code → condition group (Open-Meteo WMO codes)
--------------------------------------------------------- */
const codeMap = (code) => {
  if ([0].includes(code)) return "clear";
  if ([1, 2].includes(code)) return "partly";
  if ([3].includes(code)) return "cloudy";
  if ([45, 48].includes(code)) return "fog";
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "rain";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "snow";
  if ([95, 96, 99].includes(code)) return "storm";
  return "clear";
};

const codeLabel = {
  clear: "Clear sky", partly: "Partly cloudy", cloudy: "Overcast",
  fog: "Foggy", rain: "Rain", snow: "Snow", storm: "Thunderstorm",
};

const IconFor = ({ group, isDay, className }) => {
  if (group === "clear") return isDay ? <Sun className={className} /> : <Moon className={className} />;
  if (group === "partly") return <Cloud className={className} />;
  if (group === "cloudy") return <Cloud className={className} />;
  if (group === "fog") return <CloudFog className={className} />;
  if (group === "rain") return <CloudRain className={className} />;
  if (group === "snow") return <CloudSnow className={className} />;
  if (group === "storm") return <CloudLightning className={className} />;
  return <Sun className={className} />;
};

/* ---------------------------------------------------------
   Theme tokens per condition / time of day
--------------------------------------------------------- */
const THEMES = {
  clear_day:    { grad: ["#3E8FDE", "#8FCBEE", "#EAF6FF"], accent: "#FFB454", text: "#0B2036" },
  clear_night:  { grad: ["#0B1230", "#1B2A55", "#2E3E73"], accent: "#F2C879", text: "#F5F7FA" },
  partly_day:   { grad: ["#5B93C4", "#A9C7DE", "#E7EEF3"], accent: "#FFC98A", text: "#0B2036" },
  partly_night: { grad: ["#141B33", "#26314F", "#3B4569"], accent: "#E8D9A8", text: "#F5F7FA" },
  cloudy_day:   { grad: ["#6E7C8C", "#9BA8B4", "#D6DCE1"], accent: "#F0F3F5", text: "#1A1F24" },
  cloudy_night: { grad: ["#1B2027", "#2C333C", "#454E58"], accent: "#C7D0D8", text: "#F5F7FA" },
  fog_day:      { grad: ["#9AA6AC", "#C4CDD1", "#E6EAEC"], accent: "#FFFFFF", text: "#1A1F24" },
  fog_night:    { grad: ["#20262B", "#333B40", "#4A5359"], accent: "#D9E1E4", text: "#F5F7FA" },
  rain_day:     { grad: ["#33495E", "#4C6B85", "#7C9AAE"], accent: "#55C6E8", text: "#F5F7FA" },
  rain_night:   { grad: ["#0E1620", "#1D2C3B", "#2E4356"], accent: "#4FB6DB", text: "#F5F7FA" },
  snow_day:     { grad: ["#8FA6BC", "#C6D6E4", "#F1F6FA"], accent: "#BFE3FF", text: "#1A1F24" },
  snow_night:   { grad: ["#1B2536", "#2E3B52", "#455773"], accent: "#DCEBFA", text: "#F5F7FA" },
  storm_day:    { grad: ["#242B36", "#3B4557", "#565F72"], accent: "#9C8CF0", text: "#F5F7FA" },
  storm_night:  { grad: ["#0A0D14", "#181D2A", "#272C3E"], accent: "#8B7FF0", text: "#F5F7FA" },
};
const themeKey = (group, isDay) => `${group}_${isDay ? "day" : "night"}`;

/* ---------------------------------------------------------
   UNIQUE FEATURE #1
   Live canvas particle sky — rain / snow / drifting clouds /
   fog haze, driven by real condition + wind speed. Pure
   canvas + requestAnimationFrame inside a custom hook, no
   external animation library.
--------------------------------------------------------- */
function useWeatherCanvas(canvasRef, group, windSpeed) {
  const particlesRef = useRef([]);
  const rafRef = useRef(null);
  const flashRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let width, height, dpr;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
    };

    const windMul = 0.4 + Math.min(windSpeed || 0, 40) / 40;

    const seed = () => {
      const count =
        group === "rain" ? 130 :
        group === "storm" ? 160 :
        group === "snow" ? 90 :
        group === "fog" ? 26 :
        22; // clear / partly / cloudy → soft drifting clouds/dust
      particlesRef.current = Array.from({ length: count }, () => makeParticle(width, height, group));
    };

    const makeParticle = (w, h, g) => {
      if (g === "rain" || g === "storm") {
        return {
          x: Math.random() * w, y: Math.random() * h,
          len: 10 + Math.random() * 14,
          speed: 6 + Math.random() * 6,
          drift: 1.5 + Math.random(),
        };
      }
      if (g === "snow") {
        return {
          x: Math.random() * w, y: Math.random() * h,
          r: 1.5 + Math.random() * 2.5,
          speed: 0.6 + Math.random() * 1.2,
          drift: Math.random() * 2 - 1,
          sway: Math.random() * Math.PI * 2,
        };
      }
      if (g === "fog") {
        return {
          x: Math.random() * w, y: Math.random() * h * 0.9,
          r: 60 + Math.random() * 90,
          speed: 0.15 + Math.random() * 0.2,
          alpha: 0.03 + Math.random() * 0.05,
        };
      }
      // clouds / dust for clear-ish skies
      return {
        x: Math.random() * w, y: h * 0.08 + Math.random() * h * 0.35,
        r: 30 + Math.random() * 50,
        speed: 0.1 + Math.random() * 0.15,
        alpha: 0.05 + Math.random() * 0.08,
      };
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      if (group === "storm") {
        flashRef.current -= 1;
        if (flashRef.current <= 0 && Math.random() < 0.006) flashRef.current = 4;
        if (flashRef.current > 0) {
          ctx.fillStyle = `rgba(255,255,255,${0.12 * flashRef.current})`;
          ctx.fillRect(0, 0, width, height);
        }
      }

      for (const p of particlesRef.current) {
        if (group === "rain" || group === "storm") {
          ctx.strokeStyle = "rgba(210,230,245,0.5)";
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - p.drift * windMul * 2, p.y + p.len);
          ctx.stroke();
          p.y += p.speed; p.x -= p.drift * windMul * 0.6;
          if (p.y > height) { p.y = -20; p.x = Math.random() * width; }
        } else if (group === "snow") {
          p.sway += 0.02;
          p.y += p.speed;
          p.x += Math.sin(p.sway) * 0.5 + p.drift * windMul * 0.15;
          ctx.fillStyle = "rgba(255,255,255,0.85)";
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
          if (p.y > height) { p.y = -10; p.x = Math.random() * width; }
        } else {
          // fog haze / soft clouds
          p.x += p.speed * windMul;
          ctx.fillStyle = `rgba(255,255,255,${p.alpha})`;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
          if (p.x - p.r > width) p.x = -p.r;
        }
      }
      rafRef.current = requestAnimationFrame(draw);
    };

    resize();
    draw();
    window.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(rafRef.current);
    };
  }, [group, windSpeed, canvasRef]);
}

/* ---------------------------------------------------------
   UNIQUE FEATURE #2
   Draggable hourly-forecast scrubber. Drag or tap along the
   temperature curve to preview any hour — a custom pointer-
   event hook driving an SVG path + spring-ish handle.
--------------------------------------------------------- */
function HourlyScrubber({ hours, accent, text, onScrub }) {
  const trackRef = useRef(null);
  const [idx, setIdx] = useState(0);
  const [dragging, setDragging] = useState(false);

  const temps = hours.map((h) => h.temp);
  const min = Math.min(...temps), max = Math.max(...temps);
  const pad = 10, w = 320, h = 64;
  const xFor = (i) => pad + (i / (hours.length - 1)) * (w - pad * 2);
  const yFor = (t) => h - pad - ((t - min) / (max - min || 1)) * (h - pad * 2);

  const path = useMemo(() => {
    return hours.map((pt, i) => `${i === 0 ? "M" : "L"} ${xFor(i)} ${yFor(pt.temp)}`).join(" ");
  }, [hours]);

  const updateFromClientX = useCallback((clientX) => {
    const el = trackRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    const i = Math.round(ratio * (hours.length - 1));
    setIdx(i);
    onScrub && onScrub(i);
  }, [hours.length, onScrub]);

  useEffect(() => {
    if (!dragging) return;
    const move = (e) => updateFromClientX(e.touches ? e.touches[0].clientX : e.clientX);
    const up = () => setDragging(false);
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    window.addEventListener("touchmove", move);
    window.addEventListener("touchend", up);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
      window.removeEventListener("touchmove", move);
      window.removeEventListener("touchend", up);
    };
  }, [dragging, updateFromClientX]);

  const active = hours[idx];

  return (
    <div className="select-none">
      <div className="flex items-baseline justify-between mb-1">
        <span className="text-xs opacity-75">{active.label}</span>
        <span className="font-display text-lg font-semibold tabular-nums">{Math.round(active.temp)}°</span>
      </div>
      <div
        ref={trackRef}
        className="relative cursor-pointer touch-none"
        style={{ height: h }}
        onMouseDown={(e) => { setDragging(true); updateFromClientX(e.clientX); }}
        onTouchStart={(e) => { setDragging(true); updateFromClientX(e.touches[0].clientX); }}
      >
        <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="absolute inset-0">
          <path d={path} fill="none" stroke={text} strokeOpacity="0.35" strokeWidth="2" />
          <circle cx={xFor(idx)} cy={yFor(active.temp)} r={dragging ? 7 : 5.5}
            fill={accent} stroke={text} strokeOpacity="0.4" strokeWidth="1.5"
            style={{ transition: dragging ? "none" : "cx 120ms ease, cy 120ms ease, r 120ms ease" }} />
        </svg>
      </div>
      <div className="flex justify-between mt-1 text-[10px] opacity-55">
        <span>{hours[0].label}</span>
        <span>{hours[Math.floor(hours.length / 2)].label}</span>
        <span>{hours[hours.length - 1].label}</span>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   Sun / moon day-progress arc
--------------------------------------------------------- */
function DayArc({ sunrise, sunset, now, isDay, accent, text }) {
  const pct = useMemo(() => {
    if (!sunrise || !sunset) return 0.5;
    const s = sunrise.getTime(), e = sunset.getTime(), n = now.getTime();
    if (!isDay) return n < s ? 1 : 0;
    return Math.min(1, Math.max(0, (n - s) / (e - s)));
  }, [sunrise, sunset, now, isDay]);

  const w = 260, h = 90, r = 100, cx = w / 2, cy = h;
  const angle = Math.PI - pct * Math.PI;
  const px = cx + r * Math.cos(angle);
  const py = cy - r * Math.sin(angle);

  return (
    <div className="flex flex-col items-center">
      <svg width={w} height={h + 14} viewBox={`0 0 ${w} ${h + 14}`}>
        <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none" stroke={text} strokeOpacity="0.25" strokeWidth="1.5" strokeDasharray="3 5" />
        {isDay && <circle cx={px} cy={py} r="7" fill={accent} />}
      </svg>
      <div className="flex items-center gap-6 -mt-1 text-xs" style={{ color: text, opacity: 0.85 }}>
        <span className="flex items-center gap-1">
          <Sunrise className="w-3.5 h-3.5" />
          {sunrise ? sunrise.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "--"}
        </span>
        <span className="flex items-center gap-1">
          <Sunset className="w-3.5 h-3.5" />
          {sunset ? sunset.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "--"}
        </span>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   Main app
--------------------------------------------------------- */
export default function WeatherApp() {
  const [query, setQuery] = useState("Karachi");
  const [place, setPlace] = useState(null);
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [now, setNow] = useState(new Date());
  const [scrubIdx, setScrubIdx] = useState(0);

  const canvasRef = useRef(null);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  const search = async (name) => {
    setLoading(true); setError(""); setScrubIdx(0);
    try {
      const geoRes = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=1`
      );
      const geo = await geoRes.json();
      if (!geo.results || geo.results.length === 0) {
        setError(`No place found for "${name}".`);
        setLoading(false);
        return;
      }
      const p = geo.results[0];
      setPlace(p);

      const wRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${p.latitude}&longitude=${p.longitude}` +
        `&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,is_day` +
        `&hourly=temperature_2m,weather_code` +
        `&daily=temperature_2m_max,temperature_2m_min,weather_code,sunrise,sunset` +
        `&forecast_days=2&timezone=auto`
      );
      const w = await wRes.json();
      setWeather(w);
    } catch (e) {
      setError("Couldn't reach the weather service. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { search("Karachi"); }, []);

  const group = weather ? codeMap(weather.current.weather_code) : "clear";
  const isDay = weather ? !!weather.current.is_day : true;
  const theme = THEMES[themeKey(group, isDay)];
  const sunrise = weather?.daily?.sunrise?.[0] ? new Date(weather.daily.sunrise[0]) : null;
  const sunset = weather?.daily?.sunset?.[0] ? new Date(weather.daily.sunset[0]) : null;

  const hourly = useMemo(() => {
    if (!weather?.hourly) return [];
    const times = weather.hourly.time;
    const startIdx = times.findIndex((t) => new Date(t).getTime() >= now.getTime() - 30 * 60000);
    const from = Math.max(0, startIdx);
    return times.slice(from, from + 24).map((t, i) => ({
      label: new Date(t).toLocaleTimeString([], { hour: "numeric" }),
      temp: weather.hourly.temperature_2m[from + i],
      code: weather.hourly.weather_code[from + i],
    }));
  }, [weather, now]);

  useWeatherCanvas(canvasRef, group, weather?.current?.wind_speed_10m || 0);

  const bgStyle = {
    background: `linear-gradient(180deg, ${theme.grad[0]} 0%, ${theme.grad[1]} 55%, ${theme.grad[2]} 100%)`,
    color: theme.text,
  };

  return (
    <div className="min-h-screen w-full relative overflow-hidden transition-colors duration-700" style={bgStyle}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap');
        .font-display { font-family: 'Space Grotesk', sans-serif; }
        .font-body { font-family: 'Inter', sans-serif; }
        html, body, #root { height: 100%; }
      `}</style>

      {/* Unique feature: live canvas sky (rain / snow / fog / drifting clouds) */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

      <div className="relative z-10 font-body max-w-md mx-auto px-5 py-8 min-h-screen flex flex-col">

        {/* Search */}
        <form
          onSubmit={(e) => { e.preventDefault(); if (query.trim()) search(query.trim()); }}
          className="flex items-center gap-2 mb-8"
        >
          <div
            className="flex-1 flex items-center gap-2 rounded-full px-4 py-2.5 backdrop-blur-md"
            style={{ background: "rgba(255,255,255,0.18)", border: "1px solid rgba(255,255,255,0.3)" }}
          >
            <Search className="w-4 h-4 shrink-0" style={{ color: theme.text, opacity: 0.7 }} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search a city..."
              className="bg-transparent outline-none w-full text-sm placeholder:opacity-60"
              style={{ color: theme.text }}
            />
          </div>
          <button
            type="submit"
            className="shrink-0 rounded-full px-4 py-2.5 text-sm font-medium backdrop-blur-md transition-transform active:scale-95"
            style={{ background: theme.accent, color: theme.grad[0] }}
          >
            Go
          </button>
        </form>

        {loading && (
          <div className="flex-1 flex items-center justify-center py-24">
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: theme.text }} />
          </div>
        )}

        {!loading && error && (
          <div className="rounded-2xl px-4 py-3 text-sm backdrop-blur-md" style={{ background: "rgba(0,0,0,0.15)" }}>
            {error}
          </div>
        )}

        {!loading && !error && weather && place && (
          <>
            <div className="flex items-center gap-1.5 text-sm opacity-80 mb-1">
              <MapPin className="w-3.5 h-3.5" />
              {place.name}{place.admin1 ? `, ${place.admin1}` : ""}{place.country ? `, ${place.country}` : ""}
            </div>

            <div className="flex items-start justify-between">
              <div>
                <div className="font-display text-7xl font-semibold leading-none tabular-nums">
                  {Math.round(weather.current.temperature_2m)}°
                </div>
                <div className="text-sm mt-2 opacity-90">
                  {codeLabel[group]} · Feels like {Math.round(weather.current.apparent_temperature)}°
                </div>
                <div className="text-xs mt-1 opacity-70">
                  H {Math.round(weather.daily.temperature_2m_max[0])}° &nbsp;L {Math.round(weather.daily.temperature_2m_min[0])}°
                </div>
              </div>
              <IconFor group={group} isDay={isDay} className="w-16 h-16 mt-1" style={{ color: theme.accent }} />
            </div>

            <div className="mt-6 flex justify-center">
              <DayArc sunrise={sunrise} sunset={sunset} now={now} isDay={isDay} accent={theme.accent} text={theme.text} />
            </div>

            <div className="grid grid-cols-2 gap-3 mt-6">
              <div className="rounded-2xl px-4 py-3 backdrop-blur-md" style={{ background: "rgba(255,255,255,0.14)" }}>
                <div className="flex items-center gap-1.5 text-xs opacity-75 mb-1">
                  <Droplets className="w-3.5 h-3.5" /> Humidity
                </div>
                <div className="font-display text-xl font-medium">{weather.current.relative_humidity_2m}%</div>
              </div>
              <div className="rounded-2xl px-4 py-3 backdrop-blur-md" style={{ background: "rgba(255,255,255,0.14)" }}>
                <div className="flex items-center gap-1.5 text-xs opacity-75 mb-1">
                  <Wind className="w-3.5 h-3.5" /> Wind
                </div>
                <div className="font-display text-xl font-medium">{Math.round(weather.current.wind_speed_10m)} km/h</div>
              </div>
            </div>

            {/* Unique feature: draggable hourly scrubber */}
            {hourly.length > 1 && (
              <div className="mt-6 rounded-2xl px-4 py-3 backdrop-blur-md" style={{ background: "rgba(255,255,255,0.14)" }}>
                <div className="text-xs opacity-75 mb-2">Drag to preview the next 24 hours</div>
                <HourlyScrubber hours={hourly} accent={theme.accent} text={theme.text} onScrub={setScrubIdx} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
