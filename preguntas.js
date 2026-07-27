/**
 * Motor de Evaluación / Quiz
 * ---------------------------------
 * Requiere en el HTML:
 *   <div id="evaluacion"></div>
 *   <div id="resultado"></div>
 *
 * Requiere un array global `preguntas` con la forma:
 *   [
 *     { pregunta: "¿...?", opciones: ["A","B","C","D"], correcta: 2 },
 *     ...
 *   ]
 */

const CONFIG = {
    NUM_PREGUNTAS: 10,
    PORCENTAJE_APROBACION: 80
};

let preguntasAleatorias = [];
let indice = 0;
let puntaje = 0;
let respuestaBloqueada = false;

/**
 * Mezcla un arreglo usando el algoritmo Fisher-Yates.
 * (Math.random() - 0.5 en sort() NO produce una distribución uniforme)
 */
function mezclar(arreglo) {
    const copia = [...arreglo];
    for (let i = copia.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copia[i], copia[j]] = [copia[j], copia[i]];
    }
    return copia;
}

function iniciarEvaluacion() {
    if (typeof preguntas === "undefined" || preguntas.length === 0) {
        console.error("El arreglo 'preguntas' no está definido o está vacío.");
        return;
    }

    preguntasAleatorias = mezclar(preguntas).slice(0, CONFIG.NUM_PREGUNTAS);
    indice = 0;
    puntaje = 0;
    respuestaBloqueada = false;

    document.getElementById("resultado").innerHTML = "";
    mostrarPregunta();
}

function mostrarPregunta() {
    respuestaBloqueada = false;

    if (indice >= preguntasAleatorias.length) {
        mostrarResultadoFinal();
        return;
    }

    const p = preguntasAleatorias[indice];
    const progreso = Math.round((indice / preguntasAleatorias.length) * 100);

    const opcionesHtml = p.opciones
        .map((opcion, i) => `<div class="opcion" data-index="${i}">${opcion}</div>`)
        .join("");

    document.getElementById("evaluacion").innerHTML = `
        <div class="barra-progreso">
            <div class="barra-progreso-relleno" style="width:${progreso}%"></div>
        </div>
        <p class="contador">Pregunta ${indice + 1} de ${preguntasAleatorias.length}</p>
        <div class="card">
            <div class="pregunta">${p.pregunta}</div>
            <div class="opciones">${opcionesHtml}</div>
        </div>
    `;

    document.querySelectorAll(".opcion").forEach(el => {
        el.addEventListener("click", () => responder(Number(el.dataset.index)));
    });
}

function responder(opcionSeleccionada) {
    if (respuestaBloqueada) return;
    respuestaBloqueada = true;

    const p = preguntasAleatorias[indice];
    const esCorrecta = opcionSeleccionada === p.correcta;

    if (esCorrecta) puntaje++;

    const opciones = document.querySelectorAll(".opcion");
    opciones.forEach((el, i) => {
        el.style.pointerEvents = "none";
        if (i === p.correcta) {
            el.classList.add("correcta");
        } else if (i === opcionSeleccionada) {
            el.classList.add("incorrecta");
        }
    });

    setTimeout(() => {
        indice++;
        mostrarPregunta();
    }, 900);
}

function mostrarResultadoFinal() {
    const total = preguntasAleatorias.length;
    const porcentaje = Math.round((puntaje / total) * 100);
    const aprobado = porcentaje >= CONFIG.PORCENTAJE_APROBACION;

    document.getElementById("evaluacion").innerHTML = "";

    document.getElementById("resultado").innerHTML = `
        <div class="card resultado-final">
            <h2>Resultado Final</h2>
            <p>Obtuviste <b>${puntaje}</b> de <b>${total}</b> preguntas correctas.</p>
            <h1>${porcentaje}%</h1>
            ${aprobado
                ? `<p class="mensaje-exito">🎉 ¡Aprobaste la evaluación!</p>`
                : `<p class="mensaje-error">Debes reforzar tus conocimientos sobre la cultura organizacional.</p>`
            }
            <button onclick="iniciarEvaluacion()" class="btn-reintentar">Volver a intentar</button>
        </div>
    `;
}
