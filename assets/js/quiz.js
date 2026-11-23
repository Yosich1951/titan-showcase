/* Quiz: program selection for Titan-Opttima software lineup.
   Client-side only: no data leaves the browser. Score-based selection. */

"use strict";

var PROGRAMS = {
  volna: {
    name: "Волна",
    desc: "Параметры волны прорыва гидротехнического сооружения: глубина и скорость потока, время добегания, зоны затопления, разрушение гидроузла.",
    local: "volna.html"
  },
  potencial: {
    name: "Потенциал",
    desc: "Взрывоопасность технологических блоков: энергетические показатели, категории блоков, тротиловый эквивалент, радиусы зон разрушения.",
    local: "potencial.html"
  },
  vzryv: {
    name: "Взрыв",
    desc: "Оценка последствий аварийных взрывов топливно-воздушных смесей: избыточное давление, импульс, зоны поражения по РБ и НПА.",
    site: "https://titan-optima.com/programm/index.htm"
  },
  deflagration: {
    name: "Дефлаграция",
    desc: "Дефлаграционное горение и взрыв в помещениях и оборудовании; работает в связке с «Потенциалом».",
    site: "https://titan-optima.com/programm/index.htm"
  },
  axov: {
    name: "АХОВ",
    desc: "Прогнозирование зон заражения при разрушении ёмкостей с АХОВ: конкретное вещество, масса, агрегатное состояние, метеоусловия.",
    site: "https://titan-optima.com/programm/index.htm"
  },
  toksigo: {
    name: "ТоксиГО",
    desc: "Оценка последствий химических аварий для городских территорий и объектов: сценарии выбросов, токсодозы, время подхода облака.",
    site: "https://titan-optima.com/programm/index.htm"
  },
  faktel: {
    name: "Факел",
    desc: "Расчёты для объектов нефтепродуктообеспечения: истечение, проливы, испарение, тепловое излучение пожаров и факелов.",
    site: "https://titan-optima.com/programm/index.htm"
  },
  magistral: {
    name: "Магистраль",
    desc: "Аварии на магистральных трубопроводах: выброс, растекание, распределение продукта, зоны поражения вдоль трассы.",
    site: "https://titan-optima.com/programm/index.htm"
  },
  graf: {
    name: "Графопостроитель",
    desc: "Построение F/N- и F/G-диаграмм риска и картирование зон на карте; дополняет любую расчётную программу.",
    site: "https://titan-optima.com/programm/index.htm"
  }
};

var QUESTIONS = [
  {
    id: "object",
    q: "С чем работает объект, который вы рассчитываете?",
    a: [
      { text: "Гидротехническое сооружение: плотина, дамба, шламонакопитель, пруд", score: { volna: 5 } },
      { text: "Химически опасный объект: ёмкости с хлором, аммиаком, другими АХОВ", score: { axov: 4, toksigo: 2 } },
      { text: "Взрывопожароопасное производство: газы, ЛВЖ, сжиженные газы, пыли", score: { potencial: 3, vzryv: 3, deflagration: 1 } },
      { text: "Нефтебаза, наливная эстакада, магистральный трубопровод, ГРС/КС", score: { faktel: 3, magistral: 4 } },
      { text: "Затрудняюсь ответить — объект смешанного типа", score: { potencial: 1, axov: 1, vzryv: 1 } }
    ]
  },
  {
    id: "document",
    q: "Какой документ вы готовите в первую очередь?",
    a: [
      { text: "ПЛАС или ПЛА — план локализации и ликвидации аварий", score: { potencial: 2, vzryv: 1, axov: 1 } },
      { text: "План ЛАРН — ликвидация разливов нефти и нефтепродуктов", score: { faktel: 3, magistral: 2 } },
      { text: "Декларация промышленной безопасности", score: { vzryv: 2, potencial: 1, volna: 1 } },
      { text: "Оценка риска: F/N- и F/G-диаграммы, картирование рисков", score: { graf: 4 } },
      { text: "Паспорт безопасности опасного объекта", score: { axov: 2, volna: 1, vzryv: 1 } }
    ]
  },
  {
    id: "chem",
    q: "Если речь о выбросе опасного вещества — что о нём известно?",
    a: [
      { text: "Известно конкретное вещество, его масса и условия хранения", score: { axov: 3 } },
      { text: "Нужен расчёт последствий для города или территории по сценариям", score: { toksigo: 3 } },
      { text: "Химия не касается моего расчёта", score: {} }
    ]
  },
  {
    id: "blast",
    q: "Если на объекте возможен взрыв — что важно оценить?",
    a: [
      { text: "Категорию и энергетические показатели технологического блока", score: { potencial: 4 } },
      { text: "Зоны разрушения при взрыве облака ТВС на открытом пространстве", score: { vzryv: 4 } },
      { text: "Горение и взрыв внутри помещения, вентиляция, дефлаграция", score: { deflagration: 4 } },
      { text: "Взрыв не касается моего расчёта", score: {} }
    ]
  },
  {
    id: "maps",
    q: "Нужно ли наносить расчётные зоны на карту местности?",
    a: [
      { text: "Да: ситуационный план, карты затопления или заражения", score: { graf: 3, volna: 1 } },
      { text: "Нет, достаточно расчёта и отчёта с таблицами", score: {} }
    ]
  },
  {
    id: "freq",
    q: "Как часто вы выполняете такие расчёты?",
    a: [
      { text: "Разовая задача или учебный расчёт", score: {}, mode: "once" },
      { text: "Регулярно: несколько объектов в год", score: {}, mode: "regular" }
    ]
  }
];

var state = { step: 0, scores: {}, answers: [], mode: "" };

function el(id) { return document.getElementById(id); }

function render() {
  var box = el("quiz-box");
  var i = state.step;

  if (i < QUESTIONS.length) {
    var q = QUESTIONS[i];
    var html = '<p class="quiz-counter">вопрос ' + (i + 1) + " из " + QUESTIONS.length + "</p>";
    html += '<h2 class="quiz-q">' + q.q + "</h2>";
    html += '<div class="quiz-options" role="radiogroup" aria-label="' + q.q + '">';
    q.a.forEach(function (opt, idx) {
      html += '<button type="button" class="quiz-opt" data-idx="' + idx + '">' + opt.text + "</button>";
    });
    html += "</div>";
    if (i > 0) {
      html += '<button type="button" class="quiz-back" id="quiz-back">← предыдущий вопрос</button>';
    }
    box.innerHTML = html;
    box.querySelectorAll(".quiz-opt").forEach(function (btn) {
      btn.addEventListener("click", function () { answer(parseInt(btn.dataset.idx, 10)); });
    });
    var back = el("quiz-back");
    if (back) back.addEventListener("click", goBack);
  } else {
    renderResult(box);
  }
}

function answer(idx) {
  var q = QUESTIONS[state.step];
  var opt = q.a[idx];
  state.answers[state.step] = idx;
  Object.keys(opt.score).forEach(function (k) {
    state.scores[k] = (state.scores[k] || 0) + opt.score[k];
  });
  if (opt.mode) state.mode = opt.mode;
  state.step++;
  render();
}

function goBack() {
  if (state.step === 0) return;
  state.step--;
  var q = QUESTIONS[state.step];
  var opt = q.a[state.answers[state.step]];
  if (opt && opt.score) {
    Object.keys(opt.score).forEach(function (k) {
      state.scores[k] = (state.scores[k] || 0) - opt.score[k];
    });
  }
  render();
}

function rankedScores() {
  return Object.keys(state.scores)
    .map(function (k) { return { key: k, val: state.scores[k] }; })
    .filter(function (s) { return s.val > 0; })
    .sort(function (a, b) { return b.val - a.val; });
}

function renderResult(box) {
  var ranked = rankedScores();
  var html = '<p class="quiz-counter">подбор завершён</p>';
  html += '<h2 class="quiz-q">Протокол подбора</h2>';

  if (ranked.length === 0) {
    html += '<p>По вашим ответам не хватило данных для уверенной рекомендации. ' +
      "Загляните в полный перечень программ на официальном сайте — или напишите мне, " +
      "какой объект вы рассчитываете, и я подскажу.</p>";
    html += '<a class="btn btn-quiet" href="https://titan-optima.com/programm/index.htm" target="_blank" rel="noopener">Все программы на titan-optima.com</a>';
  } else {
    var top = ranked[0];
    var p = PROGRAMS[top.key];
    html += '<div class="quiz-result">';
    html += '<p class="quiz-verdict">Начните с программы</p>';
    html += '<h3 class="quiz-prog">' + p.name + "</h3>";
    html += '<p>' + p.desc + "</p>";
    html += '<div class="cta-row">';
    var href = p.local || p.site;
    html += '<a class="btn btn-signal" href="' + href + (p.local ? '"' : '" target="_blank" rel="noopener"') + ">" +
      (p.local ? "Открыть на витрине и собрать исходные данные" : "Открыть на titan-optima.com") + "</a>";
    html += '<button type="button" class="btn btn-quiet" id="quiz-restart">Пройти заново</button>';
    html += "</div>";

    if (ranked.length > 1) {
      html += '<div class="quiz-also"><p class="quiz-k">Также рассмотрите</p><ul>';
      ranked.slice(1, 4).forEach(function (s) {
        var pp = PROGRAMS[s.key];
        html += "<li><strong>" + pp.name + "</strong> — " + pp.desc + "</li>";
      });
      html += "</ul></div>";
    }

    if (state.mode === "once") {
      html += '<p class="quiz-note">Для разовой задачи имеет смысл сначала освоить бесплатную демо-версию — она доступна на официальном сайте.</p>';
    } else if (state.mode === "regular") {
      html += '<p class="quiz-note">При регулярных расчётах обратите внимание на комплектную поставку: при одновременном приобретении ряда программ компания предоставляет скидки (условия — на официальном сайте).</p>';
    }
    html += "</div>";
  }

  box.innerHTML = html;
  var restart = el("quiz-restart");
  if (restart) {
    restart.addEventListener("click", function () {
      state = { step: 0, scores: {}, answers: [], mode: "" };
      render();
    });
  }
}

document.addEventListener("DOMContentLoaded", render);
