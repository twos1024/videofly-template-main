import type { SceneTemplate, TemplateVariable } from "@/config/templates";

/**
 * 本地化模板数据的工具函数。
 * 使用 next-intl 的翻译函数将模板的中文字段映射为当前 locale 对应的文本。
 */

type TranslationFunction = (key: string) => string;

export interface LocalizedVariable extends Omit<TemplateVariable, "label" | "placeholder" | "options"> {
  label: string;
  placeholder?: string;
  options?: string[];
  /** 原始选项值 (用于 fillTemplate) */
  originalOptions?: string[];
}

export interface LocalizedTemplate extends Omit<SceneTemplate, "variables" | "tags"> {
  name: string;
  description: string;
  tags: string[];
  variables: LocalizedVariable[];
}

/**
 * 安全调用翻译函数，key 不存在时回退到 fallback
 */
function safeT(t: TranslationFunction, key: string, fallback: string): string {
  try {
    const val = t(key);
    // next-intl 在 key 不存在时可能返回 key 本身
    return val && val !== key ? val : fallback;
  } catch {
    return fallback;
  }
}

/**
 * 将模板数据转换为本地化版本
 *
 * @param template - 原始模板 (中文数据)
 * @param t - useTranslations("TemplateData") 返回的翻译函数
 * @returns 本地化后的模板
 */
export function localizeTemplate(
  template: SceneTemplate,
  t: TranslationFunction,
): LocalizedTemplate {
  const id = template.id;

  const name = safeT(t, `${id}.name`, template.name);
  const description = safeT(t, `${id}.description`, template.description);

  // tags: 以逗号分隔的字符串
  const tagsStr = safeT(t, `${id}.tags`, template.tags.join(","));
  const tags = tagsStr.split(",").map((s) => s.trim()).filter(Boolean);

  // variables: 本地化 label / placeholder / options
  const variables: LocalizedVariable[] = template.variables.map((v) => {
    const label = safeT(t, `${id}.var_${v.key}_label`, v.label);

    const placeholder = v.placeholder
      ? safeT(t, `${id}.var_${v.key}_placeholder`, v.placeholder)
      : undefined;

    const options = v.options?.map((opt, i) =>
      safeT(t, `${id}.var_${v.key}_opt_${i + 1}`, opt),
    );

    return {
      ...v,
      label,
      placeholder,
      options,
      originalOptions: v.options,
    };
  });

  return { ...template, name, description, tags, variables };
}

/**
 * 本地化分类名称
 */
export function localizeCategory(
  categoryId: string,
  t: TranslationFunction,
  fallbackName: string,
): string {
  return safeT(t, `categories.${categoryId}.name`, fallbackName);
}

/**
 * 本地化分类描述
 */
export function localizeCategoryDesc(
  categoryId: string,
  t: TranslationFunction,
  fallbackDesc: string,
): string {
  return safeT(t, `categories.${categoryId}.description`, fallbackDesc);
}
