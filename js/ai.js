//======================================================
// Voice2Text AI
// ai.js
//======================================================

const improveBtn =
document.getElementById("improveBtn");

const autoImprove =
document.getElementById("autoImprove");

//------------------------------------------------------

//======================================================
// Despertar backend al abrir la aplicación
//======================================================

fetch("https://voice2text-ai-backend.onrender.com/")
    .then(() => {
        console.log("Backend listo");
    })
    .catch(() => {
        console.log("Backend iniciando...");
    });

//------------------------------------------------------

async function improveText(){

    const text = output.value.trim();

    if(text === ""){

        status.innerHTML =
        "⚠ No hay texto para mejorar.";

        return;

    }

    improveBtn.disabled = true;

    status.innerHTML =
    "✨ Mejorando texto con IA...";

    try{

        const response =
        await fetch(
            "https://voice2text-ai-backend.onrender.com/improve",
            {

                method:"POST",

                headers:{
                    "Content-Type":"application/json"
                },

                body:JSON.stringify({

                    text:text

                })

            }
        );

        if(!response.ok){

            let serverMessage =
                "Error HTTP " + response.status;

            try {
                const errorData = await response.json();

                if (errorData.detail) {
                    serverMessage =
                        typeof errorData.detail === "string"
                            ? errorData.detail
                            : JSON.stringify(errorData.detail);
                } else if (errorData.message) {
                    serverMessage = errorData.message;
                }
            } catch(parseError) {
                console.log(
                    "No se pudo leer el detalle del error:",
                    parseError
                );
            }

            throw new Error(serverMessage);

        }

        const data =
        await response.json();

        output.value =
        data.improved_text;

        status.innerHTML =
        "✅ Texto mejorado.";

    }

    catch(error){

        console.error(error);

        status.innerHTML =
        "❌ Error al mejorar el texto.";

    }

    finally{

        improveBtn.disabled = false;

    }

}

//------------------------------------------------------

improveBtn.addEventListener(

"click",

()=>{

    improveText();

});
