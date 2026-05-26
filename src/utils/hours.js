const DAYS = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];

function isOpenNow(hours) {
  if (!hours || typeof hours !== 'object' || Object.keys(hours).length === 0) return null;
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const day = DAYS[now.getDay()];
  const dh = hours[day];
  if (!dh) return null;
  if (dh.closed) return false;
  if (!dh.open || !dh.close) return null;
  const current = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
  return current >= dh.open && current <= dh.close;
}

function todayName() {
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }));
  return DAYS[now.getDay()];
}

module.exports = { isOpenNow, todayName, DAYS };
