
import { useEffect, useState } from "react";
import "./index.css";

const API_URL = "http://localhost:5000/api";

const styles = `
* { box-sizing: border-box; }
body { margin: 0; font-family: Arial, sans-serif; background: #f3f6fb; color: #172033; }
.cc-app { min-height: 100vh; }
.cc-header { background: #123c69; color: white; padding: 18px 6%; display: flex; justify-content: space-between; align-items: center; gap: 15px; flex-wrap: wrap; }
.cc-brand { font-size: 25px; font-weight: 800; }
.cc-subtitle { font-size: 13px; opacity: .85; margin-top: 5px; }
.cc-button { border: 0; border-radius: 8px; padding: 11px 16px; background: #1769aa; color: white; cursor: pointer; font-weight: 600; }
.cc-button:hover { opacity: .9; }
.cc-button.secondary { background: white; color: #123c69; border: 1px solid #cbd5e1; }
.cc-button.danger { background: #b42318; }
.cc-main { width: min(1100px, 92%); margin: 30px auto; }
.cc-card { background: white; border: 1px solid #e1e7ef; border-radius: 14px; padding: 23px; margin-bottom: 22px; box-shadow: 0 4px 15px #17203308; }
.cc-auth { max-width: 460px; margin: 55px auto; }
.cc-grid { display: grid; grid-template-columns: repeat(auto-fit,minmax(220px,1fr)); gap: 18px; }
.cc-stats { display: grid; grid-template-columns: repeat(auto-fit,minmax(150px,1fr)); gap: 15px; margin-bottom: 22px; }
.cc-stat { background: white; border-radius: 12px; padding: 20px; border: 1px solid #e1e7ef; }
.cc-number { font-size: 29px; font-weight: 800; color: #1769aa; margin-top: 8px; }
.cc-label { color: #667085; font-size: 13px; }
.cc-field { display: flex; flex-direction: column; gap: 7px; margin-bottom: 15px; }
.cc-field label { font-weight: 600; font-size: 14px; }
.cc-field input, .cc-field select, .cc-field textarea { width: 100%; padding: 12px; border: 1px solid #cbd5e1; border-radius: 8px; font: inherit; background: white; }
.cc-field textarea { min-height: 100px; resize: vertical; }
.cc-request { border: 1px solid #e1e7ef; border-radius: 12px; padding: 18px; margin-top: 14px; overflow-wrap: anywhere; }
.cc-row { display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; }
.cc-badge { display: inline-block; border-radius: 20px; padding: 6px 10px; font-size: 12px; font-weight: 700; background: #fff0c2; color: #815500; }
.cc-badge.progress { background: #dbeafe; color: #1d4ed8; }
.cc-badge.resolved { background: #dcfce7; color: #166534; }
.cc-message { padding: 12px; border-radius: 8px; margin: 15px 0; background: #e0f2fe; color: #075985; overflow-wrap: anywhere; }
.cc-error { background: #fee2e2; color: #991b1b; }
.cc-muted { color: #667085; font-size: 14px; }
.cc-image { max-width: 220px; max-height: 180px; object-fit: cover; border-radius: 8px; margin-top: 10px; }
.cc-footer { text-align: center; padding: 25px; color: #667085; font-size: 13px; }
@media(max-width:600px) { .cc-header { padding: 16px 4%; } .cc-main { width: 94%; margin-top: 18px; } .cc-card { padding: 17px; } }
`;

function App() {
  const [token, setToken] = useState(() => localStorage.getItem("civic-token") || "");
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("civic-user") || "null");
    } catch {
      return null;
    }
  });

  const [authMode, setAuthMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [requests, setRequests] = useState([]);
  const [category, setCategory] = useState("Streetlight");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  const [filter, setFilter] = useState("All");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function api(path, options = {}) {
    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.message || "Something went wrong.");
    }

    return data;
  }

  function signOut() {
    localStorage.removeItem("civic-token");
    localStorage.removeItem("civic-user");
    setToken("");
    setUser(null);
    setRequests([]);
    setPassword("");
    setMessage("");
    setError("");
  }

  async function loadRequests() {
    try {
      const data = await api("/requests");
      setRequests(data.map((item) => ({
        id: item.id,
        code: item.request_code,
        category: item.category,
        location: item.location,
        description: item.description,
        image: item.image,
        status: item.status,
        createdAt: item.created_at,
        citizenName: item.citizen_name,
      })));
    } catch (err) {
      setError(err.message);
      if (err.message.toLowerCase().includes("log in") ||
          err.message.toLowerCase().includes("expired")) {
        signOut();
      }
    }
  }

  useEffect(() => {
    if (token && user) {
      loadRequests();
    }
    // Reload when the signed-in account changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, user?.id]);

  async function handleAuth(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    setBusy(true);

    try {
      if (authMode === "register") {
        await api("/auth/register", {
          method: "POST",
          body: JSON.stringify({ name, email, password }),
        });
        setAuthMode("login");
        setPassword("");
        setMessage("Account created successfully. Please log in.");
      } else {
        const data = await api("/auth/login", {
          method: "POST",
          body: JSON.stringify({ email, password }),
        });

        localStorage.setItem("civic-token", data.token);
        localStorage.setItem("civic-user", JSON.stringify(data.user));
        setToken(data.token);
        setUser(data.user);
        setPassword("");
        setMessage(`Welcome to CivicConnect, ${data.user.name}.`);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  function handleImage(event) {
    const file = event.target.files?.[0];
    setImage("");

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");
      event.target.value = "";
      return;
    }

    if (file.size > 500 * 1024) {
      setError("Please choose an image smaller than 500 KB.");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => setImage(String(reader.result || ""));
    reader.onerror = () => setError("Could not read that image.");
    reader.readAsDataURL(file);
  }

  async function submitRequest(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    setBusy(true);

    try {
      await api("/requests", {
        method: "POST",
        body: JSON.stringify({ category, location, description, image: image || null }),
      });

      setLocation("");
      setDescription("");
      setImage("");
      event.target.reset();
      setCategory("Streetlight");
      setMessage("Your service request has been submitted successfully.");
      await loadRequests();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function updateStatus(requestId, status) {
    setError("");
    setMessage("");

    try {
      await api(`/requests/${requestId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      setMessage("Request status updated successfully.");
      await loadRequests();
    } catch (err) {
      setError(err.message);
    }
  }

  const total = requests.length;
  const pending = requests.filter((r) => r.status === "Pending").length;
  const inProgress = requests.filter((r) => r.status === "In Progress").length;
  const resolved = requests.filter((r) => r.status === "Resolved").length;

  const visibleRequests = requests.filter((r) =>
    filter === "All" || r.status === filter
  );

  function statusBadge(status) {
    const className = status === "Resolved"
      ? "cc-badge resolved"
      : status === "In Progress"
        ? "cc-badge progress"
        : "cc-badge";

    return <span className={className}>{status}</span>;
  }

  function requestCard(request, admin = false) {
    return (
      <article className="cc-request" key={request.id}>
        <div className="cc-row">
          <div>
            <strong>{request.category}</strong>
            <div className="cc-muted">{request.code}</div>
          </div>
          {statusBadge(request.status)}
        </div>

        {admin && (
          <p><strong>Citizen:</strong> {request.citizenName || "Citizen"}</p>
        )}

        <p><strong>Location:</strong> {request.location}</p>
        <p>{request.description}</p>

        {request.image && (
          <img className="cc-image" src={request.image} alt="Attached evidence" />
        )}

        <p className="cc-muted">
          Submitted: {request.createdAt
            ? new Date(request.createdAt.replace(" ", "T") + (
                request.createdAt.includes("Z") ? "" : "Z"
              )).toLocaleString()
            : "Date unavailable"}
        </p>

        {admin && (
          <div className="cc-field">
            <label>Update request status</label>
            <select
              value={request.status}
              onChange={(event) => updateStatus(request.id, event.target.value)}
            >
              <option>Pending</option>
              <option>In Progress</option>
              <option>Resolved</option>
            </select>
          </div>
        )}
      </article>
    );
  }

  return (
    <div className="cc-app">
      <style>{styles}</style>

      <header className="cc-header">
        <div>
          <div className="cc-brand">CivicConnect</div>
          <div className="cc-subtitle">Public Service Request System</div>
        </div>

        {user && (
          <div className="cc-row">
            <span>Welcome, {user.name}</span>
            <button className="cc-button secondary" onClick={signOut}>
              Log out
            </button>
          </div>
        )}
      </header>

      {!user ? (
        <main className="cc-main">
          <section className="cc-card cc-auth">
            <h2>{authMode === "login" ? "Sign in to CivicConnect" : "Create an account"}</h2>
            <p className="cc-muted">
              {authMode === "login"
                ? "Log in to submit and track public service requests."
                : "Register as a citizen to report local service issues."}
            </p>

            {message && <div className="cc-message">{message}</div>}
            {error && <div className="cc-message cc-error">{error}</div>}

            <form onSubmit={handleAuth}>
              {authMode === "register" && (
                <div className="cc-field">
                  <label>Full name</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="Enter your full name"
                  />
                </div>
              )}

              <div className="cc-field">
                <label>Email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                />
              </div>

              <div className="cc-field">
                <label>Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={authMode === "register" ? 8 : 1}
                  placeholder={authMode === "register" ? "At least 8 characters" : "Enter your password"}
                />
              </div>

              <button className="cc-button" type="submit" disabled={busy}>
                {busy ? "Please wait..." : authMode === "login" ? "Log in" : "Create account"}
              </button>
            </form>

            <p className="cc-muted" style={{ marginTop: 20 }}>
              {authMode === "login" ? "Don't have an account?" : "Already registered?"}{" "}
              <button
                className="cc-button secondary"
                type="button"
                onClick={() => {
                  setAuthMode(authMode === "login" ? "register" : "login");
                  setError("");
                  setMessage("");
                }}
              >
                {authMode === "login" ? "Register here" : "Go to login"}
              </button>
            </p>

            <p className="cc-muted">
              Administrator demo access is available using the credentials configured for this project.
            </p>
          </section>
        </main>
      ) : (
        <main className="cc-main">
          {message && <div className="cc-message">{message}</div>}
          {error && <div className="cc-message cc-error">{error}</div>}

          <section style={{ marginBottom: 24 }}>
            <h1>{user.role === "admin" ? "Administrator Dashboard" : "Citizen Dashboard"}</h1>
            <p className="cc-muted">
              {user.role === "admin"
                ? "Review public service reports and update their progress."
                : "Report local issues and follow the progress of your requests."}
            </p>
          </section>

          {user.role === "admin" ? (
            <>
              <section className="cc-stats">
                <div className="cc-stat"><div className="cc-label">Total requests</div><div className="cc-number">{total}</div></div>
                <div className="cc-stat"><div className="cc-label">Pending</div><div className="cc-number">{pending}</div></div>
                <div className="cc-stat"><div className="cc-label">In progress</div><div className="cc-number">{inProgress}</div></div>
                <div className="cc-stat"><div className="cc-label">Resolved</div><div className="cc-number">{resolved}</div></div>
              </section>

              <section className="cc-card">
                <div className="cc-row">
                  <h2>All service requests</h2>
                  <button className="cc-button secondary" onClick={loadRequests}>Refresh</button>
                </div>

                <div className="cc-field">
                  <label>Filter by status</label>
                  <select value={filter} onChange={(e) => setFilter(e.target.value)}>
                    <option>All</option>
                    <option>Pending</option>
                    <option>In Progress</option>
                    <option>Resolved</option>
                  </select>
                </div>

                {visibleRequests.length
                  ? visibleRequests.map((request) => requestCard(request, true))
                  : <p className="cc-muted">No requests found.</p>}
              </section>
            </>
          ) : (
            <>
              <section className="cc-stats">
                <div className="cc-stat"><div className="cc-label">My requests</div><div className="cc-number">{total}</div></div>
                <div className="cc-stat"><div className="cc-label">Pending</div><div className="cc-number">{pending}</div></div>
                <div className="cc-stat"><div className="cc-label">In progress</div><div className="cc-number">{inProgress}</div></div>
                <div className="cc-stat"><div className="cc-label">Resolved</div><div className="cc-number">{resolved}</div></div>
              </section>

              <section className="cc-card">
                <h2>Submit a service request</h2>
                <p className="cc-muted">Describe the issue and where it is happening.</p>

                <form onSubmit={submitRequest}>
                  <div className="cc-grid">
                    <div className="cc-field">
                      <label>Service category</label>
                      <select value={category} onChange={(e) => setCategory(e.target.value)}>
                        <option>Streetlight</option>
                        <option>Water Supply</option>
                        <option>Garbage Collection</option>
                        <option>Road Maintenance</option>
                        <option>Drainage</option>
                        <option>Public Health</option>
                        <option>Other</option>
                      </select>
                    </div>

                    <div className="cc-field">
                      <label>Location</label>
                      <input
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        required
                        placeholder="Estate, road, or area"
                      />
                    </div>
                  </div>

                  <div className="cc-field">
                    <label>Description of the issue</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      required
                      minLength={5}
                      placeholder="Explain the issue clearly..."
                    />
                  </div>

                  <div className="cc-field">
                    <label>Attach an image (optional, maximum 500 KB)</label>
                    <input type="file" accept="image/*" onChange={handleImage} />
                    {image && <img className="cc-image" src={image} alt="Selected evidence" />}
                  </div>

                  <button className="cc-button" type="submit" disabled={busy}>
                    {busy ? "Submitting..." : "Submit request"}
                  </button>
                </form>
              </section>

              <section className="cc-card">
                <div className="cc-row">
                  <h2>My service requests</h2>
                  <button className="cc-button secondary" onClick={loadRequests}>Refresh</button>
                </div>

                <div className="cc-field">
                  <label>Filter by status</label>
                  <select value={filter} onChange={(e) => setFilter(e.target.value)}>
                    <option>All</option>
                    <option>Pending</option>
                    <option>In Progress</option>
                    <option>Resolved</option>
                  </select>
                </div>

                {visibleRequests.length
                  ? visibleRequests.map((request) => requestCard(request))
                  : <p className="cc-muted">You have not submitted any requests yet.</p>}
              </section>
            </>
          )}
        </main>
      )}

      <footer className="cc-footer">
        CivicConnect — Making public service reporting easier.
      </footer>
    </div>
  );
}

export default App;
