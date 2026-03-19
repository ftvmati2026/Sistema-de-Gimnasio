// ================= RECORDATORIOS & ALERTAS MODULE ================= 

document.addEventListener('module-loaded', (e) => {
    if(e.detail.module === 'alertas-section') {
        renderAlertasPro();
    }
});

function renderAlertasPro() {
    const morosos = window.appData.socios.filter(s => {
        const est = window.checkEstado(s.vencimiento);
        return est === 'vencido' || est === 'por-vencer';
    });
    
    let guitaPend = 0;
    const tbody = document.getElementById('tabla-alertas-lista');
    tbody.innerHTML = '';

    morosos.forEach(s => {
        const est = window.checkEstado(s.vencimiento);
        const badgeClass = est === 'vencido' ? 'vencido' : 'por-vencer';
        const msg = est === 'vencido' ? 'en mora' : 'próxima a vencer';
        
        // Base cuota estimada para demo ($15000)
        if(est === 'vencido') guitaPend += 15000;

        tbody.innerHTML += `
            <tr>
                <td>
                    <strong>${s.nombre} ${s.apellido}</strong><br>
                    <span class="text-sm text-secondary">Tel: ${s.tel}</span>
                </td>
                <td class="${est==='vencido'?'text-error':''}">
                    ${window.formatDate(s.vencimiento)}<br>
                    <span class="badge ${badgeClass}">${est.replace('-', ' ').toUpperCase()}</span>
                </td>
                <td>
                    <button class="btn btn-icon" style="color:#25D366; background:rgba(37,211,102,0.1);" onclick="enviarWhatsApp('${s.tel}', '${s.nombre}', '${msg}')" title="Enviar Recordatorio">
                        <i class="ph ph-whatsapp-logo"></i>
                    </button>
                </td>
            </tr>
        `;
    });

    if(morosos.length === 0) tbody.innerHTML = '<tr><td colspan="3" class="text-center py-4">Sin deudas pendientes.</td></tr>';

    document.getElementById('alert-cont').textContent = morosos.filter(s => window.checkEstado(s.vencimiento) === 'vencido').length;
    document.getElementById('alert-money').textContent = '$'+guitaPend.toLocaleString();
}

window.enviarWhatsApp = (tel, nombre, statusMsg) => {
    const cleanTel = tel.replace(/\D/g, '');
    const mensaje = `Hola ${nombre}, te escribimos de FitManager para recordarte que tu cuota se encuentra ${statusMsg}. ¡Te esperamos en el gym!`;
    const url = `https://wa.me/${cleanTel}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
}

// Boton mensaje general
document.getElementById('btn-whatsapp-all').onclick = () => {
    alert("Esta función permitiría enviar recordatorios masivos en una implementación con API de WhatsApp.");
};
