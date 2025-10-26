// ============ GESTION DES PROFILS DE TRADING ============

let profiles = [];
let currentProfile = null;

// Charger les profils au démarrage
document.addEventListener('DOMContentLoaded', function() {
    loadProfiles();
});

// Charger la liste des profils
async function loadProfiles() {
    try {
        const response = await fetch('/api/profiles');
        if (!response.ok) {
            throw new Error('Erreur lors du chargement des profils');
        }
        
        profiles = await response.json();
        displayProfiles();
    } catch (error) {
        console.error('Erreur chargement profils:', error);
        document.getElementById('profilesList').innerHTML = 
            '<div style="color:#ef4444;text-align:center;padding:20px;">❌ Erreur lors du chargement des profils</div>';
    }
}

// Afficher la liste des profils
function displayProfiles() {
    const container = document.getElementById('profilesList');
    
    if (profiles.length === 0) {
        container.innerHTML = '<div style="color:#9ca3af;text-align:center;padding:20px;">Aucun profil disponible</div>';
        return;
    }
    
    const profilesHTML = profiles.map(profile => `
        <div class="profile-card" style="
            background: #1a1f2e; 
            border: 1px solid #2d3748; 
            border-radius: 12px; 
            padding: 20px; 
            margin-bottom: 15px;
            transition: all 0.3s ease;
        " onmouseover="this.style.borderColor='#4ade80'" onmouseout="this.style.borderColor='#2d3748'">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px;">
                <div>
                    <h3 style="color: #e8eaed; font-size: 18px; margin-bottom: 5px;">${profile.name}</h3>
                    <p style="color: #9ca3af; font-size: 14px; margin-bottom: 10px;">${profile.description || 'Aucune description'}</p>
                </div>
                <div style="display: flex; gap: 10px;">
                    <button class="btn" onclick="applyProfile(${profile.id})" style="padding: 8px 16px; font-size: 13px;">
                        ✅ Appliquer
                    </button>
                    <button class="btn secondary" onclick="editProfile(${profile.id})" style="padding: 8px 16px; font-size: 13px;">
                        ✏️ Modifier
                    </button>
                    <button class="btn danger" onclick="deleteProfile(${profile.id})" style="padding: 8px 16px; font-size: 13px;">
                        🗑️ Supprimer
                    </button>
                </div>
            </div>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px;">
                <div style="text-align: center; padding: 10px; background: rgba(74, 222, 128, 0.1); border-radius: 8px;">
                    <div style="color: #9ca3af; font-size: 12px; text-transform: uppercase; margin-bottom: 5px;">Buy Offset</div>
                    <div style="color: #4ade80; font-size: 18px; font-weight: bold;">${profile.buy_offset}</div>
                </div>
                <div style="text-align: center; padding: 10px; background: rgba(239, 68, 68, 0.1); border-radius: 8px;">
                    <div style="color: #9ca3af; font-size: 12px; text-transform: uppercase; margin-bottom: 5px;">Sell Offset</div>
                    <div style="color: #ef4444; font-size: 18px; font-weight: bold;">${profile.sell_offset}</div>
                </div>
                <div style="text-align: center; padding: 10px; background: rgba(96, 165, 250, 0.1); border-radius: 8px;">
                    <div style="color: #9ca3af; font-size: 12px; text-transform: uppercase; margin-bottom: 5px;">Percent</div>
                    <div style="color: #60a5fa; font-size: 18px; font-weight: bold;">${profile.percent}%</div>
                </div>
            </div>
        </div>
    `).join('');
    
    container.innerHTML = profilesHTML;
}

// Appliquer un profil
async function applyProfile(profileId) {
    try {
        const response = await fetch(`/api/profiles/${profileId}/apply`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification(`✅ Profil "${result.profile.name}" appliqué avec succès!`, 'success');
            
            // Mettre à jour l'affichage de la configuration
            if (typeof updateConfigDisplay === 'function') {
                updateConfigDisplay();
            }
            
            // Recharger les données du dashboard
            if (typeof loadData === 'function') {
                loadData();
            }
        } else {
            showNotification(`❌ Erreur: ${result.error}`, 'error');
        }
    } catch (error) {
        console.error('Erreur application profil:', error);
        showNotification('❌ Erreur lors de l\'application du profil', 'error');
    }
}

// Créer un nouveau profil
async function createProfile() {
    const name = document.getElementById('newProfileName').value.trim();
    const description = document.getElementById('newProfileDescription').value.trim();
    const buyOffset = parseInt(document.getElementById('newProfileBuyOffset').value);
    const sellOffset = parseInt(document.getElementById('newProfileSellOffset').value);
    const percent = parseFloat(document.getElementById('newProfilePercent').value);
    
    // Validation
    if (!name) {
        showNotification('❌ Le nom du profil est requis', 'error');
        return;
    }
    
    if (isNaN(buyOffset) || isNaN(sellOffset) || isNaN(percent)) {
        showNotification('❌ Veuillez saisir des valeurs numériques valides', 'error');
        return;
    }
    
    try {
        const response = await fetch('/api/profiles', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: name,
                description: description,
                buy_offset: buyOffset,
                sell_offset: sellOffset,
                percent: percent
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification(`✅ Profil "${name}" créé avec succès!`, 'success');
            
            // Vider le formulaire
            document.getElementById('newProfileName').value = '';
            document.getElementById('newProfileDescription').value = '';
            document.getElementById('newProfileBuyOffset').value = '';
            document.getElementById('newProfileSellOffset').value = '';
            document.getElementById('newProfilePercent').value = '';
            
            // Recharger la liste
            loadProfiles();
        } else {
            showNotification(`❌ Erreur: ${result.error}`, 'error');
        }
    } catch (error) {
        console.error('Erreur création profil:', error);
        showNotification('❌ Erreur lors de la création du profil', 'error');
    }
}

// Modifier un profil
function editProfile(profileId) {
    const profile = profiles.find(p => p.id === profileId);
    if (!profile) return;
    
    // Remplir le formulaire avec les données du profil
    document.getElementById('newProfileName').value = profile.name;
    document.getElementById('newProfileDescription').value = profile.description || '';
    document.getElementById('newProfileBuyOffset').value = profile.buy_offset;
    document.getElementById('newProfileSellOffset').value = profile.sell_offset;
    document.getElementById('newProfilePercent').value = profile.percent;
    
    // Changer le bouton pour "Mettre à jour"
    const button = document.querySelector('button[onclick="createProfile()"]');
    button.innerHTML = '💾 Mettre à jour';
    button.setAttribute('onclick', `updateProfile(${profileId})`);
    
    // Scroll vers le formulaire
    document.querySelector('.config-form').scrollIntoView({ behavior: 'smooth' });
}

// Mettre à jour un profil
async function updateProfile(profileId) {
    const name = document.getElementById('newProfileName').value.trim();
    const description = document.getElementById('newProfileDescription').value.trim();
    const buyOffset = parseInt(document.getElementById('newProfileBuyOffset').value);
    const sellOffset = parseInt(document.getElementById('newProfileSellOffset').value);
    const percent = parseFloat(document.getElementById('newProfilePercent').value);
    
    // Validation
    if (!name) {
        showNotification('❌ Le nom du profil est requis', 'error');
        return;
    }
    
    if (isNaN(buyOffset) || isNaN(sellOffset) || isNaN(percent)) {
        showNotification('❌ Veuillez saisir des valeurs numériques valides', 'error');
        return;
    }
    
    try {
        const response = await fetch(`/api/profiles/${profileId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: name,
                description: description,
                buy_offset: buyOffset,
                sell_offset: sellOffset,
                percent: percent
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification(`✅ Profil "${name}" mis à jour avec succès!`, 'success');
            
            // Vider le formulaire et remettre le bouton normal
            document.getElementById('newProfileName').value = '';
            document.getElementById('newProfileDescription').value = '';
            document.getElementById('newProfileBuyOffset').value = '';
            document.getElementById('newProfileSellOffset').value = '';
            document.getElementById('newProfilePercent').value = '';
            
            const button = document.querySelector('button[onclick*="updateProfile"]');
            button.innerHTML = '➕ Créer Profil';
            button.setAttribute('onclick', 'createProfile()');
            
            // Recharger la liste
            loadProfiles();
        } else {
            showNotification(`❌ Erreur: ${result.error}`, 'error');
        }
    } catch (error) {
        console.error('Erreur mise à jour profil:', error);
        showNotification('❌ Erreur lors de la mise à jour du profil', 'error');
    }
}

// Supprimer un profil
async function deleteProfile(profileId) {
    const profile = profiles.find(p => p.id === profileId);
    if (!profile) return;
    
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le profil "${profile.name}" ?`)) {
        return;
    }
    
    try {
        const response = await fetch(`/api/profiles/${profileId}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification(`✅ Profil "${profile.name}" supprimé avec succès!`, 'success');
            loadProfiles();
        } else {
            showNotification(`❌ Erreur: ${result.error}`, 'error');
        }
    } catch (error) {
        console.error('Erreur suppression profil:', error);
        showNotification('❌ Erreur lors de la suppression du profil', 'error');
    }
}

// Afficher une notification
function showNotification(message, type = 'info') {
    // Créer l'élément de notification
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 600;
        z-index: 10000;
        max-width: 400px;
        animation: slideIn 0.3s ease;
    `;
    
    // Styles selon le type
    if (type === 'success') {
        notification.style.background = 'linear-gradient(135deg, #4ade80 0%, #22c55e 100%)';
    } else if (type === 'error') {
        notification.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
    } else {
        notification.style.background = 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)';
    }
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Supprimer après 5 secondes
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 5000);
}

// Ajouter les styles CSS pour les animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);
