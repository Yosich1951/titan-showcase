/* Interactive input-data checklist engine.
   Reads a JSON tree from <script type="application/json" id="input-tree">,
   asks questions, renders a tailored checklist with progress + copy button.
   Client-side only: nothing is sent anywhere. */

"use strict";

(function () {

  var tree = null;
  try {
    tree = JSON.parse(document.getElementById("input-tree").textContent);
  } catch (e) {
    document.getElementById("idata-box").innerHTML =
      "<p>Не удалось загрузить структуру подбора. Полное руководство пользователя доступно на официальном сайте.</p>";
    return;
  }

  var state = { step: 0, answers: [] };
  var box = document.getElementById("idata-box");

  function activeItems() {
    return tree.items.filter(function (item) {
      if (!item.cond) return true;
      return item.cond.every(function (allowed, qid) {
        return allowed.indexOf(state.answers[Number(qid)]) !== -1;
      });
    });
  }

  function render() {
    if (state.step < tree.questions.length) {
      renderQuestion(tree.questions[state.step]);
    } else {
      renderChecklist();
    }
  }

  function renderQuestion(q) {
    var i = state.step;
    var html = '<p class="quiz-counter">вопрос ' + (i + 1) + " из " + tree.questions.length + "</p>";
    html += '<h3 class="idata-q">' + q.q + "</h3>";
    html += '<div class="quiz-options">';
    q.a.forEach(function (opt, idx) {
      html += '<button type="button" class="quiz-opt" data-idx="' + idx + '">' + opt.t + "</button>";
    });
    html += "</div>";
    if (i > 0) html += '<button type="button" class="quiz-back" id="idata-back">← предыдущий вопрос</button>';
    box.innerHTML = html;
    Array.prototype.forEach.call(box.querySelectorAll(".quiz-opt"), function (btn) {
      btn.addEventListener("click", function () {
        state.answers[state.step] = Number(btn.dataset.idx);
        state.step++;
        render();
      });
    });
    var back = document.getElementById("idata-back");
    if (back) back.addEventListener("click", function () { state.step--; render(); });
  }

  function renderChecklist() {
    var items = activeItems();
    var byGroup = {};
    items.forEach(function (item) {
      (byGroup[item.g] = byGroup[item.g] || []).push(item);
    });

    var html = '<p class="quiz-counter">список готов: пунктов — ' + items.length + "</p>";
    html += '<h3 class="idata-q">Ваш чек-лист исходных данных</h3>';
    html += '<p class="idata-progress">отмечено как готовое: <span id="idata-count">0</span> из ' + items.length + "</p>";

    tree.groups.forEach(function (g, gi) {
      var list = byGroup[gi];
      if (!list || !list.length) return;
      html += '<div class="idata-group"><h4>' + g + "</h4><ul>";
      list.forEach(function (item) {
        html += '<li><label class="idata-item">' +
          '<input type="checkbox" data-src="' + (item.src || "") + '">' +
          "<span>" + item.t + (item.src ? ' <span class="idata-src">' + item.src + "</span>" : "") + "</span></label></li>";
      });
      html += "</ul></div>";
    });

    html += '<div class="cta-row">';
    html += '<button type="button" class="btn btn-quiet" id="idata-copy">Скопировать список</button>';
    html += '<button type="button" class="btn btn-quiet" id="idata-restart">Изменить ответы</button>';
    html += "</div>";
    html += '<p class="micro">Отметки не сохраняются и никуда не отправляются. Список — ориентир для подготовки; точный состав исходных данных определяется руководством пользователя программы.</p>';

    box.innerHTML = html;

    var boxes = box.querySelectorAll('input[type="checkbox"]');
    var count = document.getElementById("idata-count");
    function update() {
      var done = 0;
      Array.prototype.forEach.call(boxes, function (c) { if (c.checked) done++; });
      count.textContent = String(done);
    }
    Array.prototype.forEach.call(boxes, function (c) { c.addEventListener("change", update); });

    document.getElementById("idata-restart").addEventListener("click", function () {
      state = { step: 0, answers: [] };
      render();
    });

    document.getElementById("idata-copy").addEventListener("click", function () {
      var lines = [tree.copyTitle, ""];
      tree.groups.forEach(function (g, gi) {
        var list = byGroup[gi];
        if (!list || !list.length) return;
        lines.push(g + ":");
        list.forEach(function (item) {
          lines.push("  [ ] " + item.t.replace(/<[^>]+>/g, ""));
        });
        lines.push("");
      });
      var text = lines.join("\n");
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () { flashCopied(); }, function () { fallbackCopy(text); });
      } else {
        fallbackCopy(text);
      }
    });

    function flashCopied() {
      var b = document.getElementById("idata-copy");
      var old = b.textContent;
      b.textContent = "Скопировано";
      setTimeout(function () { b.textContent = old; }, 1600);
    }

    function fallbackCopy(text) {
      var ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); flashCopied(); } catch (e) { window.prompt("Скопируйте список вручную:", text); }
      document.body.removeChild(ta);
    }
  }

  render();
})();
