// ================= SOCIOS PRESENTES MODULE ================= 
const tablaPresentes = document.getElementById('tabla-presentes');

function renderPresentes() {
    tablaPresentes.innerHTML = '';
    const hoyStr = new Date().toISOString().split('T')[0];
    
    // Obtener eventos pertinentes de hoy
    const eventosHoy = window.appData.ingresos.filter(i => 
        i.fecha.startsWith(hoyStr) && (i.tipo === 'INGRESO' || i.tipo === 'SALIDA')
    );
    
    // Agrupar por socio para ver su estado actual
    const sociosDentro = {};
    eventosHoy.forEach(ev => {
        if (ev.tipo === 'INGRESO') {
            sociosDentro[ev.dni] = ev;
        } else if (ev.tipo === 'SALIDA') {
            delete sociosDentro[ev.dni];
        }
    });

    const unicos = Object.values(sociosDentro);
    let presentesReal = 0;

    if(unicos.length === 0) {
        tablaPresentes.innerHTML = '<tr><td colspan="5" class="text-center text-secondary py-4">No hay personas en el gimnasio.</td></tr>';
        const dashPre = document.getElementById('dash-presentes');
        if(dashPre) dashPre.textContent = 0;
        return;
    }

    const ahora = new Date();

    // Ordenar por hora de ingreso (más reciente arriba)
    unicos.sort((a,b) => new Date(b.fecha) - new Date(a.fecha)).forEach(i => {
        const fechaIngreso = new Date(i.fecha);
        // Sesión recomendada: 1h
        const fechaSalidaEstimada = new Date(fechaIngreso.getTime() + (60 * 60000));
        const difMins = Math.floor((fechaSalidaEstimada - ahora) / 60000);
        
        presentesReal++;

        let estHTML = difMins > 0 ? 
            `<span class="text-success">${difMins} min restantes</span>` : 
            `<span class="text-error">Tiempo excedido (${Math.abs(difMins)} min)</span>`;

        const hIn = fechaIngreso.toLocaleTimeString('es-AR', {hour: '2-digit', minute:'2-digit'});
        const hOut = fechaSalidaEstimada.toLocaleTimeString('es-AR', {hour: '2-digit', minute:'2-digit'});

        tablaPresentes.innerHTML += `
            <tr>
                <td><strong>${i.nombre}</strong><br><span class="text-sm text-secondary">DNI: ${i.dni}</span></td>
                <td>${hIn} hs</td>
                <td class="text-secondary">${hOut} hs</td>
                <td>${estHTML}</td>
                <td>
                    <button class="btn btn-icon danger" onclick="registrarSalida('${i.dni}', '${i.nombre}')" title="Registrar Salida">
                        <i class="ph ph-sign-out"></i>
                    </button>
                </td>
            </tr>
        `;
    });

    // Update global dashboard indicator with Capacity Alert logic (Limit 50)
    const dashPre = document.getElementById('dash-presentes');
    if(dashPre) {
        dashPre.textContent = presentesReal;
        const card = dashPre.closest('.kpi-card');
        const cap = 50;
        const pct = (presentesReal / cap) * 100;
        
        if(pct >= 100) {
            dashPre.className = 'text-error';
            if(card) card.style.boxShadow = 'inset 0 0 10px var(--error)';
        } else if (pct >= 80) {
            dashPre.className = 'text-warning';
            if(card) card.style.boxShadow = 'inset 0 0 10px var(--warning)';
        } else {
            dashPre.className = 'text-primary';
            if(card) card.style.boxShadow = 'none';
        }
    }
}

// Auto-refresh every 10 seconds for real-time capacity
setInterval(() => {
    const isDashboard = document.getElementById('dashboard-section') && !document.getElementById('dashboard-section').classList.contains('hidden');
    const isPresentes = document.getElementById('presentes-section') && !document.getElementById('presentes-section').classList.contains('hidden');
    
    if(isDashboard || isPresentes) {
        renderPresentes();
    }
}, 10000);

document.addEventListener('module-loaded', (e) => {
    if(e.detail.module === 'presentes-section' || e.detail.module === 'dashboard-section') {
        renderPresentes();
    }
});

window.registrarSalida = (dni, nombre) => {
    if(confirm(`¿Registrar salida de ${nombre}?`)) {
        window.appData.ingresos.push({
            id: Date.now(),
            dni, 
            nombre, 
            tipo: 'SALIDA', 
            fecha: new Date().toISOString()
        });
        window.appData.save();
        renderPresentes();
        
        // Notificar al historial
        document.dispatchEvent(new CustomEvent('module-loaded', { detail: { module: 'historial-section' } }));
        // Notificar al dashboard por si los contadores cambian
        document.dispatchEvent(new CustomEvent('module-loaded', { detail: { module: 'dashboard-section' } }));
    }
}
