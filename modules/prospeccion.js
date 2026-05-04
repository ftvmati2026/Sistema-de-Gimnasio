// ================= PROSPECCION MODULE ================= 

const LEADS_INICIALES = [
    { name: 'Lifefit', address: 'Bogotá 70, Caballito', tel: '5491155842998', ig: '@lifefitcaba', status: 'Pendiente' },
    { name: 'Zona Fit - Comunidad Fitness', address: 'Av. Belgrano 3666, Almagro', tel: '5491155123680', ig: '@zonafitargentina', status: 'Pendiente' },
    { name: 'La Mecca Fitness', address: 'Av. Rivadavia 3950, Almagro', tel: '5491176231725', ig: '@lameccafitness', status: 'Pendiente' },
    { name: 'Fitness King 2', address: 'Lavalle 4070, Almagro', tel: '5491138803320', ig: '@fitnesskingym2', status: 'Pendiente' },
    { name: 'GoBox Caballito', address: 'Av. Acoyte 67, Caballito', tel: '5491139183294', ig: '@gobox.caballito', status: 'Pendiente' }
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
    
    const guion = `¡Hola ${lead.name}! 👋

Soy de FitManager. Estuve viendo su gimnasio en ${lead.address.split(',')[1].trim()} y me encantó la comunidad que tienen.

Te escribo porque estamos lanzando una herramienta de IA específica para gimnasios de barrio que ayuda a recuperar socios que dejaron de venir y automatiza todos los cobros por WhatsApp. 🚀

¿Te interesaría que les hagamos una auditoría gratuita de retención de socios para ver cuántos están perdiendo hoy por falta de seguimiento?

¡Quedo atento!`;

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
