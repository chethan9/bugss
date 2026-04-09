import { supabase } from "@/integrations/supabase/client";
import type { WidgetVisibility } from "@/components/WidgetSettings";
import { DEFAULT_VISIBILITY, DEFAULT_WIDGET_ORDER } from "@/components/WidgetSettings";
import type { Json } from "@/integrations/supabase/types";

export interface UserSettings {
  id: string;
  user_id: string;
  widget_visibility: WidgetVisibility;
  widget_order: (keyof WidgetVisibility)[];
  widgets_per_row: number;
  theme: string;
  github_token: string | null;
  selected_repos: string[];
  app_name: string;
  logo_url: string | null;
  created_at: string;
  updated_at: string;
}

export async function getUserSettings(userId: string): Promise<UserSettings | null> {
  const { data, error } = await supabase
    .from("user_settings")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("Error fetching user settings:", error);
    return null;
  }

  if (!data) return null;

  return {
    ...data,
    widget_visibility: (data.widget_visibility as unknown as WidgetVisibility) || DEFAULT_VISIBILITY,
    widget_order: (data.widget_order as unknown as (keyof WidgetVisibility)[]) || DEFAULT_WIDGET_ORDER,
    selected_repos: (data.selected_repos as unknown as string[]) || [],
    app_name: data.app_name || "FixFlix",
    logo_url: data.logo_url || null,
  };
}

export async function createUserSettings(userId: string): Promise<UserSettings | null> {
  const insertData = {
    user_id: userId,
    widget_visibility: DEFAULT_VISIBILITY as unknown as Json,
    widget_order: DEFAULT_WIDGET_ORDER as unknown as Json,
    widgets_per_row: 3,
    theme: "system",
    selected_repos: [] as unknown as Json,
    app_name: "FixFlix",
    logo_url: null,
  };

  const { data, error } = await supabase
    .from("user_settings")
    .insert(insertData)
    .select()
    .single();

  if (error) {
    console.error("Error creating user settings:", error);
    return null;
  }

  return {
    ...data,
    widget_visibility: (data.widget_visibility as unknown as WidgetVisibility) || DEFAULT_VISIBILITY,
    widget_order: (data.widget_order as unknown as (keyof WidgetVisibility)[]) || DEFAULT_WIDGET_ORDER,
    selected_repos: (data.selected_repos as unknown as string[]) || [],
    app_name: data.app_name || "FixFlix",
    logo_url: data.logo_url || null,
  };
}

export async function saveUserSettings(
  userId: string, 
  settings: Partial<{
    widget_visibility: WidgetVisibility;
    widget_order: (keyof WidgetVisibility)[];
    widgets_per_row: number;
    theme: string;
    github_token: string | null;
    selected_repos: string[];
    app_name: string;
    logo_url: string | null;
  }>
): Promise<boolean> {
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (settings.widget_visibility !== undefined) {
    updateData.widget_visibility = settings.widget_visibility as unknown as Json;
  }
  if (settings.widget_order !== undefined) {
    updateData.widget_order = settings.widget_order as unknown as Json;
  }
  if (settings.widgets_per_row !== undefined) {
    updateData.widgets_per_row = settings.widgets_per_row;
  }
  if (settings.theme !== undefined) {
    updateData.theme = settings.theme;
  }
  if (settings.github_token !== undefined) {
    updateData.github_token = settings.github_token;
  }
  if (settings.selected_repos !== undefined) {
    updateData.selected_repos = settings.selected_repos as unknown as Json;
  }
  if (settings.app_name !== undefined) {
    updateData.app_name = settings.app_name;
  }
  if (settings.logo_url !== undefined) {
    updateData.logo_url = settings.logo_url;
  }

  const { error } = await supabase
    .from("user_settings")
    .update(updateData)
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