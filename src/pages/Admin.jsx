import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toGregorian, toJalaali, isValidJalaaliDate } from "jalaali-js";
import {
  Plus,
  Smartphone,
  Users,
  MessageSquare,
  TrendingUp,
  Pencil,
  Trash2,
  Eye,
  RefreshCw,
  Search,
  History,
} from "lucide-react";
import { supabase } from "../lib/supabase";

function getTodayJalali() {
  const now = new Date();

  const { jy, jm, jd } = toJalaali(
    now.getFullYear(),
    now.getMonth() + 1,
    now.getDate(),
  );

  return `${jy}/${String(jm).padStart(2, "0")}/${String(jd).padStart(2, "0")}`;
}

function jalaliToGregorian(date) {
  const match = /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/.exec(date.trim());

  if (!match) return null;

  const jy = Number(match[1]);
  const jm = Number(match[2]);
  const jd = Number(match[3]);

  if (!isValidJalaaliDate(jy, jm, jd)) return null;

  const { gy, gm, gd } = toGregorian(jy, jm, jd);

  return `${gy}-${String(gm).padStart(2, "0")}-${String(gd).padStart(2, "0")}`;
}

function formatSolarDate(date) {
  if (!date) return "-";

  const [gy, gm, gd] = String(date).slice(0, 10).split("-").map(Number);

  if (!gy || !gm || !gd) return "-";

  const { jy, jm, jd } = toJalaali(gy, gm, gd);

  return `${jy}/${String(jm).padStart(2, "0")}/${String(jd).padStart(2, "0")}`;
}
/* =========================
   ADMIN DASHBOARD
========================= */

export function AdminHome() {
  const [stats, setStats] = useState({
    available: 0, sold: 0, requests: 0, users: 0,
    sales: 0, soldPurchaseCost: 0, inventoryCost: 0,
    profit: 0, totalLoans: 0, totalPaid: 0, totalRemaining: 0,
  });

  const [capitalId, setCapitalId] = useState(null);
  const [capitalAmount, setCapitalAmount] = useState(0);
  const [capitalInput, setCapitalInput] = useState("");
  const [capitalSaved, setCapitalSaved] = useState(false);
  const [capitalSaving, setCapitalSaving] = useState(false);
  const [capitalMessage, setCapitalMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadDashboard() {
    if (!supabase) {
      setError("Database connection is unavailable.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const [
        mobilesResult,
        salesResult,
        requestsResult,
        usersResult,
        loansResult,
        capitalResult,
        paymentResult,
      ] = await Promise.all([
        supabase.from("mobiles").select("id,price,stock_quantity,is_active"),
        supabase.from("sales").select("id,mobile_id,total_amount,purchase_price"),
        supabase.from("mobile_requests").select("*", { count: "exact", head: true }),
        supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "customer"),
        supabase.from("loans").select("id,loan_amount,paid_amount,remaining_amount"),
        supabase.from("store_capital").select("id,amount").order("id", { ascending: false }).limit(1).maybeSingle(),
        supabase.from("loan_payments").select("loan_id,amount"),
      ]);

      const failed = [
        mobilesResult, salesResult, requestsResult,
        usersResult, loansResult, capitalResult, paymentResult,
      ].find((result) => result.error);

      if (failed) throw failed.error;

      const mobiles = mobilesResult.data || [];
      const salesData = salesResult.data || [];
      const loans = loansResult.data || [];
      const paymentData = paymentResult.data || [];
      const savedCapital = capitalResult.data;

      const paymentTotals = new Map();

      paymentData.forEach((payment) => {
        const current = paymentTotals.get(payment.loan_id) || 0;
        paymentTotals.set(
          payment.loan_id,
          current + Number(payment.amount || 0)
        );
      });

      setCapitalId(savedCapital?.id ?? null);
      setCapitalAmount(Number(savedCapital?.amount || 0));
      setCapitalInput(savedCapital ? String(savedCapital.amount) : "");
      setCapitalSaved(Boolean(savedCapital));

      const activeMobiles = mobiles.filter(
        (m) => m.is_active && Number(m.stock_quantity || 0) > 0
      );

      const available = activeMobiles.reduce(
        (sum, m) => sum + Number(m.stock_quantity || 0), 0
      );

      const inventoryCost = activeMobiles.reduce(
        (sum, m) => sum + Number(m.price || 0) * Number(m.stock_quantity || 0), 0
      );

      const totalSales = salesData.reduce(
        (sum, sale) => sum + Number(sale.total_amount || 0), 0
      );

      const soldPurchaseCost = salesData.reduce(
        (sum, sale) => sum + Number(sale.purchase_price || 0), 0
      );

      const totalLoans = loans.reduce(
        (sum, loan) => sum + Number(loan.loan_amount || 0), 0
      );

      const totalPaid = loans.reduce(
        (sum, loan) => sum + Math.max(
          Number(loan.paid_amount || 0),
          paymentTotals.get(loan.id) || 0
        ),
        0
      );

      const totalRemaining = loans.reduce(
        (sum, loan) => sum + Number(
          loan.remaining_amount ??
          Math.max(0, Number(loan.loan_amount || 0) - Number(loan.paid_amount || 0))
        ), 0
      );

      setStats({
        available,
        sold: salesData.filter((sale) => sale.mobile_id).length,
        requests: requestsResult.count || 0,
        users: usersResult.count || 0,
        sales: totalSales,
        soldPurchaseCost,
        inventoryCost,
        profit: totalSales - soldPurchaseCost + totalPaid,
        totalLoans,
        totalPaid,
        totalRemaining,
      });
    } catch (err) {
      setError(err.message || "Unable to load dashboard.");
    } finally {
      setLoading(false);
    }
  }

  async function saveCapital() {
    const amount = Number(capitalInput);

    if (capitalInput.trim() === "" || !Number.isFinite(amount) || amount < 0) {
      setCapitalMessage("Enter a valid capital amount.");
      return;
    }

    setCapitalSaving(true);
    setCapitalMessage("");

    try {
      let result;

      if (capitalId !== null) {
        result = await supabase
          .from("store_capital")
          .update({ amount, updated_at: new Date().toISOString() })
          .eq("id", capitalId)
          .select("id,amount")
          .single();
      } else {
        result = await supabase
          .from("store_capital")
          .insert({ amount })
          .select("id,amount")
          .single();
      }

      if (result.error) throw result.error;

      setCapitalId(result.data.id);
      setCapitalAmount(Number(result.data.amount));
      setCapitalInput(String(result.data.amount));
      setCapitalSaved(true);
      setCapitalMessage("Capital saved successfully.");
    } catch (err) {
      setCapitalMessage(err.message || "Unable to save capital.");
    } finally {
      setCapitalSaving(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  const capitalWithLoans = capitalAmount + stats.totalRemaining;

  return (
    <section className="section page-section">
      <div className="admin-heading">
        <div>
          <div className="eyebrow">CONTROL CENTER</div>
          <h1>Admin Dashboard</h1>
          <p className="muted">Your store at a glance.</p>
        </div>
        <div className="quick-links">
          <button type="button" className="button" onClick={loadDashboard} disabled={loading}>
            <RefreshCw size={16} />
            {loading ? "Refreshing..." : "Refresh"}
          </button>
          <Link to="/admin/mobiles/new" className="button">
            <Plus size={16} /> Add mobile
          </Link>
        </div>
      </div>

      {error && <p className="error">{error}</p>}

      <div className="glass panel" style={{ marginBottom: 20 }}>
        <h2>Store Capital</h2>
        <p className="muted">Enter your actual store capital. You can edit it whenever needed.</p>

        <div className="form-group" style={{ maxWidth: 420 }}>
          <label htmlFor="general-capital">General Capital (AFN)</label>
          <input
            id="general-capital"
            type="number"
            min="0"
            step="0.01"
            placeholder="Enter your capital"
            value={capitalInput}
            onChange={(e) => setCapitalInput(e.target.value)}
          />
        </div>

        <div className="quick-links" style={{ marginTop: 12 }}>
          <button
            type="button"
            className="button"
            onClick={saveCapital}
            disabled={capitalSaving}
          >
            {capitalSaving ? "Saving..." : capitalSaved ? "Update Capital" : "Save Capital"}
          </button>
          <span className="muted">
            Current Capital: {capitalSaved ? `${capitalAmount.toLocaleString()} AFN` : "Not set"}
          </span>
        </div>

        {capitalMessage && <p className="muted">{capitalMessage}</p>}

        <div style={{ marginTop: 18 }}>
          <h3>Capital With Loans</h3>
          <p className="muted">
            {capitalSaved
              ? `${capitalWithLoans.toLocaleString()} AFN`
              : "Enter and save your General Capital first."}
          </p>
          <small className="muted">
            General Capital + Remaining Customer Loans
          </small>
        </div>
      </div>

      <div className="stats-grid">
        <Stat icon={<Smartphone />} label="Available Mobiles" value={stats.available.toLocaleString()} />
        <Stat icon={<History />} label="Sold Mobiles" value={stats.sold.toLocaleString()} />
        <Stat icon={<TrendingUp />} label="Sales Revenue" value={`${stats.sales.toLocaleString()} AFN`} />
        <Stat icon={<TrendingUp />} label="Estimated Profit" value={`${stats.profit.toLocaleString()} AFN`} />
        <Stat icon={<Smartphone />} label="Available Stock Cost" value={`${stats.inventoryCost.toLocaleString()} AFN`} />
        <Stat icon={<Smartphone />} label="Sold Purchase Cost" value={`${stats.soldPurchaseCost.toLocaleString()} AFN`} />
        <Stat icon={<Users />} label="Total Loans" value={`${stats.totalLoans.toLocaleString()} AFN`} />
        <Stat icon={<Users />} label="Loan Payments Received" value={`${stats.totalPaid.toLocaleString()} AFN`} />
        <Stat icon={<Users />} label="Remaining Loans" value={`${stats.totalRemaining.toLocaleString()} AFN`} />
        <Stat icon={<MessageSquare />} label="Customer Requests" value={stats.requests} />
        <Stat icon={<Users />} label="Customers" value={stats.users} />
      </div>

      <div className="admin-columns">
        <div className="glass panel">
          <h2>Store Overview</h2>
          <p className="muted">Review your inventory, sales, profit and loan balances.</p>
          <Link to="/admin/mobiles" className="text-link">Manage mobiles</Link>
        </div>
        <div className="glass panel">
          <h2>Quick Actions</h2>
          <div className="quick-links">
            <Link to="/admin/mobiles/new">Add a mobile</Link>
            <Link to="/admin/sales">Record a sale</Link>
            <Link to="/admin/sold-mobiles">Sold mobiles</Link>
            <Link to="/admin/loans">Loans management</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
/* =========================
   SOLD MOBILES HISTORY
========================= */



export function AdminMobiles() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  async function load() {
    const { data, error } = await supabase
      .from("mobiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setError(error.message);
      return;
    }

    setItems(data || []);
    setError("");
  }

  useEffect(() => {
    load();
  }, []);

  async function remove(id) {
    if (!confirm("Hide this mobile listing?")) return;

    const { error } = await supabase
      .from("mobiles")
      .update({ is_active: false })
      .eq("id", id);

    if (error) setError(error.message);
    else load();
  }

  const filtered = items.filter((p) =>
    [p.name, p.brand, p.model]
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  function downloadCSV() {
    const columns = ["Name", "Brand", "Model", "Price AFN", "Stock", "Status"];
    const rows = filtered.map((p) => [
      p.name,
      p.brand,
      p.model,
      p.price,
      p.stock_quantity,
      p.is_active ? "Active" : "Hidden",
    ]);

    const escapeCSV = (value) =>
      `"${String(value ?? "").replace(/"/g, '""')}"`;

    const csv = [columns, ...rows]
      .map((row) => row.map(escapeCSV).join(","))
      .join("\r\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "shafi-mobile-inventory.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="section page-section">
      <div className="admin-heading">
        <div>
          <div className="eyebrow">INVENTORY</div>
          <h1>Manage mobiles</h1>
        </div>
        <Link to="/admin/mobiles/new" className="button">
          <Plus size={16} /> Add mobile
        </Link>
      </div>

      {error && <p className="error">{error}</p>}

      <div className="glass inline-form">
        <label className="field">
          <span>Search mobiles</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, brand or model..."
          />
        </label>
        <button type="button" className="button" onClick={downloadCSV}>
          Download CSV
        </button>
        <button type="button" className="button" onClick={load}>
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      <div className="table-wrap glass">
        <table>
          <thead>
            <tr>
              <th>Mobile</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id}>
                <td>
                  <b>{p.name}</b>
                  <small className="cell-sub">
                    {p.brand} · {p.model}
                  </small>
                </td>
                <td>{Number(p.price).toLocaleString()} AFN</td>
                <td>{p.stock_quantity}</td>
                <td>{p.is_active ? "Active" : "Hidden"}</td>
                <td className="actions-cell">
                  <Link
                    to={`/admin/mobiles/${p.id}/edit`}
                    title="Edit mobile"
                  >
                    <Pencil size={16} />
                  </Link>
                  <button
                    type="button"
                    onClick={() => remove(p.id)}
                    title="Hide mobile"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {!filtered.length && (
          <p className="table-empty muted">
            No matching mobile listings found.
          </p>
        )}
      </div>
    </section>
  );
}
export function MobileEditor({ edit = false }) {
  const [form, setForm] = useState({
    name: "",
    imei: "",
    brand: "",
    model: "",
    price: "",
    ram: "",
    storage: "",
    battery: "",
    camera: "",
    display: "",
    processor: "",
    condition: "New",
    location: "",
    stock_quantity: 1,
    description: "",
    image_url: "",
    is_featured: false,
  });
  const [file, setFile] = useState(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const id = window.location.pathname.split("/")[3];
  useEffect(() => {
    if (edit && id)
      supabase
        .from("mobiles")
        .select("*")
        .eq("id", id)
        .single()
        .then(({ data }) => data && setForm({ ...form, ...data }));
  }, []);
  function change(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
  }
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setNote("");
    try {
      const imei = String(form.imei || "").trim();
      if (imei && !/^\d+$/.test(imei)) {
        throw new Error("IMEI must contain numbers only.");
      }

      let image_url = form.image_url;
      if (file) {
        const path = `${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "-")}`;
        const { error: upErr } = await supabase.storage
          .from("mobile-images")
          .upload(path, file, { upsert: false });
        if (upErr) throw upErr;
        image_url = supabase.storage.from("mobile-images").getPublicUrl(path)
          .data.publicUrl;
      }
      const payload = {
        ...form,
        image_url,
        price: Number(form.price),
        stock_quantity: Number(form.stock_quantity),
        is_active: true,
      };
      const result = edit
        ? await supabase.from("mobiles").update(payload).eq("id", id)
        : await supabase.from("mobiles").insert(payload);
      if (result.error) throw result.error;
      setNote("Mobile saved successfully.");
      if (!edit)
        setForm({
          name: "",
    imei: "",
          brand: "",
          model: "",
          price: "",
          ram: "",
          storage: "",
          battery: "",
          camera: "",
          display: "",
          processor: "",
          condition: "New",
          location: "",
          stock_quantity: 1,
          description: "",
          image_url: "",
          is_featured: false,
        });
    } catch (x) {
      setNote(x.message);
    } finally {
      setBusy(false);
    }
  }
  const fields = [
    ["name", "Mobile name"],
    ["brand", "Brand"],
    ["model", "Model"],
    ["imei", "IMEI (Optional)"],
    ["price", "Price (AFN)"],
    ["ram", "RAM"],
    ["storage", "Storage"],
    ["battery", "Battery"],
    ["camera", "Camera"],
    ["display", "Display"],
    ["processor", "Processor"],
    ["location", "Location"],
    ["stock_quantity", "Stock quantity"],
    ["image_url", "Image URL"],
  ];
  return (
    <section className="section page-section">
      <div className="eyebrow">INVENTORY MANAGEMENT</div>
      <h1>{edit ? "Edit mobile" : "Add a new mobile"}</h1>
      <form className="glass editor-form" onSubmit={submit}>
        <div className="editor-grid">
          {fields.map(([k, label]) => (
            <label className="field" key={k}>
              <span>{label}</span>
              <input
                required={["name", "brand", "price"].includes(k)}
                type={
                  ["price", "stock_quantity"].includes(k) ? "number" : "text"
                }
                maxLength={undefined}
                inputMode={k === "imei" ? "numeric" : undefined}
                value={form[k] ?? ""}
                onChange={(e) => change(k, k === "imei" ? e.target.value.replace(/\D/g, "") : e.target.value)}
              />
            </label>
          ))}
          <label className="field">
            <span>Condition</span>
            <select
              value={form.condition}
              onChange={(e) => change("condition", e.target.value)}
            >
              <option>New</option>
              <option>Used</option>
            </select>
          </label>
          <label className="field">
            <span>Upload image</span>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files[0])}
            />
          </label>
          <label className="field full">
            <span>Description</span>
            <textarea
              rows="4"
              value={form.description}
              onChange={(e) => change("description", e.target.value)}
            />
          </label>
          <label className="check-field">
            <input
              type="checkbox"
              checked={form.is_featured}
              onChange={(e) => change("is_featured", e.target.checked)}
            />{" "}
            Feature this mobile
          </label>
        </div>
        {note && (
          <p className={note.includes("successfully") ? "success" : "error"}>
            {note}
          </p>
        )}
        <button className="button" disabled={busy}>
          {busy ? "Savingâ€¦" : "Save mobile"}
        </button>
      </form>
    </section>
  );
}
export function AdminRequests() {
  const [items, setItems] = useState([]);
  const [note, setNote] = useState("");
  async function load() {
    const { data } = await supabase
      .from("mobile_requests")
      .select("*,profiles(full_name,email),mobiles(name)")
      .order("created_at", { ascending: false });
    setItems(data || []);
  }
  useEffect(() => {
    load();
  }, []);
  async function update(id, status) {
    const { error } = await supabase
      .from("mobile_requests")
      .update({ status })
      .eq("id", id);
    setNote(error?.message || "Request updated.");
    load();
  }
  return (
    <section className="section page-section">
      <div className="eyebrow">CUSTOMER CARE</div>
      <h1>Mobile requests</h1>
      {note && <p className="success">{note}</p>}
      <div className="list-stack">
        {items.map((x) => (
          <div className="list-row glass" key={x.id}>
            <div>
              <b>{x.mobiles?.name || "Mobile request"}</b>
              <small>
                {x.profiles?.full_name || x.profiles?.email || "Customer"} Â·{" "}
                {x.message}
              </small>
              <small>{new Date(x.created_at).toLocaleString()}</small>
            </div>
            <div className="row-actions">
              <span className="status">{x.status}</span>
              <select
                value={x.status}
                onChange={(e) => update(x.id, e.target.value)}
              >
                <option>pending</option>
                <option>contacted</option>
                <option>approved</option>
                <option>completed</option>
                <option>rejected</option>
              </select>
            </div>
          </div>
        ))}
        {!items.length && (
          <div className="empty-state glass">No customer requests yet.</div>
        )}
      </div>
    </section>
  );
}
export function AdminMessages() {
  const [items, setItems] = useState([]);
  useEffect(() => {
    supabase
      .from("messages")
      .select("*,profiles(full_name,email)")
      .order("created_at", { ascending: false })
      .then(({ data }) => setItems(data || []));
  }, []);
  return (
    <section className="section page-section">
      <div className="eyebrow">INBOX</div>
      <h1>Customer messages</h1>
      <div className="list-stack">
        {items.map((x) => (
          <div className="list-row glass" key={x.id}>
            <div>
              <b>{x.subject || "Customer message"}</b>
              <small>
                {x.profiles?.full_name || x.profiles?.email} Â· {x.body}
              </small>
            </div>
            <span className="status">{x.status}</span>
          </div>
        ))}
        {!items.length && (
          <div className="empty-state glass">No messages yet.</div>
        )}
      </div>
    </section>
  );
}
export function AdminSales() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("sales")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) setNote(error.message);
    else {
      setItems(data || []);
      setNote("Sales records refreshed.");
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = items.filter((x) => {
    const q = search.toLowerCase();
    return [
      x.description,
      x.mobile_name,
      x.customer_name,
      x.customer_phone,
      x.receipt_number,
      x.total_amount
    ].some((v) => String(v ?? "").toLowerCase().includes(q));
  });

  async function removeSale(x) {
    if (x.mobile_id) {
      setNote("This sale is linked to inventory. Safe deletion requires stock adjustment.");
      return;
    }

    if (!window.confirm("Are you sure you want to delete this sale record?")) return;

    const { error } = await supabase
      .from("sales")
      .delete()
      .eq("id", x.id);

    if (error) setNote(error.message);
    else {
      setNote("Sale record deleted.");
      load();
    }
  }

  function downloadCsv() {
    const headers = [
      "Date", "Customer", "Mobile", "Description",
      "Total Amount", "Paid Amount", "Due Amount", "Receipt"
    ];

    const rows = filtered.map((x) => [
      x.sale_date || x.created_at,
      x.customer_name,
      x.mobile_name,
      x.description,
      x.total_amount,
      x.paid_amount,
      x.due_amount,
      x.receipt_number
    ]);

    const csv = [headers, ...rows]
      .map((row) =>
        row.map((v) => '"' + String(v ?? "").replace(/"/g, '""') + '"').join(",")
      )
      .join("\r\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;"
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "shafi-sales-records.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="section page-section">
      <div className="eyebrow">SALES MANAGEMENT</div>
      <h1>Sales records</h1>

      <div className="glass inline-form">
        <label className="field">
          <span>Search sales</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Customer, mobile, receipt or amount..."
          />
        </label>

        <button
          type="button"
          className="button"
          onClick={load}
          disabled={loading}
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>

        <button
          type="button"
          className="button"
          onClick={downloadCsv}
          disabled={!filtered.length}
        >
          Download CSV
        </button>
      </div>

      {note && <p className="success">{note}</p>}

      <div className="table-wrap glass">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Customer</th>
              <th>Mobile / Description</th>
              <th>Total</th>
              <th>Paid</th>
              <th>Due</th>
              <th>Receipt</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((x) => (
              <tr key={x.id}>
                <td>{x.sale_date || new Date(x.created_at).toLocaleDateString()}</td>
                <td>{x.customer_name || "—"}</td>
                <td>{x.mobile_name || x.description || "—"}</td>
                <td>{Number(x.total_amount || 0).toLocaleString()} AFN</td>
                <td>{Number(x.paid_amount || 0).toLocaleString()} AFN</td>
                <td>{Number(x.due_amount || 0).toLocaleString()} AFN</td>
                <td>{x.receipt_number || "—"}</td>
                <td>
                  <button type="button" className="button" onClick={() => removeSale(x)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {!filtered.length && (
              <tr>
                <td colSpan="8">No sales records found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
function Stat({ icon, label, value }) {
  return (
    <div className="stat-card glass">
      <span className="stat-icon">{icon}</span>
      <small>{label}</small>
      <b>{value}</b>
    </div>
  );
}
export function AdminSoldMobiles() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  async function load() {
    setLoading(true);
    setError("");

    const { data, error } = await supabase
      .from("sales")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setError(error.message);
      setItems([]);
    } else {
      setItems(data || []);
    }

    setLoading(false);
  }

  async function removeSoldSale(x) {
    if (x.mobile_id) {
      setError("This sale is linked to inventory. Safe deletion requires stock adjustment.");
      return;
    }

    if (!window.confirm("Delete this sold-mobile record? This cannot be undone.")) return;

    const { error } = await supabase
      .from("sales")
      .delete()
      .eq("id", x.id);

    if (error) setError(error.message);
    else {
      setError("");
      load();
    }
  }

  function downloadSoldCsv() {
    const headers = ["Date", "Receipt", "Mobile", "Customer", "Phone", "Sale Total", "Purchase Cost", "Profit", "Paid", "Due"];
    const rows = filtered.map((x) => [
      x.sale_date,
      x.receipt_number,
      x.mobile_name,
      x.customer_name,
      x.customer_phone,
      x.total_amount,
      x.purchase_price,
      Number(x.total_amount || 0) - Number(x.purchase_price || 0),
      x.paid_amount,
      x.due_amount
    ]);

    const csv = [headers, ...rows]
      .map(row => row.map(v => '"' + String(v ?? "").replace(/"/g, '""') + '"').join(","))
      .join("\r\n");

    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "shafi-sold-mobiles.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = items.filter((x) => {
    const term = search.trim().toLowerCase();

    if (!term) return true;

    return [
      x.mobile_name,
      x.mobile_imei,
      x.customer_name,
      x.customer_phone,
      x.receipt_number,
      x.description,
    ].some((value) =>
      String(value || "")
        .toLowerCase()
        .includes(term),
    );
  });

  const totalProfit = filtered.reduce(
    (sum, x) =>
      sum + Number(x.total_amount || 0) - Number(x.purchase_price || 0),
    0,
  );

  const totalSales = filtered.reduce(
    (sum, x) => sum + Number(x.total_amount || 0),
    0,
  );

  return (
    <section className="section page-section">
      <div className="admin-heading">
        <div>
          <div className="eyebrow">SALES ARCHIVE</div>
          <h1>Sold Mobiles</h1>
          <p className="muted">Complete history of sold mobile phones.</p>
        </div>

        <button className="button" onClick={downloadSoldCsv} disabled={!filtered.length}>Download CSV</button>
        <button className="button" onClick={load} disabled={loading}>
          <RefreshCw size={16} />
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {error && <p className="error">{error}</p>}

      <div className="stats-grid">
        <Stat
          icon={<Smartphone />}
          label="Sold Mobiles"
          value={filtered.length}
        />

        <Stat
          icon={<TrendingUp />}
          label="Total Sales"
          value={`${totalSales.toLocaleString()} AFN`}
        />

        <Stat
          icon={<TrendingUp />}
          label="Total Profit"
          value={`${totalProfit.toLocaleString()} AFN`}
        />
      </div>

      <div className="glass panel">
        <label className="field">
          <span>
            <Search size={15} /> Search sold mobiles
          </span>

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Mobile, IMEI, customer, phone or receipt..."
          />
        </label>
      </div>

      <div className="table-wrap glass">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Receipt</th>
              <th>Action</th>
              <th>Mobile</th>
              <th>IMEI</th>
              <th>Customer</th>
              <th>Phone</th>
              <th>Sale Total</th>
              <th>Purchase Cost</th>
              <th>Profit</th>
              <th>Paid</th>
              <th>Due</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {!loading &&
              filtered.map((x) => {
                const profit =
                  Number(x.total_amount || 0) - Number(x.purchase_price || 0);

                return (
                  <tr key={x.id}>
                    <td>{formatSolarDate(x.sale_date)}</td>
                    <td>{x.receipt_number || "-"}</td>
                    <td><button type="button" className="button" onClick={() => removeSoldSale(x)}>Delete</button></td>
                    <td>{x.mobile_name || x.description || "-"}</td>
                    <td>{x.mobile_imei || "-"}</td>
                    <td>{x.customer_name || "-"}</td>
                    <td>{x.customer_phone || "-"}</td>
                    <td>{Number(x.total_amount || 0).toLocaleString()} AFN</td>
                    <td>
                      {Number(x.purchase_price || 0).toLocaleString()} AFN
                    </td>
                    <td>{profit.toLocaleString()} AFN</td>
                    <td>{Number(x.paid_amount || 0).toLocaleString()} AFN</td>
                    <td>{Number(x.due_amount || 0).toLocaleString()} AFN</td>
                  </tr>
                );
              })}

            {loading && (
              <tr>
                <td colSpan="12">Loading sold mobiles...</td>
              </tr>
            )}

            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan="12">No sold mobiles found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}




export function AdminLoans() {
  const [loans, setLoans] = useState([]);
  const [payments, setPayments] = useState([]);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [editingLoan, setEditingLoan] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    borrower_name: "",
    borrower_phone: "",
    borrower_address: "",
    loan_amount: "",
    loan_date: getTodayJalali(),
    due_date: "",
    notes: "",
  });

  const [payment, setPayment] = useState({
    amount: "",
    payment_date: getTodayJalali(),
    notes: "",
  });

  async function loadLoans() {
    setLoading(true);
    setError("");

    const { data, error } = await supabase
      .from("loans")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setError(error.message);
    } else {
      setLoans(data || []);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadLoans();
  }, []);

  async function loadPayments(loan) {
    setSelectedLoan(loan);
    setPayments([]);
    setMessage("");
    setError("");

    const { data, error } = await supabase
      .from("loan_payments")
      .select("*")
      .eq("loan_id", loan.id)
      .order("created_at", { ascending: false });

    if (error) {
      setError(error.message);
      return;
    }

    setPayments(data || []);
  }

  function editLoan(loan) {
    setEditingLoan(loan);
    setForm({
      borrower_name: loan.borrower_name || "",
      borrower_phone: loan.borrower_phone || "",
      borrower_address: loan.borrower_address || "",
      loan_amount: String(loan.loan_amount || ""),
      loan_date: formatSolarDate(loan.loan_date),
      due_date: loan.due_date ? formatSolarDate(loan.due_date) : "",
      notes: loan.notes || "",
    });
    setError("");
    setMessage("");
  }

  async function deleteLoan(loan) {
    if (!window.confirm(`Delete loan for ${loan.borrower_name}?`)) return;

    setError("");
    setMessage("");

    const { count, error: paymentCheckError } = await supabase
      .from("loan_payments")
      .select("id", { count: "exact", head: true })
      .eq("loan_id", loan.id);

    if (paymentCheckError) {
      setError(paymentCheckError.message);
      return;
    }

    if (count > 0) {
      setError("This loan has payment history and cannot be deleted.");
      return;
    }

    const { error: deleteError } = await supabase
      .from("loans")
      .delete()
      .eq("id", loan.id);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    if (selectedLoan?.id === loan.id) {
      setSelectedLoan(null);
      setPayments([]);
    }

    setMessage("Loan deleted successfully.");
    await loadLoans();
  }

  async function addLoan(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    const amount = Number(form.loan_amount);
    const loanDate = jalaliToGregorian(form.loan_date);
    const dueDate = form.due_date
      ? jalaliToGregorian(form.due_date)
      : null;

    if (!form.borrower_name.trim() || !Number.isFinite(amount) || amount <= 0) {
      setError("Enter a borrower name and a valid loan amount.");
      setSaving(false);
      return;
    }

    if (!loanDate || (form.due_date && !dueDate)) {
      setError("Enter valid Solar Hijri dates, for example 1405/08/13.");
      setSaving(false);
      return;
    }

    const payload = {
      borrower_name: form.borrower_name.trim(),
      borrower_phone: form.borrower_phone.trim(),
      borrower_address: form.borrower_address.trim(),
      loan_amount: amount,
      loan_date: loanDate,
      due_date: dueDate,
      notes: form.notes.trim(),
    };

    if (editingLoan) {
      const paid = Number(editingLoan.paid_amount || 0);

      if (amount < paid) {
        setError("Loan amount cannot be less than the amount already received.");
        setSaving(false);
        return;
      }

      payload.status =
        amount <= paid ? "paid" : paid > 0 ? "partial" : "pending";

      const { error } = await supabase
        .from("loans")
        .update(payload)
        .eq("id", editingLoan.id);

      if (error) {
        setError(error.message);
      } else {
        setMessage("Loan updated successfully.");
        setEditingLoan(null);
        setForm({
          borrower_name: "",
          borrower_phone: "",
          borrower_address: "",
          loan_amount: "",
          loan_date: getTodayJalali(),
          due_date: "",
          notes: "",
        });
        await loadLoans();
      }
    } else {
      const { error } = await supabase.from("loans").insert(payload);

      if (error) {
        setError(error.message);
      } else {
        setForm({
          borrower_name: "",
          borrower_phone: "",
          borrower_address: "",
          loan_amount: "",
          loan_date: getTodayJalali(),
          due_date: "",
          notes: "",
        });
        setMessage("Loan added successfully.");
        await loadLoans();
      }
    }

    setSaving(false);
  }
  async function addPayment(e) {
    e.preventDefault();

    if (!selectedLoan) return;

    const amount = Number(payment.amount);
    const remaining = Number(selectedLoan.remaining_amount || 0);
    const paymentDate = jalaliToGregorian(payment.payment_date);

    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Enter a valid payment amount.");
      return;
    }

    if (amount > remaining) {
      setError("Payment cannot exceed the remaining balance.");
      return;
    }

    if (!paymentDate) {
      setError("Enter a valid Solar Hijri payment date.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    const newPaid = Number(selectedLoan.paid_amount || 0) + amount;
    const newStatus =
      newPaid >= Number(selectedLoan.loan_amount)
        ? "paid"
        : "partial";

    const { error: paymentError } = await supabase
      .from("loan_payments")
      .insert({
        loan_id: selectedLoan.id,
        amount,
        payment_date: paymentDate,
        notes: payment.notes.trim(),
      });

    if (paymentError) {
      setError(paymentError.message);
      setSaving(false);
      return;
    }

    const { error: updateError } = await supabase
      .from("loans")
      .update({
        paid_amount: newPaid,
        status: newStatus,
      })
      .eq("id", selectedLoan.id);

    if (updateError) {
      setError(
        "Payment record was created, but the loan balance could not be updated. Please contact the administrator."
      );
    } else {
      setPayment({
        amount: "",
        payment_date: getTodayJalali(),
        notes: "",
      });

      setMessage("Payment recorded successfully.");
      await loadLoans();

      const updatedLoan = {
        ...selectedLoan,
        paid_amount: newPaid,
        remaining_amount:
          Number(selectedLoan.loan_amount) - newPaid,
        status: newStatus,
      };

      await loadPayments(updatedLoan);
    }

    setSaving(false);
  }

  const totalLoans = loans.reduce(
    (sum, loan) => sum + Number(loan.loan_amount || 0),
    0
  );

  const totalPaid = loans.reduce(
    (sum, loan) => sum + Number(loan.paid_amount || 0),
    0
  );

  const totalRemaining = loans.reduce(
    (sum, loan) => sum + Number(loan.remaining_amount || 0),
    0
  );

  return (
    <section className="section page-section">
      <div className="admin-heading">
        <div>
          <div className="eyebrow">FINANCIAL MANAGEMENT</div>
          <h1>Loans Management</h1>
          <p className="muted">Manage borrowers, payments and balances.</p>
        </div>

        <Link to="/admin" className="button">
          Back to Dashboard
        </Link>
      </div>

      {error && <p className="error">{error}</p>}
      {message && <p className="success">{message}</p>}

      <div className="stats-grid">
        <Stat
          icon={<Users />}
          label="Borrowers"
          value={loans.length}
        />
        <Stat
          icon={<TrendingUp />}
          label="Total Loans"
          value={`${totalLoans.toLocaleString()} AFN`}
        />
        <Stat
          icon={<TrendingUp />}
          label="Total Received"
          value={`${totalPaid.toLocaleString()} AFN`}
        />
        <Stat
          icon={<TrendingUp />}
          label="Remaining Loans"
          value={`${totalRemaining.toLocaleString()} AFN`}
        />
      </div>

      <div className="glass panel">
        <h2>{editingLoan ? "Edit Loan" : "Add New Loan"}</h2>

        <form onSubmit={addLoan} className="form-grid">
          <label className="field">
            <span>Borrower Name *</span>
            <input
              required
              value={form.borrower_name}
              onChange={(e) =>
                setForm({ ...form, borrower_name: e.target.value })
              }
              placeholder="Full name"
            />
          </label>

          <label className="field">
            <span>Phone Number</span>
            <input
              value={form.borrower_phone}
              onChange={(e) =>
                setForm({ ...form, borrower_phone: e.target.value })
              }
              placeholder="Phone number"
            />
          </label>

          <label className="field">
            <span>Loan Amount (AFN) *</span>
            <input
              required
              type="number"
              min="0.01"
              step="0.01"
              value={form.loan_amount}
              onChange={(e) =>
                setForm({ ...form, loan_amount: e.target.value })
              }
              placeholder="0"
            />
          </label>

          <label className="field">
            <span>Loan Date (Solar Hijri)</span>
            <input
              value={form.loan_date}
              onChange={(e) =>
                setForm({ ...form, loan_date: e.target.value })
              }
              placeholder="1405/08/13"
            />
          </label>

          <label className="field">
            <span>Due Date (Solar Hijri)</span>
            <input
              value={form.due_date}
              onChange={(e) =>
                setForm({ ...form, due_date: e.target.value })
              }
              placeholder="1405/09/01"
            />
          </label>

          <label className="field">
            <span>Address</span>
            <input
              value={form.borrower_address}
              onChange={(e) =>
                setForm({ ...form, borrower_address: e.target.value })
              }
              placeholder="Borrower address"
            />
          </label>

          <label className="field">
            <span>Notes</span>
            <input
              value={form.notes}
              onChange={(e) =>
                setForm({ ...form, notes: e.target.value })
              }
              placeholder="Optional notes"
            />
          </label>

          <div>
            <button className="button" type="submit" disabled={saving}>
              {saving ? "Saving..." : editingLoan ? "Update Loan" : "Add Loan"}
            </button>
            {editingLoan && (
              <button
                type="button"
                className="button button-small"
                onClick={() => {
                  setEditingLoan(null);
                  setForm({
                    borrower_name: "",
                    borrower_phone: "",
                    borrower_address: "",
                    loan_amount: "",
                    loan_date: getTodayJalali(),
                    due_date: "",
                    notes: "",
                  });
                  setError("");
                }}
              >
                Cancel Edit
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="glass panel">
        <h2>Borrowers & Loan Records</h2>

        <div className="form-grid">
          <label className="field">
            <span>Search Borrowers</span>
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search name, phone or address..."
            />
          </label>
          <div>
            <button
              type="button"
              className="button"
              onClick={loadLoans}
              disabled={loading}
            >
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Borrower</th>
                <th>Phone</th>
                <th>Loan Date</th>
                <th>Loan Amount</th>
                <th>Paid</th>
                <th>Remaining</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {loans
                .filter((loan) =>
                  [
                    loan.borrower_name,
                    loan.borrower_phone,
                    loan.borrower_address,
                  ]
                    .join(" ")
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase())
                )
                .map((loan) => (
                <tr key={loan.id}>
                  <td>{loan.borrower_name}</td>
                  <td>{loan.borrower_phone || "-"}</td>
                  <td>{formatSolarDate(loan.loan_date)}</td>
                  <td>{Number(loan.loan_amount).toLocaleString()} AFN</td>
                  <td>{Number(loan.paid_amount).toLocaleString()} AFN</td>
                  <td>
                    {Number(loan.remaining_amount).toLocaleString()} AFN
                  </td>
                  <td>{loan.status}</td>
                  <td>
                    <div className="action-buttons">
                      <button
                        type="button"
                        className="button button-small"
                        onClick={() => loadPayments(loan)}
                      >
                        Payments
                      </button>
                      <button
                        type="button"
                        className="button button-small"
                        onClick={() => editLoan(loan)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="button button-small"
                        onClick={() => deleteLoan(loan)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {!loading && loans.length === 0 && (
                <tr>
                  <td colSpan="8">No loans recorded yet.</td>
                </tr>
              )}

              {loading && (
                <tr>
                  <td colSpan="8">Loading loans...</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedLoan && (
        <div className="glass panel">
          <h2>Payments – {selectedLoan.borrower_name}</h2>
          <p className="muted">
            Remaining balance:{" "}
            {Number(selectedLoan.remaining_amount).toLocaleString()} AFN
          </p>

          {Number(selectedLoan.remaining_amount) > 0 && (
            <form onSubmit={addPayment} className="form-grid">
              <label className="field">
                <span>Payment Amount (AFN)</span>
                <input
                  required
                  type="number"
                  min="0.01"
                  max={selectedLoan.remaining_amount}
                  step="0.01"
                  value={payment.amount}
                  onChange={(e) =>
                    setPayment({ ...payment, amount: e.target.value })
                  }
                  placeholder="0"
                />
              </label>

              <label className="field">
                <span>Payment Date (Solar Hijri)</span>
                <input
                  value={payment.payment_date}
                  onChange={(e) =>
                    setPayment({
                      ...payment,
                      payment_date: e.target.value,
                    })
                  }
                  placeholder="1405/08/13"
                />
              </label>

              <label className="field">
                <span>Notes</span>
                <input
                  value={payment.notes}
                  onChange={(e) =>
                    setPayment({ ...payment, notes: e.target.value })
                  }
                  placeholder="Optional"
                />
              </label>

              <div>
                <button className="button" type="submit" disabled={saving}>
                  {saving ? "Saving..." : "Receive Payment"}
                </button>
              </div>
            </form>
          )}

          <h3>Payment History</h3>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td>{formatSolarDate(p.payment_date)}</td>
                    <td>{Number(p.amount).toLocaleString()} AFN</td>
                    <td>{p.notes || "-"}</td>
                  </tr>
                ))}

                {payments.length === 0 && (
                  <tr>
                    <td colSpan="3">No payments recorded.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}














