// Injectable, account-scoped storage; auth credentials never use this store.
export const recordKey = (userId, accountId, kind) =>
  "paddlelog.mobile.v1:" +
  encodeURIComponent(userId) +
  ":" +
  encodeURIComponent(accountId) +
  ":" +
  kind;
export function createSecureAuthStorage(vault, id) {
  let queue = Promise.resolve();
  /** @template T @param {()=>Promise<T>} fn @returns {Promise<T>} */
  const serial = (fn) => {
    const task = queue.then(fn, fn);
    queue = task.catch(() => {});
    return task;
  };
  const prefix = (key) =>
    "pl-auth-" +
    Array.from(key)
      .map((c) => c.charCodeAt(0).toString(16))
      .join("");
  return {
    getItem: (key) =>
      serial(async () => {
        const base = prefix(key),
          raw = await vault.getItemAsync(base);
        if (!raw) return null;
        const manifest = JSON.parse(raw);
        if (
          !Number.isInteger(manifest.count) ||
          manifest.count < 1 ||
          manifest.count > 100
        )
          throw Error("Invalid secure session manifest");
        let text = "";
        for (let i = 0; i < manifest.count; i++) {
          const chunk = await vault.getItemAsync(
            base + "." + manifest.id + "." + i,
          );
          if (chunk === null)
            throw Error("Secure session is incomplete. Sign in again.");
          text += chunk;
        }
        return text;
      }),
    setItem: (key, value) =>
      serial(async () => {
        const base = prefix(key),
          old = await vault.getItemAsync(base),
          generation = id(),
          chunks = value.match(/[\s\S]{1,400}/g) ?? [""];
        if (chunks.length > 100) throw Error("Secure session is too large");
        for (let i = 0; i < chunks.length; i++)
          await vault.setItemAsync(
            base + "." + generation + "." + i,
            chunks[i],
          );
        await vault.setItemAsync(
          base,
          JSON.stringify({ id: generation, count: chunks.length }),
        );
        if (old) {
          const previous = JSON.parse(old);
          for (let i = 0; i < previous.count; i++)
            await vault.deleteItemAsync(base + "." + previous.id + "." + i);
        }
      }),
    removeItem: (key) =>
      serial(async () => {
        const base = prefix(key),
          raw = await vault.getItemAsync(base);
        await vault.deleteItemAsync(base);
        if (raw) {
          const old = JSON.parse(raw);
          for (let i = 0; i < old.count; i++)
            await vault.deleteItemAsync(base + "." + old.id + "." + i);
        }
      }),
  };
}
