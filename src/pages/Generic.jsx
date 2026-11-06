import { Link, useLocation } from "react-router-dom";
import { allPages } from "../data/pages";

export default function Generic() {
  const loc = useLocation();
  const page = allPages.find((x) => x[1] === loc.pathname) || [
    "Shafi Mobile Zone",
    loc.pathname,
  ];

  const descriptions = {
    "/about":
      "Shafi Mobile Zone is a mobile phone store located in Fazli Market, Kote Sangi, Kabul. We help customers explore smartphones, compare specifications and understand prices before making a decision. Our goal is to make buying a mobile phone simple, clear and convenient. Customers can browse available devices, review product details and contact our team for assistance. We value clear communication, helpful service and a reliable shopping experience.",
    "/contact":
      "Have a question about a phone, its specifications, price or availability? Contact Shafi Mobile Zone by phone or WhatsApp, or visit our shop in Fazli Market. Our team can help you with product information and customer requests.",
    "/location":
      "Visit Shafi Mobile Zone at Shop No. 80, Fazli Market, Kote Sangi, Kabul, Afghanistan. Contact the store before visiting if you want to confirm a particular phone's availability.",
    "/faq":
      "Browse mobile listings, open a product to review its specifications and price, and contact the store if you need more information. Product availability and final details should be confirmed with our team.",
    "/privacy":
      "Shafi Mobile Zone uses account and request information to provide website services, respond to customer enquiries and manage store activity. Account access is protected through Supabase authentication and database security policies.",
    "/terms":
      "Product listings are provided for customer information. Prices, stock and availability may change and should be confirmed with Shafi Mobile Zone before purchase. Please use the website and account features responsibly.",
    "/warranty":
      "Warranty and after-sales terms depend on the specific device and are confirmed directly with Shafi Mobile Zone before purchase. Please ask our team about the terms for a particular phone.",
  };

  return (
    <section className="section page-section narrow">
      <div className="eyebrow">WELCOME TO SHAFI MOBILE ZONE</div>
      <h1>{page[0]}</h1>
      <p className="muted page-description">
        {descriptions[loc.pathname] ||
          "Explore Shafi Mobile Zone online, browse mobile listings and contact our team for product information and assistance."}
      </p>

      <div className="glass info-panel business-info">
        <div className="eyebrow">OUR STORE</div>
        <h2>Shafi Mobile Zone</h2>
        <p>Kabul, Kote Sangi, Fazli Market, Shop No. 80, Afghanistan.</p>
        <div className="business-contact-row">
          <span><b>Phone</b></span>
          <a className="text-link" href="tel:0782550555">0782550555</a>
        </div>
        <div className="business-contact-row">
          <span><b>WhatsApp</b></span>
          <a
            className="text-link"
            href="https://wa.me/93782550555"
            target="_blank"
            rel="noreferrer"
          >
            Chat with our team
          </a>
        </div>
        <Link to="/mobiles" className="button">Browse mobiles</Link>
      </div>

      {loc.pathname === "/contact" && <ContactForm />}
    </section>
  );
}

function ContactForm() {
  return (
    <div className="glass form-panel contact-details">
      <h2>Get in touch</h2>
      <p className="muted">
        For product questions and availability, contact our store directly.
      </p>
      <a className="button" href="tel:0782550555">Call 0782550555</a>
      <a
        className="button button-ghost"
        href="https://wa.me/93782550555"
        target="_blank"
        rel="noreferrer"
      >
        WhatsApp Shafi Mobile Zone
      </a>
    </div>
  );
}
