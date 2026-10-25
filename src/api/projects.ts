import { deserialize, serialize, type Project } from "../domain";
export interface ProjectResponse {
  data: Project[];
  total: number;
  requestId: string;
}
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}
async function requestProjects(
  url: string,
  options: RequestInit = {},
): Promise<ProjectResponse> {
  const response = await fetch(url, { ...options, cache: "no-store" });
  const payload = await response.json();
  // fetch 遇到 HTTP 500 仍会返回 Response，必须主动检查状态。
  if (!response.ok)
    throw new ApiError(
      response.status,
      payload.error?.message ?? `HTTP ${response.status}`,
    );
  if (
    !Array.isArray(payload.data) ||
    payload.total !== payload.data.length ||
    typeof payload.requestId !== "string"
  )
    throw new Error("API 响应格式错误");
  const data = deserialize(JSON.stringify(payload.data)); // JSON 日期字符串 → Date，并进行业务校验。
  options.signal?.throwIfAborted();
  return { data, total: payload.total, requestId: payload.requestId };
}
export async function loadProjects(
  signal: AbortSignal,
  fail = false,
  delay = 600,
): Promise<ProjectResponse> {
  const query = new URLSearchParams({
    fail: String(fail),
    delay: String(delay),
  });
  return requestProjects(`/api/projects?${query}`, { signal });
}
export function saveProjects(rows: Project[]): Promise<ProjectResponse> {
  return requestProjects("/api/projects", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: serialize(rows),
  });
}
export function resetProjects(): Promise<ProjectResponse> {
  return requestProjects("/api/projects", { method: "DELETE" });
}
