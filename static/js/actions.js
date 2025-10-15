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

// ============ GESTION DE LA CONFIGURATION BOT ============

async function loadCurrentConfig() {
    try {
        const response = await fetch('/api/get-config');
        const config = await response.json();
        
        if (config.error) {
            console.error('Erreur chargement config:', config.error);
            return;
        }
        
        if (config.buy_offset !== undefined) {
            document.getElementById('buyOffsetInput').value = config.buy_offset;
            document.getElementById('buyOffsetInput').placeholder = config.buy_offset;
            document.getElementById('buyOffsetDisplay').textContent = config.buy_offset;
        }
        if (config.sell_offset !== undefined) {
            document.getElementById('sellOffsetInput').value = config.sell_offset;
            document.getElementById('sellOffsetInput').placeholder = config.sell_offset;
            document.getElementById('sellOffsetDisplay').textContent = '+' + config.sell_offset;
        }
        if (config.percent !== undefined) {
            document.getElementById('percentInput').value = config.percent;
            document.getElementById('percentInput').placeholder = config.percent;
            document.getElementById('percentDisplay').textContent = config.percent + '%';
        }
        
    } catch (error) {
        console.error('Erreur chargement config:', error);
    }
}

async function updateConfig() {
    const buyOffset = document.getElementById('buyOffsetInput').value.trim();
    const sellOffset = document.getElementById('sellOffsetInput').value.trim();
    const percent = document.getElementById('percentInput').value.trim();
    
    if (!buyOffset && !sellOffset && !percent) {
        showConfigStatus('⚠️ Veuillez remplir au moins un champ', 'error');
        return;
    }
    
    const config = {};
    if (buyOffset) config.buy_offset = parseInt(buyOffset);
    if (sellOffset) config.sell_offset = parseInt(sellOffset);
    if (percent) config.percent = parseFloat(percent);
    
    if (config.buy_offset !== undefined && isNaN(config.buy_offset)) {
        showConfigStatus('❌ Buy Offset doit être un nombre', 'error');
        return;
    }
    if (config.sell_offset !== undefined && isNaN(config.sell_offset)) {
        showConfigStatus('❌ Sell Offset doit être un nombre', 'error');
        return;
    }
    if (config.percent !== undefined && (isNaN(config.percent) || config.percent < 0 || config.percent > 100)) {
        showConfigStatus('❌ Percent doit être entre 0 et 100', 'error');
        return;
    }
    
    try {
        showConfigStatus('⏳ Sauvegarde...', 'info');
        
        const response = await fetch('/api/update-config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(config)
        });
        
        const data = await response.json();
        
        if (data.success) {
            showConfigStatus('✅ Configuration sauvegardée', 'success');
            
            // Mettre à jour immédiatement les valeurs affichées (en vert)
            if (config.buy_offset !== undefined) {
                document.getElementById('buyOffsetDisplay').textContent = config.buy_offset;
            }
            if (config.sell_offset !== undefined) {
                document.getElementById('sellOffsetDisplay').textContent = '+' + config.sell_offset;
            }
            if (config.percent !== undefined) {
                document.getElementById('percentDisplay').textContent = config.percent + '%';
            }
            
            // Recharger les valeurs après 500ms
            setTimeout(() => {
                loadCurrentConfig();
            }, 500);
            
            // Actualiser les données du dashboard
            setTimeout(() => {
                refreshData();
            }, 800);
            
        } else {
            showConfigStatus('❌ Erreur : ' + data.error, 'error');
        }
    } catch (error) {
        console.error('Erreur mise à jour config:', error);
        showConfigStatus('❌ Erreur serveur', 'error');
    }
}

function showConfigStatus(message, type) {
    const statusDiv = document.getElementById('config-status');
    statusDiv.textContent = message;
    statusDiv.className = type;
    
    if (type === 'error' || type === 'success') {
        setTimeout(() => {
            if (statusDiv.className === type) {
                statusDiv.textContent = '';
                statusDiv.className = '';
            }
        }, 5000);
    }
}
