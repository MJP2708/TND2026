"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn, signOut, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { calculateReward, generatePlan } from "@/lib/mock-ai-planner";
import { createInitialState } from "@/lib/demo-data";
import { getBurnoutRisk, getMoodMessage, inferMood } from "@/lib/wellness";
import type { AppState, Business, MoodTone, PlannedTask, RewardItem, TaskStatus } from "@/lib/types";

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

type AppContext = {
  state: AppState;
  patch: (fn: (state: AppState) => AppState) => void;
};

const navGroups: Array<{
  title: string;
  items: Array<{ href: string; label: string; view: View; short: string }>;
}> = [
  {
    title: "Core flow",
    items: [
      { href: "/dashboard", label: "Home", view: "dashboard", short: "Home" },
      { href: "/planner", label: "Plan", view: "planner", short: "Plan" },
      { href: "/focus", label: "Focus", view: "focus", short: "Focus" },
      { href: "/game", label: "Progress", view: "game", short: "Progress" },
    ],
  },
  {
    title: "Support",
    items: [
      { href: "/mood", label: "Mood", view: "mood", short: "Mood" },
      { href: "/neighborhood", label: "Community", view: "neighborhood", short: "Community" },
      { href: "/settings", label: "Settings", view: "settings", short: "Settings" },
    ],
  },
  {
    title: "More",
    items: [
      { href: "/timetable", label: "Tasks", view: "timetable", short: "Tasks" },
      { href: "/rewards", label: "Rewards", view: "rewards", short: "Rewards" },
      { href: "/friends", label: "Friends", view: "friends", short: "Friends" },
    ],
  },
];

const flatNav = navGroups.flatMap((group) => group.items);

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
  const router = useRouter();
  const [email, setEmail] = useState("demo@tycoon.app");
  const [password, setPassword] = useState("demo1234");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function loginWith(emailValue = email, passwordValue = password) {
    setLoading(true);
    setError("");
    try {
      const result = await signIn("credentials", {
        email: emailValue,
        password: passwordValue,
        redirect: false,
      });

      if (result?.error) {
        setError("Login failed. Try demo@tycoon.app with password demo1234.");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Something went wrong while signing in. Please try the demo account.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-shell">
      <section className="login-hero">
        <div className="brand-mark">TT</div>
        <p className="eyebrow light">Friendly productivity companion</p>
        <h1>Build slowly. Win daily.</h1>
        <p className="hero-copy">
          Turn one goal into today&apos;s plan, start one focus session, earn
          Gold, and grow a calm little city without overthinking the schedule.
        </p>
        <div className="preview-grid">
          <PreviewCard label="Next step" value="Focus" />
          <PreviewCard label="Gold" value="760" />
          <PreviewCard label="Mood" value="Steady" />
        </div>
      </section>
      <section className="login-card">
        <SectionCard className="demo-card">
          <p className="eyebrow">Competition demo</p>
          <h2>Try the full flow.</h2>
          <p>Use a ready workspace with a plan, focus timer, rewards, mood check, and tycoon progress.</p>
          <PrimaryButton disabled={loading} onClick={() => loginWith("demo@tycoon.app", "demo1234")}>
            {loading ? "Opening..." : "Try Demo Account"}
          </PrimaryButton>
          <small>demo@tycoon.app / demo1234</small>
        </SectionCard>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            loginWith();
          }}
          className="form-stack login-form"
        >
          <label>
            Email
            <input name="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
          </label>
          <label>
            Password
            <input name="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
          </label>
          {error ? <p className="error-text">{error}</p> : null}
          <PrimaryButton disabled={loading}>{loading ? "Signing in..." : "Sign in"}</PrimaryButton>
        </form>
        {hasGoogle ? (
          <SecondaryButton onClick={() => signIn("google", { callbackUrl: "/dashboard" })}>
            Continue with Google
          </SecondaryButton>
        ) : null}
        <p className="fine-print">Google appears only when OAuth variables exist. Demo auth is local/demo only.</p>
      </section>
    </main>
  );
}

export function AppPage({ view }: { view: View }) {
  const { data: session } = useSession();
  const { state, patch, ready } = useAppState();

  return (
    <AppShell view={view} userName={session?.user?.name} userImage={session?.user?.image}>
      <PageHeader
        eyebrow="ThriveTown"
        title={titleFor(view)}
        description={descriptionFor(view)}
      />
      {!ready ? <LoadingState /> : renderView(view, { state, patch })}
    </AppShell>
  );
}

function AppShell({
  view,
  userName,
  userImage,
  children,
}: {
  view: View;
  userName?: string | null;
  userImage?: string | null;
  children: React.ReactNode;
}) {
  return (
    <div className="app-shell">
      <Sidebar view={view} />
      <main className="main-panel">
        <header className="topbar">
          <div className="logo-row mobile-only">
            <span className="brand-mark small">TT</span>
            <strong>ThriveTown</strong>
          </div>
          <div className="profile-pill">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={userImage || "/avatar.svg"} alt="" />
            <span>{userName || "Student"}</span>
            <button onClick={() => signOut({ callbackUrl: "/login" })}>Logout</button>
          </div>
        </header>
        {children}
      </main>
      <MobileNav view={view} />
    </div>
  );
}

function Sidebar({ view }: { view: View }) {
  return (
    <aside className="sidebar">
      <Link href="/dashboard" className="logo-lockup">
        <span className="brand-mark small">TT</span>
        <span>
          <strong>ThriveTown</strong>
          <small>Plan. Focus. Grow.</small>
        </span>
      </Link>
      <nav className="side-nav" aria-label="Main navigation">
        {navGroups.map((group) => (
          <div className="nav-group" key={group.title}>
            <p>{group.title}</p>
            {group.items.map((item) => (
              <Link key={item.href} href={item.href} className={view === item.view ? "active" : ""}>
                {item.label}
              </Link>
            ))}
          </div>
        ))}
      </nav>
    </aside>
  );
}

function MobileNav({ view }: { view: View }) {
  const navItems = [
    { href: "/dashboard", label: "Home",  icon: "🏠", view: "dashboard" as View },
    { href: "/planner",   label: "Plan",  icon: "📝", view: "planner"   as View },
    { href: "/focus",     label: "Focus", icon: "⏱",  view: "focus"     as View },
    { href: "/game",      label: "City",  icon: "🏙",  view: "game"      as View },
    { href: "/mood",      label: "Mood",  icon: "💚", view: "mood"      as View },
  ];

  return (
    <nav className="mobile-nav" aria-label="Mobile navigation">
      {navItems.map((item) => (
        <Link key={item.href} href={item.href} className={view === item.view ? "active" : ""}>
          <span className="nav-icon">{item.icon}</span>
          <span className="nav-label">{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}

function PageHeader({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <section className="page-header">
      <p className="eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      <p>{description}</p>
    </section>
  );
}

function titleFor(view: View) {
  const titles: Record<View, string> = {
    dashboard: "What is your next step?",
    planner: "Plan your goal",
    timetable: "Your plan for today",
    focus: "Start one focus session",
    game: "Progress city",
    rewards: "Rewards",
    neighborhood: "Community",
    friends: "Friends",
    mood: "Check in with yourself",
    settings: "Settings",
    onboarding: "Set up your first goal",
  };
  return titles[view];
}

function descriptionFor(view: View) {
  const descriptions: Record<View, string> = {
    dashboard: "See your goal, next task, progress, and mood in one calm place.",
    planner: "Let the planner break your goal into small daily tasks with recovery gaps.",
    timetable: "Choose a task, start focus, and mark how much you completed.",
    focus: "Keep it simple: timer, task, reward preview, finish.",
    game: "Focus earns Gold. Gold upgrades your home and small businesses.",
    rewards: "Create real-life rewards, buy them with Gold, and use one-time vouchers.",
    neighborhood: "Anonymous support from people working through similar goals.",
    friends: "A simple supportive chat mock for encouragement.",
    mood: "Answer a few quick choices so today&apos;s plan can feel kinder.",
    settings: "Plan tiers and future monetization structure.",
    onboarding: "Tell the planner what you want to work toward.",
  };
  return descriptions[view];
}

function renderView(view: View, context: AppContext) {
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

function Dashboard({ state }: AppContext) {
  const [now] = useState(() => Date.now());
  const todayTasks = state.tasks.filter((task) => task.day === todayKey());
  const nextTask = todayTasks.find((task) => task.status !== "completed") ?? todayTasks[0] ?? state.tasks[0];
  const progress = Math.round((state.tasks.reduce((sum, task) => sum + task.completion, 0) / (state.tasks.length * 100)) * 100);
  const daysLeft = Math.max(0, Math.ceil((new Date(state.profile.deadline).getTime() - now) / 86400000));
  const wellness = getBurnoutRisk(state);

  return (
    <section className="page-stack">
      <SectionCard className="goal-card">
        <div>
          <p className="eyebrow">Main goal</p>
          <h2>{state.profile.mainGoal}</h2>
          <p>{daysLeft} days left. Build slowly. Win daily.</p>
        </div>
        <PrimaryLink href="/focus">Start Focus</PrimaryLink>
      </SectionCard>

      <div className="dashboard-grid">
        <SectionCard className="next-step-card">
          <p className="eyebrow">What&apos;s next?</p>
          <h2>{nextTask?.title ?? "No task yet"}</h2>
          <p>{nextTask ? `${nextTask.minutes} min · +${nextTask.gold} Gold · Progress still counts.` : "Generate a plan to begin."}</p>
          <div className="button-row">
            <PrimaryLink href="/focus">Start one focus session</PrimaryLink>
            <SecondaryLink href="/timetable">View tasks</SecondaryLink>
          </div>
        </SectionCard>

        <SectionCard>
          <p className="eyebrow">Check in</p>
          <h3>How are you feeling today?</h3>
          <p>{wellness.suggestion}</p>
          <SecondaryLink href="/mood">Check in with yourself</SecondaryLink>
        </SectionCard>
      </div>

      <div className="stats-grid">
        <StatCard label="Gold" value={`${state.gold}`} detail="earned from focus" />
        <StatCard label="Level" value={`${state.level}`} detail={`${state.xp} XP`} />
        <StatCard label="Streak" value={`${state.streak}`} detail="days showing up" />
        <StatCard label="Progress" value={`${progress}%`} detail="overall plan" />
      </div>

      <SectionCard title="Small progress preview">
        <CityPreview state={state} />
      </SectionCard>
    </section>
  );
}

function Planner({ state, patch }: AppContext) {
  const [draft, setDraft] = useState(state.profile);
  const groupedTasks = groupTasksByDay(state.tasks).slice(0, 5);

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
      <SectionCard title="Goal setup" action={<PrimaryButton onClick={regenerate}>Update plan</PrimaryButton>}>
        <p className="soft-copy">AI scheduling means: small tasks, realistic time blocks, and recovery gaps between heavier work.</p>
        <div className="form-grid">
          <label>Main goal<input value={draft.mainGoal} onChange={(event) => setDraft({ ...draft, mainGoal: event.target.value })} /></label>
          <label>Deadline<input type="date" value={draft.deadline} onChange={(event) => setDraft({ ...draft, deadline: event.target.value })} /></label>
          <label>Daily hours<input type="number" min="1" max="10" value={draft.dailyHours} onChange={(event) => setDraft({ ...draft, dailyHours: Number(event.target.value) })} /></label>
          <label>Energy<select value={draft.energy} onChange={(event) => setDraft({ ...draft, energy: event.target.value as typeof draft.energy })}><option value="low">Low</option><option value="balanced">Balanced</option><option value="high">High</option></select></label>
          <label>Difficulty<select value={draft.difficulty} onChange={(event) => setDraft({ ...draft, difficulty: event.target.value as typeof draft.difficulty })}><option value="gentle">Gentle</option><option value="standard">Standard</option><option value="ambitious">Ambitious</option></select></label>
        </div>
      </SectionCard>

      <div className="day-list">
        {groupedTasks.map(([day, tasks]) => (
          <SectionCard key={day} title={formatDay(day)}>
            <TaskList tasks={tasks.slice(0, 3)} onDifficulty={updateDifficulty} />
          </SectionCard>
        ))}
      </div>
    </section>
  );
}

function Timetable({ state, patch }: AppContext) {
  const groupedTasks = groupTasksByDay(state.tasks).slice(0, 7);

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
        streak: completion >= 25 ? current.streak + 1 : current.streak,
      };
    });
  }

  return (
    <section className="page-stack">
      <SectionCard className="flow-card">
        <strong>Goal - Today&apos;s Plan - Focus - Complete - Earn - Upgrade</strong>
        <p>Pick one task. If you only finish part of it, mark 25%, 50%, or 75%. Progress still counts.</p>
      </SectionCard>
      {groupedTasks.map(([day, tasks]) => (
        <SectionCard key={day} title={formatDay(day)}>
          <TaskList tasks={tasks} onComplete={completeTask} />
          <RestCard />
        </SectionCard>
      ))}
    </section>
  );
}

function Focus({ state, patch }: AppContext) {
  const activeTask = state.tasks.find((task) => task.status !== "completed") ?? state.tasks[0];
  const [seconds, setSeconds] = useState((activeTask?.minutes ?? 25) * 60);
  const [running, setRunning] = useState(false);
  const [summary, setSummary] = useState<{ gold: number; xp: number } | null>(null);
  const totalSeconds = (activeTask?.minutes ?? 25) * 60;
  const timerProgress = Math.round(((totalSeconds - seconds) / totalSeconds) * 100);

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => setSeconds((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [running]);

  function finish() {
    setRunning(false);
    const reward = calculateReward(activeTask.difficulty, activeTask.minutes, 100);
    setSummary(reward);
    patch((current) => ({
      ...current,
      gold: current.gold + reward.gold,
      xp: current.xp + reward.xp,
      focusMinutes: current.focusMinutes + activeTask.minutes,
      streak: current.streak + 1,
      tasks: current.tasks.map((task) =>
        task.id === activeTask.id ? { ...task, status: "completed", completion: 100, focusMinutes: task.minutes } : task,
      ),
    }));
  }

  return (
    <section className="focus-page">
      <SectionCard className="timer-panel">
        <p className="eyebrow">Current task</p>
        <h2>{activeTask.title}</h2>
        <div className="timer-ring" style={{ "--timer-progress": `${timerProgress}%` } as React.CSSProperties}>
          <div className="timer-face">{String(Math.floor(seconds / 60)).padStart(2, "0")}:{String(seconds % 60).padStart(2, "0")}</div>
        </div>
        <div className="button-row center">
          <PrimaryButton onClick={() => setRunning((value) => !value)}>{running ? "Pause" : "Start"}</PrimaryButton>
          <SecondaryButton onClick={finish}>Finish</SecondaryButton>
        </div>
        <div className="reward-preview">
          <StatusBadge status="pending">+{activeTask.gold} Gold</StatusBadge>
          <StatusBadge status="pending">+{activeTask.xp} XP</StatusBadge>
        </div>
      </SectionCard>
      {summary ? (
        <SectionCard className="success-card">
          <h2>You earned Gold.</h2>
          <p>+{summary.gold} Gold and +{summary.xp} XP. Take a recovery gap before the next task.</p>
          <SecondaryLink href="/game">Upgrade city</SecondaryLink>
        </SectionCard>
      ) : null}
    </section>
  );
}

function Game({ state, patch }: AppContext) {
  function upgradeBusiness(business: Business) {
    const cost = business.baseCost * (business.level + 1);
    if (state.gold < cost) return;
    patch((current) => ({
      ...current,
      gold: current.gold - cost,
      businesses: current.businesses.map((item) =>
        item.id === business.id ? { ...item, level: item.level + 1 } : item,
      ),
    }));
  }

  return (
    <section className="page-stack">
      <SectionCard className="flow-card">
        <strong>Focus earns Gold. Gold upgrades the city.</strong>
        <p>The tycoon layer is here to make consistency visible, not to distract from work.</p>
      </SectionCard>
      <SectionCard title={`Home level ${state.houseLevel}`}>
        <CityPreview state={state} />
      </SectionCard>
      <div className="cards-grid">
        {state.businesses.map((business) => (
          <UpgradeCard key={business.id} business={business} gold={state.gold} onUpgrade={() => upgradeBusiness(business)} />
        ))}
      </div>
    </section>
  );
}

function Rewards({ state, patch }: AppContext) {
  const [title, setTitle] = useState("");
  const [cost, setCost] = useState(300);

  function addReward() {
    if (!title.trim()) return;
    patch((current) => ({
      ...current,
      rewards: [...current.rewards, { id: `reward-${Date.now()}`, title, cost, note: "Custom reward" }],
    }));
    setTitle("");
  }

  function buy(reward: RewardItem) {
    if (state.gold < reward.cost) return;
    patch((current) => ({
      ...current,
      gold: current.gold - reward.cost,
      vouchers: [
        ...current.vouchers,
        {
          id: `voucher-${Date.now()}`,
          rewardTitle: reward.title,
          code: `TT-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
          used: false,
          createdAt: new Date().toISOString(),
        },
      ],
    }));
  }

  return (
    <section className="page-stack">
      <SectionCard title="Add reward" action={<PrimaryButton onClick={addReward}>Add reward</PrimaryButton>}>
        <div className="form-grid compact">
          <input aria-label="Reward title" placeholder="Watch one episode" value={title} onChange={(event) => setTitle(event.target.value)} />
          <input aria-label="Reward cost" type="number" value={cost} onChange={(event) => setCost(Number(event.target.value))} />
        </div>
      </SectionCard>
      <SectionCard title={`Available rewards - ${state.gold} Gold`}>
        <div className="cards-grid">
          {state.rewards.map((reward) => <RewardCard key={reward.id} reward={reward} canBuy={state.gold >= reward.cost} onBuy={() => buy(reward)} />)}
        </div>
      </SectionCard>
      <SectionCard title="Purchased vouchers">
        {state.vouchers.length ? (
          <div className="cards-grid">
            {state.vouchers.map((voucher) => (
              <RewardVoucher
                key={voucher.id}
                voucher={voucher}
                onUse={() => patch((current) => ({
                  ...current,
                  vouchers: current.vouchers.map((item) => item.id === voucher.id ? { ...item, used: true } : item),
                }))}
              />
            ))}
          </div>
        ) : (
          <EmptyState text="Buy a reward to create a one-time voucher." />
        )}
      </SectionCard>
    </section>
  );
}

function Mood({ state, patch }: AppContext) {
  const [answers, setAnswers] = useState<string[]>([]);
  const tone = answers.length >= 3 ? inferMood(answers) : null;
  const questions: Array<[string, string[]]> = [
    ["Energy", ["Clear", "Okay", "Tired", "Overloaded"]],
    ["Workload", ["Light", "Manageable", "Heavy", "Too much"]],
    ["Support", ["Start small", "Add a break", "Reduce today", "Talk to someone"]],
  ];

  function saveMood(finalTone: MoodTone) {
    patch((current) => ({
      ...current,
      gold: current.gold + 25,
      moods: [...current.moods, { id: `mood-${Date.now()}`, date: new Date().toISOString(), tone: finalTone, answers, goldAwarded: 25 }],
    }));
    setAnswers([]);
  }

  return (
    <section className="page-stack">
      <SectionCard title="Fast check-in">
        {questions.map(([label, options], index) => (
          <div className="choice-block" key={label}>
            <strong>{label}</strong>
            <div className="choice-row">
              {options.map((option) => (
                <MoodChip
                  key={option}
                  selected={answers[index] === option}
                  onClick={() => setAnswers((current) => [...current.slice(0, index), option, ...current.slice(index + 1)])}
                >
                  {option}
                </MoodChip>
              ))}
            </div>
          </div>
        ))}
        {tone ? (
          <div className="result-card">
            <strong>{getMoodMessage(tone)}</strong>
            <p>Try one small task first, or add a recovery gap.</p>
            <PrimaryButton onClick={() => saveMood(tone)}>Save check-in</PrimaryButton>
          </div>
        ) : null}
        <p className="fine-print">This is not medical advice. If you feel unsafe or seriously distressed, contact a trusted person or professional.</p>
      </SectionCard>
      <WellnessInsight state={state} patch={patch} />
      <SectionCard title="Mood history">
        <div className="cards-grid">
          {state.moods.slice(-4).reverse().map((mood) => (
            <article className="mood-card" key={mood.id}>
              <StatusBadge status={mood.tone === "rested" || mood.tone === "steady" ? "completed" : "partial"}>{mood.tone}</StatusBadge>
              <strong>{new Date(mood.date).toLocaleDateString()}</strong>
              <p>+{mood.goldAwarded} Gold for checking in.</p>
            </article>
          ))}
        </div>
      </SectionCard>
    </section>
  );
}

function Neighborhood() {
  const groups = ["Science students", "Exam preparation", "Working adults", "Burnout recovery"];
  const tags = ["#\u0e2b\u0e21\u0e14\u0e44\u0e1f", "#\u0e2a\u0e2d\u0e1a\u0e40\u0e02\u0e49\u0e32\u0e2b\u0e21\u0e2d", "#\u0e40\u0e14\u0e47\u0e0169", "#\u0e23\u0e32\u0e21\u0e32"];
  return (
    <section className="page-stack">
      <SectionCard className="flow-card">
        <strong>Your neighborhood is working too.</strong>
        <p>Anonymous by default. Send encouragement, no personal identity needed.</p>
      </SectionCard>
      <div className="cards-grid">
        {groups.map((group, index) => (
          <article className="neighbor-card" key={group}>
            <div className="mini-house" />
            <h3>{group}</h3>
            <p>{tags[index]}</p>
            <SecondaryButton>Send encouragement</SecondaryButton>
          </article>
        ))}
      </div>
    </section>
  );
}

function Friends() {
  return (
    <section className="content-grid">
      <SectionCard title="Support circle">
        <TasklessList items={["Calm Coder", "Bio Sprint", "Night Reviewer"]} />
      </SectionCard>
      <SectionCard title="Encouragement">
        <div className="chat-box">
          <p><strong>Calm Coder:</strong> Progress still counts today.</p>
          <p><strong>You:</strong> Sending a 25-minute focus wish.</p>
        </div>
        <div className="button-row">
          <PrimaryButton>Send encouragement</PrimaryButton>
          <SecondaryButton>Add friend</SecondaryButton>
        </div>
      </SectionCard>
    </section>
  );
}

function Settings({ state }: AppContext) {
  return (
    <section className="page-stack">
      <div className="pricing-grid">
        <Plan title="Free" price="0" features={["Mock AI planning", "Focus rewards", "Anonymous support"]} />
        <Plan title="Premium" price="Future" features={["Premium planning", "Advanced reflection", "House decoration items"]} highlighted />
        <Plan title="Coins" price="Limited" features={["Purchase limits", "Wellness-safe guardrails", "Stripe-ready later"]} />
      </div>
      <WellnessInsight state={state} patch={() => undefined} />
    </section>
  );
}

function Onboarding({ state, patch }: AppContext) {
  return <Planner state={state} patch={patch} />;
}

function WellnessInsight({ state, patch }: AppContext) {
  const insight = getBurnoutRisk(state);
  return (
    <SectionCard title="Supportive suggestion">
      <div className={`wellness-card ${insight.risk}`}>
        <strong>{insight.message}</strong>
        <p>{insight.suggestion}</p>
        <div className="button-row">
          <SecondaryButton onClick={() => patch((current) => ({
            ...current,
            acceptedTodayAdjustment: true,
            tasks: current.tasks.map((task, index) =>
              task.day === todayKey() && index > 2 ? { ...task, status: "partial", completion: Math.max(task.completion, 10) } : task,
            ),
          }))}>
            Try reducing today&apos;s plan
          </SecondaryButton>
          <SecondaryButton onClick={() => patch((current) => ({ ...current, acceptedTodayAdjustment: false }))}>
            Keep plan
          </SecondaryButton>
        </div>
      </div>
    </SectionCard>
  );
}

function TaskList({
  tasks,
  compact,
  onComplete,
  onDifficulty,
}: {
  tasks: PlannedTask[];
  compact?: boolean;
  onComplete?: (id: string, completion: number) => void;
  onDifficulty?: (id: string, difficulty: number) => void;
}) {
  if (!tasks.length) return <EmptyState text="No tasks yet. Update your plan to begin." />;
  return (
    <div className="task-list">
      {tasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          compact={compact}
          onComplete={onComplete}
          onDifficulty={onDifficulty}
        />
      ))}
    </div>
  );
}

function TaskCard({
  task,
  compact,
  onComplete,
  onDifficulty,
}: {
  task: PlannedTask;
  compact?: boolean;
  onComplete?: (id: string, completion: number) => void;
  onDifficulty?: (id: string, difficulty: number) => void;
}) {
  return (
    <article className={`task-card ${task.status}`}>
      <div>
        <div className="task-title-row">
          <strong>{task.title}</strong>
          <StatusBadge status={task.status}>{labelForStatus(task.status)}</StatusBadge>
        </div>
        <div className="task-meta">
          <span>{task.minutes} min</span>
          <span>Difficulty {task.difficulty}/5</span>
          <span>+{task.gold} Gold</span>
        </div>
        <ProgressBar value={task.completion} />
        <p>Progress still counts.</p>
      </div>
      {!compact ? (
        <div className="task-actions">
          {onDifficulty ? (
            <>
              <label className="range-label">Edit difficulty
                <input type="range" min="1" max="5" value={task.difficulty} onChange={(event) => onDifficulty(task.id, Number(event.target.value))} />
              </label>
              <PrimaryLink href="/focus">Start</PrimaryLink>
            </>
          ) : null}
          {onComplete ? (
            <>
              <PrimaryLink href="/focus">Start</PrimaryLink>
              {[25, 50, 75, 100].map((value) => (
                <SecondaryButton key={value} onClick={() => onComplete(task.id, value)}>{value}%</SecondaryButton>
              ))}
            </>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

function RestCard() {
  return (
    <div className="rest-card">
      <strong>Take a recovery gap</strong>
      <p>A short break helps the next task feel lighter.</p>
    </div>
  );
}

function CityPreview({ state }: { state: AppState }) {
  return (
    <div className="city-preview">
      <div className="city-skyline">
        <span className="tower home" />
        {state.businesses.map((business) => (
          <span
            key={business.id}
            className="tower"
            style={{ height: `${50 + business.level * 14}px` }}
            title={`${business.name} level ${business.level}`}
          />
        ))}
      </div>
      <p>Focus time becomes Gold. Gold makes progress visible.</p>
    </div>
  );
}

function UpgradeCard({ business, gold, onUpgrade }: { business: Business; gold: number; onUpgrade: () => void }) {
  const cost = business.baseCost * (business.level + 1);
  return (
    <article className="upgrade-card">
      <div className="upgrade-top">
        <span className="icon-chip">{business.icon}</span>
        <StatusBadge status="pending">Level {business.level}</StatusBadge>
      </div>
      <h3>{business.name}</h3>
      <p>{business.description}</p>
      <ProgressBar value={Math.min(100, business.level * 24)} />
      <p>Next upgrade: +1 level. Cost: {cost} Gold.</p>
      <PrimaryButton disabled={gold < cost} onClick={onUpgrade}>Upgrade</PrimaryButton>
    </article>
  );
}

function RewardCard({ reward, canBuy, onBuy }: { reward: RewardItem; canBuy: boolean; onBuy: () => void }) {
  return (
    <article className="reward-card">
      <h3>{reward.title}</h3>
      <p>{reward.note}</p>
      <strong>{reward.cost} Gold</strong>
      <PrimaryButton disabled={!canBuy} onClick={onBuy}>{canBuy ? "Buy" : "Need more Gold"}</PrimaryButton>
    </article>
  );
}

function RewardVoucher({
  voucher,
  onUse,
}: {
  voucher: { rewardTitle: string; code: string; used: boolean };
  onUse: () => void;
}) {
  return (
    <article className={`voucher ${voucher.used ? "used" : ""}`}>
      <StatusBadge status={voucher.used ? "completed" : "pending"}>{voucher.used ? "Used" : "Unused"}</StatusBadge>
      <h3>{voucher.rewardTitle}</h3>
      <span>{voucher.code}</span>
      <SecondaryButton disabled={voucher.used} onClick={onUse}>{voucher.used ? "Already used" : "Use voucher"}</SecondaryButton>
    </article>
  );
}

function SectionCard({
  title,
  action,
  className = "",
  children,
}: {
  title?: string;
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={`section-card ${className}`}>
      {title || action ? (
        <header>
          {title ? <h2>{title}</h2> : <span />}
          {action}
        </header>
      ) : null}
      {children}
    </section>
  );
}

function StatCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <article className="stat-card">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  );
}

function PrimaryButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...props} className={`primary-button ${props.className ?? ""}`} />;
}

function SecondaryButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...props} className={`secondary-button ${props.className ?? ""}`} />;
}

function PrimaryLink({ href, children }: { href: string; children: React.ReactNode }) {
  return <Link href={href} className="primary-button">{children}</Link>;
}

function SecondaryLink({ href, children }: { href: string; children: React.ReactNode }) {
  return <Link href={href} className="secondary-button">{children}</Link>;
}

function StatusBadge({ status, children }: { status: TaskStatus | "rested" | "steady"; children: React.ReactNode }) {
  return <span className={`status-badge ${status}`}>{children}</span>;
}

function ProgressBar({ value }: { value: number }) {
  return <div className="progress-bar"><span style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></div>;
}

function MoodChip(props: React.ButtonHTMLAttributes<HTMLButtonElement> & { selected?: boolean }) {
  const { selected, className, ...buttonProps } = props;
  return <button {...buttonProps} className={`mood-chip ${selected ? "selected" : ""} ${className ?? ""}`} />;
}

function EmptyState({ text }: { text: string }) {
  return <div className="empty-state">{text}</div>;
}

function LoadingState() {
  return <div className="empty-state">Loading your workspace...</div>;
}

function PreviewCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="preview-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function TasklessList({ items }: { items: string[] }) {
  return (
    <div className="task-list">
      {items.map((item) => (
        <article className="task-card" key={item}>
          <strong>{item}</strong>
          <p>Anonymous, supportive, no personal identity required.</p>
        </article>
      ))}
    </div>
  );
}

function Plan({ title, price, features, highlighted }: { title: string; price: string; features: string[]; highlighted?: boolean }) {
  return (
    <article className={`plan-card ${highlighted ? "highlighted" : ""}`}>
      <h3>{title}</h3>
      <strong>{price}</strong>
      {features.map((feature) => <p key={feature}>{feature}</p>)}
      <SecondaryButton>{highlighted ? "Preview" : "Current"}</SecondaryButton>
    </article>
  );
}

function groupTasksByDay(tasks: PlannedTask[]) {
  return [...new Set(tasks.map((task) => task.day))].map((day) => [
    day,
    tasks.filter((task) => task.day === day),
  ] as const);
}

function formatDay(day: string) {
  return new Date(day).toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });
}

function labelForStatus(status: TaskStatus) {
  return status === "completed" ? "Done" : status === "partial" ? "In progress" : "Ready";
}
