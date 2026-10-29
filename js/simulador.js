/* ==========================================================
   SIMULADOR · gráfico JSXGraph + controles interactivos
   Matemática: parábolas y = kx²  y  elipses x² + 2y² = C
   El tablero se crea una sola vez, al abrir la pestaña.
   ========================================================== */
var Simulador = (function () {

  /* ---------- 1) ESTADO ---------- */
  var k = 0.5;      // parámetro de la parábola
  var x0 = 1.2;     // abscisa del punto P
  var YMAX = 5;     // altura máxima de P
  var R = 8;        // el plano muestra de -R a R

  var board = null;
  var familia = [];
  var parabola = null;
  var punto = null;
  var flechas = [];
  var etiqueta90 = null;
  var iniciado = false;
  var visibles = true;
  var timerK = null, dirK = 1;
  var timerP = null, dirP = 1;

  var $ = function (id) { return document.getElementById(id); };

  /* ---------- 2) FÓRMULAS ---------- */
  function yP() { return k * x0 * x0; }
  function C() { return x0 * x0 + 2 * yP() * yP(); }
  function m1() { return 2 * k * x0; }
  function m2() { return -1 / (2 * k * x0); }
  function xmaxActual() { return Math.min(3, Math.sqrt(YMAX / k)); }

  function unit(m) {
    var n = Math.sqrt(1 + m * m);
    return [1 / n, m / n];
  }
  function normalizado(v) {
    var n = Math.hypot(v[0], v[1]) || 1;
    return [v[0] / n, v[1] / n];
  }
  function gradF() { return [-2 * k * x0, 1]; }
  function gradG() { return [2 * x0, 4 * yP()]; }

  // Bisectriz del ángulo recto: sirve para colocar la etiqueta "90°"
  function bisector() {
    var a = unit(m1());
    var u = unit(m2());
    var b = [-u[0], -u[1]];
    var bx = a[0] + b[0], by = a[1] + b[1];
    var n = Math.hypot(bx, by) || 1;
    return [bx / n, by / n];
  }

  /* ---------- 3) GRÁFICO ---------- */
  function crearTablero() {
    board = JXG.JSXGraph.initBoard('box', {
      boundingbox: [-R, R, R, -R],
      axis: true,
      keepAspectRatio: true,
      showCopyright: false,
      showNavigation: false,
      zoom: { wheel: true, needShift: false }
    });
  }

  // Familias tenues de fondo
  function crearFamilias() {
    [0.1, 0.25, 0.5, 1, 1.5].forEach(function (kk) {
      familia.push(board.create('functiongraph', [function (x) { return kk * x * x; }],
        { strokeColor: '#1f5fd6', strokeOpacity: 0.2, strokeWidth: 1.5, highlight: false, fixed: true }));
    });
    [2, 3, 4, 5, 6, 7].forEach(function (a) {
      familia.push(board.create('curve', [
        function (t) { return a * Math.cos(t); },
        function (t) { return a / Math.SQRT2 * Math.sin(t); },
        0, 2 * Math.PI
      ], { strokeColor: '#d93a3a', strokeOpacity: 0.2, strokeWidth: 1.5, highlight: false, fixed: true }));
    });
  }

  // Curvas resaltadas
  function crearCurvasPrincipales() {
    parabola = board.create('functiongraph', [function (x) { return k * x * x; }],
      { strokeColor: '#1f5fd6', strokeWidth: 4, highlight: false, fixed: true });

    board.create('curve', [
      function (t) { return Math.sqrt(C()) * Math.cos(t); },
      function (t) { return Math.sqrt(C() / 2) * Math.sin(t); },
      0, 2 * Math.PI
    ], { strokeColor: '#d93a3a', strokeWidth: 4, highlight: false, fixed: true });
  }

  // Punto P (se puede arrastrar sobre la parábola), tangentes y cuadrado de 90°
  function crearPunto() {
    punto = board.create('glider', [x0, yP(), parabola], {
      name: 'P', size: 6, color: '#14213d', showInfobox: false,
      label: { offset: [12, -18], fontSize: 16, color: '#14213d' }
    });

    punto.on('drag', function () {
      var xmax = xmaxActual();
      x0 = Math.min(xmax, Math.max(0.3, punto.X()));
      $('sx').max = xmax.toFixed(2);
      $('sx').value = x0.toFixed(2);
      refrescar();
      board.update();
    });

    var L = 3.2;
    [m1, m2].forEach(function (m) {
      board.create('segment', [
        [function () { return x0 - L * unit(m())[0]; }, function () { return yP() - L * unit(m())[1]; }],
        [function () { return x0 + L * unit(m())[0]; }, function () { return yP() + L * unit(m())[1]; }]
      ], { strokeColor: '#1a9a5b', strokeWidth: 2, dash: 2, highlight: false, fixed: true, withLabel: false });
    });

    var s = 0.45;
    var a = function () { return unit(m1()); };
    var b = function () { var u = unit(m2()); return [-u[0], -u[1]]; };
    board.create('polygon', [
      [function () { return x0; }, yP],
      [function () { return x0 + s * a()[0]; }, function () { return yP() + s * a()[1]; }],
      [function () { return x0 + s * (a()[0] + b()[0]); }, function () { return yP() + s * (a()[1] + b()[1]); }],
      [function () { return x0 + s * b()[0]; }, function () { return yP() + s * b()[1]; }]
    ], {
      fillColor: '#1a9a5b', fillOpacity: 0.25,
      borders: { strokeColor: '#1a9a5b', strokeWidth: 1.5 },
      vertices: { visible: false }, highlight: false, fixed: true
    });

    etiqueta90 = board.create('text', [
      function () { var d = bisector(); return x0 + 0.68 * d[0]; },
      function () { var d = bisector(); return yP() + 0.68 * d[1]; },
      '90°'
    ], {
      fontSize: 13, color: '#1a9a5b', fixed: true, highlight: false,
      cssStyle: 'font-weight:700; text-shadow:0 1px 0 #fff'
    });
  }

  // Flechas de los gradientes + sus etiquetas (ocultas al inicio)
  function crearGradientes() {
    [[gradF, '#1f5fd6', '∇F'], [gradG, '#d93a3a', '∇G']].forEach(function (par) {
      var g = par[0], color = par[1], nombre = par[2];
      flechas.push(board.create('segment', [
        [function () { return x0; }, yP],
        [function () { return x0 + 2.2 * normalizado(g())[0]; },
         function () { return yP() + 2.2 * normalizado(g())[1]; }]
      ], {
        strokeColor: color, strokeWidth: 4,
        lastArrow: { type: 2, size: 8 },
        visible: false, highlight: false, fixed: true, withLabel: false
      }));

      flechas.push(board.create('text', [
        function () { return x0 + 2.45 * normalizado(g())[0]; },
        function () { return yP() + 2.45 * normalizado(g())[1]; },
        nombre
      ], {
        fontSize: 12, color: color, visible: false, fixed: true, highlight: false,
        cssStyle: 'font-weight:700'
      }));
    });
  }

  /* ---------- 4) INTERFAZ ---------- */
  function f2(v) { return v.toFixed(2); }

  // Solo actualiza los textos y los valores; no toca sliders ni el glider
  function refrescar() {
    $('vk').textContent = f2(k);
    $('vx').textContent = f2(x0);
    $('eqPar').textContent = 'y = ' + f2(k) + '·x²';
    $('eqEli').textContent = 'x² + 2y² = ' + f2(C());

    $('m1').textContent = f2(m1());
    $('m2').textContent = f2(m2());

    var prod = m1() * m2();
    $('mp').textContent = f2(prod);

    var gf = gradF(), gg = gradG();
    var dot = gf[0] * gg[0] + gf[1] * gg[1];
    $('gp').textContent = Math.abs(dot) < 1e-9 ? '0.00' : f2(dot);

    var u1 = unit(m1()), u2 = unit(m2());
    var cos = Math.min(1, Math.abs(u1[0] * u2[0] + u1[1] * u2[1]));
    $('ang').textContent = (Math.acos(cos) * 180 / Math.PI).toFixed(2) + '°';

    var ok = Math.abs(prod + 1) < 0.01;
    var estado = $('estadoOrt');
    estado.textContent = ok
      ? 'Producto = −1: las curvas son perpendiculares.'
      : 'Producto ≈ ' + f2(prod) + ': revisa los valores.';
    estado.classList.toggle('alerta', !ok);
  }

  // Lee sliders, sincroniza el glider y redibuja
  function actualizar() {
    k = parseFloat($('sk').value);
    var xmax = xmaxActual();
    $('sx').max = xmax.toFixed(2);
    if (parseFloat($('sx').value) > xmax) $('sx').value = xmax.toFixed(2);
    x0 = parseFloat($('sx').value);

    if (punto) {
      try {
        punto.setPosition(JXG.COORDS_BY_USER, [x0, yP()]);
      } catch (e) { /* si falla, el glider se recoloca al redibujar */ }
    }
    refrescar();
    board.update();
  }

  function pararAnimacionK() {
    if (timerK) { clearInterval(timerK); timerK = null; }
    $('bAnim').textContent = '▶ Animar k';
  }
  function pararRecorrido() {
    if (timerP) { clearInterval(timerP); timerP = null; }
    $('bRecorrer').textContent = '▶ Recorrer P';
  }

  function conectarControles() {
    $('sk').addEventListener('input', actualizar);
    $('sx').addEventListener('input', actualizar);

    $('cGrad').addEventListener('change', function () {
      var ver = this.checked;
      flechas.forEach(function (f) { ver ? f.show() : f.hide(); });
      board.update();
    });

    $('cAng').addEventListener('change', function () {
      this.checked ? etiqueta90.show() : etiqueta90.hide();
      board.update();
    });

    $('bFam').addEventListener('click', function () {
      visibles = !visibles;
      familia.forEach(function (o) { visibles ? o.show() : o.hide(); });
      this.textContent = visibles ? 'Ocultar familias' : 'Mostrar familias';
      this.setAttribute('aria-pressed', visibles);
      board.update();
    });

    $('bAnim').addEventListener('click', function () {
      if (timerK) { pararAnimacionK(); return; }
      pararRecorrido();
      this.textContent = '⏸ Pausar k';
      timerK = setInterval(function () {
        var v = parseFloat($('sk').value) + dirK * 0.01;
        if (v >= 1.5) { v = 1.5; dirK = -1; }
        if (v <= 0.1) { v = 0.1; dirK = 1; }
        $('sk').value = v.toFixed(2);
        actualizar();
      }, 30);
    });

    $('bRecorrer').addEventListener('click', function () {
      if (timerP) { pararRecorrido(); return; }
      pararAnimacionK();
      this.textContent = '⏸ Pausar P';
      timerP = setInterval(function () {
        var max = parseFloat($('sx').max);
        var v = parseFloat($('sx').value) + dirP * 0.02;
        if (v >= max) { v = max; dirP = -1; }
        if (v <= 0.3) { v = 0.3; dirP = 1; }
        $('sx').value = v.toFixed(2);
        actualizar();
      }, 40);
    });

    $('bReset').addEventListener('click', reiniciar);
  }

  function reiniciar() {
    pararAnimacionK();
    pararRecorrido();
    dirK = 1; dirP = 1;
    $('sk').value = '0.5';
    $('sx').value = '1.2';
    $('cGrad').checked = false;
    $('cAng').checked = true;
    flechas.forEach(function (f) { f.hide(); });
    etiqueta90.show();
    visibles = true;
    familia.forEach(function (o) { o.show(); });
    $('bFam').textContent = 'Ocultar familias';
    $('bFam').setAttribute('aria-pressed', 'true');
    actualizar();
  }

  /* ---------- 5) API PÚBLICA ---------- */
  return {
    iniciar: function () {
      if (iniciado) return;
      iniciado = true;

      if (typeof JXG === 'undefined') {
        var caja = $('box');
        if (caja) caja.innerHTML = '<p style="padding:20px;color:#8b1e1e">No se pudo cargar JSXGraph. Revisa la carpeta <code>libs/</code>.</p>';
        return;
      }

      crearTablero();
      crearFamilias();
      crearCurvasPrincipales();
      crearPunto();
      crearGradientes();
      conectarControles();
      actualizar();
    },
    redimensionar: function () {
      if (!iniciado || !board) return;
      var el = $('box');
      if (!el) return;
      board.resizeContainer(el.clientWidth, el.clientHeight, true);
    },
    detenerAnimaciones: function () {
      pararAnimacionK();
      pararRecorrido();
    },
    reiniciar: reiniciar
  };
})();
