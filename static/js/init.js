// Initialisation du dashboard (à charger en dernier)
console.log('🚀 Dashboard initialise');
refreshData();
loadPerformanceData();
loadGainsDistribution();
loadActiveCyclesTimeline();
refreshAutoStatus();
setInterval(refreshData, 180000);
setInterval(refreshAutoStatus, 10000);
