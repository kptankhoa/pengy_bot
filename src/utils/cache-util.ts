// Per-isolate cache; replaces Firestore onSnapshot listeners, which can't live across Worker requests.
export const cached = (load: () => Promise<void>, ttlMs = 60_000) => {
  let expires = 0;
  return async () => {
    if (Date.now() < expires) {
      return;
    }
    await load();
    expires = Date.now() + ttlMs;
  };
};
