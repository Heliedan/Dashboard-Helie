// ============ GESTION DES ORDRES DE VENTE ============

let currentEditingCycle = null;
let sellOrdersData = [];

// Charger les ordres de vente actifs
async function loadSellOrders() {
    try {
        console.log('📝 Chargement des ordres de vente...');
        
        const response = await fetch('/api/active-sell-orders?t=' + Date.now(), { cache: 'no-store' });
        const data = await response.json();
        
        if (data.success) {
            sellOrdersData = data.orders;
            updateSellOrdersUI(data.orders, data.btc_price);
            console.log(`✅ ${data.orders.length} ordres de vente chargés`);
        } else {
            console.error('❌ Erreur chargement ordres:', data.error);
            showOrderError('Erreur lors du chargement des ordres');
        }
        
    } catch (e) {
        console.error('❌ Erreur loadSellOrders:', e);
        showOrderError('Erreur de connexion');
    }
}

// Mettre à jour l'interface avec les ordres
function updateSellOrdersUI(orders, btcPrice) {
    // Statistiques
    document.getElementById('activeSellOrdersCount').textContent = orders.length;
    document.getElementById('currentBtcPrice').textContent = formatNumber(btcPrice, 2);
    
    // Calculer le gain potentiel total
    let totalPotentialGain = 0;
    console.log('📊 Calcul du gain potentiel total pour', orders.length, 'ordres de vente actifs:');
    orders.forEach((order, index) => {
        const gain = (order.sellPrice * order.quantity) - (order.buyPrice * order.quantity);
        console.log(`   Ordre ${index + 1} (Cycle #${order.id}):`, {
            buyPrice: order.buyPrice,
            sellPrice: order.sellPrice,
            quantity: order.quantity,
            gain: gain.toFixed(2)
        });
        totalPotentialGain += gain;
    });
    console.log('💰 Gain potentiel total:', totalPotentialGain.toFixed(2), '$');
    document.getElementById('totalPotentialGain').textContent = formatNumber(totalPotentialGain, 2);
    
    // Mettre à jour aussi dans la Vue d'ensemble
    if (document.getElementById('totalPotentialGainOverview')) {
        document.getElementById('totalPotentialGainOverview').textContent = formatNumber(totalPotentialGain, 2);
    }
    
    // Tableau des ordres
    const tbody = document.getElementById('sellOrdersTable');
    
    if (orders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:#9ca3af;padding:40px;">Aucun ordre de vente actif</td></tr>';
        return;
    }
    
    tbody.innerHTML = orders.map(order => {
        const gainAmount = (order.sellPrice * order.quantity) - (order.buyPrice * order.quantity);
        const gainPercent = ((order.sellPrice - order.buyPrice) / order.buyPrice) * 100;
        const gainClass = gainAmount >= 0 ? 'positive' : 'negative';
        
        return `
            <tr>
                <td style="font-weight:600;">#${order.id}</td>
                <td>${formatNumber(order.quantity, 8)} BTC</td>
                <td>$${formatNumber(order.buyPrice, 2)}</td>
                <td style="font-weight:600;color:#4ade80;">$${formatNumber(order.sellPrice, 2)}</td>
                <td class="${gainClass}">${gainPercent >= 0 ? '+' : ''}${formatNumber(gainPercent, 2)}%</td>
                <td class="${gainClass}">$${formatNumber(gainAmount, 2)}</td>
                <td style="font-size:11px;color:#9ca3af;">${order.sellId || 'N/A'}</td>
                <td>
                    <button class="btn" onclick="openEditOrderModal(${order.id})" style="padding:6px 12px;font-size:12px;">
                        ✏️ Modifier
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// Ouvrir le modal d'édition
function openEditOrderModal(cycleId) {
    const order = sellOrdersData.find(o => o.id === cycleId);
    if (!order) {
        alert('❌ Ordre introuvable');
        return;
    }
    
    currentEditingCycle = order;
    
    // Remplir le modal
    document.getElementById('modalCycleId').textContent = '#' + order.id;
    document.getElementById('modalQuantity').textContent = formatNumber(order.quantity, 8) + ' BTC';
    document.getElementById('modalBuyPrice').textContent = '$' + formatNumber(order.buyPrice, 2);
    document.getElementById('modalNewSellPrice').value = order.sellPrice.toFixed(2);
    
    // Calculer et afficher le gain actuel
    updateGainPreview();
    
    // Afficher le modal
    const modal = document.getElementById('editOrderModal');
    modal.style.display = 'flex';
    
    // Focus sur l'input
    setTimeout(() => {
        document.getElementById('modalNewSellPrice').focus();
        document.getElementById('modalNewSellPrice').select();
    }, 100);
    
    // Écouter les changements de prix pour mettre à jour le preview
    const priceInput = document.getElementById('modalNewSellPrice');
    priceInput.oninput = updateGainPreview;
}

// Mettre à jour le preview des gains
function updateGainPreview() {
    if (!currentEditingCycle) return;
    
    const newSellPrice = parseFloat(document.getElementById('modalNewSellPrice').value);
    if (isNaN(newSellPrice) || newSellPrice <= 0) {
        document.getElementById('modalGainAmount').textContent = '$0.00';
        document.getElementById('modalGainPercent').textContent = '+0.00%';
        return;
    }
    
    const buyPrice = currentEditingCycle.buyPrice;
    const quantity = currentEditingCycle.quantity;
    
    const gainAmount = (newSellPrice * quantity) - (buyPrice * quantity);
    const gainPercent = ((newSellPrice - buyPrice) / buyPrice) * 100;
    
    const gainColor = gainAmount >= 0 ? '#4ade80' : '#ef4444';
    const gainSign = gainAmount >= 0 ? '+' : '';
    
    document.getElementById('modalGainAmount').textContent = gainSign + '$' + formatNumber(gainAmount, 2);
    document.getElementById('modalGainAmount').style.color = gainColor;
    document.getElementById('modalGainPercent').textContent = gainSign + formatNumber(gainPercent, 2) + '%';
    document.getElementById('modalGainPercent').style.color = gainColor;
    
    // Changer la couleur du preview box
    const previewBox = document.getElementById('modalGainPreview');
    if (gainAmount >= 0) {
        previewBox.style.background = 'rgba(74,222,128,0.1)';
        previewBox.style.borderColor = 'rgba(74,222,128,0.3)';
    } else {
        previewBox.style.background = 'rgba(239,68,68,0.1)';
        previewBox.style.borderColor = 'rgba(239,68,68,0.3)';
    }
}

// Fermer le modal
function closeEditOrderModal() {
    document.getElementById('editOrderModal').style.display = 'none';
    document.getElementById('modalStatus').style.display = 'none';
    currentEditingCycle = null;
}

// Sauvegarder le nouveau prix de vente
async function saveNewSellPrice() {
    if (!currentEditingCycle) return;
    
    const newSellPrice = parseFloat(document.getElementById('modalNewSellPrice').value);
    
    // Validation
    if (isNaN(newSellPrice) || newSellPrice <= 0) {
        showModalStatus('❌ Prix invalide', 'error');
        return;
    }
    
    if (newSellPrice <= currentEditingCycle.buyPrice) {
        const confirm = window.confirm(
            `⚠️ ATTENTION !\n\n` +
            `Le nouveau prix de vente ($${newSellPrice.toFixed(2)}) est inférieur ou égal au prix d'achat ($${currentEditingCycle.buyPrice.toFixed(2)}).\n\n` +
            `Cela créerait une perte de ${formatNumber((newSellPrice - currentEditingCycle.buyPrice) * currentEditingCycle.quantity, 2)} $.\n\n` +
            `Êtes-vous sûr de vouloir continuer ?`
        );
        if (!confirm) return;
    }
    
    // Confirmation finale
    const confirmUpdate = window.confirm(
        `Modifier l'ordre de vente du cycle #${currentEditingCycle.id} ?\n\n` +
        `Prix actuel: $${currentEditingCycle.sellPrice.toFixed(2)}\n` +
        `Nouveau prix: $${newSellPrice.toFixed(2)}\n\n` +
        `L'ordre sera annulé et recréé sur MEXC.`
    );
    
    if (!confirmUpdate) return;
    
    // Afficher le loading
    showModalStatus('⏳ Mise à jour en cours...', 'info');
    
    try {
        const response = await fetch('/api/update-sell-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                cycle_id: currentEditingCycle.id,
                new_sell_price: newSellPrice
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showModalStatus('✅ Ordre mis à jour avec succès !', 'success');
            
            // Attendre 2 secondes puis fermer et recharger
            setTimeout(() => {
                closeEditOrderModal();
                refreshOrders();
                
                // Recharger aussi les données du dashboard principal
                if (typeof refreshData === 'function') {
                    refreshData();
                }
            }, 2000);
            
        } else {
            showModalStatus('❌ Erreur: ' + data.error, 'error');
        }
        
    } catch (e) {
        console.error('❌ Erreur saveNewSellPrice:', e);
        showModalStatus('❌ Erreur de connexion', 'error');
    }
}

// Afficher un message dans le modal
function showModalStatus(message, type) {
    const statusDiv = document.getElementById('modalStatus');
    statusDiv.textContent = message;
    statusDiv.style.display = 'block';
    
    if (type === 'success') {
        statusDiv.style.background = 'rgba(74,222,128,0.15)';
        statusDiv.style.color = '#4ade80';
        statusDiv.style.border = '1px solid rgba(74,222,128,0.3)';
    } else if (type === 'error') {
        statusDiv.style.background = 'rgba(239,68,68,0.15)';
        statusDiv.style.color = '#ef4444';
        statusDiv.style.border = '1px solid rgba(239,68,68,0.3)';
    } else {
        statusDiv.style.background = 'rgba(96,165,250,0.15)';
        statusDiv.style.color = '#60a5fa';
        statusDiv.style.border = '1px solid rgba(96,165,250,0.3)';
    }
}

// Afficher une erreur globale
function showOrderError(message) {
    const tbody = document.getElementById('sellOrdersTable');
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;color:#ef4444;padding:40px;">${message}</td></tr>`;
}

// Actualiser les ordres
async function refreshOrders() {
    console.log('🔄 Actualisation des ordres...');
    await loadSellOrders();
}

// Synchroniser avec MEXC
async function syncOrdersWithMexc() {
    if (!confirm('Synchroniser les ordres avec MEXC ?\n\nCela peut prendre quelques secondes.')) {
        return;
    }
    
    try {
        const response = await fetch('/api/sync-mexc', { method: 'POST' });
        const data = await response.json();
        
        if (data.success) {
            alert('✅ Synchronisation terminée !');
            await refreshOrders();
        } else {
            alert('❌ Erreur: ' + (data.error || 'Erreur inconnue'));
        }
    } catch (e) {
        alert('❌ Erreur: ' + e.message);
    }
}

// Fermer le modal si on clique en dehors
document.addEventListener('click', function(e) {
    const modal = document.getElementById('editOrderModal');
    if (e.target === modal) {
        closeEditOrderModal();
    }
});

// Support de la touche Escape pour fermer le modal
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeEditOrderModal();
    }
});

