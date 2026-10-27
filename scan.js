// scan.js - Lógica para escanear DNI / Carné de Extranjería con la cámara

let videoStream = null;
let scanningInterval = null;

function iniciarEscaner(onDniDetectado) {
    // Evitar duplicados si ya existe un modal de escaneo abierto
    if (document.getElementById("modalEscaner")) return;

    // Crear la estructura visual del modal de la cámara
    const modal = document.createElement("div");
    modal.id = "modalEscaner";
    modal.classList.add("modalEscaner");

    const contenidoModal = document.createElement("div");
    contenidoModal.classList.add("contenidoModalEscaner");

    const titulo = document.createElement("h3");
    titulo.textContent = "Apunta al código de barras del DNI / Carné";

    const video = document.createElement("video");
    video.classList.add("videoCamara");
    video.id = "videoCamara";
    video.setAttribute("playsinline", true); // Vital para celulares

    const botonCerrar = document.createElement("button");
    botonCerrar.textContent = "Cancelar / Cerrar";
    botonCerrar.classList.add("botonCerrarEscaner");

    const mensajeError = document.createElement("p");
    mensajeError.id = "mensajeErrorEscaner";
    mensajeError.classList.add("errorEscaner");

    contenidoModal.appendChild(titulo);
    contenidoModal.appendChild(video);
    contenidoModal.appendChild(mensajeError);
    contenidoModal.appendChild(botonCerrar);
    modal.appendChild(contenidoModal);
    document.body.appendChild(modal);

    // Botón para cerrar y apagar la cámara
    botonCerrar.onclick = () => detenerEscaner();

    // Iniciar transmisión de la cámara trasera si está disponible
    navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
        .then((stream) => {
            videoStream = stream;
            video.srcObject = stream;
            video.play();
            
            // Verificar si el navegador soporta BarcodeDetector nativo
            if (!("BarcodeDetector" in window)) {
                mensajeError.textContent = "Tu navegador no soporta el detector de códigos nativo. Usa Chrome o Edge actualizado.";
                return;
            }

            const detector = new BarcodeDetector({ 
                formats: ["code_128", "code_39", "ean_13", "qr_code", "pdf417"] 
            });

            // Analizar fotogramas en busca de códigos
            scanningInterval = setInterval(async () => {
                try {
                    const barcodes = await detector.detect(video);
                    if (barcodes.length > 0) {
                        const codigoLeido = barcodes[0].rawValue.trim();
                        
                        // Extraer el número de documento según el formato estándar del DNI peruano
                        // (Los códigos de barra del DNI a veces traen información adicional o solo el número)
                        let documentoLimpio = extraerNumeroDocumento(codigoLeido);

                        if (documentoLimpio) {
                            detenerEscaner();
                            onDniDetectado(documentoLimpio);
                        }
                    }
                } catch (err) {
                    console.error("Error en el proceso de escaneo: ", err);
                }
            }, 300); // Revisa cada 300ms
        })
        .catch((err) => {
            console.error("No se pudo acceder a la cámara: ", err);
            mensajeError.textContent = "No se pudo acceder a la cámara. Revisa los permisos.";
        });
}

// Función auxiliar para extraer el DNI u 8/9 dígitos de una cadena compleja si fuera necesario
function extraerNumeroDocumento(texto) {
    // Si el texto leído es directamente el DNI (8 dígitos) o Carné de Extranjería (letras/números)
    // Limpiamos espacios o caracteres especiales si el PDF417 del DNI lanza data binaria larga.
    const matchDni = texto.match(/\d{8}/);
    if (matchDni) {
        return matchDni[0];
    }
    // Si es un carné de extranjería u otro formato alfanumérico limpio
    if (texto.length >= 8 && texto.length <= 12) {
        return texto;
    }
    return texto; // Retorno por defecto si cumple
}

function detenerEscaner() {
    if (scanningInterval) {
        clearInterval(scanningInterval);
        scanningInterval = null;
    }
    if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
        videoStream = null;
    }
    const modal = document.getElementById("modalEscaner");
    if (modal) {
        modal.remove();
    }
}