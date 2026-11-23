/* Dialog engine (Этап 2.1): branching conversation + working memo.
   Loads a scenario from assets/data/dialog.json, asks step by step,
   reacts to each answer, then assembles a printable working memo.
   Client-side only: answers never leave the browser. */

"use strict";

(function () {

  var host = document.getElementById("dialog-box");
  if (!host) return;
  var entry = host.getAttribute("data-entry") || "s1";
  var D = null;
  var state = null;

  fetch("assets/data/dialog.json")
    .then(function (r) { return r.ok ? r.json() : Promise.reject(new Error("HTTP " + r.status)); })
    .then(function (data) { D = data; reset(); })
    .catch(function () {
      host.innerHTML = "<p>Интерактивный диалог загружается с сайта и требует JavaScript. " +
        "Руководство пользователя с полным составом исходных данных доступно на официальном сайте " +
        '<a href="https://titan-optima.com/programm/index.htm" target="_blank" rel="noopener">titan-optima.com</a>.</p>';
    });

  function reset() {
    state = { answers: {}, stack: [], cur: entry, pending: null };
    renderStep();
  }

  /* ---------- question flow ---------- */

  function renderStep() {
    var st = D.steps[state.cur];
    if (!st) { state.cur = entry; return reset(); }
    var n = state.stack.length + 1;
    var html = '<p class="quiz-counter">шаг ' + n + "</p>";
    html += '<h2 class="quiz-q">' + st.q + "</h2>";
    html += '<div class="quiz-options">';
    st.opts.forEach(function (o, i) {
      var chosen = state.pending && state.pending.idx === i;
      html += '<button type="button" class="quiz-opt' + (chosen ? " dlg-chosen" : "") + '"' +
        (state.pending ? " disabled" : "") +
        ' data-idx="' + i + '">' + o.t + "</button>";
    });
    html += "</div>";
    if (state.pending) {
      html += '<div class="dlg-react">' +
        "<p>" + st.opts[state.pending.idx].react + "</p>" +
        '<button type="button" class="btn btn-quiet" id="dlg-next">Продолжить →</button>' +
        "</div>";
    }
    if (state.stack.length) {
      html += '<button type="button" class="quiz-back" id="dlg-back">← предыдущий вопрос</button>';
    }
    host.innerHTML = html;

    Array.prototype.forEach.call(host.querySelectorAll(".quiz-opt"), function (btn) {
      btn.addEventListener("click", function () {
        state.pending = { idx: Number(btn.dataset.idx, 10) };
        renderStep();
      });
    });
    var next = document.getElementById("dlg-next");
    if (next) next.addEventListener("click", advance);
    var back = document.getElementById("dlg-back");
    if (back) back.addEventListener("click", goBack);
  }

  function advance() {
    var st = D.steps[state.cur];
    var opt = st.opts[state.pending.idx];
    state.answers[state.cur] = state.pending.idx;
    state.stack.push(state.cur);
    state.pending = null;
    var nxt = opt.goto || st.next;
    if (nxt.indexOf("memo:") === 0) {
      state.cur = null;
      renderMemo(nxt.slice(5));
    } else {
      state.cur = nxt;
      renderStep();
    }
  }

  function goBack() {
    if (!state.stack.length) return;
    state.pending = null;
    var prev = state.stack.pop();
    delete state.answers[state.cur === null ? prev : prev];
    state.cur = prev;
    renderStep();
  }

  /* ---------- memo ---------- */

  function condOk(cond) {
    if (!cond) return true;
    return Object.keys(cond).every(function (k) {
      return cond[k].indexOf(state.answers[k]) !== -1;
    });
  }

  function renderMemo(key) {
    var m = D.memos[key];
    if (!m) return reset();

    var date = new Date();
    var dateStr = ("0" + date.getDate()).slice(-2) + "." + ("0" + (date.getMonth() + 1)).slice(-2) + "." + date.getFullYear();

    var html = '<div class="memo" id="memo">';
    html += '<div class="memo-head">';
    html += '<p class="quiz-counter">памятка собрана · ' + dateStr + "</p>";
    html += "<h2>" + m.title + "</h2>";

    if (m.program) {
      var p = D.programs[m.program];
      html += '<p class="quiz-verdict">Рекомендуемая программа</p>';
      html += '<h3 class="quiz-prog">' + p.name + "</h3>";
      html += "<p>" + m.whyBase + "</p>";
      if (m.docStep && D.steps[m.docStep] && state.answers[m.docStep] !== undefined) {
        var dn = D.steps[m.docStep].opts[state.answers[m.docStep]].docNote;
        if (dn) html += "<p>" + dn + "</p>";
      }
      if (m.bundles) {
        var bl = m.bundles.filter(condOk);
        if (bl.length) {
          html += '<p class="memo-bundle"><strong>Работает в связке:</strong> ' +
            bl.map(function (b) { return b.t; }).join("; ") + ".</p>";
        }
      }
    }

    if (m.recs) {
      var recs = m.recs.filter(condOk);
      html += '<p class="quiz-verdict">С чего начать</p>';
      html += '<ul class="memo-recs">';
      recs.forEach(function (r) {
        var href = r.local ? r.local : "https://titan-optima.com/programm/index.htm";
        var tgt = r.local ? "" : ' target="_blank" rel="noopener"';
        html += "<li><strong><a href=\"" + href + "\"" + tgt + ">" + r.name + "</a></strong> — " + r.text + "</li>";
      });
      html += "</ul>";
    }

    if (m.notes) {
      m.notes.filter(condOk).forEach(function (n) {
        html += '<p class="memo-noteline">' + n.t + "</p>";
      });
    }

    html += "</div>"; /* /memo-head */

    if (m.groups) {
      var total = 0;
      m.groups.forEach(function (g) {
        if (!condOk(g.cond)) return;
        total += g.items.filter(function (it) { return condOk(it.cond); }).length;
      });
      html += '<p class="idata-progress">исходных данных в памятке: <span id="memo-total">' + total +
        "</span> · отмечено как готовое: <span id=\"memo-count\">0</span></p>";
      m.groups.forEach(function (g, gi) {
        if (!condOk(g.cond)) return;
        var items = g.items.filter(function (it) { return condOk(it.cond); });
        if (!items.length) return;
        html += '<div class="idata-group"><h4><span class="memo-gnum">' + (gi + 1) + "</span> " + g.title + "</h4>";
        if (g.why) html += '<p class="memo-gwhy">' + g.why + "</p>";
        html += "<ul>";
        items.forEach(function (it) {
          html += '<li><label class="idata-item">' +
            '<input type="checkbox">' +
            "<span>" + it.t + (it.src ? ' <span class="idata-src">' + it.src + "</span>" : "") + "</span></label></li>";
        });
        html += "</ul></div>";
      });
    }

    if (m.gaps) {
      var gaps = m.gaps.filter(condOk);
      if (gaps.length) {
        html += '<div class="memo-sec"><h4>Чего не хватает и где взять</h4><ul class="memo-gaps">';
        gaps.forEach(function (g) { html += "<li>" + g.t + "</li>"; });
        html += "</ul></div>";
      }
    }

    if (m.sequence) {
      html += '<div class="memo-sec"><h4>Последовательность работ</h4><ol class="memo-seq">';
      m.sequence.forEach(function (s) { html += "<li>" + s + "</li>"; });
      html += "</ol></div>";
    }

    if (m.norms) {
      html += '<div class="memo-sec"><h4>Нормативная база</h4><ul class="memo-norms">';
      m.norms.forEach(function (s) { html += "<li>" + s + "</li>"; });
      html += "</ul></div>";
    }

    if (m.effort) html += '<p class="memo-effort">' + m.effort + "</p>";
    if (m.next) html += '<p class="quiz-note">' + m.next + "</p>";

    html += '<div class="cta-row memo-actions">';
    var ctaHref = m.program && D.programs[m.program].site ? D.programs[m.program].site : "https://titan-optima.com/programm/index.htm";
    html += '<a class="btn btn-signal" href="' + ctaHref + '" target="_blank" rel="noopener">Демо-версия на titan-optima.com</a>';
    if (m.program && D.programs[m.program].local) {
      html += '<a class="btn btn-quiet" href="' + D.programs[m.program].local + '">Страница программы на витрине</a>';
    }
    html += '<button type="button" class="btn btn-quiet" id="memo-print">Распечатать / PDF</button>';
    html += '<button type="button" class="btn btn-quiet" id="memo-copy">Скопировать текстом</button>';
    html += '<button type="button" class="btn btn-quiet" id="memo-restart">Пройти диалог заново</button>';
    html += "</div>";
    html += '<p class="micro">Памятка сформирована в вашем браузере и никуда не отправляется. ' +
      "Состав исходных данных — ориентир; точный перечень определяется руководством пользователя программы.</p>";
    html += "</div>"; /* /memo */

    host.innerHTML = html;

    document.body.classList.add("has-memo");

    var boxes = host.querySelectorAll('input[type="checkbox"]');
    var count = document.getElementById("memo-count");
    function update() {
      var done = 0;
      Array.prototype.forEach.call(boxes, function (c) { if (c.checked) done++; });
      if (count) count.textContent = String(done);
    }
    Array.prototype.forEach.call(boxes, function (c) { c.addEventListener("change", update); });

    document.getElementById("memo-restart").addEventListener("click", function () {
      document.body.classList.remove("has-memo");
      reset();
    });
    document.getElementById("memo-print").addEventListener("click", function () { window.print(); });
    document.getElementById("memo-copy").addEventListener("click", function () { copyMemo(m); });
  }

  function copyMemo(m) {
    var lines = [m.title, ""];
    if (m.program) {
      lines.push("Рекомендуемая программа: " + D.programs[m.program].name);
      lines.push(m.whyBase);
      lines.push("");
    }
    if (m.recs) {
      lines.push("С чего начать:");
      m.recs.filter(condOk).forEach(function (r) { lines.push("- " + r.name + " — " + r.text); });
      lines.push("");
    }
    if (m.notes) {
      m.notes.filter(condOk).forEach(function (n) { lines.push(n.t); });
      lines.push("");
    }
    if (m.groups) {
      m.groups.forEach(function (g) {
        if (!condOk(g.cond)) return;
        var items = g.items.filter(function (it) { return condOk(it.cond); });
        if (!items.length) return;
        lines.push(g.title + ":");
        items.forEach(function (it) { lines.push("  [ ] " + it.t); });
        lines.push("");
      });
    }
    if (m.gaps) {
      var gaps = m.gaps.filter(condOk);
      if (gaps.length) {
        lines.push("Чего не хватает и где взять:");
        gaps.forEach(function (g) { lines.push("- " + g.t); });
        lines.push("");
      }
    }
    if (m.sequence) {
      lines.push("Последовательность работ:");
      m.sequence.forEach(function (s, i) { lines.push("  " + (i + 1) + ". " + s); });
      lines.push("");
    }
    lines.push("Сформировано на витрине-пилоте программ «Титан-Оптима»: https://yosich1951.github.io/titan-showcase/");
    var text = lines.join("\n");
    var btn = document.getElementById("memo-copy");
    function flash() {
      var old = btn.textContent;
      btn.textContent = "Скопировано";
      setTimeout(function () { btn.textContent = old; }, 1600);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(flash, function () { fallbackCopy(text); });
    } else {
      fallbackCopy(text);
    }
    function fallbackCopy(t) {
      var ta = document.createElement("textarea");
      ta.value = t;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); flash(); } catch (e) { window.prompt("Скопируйте текст вручную:", t); }
      document.body.removeChild(ta);
    }
  }

})();
