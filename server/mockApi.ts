import type { IncomingMessage, ServerResponse } from "node:http";
import { randomUUID } from "node:crypto";
import { deserialize, makeProjects } from "../src/domain";

// 每个本地服务实例持有一份内存数据；重启后恢复，不连接数据库。
export function createMockApi() {
  let projects = makeProjects();
  let cancelled = 0;
  function send(res: ServerResponse, status: number, body: unknown) {
    if (res.destroyed) return;
    res.writeHead(status, {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    });
    res.end(JSON.stringify(body));
  }
  // 客户端取消 fetch 后连接关闭，模拟服务停止仍在等待的响应。
  function wait(res: ServerResponse, delay: number): Promise<boolean> {
    return new Promise((resolve) => {
      const onClose = () => {
        clearTimeout(timer);
        cancelled++;
        resolve(false);
      };
      const timer = setTimeout(() => {
        res.off("close", onClose);
        resolve(!res.destroyed);
      }, delay);
      res.once("close", onClose);
    });
  }
  async function handle(
    req: IncomingMessage,
    res: ServerResponse,
    next: () => void,
  ) {
    const url = new URL(req.url ?? "/", "http://localhost");
    if (url.pathname !== "/api/projects") {
      next();
      return;
    }
    const requestId = randomUUID();
    try {
      if (req.method === "GET") {
        const requested = Number(url.searchParams.get("delay") ?? 600);
        const delay = Number.isFinite(requested)
          ? Math.min(5000, Math.max(0, requested))
          : 600;
        if (!(await wait(res, delay))) return;
        if (url.searchParams.get("fail") === "true") {
          send(res, 500, {
            error: {
              code: "MOCK_FAILURE",
              message: "模拟 API 故障，请关闭故障开关后重试",
            },
            requestId,
          });
          return;
        }
        const keyword = (url.searchParams.get("q") ?? "").trim().toLowerCase();
        const department = url.searchParams.get("department") ?? "";
        const data = projects.filter(
          (row) =>
            (!department || row.department === department) &&
            `${row.name} ${row.owner}`.toLowerCase().includes(keyword),
        );
        send(res, 200, { data, total: data.length, requestId });
        return;
      }
      if (req.method === "PUT") {
        let body = "";
        for await (const chunk of req) {
          body += chunk.toString();
          if (Buffer.byteLength(body) > 1024 * 1024)
            throw new Error("请求体过大");
        }
        const payload = JSON.parse(body);
        const merge = !Array.isArray(payload);
        const rows = deserialize(merge ? JSON.stringify(payload.rows) : body);
        const removedIds: number[] = merge ? payload.removedIds : [];
        if (
          !Array.isArray(removedIds) ||
          removedIds.some((id) => !Number.isSafeInteger(id) || id <= 0)
        )
          throw new Error("删除 ID 格式错误");
        if (
          rows.some((row) => !Number.isSafeInteger(row.id) || row.id <= 0) ||
          new Set(rows.map((row) => row.id)).size !== rows.length
        )
          throw new Error("项目 ID 必须为不重复的正整数");
        // 检索结果提交使用合并模式，保留本次未返回的项目。
        const changedIds = new Set([
          ...rows.map((row) => row.id),
          ...removedIds,
        ]);
        projects = merge
          ? [...projects.filter((row) => !changedIds.has(row.id)), ...rows]
          : rows;
        send(res, 200, { data: projects, total: projects.length, requestId });
        return;
      }
      if (req.method === "DELETE") {
        projects = makeProjects();
        send(res, 200, { data: projects, total: projects.length, requestId });
        return;
      }
      res.setHeader("Allow", "GET, PUT, DELETE");
      send(res, 405, {
        error: { code: "METHOD_NOT_ALLOWED", message: "不支持此请求方法" },
        requestId,
      });
    } catch (error) {
      send(res, 400, {
        error: {
          code: "INVALID_DATA",
          message: error instanceof Error ? error.message : "请求数据错误",
        },
        requestId,
      });
    }
  }
  return { handle, getCancelledCount: () => cancelled };
}
