/**
 * Quiz — Motor de evaluación reutilizable
 * ------------------------------------------------------------
 * Requiere en el HTML los siguientes contenedores:
 *   #pantalla-inicio, #pantalla-pregunta, #pantalla-resultado
 * y un array global `preguntas` (ver data.js).
 */
class Quiz {
    /**
     * @param {Object} opciones
     * @param {Pregunta[]} opciones.bancoPreguntas
     * @param {number} [opciones.numPreguntas=10]
     * @param {number} [opciones.porcentajeAprobacion=80]
     * @param {string} [opciones.claveAlmacenamiento="skechers_quiz_mejor_puntaje"]
     */
    constructor({
        bancoPreguntas,
        numPreguntas = 10,
        porcentajeAprobacion = 80,
        claveAlmacenamiento = "skechers_quiz_mejor_puntaje"
    }) {
        if (!Array.isArray(bancoPreguntas) || bancoPreguntas.length === 0) {
            throw new Error("Quiz: 'bancoPreguntas' debe ser un arreglo no vacío.");
        }

        this.bancoPreguntas = bancoPreguntas;
        this.numPreguntas = Math.min(numPreguntas, bancoPreguntas.length);
        this.porcentajeAprobacion = porcentajeAprobacion;
        this.claveAlmacenamiento = claveAlmacenamiento;

        this.preguntasSesion = [];
        this.indice = 0;
        this.puntaje = 0;
        this.respuestasIncorrectas = [];
        this.bloqueado = false;
        this.horaInicio = null;

        this._cachearElementos();
        this._enlazarEventos();
    }

    _cachearElementos() {
        this.el = {
            inicio: document.getElementById("pantalla-inicio"),
            pregunta: document.getElementById("pantalla-pregunta"),
            resultado: document.getElementById("pantalla-resultado"),
            btnComenzar: document.getElementById("btn-comenzar"),
            btnReintentar: document.getElementById("btn-reintentar"),
            mejorPuntaje: document.getElementById("mejor-puntaje")
        };
    }

    _enlazarEventos() {
        this.el.btnComenzar?.addEventListener("click", () => this.iniciar());
        this.el.btnReintentar?.addEventListener("click", () => this.iniciar());
    }

    /** Algoritmo Fisher-Yates: mezcla uniforme, a diferencia de sort(Math.random). */
    _mezclar(arreglo) {
        const copia = [...arreglo];
        for (let i = copia.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [copia[i], copia[j]] = [copia[j], copia[i]];
        }
        return copia;
    }

    iniciar() {
        this.preguntasSesion = this._mezclar(this.bancoPreguntas).slice(0, this.numPreguntas);
        this.indice = 0;
        this.puntaje = 0;
        this.respuestasIncorrectas = [];
        this.bloqueado = false;
        this.horaInicio = Date.now();

        this.el.inicio.classList.add("oculto");
        this.el.resultado.classList.add("oculto");
        this.el.pregunta.classList.remove("oculto");

        this._mostrarPregunta();
    }

    _mostrarPregunta() {
        this.bloqueado = false;

        if (this.indice >= this.preguntasSesion.length) {
            this._mostrarResultado();
            return;
        }

        const p = this.preguntasSesion[this.indice];
        const progreso = Math.round((this.indice / this.preguntasSesion.length) * 100);

        this.el.pregunta.innerHTML = `
            <div class="barra-progreso" role="progressbar" aria-valuenow="${progreso}" aria-valuemin="0" aria-valuemax="100">
                <div class="barra-progreso-relleno" style="width:${progreso}%"></div>
            </div>
            <p class="contador" aria-live="polite">Pregunta ${this.indice + 1} de ${this.preguntasSesion.length}</p>
            <div class="card fade-in">
                <h2 class="pregunta">${this._escapar(p.pregunta)}</h2>
                <div class="opciones" role="listbox" aria-label="Opciones de respuesta">
                    ${p.opciones.map((op, i) => `
                        <div class="opcion"
                             role="option"
                             tabindex="0"
                             data-index="${i}"
                             aria-selected="false">
                            ${this._escapar(op)}
                        </div>
                    `).join("")}
                </div>
            </div>
        `;

        this.el.pregunta.querySelectorAll(".opcion").forEach(el => {
            el.addEventListener("click", () => this._responder(Number(el.dataset.index)));
            el.addEventListener("keydown", e => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    this._responder(Number(el.dataset.index));
                }
            });
        });
    }

    _responder(opcionSeleccionada) {
        if (this.bloqueado) return;
        this.bloqueado = true;

        const p = this.preguntasSesion[this.indice];
        const esCorrecta = opcionSeleccionada === p.correcta;

        if (esCorrecta) {
            this.puntaje++;
        } else {
            this.respuestasIncorrectas.push({
                pregunta: p.pregunta,
                tuRespuesta: p.opciones[opcionSeleccionada],
                correcta: p.opciones[p.correcta]
            });
        }

        const opciones = this.el.pregunta.querySelectorAll(".opcion");
        opciones.forEach((el, i) => {
            el.setAttribute("tabindex", "-1");
            el.style.pointerEvents = "none";
            if (i === p.correcta) {
                el.classList.add("correcta");
                el.setAttribute("aria-selected", "true");
            } else if (i === opcionSeleccionada) {
                el.classList.add("incorrecta");
            }
        });

        setTimeout(() => {
            this.indice++;
            this._mostrarPregunta();
        }, 850);
    }

    _mostrarResultado() {
        const total = this.preguntasSesion.length;
        const porcentaje = Math.round((this.puntaje / total) * 100);
        const aprobado = porcentaje >= this.porcentajeAprobacion;
        const segundos = Math.round((Date.now() - this.horaInicio) / 1000);
        const tiempo = `${Math.floor(segundos / 60)}m ${segundos % 60}s`;

        const mejorPrevio = this._obtenerMejorPuntaje();
        const esNuevoMejor = mejorPrevio === null || porcentaje > mejorPrevio;
        if (esNuevoMejor) this._guardarMejorPuntaje(porcentaje);

        const revisionHtml = this.respuestasIncorrectas.length > 0
            ? `
                <details class="revision">
                    <summary>Ver preguntas falladas (${this.respuestasIncorrectas.length})</summary>
                    <ul>
                        ${this.respuestasIncorrectas.map(r => `
                            <li>
                                <p class="revision-pregunta">${this._escapar(r.pregunta)}</p>
                                <p class="revision-tu">Tu respuesta: ${this._escapar(r.tuRespuesta)}</p>
                                <p class="revision-correcta">Correcta: ${this._escapar(r.correcta)}</p>
                            </li>
                        `).join("")}
                    </ul>
                </details>
              `
            : "";

        this.el.pregunta.classList.add("oculto");
        this.el.resultado.classList.remove("oculto");

        this.el.resultado.innerHTML = `
            <div class="card resultado-final fade-in">
                <h2>Resultado Final</h2>
                <p>Obtuviste <b>${this.puntaje}</b> de <b>${total}</b> preguntas correctas.</p>
                <h1>${porcentaje}%</h1>
                ${esNuevoMejor ? `<p class="badge-record">🏆 Nuevo mejor puntaje</p>` : ""}
                ${aprobado
                    ? `<p class="mensaje-exito">🎉 ¡Aprobaste la evaluación!</p>`
                    : `<p class="mensaje-error">Debes reforzar tus conocimientos sobre la cultura organizacional.</p>`
                }
                <p class="tiempo">Tiempo empleado: ${tiempo}</p>
                ${revisionHtml}
                <button id="btn-reintentar" class="btn-reintentar">Volver a intentar</button>
            </div>
        `;

        document.getElementById("btn-reintentar").addEventListener("click", () => this.iniciar());
    }

    _obtenerMejorPuntaje() {
        try {
            const valor = localStorage.getItem(this.claveAlmacenamiento);
            return valor !== null ? Number(valor) : null;
        } catch {
            return null;
        }
    }

    _guardarMejorPuntaje(porcentaje) {
        try {
            localStorage.setItem(this.claveAlmacenamiento, String(porcentaje));
        } catch {
            /* localStorage no disponible: se ignora silenciosamente */
        }
    }

    /** Previene inyección de HTML si las preguntas vinieran de una fuente externa. */
    _escapar(texto) {
        const div = document.createElement("div");
        div.textContent = texto;
        return div.innerHTML;
    }
}
