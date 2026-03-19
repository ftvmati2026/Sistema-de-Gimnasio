// ================= ACCESO MODULE ================= 
const inputDNI = document.getElementById('acceso-dni');
const btnVerificar = document.getElementById('btn-check-acceso');
const resDiv = document.getElementById('acceso-resultado');

function renderAccesos() {
    const ul = document.getElementById('acceso-ultimos');
    ul.innerHTML = '';
    const hoy = new Date().toISOString().split('T')[0];
    
    // Solo ingresos de hoy
    const deHoy = window.appData.ingresos.filter(i => i.fecha.startsWith(hoy));
    
    if(deHoy.length === 0){
        ul.innerHTML = '<li class="text-secondary text-sm">Sin ingresos.</li>';
        return;
    }

    deHoy.slice().reverse().slice(0, 10).forEach(a => {
        const bg = a.tipo === 'INGRESO' ? 'text-success' : 'text-error';
        ul.innerHTML += `
            <li>
                <div>
                    <strong>${a.nombre}</strong><br>
                    <span class="text-sm ${bg}">${a.tipo.replace(/_/g, ' ')}</span>
                </div>
                <span class="text-sm text-secondary">${a.fecha.split('T')[1].substr(0,5)} hs</span>
            </li>
        `;
    });
}

document.addEventListener('module-loaded', (e) => {
    if(e.detail.module === 'acceso-section') {
        renderAccesos();
        inputDNI.focus();
    }
});

function verificarAcceso() {
    const dni = inputDNI.value.trim();
    if(!dni) return;

    resDiv.classList.remove('hidden');
    
    const socio = window.appData.socios.find(s => s.dni === dni);
    const ahora = new Date();
    const hoyStr = ahora.toISOString().split('T')[0];
    
    if(!socio) {
        showResult('info', '<i class="ph-fill ph-magnifying-glass"></i> Socio no encontrado');
        return;
    }
    
    // 1. Validar Estado de Pago (Pendiente no entra)
    if(socio.estado_cuota === 'pendiente') {
        showResult('info', `<i class="ph-fill ph-credit-card"></i> Acceso Bloqueado: Pago Pendiente<br><small>El socio debe registrar su primer pago para habilitar el acceso.</small>`, socio);
        return;
    }
    
    // 2. Validar Vencimiento (Caso Crítico -> DENEGADO)
    const est = window.checkEstado(socio.vencimiento);
    if(est === 'vencido') {
        showResult('error', `<i class="ph-fill ph-warning-circle"></i> No puede ingresar: cuota vencida<br><small>Vencimiento: ${window.formatDate(socio.vencimiento)}</small>`, socio);
        registrarEvento(socio.dni, socio.nombre, 'DENEGADO_POR_CUOTA_VENCIDA');
        return;
    }

    // 2. Validar Presencia RE REAL (Basado en el ÚLTIMO evento de hoy)
    const eventosHoy = window.appData.ingresos.filter(i => 
        i.dni === dni && i.fecha.startsWith(hoyStr) && (i.tipo === 'INGRESO' || i.tipo === 'SALIDA')
    );
    const ultimoEvento = eventosHoy.length > 0 ? eventosHoy[eventosHoy.length - 1] : null;
    const estaDentro = ultimoEvento && ultimoEvento.tipo === 'INGRESO';
    
    if(estaDentro) {
        showResult('info', `
            <div style="text-align:center;">
                <h3 class="text-primary"><i class="ph-fill ph-info"></i> El socio ya se encuentra dentro del gimnasio</h3>
                <p class="mt-2 text-secondary">Debe registrar su salida antes de volver a ingresar.</p>
                <button class="btn btn-secondary mt-4" disabled style="cursor: not-allowed; opacity: 0.6;">
                    <i class="ph ph-lock"></i> Ingreso Bloqueado
                </button>
            </div>
        `, socio);
        return;
    }

    // 3. Validar Límite Semanal (Lunes a Domingo - Solo cuenta INGRESO)
    const lunes = new Date(ahora);
    lunes.setDate(ahora.getDate() - (ahora.getDay() === 0 ? 6 : ahora.getDay() - 1));
    lunes.setHours(0,0,0,0);
    
    const ingresosSemana = window.appData.ingresos.filter(i => {
        const f = new Date(i.fecha);
        return i.dni === dni && i.tipo === 'INGRESO' && f >= lunes;
    }).length;

    const limite = Number(socio.limite_ingresos_semanales) || (socio.asistencias ? socio.asistencias.length : 3) || 3;
    if(ingresosSemana >= limite) {
        showResult('error', `<h3 style="color:var(--error); font-size:1.3rem; margin-bottom:5px;"><i class="ph-fill ph-calendar-x"></i> ACCESO DENEGADO</h3><p>El socio ya consumió su cantidad máxima de ingresos semanales permitidos (<b>${limite} de ${limite}</b>).</p>`, socio);
        return;
    }

    // EXITO -> Mostrar botón activo
    const warning = est === 'por-vencer' ? '<br><small class="text-warning">Aviso: cuota próxima a vencer</small>' : '';
    showResult('success', `
        <div style="display:flex; justify-content:space-between; align-items:center;">
            <div>
                <h3 class="text-success" style="font-size:1.3rem;"><i class="ph-fill ph-check-circle"></i> Ingreso Autorizado</h3>
                <p class="mt-2 text-xl"><strong>${socio.nombre} ${socio.apellido}</strong></p>
                <div style="margin-top:10px; padding:8px; background:var(--bg-main); border-radius:6px; font-weight:bold; color:var(--text-main);">
                    Ingresos esta semana: <span class="text-primary">${ingresosSemana + 1} de ${limite}</span>
                </div>
                ${warning}
            </div>
            <button class="btn btn-primary" id="btn-registrar-ingreso" data-dni="${socio.dni}" data-nombre="${socio.nombre}" style="font-size:1.1rem; padding:15px 30px;">Dar Presente</button>
        </div>
    `);

    document.getElementById('btn-registrar-ingreso').addEventListener('click', (e) => {
        registrarEvento(e.target.dataset.dni, e.target.dataset.nombre, 'INGRESO');
    });
}

function showResult(type, html, socio = null) {
    resDiv.style.background = type === 'success' ? 'rgba(16, 185, 129, 0.1)' : (type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)');
    resDiv.style.border = type === 'success' ? '1px solid var(--success)' : (type === 'error' ? '1px solid var(--error)' : '1px solid var(--primary)');
    const socioInfo = socio ? `<p class="mt-2 text-sm text-secondary"><strong>Socio:</strong> ${socio.nombre} ${socio.apellido} | <strong>DNI:</strong> ${socio.dni}</p>` : '';
    resDiv.innerHTML = `<div>${html}${socioInfo}</div>`;
}

function registrarEvento(dni, nombre, tipo) {
    // DOBLE VALIDACION DE SEGURIDAD BASADA EN PRESENCIA
    const hoyStr = new Date().toISOString().split('T')[0];
    const eventosHoy = window.appData.ingresos.filter(i => 
        i.dni === dni && i.fecha.startsWith(hoyStr) && (i.tipo === 'INGRESO' || i.tipo === 'SALIDA')
    );
    const ultimoEvento = eventosHoy.length > 0 ? eventosHoy[eventosHoy.length - 1] : null;
    const estaDentro = ultimoEvento && ultimoEvento.tipo === 'INGRESO';
    
    if (tipo === 'INGRESO' && estaDentro) {
        alert("Operación cancelada: El socio ya tiene un ingreso abierto. Registre la salida primero.");
        verificarAcceso(); 
        return;
    }

    const activeGymId = Number(localStorage.getItem('gim_gym_id'));
    window.appData.ingresos.push({
        id: Date.now(),
        gym_id: activeGymId,
        dni, nombre, tipo, fecha: new Date().toISOString()
    });
    window.appData.save();
    renderAccesos();
    inputDNI.value = '';
    
    if (tipo === 'INGRESO') {
        resDiv.innerHTML = `<h3 class="text-success text-center"><i class="ph ph-check"></i> Ingreso registrado correctamente</h3>`;
    }

    // Notificar a otros módulos
    document.dispatchEvent(new CustomEvent('module-loaded', { detail: { module: 'dashboard-section' } }));
    document.dispatchEvent(new CustomEvent('module-loaded', { detail: { module: 'presentes-section' } }));
}

btnVerificar.addEventListener('click', verificarAcceso);
inputDNI.addEventListener('keydown', (e) => { if(e.key === 'Enter') verificarAcceso(); });
