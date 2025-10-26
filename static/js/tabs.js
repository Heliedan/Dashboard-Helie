// Gestion des onglets
function switchTab(tabName, event) {
    // Masquer tous les contenus d'onglets
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // Retirer la classe active de tous les onglets
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Activer l'onglet et le contenu sélectionnés
    document.getElementById('tab-' + tabName).classList.add('active');
    
    // Activer visuellement le bouton cliqué
    if (event && event.target) {
        event.target.classList.add('active');
    } else {
        // Si pas d'event (appel programmatique), trouver le bouton
        const button = document.querySelector(`[onclick*="switchTab('${tabName}']`);
        if (button) button.classList.add('active');
    }
    
    // Si on passe à l'onglet Analytics, charger les données
    if (tabName === 'analytics') {
        console.log('🔄 Passage à l\'onglet Analytics');
        setTimeout(() => {
            if (typeof loadAnalyticsData === 'function') {
                console.log('📊 Chargement des analytics...');
                loadAnalyticsData();
            } else {
                console.error('❌ loadAnalyticsData n\'est pas définie !');
            }
        }, 100);
    }
    
    
    // Si on passe à l'onglet Backtesting, charger les données
    if (tabName === 'backtesting') {
        console.log('🔄 Passage à l\'onglet Backtesting');
        setTimeout(() => {
            if (typeof loadBacktestData === 'function') {
                console.log('🧪 Chargement du backtesting...');
                loadBacktestData();
            } else {
                console.error('❌ loadBacktestData n\'est pas définie !');
            }
        }, 100);
    }
    
    // Si on passe à l'onglet Profils, charger les données
    if (tabName === 'profiles') {
        console.log('🔄 Passage à l\'onglet Profils');
        setTimeout(() => {
            if (typeof loadProfiles === 'function') {
                console.log('🎯 Chargement des profils...');
                loadProfiles();
            } else {
                console.error('❌ loadProfiles n\'est pas définie !');
            }
        }, 100);
    }
    
    // Sauvegarder l'onglet actif dans le localStorage
    try {
        localStorage.setItem('activeTab', tabName);
    } catch (e) {
        // Ignorer les erreurs de localStorage
    }
}

// Restaurer l'onglet actif au chargement de la page
function restoreActiveTab() {
    try {
        const activeTab = localStorage.getItem('activeTab');
        if (activeTab) {
            const tabButton = document.querySelector(`[onclick="switchTab('${activeTab}')"]`);
            if (tabButton) {
                tabButton.click();
            }
        }
    } catch (e) {
        // Ignorer les erreurs de localStorage
    }
}

// Restaurer l'onglet au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    restoreActiveTab();
});
