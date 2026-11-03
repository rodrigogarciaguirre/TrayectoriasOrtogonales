/* ==========================================================
   INTERFAZ · pantalla completa, modo proyector, ayuda,
   atajos y estado offline.
   ========================================================== */
(function () {

  var $ = function (id) { return document.getElementById(id); };

  function entrarPantallaCompleta() {
    var raiz = document.documentElement;
    if (raiz.requestFullscreen) {
      var p = raiz.requestFullscreen();
      if (p && p.catch) p.catch(function () {});
    }
  }

  function salirPantallaCompleta() {
    if (document.exitFullscreen) {
      var p = document.exitFullscreen();
      if (p && p.catch) p.catch(function () {});
    }
  }

  function redimensionarDiferido() {
    [60, 250, 500, 900].forEach(function (ms) {
      setTimeout(function () { Simulador.redimensionar(); }, ms);
    });
  }

  /* ---------- 1) PANTALLA COMPLETA ---------- */
  var bPantalla = $('bPantalla');

  function alternarPantalla() {
    if (!document.fullscreenElement) entrarPantallaCompleta();
    else salirPantallaCompleta();
  }

  if (bPantalla) bPantalla.addEventListener('click', alternarPantalla);

  /* ---------- 2) MODO PROYECTOR ---------- */
  var bProyector = $('bProyector');
  var bProyectorSim = $('bProyectorSim');

  function proyectorActivo() {
    return document.body.classList.contains('modo-proyector');
  }

  function actualizarBotonesProyector(activo) {
    if (bProyector) bProyector.textContent = activo ? 'Salir del proyector' : '⛶ Modo Proyector';
    if (bProyectorSim) bProyectorSim.textContent = activo ? '✕ Salir del proyector' : '⛶ Modo Proyector';
  }

  function desactivarProyector() {
    if (!proyectorActivo()) return;
    document.body.classList.remove('modo-proyector');
    actualizarBotonesProyector(false);
    redimensionarDiferido();
  }

  function alternarProyector() {
    var activo = !proyectorActivo();
    document.body.classList.toggle('modo-proyector', activo);
    actualizarBotonesProyector(activo);

    if (activo) {
      // El modo proyector siempre muestra la simulación.
      if (typeof Pestanas !== 'undefined') Pestanas.abrir('simulador');
      if (!document.fullscreenElement) entrarPantallaCompleta();
    } else if (document.fullscreenElement) {
      salirPantallaCompleta();
    }
    redimensionarDiferido();
  }

  if (bProyector) bProyector.addEventListener('click', alternarProyector);
  if (bProyectorSim) bProyectorSim.addEventListener('click', alternarProyector);

  document.addEventListener('fullscreenchange', function () {
    if (!document.fullscreenElement && proyectorActivo()) desactivarProyector();
    redimensionarDiferido();
  });

  /* ---------- 3) AYUDA ---------- */
  var modal = $('modalAyuda');
  var bAyuda = $('bAyuda');
  var bCerrar = $('bCerrarAyuda');

  function abrirAyuda() { if (modal) modal.hidden = false; }
  function cerrarAyuda() { if (modal) modal.hidden = true; }

  if (bAyuda) bAyuda.addEventListener('click', function () {
    modal && modal.hidden ? abrirAyuda() : cerrarAyuda();
  });
  if (bCerrar) bCerrar.addEventListener('click', cerrarAyuda);
  if (modal) {
    modal.addEventListener('click', function (e) {
      if (e.target === modal) cerrarAyuda();
    });
  }

  /* ---------- 4) ATAJOS DE TECLADO ---------- */
  var orden = ['metodo', 'simulador', 'aplicaciones'];

  document.addEventListener('keydown', function (e) {
    var t = e.target;
    var tag = t ? t.tagName : '';
    var tipo = t ? (t.type || '') : '';
    var texto = ['text', 'number', 'search', 'email', 'password', 'tel', 'url'];
    var escribiendo = t && (tag === 'TEXTAREA' || tag === 'SELECT' || t.isContentEditable ||
                            (tag === 'INPUT' && texto.indexOf(tipo) !== -1));
    if (escribiendo) return;

    var tecla = e.key;

    if (tecla === 'Escape') {
      cerrarAyuda();
      desactivarProyector();
      return;
    }

    if (tecla === '1' || tecla === '2' || tecla === '3') {
      var destino = orden[parseInt(tecla, 10) - 1];
      if (destino) Pestanas.abrir(destino);
      e.preventDefault();
      return;
    }

    if (tecla === 'p' || tecla === 'P') { alternarProyector(); e.preventDefault(); return; }
    if (tecla === 'f' || tecla === 'F') { alternarPantalla(); e.preventDefault(); return; }
    if (tecla === '?' || tecla === 'h' || tecla === 'H') {
      modal && modal.hidden ? abrirAyuda() : cerrarAyuda();
      e.preventDefault();
      return;
    }

    if (Pestanas.actual() === 'metodo') {
      if (tecla === 'ArrowRight') { Metodo.siguiente(); e.preventDefault(); }
      if (tecla === 'ArrowLeft') { Metodo.anterior(); e.preventDefault(); }
    }
  });

  /* ---------- 5) ESTADO DE LAS LIBRERÍAS LOCALES ---------- */
  function comprobarLibrerias() {
    var estado = $('estadoLibs');
    if (!estado) return;

    var intentos = 0;
    var vigilancia = setInterval(function () {
      intentos++;
      var okJXG = typeof JXG !== 'undefined';
      var okMath = !!(window.MathJax && (MathJax.typesetPromise || MathJax.startup));

      if (okJXG && okMath) {
        clearInterval(vigilancia);
        estado.textContent = 'Librerías locales listas · funciona sin internet';
        estado.classList.add('lista');
      } else if (intentos >= 20) {
        clearInterval(vigilancia);
        estado.textContent = (okJXG || okMath)
          ? 'Una librería local no cargó · revisa la carpeta libs/'
          : 'No se detectaron las librerías · revisa la carpeta libs/';
        estado.classList.add('error');
      }
    }, 250);
  }

  window.addEventListener('load', comprobarLibrerias);
})();
