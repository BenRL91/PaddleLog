import { buildChanges, hasChanges } from "../../public/record-sync.js";
import { validate } from "../../public/validate.js";
export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}
export function createApi({ origin, getToken, refreshToken, fetcher = fetch }) {
  const url = new URL(origin);
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  )
    throw Error("Use an HTTPS API origin");
  async function request(path, options = {}, retry = true) {
    if (!path.startsWith("/api/")) throw Error("Invalid API path");
    const token = await getToken();
    if (!token) throw new ApiError("Sign in to LeewayPB.", 401);
    const response = await fetcher(url.origin + path, {
      ...options,
      credentials: "omit",
      headers: { ...options.headers, Authorization: "Bearer " + token },
      signal: AbortSignal.timeout(20000),
    });
    if (response.status === 401 && retry) {
      await refreshToken();
      return request(path, options, false);
    }
    const value = await response.json();
    if (!response.ok)
      throw new ApiError(
        value.error || "Unable to reach PaddleLog.",
        response.status,
      );
    return value;
  }
  return {
    request,
    load: () => request("/api/state"),
    entitlements: () => request("/api/entitlements"),
    async save(base, next) {
      validate(next);
      const changes = buildChanges(base.state, next);
      if (!hasChanges(changes)) return base;
      const result = await request("/api/state", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-leeway-account": base.accountId,
        },
        body: JSON.stringify({
          accountId: base.accountId,
          revision: base.revision,
          changes,
        }),
      });
      return { ...base, revision: result.revision, state: next };
    },
  };
}
// Compare using the same canonical contract as the server after a lost save acknowledgment.
// This never merges unrelated changes or increments usage; a differing revision still needs review.
export function matchesConfirmedChange(expected, actual) {
  return !hasChanges(buildChanges(validate(expected), validate(actual)));
}
