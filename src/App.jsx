import { useState, useEffect, useRef } from "react";

import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyD79CSOeBjT0uzXjhwOnKKvva_oHJIecTE",
  authDomain: "jase-calendar.firebaseapp.com",
  projectId: "jase-calendar",
  storageBucket: "jase-calendar.firebasestorage.app",
  messagingSenderId: "495093652036",
  appId: "1:495093652036:web:9b34dd25b560f84600fa11",
  measurementId: "G-SD9GHJMBDD"
};

// Initialize Firebase (safe for Vercel + Vite)
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const USER_ID = "default-user";

// Default daily tasks
const DEFAULT_TASKS = [
  "Morning Weigh-In",
  "2+ Ab Workouts",
  "30+ Bike/Run",
  "Night Weigh-in"
];

export default function TaskTracker() {
  const today = new Date().toISOString().split("T")[0];

  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);

  // prevents saving before initial load
  const initialized = useRef(false);

  // 🔄 Load once on mount
  useEffect(() => {
    const loadData = async () => {
      const ref = doc(db, "tasks", USER_ID);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        setData(snap.data());
      }

      setLoading(false);
      initialized.current = true;
    };

    loadData();
  }, []);

  // 💾 Save whenever data changes (after initial load)
  useEffect(() => {
    if (!initialized.current) return;

    const saveData = async () => {
      const ref = doc(db, "tasks", USER_ID);
      await setDoc(ref, data);
    };

    saveData();
  }, [data]);

  // Ensure today's tasks exist
  useEffect(() => {
    if (!data[today]) {
      const newTasks = DEFAULT_TASKS.map((t) => ({
        text: t,
        done: false
      }));

      setData((prev) => ({
        ...prev,
        [today]: newTasks
      }));
    }
  }, [data, today]);

  const todayTasks = data[today] || [];

  const toggleTask = (index) => {
    const updated = todayTasks.map((t, i) =>
      i === index ? { ...t, done: !t.done } : t
    );

    setData({ ...data, [today]: updated });
  };

  const isDayComplete = (tasks) =>
    tasks && tasks.length > 0 && tasks.every((t) => t.done);

  const calculateStreak = () => {
    let streak = 0;
    let d = new Date();

    while (true) {
      const key = d.toISOString().split("T")[0];

      if (!isDayComplete(data[key])) break;

      streak++;
      d.setDate(d.getDate() - 1);
    }

    return streak;
  };

  const streak = calculateStreak();

  const getLast30Days = () => {
    const days = [];
    const d = new Date();

    for (let i = 0; i < 30; i++) {
      const date = new Date(d);
      date.setDate(d.getDate() - i);
      const key = date.toISOString().split("T")[0];
      days.push(key);
    }

    return days.reverse();
  };

  const days = getLast30Days();

  if (loading) return <div style={{ padding: 20 }}>Loading...</div>;

  return (
    <div style={{ padding: 20, maxWidth: 500, margin: "auto" }}>
      <h1>Daily Habit Tracker</h1>

      <h2>Today</h2>

      {todayTasks.map((task, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 8,
            padding: 8,
            border: "1px solid #ccc",
            background: task.done ? "#b6fcb6" : "#fff",
          }}
        >
          <span>{task.text}</span>
          <button onClick={() => toggleTask(i)}>
            {task.done ? "Undo" : "Done"}
          </button>
        </div>
      ))}

      <div>
        {isDayComplete(todayTasks)
          ? "🟢 All tasks completed"
          : "⚪ Incomplete"}
      </div>

      <h2>🔥 Streak: {streak} days</h2>

      <h2>Last 30 Days</h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(6, 1fr)",
          gap: 6,
        }}
      >
        {days.map((day) => {
          const complete = isDayComplete(data[day]);

          return (
            <div
              key={day}
              style={{
                height: 40,
                fontSize: 10,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid #ccc",
                background: complete ? "#4caf50" : "#f5a9a9",
              }}
            >
              {day.slice(5)}
            </div>
          );
        })}
      </div>
    </div>
  );
}