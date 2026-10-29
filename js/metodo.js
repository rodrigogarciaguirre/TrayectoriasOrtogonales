/* ==========================================================
   MÉTODO · paso a paso de la pestaña 1
   Estados: 0 (inicio), 1, 2 y 3 pasos revelados.
   ========================================================== */
var Metodo = (function () {

  var pasos = [
    document.getElementById('paso1'),
    document.getElementById('paso2'),
    document.getElementById('paso3')
  ];
  var chips = Array.prototype.slice.call(document.querySelectorAll('.paso-chip'));
  var barra = document.getElementById('barraProgreso');
  var contador = document.getElementById('contadorPasos');
  var bSiguiente = document.getElementById('bSiguiente');
  var bAnterior = document.getElementById('bAnterior');
  var bReiniciar = document.getElementById('bReiniciar');

  var actual = 0;

  function escribirMath() {
    if (window.MathJax && MathJax.typesetPromise && actual > 0) {
      MathJax.typesetPromise(pasos.slice(0, actual)).catch(function () {});
    }
  }

  function pintar() {
    pasos.forEach(function (div, i) {
      div.classList.toggle('visible', i < actual);
    });

    chips.forEach(function (chip, i) {
      chip.classList.toggle('activa', i < actual);
      chip.classList.toggle('hecha', i < actual - 1);
    });

    if (barra) barra.style.width = (actual / pasos.length * 100) + '%';
    if (contador) contador.textContent = 'Paso ' + actual + ' de ' + pasos.length;

    if (bAnterior) bAnterior.disabled = actual === 0;
    if (bSiguiente) {
      bSiguiente.textContent = actual >= pasos.length ? 'Método completo ✓' : 'Siguiente paso →';
      bSiguiente.disabled = actual >= pasos.length;
    }

    escribirMath();
  }

  function ir(n) {
    actual = Math.max(0, Math.min(pasos.length, n));
    pintar();
    if (actual > 0) {
      var destino = pasos[actual - 1];
      if (destino && destino.scrollIntoView) {
        destino.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }

  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      ir(parseInt(chip.dataset.paso, 10));
    });
  });

  if (bSiguiente) bSiguiente.addEventListener('click', function () { ir(actual + 1); });
  if (bAnterior) bAnterior.addEventListener('click', function () { ir(actual - 1); });
  if (bReiniciar) bReiniciar.addEventListener('click', function () { ir(0); });

  pintar();

  return {
    ir: ir,
    siguiente: function () { ir(actual + 1); },
    anterior: function () { ir(actual - 1); },
    actual: function () { return actual; }
  };
})();
