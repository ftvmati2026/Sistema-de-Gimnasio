// ================= AGENDA HORARIOS AUTOMATICA (SYNCED WITH SOCIOS) ================= 
const agendaGrid = document.getElementById('agenda-grid');
const fechaAgenda = document.getElementById('agenda-fecha');
const agendaDatePicker = document.getElementById('agenda-date-picker');

const horasDia = Array.from({length: 18}, (_, i) => `${String(i + 6).padStart(2, '0')}:00`);

// Mapeo de día numérico a código de socio (Sincronizado con LU, MA, MI...)
const mapDiasCode = {
    '1': 'LU',
    '2': 'MA',
    '3': 'MI',
    '4': 'JU',
    '5': 'VI',
    '6': 'SA',
    '0': 'DO'
};

function renderAgenda(selectedDateStr = null) {
    let hoyDate;
    if(selectedDateStr) {
        hoyDate = new Date(selectedDateStr + 'T00:00:00');
    } else {
        const temp = new Date();
        hoyDate = new Date(temp.getFullYear(), temp.getMonth(), temp.getDate());
    }
    
    const y = hoyDate.getFullYear();
    const m = String(hoyDate.getMonth() + 1).padStart(2, '0');
    const d = String(hoyDate.getDate()).padStart(2, '0');
    const currentFechaStr = `${y}-${m}-${d}`;

    if(agendaDatePicker) {
        agendaDatePicker.value = currentFechaStr;
    }

    const fechaFormateada = hoyDate.toLocaleDateString('es-AR', {weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'});
    fechaAgenda.textContent = fechaFormateada.charAt(0).toUpperCase() + fechaFormateada.slice(1);
    
    const diaCode = mapDiasCode[hoyDate.getDay().toString()];
    
    agendaGrid.innerHTML = '';

    const activeGymId = Number(localStorage.getItem('gim_gym_id'));

    // Obtener socios que tienen ALGUNA asistencia hoy y cuya fecha de inicio sea <= a la fecha que miramos
    const sociosHoy = window.appData.socios.filter(s => {
        if(s.gym_id !== activeGymId) return false;
        if(!s.asistencias) return false;
        if(s.inicio) {
            const fechaInicio = new Date(s.inicio + 'T00:00:00');
            // Si la fecha de la agenda es estrictamente anterior al inicio del socio, no aparece
            if(hoyDate < fechaInicio) return false;
        }
        return s.asistencias.some(a => a.dia.toUpperCase() === diaCode.toUpperCase());
    });

    horasDia.forEach(h => {
        // Filtrar por horario de asistencia exacto en CUALQUIERA de sus registros para hoy
        const sociosEnHorario = sociosHoy.filter(s => {
            const hBlock = h.split(':')[0]; // "08"
            return s.asistencias.some(a => 
                a.dia.toUpperCase() === diaCode.toUpperCase() && 
                a.hora.split(':')[0] === hBlock
            );
        }).sort((a, b) => {
            const aFull = `${a.apellido} ${a.nombre}`.toLowerCase();
            const bFull = `${b.apellido} ${b.nombre}`.toLowerCase();
            return aFull.localeCompare(bFull);
        });

        const ocupacionActual = sociosEnHorario.length;

        let asHtml = sociosEnHorario.map(s => {
            return `
            <div class="badge" style="background:var(--bg-main); color:var(--text-main); border:1px solid var(--border); margin-right:5px; margin-bottom:5px; display:inline-flex; align-items:center; gap:8px; padding: 4px 10px; border-radius: 20px;">
                <span>${s.apellido}, ${s.nombre}</span>
                <button class="btn btn-icon" style="padding:0; height:20px; width:20px; font-size:12px;" onclick="window.editarSocio(${s.id})" title="Editar Socio">
                    <i class="ph ph-pencil-simple"></i>
                </button>
            </div>`;
        }).join('');

        const emptyMsg = `<span class="text-secondary text-sm" style="font-style:italic;">Sin socios asignados.</span>`;

        agendaGrid.innerHTML += `
            <div style="background: var(--bg-hover); padding: 15px; border-radius: 8px; display: flex; align-items: center; gap: 20px; border-left: 4px solid var(--primary);">
                <div style="font-size: 1.25rem; font-weight: 700; color: var(--text-sec); min-width: 80px;">${h}</div>
                <div style="flex: 1;">
                    <div style="display:flex; flex-wrap:wrap; align-items:center; gap:5px;">
                        ${asHtml || emptyMsg}
                        <button class="btn btn-icon primary" onclick="window.asignarDesdeAgenda('${h}')" style="height:32px; width:32px; border-radius:50%; margin-left: 5px;" title="Cargar socio en este horario">
                            <i class="ph ph-plus"></i>
                        </button>
                    </div>
                </div>
                <div class="text-secondary text-sm" style="min-width: 120px; text-align:right;">
                    👥 <strong>${ocupacionActual} socios</strong>
                </div>
            </div>
        `;
    });
}

window.renderAgenda = renderAgenda;

window.asignarDesdeAgenda = (hora) => {
    const dni = prompt(`Programar socio para las ${hora}. Ingrese DNI:`);
    if(!dni) return;

    const socio = window.appData.socios.find(s => s.dni === dni);
    if(!socio) {
        alert("Socio no encontrado.");
        return;
    }

    // Abrimos el modal
    window.editarSocio(socio.id);
    
    // El editarSocio ya limpia el contenedor y agrega las filas actuales.
    // Nosotros vamos a agregar una nueva fila con el día actual de la agenda y la hora clickeada
    const diaCode = mapDiasCode[new Date(agendaDatePicker.value + 'T00:00:00').getDay().toString()];
    
    setTimeout(() => {
        // Si ya tiene ese día asignado, solo actualizamos la hora de esa fila?
        // El prompt decía "no permitir duplicados", así que buscamos si ya existe ese día
        const rows = document.querySelectorAll('.asistencia-row');
        let finded = false;
        rows.forEach(row => {
            const selDia = row.querySelector('.asistencia-dia');
            if(selDia.value === diaCode) {
                row.querySelector('.asistencia-hora').value = hora;
                finded = true;
            }
        });

        if(!finded) {
            // Si tiene asistencias vacías (la fila por defecto de editarSocio), la usamos
            if(rows.length === 1 && !rows[0].querySelector('.asistencia-dia').value) {
                rows[0].querySelector('.asistencia-dia').value = diaCode;
                rows[0].querySelector('.asistencia-hora').value = hora;
            } else {
                window.addAsistenciaRow(diaCode, hora);
            }
        }
    }, 150);
}

document.addEventListener('module-loaded', (e) => {
    if(e.detail.module === 'agenda-section') {
        renderAgenda(); 
    }
});

document.addEventListener('app-data-updated', () => {
    const agendaSection = document.getElementById('agenda-section');
    if(agendaSection && !agendaSection.classList.contains('hidden')) {
        renderAgenda(agendaDatePicker ? agendaDatePicker.value : null);
    }
});

if(agendaDatePicker) {
    agendaDatePicker.addEventListener('change', (e) => {
        if(e.target.value) {
            renderAgenda(e.target.value);
        }
    });
}
