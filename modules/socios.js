// ================= SOCIOS MODULE ================= 
const tablaSocios = document.getElementById('tabla-socios');
const modalSocio = document.getElementById('modal-socio');
const formSocio = document.getElementById('form-socio');
const btnNuevo = document.getElementById('btn-nuevo-socio');
const searchInput = document.getElementById('search-socio');
const statusFilter = document.getElementById('filter-socio-status');

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
            if (fVal === 'pendiente') matchesStatus = s.estado_cuota === 'pendiente';
            else matchesStatus = (s.estado_cuota !== 'pendiente') && (actualEst === fVal);
        }
        return matchesSearch && matchesStatus;
    });
    
    filtrados.sort((a, b) => `${a.apellido} ${a.nombre}`.localeCompare(`${b.apellido} ${b.nombre}`));
    
    if(filtrados.length === 0){
        tablaSocios.innerHTML = '<tr><td colspan="6" class="text-secondary text-center py-4">Socio no encontrado</td></tr>';
        return;
    }

    filtrados.forEach(s => {
        let est = window.checkEstado(s.vencimiento);
        let badgeText = est.replace('-', ' ');
        let badgeClass = est;
        if (s.estado_cuota === 'pendiente') { est = 'pendiente'; badgeText = 'Pendiente de pago'; badgeClass = 'pendiente'; }

        const asistencias = s.asistencias || [];
        const asistenciasFormateadas = asistencias.length > 0 
            ? asistencias.map(a => `<span class="badge" style="background:var(--bg-surface); padding:2px 6px;">${a.dia} ${a.hora}</span>`).join(' ') 
            : '-';

        const debitoBadge = s.debito_automatico 
            ? `<span class="text-primary" title="Suscripción MP: ${s.debito_plan || 'Activa'}"><i class="ph-fill ph-credit-card"></i></span>` 
            : '';

        tablaSocios.innerHTML += `
            <tr>
                <td><span class="badge ${badgeClass}">${badgeText}</span></td>
                <td>
                    <div class="flex align-center gap-2">
                        <strong>${s.apellido}, ${s.nombre}</strong>
                        ${debitoBadge}
                    </div>
                    <span class="text-sm text-secondary">DNI: ${s.dni}</span>
                </td>
                <td>${s.tel || '-'}<br><span class="text-sm text-secondary">${s.email || ''}</span></td>
                <td>${s.plan} <br><div class="mt-1">${asistenciasFormateadas}</div></td>
                <td class="${est==='vencido'?'text-error':''}">${window.formatDate(s.vencimiento)}</td>
                <td>
                    <button class="btn btn-icon" onclick="editarSocio(${s.id})" title="Editar"><i class="ph ph-pencil-simple"></i></button>
                    ${s.tel ? `<a href="${window.generarLinkWhatsapp(s)}" target="_blank" class="btn btn-icon" style="color: #25D366;"><i class="ph-fill ph-whatsapp-logo"></i></a>` : ''}
                    <button class="btn btn-icon danger" onclick="borrarSocio(${s.id})" title="Eliminar"><i class="ph ph-trash"></i></button>
                </td>
            </tr>
        `;
    });
}

// Logic for Modal Socio and ASISTENCIAS
const asistenciasContainer = document.getElementById('socio-asistencias-container');
const btnAddAsistencia = document.getElementById('btn-add-asistencia');

function addAsistenciaRow(dia = '', hora = '') {
    const row = document.createElement('div');
    row.className = 'asistencia-row';
    row.style = 'display:grid; grid-template-columns:1fr 1fr auto; gap:10px; align-items:center;';
    const dias = ['LU', 'MA', 'MI', 'JU', 'VI', 'SA', 'DO'];
    const horas = Array.from({length: 18}, (_, i) => `${String(i + 6).padStart(2, '0')}:00`);

    row.innerHTML = `
        <select class="asistencia-dia" required style="padding: 5px;"><option value="">-- Día --</option>${dias.map(d => `<option value="${d}" ${d === dia ? 'selected' : ''}>${d}</option>`).join('')}</select>
        <select class="asistencia-hora" required style="padding: 5px;"><option value="">-- Hora --</option>${horas.map(h => `<option value="${h}" ${h === hora ? 'selected' : ''}>${h} hs</option>`).join('')}</select>
        <button type="button" class="btn btn-icon danger btn-sm" onclick="this.parentElement.remove()"><i class="ph ph-minus"></i></button>
    `;
    asistenciasContainer.appendChild(row);
}
if(btnAddAsistencia) btnAddAsistencia.onclick = () => addAsistenciaRow();

btnNuevo.addEventListener('click', () => {
    document.getElementById('socio-id').value = '';
    formSocio.reset();
    asistenciasContainer.innerHTML = '';
    addAsistenciaRow(); 
    document.getElementById('modal-title').textContent = 'Crear Nuevo Socio';
    document.getElementById('socio-inicio').value = new Date().toISOString().split('T')[0];
    
    // Reset MP Section
    document.getElementById('debito-fields').classList.add('hidden');
    document.getElementById('debito-mp-link-box').classList.add('hidden');
    cargarPlanesDropdown();
    
    modalSocio.classList.remove('hidden');
});

function cargarPlanesDropdown(seleccionado = '') {
    const activeGymId = Number(localStorage.getItem('gim_gym_id'));
    const gym = window.appData.gyms.find(g => g.id === activeGymId);
    const planes = gym ? (gym.planes || []) : [];
    const planSelect = document.getElementById('socio-debito-plan');
    if(!planSelect) return;
    
    planSelect.innerHTML = '<option value="">-- Seleccionar Plan --</option>';
    planes.forEach(p => {
        planSelect.innerHTML += `<option value="${p.nombre}">${p.nombre} ($${p.monto})</option>`;
    });
    planSelect.value = seleccionado;
}

formSocio.addEventListener('submit', (e) => {
    e.preventDefault();
    const rows = document.querySelectorAll('.asistencia-row');
    const asistencias = Array.from(rows).map(row => ({
        dia: row.querySelector('.asistencia-dia').value,
        hora: row.querySelector('.asistencia-hora').value
    })).filter(a => a.dia && a.hora);

    if (asistencias.length === 0) { alert("Debe asignar al menos un día y horario."); return; }

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
        asistencias: asistencias,
        debito_automatico: document.getElementById('socio-debito-toggle').checked,
        debito_plan: document.getElementById('socio-debito-plan').value
    };

    if(idVal) {
        const idx = window.appData.socios.findIndex(x => x.id == idVal);
        window.appData.socios[idx] = { ...window.appData.socios[idx], ...sData };
    } else {
        const newS = { id: Date.now(), gym_id: Number(localStorage.getItem('gim_gym_id')), ...sData, estado_cuota: 'pendiente', vencimiento: '' };
        window.appData.socios.push(newS);
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
    
    cargarPlanesDropdown(s.debito_plan);
    const toggle = document.getElementById('socio-debito-toggle');
    toggle.checked = !!s.debito_automatico;
    document.getElementById('debito-fields').classList.toggle('hidden', !toggle.checked);
    actualizarVistaMP(s.debito_plan);
    
    asistenciasContainer.innerHTML = '';
    if(s.asistencias && s.asistencias.length > 0) s.asistencias.forEach(a => addAsistenciaRow(a.dia, a.hora));
    else addAsistenciaRow();
    
    document.getElementById('modal-title').textContent = 'Editar Socio ('+s.dni+')';
    modalSocio.classList.remove('hidden');
}

window.borrarSocio = (id) => {
    if(confirm('¿Eliminar socio?')) {
        window.appData.socios = window.appData.socios.filter(x => x.id != id);
        window.appData.save();
        renderSocios();
    }
}

// Logic for Mercado Pago subscription
function actualizarVistaMP(planNombre) {
    const box = document.getElementById('debito-mp-link-box');
    const inputUrl = document.getElementById('socio-debito-mp-url');
    if(!box || !inputUrl) return;
    if(!planNombre) { box.classList.add('hidden'); return; }

    const activeGymId = Number(localStorage.getItem('gim_gym_id'));
    const gym = window.appData.gyms.find(g => g.id === activeGymId);
    const plan = gym?.planes?.find(p => p.nombre === planNombre);

    if(plan && plan.url) { inputUrl.value = plan.url; box.classList.remove('hidden'); }
    else box.classList.add('hidden');
}

document.getElementById('socio-debito-plan')?.addEventListener('change', (e) => actualizarVistaMP(e.target.value));

document.getElementById('btn-copy-mp-link')?.addEventListener('click', () => {
    const url = document.getElementById('socio-debito-mp-url').value;
    navigator.clipboard.writeText(url).then(() => alert("¡Link copiado!"));
});

document.getElementById('btn-wa-mp-subscription')?.addEventListener('click', () => {
    const url = document.getElementById('socio-debito-mp-url').value;
    const nombre = document.getElementById('socio-nombre').value;
    const plan = document.getElementById('socio-debito-plan').value;
    const tel = document.getElementById('socio-tel').value;
    if(!tel) { alert("Socio sin teléfono."); return; }
    const gymName = document.getElementById('active-gym-name')?.textContent || 'Gimnasio';
    const msg = `¡Hola ${nombre}! Suscribite al *${plan}* de *${gymName}*:\n\n${url}\n\nQuedarás activo luego de pagar.`;
    let dialTel = String(tel).replace(/[^0-9]/g, '');
    if(dialTel.length === 10) dialTel = '549' + dialTel;
    window.open(`https://wa.me/${dialTel}?text=${encodeURIComponent(msg)}`, '_blank');
});

document.getElementById('socio-debito-toggle')?.addEventListener('change', (e) => {
    document.getElementById('debito-fields').classList.toggle('hidden', !e.target.checked);
});

document.addEventListener('module-loaded', (e) => { if(e.detail.module === 'socios-section') renderSocios(); });
document.addEventListener('app-data-updated', () => { if(!document.getElementById('socios-section').classList.contains('hidden')) renderSocios(); });
searchInput.addEventListener('input', renderSocios);
if(statusFilter) statusFilter.addEventListener('change', renderSocios);
