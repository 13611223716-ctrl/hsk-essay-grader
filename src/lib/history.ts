// 练习记录本地存储（localStorage）
// 数据仅保存在学生本机浏览器中，不上传服务器

export interface ErrorItem {
  type: string;
  category: string;
  content: string;
  correction: string;
}

export interface GradeResult {
  score: number;
  scoreLevel: string;
  evaluation: string;
  errorAnalysis: ErrorItem[];
}

export interface GradeRecord extends GradeResult {
  id: string;
  title: string;
  content: string;
  createdAt: number;
}

const STORAGE_KEY = "hsk_essay_history";
const MAX_RECORDS = 100; // 上限保护，超出自动删除最旧记录

export function loadHistory(): GradeRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function writeHistory(list: GradeRecord[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // 存储空间满或被禁用时静默失败，不影响评分主流程
  }
}

export function saveRecord(
  record: Omit<GradeRecord, "id" | "createdAt">
): GradeRecord[] {
  const list = loadHistory();
  const item: GradeRecord = {
    ...record,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: Date.now(),
  };
  const next = [item, ...list].slice(0, MAX_RECORDS);
  writeHistory(next);
  return next;
}

export function deleteRecord(id: string): GradeRecord[] {
  const next = loadHistory().filter((r) => r.id !== id);
  writeHistory(next);
  return next;
}

export function clearHistory() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // 忽略
  }
}

// 导出 JSON 备份文件（localStorage 可能随浏览器数据清理而丢失）
export function exportHistory() {
  const list = loadHistory();
  if (list.length === 0) return;
  const blob = new Blob([JSON.stringify(list, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const date = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `hsk练习记录_${date}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
