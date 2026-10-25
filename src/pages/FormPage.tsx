import { ComboBox, InputDate, InputNumber } from "@mescius/wijmo.react.input";
import { departmentOptions, statusOptions } from "../domain";
import type { ProjectModel } from "../useProjectModel";
export default function FormPage({ model }: { model: ProjectModel }) {
  const { rows, view, selected, setSelected, draft, setDraft, commitForm } =
    model;
  return (
    <>
      <div className="toolbar">
        <label>
          选择项目
          <ComboBox
            itemsSource={rows}
            displayMemberPath="name"
            selectedItem={selected}
            isEditable={false}
            selectedIndexChanged={(s) => {
              if (s.selectedItem) {
                view.moveCurrentTo(s.selectedItem);
                setSelected(s.selectedItem);
                setDraft({ ...s.selectedItem });
              }
            }}
          />
        </label>
        <button onClick={() => selected && setDraft({ ...selected })}>
          开始编辑 / 撤销草稿
        </button>
      </div>
      {draft ? (
        <div className="form">
          <label>
            项目名称
            <input
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            />
          </label>
          <label>
            部门
            <ComboBox
              itemsSource={departmentOptions}
              displayMemberPath="value"
              selectedValuePath="key"
              selectedValue={draft.department}
              isEditable={false}
              selectedIndexChanged={(s) =>
                s.selectedValue != null &&
                setDraft((d) => d && { ...d, department: s.selectedValue })
              }
            />
          </label>
          <label>
            状态
            <ComboBox
              itemsSource={statusOptions}
              displayMemberPath="value"
              selectedValuePath="key"
              selectedValue={draft.status}
              isEditable={false}
              selectedIndexChanged={(s) =>
                s.selectedValue != null &&
                setDraft((d) => d && { ...d, status: s.selectedValue })
              }
            />
          </label>
          <label>
            计划工时
            <InputNumber
              value={draft.hours}
              min={0}
              max={10000}
              step={1}
              valueChanged={(s) =>
                setDraft((d) => d && { ...d, hours: s.value ?? NaN })
              }
            />
          </label>
          <label>
            预算（元）
            <InputNumber
              value={draft.budget}
              min={0}
              format="n0"
              valueChanged={(s) =>
                setDraft((d) => d && { ...d, budget: s.value ?? NaN })
              }
            />
          </label>
          <label>
            开始日期
            <InputDate
              value={draft.start}
              valueChanged={(s) =>
                setDraft((d) => d && { ...d, start: s.value! })
              }
            />
          </label>
          <label>
            进度
            <InputNumber
              value={draft.progress}
              format="p0"
              min={0}
              max={1}
              step={0.05}
              valueChanged={(s) =>
                setDraft((d) => d && { ...d, progress: s.value ?? NaN })
              }
            />
          </label>
          <div className="wide">
            <button className="primary" onClick={commitForm}>
              提交草稿
            </button>{" "}
            <button onClick={() => setDraft(null)}>取消编辑</button>
          </div>
        </div>
      ) : (
        <div className="empty">
          选中项目后点击“开始编辑”，练习草稿状态与提交事务。
        </div>
      )}
      <div className="callout">
        表单使用独立草稿，取消不会修改原记录。提交通过 editItem / commitEdit
        产生变更跟踪，保存前仍会再次校验。
      </div>
    </>
  );
}
