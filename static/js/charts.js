// Variables pour les graphiques
let gaugeBuyChart = null;
let gaugeSellChart = null;
let sparklineBuyChart = null;
let sparklineSellChart = null;
let currentPeriod = 14;
let historyData = { dates: [], buy_counts: [], sell_counts: [], full_dates: [] };

// Chargement des données pour les graphiques
async function loadPerformanceData() {
    try {
        const response = await fetch('/api/performance');
        allPerformanceData = await response.json();
        updatePerformanceChart();
    } catch (e) {
        console.error('Erreur performance:', e);
    }
}

async function loadGainsDistribution() {
    try {
        const response = await fetch('/api/gains-distribution');
        const data = await response.json();
        updateGainsDistributionChart(data);
    } catch (e) {
        console.error('Erreur gains distribution:', e);
    }
}

async function loadActiveCyclesTimeline() {
    try {
        const response = await fetch('/api/active-cycles-history-split');
        historyData = await response.json();
        updateDualGaugeAndSparkline(currentPeriod);
    } catch (e) {
        console.error('Erreur active cycles timeline:', e);
    }
}

// Fonction pour changer la période
function changePeriod(days) {
    currentPeriod = days;
    
    document.querySelectorAll('.period-btn').forEach(btn => {
        btn.classList.remove('active');
        if (parseInt(btn.dataset.period) === days) {
            btn.classList.add('active');
        }
    });
    
    updateDualGaugeAndSparkline(days);
}

// Mise à jour des 2 jauges et sparklines
function updateDualGaugeAndSparkline(days) {
    if (!historyData.dates || historyData.dates.length === 0) return;
    
    let filteredDates, filteredBuyCounts, filteredSellCounts;
    
    if (days === 0) {
        filteredDates = historyData.dates;
        filteredBuyCounts = historyData.buy_counts;
        filteredSellCounts = historyData.sell_counts;
    } else {
        const startIndex = Math.max(0, historyData.dates.length - days);
        filteredDates = historyData.dates.slice(startIndex);
        filteredBuyCounts = historyData.buy_counts.slice(startIndex);
        filteredSellCounts = historyData.sell_counts.slice(startIndex);
    }
    
    const currentBuyValue = filteredBuyCounts[filteredBuyCounts.length - 1] || 0;
    const currentSellValue = filteredSellCounts[filteredSellCounts.length - 1] || 0;
    
    // Mise à jour jauge ACHAT
    document.getElementById('gaugeBuyValue').textContent = currentBuyValue;
    
    if (gaugeBuyChart) gaugeBuyChart.destroy();
    
    const ctxBuy = document.getElementById('gaugeBuyChart').getContext('2d');
    gaugeBuyChart = new Chart(ctxBuy, {
        type: 'doughnut',
        data: {
            datasets: [{
                data: [currentBuyValue, Math.max(10 - currentBuyValue, 0)],
                backgroundColor: ['#60a5fa', '#1f2937'],
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
    
    // Mise à jour jauge VENTE
    document.getElementById('gaugeSellValue').textContent = currentSellValue;
    
    if (gaugeSellChart) gaugeSellChart.destroy();
    
    const ctxSell = document.getElementById('gaugeSellChart').getContext('2d');
    gaugeSellChart = new Chart(ctxSell, {
        type: 'doughnut',
        data: {
            datasets: [{
                data: [currentSellValue, Math.max(10 - currentSellValue, 0)],
                backgroundColor: ['#fb923c', '#1f2937'],
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
    
    let periodLabel = days === 0 ? 'Historique complet' : `${days} derniers jours`;
    document.getElementById('periodLabelBuy').textContent = periodLabel;
    document.getElementById('periodLabelSell').textContent = periodLabel;
    
    // Sparkline ACHAT
    if (sparklineBuyChart) sparklineBuyChart.destroy();
    
    const ctxSparklineBuy = document.getElementById('sparklineBuyChart').getContext('2d');
    sparklineBuyChart = new Chart(ctxSparklineBuy, {
        type: 'line',
        data: {
            labels: filteredDates,
            datasets: [{
                data: filteredBuyCounts,
                borderColor: '#60a5fa',
                backgroundColor: 'rgba(96,165,250,0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointRadius: 2,
                pointBackgroundColor: '#60a5fa',
                pointBorderColor: '#fff',
                pointBorderWidth: 1,
                pointHoverRadius: 4
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
                    bodyColor: '#60a5fa',
                    borderColor: '#4a5568',
                    borderWidth: 1,
                    padding: 8,
                    displayColors: false,
                    callbacks: {
                        label: (ctx) => ctx.parsed.y + ' en achat'
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: '#2d3748', drawBorder: false },
                    ticks: { color: '#9ca3af', stepSize: 1, font: { size: 10 } }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#9ca3af', font: { size: 9 }, maxRotation: 45, minRotation: 45 }
                }
            }
        }
    });
    
    // Sparkline VENTE
    if (sparklineSellChart) sparklineSellChart.destroy();
    
    const ctxSparklineSell = document.getElementById('sparklineSellChart').getContext('2d');
    sparklineSellChart = new Chart(ctxSparklineSell, {
        type: 'line',
        data: {
            labels: filteredDates,
            datasets: [{
                data: filteredSellCounts,
                borderColor: '#fb923c',
                backgroundColor: 'rgba(251,146,60,0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointRadius: 2,
                pointBackgroundColor: '#fb923c',
                pointBorderColor: '#fff',
                pointBorderWidth: 1,
                pointHoverRadius: 4
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
                    bodyColor: '#fb923c',
                    borderColor: '#4a5568',
                    borderWidth: 1,
                    padding: 8,
                    displayColors: false,
                    callbacks: {
                        label: (ctx) => ctx.parsed.y + ' en vente'
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: '#2d3748', drawBorder: false },
                    ticks: { color: '#9ca3af', stepSize: 1, font: { size: 10 } }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#9ca3af', font: { size: 9 }, maxRotation: 45, minRotation: 45 }
                }
            }
        }
    });
}

// Graphique de performance
function updatePerformanceChart() {
    const labels = allPerformanceData.map(d => d.cycle_id);
    const data = allPerformanceData.map(d => d.cumulative_gain);
    
    if (performanceChart) performanceChart.destroy();
    
    const ctx = document.getElementById('performanceChart').getContext('2d');
    performanceChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Gain cumule',
                data: data,
                borderColor: '#4ade80',
                backgroundColor: 'rgba(74,222,128,0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 5,
                pointHoverBackgroundColor: '#4ade80',
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
                    bodyColor: '#4ade80',
                    borderColor: '#4a5568',
                    borderWidth: 1,
                    padding: 12,
                    displayColors: false,
                    callbacks: {
                        label: (ctx) => 'Gain: $' + ctx.parsed.y.toFixed(2)
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: '#2d3748', drawBorder: false },
                    ticks: {
                        color: '#9ca3af',
                        callback: (val) => '$' + val.toFixed(0)
                    }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#9ca3af', maxRotation: 0, autoSkipPadding: 20 },
                    title: { display: true, text: 'Cycles', color: '#9ca3af', font: { size: 12 } }
                }
            },
            interaction: { intersect: false, mode: 'index' }
        }
    });
}

// Graphique de distribution des gains
function updateGainsDistributionChart(data) {
    if (gainsDistributionChart) gainsDistributionChart.destroy();
    
    const ctx = document.getElementById('gainsDistributionChart').getContext('2d');
    gainsDistributionChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.ranges,
            datasets: [{
                label: 'Nombre de cycles',
                data: data.counts,
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
                    titleColor: '#e8eaed',
                    bodyColor: '#4ade80',
                    borderColor: '#4a5568',
                    borderWidth: 1,
                    padding: 12,
                    displayColors: false,
                    callbacks: {
                        label: (ctx) => ctx.parsed.y + ' cycles'
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: '#2d3748', drawBorder: false },
                    ticks: { color: '#9ca3af', stepSize: 1 },
                    title: { display: true, text: 'Nombre de cycles', color: '#9ca3af', font: { size: 12 } }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#9ca3af', maxRotation: 45, minRotation: 45 },
                    title: { display: true, text: 'Tranche de gain', color: '#9ca3af', font: { size: 12 } }
                }
            }
        }
    });
}
