import { test } from "node:test";
import assert from "node:assert/strict";
import {
  makeProjects,
  validate,
  validateAll,
  serialize,
  deserialize,
  summarize,
} from "./domain";
test("生成确定性有效数据并正确汇总", () => {
  const rows = makeProjects();
  assert.equal(rows.length, 120);
  assert.equal(validateAll(rows).length, 0);
  assert.equal(
    summarize(rows).reduce((n, r) => n + r.hours, 0),
    rows.reduce((n, r) => n + r.hours, 0),
  );
});
test("拒绝空白名称、负数、越界进度与无效日期", () => {
  const row = makeProjects(1)[0];
  for (const [field, value] of [
    ["name", " "],
    ["hours", -1],
    ["budget", NaN],
    ["progress", 1.1],
    ["start", new Date("bad")],
  ] as const)
    assert.ok(validate({ ...row, [field]: value }, field));
});
test("持久化后恢复 Date 并拒绝坏数据", () => {
  const rows = deserialize(serialize(makeProjects(2)));
  assert.ok(rows[0].start instanceof Date);
  assert.equal(rows[1].id, 2);
  assert.throws(() => deserialize("{broken"));
  assert.throws(() => deserialize('[{"id":1}]'));
});

test("五层组织树完整覆盖项目且分支汇总不重不漏", async () => {
  const { buildOrganizationTree, flattenOrganization } = await import(
    "./organization"
  );
  const rows = makeProjects();
  const nodes = buildOrganizationTree(rows);
  const flat = flattenOrganization(nodes);
  const leaves = flat.filter((node) => node.kind === "项目");
  assert.equal(leaves.length, 120);
  assert.equal(new Set(leaves.map((node) => node.projectId)).size, 120);
  assert.ok(leaves.every((node) => node.path.length === 5));
  for (const node of flat.filter((node) => node.children)) {
    assert.equal(
      node.children!.reduce((n, child) => n + child.projects.length, 0),
      node.projects.length,
    );
    assert.equal(
      node
        .children!.flatMap((child) => child.projects)
        .reduce((n, row) => n + row.hours, 0),
      node.projects.reduce((n, row) => n + row.hours, 0),
    );
  }
  assert.equal(buildOrganizationTree([])[0].projects.length, 0);
  rows[0].department = "营业部";
  rows[0].status = "已完成";
  const moved = flattenOrganization(buildOrganizationTree(rows)).find(
    (node) => node.projectId === rows[0].id,
  )!;
  assert.deepEqual(moved.path.slice(1, 4), [
    "经营与管理事业群",
    "营业部",
    "已完成",
  ]);
});
