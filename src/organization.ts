import { departments, statuses, type Project } from "./domain";
export interface OrganizationNode {
  key: string;
  label: string;
  title: string;
  kind: "公司" | "事业群" | "部门" | "状态分组" | "项目";
  path: string[];
  projects: Project[];
  children?: OrganizationNode[];
  projectId?: number;
}
// 使用业务 ID 构造稳定 key；层级节点共享原始项目，避免复制出第二份业务数据。
export function buildOrganizationTree(rows: Project[]): OrganizationNode[] {
  const branch = (
    key: string,
    label: string,
    kind: OrganizationNode["kind"],
    path: string[],
    projects: Project[],
    children?: OrganizationNode[],
  ): OrganizationNode => ({
    key,
    label,
    title: `${label}（${projects.length}）`,
    kind,
    path,
    projects,
    children,
  });
  const company = "示例集团";
  const divisions = [
    { name: "技术与交付事业群", departments: [departments[0], departments[3]] },
    { name: "经营与管理事业群", departments: [departments[1], departments[2]] },
  ];
  return [
    branch(
      "company",
      company,
      "公司",
      [company],
      rows,
      divisions.map((division, index) => {
        const divisionPath = [company, division.name];
        const divisionRows = rows.filter((row) =>
          division.departments.includes(row.department),
        );
        return branch(
          `division-${index}`,
          division.name,
          "事业群",
          divisionPath,
          divisionRows,
          division.departments.map((department) => {
            const departmentRows = divisionRows.filter(
              (row) => row.department === department,
            );
            const path = [...divisionPath, department];
            return branch(
              `department-${department}`,
              department,
              "部门",
              path,
              departmentRows,
              statuses.map((status) => {
                const projects = departmentRows.filter(
                  (row) => row.status === status,
                );
                const statusPath = [...path, status];
                return branch(
                  `${department}-${status}`,
                  status,
                  "状态分组",
                  statusPath,
                  projects,
                  projects.map((project) => ({
                    key: `project-${project.id}`,
                    label: project.name,
                    title: `${project.name} · ${project.owner}`,
                    kind: "项目",
                    path: [...statusPath, project.name],
                    projects: [project],
                    projectId: project.id,
                  })),
                );
              }),
            );
          }),
        );
      }),
    ),
  ];
}
export function flattenOrganization(
  nodes: OrganizationNode[],
): OrganizationNode[] {
  return nodes.flatMap((node) => [
    node,
    ...flattenOrganization(node.children ?? []),
  ]);
}
