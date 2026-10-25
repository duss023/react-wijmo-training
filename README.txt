React × Wijmo 社内培训 Demo
==========================
需要 Node.js 22 或以上（建议 22 LTS）。安装：npm ci。开发：npm run dev。
测试：npm test。构建：npm run build。预览：npm run preview。

培训资料：public/training/index.html（启动后访问 /training/index.html）。
新版课件共 18 课，每课固定“技术点讲解→真实代码→对应画面”，并含小练习。
源码片段自动提取、标注文件与行号；画面提供真实截图、操作步骤和预期结果。
资料首页就是学习课件；mapping.html 为技术点—代码—画面对应关系总表。
可从页面顶部打印整份课件或另存 PDF。执行 npm run training 可更新代码片段。
讲师手册、8 个实验与参考答案、覆盖矩阵均在同目录。

使用真实 Wijmo 商业组件，无许可证默认试用。复制 .env.example 为 .env.local
后填写有效 distribution key；VITE_ 变量会打包到浏览器。
不要把后台密钥放入前端环境变量。正式使用按 MESCIUS 条款授权。

数据为虚构项目。前台通过 fetch 发送真实 HTTP 请求到本地模拟 API。
GET /api/projects?fail=false&delay=600：返回 {data,total,requestId}，fail=true 返回 HTTP 500。
PUT /api/projects：提交 JSON 项目数组，验证后替换服务端内存数据。
DELETE /api/projects：恢复初始 120 条项目。
数据仅存于当前本地服务内存；多个浏览器共享，重启工程后恢复初始。
旧版 localStorage 数据不再作为来源，也不会自动迁移或上传。
课程与实验页可切换 600ms/3000ms 延迟、模拟故障并查看成功响应 JSON 预览。
开发者工具 Network 面板可直接查看 projects 请求、响应和取消状态。
用 npm run dev 或 npm run preview 运行，普通静态服务器不提供这些 API。
不连接公司生产系统；正式后台鉴权、权限、持久化和并发控制需另行实现。

图表与卡片基于全部源数据；网格有独立筛选和分页。
Excel 导出当前网格视图，受筛选分页影响。
PDF 默认字体不保证中文，需要嵌入有权使用的中文 TTF（见讲师手册）。

源码结构：
src/main.tsx：程序入口、样式、授权、挂载 App。
src/App.tsx：公共布局、菜单和 tab 条件渲染。
src/useProjectModel.ts：共享数据、事件、筛选、草稿、保存、导出。
src/pages/GridPage.tsx：项目工作台。
src/pages/FormPage.tsx：输入与校验。
src/pages/ChartsPage.tsx：图表与 Gauge。
src/pages/TreePage.tsx：组织树与项目详情。
src/pages/PivotPage.tsx：透视分析（按需加载）。
src/pages/GuidePage.tsx：课件入口与故障实验。
src/api/projects.ts：fetch、HTTP 状态、JSON 解析与请求服务。
server/mockApi.ts：本地 HTTP 模拟 API；vite.config.ts：开发及预览路由。
src/domain.ts：业务类型、模拟数据与校验；src/organization.ts：树结构。
src/components/ErrorBoundary.tsx：组件错误兜底。
src/domain.test.ts：业务规则与树结构测试；src/style.css：样式。

不要将教学结构直接等同于生产架构。服务端认证、权限、并发、持久化迁移
和端到端测试等生产化差距参见讲师手册。

组织树更新：公司→事业群→部门→状态→项目，共五层；支持分支统计、路径导航、
全部展开/收起和展开至部门。源码见 src/organization.ts 和 src/pages/TreePage.tsx。

第 1 课新增：技术讲解前的整体代码结构，以及 setTab→重新执行 App→条件判断→更新 DOM 的 5 步说明。
