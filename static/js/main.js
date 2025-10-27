// Variables globales
let performanceChart = null;
let gainsDistributionChart = null;
let activeCyclesTimelineChart = null;
let allPerformanceData = [];

// Fonctions utilitaires
function formatNumber(n, d) {
    return Number(n).toLocaleString('fr-FR', {
        minimumFractionDigits: d,
        maximumFractionDigits: d
    });
}

function getStatusBadge(s) {
    const mapping = {
        'completed': 'completed',
        'order_buy_placed': 'buy',
        'order_buy_filled': 'buy',
        'buy': 'buy',
        'order_sell_placed': 'sell',
        'sell': 'sell'
    };
    const className = mapping[s] || 'pending';
    return '<span class="badge ' + className + '">' + s + '</span>';
}

// Gestion du mode automatique
async function refreshAutoStatus() {
    try {
        const response = await fetch('/api/auto-status');
        const data = await response.json();
        
        document.getElementById('autoToggle').checked = data.enabled;
        
        // Ne mettre à jour l'intervalle QUE si le mode auto est activé
        if (data.enabled) {
            document.getElementById('intervalInput').value = data.interval_minutes;
        }
        
        const statusText = document.getElementById('autoStatusText');
        const countdown = document.getElementById('countdown');
        
        if (data.enabled) {
            statusText.textContent = 'Actif';
            statusText.classList.remove('inactive');
            
            if (data.minutes_remaining !== null) {
                const mins = Math.floor(data.minutes_remaining);
                const secs = Math.floor((data.minutes_remaining - mins) * 60);
                countdown.textContent = mins + 'm ' + secs + 's';
            } else {
                countdown.textContent = 'Calcul...';
            }
        } else {
            statusText.textContent = 'Inactif';
            statusText.classList.add('inactive');
            countdown.textContent = '--';
        }
    } catch (e) {
        console.error('Erreur auto status:', e);
    }
}

async function toggleAuto() {
    const enabled = document.getElementById('autoToggle').checked;
    const interval = parseFloat(document.getElementById('intervalInput').value);
    
    if (enabled) {
        try {
            const response = await fetch('/api/auto-start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ interval_minutes: interval })
            });
            const data = await response.json();
            
            if (data.success) {
                alert('✅ ' + data.message);
                refreshAutoStatus();
            } else {
                alert('❌ ' + data.error);
                document.getElementById('autoToggle').checked = false;
            }
        } catch (e) {
            alert('❌ Erreur: ' + e);
            document.getElementById('autoToggle').checked = false;
        }
    } else {
        try {
            const response = await fetch('/api/auto-stop', { method: 'POST' });
            const data = await response.json();
            
            if (data.success) {
                alert('✅ ' + data.message);
                
                // Réinitialiser à 60 minutes après désactivation
                document.getElementById('intervalInput').value = 60;
                
                // Mettre à jour le statut manuellement sans appeler refreshAutoStatus
                const statusText = document.getElementById('autoStatusText');
                const countdown = document.getElementById('countdown');
                statusText.textContent = 'Inactif';
                statusText.classList.add('inactive');
                countdown.textContent = '--';
            } else {
                alert('❌ ' + data.error);
                document.getElementById('autoToggle').checked = true;
            }
        } catch (e) {
            alert('❌ Erreur: ' + e);
            document.getElementById('autoToggle').checked = true;
        }
    }
}

async function updateInterval() {
    const interval = parseFloat(document.getElementById('intervalInput').value);
    
    if (interval < 0.167 || interval > 1440) {
        alert('Intervalle doit etre entre 10 secondes (0.167 min) et 1440 minutes');
        return;
    }
    
    const enabled = document.getElementById('autoToggle').checked;
    
    if (enabled) {
        try {
            const response = await fetch('/api/auto-config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ interval_minutes: interval })
            });
            const data = await response.json();
            
            if (data.success) {
                alert('✅ ' + data.message);
            } else {
                alert('❌ ' + data.error);
            }
        } catch (e) {
            alert('❌ Erreur: ' + e);
        }
    }
}

// Actualisation des données
async function refreshData() {
    console.log('⏳ Actualisation...');
    
    try {
        const response = await fetch('/api/data?t=' + Date.now(), { cache: 'no-store' });
        const data = await response.json();
        
        document.getElementById('usdcBalance').textContent = formatNumber(data.balances.usdc, 2);
        document.getElementById('btcBalance').textContent = formatNumber(data.balances.btc, 8);
        document.getElementById('gainAbs').textContent = formatNumber(data.stats.gain_abs, 2);
        document.getElementById('gainPercent').textContent = formatNumber(data.stats.gain_percent, 2);
        document.getElementById('btcPrice').textContent = formatNumber(data.balances.btc_price, 2);
        document.getElementById('completedCount').textContent = data.stats.completed_cycles;
        document.getElementById('totalCount').textContent = data.stats.total_cycles;
        if (document.getElementById('buyOffsetDisplay')) {
            document.getElementById('buyOffsetDisplay').textContent = data.config.buy_offset;
        }
        if (document.getElementById('sellOffsetDisplay')) {
            document.getElementById('sellOffsetDisplay').textContent = '+' + data.config.sell_offset;
        }
        if (document.getElementById('percentDisplay')) {
            document.getElementById('percentDisplay').textContent = data.config.percent + '%';
        }
        
        const activeCycles = data.cycles.filter(c => c.status !== 'completed');
        
        // Calculer le gain potentiel total (cycles avec ordres de vente actifs)
        let totalPotentialGain = 0;
        activeCycles.forEach(c => {
            // Uniquement les cycles avec ordre de vente (pas les ordres d'achat)
            if (c.status.includes('sell') || c.status === 'sell' || c.status === 'order_sell_placed') {
                const gain = (c.sellPrice * c.quantity) - (c.buyPrice * c.quantity);
                totalPotentialGain += gain;
            }
        });
        
        // Mettre à jour le gain potentiel dans Vue d'ensemble
        if (document.getElementById('totalPotentialGainOverview')) {
            document.getElementById('totalPotentialGainOverview').textContent = formatNumber(totalPotentialGain, 2);
        }
        
        const activeTable = document.getElementById('activeCyclesTable');
        
        if (activeCycles.length === 0) {
            activeTable.innerHTML = '<tr><td colspan="8" style="text-align:center;color:#9ca3af;">Aucun cycle actif</td></tr>';
        } else {
            activeTable.innerHTML = activeCycles.map(c => {
                const isBuy = c.status.includes('buy') || c.status === 'buy';
                const type = isBuy ? 'buy' : 'sell';
                const price = isBuy ? c.buyPrice : c.sellPrice;
                
                const buyAmount = c.buyPrice * c.quantity;
                const sellAmount = c.sellPrice * c.quantity;
                const gainPercent = ((sellAmount - buyAmount) / buyAmount * 100).toFixed(2);
                const gainAbs = (sellAmount - buyAmount).toFixed(2);
                
                const percentDedicated = c.percent || 0;
                const usdcDedicated = c.dedicatedBalance || 0;
                
                return '<tr><td>#' + c.id + '</td><td>' + getStatusBadge(type) + '</td><td>$' + formatNumber(price, 2) + '</td><td>' + formatNumber(c.quantity, 8) + '</td><td class="' + (gainPercent >= 0 ? 'positive' : 'negative') + '">' + gainPercent + '%</td><td class="' + (gainAbs >= 0 ? 'positive' : 'negative') + '">$' + gainAbs + '</td><td>' + percentDedicated + '%</td><td>$' + formatNumber(usdcDedicated, 2) + '</td></tr>';
            }).join('');
        }
        
        const allTable = document.getElementById('cyclesTable');
        
        if (data.cycles.length === 0) {
            allTable.innerHTML = '<tr><td colspan="9" style="text-align:center;color:#9ca3af;">Aucun cycle</td></tr>';
        } else {
            allTable.innerHTML = data.cycles.map(c => {
                const buyAmount = c.buyPrice * c.quantity;
                const sellAmount = c.sellPrice * c.quantity;
                const gainPercent = ((sellAmount - buyAmount) / buyAmount * 100).toFixed(2);
                const gainAbs = (sellAmount - buyAmount).toFixed(2);
                
                const percentDedicated = c.percent || 0;
                const usdcDedicated = c.dedicatedBalance || 0;
                
                return '<tr><td>#' + c.id + '</td><td>' + getStatusBadge(c.status) + '</td><td>' + formatNumber(c.quantity, 8) + '</td><td>$' + formatNumber(c.buyPrice, 2) + '</td><td>$' + formatNumber(c.sellPrice, 2) + '</td><td class="' + (gainPercent >= 0 ? 'positive' : 'negative') + '">' + gainPercent + '%</td><td class="' + (gainAbs >= 0 ? 'positive' : 'negative') + '">$' + gainAbs + '</td><td>' + percentDedicated + '%</td><td>$' + formatNumber(usdcDedicated, 2) + '</td></tr>';
            }).join('');
        }
        
        document.getElementById('lastUpdate').textContent = data.last_update;
        
        // Mettre à jour aussi les compteurs dans l'onglet Cycles
        if (document.getElementById('completedCount2')) {
            document.getElementById('completedCount2').textContent = data.stats.completed_cycles;
        }
        if (document.getElementById('totalCount2')) {
            document.getElementById('totalCount2').textContent = data.stats.total_cycles;
        }
        
        console.log('✅ Actualisation terminee');
    } catch (e) {
        console.error('❌ Erreur refresh:', e);
    }
}
