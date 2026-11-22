/* The Pugs' Data Viz Studies: plain-language "i" tooltips for statistics terms.
   Loaded (deferred) on every page. It finds each named test or method in the page text, puts a small
   "i" button right after it, and shows a lay explanation on hover, focus or tap.
   Skips SVG chart text, links and buttons (an icon can't sit inside those).
   A page can replace or add explanations with  window.STAT_TIPS = { key: { t: "Title", s: [[heading, text], ...] } }
   defined before this script runs. */
(function () {
  "use strict";

  var TIPS = {
    fisher: { t: "Fisher’s exact test", s: [
      ["What it does", "Checks whether two groups differ in how often something happens (for example, making the poll) by more than luck would explain. It counts every way the outcomes could have been split between the groups, so it stays valid even for tiny groups."],
      ["How to read p", "p is how often luck alone would produce a split at least this lopsided if the groups made no difference. Near 1 means the split is about as ordinary as luck gets. Below about 0.05 is the usual bar for calling a difference real."],
      ["What it doesn’t say", "A high p is not proof that there is no difference, and it is not the chance that there is none. Small groups can only reveal very large gaps."]
    ] },
    spearman: { t: "Rank correlation (Spearman)", s: [
      ["What it does", "Ranks every item on each measure (1st, 2nd, 3rd…) and checks whether the two sets of ranks move together. Because it uses only the order, a few extreme values can’t dominate it, and it doesn’t assume a straight-line relationship."],
      ["How to read it", "The score runs from −1 to +1. +1 means the ranks move in perfect step, 0 means no consistent link, and −1 means one goes up exactly as the other goes down. The closer to either end, the stronger the link."],
      ["What it doesn’t say", "A link is not a cause. With few items, even a sizable score can be luck; the p-value and the range around it show how much."]
    ] },
    mw: { t: "Mann–Whitney test and AUC", s: [
      ["What it does", "Compares two groups without assuming the data follow a bell curve. It pairs every item in one group with every item in the other and asks which one is bigger."],
      ["How to read the AUC", "The AUC is the share of those pairings where the first group is bigger, with ties counted as half. 0.5 is a coin flip, 1 means the first group is always bigger, and 0 means it is always smaller. An AUC of 0.82 means a random item from the first group beats a random item from the second about 82% of the time."],
      ["What it doesn’t say", "It shows how consistently one group is bigger, not by how much."]
    ] },
    wilcoxon: { t: "Wilcoxon signed-rank test", s: [
      ["What it does", "Compares two measurements taken on the same subject, such as each runner’s night lap and day lap. It ranks the size of every runner’s difference and checks whether the differences lean the same way more than luck would explain."],
      ["How to read it", "A small p means the shift is consistent across subjects, not driven by a few. It doesn’t assume a bell curve, and it says nothing about why the shift happens."]
    ] },
    williams: { t: "Williams t-test", s: [
      ["What it does", "Asks whether two correlations that share one variable are truly different, or differ only by luck. For example: does measure A or measure B track the same result better? Because both are measured against the same result, they are not independent, and this test accounts for that."],
      ["How to read it", "A small p means one correlation is genuinely stronger. A large p means the data can’t tell them apart."]
    ] },
    ztest: { t: "Two-proportion z-test", s: [
      ["What it does", "Compares two shares, such as the percent of 2026 starters who reached 48 yards versus the percent in 2020. It asks whether the gap between the two percentages is bigger than luck alone would usually produce, given how many people are in each group."],
      ["How to read it", "A small p (under about 0.05) means the gap is hard to explain by luck alone. A large p means the data can’t tell the two shares apart. It doesn’t say why they differ, and with big groups even a tiny gap can look significant."]
    ] },
    ttest: { t: "t-test", s: [
      ["What it does", "Asks whether the average in two groups differs by more than luck would produce, given how much values vary inside each group."],
      ["How to read it", "A small p (under about 0.05) means the gap is hard to explain by luck alone. It says nothing about whether the gap matters in practice."]
    ] },
    poisson: { t: "Poisson test and intervals", s: [
      ["What it does", "Poisson methods are for counts of events that happen independently at some average rate, like UFO reports per state or stops per yard. They tell you how many events luck alone would produce."],
      ["How to read an interval", "A Poisson interval (for example 90%) is the range of counts expected by chance around that average rate. A place outside the range has more, or fewer, events than chance explains. Small counts are noisy, so their intervals are wide."]
    ] },
    logit: { t: "Logistic regression", s: [
      ["What it does", "A model for yes/no outcomes, such as ranked or not, or stopped or kept running. It fits an S-shaped curve linking the chance of “yes” to a factor such as budget, and it can hold other factors constant (“adjusting” for them)."],
      ["How to read it", "Read the curve as “at this value, the fitted chance of yes is about this.” Its steepness is usually reported as an odds ratio."]
    ] },
    or: { t: "Odds ratio", s: [
      ["What it does", "Odds are how often something happens compared with how often it doesn’t: odds of 1 to 3 are a 25% chance. An odds ratio shows how much the odds are multiplied for each step up, or for one group compared with another."],
      ["How to read it", "1 means no change. 5.5 means the odds are multiplied by 5.5 (1 to 3 becomes 5.5 to 3). Below 1 means lower odds. A range that includes 1 means no clear effect."],
      ["Careful", "When something is already common, odds climb faster than chances, so an odds ratio can sound bigger than the change in chance."]
    ] },
    boot: { t: "Bootstrap", s: [
      ["What it does", "Redraws samples from your own data thousands of times, picking items with replacement, and recomputes the result each time. The spread of those results shows how much the answer would wobble if the data had come out slightly differently."],
      ["How to read it", "The middle 95% of the results becomes the 95% range. A wide range means a shaky estimate. A range that includes zero means the data can’t rule out no effect."]
    ] },
    perm: { t: "Rank-shuffling (permutation) test", s: [
      ["What it does", "Shuffles the data thousands of times at random, which breaks any real link, and counts how often a link as strong as the real one shows up by luck alone. That share is the p-value."],
      ["Why it is useful", "It makes no assumption about bell curves, so it is a good check on tests that do."]
    ] },
    holm: { t: "Holm correction", s: [
      ["What it does", "When many claims are tested at once, a few will look significant by luck. Holm correction raises the bar for each claim (it adjusts the p-values) so that the chance of even one false alarm across the whole set stays under 5%."],
      ["How to read it", "A claim that stays under 0.05 after the correction is much harder to explain by luck than one that passes on its own."]
    ] },
    ols: { t: "Least-squares trendline", s: [
      ["What it does", "The straight line that sits as close as possible to all the points. It is chosen to make the total of the squared vertical misses as small as possible."],
      ["How to read it", "Its slope says how much the vertical measure changes for each step along the horizontal one. The line describes a pattern. It doesn’t prove that one thing causes the other."]
    ] },
    ci: { t: "95% interval (confidence interval)", s: [
      ["What it does", "A range around an estimate that shows how much it could wobble from the luck of the draw. If you could repeat the study many times and build the range the same way each time, about 95 of every 100 ranges would contain the true value."],
      ["How to read it", "A wide range means a shaky estimate. A range that includes zero (or 1, for ratios) means the data can’t rule out no effect."]
    ] },
    pi: { t: "95% prediction band", s: [
      ["What it does", "The shaded zone where a single new case is expected to land about 95% of the time, given the trendline."],
      ["How to read it", "It is wider than the confidence band, because individual cases vary far more than an average does."]
    ] },
    pval: { t: "p-value", s: [
      ["What it does", "Measures how surprising the result would be if there were really no effect and only luck at work. Small (under about 0.05 by convention) means hard to explain by luck alone. Large means it could easily be luck."],
      ["What it doesn’t say", "It is not the chance that the finding is wrong, and it doesn’t measure how big or important the effect is."]
    ] },
    r2: { t: "R²", s: [
      ["What it does", "The share of the differences in one measure that a straight-line fit with the other accounts for, from 0 (none) to 1 (all)."],
      ["How to read it", "An R² of 0.36 means about a third of the differences are accounted for. The rest comes from other things."]
    ] }
  };
  if (window.STAT_TIPS) for (var k in window.STAT_TIPS) TIPS[k] = window.STAT_TIPS[k];

  // longest alternatives first, so "Williams t-test" wins over "t-test" and "Spearman rank correlation" over "Spearman"
  var RE = new RegExp("(" + [
    "Fisher[’']s exact test", "Fisher exact test",
    "Mann[–-]Whitney(?: U| AUC)?", "\\bAUC\\b",
    "Wilcoxon(?: signed-rank)?",
    "(?:Two-proportion )?z-test", "Williams t-test", "\\bt-test",
    "Poisson(?: test| intervals?| limits)?",
    "Spearman(?: rank)?(?: correlation| test| ρ)?", "rank correlations?",
    "rank-shuffling(?: test)?", "permutation tests?",
    "bootstrap\\w*(?: intervals?| ranges?)?",
    "logistic regression", "odds ratios?",
    "Holm(?![a-z])(?:-corrected)?(?: correction)?",
    "least-squares",
    "confidence intervals?", "95% (?:interval|range)s?",
    "prediction (?:bands?|intervals?)",
    "\\bp-values?", "\\bR²", "\\br²"
  ].join("|") + ")", "gi");

  function keyFor(s) {
    s = s.toLowerCase();
    if (/^fisher/.test(s)) return "fisher";
    if (/^mann|^auc/.test(s)) return "mw";
    if (/^wilcoxon/.test(s)) return "wilcoxon";
    if (/z-test$/.test(s)) return "ztest";
    if (/^williams/.test(s)) return "williams";
    if (/^t-test/.test(s)) return "ttest";
    if (/^poisson/.test(s)) return "poisson";
    if (/^spearman|^rank correlation/.test(s)) return "spearman";
    if (/^rank-shuffl|^permutation/.test(s)) return "perm";
    if (/^bootstrap/.test(s)) return "boot";
    if (/^logistic/.test(s)) return "logit";
    if (/^odds/.test(s)) return "or";
    if (/^holm/.test(s)) return "holm";
    if (/^least/.test(s)) return "ols";
    if (/^confidence|^95%/.test(s)) return "ci";
    if (/^prediction/.test(s)) return "pi";
    if (/^p-value/.test(s)) return "pval";
    if (/^r²/.test(s)) return "r2";
    return null;
  }

  var css = document.createElement("style");
  css.textContent =
    ".ii.ii{all:unset;box-sizing:border-box;display:inline-flex;align-items:center;justify-content:center;width:17px;height:17px;margin:0 1px 0 4px;border:1.5px solid currentColor;border-radius:50%;font:italic 700 11px/1 Georgia,'Times New Roman',serif;font-style:italic;color:inherit;opacity:.62;cursor:help;vertical-align:1px;text-transform:none;letter-spacing:0;-webkit-tap-highlight-color:transparent}" +
    ".ii.ii:hover,.ii.ii[aria-expanded=true]{opacity:1;box-shadow:0 0 0 3px color-mix(in srgb,currentColor 20%,transparent)}" +
    ".ii.ii:focus-visible{opacity:1;outline:3px solid #D98E04;outline-offset:2px}" +
    "#stat-pop{position:fixed;z-index:2147483000;box-sizing:border-box;width:min(380px,calc(100vw - 16px));max-height:calc(100vh - 16px);overflow:auto;background:#2a211b;color:#f6eee3;border-radius:10px;padding:13px 15px;font:13.5px/1.5 system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;text-align:left;text-transform:none;letter-spacing:0;box-shadow:0 8px 28px rgba(0,0,0,.35);border:1px solid rgba(255,255,255,.12)}" +
    "#stat-pop[hidden]{display:none}#stat-pop .sp-t{display:block;font-weight:700;font-size:14.5px;margin:0 0 6px}#stat-pop b{display:block;margin-top:9px;font-weight:600;color:#e2c59b}#stat-pop span.sp-b{display:block}";
  document.head.appendChild(css);

  var pop = document.createElement("div");
  pop.id = "stat-pop"; pop.setAttribute("role", "tooltip"); pop.setAttribute("data-noinfo", ""); pop.hidden = true;
  document.body.appendChild(pop);

  var cur = null, pinned = false, tIn = 0, tOut = 0;

  function esc(s) { return s.replace(/&/g, "&amp;").replace(/</g, "&lt;"); }
  function render(key) {
    var d = TIPS[key]; if (!d) return false;
    pop.innerHTML = '<span class="sp-t">' + esc(d.t) + "</span>" + d.s.map(function (x) { return "<b>" + esc(x[0]) + '</b><span class="sp-b">' + esc(x[1]) + "</span>"; }).join("");
    return true;
  }
  function place() {
    if (!cur) return;
    var r = cur.getBoundingClientRect(), vw = document.documentElement.clientWidth || innerWidth, vh = innerHeight, w = pop.offsetWidth, h = pop.offsetHeight;
    var left = Math.max(8, Math.min(r.left - 12, vw - w - 8)), top = r.bottom + 8;
    if (top + h > vh - 8) { var up = r.top - h - 8; top = up >= 8 ? up : Math.max(8, vh - h - 8); }
    pop.style.left = left + "px"; pop.style.top = top + "px";
  }
  function show(btn) {
    clearTimeout(tOut);
    if (cur && cur !== btn) cur.setAttribute("aria-expanded", "false");
    cur = btn;
    if (!render(btn.getAttribute("data-k"))) return;
    pop.hidden = false; btn.setAttribute("aria-expanded", "true"); btn.setAttribute("aria-describedby", "stat-pop"); place();
  }
  function hide() {
    clearTimeout(tIn); clearTimeout(tOut);
    pop.hidden = true; pinned = false;
    if (cur) { cur.setAttribute("aria-expanded", "false"); cur.removeAttribute("aria-describedby"); }
    cur = null;
  }
  function later(btn) { clearTimeout(tIn); tIn = setTimeout(function () { show(btn); }, 90); }
  function soon() { clearTimeout(tIn); clearTimeout(tOut); if (!pinned) tOut = setTimeout(hide, 160); }

  document.addEventListener("mouseover", function (e) {
    var b = e.target.closest && e.target.closest(".ii");
    if (b) { later(b); } else if (e.target.closest && e.target.closest("#stat-pop")) { clearTimeout(tOut); }
  });
  document.addEventListener("mouseout", function (e) {
    var from = e.target.closest && (e.target.closest(".ii") || e.target.closest("#stat-pop"));
    if (!from) return;
    var to = e.relatedTarget && e.relatedTarget.closest && (e.relatedTarget.closest(".ii") || e.relatedTarget.closest("#stat-pop"));
    if (!to) soon();
  });
  document.addEventListener("focusin", function (e) { var b = e.target.closest && e.target.closest(".ii"); if (b) show(b); });
  document.addEventListener("focusout", function (e) { if (e.target.closest && e.target.closest(".ii") && !pinned) soon(); });
  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest(".ii");
    if (b) { e.preventDefault(); e.stopPropagation(); if (pinned && cur === b) { hide(); } else { show(b); pinned = true; } return; }
    if (pinned && !(e.target.closest && e.target.closest("#stat-pop"))) hide();
  }, true);
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && cur) { var b = cur; hide(); if (b && b.focus) try { b.focus({ preventScroll: true }); } catch (x) {} } });
  addEventListener("resize", place);
  addEventListener("scroll", function (e) { if (!cur || e.target === pop) return; if (pinned) place(); else hide(); }, true);

  var SKIP = "a,button,summary,svg,script,style,noscript,textarea,select,option,[data-noinfo],[contenteditable='true']";
  var done = new WeakSet();

  function scan(root) {
    if (!root || root.nodeType === 8) return;
    if (root.nodeType === 3) root = root.parentNode;
    if (!root || root.closest && root.closest(SKIP)) return;
    var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null), nodes = [], n;
    while ((n = w.nextNode())) {
      if (done.has(n)) continue;
      var p = n.parentElement;
      if (!p || p.closest(SKIP)) continue;
      RE.lastIndex = 0;
      if (RE.test(n.nodeValue)) nodes.push(n);
    }
    nodes.forEach(function (t) {
      var s = t.nodeValue, frag = document.createDocumentFragment(), last = 0, m;
      RE.lastIndex = 0;
      while ((m = RE.exec(s))) {
        var key = keyFor(m[0]); if (!key || !TIPS[key]) continue;
        var end = m.index + m[0].length;
        var a = document.createTextNode(s.slice(last, end)); done.add(a); frag.appendChild(a);
        var b = document.createElement("button");
        b.type = "button"; b.className = "ii"; b.setAttribute("data-k", key); b.setAttribute("aria-expanded", "false");
        b.setAttribute("aria-label", "What is " + TIPS[key].t + "? Explain in plain language"); b.textContent = "i";
        frag.appendChild(b); last = end;
      }
      if (last === 0) { done.add(t); return; }
      var rest = document.createTextNode(s.slice(last)); done.add(rest); frag.appendChild(rest);
      if (t.parentNode) t.parentNode.replaceChild(frag, t);
    });
  }

  var q = [], raf = 0;
  function flush() { raf = 0; var l = q; q = []; l.forEach(scan); }
  function queue(x) { q.push(x); if (!raf) raf = setTimeout(flush, 60); }

  function start() {
    scan(document.body);
    new MutationObserver(function (ms) {
      ms.forEach(function (m) {
        var t = m.target, host = t.nodeType === 1 ? t : t.parentElement;
        if (host && host.closest && host.closest("svg,#stat-pop")) return;
        if (m.type === "characterData") { done.delete(t); queue(t); return; }
        m.addedNodes.forEach(function (a) {
          if (a.nodeType === 3) { if (!done.has(a)) queue(a); }
          else if (a.nodeType === 1 && !(a.classList && a.classList.contains("ii")) && a.id !== "stat-pop" && !(a.closest && a.closest("svg"))) queue(a);
        });
      });
    }).observe(document.body, { childList: true, subtree: true, characterData: true });
  }
  window.StatInfo = { scan: scan };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
