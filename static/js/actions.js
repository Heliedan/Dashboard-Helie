// Créer un nouveau cycle
async function createNewCycle() {
    if (!confirm('Creer un nouveau cycle de trading ?')) return;
    
    try {
        const response = await fetch('/api/new-cycle', { method: 'POST' });
        const data = await response.json();
        
        if (data.success) {
            alert('✅ Nouveau cycle cree!');
            setTimeout(async () => {
                await refreshData();
                await loadPerformanceData();
                await loadGainsDistribution();
                await loadActiveCyclesTimeline();
            }, 1000);
        } else {
            alert('❌ Erreur: ' + (data.error || data.output));
        }
    } catch (e) {
        alert('❌ Erreur: ' + e);
    }
}

// Mettre à jour les cycles
async function updateCycles() {
    try {
        const response = await fetch('/api/update-cycles', { method: 'POST' });
        const data = await response.json();
        
        if (data.success) {
            alert('✅ Cycles mis a jour!');
            setTimeout(async () => {
                await refreshData();
                await loadPerformanceData();
                await loadGainsDistribution();
                await loadActiveCyclesTimeline();
            }, 1000);
        } else {
            alert('❌ Erreur: ' + (data.error || data.output));
        }
    } catch (e) {
        alert('❌ Erreur: ' + e);
    }
}

// Annuler un cycle
async function cancelCycle() {
    const cycleId = prompt('ID du cycle a annuler:');
    if (!cycleId || cycleId.trim() === '') return;
    
    if (!confirm('Annuler le cycle #' + cycleId + ' ?')) return;
    
    try {
        const response = await fetch('/api/cancel-cycle', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cycle_id: cycleId })
        });
        const data = await response.json();
        
        if (data.success) {
            alert('✅ Cycle #' + cycleId + ' annule!');
            setTimeout(async () => {
                await refreshData();
                await loadPerformanceData();
                await loadGainsDistribution();
                await loadActiveCyclesTimeline();
            }, 1000);
        } else {
            alert('❌ Erreur: ' + (data.error || data.output));
        }
    } catch (e) {
        alert('❌ Erreur: ' + e);
    }
}

// Exporter les données
async function exportData() {
    try {
        const response = await fetch('/api/export', { method: 'POST' });
        const data = await response.json();
        
        if (data.success) {
            const csvLink = document.createElement('a');
            csvLink.href = '/download/csv';
            csvLink.download = data.csv_file || 'cycles_export.csv';
            document.body.appendChild(csvLink);
            csvLink.click();
            document.body.removeChild(csvLink);
            
            setTimeout(() => {
                const jsonLink = document.createElement('a');
                jsonLink.href = '/download/json';
                jsonLink.download = data.json_file || 'cycles_export.json';
                document.body.appendChild(jsonLink);
                jsonLink.click();
                document.body.removeChild(jsonLink);
            }, 500);
            
            alert('✅ Téléchargement des exports lancé!');
            setTimeout(refreshData, 1000);
        } else {
            alert('❌ Erreur: ' + (data.error || data.output));
        }
    } catch (e) {
        alert('❌ Erreur: ' + e);
    }
}
