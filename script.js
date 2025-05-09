document.addEventListener("DOMContentLoaded", () => {
    cargarTasques();
    afegirTasca();
})

function afegirTasca() {
    const input = document.getElementById("input");
    const button = document.getElementById("afegirTasca");
    const llista = document.querySelector(".tasques");

    // AFEGIR TASCA
    button.addEventListener("click", async () => {
        try {
            const novaTasca = await ferPost(input.value.toLowerCase());
            const tasca = document.createElement("li");
            const textSpan = document.createElement("span");
            textSpan.textContent = input.value;
            tasca.appendChild(textSpan);
            llista.appendChild(tasca);
            cargarBotons(tasca, novaTasca.id, textSpan);
            input.value = '';
        } catch (error) {
            console.error('Error al añadir tarea:', error);
        }
    });
}

function cargarTasques() {
    const llista = document.querySelector(".tasques");
    ferGet().then(tasks => {
        tasks.forEach(task => {
            const tasca = document.createElement("li");
            const textSpan = document.createElement("span");
            textSpan.textContent = task.text;
            tasca.appendChild(textSpan);
            llista.appendChild(tasca);
            cargarBotons(tasca, task.id, textSpan); // Cambiado taskId por task.id
        });
    });
}

function cargarBotons(elementLi, taskId, textSpan) {
    const eliminar = document.createElement("button");
    eliminar.className = "eliminar";
    eliminar.textContent = "❌";
    const finalitzar = document.createElement("button");
    finalitzar.className = "finalitzar";
    finalitzar.textContent = "✅";
    const editar = document.createElement("button");
    editar.className = "editar";
    editar.textContent = "✏️";

    elementLi.appendChild(eliminar);
    elementLi.appendChild(finalitzar);
    elementLi.appendChild(editar);

    // ELIMINAR TASCA
    eliminar.addEventListener("click", () => {
        ferDelete(taskId);
        elementLi.remove();
    });

    // FINALITZAR TASCA
    finalitzar.addEventListener("click", () => {
        const isCompleted = textSpan.style.textDecoration === "line-through";
        const newCompletedState = !isCompleted;

        ferPut(taskId, textSpan.textContent, newCompletedState).then(() => {
            textSpan.style.textDecoration = newCompletedState ? "line-through" : "none";
        }).catch(error => {
            console.error('Error al actualizar tarea:', error);
        });
    });

    // EDITAR TASCA
    editar.addEventListener("click", () =>{
        const nouText = prompt("Modifica la tasca:");
        ferPut(taskId, nouText, true).then(() => {
            textSpan.textContent = nouText;

        })
    })
}

async function ferGet() {
    try {
        const resposta = await fetch('http://localhost:3000/tasks/');
        const dades = await resposta.json();
        console.log('GET:', dades);
        return dades;
    } catch (error) {
        console.error('Error GET:', error);
    }
}

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
    }
}

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
    }
}

async function ferDelete(id) {
    try {
        const resposta = await fetch(`http://localhost:3000/tasks/${id}/`, {
            method: 'DELETE'
        });
        const dades = await resposta.json();
        console.log('DELETE:', dades);
    } catch (error) {
        console.error('Error DELETE:', error);
    }
}


