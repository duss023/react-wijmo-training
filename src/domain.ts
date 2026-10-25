// key 保存到项目数据，value 显示在下拉列表。
export const departmentOptions = [
  { key: "研发部", value: "研发部" },
  { key: "营业部", value: "营业部" },
  { key: "管理部", value: "管理部" },
  { key: "品质部", value: "品质部" },
];
export const statusOptions = [
  { key: "计划中", value: "计划中" },
  { key: "进行中", value: "进行中" },
  { key: "已完成", value: "已完成" },
];
export const departments = departmentOptions.map((option) => option.key);
export const statuses = statusOptions.map((option) => option.key);
export interface Project {
  id: number;
  name: string;
  department: string;
  owner: string;
  status: string;
  hours: number;
  budget: number;
  progress: number;
  start: Date;
  active: boolean;
}
export function makeProjects(count = 120): Project[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: `${["员工门户", "采购审批", "客户管理", "库存平台", "报表中心", "权限改造"][i % 6]} ${String(i + 1).padStart(3, "0")}`,
    department: departments[i % 4],
    owner: ["王明", "李华", "佐藤", "田中", "陈静"][i % 5],
    status: statuses[i % 3],
    hours: 8 + ((i * 7) % 193),
    budget: 50000 + ((i * 1573) % 450000),
    progress: i % 3 === 2 ? 1 : ((i * 13) % 90) / 100,
    start: new Date(2026, i % 9, 1 + (i % 27)),
    active: i % 7 !== 0,
  }));
}
export function validate(item: Project, field: string): string | null {
  if (field === "name" && !item.name?.trim()) return "项目名称不能为空";
  if (field === "department" && !departments.includes(item.department))
    return "请选择有效部门";
  if (field === "status" && !statuses.includes(item.status))
    return "请选择有效状态";
  if (
    field === "hours" &&
    (!Number.isFinite(item.hours) || item.hours < 0 || item.hours > 10000)
  )
    return "工时范围为 0～10000";
  if (field === "budget" && (!Number.isFinite(item.budget) || item.budget < 0))
    return "预算必须为非负数";
  if (
    field === "progress" &&
    (!Number.isFinite(item.progress) || item.progress < 0 || item.progress > 1)
  )
    return "进度范围为 0～1";
  if (
    field === "start" &&
    (!(item.start instanceof Date) || Number.isNaN(item.start.getTime()))
  )
    return "请输入有效日期";
  return null;
}
export const editableFields = [
  "name",
  "department",
  "status",
  "hours",
  "budget",
  "progress",
  "start",
];
export function validateAll(rows: Project[]) {
  return rows.flatMap((row) =>
    editableFields
      .map((field) => ({ id: row.id, field, error: validate(row, field) }))
      .filter((x) => x.error),
  );
}
export function summarize(rows: Project[]) {
  return departments.map((department) => ({
    department,
    hours: rows
      .filter((r) => r.department === department)
      .reduce((a, r) => a + r.hours, 0),
    budget: rows
      .filter((r) => r.department === department)
      .reduce((a, r) => a + r.budget, 0),
    count: rows.filter((r) => r.department === department).length,
  }));
}
export function serialize(rows: Project[]) {
  return JSON.stringify(rows);
}
export function deserialize(text: string): Project[] {
  const data: unknown = JSON.parse(text);
  if (
    !Array.isArray(data) ||
    !data.every(
      (r) =>
        r &&
        typeof r.id === "number" &&
        typeof r.name === "string" &&
        typeof r.owner === "string" &&
        typeof r.active === "boolean",
    )
  )
    throw new Error("数据格式错误");
  const rows = data.map((r) => ({
    ...r,
    start: new Date(r.start),
  })) as Project[];
  if (validateAll(rows).length) throw new Error("数据校验失败");
  return rows;
}
