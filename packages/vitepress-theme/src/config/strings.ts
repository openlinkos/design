// Interface strings in English and Simplified Chinese. Per-locale theme config replaces the
// top-level one key by key, so every object here is complete in each locale.

import type { DefaultTheme } from 'vitepress';

export const COPYRIGHT = '© 2026 OpenLinkOS';

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

/** Labels of the family menu. */
export const FAMILY = {
  en: { home: 'OpenLinkOS home', projects: 'Projects', services: 'Services' },
  zh: { home: 'OpenLinkOS 主页', projects: '开源项目', services: '服务' },
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
