/**
 * The authenticated user as *server* code sees them: an id and nothing else.
 *
 * There is no local user table — Clerk is the only store of identity. Profile
 * data (name, email, avatar) is read from Clerk in client components via
 * `useUser()`, so it is always current and costs no database round-trip on the
 * ~85 server actions that only ever need the id to scope a query.
 */
export type CurrentUser = {
  id: string;
};
