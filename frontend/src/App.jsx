import "./App.css";
import axios from "axios";
import { useState } from "react";

// Backend server (change the paths below if your FastAPI routes are different)
const API_URL = "http://127.0.0.1:8000";

function Logo() {
  return (
    <span className="nav-brand">
      <svg className="logo-mark" viewBox="0 0 40 40" aria-hidden="true">
        <defs>
          <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#5fd3b3" />
            <stop offset="1" stopColor="#4a8fe0" />
          </linearGradient>
        </defs>
        <g transform="rotate(-40 20 20)">
          <rect x="4" y="12" width="32" height="16" rx="8" fill="url(#lg)" />
          <rect x="20" y="12" width="16" height="16" rx="8" fill="#ffffff" fillOpacity="0.35" />
          <path d="M20 12v16" stroke="#ffffff" strokeWidth="1.5" />
        </g>
      </svg>
      <span className="logo-text">
        Pill<em>Sync</em>
      </span>
    </span>
  );
}

function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem("pillsync_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      localStorage.removeItem("pillsync_user");
      return null;
    }
  });

  // Interactive UI states
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  // Profile editing states
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState("patient");

  // Auth states
  const [loading, setLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("patient");
     const [toast, setToast] = useState(null);
  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };



  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isRegistering) {
        await axios.post(`${API_URL}/register`, {
          full_name: fullName,
          email: email,
          password: password,
          role: role,
        });
        showToast("Account created! Please log in.");

        setIsRegistering(false);
        setPassword("");
      } else {
        const response = await axios.post(`${API_URL}/login`, {
          email: email,
          password: password,
        });
        localStorage.setItem("pillsync_user", JSON.stringify(response.data));
        setCurrentUser(response.data);
        setPassword("");
      }
    } catch (error) {
      console.error(error);
      showToast(
        isRegistering
          ? "Registration failed! Email may already exist."
          : "Invalid email or password!"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.put(`${API_URL}/users/${currentUser.id}`, {
        full_name: editName,
        role: editRole,
      });
      const updatedUser = { ...currentUser, ...response.data };
      localStorage.setItem("pillsync_user", JSON.stringify(updatedUser));
      setCurrentUser(updatedUser);
      setIsEditing(false);
      showToast("Profile updated!");
    } catch (error) {
      console.error(error);
      showToast("Failed to update profile!", "error");
    }
  };

  if (currentUser) {
    return (
      <div>
        <nav className="navbar">
          <Logo />
          <div className="nav-right">
            <span className="role-badge">{currentUser.role}</span>
            <button
              className="logout-btn"
              onClick={() => {
                localStorage.removeItem("pillsync_user");
                setCurrentUser(null);
                setIsEditing(false);
                setActiveTab("overview");
              }}
            >
              Logout
            </button>
          </div>
        </nav>

        <div className="dashboard-main">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-label">Active Account</div>
              <div className="stat-value">{currentUser.full_name}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Access Role</div>
              <div className="stat-value" style={{ textTransform: "capitalize" }}>
                {currentUser.role}
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Today's Medications</div>
              <div className="stat-value">Done!</div>
            </div>
          </div>

          <div className="tab-switcher" style={{ maxWidth: "360px" }}>
            <button
              type="button"
              className={`tab-btn ${activeTab === "overview" ? "active" : ""}`}
              onClick={() => setActiveTab("overview")}
            >
              Overview
            </button>
            <button
              type="button"
              className={`tab-btn ${activeTab === "profile" ? "active" : ""}`}
              onClick={() => setActiveTab("profile")}
            >
              Profile Settings
            </button>
          </div>

          {activeTab === "overview" ? (
            <div className="card">
              <h2>Welcome back, {currentUser.full_name}!</h2>
              <p>
                Signed in as <strong>{currentUser.email}</strong>
              </p>
              <button
                type="button"
                style={{ maxWidth: "220px" }}
                onClick={() => setActiveTab("profile")}
              >
                Manage Account Profile →
              </button>
            </div>
          ) : (
            <div className="card">
              {isEditing ? (
                <form onSubmit={handleUpdateProfile}>
                  <h2>Edit Profile</h2>
                  <label>Full Name:</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                  />

                  <label>Role:</label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                  >
                    <option value="patient">Patient</option>
                    <option value="caregiver">Caregiver</option>
                    <option value="admin">Admin</option>
                  </select>

                  <button type="submit">Save Changes</button>
                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={() => setIsEditing(false)}
                  >
                    Cancel
                  </button>
                </form>
              ) : (
                <div>
                  <h2>Profile Details</h2>
                  <p>
                    <strong>Full Name:</strong> {currentUser.full_name}
                  </p>
                  <p>
                    <strong>Email:</strong> {currentUser.email}
                  </p>
                  <p>
                    <strong>Role:</strong> {currentUser.role}
                  </p>
                  <button
                    type="button"
                    style={{ maxWidth: "200px" }}
                    onClick={() => {
                      setEditName(currentUser.full_name);
                      setEditRole(currentUser.role);
                      setIsEditing(true);
                    }}
                  >
                    Edit Profile
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <nav className="navbar">
        <Logo />
        <span className="role-badge">AI Medication Platform</span>
      </nav>

      <div className="hero-wrapper">
        <div className="hero-left">
          <span className="pill-tag">Smart healthcare assistant</span>
          <h1>Thoughtful care,<br />every moment.</h1>
          <p className="hero-subtitle">
            A quiet companion for patients and caregivers: gentle reminders, effortless tracking and peace of mind, all in one place.
          </p>

          <ul className="about-list">
            <li>
              <span className="about-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 1112 0c0 7 3 8 3 8H3s3-1 3-8M10 20a2 2 0 004 0" /></svg>
              </span>
              <div>
                <strong>Gentle reminders</strong>
                <span>Never miss a dose, with schedules built around your day.</span>
              </div>
            </li>
            <li>
              <span className="about-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19V9M10 19V5M16 19v-7M22 19H2" /></svg>
              </span>
              <div>
                <strong>Simple tracking</strong>
                <span>See how consistently you take your medicines over time.</span>
              </div>
            </li>
            <li>
              <span className="about-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20s-8-5-8-11a4.5 4.5 0 018-2.8A4.5 4.5 0 0120 9c0 6-8 11-8 11z" /></svg>
              </span>
              <div>
                <strong>Care together</strong>
                <span>Caregivers can support patients and stay in the loop.</span>
              </div>
            </li>
          </ul>
        </div>

        <div className="auth-card">
          <div className="tab-switcher">
            <button
              type="button"
              className={`tab-btn ${!isRegistering ? "active" : ""}`}
              onClick={() => setIsRegistering(false)}
            >
              Sign In
            </button>
            <button
              type="button"
              className={`tab-btn ${isRegistering ? "active" : ""}`}
              onClick={() => setIsRegistering(true)}
            >
              Create Account
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            {isRegistering && (
              <div>
                <label>Full Name:</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />

                <label>Role:</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  <option value="patient">Patient</option>
                  <option value="caregiver">Caregiver</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            )}

            <label>Email:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <label>Password:</label>
            <div className="password-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            <button type="submit" disabled={loading}>
              {loading
                ? "Please wait..."
                : isRegistering
                ? "Create Account"
                : "Sign In"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default App;