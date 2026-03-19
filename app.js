// ================= FIREBASE INIT ================= 
const firebaseConfig = {
  apiKey: "AIzaSyCoiqiLWnSWbnQFH8rUlk-96hPAv2vrD1U",
  authDomain: "fitmanager-pro-8402e.firebaseapp.com",
  projectId: "fitmanager-pro-8402e",
  storageBucket: "fitmanager-pro-8402e.firebasestorage.app",
  messagingSenderId: "110699906297",
  appId: "1:110699906297:web:0b022e2d18077b6609ce28",
  measurementId: "G-L5CXJQEKYG"
};
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
window.db = firebase.firestore();
window.auth = firebase.auth();

// ================= LOGICA PRINCIPAL ================= 
// // State Management via Firebase Cloud Firestore
window.appData = {
    gyms: [], usuarios: [], socios: [], pagos: [], ingresos: [], agenda: {}, auditoria: [],
    save: async function() {
        try {
            // Empaquetar y enviar matriz a la nube
            await window.db.collection('system').doc('masterCloudData').set({
                gyms: this.gyms,
                usuarios: this.usuarios,
                socios: this.socios,
                pagos: this.pagos,
                ingresos: this.ingresos,
                agenda: this.agenda,
                auditoria: this.auditoria
            });
            console.log("Sincronización Cloud ✅ Completada");
        } catch(e) {
            console.error("Error al sincronizar con la Nube:", e);
        }
    }
};

// ================= SINCRONIZADOR EN TIEMPO REAL ================= 
window.db.collection('system').doc('masterCloudData').onSnapshot((docSnapshot) => {
    if (docSnapshot.exists) {
        const data = docSnapshot.data();
        window.appData.gyms = data.gyms || [];
        window.appData.usuarios = data.usuarios || [];
        window.appData.socios = data.socios || [];
        window.appData.pagos = data.pagos || [];
        window.appData.ingresos = data.ingresos || [];
        window.appData.agenda = data.agenda || {};
        window.appData.auditoria = data.auditoria || [];
        
        // Notificar al sistema que llegaron nuevos datos de la nube
        document.dispatchEvent(new CustomEvent('app-data-updated'));
        console.log("Descarga Cloud 🌩️ Recibida en tiempo real.");
    } else {
        // Primera ejecución mundial: Inyectar datos iniciales vacíos en la Nube
        window.appData.gyms = [ { id: 1, name: 'SaaS Gym Prime', address: 'Demo', phone: '111' } ];
        window.appData.usuarios = [
            { id: 1, name: 'SaaS Owner', email: 'master@fitmanager.com', pass: 'master123', rol: 'superadmin', gym_id: 0 },
            { id: 2, name: 'Admin Prime', email: 'admin@gym.com', pass: '1234', rol: 'admin', gym_id: 1 },
            { id: 3, name: 'Staff Recepcion', email: 'staff@gym.com', pass: '1234', rol: 'recepcion', gym_id: 1 }
        ];
        window.appData.save();
    }
});
window.logActivity = function(actionType, details) {
    const actor = localStorage.getItem('gim_user_name') || 'Desconocido';
    const gymId = Number(localStorage.getItem('gim_gym_id')) || 0;
    
    // No auditar acciones del Master puro
    if(actor.includes('SaaS Master') && gymId === 0) return;

    window.appData.auditoria.unshift({
        id: Date.now(),
        gym_id: gymId,
        actor,
        accion: actionType,
        detalle: details,
        fecha: new Date().toISOString()
    });
    
    // Limits
    const limitArray = window.appData.auditoria.filter(a => a.gym_id === gymId);
    if(limitArray.length > 500) {
        window.appData.auditoria = window.appData.auditoria.filter(a => a.id !== limitArray[limitArray.length - 1].id);
    }
    
    window.appData.save();
};

// Initialization for SaaS Demo
if(appData.gyms.length === 0) {
    appData.gyms = [
        { id: 1, name: 'SaaS Gym Prime', address: 'Av. Libertador 123', phone: '1144556677' }
    ];
    appData.save();
}

if(appData.usuarios.length === 0) {
    appData.usuarios = [
        { id: 1, name: 'SaaS Owner', email: 'master@fitmanager.com', pass: 'master123', rol: 'superadmin', gym_id: 0 },
        { id: 2, name: 'Admin Principal', email: 'admin@gym.com', pass: '1234', rol: 'admin', gym_id: 1 },
        { id: 3, name: 'Staff Recepcion', email: 'staff@gym.com', pass: '1234', rol: 'recepcion', gym_id: 1 }
    ];
    appData.save();
}

window.normalizeText = function(text) {
    if(!text) return "";
    return text.toLowerCase()
               .normalize("NFD")
               .replace(/[\u0300-\u036f]/g, ""); 
};

window.generateTestData = function(force = false) {
    const activeGymId = Number(localStorage.getItem('gim_gym_id')) || 1;
    if(!force && appData.socios.filter(s => s.gym_id === activeGymId).length > 0) return;

    const nombres = ["Juan", "María", "Carlos", "Ana", "Luis", "Elena", "Pedro", "Sofía", "Diego", "Lucía", "Mateo", "Valentina", "Nicolás", "Camila", "Javier", "Martina", "Alejandro", "Isabella", "Ricardo", "Gabriela", "Fernando", "Victoria", "Hugo", "Daniela", "Gabriel", "Ximena", "Roberto", "Paula", "Andrés", "Antonella", "Santiago", "Julieta", "Felipe", "Renata", "Manuel", "Emma", "Joaquín", "Alma", "Oscar", "Mora"];
    const apellidos = ["Pérez", "González", "Rodríguez", "López", "García", "Martínez", "Sánchez", "Fernández", "Díaz", "Álvarez", "Torres", "Ruiz", "Ramírez", "Flores", "Benítez", "Acosta", "Medina", "Herrera", "Aguirre", "Guzmán", "Giménez", "Romero", "Vargas", "Silva", "Castro", "Mendoza", "Ortiz", "Peralta", "Domínguez", "Rojas", "Moreno", "Suárez", "Blanco", "Ibarra", "Ledesma", "Moyano", "Olivera", "Sosa", "Velázquez", "Zamora"];
    
    const hoy = new Date();
    hoy.setHours(0,0,0,0);

    const generatedSocios = [];
    
    for(let i=0; i<15; i++) { // 15 members as per SaaS requirement
        let venc = new Date(hoy);
        if(i < 10) venc.setDate(hoy.getDate() + 15); // Al día
        else venc.setDate(hoy.getDate() - 5); // Vencido

        // Mapeo local del día para que el socio generado siempre tenga asistencia "Hoy"
        const localMapDias = { '1':'LU', '2':'MA', '3':'MI', '4':'JU', '5':'VI', '6':'SA', '0':'DO' };
        const diaActualCode = localMapDias[hoy.getDay().toString()] || 'LU';

        generatedSocios.push({
            id: Date.now() + i,
            gym_id: activeGymId,
            dni: (30000000 + i * 123456).toString(),
            nombre: nombres[i % nombres.length],
            apellido: apellidos[i % apellidos.length],
            plan: "Musculación",
            inicio: new Date().toISOString().split('T')[0],
            vencimiento: venc.toISOString().split('T')[0],
            asistencias: [{ dia: diaActualCode, hora: '10:00' }, { dia: diaActualCode, hora: '18:00' }]
        });
    }
    // Preservar socios de otros gyms
    appData.socios = [...appData.socios.filter(s => s.gym_id !== activeGymId), ...generatedSocios];
    appData.save();
};

window.cleanupDuplicates = function() {
    // ... logic remains same but scoped if needed
};

window.migrateSchedules = function() {
    let migrated = false;
    window.appData.socios.forEach(s => {
        if(!s.gym_id) { s.gym_id = 1; migrated = true; } // Migration for multi-tenant
        if (s.dias_asistencia && s.horario_asistencia && !s.asistencias) {
            const dias = s.dias_asistencia.toUpperCase().split(/[^A-Z]/).filter(d => d.length > 0);
            s.asistencias = dias.map(d => ({ dia: d, hora: s.horario_asistencia }));
            delete s.dias_asistencia;
            delete s.horario_asistencia;
            migrated = true;
        }
    });
    if (migrated) {
        window.appData.save();
        console.log("Migration: Socio schedules and multi-tenant IDs updated.");
    }
};

// Eliminamos la generación automática en cada recarga para no pisar el Reset.
// window.generateTestData();
window.migrateSchedules();

// Helpers globales
window.checkEstado = function(vencimientoStr) {
    if(!vencimientoStr) return 'vencido';
    const vDate = new Date(vencimientoStr + 'T00:00:00');
    if(isNaN(vDate.getTime())) return 'vencido';
    const hoy = new Date();
    hoy.setHours(0,0,0,0);
    const diffDays = Math.ceil((vDate - hoy) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return 'vencido';
    if (diffDays <= 5) return 'por-vencer';
    return 'al-dia';
};

window.formatDate = function(dateStr) {
    if(!dateStr) return '-';
    dateStr = dateStr.split('T')[0];
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('es-AR');
};

// Autenticación SaaS
const loginView = document.getElementById('login-view');
const appView = document.getElementById('app-view');
const navLinks = document.querySelectorAll('.nav-links li');

if(localStorage.getItem('gim_logged')) {
    loginView.classList.add('hidden');
    appView.classList.remove('hidden');
    const rol = localStorage.getItem('gim_rol').toUpperCase();
    const gymId = localStorage.getItem('gim_gym_id');
    const gym = appData.gyms.find(g => g.id == gymId);
    
    document.getElementById('active-user-name').textContent = localStorage.getItem('gim_user_name');
    
    if (rol === 'SUPERADMIN') {
        document.getElementById('active-gym-name').textContent = 'CONTROL CENTRAL SaaS';
        document.getElementById('nav-saas').classList.remove('hidden');
        
        // Hide all regular gym menus
        navLinks.forEach(l => {
            if (l.getAttribute('id') !== 'nav-saas') {
                l.style.display = 'none';
            }
        });
        setTimeout(() => { document.querySelector('[data-target="saas-section"]').click(); }, 100);
    } else {
        document.getElementById('active-gym-name').textContent = gym ? gym.name : 'Mi Gimnasio';
        
        // RBAC: Ocultar menús
        navLinks.forEach(l => {
            const target = l.getAttribute('data-target');
            const restrictedForStaff = ['dashboard-section', 'reportes-section', 'configuracion-section', 'usuarios-section'];
            if(rol === 'RECEPCION' && restrictedForStaff.includes(target)) {
                l.style.display = 'none';
            }
            if(target === 'saas-section') l.style.display = 'none';
        });

        setTimeout(() => {
            const defaultTarget = rol === 'ADMIN' ? 'dashboard-section' : 'socios-section';
            document.querySelector(`[data-target="${defaultTarget}"]`).click();
        }, 100);
    }
}

// Tema y Reloj Global
const btnTheme = document.getElementById('btn-theme');
if (localStorage.getItem('gim_theme') === 'light-theme') {
    document.body.className = 'light-theme';
    if(btnTheme) btnTheme.innerHTML = '<i class="ph ph-moon"></i>';
} else {
    document.body.className = '';
}
if(btnTheme) {
    btnTheme.addEventListener('click', () => {
        const isLight = document.body.classList.toggle('light-theme');
        localStorage.setItem('gim_theme', isLight ? 'light-theme' : '');
        btnTheme.innerHTML = isLight ? '<i class="ph ph-moon"></i>' : '<i class="ph ph-sun"></i>';
    });
}

const clockEl = document.getElementById('real-time-clock');
if(clockEl) {
    setInterval(() => {
        const now = new Date();
        clockEl.textContent = now.toLocaleDateString('es-AR') + ' - ' + now.toLocaleTimeString('es-AR', {hour: '2-digit', minute:'2-digit', second:'2-digit'});
    }, 1000);
}

document.getElementById('form-login').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const pass = document.getElementById('login-pass').value;
    
    const u = window.appData.usuarios.find(x => x.email === email && x.pass === pass);

    if(u) {
        if(u.rol !== 'superadmin') {
            const gym = window.appData.gyms.find(g => g.id === u.gym_id);
            if(gym && gym.blocked) {
                alert("❌ Tu cuenta se encuentra SUSPENDIDA. Contactá al proveedor de SaaS.");
                return;
            }
        }
        localStorage.setItem('gim_logged', 'true');
        localStorage.setItem('gim_rol', u.rol);
        localStorage.setItem('gim_user_name', u.name);
        localStorage.setItem('gim_gym_id', u.gym_id);
        localStorage.setItem('gim_email', u.email); // Fix applied here
        window.location.reload();
    } else {
        alert('Email o contraseña incorrecta');
    }
});

document.getElementById('btn-logout').addEventListener('click', () => {
    localStorage.removeItem('gim_logged');
    localStorage.removeItem('gim_rol');
    localStorage.removeItem('gim_user_name');
    localStorage.removeItem('gim_email');
    localStorage.removeItem('gim_gym_id');
    // NO hacer localStorage.clear() porque borra gimnasio_data (la base de datos)
    window.location.reload();
});

// Enrutador de Vistas
const moduleSections = document.querySelectorAll('.module-section');
const pageTitle = document.getElementById('page-title');

navLinks.forEach(link => {
    link.addEventListener('click', () => {
        navLinks.forEach(l => l.classList.remove('active'));
        moduleSections.forEach(s => s.classList.add('hidden'));
        
        link.classList.add('active');
        const target = link.getAttribute('data-target');
        document.getElementById(target).classList.remove('hidden');
        pageTitle.textContent = link.textContent.trim();

        // Disparar Eventos Custom para refrescar cada modulo
        document.dispatchEvent(new CustomEvent('module-loaded', { detail: { module: target } }));
    });
});
