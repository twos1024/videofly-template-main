import type { SceneTemplate } from "./templates";

export const enableImageGeneration = false;
export const enableRealtimeVideoEvents = false;

export function isTemplateEnabled(
  template: Pick<SceneTemplate, "type">
): boolean {
  return enableImageGeneration || template.type === "video";
}
