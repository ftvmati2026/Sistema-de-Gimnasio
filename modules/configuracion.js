// ================= CONFIGURACION MODULE (SaaS Edition) ================= 

document.addEventListener('module-loaded', (e) => {
    if(e.detail.module === 'configuracion-section') {
        const activeGymId = Number(localStorage.getItem('gim_gym_id'));
        const gym = window.appData.gyms.find(g => g.id === activeGymId);
        if(gym) {
            document.getElementById('config-gym-name').value = gym.name || '';
            document.getElementById('config-gym-address').value = gym.address || '';
            document.getElementById('config-gym-phone').value = gym.phone || '';
        }
    }
});

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
            alert("Configuración guardada exitosamente. Se actualizará el nombre del gimnasio.");
            // Actualizar header
            const newName = document.getElementById('config-gym-name').value.trim();
            const headerName = document.getElementById('active-gym-name');
            if(headerName) headerName.textContent = newName;
        }
    });
}

// System Actions
const btnLoadDemoSaas = document.getElementById('btn-load-demo-saas');
if(btnLoadDemoSaas) {
    btnLoadDemoSaas.addEventListener('click', async () => {
        // Validación de seguridad SaaS
        const emailMaster = localStorage.getItem('gim_email');
        if(emailMaster !== 'master@fitmanager.com') {
            alert("❌ ACCIÓN BLoqUEADA: Cargar datos falsos sobreescribe la base de datos real. Solo el Dueño del Sistema tiene autorización para hacer inyecciones de prueba.");
            return;
        }

        if(confirm("¿Deseas cargar 15 socios ficticios de prueba? Se añadirán a tus socios actuales.")) {
            try {
                await window.generateTestData(true); // wait natively for Firebase to acknowledge the save
                
                alert("✅ Inyección confirmada. Refresque la pantalla o espere que los datos se reflejen en la grilla.");
                document.getElementById('dash-activos').innerHTML = '<i class="ph ph-spinner animate-spin"></i>'; 
            } catch(e) {
                console.error(e);
                alert("❌ Falló la inyección. Firebase devolvió un error de permisos o desconexión. Asegurate de que las Reglas de Firebase digan 'allow read, write: if true;'");
            }
        }
    });
}

const btnResetSystemSaas = document.getElementById('btn-reset-system-saas');
if(btnResetSystemSaas) {
    btnResetSystemSaas.addEventListener('click', async () => {
        const emailMaster = localStorage.getItem('gim_email');
        if(emailMaster !== 'master@fitmanager.com') {
            alert("❌ ACCIÓN DESTRUTIVA BLoqUEADA: Privilegios insuficientes.");
            return;
        }

        if(confirm("⚠️ ¿BORRAR TODO? Se eliminarán Socios, Pagos e Ingresos de este gimnasio.")) {
            try {
                const activeGymId = Number(localStorage.getItem('gim_gym_id'));
                btnResetSystemSaas.disabled = true;
                btnResetSystemSaas.innerHTML = '<i class="ph ph-spinner animate-spin"></i> Procesando Borrado...';
 
                // 1. Obtener lista de DNIs de socios de este gym ANTES de borrarlos
                const gymSocioDnis = window.appData.socios
                    .filter(s => Number(s.gym_id) === activeGymId)
                    .map(s => String(s.dni));
                
                // 2. Borrar Socios
                window.appData.socios = window.appData.socios.filter(s => Number(s.gym_id) !== activeGymId);
                
                // 3. Filtrar Pagos e Ingresos por gym_id y DNI
                window.appData.pagos = window.appData.pagos.filter(p => {
                    const pGymId = (p.gym_id !== undefined && p.gym_id !== null) ? Number(p.gym_id) : null;
                    const matchesGym = pGymId === activeGymId;
                    const matchesDni = gymSocioDnis.includes(String(p.dni));
                    return !matchesGym && !matchesDni;
                });
 
                window.appData.ingresos = window.appData.ingresos.filter(i => {
                    const iGymId = (i.gym_id !== undefined && i.gym_id !== null) ? Number(i.gym_id) : null;
                    const matchesGym = iGymId === activeGymId;
                    const matchesDni = gymSocioDnis.includes(String(i.dni));
                    return !matchesGym && !matchesDni;
                });
                
                // 4. Limpiar Auditoría del Gimnasio
                window.appData.auditoria = window.appData.auditoria.filter(a => Number(a.gym_id) !== activeGymId);
                
                // 4. Limpiar Agenda (opcional pero prolijo)
                if (window.appData.agenda) {
                    Object.keys(window.appData.agenda).forEach(fecha => {
                        window.appData.agenda[fecha] = window.appData.agenda[fecha].filter(entry => entry.gym_id != activeGymId);
                    });
                }

                await window.appData.save();
                
                alert("✅ Sistema Limpio. Los datos fueron eliminados de la Nube.");
                window.location.reload();
            } catch(e) {
                console.error(e);
                btnResetSystemSaas.disabled = false;
                btnResetSystemSaas.innerHTML = '<i class="ph ph-trash"></i> Resetear Sistema (Borrar Socios/Pagos)';
                alert("❌ Error: " + e.message);
            }
        }
    });
}
