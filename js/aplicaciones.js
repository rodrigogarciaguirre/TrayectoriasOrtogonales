/* ==========================================================
   APLICACIONES · animaciones e interacción de las tarjetas
   ========================================================== */
(function () {

  function todos(sel, ctx) {
    return Array.prototype.slice.call((ctx || document).querySelectorAll(sel));
  }

  /* ---------- 1) CAMPO ELÉCTRICO: arrastrar la carga ---------- */
  todos('.app-card[data-app="electrico"]').forEach(function (card) {
    var svg = card.querySelector('svg');
    var grupo = card.querySelector('.campo-grupo');
    var zona = card.querySelector('.zona-carga');
    if (!svg || !grupo || !zona) return;

    var tx = 0, ty = 0;
    var arrastrando = false;
    var inicioX = 0, inicioY = 0, baseX = 0, baseY = 0;

    function puntoSVG(e) {
      var p = svg.createSVGPoint();
      p.x = e.clientX;
      p.y = e.clientY;
      var m = svg.getScreenCTM();
      return m ? p.matrixTransform(m.inverse()) : p;
    }

    function aplicar() {
      grupo.setAttribute('transform', 'translate(' + tx.toFixed(2) + ',' + ty.toFixed(2) + ')');
    }

    zona.addEventListener('pointerdown', function (e) {
      arrastrando = true;
      var p = puntoSVG(e);
      inicioX = p.x; inicioY = p.y;
      baseX = tx; baseY = ty;
      if (zona.setPointerCapture) {
        try { zona.setPointerCapture(e.pointerId); } catch (err) {}
      }
      e.preventDefault();
    });

    zona.addEventListener('pointermove', function (e) {
      if (!arrastrando) return;
      var p = puntoSVG(e);
      tx = Math.max(-70, Math.min(70, baseX + (p.x - inicioX)));
      ty = Math.max(-40, Math.min(40, baseY + (p.y - inicioY)));
      aplicar();
      e.preventDefault();
    });

    function soltar(e) {
      if (!arrastrando) return;
      arrastrando = false;
      if (zona.releasePointerCapture) {
        try { zona.releasePointerCapture(e.pointerId); } catch (err) {}
      }
    }

    zona.addEventListener('pointerup', soltar);
    zona.addEventListener('pointercancel', soltar);

    zona.addEventListener('dblclick', function () {
      tx = 0; ty = 0;
      aplicar();
    });
  });

  /* ---------- 2) FLUIDOS: control de velocidad ---------- */
  todos('.app-slider').forEach(function (slider) {
    var card = slider.closest('.app-card');
    var salida = card ? card.querySelector('.app-slider-out') : null;

    function aplicarVelocidad() {
      var v = parseFloat(slider.value) || 1;
      if (card) card.style.setProperty('--dur', (2 / v).toFixed(2) + 's');
      if (salida) salida.textContent = v.toFixed(1) + '×';
    }

    slider.addEventListener('input', aplicarVelocidad);
    aplicarVelocidad();
  });

  /* ---------- 3) RELIEVE: mostrar u ocultar el gradiente ---------- */
  todos('[data-accion="gradiente"]').forEach(function (boton) {
    boton.addEventListener('click', function () {
      var card = boton.closest('.app-card');
      if (!card) return;
      var activo = card.classList.toggle('mostrar-grad');
      boton.setAttribute('aria-pressed', activo ? 'true' : 'false');
      boton.textContent = activo ? 'Ocultar gradiente' : 'Mostrar gradiente';
    });
  });

  /* ---------- 4) CALOR: invertir la dirección del flujo ---------- */
  todos('[data-accion="invertir-calor"]').forEach(function (boton) {
    boton.addEventListener('click', function () {
      var card = boton.closest('.app-card');
      if (!card) return;
      var activo = card.classList.toggle('invertido');
      boton.setAttribute('aria-pressed', activo ? 'true' : 'false');
      boton.textContent = activo ? 'Restaurar calor' : 'Invertir calor';

      var caliente = card.querySelector('.et-caliente');
      var frio = card.querySelector('.et-frio');
      if (caliente && frio) {
        caliente.textContent = activo ? 'Frío' : 'Caliente';
        frio.textContent = activo ? 'Caliente' : 'Frío';
      }
    });
  });

})();
