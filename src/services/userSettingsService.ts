import { supabase } from "@/integrations/supabase/client";
import type { WidgetVisibility } from "@/components/WidgetSettings";
import { DEFAULT_VISIBILITY, DEFAULT_WIDGET_ORDER } from "@/components/WidgetSettings";

export interface UserSettings {
  id: string;
  user_id: string;
  widget_visibility: WidgetVisibility;
  widget_order: (keyof WidgetVisibility)[];
  widgets_per_row: number;
  theme: string;
  selected_repos: string[];
  github_token?: string;
  created_at: string;
  updated_at: string;
}

export async function getUserSettings(userId: string): Promise<UserSettings | null> {
  const { data, error } = await supabase
    .from("user_settings")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      // No settings found, return null
      return null;
    }
    console.error("Error fetching user settings:", error);
    return null;
  }

  return {
    ...data,
    widget_visibility: data.widget_visibility as WidgetVisibility || DEFAULT_VISIBILITY,
    widget_order: data.widget_order as (keyof WidgetVisibility)[] || DEFAULT_WIDGET_ORDER,
    selected_repos: data.selected_repos as string[] || [],
  };
}

export async function createUserSettings(userId: string): Promise<UserSettings | null> {
  const { data, error } = await supabase
    .from("user_settings")
    .insert({
      user_id: userId,
      widget_visibility: DEFAULT_VISIBILITY,
      widget_order: DEFAULT_WIDGET_ORDER,
      widgets_per_row: 3,
      theme: "system",
      selected_repos: [],
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating user settings:", error);
    return null;
  }

  return {
    ...data,
    widget_visibility: data.widget_visibility as WidgetVisibility,
    widget_order: data.widget_order as (keyof WidgetVisibility)[],
    selected_repos: data.selected_repos as string[] || [],
  };
}

export async function updateUserSettings(
  userId: string,
  updates: Partial<{
    widget_visibility: WidgetVisibility;
    widget_order: (keyof WidgetVisibility)[];
    widgets_per_row: number;
    theme: string;
    selected_repos: string[];
  }>
): Promise<boolean> {
  const { error } = await supabase
    .from("user_settings")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  if (error) {
    console.error("Error updating user settings:", error);
    return false;
  }

  return true;
}

export async function getOrCreateUserSettings(userId: string): Promise<UserSettings | null> {
  let settings = await getUserSettings(userId);
  
  if (!settings) {
    settings = await createUserSettings(userId);
  }
  
  return settings;
}