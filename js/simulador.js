/* ==========================================================
   SIMULADOR · gráfico JSXGraph + controles interactivos
   Matemática: rectas y = cx  y  circunferencias x² + y² = k.
   El tablero se crea una sola vez, al abrir la pestaña.
   ========================================================== */
var Simulador = (function () {

  /* ---------- 1) ESTADO ---------- */
  var C_MIN = -5, C_MAX = 5;
  var K_MIN = 1, K_MAX = 25;
  var c = 1;        // pendiente de la recta resaltada
  var k = 3;        // constante de la circunferencia resaltada
  var R = 8;        // el plano muestra de -R a R

  var board = null;
  var familia = [];
  var tangentes = [];
  var recta = null;
  var circunferencia = null;
  var punto = null;
  var cuadrado = null;
  var etiqueta90 = null;
  var iniciado = false;
  var timerC = null, dirC = 1;

  var $ = function (id) { return document.getElementById(id); };

  /* ---------- 2) FÓRMULAS ---------- */
  function radio() { return Math.sqrt(k); }
  function angulo() { return Math.atan(c); }
  function xP() { return radio() * Math.cos(angulo()); }
  function yP() { return radio() * Math.sin(angulo()); }
  function m1() { return c; }
  function m2() { return -xP() / yP(); }

  function normalizarC(v) {
    if (!isFinite(v)) v = 1;
    v = Math.max(C_MIN, Math.min(C_MAX, v));
    if (Math.abs(v) < 0.05) v = v < 0 ? -0.1 : 0.1;
    return v;
  }

  function unit(m) {
    var n = Math.sqrt(1 + m * m);
    return [1 / n, m / n];
  }

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
      zoom: { wheel: true, needShift: false },
      defaultAxes: {
        x: {
          strokeColor: '#7d8ea8',
          ticks: { strokeColor: '#475569', label: { color: '#9fb0c7', fontSize: 10 } }
        },
        y: {
          strokeColor: '#7d8ea8',
          ticks: { strokeColor: '#475569', label: { color: '#9fb0c7', fontSize: 10 } }
        }
      }
    });
    estilizarEjes();
  }

  // Refuerzo por si la versión local de JSXGraph no aplica defaultAxes.
  function estilizarEjes() {
    if (!board || !board.defaultAxes) return;
    ['x', 'y'].forEach(function (eje) {
      var a = board.defaultAxes[eje];
      if (!a) return;
      a.setAttribute({ strokeColor: '#7d8ea8' });
      if (a.ticks) {
        a.ticks.forEach(function (t) {
          try {
            t.setAttribute({ strokeColor: '#475569' });
            if (t.label) t.label.setAttribute({ color: '#9fb0c7' });
          } catch (e) { /* sin etiqueta */ }
        });
      }
    });
  }

  // Familias tenues de fondo
  function crearFamilias() {
    [-5, -3, -2, -1.5, -1, -0.5, 0.5, 1.5, 2, 3, 5].forEach(function (cc) {
      familia.push(board.create('functiongraph', [function (x) { return cc * x; }],
        { strokeColor: '#22d3ee', strokeOpacity: 0.14, strokeWidth: 1.3, highlight: false, fixed: true }));
    });

    [1.5, 2.5, 3.5, 4.5, 5.5, 6.5].forEach(function (rr) {
      familia.push(board.create('curve', [
        function (t) { return rr * Math.cos(t); },
        function (t) { return rr * Math.sin(t); },
        0, 2 * Math.PI
      ], { strokeColor: '#f472b6', strokeOpacity: 0.14, strokeWidth: 1.3, highlight: false, fixed: true }));
    });
  }

  // Curvas resaltadas
  function crearCurvasPrincipales() {
    recta = board.create('functiongraph', [function (x) { return c * x; }],
      { strokeColor: '#22d3ee', strokeWidth: 4, highlight: false, fixed: true });

    circunferencia = board.create('curve', [
      function (t) { return Math.sqrt(k) * Math.cos(t); },
      function (t) { return Math.sqrt(k) * Math.sin(t); },
      0, 2 * Math.PI
    ], { strokeColor: '#f472b6', strokeWidth: 4, highlight: false, fixed: true });
  }

  // Punto P en la intersección, tangentes y cuadrado de 90°
  function crearPunto() {
    punto = board.create('point', [xP(), yP()], {
      name: 'P', size: 7, color: '#f8fafc', strokeColor: '#22d3ee', strokeWidth: 3,
      showInfobox: false,
      label: { offset: [12, -18], fontSize: 16, color: '#e6edf7' }
    });

    // Al arrastrar P, se mantiene sobre la circunferencia y actualiza la recta.
    punto.on('drag', function () {
      var ang = Math.atan2(punto.Y(), punto.X());
      if (Math.cos(ang) < 0) ang = Math.atan2(-punto.Y(), -punto.X());
      var maxAng = Math.atan(C_MAX);
      ang = Math.max(-maxAng, Math.min(maxAng, ang));

      var vc = Math.round(Math.tan(ang) * 10) / 10;
      if (Math.abs(vc) < 0.05) vc = c < 0 ? -0.1 : 0.1;
      c = normalizarC(vc);

      $('sc').value = c.toFixed(1);
      marcarPersonalizado();

      var a = angulo(), r = radio();
      punto.setPosition(JXG.COORDS_BY_USER, [r * Math.cos(a), r * Math.sin(a)]);
      refrescar();
      board.update();
    });

    var L = 3.2;
    [m1, m2].forEach(function (m) {
      tangentes.push(board.create('segment', [
        [function () { return xP() - L * unit(m())[0]; }, function () { return yP() - L * unit(m())[1]; }],
        [function () { return xP() + L * unit(m())[0]; }, function () { return yP() + L * unit(m())[1]; }]
      ], {
        strokeColor: '#34d399', strokeWidth: 2, dash: 2,
        highlight: false, fixed: true, withLabel: false
      }));
    });

    var s = 0.5;
    var a = function () { return unit(m1()); };
    var b = function () { var u = unit(m2()); return [-u[0], -u[1]]; };
    cuadrado = board.create('polygon', [
      [function () { return xP(); }, yP],
      [function () { return xP() + s * a()[0]; }, function () { return yP() + s * a()[1]; }],
      [function () { return xP() + s * (a()[0] + b()[0]); }, function () { return yP() + s * (a()[1] + b()[1]); }],
      [function () { return xP() + s * b()[0]; }, function () { return yP() + s * b()[1]; }]
    ], {
      fillColor: '#34d399', fillOpacity: 0.22,
      borders: { strokeColor: '#34d399', strokeWidth: 1.5 },
      vertices: { visible: false }, highlight: false, fixed: true
    });

    etiqueta90 = board.create('text', [
      function () { var d = bisector(); return xP() + 0.78 * d[0]; },
      function () { var d = bisector(); return yP() + 0.78 * d[1]; },
      '90°'
    ], {
      fontSize: 14, color: '#6ee7b7', fixed: true, highlight: false,
      cssStyle: 'font-weight:700'
    });
  }

  /* ---------- 4) INTERFAZ ---------- */
  function f2(v) { return v.toFixed(2); }

  function textRecta() {
    if (Math.abs(c - 1) < 1e-9) return 'y = x';
    if (Math.abs(c + 1) < 1e-9) return 'y = −x';
    return 'y = ' + c.toFixed(1) + '·x';
  }

  // Solo actualiza los textos y los valores; no toca sliders ni el punto.
  function refrescar() {
    $('vc').textContent = c.toFixed(1);
    $('vk').textContent = k.toFixed(1);
    $('eqRecta').textContent = textRecta();
    $('eqCirc').textContent = 'x² + y² = ' + f2(k);
    $('puntoInfo').textContent = 'P = (' + f2(xP()) + ', ' + f2(yP()) + ')';

    $('m1').textContent = f2(m1());
    $('m2').textContent = f2(m2());

    var prod = m1() * m2();
    $('mp').textContent = f2(prod);

    var u1 = unit(m1()), u2 = unit(m2());
    var cos = Math.min(1, Math.abs(u1[0] * u2[0] + u1[1] * u2[1]));
    $('ang').textContent = (Math.acos(cos) * 180 / Math.PI).toFixed(2) + '°';

    var ok = Math.abs(prod + 1) < 1e-6;
    var estado = $('estadoOrt');
    estado.textContent = ok
      ? 'Producto = −1 (90° exactos)'
      : 'Producto ≈ ' + f2(prod) + ': revisa los valores.';
    estado.classList.toggle('alerta', !ok);
  }

  // Lee sliders, sincroniza el punto y redibuja
  function actualizar() {
    c = normalizarC(parseFloat($('sc').value));
    k = Math.max(K_MIN, Math.min(K_MAX, parseFloat($('sk').value)));

    $('sc').value = c.toFixed(1);
    $('sk').value = k.toFixed(1);

    if (punto) {
      var a = angulo(), r = radio();
      try {
        punto.setPosition(JXG.COORDS_BY_USER, [r * Math.cos(a), r * Math.sin(a)]);
      } catch (e) { /* el punto se recoloca en el siguiente update */ }
    }
    refrescar();
    if (board) board.update();
  }

  function marcarPersonalizado() {
    var sel = $('selBase');
    if (sel) sel.value = 'personalizado';
  }

  function aplicarBase() {
    c = 1;
    k = 3;
    $('sc').value = '1.0';
    $('sk').value = '3.0';
    $('selBase').value = 'base';

    if (iniciado && punto) {
      var a = angulo(), r = radio();
      punto.setPosition(JXG.COORDS_BY_USER, [r * Math.cos(a), r * Math.sin(a)]);
      refrescar();
      board.update();
    }
  }

  function pararAnimacion() {
    if (timerC) { clearInterval(timerC); timerC = null; }
    var b = $('bAnim');
    if (b) b.textContent = '▶ Animar c';
  }

  function conectarControles() {
    $('sc').addEventListener('input', function () {
      marcarPersonalizado();
      actualizar();
    });

    $('sk').addEventListener('input', function () {
      marcarPersonalizado();
      actualizar();
    });

    $('selBase').addEventListener('change', function () {
      if (this.value === 'base') aplicarBase();
    });

    $('cFam').addEventListener('change', function () {
      var ver = this.checked;
      familia.forEach(function (o) { ver ? o.show() : o.hide(); });
      board.update();
    });

    $('cTan').addEventListener('change', function () {
      var ver = this.checked;
      tangentes.forEach(function (o) { ver ? o.show() : o.hide(); });
      ver ? cuadrado.show() : cuadrado.hide();
      board.update();
    });

    $('cAng').addEventListener('change', function () {
      this.checked ? etiqueta90.show() : etiqueta90.hide();
      board.update();
    });

    $('bAnim').addEventListener('click', function () {
      if (timerC) { pararAnimacion(); return; }
      this.textContent = '⏸ Pausar c';
      timerC = setInterval(function () {
        var v = parseFloat($('sc').value) + dirC * 0.1;
        if (v > C_MAX) { v = C_MAX; dirC = -1; }
        if (v < C_MIN) { v = C_MIN; dirC = 1; }
        if (Math.abs(v) < 0.05) v = dirC > 0 ? 0.1 : -0.1;
        $('sc').value = v.toFixed(1);
        marcarPersonalizado();
        actualizar();
      }, 140);
    });

    $('bReset').addEventListener('click', reiniciar);
  }

  function reiniciar() {
    pararAnimacion();
    dirC = 1;
    aplicarBase();

    $('cFam').checked = true;
    familia.forEach(function (o) { o.show(); });

    $('cTan').checked = true;
    tangentes.forEach(function (o) { o.show(); });
    cuadrado.show();

    $('cAng').checked = true;
    etiqueta90.show();

    actualizar();
  }

  /* ---------- 5) API PÚBLICA ---------- */
  return {
    iniciar: function () {
      if (iniciado) return;
      iniciado = true;

      if (typeof JXG === 'undefined') {
        var caja = $('box');
        if (caja) caja.innerHTML = '<p style="padding:20px;color:#f9a8d4">No se pudo cargar JSXGraph. Revisa la carpeta <code>libs/</code>.</p>';
        return;
      }

      crearTablero();
      crearFamilias();
      crearCurvasPrincipales();
      crearPunto();
      conectarControles();
      actualizar();
    },
    redimensionar: function () {
      if (!iniciado || !board) return;
      var el = $('box');
      if (!el) return;
      board.resizeContainer(el.clientWidth, el.clientHeight, true);
    },
    detenerAnimaciones: pararAnimacion,
    reiniciar: reiniciar,
    cargarBase: aplicarBase
  };
})();
