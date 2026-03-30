// ================= CONFIGURACION MODULE (SaaS Edition) ================= 

document.addEventListener('module-loaded', (e) => {
    if(e.detail.module === 'configuracion-section') {
        renderConfig();
    }
});

function renderConfig() {
    const activeGymId = Number(localStorage.getItem('gim_gym_id'));
    const gym = window.appData.gyms.find(g => g.id === activeGymId);
    if(gym) {
        document.getElementById('config-gym-name').value = gym.name || '';
        document.getElementById('config-gym-address').value = gym.address || '';
        document.getElementById('config-gym-phone').value = gym.phone || '';
        renderConfigPlanes(gym.planes || []);
    }
}

function renderConfigPlanes(planes) {
    const list = document.getElementById('config-planes-list');
    if(!list) return;
    list.innerHTML = '';
    
    planes.forEach((p, idx) => {
        const div = document.createElement('div');
        div.className = 'card p-3 mb-2';
        div.style.background = 'rgba(255,255,255,0.02)';
        div.innerHTML = `
            <div class="form-grid" style="gap:10px;">
                <div class="form-group"><label>Nombre del Plan</label><input type="text" class="plan-nombre" value="${p.nombre}" placeholder="Ej: Plan Full"></div>
                <div class="form-group"><label>Monto Mensual</label><input type="number" class="plan-monto" value="${p.monto}" placeholder="40000"></div>
                <div class="form-group" style="grid-column: span 2;">
                    <label>Link de Suscripción (Mercado Pago)</label>
                    <input type="text" class="plan-url" value="${p.url || ''}" placeholder="https://www.mercadopago.com.ar/subscriptions/checkout?preapproval_plan_id=...">
                </div>
                <div style="grid-column: span 2; display:flex; justify-content:flex-end;">
                    <button class="btn btn-icon danger btn-sm" onclick="this.closest('.card').remove()"><i class="ph ph-trash"></i> Eliminar Plan</button>
                </div>
            </div>
        `;
        list.appendChild(div);
    });
}

const formConfigGym = document.getElementById('form-config-gym');
if(formConfigGym) {
    formConfigGym.addEventListener('submit', (e) => {
        e.preventDefault();
        const activeGymId = Number(localStorage.getItem('gim_gym_id'));
        const idx = window.appData.gyms.findIndex(g => g.id === activeGymId);
        if(idx > -1) {
            window.appData.gyms[idx] = {
                ...window.appData.gyms[idx],
                name: document.getElementById('config-gym-name').value.trim(),
                address: document.getElementById('config-gym-address').value.trim(),
                phone: document.getElementById('config-gym-phone').value.trim(),
            };
            window.appData.save();
            alert("Configuración personal guardada.");
            const headerName = document.getElementById('active-gym-name');
            if(headerName) headerName.textContent = window.appData.gyms[idx].name;
        }
    });
}

document.getElementById('btn-add-plan-config')?.addEventListener('click', () => {
    const list = document.getElementById('config-planes-list');
    const div = document.createElement('div');
    div.className = 'card p-3 mb-2';
    div.style.background = 'rgba(255,255,255,0.02)';
    div.innerHTML = `
        <div class="form-grid" style="gap:10px;">
            <div class="form-group"><label>Nombre del Plan</label><input type="text" class="plan-nombre" placeholder="Ej: Plan Full"></div>
            <div class="form-group"><label>Monto Mensual</label><input type="number" class="plan-monto" placeholder="40000"></div>
            <div class="form-group" style="grid-column: span 2;">
                <label>Link de Suscripción (Mercado Pago)</label>
                <input type="text" class="plan-url" placeholder="https://www.mercadopago.com.ar/subscriptions/checkout?preapproval_plan_id=...">
            </div>
            <div style="grid-column: span 2; display:flex; justify-content:flex-end;">
                <button class="btn btn-icon danger btn-sm" onclick="this.closest('.card').remove()"><i class="ph ph-trash"></i> Eliminar Plan</button>
            </div>
        </div>
    `;
    list.appendChild(div);
});

document.getElementById('btn-save-planes')?.addEventListener('click', () => {
    const activeGymId = Number(localStorage.getItem('gim_gym_id'));
    const gymIdx = window.appData.gyms.findIndex(g => g.id === activeGymId);
    if(gymIdx === -1) return;

    const cards = document.querySelectorAll('#config-planes-list .card');
    const newPlanes = Array.from(cards).map(card => ({
        nombre: card.querySelector('.plan-nombre').value,
        monto: card.querySelector('.plan-monto').value,
        url: card.querySelector('.plan-url').value
    })).filter(p => p.nombre && p.url);

    window.appData.gyms[gymIdx].planes = newPlanes;
    window.appData.save();
    alert("Planes y links de Mercado Pago actualizados.");
});

// System Actions Restricted to Master
const btnResetSystemSaas = document.getElementById('btn-reset-system-saas');
if(btnResetSystemSaas) {
    btnResetSystemSaas.addEventListener('click', async () => {
        if(localStorage.getItem('gim_email') !== 'master@fitmanager.com') {
            alert("No tienes permisos para resetear el sistema global."); return;
        }
        if(confirm("⚠️ ¿BORRAR TODO? Acción irreversible.")) {
            // Logic handled here or in superadmin.js
        }
    });
}
