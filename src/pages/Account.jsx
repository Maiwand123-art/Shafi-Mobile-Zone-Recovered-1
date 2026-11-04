import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { formatSolarDate } from "../lib/solarDate";
import {
  UserRound,
  MessageSquare,
  Smartphone,
  Bookmark,
} from "lucide-react";

export function Account() {
  const { user, profile } = useAuth();
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    if (user && supabase) {
      supabase
        .from("mobile_requests")
        .select("id,status,created_at,mobiles(name)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .then(({ data }) => setRequests(data || []));
    }
  }, [user]);

  return (
    <section className="section page-section">
      <div className="eyebrow">YOUR SPACE</div>
      <h1>
        Welcome{profile?.full_name ? ", " + profile.full_name : " back"}
      </h1>

      <p className="muted">
        Manage your account and keep track of your mobile requests.
      </p>

      <div className="dashboard-tiles">
        <Link to="/account/profile" className="dash-tile glass">
          <UserRound />
          <b>My profile</b>
          <small>Personal details</small>
        </Link>

        <Link to="/account/requests" className="dash-tile glass">
          <Smartphone />
          <b>My requests</b>
          <small>{requests.length} requests</small>
        </Link>

        <Link to="/account/messages" className="dash-tile glass">
          <MessageSquare />
          <b>Messages</b>
          <small>Store conversations</small>
        </Link>

        <Link to="/account/saved" className="dash-tile glass">
          <Bookmark />
          <b>Saved mobiles</b>
          <small>Your shortlist</small>
        </Link>
      </div>

      <div className="section-heading">
        <h2>Recent requests</h2>
        <Link className="text-link" to="/account/requests">
          View all
        </Link>
      </div>

      <div className="table-wrap glass">
        <table>
          <thead>
            <tr>
              <th>Mobile</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>

          <tbody>
            {requests.map((r) => (
              <tr key={r.id}>
                <td>{r.mobiles?.name || "Mobile request"}</td>
                <td>
                  <span className="status">{r.status}</span>
                </td>
                <td>{formatSolarDate(r.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {!requests.length && (
          <p className="muted table-empty">
            Your requests will appear here.
          </p>
        )}
      </div>
    </section>
  );
}

export function AccountList({ kind }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user || !supabase) return;

    const table =
      kind === "requests"
        ? "mobile_requests"
        : kind === "messages"
          ? "messages"
          : "favorites";

    const select =
      kind === "requests"
        ? "*,mobiles(name)"
        : kind === "messages"
          ? "*"
          : "*,mobiles(name)";

    supabase
      .from(table)
      .select(select)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        setItems(data || []);
        if (error) setError(error.message);
      });
  }, [user, kind]);

  return (
    <section className="section page-section">
      <div className="eyebrow">YOUR ACCOUNT</div>
      <h1>My {kind}</h1>

      {error && <p className="error">{error}</p>}

      <div className="list-stack">
        {items.map((x) => (
          <div className="list-row glass" key={x.id}>
            <div>
              <b>{x.mobiles?.name || x.subject || "Store message"}</b>
              <small>{x.message || x.body || x.status}</small>
              {x.created_at && (
                <small>Date: {formatSolarDate(x.created_at)}</small>
              )}
            </div>

            <span className="status">{x.status || "Saved"}</span>
          </div>
        ))}

        {!items.length && (
          <div className="empty-state glass">
            <h3>Nothing here yet</h3>
            <p>Your {kind} will show up here when available.</p>
          </div>
        )}
      </div>
    </section>
  );
}

export function Profile() {
  const { user, profile, refreshProfile } = useAuth();
  const [name, setName] = useState(profile?.full_name || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [note, setNote] = useState("");

  async function save(e) {
    e.preventDefault();

    const { error } = await supabase
      .from("profiles")
      .update({ full_name: name, phone })
      .eq("id", user.id);

    setNote(error ? error.message : "Profile updated.");
    await refreshProfile();
  }

  return (
    <section className="section page-section narrow">
      <div className="eyebrow">ACCOUNT SETTINGS</div>
      <h1>My profile</h1>

      <form className="form-stack glass form-panel" onSubmit={save}>
        <label className="field">
          <span>Full name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>

        <label className="field">
          <span>Email</span>
          <input value={user.email || ""} disabled />
        </label>

        <label className="field">
          <span>Phone</span>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </label>

        {note && <p className="success">{note}</p>}

        <button className="button">Save profile</button>
      </form>
    </section>
  );
}
