"use strict";
(() => {
  const $ = id => document.getElementById(id);
  const fmt = n => Number(n || 0).toLocaleString("en-US", {maximumFractionDigits: 1});
  const state = {guides: null, caseId: "b300", guideKey: null, revision: "7"};

  function renderGuide(key = state.guideKey) {
    state.guideKey = key;
    const guide = state.guides?.[state.caseId];
    if (!guide) return;
    const box = (r, kind) => `<div class="annotation-region ${key === kind ? "is-highlighted" : ""}" style="left:${r.left}%;top:${r.top}%;width:${r.width}%;height:${r.height}%"></div>`;
    const badge = (label, x, y, kind) => `<span class="annotation-badge ${key === kind ? "is-highlighted" : ""}" style="left:${x}%;top:${y}%">${label}</span>`;
    let html = guide.panels.map((r, i) => box(r, i === 0 ? "timing" : "memory") + badge(["A", "C1", "C2"][i], .4, r.top + (i === 0 ? 0 : r.height / 2), i === 0 ? "timing" : "memory")).join("");
    if (guide.overlap) {
      const r = guide.overlap.region;
      html += box(r, "overlap") + badge("B", r.left + r.width / 2, r.top, "overlap");
    }
    $("chart-annotations").innerHTML = html;
    document.querySelectorAll("[data-guide]").forEach(button => button.setAttribute("aria-pressed", String(button.dataset.guide === key)));
    $("chart-guide-detail").hidden = !key;
    if (key === "timing") $("chart-guide-detail").textContent = "A：从左向右读时间，同一泳道内看事件顺序，不同泳道间看启动与完成关系。TMA_IN 为加载、TMA_OUT 为写回，TC 为矩阵计算。";
    else if (key === "overlap" && guide.overlap) {
      const o = guide.overlap;
      $("chart-guide-detail").textContent = `B：${fmt(o.start)}–${fmt(o.end)} clk（${fmt(o.end - o.start)} clk）内，${o.events.map(e => `${e.cp} 的 ${e.name}`).join("、")}同时处于吞吐工作区间。`;
    } else if (key === "memory") $("chart-guide-detail").textContent = "C1 为 SMEM，C2 为 TMEM。每行对应一个物理槽，横向区间表示 Tile 从分配、生产、就绪等待到消费保留与释放的生命周期。";
    else $("chart-guide-detail").textContent = "";
  }

  async function init() {
    try {
      const [info, guides] = await Promise.all([fetch("data/render-info.json").then(r => r.json()), fetch("data/chart-guides.json").then(r => r.json())]);
      state.revision = info.revision || state.revision;
      state.guides = guides;
      $("case-image").src = `assets/b300-gantt.svg?v=${encodeURIComponent(state.revision)}`;
      $("full-chart-link").href = $("case-image").src;
      renderGuide();
      document.querySelectorAll("[data-case]").forEach(button => button.onclick = () => {
        const id = button.dataset.case;
        const cases = {b300: ["B300 理论模型 · BF16 · Q=512 / KV=512 / D=128 · 双 SM 聚合", "B300 FA4 CTA Pair"]};
        const url = `assets/${id}-gantt.svg?v=${encodeURIComponent(state.revision)}`;
        $("case-image").src = url;
        $("case-image").alt = `${cases[id][1]} 执行时间线和存储生命周期`;
        $("case-caption").textContent = cases[id][0];
        $("full-chart-link").href = url;
        document.querySelectorAll("[data-case]").forEach(b => { b.classList.toggle("selected", b === button); b.setAttribute("aria-pressed", String(b === button)); });
        state.caseId = id;
        renderGuide();
      });
      document.querySelectorAll("[data-guide]").forEach(button => button.onclick = () => renderGuide(state.guideKey === button.dataset.guide ? null : button.dataset.guide));
      const dialog = $("image-dialog");
      $("editor-image-button").onclick = () => dialog.showModal();
      dialog.addEventListener("click", event => { if (event.target === dialog) dialog.close(); });
    } catch (error) {
      const detail = $("chart-guide-detail");
      if (detail) { detail.hidden = false; detail.textContent = `读图标记加载失败：${error.message}`; }
    }
  }
  init();
})();
