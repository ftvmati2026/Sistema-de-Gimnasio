// ================= USUARIOS MODULE (SaaS Edition) ================= 
const tablaUsuarios = document.getElementById('tabla-usuarios');
const modalUsuario = document.getElementById('modal-usuario');
const formUsuario = document.getElementById('form-usuario');
const btnNuevoUsr = document.getElementById('btn-nuevo-usuario');

function renderUsuarios() {
    if(!tablaUsuarios) return;
    tablaUsuarios.innerHTML = '';
    const activeGymId = Number(localStorage.getItem('gim_gym_id'));
    const gymUsuarios = window.appData.usuarios.filter(u => u.gym_id === activeGymId);

    if(gymUsuarios.length === 0){
        tablaUsuarios.innerHTML = '<tr><td colspan="3" class="text-secondary text-center">No hay usuarios en este gimnasio</td></tr>';
        return;
    }

    gymUsuarios.forEach(u => {
        const rolText = u.rol === 'admin' ? 'Administrador' : 'Recepción';
        const isSelf = u.email === localStorage.getItem('gim_email'); // We shouldn't easily delete ourselves
        
        let acts = `<button class="btn btn-icon" onclick="editarUsuario(${u.id})" title="Editar"><i class="ph ph-pencil-simple"></i></button>`;
        if(!isSelf) {
            acts += `<button class="btn btn-icon danger" onclick="borrarUsuario(${u.id})" title="Eliminar"><i class="ph ph-trash"></i></button>`;
        } else {
            acts += `<span class="badge" style="margin-left: 10px; background: var(--bg-surface);">Tú</span>`;
        }

        tablaUsuarios.innerHTML += `
            <tr>
                <td><strong>${u.name || u.nombre}</strong><br><span class="text-xs text-secondary">${u.email}</span></td>
                <td><span class="badge" style="background:var(--bg-hover); color:var(--text-sec); border:1px solid var(--border);">${rolText}</span></td>
                <td>${acts}</td>
            </tr>
        `;
    });
}

document.addEventListener('module-loaded', (e) => {
    if(e.detail.module === 'usuarios-section') renderUsuarios();
});

document.addEventListener('app-data-updated', () => {
    if(!document.getElementById('usuarios-section').classList.contains('hidden')) renderUsuarios();
});

if(btnNuevoUsr) {
    btnNuevoUsr.addEventListener('click', () => {
        document.getElementById('usr-id').value = '';
        formUsuario.reset();
        document.getElementById('usr-email').disabled = false;
        document.getElementById('usr-rol').disabled = false;
        document.getElementById('modal-user-title').textContent = 'Crear Nuevo Usuario';
        modalUsuario.classList.remove('hidden');
    });
}

if(document.querySelector('.close-modal-user')) {
    document.querySelector('.close-modal-user').addEventListener('click', () => {
        modalUsuario.classList.add('hidden');
    });
}

if(formUsuario) {
    formUsuario.addEventListener('submit', (e) => {
        e.preventDefault();
        const idVal = document.getElementById('usr-id').value;
        const activeGymId = Number(localStorage.getItem('gim_gym_id'));
        const uData = {
            gym_id: activeGymId,
            name: document.getElementById('usr-nombre').value.trim(),
            email: document.getElementById('usr-email').value.trim(),
            pass: document.getElementById('usr-pass').value,
            rol: document.getElementById('usr-rol').value
        };

        if(idVal) {
            const idx = window.appData.usuarios.findIndex(x => x.id == idVal);
            if(idx > -1) {
                const oldUser = window.appData.usuarios[idx];
                // Si es admin principal, prohibimos cambiar el email y el rol
                if (oldUser.rol === 'admin') {
                    uData.email = oldUser.email;
                    uData.rol = oldUser.rol;
                }
                window.appData.usuarios[idx] = { ...oldUser, ...uData };
            }
        } else {
            // Check if email already exists
            const exists = window.appData.usuarios.find(u => u.email === uData.email);
            if(exists) {
                alert("Este email ya está registrado en el sistema.");
                return;
            }
            window.appData.usuarios.push({ id: Date.now(), ...uData });
        }

        window.appData.save();
        modalUsuario.classList.add('hidden');
        renderUsuarios();
    });
}

window.editarUsuario = (id) => {
    const u = window.appData.usuarios.find(x => x.id == id);
    if(!u) return;
    document.getElementById('usr-id').value = u.id;
    document.getElementById('usr-nombre').value = u.name || u.nombre;
    document.getElementById('usr-email').value = u.email || '';
    document.getElementById('usr-pass').value = u.pass;
    document.getElementById('usr-rol').value = u.rol;
    
    // Bloquear email y rol si es un administrador
    const isEditingAdmin = (u.rol === 'admin');
    document.getElementById('usr-email').disabled = isEditingAdmin;
    document.getElementById('usr-rol').disabled = isEditingAdmin;

    document.getElementById('modal-user-title').textContent = 'Editar Usuario';
    modalUsuario.classList.remove('hidden');
}

window.borrarUsuario = (id) => {
    if(confirm('¿Seguro que deseas eliminar este usuario del gimnasio?')) {
        window.appData.usuarios = window.appData.usuarios.filter(x => x.id != id);
        window.appData.save();
        renderUsuarios();
    }
}
