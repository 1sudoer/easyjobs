const ENV_KEYS: Record<string, string> = {
  openrouter: "OPENROUTER_API_KEY",
  openai: "OPENAI_API_KEY",
  deepseek: "DEEPSEEK_API_KEY",
  gemini: "GEMINI_API_KEY",
};

export const resolveApiKey = async (
  _userId: string | null | undefined,
  provider: string,
): Promise<string | null> => {
  const envVar = ENV_KEYS[provider];
  if (!envVar) return null;
  return process.env[envVar] ?? null;
};
