// ================= PROSPECCION MODULE ================= 

const LEADS_INICIALES = [
    { name: 'Lifefit', address: 'Bogotá 70, Caballito', tel: '5491155842998', ig: '@lifefitcaba', status: 'Pendiente' },
    { name: 'Zona Fit - Comunidad Fitness', address: 'Av. Belgrano 3666, Almagro', tel: '5491155123680', ig: '@zonafitargentina', status: 'Pendiente' },
    { name: 'La Mecca Fitness', address: 'Av. Rivadavia 3950, Almagro', tel: '5491176231725', ig: '@lameccafitness', status: 'Pendiente' },
    { name: 'Fitness King 2', address: 'Lavalle 4070, Almagro', tel: '5491138803320', ig: '@fitnesskingym2', status: 'Pendiente' },
    { name: 'GoBox Caballito', address: 'Av. Acoyte 67, Caballito', tel: '5491139183294', ig: '@gobox.caballito', status: 'Pendiente' },
    { name: 'Well Club Arenales', address: 'Arenales 3674, Palermo', tel: '541124617033', ig: '@wellclub_oficial_', status: 'Pendiente' },
    { name: 'Nitro Gym Palermo', address: 'Av. Córdoba 3358, Palermo', tel: '541171050925', ig: '@nitrogymm', status: 'Pendiente' },
    { name: 'Omnia Fitness Center', address: 'Fitz Roy 2261, Palermo', tel: '541147734444', ig: '@omniafitnesscenter', status: 'Pendiente' },
    { name: 'Gym Belgrano', address: 'O\'Higgins 2133, Belgrano', tel: '541147868250', ig: '@gymbelgrano', status: 'Pendiente' },
    { name: 'Always Fitness Belgrano', address: 'Av. Cabildo 3140, Belgrano', tel: '541147021845', ig: '@alwaysfitnessbelgrano', status: 'Pendiente' },
    { name: 'Iron Gym Villa Crespo', address: 'Aguirre 849, Villa Crespo', tel: '541147714712', ig: '@irongym00', status: 'Pendiente' },
    { name: 'Gym Ares Villa Crespo', address: 'Av. Corrientes 5240, Villa Crespo', tel: '541148548501', ig: '@gym_ares', status: 'Pendiente' },
    { name: 'Always Fitness Recoleta', address: 'Pueyrredón 1215, Recoleta', tel: '541149640010', ig: '@alwaysfitnessrecoleta', status: 'Pendiente' },
    { name: 'Gimnasio Cero', address: 'Pacheco de Melo 2045, Recoleta', tel: '541148014475', ig: '@gimnasiocero', status: 'Pendiente' },
    { name: 'Magnum Gym Recoleta', address: 'Junín 1057, Recoleta', tel: '541148216547', ig: '@magnumgym_recoleta', status: 'Pendiente' }
];

function renderProspeccion() {
    const tabla = document.getElementById('tabla-prospeccion');
    if (!tabla) return;

    tabla.innerHTML = '';
    
    LEADS_INICIALES.forEach((lead, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <strong>${lead.name}</strong><br>
                <a href="https://instagram.com/${lead.ig.replace('@','')}" target="_blank" class="text-xs text-primary">${lead.ig}</a>
            </td>
            <td class="text-sm text-secondary">${lead.address}</td>
            <td><span class="badge" style="background:var(--bg-hover);">${lead.status}</span></td>
            <td>
                <div class="flex gap-2">
                    <button class="btn btn-sm btn-primary" onclick="window.verGuion(${index})"><i class="ph ph-chat-text"></i> Guion</button>
                    <button class="btn btn-sm btn-secondary" onclick="window.marcarContactado(${index})"><i class="ph ph-check"></i></button>
                </div>
            </td>
        `;
        tabla.appendChild(tr);
    });
}

window.verGuion = (index) => {
    const lead = LEADS_INICIALES[index];
    const modal = document.getElementById('modal-guion');
    const textoArea = document.getElementById('guion-texto');
    const gymTitle = document.getElementById('guion-gym-name');
    
    const guion = `¡Hola ${lead.name}! 👋 Soy de FitManager. 

Te escribo porque la mayoría de los gimnasios pierden hasta un 30% de socios por falta de seguimiento y procesos manuales. 📉

Creamos un sistema con IA que automatiza tus cobros por WhatsApp y recupera socios en riesgo por vos. Dejá de renegar con planillas y empezá a escalar. 📲

Mirá cómo funciona acá: https://ftvmati2026.github.io/fitmanager-landing/

¿Te interesa profesionalizar tu gestión hoy?`;

    gymTitle.innerText = `Contactar a ${lead.name}`;
    textoArea.innerText = guion;
    modal.classList.remove('hidden');

    // Setup buttons
    document.getElementById('btn-copy-guion').onclick = () => {
        navigator.clipboard.writeText(guion);
        alert('Guion copiado!');
    };

    document.getElementById('btn-open-wa').onclick = () => {
        const url = `https://api.whatsapp.com/send?phone=${lead.tel}&text=${encodeURIComponent(guion)}`;
        window.open(url, '_blank');
    };
};

window.marcarContactado = (index) => {
    LEADS_INICIALES[index].status = 'Contactado';
    renderProspeccion();
};

document.addEventListener('module-loaded', (e) => {
    if(e.detail.module === 'prospeccion-section') {
        renderProspeccion();
    }
});
