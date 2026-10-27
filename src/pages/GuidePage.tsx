import type { ProjectModel } from "../useProjectModel";
export default function GuidePage({ model }: { model: ProjectModel }) {
  const {
    fail,
    setFail,
    reload,
    reset,
    saving,
    delayMs,
    setDelayMs,
    apiResponse,
  } = model;
  return (
    <div className="guide">
      <h3>从一个业务场景到可维护的前台系统</h3>
      <p>
        建议对象：具备 JavaScript 基础的前台开发人员。默认两天，每天 6 小时。
      </p>
      <a className="linkbutton" href="/training/index.html" target="_blank">
        课程资料首页 ↗
      </a>{" "}
      <a className="linkbutton" href="/training/mapping.html" target="_blank">
        查看技术点对应关系 ↗
      </a>
      <h3>故障与恢复实验</h3>
      <label className="check">
        <input
          type="checkbox"
          checked={fail}
          onChange={(e) => setFail(e.target.checked)}
        />
        模拟接口故障（会重新加载，丢弃未保存变更）
      </label>
      <button onClick={() => reload((n) => n + 1)}>重新请求 API 数据</button>
      <button
        disabled={saving}
        onClick={() => {
          if (confirm("恢复模拟 API 的 120 条初始数据？未保存变更会丢失。"))
            void reset();
        }}
      >
        恢复初始数据
      </button>
      <label>
        API 响应延迟
        <select
          value={delayMs}
          onChange={(e) => setDelayMs(Number(e.target.value))}
        >
          <option value={600}>600ms</option>
          <option value={3000}>3000ms（观察取消）</option>
        </select>
      </label>
      <h3>请求 → JSON 响应 → 画面</h3>
      <p>
        前台发送 GET /api/projects，模拟 API 返回
        data、total、requestId；前台恢复日期后将 data 交给
        CollectionView。打开浏览器开发者工具的 Network 面板，筛选 projects
        可查看请求、状态码和响应。
      </p>
      <a href="/api/projects?delay=0" target="_blank">
        直接查看模拟 API 的 JSON 响应 ↗
      </a>
      <p>最近一次成功 GET 的响应预览（只展示前两条，total 是本次匹配记录数）：</p>
      <pre className="api-preview">
        {apiResponse
          ? JSON.stringify(
              { ...apiResponse, data: apiResponse.data.slice(0, 2) },
              null,
              2,
            )
          : "等待 API 成功返回…"}
      </pre>
      <p>
        GET 读取、PUT 保存、DELETE
        恢复初始数据。模拟数据保存在当前本地服务内存，多个浏览器共享这份数据；重启服务后恢复
        120 条初始记录。旧版 localStorage 存档不参与本轮 API
        响应，也不会自动上传。
      </p>
      <p>
        真实 API
        的认证、服务器分页、并发冲突和后台权限属于扩展实验，当前不连接生产系统。
      </p>
    </div>
  );
}
