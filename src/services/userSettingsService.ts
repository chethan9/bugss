import { supabase } from "@/integrations/supabase/client";
import type { WidgetVisibility } from "@/components/WidgetSettings";
import { DEFAULT_VISIBILITY, DEFAULT_WIDGET_ORDER } from "@/components/WidgetSettings";
import type { Json } from "@/integrations/supabase/database.types";

export interface UserSettings {
  id: string;
  user_id: string;
  widget_visibility: WidgetVisibility;
  widget_order: (keyof WidgetVisibility)[];
  widgets_per_row: number;
  theme: string;
  selected_repos: string[];
  github_token?: string | null;
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
      return await createUserSettings(userId);
    }
    console.error("Error fetching user settings:", error);
    return null;
  }

  return {
    ...data,
    widget_visibility: (data.widget_visibility as unknown as WidgetVisibility) || DEFAULT_VISIBILITY,
    widget_order: (data.widget_order as unknown as (keyof WidgetVisibility)[]) || DEFAULT_WIDGET_ORDER,
    selected_repos: (data.selected_repos as unknown as string[]) || [],
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
  };
}

export async function saveUserSettings(
  userId: string,
  updates: Partial<{
    widget_visibility: WidgetVisibility;
    widget_order: (keyof WidgetVisibility)[];
    widgets_per_row: number;
    theme: string;
    selected_repos: string[];
    github_token: string | null;
  }>
): Promise<boolean> {
  const supabaseUpdates: {
    updated_at: string;
    widget_visibility?: Json;
    widget_order?: Json;
    widgets_per_row?: number;
    theme?: string;
    selected_repos?: Json;
    github_token?: string | null;
  } = {
    updated_at: new Date().toISOString(),
  };
  
  if (updates.widget_visibility !== undefined) {
    supabaseUpdates.widget_visibility = updates.widget_visibility as unknown as Json;
  }
  if (updates.widget_order !== undefined) {
    supabaseUpdates.widget_order = updates.widget_order as unknown as Json;
  }
  if (updates.widgets_per_row !== undefined) {
    supabaseUpdates.widgets_per_row = updates.widgets_per_row;
  }
  if (updates.theme !== undefined) {
    supabaseUpdates.theme = updates.theme;
  }
  if (updates.selected_repos !== undefined) {
    supabaseUpdates.selected_repos = updates.selected_repos as unknown as Json;
  }
  if (updates.github_token !== undefined) {
    supabaseUpdates.github_token = updates.github_token;
  }

  const { error } = await supabase
    .from("user_settings")
    .update(supabaseUpdates)
    .eq("user_id", userId);

  if (error) {
    console.error("Error updating user settings:", error);
    return false;
  }

  return true;
}