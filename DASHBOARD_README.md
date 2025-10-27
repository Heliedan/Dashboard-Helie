# 🤖 Dashboard Bot-Spot

Dashboard web pour monitorer et contrôler votre bot de trading.

## 📋 Prérequis

- Python 3.8+
- Bot-Spot installé et configuré
- Clés API configurées dans `bot.conf`

## 🚀 Installation

### Première installation

```bash
# Cloner le repository avec la branche v2
git clone -b v2 https://github.com/Heliedan/Dashboard-Helie.git
cd Dashboard-Helie

# OU télécharger directement
wget https://github.com/Heliedan/Dashboard-Helie/archive/v2.zip
unzip v2.zip
cd Dashboard-Helie-v2
```

### Mise à jour depuis GitHub

Si vous avez déjà le dashboard installé :

```bash
# Se positionner dans le dossier du dashboard
cd ~/bot-spot  # ou votre dossier d'installation

# Sauvegarder votre configuration (important!)
cp bot.conf bot.conf.backup
cp auto_config.json auto_config.json.backup 2>/dev/null || true

# Récupérer les dernières modifications
git pull origin v2

# OU si vous n'avez pas git
wget https://github.com/Heliedan/Dashboard-Helie/archive/v2.zip
unzip -o v2.zip
cp -r Dashboard-Helie-v2/* .
rm -rf Dashboard-Helie-v2 v2.zip

# Restaurer votre configuration
cp bot.conf.backup bot.conf
cp auto_config.json.backup auto_config.json 2>/dev/null || true
```

## 📦 Dépendances

```bash
pip install flask requests
```

## ⚙️ Configuration

### Détection automatique de la base de données

Le dashboard détecte automatiquement l'emplacement de votre base de données selon votre système d'exploitation :

**Windows :**
- `%USERPROFILE%\cryptomancien\bot-db\bot.db`
- `%USERPROFILE%\bot-spot\db\bot.db`
- `C:\Users\Utilisateur\cryptomancien\bot-db\bot.db`
- `db\bot.db` (dossier local)

**Linux/Mac :**
- `~/bot-spot/db/bot.db`
- `~/Crypto/bot-spot/db/bot.db`
- `/home/Crypto/bot-spot/db/bot.db`
- `db/bot.db` (dossier local)

Le dashboard cherche automatiquement dans ces emplacements au démarrage et utilise le premier trouvé.

### Configuration manuelle (optionnel)

Si votre base de données est dans un emplacement non standard, vous pouvez modifier le chemin dans `dashboard.py` :

```python
DB_PATH = r"C:\Votre\Chemin\Personnalise\bot.db"  # Windows
# ou
DB_PATH = "/votre/chemin/personnalise/bot.db"  # Linux/Mac
```

## ▶️ Utilisation

```bash
python3 dashboard.py  # Linux/Mac
python dashboard.py   # Windows
```

**Accès local :** http://localhost:8081

**Accès réseau :** http://VOTRE_IP:8081

💡 *Pour trouver votre IP :*
- Linux/Mac : `hostname -I`
- Windows : `ipconfig`

## ✨ Fonctionnalités

### 📊 Vue d'ensemble
- Monitoring en temps réel (balances, prix BTC, cycles actifs)
- Statistiques de trading (gain total, gain moyen, taux de réussite)
- Graphique d'évolution du portefeuille 24h
- Gain potentiel total des ordres actifs

### 📈 Analytics
- Distribution des gains
- Top 10 meilleurs trades
- Bottom 10 moins rentables
- Métriques détaillées de performance

### 🔄 Cycles
- Liste complète des cycles (actifs et complétés)
- Filtrage par statut
- Export CSV/JSON
- Détails de chaque cycle

### 📊 Marché
- Prix BTC en temps réel avec graphiques 24h, 7j, 3M
- Volume et sentiment du marché
- Fear & Greed Index
- Dominance BTC/ETH
- Conditions de marché

### 📝 Gestion des Ordres
- Liste des ordres de vente actifs
- Modification manuelle des prix de vente
- Aperçu en temps réel du gain potentiel
- Synchronisation avec MEXC

### 👤 Profils
- Création de profils de trading personnalisés
- Gestion des offsets d'achat/vente
- Activation rapide de profils prédéfinis

### ⚙️ Configuration
- Mode automatique avec intervalles configurables
- Compteur temps réel jusqu'au prochain cycle
- Configuration des paramètres du bot
- Export des données

## 🔄 Mise à jour depuis une version antérieure

Les utilisateurs qui ont déjà une version du dashboard peuvent mettre à jour facilement :

1. **Sauvegarder leurs configurations** (le dashboard ne touche pas à `bot.conf`)
2. **Récupérer la nouvelle version** depuis GitHub
3. **Relancer le dashboard** - les nouvelles fonctionnalités sont automatiquement disponibles

```bash
# Exemple de mise à jour rapide
cd ~/bot-spot
git pull origin v2
python3 dashboard.py
```

## 🆕 Nouveautés de la v2

- ✅ Détection automatique du chemin de la base de données (Windows/Linux/Mac)
- ✅ Nouvel onglet "Marché" avec indicateurs en temps réel
- ✅ Gestion manuelle des ordres de vente
- ✅ Compteur temps réel pour le mode automatique (seconde par seconde)
- ✅ Graphiques de prix avec sélection de période (24h, 7j, 3M)
- ✅ Interface simplifiée et optimisée
- ✅ Suppression des fonctionnalités non pertinentes (backtesting)

## 🐛 Résolution de problèmes

### La base de données n'est pas trouvée

Le dashboard affiche au démarrage :
```
✅ Base de données trouvée: /chemin/vers/bot.db
```

Si vous voyez :
```
⚠️ Aucune base de données trouvée, utilisation du chemin par défaut: db/bot.db
```

Vérifiez que :
1. Le bot est bien installé et a créé la base de données
2. Le chemin correspond à un des emplacements supportés
3. Vous avez les permissions de lecture sur le fichier

### Erreur de connexion MEXC

Vérifiez que vos clés API sont bien configurées dans `bot.conf` :
```
API_KEY=votre_cle
SECRET_KEY=votre_secret
```

### Port 8081 déjà utilisé

Modifiez le port dans `dashboard.py` :
```python
app.run(host='0.0.0.0', port=8082, debug=False)
```

## 📧 Support

Pour toute question ou problème :
- GitHub Issues : [Heliedan/Dashboard-Helie](https://github.com/Heliedan/Dashboard-Helie)
- Contact : [@Heliedan](https://github.com/Heliedan)

## 📝 Licence

Ce projet est open source. Utilisation libre pour la communauté de trading.

