// dsh-xhs-publisher —— 客户端半（浏览器 bundle）。
//
// 小红书（RED）发布助手：纯客户端插件，无 Host 业务。
// 功能：
//   1. 标题/正文/标签编辑器 + 实时字数校验（标题 ≤20 / 正文 ≤1000）
//   2. Canvas 封面生成器（两套模板，1242×1656 一键导出 PNG）
//   3. 发布检查清单 + 一键复制 + 打开小红书创作平台
// 文案本身由 DSH 现有 agent（即当前会话的模型）在对话中撰写，
// 本插件负责"流程工具链"部分，无需任何单独配置的 LLM。

window.__ModuleLoader__.load({
  id: "dsh-xhs-publisher",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
    const React = require("react");
    const { useCallback, useEffect, useRef, useState } = React;

    const NS = "settings.xhsPublisher";
    const inject = ["slots", "locale"];

    // ---------- 文案（中 / 英） ----------
    const zh = {
      nav: "小红书发布助手",
      title: "小红书发布助手",
      intro: "把 AI 写好的稿子粘进来：校验字数、生成封面、一键复制，直接粘贴到小红书发布。",
      tabPost: "📝 发布内容",
      tabCover: "🎨 封面",
      fieldTitle: "笔记标题",
      fieldBody: "笔记正文",
      fieldTags: "标签（空格或顿号分隔）",
      hintTitle: "标题最多 20 字",
      hintBody: "正文最多 1000 字",
      hintTags: "建议 5-8 个标签",
      chars: "{n}/{max} 字",
      overLimit: "超限！{n}/{max} 字",
      tagCount: "{n} 个标签",
      tagTooFew: "标签建议 5-8 个（当前 {n}）",
      checklist: "发布检查",
      checkTitle: "标题 ≤20 字",
      checkBody: "正文 ≤1000 字",
      checkTags: "标签 ≥5 个",
      checkCover: "封面已导出 PNG",
      pending: "待完成",
      done: "✔ 通过",
      copy: "复制标题+正文+标签",
      copied: "已复制到剪贴板 ✅",
      openCreator: "打开小红书创作平台",
      exportCover: "导出封面 PNG",
      exported: "封面已导出 ✅",
      templateLabel: "模板",
      darkTemplate: "深色网格",
      lightTemplate: "浅色简约",
      coverTitle: "封面主标题",
      coverAccent: "高亮词（渐变金色）",
      coverSubtitle: "封面副标题",
      coverBadge: "顶部徽章文字",
      coverChips: "底部卖点（· 分隔）",
      statName: "窗口名",
      statPct: "百分比",
      previewHint: "预览（实际导出为 1242×1656）",
      reset: "恢复默认",
    };
    const en = {
      nav: "XHS Publisher",
      title: "Xiaohongshu publishing assistant",
      intro: "Paste your AI-written draft here: validate lengths, generate a cover, copy everything and paste it into Xiaohongshu.",
      tabPost: "📝 Post",
      tabCover: "🎨 Cover",
      fieldTitle: "Note title",
      fieldBody: "Note body",
      fieldTags: "Tags (space or 、separated)",
      hintTitle: "Max 20 characters",
      hintBody: "Max 1000 characters",
      hintTags: "Aim for 5-8 tags",
      chars: "{n}/{max} chars",
      overLimit: "Over limit! {n}/{max}",
      tagCount: "{n} tags",
      tagTooFew: "Use 5-8 tags (now {n})",
      checklist: "Publish checklist",
      checkTitle: "Title ≤20",
      checkBody: "Body ≤1000",
      checkTags: "Tags ≥5",
      checkCover: "Cover PNG exported",
      pending: "pending",
      done: "✔ ok",
      copy: "Copy title + body + tags",
      copied: "Copied to clipboard ✅",
      openCreator: "Open XHS creator platform",
      exportCover: "Export cover PNG",
      exported: "Cover exported ✅",
      templateLabel: "Template",
      darkTemplate: "Dark grid",
      lightTemplate: "Light minimal",
      coverTitle: "Cover title",
      coverAccent: "Highlight phrase (gold gradient)",
      coverSubtitle: "Cover subtitle",
      coverBadge: "Top badge text",
      coverChips: "Bottom chips (separate by ·)",
      statName: "Row name",
      statPct: "Percent",
      previewHint: "Preview (exports at 1242×1656)",
      reset: "Reset",
    };

    const TITLE_MAX = 20;
    const BODY_MAX = 1000;
    const COVER_W = 1242;
    const COVER_H = 1656;
    const FONT = '"PingFang SC","Microsoft YaHei",-apple-system,sans-serif';
    const BOLT_PATH = "M9.75 1 L3.25 9.5 H7 L6 15 L12.75 6.5 H8.9 Z";

    // ---------- 样式 ----------
    const styles = {
      wrap: { maxWidth: 980, display: "flex", flexDirection: "column", gap: 14, padding: "8px 0" },
      intro: { color: "var(--dsw-alias-label-tertiary)", fontSize: 13, lineHeight: 1.6, margin: 0 },
      grid2: { display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 14, alignItems: "start" },
      panel: { border: "1px solid var(--dsw-alias-border-l2)", background: "var(--dsw-alias-bg-layer-3)", borderRadius: 10, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 12 },
      panelTitle: { fontSize: 14, fontWeight: 600, margin: 0 },
      field: { display: "flex", flexDirection: "column", gap: 5 },
      label: { fontSize: 12, fontWeight: 600, color: "var(--dsw-alias-label-secondary)" },
      input: { border: "1px solid var(--dsw-alias-border-l2)", background: "var(--dsw-alias-bg-layer-1)", color: "var(--dsw-alias-label-primary)", borderRadius: 8, padding: "8px 10px", font: "inherit", fontSize: 13, outline: "none" },
      textarea: { border: "1px solid var(--dsw-alias-border-l2)", background: "var(--dsw-alias-bg-layer-1)", color: "var(--dsw-alias-label-primary)", borderRadius: 8, padding: "8px 10px", font: "inherit", fontSize: 13, minHeight: 110, resize: "vertical", outline: "none", lineHeight: 1.6 },
      counter: { fontSize: 12, color: "var(--dsw-alias-label-tertiary)" },
      counterBad: { fontSize: 12, color: "var(--dsw-alias-state-error-primary)", fontWeight: 600 },
      row: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 },
      button: { border: "1px solid var(--dsw-alias-border-l2)", color: "var(--dsw-alias-label-primary)", font: "inherit", fontSize: 13, cursor: "pointer", background: "transparent", borderRadius: 6, padding: "6px 12px" },
      buttonPrimary: { border: "1px solid var(--dsw-alias-state-business-primary)", color: "var(--dsw-alias-state-business-primary)", font: "inherit", fontSize: 13, cursor: "pointer", background: "transparent", borderRadius: 6, padding: "6px 12px", fontWeight: 600 },
      chip: { display: "inline-block", fontSize: 12, borderRadius: 999, padding: "3px 10px", border: "1px solid var(--dsw-alias-border-l2)", color: "var(--dsw-alias-label-secondary)" },
      chipOk: { display: "inline-block", fontSize: 12, borderRadius: 999, padding: "3px 10px", border: "1px solid rgba(46,200,140,.4)", color: "#2ec88c" },
      coverBox: { display: "flex", flexDirection: "column", gap: 10, alignItems: "center" },
      coverCanvas: { width: 236, height: 315, borderRadius: 8, border: "1px solid var(--dsw-alias-border-l2)", background: "#0b0e14" },
      hint: { fontSize: 12, color: "var(--dsw-alias-label-tertiary)", margin: 0 },
      statGrid: { display: "grid", gridTemplateColumns: "1fr 1fr 60px", gap: 6, alignItems: "center" },
      ok: { color: "#2ec88c", fontSize: 13 },
    };

    // ---------- 字符计数（按码点数计） ----------
    function count(s) {
      return [...(s || "")].length;
    }
    function fmtChars(s, max, t) {
      const n = count(s);
      return n > max ? t("overLimit").replace("{n}", n).replace("{max}", max) : t("chars").replace("{n}", n).replace("{max}", max);
    }

    // ---------- Canvas 封面 ----------
    function rr(ctx, x, y, w, h, r) {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    }
    function glow(ctx, cx, cy, r, color) {
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      g.addColorStop(0, color);
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
    }
    // 渐变高亮文字：baseText 中 accent 子串用金色渐变，其余白色
    function paintTitle(ctx, text, accent, x, y, size, s) {
      ctx.font = `800 ${size}px ${FONT}`;
      const full = ctx.measureText(text).width;
      const idx = text.indexOf(accent);
      const pre = ctx.measureText(text.slice(0, idx)).width;
      const accW = ctx.measureText(accent).width;
      const g2 = ctx.createLinearGradient(x, 0, x + full, 0);
      const stops = [
        [0, "#ffffff"],
        [pre / full, "#ffffff"],
        [pre / full, "#ffd76a"],
        [(pre + accW) / full, "#ff9d2e"],
        [(pre + accW) / full, "#ffffff"],
        [1, "#ffffff"],
      ];
      for (const [p, c] of stops) g2.addColorStop(Math.max(0, Math.min(1, p)), c);
      ctx.fillStyle = g2;
      ctx.fillText(text, x, y);
    }
    // 自动缩字号保证单行不超 maxWidth
    function fitFont(ctx, text, size, maxWidth) {
      let s = size;
      ctx.font = `800 ${s}px ${FONT}`;
      while (s > 20 && ctx.measureText(text).width > maxWidth) {
        s -= 2;
        ctx.font = `800 ${s}px ${FONT}`;
      }
      return s;
    }

    // 模板 A：深色网格
    function drawDark(ctx, W, H, o) {
      const s = W / 1242;
      const t = (v) => Math.round(v * s);
      const bg = ctx.createLinearGradient(0, 0, W, H);
      bg.addColorStop(0, "#10141d");
      bg.addColorStop(0.55, "#0b0e14");
      bg.addColorStop(1, "#0d0f16");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);
      glow(ctx, W * 0.78, -H * 0.08, t(900), "rgba(96,140,255,.16)");
      glow(ctx, -W * 0.1, H * 1.05, t(700), "rgba(255,170,60,.10)");
      ctx.strokeStyle = "rgba(255,255,255,0.028)";
      ctx.lineWidth = 1;
      for (let x = t(64); x < W; x += t(64)) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      for (let y = t(64); y < H; y += t(64)) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

      ctx.textBaseline = "middle";
      // 徽章
      const badge = o.badge || "开源插件 · MIT";
      ctx.font = `600 ${t(20)}px ${FONT}`;
      const bw = ctx.measureText(badge).width;
      ctx.fillStyle = "rgba(255,215,106,.08)";
      rr(ctx, t(56), t(54), bw + t(48), t(44), t(22)); ctx.fill();
      ctx.strokeStyle = "rgba(255,215,106,.35)"; ctx.lineWidth = 1; ctx.stroke();
      ctx.fillStyle = "#ffd76a";
      ctx.fillText(badge, t(80), t(76));

      // 标题（单行，居中）
      const title = o.title || "";
      const acc = o.accent && o.title && o.title.includes(o.accent) ? o.accent : title;
      ctx.textAlign = "center";
      let ts = t(60);
      ctx.font = `800 ${ts}px ${FONT}`;
      while (ts > t(24) && ctx.measureText(title).width > W - t(112)) { ts -= 2; ctx.font = `800 ${ts}px ${FONT}`; }
      paintTitle(ctx, title, acc, W / 2, t(232), ts, s);
      ctx.textAlign = "left";

      // 副标题
      ctx.textAlign = "center";
      ctx.font = `500 ${t(24)}px ${FONT}`;
      ctx.fillStyle = "#9aa4b8";
      ctx.fillText(o.subtitle || "", W / 2, t(292));
      ctx.textAlign = "left";

      // 交互 mock：气泡 + 工具行（居中）
      const mockX = W / 2;
      const tipText = "5h 0% · 周 12% · 月 6%";
      ctx.textAlign = "center";
      ctx.font = `600 ${t(24)}px ${FONT}`;
      const tw = ctx.measureText(tipText).width;
      ctx.fillStyle = "#1b2230";
      rr(ctx, mockX - tw / 2 - t(24), t(360), tw + t(48), t(56), t(12)); ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,.14)"; ctx.stroke();
      ctx.fillStyle = "#e8ecf4";
      ctx.fillText(tipText, mockX, t(388));
      ctx.fillStyle = "#1b2230";
      ctx.beginPath();
      ctx.moveTo(mockX - t(10), t(416)); ctx.lineTo(mockX + t(10), t(416)); ctx.lineTo(mockX, t(436)); ctx.closePath(); ctx.fill();
      // 工具行
      const rowW = t(400), rowH = t(54), rowX = mockX - rowW / 2, rowY = t(452);
      ctx.fillStyle = "rgba(255,255,255,.05)";
      rr(ctx, rowX, rowY, rowW, rowH, t(15)); ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,.11)"; ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,.10)";
      for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(rowX + t(24) + i * t(28), rowY + rowH / 2, t(8), 0, Math.PI * 2); ctx.fill(); }
      ctx.textAlign = "left";
      // 模型名 pill（闪电按钮左侧，留 10px 间隙）
      const pill = "opencode-go";
      ctx.font = `500 ${t(16)}px ${FONT}`;
      const pw = ctx.measureText(pill).width;
      const bx = rowX + rowW - t(14) - t(18); // 闪电按钮圆心
      const pillRight = bx - t(18) - t(10);
      ctx.fillStyle = "rgba(255,255,255,.08)";
      rr(ctx, pillRight - pw - t(28), rowY + rowH / 2 - t(15), pw + t(28), t(30), t(15)); ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,.14)"; ctx.stroke();
      ctx.fillStyle = "#c7d0e0";
      ctx.fillText(pill, pillRight - pw - t(14), rowY + rowH / 2);
      // 闪电按钮
      const by = rowY + rowH / 2;
      ctx.fillStyle = "rgba(255,215,106,.13)";
      rr(ctx, bx - t(18), by - t(18), t(36), t(36), t(9)); ctx.fill();
      ctx.strokeStyle = "rgba(255,215,106,.55)"; ctx.lineWidth = t(1.5); ctx.stroke();
      ctx.fillStyle = "#ffd76a";
      ctx.save();
      ctx.translate(bx - t(11), by - t(14)); ctx.scale(t(0.72), t(0.72));
      const bp = new Path2D(BOLT_PATH);
      ctx.fill(bp);
      ctx.restore();
      ctx.textAlign = "center";

      // 三张用量卡
      const cardY = t(560), cardH = t(74), gapY = t(18);
      const rows = o.stats || [];
      rows.forEach((r, i) => {
        const y = cardY + i * (cardH + gapY);
        ctx.fillStyle = "rgba(255,255,255,.045)";
        rr(ctx, t(56), y, W - t(112), cardH, t(16)); ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,.09)"; ctx.stroke();
        ctx.textAlign = "left";
        ctx.font = `600 ${t(22)}px ${FONT}`;
        ctx.fillStyle = "#dfe5f0";
        ctx.fillText(r.name, t(80), y + cardH / 2);
        const bx2 = t(230), bw2 = W - t(230) - t(150);
        ctx.fillStyle = "rgba(255,255,255,.09)";
        rr(ctx, bx2, y + cardH / 2 - t(7), bw2, t(14), t(7)); ctx.fill();
        const pct = Math.max(0, Math.min(100, Number(r.pct) || 0));
        const colors = ["#4f7dff", "#ff9d2e", "#2db98f"];
        ctx.fillStyle = colors[i % colors.length] || "#4f7dff";
        if (pct > 0) { rr(ctx, bx2, y + cardH / 2 - t(7), Math.max(t(6), bw2 * pct / 100), t(14), t(7)); ctx.fill(); }
        ctx.textAlign = "right";
        ctx.font = `700 ${t(24)}px ${FONT}`;
        ctx.fillStyle = "#e8ecf4";
        ctx.fillText(pct + "%", W - t(80), y + cardH / 2);
      });

      // 底部卖点 chips
      const chips = (o.chips || "").split("·").map((c) => c.trim()).filter(Boolean);
      ctx.font = `600 ${t(21)}px ${FONT}`;
      const cw = chips.map((c) => ctx.measureText(c).width);
      const total = cw.reduce((a, b) => a + b, 0) + t(44) * chips.length;
      let cx = W / 2 - total / 2;
      const cy = H - t(96);
      chips.forEach((c, i) => {
        ctx.fillStyle = "rgba(255,255,255,.05)";
        rr(ctx, cx, cy, cw[i] + t(44), t(46), t(23)); ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,.12)"; ctx.stroke();
        ctx.textAlign = "left";
        ctx.fillStyle = "#d7deea";
        ctx.fillText(c, cx + t(22), cy + t(23));
        cx += cw[i] + t(44) + t(18);
      });
      ctx.textAlign = "left";
    }

    // 模板 B：浅色简约
    function drawLight(ctx, W, H, o) {
      const s = W / 1242;
      const t = (v) => Math.round(v * s);
      ctx.fillStyle = "#f5f6f9";
      ctx.fillRect(0, 0, W, H);
      glow(ctx, W * 0.8, -H * 0.08, t(800), "rgba(47,107,255,.10)");
      glow(ctx, -W * 0.1, H * 1.05, t(600), "rgba(255,157,46,.08)");

      ctx.textBaseline = "middle";
      const badge = o.badge || "开源插件 · MIT";
      ctx.font = `600 ${t(20)}px ${FONT}`;
      const bw = ctx.measureText(badge).width;
      ctx.fillStyle = "rgba(47,107,255,.08)";
      rr(ctx, t(56), t(54), bw + t(48), t(44), t(22)); ctx.fill();
      ctx.strokeStyle = "rgba(47,107,255,.35)"; ctx.stroke();
      ctx.fillStyle = "#2f6bff";
      ctx.fillText(badge, t(80), t(76));

      const title = o.title || "";
      ctx.textAlign = "center";
      let ts = t(60);
      ctx.font = `800 ${ts}px ${FONT}`;
      while (ts > t(24) && ctx.measureText(title).width > W - t(112)) { ts -= 2; ctx.font = `800 ${ts}px ${FONT}`; }
      ctx.fillStyle = "#1a2233";
      ctx.fillText(title, W / 2, t(232));
      ctx.font = `500 ${t(24)}px ${FONT}`;
      ctx.fillStyle = "#6b7689";
      ctx.fillText(o.subtitle || "", W / 2, t(292));
      ctx.textAlign = "left";

      const cardY = t(370), cardH = t(74), gapY = t(18);
      const rows = o.stats || [];
      rows.forEach((r, i) => {
        const y = cardY + i * (cardH + gapY);
        ctx.fillStyle = "#ffffff";
        rr(ctx, t(56), y, W - t(112), cardH, t(16)); ctx.fill();
        ctx.strokeStyle = "#e5e8ee"; ctx.stroke();
        ctx.textAlign = "left";
        ctx.font = `600 ${t(22)}px ${FONT}`;
        ctx.fillStyle = "#1a2233";
        ctx.fillText(r.name, t(80), y + cardH / 2);
        const bx2 = t(230), bw2 = W - t(230) - t(150);
        ctx.fillStyle = "#eef0f5";
        rr(ctx, bx2, y + cardH / 2 - t(7), bw2, t(14), t(7)); ctx.fill();
        const pct = Math.max(0, Math.min(100, Number(r.pct) || 0));
        const colors = ["#2f6bff", "#ff9d2e", "#0fb98f"];
        ctx.fillStyle = colors[i % colors.length] || "#2f6bff";
        if (pct > 0) { rr(ctx, bx2, y + cardH / 2 - t(7), Math.max(t(6), bw2 * pct / 100), t(14), t(7)); ctx.fill(); }
        ctx.textAlign = "right";
        ctx.font = `700 ${t(24)}px ${FONT}`;
        ctx.fillStyle = "#1a2233";
        ctx.fillText(pct + "%", W - t(80), y + cardH / 2);
      });

      const chips = (o.chips || "").split("·").map((c) => c.trim()).filter(Boolean);
      ctx.font = `600 ${t(21)}px ${FONT}`;
      const cw = chips.map((c) => ctx.measureText(c).width);
      const total = cw.reduce((a, b) => a + b, 0) + t(44) * chips.length;
      let cx = W / 2 - total / 2;
      const cy = H - t(96);
      chips.forEach((c, i) => {
        ctx.fillStyle = "#ffffff";
        rr(ctx, cx, cy, cw[i] + t(44), t(46), t(23)); ctx.fill();
        ctx.strokeStyle = "#e0e4ec"; ctx.stroke();
        ctx.textAlign = "left";
        ctx.fillStyle = "#3a4356";
        ctx.fillText(c, cx + t(22), cy + t(23));
        cx += cw[i] + t(44) + t(18);
      });
      ctx.textAlign = "left";
    }

    function drawCover(ctx, W, H, opts, template) {
      if (template === "light") drawLight(ctx, W, H, opts);
      else drawDark(ctx, W, H, opts);
    }
    function coverOptionsFrom(s) {
      return {
        badge: s.badge,
        title: s.title,
        accent: s.accent,
        subtitle: s.subtitle,
        stats: s.stats,
        chips: s.chips,
      };
    }

    // ---------- 组件 ----------
    function Field(props) {
      const { label, hint, children } = props;
      return React.createElement("div", { style: styles.field },
        React.createElement("span", { style: styles.label }, label),
        children,
        hint ? React.createElement("span", { style: styles.hint }, hint) : null
      );
    }

    // 封面预览 + 导出
    function CoverPanel(props) {
      const { options, template, onTemplate, onExport, exported, t } = props;
      const previewRef = useRef(null);

      useEffect(() => {
        const cv = previewRef.current;
        if (!cv) return;
        const W = 414, H = 552;
        cv.width = W; cv.height = H;
        const ctx = cv.getContext("2d");
        drawCover(ctx, W, H, options, template);
      }, [options, template]);

      return React.createElement("div", { style: styles.coverBox },
        React.createElement("canvas", { ref: previewRef, style: styles.coverCanvas }),
        React.createElement("span", { style: styles.hint }, t("previewHint")),
        React.createElement("div", { style: { display: "flex", gap: 8 } },
          React.createElement("button", { style: template === "dark" ? styles.buttonPrimary : styles.button, onClick: () => onTemplate("dark") }, t("darkTemplate")),
          React.createElement("button", { style: template === "light" ? styles.buttonPrimary : styles.button, onClick: () => onTemplate("light") }, t("lightTemplate"))
        ),
        React.createElement("button", { style: styles.buttonPrimary, onClick: onExport }, t("exportCover")),
        exported ? React.createElement("span", { style: styles.ok }, t("exported")) : null
      );
    }

    // 检查清单
    function Checklist(props) {
      const { title, body, tags, coverDone, t } = props;
      const items = [
        { label: t("checkTitle"), ok: count(title) <= TITLE_MAX },
        { label: t("checkBody"), ok: count(body) <= BODY_MAX },
        { label: t("checkTags"), ok: tags.split(/[\s、，,]+/).filter(Boolean).length >= 5 },
        { label: t("checkCover"), ok: !!coverDone },
      ];
      return React.createElement("div", { style: styles.panel },
        React.createElement("p", { style: styles.panelTitle }, t("checklist")),
        items.map((it, i) => React.createElement("span", { key: i, style: it.ok ? styles.chipOk : styles.chip }, it.ok ? t("done") : t("pending") + ": " + it.label))
      );
    }

    // 主面板
    function PublisherPanel(props) {
      const { t } = props;
      const defaultState = {
        badge: "开源插件 · MIT",
        title: "OpenCode Go 悬停就看用量",
        accent: "悬停就看用量",
        subtitle: "DeepSeek Harness · 模型选择器旁的闪电 ⚡",
        stats: [{ name: "5h 滚动", pct: 0 }, { name: "每周", pct: 12 }, { name: "每月", pct: 6 }],
        chips: "⚡悬停看额度 · 🖱️点击看明细 · 🔄打开即强刷",
        template: "dark",
        xhsTitle: "",
        xhsBody: "",
        xhsTags: "",
        coverDone: false,
        copied: false,
      };
      const [s, setS] = useState(defaultState);
      const set = (patch) => setS((prev) => ({ ...prev, ...patch }));
      const reset = () => setS(defaultState);

      const tagList = s.xhsTags.split(/[\s、，,]+/).filter(Boolean);
      const tagOk = tagList.length >= 5;
      const bodyCount = count(s.xhsBody);
      const titleCount = count(s.xhsTitle);

      const exportCover = useCallback(() => {
        const cv = document.createElement("canvas");
        cv.width = COVER_W; cv.height = COVER_H;
        const ctx = cv.getContext("2d");
        drawCover(ctx, COVER_W, COVER_H, coverOptionsFrom(s), s.template);
        cv.toBlob((blob) => {
          if (!blob) return;
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          const d = new Date();
          const pad = (n) => String(n).padStart(2, "0");
          a.download = "xhs-cover-" + d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + "-" + pad(d.getHours()) + pad(d.getMinutes()) + pad(d.getSeconds()) + ".png";
          a.href = url;
          a.click();
          setTimeout(() => URL.revokeObjectURL(url), 4000);
          set({ coverDone: true });
        }, "image/png");
      }, [s]);

      const copyAll = useCallback(() => {
        const text = [s.xhsTitle, s.xhsBody, s.xhsTags.trim() ? s.xhsTags.trim() : ""].filter(Boolean).join("\n\n");
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(() => set({ copied: true }), () => set({ copied: false }));
        } else {
          set({ copied: false });
        }
      }, [s]);

      const setStat = (i, key, value) =>
        set({ stats: s.stats.map((r, j) => (j === i ? { ...r, [key]: value } : r)) });

      return React.createElement("div", { style: styles.wrap },
        React.createElement("h2", { style: { fontSize: 16, fontWeight: 600, margin: 0 } }, t("title")),
        React.createElement("p", { style: styles.intro }, t("intro")),

        React.createElement("div", { style: styles.grid2 },

          // 左列：发布内容
          React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 12 } },
            React.createElement("div", { style: styles.panel },
              React.createElement(Field, { label: t("fieldTitle"), hint: t("hintTitle") },
                React.createElement("input", { style: styles.input, value: s.xhsTitle, maxLength: TITLE_MAX + 20, onChange: (e) => set({ xhsTitle: e.target.value }) }),
                React.createElement("span", { style: titleCount > TITLE_MAX ? styles.counterBad : styles.counter }, fmtChars(s.xhsTitle, TITLE_MAX, t))
              ),
              React.createElement(Field, { label: t("fieldBody"), hint: t("hintBody") },
                React.createElement("textarea", { style: styles.textarea, value: s.xhsBody, onChange: (e) => set({ xhsBody: e.target.value }) }),
                React.createElement("span", { style: bodyCount > BODY_MAX ? styles.counterBad : styles.counter }, fmtChars(s.xhsBody, BODY_MAX, t))
              ),
              React.createElement(Field, { label: t("fieldTags"), hint: t("hintTags") },
                React.createElement("input", { style: styles.input, value: s.xhsTags, onChange: (e) => set({ xhsTags: e.target.value }) }),
                React.createElement("span", { style: tagOk ? styles.counter : (tagList.length ? styles.counterBad : styles.counter) },
                  tagOk ? t("tagCount").replace("{n}", tagList.length) : t("tagTooFew").replace("{n}", tagList.length)
                )
              )
            ),
            React.createElement(Checklist, { title: s.xhsTitle, body: s.xhsBody, tags: s.xhsTags, coverDone: s.coverDone, t }),
            React.createElement("div", { style: { display: "flex", gap: 8, flexWrap: "wrap" } },
              React.createElement("button", { style: styles.buttonPrimary, onClick: copyAll }, t("copy")),
              React.createElement("button", { style: styles.button, onClick: () => window.open("https://creator.xiaohongshu.com/", "_blank", "noopener") }, t("openCreator")),
              React.createElement("button", { style: styles.button, onClick: reset }, t("reset"))
            ),
            s.copied ? React.createElement("span", { style: styles.ok }, t("copied")) : null
          ),

          // 右列：封面
          React.createElement("div", { style: styles.panel },
            React.createElement("p", { style: styles.panelTitle }, t("tabCover")),
            React.createElement(Field, { label: t("coverTitle") },
              React.createElement("input", { style: styles.input, value: s.title, onChange: (e) => set({ title: e.target.value }) })
            ),
            React.createElement(Field, { label: t("coverAccent") },
              React.createElement("input", { style: styles.input, value: s.accent, onChange: (e) => set({ accent: e.target.value }) })
            ),
            React.createElement(Field, { label: t("coverSubtitle") },
              React.createElement("input", { style: styles.input, value: s.subtitle, onChange: (e) => set({ subtitle: e.target.value }) })
            ),
            React.createElement(Field, { label: t("coverBadge") },
              React.createElement("input", { style: styles.input, value: s.badge, onChange: (e) => set({ badge: e.target.value }) })
            ),
            React.createElement(Field, { label: t("coverChips") },
              React.createElement("input", { style: styles.input, value: s.chips, onChange: (e) => set({ chips: e.target.value }) })
            ),
            React.createElement("span", { style: styles.label }, t("statName") + " / " + t("statPct")),
            React.createElement("div", { style: styles.statGrid },
              s.stats.map((r, i) => React.createElement(React.Fragment, { key: i },
                React.createElement("input", { style: styles.input, value: r.name, onChange: (e) => setStat(i, "name", e.target.value) }),
                React.createElement("input", { style: styles.input, value: r.pct, type: "number", min: 0, max: 100, onChange: (e) => setStat(i, "pct", e.target.value) }),
                React.createElement("span", { style: styles.counter }, i === 0 ? "5h" : i === 1 ? "周" : "月")
              ))
            ),
            React.createElement(CoverPanel, { options: coverOptionsFrom(s), template: s.template, onTemplate: (k) => set({ template: k }), onExport: exportCover, exported: s.coverDone, t })
          )
        )
      );
    }

    // ---------- 插件装配 ----------
    function apply(ctx) {
      ctx.effect(() => ctx.locale.register(NS, { zh, en }), "dsh-xhs-publisher: dictionaries");
      const t = ctx.locale.bind(NS);

      ctx.slots.inject("settings.section", () => ctx.slots.register({
        name: "settings.section",
        id: "xhs-publisher",
        order: 50,
        label: () => t("nav"),
        locale: NS,
        inject: () => ({ t }),
      }, PublisherPanel));
    }

    exports.NS = NS;
    exports.apply = apply;
    exports.inject = inject;
    return module.exports;
  }
});