// Shortens a long address/hash to "0x742d...f44e" style. Anything already short is left alone.
export function truncAddr(addr, front = 6, back = 4) {
  if (!addr) return "";
  return addr.length > front + back + 3 ? `${addr.slice(0, front)}...${addr.slice(-back)}` : addr;
}
