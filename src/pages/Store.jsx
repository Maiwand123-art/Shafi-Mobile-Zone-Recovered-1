import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Truck,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import PhoneCard from "../components/PhoneCard";
import { useAuth } from "../context/AuthContext";

export function Home() {
  const [phones, setPhones] = useState([]);
  const [stats, setStats] = useState({ phones: 0 });
  useEffect(() => {
    if (!supabase) return;
    supabase
      .from("mobiles")
      .select("id,name,brand,model,price,ram,storage,battery,camera,display,processor,condition,location,description,image_url,stock_quantity,is_featured,is_active,request_count,created_at,updated_at")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(8)
      .then(({ data }) => setPhones(data || []));
    supabase
      .from("mobiles")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true)
      .then(({ count }) => setStats({ phones: count || 0 }));
  }, []);
  return (
    <>
      <section className="hero">
        <div className="hero-glow" />
        <div className="hero-copy">
          <div className="eyebrow">
            <Sparkles size={14} /> THE NEXT-GEN PHONE STORE
          </div>
          <h1>
            Find the phone
            <br />
            that <em>moves you.</em>
          </h1>
          <p>
            Explore trusted smartphones, compare features and send a request
            directly to our team.
          </p>
          <div className="hero-actions">
            <Link to="/mobiles" className="button">
              Explore mobiles <ArrowRight size={17} />
            </Link>
            <Link to="/about" className="button button-ghost">
              Discover our store
            </Link>
          </div>
          <div className="hero-stats">
            <div>
              <b>{stats.phones}+</b>
              <small>Listed devices</small>
            </div>
            <div>
              <b>100%</b>
              <small>Personal service</small>
            </div>
            <div>
              <b>AFN</b>
              <small>Local pricing</small>
            </div>
          </div>
        </div>
        <div className="hero-device">
          <div className="device-halo" />
          <div className="device-frame">
            <div className="device-screen">
              <span>SHAFI</span>
              <b>ZONE</b>
              <small>DESIGNED FOR YOU</small>
            </div>
            <div className="camera-pill" />
          </div>
          <div className="floating-chip chip-one">Premium collection</div>
          <div className="floating-chip chip-two">Smart choices only</div>
        </div>
      </section>
      <section className="trust-strip">
        <div>
          <ShieldCheck />
          <span>
            <b>Trusted selection</b>
            <small>Clear device details</small>
          </span>
        </div>
        <div>
          <Truck />
          <span>
            <b>Direct requests</b>
            <small>Talk to our team</small>
          </span>
        </div>
        <div>
          <Sparkles />
          <span>
            <b>Personal support</b>
            <small>Here when you need us</small>
          </span>
        </div>
      </section>
      <section className="section">
        <div className="section-heading">
          <div>
            <div className="eyebrow">CURATED FOR YOU</div>
            <h2>Featured mobiles</h2>
          </div>
          <Link to="/mobiles" className="text-link">
            View all <ArrowRight size={15} />
          </Link>
        </div>
        {phones.length ? (
          <div className="phone-grid">
            {phones.map((p) => (
              <PhoneCard key={p.id} phone={p} />
            ))}
          </div>
        ) : (
          <EmptyPhones />
        )}
      </section>
    </>
  );
}
export function Mobiles() {
  const [phones, setPhones] = useState([]);
  const [query, setQuery] = useState("");
  const [condition, setCondition] = useState("All");
  useEffect(() => {
    if (!supabase) return;
    let q = supabase
      .from("mobiles")
      .select("id,name,brand,model,price,ram,storage,battery,camera,display,processor,condition,location,description,image_url,stock_quantity,is_featured,is_active,request_count,created_at,updated_at")
      .eq("is_active", true)
      .order("created_at", { ascending: false });
    if (condition !== "All") q = q.eq("condition", condition);
    q.then(({ data }) => setPhones(data || []));
  }, [condition]);
  const filtered = phones.filter((p) =>
    (p.name + " " + p.brand + " " + p.model)
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  return (
    <section className="section page-section">
      <div className="eyebrow">THE COLLECTION</div>
      <h1>Explore mobiles</h1>
      <p className="muted">Find your next device from our current listings.</p>
      <div className="toolbar">
        <div className="searchbox">
          <Search size={17} />
          <input
            placeholder="Search brand or model…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <select
          value={condition}
          onChange={(e) => setCondition(e.target.value)}
        >
          <option>All</option>
          <option>New</option>
          <option>Used</option>
        </select>
      </div>
      {filtered.length ? (
        <div className="phone-grid">
          {filtered.map((p) => (
            <PhoneCard key={p.id} phone={p} />
          ))}
        </div>
      ) : (
        <EmptyPhones />
      )}
    </section>
  );
}
export function PhoneDetails() {
  const { id } = useParams();
  const [phone, setPhone] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const { user } = useAuth();
  useEffect(() => {
    if (!supabase) return;
    supabase
      .from("mobiles")
      .select("id,name,brand,model,price,ram,storage,battery,camera,display,processor,condition,location,description,image_url,stock_quantity,is_featured,is_active,request_count,created_at,updated_at")
      .eq("id", id)
      .single()
      .then(({ data, error }) => {
        if (error) setError(error.message);
        setPhone(data);
      });
  }, [id]);
  async function requestPhone() {
    if (!user) {
      setError("Please sign in before sending a request.");
      return;
    }
    const { error } = await supabase
      .from("mobile_requests")
      .insert({
        mobile_id: id,
        user_id: user.id,
        message: message || "I am interested in this mobile.",
      });
    if (error) setError(error.message);
    else setError("Your request has been sent successfully.");
  }
  if (!phone)
    return <div className="center-state">{error || "Loading mobile…"}</div>;
  return (
    <section className="section detail-layout">
      <div className="detail-image glass">
        {phone.image_url ? (
          <img src={phone.image_url} alt={phone.name} />
        ) : (
          <div className="image-placeholder large">SHAFI ZONE</div>
        )}
      </div>
      <div className="detail-copy">
        <div className="eyebrow">
          {phone.brand} · {phone.condition}
        </div>
        <h1>{phone.name}</h1>
        <div className="detail-price">
          {Number(phone.price).toLocaleString()} <small>AFN</small>
        </div>
        <p className="muted">
          {phone.description ||
            "Contact our team for more information about this device."}
        </p>
        <div className="spec-grid">
          {[
            ["Model", phone.model],
            ["RAM", phone.ram],
            ["Storage", phone.storage],
            ["Battery", phone.battery],
            ["Camera", phone.camera],
            ["Display", phone.display],
            ["Processor", phone.processor],
            ["Location", phone.location],
          ].map(([k, v]) => (
            <div key={k}>
              <small>{k}</small>
              <b>{v || "—"}</b>
            </div>
          ))}
        </div>
        <label className="field">
          <span>Message to the store</span>
          <textarea
            rows="3"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ask about availability, condition or details…"
          />
        </label>
        {error && (
          <p className={error.includes("successfully") ? "success" : "error"}>
            {error}
          </p>
        )}
        <button className="button" onClick={requestPhone}>
          Send mobile request <ArrowRight size={16} />
        </button>
      </div>
    </section>
  );
}
function EmptyPhones() {
  return (
    <div className="empty-state glass">
      <div className="empty-icon">✦</div>
      <h3>New devices are on the way</h3>
      <p>
        There are no mobile listings here yet. The store team can add devices
        from the admin dashboard.
      </p>
    </div>
  );
}
