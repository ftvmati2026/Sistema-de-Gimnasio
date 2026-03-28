// ================= SUPERADMIN MODULE (SaaS Edition) ================= 

function renderGimnasios() {
    const tablaGyms = document.getElementById('tabla-gyms-saas');
    if (!tablaGyms) return;
    
    tablaGyms.innerHTML = '';
    const { gyms, usuarios } = window.appData;

    gyms.forEach(g => {
        // Encontrar al admin principal (el primero creado para este gym)
        const admin = usuarios.find(u => u.gym_id === g.id && u.rol === 'admin');
        const adminText = admin ? `${admin.name} (${admin.email})` : '<span class="text-secondary text-sm">Sin admin</span>';

        const isAct = !g.blocked;
        const blockBtn = `<button class="btn btn-icon ${isAct ? 'danger' : 'text-success'}" onclick="toggleBlockGym(${g.id})" title="${isAct ? 'Bloquear/Desbloquear' : 'Desbloquear'}"><i class="ph ${isAct ? 'ph-lock' : 'ph-lock-open'}"></i></button>`;
        const editBtn = `<button class="btn btn-icon" onclick="editMasterGym(${g.id})" title="Editar"><i class="ph ph-pencil-simple"></i></button>`;
        const delBtn = `<button class="btn btn-icon danger" onclick="deleteMasterGym(${g.id})" title="Eliminar"><i class="ph ph-trash"></i></button>`;
        const enterBtn = `<button class="btn btn-primary" onclick="enterGymAdmin(${g.id})" title="Entrar como Admin" style="padding: 5px 15px; font-weight: bold; font-size: 13px;">💪 ENTRAR AL SISTEMA</button>`;

        tablaGyms.innerHTML += `
            <tr style="${!isAct ? 'opacity:0.5;' : ''}">
                <td><strong>${g.name}</strong><br><span class="text-xs text-secondary">${g.address}</span></td>
                <td><span class="badge" style="background:var(--bg-hover); color:var(--text-sec); border:1px solid var(--border);">${g.id}</span></td>
                <td>${adminText}</td>
                <td style="display:flex; gap:5px; align-items:center;">
                    ${enterBtn} ${editBtn} ${blockBtn} ${delBtn}
                </td>
            </tr>
        `;
    });
}

document.addEventListener('module-loaded', (e) => {
    if(e.detail.module === 'saas-section') renderGimnasios();
});

document.addEventListener('app-data-updated', () => {
    if(!document.getElementById('saas-section').classList.contains('hidden')) renderGimnasios();
});

const formNuevoGym = document.getElementById('form-nuevo-gym');
if(formNuevoGym) {
    formNuevoGym.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const gymName = document.getElementById('new-gym-name').value.trim();
        const gymAddr = document.getElementById('new-gym-address').value.trim();
        const adminName = document.getElementById('new-gym-admin-name').value.trim();
        const adminEmail = document.getElementById('new-gym-admin-email').value.trim();
        const adminPass = document.getElementById('new-gym-admin-pass').value;

        // Validar si el email ya existe en todo el sistema SaaS
        if(window.appData.usuarios.find(u => u.email === adminEmail)) {
            alert('Este email de administrador ya está siendo utilizado en la red SaaS.');
            return;
        }

        const newGymId = Date.now();
        
        // 1. Crear el Gym
        window.appData.gyms.push({
            id: newGymId,
            name: gymName,
            address: gymAddr,
            phone: ''
        });

        // 2. Crear su cuenta Admin
        window.appData.usuarios.push({
            id: Date.now() + 1,
            gym_id: newGymId,
            name: adminName,
            email: adminEmail,
            pass: adminPass,
            rol: 'admin'
        });

        window.appData.save();
        formNuevoGym.reset();
        alert(`Gimnasio '${gymName}' y administrador creados exitosamente en la red SaaS.`);
        renderGimnasios();
    });
}

window.toggleBlockGym = function(id) {
    const gym = window.appData.gyms.find(g => g.id === id);
    if(gym) {
        gym.blocked = !gym.blocked;
        window.appData.save();
        renderGimnasios();
    }
};

window.editMasterGym = function(id) {
    const gym = window.appData.gyms.find(g => g.id === id);
    if(gym) {
        const newName = prompt("Nuevo nombre del gimnasio:", gym.name);
        if(!newName) return;
        const newAdd = prompt("Nueva dirección:", gym.address);
        gym.name = newName;
        gym.address = newAdd || gym.address;
        window.appData.save();
        renderGimnasios();
    }
};

window.deleteMasterGym = async function(id) {
    if(confirm("🛑 CRÍTICO: ¿Estás ABSOLUTAMENTE SEGURO de querer borrar este gimnasio entero? Se purgarán todos sus administradores, socios, facturación y registros. ESTO ES IRREVERSIBLE.")) {
        // Delete all data associated with this gym
        const gymId = Number(id);
        window.appData.gyms = window.appData.gyms.filter(g => Number(g.id) !== gymId);
        
        // Find member DNIS to safely delete their logs/payments
        const gymSocioDnis = window.appData.socios
            .filter(s => Number(s.gym_id) === gymId)
            .map(s => String(s.dni));
        
        window.appData.socios = window.appData.socios.filter(s => Number(s.gym_id) !== gymId);
        window.appData.usuarios = window.appData.usuarios.filter(u => Number(u.gym_id) !== gymId);
        
        window.appData.pagos = window.appData.pagos.filter(p => {
            const pGymId = (p.gym_id !== undefined && p.gym_id !== null) ? Number(p.gym_id) : null;
            return pGymId !== gymId && !gymSocioDnis.includes(String(p.dni));
        });
        
        window.appData.ingresos = window.appData.ingresos.filter(i => {
            const iGymId = (i.gym_id !== undefined && i.gym_id !== null) ? Number(i.gym_id) : null;
            return iGymId !== gymId && !gymSocioDnis.includes(String(i.dni));
        });
        
        await window.appData.save();
        renderGimnasios();
    }
};

window.enterGymAdmin = function(id) {
    const gym = window.appData.gyms.find(g => g.id === id);
    if(gym) {
        if(confirm(`Estás a punto de entrar al sistema simulando ser el Dueño/Admin de "${gym.name}". Toda la pantalla cambiará. Para volver aquí, usa 'Cerrar Sesión' y reingresa con tu cuenta maestra.`)) {
            // Impersonate
            localStorage.setItem('gim_gym_id', gym.id);
            localStorage.setItem('gim_user_name', 'SaaS Master (Huésped)');
            localStorage.setItem('gim_rol', 'admin');
            localStorage.setItem('gim_email', 'master@fitmanager.com'); // Mantiene el trackeo de que fue él modificado
            window.location.reload();
        }
    }
};
