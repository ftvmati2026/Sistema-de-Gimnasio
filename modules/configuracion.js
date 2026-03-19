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

        if(confirm("¿Estás seguro de que deseas cargar datos de prueba? Esto sobreescribirá los socios actuales de este gimnasio.")) {
            try {
                // Delete current gym socios
                const activeGymId = Number(localStorage.getItem('gim_gym_id'));
                window.appData.socios = window.appData.socios.filter(s => s.gym_id !== activeGymId);
                // Delete payments and ingress
                window.appData.pagos = window.appData.pagos.filter(p => {
                    const socio = window.appData.socios.find(s => s.dni === p.dni);
                    return socio && socio.gym_id !== activeGymId; // rough logic, should strictly filter
                });
                
                await window.generateTestData(true); // wait natively for Firebase to acknowledge the save
                
                alert("✅ Los 15 usuarios han sido inyectados y guardados con éxito en la Nube de Firebase.");
                setTimeout(() => {
                    window.location.reload();
                }, 1200);
            } catch(e) {
                console.error(e);
                alert("❌ Falló la inyección. Firebase devolvió un error de permisos o desconexión. Asegurate de que las Reglas de Firebase digan 'allow read, write: if true;'");
            }
        }
    });
}

const btnResetSystemSaas = document.getElementById('btn-reset-system-saas');
if(btnResetSystemSaas) {
    btnResetSystemSaas.addEventListener('click', () => {
        // Validación de seguridad para la operación de Reset
        const emailMaster = localStorage.getItem('gim_email');
        if(emailMaster !== 'master@fitmanager.com') {
            alert("❌ ACCIÓN DESTRUTIVA BLoqUEADA: Por motivos de seguridad, únicamente el Dueño Maestro de Sistemas (Proveedor SaaS) tiene los privilegios para ejecutar un formateo de base de datos.");
            return;
        }

        if(confirm("⚠️ ADVERTENCIA: Esta acción eliminará DEFINITIVAMENTE todos los socios, pagos y asistencias de tu gimnasio. Esta acción no se puede deshacer. ¿Deseas continuar?")) {
            const activeGymId = Number(localStorage.getItem('gim_gym_id'));
            
            // Reconstruir arrays excluyendo los de este gimnasio
            
            // 1. Filtrar Socios
            const gymSocioDnis = window.appData.socios
                .filter(s => s.gym_id === activeGymId)
                .map(s => s.dni);
            
            window.appData.socios = window.appData.socios.filter(s => s.gym_id !== activeGymId);
            
            // 2. Filtrar Pagos
            window.appData.pagos = window.appData.pagos.filter(p => !gymSocioDnis.includes(p.dni));
            
            // 3. Filtrar Ingresos
            window.appData.ingresos = window.appData.ingresos.filter(i => !gymSocioDnis.includes(i.dni));
            
            window.appData.save();
            alert("El sistema ha sido reseteado y los datos fueron eliminados correctamente.");
            window.location.reload();
        }
    });
}
