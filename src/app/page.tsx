"use client";

import { useEffect, useState } from "react";
import {
  FileText,
  Star,
  AlertCircle,
  CheckCircle,
  Loader2,
  History,
  Trash2,
  ChevronDown,
  ChevronUp,
  Download,
} from "lucide-react";
import {
  loadHistory,
  saveRecord,
  deleteRecord,
  clearHistory,
  exportHistory,
  type GradeResult,
  type GradeRecord,
} from "../lib/history";

const levelColors: Record<string, string> = {
  优秀: "bg-green-100 text-green-800 border-green-300",
  良好: "bg-blue-100 text-blue-800 border-blue-300",
  合格: "bg-yellow-100 text-yellow-800 border-yellow-300",
  不合格: "bg-red-100 text-red-800 border-red-300",
};

const errorTypeColors: Record<string, string> = {
  字错误: "bg-orange-50 border-orange-200",
  词错误: "bg-purple-50 border-purple-200",
  句错误: "bg-pink-50 border-pink-200",
  标点错误: "bg-cyan-50 border-cyan-200",
};

// 评分详情展示（当前结果与历史记录共用）
function ResultView({ result }: { result: GradeResult }) {
  return (
    <div className="space-y-5">
      {/* 分数与等级 */}
      <div className="text-center py-4 bg-slate-50 rounded-xl">
        <div className="text-5xl font-bold text-slate-900">
          {result.score}
          <span className="text-2xl text-slate-400 font-normal"> 分</span>
        </div>
        <span
          className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-medium border ${
            levelColors[result.scoreLevel] ||
            "bg-slate-100 text-slate-800 border-slate-300"
          }`}
        >
          {result.scoreLevel}
        </span>
      </div>

      {/* 整体评价 */}
      <div>
        <h3 className="text-sm font-semibold text-slate-700 mb-2">整体评价</h3>
        <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg">
          {result.evaluation}
        </p>
      </div>

      {/* 错误分析 */}
      {result.errorAnalysis && result.errorAnalysis.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-2">
            错误分析（{result.errorAnalysis.length}）
          </h3>
          <div className="space-y-2">
            {result.errorAnalysis.map((err, i) => (
              <div
                key={i}
                className={`rounded-lg border p-3 ${
                  errorTypeColors[err.type] || "bg-slate-50 border-slate-200"
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-xs font-medium px-2 py-0.5 rounded bg-white/70 text-slate-600">
                    {err.type}
                  </span>
                  <span className="text-xs text-slate-500">{err.category}</span>
                </div>
                <div className="text-sm space-y-1">
                  <div className="flex gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                    <span className="text-slate-700">{err.content}</span>
                  </div>
                  <div className="flex gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" />
                    <span className="text-green-700">{err.correction}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const [essayTitle, setEssayTitle] = useState("");
  const [essayContent, setEssayContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GradeResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<GradeRecord[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // 页面加载时读取本地练习记录
  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  const handleGrade = async () => {
    if (!essayContent.trim()) {
      setError("请输入作文内容");
      return;
    }
    setError(null);
    setResult(null);
    setLoading(true);

    try {
      const res = await fetch("/api/grade-essay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ essayTitle, essayContent }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "评分失败，请重试");
      } else {
        setResult(data);
        // 评分成功，自动保存练习记录到本机
        setHistory(
          saveRecord({
            title: essayTitle,
            content: essayContent,
            score: data.score,
            scoreLevel: data.scoreLevel,
            evaluation: data.evaluation,
            errorAnalysis: data.errorAnalysis,
          })
        );
      }
    } catch (e) {
      setError("网络错误，请重试");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: string) => {
    if (!window.confirm("确定删除这条记录吗？")) return;
    setHistory(deleteRecord(id));
    if (expandedId === id) setExpandedId(null);
  };

  const handleClear = () => {
    if (
      !window.confirm(
        `确定清空全部 ${history.length} 条练习记录吗？此操作不可恢复，建议先导出备份。`
      )
    )
      return;
    clearHistory();
    setHistory([]);
    setExpandedId(null);
  };

  const handleExport = () => {
    if (history.length === 0) {
      window.alert("暂无记录可导出");
      return;
    }
    exportHistory();
  };

  const fmtTime = (ts: number) =>
    new Date(ts).toLocaleString("zh-CN", { hour12: false });

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* 头部 */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <FileText className="w-8 h-8 text-indigo-600" />
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                外国人中文作文评分系统
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">
                请输入作文内容，系统将根据HSK（高等）评分标准进行评分
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* 作文输入区 */}
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">
              作文输入
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  作文题目 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={essayTitle}
                  onChange={(e) => setEssayTitle(e.target.value)}
                  placeholder="请输入作文题目"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  作文内容 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <textarea
                    value={essayContent}
                    onChange={(e) => setEssayContent(e.target.value)}
                    placeholder="请输入作文内容（建议400-600字）..."
                    rows={16}
                    maxLength={600}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm resize-none"
                  />
                  <span className="absolute bottom-2 right-3 text-xs text-slate-400">
                    {essayContent.length} / 600字（建议400-600字）
                  </span>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              <button
                onClick={handleGrade}
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    评分中...
                  </>
                ) : (
                  "开始评分"
                )}
              </button>
            </div>
          </section>

          {/* 评分结果区 */}
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">
              评分结果
            </h2>

            {!result && !loading && (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <Star className="w-12 h-12 mb-3" />
                <p className="text-sm">
                  请输入作文内容并点击"开始评分"
                </p>
                <p className="text-xs mt-1 text-slate-300">
                  基于HSK（高等）评分标准的自动化评分结果
                </p>
              </div>
            )}

            {result && <ResultView result={result} />}
          </section>
        </div>

        {/* 练习记录 */}
        <section className="mt-8 bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-indigo-600" />
              <h2 className="text-lg font-semibold text-slate-800">
                练习记录
                {history.length > 0 && (
                  <span className="ml-2 text-sm font-normal text-slate-400">
                    {history.length} 条
                  </span>
                )}
              </h2>
            </div>
            {history.length > 0 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExport}
                  className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Download className="w-4 h-4" />
                  导出备份
                </button>
                <button
                  onClick={handleClear}
                  className="flex items-center gap-1.5 text-sm text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  清空全部
                </button>
              </div>
            )}
          </div>

          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-slate-400">
              <History className="w-10 h-10 mb-2" />
              <p className="text-sm">暂无练习记录，评分后将自动保存到这里</p>
            </div>
          ) : (
            <div className="space-y-2">
              {history.map((r) => {
                const expanded = expandedId === r.id;
                return (
                  <div
                    key={r.id}
                    className="border border-slate-200 rounded-xl overflow-hidden"
                  >
                    <button
                      onClick={() => setExpandedId(expanded ? null : r.id)}
                      className="w-full flex items-center justify-between gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <span
                          className={`shrink-0 text-xs font-semibold px-2 py-1 rounded-md border ${
                            levelColors[r.scoreLevel] ||
                            "bg-slate-100 text-slate-800 border-slate-300"
                          }`}
                        >
                          {r.score} 分 · {r.scoreLevel}
                        </span>
                        <span className="text-sm text-slate-700 truncate">
                          {r.title || "无题目"}
                        </span>
                        <span className="hidden sm:inline text-xs text-slate-400 shrink-0">
                          {fmtTime(r.createdAt)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-slate-400">
                          {r.errorAnalysis?.length || 0} 处错误
                        </span>
                        {expanded ? (
                          <ChevronUp className="w-4 h-4 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                    </button>

                    {expanded && (
                      <div className="border-t border-slate-100 bg-slate-50/60 px-4 py-4 space-y-4">
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <h4 className="text-xs font-semibold text-slate-500">
                              作文原文（{r.title || "无题目"}）
                            </h4>
                            <span className="text-xs text-slate-400">
                              {fmtTime(r.createdAt)}
                            </span>
                          </div>
                          <div className="text-sm text-slate-700 leading-relaxed bg-white border border-slate-200 rounded-lg p-3 max-h-48 overflow-y-auto whitespace-pre-wrap">
                            {r.content}
                          </div>
                        </div>
                        <ResultView result={r} />
                        <div className="text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(r.id);
                            }}
                            className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 ml-auto"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            删除此记录
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <p className="text-xs text-slate-400 mt-4 leading-relaxed">
            记录仅保存在本机浏览器中（最多 100 条，超出自动删除最旧记录），不会上传服务器；清除浏览器数据会导致记录丢失，重要记录请使用"导出备份"。
          </p>
        </section>

        {/* 评分标准说明 */}
        <div className="mt-8 bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-base font-semibold text-slate-800 mb-3">
            HSK（高等）作文评分等级参考
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
            <div className="p-3 rounded-lg bg-green-50 border border-green-200">
              <div className="font-semibold text-green-800">优秀 90-100</div>
              <p className="text-xs text-green-700 mt-1">
                内容充实，语法正确，语言通顺，仅有极个别错误
              </p>
            </div>
            <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
              <div className="font-semibold text-blue-800">良好 80-89</div>
              <p className="text-xs text-blue-700 mt-1">
                内容较充实，语言尚通顺，有少量错误但不影响交际
              </p>
            </div>
            <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-200">
              <div className="font-semibold text-yellow-800">合格 60-79</div>
              <p className="text-xs text-yellow-700 mt-1">
                内容较完整，错误较多但基本上不影响交际
              </p>
            </div>
            <div className="p-3 rounded-lg bg-red-50 border border-red-200">
              <div className="font-semibold text-red-800">不合格 0-59</div>
              <p className="text-xs text-red-700 mt-1">
                错误很多，严重影响文章通顺和思想表达
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
