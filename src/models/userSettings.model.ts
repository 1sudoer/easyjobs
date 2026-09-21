export interface DisplaySettings {
  theme: "light" | "dark" | "system";
}

export interface UserSettingsData {
  display: DisplaySettings;
}

export interface UserSettings {
  userId: string;
  settings: UserSettingsData;
}

export const defaultUserSettings: UserSettingsData = {
  display: {
    theme: "system",
  },
};
