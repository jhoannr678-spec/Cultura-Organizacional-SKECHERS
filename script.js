let preguntasAleatorias = [];
let indice = 0;
let puntaje = 0;

function mezclar(arreglo){
    return arreglo.sort(()=>Math.random()-0.5);
}

function iniciarEvaluacion(){

    preguntasAleatorias = mezclar([...preguntas]).slice(0,10);

    indice=0;
    puntaje=0;

    mostrarPregunta();
}

function mostrarPregunta(){

    if(indice>=preguntasAleatorias.length){

        let porcentaje=Math.round((puntaje/preguntasAleatorias.length)*100);

        document.getElementById("evaluacion").innerHTML="";

        document.getElementById("resultado").innerHTML=
        "<h2>Resultado Final</h2>"+
        "<p>Obtuviste <b>"+puntaje+"</b> de <b>"+preguntasAleatorias.length+"</b> preguntas.</p>"+
        "<h1>"+porcentaje+"%</h1>"+
        (porcentaje>=80?
        "<p style='color:green'>🎉 ¡Aprobaste la evaluación!</p>"
        :
        "<p style='color:red'>Debes reforzar tus conocimientos sobre la cultura organizacional.</p>");

        return;
    }

    let p=preguntasAleatorias[indice];

    let html="<div class='card'>";
    html+="<div class='pregunta'>"+(indice+1)+". "+p.pregunta+"</div>";

    p.opciones.forEach((opcion,i)=>{

        html+="<div class='opcion' onclick='responder("+i+")'>"+opcion+"</div>";

    });

    html+="</div>";

    document.getElementById("evaluacion").innerHTML=html;
}

function responder(opcion){

    if(opcion===preguntasAleatorias[indice].correcta){

        puntaje++;

    }

    indice++;

    mostrarPregunta();

}
