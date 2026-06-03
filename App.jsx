import { useState, useEffect, useRef, useCallback } from "react";

// This safely points to your hidden environment folder instead of exposing your key!
const API_TOKEN = process.env.REACT_APP_TMDB_API_TOKEN;

const BASE = "https://api.themoviedb.org/3";
const IMG = "https://image.tmdb.org/t/p";
const HEADERS = { Authorization: `Bearer ${API_TOKEN}`, "Content-Type": "application/json" };

const fetcher = (url) => fetch(url, { headers: HEADERS }).then((r) => r.json());

function useLocalStorage(key, init) {
  const [val, setVal] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(key)) ?? init;
    } catch {
      return init;
    }
  });
  const write = useCallback(
    (v) => {
      setVal(v);
      localStorage.setItem(key, JSON.stringify(v));
    },
    [key]
  );
  return [val, write];
}

const GENRE_MAP = {
  28: "Action", 12: "Adventure", 16: "Animation", 35: "Comedy", 80: "Crime",
  99: "Documentary", 18: "Drama", 10751: "Family", 14: "Fantasy", 36: "History",
  27: "Horror", 10402: "Music", 9648: "Mystery", 10749: "Romance", 878: "Sci-Fi",
  53: "Thriller", 10752: "War", 37: "Western",
};

const FEATURED_GENRES = [28, 27, 878, 35, 18, 53, 10749, 16];

const SECTION_ACCENTS = {
  "Now Playing":        "#21D07A",
  "Trending This Week": "#E6B31E",
  "Popular Right Now":  "#E74C3C",
  "All-Time Greatest":  "#3498DB",
  "Coming Soon":        "#9B59B6",
};

function css(strings, ...vals) {
  return strings.reduce((acc, s, i) => acc + s + (vals[i] ?? ""), "");
}

function ScoreBadge({ score }) {
  const pct = Math.round((score || 0) * 10);
  const color = pct >= 70 ? "#21D07A" : pct >= 50 ? "#D2D531" : "#DB2360";
  return (
    <div
      style={{
        width: 44, height: 44, borderRadius: "50%",
        background: "rgba(8,28,34,0.85)",
        border: `2.5px solid ${color}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <span style={{ fontSize: 12, fontWeight: 700, color, letterSpacing: "-0.02em" }}>
        {pct}<sup style={{ fontSize: 8 }}>%</sup>
      </span>
    </div>
  );
}

function StarRating({ value, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display: "flex", gap: 6 }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <svg
          key={s}
          width="22" height="22" viewBox="0 0 24 24"
          style={{ cursor: "pointer", transition: "all 0.15s" }}
          onClick={() => onChange(s)}
          onMouseEnter={() => setHover(s)}
          onMouseLeave={() => setHover(0)}
        >
          <path
            d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
            fill={s <= (hover || value) ? "#E6B31E" : "none"}
            stroke={s <= (hover || value) ? "#E6B31E" : "#444"}
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
      ))}
    </div>
  );
}

function Pill({ children, active, onClick, accent }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: active
          ? accent
          : hov
          ? "rgba(255,255,255,0.1)"
          : "rgba(255,255,255,0.06)",
        border: `1px solid ${active ? accent : "rgba(255,255,255,0.12)"}`,
        color: active ? "#000" : "#ccc",
        borderRadius: 20,
        padding: "6px 18px",
        cursor: "pointer",
        fontSize: 13,
        fontWeight: 600,
        letterSpacing: "0.01em",
        transition: "all 0.2s",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </button>
  );
}

function MovieCard({ movie, onClick, isInWatchlist, onWatchlistToggle }) {
  const [hov, setHov] = useState(false);
  const poster = movie.poster_path ? `${IMG}/w342${movie.poster_path}` : null;
  const year = movie.release_date?.slice(0, 4);

  return (
    <div
      onClick={() => onClick(movie)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        position: "relative",
        cursor: "pointer",
        borderRadius: 10,
        overflow: "hidden",
        background: "#111",
        transform: hov ? "scale(1.045) translateY(-5px)" : "scale(1)",
        transition: "transform 0.28s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.28s",
        boxShadow: hov
          ? "0 24px 64px rgba(0,0,0,0.75)"
          : "0 4px 20px rgba(0,0,0,0.45)",
        zIndex: hov ? 2 : 1,
      }}
    >
      <div style={{ aspectRatio: "2/3", background: "#0d0d0d" }}>
        {poster ? (
          <img
            src={poster} alt={movie.title} loading="lazy"
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", padding: 12, textAlign: "center" }}>
            <span style={{ color: "#555", fontSize: 12, lineHeight: 1.4 }}>{movie.title}</span>
          </div>
        )}
      </div>

      <div
        style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.5) 50%, transparent 100%)",
          opacity: hov ? 1 : 0,
          transition: "opacity 0.22s",
          display: "flex", flexDirection: "column", justifyContent: "flex-end",
          padding: "10px 10px 10px",
        }}
      >
        <p style={{ color: "#fff", fontSize: 12, fontWeight: 600, margin: "0 0 5px", lineHeight: 1.3 }}>
          {movie.title}
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {year && <span style={{ color: "#999", fontSize: 11 }}>{year}</span>}
          <span style={{ color: "#E6B31E", fontSize: 11, fontWeight: 700 }}>
            {movie.vote_average?.toFixed(1)}
          </span>
        </div>
      </div>

      <button
        onClick={(e) => { e.stopPropagation(); onWatchlistToggle(movie); }}
        style={{
          position: "absolute", top: 8, right: 8,
          background: isInWatchlist ? "#E6B31E" : "rgba(0,0,0,0.65)",
          backdropFilter: "blur(6px)",
          border: `1px solid ${isInWatchlist ? "#E6B31E" : "rgba(255,255,255,0.2)"}`,
          borderRadius: "50%", width: 28, height: 28,
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", transition: "all 0.2s",
          opacity: hov ? 1 : 0,
          color: isInWatchlist ? "#000" : "#fff",
          fontSize: 15, fontWeight: 700,
        }}
      >
        {isInWatchlist ? "✓" : "+"}
      </button>
    </div>
  );
}

function HeroSlider({ movies, onMovieClick }) {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const timer = useRef(null);

  const goTo = useCallback((i) => {
    setVisible(false);
    setTimeout(() => { setIndex(i); setVisible(true); }, 350);
  }, []);

  useEffect(() => {
    if (!movies.length) return;
    timer.current = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((p) => (p + 1) % Math.min(movies.length, 8));
        setVisible(true);
      }, 350);
    }, 7000);
    return () => clearInterval(timer.current);
  }, [movies.length]);

  const movie = movies[index];
  if (!movie) return <div style={{ height: "90vh", background: "#060606" }} />;

  const backdrop = movie.backdrop_path ? `${IMG}/original${movie.backdrop_path}` : null;
  const year = movie.release_date?.slice(0, 4);
  const genres = (movie.genre_ids || []).slice(0, 3).map((id) => GENRE_MAP[id]).filter(Boolean);

  return (
    <div style={{ position: "relative", height: "92vh", minHeight: 560, overflow: "hidden", background: "#050505" }}>
      {backdrop && (
        <div
          key={movie.id}
          style={{ position: "absolute", inset: 0, opacity: visible ? 1 : 0, transition: "opacity 0.45s ease" }}
        >
          <img
            src={backdrop} alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top center" }}
          />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(105deg, rgba(5,5,5,0.98) 0%, rgba(5,5,5,0.72) 45%, rgba(5,5,5,0.18) 100%)" }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(5,5,5,1) 0%, transparent 45%)" }} />
        </div>
      )}

      <div
        style={{
          position: "absolute", bottom: "10%", left: 0, padding: "0 5%",
          maxWidth: 640,
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(14px)",
          transition: "opacity 0.45s ease, transform 0.45s ease",
        }}
      >
        {genres.length > 0 && (
          <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
            {genres.map((g) => (
              <span key={g} style={{
                fontSize: 10, fontWeight: 700, letterSpacing: "0.12em",
                textTransform: "uppercase", color: "#E6B31E",
                border: "1px solid rgba(230,179,30,0.35)",
                padding: "3px 10px", borderRadius: 3,
              }}>{g}</span>
            ))}
          </div>
        )}

        <h1
          style={{
            fontSize: "clamp(30px, 4.5vw, 58px)", fontWeight: 800,
            color: "#fff", margin: "0 0 14px", lineHeight: 1.08,
            fontFamily: "'Cormorant Garamond', serif",
            letterSpacing: "-0.02em",
          }}
        >
          {movie.title}
        </h1>

        <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 18 }}>
          <ScoreBadge score={movie.vote_average} />
          <div>
            <p style={{ color: "#999", fontSize: 11, margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.08em" }}>User Score</p>
            <p style={{ color: "#E6B31E", fontWeight: 700, margin: 0, fontSize: 14 }}>
              {movie.vote_average?.toFixed(1)} / 10
            </p>
          </div>
          {year && <span style={{ color: "#777", fontSize: 14, borderLeft: "1px solid #333", paddingLeft: 18 }}>{year}</span>}
        </div>

        <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 15, lineHeight: 1.75, margin: "0 0 28px", maxWidth: 500 }}>
          {(movie.overview || "").slice(0, 180)}{(movie.overview || "").length > 180 ? "…" : ""}
        </p>

        <button
          onClick={() => onMovieClick(movie)}
          style={{
            background: "#fff", color: "#000",
            border: "none", borderRadius: 8,
            padding: "13px 36px", fontSize: 14, fontWeight: 700,
            cursor: "pointer", letterSpacing: "0.04em",
            transition: "background 0.18s, transform 0.18s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "#E6B31E"; e.currentTarget.style.transform = "scale(1.03)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.transform = "scale(1)"; }}
        >
          View Details
        </button>
      </div>

      <div style={{ position: "absolute", bottom: "8%", right: "5%", display: "flex", gap: 8 }}>
        {movies.slice(0, 8).map((_, i) => (
          <button
            key={i} onClick={() => goTo(i)}
            style={{
              width: i === index ? 24 : 7, height: 7,
              borderRadius: 4, border: "none",
              background: i === index ? "#E6B31E" : "rgba(255,255,255,0.25)",
              cursor: "pointer", transition: "all 0.3s", padding: 0,
            }}
          />
        ))}
      </div>
    </div>
  );
}

function MovieRow({ title, movies, onMovieClick, watchlist, onWatchlistToggle }) {
  const rowRef = useRef(null);
  const accent = SECTION_ACCENTS[title] || "#E6B31E";

  const scroll = (dir) => rowRef.current?.scrollBy({ left: dir * 300, behavior: "smooth" });

  return (
    <div style={{ marginBottom: 52 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "0 5%", marginBottom: 18 }}>
        <span style={{ width: 3, height: 22, background: accent, borderRadius: 2, flexShrink: 0 }} />
        <h3 style={{
          color: "#f0f0f0", fontSize: 19, fontWeight: 700, margin: 0,
          fontFamily: "'Cormorant Garamond', serif", letterSpacing: "0.01em",
        }}>{title}</h3>
        <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
          {["\u2039", "\u203a"].map((arrow, i) => (
            <button
              key={arrow} onClick={() => scroll(i === 0 ? -1 : 1)}
              style={{
                background: "rgba(255,255,255,0.07)",
                border: "1px solid rgba(255,255,255,0.12)",
                color: "#fff", width: 30, height: 30, borderRadius: "50%",
                cursor: "pointer", fontSize: 18, display: "flex",
                alignItems: "center", justifyContent: "center", transition: "all 0.2s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.18)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.07)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"; }}
            >{arrow}</button>
          ))}
        </div>
      </div>

      <div
        ref={rowRef}
        style={{ display: "flex", gap: 12, padding: "10px 5%", overflowX: "auto", scrollbarWidth: "none" }}
      >
        {movies.map((m) => (
          <div key={m.id} style={{ flexShrink: 0, width: 158 }}>
            <MovieCard
              movie={m}
              onClick={onMovieClick}
              isInWatchlist={watchlist.some((w) => w.id === m.id)}
              onWatchlistToggle={onWatchlistToggle}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function CastCard({ person }) {
  const photo = person.profile_path ? `${IMG}/w185${person.profile_path}` : null;
  return (
    <div style={{ flexShrink: 0, width: 108, textAlign: "center" }}>
      <div style={{
        width: 72, height: 72, borderRadius: "50%", overflow: "hidden",
        margin: "0 auto 10px", background: "#1c1c1e",
        border: "1.5px solid rgba(255,255,255,0.1)",
      }}>
        {photo ? (
          <img src={photo} alt={person.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#444" strokeWidth="1.5">
              <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
            </svg>
          </div>
        )}
      </div>
      <p style={{ color: "#e0e0e0", fontSize: 11, fontWeight: 600, margin: "0 0 3px", lineHeight: 1.3 }}>{person.name}</p>
      <p style={{ color: "#666", fontSize: 10, margin: 0, lineHeight: 1.3 }}>{person.character}</p>
    </div>
  );
}

function MovieModal({ movieId, onClose, watchlist, onWatchlistToggle, reviews, onAddReview }) {
  const [movie, setMovie] = useState(null);
  const [credits, setCredits] = useState(null);
  const [similar, setSimilar] = useState([]);
  const [reviewText, setReviewText] = useState("");
  const [reviewRating, setReviewRating] = useState(0);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("about");
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!movieId) return;
    setLoading(true);
    setTab("about");
    setMovie(null);
    wrapRef.current?.scrollTo(0, 0);
    Promise.all([
      fetcher(`${BASE}/movie/${movieId}?language=en-US`),
      fetcher(`${BASE}/movie/${movieId}/credits?language=en-US`),
      fetcher(`${BASE}/movie/${movieId}/similar?language=en-US&page=1`),
    ]).then(([m, c, s]) => {
      setMovie(m);
      setCredits(c);
      setSimilar((s.results || []).slice(0, 14));
      setLoading(false);
    });
  }, [movieId]);

  const submitReview = () => {
    if (!reviewText.trim() || !reviewRating) return;
    onAddReview(movieId, { text: reviewText, rating: reviewRating, date: new Date().toLocaleDateString() });
    setReviewText("");
    setReviewRating(0);
  };

  const movieReviews = reviews[movieId] || [];
  const isWatchlisted = watchlist.some((w) => w.id === movieId);
  const TABS = ["about", "cast", "reviews", "similar"];

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0,
        background: "rgba(0,0,0,0.82)",
        backdropFilter: "blur(14px)",
        zIndex: 1000,
        display: "flex", alignItems: "flex-start", justifyContent: "center",
        padding: "24px 16px", overflowY: "auto",
      }}
    >
      <div
        ref={wrapRef}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#111113",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 16,
          width: "100%", maxWidth: 920, overflow: "hidden",
          boxShadow: "0 48px 130px rgba(0,0,0,0.95)",
          animation: "modalIn 0.32s cubic-bezier(0.34,1.1,0.64,1)",
        }}
      >
        <style>{`@keyframes modalIn { from { opacity: 0; transform: translateY(36px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }`}</style>

        {loading ? (
          <div style={{ height: 420, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{
              width: 36, height: 36,
              border: "3px solid rgba(255,255,255,0.1)",
              borderTopColor: "#E6B31E",
              borderRadius: "50%",
              animation: "spin 0.75s linear infinite",
            }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : movie ? (
          <>
            <div style={{ position: "relative", height: 340, background: "#0a0a0a", overflow: "hidden" }}>
              {movie.backdrop_path && (
                <>
                  <img
                    src={`${IMG}/original${movie.backdrop_path}`} alt=""
                    style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }}
                  />
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(17,17,19,0) 0%, rgba(17,17,19,0.75) 65%, rgba(17,17,19,1) 100%)" }} />
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, rgba(17,17,19,0.75) 0%, transparent 55%)" }} />
                </>
              )}

              <button
                onClick={onClose}
                style={{
                  position: "absolute", top: 14, right: 14,
                  background: "rgba(0,0,0,0.55)",
                  backdropFilter: "blur(8px)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  color: "#ccc", borderRadius: "50%",
                  width: 34, height: 34, cursor: "pointer",
                  fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.18s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = "#fff"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.35)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "#ccc"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"; }}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="1" y1="1" x2="13" y2="13" /><line x1="13" y1="1" x2="1" y2="13" />
                </svg>
              </button>

              <div style={{ position: "absolute", bottom: 22, left: 24, right: 24 }}>
                <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
                  {movie.genres?.map((g) => (
                    <span key={g.id} style={{
                      fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
                      color: "#E6B31E", border: "1px solid rgba(230,179,30,0.35)",
                      padding: "3px 10px", borderRadius: 3,
                    }}>{g.name}</span>
                  ))}
                </div>
                <h2 style={{
                  color: "#fff", fontSize: 30, fontWeight: 800, margin: "0 0 14px",
                  fontFamily: "'Cormorant Garamond', serif", lineHeight: 1.1, letterSpacing: "-0.02em",
                }}>
                  {movie.title}
                </h2>
                <div style={{ display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" }}>
                  <ScoreBadge score={movie.vote_average} />
                  <div>
                    <p style={{ color: "#777", fontSize: 10, margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.1em" }}>Score</p>
                    <p style={{ color: "#E6B31E", fontWeight: 700, margin: 0, fontSize: 13 }}>{movie.vote_average?.toFixed(1)} / 10</p>
                  </div>
                  {movie.release_date && <span style={{ color: "#777", fontSize: 13 }}>{movie.release_date.slice(0, 4)}</span>}
                  {movie.runtime > 0 && (
                    <span style={{ color: "#777", fontSize: 13 }}>{Math.floor(movie.runtime / 60)}h {movie.runtime % 60}m</span>
                  )}
                  {movie.vote_count > 0 && (
                    <span style={{ color: "#555", fontSize: 12 }}>{movie.vote_count.toLocaleString()} votes</span>
                  )}
                  <button
                    onClick={() => onWatchlistToggle(movie)}
                    style={{
                      background: isWatchlisted ? "#E6B31E" : "rgba(255,255,255,0.08)",
                      backdropFilter: "blur(8px)",
                      border: `1px solid ${isWatchlisted ? "#E6B31E" : "rgba(255,255,255,0.2)"}`,
                      color: isWatchlisted ? "#000" : "#fff",
                      borderRadius: 8, padding: "8px 20px", cursor: "pointer",
                      fontWeight: 600, fontSize: 12, letterSpacing: "0.03em",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => { if (!isWatchlisted) { e.currentTarget.style.borderColor = "#E6B31E"; e.currentTarget.style.color = "#E6B31E"; } }}
                    onMouseLeave={(e) => { if (!isWatchlisted) { e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)"; e.currentTarget.style.color = "#fff"; } }}
                  >
                    {isWatchlisted ? "✓ In Watchlist" : "+ Watchlist"}
                  </button>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,0.08)", padding: "0 24px" }}>
              {TABS.map((t) => (
                <button
                  key={t} onClick={() => setTab(t)}
                  style={{
                    background: "none", border: "none",
                    color: tab === t ? "#fff" : "#555",
                    borderBottom: tab === t ? "2px solid #E6B31E" : "2px solid transparent",
                    padding: "14px 20px", cursor: "pointer", fontWeight: 600,
                    fontSize: 13, textTransform: "capitalize", letterSpacing: "0.04em",
                    transition: "color 0.18s",
                  }}
                  onMouseEnter={(e) => { if (tab !== t) e.currentTarget.style.color = "#aaa"; }}
                  onMouseLeave={(e) => { if (tab !== t) e.currentTarget.style.color = "#555"; }}
                >{t}</button>
              ))}
            </div>

            <div style={{ padding: "28px 24px", minHeight: 300 }}>
              {tab === "about" && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 36 }}>
                  <div>
                    <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 14, lineHeight: 1.85, margin: "0 0 22px" }}>
                      {movie.overview || "No overview available."}
                    </p>
                    {movie.tagline && (
                      <p style={{
                        color: "#E6B31E", fontStyle: "italic", fontSize: 14,
                        borderLeft: "2px solid #E6B31E", paddingLeft: 16, margin: 0,
                        fontFamily: "'Cormorant Garamond', serif",
                      }}>
                        "{movie.tagline}"
                      </p>
                    )}
                  </div>
                  <div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      {[
                        ["Status", movie.status],
                        ["Language", movie.original_language?.toUpperCase()],
                        ["Budget", movie.budget > 0 ? `$${(movie.budget / 1e6).toFixed(0)}M` : "N/A"],
                        ["Revenue", movie.revenue > 0 ? `$${(movie.revenue / 1e6).toFixed(0)}M` : "N/A"],
                      ].filter(([, v]) => v).map(([label, value]) => (
                        <div key={label} style={{
                          background: "rgba(255,255,255,0.04)",
                          border: "1px solid rgba(255,255,255,0.08)",
                          borderRadius: 10, padding: "14px 16px",
                        }}>
                          <p style={{ color: "#555", fontSize: 10, margin: "0 0 5px", textTransform: "uppercase", letterSpacing: "0.1em" }}>{label}</p>
                          <p style={{ color: "#fff", fontWeight: 600, margin: 0, fontSize: 14 }}>{value}</p>
                        </div>
                      ))}
                    </div>
                    {movie.production_companies?.length > 0 && (
                      <div style={{ marginTop: 18 }}>
                        <p style={{ color: "#555", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 10px" }}>Production</p>
                        {movie.production_companies.slice(0, 4).map((c) => (
                          <span key={c.id} style={{
                            display: "inline-block", fontSize: 12, color: "#999",
                            background: "rgba(255,255,255,0.05)",
                            border: "1px solid rgba(255,255,255,0.09)",
                            borderRadius: 5, padding: "3px 10px",
                            marginRight: 6, marginBottom: 6,
                          }}>{c.name}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {tab === "cast" && (
                <div>
                  <div style={{ display: "flex", gap: 20, overflowX: "auto", padding: "4px 0 16px", scrollbarWidth: "none" }}>
                    {credits?.cast?.slice(0, 20).map((p) => <CastCard key={p.id} person={p} />)}
                  </div>
                  {credits?.crew?.filter((c) => ["Director", "Producer", "Screenplay"].includes(c.job)).length > 0 && (
                    <div style={{ marginTop: 24, borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: 24 }}>
                      <p style={{ color: "#555", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 16px" }}>Crew Highlights</p>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                        {credits.crew
                          .filter((c) => ["Director", "Producer", "Screenplay"].includes(c.job))
                          .slice(0, 8)
                          .map((p) => (
                            <div key={`${p.id}-${p.job}`} style={{
                              background: "rgba(255,255,255,0.04)",
                              border: "1px solid rgba(255,255,255,0.08)",
                              borderRadius: 8, padding: "10px 14px",
                            }}>
                              <p style={{ color: "#e0e0e0", fontWeight: 600, fontSize: 13, margin: "0 0 3px" }}>{p.name}</p>
                              <p style={{ color: "#E6B31E", fontSize: 11, margin: 0 }}>{p.job}</p>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {tab === "reviews" && (
                <div>
                  <div style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 12, padding: 20, marginBottom: 28,
                  }}>
                    <p style={{ color: "#777", fontSize: 12, margin: "0 0 14px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Your Review</p>
                    <StarRating value={reviewRating} onChange={setReviewRating} />
                    <textarea
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                      placeholder="Share your thoughts on this film..."
                      style={{
                        width: "100%", marginTop: 14,
                        background: "rgba(0,0,0,0.4)",
                        border: "1px solid rgba(255,255,255,0.12)",
                        borderRadius: 8, color: "#e0e0e0", fontSize: 14,
                        padding: "12px 14px", resize: "vertical", minHeight: 90,
                        outline: "none", fontFamily: "inherit",
                        boxSizing: "border-box", lineHeight: 1.6,
                      }}
                      onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(230,179,30,0.5)"; }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"; }}
                    />
                    <button
                      onClick={submitReview}
                      style={{
                        marginTop: 12, background: "#E6B31E", border: "none",
                        color: "#000", padding: "10px 26px", borderRadius: 7,
                        cursor: "pointer", fontWeight: 700, fontSize: 13, letterSpacing: "0.03em",
                        transition: "all 0.18s",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "#f5c842"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "#E6B31E"; }}
                    >Post Review</button>
                  </div>

                  {movieReviews.length === 0 ? (
                    <p style={{ color: "#444", textAlign: "center", padding: "32px 0", fontSize: 14 }}>No reviews yet. Be the first to write one.</p>
                  ) : movieReviews.map((r, i) => (
                    <div key={i} style={{
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.07)",
                      borderRadius: 10, padding: "18px 20px", marginBottom: 12,
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                        <div style={{
                          width: 34, height: 34, borderRadius: "50%",
                          background: "rgba(230,179,30,0.15)",
                          border: "1px solid rgba(230,179,30,0.3)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          color: "#E6B31E", fontWeight: 700, fontSize: 12,
                        }}>
                          {i + 1}
                        </div>
                        <div>
                          <div style={{ display: "flex", gap: 2, marginBottom: 2 }}>
                            {[1, 2, 3, 4, 5].map((s) => (
                              <svg key={s} width="13" height="13" viewBox="0 0 24 24">
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                                  fill={s <= r.rating ? "#E6B31E" : "none"}
                                  stroke={s <= r.rating ? "#E6B31E" : "#444"}
                                  strokeWidth="1.5" strokeLinejoin="round" />
                              </svg>
                            ))}
                          </div>
                          <p style={{ color: "#555", fontSize: 11, margin: 0 }}>{r.date}</p>
                        </div>
                      </div>
                      <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 14, lineHeight: 1.75, margin: 0 }}>{r.text}</p>
                    </div>
                  ))}
                </div>
              )}

              {tab === "similar" && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 12 }}>
                  {similar.length === 0 ? (
                    <p style={{ color: "#444", gridColumn: "1/-1", textAlign: "center", padding: 40, fontSize: 14 }}>No similar movies found.</p>
                  ) : similar.map((m) => (
                    <MovieCard
                      key={m.id} movie={m}
                      onClick={(mv) => { setMovie(null); setLoading(true); setTab("about"); Promise.all([fetcher(`${BASE}/movie/${mv.id}?language=en-US`), fetcher(`${BASE}/movie/${mv.id}/credits?language=en-US`), fetcher(`${BASE}/movie/${mv.id}/similar?language=en-US&page=1`)]).then(([mm, c, s]) => { setMovie(mm); setCredits(c); setSimilar((s.results || []).slice(0, 14)); setLoading(false); }); }}
                      isInWatchlist={watchlist.some((w) => w.id === m.id)}
                      onWatchlistToggle={onWatchlistToggle}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

function SearchOverlay({ onClose, onMovieClick, watchlist, onWatchlistToggle }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (!query.trim()) { setResults([]); return; }
    setLoading(true);
    debounceRef.current = setTimeout(() => {
      fetcher(`${BASE}/search/movie?query=${encodeURIComponent(query)}&language=en-US&page=1`)
        .then((d) => { setResults((d.results || []).slice(0, 20)); setLoading(false); });
    }, 380);
  }, [query]);

  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0,
        background: "rgba(0,0,0,0.93)",
        backdropFilter: "blur(20px)",
        zIndex: 2000, overflowY: "auto",
      }}
    >
      <div onClick={(e) => e.stopPropagation()} style={{ maxWidth: 820, margin: "0 auto", padding: "64px 20px 48px" }}>
        <div style={{ position: "relative", marginBottom: 44 }}>
          <svg
            style={{ position: "absolute", left: 18, top: "50%", transform: "translateY(-50%)" }}
            width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round"
          >
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search films..."
            style={{
              width: "100%",
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.15)",
              color: "#fff", fontSize: 20, padding: "16px 52px",
              borderRadius: 12, outline: "none",
              fontFamily: "inherit", boxSizing: "border-box",
              transition: "border-color 0.18s",
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(230,179,30,0.5)"; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"; }}
          />
          <button
            onClick={onClose}
            style={{
              position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)",
              background: "none", border: "none", color: "#555", cursor: "pointer", padding: 4,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="1" y1="1" x2="13" y2="13" /><line x1="13" y1="1" x2="1" y2="13" />
            </svg>
          </button>
        </div>

        {loading && (
          <div style={{ display: "flex", justifyContent: "center", padding: "20px 0" }}>
            <div style={{ width: 28, height: 28, border: "2.5px solid rgba(255,255,255,0.1)", borderTopColor: "#E6B31E", borderRadius: "50%", animation: "spin3 0.75s linear infinite" }} />
            <style>{`@keyframes spin3 { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(136px, 1fr))", gap: 14 }}>
          {results.map((m) => (
            <MovieCard
              key={m.id} movie={m}
              onClick={(mv) => { onMovieClick(mv); onClose(); }}
              isInWatchlist={watchlist.some((w) => w.id === m.id)}
              onWatchlistToggle={onWatchlistToggle}
            />
          ))}
        </div>

        {!loading && query && results.length === 0 && (
          <p style={{ color: "#444", textAlign: "center", padding: "48px 0", fontSize: 15 }}>No results for "{query}"</p>
        )}
      </div>
    </div>
  );
}

function WatchlistPanel({ watchlist, onClose, onMovieClick, onRemove }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(10px)", zIndex: 1500, display: "flex", justifyContent: "flex-end" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(400px, 100%)", background: "#0e0e10",
          borderLeft: "1px solid rgba(255,255,255,0.09)",
          height: "100%", overflowY: "auto", padding: "28px 22px",
          boxShadow: "-32px 0 80px rgba(0,0,0,0.9)",
          animation: "slideIn 0.28s cubic-bezier(0.34,1.1,0.64,1)",
        }}
      >
        <style>{`@keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }`}</style>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
          <div>
            <h3 style={{ color: "#fff", fontSize: 20, fontWeight: 700, margin: "0 0 3px", fontFamily: "'Cormorant Garamond', serif" }}>
              My Watchlist
            </h3>
            <p style={{ color: "#555", fontSize: 12, margin: 0 }}>{watchlist.length} film{watchlist.length !== 1 ? "s" : ""}</p>
          </div>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", color: "#555", cursor: "pointer", padding: 4 }}
          >
            <svg width="18" height="18" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="1" y1="1" x2="13" y2="13" /><line x1="13" y1="1" x2="1" y2="13" />
            </svg>
          </button>
        </div>

        {watchlist.length === 0 ? (
          <div style={{ textAlign: "center", padding: "64px 20px" }}>
            <svg style={{ marginBottom: 16, opacity: 0.2 }} width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.5">
              <rect x="2" y="2" width="20" height="20" rx="3" /><path d="M8 12h8M12 8v8" />
            </svg>
            <p style={{ color: "#444", fontSize: 14 }}>Your watchlist is empty</p>
            <p style={{ color: "#333", fontSize: 12 }}>Hover any poster and click + to add</p>
          </div>
        ) : watchlist.map((m) => {
          const poster = m.poster_path ? `${IMG}/w92${m.poster_path}` : null;
          return (
            <div
              key={m.id}
              style={{
                display: "flex", gap: 14, marginBottom: 14,
                cursor: "pointer", padding: "10px 12px",
                borderRadius: 10, transition: "background 0.18s",
                border: "1px solid transparent",
              }}
              onClick={() => { onMovieClick(m); onClose(); }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "transparent"; }}
            >
              <div style={{ width: 50, height: 74, borderRadius: 6, overflow: "hidden", flexShrink: 0, background: "#1a1a1e" }}>
                {poster
                  ? <img src={poster} alt={m.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <div style={{ width: "100%", height: "100%", background: "#1a1a2e" }} />
                }
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ color: "#e0e0e0", fontWeight: 600, margin: "0 0 5px", fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {m.title}
                </p>
                <p style={{ color: "#E6B31E", fontSize: 12, margin: "0 0 3px", fontWeight: 700 }}>
                  {m.vote_average?.toFixed(1)}
                </p>
                <p style={{ color: "#555", fontSize: 11, margin: 0 }}>{m.release_date?.slice(0, 4)}</p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); onRemove(m); }}
                style={{ background: "none", border: "none", color: "#444", cursor: "pointer", padding: "0 2px", alignSelf: "center", transition: "color 0.15s" }}
                onMouseEnter={(e) => { e.currentTarget.style.color = "#E6B31E"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "#444"; }}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="1" y1="1" x2="13" y2="13" /><line x1="13" y1="1" x2="1" y2="13" />
                </svg>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function App() {
  const [trending, setTrending]       = useState([]);
  const [popular, setPopular]         = useState([]);
  const [topRated, setTopRated]       = useState([]);
  const [upcoming, setUpcoming]       = useState([]);
  const [nowPlaying, setNowPlaying]   = useState([]);
  const [selectedId, setSelectedId]   = useState(null);
  const [searchOpen, setSearchOpen]   = useState(false);
  const [watchlistOpen, setWatchlistOpen] = useState(false);
  const [watchlist, setWatchlist]     = useLocalStorage("filmvault_watchlist_v2", []);
  const [reviews, setReviews]         = useLocalStorage("filmvault_reviews_v2", {});
  const [activeGenre, setActiveGenre] = useState(null);
  const [genreMovies, setGenreMovies] = useState([]);
  const [loadingGenre, setLoadingGenre] = useState(false);
  const [scrolled, setScrolled]       = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setSearchOpen(true); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    Promise.all([
      fetcher(`${BASE}/trending/movie/week?language=en-US`),
      fetcher(`${BASE}/movie/popular?language=en-US&page=1`),
      fetcher(`${BASE}/movie/top_rated?language=en-US&page=1`),
      fetcher(`${BASE}/movie/upcoming?language=en-US&page=1`),
      fetcher(`${BASE}/movie/now_playing?language=en-US&page=1`),
    ]).then(([tr, po, tp, up, np]) => {
      setTrending(tr.results || []);
      setPopular(po.results || []);
      setTopRated(tp.results || []);
      setUpcoming(up.results || []);
      setNowPlaying(np.results || []);
    });
  }, []);

  const toggleWatchlist = useCallback((movie) => {
    setWatchlist((prev) =>
      prev.some((w) => w.id === movie.id)
        ? prev.filter((w) => w.id !== movie.id)
        : [...prev, movie]
    );
  }, [setWatchlist]);

  const addReview = useCallback((movieId, review) => {
    setReviews((prev) => ({ ...prev, [movieId]: [...(prev[movieId] || []), review] }));
  }, [setReviews]);

  const handleGenre = (id) => {
    if (activeGenre === id) { setActiveGenre(null); setGenreMovies([]); return; }
    setActiveGenre(id);
    setLoadingGenre(true);
    fetcher(`${BASE}/discover/movie?with_genres=${id}&language=en-US&sort_by=popularity.desc`)
      .then((d) => { setGenreMovies(d.results || []); setLoadingGenre(false); });
  };

  return (
    <div style={{ background: "#060608", minHeight: "100vh", fontFamily: "'DM Sans', system-ui, sans-serif", color: "#fff" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@700;800&family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { display: none; }
        html { scroll-behavior: smooth; }
        ::selection { background: rgba(230,179,30,0.25); }
      `}</style>

      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 900,
        background: scrolled
          ? "rgba(6,6,8,0.92)"
          : "linear-gradient(to bottom, rgba(6,6,8,0.75), transparent)",
        backdropFilter: scrolled ? "blur(18px) saturate(180%)" : "none",
        borderBottom: scrolled ? "1px solid rgba(255,255,255,0.06)" : "none",
        transition: "all 0.3s ease",
        height: 62,
        display: "flex", alignItems: "center", padding: "0 5%", gap: 32,
      }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 1, marginRight: 8 }}>
          <span style={{ fontSize: 21, fontWeight: 800, fontFamily: "'Cormorant Garamond', serif", color: "#E6B31E", letterSpacing: "-0.03em" }}>FILM</span>
          <span style={{ fontSize: 21, fontWeight: 800, fontFamily: "'Cormorant Garamond', serif", color: "#fff", letterSpacing: "-0.03em" }}>VAULT</span>
        </div>

        <div style={{ display: "flex", gap: 2, flex: 1 }}>
          {["Home", "Movies"].map((label) => (
            <a
              key={label} href="#"
              style={{ color: "#888", textDecoration: "none", padding: "6px 12px", borderRadius: 7, fontSize: 13, fontWeight: 500, transition: "color 0.18s" }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "#fff"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "#888"; }}
            >{label}</a>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <button
            onClick={() => setSearchOpen(true)}
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "#888", borderRadius: 8,
              padding: "7px 14px", cursor: "pointer",
              display: "flex", alignItems: "center", gap: 10,
              fontSize: 13, transition: "all 0.18s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "#fff"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "#888"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <span style={{ color: "#555", fontSize: 11, fontFamily: "'DM Mono', monospace" }}>Ctrl K</span>
          </button>

          <button
            onClick={() => setWatchlistOpen(true)}
            style={{
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "#ccc", borderRadius: 8,
              padding: "7px 16px", cursor: "pointer",
              fontWeight: 600, fontSize: 13,
              display: "flex", alignItems: "center", gap: 9,
              transition: "all 0.18s", letterSpacing: "0.02em",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#E6B31E"; e.currentTarget.style.color = "#E6B31E"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"; e.currentTarget.style.color = "#ccc"; }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
              <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
            </svg>
            Watchlist
            {watchlist.length > 0 && (
              <span style={{
                background: "#E6B31E", color: "#000",
                borderRadius: 10, minWidth: 18, height: 18, padding: "0 5px",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 10, fontWeight: 800,
              }}>{watchlist.length}</span>
            )}
          </button>
        </div>
      </nav>

      <HeroSlider movies={trending} onMovieClick={(m) => setSelectedId(m.id)} />

      <div style={{ padding: "44px 5% 10px" }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {FEATURED_GENRES.map((id) => (
            <Pill
              key={id}
              active={activeGenre === id}
              onClick={() => handleGenre(id)}
              accent="#E6B31E"
            >
              {GENRE_MAP[id]}
            </Pill>
          ))}
        </div>
      </div>

      {activeGenre && (
        <div style={{ marginTop: 32 }}>
          {loadingGenre ? (
            <div style={{ height: 180, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ width: 30, height: 30, border: "2.5px solid rgba(255,255,255,0.08)", borderTopColor: "#E6B31E", borderRadius: "50%", animation: "spin4 0.75s linear infinite" }} />
              <style>{`@keyframes spin4 { to { transform: rotate(360deg); } }`}</style>
            </div>
          ) : (
            <MovieRow
              title={`${GENRE_MAP[activeGenre]} Films`}
              movies={genreMovies}
              onMovieClick={(m) => setSelectedId(m.id)}
              watchlist={watchlist}
              onWatchlistToggle={toggleWatchlist}
            />
          )}
        </div>
      )}

      <div style={{ paddingTop: 48 }}>
        <MovieRow title="Now Playing"        movies={nowPlaying}  onMovieClick={(m) => setSelectedId(m.id)} watchlist={watchlist} onWatchlistToggle={toggleWatchlist} />
        <MovieRow title="Trending This Week" movies={trending}    onMovieClick={(m) => setSelectedId(m.id)} watchlist={watchlist} onWatchlistToggle={toggleWatchlist} />
        <MovieRow title="Popular Right Now"  movies={popular}     onMovieClick={(m) => setSelectedId(m.id)} watchlist={watchlist} onWatchlistToggle={toggleWatchlist} />
        <MovieRow title="All-Time Greatest"  movies={topRated}    onMovieClick={(m) => setSelectedId(m.id)} watchlist={watchlist} onWatchlistToggle={toggleWatchlist} />
        <MovieRow title="Coming Soon"        movies={upcoming}    onMovieClick={(m) => setSelectedId(m.id)} watchlist={watchlist} onWatchlistToggle={toggleWatchlist} />
      </div>

      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.05)", padding: "36px 5%", marginTop: 32, textAlign: "center" }}>
        <p style={{ color: "#333", fontSize: 12, lineHeight: 1.8 }}>
          Data and images provided by{" "}
          <a href="https://www.themoviedb.org" target="_blank" rel="noreferrer" style={{ color: "#E6B31E", textDecoration: "none" }}>
            The Movie Database (TMDB)
          </a>
          . This product uses the TMDB API but is not endorsed or certified by TMDB.
        </p>
      </footer>

      {selectedId && (
        <MovieModal
          movieId={selectedId}
          onClose={() => setSelectedId(null)}
          watchlist={watchlist}
          onWatchlistToggle={toggleWatchlist}
          reviews={reviews}
          onAddReview={addReview}
        />
      )}
      {searchOpen && (
        <SearchOverlay
          onClose={() => setSearchOpen(false)}
          onMovieClick={(m) => setSelectedId(m.id)}
          watchlist={watchlist}
          onWatchlistToggle={toggleWatchlist}
        />
      )}
      {watchlistOpen && (
        <WatchlistPanel
          watchlist={watchlist}
          onClose={() => setWatchlistOpen(false)}
          onMovieClick={(m) => setSelectedId(m.id)}
          onRemove={toggleWatchlist}
        />
      )}
    </div>
  );
}
