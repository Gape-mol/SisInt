const EntornoTrafico = (function () {
  // posibles valores de cada variable del estado
  const FLUJOS = ['bajo', 'medio', 'alto'];
  const PATRONES = ['normal', 'irregular'];
  const INCIDENTES = ['ninguno', 'exceso', 'contraflujo', 'bloqueo'];

  // acciones que puede ejecutar el agente
  const ACCIONES = ['normal', 'alerta_leve', 'alerta_critica', 'emergencia'];

  // severidad asociada a cada tipo de incidente
  const SEVERIDAD_POR_INCIDENTE = {
    ninguno: 0,
    exceso: 1,
    contraflujo: 2,
    bloqueo: 3,
  };

  // crea un estado a partir de sus tres variables
  function crearEstado(flujo, patron, incidente) {
    return { flujo, patron, incidente };
  }

  // clave unica de un estado para usar en la tabla Q
  function claveEstado(estado) {
    return `${estado.flujo}|${estado.patron}|${estado.incidente}`;
  }

  // devuelve la severidad esperada para un estado
  function severidad(estado) {
    return SEVERIDAD_POR_INCIDENTE[estado.incidente];
  }

  // calcula la recompensa de una accion ante un estado
  function recompensa(estado, accion) {
    const s = severidad(estado);
    const diff = Math.abs(accion - s);

    if (diff === 0) return 2;
    if (diff === 1) return -1;
    return -3;
  }

  // genera un estado aleatorio
  function estadoAleatorio() {
    const flujo = FLUJOS[Math.floor(Math.random() * FLUJOS.length)];
    const patron = PATRONES[Math.floor(Math.random() * PATRONES.length)];
    const incidente = INCIDENTES[Math.floor(Math.random() * INCIDENTES.length)];
    return crearEstado(flujo, patron, incidente);
  }

  // genera todos los estados posibles (3 x 2 x 4 = 24)
  function todosLosEstados() {
    const estados = [];
    for (const flujo of FLUJOS) {
      for (const patron of PATRONES) {
        for (const incidente of INCIDENTES) {
          estados.push(crearEstado(flujo, patron, incidente));
        }
      }
    }
    return estados;
  }

  return {
    FLUJOS,
    PATRONES,
    INCIDENTES,
    ACCIONES,
    claveEstado,
    recompensa,
    severidad,
    estadoAleatorio,
    todosLosEstados,
  };
})();

// expone el entorno como variable global para otros scripts
window.EntornoTrafico = EntornoTrafico;