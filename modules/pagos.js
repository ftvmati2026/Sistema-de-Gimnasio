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
