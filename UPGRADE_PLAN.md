# 知识站升级方案（从纯 HTML/CSS 到数据驱动静态站）

## 1. 目标与结论

你当前项目已经出现两个信号：
- 知识点数量快速增长
- 多语言内容需要同步维护

**建议升级方向**：继续保持“静态站部署”，但将内容改为“数据驱动 + 静态生成（SSG）”。

推荐技术栈：
- 前端框架：`Astro`（轻量、适合文档/知识站）
- 内容存储：`Markdown + JSON`（知识点、题库分离）
- 样式：继续用现有 `CSS`
- 搜索：先本地索引（如 Pagefind），后续再接 Algolia
- 部署：GitHub Pages / Netlify / Vercel（静态部署）

---

## 2. 升级原则

1. 不一次性重写，采用“并行迁移、逐页替换”。
2. 页面 URL 尽量不变，避免历史链接失效。
3. 内容与展示分离：知识点不再写死在 HTML。
4. 每个阶段可回滚，确保可持续迭代。

---

## 3. 里程碑（建议 4 周）

1. 第 1 周：搭建新框架骨架，迁移首页与导航。
2. 第 2 周：迁移知识点页（crypto / sign-pki）到内容化结构。
3. 第 3 周：迁移题库与搜索，接入多语言路由。
4. 第 4 周：SEO、性能、验收、切流上线。

---

## 4. 分阶段详细操作步骤

## 阶段 0：准备与基线（半天）

1. 新建迁移分支。

```bash
git checkout -b feat/upgrade-ssg
```

2. 记录当前站点基线（用于回归对比）。
- 页面：`index.html`、`knowledge.html`、`knowledge-crypto.html`、`knowledge-sign-pki.html`、`questions.html`
- 资源：`assets/styles.css`、`assets/i18n.js`、`assets/questions-data.js`、`assets/images/*`

3. 备份当前可发布版本。

```bash
git tag pre-ssg-baseline
```

验收标准：
- 当前站点在本地可正常访问，语言切换正常，知识点完整可见。

---

## 阶段 1：初始化 Astro 项目（半天）

1. 安装并初始化（在项目根目录执行）。

```bash
npm create astro@latest
```

初始化建议：
- 项目目录：当前仓库根目录（或 `web/` 子目录）
- 模板：`minimal`
- TypeScript：`strict`（推荐）
- 包管理器：`npm` 或 `pnpm`

2. 基础目录规划。

```text
src/
  layouts/
  pages/
  components/
  content/
    knowledge/
      zh/
      ja/
    questions/
  styles/
public/
  images/
```

3. 迁移静态资源。
- 将 `assets/images/*` 迁到 `public/images/*`
- 将 `assets/styles.css` 迁到 `src/styles/global.css`

4. 启动开发服务。

```bash
npm install
npm run dev
```

验收标准：
- 新项目可启动，首页可访问。

---

## 阶段 2：抽离内容模型（1 天）

### 2.1 知识点数据结构

按“分类 -> 知识点 -> 多语言”建模，示例文件：

`src/content/knowledge/zh/sign-pki.json`

```json
{
  "category": "sign-pki",
  "title": "デジタル署名 / PKI",
  "items": [
    {
      "id": "k31",
      "title": "数字签名（デジタル署名）",
      "body": ["...段落1...", "...段落2..."],
      "bullets": ["..."],
      "figures": [
        {
          "src": "/images/digital-signature-flow.svg",
          "caption": "图示：..."
        }
      ]
    }
  ]
}
```

对应 `ja` 同结构：
- `src/content/knowledge/ja/sign-pki.json`

### 2.2 题库数据结构

将 `assets/questions-data.js` 转为纯 JSON，示例：

`src/content/questions/sg-basic.zh.json`

```json
{
  "meta": { "lang": "zh", "topic": "basic" },
  "questions": [
    {
      "id": "q001",
      "title": "...",
      "stem": "...",
      "choices": ["...", "..."],
      "answer": "A",
      "explanation": "...",
      "tags": ["crypto"]
    }
  ]
}
```

验收标准：
- 新增知识点只需改内容文件，不改页面模板。

---

## 阶段 3：页面模板化（1-2 天）

1. 创建统一布局 `src/layouts/BaseLayout.astro`。
- 头部导航
- 语言切换
- 页脚

2. 创建知识点组件 `src/components/KnowledgeItem.astro`。
- 输入：`title/body/bullets/figures`
- 输出：现有 `<details>` 折叠样式（保持 UI 习惯）

3. 创建分类页模板。
- `src/pages/knowledge/[lang]/[category].astro`
- 根据 URL 动态读取 JSON 并渲染

4. 创建索引页模板。
- `src/pages/knowledge/[lang]/index.astro`
- 列出所有分类入口

验收标准：
- `knowledge-crypto`、`knowledge-sign-pki` 页面由同一模板生成。

---

## 阶段 4：多语言路由升级（1 天）

1. 使用 URL 路由区分语言：
- `/zh/...`
- `/ja/...`

2. 旧 URL 兼容策略（避免断链）：
- `knowledge-sign-pki.html` -> 301 到 `/zh/knowledge/sign-pki`
- `knowledge-crypto.html` -> 301 到 `/zh/knowledge/crypto`

3. 导航统一使用语言前缀链接。

验收标准：
- 中日文页面可直接分享链接。
- 刷新页面语言不丢失。

---

## 阶段 5：搜索与性能（1 天）

1. 接入静态搜索（推荐 Pagefind）。
2. 图片懒加载、压缩、尺寸约束。
3. 添加基础 SEO：
- `title`
- `description`
- Open Graph
- sitemap

验收标准：
- 搜索可命中知识点标题与正文。
- Lighthouse 性能/SEO 达标（建议 > 90）。

---

## 阶段 6：验收与上线（半天）

1. 回归测试清单：
- 首页、题库、知识点分类、详情
- 中日切换
- 搜索
- 移动端显示

2. 构建与发布：

```bash
npm run build
npm run preview
```

3. 上线策略：
- 先灰度（预览域名）
- 再切主域名

4. 回滚策略：
- 如出现问题，回退到 `pre-ssg-baseline` 标签版本。

---

## 5. 你当前项目的迁移映射（直接可执行）

- `index.html` -> `src/pages/[lang]/index.astro`
- `knowledge.html` -> `src/pages/[lang]/knowledge/index.astro`
- `knowledge-crypto.html` -> `src/pages/[lang]/knowledge/crypto.astro`（后续并入动态 `[category].astro`）
- `knowledge-sign-pki.html` -> `src/pages/[lang]/knowledge/sign-pki.astro`
- `questions.html` -> `src/pages/[lang]/questions/index.astro`
- `assets/i18n.js` -> 拆分为 `src/content/i18n/zh.json` 与 `src/content/i18n/ja.json`
- `assets/questions-data.js` -> `src/content/questions/*.json`

---

## 6. 风险与应对

1. 风险：一次迁移太大导致进度拖慢。
- 应对：按页面分批替换，先迁知识点，再迁题库。

2. 风险：旧链接失效影响使用。
- 应对：配置 301 重定向并保留旧入口页过渡。

3. 风险：多语言字段不一致。
- 应对：给内容 schema 加必填字段校验（构建时报错）。

---

## 7. 最终建议（执行顺序）

1. 本周先完成阶段 0-2（骨架 + 内容抽离）。
2. 下周完成阶段 3-4（模板化 + 多语言路由）。
3. 第三周做阶段 5-6（搜索、验收、上线）。

当你完成上述升级后，后续新增知识点会从“改 HTML”变成“写 JSON/Markdown”，维护成本会明显下降。
