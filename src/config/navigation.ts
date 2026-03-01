// ============================================
// PixelMuse 导航配置
// 面向新手用户的场景化导航
// ============================================

export interface NavItem {
  id: string;
  titleKey: string;
  href: string;
  icon?: string;
  badge?: string;
  requiresAuth?: boolean;
}

export interface NavGroup {
  id: string;
  title?: string;
  items: NavItem[];
}

// 左侧导航菜单
export const sidebarNavigation: NavGroup[] = [
  {
    id: "create",
    title: "CREATE",
    items: [
      {
        id: "templates",
        titleKey: "nav.templates",
        href: "/create",
        icon: "LayoutGrid",
      },
      {
        id: "image",
        titleKey: "nav.image",
        href: "/create/image",
        icon: "Image",
      },
      {
        id: "video",
        titleKey: "nav.video",
        href: "/create/video",
        icon: "Video",
      },
    ],
  },
  {
    id: "gallery",
    items: [
      {
        id: "creations",
        titleKey: "nav.creations",
        href: "/my-creations",
        icon: "FolderOpen",
        requiresAuth: true,
      },
    ],
  },
  {
    id: "account",
    items: [
      {
        id: "credits",
        titleKey: "nav.credits",
        href: "/credits",
        icon: "Gem",
      },
      {
        id: "settings",
        titleKey: "nav.settings",
        href: "/settings",
        icon: "User",
        requiresAuth: true,
      },
    ],
  },
];

// 落地页顶部导航 - 场景分类入口
export const headerScenes = [
  { id: "ecommerce", titleKey: "scenes.ecommerce", href: "/create?category=ecommerce", icon: "ShoppingBag" },
  { id: "social", titleKey: "scenes.social", href: "/create?category=social-media", icon: "Share2" },
  { id: "business", titleKey: "scenes.business", href: "/create?category=business", icon: "Briefcase" },
  { id: "personal", titleKey: "scenes.personal", href: "/create?category=personal", icon: "Sparkles" },
];

// 落地页顶部导航 - 工具入口
export const headerTools = [
  {
    id: "templates",
    titleKey: "nav.templates",
    href: "/create",
    icon: "LayoutGrid",
  },
  {
    id: "image",
    titleKey: "nav.image",
    href: "/create/image",
    icon: "Image",
  },
  {
    id: "video",
    titleKey: "nav.video",
    href: "/create/video",
    icon: "Video",
  },
];

// 用户菜单项
export const userMenuItems = [
  { id: "creations", titleKey: "nav.creations", href: "/my-creations", icon: "FolderOpen" },
  { id: "credits", titleKey: "nav.credits", href: "/credits", icon: "Gem" },
  { id: "settings", titleKey: "nav.settings", href: "/settings", icon: "User" },
];
