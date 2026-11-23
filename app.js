(function () {
'use strict';

/* ================= utilidades ================= */
var KEY = 'treino-app:v1';
var $ = function (s, r) { return (r || document).querySelector(s); };
var uid = function () { return Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4); };
var esc = function (s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
};
function hoje() {
  var d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
function fmtData(iso) {
  var p = String(iso).slice(0, 10).split('-');
  return p[2] + '/' + p[1] + '/' + p[0];
}
function num(v) {
  var n = parseFloat(String(v == null ? '' : v).replace(',', '.'));
  return isNaN(n) ? 0 : n;
}
function fmtSet(s) { return (s.carga || '–') + 'kg×' + (s.reps || '–'); }

/* ================= dados iniciais ================= */
function ex(nome, series, reps) { return { id: uid(), nome: nome, series: series, reps: reps }; }
function ref(nome, itens) { return { id: uid(), nome: nome, itens: itens }; }

function novosTreinos() {
  var P = '1×12 / 1×5 / 2×6 a 8', F = P + ' / 1×falha (-40%)';
  return [
    { id: uid(), nome: 'Treino 1 · Perna', exercicios: [
      ex('Agachamento búlgaro', 4, '1×8 / 1×5 / 2×6 a 8'), ex('Leg press unilateral', 4, '1×8 / 1×5 / 2×6 a 8'),
      ex('Extensora', 3, '1×12 / 1×5 / 1 Custler set 16 reps (4×4, 10 s)'), ex('Mesa flexora', 2, '1×12 / 1 Custler set 16 reps (4×4, 10 s)'),
      ex('Panturrilha em pé', 4, P + ' (pico de contração)')] },
    { id: uid(), nome: 'Treino 2 · Peito e ombro', exercicios: [
      ex('Supino inclinado Smith', 4, P), ex('Crucifixo inclinado', 5, F), ex('Supino reto', 4, P),
      ex('Crossover', 4, P), ex('Desenvolvimento máquina', 5, F), ex('Elevação lateral', 4, P)] },
    { id: uid(), nome: 'Treino 3 · Costas', exercicios: [
      ex('Pulldown corda', 5, F), ex('Puxada alta supinada (barra anatômica)', 4, '1×12 / 1×5 / 2×6 a 10'),
      ex('Remada baixa unilateral', 4, P), ex('Remada cavalinho', 5, F), ex('Pullface corda', 4, P),
      ex('Meio terra', 4, '2×15 / 2×6 a 8')] },
    { id: uid(), nome: 'Treino 4 · Bíceps e tríceps', exercicios: [
      ex('Tríceps corda', 4, P + ' (pico de contração)'), ex('Tríceps coice unilateral polia', 4, P),
      ex('Tríceps francês unilateral polia', 5, F), ex('Rosca Scott', 4, P), ex('Rosca martelo', 4, P),
      ex('Rosca direta barra W na polia (de costas para a polia)', 4, '1×12 / 1×5 / 2×6 a 10')] },
    { id: uid(), nome: 'Treino 5 · Perna', exercicios: [
      ex('Hack machine', 5, F), ex('Extensora', 4, P), ex('Elevação pélvica', 4, P),
      ex('Adutora', 5, F), ex('Flexora sentado', 4, P), ex('Panturrilha em pé', 4, P)] }
  ];
}

function seed() {
  var d1 = { id: uid(), nome: 'Dieta 1', refeicoes: [
    ref('Ref 1', ['2 pães de forma ou 1 de sal', '2 ovos', '120g banana prata', '20g aveia', '10g chia', '40g whey']),
    ref('Ref 2', ['130g arroz', '120g peito de frango', '100g vagem/brócolis/cenoura', 'Salada de folhas', '5g de azeite']),
    ref('Ref 3', ['2 pães de forma', '20g doce de leite', '100g peito de frango']),
    ref('Ref 4', ['200g batata inglesa', '130g peito de frango', '100g abóbora', 'Salada de folhas', '5g azeite'])] };
  var d2 = dieta2();
  return {
    v: 1,
    migTreino2: true,
    treinos: novosTreinos(),
    dietas: [d1, d2],
    logs: [],
    corpo: [],
    dietaChecks: {},
    rascunho: null,
    tecnicas: 'Cluster set (Custler): 4 repetições, descansar 15 s e repetir até completar as séries, com carga máxima.\n' +
      'Rest pause: 10 repetições, descansar 15 s e fazer até a falha, com carga máxima.\n' +
      'Top set: última série válida, até a falha com carga máxima (mínimo 6 reps).\n' +
      'Backoff: descansar só 30 s após a última série, reduzir 30% da carga máxima e fazer até a falha.',
    config: { webhook: '', headers: '', dietaId: d2.id }
  };
}
function dieta2() {
  return { id: uid(), nome: 'Dieta 2', refeicoes: [
    ref('Ref 1', ['2 pães de forma ou 1 de sal', '3 claras', '1 gema', '120g banana prata', '10g aveia', '10g chia', '40g whey']),
    ref('Ref 2', ['100g arroz', '130g peito de frango', '100g vagem/brócolis/cenoura', 'Salada de folhas', '5g de azeite']),
    ref('Ref 3', ['80g banana da terra', '10g doce de leite', '100g peito de frango']),
    ref('Ref 4', ['130g batata inglesa', '140g peito de frango', '100g abóbora', 'Salada de folhas', '5g azeite'])] };
}

/* ================= estado e armazenamento ================= */
var S;
function normalizar(o) {
  var base = seed();
  o = o && typeof o === 'object' ? o : {};
  ['treinos', 'dietas', 'logs', 'corpo'].forEach(function (k) { if (!Array.isArray(o[k])) o[k] = k === 'treinos' || k === 'dietas' ? base[k] : []; });
  if (!o.dietaChecks || typeof o.dietaChecks !== 'object') o.dietaChecks = {};
  if (typeof o.tecnicas !== 'string') o.tecnicas = base.tecnicas;
  if (!o.config || typeof o.config !== 'object') o.config = {};
  o.config.webhook = o.config.webhook || '';
  o.config.headers = o.config.headers || '';
  if (!o.config.user || typeof o.config.user !== 'object') o.config.user = null;
  if (!o.dietas.find(function (d) { return d.id === o.config.dietaId; })) o.config.dietaId = o.dietas[0] ? o.dietas[0].id : null;
  if (!o.migDieta2 && !o.dietas.find(function (d) { return d.nome === 'Dieta 2'; })) {
    var nd2 = dieta2();
    o.dietas.push(nd2);
    o.config.dietaId = nd2.id;
  }
  o.migDieta2 = true;
  if (!o.migTreino2) {
    var antigos = ['Treino 1 · Costas e bíceps', 'Treino 2 · Peito, ombro e tríceps', 'Treino 3 · Pernas'];
    o.treinos = o.treinos.filter(function (t) { return antigos.indexOf(t.nome) < 0; });
    o.treinos = novosTreinos().concat(o.treinos);
    if (o.rascunho && !o.treinos.find(function (t) { return t.id === o.rascunho.treinoId; })) o.rascunho = null;
    o.migTreino2 = true;
  }
  o.rascunho = o.rascunho || null;
  o.v = 1;
  return o;
}
function load() {
  try {
    var r = localStorage.getItem(KEY);
    S = normalizar(r ? JSON.parse(r) : seed());
  } catch (e) { S = normalizar(seed()); }
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(S)); }
  catch (e) { toast('Não foi possível salvar neste navegador'); }
  if (typeof agendarSync === 'function') agendarSync();
}

var tab = 'treino';
var ui = { sessao: false, expandido: null, dietaData: hoje(), editor: null };

/* ================= toast e janelas ================= */
var toastT;
function toast(msg) {
  var t = $('#toast');
  t.textContent = msg;
  t.classList.add('on');
  clearTimeout(toastT);
  toastT = setTimeout(function () { t.classList.remove('on'); }, 3200);
}
function abrirSheet(html) { $('#sheetbox').innerHTML = html; $('#sheet').classList.add('on'); }
function fechar() { $('#sheet').classList.remove('on'); ui.editor = null; }
var confirmCb = null;
function confirmar(msg, onYes, rotulo) {
  confirmCb = onYes;
  abrirSheet('<h2>' + esc(msg) + '</h2>' +
    '<button class="btn block" data-act="conf-sim">' + esc(rotulo || 'Confirmar') + '</button>' +
    '<button class="ghost block" data-act="conf-nao">Cancelar</button>');
}
function copiar(txt) {
  function fallback() {
    var ta = document.createElement('textarea');
    ta.value = txt; document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); toast('Copiado ✓'); } catch (e) { toast('Não foi possível copiar'); }
    ta.remove();
  }
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(txt).then(function () { toast('Copiado ✓'); }, fallback);
    } else fallback();
  } catch (e) { fallback(); }
}

/* ================= envio (webhook) ================= */
function payloadLog(l) {
  var linhas = [];
  l.exercicios.forEach(function (e) {
    e.series.forEach(function (s, i) {
      linhas.push({ data: l.data, ficha: l.ficha, exercicio: e.nome, serie: i + 1, carga: s.carga, reps: s.reps });
    });
  });
  return { tipo: 'treino', id: l.id, data: l.data, ficha: l.ficha, obs: l.obs || '', exercicios: l.exercicios.map(function (e) {
    return { nome: e.nome, series: e.series.map(function (s, i) { return { n: i + 1, carga: s.carga, reps: s.reps }; }) };
  }), linhas: linhas };
}
function payloadCorpo(c) {
  return { tipo: 'corpo', id: c.id, data: c.data, peso: c.peso, cintura: c.cintura, braco: c.braco, coxa: c.coxa };
}
async function enviar(payload) {
  if (S.config.user) payload = Object.assign({ usuario: S.config.user.email }, payload);
  var url = (S.config.webhook || '').trim();
  if (!url) return { ok: false, motivo: 'sem-url' };
  var headers = {}, temH = false;
  try {
    if ((S.config.headers || '').trim()) { headers = JSON.parse(S.config.headers); temH = true; }
  } catch (e) { return { ok: false, motivo: 'cabeçalhos inválidos' }; }
  try {
    if (temH) {
      var r = await fetch(url, { method: 'POST', headers: Object.assign({ 'Content-Type': 'application/json' }, headers), body: JSON.stringify(payload) });
      return { ok: r.ok, motivo: r.ok ? '' : 'HTTP ' + r.status };
    }
    await fetch(url, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(payload) });
    return { ok: true, semConfirmacao: true };
  } catch (e) { return { ok: false, motivo: 'sem conexão' }; }
}
async function enviarPendentes() {
  if (!(S.config.webhook || '').trim()) { toast('Configure a URL de envio em Ajustes'); return; }
  var n = 0, falha = 0, i;
  for (i = 0; i < S.logs.length; i++) {
    if (!S.logs[i].enviado) {
      var r = await enviar(payloadLog(S.logs[i]));
      if (r.ok) { S.logs[i].enviado = true; S.logs[i].semConfirmacao = !!r.semConfirmacao; n++; } else falha++;
    }
  }
  for (i = 0; i < S.corpo.length; i++) {
    if (!S.corpo[i].enviado) {
      var r2 = await enviar(payloadCorpo(S.corpo[i]));
      if (r2.ok) { S.corpo[i].enviado = true; n++; } else falha++;
    }
  }
  save(); render();
  toast(n + ' enviado(s)' + (falha ? ', ' + falha + ' com falha' : ''));
}

/* ================= consultas ================= */
function ultimoDoExercicio(nome) {
  var k = nome.toLowerCase();
  for (var i = 0; i < S.logs.length; i++) {
    var e = S.logs[i].exercicios.find(function (x) { return x.nome.toLowerCase() === k; });
    if (e && e.series.length) return { data: S.logs[i].data, sets: e.series };
  }
  return null;
}
function ultimaDataTreino(id) {
  var l = S.logs.find(function (x) { return x.treinoId === id; });
  return l ? fmtData(l.data) : null;
}
function volumeLog(l) {
  var v = 0;
  l.exercicios.forEach(function (e) { e.series.forEach(function (s) { v += num(s.carga) * num(s.reps); }); });
  return Math.round(v);
}
function nSeries(l) { return l.exercicios.reduce(function (a, e) { return a + e.series.length; }, 0); }

/* ================= telas ================= */
function render() {
  document.querySelectorAll('#tabs button').forEach(function (b) { b.classList.toggle('on', b.dataset.tab === tab); });
  var h;
  if (tab === 'treino') h = ui.sessao ? vSessao() : vTreinos();
  else if (tab === 'dieta') h = vDieta();
  else if (tab === 'corpo') h = vCorpo();
  else if (tab === 'hist') h = vHist();
  else h = vAjustes();
  var y = window.scrollY;
  $('#app').innerHTML = h;
  window.scrollTo(0, y);
}

/* ---- treino: lista de fichas ---- */
function vTreinos() {
  var h = '<header><h1>Treino</h1><p class="sub">Escolha a ficha de hoje</p></header>';
  if (S.rascunho) {
    h += '<div class="banner"><span>Em andamento: <b>' + esc(S.rascunho.nome) + '</b></span>' +
      '<button class="btn sm" data-act="retomar">Retomar</button></div>';
  }
  S.treinos.forEach(function (t) {
    var ult = ultimaDataTreino(t.id);
    h += '<div class="card"><div class="row"><div><h2>' + esc(t.nome) + '</h2><p class="muted small">' +
      t.exercicios.length + ' exercícios' + (ult ? ' · último: ' + ult : '') + '</p></div>' +
      '<button class="ghost" data-act="edit-treino" data-id="' + t.id + '">Editar</button></div>' +
      '<ol class="exlist">' + t.exercicios.map(function (e) {
        return '<li>' + esc(e.nome) + ' <span>' + e.series + '×' + esc(e.reps) + '</span></li>';
      }).join('') + '</ol>' +
      '<button class="btn" data-act="iniciar" data-id="' + t.id + '">Iniciar treino</button></div>';
  });
  h += '<button class="btn outline block" data-act="novo-treino">+ Nova ficha de treino</button>';
  if (S.tecnicas.trim()) {
    h += '<div class="card" style="margin-top:14px"><details><summary style="margin-top:0">Técnicas do treino</summary>' +
      '<p class="muted small" style="white-space:pre-line">' + esc(S.tecnicas) + '</p></details></div>';
  }
  return h;
}

/* ---- treino: sessão ---- */
function vSessao() {
  var r = S.rascunho;
  if (!r) { ui.sessao = false; return vTreinos(); }
  var h = '<header class="row"><div><h1>' + esc(r.nome) + '</h1><p class="sub">' + fmtData(r.data) +
    ' · registre carga e repetições</p></div><button class="ghost" data-act="voltar">Voltar</button></header>';
  r.exercicios.forEach(function (e, i) {
    var prev = ultimoDoExercicio(e.nome);
    h += '<div class="card"><div class="row"><h2>' + esc(e.nome) + '</h2><span class="pill">' + e.series + '×' + esc(e.reps) + '</span></div>';
    if (prev) h += '<p class="muted small">Último (' + fmtData(prev.data) + '): ' + prev.sets.map(fmtSet).join(' · ') + '</p>';
    h += '<div class="sets"><div class="sethead"><span>#</span><span>Carga (kg)</span><span>Reps</span><span></span></div>';
    e.sets.forEach(function (s, j) {
      var ps = prev && prev.sets[j];
      h += '<div class="setrow' + (s.ok ? ' ok' : '') + '"><span class="n">' + (j + 1) + '</span>' +
        '<input inputmode="decimal" data-f="carga" data-i="' + i + '" data-j="' + j + '" value="' + esc(s.carga) + '" placeholder="' + esc(ps ? ps.carga : 'kg') + '">' +
        '<input inputmode="numeric" data-f="reps" data-i="' + i + '" data-j="' + j + '" value="' + esc(s.reps) + '" placeholder="' + esc(ps ? ps.reps : 'reps') + '">' +
        '<button class="chk" data-act="ok" data-i="' + i + '" data-j="' + j + '">' + (s.ok ? '✓' : '') + '</button></div>';
    });
    h += '</div><div class="row gap"><button class="ghost" data-act="add-set" data-i="' + i + '">+ série</button>' +
      '<button class="ghost" data-act="rem-set" data-i="' + i + '">− série</button></div></div>';
  });
  h += '<div class="card"><label>Observações<textarea data-f="obs" rows="2" placeholder="Como foi o treino?">' + esc(r.obs || '') + '</textarea></label></div>' +
    '<button class="btn block" data-act="finalizar">Finalizar e enviar</button>' +
    '<button class="ghost block danger" data-act="descartar">Descartar treino</button>';
  return h;
}

/* ---- dieta ---- */
function dietaAtual() {
  return S.dietas.find(function (d) { return d.id === S.config.dietaId; }) || S.dietas[0] || null;
}
function vDieta() {
  var h = '<header><h1>Dieta</h1></header>';
  var d = dietaAtual();
  if (!d) return h + '<div class="card"><p class="muted">Nenhuma ficha de dieta.</p></div><button class="btn outline block" data-act="nova-dieta">+ Nova ficha de dieta</button>';
  h += '<div class="chips">' + S.dietas.map(function (x) {
    return '<button class="chip' + (x.id === d.id ? ' on' : '') + '" data-act="chip-dieta" data-id="' + x.id + '">' + esc(x.nome) + '</button>';
  }).join('') + '</div>';
  d.refeicoes.forEach(function (r) {
    h += '<div class="card"><h2>' + esc(r.nome) + '</h2><ul class="dlist">' +
      r.itens.map(function (i) { return '<li>' + esc(i) + '</li>'; }).join('') + '</ul></div>';
  });
  h += '<div class="row"><button class="ghost" data-act="edit-dieta" data-id="' + d.id + '">Editar ficha</button>' +
    '<button class="ghost" data-act="nova-dieta">+ Nova ficha</button></div>';
  return h;
}

/* ---- corpo ---- */
function spark(vals) {
  if (vals.length < 2) return '';
  var w = 300, h = 60, p = 6;
  var mn = Math.min.apply(null, vals), mx = Math.max.apply(null, vals), rg = (mx - mn) || 1;
  var pts = vals.map(function (v, i) { return [p + i * (w - 2 * p) / (vals.length - 1), h - p - (v - mn) / rg * (h - 2 * p)]; });
  return '<svg viewBox="0 0 ' + w + ' ' + h + '" class="spark" preserveAspectRatio="none"><polyline points="' +
    pts.map(function (q) { return q[0].toFixed(1) + ',' + q[1].toFixed(1); }).join(' ') +
    '" fill="none" stroke="#4ade80" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>' +
    pts.map(function (q) { return '<circle cx="' + q[0].toFixed(1) + '" cy="' + q[1].toFixed(1) + '" r="3" fill="#4ade80"/>'; }).join('') + '</svg>';
}
function vCorpo() {
  var h = '<header><h1>Corpo</h1><p class="sub">Peso e medidas</p></header>';
  h += '<div class="card"><label style="margin-top:0">Data<input type="date" id="c-data" value="' + hoje() + '"></label>' +
    '<div class="grid2"><label>Peso (kg)<input id="c-peso" inputmode="decimal"></label><label>Cintura (cm)<input id="c-cintura" inputmode="decimal"></label>' +
    '<label>Braço (cm)<input id="c-braco" inputmode="decimal"></label><label>Coxa (cm)<input id="c-coxa" inputmode="decimal"></label></div>' +
    '<button class="btn block" data-act="salvar-corpo">Salvar medidas</button></div>';
  var asc = S.corpo.slice().sort(function (a, b) { return a.data < b.data ? -1 : a.data > b.data ? 1 : 0; });
  var pesos = asc.filter(function (c) { return num(c.peso) > 0; }).map(function (c) { return num(c.peso); });
  if (pesos.length >= 2) {
    h += '<div class="card"><div class="row"><h2>Peso</h2><span class="muted small">' + pesos[0] + ' → ' + pesos[pesos.length - 1] + ' kg</span></div>' + spark(pesos) + '</div>';
  }
  if (asc.length) {
    h += '<div class="card"><h2 style="margin-bottom:6px">Registros</h2>';
    asc.slice().reverse().forEach(function (c) {
      var partes = [];
      if (c.peso) partes.push(c.peso + ' kg');
      if (c.cintura) partes.push('cintura ' + c.cintura);
      if (c.braco) partes.push('braço ' + c.braco);
      if (c.coxa) partes.push('coxa ' + c.coxa);
      h += '<div class="item"><span><b>' + fmtData(c.data) + '</b><br><span class="muted small">' + esc(partes.join(' · ')) + '</span></span>' +
        '<span><span class="badge ' + (c.enviado ? 'ok' : 'pend') + '">' + (c.enviado ? 'enviado' : 'local') + '</span> ' +
        '<button class="ghost danger" data-act="del-corpo" data-id="' + c.id + '">✕</button></span></div>';
    });
    h += '</div>';
  }
  return h;
}

/* ---- histórico ---- */
function vHist() {
  var h = '<header><h1>Histórico</h1><p class="sub">' + S.logs.length + ' treino(s) registrado(s)</p></header>';
  if (!S.logs.length) return h + '<div class="card"><p class="muted">Nenhum treino finalizado ainda. Faça um treino e toque em “Finalizar e enviar”.</p></div>';
  S.logs.forEach(function (l) {
    var aberto = ui.expandido === l.id;
    h += '<div class="card"><div class="row" data-act="exp" data-id="' + l.id + '" style="cursor:pointer"><div><h2>' + esc(l.ficha) + '</h2>' +
      '<p class="muted small">' + fmtData(l.data) + ' · ' + nSeries(l) + ' séries · ' + volumeLog(l) + ' kg de volume</p></div>' +
      '<span class="badge ' + (l.enviado ? 'ok' : 'pend') + '">' + (l.enviado ? (l.semConfirmacao ? 'enviado' : 'enviado ✓') : 'pendente') + '</span></div>';
    if (aberto) {
      l.exercicios.forEach(function (e) {
        h += '<div class="exdet"><b>' + esc(e.nome) + '</b><span class="muted small">' + e.series.map(fmtSet).join(' · ') + '</span></div>';
      });
      if (l.obs) h += '<p class="muted small">Obs.: ' + esc(l.obs) + '</p>';
      h += '<div class="row gap">' + (!l.enviado ? '<button class="btn sm" data-act="reenviar" data-id="' + l.id + '">Enviar</button>' : '<button class="btn outline sm" data-act="reenviar" data-id="' + l.id + '">Reenviar</button>') +
        '<button class="ghost danger" data-act="del-log" data-id="' + l.id + '">Excluir</button></div>';
    }
    h += '</div>';
  });
  return h;
}

/* ---- ajustes ---- */
var SCRIPT_SHEETS =
"function doPost(e) {\n" +
"  var d = JSON.parse(e.postData.contents);\n" +
"  var ss = SpreadsheetApp.getActiveSpreadsheet();\n" +
"  if (d.tipo === 'treino') {\n" +
"    var sh = ss.getSheetByName('Treinos') || ss.insertSheet('Treinos');\n" +
"    d.linhas.forEach(function (l) {\n" +
"      sh.appendRow([l.data, l.ficha, l.exercicio, l.serie, l.carga, l.reps]);\n" +
"    });\n" +
"  } else if (d.tipo === 'corpo') {\n" +
"    var sc = ss.getSheetByName('Corpo') || ss.insertSheet('Corpo');\n" +
"    sc.appendRow([d.data, d.peso, d.cintura, d.braco, d.coxa]);\n" +
"  }\n" +
"  return ContentService.createTextOutput('ok');\n" +
"}";
/* ---- conta e nuvem (Firebase) ---- */
var FB_CONFIG = {
  apiKey: 'AIzaSyCrCNF3Weq-3I8nJWiaovlrLZq3VUoQa-I',
  authDomain: 'treino-app-92e27.firebaseapp.com',
  projectId: 'treino-app-92e27',
  storageBucket: 'treino-app-92e27.firebasestorage.app',
  messagingSenderId: '456944321673',
  appId: '1:456944321673:web:863e960b6d213cb5f03258'
};
var FB_VER = '10.12.2';
var nuvem = { auth: null, db: null, pronto: false, carregando: null, status: '', hashes: {}, timer: null, ocupado: false, pendente: false };

function carregarFirebase() {
  if (nuvem.carregando) return nuvem.carregando;
  function js(src) {
    return new Promise(function (ok, erro) {
      var s = document.createElement('script');
      s.src = src; s.onload = ok; s.onerror = function () { erro(new Error('offline')); };
      document.head.appendChild(s);
    });
  }
  var base = 'https://www.gstatic.com/firebasejs/' + FB_VER + '/firebase-';
  nuvem.carregando = js(base + 'app-compat.js')
    .then(function () { return Promise.all([js(base + 'auth-compat.js'), js(base + 'firestore-compat.js')]); })
    .then(function () {
      firebase.initializeApp(FB_CONFIG);
      nuvem.auth = firebase.auth();
      nuvem.db = firebase.firestore();
      nuvem.pronto = true;
      nuvem.auth.onAuthStateChanged(function (u) {
        if (u) {
          var outro = S.config.user && S.config.user.uid && S.config.user.uid !== u.uid;
          S.config.user = { uid: u.uid, email: u.email };
          save();
          puxar(outro).then(function () { if (tab === 'ajustes') render(); });
        } else if (S.config.user) {
          S.config.user = null; save(); if (tab === 'ajustes') render();
        }
      });
    })
    .catch(function (e) { nuvem.carregando = null; throw e; });
  return nuvem.carregando;
}

function msgAuth(e) {
  var m = {
    'auth/invalid-credential': 'E-mail ou senha incorretos',
    'auth/wrong-password': 'E-mail ou senha incorretos',
    'auth/user-not-found': 'E-mail ou senha incorretos',
    'auth/email-already-in-use': 'Este e-mail já tem conta. Use Entrar',
    'auth/weak-password': 'A senha precisa ter pelo menos 6 caracteres',
    'auth/invalid-email': 'E-mail inválido',
    'auth/missing-password': 'Digite a senha',
    'auth/too-many-requests': 'Muitas tentativas. Aguarde um pouco',
    'auth/network-request-failed': 'Sem conexão',
    'auth/operation-not-allowed': 'Login por e-mail não está ativado no Firebase'
  };
  return (e && m[e.code]) || (e && e.message === 'offline' ? 'Sem conexão' : 'Não foi possível concluir');
}
function acaoAuth(tipo) {
  var email = (($('#au-email') || {}).value || '').trim(), senha = ($('#au-senha') || {}).value || '';
  if (!email) { toast('Digite o e-mail'); return; }
  if (tipo !== 'reset' && !senha) { toast('Digite a senha'); return; }
  carregarFirebase().then(function () {
    if (tipo === 'entrar') return nuvem.auth.signInWithEmailAndPassword(email, senha).then(function () { toast('Login feito ✓'); });
    if (tipo === 'criar') return nuvem.auth.createUserWithEmailAndPassword(email, senha).then(function () { toast('Conta criada ✓'); });
    return nuvem.auth.sendPasswordResetEmail(email).then(function () { toast('E-mail de redefinição enviado'); });
  }).catch(function (e) { toast(msgAuth(e)); });
}
function sair() {
  if (nuvem.auth) nuvem.auth.signOut();
  S.config.user = null; save(); render();
}

function limpo(o) { return JSON.parse(JSON.stringify(o)); }
function docs(col) { return nuvem.db.collection('usuarios').doc(nuvem.auth.currentUser.uid).collection(col); }

async function puxar(substituir) {
  if (!nuvem.auth || !nuvem.auth.currentUser) return;
  nuvem.status = 'sincronizando…';
  try {
    var pf = await docs('dados').doc('perfil').get();
    var ls = await docs('logs').get(), cs = await docs('corpo').get();
    var rl = [], rc = [];
    ls.forEach(function (d) { rl.push(d.data()); });
    cs.forEach(function (d) { rc.push(d.data()); });
    if (pf.exists) {
      var p = pf.data();
      ['treinos', 'dietas'].forEach(function (k) { if (Array.isArray(p[k]) && p[k].length) S[k] = p[k]; });
      if (typeof p.tecnicas === 'string') S.tecnicas = p.tecnicas;
      if (p.dietaChecks && typeof p.dietaChecks === 'object') S.dietaChecks = p.dietaChecks;
      var mescla = function (loc, rem) {
        if (substituir) return rem;
        var ids = {}; rem.forEach(function (x) { ids[x.id] = 1; });
        return rem.concat(loc.filter(function (x) { return !ids[x.id]; }));
      };
      S.logs = mescla(S.logs, rl);
      S.corpo = mescla(S.corpo, rc);
      S.logs.sort(function (a, b) { return String(b.data).localeCompare(String(a.data)); });
      S = normalizar(S);
      try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {}
    }
    /* itens excluídos pelo painel desktop não podem voltar */
    var xs = await docs('excluidos').get(), morto = {}, achou = false;
    xs.forEach(function (d) { var x = d.data(); morto[x.col + '/' + x.id] = 1; });
    var vivo = function (col) { return function (x) { return !morto[col + '/' + x.id]; }; };
    if (S.logs.some(function (x) { return morto['logs/' + x.id]; }) || S.corpo.some(function (x) { return morto['corpo/' + x.id]; })) achou = true;
    S.logs = S.logs.filter(vivo('logs')); S.corpo = S.corpo.filter(vivo('corpo'));
    rl = rl.filter(vivo('logs')); rc = rc.filter(vivo('corpo'));
    if (achou) { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
    nuvem.hashes = {};
    rl.forEach(function (x) { nuvem.hashes['logs/' + x.id]= JSON.stringify(x); });
    rc.forEach(function (x) { nuvem.hashes['corpo/' + x.id] = JSON.stringify(x); });
    nuvem.hashes['dados/perfil'] = pf.exists ? '?' : '';
    await empurrar();
  } catch (e) { nuvem.status = 'falhou: ' + (e.code || e.message); }
}

function agendarSync() {
  if (!S.config.user) return;
  clearTimeout(nuvem.timer);
  nuvem.timer = setTimeout(function () {
    if (!nuvem.pronto) { carregarFirebase().catch(function () {}); return; }
    empurrar();
  }, 1500);
}

async function empurrar() {
  if (!nuvem.pronto || !nuvem.auth.currentUser) return;
  if (nuvem.ocupado) { nuvem.pendente = true; return; }
  nuvem.ocupado = true;
  try {
    var ops = [];
    var perfil = limpo({ treinos: S.treinos, dietas: S.dietas, tecnicas: S.tecnicas, dietaChecks: S.dietaChecks });
    var ph = JSON.stringify(perfil);
    if (nuvem.hashes['dados/perfil'] !== ph) ops.push({ ref: docs('dados').doc('perfil'), data: perfil, h: ph, k: 'dados/perfil' });
    [['logs', S.logs], ['corpo', S.corpo]].forEach(function (par) {
      var atuais = {};
      par[1].forEach(function (x) {
        var o = limpo(x); delete o.enviado;
        var k = par[0] + '/' + o.id, h = JSON.stringify(o);
        atuais[k] = 1;
        if (nuvem.hashes[k] !== h) ops.push({ ref: docs(par[0]).doc(String(o.id)), data: o, h: h, k: k });
      });
      Object.keys(nuvem.hashes).forEach(function (k) {
        if (k.indexOf(par[0] + '/') === 0 && !atuais[k]) ops.push({ ref: docs(par[0]).doc(k.slice(par[0].length + 1)), del: true, k: k });
      });
    });
    for (var i = 0; i < ops.length; i += 400) {
      var lote = ops.slice(i, i + 400), b = nuvem.db.batch();
      lote.forEach(function (o) { if (o.del) b.delete(o.ref); else b.set(o.ref, o.data); });
      await b.commit();
      lote.forEach(function (o) { if (o.del) delete nuvem.hashes[o.k]; else nuvem.hashes[o.k] = o.h; });
    }
    nuvem.status = 'sincronizado ✓ ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  } catch (e) { nuvem.status = 'falhou: ' + (e.code || e.message); }
  nuvem.ocupado = false;
  if (nuvem.pendente) { nuvem.pendente = false; empurrar(); }
  else if (tab === 'ajustes') { var el = $('#nv-status'); if (el) el.textContent = nuvem.status; }
}

function vConta() {
  var u = S.config.user;
  var h = '<div class="card"><h2>Conta e nuvem</h2>';
  if (u) {
    h += '<p><b>' + esc(u.email) + '</b></p>' +
      '<p class="muted small">Seus treinos, fichas, dieta e medidas são salvos na nuvem e sincronizam entre aparelhos. <span id="nv-status">' + esc(nuvem.status) + '</span></p>' +
      '<div class="row gap"><button class="btn sm" data-act="au-sync">Sincronizar agora</button><button class="btn outline sm" data-act="au-sair">Sair</button></div>';
  } else {
    h += '<p class="muted small">Entre para guardar seus dados na nuvem e não perdê-los se trocar de aparelho.</p>' +
      '<label>E-mail<input id="au-email" type="email" autocomplete="username" inputmode="email" value="higor@treino.com"></label>' +
      '<label>Senha<input id="au-senha" type="password" autocomplete="current-password"></label>' +
      '<div class="row gap"><button class="btn sm" data-act="au-entrar">Entrar</button></div>';
  }
  return h + '</div>';
}

function vAjustes() {
  var pend = S.logs.filter(function (l) { return !l.enviado; }).length + S.corpo.filter(function (c) { return !c.enviado; }).length;
  return '<header><h1>Ajustes</h1></header>' + vConta() +
    '<div class="card"><h2>Envio dos dados</h2>' +
    '<p class="muted small">Ao finalizar um treino (ou salvar medidas) o app envia os dados em JSON (POST) para esta URL: Google Sheets, Make, Zapier, Supabase, seu próprio servidor…</p>' +
    '<label>URL de envio<input id="cfg-url" type="url" inputmode="url" placeholder="https://..." value="' + esc(S.config.webhook) + '"></label>' +
    '<label>Cabeçalhos (JSON, opcional)<textarea id="cfg-headers" rows="2" placeholder=\'{"apikey":"..."}\'>' + esc(S.config.headers) + '</textarea></label>' +
    '<div class="row gap"><button class="btn sm" data-act="test-hook">Testar envio</button>' +
    '<button class="btn outline sm" data-act="enviar-pend">Enviar pendentes (' + pend + ')</button></div></div>' +
    '<div class="card"><h2>Banco de dados no Google Sheets</h2>' +
    '<p class="muted small">Grátis e sem servidor: cada série vira uma linha numa planilha sua.</p>' +
    '<details><summary>Ver passo a passo e script</summary>' +
    '<ol class="muted small" style="padding-left:18px"><li>Crie uma planilha no Google Sheets.</li><li>Extensões → Apps Script, apague o código e cole o script abaixo.</li>' +
    '<li>Implantar → Nova implantação → Tipo: App da Web. Executar como: eu. Quem tem acesso: qualquer pessoa.</li><li>Copie a URL gerada e cole em “URL de envio”.</li></ol>' +
    '<pre>' + esc(SCRIPT_SHEETS) + '</pre><button class="btn outline sm" data-act="copy-script">Copiar script</button></details></div>' +
    '<div class="card"><h2>Técnicas do treino</h2><label style="margin-top:6px">Texto exibido na aba Treino<textarea id="cfg-tec" rows="6">' + esc(S.tecnicas) + '</textarea></label></div>' +
    '<div class="card"><h2>Backup</h2><p class="muted small">Seus dados ficam salvos neste aparelho. Faça backup de vez em quando.</p>' +
    '<div class="row gap"><button class="btn sm" data-act="export">Exportar</button><button class="btn outline sm" data-act="copy-backup">Copiar</button>' +
    '<button class="btn outline sm" data-act="import">Importar</button></div></div>' +
    '<div class="card"><button class="ghost danger" data-act="reset">Apagar todos os dados</button></div>';
}

/* ================= editor de fichas ================= */
function parseTreino(txt, antigos) {
  return txt.replace(/\r/g, '').split('\n').map(function (l) { return l.trim(); }).filter(Boolean).map(function (l) {
    var m = l.match(/^(.*?)\s*[-–]\s*(?:[-–]\s*)?(\d+)\s*[xX×]\s*(.+)$/);
    var nome = m ? m[1].trim() : l, series = m ? parseInt(m[2], 10) : 3, reps = m ? m[3].trim() : '10';
    var velho = antigos.find(function (e) { return e.nome === nome; });
    return { id: velho ? velho.id : uid(), nome: nome, series: Math.max(1, Math.min(series, 12)), reps: reps };
  });
}
function parseDieta(txt, antigas) {
  return txt.replace(/\r/g, '').split(/\n\s*\n/).map(function (b) {
    return b.split('\n').map(function (x) { return x.trim(); }).filter(Boolean);
  }).filter(function (b) { return b.length; }).map(function (b) {
    var velha = antigas.find(function (r) { return r.nome === b[0]; });
    return { id: velha ? velha.id : uid(), nome: b[0], itens: b.slice(1) };
  });
}
function abrirEditor(tipo, id) {
  var nome = '', txt = '', novo = !id;
  if (tipo === 'treino') {
    var t = S.treinos.find(function (x) { return x.id === id; });
    if (t) { nome = t.nome; txt = t.exercicios.map(function (e) { return e.nome + ' - ' + e.series + ' x ' + e.reps; }).join('\n'); }
  } else {
    var d = S.dietas.find(function (x) { return x.id === id; });
    if (d) { nome = d.nome; txt = d.refeicoes.map(function (r) { return [r.nome].concat(r.itens).join('\n'); }).join('\n\n'); }
  }
  var dica = tipo === 'treino'
    ? 'Um exercício por linha: Nome - séries x repetições. Ex.: Supino reto - 4 x 8 a 12'
    : 'Separe as refeições por uma linha em branco. A 1ª linha de cada bloco é o nome da refeição; as outras são os itens.';
  ui.editor = { tipo: tipo, id: id || null };
  abrirSheet('<h2>' + (novo ? 'Nova' : 'Editar') + ' ficha de ' + tipo + '</h2>' +
    '<label>Nome<input id="ed-nome" value="' + esc(nome) + '" placeholder="' + (tipo === 'treino' ? 'Treino 4' : 'Dieta 2') + '"></label>' +
    '<label>' + (tipo === 'treino' ? 'Exercícios' : 'Refeições') + '<textarea id="ed-txt" rows="12">' + esc(txt) + '</textarea></label>' +
    '<p class="muted small">' + dica + '</p>' +
    '<button class="btn block" data-act="ed-save">Salvar</button>' +
    '<div class="row"><button class="ghost" data-act="ed-cancel">Cancelar</button>' +
    (novo ? '' : '<button class="ghost" data-act="ed-dup">Duplicar</button><button class="ghost danger" data-act="ed-del">Excluir</button>') + '</div>');
}
function salvarEditor() {
  var ed = ui.editor; if (!ed) return;
  var nome = $('#ed-nome').value.trim(), txt = $('#ed-txt').value;
  if (!nome) { toast('Dê um nome para a ficha'); return; }
  if (ed.tipo === 'treino') {
    var t = S.treinos.find(function (x) { return x.id === ed.id; });
    var lista = parseTreino(txt, t ? t.exercicios : []);
    if (!lista.length) { toast('Adicione ao menos um exercício'); return; }
    if (t) { t.nome = nome; t.exercicios = lista; } else S.treinos.push({ id: uid(), nome: nome, exercicios: lista });
  } else {
    var d = S.dietas.find(function (x) { return x.id === ed.id; });
    var refs = parseDieta(txt, d ? d.refeicoes : []);
    if (!refs.length) { toast('Adicione ao menos uma refeição'); return; }
    if (d) { d.nome = nome; d.refeicoes = refs; }
    else { var nd = { id: uid(), nome: nome, refeicoes: refs }; S.dietas.push(nd); S.config.dietaId = nd.id; }
  }
  save(); fechar(); render(); toast('Ficha salva ✓');
}
function duplicarEditor() {
  var ed = ui.editor; if (!ed || !ed.id) return;
  if (ed.tipo === 'treino') {
    var t = S.treinos.find(function (x) { return x.id === ed.id; });
    S.treinos.push({ id: uid(), nome: t.nome + ' (cópia)', exercicios: t.exercicios.map(function (e) { return { id: uid(), nome: e.nome, series: e.series, reps: e.reps }; }) });
  } else {
    var d = S.dietas.find(function (x) { return x.id === ed.id; });
    var nd = { id: uid(), nome: d.nome + ' (cópia)', refeicoes: d.refeicoes.map(function (r) { return { id: uid(), nome: r.nome, itens: r.itens.slice() }; }) };
    S.dietas.push(nd); S.config.dietaId = nd.id;
  }
  save(); fechar(); render(); toast('Ficha duplicada ✓');
}
function excluirEditor() {
  var ed = ui.editor; if (!ed || !ed.id) return;
  var tipo = ed.tipo, id = ed.id;
  confirmar('Excluir esta ficha?', function () {
    if (tipo === 'treino') {
      S.treinos = S.treinos.filter(function (x) { return x.id !== id; });
      if (S.rascunho && S.rascunho.treinoId === id) { S.rascunho = null; ui.sessao = false; }
    } else {
      S.dietas = S.dietas.filter(function (x) { return x.id !== id; });
      if (S.config.dietaId === id) S.config.dietaId = S.dietas[0] ? S.dietas[0].id : null;
    }
    save(); fechar(); render(); toast('Ficha excluída');
  }, 'Excluir');
}

/* ================= ações ================= */
function iniciar(id) {
  var t = S.treinos.find(function (x) { return x.id === id; });
  if (!t) return;
  function go() {
    if (!S.rascunho || S.rascunho.treinoId !== id) {
      S.rascunho = { treinoId: id, nome: t.nome, data: hoje(), inicio: new Date().toISOString(), obs: '',
        exercicios: t.exercicios.map(function (e) {
          var sets = [];
          for (var k = 0; k < e.series; k++) sets.push({ carga: '', reps: '', ok: false });
          return { nome: e.nome, series: e.series, reps: e.reps, sets: sets };
        }) };
    }
    ui.sessao = true; save(); render(); window.scrollTo(0, 0);
  }
  if (S.rascunho && S.rascunho.treinoId !== id) {
    confirmar('Há um treino em andamento (' + S.rascunho.nome + '). Descartar e iniciar este?', function () { S.rascunho = null; fechar(); go(); }, 'Descartar e iniciar');
  } else go();
}
async function finalizar() {
  var r = S.rascunho; if (!r) return;
  var exs = r.exercicios.map(function (e) {
    return { nome: e.nome, series: e.sets.filter(function (s) { return String(s.carga).trim() || String(s.reps).trim(); })
      .map(function (s) { return { carga: String(s.carga).trim(), reps: String(s.reps).trim() }; }) };
  }).filter(function (e) { return e.series.length; });
  if (!exs.length) { toast('Preencha ao menos uma série'); return; }
  var log = { id: uid(), tipo: 'treino', data: r.data, inicio: r.inicio, fim: new Date().toISOString(),
    treinoId: r.treinoId, ficha: r.nome, exercicios: exs, obs: r.obs || '', enviado: false };
  S.logs.unshift(log); S.rascunho = null; ui.sessao = false; ui.expandido = log.id; save();
  tab = 'hist'; render(); window.scrollTo(0, 0);
  var res = await enviar(payloadLog(log));
  if (res.ok) { log.enviado = true; log.semConfirmacao = !!res.semConfirmacao; save(); toast('Treino salvo e enviado ✓'); }
  else if (res.motivo === 'sem-url') toast('Treino salvo ✓ (configure a URL de envio em Ajustes)');
  else toast('Treino salvo. Envio pendente: ' + res.motivo);
  render();
}
async function salvarCorpo() {
  var c = { id: uid(), data: $('#c-data').value || hoje(), peso: $('#c-peso').value.trim(), cintura: $('#c-cintura').value.trim(),
    braco: $('#c-braco').value.trim(), coxa: $('#c-coxa').value.trim(), enviado: false };
  if (!c.peso && !c.cintura && !c.braco && !c.coxa) { toast('Preencha ao menos um campo'); return; }
  S.corpo.push(c); save(); render();
  var res = await enviar(payloadCorpo(c));
  if (res.ok) { c.enviado = true; save(); toast('Medidas salvas e enviadas ✓'); }
  else if (res.motivo === 'sem-url') toast('Medidas salvas ✓');
  else toast('Salvo. Envio pendente: ' + res.motivo);
  render();
}
async function exportar() {
  var txt = JSON.stringify(S, null, 2), nome = 'backup-treino-' + hoje() + '.json';
  try {
    var f = new File([txt], nome, { type: 'application/json' });
    if (navigator.canShare && navigator.canShare({ files: [f] })) { await navigator.share({ files: [f], title: nome }); return; }
  } catch (e) { if (e && e.name === 'AbortError') return; }
  try {
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([txt], { type: 'application/json' }));
    a.download = nome; document.body.appendChild(a); a.click(); a.remove();
    toast('Backup baixado');
  } catch (e) { copiar(txt); }
}
function abrirImport() {
  abrirSheet('<h2>Importar backup</h2><label>Arquivo<input type="file" id="imp-file" accept=".json,application/json"></label>' +
    '<label>ou cole o conteúdo<textarea id="imp-txt" rows="6"></textarea></label>' +
    '<p class="muted small">Isso substitui os dados atuais.</p>' +
    '<button class="btn block" data-act="imp-go">Importar</button><button class="ghost block" data-act="conf-nao">Cancelar</button>');
}

/* ================= eventos ================= */
document.addEventListener('click', async function (ev) {
  var tb = ev.target.closest('#tabs button');
  if (tb) { tab = tb.dataset.tab; window.scrollTo(0, 0); render(); return; }
  if (ev.target.id === 'sheet') { fechar(); return; }
  var b = ev.target.closest('[data-act]'); if (!b) return;
  var a = b.dataset.act, id = b.dataset.id, i = +b.dataset.i, j = +b.dataset.j;
  switch (a) {
    case 'iniciar': iniciar(id); break;
    case 'retomar': ui.sessao = true; render(); window.scrollTo(0, 0); break;
    case 'voltar': ui.sessao = false; render(); break;
    case 'edit-treino': abrirEditor('treino', id); break;
    case 'novo-treino': abrirEditor('treino', null); break;
    case 'edit-dieta': abrirEditor('dieta', id); break;
    case 'nova-dieta': abrirEditor('dieta', null); break;
    case 'ok': var s = S.rascunho.exercicios[i].sets[j]; s.ok = !s.ok; save(); render(); break;
    case 'add-set': S.rascunho.exercicios[i].sets.push({ carga: '', reps: '', ok: false }); save(); render(); break;
    case 'rem-set': if (S.rascunho.exercicios[i].sets.length > 1) { S.rascunho.exercicios[i].sets.pop(); save(); render(); } break;
    case 'finalizar': finalizar(); break;
    case 'descartar': confirmar('Descartar este treino sem salvar?', function () { S.rascunho = null; ui.sessao = false; save(); fechar(); render(); }, 'Descartar'); break;
    case 'chip-dieta': S.config.dietaId = id; save(); render(); break;
    case 'salvar-corpo': salvarCorpo(); break;
    case 'del-corpo': S.corpo = S.corpo.filter(function (c) { return c.id !== id; }); save(); render(); break;
    case 'exp': ui.expandido = ui.expandido === id ? null : id; render(); break;
    case 'reenviar':
      var l = S.logs.find(function (x) { return x.id === id; }); if (!l) break;
      var r = await enviar(payloadLog(l));
      if (r.ok) { l.enviado = true; l.semConfirmacao = !!r.semConfirmacao; save(); toast('Enviado ✓'); }
      else toast(r.motivo === 'sem-url' ? 'Configure a URL de envio em Ajustes' : 'Falhou: ' + r.motivo);
      render(); break;
    case 'del-log':
      confirmar('Excluir este treino do histórico?', function () { S.logs = S.logs.filter(function (x) { return x.id !== id; }); save(); fechar(); render(); }, 'Excluir'); break;
    case 'test-hook':
      var t = await enviar({ tipo: 'teste', data: hoje(), mensagem: 'Teste do app de treino' });
      toast(t.ok ? (t.semConfirmacao ? 'Teste disparado (o servidor não confirma neste modo)' : 'Teste enviado ✓') : (t.motivo === 'sem-url' ? 'Informe a URL primeiro' : 'Falhou: ' + t.motivo)); break;
    case 'enviar-pend': enviarPendentes(); break;
    case 'copy-script': copiar(SCRIPT_SHEETS); break;
    case 'au-entrar': acaoAuth('entrar'); break;
    case 'au-sair': sair(); break;
    case 'au-sync': nuvem.status = 'sincronizando…'; render(); puxar(false).then(function () { render(); }); break;
    case 'export': exportar(); break;
    case 'copy-backup': copiar(JSON.stringify(S, null, 2)); break;
    case 'import': abrirImport(); break;
    case 'imp-go':
      try {
        var novo = JSON.parse($('#imp-txt').value);
        if (!novo || !Array.isArray(novo.treinos)) throw new Error('formato');
        S = normalizar(novo); save(); fechar(); ui.sessao = false; render(); toast('Backup importado ✓');
      } catch (e) { toast('Backup inválido'); }
      break;
    case 'reset':
      confirmar('Apagar TODOS os dados deste aparelho?', function () { S = normalizar(seed()); save(); ui.sessao = false; fechar(); render(); toast('Dados apagados'); }, 'Apagar tudo'); break;
    case 'ed-save': salvarEditor(); break;
    case 'ed-cancel': fechar(); break;
    case 'ed-dup': duplicarEditor(); break;
    case 'ed-del': excluirEditor(); break;
    case 'conf-sim': var cb = confirmCb; confirmCb = null; if (cb) cb(); break;
    case 'conf-nao': confirmCb = null; fechar(); break;
  }
});

document.addEventListener('input', function (ev) {
  var t = ev.target;
  if (!t.dataset || !t.dataset.f || !S.rascunho) return;
  if (t.dataset.f === 'obs') { S.rascunho.obs = t.value; save(); return; }
  if (t.dataset.i !== undefined) {
    S.rascunho.exercicios[+t.dataset.i].sets[+t.dataset.j][t.dataset.f] = t.value;
    save();
  }
});

document.addEventListener('change', function (ev) {
  var t = ev.target;
  if (t.id === 'cfg-url') { S.config.webhook = t.value.trim(); save(); }
  else if (t.id === 'cfg-headers') { S.config.headers = t.value.trim(); save(); }
  else if (t.id === 'cfg-tec') { S.tecnicas = t.value; save(); }
  else if (t.id === 'imp-file' && t.files && t.files[0]) {
    var fr = new FileReader();
    fr.onload = function () { $('#imp-txt').value = fr.result; };
    fr.readAsText(t.files[0]);
  }
});

/* ================= início ================= */
load();
render();
if (S.config.user && navigator.onLine) carregarFirebase().catch(function () {});
if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
  window.addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () {}); });
}
})();
