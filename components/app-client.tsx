"use client";

import Link from "next/link";
import { signIn, signOut, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { calculateReward, generatePlan } from "@/lib/mock-ai-planner";
import { createInitialState } from "@/lib/demo-data";
import { getBurnoutRisk, getMoodMessage, inferMood } from "@/lib/wellness";
import type { AppState, Business, MoodTone, PlannedTask, RewardItem } from "@/lib/types";

type View =
  | "dashboard"
  | "planner"
  | "timetable"
  | "focus"
  | "game"
  | "rewards"
  | "neighborhood"
  | "friends"
  | "mood"
  | "settings"
  | "onboarding";

const nav: { href: string; label: string; view: View }[] = [
  { href: "/dashboard", label: "Dashboard", view: "dashboard" },
  { href: "/planner", label: "AI Planner", view: "planner" },
  { href: "/timetable", label: "Timetable", view: "timetable" },
  { href: "/focus", label: "Focus", view: "focus" },
  { href: "/game", label: "Tycoon", view: "game" },
  { href: "/rewards", label: "Rewards", view: "rewards" },
  { href: "/neighborhood", label: "Neighborhood", view: "neighborhood" },
  { href: "/friends", label: "Friends", view: "friends" },
  { href: "/mood", label: "Mood", view: "mood" },
  { href: "/settings", label: "Settings", view: "settings" },
];

function storageKey(userId?: string | null) {
  return `thrivetown-state:${userId || "guest"}`;
}

function deriveLevel(xp: number) {
  return Math.max(1, Math.floor(xp / 260) + 1);
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function useAppState() {
  const { data: session } = useSession();
  const key = storageKey(session?.user?.id ?? session?.user?.email);
  const [state, setState] = useState<AppState>(() => createInitialState());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    window.queueMicrotask(() => {
      try {
        const raw = localStorage.getItem(key);
        setState(raw ? JSON.parse(raw) : createInitialState());
      } catch {
        setState(createInitialState());
      }
      setReady(true);
    });
  }, [key]);

  useEffect(() => {
    if (ready) localStorage.setItem(key, JSON.stringify(state));
  }, [key, ready, state]);

  const patch = (updater: (current: AppState) => AppState) => {
    setState((current) => {
      const next = updater(current);
      return { ...next, level: deriveLevel(next.xp) };
    });
  };

  return { state, patch, ready };
}

export function LoginPage({ hasGoogle = false }: { hasGoogle?: boolean }) {
  const [name, setName] = useState("Demo Builder");
  const [email, setEmail] = useState("demo@student.local");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(formData: FormData) {
    setLoading(true);
    setError("");
    const result = await signIn("credentials", {
      name: formData.get("name"),
      email: formData.get("email"),
      redirect: false,
      callbackUrl: "/dashboard",
    });
    setLoading(false);
    if (result?.error) {
      setError("Please enter a valid email to continue.");
      return;
    }
    window.location.href = "/dashboard";
  }

  return (
    <main className="login-shell">
      <section className="login-hero">
        <div className="brand-mark">TT</div>
        <p className="eyebrow">AI productivity and wellness tycoon</p>
        <h1>ThriveTown AI</h1>
        <p>
          Turn overwhelming goals into daily focus quests, humane recovery gaps,
          and a premium simulation of your progress.
        </p>
        <div className="hero-grid">
          <span>AI planning</span>
          <span>Focus rewards</span>
          <span>Anonymous support</span>
        </div>
      </section>
      <section className="login-card">
        <p className="eyebrow">Secure demo access</p>
        <h2>Sign in or create your workspace</h2>
        <form action={submit} className="form-stack">
          <label>
            Name
            <input name="name" value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label>
            Email
            <input name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          {error ? <p className="error-text">{error}</p> : null}
          <button className="primary-btn" disabled={loading}>
            {loading ? "Signing in..." : "Continue"}
          </button>
        </form>
        {hasGoogle ? (
          <button className="secondary-btn" onClick={() => signIn("google", { callbackUrl: "/dashboard" })}>
            Continue with Google
          </button>
        ) : null}
        <p className="fine-print">
          Google sign-in activates automatically when `GOOGLE_CLIENT_ID` and
          `GOOGLE_CLIENT_SECRET` exist in `.env.local`. Add `AUTH_SECRET` for
          production sessions.
        </p>
      </section>
    </main>
  );
}

export function AppPage({ view }: { view: View }) {
  const { data: session } = useSession();
  const { state, patch, ready } = useAppState();

  const context = { state, patch };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link href="/dashboard" className="logo-lockup">
          <span className="brand-mark small">TT</span>
          <span>
            <strong>ThriveTown</strong>
            <small>AI Planner</small>
          </span>
        </Link>
        <nav className="side-nav">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className={view === item.view ? "active" : ""}>
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="main-panel">
        <header className="topbar">
          <div>
            <p className="eyebrow">Competition MVP</p>
            <h1>{titleFor(view)}</h1>
          </div>
          <div className="profile-pill">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={session?.user?.image || "/avatar.svg"} alt="" />
            <span>{session?.user?.name || "Student"}</span>
            <button onClick={() => signOut({ callbackUrl: "/login" })}>Logout</button>
          </div>
        </header>
        {!ready ? <LoadingState /> : renderView(view, context)}
      </main>
    </div>
  );
}

function titleFor(view: View) {
  const titles: Record<View, string> = {
    dashboard: "Home Dashboard",
    planner: "AI Strategic Planner",
    timetable: "Timetable",
    focus: "Focus Timer",
    game: "Tycoon Growth",
    rewards: "Reward Shop",
    neighborhood: "Anonymous Neighborhood",
    friends: "Friends and Support",
    mood: "Daily Mood Tracker",
    settings: "Settings and Plans",
    onboarding: "Onboarding",
  };
  return titles[view];
}

function renderView(view: View, context: { state: AppState; patch: (fn: (state: AppState) => AppState) => void }) {
  const views: Record<View, React.ReactNode> = {
    dashboard: <Dashboard {...context} />,
    planner: <Planner {...context} />,
    timetable: <Timetable {...context} />,
    focus: <Focus {...context} />,
    game: <Game {...context} />,
    rewards: <Rewards {...context} />,
    neighborhood: <Neighborhood />,
    friends: <Friends />,
    mood: <Mood {...context} />,
    settings: <Settings {...context} />,
    onboarding: <Onboarding {...context} />,
  };
  return views[view];
}

function MetricCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <article className="metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  );
}

function Dashboard({ state }: { state: AppState; patch: (fn: (state: AppState) => AppState) => void }) {
  const [now] = useState(() => Date.now());
  const todayTasks = state.tasks.filter((task) => task.day === todayKey());
  const progress = Math.round((state.tasks.reduce((sum, task) => sum + task.completion, 0) / (state.tasks.length * 100)) * 100);
  const daysLeft = Math.max(0, Math.ceil((new Date(state.profile.deadline).getTime() - now) / 86400000));
  const wellness = getBurnoutRisk(state);

  return (
    <section className="page-stack">
      <div className="hero-panel">
        <div>
          <p className="eyebrow">Main goal</p>
          <h2>{state.profile.mainGoal}</h2>
          <p>AI keeps the workload small enough to start, then rewards consistency like a calm tycoon system.</p>
        </div>
        <Link href="/focus" className="primary-btn fit">Start focus session</Link>
      </div>
      <div className="metrics-grid">
        <MetricCard label="Deadline" value={`${daysLeft} days`} detail={state.profile.deadline} />
        <MetricCard label="Progress" value={`${progress}%`} detail="Plan completion" />
        <MetricCard label="Focus time" value={`${Math.round(state.focusMinutes / 60)}h`} detail={`${state.streak} day streak`} />
        <MetricCard label="Economy" value={`${state.gold} Gold`} detail={`Level ${state.level}, ${state.xp} XP`} />
      </div>
      <div className="content-grid">
        <Panel title="Today's tasks" action={<Link href="/timetable">View timetable</Link>}>
          <TaskList tasks={todayTasks.slice(0, 4)} compact />
        </Panel>
        <Panel title="Mental health reflection" action={<Link href="/mood">Check in</Link>}>
          <div className={`wellness-card ${wellness.risk}`}>
            <strong>{wellness.message}</strong>
            <p>{wellness.suggestion}</p>
            <small>This is not medical advice. If you feel unsafe or seriously distressed, contact a trusted person or professional.</small>
          </div>
        </Panel>
      </div>
    </section>
  );
}

function Planner({ state, patch }: { state: AppState; patch: (fn: (state: AppState) => AppState) => void }) {
  const [draft, setDraft] = useState(state.profile);

  function regenerate() {
    patch((current) => ({ ...current, profile: draft, tasks: generatePlan(draft) }));
  }

  function updateDifficulty(id: string, difficulty: number) {
    patch((current) => ({
      ...current,
      tasks: current.tasks.map((task) => {
        if (task.id !== id) return task;
        const reward = calculateReward(difficulty, task.minutes, 100);
        return { ...task, difficulty, gold: reward.gold, xp: reward.xp };
      }),
    }));
  }

  return (
    <section className="page-stack">
      <Panel title="Strategic setup" action={<button onClick={regenerate}>Generate mock AI plan</button>}>
        <div className="form-grid">
          <label>Main goal<input value={draft.mainGoal} onChange={(e) => setDraft({ ...draft, mainGoal: e.target.value })} /></label>
          <label>Deadline<input type="date" value={draft.deadline} onChange={(e) => setDraft({ ...draft, deadline: e.target.value })} /></label>
          <label>Daily hours<input type="number" min="1" max="10" value={draft.dailyHours} onChange={(e) => setDraft({ ...draft, dailyHours: Number(e.target.value) })} /></label>
          <label>Energy<select value={draft.energy} onChange={(e) => setDraft({ ...draft, energy: e.target.value as typeof draft.energy })}><option value="low">Low</option><option value="balanced">Balanced</option><option value="high">High</option></select></label>
          <label>Difficulty<select value={draft.difficulty} onChange={(e) => setDraft({ ...draft, difficulty: e.target.value as typeof draft.difficulty })}><option value="gentle">Gentle</option><option value="standard">Standard</option><option value="ambitious">Ambitious</option></select></label>
        </div>
      </Panel>
      <Panel title="AI-generated schedule with recovery gaps">
        <TaskList tasks={state.tasks.slice(0, 8)} onDifficulty={updateDifficulty} />
      </Panel>
    </section>
  );
}

function Timetable({ state, patch }: { state: AppState; patch: (fn: (state: AppState) => AppState) => void }) {
  const days = [...new Set(state.tasks.map((task) => task.day))].slice(0, 7);

  function completeTask(id: string, completion: number) {
    patch((current) => {
      let reward = { gold: 0, xp: 0 };
      const tasks = current.tasks.map((task) => {
        if (task.id !== id) return task;
        const finalCompletion = Math.max(task.completion, completion);
        reward = calculateReward(task.difficulty, task.minutes, finalCompletion);
        return {
          ...task,
          completion: finalCompletion,
          status: finalCompletion >= 100 ? ("completed" as const) : ("partial" as const),
          focusMinutes: Math.max(task.focusMinutes, Math.round((task.minutes * finalCompletion) / 100)),
        };
      });
      return {
        ...current,
        tasks,
        gold: current.gold + reward.gold,
        xp: current.xp + reward.xp,
        focusMinutes: current.focusMinutes + Math.round((reward.xp / 30) * 10),
        streak: Math.max(current.streak, completion >= 40 ? current.streak + 1 : current.streak),
      };
    });
  }

  return (
    <section className="page-stack">
      {days.map((day) => (
        <Panel key={day} title={new Date(day).toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}>
          <TaskList tasks={state.tasks.filter((task) => task.day === day)} onComplete={completeTask} />
        </Panel>
      ))}
    </section>
  );
}

function Focus({ state, patch }: { state: AppState; patch: (fn: (state: AppState) => AppState) => void }) {
  const activeTask = state.tasks.find((task) => task.status !== "completed") ?? state.tasks[0];
  const [seconds, setSeconds] = useState((activeTask?.minutes ?? 25) * 60);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => setSeconds((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [running]);

  function finish() {
    setRunning(false);
    patch((current) => {
      const reward = calculateReward(activeTask.difficulty, activeTask.minutes, 100);
      return {
        ...current,
        gold: current.gold + reward.gold,
        xp: current.xp + reward.xp,
        focusMinutes: current.focusMinutes + activeTask.minutes,
        streak: current.streak + 1,
        tasks: current.tasks.map((task) =>
          task.id === activeTask.id ? { ...task, status: "completed", completion: 100, focusMinutes: task.minutes } : task,
        ),
      };
    });
  }

  return (
    <section className="focus-layout">
      <div className="timer-panel">
        <p className="eyebrow">Current quest</p>
        <h2>{activeTask.title}</h2>
        <div className="timer-face">{String(Math.floor(seconds / 60)).padStart(2, "0")}:{String(seconds % 60).padStart(2, "0")}</div>
        <div className="button-row">
          <button className="primary-btn" onClick={() => setRunning((value) => !value)}>{running ? "Pause" : "Start"}</button>
          <button className="secondary-btn" onClick={finish}>Finish and claim</button>
        </div>
      </div>
      <Panel title="Proof of focus">
        <p className="muted">Timer completion links focus minutes to task progress, then calculates Gold and XP from difficulty, time spent, and completion.</p>
        <Progress value={activeTask.completion} />
      </Panel>
    </section>
  );
}

function Rewards({ state, patch }: { state: AppState; patch: (fn: (state: AppState) => AppState) => void }) {
  const [title, setTitle] = useState("");
  const [cost, setCost] = useState(300);

  function buy(reward: RewardItem) {
    if (state.gold < reward.cost) return;
    patch((current) => ({
      ...current,
      gold: current.gold - reward.cost,
      vouchers: [
        ...current.vouchers,
        { id: `voucher-${Date.now()}`, rewardTitle: reward.title, code: `TT-${Math.random().toString(36).slice(2, 8).toUpperCase()}`, used: false, createdAt: new Date().toISOString() },
      ],
    }));
  }

  return (
    <section className="page-stack">
      <Panel title={`Gold balance: ${state.gold}`} action={<button onClick={() => title && patch((s) => ({ ...s, rewards: [...s.rewards, { id: `reward-${Date.now()}`, title, cost, note: "Custom reward" }] }))}>Add reward</button>}>
        <div className="form-grid compact"><input placeholder="Reward title" value={title} onChange={(e) => setTitle(e.target.value)} /><input type="number" value={cost} onChange={(e) => setCost(Number(e.target.value))} /></div>
      </Panel>
      <div className="cards-grid">
        {state.rewards.map((reward) => <ShopCard key={reward.id} reward={reward} canBuy={state.gold >= reward.cost} onBuy={() => buy(reward)} />)}
      </div>
      <Panel title="Vouchers">
        <div className="cards-grid">
          {state.vouchers.length ? state.vouchers.map((voucher) => (
            <article className="voucher" key={voucher.id}>
              <strong>{voucher.rewardTitle}</strong><span>{voucher.code}</span>
              <button disabled={voucher.used} onClick={() => patch((s) => ({ ...s, vouchers: s.vouchers.map((v) => v.id === voucher.id ? { ...v, used: true } : v) }))}>{voucher.used ? "Used" : "Mark used"}</button>
            </article>
          )) : <EmptyState text="Purchased real-life rewards become one-use digital vouchers here." />}
        </div>
      </Panel>
    </section>
  );
}

function Game({ state, patch }: { state: AppState; patch: (fn: (state: AppState) => AppState) => void }) {
  function upgradeBusiness(business: Business) {
    const cost = business.baseCost * (business.level + 1);
    if (state.gold < cost) return;
    patch((s) => ({ ...s, gold: s.gold - cost, businesses: s.businesses.map((b) => b.id === business.id ? { ...b, level: b.level + 1 } : b) }));
  }

  return (
    <section className="page-stack">
      <div className="town-scene">
        <div className={`house level-${Math.min(5, state.houseLevel)}`}><span>Level {state.houseLevel} home</span></div>
        {state.businesses.map((b) => <div key={b.id} className="building"><strong>{b.name}</strong><span>Lv {b.level}</span></div>)}
      </div>
      <div className="cards-grid">
        {state.businesses.map((business) => {
          const cost = business.baseCost * (business.level + 1);
          return (
            <article className="business-card" key={business.id}>
              <span className="icon-chip">{business.icon}</span>
              <h3>{business.name}</h3>
              <p>{business.description}</p>
              <Progress value={Math.min(100, business.level * 22)} />
              <button disabled={state.gold < cost} onClick={() => upgradeBusiness(business)}>Upgrade for {cost} Gold</button>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function Mood({ state, patch }: { state: AppState; patch: (fn: (state: AppState) => AppState) => void }) {
  const [answers, setAnswers] = useState<string[]>([]);
  const tone = answers.length >= 3 ? inferMood(answers) : null;
  const questions: Array<[string, string[]]> = [
    ["Energy", ["Rested and clear", "Steady enough", "Tired and low", "Overwhelmed"]],
    ["Workload", ["Light", "Manageable", "Heavy workload", "Too much"]],
    ["Need", ["Deep focus", "Short tasks", "Recovery", "Talk to someone"]],
  ];

  function saveMood(finalTone: MoodTone) {
    patch((s) => ({ ...s, gold: s.gold + 25, moods: [...s.moods, { id: `mood-${Date.now()}`, date: new Date().toISOString(), tone: finalTone, answers, goldAwarded: 25 }] }));
    setAnswers([]);
  }

  return (
    <section className="page-stack">
      <Panel title="AI-style mood reflection">
        {questions.map(([label, options], index) => (
          <div className="choice-block" key={label}>
            <strong>{label}</strong>
            <div className="choice-row">{options.map((option) => <button key={option} className={answers[index] === option ? "selected" : ""} onClick={() => setAnswers((a) => [...a.slice(0, index), option, ...a.slice(index + 1)])}>{option}</button>)}</div>
          </div>
        ))}
        {tone ? <div className="result-card"><strong>{getMoodMessage(tone)}</strong><p>Complete reflection to earn 25 Gold.</p><button onClick={() => saveMood(tone)}>Save reflection</button></div> : null}
      </Panel>
      <WellnessInsight state={state} patch={patch} />
    </section>
  );
}

function WellnessInsight({ state, patch }: { state: AppState; patch: (fn: (state: AppState) => AppState) => void }) {
  const insight = getBurnoutRisk(state);
  return (
    <Panel title="Gentle normalizer feed">
      <div className={`wellness-card ${insight.risk}`}>
        <strong>{insight.message}</strong>
        <p>{insight.suggestion}</p>
        <div className="button-row">
          <button onClick={() => patch((s) => ({ ...s, acceptedTodayAdjustment: true, tasks: s.tasks.map((t, i) => t.day === todayKey() && i > 2 ? { ...t, status: "partial", completion: Math.max(t.completion, 10) } : t) }))}>Accept lighter day</button>
          <button className="ghost-btn" onClick={() => patch((s) => ({ ...s, acceptedTodayAdjustment: false }))}>Keep plan</button>
        </div>
        <small>This is not medical advice. If you feel unsafe or seriously distressed, contact a trusted person or professional.</small>
      </div>
    </Panel>
  );
}

function Neighborhood() {
  const groups = ["Science students", "Exam preparation", "Working adults", "Burnout recovery"];
  const tags = ["#หมดไฟ", "#เด็ก69", "#รามา", "#สอบเข้าหมอ"];
  return (
    <section className="cards-grid">
      {groups.map((group, index) => (
        <article className="social-card" key={group}>
          <div className="mini-house" />
          <h3>{group}</h3>
          <p>{tags.slice(index, index + 2).join(" ") || tags[0]}</p>
          <button>Send encouragement</button>
        </article>
      ))}
    </section>
  );
}

function Friends() {
  return (
    <section className="content-grid">
      <Panel title="Anonymous friends"><TasklessList items={["Calm Coder", "Bio Sprint", "Night Reviewer"]} /></Panel>
      <Panel title="Support chat mock">
        <div className="chat-box"><p><strong>Calm Coder:</strong> Small progress still counts today.</p><p><strong>You:</strong> Sending a 25-minute focus wish.</p></div>
        <div className="button-row"><button>Send encouragement</button><button className="ghost-btn">Add friend</button></div>
      </Panel>
    </section>
  );
}

function Settings({ state }: { state: AppState; patch: (fn: (state: AppState) => AppState) => void }) {
  return (
    <section className="page-stack">
      <div className="pricing-grid">
        <Plan title="Free" price="0" features={["Mock AI planning", "Focus rewards", "Anonymous support"]} />
        <Plan title="Premium" price="Future" features={["Premium AI planning", "Advanced reflection", "Limited decorations"]} highlighted />
        <Plan title="Coins" price="Limited" features={["Purchase caps", "Wellness-safe limits", "Stripe-ready structure"]} />
      </div>
      <WellnessInsight state={state} patch={() => undefined} />
    </section>
  );
}

function Onboarding({ state, patch }: { state: AppState; patch: (fn: (state: AppState) => AppState) => void }) {
  return <Planner state={state} patch={patch} />;
}

function TaskList({ tasks, compact, onComplete, onDifficulty }: { tasks: PlannedTask[]; compact?: boolean; onComplete?: (id: string, completion: number) => void; onDifficulty?: (id: string, difficulty: number) => void }) {
  if (!tasks.length) return <EmptyState text="No tasks here yet. Generate a plan to fill this space." />;
  return (
    <div className="task-list">
      {tasks.map((task) => (
        <article className={`task-row ${task.status}`} key={task.id}>
          <div>
            <strong>{task.title}</strong>
            <p>{task.category} · {task.minutes} min · rest {task.recoveryAfter} min · {task.gold} Gold · {task.xp} XP</p>
            <Progress value={task.completion} />
          </div>
          {!compact ? <div className="task-actions">
            {onDifficulty ? <input type="range" min="1" max="5" value={task.difficulty} onChange={(e) => onDifficulty(task.id, Number(e.target.value))} /> : null}
            {onComplete ? <><button onClick={() => onComplete(task.id, 50)}>50%</button><button onClick={() => onComplete(task.id, 100)}>Done</button></> : <Link href="/focus">Start</Link>}
          </div> : null}
        </article>
      ))}
    </div>
  );
}

function Panel({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return <section className="panel"><header><h2>{title}</h2>{action}</header>{children}</section>;
}

function Progress({ value }: { value: number }) {
  return <div className="progress"><span style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></div>;
}

function EmptyState({ text }: { text: string }) {
  return <div className="empty-state">{text}</div>;
}

function LoadingState() {
  return <div className="empty-state">Loading your town...</div>;
}

function ShopCard({ reward, canBuy, onBuy }: { reward: RewardItem; canBuy: boolean; onBuy: () => void }) {
  return <article className="shop-card"><h3>{reward.title}</h3><p>{reward.note}</p><strong>{reward.cost} Gold</strong><button disabled={!canBuy} onClick={onBuy}>{canBuy ? "Purchase voucher" : "Need more Gold"}</button></article>;
}

function TasklessList({ items }: { items: string[] }) {
  return <div className="task-list">{items.map((item) => <article className="task-row" key={item}><strong>{item}</strong><p>Anonymous, supportive, no personal identity required.</p></article>)}</div>;
}

function Plan({ title, price, features, highlighted }: { title: string; price: string; features: string[]; highlighted?: boolean }) {
  return <article className={`plan-card ${highlighted ? "highlighted" : ""}`}><h3>{title}</h3><strong>{price}</strong>{features.map((feature) => <p key={feature}>{feature}</p>)}<button>{highlighted ? "Preview premium" : "Current structure"}</button></article>;
}
