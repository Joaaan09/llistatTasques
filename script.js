/**
 * Inicialitza l'aplicació quan el DOM està llest.
 */
document.addEventListener("DOMContentLoaded", () => {
    setInterval(conexioServidor, 2000); // Cada dos segons comprobará la conexió amb el servidor
    cargarTasques(); // Carguem les tasques
    afegirTasca(); // Cridem aquesta funció per estar pendents de quan es vulguir afegir una tasca
});

// Variables globals per poder controlar el estat del servidor
let online = true;
let tasquesLocal = JSON.parse(localStorage.getItem('tasques') || '[]');
let pendingChanges = JSON.parse(localStorage.getItem('pendingChanges') || '[]');

/**
 * Afegeix l'escoltador per afegir una nova tasca, gestionant tant mode online com offline.
 */
// Funció per afegir una tasca
function afegirTasca() {
    // Elements html
    const input = document.getElementById("input");
    const button = document.getElementById("afegirTasca");
    const llista = document.querySelector(".tasques");

    // Escoltem el botó d'afegir una tasca
    button.addEventListener("click", async () => {
        // Si tenim conexió amb el servidor
        if (online) {
            try {
                // Interactuem amb els elements html
                // Agafem el text del input i fem la petició
                const novaTasca = await ferPost(input.value.toLowerCase());
                // Creem la etiqueta li que s'afageix a la llista
                const tasca = document.createElement("li");
                // El nom de la tasca será un altre element, d'aquesta manera més endevant el podrem modificar
                const textSpan = document.createElement("span");

                // Actualitzem el contingut html
                textSpan.textContent = input.value;  
                tasca.appendChild(textSpan);
                llista.appendChild(tasca);
                cargarBotons(tasca, novaTasca.id, textSpan); 
                input.value = '';
                guardarLocalStorage(); // Guardem les dades en local
            } catch (error) {
                console.error('Error al añadir tarea:', error);
            }
        } else {
            // Si no hi ha conexió passem al mode offline
            // Variable de tipus objecte
            const novaTasca = {
                id: 'temp_' + Date.now(), // ID temporal
                text: input.value.toLowerCase(),
                completed: false
            };

            // Afegim la nova tasca en el local storage
            tasquesLocal.push(novaTasca);
            pendingChanges.push({
                type: 'add',
                task: novaTasca
            });
            localStorage.setItem('tasques', JSON.stringify(tasquesLocal));
            localStorage.setItem('pendingChanges', JSON.stringify(pendingChanges));

            const tasca = document.createElement("li");
            const textSpan = document.createElement("span");
            textSpan.textContent = input.value;
            tasca.appendChild(textSpan);
            llista.appendChild(tasca);
            cargarBotons(tasca, novaTasca.id, textSpan);
            input.value = '';
        }
    });
}

/**
 * Carrega les tasques des del servidor o des de localStorage si està offline.
 */
// Funció per cargar les tasques 
function cargarTasques() {
    const llista = document.querySelector(".tasques");
    llista.innerHTML = ''; // Netegem la llista abans de carregar

    // Si tenim conexió
    if (online) {
        // Petició
        ferGet().then(tasks => {
            tasquesLocal = tasks; // Actualitzem les tasques locals
            localStorage.setItem('tasques', JSON.stringify(tasquesLocal));

            tasks.forEach(task => {
                // Elements HTML
                const tasca = document.createElement("li");
                const textSpan = document.createElement("span");
                textSpan.textContent = task.text;
                if (task.completed) {
                    textSpan.style.textDecoration = "line-through";
                }
                tasca.appendChild(textSpan);
                llista.appendChild(tasca);
                cargarBotons(tasca, task.id, textSpan);
            });
        }).catch(error => {
            console.error('Error al cargar tareas:', error);
            cargarTasquesOffline();
        });
    } else {
        cargarTasquesOffline(); // Si no hi ha conexió 
    }
}

/**
 * Carrega les tasques des de localStorage quan estem offline.
 */
// Funció per cargar les tasques offline
function cargarTasquesOffline() {
    // Elements HTML
    const llista = document.querySelector(".tasques");
    llista.innerHTML = '';

    // Afagem les dades en local. 
    tasquesLocal = JSON.parse(localStorage.getItem('tasques') || '[]'); // Tasques en local, s'actualitzen sempre
    pendingChanges = JSON.parse(localStorage.getItem('pendingChanges') || '[]'); // S'utilitzará quan no hi hagi conexió i es fagin canvis

    // Mateix procediment que quan hi ha connexió
    tasquesLocal.forEach(task => {
        const tasca = document.createElement("li");
        const textSpan = document.createElement("span");
        textSpan.textContent = task.text;
        if (task.completed) {
            textSpan.style.textDecoration = "line-through";
        }
        tasca.appendChild(textSpan);
        llista.appendChild(tasca);
        cargarBotons(tasca, task.id, textSpan);
    });
}

/**
 * Afegeix els botons d'eliminar, finalitzar i editar a una tasca.
 * @param {HTMLElement} elementLi - L'element de llista <li> de la tasca.
 * @param {string} taskId - L'identificador de la tasca.
 * @param {HTMLElement} textSpan - L'span que conté el text de la tasca.
 */
// Funció per cargar els botons finalitzar, editar i eliminar
function cargarBotons(elementLi, taskId, textSpan) {
    // Creem els elements html i li afegim la clase i text
    const eliminar = document.createElement("button");
    eliminar.className = "eliminar";
    eliminar.textContent = "❌";
    const finalitzar = document.createElement("button");
    finalitzar.className = "finalitzar";
    finalitzar.textContent = "✅";
    const editar = document.createElement("button");
    editar.className = "editar";
    editar.textContent = "✏️";

    // Afegim a la llista
    elementLi.appendChild(eliminar);
    elementLi.appendChild(finalitzar);
    elementLi.appendChild(editar);

    // ELIMINAR TASCA
    eliminar.addEventListener("click", () => {
        if (online) {
            ferDelete(taskId).then(() => {
                elementLi.remove();
                guardarLocalStorage();
            });
        } else {
            // Mode offline
            const taskIndex = tasquesLocal.findIndex(t => t.id === taskId);
            if (taskIndex !== -1) {
                const deletedTask = tasquesLocal[taskIndex];
                tasquesLocal.splice(taskIndex, 1);

                // Guardem els canvis pendents
                pendingChanges.push({
                    type: 'delete',
                    taskId: taskId,
                    task: deletedTask
                });

                localStorage.setItem('tasques', JSON.stringify(tasquesLocal));
                localStorage.setItem('pendingChanges', JSON.stringify(pendingChanges));
                elementLi.remove();
            }
        }
    });

    // FINALITZAR TASCA
    finalitzar.addEventListener("click", () => {
        const isCompleted = textSpan.style.textDecoration === "line-through";
        const newCompletedState = !isCompleted;

        if (online) {
            ferPut(taskId, textSpan.textContent, newCompletedState).then(() => {
                textSpan.style.textDecoration = newCompletedState ? "line-through" : "none";
                guardarLocalStorage();
            }).catch(error => {
                console.error('Error al actualizar tarea:', error);
            });
        } else {
            // Mode offline
            const index = tasquesLocal.findIndex(t => t.id === taskId);
            if (index !== -1) {
                const oldTask = { ...tasquesLocal[index] };
                tasquesLocal[index].completed = newCompletedState;

                // Guardamos el cambio pendiente
                pendingChanges.push({
                    type: 'update',
                    taskId: taskId,
                    oldTask: oldTask,
                    newTask: tasquesLocal[index]
                });

                localStorage.setItem('tasques', JSON.stringify(tasquesLocal));
                localStorage.setItem('pendingChanges', JSON.stringify(pendingChanges));
                textSpan.style.textDecoration = newCompletedState ? "line-through" : "none";
            }
        }
    });

    // EDITAR TASCA
    editar.addEventListener("click", () => {
        const isCompleted = textSpan.style.textDecoration === "line-through";
        const nouText = prompt("Modifica la tasca:", textSpan.textContent);

        if (nouText === null || nouText.trim() === "") return;

        if (online) {
            ferPut(taskId, nouText, isCompleted).then(() => {
                textSpan.textContent = nouText;
                guardarLocalStorage();
            });
        } else {
            // Mode offline
            const index = tasquesLocal.findIndex(t => t.id === taskId);
            if (index !== -1) {
                const oldTask = { ...tasquesLocal[index] };
                tasquesLocal[index].text = nouText;

                // Guardem els canvis pendents
                pendingChanges.push({
                    type: 'update',
                    taskId: taskId,
                    oldTask: oldTask,
                    newTask: tasquesLocal[index]
                });

                localStorage.setItem('tasques', JSON.stringify(tasquesLocal));
                localStorage.setItem('pendingChanges', JSON.stringify(pendingChanges));
                textSpan.textContent = nouText;
            }
        }
    });
}

/**
 * Desa l'estat actual de les tasques al localStorage si estem online.
 */
// Funció per guardar les tasques en local
function guardarLocalStorage() {
    if (online) {
        ferGet().then(tasks => {
            localStorage.setItem('tasques', JSON.stringify(tasks));
            tasquesLocal = tasks;
        });
    }
}

/**
 * Sincronitza els canvis emmagatzemats localment amb el servidor quan es recupera la connexió.
 */
// Funció per sincronitzar els canvis quan torna la connexió
async function sincronitzarCanvis() {
    if (!online || pendingChanges.length === 0) return;

    try {
        // Processar canvis en ordre
        for (const change of pendingChanges) {
            switch (change.type) {
                case 'add':
                    await ferPost(change.task.text);
                    break;
                case 'update':
                    await ferPut(change.taskId, change.newTask.text, change.newTask.completed);
                    break;
                case 'delete':
                    await ferDelete(change.taskId);
                    break;
            }
        }

        // Netegem canvis pendents
        pendingChanges = [];
        localStorage.removeItem('pendingChanges');

        // Actualitzem les tasques del servidor
        await cargarTasques();
    } catch (error) {
        console.error('Error al sincronizar cambios:', error);
    }
}

/**
 * Comprova periòdicament si hi ha connexió amb el servidor i sincronitza canvis si és necessari.
 */
// Funció per saber si tenim connexió al servidor
function conexioServidor() {
    let conexio = document.querySelector(".conexio");

    fetch('http://localhost:3000/tasks/')
        .then(response => {
            if (response.ok) {
                conexio.textContent = "Online";
                if (!online) {
                    online = true;
                    // Quan tornem a estar online, sincronitzem canvis
                    sincronitzarCanvis().then(() => {

                    });
                }
            }
        })
        .catch(error => {
            conexio.textContent = "Offline";
            if (online) {
                online = false;
                // Quan passem a offline, carreguem les tasques del localStorage
                cargarTasquesOffline();
            }
        });
}

/**
 * Fa una petició GET al servidor per obtenir totes les tasques.
 * @returns {Promise<Array<Object>>} Llista de tasques del servidor.
 */
async function ferGet() {
    try {
        const resposta = await fetch('http://localhost:3000/tasks/');
        const dades = await resposta.json();
        console.log('GET:', dades);
        return dades;
    } catch (error) {
        console.error('Error GET:', error);
        throw error;
    }
}

/**
 * Envia una nova tasca al servidor amb una petició POST.
 * @param {string} nomTasca - El text de la nova tasca.
 * @returns {Promise<Object>} La resposta amb la tasca creada.
 */
async function ferPost(nomTasca) {
    try {
        const resposta = await fetch('http://localhost:3000/tasks/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ text: nomTasca })
        });
        const dades = await resposta.json();
        console.log('POST:', dades);
        return dades;
    } catch (error) {
        console.error('Error POST:', error);
        throw error;
    }
}

/**
 * Actualitza una tasca existent al servidor amb una petició PUT.
 * @param {string} id - L'identificador de la tasca.
 * @param {string} nomTasca - El nou text de la tasca.
 * @param {boolean} completada - L'estat de completada de la tasca.
 * @returns {Promise<Object>} La resposta amb la tasca actualitzada.
 */
async function ferPut(id, nomTasca, completada) {
    try {
        const resposta = await fetch(`http://localhost:3000/tasks/${id}/`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ text: nomTasca, completed: completada })
        });
        const dades = await resposta.json();
        console.log('PUT:', dades);
        return dades;
    } catch (error) {
        console.error('Error PUT:', error);
        throw error;
    }
}

/**
 * Elimina una tasca del servidor amb una petició DELETE.
 * @param {string} id - L'identificador de la tasca a eliminar.
 * @returns {Promise<void>} Promesa que indica quan l'eliminació ha finalitzat.
 */
async function ferDelete(id) {
    try {
        const resposta = await fetch(`http://localhost:3000/tasks/${id}/`, {
            method: 'DELETE'
        });
        const dades = await resposta.json();
        console.log('DELETE:', dades);
        return dades;
    } catch (error) {
        console.error('Error DELETE:', error);
        throw error;
    }
}