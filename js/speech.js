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

                // En continuousPTT el plugin puede entregar:
                // - accumulatedText: todo lo reconocido hasta ahora.
                // - matches: solo el segmento actual.
                //
                // Preferimos accumulatedText para no perder lo anterior.
                const accumulated =
                    typeof event.accumulatedText === "string"
                        ? event.accumulatedText.trim()
                        : "";

                const segment =
                    event.matches &&
                    event.matches.length
                        ? event.matches[0].trim()
                        : "";

                if (accumulated) {
                    output.value = accumulated;
                } else if (segment) {
                    const base = finalTranscript.trim();

                    if (
                        !base ||
                        segment === base ||
                        segment.startsWith(base)
                    ) {
                        output.value = segment;
                    } else {
                        output.value =
                            (base + " " + segment).trim();
                    }
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

async function startNativeRecognition(startNewNativeSession = false){

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

    // "Iniciar" comienza un dictado nuevo. "Continuar" conserva
    // el contenido existente y agrega el siguiente segmento.
    // El control se hace mediante startNewNativeSession.
    if (startNewNativeSession) {
        finalTranscript = "";
        output.value = "";
    }

    wakeBackend();

    listening = true;
    status.innerHTML = "🟢 Escuchando...";

    await NativeSpeech.start({

        language: "es-EC",
        maxResults: 1,
        partialResults: true,

        // Mantiene la sesión viva entre pausas y permite que
        // una pausa natural no corte inmediatamente el segmento.
        continuousPTT: true,
        allowForSilence: 4500,
        muteRecognizerBeep: true

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

            await startNativeRecognition(true);

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

            await startNativeRecognition(false);

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

            // Recupera el último resultado que el plugin tenga en caché
            // antes de cerrar definitivamente la sesión.
            try {
                const last =
                    await NativeSpeech.getLastPartialResult();

                if (last && last.text) {
                    output.value = last.text;
                }
            } catch (cacheError) {
                console.log(
                    "No se pudo recuperar el último resultado:",
                    cacheError
                );
            }

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
