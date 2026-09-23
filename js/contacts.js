//====================================
// contacts.js
//====================================

const importModal =
document.getElementById("importModal");

const importInfo =
document.getElementById("importInfo");

const confirmImportBtn =
document.getElementById("confirmImportBtn");

const cancelImportBtn =
document.getElementById("cancelImportBtn");

const importBtn =
document.getElementById("importContactsBtn");

const vcfFile =
document.getElementById("vcfFile");

const form =
document.getElementById("contactForm");

const newBtn =
document.getElementById("newContactBtn");

const cancelBtn =
document.getElementById("cancelContactBtn");

const saveBtn =
document.getElementById("saveContactBtn");

const list =
document.getElementById("contactsList");

const search =
document.getElementById("searchContact");

const nameInput =
document.getElementById("contactName");

const aliasInput =
document.getElementById("contactAlias");

const phoneInput =
document.getElementById("contactPhone");

const favoriteInput =
document.getElementById("favoriteContact");

const duplicateModal =
document.getElementById("duplicateModal");

const duplicateInfo =
document.getElementById("duplicateInfo");

const keepExistingBtn =
document.getElementById("keepExistingBtn");

const replaceNameBtn =
document.getElementById("replaceNameBtn");

const deleteAllBtn =
document.getElementById("deleteAllBtn");

const selectedContactBox =
document.getElementById("selectedContactBox");

const selectedContactName =
document.getElementById("selectedContactName");

const selectedContactPhone =
document.getElementById("selectedContactPhone");

const changeContactBtn =
document.getElementById("changeContactBtn");

const sendWhatsAppBtn =
document.getElementById("sendWhatsAppBtn");


let contacts =
JSON.parse(localStorage.getItem("contacts")) || [];

//--------------------------------------------------
// NORMALIZAR TELÉFONO
//--------------------------------------------------

function normalizePhone(phone){

    // Elimina espacios, guiones, paréntesis, etc.
    phone = phone.replace(/\D/g,"");

    // Convierte +593XXXXXXXXX → 09XXXXXXXX
    if(phone.startsWith("593") && phone.length===12){

        phone = "0" + phone.substring(3);

    }

    return phone;

}

let importedContacts = [];

let editing = null;

let duplicateContacts = [];
let duplicateIndex = 0;

renderContacts();

//--------------------------------

newBtn.onclick=()=>{

    editing=null;

    form.classList.remove("hidden");

    nameInput.value="";
    aliasInput.value="";
    phoneInput.value="";
    favoriteInput.checked=false;

};

//--------------------------------

cancelBtn.onclick=()=>{

    form.classList.add("hidden");

};

//--------------------------------

saveBtn.onclick=()=>{

    const contact={
        name:nameInput.value.trim(),

        alias:aliasInput.value.trim(),

        phone:normalizePhone(
            phoneInput.value

        ),

        favorite:favoriteInput.checked

    };

    if(editing===null){

        contacts.push(contact);

    }

    else{

        contacts[editing]=contact;

    }

    save();

    form.classList.add("hidden");

};

//--------------------------------

//--------------------------------
// IMPORTAR VCF
//--------------------------------

importBtn.onclick = ()=>{

    vcfFile.click();

};

//--------------------------------

vcfFile.addEventListener(

"change",

importVCF

);

confirmImportBtn.onclick = ()=>{

    contacts.push(

        ...importedContacts

    );

    save();

    importModal.classList.add("hidden");

    if(duplicateContacts.length > 0){

        showNextDuplicate();

    }
    else{

        alert(

            importedContacts.length +

            " contactos importados."

        );

        renderContacts();

    }

};

cancelImportBtn.onclick=()=>{

    importedContacts=[];

    importModal.classList.add(

        "hidden"

    );

};

function save(){

    localStorage.setItem(

        "contacts",

        JSON.stringify(contacts)

    );

    renderContacts();

}

//--------------------------------

function renderContacts(){

    list.innerHTML = "";

    const filter =
        search.value.trim().toLowerCase();

    let filteredContacts;

    //------------------------------------
    // FILTRAR CONTACTOS
    //------------------------------------

    if(filter === ""){

        // Solo favoritos
        filteredContacts = contacts.filter(
            c => c.favorite
        );

    }

    else{

        // Buscar en todos
        filteredContacts = contacts.filter(c =>

            c.name.toLowerCase().includes(filter) ||

            c.alias.toLowerCase().includes(filter) ||

            c.phone.includes(filter)

        );

    }

    //------------------------------------
    // NO HAY RESULTADOS
    //------------------------------------

    if(filteredContacts.length === 0){

        if(filter === ""){

            if(contacts.length === 0){

                list.innerHTML = `
                    <div class="contactCard">

                        📭 No tienes contactos.

                    </div>
                `;

            }

            else{

                list.innerHTML = `
                    <div class="contactCard">

                        ⭐ No tienes contactos favoritos.

                        <br><br>

                        👥 Tienes

                        <strong>
                            ${contacts.length}
                        </strong>

                        contactos en total.

                        <br><br>

                        🔍 Usa el buscador para encontrar
                        un contacto.

                    </div>
                `;

            }

        }

        else{

            // El texto del buscador se coloca
            // mediante textContent más adelante.
            const message =
                document.createElement("div");

            message.className = "contactCard";

            message.appendChild(
                document.createTextNode(
                    "🔍 No se encontraron contactos para: "
                )
            );

            const searchText =
                document.createElement("strong");

            searchText.textContent =
                search.value;

            message.appendChild(searchText);

            list.appendChild(message);

        }

        return;

    }

    //------------------------------------
    // CREAR TARJETAS
    //------------------------------------

    filteredContacts.forEach(contact => {

        //--------------------------------
        // TARJETA
        //--------------------------------

        const card =
            document.createElement("div");

        card.className = "contactCard";


        //--------------------------------
        // ENCABEZADO
        //--------------------------------

        const header =
            document.createElement("div");

        header.className =
            "contactHeader";


        const information =
            document.createElement("div");


        //--------------------------------
        // NOMBRE
        //--------------------------------

        const name =
            document.createElement("div");

        name.className =
            "contactName";

        name.textContent =
            (contact.favorite ? "⭐ " : "") +
            contact.name;


        //--------------------------------
        // ALIAS
        //--------------------------------

        const alias =
            document.createElement("div");

        alias.className =
            "contactAlias";

        alias.textContent =
            "Alias: " + contact.alias;


        //--------------------------------
        // TELÉFONO
        //--------------------------------

        const phone =
            document.createElement("div");

        phone.className =
            "contactPhone";

        phone.textContent =
            "📱 " + contact.phone;


        //--------------------------------
        // AGREGAR INFORMACIÓN
        //--------------------------------

        information.appendChild(name);

        information.appendChild(alias);

        information.appendChild(phone);

        header.appendChild(information);

        card.appendChild(header);


        //--------------------------------
        // BOTONES
        //--------------------------------

        const buttons =
            document.createElement("div");

        buttons.className =
            "contactButtons";


        //--------------------------------
        // BOTÓN EDITAR
        //--------------------------------

        const editBtn =
            document.createElement("button");

        editBtn.className =
            "editBtn";

        editBtn.textContent =
            "✏ Editar";

        editBtn.onclick = () => {

            editContactByPhone(
                contact.phone
            );

        };


        //--------------------------------
        // BOTÓN ELIMINAR
        //--------------------------------

        const deleteBtn =
            document.createElement("button");

        deleteBtn.className =
            "deleteBtn";

        deleteBtn.textContent =
            "🗑 Eliminar";

        deleteBtn.onclick = () => {

            deleteContactByPhone(
                contact.phone
            );

        };


        //--------------------------------
        // BOTÓN SELECCIONAR
        //--------------------------------

        const selectBtn =
            document.createElement("button");

        selectBtn.className =
            "selectBtn";

        selectBtn.textContent =
            "📤 Seleccionar";

        selectBtn.onclick = () => {

            selectContactByPhone(
                contact.phone
            );

        };


        //--------------------------------
        // AGREGAR BOTONES
        //--------------------------------

        buttons.appendChild(editBtn);

        buttons.appendChild(deleteBtn);

        buttons.appendChild(selectBtn);


        //--------------------------------
        // AGREGAR TODO A LA TARJETA
        //--------------------------------

        card.appendChild(buttons);

        list.appendChild(card);

    });

}

//--------------------------------

function editContact(i){

    editing=i;

    form.classList.remove("hidden");

    nameInput.value=contacts[i].name;

    aliasInput.value=contacts[i].alias;

    phoneInput.value=contacts[i].phone;

    favoriteInput.checked=

    contacts[i].favorite;

}

//--------------------------------

function editContactByPhone(phone){

    const index = contacts.findIndex(

        c => c.phone === phone

    );

    editContact(index);

}

//--------------------------------

function deleteContact(i){

    if(confirm("¿Eliminar contacto?")){

        contacts.splice(i,1);

        save();

    }

}

//--------------------------------

function deleteContactByPhone(phone){

    const index = contacts.findIndex(

        c => c.phone === phone

    );

    deleteContact(index);

}

//--------------------------------

search.oninput=renderContacts;

//--------------------------------
// IMPORTAR VCF
//--------------------------------

function importVCF(event){

    const file = event.target.files[0];

    if(!file){

        return;

    }

    const reader = new FileReader();

    reader.onload = function(e){

        const text = e.target.result;

        parseVCF(text);

    };

    reader.readAsText(file);

}

//--------------------------------

function parseVCF(text){

    importedContacts=[];

    duplicateContacts = [];

    duplicateIndex = 0;

    const cards=

    text.split("END:VCARD");

    let duplicated=0;

    cards.forEach(card=>{

        if(card.trim()==="") return;

        let name="";
        let phone="";

        card.split("\n").forEach(line=>{

            line=line.trim();

            if(line.startsWith("FN:")){

                name=line.replace("FN:","").trim();

            }

            if(line.startsWith("TEL")){

                phone=line.split(":")[1]||"";

                phone=phone.replace(/\s/g,"");

                phone = normalizePhone(phone);

            }

        });

        if(name && phone){

            const exists=

            contacts.some(

                c=>normalizePhone(c.phone)===phone

            );
            
            if(exists){
                
                const existingContact = contacts.find(
                    
                    c => normalizePhone(c.phone) === phone
                );
                
                duplicateContacts.push({
                    
                    existing: existingContact,
                    
                    imported: {
                        
                        name: name,
                        
                        alias: name,
                        
                        phone: phone,
                        
                        favorite: false
                    }
                
                });
            
            }
            
            else{
                
                importedContacts.push({
                    
                    name: name,

                    alias: name,

                    phone: phone,

                    favorite: false

            });
        }

        }

    });

    importInfo.innerHTML=`

        <b>Contactos encontrados:</b>

        ${importedContacts.length+duplicated}

        <br><br>

        ✅ Nuevos:

        ${importedContacts.length}

        <br>

        ⚠ Duplicados:

        ${duplicated}

    `;

    importModal.classList.remove("hidden");

}

function showNextDuplicate(){

    if(duplicateIndex >= duplicateContacts.length){

        duplicateModal.classList.add("hidden");

        renderContacts();

        return;

    }

    const duplicate =

        duplicateContacts[duplicateIndex];

    duplicateInfo.innerHTML = `

        <p>

            <strong>Nombre actual:</strong><br>

            ${duplicate.existing.name}

        </p>

        <p>

            <strong>Nombre importado:</strong><br>

            ${duplicate.imported.name}

        </p>

        <p>

            <strong>Teléfono:</strong><br>

            ${duplicate.imported.phone}

        </p>

    `;

    duplicateModal.classList.remove("hidden");

}

//------------------------------------------
// BOTÓN MANTENER CONTACTO ACTUAL
//------------------------------------------

keepExistingBtn.onclick = ()=>{

    duplicateIndex++;

    showNextDuplicate();

};

replaceNameBtn.onclick = ()=>{

    const duplicate =

        duplicateContacts[duplicateIndex];

    duplicate.existing.name =

        duplicate.imported.name;

    duplicate.existing.alias =

        duplicate.imported.alias;

    duplicateIndex++;

    showNextDuplicate();

};

//--------------------------------------------------
// ELIMINAR TODOS LOS CONTACTOS
//--------------------------------------------------

deleteAllBtn.onclick = ()=>{

    if(contacts.length === 0){

        alert("No hay contactos para eliminar.");

        return;

    }

    const confirmation = confirm(

        "⚠️ ¿Estás seguro de eliminar TODOS los contactos?"

    );

    if(!confirmation){

        return;

    }

    contacts = [];

    localStorage.removeItem("contacts");

    renderContacts();

    alert(

        "🗑 Todos los contactos fueron eliminados."

    );

};

let selectedContact = null;

//--------------------------------------------------
// SELECCIONAR CONTACTO
//--------------------------------------------------

function selectContact(contact){

    selectedContact = contact;

    selectedContactName.textContent =
        "👤 " + contact.name;

    selectedContactPhone.textContent =
        "📱 " + contact.phone;

    selectedContactBox.classList.remove(
        "hidden"
    );

}

//--------------------------------------------------
// SELECCIONAR CONTACTO POR TELÉFONO
//--------------------------------------------------

function selectContactByPhone(phone){

    const contact = contacts.find(

        c => normalizePhone(c.phone) ===
             normalizePhone(phone)

    );

    if(!contact){

        alert("No se encontró el contacto.");

        return;

    }

    selectContact(contact);

}

//--------------------------------------------------
// CAMBIAR CONTACTO
//--------------------------------------------------

changeContactBtn.onclick = ()=>{

    selectedContact = null;

    selectedContactBox.classList.add(
        "hidden"
    );

};

//--------------------------------------------------
// CONVERTIR NÚMERO A FORMATO WHATSAPP
//--------------------------------------------------

function phoneForWhatsApp(phone){

    let number = phone.replace(/\D/g, "");

    // Ecuador
    if(number.startsWith("0")){

        number =
            "593" + number.substring(1);

    }

    return number;

}

//--------------------------------------------------
// ENVIAR MENSAJE A WHATSAPP
//--------------------------------------------------

function sendToWhatsApp(){

    if(!selectedContact){

        alert(
            "Primero selecciona un contacto."
        );

        return;

    }

    const text =
        document.getElementById("output").value.trim();

    if(!text){

        alert(
            "No hay ningún mensaje para enviar."
        );

        return;

    }

    const phone =
        phoneForWhatsApp(
            selectedContact.phone
        );

    const whatsappURL =
        "https://wa.me/" +
        phone +
        "?text=" +
        encodeURIComponent(text);

    window.open(
        whatsappURL,
        "_blank"
    );

}

//--------------------------------------------------
// BOTÓN ENVIAR A WHATSAPP
//--------------------------------------------------

sendWhatsAppBtn.onclick = ()=>{

    sendToWhatsApp();

};