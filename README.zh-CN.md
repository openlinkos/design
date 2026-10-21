<h1>
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="brand/out/openlinkos/github/readme-dark.svg">
    <img alt="OpenLinkOS Design" src="brand/out/openlinkos/github/readme-light.svg" height="48">
  </picture>
</h1>

**OpenLinkOS 与 LinkOS 的品牌和共享站点主题。**

[![npm](https://img.shields.io/npm/v/@openlinkos/vitepress-theme)](https://www.npmjs.com/package/@openlinkos/vitepress-theme) [![CI](https://github.com/openlinkos/design/actions/workflows/ci.yml/badge.svg)](https://github.com/openlinkos/design/actions/workflows/ci.yml)

[English](README.md) | 简体中文

本仓库包含：

- **OpenLinkOS**（我们开源项目的总品牌，例如 Origin）与 **LinkOS**（我们的托管服务线，例如 LinkOS Mirrors）的品牌标志；
- 由标志生成的品牌资产：favicon、应用图标、社交分享图和 README 头图；
- `@openlinkos/vitepress-theme`：所有 OpenLinkOS 与 LinkOS 站点共用的 VitePress 主题，提供统一外观、中英双语界面、语言检测和元信息。

维护者请阅读 [BRAND.md](BRAND.md)。

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
