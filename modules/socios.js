// ================= SOCIOS MODULE ================= 
const tablaSocios = document.getElementById('tabla-socios');
const modalSocio = document.getElementById('modal-socio');
const formSocio = document.getElementById('form-socio');
const btnNuevo = document.getElementById('btn-nuevo-socio');
const searchInput = document.getElementById('search-socio');

const statusFilter = document.getElementById('filter-socio-status');

window.generarLinkWhatsapp = (socio) => {
    if (!socio.tel) return '#';
    let rawStr = String(socio.tel);
    let tel = rawStr.replace(/[^0-9]/g, ''); 
    if (tel.length === 10) tel = '549' + tel; 
    
    // Configurar mensajes segun estado
    const estado = window.checkEstado(socio.vencimiento);
    const gymName = document.getElementById('active-gym-name')?.textContent || 'Gimnasio';
    let mensaje = `Hola ${socio.nombre}! Te escribimos de *${gymName}*. \n\n`;

    if (socio.estado_cuota === 'pendiente') {
        mensaje += `Te recordamos que tienes pendiente el abono de tu primer cuota para habilitar tu ingreso. ¡Te esperamos por recepción y seguir entrenando a tope!`;
    } else if (estado === 'vencido') {
        mensaje += `Queríamos informarte que tu membresía se encuentra *VENCIDA* desde el ${window.formatDate(socio.vencimiento)} 🚨. Por favor, acercate a recepción para regularizar tu situación. ¡Te extrañamos!`;
    } else if (estado === 'por-vencer') {
        mensaje += `Nos acercamos por este medio para recordarte que a tu cuota le quedan pocos días y vence el *${window.formatDate(socio.vencimiento)}* 🗓️. ¡Te esperamos para renovar y seguir metiéndole duro!`;
    } else {
        mensaje += `Pasamos a saludarte y chequear cómo vienen tus entrenamientos 💪. ¡A seguir rompiéndola!`;
    }

    return `https://wa.me/${tel}?text=${encodeURIComponent(mensaje)}`;
};

function renderSocios() {
    const sVal = searchInput.value.toLowerCase();
    const fVal = statusFilter ? statusFilter.value : 'todos';
    tablaSocios.innerHTML = '';
    
    const { socios } = window.appData;
    const activeGymId = Number(localStorage.getItem('gim_gym_id'));

    let filtrados = socios.filter(s => {
        if (s.gym_id !== activeGymId) return false;
        
        const matchesSearch = s.nombre.toLowerCase().includes(sVal) || s.apellido.toLowerCase().includes(sVal) || s.dni.includes(sVal);
        
        let matchesStatus = true;
        if (fVal !== 'todos') {
            const actualEst = window.checkEstado(s.vencimiento);
            if (fVal === 'pendiente') {
                matchesStatus = s.estado_cuota === 'pendiente';
            } else {
                // Si el socio es pendiente, no coincide con otros estados aunque la fecha sea vieja
                matchesStatus = (s.estado_cuota !== 'pendiente') && (actualEst === fVal);
            }
        }
        
        return matchesSearch && matchesStatus;
    });
    
    // ORDEN ALFABETICO (Apellido, Nombre)
    filtrados.sort((a, b) => {
        const aFull = `${a.apellido} ${a.nombre}`.toLowerCase();
        const bFull = `${b.apellido} ${b.nombre}`.toLowerCase();
        return aFull.localeCompare(bFull);
    });
    
    if(filtrados.length === 0){
        tablaSocios.innerHTML = '<tr><td colspan="6" class="text-secondary text-center py-4">Socio no encontrado</td></tr>';
        return;
    }

    filtrados.forEach(s => {
        let est = window.checkEstado(s.vencimiento);
        let badgeText = est.replace('-', ' ');
        let badgeClass = est;

        if (s.estado_cuota === 'pendiente') {
            est = 'pendiente';
            badgeText = 'Pendiente de pago';
            badgeClass = 'pendiente';
        }

        const asistencias = s.asistencias || [];
        const cantDias = asistencias.length;
        const diasTexto = cantDias > 0 ? `${cantDias} veces por semana` : 'Sin días';
        const asistenciasFormateadas = asistencias.length > 0 
            ? asistencias.map(a => `<span class="badge" style="background:var(--bg-surface); padding:2px 6px;">${a.dia} ${a.hora}</span>`).join(' ') 
            : '-';

        tablaSocios.innerHTML += `
            <tr>
                <td><span class="badge ${badgeClass}">${badgeText}</span></td>
                <td><strong>${s.apellido}, ${s.nombre}</strong><br><span class="text-sm text-secondary">DNI: ${s.dni}</span></td>
                <td>${s.tel || '-'}<br><span class="text-sm text-secondary">${s.email || ''}</span></td>
                <td>${s.plan} <br><div class="mt-1">${asistenciasFormateadas} <span class="text-xs text-secondary">(${diasTexto})</span></div></td>
                <td class="${est==='vencido'?'text-error':''}">${window.formatDate(s.vencimiento)}</td>
                <td>
                    <button class="btn btn-icon" onclick="editarSocio(${s.id})" title="Editar"><i class="ph ph-pencil-simple"></i></button>
                    ${s.tel ? 
                        `<a href="${window.generarLinkWhatsapp(s)}" target="_blank" class="btn btn-icon" style="color: #25D366; text-decoration: none;" title="Recordatorio por WhatsApp"><i class="ph-fill ph-whatsapp-logo"></i></a>` 
                        : 
                        `<button class="btn btn-icon" style="color: var(--border); cursor: not-allowed;" title="No tiene número de teléfono cargado" disabled><i class="ph ph-whatsapp-logo"></i></button>`
                    }
                    <button class="btn btn-icon danger" onclick="borrarSocio(${s.id})" title="Eliminar"><i class="ph ph-trash"></i></button>
                </td>
            </tr>
        `;
    });
}

// Lógica de Asistencias Dinámicas
const asistenciasContainer = document.getElementById('socio-asistencias-container');
const btnAddAsistencia = document.getElementById('btn-add-asistencia');

function addAsistenciaRow(dia = '', hora = '') {
    const row = document.createElement('div');
    row.className = 'asistencia-row';
    row.style.display = 'grid';
    row.style.gridTemplateColumns = '1fr 1fr auto';
    row.style.gap = '10px';
    row.style.alignItems = 'center';

    const dias = ['LU', 'MA', 'MI', 'JU', 'VI', 'SA', 'DO'];
    const horas = Array.from({length: 18}, (_, i) => `${String(i + 6).padStart(2, '0')}:00`);

    row.innerHTML = `
        <select class="asistencia-dia" required style="padding: 5px;">
            <option value="">-- Día --</option>
            ${dias.map(d => `<option value="${d}" ${d === dia ? 'selected' : ''}>${d}</option>`).join('')}
        </select>
        <select class="asistencia-hora" required style="padding: 5px;">
            <option value="">-- Hora --</option>
            ${horas.map(h => `<option value="${h}" ${h === hora ? 'selected' : ''}>${h} hs</option>`).join('')}
        </select>
        <button type="button" class="btn btn-icon danger btn-sm" onclick="this.parentElement.remove()" title="Eliminar"><i class="ph ph-minus"></i></button>
    `;
    asistenciasContainer.appendChild(row);
}

if(btnAddAsistencia) {
    btnAddAsistencia.onclick = () => addAsistenciaRow();
}

// Escuchar cambios de modulo
document.addEventListener('module-loaded', (e) => {
    if(e.detail.module === 'socios-section') {
        renderSocios();
    }
});

document.addEventListener('app-data-updated', () => {
    if(!document.getElementById('socios-section').classList.contains('hidden')) renderSocios();
});
searchInput.addEventListener('input', renderSocios);
if(statusFilter) statusFilter.addEventListener('change', renderSocios);

// Formulario ABM
btnNuevo.addEventListener('click', () => {
    document.getElementById('socio-id').value = '';
    formSocio.reset();
    asistenciasContainer.innerHTML = '';
    addAsistenciaRow(); // Una fila por defecto
    document.getElementById('modal-title').textContent = 'Crear Nuevo Socio';
    document.getElementById('socio-inicio').value = new Date().toISOString().split('T')[0];
    modalSocio.classList.remove('hidden');
});

document.querySelector('.close-modal').addEventListener('click', () => {
    modalSocio.classList.add('hidden');
});

formSocio.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Colectar asistencias
    const rows = document.querySelectorAll('.asistencia-row');
    const asistencias = Array.from(rows).map(row => ({
        dia: row.querySelector('.asistencia-dia').value,
        hora: row.querySelector('.asistencia-hora').value
    })).filter(a => a.dia && a.hora);

    if (asistencias.length === 0) {
        alert("Debe asignar al menos un día y horario.");
        return;
    }

    // Validar días duplicados (opcional, pero útil)
    const diasUnicos = new Set(asistencias.map(a => a.dia));
    if (diasUnicos.size !== asistencias.length) {
        // En este sistema permitimos múltiples horarios el mismo día? 
        // El prompt dice "no permitir días duplicados"
        alert("No se permiten días duplicados. Un socio debe tener un horario por cada día asignado.");
        return;
    }

    const idVal = document.getElementById('socio-id').value;

    const sData = {
        dni: document.getElementById('socio-dni').value,
        nombre: document.getElementById('socio-nombre').value,
        apellido: document.getElementById('socio-apellido').value,
        tel: document.getElementById('socio-tel').value,
        email: document.getElementById('socio-email').value,
        plan: document.getElementById('socio-plan').value,
        limite_ingresos_semanales: Number(document.getElementById('socio-limite-semanal').value),
        inicio: document.getElementById('socio-inicio').value,
        asistencias: asistencias
    };

    if(idVal) { // Edit
        const idx = window.appData.socios.findIndex(x => x.id == idVal);
        window.appData.socios[idx] = { ...window.appData.socios[idx], ...sData };
        window.logActivity("EDICION_SOCIO", `Modificó los datos del socio: ${sData.nombre} ${sData.apellido} (${sData.dni})`);
    } else { // Crear
        const newS = {
            id: Date.now(),
            gym_id: Number(localStorage.getItem('gim_gym_id')),
            ...sData,
            estado_cuota: 'pendiente',
            vencimiento: '' 
        };
        window.appData.socios.push(newS);
        window.logActivity("ALTA_SOCIO", `Registró al nuevo socio: ${sData.nombre} ${sData.apellido} (${sData.dni})`);
    }

    window.appData.save();
    modalSocio.classList.add('hidden');
    renderSocios();
});

window.editarSocio = (id) => {
    const s = window.appData.socios.find(x => x.id == id);
    if(!s) return;
    document.getElementById('socio-id').value = s.id;
    document.getElementById('socio-dni').value = s.dni;
    document.getElementById('socio-nombre').value = s.nombre;
    document.getElementById('socio-apellido').value = s.apellido;
    document.getElementById('socio-tel').value = s.tel || '';
    document.getElementById('socio-email').value = s.email || '';
    document.getElementById('socio-plan').value = s.plan;
    document.getElementById('socio-limite-semanal').value = s.limite_ingresos_semanales || 3;
    document.getElementById('socio-inicio').value = s.inicio;
    
    // Cargar asistencias
    asistenciasContainer.innerHTML = '';
    if(s.asistencias && s.asistencias.length > 0) {
        s.asistencias.forEach(a => addAsistenciaRow(a.dia, a.hora));
    } else {
        addAsistenciaRow();
    }
    
    document.getElementById('modal-title').textContent = 'Editar Socio ('+s.dni+')';
    modalSocio.classList.remove('hidden');
}

window.borrarSocio = (id) => {
    if(confirm('¿Eliminar socio permanentemente?')) {
        const target = window.appData.socios.find(x => x.id == id);
        if(target) {
            window.logActivity("BAJA_SOCIO", `Eliminó al socio: ${target.nombre} ${target.apellido} (${target.dni})`);
        }
        window.appData.socios = window.appData.socios.filter(x => x.id != id);
        window.appData.save();
        renderSocios();
    }
}
