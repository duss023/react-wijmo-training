import { PropertyGroupDescription, SortDescription } from "@mescius/wijmo";
import type { FlexGrid as GridControl } from "@mescius/wijmo.grid";
import {
  FlexGrid,
  FlexGridColumn,
  FlexGridCellTemplate,
} from "@mescius/wijmo.react.grid";
import { FlexGridFilter } from "@mescius/wijmo.react.grid.filter";
import { ComboBox, CollectionViewNavigator } from "@mescius/wijmo.react.input";
import { departmentOptions } from "../domain";
import type { ProjectModel } from "../useProjectModel";
// 保持选项数组引用稳定，避免重渲染时 ComboBox 重置选择并触发变更事件。
const departmentFilterOptions = [
  { key: "全部部门", value: "全部部门" },
  ...departmentOptions,
];
export default function GridPage({ model }: { model: ProjectModel }) {
  const {
    view,
    grid,
    query,
    setQuery,
    department,
    setDepartment,
    pageSize,
    setPageSize,
    grouped,
    setGrouped,
    loading,
    error,
    selected,
    add,
    remove,
    exportExcel,
    exportPdf,
    departmentMap,
    statusMap,
  } = model;
  return (
    <>
      <div className="toolbar">
        <label>
          搜索
          <input
            placeholder="项目名称 / 负责人"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <label>
          部门
          <ComboBox
            itemsSource={departmentFilterOptions}
            displayMemberPath="value"
            selectedValuePath="key"
            selectedValue={department}
            isEditable={false}
            selectedIndexChanged={(s) =>
              s.selectedValue != null && setDepartment(s.selectedValue)
            }
          />
        </label>
        <label>
          每页
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
          >
            <option>15</option>
            <option>30</option>
            <option value="0">全部（虚拟滚动）</option>
          </select>
        </label>
        <label className="check">
          <input
            type="checkbox"
            checked={grouped}
            onChange={(e) => {
              setGrouped(e.target.checked);
              view.groupDescriptions.clear();
              if (e.target.checked)
                view.groupDescriptions.push(
                  new PropertyGroupDescription("department"),
                );
            }}
          />
          按部门分组
        </label>
      </div>
      <div className="actions">
        <button onClick={add} disabled={loading || !!error}>
          ＋ 新增
        </button>
        <button onClick={remove} disabled={!selected || loading || !!error}>
          删除选中
        </button>
        <button
          onClick={() => {
            view.sortDescriptions.clear();
            view.sortDescriptions.push(new SortDescription("hours", false));
          }}
        >
          按工时降序
        </button>
        <button onClick={exportExcel}>导出 Excel</button>
        <button onClick={exportPdf}>导出 PDF</button>
        <span>双击单元格编辑 · 列头排序 / 筛选</span>
      </div>
      <FlexGrid
        initialized={(g: GridControl) => {
          grid.current = g;
        }}
        itemsSource={view}
        autoGenerateColumns={false}
        isReadOnly={loading || !!error}
        selectionMode="Row"
        allowSorting="MultiColumn"
        allowDragging="Columns"
        frozenColumns={1}
        showErrors={true}
        validateEdits={true}
        style={{ height: 420 }}
      >
        <FlexGridFilter />
        <FlexGridColumn binding="id" header="ID" width={64} isReadOnly={true} />
        <FlexGridColumn
          binding="name"
          header="项目名称"
          width="*"
          minWidth={180}
        />
        <FlexGridColumn
          binding="department"
          header="部门"
          dataMap={departmentMap}
          width={110}
        />
        <FlexGridColumn binding="owner" header="负责人" width={90} />
        <FlexGridColumn
          binding="status"
          header="状态"
          dataMap={statusMap}
          width={105}
        />
        <FlexGridColumn
          binding="hours"
          header="工时"
          format="n0"
          width={85}
          aggregate="Sum"
        />
        <FlexGridColumn
          binding="budget"
          header="预算（元）"
          format="n0"
          width={120}
          aggregate="Sum"
        />
        <FlexGridColumn
          binding="progress"
          header="进度"
          format="p0"
          width={130}
        >
          <FlexGridCellTemplate
            cellType="Cell"
            template={(ctx) => (
              <span className="progress">
                <i
                  style={{
                    width: `${Math.max(0, Math.min(100, ctx.item.progress * 100))}%`,
                  }}
                />
                <b>{Math.round(ctx.item.progress * 100)}%</b>
              </span>
            )}
          />
        </FlexGridColumn>
        <FlexGridColumn
          binding="start"
          header="开始日期"
          format="yyyy-MM-dd"
          width={125}
        />
        <FlexGridColumn binding="active" header="有效" width={65} />
      </FlexGrid>
      <div className="gridfoot">
        <CollectionViewNavigator
          cv={view}
          byPage={true}
          headerFormat="第 {currentPage:n0} / {pageCount:n0} 页"
        />
        <span>
          当前页 {view.items.length} 条 · 选中 #{selected?.id ?? "—"}
        </span>
      </div>
      <div className="callout">
        实验提示：先筛选部门，再切换分组，观察 CollectionView
        如何驱动同一张表。卡片和图表统计的是全部源数据。
      </div>
    </>
  );
}
