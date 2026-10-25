import { test } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { once } from "node:events";
import { createMockApi } from "./mockApi";
import {
  ApiError,
  loadProjects,
  saveProjects,
  resetProjects,
} from "../src/api/projects";

test("浏览器 API 客户端与本地 HTTP 模拟服务的真实请求链路", async (t) => {
  const api = createMockApi();
  const server = createServer((req, res) => {
    void api.handle(req, res, () => {
      res.writeHead(404);
      res.end();
    });
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const base = `http://127.0.0.1:${address.port}`;
  const originalFetch = globalThis.fetch;
  // Node 没有浏览器当前 origin，测试时仅为相对路径补齐地址，仍发送真实 HTTP 请求。
  globalThis.fetch = (input, options) =>
    originalFetch(
      typeof input === "string" && input.startsWith("/") ? base + input : input,
      options,
    );
  t.after(async () => {
    globalThis.fetch = originalFetch;
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
      server.closeAllConnections();
    });
  });
  await t.test("GET 返回 JSON，客户端把日期恢复为 Date", async () => {
    const response = await loadProjects(new AbortController().signal, false, 0);
    assert.equal(response.total, 120);
    assert.equal(response.data.length, 120);
    assert.ok(response.data[0].start instanceof Date);
    assert.equal(typeof response.requestId, "string");
    const raw = await fetch(`${base}/api/projects?delay=0`).then((r) =>
      r.json(),
    );
    assert.equal(typeof raw.data[0].start, "string");
  });
  await t.test("HTTP 500 转为 ApiError，故障关闭后可恢复", async () => {
    await assert.rejects(
      loadProjects(new AbortController().signal, true, 0),
      (error) =>
        error instanceof ApiError &&
        error.status === 500 &&
        /模拟 API/.test(error.message),
    );
    assert.equal(
      (await loadProjects(new AbortController().signal, false, 0)).total,
      120,
    );
  });
  await t.test(
    "PUT 保存的结果由后续 GET 返回，DELETE 恢复初始数据",
    async () => {
      const response = await loadProjects(
        new AbortController().signal,
        false,
        0,
      );
      response.data[0].name = "API 保存验证";
      await saveProjects(response.data);
      assert.equal(
        (await loadProjects(new AbortController().signal, false, 0)).data[0]
          .name,
        "API 保存验证",
      );
      await resetProjects();
      assert.equal(
        (await loadProjects(new AbortController().signal, false, 0)).data[0]
          .name,
        "员工门户 001",
      );
    },
  );
  await t.test("非法保存返回 400，并保留原数据", async () => {
    const result = await fetch(`${base}/api/projects`, {
      method: "PUT",
      body: '[{"id":1}]',
    });
    assert.equal(result.status, 400);
    assert.equal((await result.json()).error.code, "INVALID_DATA");
    assert.equal(
      (await loadProjects(new AbortController().signal, false, 0)).total,
      120,
    );
  });
  await t.test("AbortController 取消真实 fetch，服务停止等待响应", async () => {
    const before = api.getCancelledCount();
    const controller = new AbortController();
    const received = once(server, "request");
    const pending = loadProjects(controller.signal, false, 1000);
    const [, response] = await received;
    const closed = once(response, "close");
    controller.abort();
    await assert.rejects(
      pending,
      (error) => error instanceof Error && error.name === "AbortError",
    );
    await closed;
    assert.equal(api.getCancelledCount(), before + 1);
    assert.equal(
      (await loadProjects(new AbortController().signal, false, 0)).total,
      120,
    );
  });
});
