import { useEffect, useState } from "react";
import { Aggregate, DataType } from "@mescius/wijmo";
import { PivotEngine } from "@mescius/wijmo.olap";
import { PivotPanel, PivotGrid, PivotChart } from "@mescius/wijmo.react.olap";
import type { Project } from "../domain";
export default function PivotPage({
  rows,
  revision,
}: {
  rows: Project[];
  revision: number;
}) {
  const [engine] = useState(
    () =>
      new PivotEngine({
        autoGenerateFields: false,
        fields: [
          { binding: "department", header: "部门" },
          { binding: "status", header: "状态" },
          {
            binding: "hours",
            header: "工时",
            dataType: DataType.Number,
            aggregate: Aggregate.Sum,
            format: "n0",
          },
          {
            binding: "budget",
            header: "预算",
            dataType: DataType.Number,
            aggregate: Aggregate.Sum,
            format: "n0",
          },
        ],
        rowFields: ["部门"],
        columnFields: ["状态"],
        valueFields: ["工时"],
      }),
  );
  useEffect(() => {
    engine.itemsSource = rows;
    engine.refresh();
  }, [engine, rows, revision]);
  return (
    <>
      <div className="pivotgrid">
        <PivotPanel itemsSource={engine} />
        <PivotGrid itemsSource={engine} style={{ height: 400 }} />
      </div>
      <PivotChart itemsSource={engine} style={{ height: 280 }} />
      <div className="callout">
        拖动字段到行、列和值区域。OLAP 处理全部源数据；授权范围请向公司采购或
        MESCIUS 确认。
      </div>
    </>
  );
}
