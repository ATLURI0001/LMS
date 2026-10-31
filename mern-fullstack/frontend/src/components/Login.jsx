import React, { useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Terminal,
  Trophy,
  Code2,
  Users,
} from "lucide-react";
import api from "../lib/api.js";
import { Badge, Empty, Button, Dialog, Editor, Brand } from "./ui.jsx";
export default function Login({ onLogin }) {
  const [register, setRegister] = useState(false),
    [data, setData] = useState({ email: "", password: "", name: "" }),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const demo = (role) =>
    setData({
      ...data,
      email: `${role}@ascent.local`,
      password: "AscentDemo!2026",
    });
  return (
    <div className="login-page">
      <section className="login-story">
        <Brand />
        <div className="login-copy">
          <Badge tone="lime">BUILT FOR THE NEXT GENERATION</Badge>
          <h1>
            Big ideas.
            <br />
            Real skills.
            <br />
            <em>Your ascent.</em>
          </h1>
          <p>
            Learn the foundations. Find your team.
            <br />
            Build something worth showing.
          </p>
          <div className="orbit">
            <div className="orbit-center">
              <Code2 size={55} />
            </div>
            <span className="orbit-card one">
              <Terminal size={22} /> Learn by doing
            </span>
            <span className="orbit-card two">
              <Trophy size={22} /> Ready to compete
            </span>
            <span className="orbit-card three">
              <Users size={22} /> Better together
            </span>
          </div>
        </div>
        <small>LEARN. BUILD. RISE.</small>
      </section>
      <section className="login-form">
        <div className="auth-box">
          <div className="eyebrow">YOUR CAMPUS, CONNECTED</div>
          <h2>
            {register ? "Start your next chapter." : "Good to see you again."}
          </h2>
          <p className="muted">
            {register
              ? "Create a student account and make your first move."
              : "Pick up where your curiosity left off."}
          </p>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              setError("");
              try {
                await api(
                  `auth/${register ? "register" : "login"}`,
                  "POST",
                  data,
                );
                await onLogin();
              } catch (e) {
                setError(e.message);
              } finally {
                setBusy(false);
              }
            }}
          >
            {register && (
              <label className="field">
                Full name
                <input
                  autoComplete="name"
                  required
                  minLength={2}
                  maxLength={80}
                  value={data.name}
                  onChange={(e) => setData({ ...data, name: e.target.value })}
                />
              </label>
            )}
            <label className="field">
              Email address
              <input
                type="email"
                autoComplete="email"
                placeholder="you@college.edu"
                required
                value={data.email}
                onChange={(e) => setData({ ...data, email: e.target.value })}
              />
            </label>
            <label className="field">
              Password
              <input
                type="password"
                autoComplete={register ? "new-password" : "current-password"}
                required
                minLength={register ? 12 : 1}
                maxLength={128}
                value={data.password}
                onChange={(e) => setData({ ...data, password: e.target.value })}
              />
            </label>
            {register && (
              <small className="muted">
                Use 12–128 characters. New accounts have the student role.
              </small>
            )}
            {error && (
              <div className="error" role="alert">
                {error}
              </div>
            )}
            <Button className="full" disabled={busy} icon={ArrowRight}>
              {busy
                ? "Opening your workspace…"
                : register
                  ? "Create account"
                  : "Sign in"}
            </Button>
          </form>
          <p className="auth-switch">
            {register ? "Already learning here?" : "New to Ascent?"}{" "}
            <button
              className="text-btn"
              onClick={() => {
                setRegister(!register);
                setError("");
              }}
            >
              {register ? "Sign in" : "Create an account"}
            </button>
          </p>
          {!register && import.meta.env.VITE_DEMO_MODE === "true" && (
            <div className="demo-box">
              <span className="eyebrow">EXPLORE THE DEMO</span>
              <div>
                {["student", "instructor", "admin"].map((role) => (
                  <button key={role} onClick={() => demo(role)}>
                    {role}
                    <ArrowUpRight size={13} />
                  </button>
                ))}
              </div>
              <small>
                Demo accounts use shared sample data. Select a role, then sign
                in.
              </small>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
