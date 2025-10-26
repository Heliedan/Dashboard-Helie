// Variables globales pour Analytics
let avgGainEvolutionChart = null;
let successRateEvolutionChart = null;
let performanceChartAnalytics = null;
let gainsDistributionChartAnalytics = null;
let winLossRatioChart = null;
let analyticsData = null;

// Chargement et calcul des données analytics
async function loadAnalyticsData() {
    try {
        const response = await fetch('/api/data?t=' + Date.now(), { cache: 'no-store' });
        const data = await response.json();
        
        if (!data.cycles || data.cycles.length === 0) {
            console.log('⚠️ Aucun cycle disponible');
            return;
        }
        
        console.log(`📊 Chargement analytics pour ${data.cycles.length} cycles`);
        
        analyticsData = calculateAnalytics(data.cycles);
        updateAnalyticsUI(analyticsData);
        updateAnalyticsCharts(analyticsData, data.cycles);
        
        // Recharger aussi les graphiques des cycles actifs (qui existent dans charts.js)
        if (typeof loadActiveCyclesTimeline === 'function') {
            await loadActiveCyclesTimeline();
        }
        
        console.log('✅ Analytics chargées avec succès');
        
    } catch (e) {
        console.error('❌ Erreur chargement analytics:', e);
    }
}

// Calcul des statistiques avancées
function calculateAnalytics(cycles) {
    const completedCycles = cycles.filter(c => c.status === 'completed');
    
    if (completedCycles.length === 0) {
        return {
            successRate: 0,
            avgGain: 0,
            avgDuration: 0,
            volatility: 0,
            bestGain: 0,
            bestGainCycle: '-',
            totalGains: 0,
            totalLosses: 0,
            profitableCycles: 0,
            losingCycles: 0
        };
    }
    
    let totalGain = 0;
    let profitableCycles = 0;
    let losingCycles = 0;
    let totalDuration = 0;
    let gains = [];
    let bestGain = -Infinity;
    let bestGainCycle = null;
    let totalGainsSum = 0;
    let totalLossesSum = 0;
    
    completedCycles.forEach(cycle => {
        const buyAmount = cycle.buyPrice * cycle.quantity;
        const sellAmount = cycle.sellPrice * cycle.quantity;
        const gain = sellAmount - buyAmount;
        
        totalGain += gain;
        gains.push(gain);
        
        if (gain > 0) {
            profitableCycles++;
            totalGainsSum += gain;
            if (gain > bestGain) {
                bestGain = gain;
                bestGainCycle = cycle;
            }
        } else if (gain < 0) {
            losingCycles++;
            totalLossesSum += Math.abs(gain);
        }
        
        totalDuration += 1;
    });
    
    const avgGain = totalGain / completedCycles.length;
    const successRate = (profitableCycles / completedCycles.length) * 100;
    
    // Calcul de la volatilité (écart-type)
    const variance = gains.reduce((acc, g) => acc + Math.pow(g - avgGain, 2), 0) / gains.length;
    const volatility = Math.sqrt(variance);
    
    return {
        successRate: successRate,
        avgGain: avgGain,
        avgDuration: totalDuration / completedCycles.length,
        volatility: volatility,
        bestGain: bestGain !== -Infinity ? bestGain : 0,
        bestGainCycle: bestGainCycle ? `#${bestGainCycle.id}` : '-',
        totalGains: totalGainsSum,
        totalLosses: totalLossesSum,
        profitableCycles: profitableCycles,
        losingCycles: losingCycles,
        completedCycles: completedCycles
    };
}

// Mise à jour de l'interface Analytics
function updateAnalyticsUI(data) {
    // Taux de réussite
    document.getElementById('successRate').textContent = data.successRate.toFixed(1) + '%';
    document.getElementById('successRateChange').textContent = 
        `${data.profitableCycles} gagnants / ${data.losingCycles} perdants`;
    document.getElementById('successRateChange').className = 'stat-card-change ' + 
        (data.successRate >= 50 ? 'positive' : 'negative');
    
    // Gain moyen
    document.getElementById('avgGain').textContent = '$' + formatNumber(data.avgGain, 2);
    document.getElementById('avgGainChange').textContent = 'Par cycle complété';
    document.getElementById('avgGainChange').className = 'stat-card-change ' + 
        (data.avgGain >= 0 ? 'positive' : 'negative');
    
    // Nombre de cycles complétés
    document.getElementById('avgDuration').textContent = data.completedCycles.length;
    document.getElementById('avgDurationChange').textContent = 'Cycles complétés';
    
    // Volatilité
    document.getElementById('volatility').textContent = '$' + formatNumber(data.volatility, 2);
    document.getElementById('volatilityChange').textContent = 'Écart-type des gains';
    
    // Meilleur gain
    document.getElementById('bestGain').textContent = '$' + formatNumber(data.bestGain, 2);
    document.getElementById('bestGainCycle').textContent = 'Cycle ' + data.bestGainCycle;
}

// Mise à jour des graphiques Analytics
function updateAnalyticsCharts(data, allCycles) {
    const completedCycles = data.completedCycles;
    
    // Graphique: Evolution du gain moyen
    updateAvgGainEvolutionChart(completedCycles);
    
    // Tables: Top & Bottom trades
    updateTopBottomTrades(completedCycles);
}

// Graphique: Evolution du gain moyen
function updateAvgGainEvolutionChart(cycles) {
    if (avgGainEvolutionChart) avgGainEvolutionChart.destroy();
    
    // Calculer le gain moyen par fenêtre glissante de 10 cycles
    const windowSize = 10;
    const labels = [];
    const avgGains = [];
    
    for (let i = windowSize - 1; i < cycles.length; i++) {
        const window = cycles.slice(Math.max(0, i - windowSize + 1), i + 1);
        const totalGain = window.reduce((sum, c) => {
            return sum + ((c.sellPrice * c.quantity) - (c.buyPrice * c.quantity));
        }, 0);
        const avg = totalGain / window.length;
        
        labels.push(`#${cycles[i].id}`);
        avgGains.push(avg);
    }
    
    const ctx = document.getElementById('avgGainEvolutionChart').getContext('2d');
    avgGainEvolutionChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Gain moyen (fenêtre 10 cycles)',
                data: avgGains,
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
                    callbacks: {
                        label: (ctx) => '$' + ctx.parsed.y.toFixed(2)
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
            }
        }
    });
}

// Graphique: Evolution du taux de réussite
function updateSuccessRateEvolutionChart(cycles) {
    if (successRateEvolutionChart) successRateEvolutionChart.destroy();
    
    // Calculer le taux de réussite par fenêtre glissante de 20 cycles
    const windowSize = 20;
    const labels = [];
    const successRates = [];
    
    for (let i = windowSize - 1; i < cycles.length; i++) {
        const window = cycles.slice(Math.max(0, i - windowSize + 1), i + 1);
        const profitable = window.filter(c => {
            const gain = (c.sellPrice * c.quantity) - (c.buyPrice * c.quantity);
            return gain > 0;
        }).length;
        
        const rate = (profitable / window.length) * 100;
        
        labels.push(`#${cycles[i].id}`);
        successRates.push(rate);
    }
    
    const ctx = document.getElementById('successRateEvolutionChart').getContext('2d');
    successRateEvolutionChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Taux de réussite (fenêtre 20 cycles)',
                data: successRates,
                borderColor: '#60a5fa',
                backgroundColor: 'rgba(96,165,250,0.1)',
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
                    callbacks: {
                        label: (ctx) => ctx.parsed.y.toFixed(1) + '%'
                    }
                }
            },
            scales: {
                y: {
                    min: 0,
                    max: 100,
                    grid: { color: '#2d3748' },
                    ticks: { 
                        color: '#9ca3af',
                        callback: (val) => val + '%'
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
            }
        }
    });
}

// Graphique: Performance cumulative (Analytics)
function updatePerformanceChartAnalytics(cycles) {
    if (performanceChartAnalytics) performanceChartAnalytics.destroy();
    
    let cumulative = 0;
    const labels = [];
    const data = [];
    
    cycles.forEach(cycle => {
        const gain = (cycle.sellPrice * cycle.quantity) - (cycle.buyPrice * cycle.quantity);
        cumulative += gain;
        labels.push(`#${cycle.id}`);
        data.push(cumulative);
    });
    
    const ctx = document.getElementById('performanceChartAnalytics').getContext('2d');
    performanceChartAnalytics = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Gain cumulé',
                data: data,
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
                    callbacks: {
                        label: (ctx) => 'Gain: $' + ctx.parsed.y.toFixed(2)
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
            }
        }
    });
}

// Graphique: Distribution des gains (Analytics)
function updateGainsDistributionChartAnalytics(cycles) {
    if (gainsDistributionChartAnalytics) gainsDistributionChartAnalytics.destroy();
    
    // Calculer tous les gains
    const gains = cycles.map(c => (c.sellPrice * c.quantity) - (c.buyPrice * c.quantity));
    
    if (gains.length === 0) {
        return; // Pas de données
    }
    
    // Trouver min et max
    const minGain = Math.min(...gains);
    const maxGain = Math.max(...gains);
    
    // Créer 8 tranches automatiques
    const numRanges = 8;
    const rangeSize = (maxGain - minGain) / numRanges;
    
    const ranges = [];
    for (let i = 0; i < numRanges; i++) {
        const rangeMin = minGain + (i * rangeSize);
        const rangeMax = minGain + ((i + 1) * rangeSize);
        
        // Formater les labels joliment
        let label;
        if (rangeSize < 0.1) {
            // Petits montants : 2 décimales
            label = `$${rangeMin.toFixed(2)} à $${rangeMax.toFixed(2)}`;
        } else if (rangeSize < 1) {
            // Moyens montants : 1 décimale
            label = `$${rangeMin.toFixed(1)} à $${rangeMax.toFixed(1)}`;
        } else {
            // Gros montants : entiers
            label = `$${rangeMin.toFixed(0)} à $${rangeMax.toFixed(0)}`;
        }
        
        ranges.push({ min: rangeMin, max: rangeMax, label });
    }
    
    // Compter les cycles dans chaque tranche
    const counts = ranges.map(range => {
        return gains.filter(g => g >= range.min && g < range.max).length;
    });
    
    // Ajouter les gains exactement égaux au max dans la dernière tranche
    counts[counts.length - 1] += gains.filter(g => g === maxGain).length;
    
    const ctx = document.getElementById('gainsDistributionChartAnalytics').getContext('2d');
    gainsDistributionChartAnalytics = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ranges.map(r => r.label),
            datasets: [{
                label: 'Nombre de cycles',
                data: counts,
                backgroundColor: '#4ade80',
                borderColor: '#22c55e',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(26,31,46,0.9)',
                    callbacks: {
                        label: (ctx) => ctx.parsed.y + ' cycles'
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: '#2d3748' },
                    ticks: { 
                        color: '#9ca3af',
                        stepSize: 1
                    }
                },
                x: {
                    grid: { display: false },
                    ticks: { 
                        color: '#9ca3af',
                        maxRotation: 45,
                        minRotation: 45
                    }
                }
            }
        }
    });
}

// Graphique: Ratio Gains/Pertes
function updateWinLossRatioChart(data) {
    if (winLossRatioChart) winLossRatioChart.destroy();
    
    const ctx = document.getElementById('winLossRatioChart').getContext('2d');
    winLossRatioChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Cycles Gagnants', 'Cycles Perdants'],
            datasets: [{
                data: [data.profitableCycles, data.losingCycles],
                backgroundColor: ['#4ade80', '#ef4444'],
                borderWidth: 2,
                borderColor: '#1a1f2e'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#9ca3af',
                        padding: 20,
                        font: { size: 12 }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(26,31,46,0.9)',
                    callbacks: {
                        label: (ctx) => {
                            const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((ctx.parsed / total) * 100).toFixed(1);
                            return `${ctx.label}: ${ctx.parsed} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

// Tables: Top & Bottom trades
function updateTopBottomTrades(cycles) {
    // Calculer les gains pour chaque cycle
    const cyclesWithGains = cycles.map(c => {
        const gain = (c.sellPrice * c.quantity) - (c.buyPrice * c.quantity);
        const gainPercent = (gain / (c.buyPrice * c.quantity)) * 100;
        return { ...c, gain, gainPercent };
    });
    
    // Top 10 meilleurs
    const topTrades = [...cyclesWithGains]
        .sort((a, b) => b.gain - a.gain)
        .slice(0, 10);
    
    const topBody = document.getElementById('topTradesBody');
    if (topTrades.length === 0) {
        topBody.innerHTML = '<tr><td colspan="6" class="loading">Aucune donnée</td></tr>';
    } else {
        topBody.innerHTML = topTrades.map((c, i) => `
            <tr>
                <td>🏆 ${i + 1}</td>
                <td>#${c.id}</td>
                <td class="positive">$${formatNumber(c.gain, 2)}</td>
                <td class="positive">${formatNumber(c.gainPercent, 2)}%</td>
                <td>${formatNumber(c.quantity, 8)} BTC</td>
                <td>-</td>
            </tr>
        `).join('');
    }
    
    // Bottom 10 moins rentables (mais peuvent être positifs)
    const bottomTrades = [...cyclesWithGains]
        .sort((a, b) => a.gain - b.gain)
        .slice(0, 10);
    
    const bottomBody = document.getElementById('bottomTradesBody');
    if (bottomTrades.length === 0) {
        bottomBody.innerHTML = '<tr><td colspan="6" class="loading">Aucune donnée</td></tr>';
    } else {
        bottomBody.innerHTML = bottomTrades.map((c, i) => {
            // Si le gain est positif, c'est quand même un gain (vert)
            // Si le gain est négatif, c'est une vraie perte (rouge)
            const colorClass = c.gain >= 0 ? 'positive' : 'negative';
            const emoji = c.gain >= 0 ? '📉' : '⚠️';
            
            return `
            <tr>
                <td>${emoji} ${i + 1}</td>
                <td>#${c.id}</td>
                <td class="${colorClass}">$${formatNumber(c.gain, 2)}</td>
                <td class="${colorClass}">${formatNumber(c.gainPercent, 2)}%</td>
                <td>${formatNumber(c.quantity, 8)} BTC</td>
                <td>-</td>
            </tr>
            `;
        }).join('');
    }
}
