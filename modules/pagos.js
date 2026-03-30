// ================= PAGOS MODULE ================= 
const searchSocioPago = document.getElementById('pago-search-socio');
const resultsDiv = document.getElementById('pago-search-results');
const selectedInfoDiv = document.getElementById('pago-selected-info');
const selectedNameEl = document.getElementById('pago-selected-name');
const selectedDetailsEl = document.getElementById('pago-selected-details');
const formPago = document.getElementById('form-pago');
const filtroPagos = document.getElementById('filter-pago-periodo');
const tablaPagos = document.getElementById('tabla-pagos-historial');

let selectedSocioId = null;

function renderPagos() {
    actualizarListaPagos();
    renderDebitosPendientes();
}

function buscarSocios() {
    const query = window.normalizeText(searchSocioPago.value).trim();
    resultsDiv.innerHTML = '';
    
    if (query.length < 1) {
        resultsDiv.classList.add('hidden');
        return;
    }

    const { socios } = window.appData;
    const filtrados = socios.filter(s => {
        const nom = window.normalizeText(s.nombre);
        const ape = window.normalizeText(s.apellido);
        const dni = s.dni.toString();
        const tel = s.tel ? s.tel.toString() : "";
        return nom.includes(query) || ape.includes(query) || dni.includes(query) || tel.includes(query);
    }).sort((a, b) => `${a.apellido} ${a.nombre}`.localeCompare(`${b.apellido} ${b.nombre}`));

    if (filtrados.length === 0) {
        resultsDiv.innerHTML = '<div class="p-4 text-center text-secondary">No se encontraron coincidencias</div>';
    } else {
        filtrados.forEach(s => {
            const div = document.createElement('div');
            div.className = 'p-3 border-b border-border cursor-pointer hover:bg-primary-light transition-colors';
            div.style.padding = "10px";
            div.style.borderBottom = "1px solid var(--border)";
            div.style.cursor = "pointer";
            div.innerHTML = `
                <div class="font-bold">${s.apellido}, ${s.nombre}</div>
                <div class="text-xs text-secondary">DNI: ${s.dni} - Tel: ${s.tel || 'N/A'}</div>
            `;
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
    selectedDetailsEl.textContent = `DNI: ${s.dni} | Tel: ${s.tel || 'N/A'}`;
    selectedInfoDiv.classList.remove('hidden');
}

if(searchSocioPago) {
    searchSocioPago.addEventListener('input', buscarSocios);
}

// Cerrar dropdown al hacer click afuera
document.addEventListener('click', (e) => {
    if (!searchSocioPago.contains(e.target) && !resultsDiv.contains(e.target)) {
        resultsDiv.classList.add('hidden');
    }
});

function actualizarListaPagos() {
    const tbody = document.getElementById('lista-pagos-body');
    if(!tbody) return;
    tbody.innerHTML = '';
    
    const { pagos } = window.appData;
    const filterType = filtroPagos ? filtroPagos.value : 'todos';
    
    if(pagos.length === 0){
        tbody.innerHTML = '<tr><td colspan="6" class="text-secondary text-center py-4">Sin pagos registrados.</td></tr>';
        return;
    }

    const hoyStr = new Date().toISOString().split('T')[0];
    const esteMes = new Date().getMonth();

    pagos.slice().reverse().filter(p => {
        if(filterType === 'hoy') {
            return p.fecha.startsWith(hoyStr);
        } else if(filterType === 'mes') {
            return new Date(p.fecha).getMonth() === esteMes;
        }
        return true;
    }).forEach(p => {
        const socioNombre = p.nombre || 'Socio Borrado';
        const socioDNI = p.dni || '-';
        const usuarioDesc = p.usuario || 'Sistema';
        
        const fObj = new Date(p.fecha);
        const fechaStr = fObj.toLocaleDateString('es-AR');
        const horaStr = fObj.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

        tbody.innerHTML += `
            <tr>
                <td><strong>${socioNombre}</strong></td>
                <td>${fechaStr}</td>
                <td><span class="text-secondary text-sm"><i class="ph ph-user"></i> ${usuarioDesc}</span></td>
                <td class="text-success"><strong>$${Number(p.monto).toLocaleString()}</strong></td>
            </tr>
        `;
    });
}

function renderDebitosPendientes() {
    const tbody = document.getElementById('tabla-debitos-pendientes');
    if(!tbody) return;
    tbody.innerHTML = '';

    const { socios } = window.appData;
    const debitos = socios.filter(s => s.debito_automatico);

    if(debitos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-secondary text-center py-4">No hay socios adheridos al débito automático.</td></tr>';
        return;
    }

    const hoy = new Date();
    hoy.setHours(0,0,0,0);

    debitos.forEach(s => {
        const venc = s.vencimiento ? new Date(s.vencimiento + 'T00:00:00') : null;
        let p_status = 'Al día';
        let rowClass = '';
        let showProcess = false;

        if(!venc || venc < hoy) {
            p_status = 'Vencido / Pendiente';
            rowClass = 'bg-error-light';
            showProcess = true;
        }

        tbody.innerHTML += `
            <tr class="${rowClass}">
                <td><strong>${s.apellido}, ${s.nombre}</strong><br><span class="text-xs text-secondary">DNI: ${s.dni}</span></td>
                <td><span class="text-sm font-mono">${s.debito_cbu || 'N/A'}</span></td>
                <td>Día ${s.debito_dia || 1}</td>
                <td><span class="badge ${showProcess?'vencido':'al-dia'}">${p_status}</span></td>
                <td>$${window.config?.precio_base || '5000'}</td>
                <td>
                    ${showProcess ? `<button class="btn btn-sm btn-primary" onclick="procesarPagoUnico(${s.id})">Cobrar ahora</button>` : '<i class="ph ph-check-circle text-success"></i>'}
                </td>
            </tr>
        `;
    });
}

window.procesarPagoUnico = (id) => {
    const s = window.appData.socios.find(x => x.id == id);
    if(!s) return;
    
    // Simular un pago de 1 mes
    const monto = 5000; // Valor default o configurado
    const meses = 1;
    const usuarioActual = localStorage.getItem('gim_user_name') || 'Débito Automático';

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
        socioId: s.id,
        nombre: `${s.apellido}, ${s.nombre}`,
        dni: s.dni,
        monto,
        meses,
        usuario: usuarioActual,
        fecha: new Date().toISOString()
    });

    window.logActivity("DÉBITO_AUTOMÁTICO", `Procesó cobro automático de $${monto} para ${s.nombre} ${s.apellido}.`);
    window.appData.save();
    renderPagos();
};

document.getElementById('btn-procesar-debitos')?.addEventListener('click', () => {
    const { socios } = window.appData;
    const pendientes = socios.filter(s => s.debito_automatico && (!s.vencimiento || new Date(s.vencimiento + 'T00:00:00') < new Date()));
    
    if(pendientes.length === 0) {
        alert("No hay débitos pendientes por procesar.");
        return;
    }

    if(confirm(`¿Desea procesar el cobro de ${pendientes.length} socios adheridos?`)) {
        pendientes.forEach(s => window.procesarPagoUnico(s.id));
        alert(`${pendientes.length} pagos procesados con éxito.`);
    }
});

// Tab Navigation
const tabManual = document.getElementById('tab-pago-manual');
const tabDebito = document.getElementById('tab-pago-debito');
const viewManual = document.getElementById('view-pago-manual');
const viewDebito = document.getElementById('view-pago-debito');

if(tabManual && tabDebito) {
    tabManual.onclick = () => {
        tabManual.classList.add('active');
        tabDebito.classList.remove('active');
        viewManual.classList.remove('hidden');
        viewDebito.classList.add('hidden');
    };
    tabDebito.onclick = () => {
        tabDebito.classList.add('active');
        tabManual.classList.remove('active');
        viewManual.classList.add('hidden');
        viewDebito.classList.remove('hidden');
        renderDebitosPendientes();
    };
}

document.addEventListener('module-loaded', (e) => {
    if(e.detail.module === 'pagos-section') {
        renderPagos();
    }
});

document.addEventListener('app-data-updated', () => {
    if(!document.getElementById('pagos-section').classList.contains('hidden')) renderPagos();
});

if(filtroPagos) {
    filtroPagos.addEventListener('change', actualizarListaPagos);
}

formPago.addEventListener('submit', (e) => {
    e.preventDefault();
    if(!selectedSocioId) {
        alert("Debe seleccionar un socio de la lista.");
        return;
    }
    
    const monto = document.getElementById('pago-monto').value;
    const meses = parseInt(document.getElementById('pago-meses').value);
    const usuarioActual = localStorage.getItem('gim_user_name') || 'Recepción';

    if(!monto) { alert('Completar datos.'); return; }

    const s = window.appData.socios.find(x => x.id == selectedSocioId);
    
    let baseDate = s.vencimiento ? new Date(s.vencimiento + 'T00:00:00') : new Date();
    let hoy = new Date();
    hoy.setHours(0,0,0,0);

    if (baseDate < hoy) baseDate = hoy;

    const vDate = new Date(baseDate);
    vDate.setMonth(vDate.getMonth() + meses);
    
    if (s.inicio) {
        const iniD = new Date(s.inicio + 'T00:00:00');
        vDate.setDate(iniD.getDate());
    }

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
        usuario: usuarioActual,
        fecha: new Date().toISOString()
    });

    window.logActivity("COBRO", `Recibió un pago de $${monto} del socio ${s.nombre} ${s.apellido} (${s.dni}) por ${meses} mes(es).`);

    window.appData.save();
    alert(`Pago registrado. Socio ${s.nombre} está Al día hasta ${window.formatDate(s.vencimiento)}`);
    
    // Reset UI
    formPago.reset();
    selectedSocioId = null;
    selectedInfoDiv.classList.add('hidden');
    renderPagos();
});

