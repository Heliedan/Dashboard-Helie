# 🤖 Bot-Spot Dashboard

Dashboard web pour monitorer et contrôler votre bot de trading bot-spot.

## 📋 Prérequis

- Python 3.8+
- [Bot-Spot](https://github.com/netwarp/bot-spot) installé et configuré
- Clés API MEXC configurées dans `bot.conf`

## 🚀 Installation
```bash
# Dans votre dossier bot-spot existant
cd ~/bot-spot

# Téléchargez les fichiers du dashboard
wget https://github.com/Heliedan/Dashboard-Helie/archive/v2.zip
unzip v2.zip
cp -r Dashboard-Helie-v2/* .
rm -rf Dashboard-Helie-v2 v2.zip
```

**Ou avec git :**
```bash
cd ~/bot-spot
git clone -b v2 https://github.com/Heliedan/Dashboard-Helie.git temp
cp -r temp/* .
rm -rf temp
```

## 📦 Dépendances
```bash
pip install flask requests
```

## ▶️ Utilisation
```bash
python3 dashboard.py
```

**Accès local :** http://localhost:8081  
**Accès réseau :** http://VOTRE_IP:8081 (remplacez VOTRE_IP par l'IP de votre Raspberry Pi)

💡 *Pour trouver votre IP : `hostname -I`*

## ✨ Fonctionnalités

- 📊 Monitoring en temps réel (balances, prix BTC, cycles actifs)
- 📈 Graphiques de performance
- ⚙️ Mode automatique avec intervalles configurables
- 🛠️ Configuration du bot en direct
- 📥 Export CSV/JSON

## ⚠️ Avertissement

Le trading comporte des risques. Ne partagez jamais vos clés API.

## 📧 Support

Pour toute question : [@Heliedan](https://github.com/Heliedan)
