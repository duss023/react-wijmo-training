import { lazy, Suspense, useState } from "react";
import GridPage from "./pages/GridPage";
import FormPage from "./pages/FormPage";
import ChartsPage from "./pages/ChartsPage";
import TreePage from "./pages/TreePage";
import GuidePage from "./pages/GuidePage";
import ErrorBoundary from "./components/ErrorBoundary";
import { useProjectModel } from "./useProjectModel";
// lazy 接收加载函数；此处只声明组件，不立即执行动态 import。
// 首次渲染 <PivotPage /> 时才请求该模块，React 缓存其加载结果。
const PivotPage = lazy(() => import("./pages/PivotPage"));
const modules = [
  ["grid", "01", "项目工作台", "CollectionView / FlexGrid"],
  ["form", "02", "输入与校验", "Input / 编辑事务"],
  ["charts", "03", "数据可视化", "FlexChart / Gauge"],
  ["tree", "04", "组织与导航", "TreeView / 主从联动"],
  ["pivot", "05", "透视分析", "PivotEngine / OLAP"],
  ["guide", "06", "课程与实验", "讲师课件 / 练习"],
] as const;
function initialModule() {
  const requested = new URLSearchParams(location.search).get("module");
  return modules.some(([id]) => id === requested) ? requested! : "grid";
}
export default function App() {
  const [tab, setTab] = useState(initialModule);
  const model = useProjectModel(tab);
  const {
    rows,
    tick,
    pending,
    loading,
    saving,
    error,
    message,
    save,
    reload,
    setSelected,
    setDraft,
  } = model;
  return (
    <div className="shell">
      <aside>
        <a className="brand" href="/">
          W<span>WorkLab</span>
        </a>
        <div className="subtitle">FRONTEND TRAINING LAB</div>
        <div className="navlabel">学习实验室</div>
        <nav>
          {modules.map(([id, n, title, desc]) => (
            <button
              key={id}
              className={tab === id ? "nav active" : "nav"}
              onClick={() => {
                setTab(id);
                setDraft(null);
              }}
            >
              <span>{n}</span>
              <div>
                {title}
                <small>{desc}</small>
              </div>
            </button>
          ))}
        </nav>
        <div className="asidefoot">
          <strong>React × Wijmo</strong>
          <p>从组件到业务系统</p>
          <span>两天课程 · 中文教材</span>
        </div>
      </aside>
      <main>
        <header>
          <div>
            社内技术研修 <span>/</span> 前台开发
          </div>
          <a href="/training/index.html" target="_blank">
            打开培训资料 ↗
          </a>
        </header>
        <section className="content">
          <div className="eyebrow">BUILD. EXPLORE. UNDERSTAND.</div>
          <div className="title">
            <div>
              <h1>{modules.find((x) => x[0] === tab)?.[2]}</h1>
              <p>以项目与工时管理为主线，学习 React 与 Wijmo 的协作方式。</p>
            </div>
            <span className="badge">
              {import.meta.env.VITE_WIJMO_LICENSE_KEY
                ? "已配置授权键"
                : "Wijmo 试用模式"}
            </span>
          </div>
          <div className="metrics">
            <div>
              <label>项目总数</label>
              <strong>
                {rows.length}
                <small>个项目</small>
              </strong>
            </div>
            <div>
              <label>计划总工时</label>
              <strong>
                {rows.reduce((n, r) => n + r.hours, 0).toLocaleString()}
                <small>小时</small>
              </strong>
            </div>
            <div>
              <label>完成项目</label>
              <strong>
                {rows.filter((r) => r.status === "已完成").length}
                <small>个项目</small>
              </strong>
            </div>
            <div>
              <label>待保存变更</label>
              <strong>
                {pending}
                <small>条记录</small>
              </strong>
            </div>
          </div>
          <div className="status" role="status" aria-live="polite">
            {loading
              ? "正在请求 GET /api/projects…"
              : message || "数据已就绪 · 可直接编辑表格，或进入不同实验模块"}
          </div>
          {error && (
            <div className="notice" role="alert">
              {error}
              <button onClick={() => reload((n) => n + 1)}>重试</button>
            </div>
          )}
          <div className="panel">
            <div className="panelhead">
              <div>
                <h2>{modules.find((x) => x[0] === tab)?.[3]}</h2>
                <p>真实组件 · 可交互实验 · 对照源码学习</p>
              </div>
              <button
                className="primary"
                disabled={loading || saving || !!error}
                onClick={save}
              >
                {saving ? "正在提交…" : "保存变更"}
              </button>
            </div>
            <details className="notice">
              <summary>观察 React.lazy 的作用：透视分析代码何时加载？</summary>
              <ol>
                <li>从工作台刷新开始，在开发者工具 Network 中筛选 PivotPage，此时不应请求该模块。</li>
                <li>首次点击“透视分析”，才动态请求页面代码和它的依赖；Suspense 只在真实加载未完成时显示。</li>
                <li>切回工作台再进入，React 复用已加载模块。可用浏览器网络限速观察等待，不修改业务代码。</li>
              </ol>
              <p>lazy 延后代码加载，减少首屏需要加载的代码，不保证每次切页都更慢。GET /api/projects 是独立的数据请求。</p>
            </details>
            {tab === "grid" && <GridPage model={model} />}
            {tab === "form" && <FormPage model={model} />}
            {tab === "charts" && <ChartsPage model={model} />}
            {tab === "tree" && (
              <TreePage
                rows={rows}
                revision={tick}
                onEdit={(project) => {
                  setSelected(project);
                  setDraft({ ...project });
                  setTab("form");
                }}
              />
            )}
            {tab === "pivot" && (
              <ErrorBoundary>
                <Suspense fallback={
                  <div className="notice" role="status" aria-live="polite">
                    <h3>正在按需加载透视分析模块…</h3>
                    <p>首次进入才执行动态 import。菜单仍可操作，可以切换到其他画面。</p>
                    <p>正在等待真实的模块请求与解析。网络较快或命中缓存时，提示可能一闪而过。</p>
                  </div>
                }>
                  <div className="notice" role="status">
                    <strong>透视分析模块已就绪</strong>
                    <p>当前页面内切走再回来，React.lazy 会复用已解析的模块，不再重复等待；透视组件会重新挂载。刷新页面可重新演示。</p>
                    <a href="/?module=grid">从工作台重新开始观察</a>
                  </div>
                  <PivotPage rows={rows} revision={tick} />
                </Suspense>
              </ErrorBoundary>
            )}
            {tab === "guide" && <GuidePage model={model} />}
          </div>
          <footer>
            <span>WORKLAB / ENGINEERING EDUCATION</span>
            <span>React 18 · TypeScript · Wijmo · Vite</span>
          </footer>
        </section>
      </main>
    </div>
  );
}
