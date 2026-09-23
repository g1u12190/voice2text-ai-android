//====================================
// clipboard.js
//====================================

const copyBtn =
document.getElementById("copyBtn");

const clearBtn =
document.getElementById("clearBtn");

//------------------------------------

copyBtn.addEventListener(
"click",
async ()=>{

    if(output.value===""){

        alert("No existe texto para copiar.");

        return;

    }

    await navigator.clipboard.writeText(
        output.value
    );

    status.innerHTML =
    "✅ Texto copiado.";

});

//------------------------------------

clearBtn.addEventListener(
"click",
()=>{

    output.value="";

    finalTranscript="";

    status.innerHTML=
    "🧹 Texto eliminado.";

});