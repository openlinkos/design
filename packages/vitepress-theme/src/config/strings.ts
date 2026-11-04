// Interface strings in English and Simplified Chinese. Per-locale theme config replaces the
// top-level one key by key, so every object here is complete in each locale.

import type { DefaultTheme } from 'vitepress';

export type UiStrings = Required<
  Pick<
    DefaultTheme.Config,
    | 'outline'
    | 'docFooter'
    | 'lastUpdated'
    | 'darkModeSwitchLabel'
    | 'lightModeSwitchTitle'
    | 'darkModeSwitchTitle'
    | 'sidebarMenuLabel'
    | 'returnToTopLabel'
    | 'langMenuLabel'
    | 'skipToContentLabel'
    | 'notFound'
  >
>;

export const UI: Record<'en' | 'zh', UiStrings> = {
  en: {
    outline: { label: 'On this page' },
    docFooter: { prev: 'Previous page', next: 'Next page' },
    lastUpdated: { text: 'Last updated' },
    darkModeSwitchLabel: 'Appearance',
    lightModeSwitchTitle: 'Switch to light theme',
    darkModeSwitchTitle: 'Switch to dark theme',
    sidebarMenuLabel: 'Menu',
    returnToTopLabel: 'Return to top',
    langMenuLabel: 'Change language',
    skipToContentLabel: 'Skip to content',
    notFound: {
      title: 'Page not found',
      quote: 'The page you are looking for does not exist or has moved.',
      linkLabel: 'Go to the home page',
      linkText: 'Take me home',
    },
  },
  zh: {
    outline: { label: '本页内容' },
    docFooter: { prev: '上一页', next: '下一页' },
    lastUpdated: { text: '最后更新于' },
    darkModeSwitchLabel: '外观',
    lightModeSwitchTitle: '切换到浅色模式',
    darkModeSwitchTitle: '切换到深色模式',
    sidebarMenuLabel: '菜单',
    returnToTopLabel: '回到顶部',
    langMenuLabel: '切换语言',
    skipToContentLabel: '跳到正文',
    notFound: {
      title: '页面未找到',
      quote: '你要找的页面不存在，或已移动到别处。',
      linkLabel: '返回首页',
      linkText: '返回首页',
    },
  },
};

/** Labels of the family menu; `home` takes the name of the master brand. */
export const FAMILY = {
  en: {
    home: (name: string) => `${name} home`,
    projects: 'Open-source projects',
    services: 'Free public services',
    allServices: 'All services',
  },
  zh: {
    home: (name: string) => `${name} 主页`,
    projects: '开源项目',
    services: '公共服务',
    allServices: '全部服务',
  },
} as const;

/** Labels of the footer. The attribution lines take the name of the master brand. */
export const FOOTER = {
  en: {
    projects: 'Open-source projects',
    services: 'Free public services',
    about: 'About',
    news: 'News',
    trust: 'Trust & security',
    contact: 'Contact',
    resources: 'Resources',
    github: 'GitHub',
    brand: 'Brand guidelines',
    design: 'Design system',
    privacy: 'Privacy',
    openSource: (name: string) => `Open source by ${name}`,
    runBy: (name: string) => `Run by ${name}`,
  },
  zh: {
    projects: '开源项目',
    services: '公共服务',
    about: '关于',
    news: '动态',
    trust: '信任与安全',
    contact: '联系我们',
    resources: '资源',
    github: 'GitHub',
    brand: '品牌规范',
    design: '设计系统',
    privacy: '隐私说明',
    openSource: (name: string) => `${name} 发起的开源项目`,
    runBy: (name: string) => `由 ${name} 运营`,
  },
} as const;

/** Fixed links of the family menu and the footer, per locale. */
export const LINKS = {
  services: { en: 'https://linkos.org/', zh: 'https://linkos.org/zh/' },
  brand: { en: 'https://openlinkos.com/brand', zh: 'https://openlinkos.com/zh/brand' },
  github: 'https://github.com/openlinkos',
  design: 'https://github.com/openlinkos/design',
} as const;

/** Contact addresses: `general` in the footer, `security` in security.txt. */
export const CONTACT = {
  general: 'admin@linkos.io',
  security: 'security@linkos.io',
} as const;

/** Local search in Chinese: the button and every key of the modal. */
export const ZH_SEARCH_TRANSLATIONS = {
  button: { buttonText: '搜索', buttonAriaLabel: '搜索' },
  modal: {
    displayDetails: '显示详细列表',
    resetButtonTitle: '清除搜索',
    backButtonTitle: '关闭搜索',
    noResultsText: '没有找到相关结果',
    footer: {
      selectText: '选择',
      selectKeyAriaLabel: '回车',
      navigateText: '切换',
      navigateUpKeyAriaLabel: '上方向键',
      navigateDownKeyAriaLabel: '下方向键',
      closeText: '关闭',
      closeKeyAriaLabel: 'Esc',
    },
  },
} satisfies DefaultTheme.LocalSearchOptions['translations'];

/** Custom container titles on Chinese pages (`::: tip` and friends). */
export const ZH_CONTAINERS = {
  tip: '提示',
  info: '信息',
  warning: '注意',
  danger: '警告',
  details: '详情',
} as const;

/** GitHub-style alert titles on Chinese pages (`> [!TIP]` and friends). */
export const ZH_ALERTS: Record<string, string> = {
  tip: '提示',
  note: '说明',
  info: '信息',
  important: '重要',
  warning: '注意',
  caution: '警告',
  danger: '警告',
};

export const ZH_COPY_CODE = '复制代码';

/**
 * The page actions of a doc page: copy the page as Markdown, or open it in a chat with the page's
 * address prefilled. `prompt` takes the Markdown address of the page as `{url}`.
 */
export const PAGE_ACTIONS = {
  en: {
    label: 'Page actions',
    copy: 'Copy page',
    copied: 'Copied',
    copyFailed: 'Copy failed',
    openClaude: 'Open in Claude',
    openChatGPT: 'Open in ChatGPT',
    prompt: 'Read {url} and answer questions about it.',
  },
  zh: {
    label: '本页操作',
    copy: '复制本页',
    copied: '已复制',
    copyFailed: '复制失败',
    openClaude: '在 Claude 中打开',
    openChatGPT: '在 ChatGPT 中打开',
    prompt: '阅读 {url}，回答我关于它的问题。',
  },
} as const;

/** Strings of the landing-page components (`@openlinkos/vitepress-theme/components`). */
export const COMPONENTS = {
  en: {
    copyCommand: 'Copy command',
    copied: 'Copied',
    play: 'Play recording',
    castError: 'The recording could not be played.',
  },
  zh: {
    copyCommand: '复制命令',
    copied: '已复制',
    play: '播放录像',
    castError: '录像无法播放。',
  },
} as const;
