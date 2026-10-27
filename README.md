# React × Wijmo 社内培训工程

面向内部前台开发培训的 React + TypeScript + Wijmo 示例，包含 18 课中文课件。每课按照“技术点讲解 → 真实代码 → 对应画面”组织。

## 启动

需要 Node.js 22 或以上。

```sh
npm ci
npm run dev
```

- Demo：http://127.0.0.1:5173/
- 学习课件：http://127.0.0.1:5173/training/index.html
- 课件源码片段更新：`npm run training`
- 构建：`npm run build`
- 构建预览：`npm run preview`
- 测试：`npm test`

## 示例内容

FlexGrid 数据绑定、key/value 下拉映射、排序筛选与分页、编辑和校验、图表与仪表、五层组织树、透视分析、React.lazy 按需加载、Excel/PDF 导出，以及 fetch 与 AbortController 请求管理。

`src/pages/` 管理各画面，`src/useProjectModel.ts` 管理共享模型，`server/mockApi.ts` 提供本地模拟 API。`public/training/` 包含学习课件、讲师指南、实验与源码对照。

## 数据与授权

项目数据为虚构数据，通过本地 GET/PUT/DELETE `/api/projects` 读取、保存和恢复；只保存在当前服务内存，重启后恢复。使用开发服务或 preview 启动，普通静态服务器不提供模拟 API。

Wijmo 是商业组件，未配置许可证时使用试用模式。可复制 `.env.example` 为 `.env.local` 填入合法 distribution key；前端 VITE_ 变量会进入浏览器，请勿放入服务端密钥。本地环境文件不提交到仓库。

更详细的工程说明参见 [README.txt](README.txt)。

检索：关键词与部门通过 GET /api/projects 的 q、department 参数发送，停止输入 300ms 后请求；分页、分组和列筛选仍在客户端执行。卡片/图表统计本次检索结果。有未保存变更时先保存再修改检索条件。界面 PUT 提交 { rows, removedIds } 按 ID 合并，保留未返回的其他项目；数组请求体仍支持全量替换。
