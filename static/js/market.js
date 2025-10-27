// ============ ANALYSE DU MARCHÉ BITCOIN ============

let market24hChart = null;
let fearGreedGaugeChart = null;
let marketData = null;
let marketRefreshInterval = null;
let currentMarketPeriod = '24h';
let marketChartData = {};

// Charger les données du marché
async function loadMarketData() {
    try {
        console.log('📈 Chargement des données du marché...');
        
        const response = await fetch('/api/market-data?t=' + Date.now(), { cache: 'no-store' });
        const data = await response.json();
        
        if (data.success) {
            marketData = data;
            updateMarketUI(data);
            console.log('✅ Données du marché chargées');
        } else {
            console.error('❌ Erreur chargement marché:', data.error);
            showMarketError('Erreur lors du chargement des données');
        }
        
    } catch (e) {
        console.error('❌ Erreur loadMarketData:', e);
        showMarketError('Erreur de connexion');
    }
}

// Mettre à jour l'interface
function updateMarketUI(data) {
    // Prix et variation
    document.getElementById('marketBtcPrice').textContent = formatNumber(data.price, 2);
    
    const change24h = data.price_change_24h || 0;
    const changeElement = document.getElementById('marketBtcChange');
    changeElement.textContent = (change24h >= 0 ? '+' : '') + change24h.toFixed(2) + '% (24h)';
    changeElement.className = 'card-change ' + (change24h >= 0 ? 'positive' : 'negative');
    
    // Tendance
    const trendElement = document.getElementById('marketTrend');
    if (change24h > 2) {
        trendElement.textContent = '▲ Haussier';
        trendElement.style.color = '#4ade80';
    } else if (change24h < -2) {
        trendElement.textContent = '▼ Baissier';
        trendElement.style.color = '#ef4444';
    } else {
        trendElement.textContent = '➡ Neutre';
        trendElement.style.color = '#fbbf24';
    }
    
    // Plus haut/bas 24h
    document.getElementById('marketHigh24h').textContent = formatNumber(data.high_24h, 2);
    document.getElementById('marketLow24h').textContent = formatNumber(data.low_24h, 2);
    
    // Volume
    document.getElementById('marketVolume24h').textContent = formatLargeNumber(data.volume_24h);
    document.getElementById('marketCap').textContent = formatLargeNumber(data.market_cap);
    
    // Liquidité
    const liquidityElement = document.getElementById('marketLiquidity');
    if (data.volume_24h > 30000000000) { // >30B
        liquidityElement.textContent = 'Élevée ✅';
        liquidityElement.style.color = '#4ade80';
    } else if (data.volume_24h > 15000000000) { // >15B
        liquidityElement.textContent = 'Moyenne ⚠️';
        liquidityElement.style.color = '#fbbf24';
    } else {
        liquidityElement.textContent = 'Faible ❌';
        liquidityElement.style.color = '#ef4444';
    }
    
    // Fear & Greed Index
    updateFearGreedGauge(data.fear_greed_index);
    
    // Dominance
    document.getElementById('btcDominance').textContent = data.btc_dominance.toFixed(1) + '%';
    document.getElementById('ethDominance').textContent = data.eth_dominance.toFixed(1) + '%';
    
    // ATH Distance
    const athDistance = ((data.price - data.ath) / data.ath * 100);
    const athElement = document.getElementById('athDistance');
    athElement.textContent = athDistance.toFixed(1) + '%';
    athElement.style.color = athDistance >= 0 ? '#4ade80' : '#ef4444';
    
    // Circulation
    document.getElementById('circulatingSupply').textContent = formatLargeNumber(data.circulating_supply, 0) + ' BTC';
    
    // Stocker les données disponibles (sparklines sans timestamps)
    marketChartData['24h'] = { prices: data.sparkline_24h, timestamps: null };
    marketChartData['7d'] = { prices: data.sparkline_7d, timestamps: null };
    
    // Graphique avec la période actuelle
    if (marketChartData[currentMarketPeriod]) {
        const chartData = marketChartData[currentMarketPeriod];
        updatePriceChart(chartData.prices, currentMarketPeriod, chartData.timestamps);
    } else {
        // Charger les données manquantes
        loadMarketChartData(currentMarketPeriod);
    }
    
    // Recommandations
    updateRecommendations(data);
    
    // Dernière mise à jour
    const now = new Date();
    document.getElementById('marketLastUpdate').textContent = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

// Jauge Fear & Greed
function updateFearGreedGauge(value) {
    if (!value && value !== 0) {
        document.getElementById('fearGreedValue').textContent = 'N/A';
        document.getElementById('fearGreedLabel').textContent = 'Données indisponibles';
        return;
    }
    
    document.getElementById('fearGreedValue').textContent = value;
    
    // Label selon la valeur
    let label, color;
    if (value <= 20) {
        label = '😱 Extrême Peur';
        color = '#dc2626';
    } else if (value <= 40) {
        label = '😰 Peur';
        color = '#f97316';
    } else if (value <= 60) {
        label = '😐 Neutre';
        color = '#fbbf24';
    } else if (value <= 80) {
        label = '😄 Cupidité';
        color = '#a3e635';
    } else {
        label = '🤑 Extrême Cupidité';
        color = '#4ade80';
    }
    
    document.getElementById('fearGreedLabel').textContent = label;
    document.getElementById('fearGreedLabel').style.color = color;
    document.getElementById('fearGreedValue').style.color = color;
    
    // Créer la jauge
    if (fearGreedGaugeChart) {
        fearGreedGaugeChart.destroy();
    }
    
    const ctx = document.getElementById('fearGreedGauge').getContext('2d');
    fearGreedGaugeChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            datasets: [{
                data: [value, 100 - value],
                backgroundColor: [color, '#1f2937'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            circumference: 180,
            rotation: -90,
            cutout: '75%',
            plugins: {
                legend: { display: false },
                tooltip: { enabled: false }
            }
        }
    });
}

// Changer la période du graphique
function changeMarketPeriod(period) {
    currentMarketPeriod = period;
    
    // Mettre à jour les boutons
    document.querySelectorAll('.period-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.period === period) {
            btn.classList.add('active');
        }
    });
    
    // Recharger le graphique avec les données de la période
    if (marketChartData[period]) {
        const chartData = marketChartData[period];
        updatePriceChart(chartData.prices, period, chartData.timestamps);
    } else {
        // Si pas de données en cache, recharger depuis l'API
        loadMarketChartData(period);
    }
}

// Charger les données du graphique pour une période spécifique
async function loadMarketChartData(period) {
    try {
        console.log(`📊 Chargement des données pour ${period}...`);
        
        // Afficher un indicateur de chargement sur le graphique
        showChartLoading();
        
        const response = await fetch(`/api/market-chart?period=${period}&t=${Date.now()}`, { cache: 'no-store' });
        const data = await response.json();
        
        if (data.success) {
            marketChartData[period] = {
                prices: data.prices,
                timestamps: data.timestamps
            };
            updatePriceChart(data.prices, period, data.timestamps);
            console.log(`✅ ${data.count} points chargés pour ${period}`);
        } else {
            console.error('❌ Erreur API:', data.error);
            hideChartLoading();
        }
    } catch (e) {
        console.error('❌ Erreur loadMarketChartData:', e);
        hideChartLoading();
    }
}

// Afficher un indicateur de chargement
function showChartLoading() {
    const canvas = document.getElementById('market24hChart');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#1a1f2e';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#9ca3af';
        ctx.font = '14px "Segoe UI"';
        ctx.textAlign = 'center';
        ctx.fillText('⏳ Chargement des données...', canvas.width / 2, canvas.height / 2);
    }
}

// Cacher l'indicateur de chargement
function hideChartLoading() {
    // Le graphique sera redessiné automatiquement
}

// Mettre à jour le graphique de prix
function updatePriceChart(priceData, period, timestamps = null) {
    if (market24hChart) {
        market24hChart.destroy();
    }
    
    if (!priceData || priceData.length === 0) {
        return;
    }
    
    // Créer des labels selon la période et les timestamps
    const labels = generateLabelsForPeriod(priceData, period, timestamps);
    
    // Déterminer la couleur selon la tendance
    const firstPrice = priceData[0];
    const lastPrice = priceData[priceData.length - 1];
    const color = lastPrice >= firstPrice ? '#4ade80' : '#ef4444';
    
    const ctx = document.getElementById('market24hChart').getContext('2d');
    market24hChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Prix BTC',
                data: priceData,
                borderColor: color,
                backgroundColor: color + '20',
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 5,
                pointHoverBackgroundColor: color,
                pointHoverBorderColor: '#fff',
                pointHoverBorderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(26,31,46,0.9)',
                    titleColor: '#e8eaed',
                    bodyColor: color,
                    borderColor: '#4a5568',
                    borderWidth: 1,
                    padding: 12,
                    displayColors: false,
                    callbacks: {
                        label: (ctx) => '$' + formatNumber(ctx.parsed.y, 2)
                    }
                }
            },
            scales: {
                y: {
                    grid: { color: '#2d3748', drawBorder: false },
                    ticks: {
                        color: '#9ca3af',
                        callback: (val) => '$' + formatNumber(val, 0)
                    }
                },
                x: {
                    grid: { display: false },
                    ticks: { 
                        color: '#9ca3af',
                        maxRotation: 45,
                        minRotation: 0,
                        autoSkipPadding: 20
                    }
                }
            },
            interaction: { intersect: false, mode: 'index' }
        }
    });
}

// Générer les labels selon la période
function generateLabelsForPeriod(data, period, timestamps = null) {
    const dataLength = data.length;
    
    // Si on a des timestamps réels, les utiliser
    if (timestamps && timestamps.length === dataLength) {
        if (period === '24h') {
            // Heures
            return timestamps.map(ts => {
                const time = new Date(ts);
                return time.getHours() + 'h';
            });
        } else if (period === '7d') {
            // Jours de la semaine
            return timestamps.map(ts => {
                const time = new Date(ts);
                return time.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' });
            });
        } else if (period === '30d' || period === '90d') {
            // Dates (jour/mois)
            return timestamps.map(ts => {
                const time = new Date(ts);
                return time.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
            });
        } else if (period === '180d' || period === '365d') {
            // Mois
            return timestamps.map(ts => {
                const time = new Date(ts);
                return time.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
            });
        } else {
            // Max : années ou mois
            return timestamps.map(ts => {
                const time = new Date(ts);
                return time.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
            });
        }
    }
    
    // Sinon, estimation basée sur l'heure actuelle (pour sparklines)
    const now = new Date();
    
    if (period === '24h') {
        // Heures
        return data.map((_, i) => {
            const time = new Date(now - (dataLength - i - 1) * 3600000); // 1h
            return time.getHours() + 'h';
        });
    } else if (period === '7d') {
        // Jours de la semaine
        return data.map((_, i) => {
            const time = new Date(now - (dataLength - i - 1) * 3600000);
            return time.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' });
        });
    } else if (period === '30d' || period === '90d') {
        // Dates (jour/mois)
        return data.map((_, i) => {
            const time = new Date(now - (dataLength - i - 1) * 86400000);
            return time.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
        });
    } else if (period === '180d' || period === '365d') {
        // Mois
        return data.map((_, i) => {
            const time = new Date(now - (dataLength - i - 1) * 86400000);
            return time.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
        });
    } else {
        // Max : années ou mois
        return data.map((_, i) => {
            const time = new Date(now - (dataLength - i - 1) * 86400000);
            return time.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
        });
    }
}

// Recommandations
function updateRecommendations(data) {
    const price = data.price;
    const change24h = data.price_change_24h || 0;
    const fearGreed = data.fear_greed_index;
    const athDistance = ((price - data.ath) / data.ath * 100);
    
    // Recommandation ACHAT
    let buyStatus = '', buyReason = '', buyColor = '';
    
    if (change24h < -3 && fearGreed < 40) {
        buyStatus = '✅ Favorable';
        buyReason = 'Prix en baisse et sentiment de peur. Bon moment pour accumuler.';
        buyColor = 'rgba(74,222,128,0.1)';
    } else if (change24h > 5 || fearGreed > 75) {
        buyStatus = '⚠️ Prudence';
        buyReason = 'Prix élevé ou marché suracheté. Attendre une correction.';
        buyColor = 'rgba(239,68,68,0.1)';
    } else {
        buyStatus = '⏸️ Neutre';
        buyReason = 'Conditions normales. Suivre votre stratégie habituelle.';
        buyColor = 'rgba(251,191,36,0.1)';
    }
    
    // Recommandation VENTE
    let sellStatus = '', sellReason = '', sellColor = '';
    
    if (change24h > 5 && fearGreed > 70) {
        sellStatus = '✅ Favorable';
        sellReason = 'Prix élevé et cupidité. Bon moment pour réaliser des gains.';
        sellColor = 'rgba(74,222,128,0.1)';
    } else if (change24h < -5) {
        sellStatus = '⚠️ Éviter';
        sellReason = 'Prix en chute. Pas le moment de vendre, laissez vos ordres.';
        sellColor = 'rgba(239,68,68,0.1)';
    } else {
        sellStatus = '⏸️ Neutre';
        sellReason = 'Conditions normales. Vos ordres se déclencheront au bon moment.';
        sellColor = 'rgba(251,191,36,0.1)';
    }
    
    // Mise à jour UI
    document.getElementById('buyRecommendStatus').textContent = buyStatus;
    document.getElementById('buyRecommendReason').textContent = buyReason;
    document.getElementById('recommendBuy').style.background = buyColor;
    
    document.getElementById('sellRecommendStatus').textContent = sellStatus;
    document.getElementById('sellRecommendReason').textContent = sellReason;
    document.getElementById('recommendSell').style.background = sellColor;
}

// Formater les grands nombres
function formatLargeNumber(num, decimals = 2) {
    if (!num) return '0';
    
    if (num >= 1000000000000) { // Trillions
        return (num / 1000000000000).toFixed(decimals) + 'T';
    } else if (num >= 1000000000) { // Billions
        return (num / 1000000000).toFixed(decimals) + 'B';
    } else if (num >= 1000000) { // Millions
        return (num / 1000000).toFixed(decimals) + 'M';
    } else if (num >= 1000) { // Thousands
        return (num / 1000).toFixed(decimals) + 'K';
    }
    return num.toFixed(decimals);
}

// Afficher une erreur
function showMarketError(message) {
    console.error('❌ Market Error:', message);
    document.getElementById('marketBtcPrice').textContent = 'N/A';
    document.getElementById('marketBtcChange').textContent = message;
}

// Démarrer le rafraîchissement automatique
function startMarketRefresh() {
    // Charger immédiatement
    loadMarketData();
    
    // Puis toutes les 5 minutes
    if (marketRefreshInterval) {
        clearInterval(marketRefreshInterval);
    }
    marketRefreshInterval = setInterval(loadMarketData, 300000); // 5 min
    
    console.log('✅ Rafraîchissement automatique du marché activé (5 min)');
}

// Arrêter le rafraîchissement
function stopMarketRefresh() {
    if (marketRefreshInterval) {
        clearInterval(marketRefreshInterval);
        marketRefreshInterval = null;
        console.log('⏹️ Rafraîchissement automatique du marché arrêté');
    }
}

