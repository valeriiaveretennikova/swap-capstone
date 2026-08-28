const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const ORDER_ID_LENGTH = 12;

/** SPEC §8.7 — 12 uppercase alphanumeric characters from `crypto.getRandomValues`. */
export function generateOrderId(): string {
  const bytes = new Uint8Array(ORDER_ID_LENGTH);
  crypto.getRandomValues(bytes);

  let id = '';
  for (const byte of bytes) {
    id += ALPHABET[byte % ALPHABET.length];
  }
  return id;
}
