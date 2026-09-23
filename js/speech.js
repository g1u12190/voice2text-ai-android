//======================================================
// Voice2Text AI
// speech.js
//======================================================

// Reconocimiento de voz:
// - En la versión web usa Web Speech API.
// - En Android/Capacitor usa el reconocimiento nativo.
// Esto permite que el APK funcione aunque WebView no exponga
// SpeechRecognition como lo hace Chrome.

//------------------------------------------------------

const NativeSpeech =
    window.Capacitor &&
    window.Capacitor.Plugins &&
    window.Capacitor.Plugins.SpeechRecognition
        ? window.Capacitor.Plugins.SpeechRecognition
        : null;

const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;

const isNativeSpeech = !!NativeSpeech;

//------------------------------------------------------

let recognition = null;
let finalTranscript = "";
let listening = false;
let nativeListener = null;
let nativeStateListener = null;
let nativeErrorListener = null;

const output = document.getElementById("output");
const status = document.getElementById("status");

//------------------------------------------------------
// Despertar backend de Render
//------------------------------------------------------

function wakeBackend(){

    fetch("https://voice2text-ai-backend.onrender.com/")
        .then(() => console.log("Backend listo."))
        .catch(() => console.log("Backend iniciando..."));

}

//------------------------------------------------------
// WEB: Web Speech API
//------------------------------------------------------

if (!isNativeSpeech && SpeechRecognition) {

    recognition = new SpeechRecognition();

    recognition.lang = "es-EC";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => {

        listening = true;
        status.innerHTML = "🟢 Escuchando...";

    };

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

            } else {

                interimTranscript += transcript;

            }

        }

        output.value =
            finalTranscript +
            interimTranscript;

    };

    recognition.onerror = (event) => {

        console.log("SpeechRecognition:", event.error);

        if(event.error === "not-allowed"){

            status.innerHTML =
                "⚠️ Permiso de micrófono no concedido.";

        }

    };

    recognition.onend = () => {

        if(listening){

            try {
                recognition.start();
            } catch(error) {
                console.log("No se pudo reiniciar:", error);
            }

        } else {

            status.innerHTML =
                "🔴 Dictado detenido.";

        }

    };

} else if (!isNativeSpeech && !SpeechRecognition) {

    console.log("Web Speech API no disponible.");

}

//------------------------------------------------------
// ANDROID/CAPACITOR: reconocimiento nativo
//------------------------------------------------------

async function setupNativeSpeech(){

    if(!isNativeSpeech || nativeListener){
        return;
    }

    nativeListener =
        await NativeSpeech.addListener(
            "partialResults",
            (event) => {

                // Capgo entrega accumulatedText cuando está
                // disponible en sesiones continuas.
                const text =
                    event.accumulatedText ||
                    (event.matches && event.matches[0]) ||
                    "";

                if(text){

                    output.value = text;

                }

            }
        );

    nativeStateListener =
        await NativeSpeech.addListener(
            "listeningState",
            (event) => {

                if(event.state === "started"){

                    listening = true;
                    status.innerHTML =
                        "🟢 Escuchando...";

                }

                if(event.state === "stopped"){

                    if(!listening){

                        status.innerHTML =
                            "🔴 Dictado detenido.";

                    }

                }

            }
        );

    nativeErrorListener =
        await NativeSpeech.addListener(
            "error",
            (event) => {

                console.log(
                    "Native speech error:",
                    event.code,
                    event.message
                );

                if(event.code === "PERMISSION_DENIED"){

                    status.innerHTML =
                        "⚠️ Permiso de micrófono no concedido.";

                } else {

                    status.innerHTML =
                        "⚠️ Error de reconocimiento de voz.";

                }

            }
        );

}

//------------------------------------------------------

async function startNativeRecognition(){

    await setupNativeSpeech();

    const permission =
        await NativeSpeech.requestPermissions();

    if(permission.speechRecognition !== "granted"){

        status.innerHTML =
            "⚠️ Permiso de micrófono no concedido.";

        return;

    }

    const available =
        await NativeSpeech.available();

    if(!available.available){

        status.innerHTML =
            "⚠️ Reconocimiento de voz no disponible.";

        return;

    }

    finalTranscript = "";
    output.value = "";

    wakeBackend();

    listening = true;
    status.innerHTML = "🟢 Escuchando...";

    await NativeSpeech.start({

        language: "es-EC",
        maxResults: 1,
        partialResults: true,

        // Mantiene la sesión viva entre pausas.
        continuousPTT: true

    });

    // El modo continuousPTT se mantiene activo mientras
    // la aplicación indique que el botón está "presionado".
    await NativeSpeech.setPTTState({ held: true });

}

//------------------------------------------------------
// INICIAR
//------------------------------------------------------

async function startRecognition(){

    if(listening){
        return;
    }

    if(isNativeSpeech){

        try {

            await startNativeRecognition();

        } catch(error) {

            console.error(
                "Error iniciando reconocimiento nativo:",
                error
            );

            listening = false;

            status.innerHTML =
                "⚠️ No se pudo iniciar el micrófono.";

        }

        return;

    }

    if(!recognition){

        status.innerHTML =
            "⚠️ Este navegador no soporta reconocimiento de voz.";

        return;

    }

    finalTranscript = "";
    output.value = "";

    wakeBackend();

    try {

        recognition.start();

    } catch(error) {

        console.error(error);

    }

}

//------------------------------------------------------
// CONTINUAR
//------------------------------------------------------

async function continueRecognition(){

    if(listening){
        return;
    }

    if(isNativeSpeech){

        try {

            await startNativeRecognition();

        } catch(error) {

            console.error(
                "Error continuando reconocimiento:",
                error
            );

            status.innerHTML =
                "⚠️ No se pudo iniciar el micrófono.";

        }

        return;

    }

    if(!recognition){
        return;
    }

    wakeBackend();

    try {

        recognition.start();

    } catch(error) {

        console.error(error);

    }

}

//------------------------------------------------------
// DETENER
//------------------------------------------------------

async function stopRecognition(){

    listening = false;

    if(isNativeSpeech){

        try {

            await NativeSpeech.setPTTState({ held: false });
            await NativeSpeech.stop();

        } catch(error) {

            console.error(
                "Error deteniendo reconocimiento:",
                error
            );

        }

    } else if(recognition){

        try {

            recognition.stop();

        } catch(error) {

            console.log(error);

        }

    }

    const cleanedText = cleanText(output.value);

    output.value = cleanedText;

    if(typeof autoImprove !== "undefined" &&
       autoImprove &&
       autoImprove.checked){

        improveText();

    }

    status.innerHTML =
        "🔴 Dictado detenido.";

}

//------------------------------------------------------

function cleanText(text){

    return text
        .trim()
        .replace(/\s+/g, " ")
        .replace(/\s+([.,;:!?])/g, "$1")
        .replace(/([.,;:!?])([^\s])/g, "$1 $2");

}
