// ================= IA CONSULTOR MODULE ================= 

function renderIA() {
    const { socios, ingresos } = window.appData;
    const activeGymId = Number(localStorage.getItem('gim_gym_id'));
    const gymSocios = socios.filter(s => s.gym_id === activeGymId);

    // 1. Analista de Retención (Churn)
    const containerRetencion = document.getElementById('ia-retencion-list');
    if (containerRetencion) {
        containerRetencion.innerHTML = '';
        
        // Criterio: No vino hace más de 10 días pero tiene plan activo
        const hoy = new Date();
        const sociosEnRiesgo = gymSocios.filter(socio => {
            if (socio.estado !== 'activo') return false;
            
            // Buscar último ingreso
            const ultimosIngresos = ingresos.filter(ing => ing.dni === socio.dni && ing.tipo === 'INGRESO');
            if (ultimosIngresos.length === 0) return true; // Nunca vino, riesgo alto

            const fechaUltimo = new Date(ultimosIngresos.sort((a,b) => new Date(b.fecha) - new Date(a.fecha))[0].fecha);
            const diferenciaDias = (hoy - fechaUltimo) / (1000 * 60 * 60 * 24);
            
            return diferenciaDias > 10;
        });

        if (sociosEnRiesgo.length === 0) {
            containerRetencion.innerHTML = '<p class="text-xs text-secondary text-center py-4">¡Excelente! Todos tus socios están activos y asistiendo regularmente.</p>';
        } else {
            sociosEnRiesgo.slice(0, 5).forEach(socio => {
                const div = document.createElement('div');
                div.className = 'churn-card';
                div.innerHTML = `
                    <div class="socio-info">
                        <p class="font-bold text-sm">${socio.nombre} ${socio.apellido}</p>
                        <p class="text-xs text-secondary">Plan: ${socio.plan || 'Estándar'}</p>
                    </div>
                    <button class="btn-whatsapp-small" onclick="window.sendIAWhatsApp('${socio.tel}', '${socio.nombre}')">
                        <i class="ph-fill ph-whatsapp-logo"></i>
                    </button>
                `;
                containerRetencion.appendChild(div);
            });
        }
    }
}

// Generador de Copys (Simulado con lógica de Prompt Engineering)
document.getElementById('btn-ia-generate')?.addEventListener('click', () => {
    const goal = document.getElementById('ia-copy-goal').value;
    const tone = document.getElementById('ia-copy-tone').value;
    const gymName = localStorage.getItem('gim_gym_name') || 'nuestro gimnasio';
    
    let result = "";

    const templates = {
        venta: {
            profesional: `¡Hola! Soy de ${gymName}. Notamos tu interés en mejorar tu salud. Contamos con planes integrales y staff certificado para ayudarte a cumplir tus metas. ¿Te gustaría agendar una visita?`,
            energico: `¡ES TU MOMENTO! 🔥 En ${gymName} tenemos la energía que necesitas para transformar tu cuerpo. ¡Sumate hoy y aprovechá nuestra promo de bienvenida! ¡No dejes para mañana lo que podés entrenar hoy! 🏋️‍♂️`,
            cercano: `Hola! Cómo estás? Te escribimos de ${gymName}. Queríamos invitarte a conocer nuestra comunidad. Más que un gimnasio, somos un equipo. Venite a probar una clase gratis! 😊`,
            urgente: `⚠️ ÚLTIMOS CUPOS! En ${gymName} lanzamos una promo relámpago solo por 24hs. Si te anotás hoy, tenés matrícula bonificada. ¡Corré que vuelan! 🏃‍♂️💨`
        },
        recuperacion: {
            profesional: `Estimado/a, notamos su ausencia en ${gymName}. Valoramos su progreso y nos gustaría saber si podemos ayudarle a retomar sus entrenamientos. Quedamos a su disposición.`,
            energico: `¡TE EXTRAÑAMOS EN EL BOX! 💪 El equipo de ${gymName} te espera para seguir dándole duro. ¡No pierdas lo que ya lograste! Venite esta semana y retomamos con todo.`,
            cercano: `Hola! Todo bien? Hace unos días no te vemos por ${gymName} y te extrañamos. Pasó algo? Si necesitás ayuda para volver a arrancar, acá estamos! Te esperamos. ❤️`,
            urgente: `¡Vuelve hoy o pierde su beneficio! Su plan en ${gymName} está pausado, pero tenemos una oferta especial para que retome hoy mismo. ¡Solo por esta semana!`
        },
        vencimiento: {
            profesional: `Le recordamos que su plan en ${gymName} vencerá pronto. Puede renovarlo en recepción para evitar interrupciones en su acceso. Muchas gracias.`,
            energico: `¡QUE NADA TE DETENGA! 🚀 Tu suscripción en ${gymName} está por vencer. Renovala hoy mismo y seguí enfocado en tus resultados. ¡Vamos por más!`,
            cercano: `Hola! Cómo va? Te aviso por las dudas que ya falta poquito para que venza tu mes en ${gymName}. Si querés, podés pasar por recepción y ya te olvidas! Nos vemos. 👍`,
            urgente: `¡ATENCIÓN! 🚨 Tu acceso a ${gymName} vencerá en 24hs. Evitá filas y renová tu plan ahora. ¡Te esperamos para entrenar!`
        },
        motivacion: {
            profesional: `Desde ${gymName} celebramos su compromiso con el entrenamiento. La constancia es la clave del éxito. Siga adelante con su planificación semanal.`,
            energico: `¡DALE CON TODO! 💪 Una semana más superada en ${gymName}. Cada repetición cuenta, cada gota de sudor te acerca a tu meta. ¡Mañana nos vemos de nuevo! 🔥`,
            cercano: `Buen día! Qué lindo verte entrenar con tantas ganas en ${gymName}. Seguí así que vas por excelente camino. Nos vemos mañana en el gimnasio! 😊`,
            urgente: `¡Llegó el viernes y se entrena igual! 😤 No dejes que el cansancio te gane. Te esperamos en ${gymName} para cerrar la semana como un campeón.`
        }
    };

    result = templates[goal][tone];

    const outputContainer = document.getElementById('ia-copy-result');
    const outputText = document.getElementById('ia-text-output');
    
    if (outputContainer && outputText) {
        outputContainer.classList.remove('hidden');
        outputText.innerText = result;
    }
});

// Función para enviar WhatsApp con el texto generado o uno rápido
window.sendIAWhatsApp = (tel, nombre) => {
    const msg = `Hola ${nombre}! Cómo estás? Te escribimos de ${localStorage.getItem('gim_gym_name')} porque te extrañamos por acá...`;
    const url = `https://api.whatsapp.com/send?phone=${tel}&text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
};

// Copiar al portapapeles
document.getElementById('btn-copy-ia')?.addEventListener('click', () => {
    const text = document.getElementById('ia-text-output').innerText;
    navigator.clipboard.writeText(text);
    alert('¡Copy copiado al portapapeles! Listo para pegar en WhatsApp o Instagram.');
});

// Listener de navegación
document.addEventListener('module-loaded', (e) => {
    if(e.detail.module === 'ia-section') {
        renderIA();
    }
});
