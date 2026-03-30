// ================= PAGOS MODULE ================= 
const searchSocioPago = document.getElementById('pago-search-socio');
const resultsDiv = document.getElementById('pago-search-results');
const selectedInfoDiv = document.getElementById('pago-selected-info');
const selectedNameEl = document.getElementById('pago-selected-name');
const selectedDetailsEl = document.getElementById('pago-selected-details');
const formPago = document.getElementById('form-pago');
const filtroPagos = document.getElementById('filtro-pagos');
const tablaPagos = document.getElementById('lista-pagos-body');

let selectedSocioId = null;

function renderPagos() {
    actualizarListaPagos();
    renderDebitosPendientes();
}

function buscarSocios() {
    const query = window.normalizeText(searchSocioPago.value).trim();
    resultsDiv.innerHTML = '';
    if (query.length < 1) { resultsDiv.classList.add('hidden'); return; }

    const { socios } = window.appData;
    const activeGymId = Number(localStorage.getItem('gim_gym_id'));
    const filtrados = socios.filter(s => {
        if(s.gym_id !== activeGymId) return false;
        const nom = window.normalizeText(s.nombre);
        const ape = window.normalizeText(s.apellido);
        const dni = s.dni.toString();
        return nom.includes(query) || ape.includes(query) || dni.includes(query);
    }).sort((a, b) => `${a.apellido} ${a.nombre}`.localeCompare(`${b.apellido} ${b.nombre}`));

    if (filtrados.length === 0) { resultsDiv.innerHTML = '<div class="p-4 text-center">No hay coincidencias</div>'; }
    else {
        filtrados.forEach(s => {
            const div = document.createElement('div');
            div.className = 'p-3 border-b border-border cursor-pointer hover:bg-hover transition-colors';
            div.innerHTML = `<div class="font-bold">${s.apellido}, ${s.nombre}</div><div class="text-xs text-secondary">DNI: ${s.dni}</div>`;
            div.onclick = () => seleccionarSocio(s);
            resultsDiv.appendChild(div);
        });
    }
    resultsDiv.classList.remove('hidden');
}

function seleccionarSocio(s) {
    selectedSocioId = s.id;
    searchSocioPago.value = "";
    resultsDiv.classList.add('hidden');
    selectedNameEl.textContent = `${s.apellido}, ${s.nombre}`;
    selectedDetailsEl.textContent = `DNI: ${s.dni} | Plan: ${s.plan}`;
    selectedInfoDiv.classList.remove('hidden');
}

if(searchSocioPago) searchSocioPago.addEventListener('input', buscarSocios);

function actualizarListaPagos() {
    if(!tablaPagos) return;
    tablaPagos.innerHTML = '';
    const { pagos } = window.appData;
    const filterType = filtroPagos ? filtroPagos.value : 'todos';
    
    if(pagos.length === 0){ tablaPagos.innerHTML = '<tr><td colspan="4" class="text-center py-4">Sin pagos.</td></tr>'; return; }

    const hoyStr = new Date().toISOString().split('T')[0];
    const esteMes = new Date().getMonth();

    pagos.slice().reverse().filter(p => {
        if(filterType === 'hoy') return p.fecha.startsWith(hoyStr);
        if(filterType === 'mes') return new Date(p.fecha).getMonth() === esteMes;
        return true;
    }).forEach(p => {
        const fechaStr = new Date(p.fecha).toLocaleDateString();
        tablaPagos.innerHTML += `
            <tr>
                <td><strong>${p.nombre}</strong></td>
                <td>${fechaStr}</td>
                <td><span class="text-xs text-secondary">${p.usuario}</span></td>
                <td class="text-success">$${Number(p.monto).toLocaleString()}</td>
            </tr>
        `;
    });
}

function renderDebitosPendientes() {
    const tbody = document.getElementById('tabla-debitos-pendientes');
    if(!tbody) return;
    tbody.innerHTML = '';

    const { socios } = window.appData;
    const activeGymId = Number(localStorage.getItem('gim_gym_id'));
    const suscriptores = socios.filter(s => s.debito_automatico && s.gym_id === activeGymId);

    if(suscriptores.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4">No hay socios con suscripción MP configurada.</td></tr>';
        return;
    }

    const hoy = new Date();
    hoy.setHours(0,0,0,0);

    suscriptores.forEach(s => {
        const venc = s.vencimiento ? new Date(s.vencimiento + 'T00:00:00') : null;
        let p_status = 'Al día';
        let rowClass = '';
        let needsConfirmation = false;

        if(!venc || venc < hoy) {
            p_status = 'PENDIENTE / VENCIDO';
            rowClass = 'bg-error-light';
            needsConfirmation = true;
        }

        tbody.innerHTML += `
            <tr class="${rowClass}">
                <td><strong>${s.apellido}, ${s.nombre}</strong><br><span class="text-xs text-secondary">${s.dni}</span></td>
                <td><span class="badge text-info" style="background:rgba(59,130,246,0.1)">${s.debito_plan || 'Sin plan'}</span></td>
                <td><span class="badge ${needsConfirmation?'vencido':'al-dia'}">${p_status}</span></td>
                <td>${window.formatDate(s.vencimiento) || 'Falta pago inicial'}</td>
                <td>
                    ${needsConfirmation ? `<button class="btn btn-sm btn-primary" onclick="confirmarCobroMP(${s.id})">Confirmar Cobro</button>` : '<i class="ph ph-check-circle text-success"></i>'}
                </td>
            </tr>
        `;
    });
}

window.confirmarCobroMP = (id) => {
    const s = window.appData.socios.find(x => x.id == id);
    if(!s) return;
    
    const activeGymId = Number(localStorage.getItem('gim_gym_id'));
    const gym = window.appData.gyms.find(g => g.id === activeGymId);
    const plan = gym?.planes?.find(p => p.nombre === s.debito_plan);
    const monto = plan ? plan.monto : 40000;

    let baseDate = s.vencimiento ? new Date(s.vencimiento + 'T00:00:00') : new Date();
    let hoy = new Date();
    hoy.setHours(0,0,0,0);
    if (baseDate < hoy) baseDate = hoy;

    const vDate = new Date(baseDate);
    vDate.setMonth(vDate.getMonth() + 1);

    s.vencimiento = vDate.toISOString().split('T')[0];
    s.estado_cuota = 'al-dia';

    window.appData.pagos.push({
        id: Date.now(),
        gym_id: activeGymId,
        socioId: s.id,
        nombre: `${s.apellido}, ${s.nombre}`,
        dni: s.dni,
        monto: monto,
        meses: 1,
        usuario: 'Conciliación MP',
        fecha: new Date().toISOString()
    });

    window.logActivity("COBRO_SUSCRIPCION", `Confirmado cobro de suscripción MP: ${s.nombre} ${s.apellido}`);
    window.appData.save();
    renderPagos();
};

document.getElementById('btn-procesar-debitos')?.addEventListener('click', () => {
    const activeGymId = Number(localStorage.getItem('gim_gym_id'));
    const pendientes = window.appData.socios.filter(s => 
        s.gym_id === activeGymId && 
        s.debito_automatico && 
        (!s.vencimiento || new Date(s.vencimiento + 'T00:00:00') < new Date())
    );
    
    if(pendientes.length === 0) { alert("Todos los suscriptores están al día."); return; }

    if(confirm(`¿Confirmar cobro de los ${pendientes.length} suscriptores pendientes? Úsalo solo si verificaste tu cuenta de Mercado Pago.`)) {
        pendientes.forEach(s => window.confirmarCobroMP(s.id));
        alert("Cobros confirmados y accesos renovados.");
    }
});

// Tab Navigation
const tabManual = document.getElementById('tab-pago-manual');
const tabDebito = document.getElementById('tab-pago-debito');
const viewManual = document.getElementById('view-pago-manual');
const viewDebito = document.getElementById('view-pago-debito');

if(tabManual && tabDebito) {
    tabManual.onclick = () => { tabManual.classList.add('active'); tabDebito.classList.remove('active'); viewManual.classList.remove('hidden'); viewDebito.classList.add('hidden'); };
    tabDebito.onclick = () => { tabDebito.classList.add('active'); tabManual.classList.remove('active'); viewManual.classList.add('hidden'); viewDebito.classList.remove('hidden'); renderDebitosPendientes(); };
}

formPago.addEventListener('submit', (e) => {
    e.preventDefault();
    if(!selectedSocioId) { alert("Seleccione un socio."); return; }
    const monto = document.getElementById('pago-monto').value;
    const meses = parseInt(document.getElementById('pago-meses').value);
    const s = window.appData.socios.find(x => x.id == selectedSocioId);
    
    let baseDate = s.vencimiento ? new Date(s.vencimiento + 'T00:00:00') : new Date();
    let hoy = new Date();
    hoy.setHours(0,0,0,0);
    if (baseDate < hoy) baseDate = hoy;
    const vDate = new Date(baseDate);
    vDate.setMonth(vDate.getMonth() + meses);

    s.vencimiento = vDate.toISOString().split('T')[0];
    s.estado_cuota = 'al-dia'; 

    window.appData.pagos.push({
        id: Date.now(),
        gym_id: Number(localStorage.getItem('gim_gym_id')),
        socioId: selectedSocioId,
        nombre: `${s.apellido}, ${s.nombre}`,
        dni: s.dni,
        monto,
        meses,
        usuario: localStorage.getItem('gim_user_name') || 'Recepción',
        fecha: new Date().toISOString()
    });

    window.appData.save();
    alert("Pago manual registrado.");
    formPago.reset();
    selectedSocioId = null;
    selectedInfoDiv.classList.add('hidden');
    renderPagos();
});

document.addEventListener('module-loaded', (e) => { if(e.detail.module === 'pagos-section') renderPagos(); });
document.addEventListener('app-data-updated', () => { if(!document.getElementById('pagos-section').classList.contains('hidden')) renderPagos(); });
if(filtroPagos) filtroPagos.addEventListener('change', actualizarListaPagos);
