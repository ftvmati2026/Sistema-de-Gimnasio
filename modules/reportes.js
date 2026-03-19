// ================= REPORTES MODULE ================= 
let chartPlanes = null;
let chartAsistencia = null;

function renderReportes() {
    const activeGymId = Number(localStorage.getItem('gim_gym_id'));
    const { socios, ingresos } = window.appData;

    // ----- Filtrado Activo -----
    const gymSocios = socios.filter(s => s.gym_id === activeGymId);
    
    // 1. Chart: Ingresos (Socios) por Plan
    const planesDict = {};
    gymSocios.forEach(s => {
        const p = s.plan || 'Sin Plan';
        planesDict[p] = (planesDict[p] || 0) + 1;
    });

    const ctxPlanes = document.getElementById('chart-planes');
    if(ctxPlanes) {
        if(chartPlanes) chartPlanes.destroy();
        chartPlanes = new Chart(ctxPlanes.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: Object.keys(planesDict),
                datasets: [{
                    data: Object.values(planesDict),
                    backgroundColor: ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'right', labels: { color: getComputedStyle(document.body).getPropertyValue('--text-main').trim() } }
                }
            }
        });
    }

    // 2. Chart: Asistencia Semanal (Últimos 7 días)
    const fecha = new Date();
    fecha.setHours(0,0,0,0);
    
    const dias = [];
    const counts = [];
    
    // Create an array of the last 7 days strings
    for(let i=6; i>=0; i--) {
        const temp = new Date(fecha.getTime() - (i * 24 * 60 * 60 * 1000));
        const dayStr = temp.toLocaleDateString('es-AR', { weekday: 'short' });
        dias.push(dayStr.toUpperCase());
        
        const key = temp.toISOString().split('T')[0];
        // Count entries for active gym members
        const count = ingresos.filter(ing => {
            return ing.tipo === 'INGRESO' && ing.fecha.startsWith(key) && gymSocios.find(s => s.dni === ing.dni);
        }).length;
        counts.push(count);
    }

    const ctxAsistencia = document.getElementById('chart-asistencia');
    if(ctxAsistencia) {
        if(chartAsistencia) chartAsistencia.destroy();
        chartAsistencia = new Chart(ctxAsistencia.getContext('2d'), {
            type: 'bar',
            data: {
                labels: dias,
                datasets: [{
                    label: 'Ingresos diarios',
                    data: counts,
                    backgroundColor: '#10b981',
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: true, ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
                    x: { ticks: { color: '#94a3b8' }, grid: { display: false } }
                },
                plugins: {
                    legend: { display: false }
                }
            }
        });
    }

    // 3. Tabla de Auditoría (Registro de Actividad)
    const tablaAuditoria = document.getElementById('tabla-auditoria');
    if (tablaAuditoria) {
        tablaAuditoria.innerHTML = '';
        const auditoriaActiva = (window.appData.auditoria || []).filter(a => a.gym_id === activeGymId);
        
        if (auditoriaActiva.length === 0) {
            tablaAuditoria.innerHTML = '<tr><td colspan="4" class="text-secondary text-center py-4">No hay actividad reciente registrada en este gimnasio.</td></tr>';
        } else {
            auditoriaActiva.slice(0, 30).forEach(log => {
                const dateObj = new Date(log.fecha);
                const fechaStr = dateObj.toLocaleDateString('es-AR') + ' ' + dateObj.toLocaleTimeString('es-AR', {hour: '2-digit', minute:'2-digit'});
                
                let badgeClass = 'text-primary';
                if(log.accion === 'ALTA_SOCIO' || log.accion === 'COBRO') badgeClass = 'text-success';
                if(log.accion === 'BAJA_SOCIO') badgeClass = 'text-error';
                if(log.accion === 'EDICION_SOCIO') badgeClass = 'text-warning';

                tablaAuditoria.innerHTML += `
                    <tr>
                        <td class="text-sm text-secondary">${fechaStr}</td>
                        <td><strong><i class="ph-fill ph-user-circle"></i> ${log.actor}</strong></td>
                        <td><span class="badge" style="background:var(--bg-hover); border:1px solid var(--border);"><span class="${badgeClass}">${log.accion.replace(/_/g, ' ')}</span></span></td>
                        <td class="text-sm">${log.detalle}</td>
                    </tr>
                `;
            });
        }
    }
}

document.addEventListener('module-loaded', (e) => {
    if(e.detail.module === 'reportes-section') {
        // Add a slight timeout to ensure canvas is fully visible for Chart.js calculating size
        setTimeout(renderReportes, 50);
    }
});
