//======================================================
// Voice2Text AI
// speech.js
//======================================================

// Compatibilidad con Chrome
const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;

if (!SpeechRecognition) {

    alert("Este navegador no soporta reconocimiento de voz.");

}

//------------------------------------------------------

const recognition = SpeechRecognition ? new SpeechRecognition() : null;

if (recognition) recognition.lang = "es-EC";      // Español Ecuador
if (recognition) recognition.continuous = true;
if (recognition) recognition.interimResults = true;

//------------------------------------------------------

let finalTranscript = "";

let listening = false;

//------------------------------------------------------

const output =
document.getElementById("output");

const status =
document.getElementById("status");

//------------------------------------------------------

// Despertar backend de Render 
//------------------------------------------------------ 

function wakeBackend(){ 
    
    fetch("https://voice2text-ai-backend.onrender.com/") .then(() => { 
        
        console.log("Backend listo."); 
        
    }) .catch(() => { 
        
        console.log("Backend iniciando..."); 
        
    }); 

} 

//------------------------------------------------------

recognition.onstart = () => {

    listening = true;

    status.innerHTML =
    "🟢 Escuchando...";

};

//------------------------------------------------------

recognition.onresult = (event) => {

    let interimTranscript = "";

    for (
        let i = event.resultIndex;
        i < event.results.length;
        i++
    ){

        const transcript =
        event.results[i][0].transcript;

        if(event.results[i].isFinal){

            finalTranscript += transcript + " ";

        }

        else{

            interimTranscript += transcript;

        }

    }

    output.value =
    finalTranscript +
    interimTranscript;

};

//------------------------------------------------------

recognition.onerror = (event)=>{

    console.log(event.error);

};

//------------------------------------------------------

// AQUÍ ESTÁ LA MAGIA

recognition.onend = ()=>{

    if(listening){

        recognition.start();

    }

    else{

        status.innerHTML =
        "🔴 Dictado detenido.";

    }

};

//------------------------------------------------------

function startRecognition(){

    if(listening){

        return;

    }

    finalTranscript = "";

    output.value = "";

    // Despertar Render mientras comienza el dictado 
    
    wakeBackend();

    recognition.start();

}

//------------------------------------------------------

function continueRecognition(){

    if(listening){

        return;

    }

    // Despertar Render mientras comienza el dictado 
    wakeBackend();

    recognition.start();

}

//------------------------------------------------------

function stopRecognition(){

    listening = false;

    recognition.stop();

    const cleanedText = cleanText(output.value);

    output.value = cleanedText;

    if(autoImprove && autoImprove.checked){

        improveText();

    }

}

//------------------------------------------------------

function cleanText(text){

    return text

        .trim()

        // Elimina espacios dobles
        .replace(/\s+/g, " ")

        // Quita espacios antes de signos
        .replace(/\s+([.,;:!?])/g, "$1")

        // Agrega un espacio después de signos
        .replace(/([.,;:!?])([^\s])/g, "$1 $2");

}
