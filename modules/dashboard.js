// ================= DASHBOARD & RESTO MODULES ================= 

document.addEventListener('module-loaded', (e) => {
    switch(e.detail.module) {
        case 'dashboard-section': renderDashboard(); break;
        case 'historial-section': renderHistorial(); break;
        case 'alertas-section': renderAlertas(); break;
    }
});

// ESCUCHA EN TIEMPO REAL
document.addEventListener('app-data-updated', () => {
    // Si estamos en dashboard o historial, refrescar inmediatamente
    if(!document.getElementById('dashboard-section').classList.contains('hidden')) renderDashboard();
    if(!document.getElementById('historial-section').classList.contains('hidden')) renderHistorial();
});

const historialDateFilter = document.getElementById('filtro-fecha-historial');
if(historialDateFilter) {
    historialDateFilter.addEventListener('change', renderHistorial);
}

function renderDashboard() {
    let activos = 0, porVenc = 0, venc = 0, ingMes = 0;
    const { socios, pagos } = window.appData;
    const activeGymId = Number(localStorage.getItem('gim_gym_id'));

    const gymSocios = socios.filter(s => s.gym_id === activeGymId);
    const gymPagos = pagos.filter(p => {
        const pGymId = (p.gym_id !== undefined && p.gym_id !== null) ? Number(p.gym_id) : null;
        
        // PRIORIDAD 1: Por ID de Gimnasio Explícito
        if(pGymId !== null) return pGymId === activeGymId;
        
        // PRIORIDAD 2: Recurso de legado por DNI (solo si el gym NO es el master)
        if(activeGymId === 0) return false;
        
        const s = socios.find(so => so.dni === p.dni);
        return s && Number(s.gym_id) === activeGymId;
    });

    gymSocios.forEach(s => {
        const est = window.checkEstado(s.vencimiento);
        if(est === 'al-dia') activos++;
        else if(est === 'por-vencer') porVenc++;
        else venc++;
    });
    
    // Ingresos del mes
    const hoyMes = new Date().getMonth();
    const hoyAno = new Date().getFullYear();
    gymPagos.forEach(p => {
        const d = new Date(p.fecha);
        if(d.getMonth() === hoyMes && d.getFullYear() === hoyAno) ingMes += Number(p.monto);
    });

    const dashIngresos = document.getElementById('dash-ingresos');
    if(dashIngresos) dashIngresos.textContent = `$${ingMes.toLocaleString()}`;
    const dashActivos = document.getElementById('dash-activos');
    if(dashActivos) dashActivos.textContent = activos + porVenc;
    const dashVencidos = document.getElementById('dash-vencidos');
    if(dashVencidos) dashVencidos.textContent = venc;

    const hoyStr = new Date().toISOString().split('T')[0];
    const presentHoy = window.appData.ingresos.filter(i => {
        return i.gym_id === activeGymId && i.fecha.startsWith(hoyStr) && i.tipo === 'INGRESO';
    }).length;
    const countAssistEl = document.getElementById('dash-asistencias-hoy');
    if(countAssistEl) countAssistEl.textContent = presentHoy;

    // Boton reset listener
    const btnReset = document.getElementById('btn-reset-demo');
    if(btnReset) {
        btnReset.onclick = async () => {
            if(confirm("¿Estás seguro? Esto borrará los socios actuales y cargará nuevos de prueba.")) {
                try {
                    await window.generateTestData(true);
                    window.location.reload();
                } catch(e) {
                    alert("Error al resetear: " + e.message);
                }
            }
        };
    }
}

function renderHistorial() {
    const tbody = document.getElementById('tabla-historial-asistencia');
    if(!tbody) return;
    tbody.innerHTML = '';
    
    const filterDate = historialDateFilter ? historialDateFilter.value : null;
    const eventosPermitidos = ['INGRESO', 'SALIDA', 'DENEGADO_POR_CUOTA_VENCIDA'];
    const activeGymId = Number(localStorage.getItem('gim_gym_id'));
    const gymSociosDnis = window.appData.socios
        .filter(s => s.gym_id === activeGymId)
        .map(s => s.dni);
        
    let logs = [...window.appData.ingresos]
        .filter(i => {
            const matchesType = eventosPermitidos.includes(i.tipo);
            const matchesGym = i.gym_id === activeGymId || gymSociosDnis.includes(i.dni);
            return matchesType && matchesGym;
        });

    if(filterDate) {
        logs = logs.filter(i => i.fecha.startsWith(filterDate));
    }

    const reversed = logs.reverse().slice(0, 50);

    if(reversed.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="text-secondary text-center py-4">
            ${filterDate ? 'Sin registros para esta fecha.' : 'Sin registros relevantes.'}
        </td></tr>`;
        return;
    }

    reversed.forEach(i => {
        let badgeClass = 'al-dia';
        let tipoDisplay = i.tipo.replace(/_/g, ' ');

        if (i.tipo === 'SALIDA') badgeClass = 'text-primary';
        if (i.tipo === 'DENEGADO_POR_CUOTA_VENCIDA') {
            badgeClass = 'vencido';
            tipoDisplay = 'CUOTA VENCIDA';
        }

        const trClass = i.tipo.startsWith('DENEGADO') ? 'style="background:rgba(239,68,68,0.05)"' : '';
        
        tbody.innerHTML += `
            <tr ${trClass}>
                <td>${window.formatDate(i.fecha.split('T')[0])} <span class="text-secondary">${i.fecha.split('T')[1].substr(0,5)} hs</span></td>
                <td><strong>${i.nombre}</strong></td>
                <td>${i.dni}</td>
                <td><span class="badge ${badgeClass}">${tipoDisplay}</span></td>
            </tr>
        `;
    });
}
// renderAlertas logic removed from dashboard.js as it is now managed by recordatorios.js for Pro features.
