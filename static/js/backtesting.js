// Variables globales pour le backtesting
let backtestChart = null;
let backtestResults = null;

// Chargement des données de backtesting
async function loadBacktestData() {
    try {
        console.log('🧪 Chargement des données de backtesting...');
        
        // Charger les données par défaut
        const defaultParams = {
            strategy: 'default',
            initial_capital: 1000,
            start_date: '',
            end_date: ''
        };
        
        await runBacktest(defaultParams);
        
    } catch (e) {
        console.error('❌ Erreur chargement backtest:', e);
        showBacktestError('Erreur de connexion');
    }
}

// Exécution d'un backtest
async function runBacktest(params) {
    try {
        console.log('🚀 Lancement du backtest...', params);
        
        // Ne pas envoyer les dates car pas de colonne created_at
        const cleanParams = {
            strategy: params.strategy,
            initial_capital: params.initial_capital
        };
        
        const response = await fetch('/api/backtest', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(cleanParams)
        });
        
        const data = await response.json();
        
        if (data.success) {
            backtestResults = data.results;
            updateBacktestUI(data.results, data.parameters);
            updateBacktestChart(data.results);
            console.log('✅ Backtest terminé');
        } else {
            showBacktestError(data.error || 'Erreur inconnue');
        }
        
    } catch (e) {
        console.error('❌ Erreur backtest:', e);
        showBacktestError('Erreur de connexion');
    }
}

// Mise à jour de l'interface du backtesting
function updateBacktestUI(results, parameters) {
    // Métriques principales
    document.getElementById('backtestInitialCapital').textContent = formatNumber(results.initial_capital, 2);
    document.getElementById('backtestFinalCapital').textContent = formatNumber(results.final_capital, 2);
    document.getElementById('backtestTotalReturn').textContent = results.total_return.toFixed(2) + '%';
    document.getElementById('backtestTotalReturn').className = results.total_return >= 0 ? 'positive' : 'negative';
    
    // Statistiques des trades
    document.getElementById('backtestTotalTrades').textContent = results.total_trades;
    document.getElementById('backtestWinningTrades').textContent = results.winning_trades;
    document.getElementById('backtestLosingTrades').textContent = results.losing_trades;
    document.getElementById('backtestWinRate').textContent = results.win_rate.toFixed(1) + '%';
    
    // Métriques de risque
    document.getElementById('backtestMaxDrawdown').textContent = results.max_drawdown.toFixed(2) + '%';
    document.getElementById('backtestSharpeRatio').textContent = results.sharpe_ratio.toFixed(2);
    
    // Paramètres utilisés
    document.getElementById('backtestStrategy').textContent = getStrategyName(parameters.strategy);
    document.getElementById('backtestPeriod').textContent = getPeriodText(parameters.start_date, parameters.end_date);
    document.getElementById('backtestCycles').textContent = parameters.total_cycles;
    
    // Mise à jour du tableau des trades
    updateBacktestTradesTable(results.trades);
}

// Mise à jour du graphique de backtesting
function updateBacktestChart(results) {
    if (backtestChart) backtestChart.destroy();
    
    const equityCurve = results.equity_curve;
    const labels = equityCurve.map((_, i) => `Trade ${i}`);
    
    const ctx = document.getElementById('backtestChart').getContext('2d');
    backtestChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Capital',
                data: equityCurve,
                borderColor: '#4ade80',
                backgroundColor: 'rgba(74,222,128,0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 5
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
                    bodyColor: '#4ade80',
                    borderColor: '#4a5568',
                    borderWidth: 1,
                    callbacks: {
                        label: (ctx) => `Capital: $${ctx.parsed.y.toFixed(2)}`
                    }
                }
            },
            scales: {
                y: {
                    grid: { color: '#2d3748' },
                    ticks: { 
                        color: '#9ca3af',
                        callback: (val) => '$' + val.toFixed(0)
                    }
                },
                x: {
                    grid: { display: false },
                    ticks: { 
                        color: '#9ca3af',
                        maxRotation: 0,
                        autoSkipPadding: 20
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            }
        }
    });
}

// Mise à jour du tableau des trades
function updateBacktestTradesTable(trades) {
    const tbody = document.getElementById('backtestTradesTable');
    if (!tbody) return;
    
    if (trades.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="loading">Aucun trade</td></tr>';
        return;
    }
    
    tbody.innerHTML = trades.map(trade => {
        const gainClass = trade.trade_gain >= 0 ? 'positive' : 'negative';
        const gainSign = trade.trade_gain >= 0 ? '+' : '';
        
        return `
            <tr>
                <td>#${trade.cycle_id}</td>
                <td>$${formatNumber(trade.buy_price, 2)}</td>
                <td>$${formatNumber(trade.sell_price, 2)}</td>
                <td>${formatNumber(trade.quantity, 8)}</td>
                <td class="${gainClass}">${gainSign}$${formatNumber(trade.trade_gain, 2)}</td>
                <td>$${formatNumber(trade.capital, 2)}</td>
                <td>${((trade.capital - 1000) / 1000 * 100).toFixed(1)}%</td>
            </tr>
        `;
    }).join('');
}

// Fonctions utilitaires
function getStrategyName(strategy) {
    const names = {
        'percentage_5': '5% du capital par trade',
        'percentage_10': '10% du capital par trade',
        'percentage_20': '20% du capital par trade',
        'fixed_50': 'Montant fixe $50 par trade',
        'fixed_100': 'Montant fixe $100 par trade',
        'fixed_200': 'Montant fixe $200 par trade'
    };
    return names[strategy] || strategy;
}

function getPeriodText(startDate, endDate) {
    // Pas de filtrage par date car pas de colonne created_at
    return 'Tous les cycles complétés (ordre chronologique par ID)';
}

function showBacktestError(message) {
    const errorDiv = document.getElementById('backtestError');
    if (errorDiv) {
        errorDiv.innerHTML = `
            <div style="text-align: center; padding: 20px; color: #ef4444;">
                <h3>❌ Erreur Backtest</h3>
                <p>${message}</p>
            </div>
        `;
    }
}

// Fonction pour lancer un nouveau backtest
async function launchBacktest() {
    const strategy = document.getElementById('backtestStrategySelect').value;
    const initialCapital = parseFloat(document.getElementById('backtestInitialCapital').value);
    const startDate = document.getElementById('backtestStartDate').value;
    const endDate = document.getElementById('backtestEndDate').value;
    
    if (isNaN(initialCapital) || initialCapital <= 0) {
        alert('❌ Le capital initial doit être un nombre positif');
        return;
    }
    
    const params = {
        strategy: strategy,
        initial_capital: initialCapital,
        start_date: startDate || null,
        end_date: endDate || null
    };
    
    // Afficher un indicateur de chargement
    const button = document.getElementById('launchBacktestBtn');
    const originalText = button.textContent;
    button.textContent = '⏳ Calcul en cours...';
    button.disabled = true;
    
    try {
        await runBacktest(params);
    } finally {
        button.textContent = originalText;
        button.disabled = false;
    }
}

// Fonction pour exporter les résultats
function exportBacktestResults() {
    if (!backtestResults) {
        alert('❌ Aucun résultat de backtest à exporter');
        return;
    }
    
    // Créer un CSV des résultats
    const csvContent = createBacktestCSV(backtestResults);
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `backtest_results_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
}

function createBacktestCSV(results) {
    let csv = 'Cycle ID,Buy Price,Sell Price,Quantity,Gain,Trade Gain,Capital,Return %\n';
    
    results.trades.forEach(trade => {
        const returnPct = ((trade.capital - 1000) / 1000 * 100).toFixed(2);
        csv += `${trade.cycle_id},${trade.buy_price},${trade.sell_price},${trade.quantity},${trade.gain},${trade.trade_gain},${trade.capital},${returnPct}\n`;
    });
    
    return csv;
}

// Fonction pour actualiser les données
async function refreshBacktest() {
    console.log('🔄 Actualisation du backtesting...');
    await loadBacktestData();
}
