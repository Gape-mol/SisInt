class QLearningAgent {
  // inicializa los hiperparametros y la tabla Q vacia
  constructor({ alpha = 0.5, gamma = 0.9, epsilon = 1.0, epsilonMin = 0.1, epsilonDecay = 0.995, acciones = [] } = {}) {
    this.alpha = alpha;
    this.gamma = gamma;
    this.epsilon = epsilon;
    this.epsilonMin = epsilonMin;
    this.epsilonDecay = epsilonDecay;
    this.acciones = acciones;
    this.q = new Map();
  }

  // clave interna para un par estado-accion
  _claveQ(estadoClave, accion) {
    return `${estadoClave}::${accion}`;
  }

  // obtiene el valor Q de un par estado-accion
  getQ(estadoClave, accion) {
    return this.q.get(this._claveQ(estadoClave, accion)) || 0;
  }

  // asigna un valor Q a un par estado-accion
  setQ(estadoClave, accion, valor) {
    this.q.set(this._claveQ(estadoClave, accion), valor);
  }

  // elige una accion usando epsilon-greedy
  elegirAccion(estadoClave) {
    if (Math.random() < this.epsilon) {
      return Math.floor(Math.random() * this.acciones.length);
    }
    return this.mejorAccion(estadoClave);
  }

  // devuelve la accion con mayor valor Q para un estado
  mejorAccion(estadoClave) {
    let mejorValor = -Infinity;
    let mejoresAcciones = [];

    for (let accion = 0; accion < this.acciones.length; accion++) {
      const valor = this.getQ(estadoClave, accion);
      if (valor > mejorValor) {
        mejorValor = valor;
        mejoresAcciones = [accion];
      } else if (valor === mejorValor) {
        mejoresAcciones.push(accion);
      }
    }

    if (mejoresAcciones.length === 0) {
      return Math.floor(Math.random() * this.acciones.length);
    }

    return mejoresAcciones[Math.floor(Math.random() * mejoresAcciones.length)];
  }

  // actualiza Q(s,a) tras observar recompensa y siguiente estado
  actualizar(estadoClave, accion, recompensa, siguienteEstadoClave) {
    const qActual = this.getQ(estadoClave, accion);
    const maxQSiguiente = this.mejorAccionValor(siguienteEstadoClave);
    const nuevoValor = qActual + this.alpha * (recompensa + this.gamma * maxQSiguiente - qActual);
    this.setQ(estadoClave, accion, nuevoValor);
  }

  // mayor valor Q disponible desde un estado
  mejorAccionValor(estadoClave) {
    let mejor = -Infinity;
    for (let accion = 0; accion < this.acciones.length; accion++) {
      const valor = this.getQ(estadoClave, accion);
      if (valor > mejor) mejor = valor;
    }
    return mejor === -Infinity ? 0 : mejor;
  }

  // reduce epsilon tras cada episodio
  decaerEpsilon() {
    this.epsilon = Math.max(this.epsilonMin, this.epsilon * this.epsilonDecay);
  }
}

// expone el agente como variable global para otros scripts
window.QLearningAgent = QLearningAgent;