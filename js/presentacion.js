/* ==========================================================
   INTERFAZ · pantalla completa, ayuda, atajos y estado offline
   ========================================================== */
(function () {

  var $ = function (id) { return document.getElementById(id); };

  /* ---------- 1) PANTALLA COMPLETA ---------- */
  var bPantalla = $('bPantalla');

  function alternarPantalla() {
    var raiz = document.documentElement;
    if (!document.fullscreenElement) {
      if (raiz.requestFullscreen) raiz.requestFullscreen().catch(function () {});
    } else if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  }

  if (bPantalla) bPantalla.addEventListener('click', alternarPantalla);
  document.addEventListener('fullscreenchange', function () {
    setTimeout(function () { Simulador.redimensionar(); }, 200);
  });

  /* ---------- 2) AYUDA ---------- */
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

  /* ---------- 3) ATAJOS DE TECLADO ---------- */
  var orden = ['metodo', 'simulador', 'aplicaciones', 'reto'];

  document.addEventListener('keydown', function (e) {
    var t = e.target;
    var tag = t ? t.tagName : '';
    var tipo = t ? (t.type || '') : '';
    var texto = ['text', 'number', 'search', 'email', 'password', 'tel', 'url'];
    var escribiendo = t && (tag === 'TEXTAREA' || tag === 'SELECT' || t.isContentEditable ||
                            (tag === 'INPUT' && texto.indexOf(tipo) !== -1));
    if (escribiendo) return;

    var tecla = e.key;

    if (tecla === 'Escape') { cerrarAyuda(); return; }

    if (tecla === '1' || tecla === '2' || tecla === '3' || tecla === '4') {
      Pestanas.abrir(orden[parseInt(tecla, 10) - 1]);
      e.preventDefault();
      return;
    }

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

  /* ---------- 4) ESTADO DE LAS LIBRERÍAS LOCALES ---------- */
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
