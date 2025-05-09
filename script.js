document.addEventListener("DOMContentLoaded", () => {
    const input = document.getElementById("input");
    const button = document.getElementById("afegirTasca");
    const llista = document.querySelector(".tasques");


    // MOSTRAR TASQUES
    ferGet().then(tasks => {
        tasks.forEach(task => {
            const tasca = document.createElement("li");
            tasca.textContent = task.text;
            llista.appendChild(tasca);
        });
    })

    // AFEGIR TASCA
    button.addEventListener("click", () => {
        ferPost(input.value.toLowerCase());
        tasca = document.createElement("li");
        tasca.textContent = input.value;
        llista.appendChild(tasca);
    })


})


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
    } catch (error) {
        console.error('Error POST:', error);
    }
}

async function ferPut(id) {
    try {
        const resposta = await fetch(`http://localhost:3000/tasks/${id}/`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ nom: 'Joan', edat: 31 })
        });
        const dades = await resposta.json();
        console.log('PUT:', dades);
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


