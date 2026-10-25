import { useMemo, useRef, useState } from "react";
import { TreeView } from "@mescius/wijmo.react.nav";
import type { TreeView as TreeControl } from "@mescius/wijmo.nav";
import {
  buildOrganizationTree,
  flattenOrganization,
  type OrganizationNode,
} from "../organization";
import type { Project } from "../domain";
export default function TreePage({
  rows,
  revision,
  onEdit,
}: {
  rows: Project[];
  revision: number;
  onEdit: (project: Project) => void;
}) {
  const tree = useRef<TreeControl | null>(null);
  const nodes = useMemo(() => buildOrganizationTree(rows), [rows, revision]);
  const flat = useMemo(() => flattenOrganization(nodes), [nodes]);
  const [selectedKey, setSelectedKey] = useState("company");
  const selected = flat.find((node) => node.key === selectedKey) ?? nodes[0];
  const project = selected.kind === "项目" ? selected.projects[0] : null;
  const hours = selected.projects.reduce((n, row) => n + row.hours, 0);
  const budget = selected.projects.reduce((n, row) => n + row.budget, 0);
  const completed = selected.projects.filter(
    (row) => row.status === "已完成",
  ).length;
  return (
    <>
      <div className="tree-toolbar">
        <div>
          <strong>集团项目全景</strong>
          <p>公司 / 事业群 / 部门 / 状态 / 项目 · 共 5 层</p>
        </div>
        <div>
          <button onClick={() => tree.current?.collapseToLevel(10)}>
            全部展开
          </button>
          <button onClick={() => tree.current?.collapseToLevel(2)}>
            展开至部门
          </button>
          <button onClick={() => tree.current?.collapseToLevel(0)}>
            全部收起
          </button>
        </div>
      </div>
      <div className="treegrid">
        <TreeView
          itemsSource={nodes}
          displayMemberPath="title"
          childItemsPath="children"
          selectedItem={selected}
          initialized={(control: TreeControl) => {
            tree.current = control;
            control.collapseToLevel(2);
          }}
          selectedItemChanged={(s) => {
            const node = s.selectedItem as OrganizationNode | null;
            if (node) setSelectedKey(node.key);
          }}
          style={{ height: 520 }}
        />
        <div className="tree-detail">
          <div className="tree-path" aria-label="当前节点路径">
            {selected.path.join(" / ")}
          </div>
          <span className="tree-kind">{selected.kind}</span>
          <h3>{selected.label}</h3>
          {project ? (
            <>
              <dl>
                <dt>项目编号</dt>
                <dd>#{project.id}</dd>
                <dt>所属部门</dt>
                <dd>{project.department}</dd>
                <dt>负责人</dt>
                <dd>{project.owner}</dd>
                <dt>状态</dt>
                <dd>{project.status}</dd>
                <dt>计划工时</dt>
                <dd>{project.hours.toLocaleString()} 小时</dd>
                <dt>预算</dt>
                <dd>{project.budget.toLocaleString()} 元</dd>
                <dt>进度</dt>
                <dd>{Math.round(project.progress * 100)}%</dd>
              </dl>
              <button className="primary" onClick={() => onEdit(project)}>
                编辑此项目
              </button>
            </>
          ) : (
            <>
              <p className="tree-description">
                汇总当前分支的全部项目，包含下级节点。
              </p>
              <dl>
                <dt>项目总数</dt>
                <dd>{selected.projects.length} 个</dd>
                <dt>计划工时</dt>
                <dd>{hours.toLocaleString()} 小时</dd>
                <dt>项目预算</dt>
                <dd>{budget.toLocaleString()} 元</dd>
                <dt>已完成</dt>
                <dd>
                  {completed} / {selected.projects.length} 个
                </dd>
              </dl>
              <h3>直属下级</h3>
              <ul className="tree-children">
                {selected.children?.map((child) => (
                  <li key={child.key}>
                    <button
                      onClick={() => {
                        setSelectedKey(child.key);
                        tree.current?.getNode(child)?.ensureVisible();
                      }}
                    >
                      {child.label}
                      <span>{child.projects.length} 个项目 →</span>
                    </button>
                  </li>
                ))}
              </ul>
              {selected.projects.length === 0 && (
                <p>此分支暂无项目，可在工作台新增项目后查看。</p>
              )}
            </>
          )}
          <div className="callout">
            点击分支查看汇总，点击项目查看详情。节点数量随项目新增、部门或状态变更自动更新；childItemsPath
            在各层复用。
          </div>
        </div>
      </div>
    </>
  );
}
