const URL_BACKEND = "https://backend-iestplurin.onrender.com"//backend público

let contenedorPadre = document.getElementById("contenedorPadre")
let contenedorAlerta
let dni = ""
let estudianteBuscado = null

//GENERAR INPUT
function generaraContenedorImput() {
    //contenedor input
    const contenedorInput = document.createElement("div")
    contenedorInput.id = "contenedorInput"
    contenedorInput.classList.add("contenedorInput")
    //titulo
    const Titulo = document.createElement("h1")
    Titulo.textContent = "Sistema de identificación"
    Titulo.classList.add("tituloImput")
    //input
    const inputDNI = document.createElement("input")
    inputDNI.type = "number"
    inputDNI.placeholder = "Ingrese su DNI"
    inputDNI.id = "DNIpaswore"
    inputDNI.classList.add("DNIpaswore")
    inputDNI.onkeydown = reconocerEnter
    //boton
    const botonEnviar = document.createElement("button")
    botonEnviar.type = "submit"
    botonEnviar.textContent = "Consultar"
    botonEnviar.classList.add("botonEnviar")
    botonEnviar.onclick = confirmarExistenciaDNI
    //cont alerta
    contenedorAlerta = document.createElement("div")
    contenedorAlerta.id = "contenedorAlerta"
    //mostrar
    contenedorInput.appendChild(inputDNI)
    contenedorInput.appendChild(botonEnviar)

    contenedorPadre.appendChild(Titulo)
    contenedorPadre.appendChild(contenedorInput)
    contenedorPadre.appendChild(contenedorAlerta)

    document.getElementById("DNIpaswore").focus()
}
generaraContenedorImput();

// Detectar Enter
function reconocerEnter(tecla) {
    if (tecla.key === "Enter") {
        tecla.preventDefault()
        confirmarExistenciaDNI()
    }
}

// Buscar DNI en el backend
async function confirmarExistenciaDNI() {
    // Leer
    const contraseña = document.getElementById("DNIpaswore");
    const dni = contraseña.value.trim();

    // Limpiar mensajes previos
    contenedorAlerta.textContent = ""

    // Crear y mostrar mensaje de carga
    const cargando = document.createElement("p")
    cargando.textContent = "Cargando información..."
    cargando.classList.add("cargando");
    contenedorAlerta.appendChild(cargando)

    if (dni === "") {
        cargando.textContent = "Ingrese un DNI"
        cargando.classList.remove("cargando")
        cargando.classList.add("falta")
        return
    } else if (dni.length !== 8) {
        cargando.textContent = "DNI incorrecto. deve tener 8 digitos"
        cargando.classList.remove("cargando")
        cargando.classList.add("error")
        return
    }

    try {
        // Consultar a tu backend (Render)
        const response = await fetch(`https://backend-iestplurin.onrender.com/buscar?dni=${dni}`)

        if (!response.ok) throw new Error("Error al conectar con la base de datos")

        const estudiante = await response.json();

        // Si no encuentra el DNI
        if (!estudiante || Object.keys(estudiante).length === 0) {
            cargando.textContent = "DNI no encontrado"
            cargando.classList.remove("cargando")
            cargando.classList.add("error")
            return;
        }

        // Si encuentra el estudiante
        cargando.remove(); // Quita el texto de carga
        estudianteBuscado = estudiante
        contenedorPadre.textContent = ""
        mostrarDatos()
        document.addEventListener("keydown", limpiar, { once: true })
        console.log("limpiar por cualquier tecla detectado")
    } catch (error) {
        cargando.textContent = "Error de conexión. Intente de nuevo."
        cargando.classList.remove("cargando")
        cargando.classList.add("error")
        console.error("Error:", error)
    }
}


// Mostrar datos del estudiante
function mostrarDatos() {
    const Titulo = document.createElement("h1")
    Titulo.textContent = "Bienvenido"
    Titulo.classList.add("tituloBienvenido")

    const contenedorInfo = document.createElement("div")
    contenedorInfo.classList.add("contenedorInfo")

    const datos = document.createElement("div")
    datos.classList.add("datos")
    datos.id = "datos"

    const ContenedorImg = document.createElement("div")
    ContenedorImg.classList.add("ContenedorImg")
    ContenedorImg.id = "ContenedorImg"

    const campos = ["DNI: ", "Nombre: ", "Apellidos: ", "Estado: ", "Carrera: ", "Turno: ", "Ciclo: "]
    const valores = ["DNI", "nombre", "apellidos", "estado", "carrera", "turno", "ciclo"]

    for (let i = 0; i < valores.length; i++) {
        const campo = document.createElement("label")
        campo.textContent = campos[i];
        const valor = document.createElement("p")

        if (valores[i] === "apellidos") {
            valor.textContent = estudianteBuscado.apellido_P + " " + estudianteBuscado.apellido_M
        } else {
            valor.textContent = estudianteBuscado[valores[i]] ?? "Dato no encontrado"
        }

        datos.appendChild(campo);
        datos.appendChild(valor);
    }

    const imgEstudiante = document.createElement("img");
    imgEstudiante.classList.add("imgEstudiante");
    imgEstudiante.src = `img/alumnos/${estudianteBuscado.DNI}.jpeg`;

 
    imgEstudiante.onerror = () => {

        imgEstudiante.onerror = null;

        console.warn(`No se encontró la foto para el DNI: ${estudianteBuscado.DNI}, cargando imagen por defecto.`);
        imgEstudiante.src = "/img/img_default.png";
    };

    const botonLimpiar = document.createElement("button")
    botonLimpiar.textContent = "Limpiar"
    botonLimpiar.onclick = limpiar
    botonLimpiar.classList.add("botonLimpiar")

    const nota = document.createElement("p")
    nota.textContent = "Nota: presiona cualquier tecla para limpiar";
    nota.classList.add("nota")

    ContenedorImg.appendChild(imgEstudiante)
    contenedorInfo.appendChild(datos)
    contenedorInfo.appendChild(ContenedorImg)

    contenedorPadre.appendChild(Titulo)
    contenedorPadre.appendChild(contenedorInfo)
    contenedorPadre.appendChild(botonLimpiar)
    contenedorPadre.appendChild(nota)

    confirmarEstadoEstudiante()
}

function limpiar() {
    contenedorPadre.textContent = ""
    generaraContenedorImput();
}

// Confirmar estado
function confirmarEstadoEstudiante() {
    if (estudianteBuscado.estado === "MATRICULADO") sonidoMatriculado()
    else if (estudianteBuscado.estado === "NO MATRICULADO") sonidoNoMatriculado()
    else sonidoEgresado()
}

// Sonidos
function sonidoEgresado() {
    new Audio("sound/Egresado.mp3").play();
}
function sonidoMatriculado() {
    new Audio("sound/Matriculado.mp3").play();
}
function sonidoNoMatriculado() {
    new Audio("sound/NoMatriculado.mp3").play();
}
