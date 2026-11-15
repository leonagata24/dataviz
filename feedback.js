/* Counting: first vote logs <key>/wag or /meh; undo logs undo-<vote>; a switch logs switch-<from>-to-<to>.
   Net wags = wag - undo-wag - switch-wag-to-meh + switch-meh-to-wag (same for meh).
   Pug-flavored thumbs feedback ("Wag" / "Meh") for The Pugs' Data Viz Studies.
   Study pages: auto-mounts at the end of the page. Home page: window.pugFeedback(container, key).
   Counts go to GoatCounter as events (feedback/<key>/wag or /meh). No cookies; one vote per
   study per browser is remembered in localStorage (casual repeat guard only). */
(function () {
  var css = ".pf{--pf-bg:#F6EBDA;--pf-ink:#241B16;--pf-muted:#6F5B47;--pf-line:#E6D3B8;--pf-acc:#8A5A36;--pf-on:#241B16;--pf-onink:#F6EBDA}" +
    "@media (prefers-color-scheme:dark){:root:not([data-theme=light]) .pf{--pf-bg:#2A211B;--pf-ink:#F3E8D9;--pf-muted:#C3AE95;--pf-line:#3E3229;--pf-acc:#DDB07A;--pf-on:#E2C59B;--pf-onink:#17120E}}" +
    ":root[data-theme=dark] .pf{--pf-bg:#2A211B;--pf-ink:#F3E8D9;--pf-muted:#C3AE95;--pf-line:#3E3229;--pf-acc:#DDB07A;--pf-on:#E2C59B;--pf-onink:#17120E}" +
    ".pf{box-sizing:border-box;display:flex;flex-wrap:wrap;align-items:center;gap:8px 14px;background:var(--pf-bg);color:var(--pf-muted);border:1px solid var(--pf-line);border-radius:12px;padding:10px 14px;margin:28px auto;max-width:760px;font:13px/1.4 Sora,system-ui,sans-serif}" +
    ".pf.pf-in{margin:14px 0 0;max-width:none}" +
    ".pf-q{flex:1 1 220px;color:var(--pf-ink);font-weight:600}" +
    ".pf-b{display:flex;gap:8px}" +
    ".pf button{font:600 13px/1 Sora,system-ui,sans-serif;display:inline-flex;align-items:center;gap:7px;background:transparent;color:var(--pf-ink);border:1.5px solid var(--pf-line);border-radius:99px;padding:8px 14px;cursor:pointer;min-height:36px}" +
    ".pf button:hover,.pf button:focus-visible{border-color:var(--pf-acc);outline:none}" +
    ".pf button svg{width:16px;height:16px;fill:currentColor}" +
    ".pf button[aria-pressed=true]{background:var(--pf-on);color:var(--pf-onink);border-color:var(--pf-on)}" +
    ".pf.pf-done button:not([aria-pressed=true]){opacity:.45}" +
    ".pf-t{width:100%;color:var(--pf-muted)}";
  var paw = '<svg viewBox="0 0 24 24" aria-hidden="true"><ellipse cx="12" cy="16" rx="5.5" ry="4.6"/><ellipse cx="5.2" cy="10" rx="2.2" ry="2.8"/><ellipse cx="9.5" cy="5.8" rx="2.2" ry="2.9"/><ellipse cx="14.5" cy="5.8" rx="2.2" ry="2.9"/><ellipse cx="18.8" cy="10" rx="2.2" ry="2.8"/></svg>';
  var flat = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12h18v2.4H3z"/></svg>';
  var msg = { wag: "Tail wag logged. The pug thanks you.", meh: "Noted. The pug will try harder." };
  function get(k) { try { return localStorage.getItem("pugfb:" + k); } catch (e) { return null; } }
  function put(k, v) { try { localStorage.setItem("pugfb:" + k, v); } catch (e) {} }
  function mount(host, key, inline) {
    if (!host || host.querySelector(".pf")) return;
    if (!document.getElementById("pf-css")) { var s = document.createElement("style"); s.id = "pf-css"; s.textContent = css; document.head.appendChild(s); }
    var box = document.createElement("div");
    box.className = "pf" + (inline ? " pf-in" : "");
    box.setAttribute("role", "group");
    box.setAttribute("aria-label", "Feedback");
    box.innerHTML = '<span class="pf-q">Did this one earn a tail wag?</span><span class="pf-b"><button type="button" data-v="wag" aria-pressed="false">' + paw + 'Wag wag</button><button type="button" data-v="meh" aria-pressed="false">' + flat + 'Meh</button></span><span class="pf-t" role="status" aria-live="polite"></span>';
    var note = box.querySelector(".pf-t");
    function show(v) {
      box.classList.toggle("pf-done", !!v);
      box.querySelectorAll("button").forEach(function (b) { b.setAttribute("aria-pressed", b.dataset.v === v ? "true" : "false"); });
      note.textContent = v ? msg[v] + " Tap again to undo or switch." : "";
    }
    function log(name, label) {
      try {
        if (window.goatcounter && window.goatcounter.count)
          window.goatcounter.count({ path: "feedback/" + key + "/" + name, title: label + ": " + key, event: true });
      } catch (err) {}
    }
    var cur = get(key) || "";
    if (cur) show(cur);
    box.addEventListener("click", function (e) {
      var b = e.target.closest("button[data-v]");
      if (!b) return;
      var v = b.dataset.v, prev = cur;
      if (prev === v) { cur = ""; put(key, ""); show(""); log("undo-" + v, "Undo " + v); return; }
      cur = v; put(key, v); show(v);
      if (!prev) log(v, v === "wag" ? "Wag" : "Meh");
      else log("switch-" + prev + "-to-" + v, "Switch " + prev + " to " + v);
    });
    host.appendChild(box);
  }
  window.pugFeedback = function (host, key) { mount(host, key, true); };
  var m = location.pathname.match(/\/dataviz\/([^\/]+)\/?(?:index\.html)?$/) || location.pathname.match(/^\/([^\/]+)\/?(?:index\.html)?$/);
  var slug = m && m[1] !== "dataviz" ? m[1] : null;
  if (slug && !document.getElementById("potd")) {
    var go = function () { mount(document.body, slug, false); };
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", go); else go();
  }
})();
