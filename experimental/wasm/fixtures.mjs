// Deterministic, varied addresses generated outside the timed benchmark loops.
export function addresses(count, seed = 0x6d2b79f5) {
  return addressSequence(seed)(count);
}

// Keep one sequence across warmup and samples so addresses never repeat within
// a benchmark run, without retaining every sample's corpus in memory.
export function addressSequence(seed = 0x6d2b79f5) {
  let state = seed >>> 0 || 0x6d2b79f5;
  return (count) =>
    Array.from({ length: count }, () => {
      let address = "0x";
      for (let i = 0; i < 5; i++) {
        state ^= state << 13;
        state ^= state >>> 17;
        state ^= state << 5;
        address += (state >>> 0).toString(16).padStart(8, "0");
      }
      return address;
    });
}
