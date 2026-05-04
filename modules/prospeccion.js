import { cargarModulo } from '../app.js';
import { enviarWhatsAppIA } from './whatsapp.js';

const LEADS_INICIALES = [
    { name: 'Lifefit', address: 'Bogotá 70, Caballito', tel: '5491155842998', ig: '@lifefitcaba', status: 'Pendiente' },
    { name: 'Zona Fit - Comunidad Fitness', address: 'Av. Belgrano 3666, Almagro', tel: '5491155123680', ig: '@zonafitargentina', status: 'Pendiente' },
    { name: 'La Mecca Fitness', address: 'Av. Rivadavia 3950, Almagro', tel: '5491176231725', ig: '@lameccafitness', status: 'Pendiente' },
    { name: 'Fitness King 2', address: 'Lavalle 4070, Almagro', tel: '5491138803320', ig: '@fitnesskingym2', status: 'Pendiente' },
    { name: 'GoBox Caballito', address: 'Av. Acoyte 67, Caballito', tel: '5491139183294', ig: '@gobox.caballito', status: 'Pendiente' },
    { name: 'Well Club Arenales', address: 'Arenales 3674, Palermo', tel: '541124617033', ig: '@wellclub_oficial_', status: 'Pendiente' },
    { name: 'Nitro Gym Palermo', address: 'Av. Córdoba 3358, Palermo', tel: '5491122631726', ig: '@nitrogymm', status: 'Pendiente' },
    { name: 'Omnia Fitness Center', address: 'Fitz Roy 2261, Palermo', tel: '5491156294609', ig: '@omniafitnesscenter', status: 'Pendiente' },
    { name: 'Gym Belgrano', address: 'O\'Higgins 2133, Belgrano', tel: '5491124665704', ig: '@gymbelgrano', status: 'Pendiente' },
    { name: 'Always Fitness Belgrano', address: 'Av. Cabildo 3140, Belgrano', tel: '5491164185254', ig: '@alwaysfitnessbelgrano', status: 'Pendiente' },
    { name: 'Iron Gym Villa Crespo', address: 'Aguirre 849, Villa Crespo', tel: '541147714712', ig: '@irongym00', status: 'Pendiente' },
    { name: 'Gym Ares Villa Crespo', address: 'Av. Corrientes 5240, Villa Crespo', tel: '541148548501', ig: '@gym_ares', status: 'Pendiente' },
    { name: 'Always Fitness Recoleta', address: 'Pueyrredón 1215, Recoleta', tel: '541149640010', ig: '@alwaysfitnessrecoleta', status: 'Pendiente' },
    { name: 'Gimnasio Cero', address: 'Pacheco de Melo 2045, Recoleta', tel: '541148014475', ig: '@gimnasiocero', status: 'Pendiente' },
    { name: 'Magnum Gym Recoleta', address: 'Junín 1057, Recoleta', tel: '541148216547', ig: '@magnumgym_recoleta', status: 'Pendiente' }
];

const GUION_DIRECTO = "¡Hola! Somos de FitManager, ayudamos a gimnasios a recuperar socios perdidos con IA.";

function renderProspeccion() {
    const tbody = document.getElementById('leads-body');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    LEADS_INICIALES.forEach((lead, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <div class="font-bold">${lead.name}</div>
                <div class="text-xs text-secondary">${lead.ig}</div>
            </td>
            <td class="text-sm text-secondary">${lead.address}</td>
            <td><span class="badge" style="background:var(--bg-hover);">${lead.status}</span></td>
            <td>
                <div class="flex gap-2">
                    <a href="https://api.whatsapp.com/send?phone=${lead.tel}&text=${encodeURIComponent(GUION_DIRECTO)}" 
                       target="_blank" class="btn btn-sm btn-secondary">Manual</a>
                    <button class="btn btn-sm btn-primary btn-ia" data-tel="${lead.tel}">✨ IA</button>
                </div>
            </td>
        `;
        tabla.appendChild(tr);
    });

    document.querySelectorAll('.btn-ia').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const tel = e.currentTarget.getAttribute('data-tel');
            const originalText = e.currentTarget.innerHTML;
            
            e.currentTarget.disabled = true;
            e.currentTarget.innerHTML = '...';

            const result = await enviarWhatsAppIA(tel, GUION_DIRECTO);

            if (result.success) {
                e.currentTarget.innerHTML = '✅';
            } else {
                e.currentTarget.innerHTML = '❌';
                setTimeout(() => {
                    e.currentTarget.disabled = false;
                    e.currentTarget.innerHTML = originalText;
                }, 2000);
            }
        });
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
