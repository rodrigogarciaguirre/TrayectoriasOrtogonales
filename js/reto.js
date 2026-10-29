/* ==========================================================
   RETO · preguntas de opción múltiple con corrección inmediata
   ========================================================== */
var Reto = (function () {

  var preguntas = Array.prototype.slice.call(document.querySelectorAll('.pregunta'));
  var puntaje = document.getElementById('quizPuntaje');
  var bReiniciar = document.getElementById('quizReiniciar');
  var total = preguntas.length;
  var acertadas = 0;
  var respondidas = 0;

  function actualizarPuntaje() {
    if (!puntaje) return;
    if (respondidas === total) {
      var mensaje = acertadas === total ? ' · ¡Perfecto!' :
                    acertadas >= total - 1 ? ' · ¡Muy bien!' : ' · Repasa el método';
      puntaje.textContent = acertadas + ' / ' + total + ' correctas' + mensaje;
    } else {
      puntaje.textContent = acertadas + ' / ' + total + ' correctas';
    }
  }

  function responder(pregunta, elegida) {
    if (pregunta.dataset.respondida === 'si') return;
    pregunta.dataset.respondida = 'si';

    var correcta = parseInt(pregunta.dataset.correcta, 10);
    var botones = pregunta.querySelectorAll('.opciones button');
    var explicacion = pregunta.querySelector('.explicacion');

    botones.forEach(function (b) {
      b.disabled = true;
      var i = parseInt(b.dataset.op, 10);
      if (i === correcta) b.classList.add('correcta');
      if (b === elegida && i !== correcta) b.classList.add('incorrecta');
    });

    if (parseInt(elegida.dataset.op, 10) === correcta) acertadas++;
    respondidas++;

    if (explicacion) explicacion.hidden = false;
    actualizarPuntaje();
  }

  preguntas.forEach(function (pregunta) {
    var botones = pregunta.querySelectorAll('.opciones button');
    botones.forEach(function (boton) {
      boton.addEventListener('click', function () { responder(pregunta, boton); });
    });
  });

  function reiniciar() {
    acertadas = 0;
    respondidas = 0;
    preguntas.forEach(function (pregunta) {
      delete pregunta.dataset.respondida;
      pregunta.querySelectorAll('.opciones button').forEach(function (b) {
        b.disabled = false;
        b.classList.remove('correcta', 'incorrecta');
      });
      var explicacion = pregunta.querySelector('.explicacion');
      if (explicacion) explicacion.hidden = true;
    });
    actualizarPuntaje();
  }

  if (bReiniciar) bReiniciar.addEventListener('click', reiniciar);

  actualizarPuntaje();

  return { reiniciar: reiniciar };
})();
