import { useEffect, useMemo, useRef, useState } from "react";
import { CollectionView } from "@mescius/wijmo";
import { DataMap, type FlexGrid as GridControl } from "@mescius/wijmo.grid";
import {
  departmentOptions,
  statusOptions,
  makeProjects,
  validate,
  validateAll,
  summarize,
  serialize,
  type Project,
} from "./domain";

import {
  loadProjects,
  saveProjects,
  resetProjects,
  type ProjectResponse,
} from "./api/projects";

export function useProjectModel(tab: string) {
  // CollectionView 持有可编辑对象；React 只持有 UI 状态，通过事件订阅刷新派生界面。
  const [view] = useState(
    () => new CollectionView<Project>([], { pageSize: 15, trackChanges: true }),
  );
  const [tick, bump] = useState(0),
    [query, setQuery] = useState(""),
    [department, setDepartment] = useState("全部部门");
  const [grouped, setGrouped] = useState(false),
    [pageSize, setPageSize] = useState(15);
  const [selected, setSelected] = useState<Project | null>(null),
    [draft, setDraft] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [fail, setFail] = useState(false),
    [request, reload] = useState(0);
  const [delayMs, setDelayMs] = useState(600);
  const [saving, setSaving] = useState(false);
  const [apiResponse, setApiResponse] = useState<ProjectResponse | null>(null);
  const grid = useRef<GridControl | null>(null);
  const departmentMap = useMemo(
      () => new DataMap(departmentOptions, "key", "value"),
      [],
    ),
    statusMap = useMemo(() => new DataMap(statusOptions, "key", "value"), []);
  useEffect(() => {
    const change = () => {
      bump((n) => n + 1);
      setSelected(view.currentItem ?? null);
    };
    view.collectionChanged.addHandler(change);
    view.currentChanged.addHandler(change);
    view.getError = (item, property) =>
      property ? validate(item, property) : null;
    return () => {
      view.collectionChanged.removeHandler(change);
      view.currentChanged.removeHandler(change);
    };
  }, [view]);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    const timer = setTimeout(() => {
      loadProjects(controller.signal, fail, delayMs, query, department)
        .then((response) => {
          if (controller.signal.aborted) return;
          const rows = response.data;
          setApiResponse(structuredClone(response));
          view.sourceCollection = rows;
          view.clearChanges();
          view.moveToFirstPage();
          setDraft(null);
        })
        .catch((e) => {
          if (e.name !== "AbortError") setError(e.message);
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, 300);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [request, fail, view, delayMs, query, department]);
  useEffect(() => {
    view.pageSize = pageSize;
  }, [pageSize, view]);
  const rows = view.sourceCollection as Project[];
  const summary = useMemo(() => summarize(rows), [rows, tick]);
  const pending =
    view.itemsAdded.length + view.itemsEdited.length + view.itemsRemoved.length;
  async function save() {
    if (saving || loading || error) return;
    if (tab === "grid" && grid.current && !grid.current.finishEditing()) {
      setMessage("请先修正当前单元格的错误");
      return;
    }
    const invalid = validateAll(rows);
    if (invalid.length) {
      setMessage(`无法保存：项目 #${invalid[0].id} ${invalid[0].error}`);
      return;
    }
    const snapshot = serialize(rows);
    setSaving(true);
    try {
      await saveProjects(
        JSON.parse(snapshot),
        view.itemsRemoved.map((row) => row.id!),
      );
      if (serialize(view.sourceCollection as Project[]) === snapshot)
        view.clearChanges();
      bump((n) => n + 1);
      setMessage(
        "已通过 PUT /api/projects 保存到模拟服务内存；重启服务后恢复初始数据。",
      );
    } catch (error) {
      setMessage(
        `保存失败：${error instanceof Error ? error.message : String(error)}；未清除待保存变更。`,
      );
    } finally {
      setSaving(false);
    }
  }
  async function reset() {
    if (saving) return;
    setSaving(true);
    try {
      await resetProjects();
      setDraft(null);
      setFail(false);
      reload((n) => n + 1);
      setMessage("已通过 DELETE /api/projects 恢复模拟服务的初始数据。");
    } catch (error) {
      setMessage(
        `恢复失败：${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      setSaving(false);
    }
  }
  function add() {
    const item = {
      ...makeProjects(1)[0],
      id: Math.max(Date.now(), ...rows.map((r) => r.id)) + 1,
      name: "新项目",
      progress: 0,
      status: "计划中",
    };
    view.addNew(item, true);
    view.moveToLastPage();
    view.moveCurrentTo(item);
    setMessage("已新增项目，可编辑后保存");
  }
  function remove() {
    if (selected && confirm(`删除项目「${selected.name}」？`)) {
      view.remove(selected);
      setDraft(null);
    }
  }
  async function exportExcel() {
    try {
      const [{ FlexGridXlsxConverter }] = await Promise.all([
        import("@mescius/wijmo.grid.xlsx"),
      ]);
      if (grid.current) {
        await new Promise<void>((resolve, reject) =>
          FlexGridXlsxConverter.saveAsync(
            grid.current!,
            { includeColumnHeaders: true },
            "projects.xlsx",
            () => resolve(),
            reject,
          ),
        );
        setMessage("Excel 已导出：当前网格视图，受筛选和分页影响。");
      }
    } catch (e) {
      setMessage(`导出失败：${String(e)}`);
    }
  }
  async function exportPdf() {
    try {
      const { FlexGridPdfConverter } = await import("@mescius/wijmo.grid.pdf");
      if (grid.current)
        FlexGridPdfConverter.export(grid.current, "projects.pdf");
      setMessage(
        "PDF 已导出。默认字体不含中文，中文正式报表需嵌入已授权字体，见讲师手册。",
      );
    } catch (e) {
      setMessage(`导出失败：${String(e)}`);
    }
  }
  function commitForm() {
    if (!draft || !selected) return;
    const invalid = validateAll([draft]);
    if (invalid.length) {
      setMessage(invalid[0].error!);
      return;
    }
    view.editItem(selected);
    Object.assign(selected, draft);
    view.commitEdit();
    setMessage("已提交表单编辑；点击“保存变更”持久化");
  }

  return {
    view,
    tick,
    rows,
    summary,
    pending,
    query,
    setQuery,
    department,
    setDepartment,
    grouped,
    setGrouped,
    pageSize,
    setPageSize,
    selected,
    setSelected,
    draft,
    setDraft,
    loading,
    error,
    message,
    fail,
    setFail,
    delayMs,
    setDelayMs,
    apiResponse,
    saving,
    reset,
    reload,
    setMessage,
    grid,
    departmentMap,
    statusMap,
    save,
    add,
    remove,
    exportExcel,
    exportPdf,
    commitForm,
  };
}
export type ProjectModel = ReturnType<typeof useProjectModel>;
