//====================================
// app.js
//====================================

const startBtn =
document.getElementById("startBtn");

const continueBtn =
document.getElementById("continueBtn");

const stopBtn =
document.getElementById("stopBtn");

const correctBtn =
document.getElementById("correctBtn");

//------------------------------------

startBtn.addEventListener(
"click",
()=>{

    startRecognition();

});

//------------------------------------

continueBtn.addEventListener(
"click",
()=>{

    continueRecognition();

});

//------------------------------------

stopBtn.addEventListener(
"click",
()=>{

    stopRecognition();

});

//------------------------------------


//------------------------------------
// MODO OSCURO
//------------------------------------

const themeBtn =
document.getElementById("themeBtn");

// Restaurar tema guardado
if(localStorage.getItem("theme") === "dark"){

    document.body.classList.add("dark");

    themeBtn.textContent = "☀️";

}

// Cambiar tema
themeBtn.addEventListener(
"click",
()=>{

    document.body.classList.toggle("dark");

    if(document.body.classList.contains("dark")){

        localStorage.setItem("theme","dark");

        themeBtn.textContent = "☀️";

    }

    else{

        localStorage.setItem("theme","light");

        themeBtn.textContent = "🌙";

    }

});