/* ==========================================================
   PESTAÑAS · navegación entre las tres secciones
   ========================================================== */
var Pestanas = (function () {

  var botones = Array.prototype.slice.call(document.querySelectorAll('.pestanas button'));
  var paneles = Array.prototype.slice.call(document.querySelectorAll('.panel-tab'));
  var actual = 'metodo';

  function existe(nombre) {
    return paneles.some(function (p) { return p.id === 'tab-' + nombre; });
  }

  function abrir(nombre, sinHash) {
    if (!existe(nombre)) nombre = 'metodo';
    actual = nombre;

    botones.forEach(function (b) {
      var activa = b.dataset.tab === nombre;
      b.classList.toggle('activa', activa);
      b.setAttribute('aria-selected', activa ? 'true' : 'false');
    });

    paneles.forEach(function (p) {
      p.classList.toggle('visible', p.id === 'tab-' + nombre);
    });

    if (!sinHash && window.history && history.replaceState) {
      history.replaceState(null, '', '#' + nombre);
    }
    if (!sinHash) window.scrollTo({ top: 0, behavior: 'smooth' });

    if (nombre === 'simulador') {
      // El gráfico se crea la primera vez que se ve la pestaña
      // (si se creara oculto, JSXGraph mediría 0 px de ancho).
      Simulador.iniciar();
      setTimeout(function () { Simulador.redimensionar(); }, 60);
    } else {
      Simulador.detenerAnimaciones();
    }
  }

  botones.forEach(function (b) {
    b.addEventListener('click', function () { abrir(b.dataset.tab); });
  });

  window.addEventListener('resize', function () { Simulador.redimensionar(); });

  window.addEventListener('hashchange', function () {
    var nombre = (location.hash || '').replace('#', '');
    if (nombre && nombre !== actual) abrir(nombre, true);
  });

  var inicial = (location.hash || '').replace('#', '');
  abrir(existe(inicial) ? inicial : 'metodo', true);

  return {
    abrir: abrir,
    actual: function () { return actual; }
  };
})();
