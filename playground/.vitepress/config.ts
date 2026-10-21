import { defineOpenLinkOSConfig } from '@openlinkos/vitepress-theme/config';

export default defineOpenLinkOSConfig({
  brand: 'openlinkos',
  hostname: 'https://playground.openlinkos.com',
  brandKit: true,
  title: 'Playground',
  themeConfig: {
    socialLinks: [{ icon: 'github', link: 'https://github.com/openlinkos/design' }],
  },
  locales: {
    root: {
      description: 'A test site for the OpenLinkOS VitePress theme.',
      themeConfig: {
        nav: [{ text: 'Guide', link: '/guide' }],
        sidebar: [
          {
            text: 'Playground',
            items: [
              { text: 'Home', link: '/' },
              { text: 'Guide', link: '/guide' },
            ],
          },
        ],
        footer: { message: 'Released under the MIT License.' },
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
            ],
          },
        ],
        footer: { message: '基于 MIT 许可证发布。' },
      },
    },
  },
});
