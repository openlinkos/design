---
sourceHash: sha256-7e58bb00
---

# 指南

本页用来演示主题的各项功能：标题、代码块、容器、提示块和链接。随时可以回到[首页](./index.md)。

## 安装 {#install}

在 VitePress 旁边添加主题：

```bash
pnpm add -D @openlinkos/vitepress-theme vitepress
```

::: tip
主题需要 VitePress 1.6.4 或更高版本。
:::

## 配置 {#configure}

### 配置文件 {#the-config-file}

用英文和中文描述一次站点：

```ts
import { defineOpenLinkOSConfig } from '@openlinkos/vitepress-theme/config';

export default defineOpenLinkOSConfig({
  brand: 'origin',
  hostname: 'https://origin.openlinkos.com',
  title: 'Origin',
});
```

### 主题文件 {#the-theme-file}

```ts
export { default } from '@openlinkos/vitepress-theme';
```

> [!NOTE]
> 中文页面的容器、提示块和复制按钮使用中文标题。

::: details
如果某个页面缺少中文版本，构建会失败。
:::

## 品牌资产 {#brand-assets}

启用品牌资产包后，所有品牌的文件都发布在 `/brand/` 下：

![OpenLinkOS 组合标志](/brand/openlinkos/kit/lockup.svg)
