---
sourceHash: sha256-79b90377
---

# 组件

主题的首页组件，由站点的主题文件注册，在 Markdown 里使用。样式只用 `@openlinkos/ui` 的变量，颜色、尺寸、圆角全部来自设计系统，浅色、深色、任意宽度都成立。

```ts
import Theme from '@openlinkos/vitepress-theme';
import { OlBand, OlCast, OlHero, OlLogos, OlSteps } from '@openlinkos/vitepress-theme/components';

export default {
  ...Theme,
  enhanceApp(ctx) {
    for (const [name, component] of Object.entries({ OlBand, OlCast, OlHero, OlLogos, OlSteps })) {
      ctx.app.component(name, component);
    }
    Theme.enhanceApp?.(ctx);
  },
};
```

## OlHero {#olhero}

第一屏：标题、说明、按钮、一条带复制按钮的命令，右侧是媒体（960 px 以下移到文字下方）。插槽：`title`、`lead`、`actions`、`meta`、`media`；属性：`command`。

<OlHero command="pnpm add -D @openlinkos/vitepress-theme">
  <template #title>OpenLinkOS 的 VitePress 主题</template>
  <template #lead>品牌、双语、元信息，再加一层给 Agent 读的，家族每个站点都用它。</template>
  <template #actions>
    <a href="/zh/guide">读指南</a>
    <a class="ghost" href="https://github.com/openlinkos/design">GitHub</a>
  </template>
  <template #media>
    <img src="/cast-poster.svg" alt="一个终端里，三个检测点同时探测一个服务" />
  </template>
</OlHero>

## OlSteps {#olsteps}

编号时间线，一步一行，每步可以配一张截图或一段输出（960 px 以下移到文字下方）。属性：`steps`，即 `{ title, text, media, alt }` 的列表。

<OlSteps :steps="[
  { title: '从用户所在的地方检测', text: '多个检测点同时检查每个服务；目录里放着目标。', media: '/cast-poster.svg', alt: '一个终端里，三个检测点同时探测一个服务' },
  { title: '告警叫醒 Agent', text: '告警自带证据，Agent 一上手就有全部事实。' },
  { title: '经通道修好', text: 'Agent 不持有密钥就能到达机器；每条命令都有记录。' },
]" />

## OlCast {#olcast}

终端录像：没有 JavaScript，或读者偏好减少动效时，看到的一直是静态截图；两者都允许时，播放按钮加载播放器（`player`，站点自己那份 asciinema-player）并开始播放。属性：`src`、`player`、`player-css`、`poster`、`alt`、`caption`。

<OlCast
  src="/demo.cast"
  player="https://unpkg.com/asciinema-player@3.17.0/dist/bundle/asciinema-player.min.js"
  player-css="https://unpkg.com/asciinema-player@3.17.0/dist/bundle/asciinema-player.css"
  poster="/cast-poster.svg"
  alt="一个终端里，三个检测点同时探测一个服务"
  caption="这是一段手写的录像；正式站点放自己录的。"
/>

## OlLogos {#ollogos}

一行名字，有能在浅色和深色页面上都看清的图就放图，没有就放文字。属性：`items`，即 `{ name, src, href }` 的列表；`label` 给屏幕阅读器。

<OlLogos
  label="支持这些 Agent 客户端"
  :items="[
    { name: 'Claude Code', href: 'https://code.claude.com/docs/claude-code' },
    { name: 'Codex', href: 'https://developers.openai.com/codex/' },
    { name: 'Cursor', href: 'https://cursor.com/' },
    { name: '任意 MCP 客户端' },
  ]"
/>

## OlBand {#olband}

结尾行动区，品牌色上的一块面板。插槽：`title`、`text`、`actions`（放链接；`class="ghost"` 是安静的样式）。

<OlBand>
  <template #title>把组件放到你的页面上</template>
  <template #text>主题带着品牌、语言和给 Agent 的一层；组件带着第一屏。</template>
  <template #actions>
    <a href="/zh/guide">读指南</a>
    <a class="ghost" href="https://github.com/openlinkos/design">GitHub</a>
  </template>
</OlBand>
