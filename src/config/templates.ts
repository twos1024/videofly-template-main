// ============================================
// PixelMuse 场景模板类型定义
// ============================================

/** 模板分类 */
export type TemplateCategory = "ecommerce" | "social-media" | "business" | "personal";

/** 生成类型 */
export type TemplateType = "image" | "video";

/** 模板变量 - 用户需要填写的动态内容 */
export interface TemplateVariable {
  key: string;
  label: string;
  type: "text" | "select" | "image";
  placeholder?: string;
  options?: string[];
  required: boolean;
}

/** 模板预设参数 */
export interface TemplatePresets {
  model: string;
  aspectRatio: string;
  duration?: number;
  quality?: string;
}

/** 场景模板 */
export interface SceneTemplate {
  id: string;
  name: string;
  category: TemplateCategory;
  type: TemplateType;
  description: string;
  coverImage: string;
  promptTemplate: string;
  variables: TemplateVariable[];
  presets: TemplatePresets;
  tags: string[];
  exampleOutputs: string[];
  credits: number;
  difficulty: "easy" | "medium";
  popular?: boolean;
}

/** 分类配置 */
export interface CategoryConfig {
  id: TemplateCategory;
  name: string;
  nameEn: string;
  icon: string;
  description: string;
}

/** 所有分类 */
export const TEMPLATE_CATEGORIES: CategoryConfig[] = [
  {
    id: "ecommerce",
    name: "电商营销",
    nameEn: "E-commerce",
    icon: "ShoppingBag",
    description: "产品展示图、促销海报、商品主图",
  },
  {
    id: "social-media",
    name: "社交媒体",
    nameEn: "Social Media",
    icon: "Share2",
    description: "小红书封面、抖音视频、朋友圈配图",
  },
  {
    id: "business",
    name: "商务办公",
    nameEn: "Business",
    icon: "Briefcase",
    description: "PPT配图、公众号封面、品牌设计",
  },
  {
    id: "personal",
    name: "个人创作",
    nameEn: "Personal",
    icon: "Sparkles",
    description: "AI写真、壁纸、表情包、贺卡",
  },
];
