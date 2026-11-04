import { Link } from "react-router-dom";
import { BatteryFull, HardDrive, Star } from "lucide-react";

export default function PhoneCard({ phone }) {
  return (
    <article className="phone-card glass">
      <Link to={`/mobiles/${phone.id}`} className="phone-image">
        {phone.image_url ? (
          <img src={phone.image_url} alt={phone.name} />
        ) : (
          <div className="image-placeholder">
            {" "}
            <span>SMZ</span>
            <small>PHONE IMAGE</small>
          </div>
        )}
        {phone.is_featured && <span className="ribbon">FEATURED</span>}
      </Link>
      <div className="phone-info">
        <div className="muted tiny">
          {phone.brand || "Mobile"} · {phone.condition || "New"}
        </div>
        <Link to={`/mobiles/${phone.id}`}>
          <h3>{phone.name}</h3>
        </Link>
        <div className="spec-row">
          <span>
            <HardDrive size={13} /> {phone.ram || "—"} / {phone.storage || "—"}
          </span>
          <span>
            <BatteryFull size={13} /> {phone.battery || "—"}
          </span>
        </div>
        <div className="phone-bottom">
          <strong>
            {Number(phone.price || 0).toLocaleString()} <small>AFN</small>
          </strong>
          <span className="rating">
            <Star size={13} fill="currentColor" />{" "}
            {phone.average_rating
              ? Number(phone.average_rating).toFixed(1)
              : "New"}
          </span>
        </div>
      </div>
    </article>
  );
}
