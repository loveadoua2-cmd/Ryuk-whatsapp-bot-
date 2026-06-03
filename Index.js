const { Client, LocalAuth } = require('whatsapp-web.js');
const readline = require('readline');

// Configuration du bot
const BOT_NAME = 'ryuk';
const BOT_VERSION = '1.0';
const CREATOR = 'lord Kira';
const WELCOME_MESSAGE = 'Bonjour, comment allez-vous 😘 !';

// Interface pour demander le numéro de téléphone
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Création du client WhatsApp
const client = new Client({
    authStrategy: new LocalAuth(),        // garde la session active
    puppeteer: { headless: true, args: ['--no-sandbox'] }
});

let phoneNumber = '';
let pairingRequested = false;

// --------------------- ÉVÉNEMENT PRINCIPAUX ---------------------
client.on('qr', (qr) => {
    if (!pairingRequested) {
        console.log('📲 Scanne ce QR Code si tu ne veux pas utiliser le pairing code :');
        require('qrcode-terminal').generate(qr, { small: true });
    }
});

client.on('authenticated', () => {
    console.log('✅ Authentification réussie !');
});

client.on('ready', async () => {
    console.log(`🚀 Bot prêt !\n📛 Nom : ${BOT_NAME}\n🔢 Version : ${BOT_VERSION}\n👤 Créateur : ${CREATOR}`);
    
    // 1. Envoie le message de bienvenue à TOUS les groupes et chaînes
    const allChats = await client.getChats();
    let sentCount = 0;

    for (const chat of allChats) {
        // Envoie aux groupes (classiques et communautés) ET aux chaînes (newsletters)
        if (chat.isGroup || chat.type === 'newsletter') {
            try {
                await chat.sendMessage(WELCOME_MESSAGE);
                console.log(`📤 Message envoyé à : ${chat.name || chat.id.user}`);
                sentCount++;
                // Petite pause pour éviter d'être bloqué par WhatsApp
                await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (err) {
                console.error(`❌ Erreur avec ${chat.name || chat.id.user} :`, err.message);
            }
        }
    }
    console.log(`✅ ${sentCount} messages envoyés (groupes + chaînes).`);
});

// 2. Gestion des commandes
client.on('message', async (message) => {
    const prefix = '.';
    if (!message.body.startsWith(prefix)) return;

    const args = message.body.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    if (command === 'menu') {
        await message.reply(`📜 *MENU* 📜\n\n.menu → Affiche ce menu\n.pong → Infos du bot\n.salutations → Envoie *10 fois* le message de bienvenue`);
    }
    else if (command === 'pong') {
        await message.reply(`🏓 *Présentation du bot*\n📛 Nom : ${BOT_NAME}\n🔢 Version : ${BOT_VERSION}\n👤 Créateur : ${CREATOR}`);
    }
    else if (command === 'salutations') {
        for (let i = 0; i < 10; i++) {
            await message.reply(WELCOME_MESSAGE);
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }
});

// --------------------- PAIRING CODE (jumelage) ---------------------
rl.question('📞 Entrez votre numéro au format international (ex: 33612345678 pour la France) : ', async (numero) => {
    phoneNumber = numero.trim();
    pairingRequested = true;
    rl.close();

    await client.initialize();
    
    try {
        // Demande le code de jumelage à 8 chiffres
        const code = await client.requestPairingCode(phoneNumber);
        console.log(`\n🔐 Votre CODE DE JUMELAGE (pairing code) : ${code}`);
        console.log('➡️ Ouvrez WhatsApp → Appareils connectés → Lier un appareil avec un code à 8 chiffres\n');
    } catch (err) {
        console.error('Erreur lors de la demande du pairing code :', err);
    }
});
