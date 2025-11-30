function generateReferenceID() {
  const date = new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');

  // random 5-character uppercase hex
  const rand = Math.random().toString(16).substring(2, 7).toUpperCase();

  return `BOOK-${y}${m}${d}-${rand}`;
}

module.exports = {
  generateReferenceID
};