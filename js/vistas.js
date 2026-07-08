const Vistas = (function () {
  let contenedor = null;

  // referencia al contenedor donde se renderizan las vistas
  function inicializar(idContenedor) {
    contenedor = document.getElementById(idContenedor);
  }

  // capitaliza y reemplaza guiones bajos por espacios
  function formatearAccion(nombre) {
    return nombre
      .replace(/_/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());
  }

  // convierte un valor Q a un color de fondo tipo heatmap (rojo -> amarillo -> verde)
  function colorCelda(valor, min, max) {
    if (!Number.isFinite(valor) || min === max) {
      return { fondo: '#f8f9fa', texto: '#333333' };
    }

    const t = Math.max(0, Math.min(1, (valor - min) / (max - min)));
    const matiz = Math.round(120 * t);
    const fondo = `hsl(${matiz}, 75%, 88%)`;
    const texto = t < 0.35 || t > 0.75 ? '#1a1a1a' : '#333333';
    return { fondo, texto };
  }

  // renderiza la tabla Q completa (24 estados x 4 acciones)
  function renderizarQTable(agente) {
    if (!contenedor) return;

    const estados = EntornoTrafico.todosLosEstados();
    const acciones = EntornoTrafico.ACCIONES;

    // recopila todos los valores Q para normalizar el heatmap
    let min = Infinity;
    let max = -Infinity;
    const valores = estados.map(estado => {
      const clave = EntornoTrafico.claveEstado(estado);
      return acciones.map((_, a) => {
        const q = agente.getQ(clave, a);
        min = Math.min(min, q);
        max = Math.max(max, q);
        return q;
      });
    });

    // evita rango nulo cuando todo es cero
    if (min === Infinity) {
      min = 0;
      max = 0;
    }

    const tabla = document.createElement('table');
    tabla.className = 'q-table';
    tabla.setAttribute('aria-label', 'Tabla Q del agente');

    const thead = document.createElement('thead');
    const filaCabecera = document.createElement('tr');
    filaCabecera.appendChild(document.createElement('th')).textContent = 'Estado';
    acciones.forEach(nombre => {
      const th = document.createElement('th');
      th.textContent = formatearAccion(nombre);
      filaCabecera.appendChild(th);
    });
    thead.appendChild(filaCabecera);
    tabla.appendChild(thead);

    const tbody = document.createElement('tbody');
    estados.forEach((estado, i) => {
      const clave = EntornoTrafico.claveEstado(estado);
      const filaValores = valores[i];
      const mejorValor = Math.max(...filaValores);

      const fila = document.createElement('tr');

      const celdaEstado = document.createElement('td');
      celdaEstado.className = 'q-estado';
      celdaEstado.textContent = clave.replace(/\|/g, ' · ');
      celdaEstado.title = `Flujo: ${estado.flujo}, Patrón: ${estado.patron}, Incidente: ${estado.incidente}`;
      fila.appendChild(celdaEstado);

      filaValores.forEach((q, a) => {
        const celda = document.createElement('td');
        const { fondo, texto } = colorCelda(q, min, max);
        celda.style.backgroundColor = fondo;
        celda.style.color = texto;
        celda.textContent = Number.isFinite(q) ? q.toFixed(2) : '0.00';

        if (q === mejorValor && acciones.length > 1) {
          celda.classList.add('mejor-accion');
          celda.setAttribute('aria-label', `${formatearAccion(acciones[a])}, valor ${celda.textContent}, mejor acción`);
        } else {
          celda.setAttribute('aria-label', `${formatearAccion(acciones[a])}, valor ${celda.textContent}`);
        }

        fila.appendChild(celda);
      });

      tbody.appendChild(fila);
    });

    tabla.appendChild(tbody);

    contenedor.innerHTML = '';
    contenedor.appendChild(tabla);
  }

  // limpia el contenedor de visualizaciones
  function limpiar() {
    if (!contenedor) return;
    contenedor.innerHTML = '<p class="q-table-vacia">Entrena el agente para ver la tabla Q.</p>';
  }

  return {
    inicializar,
    renderizarQTable,
    limpiar,
  };
})();

window.Vistas = Vistas;
