<h1>
  <img alt="OpenLinkOS Design" src="brand/out/openlinkos/github/readme.svg" height="56">
</h1>

**OpenLinkOS 与 LinkOS 的品牌、设计系统和共享站点主题。**

[![npm: ui](https://img.shields.io/npm/v/@openlinkos/ui?label=%40openlinkos%2Fui)](https://www.npmjs.com/package/@openlinkos/ui) [![npm: vitepress-theme](https://img.shields.io/npm/v/@openlinkos/vitepress-theme?label=%40openlinkos%2Fvitepress-theme)](https://www.npmjs.com/package/@openlinkos/vitepress-theme) [![CI](https://github.com/openlinkos/design/actions/workflows/ci.yml/badge.svg)](https://github.com/openlinkos/design/actions/workflows/ci.yml)

[English](README.md) | 简体中文

本仓库包含：

- **LinkOS**（组织，以及它的免费公共服务，例如 LinkOS Mirrors）与 **OpenLinkOS**（LinkOS 的开源项目品牌，例如 Origin）的品牌标志；
- 由标志生成的品牌资产：favicon、应用图标、社交分享图和 README 头图；
- `@openlinkos/ui`：面向应用的设计系统，包括 W3C DTCG 格式的设计变量、不依赖框架的布局和组件 CSS（支持多品牌、浅色和深色，对比度由测试保证），以及精选的 Lucide 图标；
- `@openlinkos/vitepress-theme`：所有 OpenLinkOS 与 LinkOS 站点共用的 VitePress 主题，提供统一外观、中英双语界面、语言检测和元信息。

维护者请阅读 [BRAND.md](BRAND.md)。

## 使用设计系统

应用引入 `@openlinkos/ui/ui.css`，在页面上设置 `data-brand`，用 `ol-` 开头的类搭建页面。详见[包说明](packages/ui/README.md)、[设计原则](packages/ui/docs/principles.md)、[组件](packages/ui/docs/components.md)和[变量参考](packages/ui/docs/tokens.md)（文档为英文）。

## 使用主题

```ts
// <site>/.vitepress/theme/index.ts
export { default } from '@openlinkos/vitepress-theme';
```

```ts
// <site>/.vitepress/config.ts
import { defineOpenLinkOSConfig } from '@openlinkos/vitepress-theme/config';

export default defineOpenLinkOSConfig({
  brand: 'origin',
  hostname: 'https://origin.openlinkos.com',
  title: 'Origin',
  locales: {
    root: { description: '…', themeConfig: { nav: [], sidebar: [] } },
    zh: { description: '…', themeConfig: { nav: [], sidebar: [] } },
  },
});
```

每个页面都需要在 `zh/` 下有对应的简体中文页面，构建时会检查两者是否同步。选项、语言检测和双语规则见[主题的 README](packages/vitepress-theme/README.md)（英文）。[`playground/`](playground) 是一个使用该主题的双语小站点：先运行一次 `pnpm build`，再运行 `pnpm docs:dev`。

## 许可

代码以 [MIT 许可证](LICENSE) 发布。OpenLinkOS 与 LinkOS 的名称和标志不在该许可范围内，使用方式将在 openlinkos.com 的品牌规范中说明。
