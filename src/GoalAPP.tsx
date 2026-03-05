
// @ts-nocheck
import { useState, useEffect } from "react";

const todayISO = () => new Date().toISOString().split("T")[0];
const fmtDate  = (iso) => new Date(iso + "T00:00:00").toLocaleDateString("en-US", { weekday: "long",  month: "long",  day: "numeric" });
const fmtShort = (iso) => new Date(iso + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
const fmtDay   = (iso) => new Date(iso + "T00:00:00").toLocaleDateString("en-US", { weekday: "short" });

const SAMPLE_GOALS = [
  { id: 1, title: "Morning run",            icon: "🏃" },
  { id: 2, title: "Read 20 pages",          icon: "📚" },
  { id: 3, title: "Drink 8 glasses water",  icon: "💧" },
  { id: 4, title: "Save ₹100",             icon: "💰" },
];

const getLast14 = () => Array.from({ length: 14 }, (_, i) => {
  const d = new Date(); d.setDate(d.getDate() - 14 + i);
  return d.toISOString().split("T")[0];
});

export default function App() {
  const today = todayISO();

  // ── core state ──
  const [goals,          setGoals]          = useState(SAMPLE_GOALS);
  const [checks,         setChecks]         = useState({});
  const [newGoal,        setNewGoal]        = useState("");
  const [page,           setPage]           = useState("home"); // home | history | dashboard
  const [selectedDate,   setSelectedDate]   = useState(null);
  const [storageReady,   setStorageReady]   = useState(false);

  // ── edit / delete state ──
  const [editGoal,       setEditGoal]       = useState(null);   // full goal object being edited
  const [editTitle,      setEditTitle]      = useState("");
  const [editIcon,       setEditIcon]       = useState("");
  const [deleteGoalId,   setDeleteGoalId]   = useState(null);   // id pending confirmation

  // ── persist ──
  useEffect(() => {
    (async () => {
      try {
        const g = await window.storage.get("sg-goals");
        const c = await window.storage.get("sg-checks");
        if (g?.value) setGoals(JSON.parse(g.value));
        if (c?.value) setChecks(JSON.parse(c.value));
      } catch (_) {}
      setStorageReady(true);
    })();
  }, []);

  useEffect(() => {
    if (!storageReady) return;
    (async () => {
      try {
        await window.storage.set("sg-goals",  JSON.stringify(goals));
        await window.storage.set("sg-checks", JSON.stringify(checks));
      } catch (_) {}
    })();
  }, [goals, checks, storageReady]);

  // ── helpers ──
  const toggle  = (goalId, date) => setChecks(c => ({ ...c, [`${goalId}_${date}`]: !c[`${goalId}_${date}`] }));
  const isDone  = (goalId, date) => !!checks[`${goalId}_${date}`];
  const getScore = (date) => goals.length ? Math.round(goals.filter(g => isDone(g.id, date)).length / goals.length * 100) : 0;

  const addGoal = () => {
    if (!newGoal.trim()) return;
    setGoals(gs => [...gs, { id: Date.now(), title: newGoal.trim(), icon: "🎯" }]);
    setNewGoal("");
  };

  const openEdit = (g) => { setEditGoal(g); setEditTitle(g.title); setEditIcon(g.icon); };
  const saveEdit = () => {
    if (!editTitle.trim()) return;
    setGoals(gs => gs.map(g => g.id === editGoal.id ? { ...g, title: editTitle.trim(), icon: editIcon || g.icon } : g));
    setEditGoal(null);
  };

  const confirmAndDelete = () => {
    setGoals(gs => gs.filter(g => g.id !== deleteGoalId));
    setDeleteGoalId(null);
  };

  // ── dashboard data ──
  const allDates = [...new Set(Object.keys(checks).map(k => k.split("_")[1]))].sort();
  const last30   = Array.from({ length: 30 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - 29 + i); return d.toISOString().split("T")[0]; });
  const last14   = getLast14();
  const doneToday       = goals.filter(g => isDone(g.id, today)).length;
  const pct             = goals.length ? Math.round(doneToday / goals.length * 100) : 0;
  const totalTracked    = allDates.filter(d => goals.some(g => isDone(g.id, d))).length;
  const avgScore        = Math.round(last30.reduce((a, d) => a + getScore(d), 0) / last30.length);
  const bestStreak      = (() => { let max = 0, cur = 0; last30.forEach(d => { getScore(d) === 100 ? (cur++, max = Math.max(max, cur)) : (cur = 0); }); return max; })();

  // ── shared styles ──
  const card  = { background: "#fff", borderRadius: 18, padding: "1.1rem", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", marginBottom: "1.2rem" };
  const label = { fontSize: "0.7rem", fontWeight: 800, color: "#888", letterSpacing: "0.1em", marginBottom: "0.8rem" };
  const backBtnStyle = { background: "#fff", border: "1.5px solid #ede9fe", borderRadius: 10, padding: "0.45rem 0.85rem", cursor: "pointer", fontFamily: "inherit", fontWeight: 700, fontSize: "0.85rem", color: "#764ba2" };

  // ── Checkbox component ──
  const Checkbox = ({ goalId, date }) => {
    const done = isDone(goalId, date);
    return (
      <div onClick={() => toggle(goalId, date)} style={{
        width: 34, height: 34, borderRadius: 10, cursor: "pointer", flexShrink: 0,
        border: done ? "none" : "2px solid #a78bfa",
        background: done ? "linear-gradient(135deg,#667eea,#764ba2)" : "#faf5ff",
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "all 0.18s", boxShadow: done ? "0 3px 10px rgba(102,126,234,0.35)" : "none"
      }}>
        {done && <svg width="14" height="12" viewBox="0 0 14 12" fill="none"><path d="M1.5 6L5.5 10L12.5 1.5" stroke="white" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"/></svg>}
      </div>
    );
  };

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", minHeight: "100vh", background: "#f5f7ff", fontFamily: "'Segoe UI', sans-serif" }}>
      <style>{`* { box-sizing: border-box; margin: 0; padding: 0; } ::-webkit-scrollbar { display: none; } button:active { opacity: 0.82; }`}</style>

      {/* ════════════════════════════════════════
          HOME
      ════════════════════════════════════════ */}
      {page === "home" && (
        <div style={{ padding: "1.5rem 1rem 3rem" }}>

          {/* Header */}
          <div style={{ background: "linear-gradient(135deg,#667eea,#764ba2)", borderRadius: 20, padding: "1.4rem 1.5rem", color: "#fff", marginBottom: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: "0.72rem", opacity: 0.78, fontWeight: 600, marginBottom: 4 }}>{fmtDate(today).toUpperCase()}</div>
                <div style={{ fontSize: "1.6rem", fontWeight: 900 }}>My Goals ✅</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", alignItems: "flex-end" }}>
                <button onClick={() => setPage("dashboard")} style={{ background: "rgba(255,255,255,0.2)", border: "1.5px solid rgba(255,255,255,0.45)", borderRadius: 10, padding: "0.38rem 0.8rem", color: "#fff", cursor: "pointer", fontFamily: "inherit", fontWeight: 700, fontSize: "0.75rem" }}>📊 Dashboard</button>
                <button onClick={() => { setSelectedDate(null); setPage("history"); }} style={{ background: "rgba(255,255,255,0.2)", border: "1.5px solid rgba(255,255,255,0.45)", borderRadius: 10, padding: "0.38rem 0.8rem", color: "#fff", cursor: "pointer", fontFamily: "inherit", fontWeight: 700, fontSize: "0.75rem" }}>🗓 Fill History</button>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginTop: "0.9rem" }}>
              <div style={{ flex: 1, height: 10, background: "rgba(255,255,255,0.25)", borderRadius: 99, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${pct}%`, background: "#fff", borderRadius: 99, transition: "width 0.4s ease" }} />
              </div>
              <span style={{ fontSize: "0.85rem", fontWeight: 800, whiteSpace: "nowrap" }}>{doneToday}/{goals.length} done</span>
            </div>
          </div>

          {/* Goal list */}
          <div style={{ ...card, padding: "0.75rem 1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "0.5rem", borderBottom: "1px solid #f0eef8", marginBottom: "0.3rem" }}>
              <span style={{ fontSize: "0.7rem", fontWeight: 800, color: "#bbb", letterSpacing: "0.1em" }}>GOAL</span>
              <span style={{ fontSize: "0.7rem", fontWeight: 800, color: "#764ba2", letterSpacing: "0.1em" }}>TODAY ✓</span>
            </div>

            {goals.length === 0 && (
              <div style={{ textAlign: "center", color: "#ccc", padding: "2rem 0", fontSize: "0.9rem" }}>No goals yet. Add one below! 👇</div>
            )}

            {goals.map((g, idx) => {
              const done = isDone(g.id, today);
              return (
                <div key={g.id} style={{ display: "flex", alignItems: "center", gap: "0.5rem", borderTop: idx === 0 ? "none" : "1px solid #f5f5f5", padding: idx === 0 ? "0.4rem 0" : "0.6rem 0" }}>
                  {/* Icon + name */}
                  <span style={{ fontSize: "1.1rem", flexShrink: 0 }}>{g.icon}</span>
                  <span style={{ fontSize: "0.88rem", fontWeight: 600, color: done ? "#aaa" : "#2d1b69", textDecoration: done ? "line-through" : "none", lineHeight: 1.35, flex: 1, minWidth: 0, wordBreak: "break-word" }}>{g.title}</span>

                  {/* Small icon buttons */}
                  <button onClick={() => openEdit(g)} title="Edit" style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.95rem", padding: "2px 3px", lineHeight: 1, opacity: 0.55 }}
                    onMouseEnter={e => e.currentTarget.style.opacity = 1} onMouseLeave={e => e.currentTarget.style.opacity = 0.55}>✏️</button>
                  <button onClick={() => setDeleteGoalId(g.id)} title="Delete" style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.95rem", padding: "2px 3px", lineHeight: 1, opacity: 0.45 }}
                    onMouseEnter={e => e.currentTarget.style.opacity = 1} onMouseLeave={e => e.currentTarget.style.opacity = 0.45}>🗑</button>

                  {/* Checkbox */}
                  <Checkbox goalId={g.id} date={today} />
                </div>
              );
            })}
          </div>

          {/* Add goal */}
          <div style={{ background: "#fff", borderRadius: 16, padding: "0.85rem", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", display: "flex", gap: "0.6rem" }}>
            <input value={newGoal} onChange={e => setNewGoal(e.target.value)} onKeyDown={e => e.key === "Enter" && addGoal()}
              placeholder="Add a new goal..."
              style={{ flex: 1, border: "1.5px solid #ede9fe", borderRadius: 10, padding: "0.6rem 0.85rem", fontSize: "0.9rem", fontFamily: "inherit", color: "#2d1b69", outline: "none", background: "#faf9ff" }} />
            <button onClick={addGoal} style={{ background: "linear-gradient(135deg,#667eea,#764ba2)", color: "#fff", border: "none", borderRadius: 10, padding: "0.6rem 1.1rem", fontSize: "1.3rem", cursor: "pointer" }}>+</button>
          </div>
          <div style={{ textAlign: "center", marginTop: "0.85rem", fontSize: "0.7rem", color: "#ccc" }}>
            Tap ☐ to mark done • ✏️ to edit • 🗑 to delete
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════
          FILL HISTORY
      ════════════════════════════════════════ */}
      {page === "history" && (
        <div style={{ padding: "1.5rem 1rem 3rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.4rem" }}>
            <button onClick={() => setPage("home")} style={backBtnStyle}>← Back</button>
            <h1 style={{ fontSize: "1.2rem", fontWeight: 900, color: "#2d1b69" }}>🗓 Fill History</h1>
          </div>

          {/* Step 1 – pick date */}
          {!selectedDate && (
            <div style={card}>
              <div style={label}>SELECT A DATE (LAST 14 DAYS)</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: "0.45rem" }}>
                {last14.map(d => {
                  const score = getScore(d);
                  const has   = score > 0;
                  return (
                    <button key={d} onClick={() => setSelectedDate(d)} style={{
                      borderRadius: 12, border: "1.5px solid", borderColor: has ? "#a78bfa" : "#ede9fe",
                      background: has ? "#ede9fe" : "#faf9ff", cursor: "pointer", padding: "0.5rem 0.2rem",
                      display: "flex", flexDirection: "column", alignItems: "center", gap: 2, fontFamily: "inherit"
                    }}>
                      <span style={{ fontSize: "0.58rem", fontWeight: 800, color: "#bbb" }}>{fmtDay(d)}</span>
                      <span style={{ fontSize: "0.9rem", fontWeight: 900, color: has ? "#764ba2" : "#555" }}>{new Date(d + "T00:00:00").getDate()}</span>
                      <span style={{ fontSize: "0.58rem", color: has ? "#a78bfa" : "#ddd", fontWeight: 700 }}>{has ? `${score}%` : "—"}</span>
                    </button>
                  );
                })}
              </div>
              <div style={{ marginTop: "0.85rem", fontSize: "0.7rem", color: "#bbb", textAlign: "center" }}>Purple = already has data</div>
            </div>
          )}

          {/* Step 2 – fill goals for selected date */}
          {selectedDate && (
            <>
              <div style={{ background: "linear-gradient(135deg,#667eea,#764ba2)", borderRadius: 16, padding: "1rem 1.2rem", color: "#fff", marginBottom: "1.2rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: "0.65rem", opacity: 0.75, fontWeight: 600 }}>FILLING DATA FOR</div>
                  <div style={{ fontSize: "1.05rem", fontWeight: 900 }}>{fmtDate(selectedDate)}</div>
                </div>
                <button onClick={() => setSelectedDate(null)} style={{ background: "rgba(255,255,255,0.2)", border: "1.5px solid rgba(255,255,255,0.4)", borderRadius: 10, padding: "0.38rem 0.75rem", color: "#fff", cursor: "pointer", fontFamily: "inherit", fontWeight: 700, fontSize: "0.75rem" }}>← Dates</button>
              </div>

              <div style={card}>
                <div style={label}>WHICH GOALS DID YOU COMPLETE?</div>
                {goals.length === 0 && <div style={{ color: "#ccc", textAlign: "center", padding: "1.5rem 0", fontSize: "0.85rem" }}>Add goals on Home first.</div>}
                {goals.map((g, idx) => {
                  const done = isDone(g.id, selectedDate);
                  return (
                    <div key={g.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.72rem 0", borderTop: idx === 0 ? "none" : "1px solid #f5f5f5" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flex: 1 }}>
                        <span style={{ fontSize: "1.1rem" }}>{g.icon}</span>
                        <span style={{ fontSize: "0.88rem", fontWeight: 600, color: done ? "#a78bfa" : "#2d1b69", textDecoration: done ? "line-through" : "none" }}>{g.title}</span>
                      </div>
                      <Checkbox goalId={g.id} date={selectedDate} />
                    </div>
                  );
                })}
                {goals.length > 0 && (
                  <>
                    <div style={{ display: "flex", gap: "0.6rem", marginTop: "1rem", paddingTop: "0.85rem", borderTop: "1px solid #f0eef8" }}>
                      <button onClick={() => goals.forEach(g => setChecks(c => ({ ...c, [`${g.id}_${selectedDate}`]: true  })))} style={{ flex: 1, padding: "0.55rem", borderRadius: 10, border: "1.5px solid #a78bfa", background: "#faf5ff", color: "#764ba2", fontFamily: "inherit", fontWeight: 700, fontSize: "0.78rem", cursor: "pointer" }}>✅ All Done</button>
                      <button onClick={() => goals.forEach(g => setChecks(c => ({ ...c, [`${g.id}_${selectedDate}`]: false })))} style={{ flex: 1, padding: "0.55rem", borderRadius: 10, border: "1.5px solid #ede9fe", background: "#fafafa", color: "#bbb", fontFamily: "inherit", fontWeight: 700, fontSize: "0.78rem", cursor: "pointer" }}>✕ Clear All</button>
                    </div>
                    <button onClick={() => setSelectedDate(null)} style={{ width: "100%", marginTop: "0.65rem", padding: "0.72rem", borderRadius: 12, border: "none", cursor: "pointer", background: "linear-gradient(135deg,#667eea,#764ba2)", color: "#fff", fontFamily: "inherit", fontWeight: 800, fontSize: "0.92rem" }}>💾 Save & Pick Another Date</button>
                  </>
                )}
              </div>

              <div style={card}>
                <div style={label}>SUMMARY FOR {fmtShort(selectedDate).toUpperCase()}</div>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <div style={{ width: 52, height: 52, borderRadius: "50%", flexShrink: 0, background: getScore(selectedDate) === 100 ? "linear-gradient(135deg,#667eea,#764ba2)" : getScore(selectedDate) > 0 ? "#ede9fe" : "#f5f5f5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.78rem", fontWeight: 900, color: getScore(selectedDate) === 100 ? "#fff" : getScore(selectedDate) > 0 ? "#764ba2" : "#ccc" }}>{getScore(selectedDate)}%</div>
                  <div>
                    <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "#2d1b69" }}>{goals.filter(g => isDone(g.id, selectedDate)).length} of {goals.length} completed</div>
                    <div style={{ fontSize: "0.75rem", color: "#bbb", marginTop: 3 }}>{goals.filter(g => isDone(g.id, selectedDate)).map(g => g.icon).join(" ")}</div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════
          DASHBOARD
      ════════════════════════════════════════ */}
      {page === "dashboard" && (
        <div style={{ padding: "1.5rem 1rem 3rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
            <button onClick={() => setPage("home")} style={backBtnStyle}>← Back</button>
            <h1 style={{ fontSize: "1.3rem", fontWeight: 900, color: "#2d1b69" }}>📊 Dashboard</h1>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.7rem", marginBottom: "1.2rem" }}>
            {[
              { label: "Days Tracked", val: totalTracked, icon: "📅", color: "#667eea" },
              { label: "Best Streak",  val: `${bestStreak}d`, icon: "🔥", color: "#f59e0b" },
              { label: "Avg Score",    val: `${avgScore}%`,   icon: "⭐", color: "#10b981" },
            ].map(s => (
              <div key={s.label} style={{ background: "#fff", borderRadius: 16, padding: "0.85rem 0.5rem", textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                <div style={{ fontSize: "1.4rem", marginBottom: 4 }}>{s.icon}</div>
                <div style={{ fontSize: "1.2rem", fontWeight: 900, color: s.color }}>{s.val}</div>
                <div style={{ fontSize: "0.6rem", color: "#bbb", fontWeight: 700, marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>

          <div style={card}>
            <div style={label}>LAST 30 DAYS</div>
            <div style={{ display: "flex", gap: 3, alignItems: "flex-end", height: 70 }}>
              {last30.map(d => {
                const s = getScore(d);
                const isT = d === today;
                return <div key={d} title={`${fmtShort(d)}: ${s}%`} style={{ flex: 1, borderRadius: "3px 3px 0 0", height: Math.max(3, s * 0.7), background: isT ? "linear-gradient(180deg,#667eea,#764ba2)" : s === 100 ? "#a78bfa" : s > 0 ? "#c4b5fd" : "#f0eef8", outline: isT ? "2px solid #764ba2" : "none", outlineOffset: 1 }} />;
              })}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
              <span style={{ fontSize: "0.62rem", color: "#bbb" }}>{fmtShort(last30[0])}</span>
              <span style={{ fontSize: "0.62rem", color: "#764ba2", fontWeight: 700 }}>Today</span>
            </div>
          </div>

          <div style={card}>
            <div style={label}>GOAL COMPLETION RATE</div>
            {goals.length === 0 && <div style={{ color: "#ccc", textAlign: "center", fontSize: "0.85rem", padding: "1rem 0" }}>No goals yet</div>}
            {goals.map(g => {
              const doneDays = allDates.filter(d => isDone(g.id, d)).length;
              const rate = allDates.length ? Math.round(doneDays / allDates.length * 100) : 0;
              return (
                <div key={g.id} style={{ marginBottom: "0.85rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#2d1b69" }}>{g.icon} {g.title}</span>
                    <span style={{ fontSize: "0.78rem", fontWeight: 800, color: "#764ba2" }}>{doneDays} days ✓</span>
                  </div>
                  <div style={{ height: 8, background: "#f0eef8", borderRadius: 99, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${rate}%`, background: "linear-gradient(90deg,#667eea,#764ba2)", borderRadius: 99, transition: "width 0.5s ease" }} />
                  </div>
                </div>
              );
            })}
          </div>

          <div style={card}>
            <div style={label}>DAILY HISTORY</div>
            {allDates.length === 0 && <div style={{ color: "#ccc", textAlign: "center", fontSize: "0.85rem", padding: "1.5rem 0" }}>No history yet — check off goals or use Fill History! 💪</div>}
            {[...allDates].reverse().map(d => {
              const score = getScore(d);
              const doneGoals = goals.filter(g => isDone(g.id, d));
              const isT = d === today;
              return (
                <div key={d} style={{ padding: "0.75rem 0", borderBottom: "1px solid #f5f5f5", display: "flex", alignItems: "center", gap: "0.85rem" }}>
                  <div style={{ width: 44, height: 44, borderRadius: "50%", flexShrink: 0, background: score === 100 ? "linear-gradient(135deg,#667eea,#764ba2)" : score > 0 ? "#ede9fe" : "#f5f5f5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.72rem", fontWeight: 900, color: score === 100 ? "#fff" : score > 0 ? "#764ba2" : "#ccc" }}>{score}%</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "0.82rem", fontWeight: 700, color: isT ? "#764ba2" : "#2d1b69", marginBottom: 4 }}>{isT ? "📍 " : ""}{fmtDate(d)}</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                      {doneGoals.map(g => <span key={g.id} style={{ fontSize: "0.65rem", background: "#ede9fe", color: "#764ba2", borderRadius: 99, padding: "2px 8px", fontWeight: 700 }}>{g.icon} {g.title}</span>)}
                      {doneGoals.length === 0 && <span style={{ fontSize: "0.65rem", color: "#ccc" }}>Nothing completed</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════
          EDIT MODAL
      ════════════════════════════════════════ */}
      {editGoal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem" }}>
          <div style={{ background: "#fff", borderRadius: 20, padding: "1.5rem", width: "100%", maxWidth: 400, boxShadow: "0 8px 40px rgba(0,0,0,0.2)" }}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 900, color: "#2d1b69", marginBottom: "1.2rem" }}>✏️ Edit Goal</h2>

            <label style={{ fontSize: "0.68rem", fontWeight: 800, color: "#aaa", letterSpacing: "0.08em", display: "block", marginBottom: 6 }}>ICON (paste any emoji)</label>
            <input value={editIcon} onChange={e => setEditIcon(e.target.value)} maxLength={2}
              style={{ width: "100%", border: "1.5px solid #ede9fe", borderRadius: 10, padding: "0.5rem", fontSize: "1.4rem", fontFamily: "inherit", color: "#2d1b69", outline: "none", background: "#faf9ff", textAlign: "center", marginBottom: "0.85rem" }} />

            <label style={{ fontSize: "0.68rem", fontWeight: 800, color: "#aaa", letterSpacing: "0.08em", display: "block", marginBottom: 6 }}>GOAL NAME</label>
            <input autoFocus value={editTitle} onChange={e => setEditTitle(e.target.value)} onKeyDown={e => e.key === "Enter" && saveEdit()}
              style={{ width: "100%", border: "1.5px solid #ede9fe", borderRadius: 10, padding: "0.6rem 0.85rem", fontSize: "0.95rem", fontFamily: "inherit", color: "#2d1b69", outline: "none", background: "#faf9ff", marginBottom: "1.2rem" }} />

            <div style={{ display: "flex", gap: "0.6rem" }}>
              <button onClick={saveEdit} style={{ flex: 2, padding: "0.7rem", borderRadius: 12, border: "none", cursor: "pointer", background: "linear-gradient(135deg,#667eea,#764ba2)", color: "#fff", fontFamily: "inherit", fontWeight: 800, fontSize: "0.9rem" }}>💾 Save Changes</button>
              <button onClick={() => setEditGoal(null)} style={{ flex: 1, padding: "0.7rem", borderRadius: 12, border: "1.5px solid #ede9fe", background: "#fafafa", color: "#aaa", fontFamily: "inherit", fontWeight: 700, fontSize: "0.9rem", cursor: "pointer" }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════
          DELETE CONFIRM MODAL
      ════════════════════════════════════════ */}
      {deleteGoalId && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem" }}>
          <div style={{ background: "#fff", borderRadius: 20, padding: "1.6rem", width: "100%", maxWidth: 360, boxShadow: "0 8px 40px rgba(0,0,0,0.2)", textAlign: "center" }}>
            <div style={{ fontSize: "2.8rem", marginBottom: "0.65rem" }}>🗑️</div>
            <h2 style={{ fontSize: "1.05rem", fontWeight: 900, color: "#2d1b69", marginBottom: "0.5rem" }}>Delete this goal?</h2>
            <p style={{ fontSize: "0.82rem", color: "#aaa", marginBottom: "1.4rem" }}>
              <strong style={{ color: "#2d1b69" }}>"{goals.find(g => g.id === deleteGoalId)?.title}"</strong> will be permanently removed along with all its history.
            </p>
            <div style={{ display: "flex", gap: "0.6rem" }}>
              <button onClick={confirmAndDelete} style={{ flex: 1, padding: "0.75rem", borderRadius: 12, border: "none", cursor: "pointer", background: "#ef4444", color: "#fff", fontFamily: "inherit", fontWeight: 800, fontSize: "0.9rem" }}>Yes, Delete</button>
              <button onClick={() => setDeleteGoalId(null)} style={{ flex: 1, padding: "0.75rem", borderRadius: 12, border: "1.5px solid #ede9fe", background: "#fafafa", color: "#aaa", fontFamily: "inherit", fontWeight: 700, fontSize: "0.9rem", cursor: "pointer" }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

