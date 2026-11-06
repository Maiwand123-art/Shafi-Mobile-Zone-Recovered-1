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
      "Shafi Mobile Zone is a customer-focused mobile phone store based in Kote Sangi, Kabul. We help customers explore smartphones with clear specifications, transparent AFN pricing and personal assistance. Our goal is to make choosing a phone simple, informed and comfortable, whether you are looking for a new device or a carefully selected used phone.",
    "/contact":
      "Visit or contact Shafi Mobile Zone for mobile availability, product details, pricing and customer support. Our team can help you compare devices and answer questions before you make a decision.",
    "/location":
      "Find Shafi Mobile Zone at Fazli Market, Shop No. 80, Kote Sangi, Kabul. Contact us before visiting if you need help confirming availability.",
    "/faq":
      "Browse common questions about mobile listings, requests, availability and contacting the store.",
    "/privacy":
      "We use account and request information only to operate the store experience. Access is controlled through database security policies.",
    "/terms":
      "Use this website respectfully. Listings and availability are subject to confirmation by the Shafi Mobile Zone team.",
    "/warranty":
      "Warranty and after-sales terms are confirmed individually with the store for each device.",
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
          <h3>Shafi Mobile Zone</h3>
          <p>Kabul, Kote Sangi, Fazli Market, Shop No. 80</p>
          <p><b>Phone:</b> <a className="text-link" href="tel:0782550555">0782550555</a></p>
          <p><b>WhatsApp:</b> <a className="text-link" href="https://wa.me/93782550555" target="_blank" rel="noreferrer">Chat with our team</a></p>
          <Link to="/mobiles" className="button">Browse mobiles</Link>
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

