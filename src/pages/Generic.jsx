import { Link, useLocation } from "react-router-dom";
import { allPages } from "../data/pages";
export default function Generic() {
  const loc = useLocation();
  const page = allPages.find((x) => x[1] === loc.pathname) || [
    "Page",
    loc.pathname,
  ];
  const descriptions = {
    "/about":
      "Shafi Mobile Zone helps customers discover mobile phones with clear specifications and direct support from our team.",
    "/contact":
      "Send a message to our team and we’ll help with device availability, specifications and requests.",
    "/faq":
      "Browse common questions about mobile listings, requests, availability and contacting the store.",
    "/privacy":
      "We use account and request information only to operate the store experience. Access is controlled through database security policies.",
    "/terms":
      "Use this website respectfully. Listings and availability are subject to confirmation by the Shafi Mobile Zone team.",
    "/warranty":
      "Warranty and after-sales terms are confirmed individually with the store for each device.",
    "/location":
      "Contact the store team for current location and opening information.",
  };
  return (
    <section className="section page-section narrow">
      <div className="eyebrow">SHAFI MOBILE ZONE</div>
      <h1>{page[0]}</h1>
      <p className="muted">
        {descriptions[loc.pathname] ||
          "This section is ready for the next feature. Your account and store data remain protected by Supabase policies."}
      </p>
      {loc.pathname === "/contact" ? (
        <ContactForm />
      ) : (
        <div className="glass info-panel">
          <h3>How can we help?</h3>
          <p>
            Explore the current mobile collection or sign in to send a request
            directly to our team.
          </p>
          <Link to="/mobiles" className="button">
            Browse mobiles
          </Link>
        </div>
      )}
    </section>
  );
}
function ContactForm() {
  return (
    <form
      className="glass form-panel form-stack"
      onSubmit={(e) => {
        e.preventDefault();
        alert(
          "Contact form UI is ready. Configure the database message flow to accept submissions.",
        );
      }}
    >
      <label className="field">
        <span>Your name</span>
        <input required />
      </label>
      <label className="field">
        <span>Email</span>
        <input type="email" required />
      </label>
      <label className="field">
        <span>Message</span>
        <textarea rows="5" required />
      </label>
      <button className="button">Send message</button>
    </form>
  );
}
