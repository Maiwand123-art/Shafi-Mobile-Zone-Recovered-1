import { toJalaali, toGregorian, isValidJalaaliDate } from "jalaali-js";

export function formatSolarDate(value) {
  if (!value) return "-";

  let gy, gm, gd;
  const raw = String(value);

  // Date-only values from Supabase
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw.slice(0, 10));

  if (dateOnly) {
    gy = Number(dateOnly[1]);
    gm = Number(dateOnly[2]);
    gd = Number(dateOnly[3]);
  } else {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";

    gy = date.getFullYear();
    gm = date.getMonth() + 1;
    gd = date.getDate();
  }

  const { jy, jm, jd } = toJalaali(gy, gm, gd);

  return `${jy}/${String(jm).padStart(2, "0")}/${String(jd).padStart(2, "0")}`;
}

export function formatSolarDateTime(value) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  const solarDate = formatSolarDate(date);
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${solarDate} ${hours}:${minutes}`;
}

export function getTodaySolar() {
  return formatSolarDate(new Date());
}

export function solarToGregorian(value) {
  const match = /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/.exec(
    String(value || "").trim()
  );

  if (!match) return null;

  const jy = Number(match[1]);
  const jm = Number(match[2]);
  const jd = Number(match[3]);

  if (!isValidJalaaliDate(jy, jm, jd)) return null;

  const { gy, gm, gd } = toGregorian(jy, jm, jd);

  return `${gy}-${String(gm).padStart(2, "0")}-${String(gd).padStart(2, "0")}`;
}
