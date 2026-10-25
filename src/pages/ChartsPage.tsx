import {
  FlexChart,
  FlexChartSeries,
  FlexPie,
} from "@mescius/wijmo.react.chart";
import { LinearGauge } from "@mescius/wijmo.react.gauge";
import type { ProjectModel } from "../useProjectModel";
export default function ChartsPage({ model }: { model: ProjectModel }) {
  const { summary, selected } = model;
  return (
    <>
      <div className="chartgrid">
        <div>
          <h3>各部门工时</h3>
          <FlexChart
            itemsSource={summary}
            bindingX="department"
            chartType="Column"
            style={{ height: 300 }}
          >
            <FlexChartSeries binding="hours" name="计划工时" />
          </FlexChart>
        </div>
        <div>
          <h3>预算占比</h3>
          <FlexPie
            itemsSource={summary}
            binding="budget"
            bindingName="department"
            style={{ height: 300 }}
          />
        </div>
      </div>
      <h3>当前项目：{selected?.name ?? "尚未选择"}</h3>
      <LinearGauge
        min={0}
        max={100}
        value={(selected?.progress ?? 0) * 100}
        isReadOnly={true}
        format="n0"
        showText="Value"
        style={{ height: 60 }}
      />
      <div className="callout">
        在工作台编辑工时后返回此页：collectionChanged 事件触发 React
        派生汇总。图表使用聚合数据，不受网格分页影响。
      </div>
    </>
  );
}
