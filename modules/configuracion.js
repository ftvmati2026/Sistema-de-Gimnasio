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
        if(confirm("⚠️ ¿BORRAR TODO EL SISTEMA? Esta acción eliminará todos los gimnasios, socios y pagos de la red. Es IRREVERSIBLE.")) {
            window.appData.gyms = [{ id: 1, name: 'SaaS Gym Prime', address: 'Demo', phone: '111' }];
            window.appData.usuarios = [
                { id: 1, name: 'SaaS Owner', email: 'master@fitmanager.com', pass: 'master123', rol: 'superadmin', gym_id: 0 },
                { id: 2, name: 'Admin Principal', email: 'admin@gym.com', pass: '1234', rol: 'admin', gym_id: 1 }
            ];
            window.appData.socios = [];
            window.appData.pagos = [];
            window.appData.ingresos = [];
            window.appData.agenda = {};
            window.appData.auditoria = [];
            await window.appData.save();
            alert("Sistema reseteado a valores de fábrica.");
            window.location.reload();
        }
    });
}

<<<<<<< HEAD
const btnLoadDemo = document.getElementById('btn-load-demo-saas');
if(btnLoadDemo) {
    btnLoadDemo.addEventListener('click', async () => {
        if(confirm("¿Inyectar 15 socios de prueba en este gimnasio?")) {
            if(window.generateTestData) {
                await window.generateTestData(true);
                alert("Datos demo cargados. Recargando...");
=======
        if(confirm("⚠️ ¿BORRAR TODO? Se eliminarán Socios, Pagos e Ingresos de este gimnasio.")) {
            try {
                const activeGymId = localStorage.getItem('gim_gym_id');
                btnResetSystemSaas.disabled = true;
                btnResetSystemSaas.innerHTML = '<i class="ph ph-spinner animate-spin"></i> Procesando Bo rrado...';

                // 1. Filtrar Socios (usando == para evitar líos de String vs Number)
                const gymSocioDnis = window.appData.socios
                    .filter(s => s.gym_id == activeGymId)
                    .map(s => String(s.dni));
                
                window.appData.socios = window.appData.socios.filter(s => s.gym_id != activeGymId);
                
                // 2. Filtrar Pagos e Ingresos por gym_id y DNI
                window.appData.pagos = window.appData.pagos.filter(p => p.gym_id != activeGymId && !gymSocioDnis.includes(String(p.dni)));
                window.appData.ingresos = window.appData.ingresos.filter(i => i.gym_id != activeGymId && !gymSocioDnis.includes(String(i.dni)));
                
                // 3. Limpiar Auditoría del Gimnasio
                window.appData.auditoria = window.appData.auditoria.filter(a => a.gym_id != activeGymId);
                
                // 4. Limpiar Agenda (opcional pero prolijo)
                if (window.appData.agenda) {
                    Object.keys(window.appData.agenda).forEach(fecha => {
                        window.appData.agenda[fecha] = window.appData.agenda[fecha].filter(entry => entry.gym_id != activeGymId);
                    });
                }

                await window.appData.save();
                
                alert("✅ Sistema Limpio. Los datos fueron eliminados de la Nube.");
>>>>>>> parent of f61b693 (error)
                window.location.reload();
            }
        }
    });
}
