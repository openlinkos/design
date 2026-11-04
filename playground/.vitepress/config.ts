import { defineOpenLinkOSConfig } from '@openlinkos/vitepress-theme/config';

export default defineOpenLinkOSConfig({
  brand: 'openlinkos',
  hostname: 'https://playground.openlinkos.com',
  brandKit: true,
  title: 'Playground',
  themeConfig: {
    socialLinks: [{ icon: 'github', link: 'https://github.com/openlinkos/design' }],
  },
  footer: {
    note: {
      en: 'The playground is kept by the LinkOS team.',
      zh: '演示站点由 LinkOS 团队维护。',
    },
  },
  legal: [
    {
      text: { en: 'MIT License', zh: 'MIT 许可证' },
      link: 'https://github.com/openlinkos/design/blob/master/LICENSE',
    },
  ],
  locales: {
    root: {
      description: 'A test site for the OpenLinkOS VitePress theme.',
      themeConfig: {
        nav: [
          { text: 'Guide', link: '/guide' },
          { text: 'Components', link: '/components' },
        ],
        sidebar: [
          {
            text: 'Playground',
            items: [
              { text: 'Home', link: '/' },
              { text: 'Guide', link: '/guide' },
              { text: 'Components', link: '/components' },
            ],
          },
        ],
      },
    },
    zh: {
      description: 'OpenLinkOS VitePress 主题的测试站点。',
      themeConfig: {
        nav: [{ text: '指南', link: '/zh/guide' }],
        sidebar: [
          {
            text: '演示站点',
            items: [
              { text: '首页', link: '/zh/' },
              { text: '指南', link: '/zh/guide' },
              { text: '组件', link: '/zh/components' },
            ],
          },
        ],
      },
    },
  },
});
