/* Live "visualization of the day" embeds for The Pugs' Data Viz Studies.
   The home page loads a study page in an iframe as  <page>/?potd=<key>.
   This script then shows only that chart's card (with all its controls), hides the rest
   of the page, and tells the home page how tall the card is so the iframe fits it.
   Loaded (not deferred) in the <head> of every study page; does nothing without ?potd=. */
(function () {
  var m = location.search.match(/[?&]potd=([\w-]+)/);
  if (!m) { window.PUG_EMBED = false; return; }
  var key = m[1];
  window.PUG_EMBED = true;
  document.documentElement.classList.add("pug-embed");

  // key -> [selector, closest container to show]
  var T = {
    "mn-dist": ["#stress .card"],
    "hb-surv": ["#card-surv"],
    "pz-ai": ["#c-ai", ".card"],
    "mc-trend": ["#trend .panel"],
    "cc-map": ["#map .plate"],
    "bb-stops": ["#chart-yarddots", ".bb-card"],
    "bw-animals": ["#c1c", ".card"],
    "tn-offseason": ["#offseason .panel"],
    "uf-rate": ["#cFun", ".card"],
    "cf-scatter": ["#flip"]
  };

  var css = document.createElement("style");
  css.textContent =
    "html.pug-embed,html.pug-embed body{margin:0!important;padding:0!important;min-height:0!important;height:auto!important;overflow:hidden!important}" +
    "html.pug-embed .pug-embed-path{margin:0!important;padding:0!important;gap:0!important;border:0!important;max-width:none!important;min-height:0!important;box-shadow:none!important;transform:none!important}" +
    "html.pug-embed .pug-embed-target{margin:0!important;max-width:none!important}" +
    "html.pug-embed .pf{display:none!important}" +
    // one typeface family on the home page: the studies keep their own type on their own pages, but the preview speaks the site's Sora
    "html.pug-embed,html.pug-embed *{font-family:\"Sora\",system-ui,sans-serif!important}";
  document.head.appendChild(css);

  function post(h) {
    try { parent.postMessage({ type: "pug-embed", key: key, h: h }, "*"); } catch (e) {}
  }

  function setup() {
    var t = T[key], el = t && document.querySelector(t[0]);
    if (el && t[1]) el = el.closest(t[1]);
    if (!el) { post(-1); return; } // the home page keeps its snapshot image
    el.classList.add("pug-embed-target");
    // the home page already shows this chart's insight headline beside it: drop the card's duplicate kicker and title
    var dupes = { "cf-scatter": [".pq", "h2"] }[key] || [];
    for (var d = 0; d < dupes.length; d++) { var x = el.querySelector(dupes[d]); if (x) x.style.setProperty("display", "none", "important"); }
    // the chart's source line may sit just outside the card (at the end of its section): bring it in
    if (!el.querySelector(".chart-src")) {
      for (var a = el.parentElement; a && a !== document.body; a = a.parentElement) {
        var srcs = a.querySelectorAll(".chart-src"), hit = null;
        for (var j = 0; j < srcs.length; j++) if (el.compareDocumentPosition(srcs[j]) & Node.DOCUMENT_POSITION_FOLLOWING) { hit = srcs[j]; break; }
        if (hit) { el.appendChild(hit.cloneNode(true)); break; }
      }
    }
    // on the home page the chart is a preview: remove the simulation controls and selections (they live on the full page)
    var CTRL = {
      "mn-dist": [".ctrl"], "hb-surv": [".replay"], "mc-trend": [".chip"], "cc-map": [".slider", ".ticks"],
      "bb-stops": [".bb-chips"], "bw-animals": [".controls", ".cstat"], "uf-rate": [".controls", ".cstat"], "cf-scatter": [".fp"]
    }[key] || [];
    for (var c = 0; c < CTRL.length; c++) {
      var hits = el.querySelectorAll(CTRL[c]);
      for (var h = 0; h < hits.length; h++) {
        var hide = CTRL[c] === ".chip" ? hits[h].parentElement : hits[h];
        if (hide) hide.style.setProperty("display", "none", "important");
      }
    }
    // drop sentences that tell the reader to press, pick or click something that is no longer there
    var STRIP = {
      "mc-trend": [/Click a dot to list that year, or pick a decade above\.\s*/],
      "cc-map": [/Press play or drag the slider: the dots thicken, the dark center of population moves west, and the two charts follow the same census\./, "The dark dot marks the center of population; the full page animates it from 1790 to 1900."],
      "bb-stops": [/Pick the championships to stack\.\s*/],
      "cf-scatter": [/\s*Pick a team you know, or click any line, to follow it\./]
    }[key];
    if (STRIP) {
      var tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT), tn;
      while ((tn = tw.nextNode())) {
        var rule = STRIP[0], rep = STRIP[1] || "";
        if (rule.test(tn.nodeValue)) tn.nodeValue = tn.nodeValue.replace(rule, rep);
      }
    }
    // clicks, taps and keys on the chart's buttons, inputs and marks do nothing here (hover tooltips and info icons still work)
    var block = function (ev) {
      var t = ev.target;
      if (!el.contains(t) || !t.closest) return;
      if (t.closest(".ii, a, .pf, [data-keep]")) return;
      if (key === "uf-rate" && t.closest("svg")) return; // a saucer opens the full page on that state
      if (ev.type === "keydown" && ev.key !== "Enter" && ev.key !== " ") return;
      if (t.closest("button, input, select, svg, [role=button], [tabindex]")) { ev.stopPropagation(); ev.preventDefault(); }
    };
    ["click", "mousedown", "pointerdown", "touchstart", "keydown", "change", "input"].forEach(function (n) { document.addEventListener(n, block, true); });
    // hide everything that is not on the path from <body> to the chart's card
    for (var n = el; n && n !== document.body; n = n.parentElement) {
      var p = n.parentElement;
      if (!p) break;
      for (var i = 0; i < p.children.length; i++) {
        var c = p.children[i];
        if (c !== n && !/^(SCRIPT|STYLE|LINK|TEMPLATE)$/.test(c.tagName) && !/^(fixed|absolute)$/.test(getComputedStyle(c).position)) c.style.setProperty("display", "none", "important");
      }
      if (p !== document.body) p.classList.add("pug-embed-path");
    }
    var last = 0;
    var measure = function () {
      var h = Math.ceil(el.getBoundingClientRect().bottom + (window.scrollY || 0));
      if (h > 0 && Math.abs(h - last) > 1) { last = h; post(h); }
    };
    measure();
    if (window.ResizeObserver) new ResizeObserver(measure).observe(el);
    window.addEventListener("load", measure);
    setTimeout(measure, 600); setTimeout(measure, 2000);
    window.dispatchEvent(new Event("resize"));
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", setup); else setup();

  // a click inside the embed that would act on a hidden part of the page opens the full page instead
  window.pugOpenFull = function (query) {
    var url = location.pathname + (query ? "?" + query : "");
    window.open(url, "_blank", "noopener");
  };
})();
