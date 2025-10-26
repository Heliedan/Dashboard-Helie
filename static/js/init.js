// Initialisation du dashboard (à charger en dernier)
console.log('🚀 Dashboard initialisé');
refreshData();
loadPerformanceData();
loadGainsDistribution();
loadActiveCyclesTimeline();
refreshAutoStatus();

// Charger la config bot au démarrage
setTimeout(() => {
    loadCurrentConfig();
}, 1000);

// Intervalles de rafraîchissement
setInterval(refreshData, 180000); // 3 minutes
setInterval(refreshAutoStatus, 10000); // 10 secondes

// Charger les analytics si on est sur cet onglet
setInterval(() => {
    const analyticsTab = document.getElementById('tab-analytics');
    if (analyticsTab && analyticsTab.classList.contains('active')) {
        loadAnalyticsData();
    }
}, 180000); // Rafraîchir les analytics toutes les 3 minutes si l'onglet est actif
