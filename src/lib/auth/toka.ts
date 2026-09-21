import "server-only";
import { loadTokaConfig, type TokaConfig } from "@toka-auth/config";

let cached: TokaConfig | undefined;

/**
 * The Toka deployment config, read from the TOKA_* environment variables.
 *
 * Loaded lazily and memoised rather than at module scope: every TOKA_* var has
 * a default, so this never throws, but resolving it on first use keeps the
 * values correct if the environment is populated after import (as it is in some
 * Next.js build phases).
 */
export function getTokaConfig(): TokaConfig {
  if (!cached) cached = loadTokaConfig();
  return cached;
}
