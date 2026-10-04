export const addressLine = (u) => [
  u?.building ? `${u.building}-р байр` : null,
  u?.entrance ? `${u.entrance}-р орц` : null,
  u?.floor ? `${u.floor}-р давхар` : null,
  u?.apartmentNumber ? `${u.apartmentNumber}-р тоот` : null,
].filter(Boolean).join(', ') || '—'
