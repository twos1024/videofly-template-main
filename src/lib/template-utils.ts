import type { SceneTemplate, TemplateCategory } from "@/config/templates";
import { isTemplateEnabled } from "@/config/features";
import { SCENE_TEMPLATES } from "@/config/template-data";

const AVAILABLE_TEMPLATES = SCENE_TEMPLATES.filter(isTemplateEnabled);

/**
 * 按分类获取模板
 */
export function getTemplatesByCategory(category: TemplateCategory): SceneTemplate[] {
  return AVAILABLE_TEMPLATES.filter((t) => t.category === category);
}

/**
 * 获取全部模板
 */
export function getAllTemplates(): SceneTemplate[] {
  return AVAILABLE_TEMPLATES;
}

/**
 * 获取推荐模板 (popular=true)
 */
export function getPopularTemplates(): SceneTemplate[] {
  return AVAILABLE_TEMPLATES.filter((t) => t.popular);
}

/**
 * 根据关键词搜索模板
 */
export function searchTemplates(keyword: string): SceneTemplate[] {
  const lower = keyword.toLowerCase();
  return AVAILABLE_TEMPLATES.filter(
    (t) =>
      t.name.toLowerCase().includes(lower) ||
      t.description.toLowerCase().includes(lower) ||
      t.tags.some((tag) => tag.toLowerCase().includes(lower))
  );
}

/**
 * 根据 ID 获取单个模板
 */
export function getTemplateById(id: string): SceneTemplate | null {
  return AVAILABLE_TEMPLATES.find((t) => t.id === id) ?? null;
}

/**
 * 按类型过滤模板
 */
export function getTemplatesByType(type: "image" | "video"): SceneTemplate[] {
  return AVAILABLE_TEMPLATES.filter((t) => t.type === type);
}

/**
 * 填充模板变量，生成最终 prompt
 *
 * 将 promptTemplate 中的 {key} 替换为用户填写的值
 * 未填写的可选变量会被清除
 */
export function fillTemplate(
  template: SceneTemplate,
  values: Record<string, string>
): string {
  let prompt = template.promptTemplate;

  for (const variable of template.variables) {
    const value = values[variable.key];
    const placeholder = `{${variable.key}}`;

    if (value) {
      prompt = prompt.replaceAll(placeholder, value);
    } else {
      // 清除未填写的可选变量及其前后的逗号/空格
      prompt = prompt.replaceAll(`, ${placeholder}`, "");
      prompt = prompt.replaceAll(`${placeholder}, `, "");
      prompt = prompt.replaceAll(placeholder, "");
    }
  }

  // 清理多余的逗号和空格
  prompt = prompt.replace(/,\s*,/g, ",");
  prompt = prompt.replace(/,\s*$/g, "");
  prompt = prompt.replace(/\s+/g, " ").trim();

  return prompt;
}
