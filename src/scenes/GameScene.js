import Phaser from 'phaser';
import EconomicModel from '../models/EconomicModel.js';
import InterestRateSlider from '../ui/InterestRateSlider.js';
import NewsFeed from '../ui/NewsFeed.js';
import AdvisorPanel from '../ui/AdvisorPanel.js';
import PixelArtGenerator from '../utils/PixelArtGenerator.js';
import AudioManager from '../managers/AudioManager.js';
import SaveManager from '../utils/SaveManager.js';

export default class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
        this.economicModel = null;
        this.slider = null;
        this.newsFeed = null;
        this.advisorPanel = null;
        this.audioManager = null;
        this.saveManager = new SaveManager();
        this.updateTimer = 0;
        this.updateInterval = 1000;
        this.interventionAmount = 200; // Default intervention amount
        this.score = 0; // Player score
        this.winScore = 1000; // Score needed to win
        this.maxMonths = 12; // 1 year to win
        this.currentLevel = 1; // Current level
        this.highScore = 0; // High score from save
    }
    
    create() {
        // Generate pixel art assets
        PixelArtGenerator.generateTorredelSol(this);
        PixelArtGenerator.generateMountains(this);
        PixelArtGenerator.generateHolographicSun(this);
        PixelArtGenerator.generateEnergyParticle(this, 0x00ffff);
        
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // Initialize systems
        this.economicModel = new EconomicModel();
        this.economicModel.setLevel(this.currentLevel);
        this.audioManager = new AudioManager(this);
        
        // Load saved data
        const saveData = this.saveManager.load();
        this.highScore = saveData.highScore;
        console.log('📊 High score loaded:', this.highScore);
        
        // Add click listener to resume audio on first interaction
        this.input.once('pointerdown', () => {
            console.log('First click detected, resuming audio...');
            this.audioManager.resumeAudioContext();
        });
        
        // Create background
        this.createBackground();
        this.createTorredelSol(width / 2, height / 2 - 100);
        
        // Title
        this.add.text(width / 2, 30, 'GUARDIÁN DE LA ESTABILIDAD', {
            font: 'bold 24px Courier New',
            fill: '#00ffff',
            stroke: '#0a0e1a',
            strokeThickness: 4
        }).setOrigin(0.5);
        
        this.add.text(width / 2, 58, 'Banco Central de Reserva del Perú', {
            font: '14px Courier New',
            fill: '#ffd700',
            stroke: '#0a0e1a',
            strokeThickness: 2
        }).setOrigin(0.5);
        
        // Level indicator (top right)
        this.levelText = this.add.text(width / 2, 80, `NIVEL ${this.currentLevel}`, {
            font: 'bold 12px Courier New',
            fill: '#ff00ff',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);
        
        // Audio activation button
        const audioBtn = this.add.text(width / 2, 100, '🔊 CLICK PARA AUDIO', {
            font: 'bold 11px Courier New',
            fill: '#ffff00',
            backgroundColor: '#ff0000',
            padding: { x: 12, y: 6 }
        }).setOrigin(0.5);
        audioBtn.setInteractive({ useHandCursor: true });
        audioBtn.on('pointerdown', () => {
            console.log('Audio button clicked!');
            this.audioManager.resumeAudioContext();
            audioBtn.setVisible(false);
        });
        
        // UI Components - REORGANIZED TO AVOID OVERLAP
        this.newsFeed = new NewsFeed(this, width / 2, 300); // Moved up
        this.advisorPanel = new AdvisorPanel(this, width / 2, 500); // Moved up
        this.slider = new InterestRateSlider(this, width / 2, height - 50, (value) => {
            this.economicModel.setInterestRate(value);
            this.audioManager.playSliderMove();
        });
        this.slider.setValue(this.economicModel.interestRate);
        
        // Dashboard and controls - REPOSITIONED
        this.createDashboard(width - 200, 180); // Right side, lower
        this.createMacroIndicators(150, 180); // Left side, new panel
        this.createForexControls(width - 200, height - 200); // Right side, bottom
        this.createObjectivePanel(150, 480); // Left side, bottom
        
        // Keyboard controls
        this.setupKeyboardControls();
        
        // Instructions
        this.add.text(width / 2, height - 15, 'FLECHAS ← → = Tasa | Q = Comprar USD | E = Vender USD | M = Música', {
            font: '10px Courier New',
            fill: '#666666'
        }).setOrigin(0.5);
    }
    
    
    createMacroIndicators(x, y) {
        const panel = this.add.graphics();
        panel.fillStyle(0x0a0e1a, 0.95);
        panel.lineStyle(3, 0xff00ff, 1);
        panel.fillRoundedRect(x - 140, y - 50, 280, 280, 10);
        panel.strokeRoundedRect(x - 140, y - 50, 280, 280, 10);
        
        this.add.text(x, y - 20, '📊 INDICADORES MACRO', {
            font: 'bold 14px Courier New',
            fill: '#ff00ff',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);
        
        // Inflation SAE (Core inflation)
        this.add.text(x - 120, y + 10, '📌 INFLACIÓN SAE:', {
            font: 'bold 11px Courier New',
            fill: '#ffd700'
        });
        this.inflationSAEText = this.add.text(x + 80, y + 10, '3.5%', {
            font: 'bold 13px Courier New',
            fill: '#00ff00'
        });
        
        // Output Gap (Brecha de producto)
        this.add.text(x - 120, y + 35, '📈 BRECHA PRODUCTO:', {
            font: 'bold 11px Courier New',
            fill: '#ffd700'
        });
        this.outputGapText = this.add.text(x + 80, y + 35, '-2.5pp', {
            font: 'bold 13px Courier New',
            fill: '#ff0000'
        });
        
        // FED Rate
        this.add.text(x - 120, y + 60, '🇺🇸 TASA FED:', {
            font: 'bold 11px Courier New',
            fill: '#ffd700'
        });
        this.fedRateText = this.add.text(x + 80, y + 60, '4.50%', {
            font: 'bold 13px Courier New',
            fill: '#00ffff'
        });
        
        // Expectations
        this.add.text(x - 120, y + 85, '🔮 EXPECTATIVAS:', {
            font: 'bold 11px Courier New',
            fill: '#ffd700'
        });
        this.expectationsText = this.add.text(x + 80, y + 85, '3.5%', {
            font: 'bold 13px Courier New',
            fill: '#ffff00'
        });
        
        // Potential GDP
        this.add.text(x - 120, y + 110, '⚡ PBI POTENCIAL:', {
            font: 'bold 11px Courier New',
            fill: '#ffd700'
        });
        this.potentialGDPText = this.add.text(x + 80, y + 110, '3.0%', {
            font: 'bold 13px Courier New',
            fill: '#888888'
        });
        
        // Separator
        const separator = this.add.graphics();
        separator.lineStyle(2, 0xff00ff, 0.5);
        separator.lineBetween(x - 120, y + 130, x + 120, y + 130);
        
        // Info text
        this.add.text(x, y + 150, 'CONTEXTO ECONÓMICO', {
            font: 'bold 11px Courier New',
            fill: '#888888'
        }).setOrigin(0.5);
        
        this.add.text(x, y + 170, 'SAE = Sin Alimentos y Energía', {
            font: '9px Courier New',
            fill: '#666666'
        }).setOrigin(0.5);
        
        this.add.text(x, y + 185, 'Brecha = PBI real - PBI potencial', {
            font: '9px Courier New',
            fill: '#666666'
        }).setOrigin(0.5);
        
        this.add.text(x, y + 200, 'FED = Tasa de referencia EE.UU.', {
            font: '9px Courier New',
            fill: '#666666'
        }).setOrigin(0.5);
    }
    
    createObjectivePanel(x, y) {
        const panel = this.add.graphics();
        panel.fillStyle(0x0a0e1a, 0.95);
        panel.lineStyle(3, 0xffd700, 1);
        panel.fillRoundedRect(x - 140, y - 50, 280, 220, 10);
        panel.strokeRoundedRect(x - 140, y - 50, 280, 220, 10);
        
        this.add.text(x, y - 20, '🎯 OBJETIVO', {
            font: 'bold 16px Courier New',
            fill: '#ffd700',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);
        
        // Time limit
        this.timeText = this.add.text(x, y + 5, `⏰ Tiempo: 0/${this.maxMonths} meses`, {
            font: 'bold 12px Courier New',
            fill: '#ffffff'
        }).setOrigin(0.5);
        
        this.add.text(x, y + 25, 'Mantén la economía estable', {
            font: '11px Courier New',
            fill: '#888888'
        }).setOrigin(0.5);
        
        // Goals with checkmarks that update
        this.goalInflation = this.add.text(x - 120, y + 50, '✗ Inflación: 1% - 3%', {
            font: '10px Courier New',
            fill: '#ff0000'
        });
        
        this.goalExchange = this.add.text(x - 120, y + 68, '✗ Tipo cambio: S/ 3.60 - 3.90', {
            font: '10px Courier New',
            fill: '#ff0000'
        });
        
        this.goalReserves = this.add.text(x - 120, y + 86, '✗ Reservas: > $60B', {
            font: '10px Courier New',
            fill: '#ff0000'
        });
        
        this.goalCredibility = this.add.text(x - 120, y + 104, '✗ Credibilidad: > 80%', {
            font: '10px Courier New',
            fill: '#ff0000'
        });
        
        this.goalGDP = this.add.text(x - 120, y + 122, '✗ PBI: Crecimiento positivo', {
            font: '10px Courier New',
            fill: '#ff0000'
        });
        
        // Score
        this.scoreText = this.add.text(x, y + 150, '0 pts', {
            font: 'bold 20px Courier New',
            fill: '#00ffff'
        }).setOrigin(0.5);
        
        // High score (smaller)
        this.highScoreText = this.add.text(x + 100, y + 150, `Récord: ${this.highScore}`, {
            font: '10px Courier New',
            fill: '#ffd700'
        }).setOrigin(0.5);
    }
    
    setupKeyboardControls() {
        this.input.keyboard.on('keydown-LEFT', () => {
            this.slider.adjustValue(-0.25);
            this.audioManager.resumeAudioContext();
        });
        this.input.keyboard.on('keydown-RIGHT', () => {
            this.slider.adjustValue(0.25);
            this.audioManager.resumeAudioContext();
        });
        this.input.keyboard.on('keydown-Q', () => {
            this.audioManager.resumeAudioContext();
            this.buyDollars();
        });
        this.input.keyboard.on('keydown-E', () => {
            this.audioManager.resumeAudioContext();
            this.sellDollars();
        });
        this.input.keyboard.on('keydown-M', () => {
            this.audioManager.resumeAudioContext();
            const enabled = this.audioManager.toggleMusic();
            this.showNotification(enabled ? '🎵 Música activada' : '🔇 Música desactivada');
        });
    }
    
    createBackground() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        const bg = this.add.graphics();
        bg.fillGradientStyle(0x0a0e1a, 0x0a0e1a, 0x1a1e2a, 0x1a1e2a, 1);
        bg.fillRect(0, 0, width, height);
        
        const mountains = this.add.image(width / 2, height - 200, 'mountains-bg');
        mountains.setOrigin(0.5, 1);
        mountains.setAlpha(0.8);
        
        const grid = this.add.graphics();
        grid.lineStyle(1, 0x00ffff, 0.05);
        for (let i = 0; i < width; i += 60) grid.lineBetween(i, 0, i, height);
        for (let i = 0; i < height; i += 60) grid.lineBetween(0, i, width, i);
        
        for (let i = 0; i < 80; i++) {
            const size = Math.floor(Math.random() * 2) + 1;
            const star = this.add.rectangle(
                Math.random() * width,
                Math.random() * height * 0.5,
                size * 2, size * 2,
                0xffffff,
                Math.random() * 0.8
            );
            this.tweens.add({
                targets: star,
                alpha: Math.random() * 0.3,
                duration: 1000 + Math.random() * 2000,
                yoyo: true,
                repeat: -1
            });
        }
    }
    
    createTorredelSol(x, y) {
        const tower = this.add.image(x, y, 'torre-del-sol');
        tower.setScale(2);
        
        const glow = this.add.circle(x, y, 150, 0x00ffff, 0.05);
        this.tweens.add({
            targets: glow,
            scaleX: 1.2,
            scaleY: 1.2,
            alpha: 0.1,
            duration: 3000,
            yoyo: true,
            repeat: -1
        });
        
        const sun = this.add.image(x, y - 200, 'holographic-sun');
        sun.setScale(1.5);
        sun.setAlpha(0.6);
        this.tweens.add({
            targets: sun,
            scaleX: 1.7,
            scaleY: 1.7,
            alpha: 0.8,
            angle: 360,
            duration: 20000,
            repeat: -1
        });
        
        const energyLines = this.add.graphics();
        energyLines.lineStyle(2, 0xffd700, 0.4);
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            energyLines.lineBetween(
                x + Math.cos(angle) * 80,
                y - 200 + Math.sin(angle) * 80,
                x, y - 100
            );
        }
        
        for (let i = 0; i < 15; i++) {
            const particle = this.add.image(
                x + (Math.random() - 0.5) * 200,
                y + (Math.random() - 0.5) * 200,
                'energy-particle'
            );
            particle.setScale(Math.random() * 2 + 1);
            particle.setAlpha(Math.random() * 0.6 + 0.2);
            
            this.tweens.add({
                targets: particle,
                y: particle.y + (Math.random() - 0.5) * 100,
                x: particle.x + (Math.random() - 0.5) * 50,
                alpha: 0,
                duration: 3000 + Math.random() * 2000,
                repeat: -1,
                onRepeat: () => {
                    particle.x = x + (Math.random() - 0.5) * 200;
                    particle.y = y + (Math.random() - 0.5) * 200;
                    particle.alpha = Math.random() * 0.6 + 0.2;
                }
            });
        }
    }
    
    createDashboard(x, y) {
        const panel = this.add.graphics();
        panel.fillStyle(0x0a0e1a, 0.95);
        panel.lineStyle(3, 0x00ffff, 1);
        panel.fillRoundedRect(x - 180, y - 50, 360, 280, 10);
        panel.strokeRoundedRect(x - 180, y - 50, 360, 280, 10);
        
        this.add.text(x, y - 20, 'PANEL DE CONTROL BCRP', {
            font: 'bold 14px Courier New',
            fill: '#00ffff',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);
        
        // Month
        this.monthText = this.add.text(x, y + 5, 'Mes: 0', {
            font: '12px Courier New',
            fill: '#ffffff'
        }).setOrigin(0.5);
        
        // Exchange Rate (TIPO DE CAMBIO)
        this.add.text(x - 150, y + 35, '💱 TIPO DE CAMBIO:', {
            font: 'bold 12px Courier New',
            fill: '#ffd700'
        });
        this.exchangeRateText = this.add.text(x + 80, y + 35, 'S/ 3.75', {
            font: 'bold 14px Courier New',
            fill: '#00ff00'
        });
        
        // Reserves (RESERVAS)
        this.add.text(x - 150, y + 60, '💰 RESERVAS (RIN):', {
            font: 'bold 12px Courier New',
            fill: '#ffd700'
        });
        this.reservesText = this.add.text(x + 80, y + 60, '$74,200M', {
            font: 'bold 14px Courier New',
            fill: '#00ff00'
        });
        
        // GDP Growth
        this.add.text(x - 150, y + 85, '📈 CRECIMIENTO PBI:', {
            font: 'bold 12px Courier New',
            fill: '#ffd700'
        });
        this.gdpText = this.add.text(x + 80, y + 85, '2.1%', {
            font: 'bold 14px Courier New',
            fill: '#00ff00'
        });
        
        // Credibility
        this.add.text(x - 150, y + 110, '⭐ CREDIBILIDAD:', {
            font: 'bold 12px Courier New',
            fill: '#ffd700'
        });
        this.credibilityText = this.add.text(x + 80, y + 110, '100%', {
            font: 'bold 14px Courier New',
            fill: '#00ff00'
        });
        
        // Economic Health Bar
        this.add.text(x, y + 145, 'SALUD ECONÓMICA', {
            font: 'bold 12px Courier New',
            fill: '#ffd700',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);
        
        this.healthBarBg = this.add.graphics();
        this.healthBarBg.fillStyle(0x333333, 1);
        this.healthBarBg.fillRect(x - 150, y + 165, 300, 18);
        
        this.healthBar = this.add.graphics();
        
        // Status
        this.statusText = this.add.text(x, y + 200, 'ESTABLE ✓', {
            font: 'bold 16px Courier New',
            fill: '#00ff00',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);
    }
    
    createForexControls(x, y) {
        const panel = this.add.graphics();
        panel.fillStyle(0x0a0e1a, 0.95);
        panel.lineStyle(3, 0xffd700, 1);
        panel.fillRoundedRect(x - 180, y - 70, 360, 160, 10);
        panel.strokeRoundedRect(x - 180, y - 70, 360, 160, 10);
        
        this.add.text(x, y - 45, 'INTERVENCIÓN CAMBIARIA', {
            font: 'bold 14px Courier New',
            fill: '#ffd700',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);
        
        // Amount slider
        this.add.text(x, y - 20, 'Monto (millones USD):', {
            font: '11px Courier New',
            fill: '#ffffff'
        }).setOrigin(0.5);
        
        this.interventionAmountText = this.add.text(x, y, `$${this.interventionAmount}M`, {
            font: 'bold 14px Courier New',
            fill: '#00ffff'
        }).setOrigin(0.5);
        
        // Amount slider (50M to 1000M)
        const sliderBg = this.add.graphics();
        sliderBg.fillStyle(0x333333, 1);
        sliderBg.fillRect(x - 150, y + 15, 300, 8);
        
        const sliderHandle = this.add.circle(x - 150 + ((this.interventionAmount - 50) / 950) * 300, y + 19, 10, 0x00ffff);
        sliderHandle.setInteractive({ draggable: true, useHandCursor: true });
        
        sliderHandle.on('drag', (pointer, dragX) => {
            const clampedX = Math.max(x - 150, Math.min(x + 150, dragX));
            sliderHandle.x = clampedX;
            
            const percent = (clampedX - (x - 150)) / 300;
            this.interventionAmount = Math.round(50 + percent * 950);
            this.interventionAmountText.setText(`$${this.interventionAmount}M`);
            this.economicModel.setInterventionAmount(this.interventionAmount);
        });
        
        // Buy USD button
        const buyBtn = this.add.text(x - 80, y + 45, '🔴 COMPRAR USD (Q)', {
            font: 'bold 12px Courier New',
            fill: '#ff0000',
            stroke: '#000000',
            strokeThickness: 2,
            backgroundColor: '#330000',
            padding: { x: 10, y: 5 }
        }).setOrigin(0.5);
        buyBtn.setInteractive({ useHandCursor: true });
        buyBtn.on('pointerdown', () => this.buyDollars());
        
        // Sell USD button
        const sellBtn = this.add.text(x + 80, y + 45, '🟢 VENDER USD (E)', {
            font: 'bold 12px Courier New',
            fill: '#00ff00',
            stroke: '#000000',
            strokeThickness: 2,
            backgroundColor: '#003300',
            padding: { x: 10, y: 5 }
        }).setOrigin(0.5);
        sellBtn.setInteractive({ useHandCursor: true });
        sellBtn.on('pointerdown', () => this.sellDollars());
        
        this.interventionStatus = this.add.text(x, y + 75, '', {
            font: '11px Courier New',
            fill: '#888888'
        }).setOrigin(0.5);
    }
    
    buyDollars() {
        const result = this.economicModel.interveneForex('buy', this.interventionAmount);
        if (result.success) {
            this.audioManager.playIntervention('buy');
            this.showNotification(`💵 Comprando $${result.amount}M USD - Sol se debilita`);
        } else {
            this.audioManager.playAlert();
            this.showNotification('⚠️ ' + result.message);
        }
    }
    
    sellDollars() {
        const result = this.economicModel.interveneForex('sell', this.interventionAmount);
        if (result.success) {
            this.audioManager.playIntervention('sell');
            this.showNotification(`💰 Vendiendo $${result.amount}M USD - Sol se fortalece`);
        } else {
            this.audioManager.playAlert();
            this.showNotification('⚠️ ' + result.message);
        }
    }
    
    showNotification(text) {
        const notif = this.add.text(640, 100, text, {
            font: 'bold 16px Courier New',
            fill: '#ffffff',
            backgroundColor: '#000000',
            padding: { x: 15, y: 10 }
        }).setOrigin(0.5);
        
        this.tweens.add({
            targets: notif,
            y: 80,
            alpha: 0,
            duration: 2000,
            onComplete: () => notif.destroy()
        });
    }
    
    update(time, delta) {
        this.updateTimer += delta;
        
        if (this.updateTimer >= this.updateInterval) {
            this.updateTimer = 0;
            this.economicModel.update(1);
            
            const state = this.economicModel.getState();
            
            // Update UI
            this.newsFeed.update(state.news, state.inflation, state.inTarget);
            this.advisorPanel.update(state);
            this.monthText.setText(`Mes: ${state.month}`);
            
            // Update time limit
            this.timeText.setText(`⏰ Tiempo: ${state.month}/${this.maxMonths} meses`);
            if (state.month >= this.maxMonths) {
                // Time's up! Check if won
                if (this.score >= this.winScore) {
                    this.showVictory();
                } else {
                    this.showGameOver('Se acabó el tiempo');
                }
                return;
            }
            
            // Update macro indicators
            this.inflationSAEText.setText(`${state.inflationSAE.toFixed(1)}%`);
            this.inflationSAEText.setColor(state.inflationSAE >= 1 && state.inflationSAE <= 3 ? '#00ff00' : '#ffff00');
            
            const gapColor = Math.abs(state.outputGap) < 1 ? '#00ff00' : Math.abs(state.outputGap) < 2 ? '#ffff00' : '#ff0000';
            this.outputGapText.setText(`${state.outputGap > 0 ? '+' : ''}${state.outputGap.toFixed(1)}pp`);
            this.outputGapText.setColor(gapColor);
            
            this.fedRateText.setText(`${state.fedRate.toFixed(2)}%`);
            
            this.expectationsText.setText(`${state.expectations.toFixed(1)}%`);
            this.expectationsText.setColor(state.expectations >= 1 && state.expectations <= 3 ? '#00ff00' : '#ffff00');
            
            this.potentialGDPText.setText(`${state.potentialGDP.toFixed(1)}%`);
            
            // Exchange rate with color coding
            const exColor = state.exchangeRateStable ? '#00ff00' : '#ff00ff';
            this.exchangeRateText.setText(`S/ ${state.exchangeRate.toFixed(3)}`);
            this.exchangeRateText.setColor(exColor);
            
            // Reserves with color coding
            const resColor = state.reserves > 60000 ? '#00ff00' : state.reserves > 40000 ? '#ffff00' : '#ff0000';
            this.reservesText.setText(`$${(state.reserves / 1000).toFixed(1)}B`);
            this.reservesText.setColor(resColor);
            
            // GDP
            const gdpColor = state.gdpGrowth > 0 ? '#00ff00' : '#ff0000';
            this.gdpText.setText(`${state.gdpGrowth > 0 ? '+' : ''}${state.gdpGrowth.toFixed(1)}%`);
            this.gdpText.setColor(gdpColor);
            
            // Credibility
            const credColor = state.credibility > 80 ? '#00ff00' : state.credibility > 50 ? '#ffff00' : '#ff0000';
            this.credibilityText.setText(`${Math.floor(state.credibility)}%`);
            this.credibilityText.setColor(credColor);
            
            // Health bar
            this.healthBar.clear();
            const healthColor = state.economicHealth > 70 ? 0x00ff00 : state.economicHealth > 40 ? 0xffff00 : 0xff0000;
            this.healthBar.fillStyle(healthColor, 1);
            this.healthBar.fillRect(1080 - 150, 345, (state.economicHealth / 100) * 300, 20);
            
            // Status
            if (state.economicHealth > 70) {
                this.statusText.setText('ECONOMÍA ESTABLE ✓');
                this.statusText.setColor('#00ff00');
            } else if (state.economicHealth > 40) {
                this.statusText.setText('ALERTA MODERADA ⚠');
                this.statusText.setColor('#ffff00');
            } else {
                this.statusText.setText('CRISIS ECONÓMICA ⚠⚠⚠');
                this.statusText.setColor('#ff0000');
                this.audioManager.playAlert();
            }
            
            // Intervention status
            if (state.canIntervene) {
                this.interventionStatus.setText('Listo para intervenir');
                this.interventionStatus.setColor('#00ff00');
            } else {
                this.interventionStatus.setText('Cooldown activo...');
                this.interventionStatus.setColor('#ff0000');
            }
            
            // Update score - STRICT SCORING SYSTEM
            // Check all conditions
            const inflationOK = state.inTarget; // 1-3%
            const exchangeRateOK = state.exchangeRateStable; // 3.60-3.90
            const reservesOK = state.reserves > 60000; // > 60B
            const credibilityOK = state.credibility > 80; // > 80%
            const gdpOK = state.gdpGrowth > 0; // Positive growth
            
            // Count how many conditions are met
            const conditionsMet = [inflationOK, exchangeRateOK, reservesOK, credibilityOK, gdpOK].filter(x => x).length;
            
            // Scoring system
            if (conditionsMet === 5) {
                // Perfect! All conditions met
                this.score += 10;
            } else if (conditionsMet === 4) {
                // Good, but not perfect
                this.score += 3;
            } else if (conditionsMet === 3) {
                // Neutral - no points gained or lost
                this.score += 0;
            } else if (conditionsMet === 2) {
                // Bad - losing control
                this.score -= 3;
            } else if (conditionsMet <= 1) {
                // Crisis - heavy penalty
                this.score -= 10;
            }
            
            // Additional penalties for extreme situations
            if (state.inflation > 8) {
                this.score -= 15; // Hyperinflation penalty
            } else if (state.inflation < 0.5) {
                this.score -= 10; // Deflation penalty
            }
            
            if (state.reserves < 40000) {
                this.score -= 10; // Reserves critically low
            }
            
            if (state.credibility < 50) {
                this.score -= 10; // Lost credibility
            }
            
            // Additional penalties for extreme situations
            if (state.inflation > 8) {
                this.score -= 15; // Hyperinflation penalty
            } else if (state.inflation < 0.5) {
                this.score -= 10; // Deflation penalty
            }
            
            if (state.reserves < 40000) {
                this.score -= 10; // Reserves critically low
            }
            
            if (state.credibility < 50) {
                this.score -= 10; // Lost credibility
            }
            
            this.score = Math.max(0, this.score); // Can't go below 0
            this.scoreText.setText(`${this.score} pts`);
            this.levelText.setText(`NIVEL ${this.currentLevel}`);
            
            // Update high score in real-time
            if (this.score > this.highScore) {
                this.highScore = this.score;
                this.highScoreText.setText(`${this.highScore} pts`);
                this.highScoreText.setColor('#00ff00'); // Green when beating record
                
                // Save immediately when beating high score
                this.saveManager.updateHighScore(this.score, this.currentLevel);
            }
            
            // Update goal checkmarks
            this.goalInflation.setText(inflationOK ? '✓ Inflación: 1% - 3%' : '✗ Inflación: 1% - 3%');
            this.goalInflation.setColor(inflationOK ? '#00ff00' : '#ff0000');
            
            this.goalExchange.setText(exchangeRateOK ? '✓ Tipo cambio: S/ 3.60 - 3.90' : '✗ Tipo cambio: S/ 3.60 - 3.90');
            this.goalExchange.setColor(exchangeRateOK ? '#00ff00' : '#ff0000');
            
            this.goalReserves.setText(reservesOK ? '✓ Reservas: > $60B' : '✗ Reservas: > $60B');
            this.goalReserves.setColor(reservesOK ? '#00ff00' : '#ff0000');
            
            this.goalCredibility.setText(credibilityOK ? '✓ Credibilidad: > 80%' : '✗ Credibilidad: > 80%');
            this.goalCredibility.setColor(credibilityOK ? '#00ff00' : '#ff0000');
            
            this.goalGDP.setText(gdpOK ? '✓ PBI: Crecimiento positivo' : '✗ PBI: Crecimiento positivo');
            this.goalGDP.setColor(gdpOK ? '#00ff00' : '#ff0000');
            
            // Check win condition
            if (this.score >= this.winScore) {
                this.showVictory();
            }
            
            // Update music based on state (force update every time)
            this.audioManager.updateMusicState(state);
        }
    }
    
    showVictory() {
        // Save progress
        this.saveManager.updateHighScore(this.score, this.currentLevel);
        this.saveManager.incrementGamesPlayed();
        
        // Pause game
        this.scene.pause();
        
        // Victory overlay
        const overlay = this.add.graphics();
        overlay.fillStyle(0x000000, 0.8);
        overlay.fillRect(0, 0, 1280, 720);
        overlay.setDepth(1000);
        
        const victoryText = this.add.text(640, 250, '🎉 ¡NIVEL COMPLETADO! 🎉', {
            font: 'bold 48px Courier New',
            fill: '#ffd700',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5);
        victoryText.setDepth(1001);
        
        const subText = this.add.text(640, 320, `Has mantenido la economía estable\nPuntuación: ${this.score} puntos\nNivel: ${this.currentLevel}`, {
            font: 'bold 20px Courier New',
            fill: '#ffffff',
            align: 'center',
            lineSpacing: 10
        }).setOrigin(0.5);
        subText.setDepth(1001);
        
        const nextLevelBtn = this.add.text(640, 420, `🚀 NIVEL ${this.currentLevel + 1} (Más Difícil)`, {
            font: 'bold 18px Courier New',
            fill: '#00ff00',
            backgroundColor: '#003300',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5);
        nextLevelBtn.setDepth(1001);
        nextLevelBtn.setInteractive({ useHandCursor: true });
        nextLevelBtn.on('pointerdown', () => {
            this.currentLevel++;
            this.score = 0;
            this.economicModel.reset();
            this.economicModel.setLevel(this.currentLevel);
            overlay.destroy();
            victoryText.destroy();
            subText.destroy();
            nextLevelBtn.destroy();
            restartBtn.destroy();
            this.scene.resume();
        });
        
        const restartBtn = this.add.text(640, 480, '🔄 REINICIAR NIVEL 1', {
            font: 'bold 16px Courier New',
            fill: '#ffff00',
            backgroundColor: '#333300',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5);
        restartBtn.setDepth(1001);
        restartBtn.setInteractive({ useHandCursor: true });
        restartBtn.on('pointerdown', () => {
            this.currentLevel = 1;
            this.score = 0;
            this.economicModel.reset();
            this.economicModel.setLevel(1);
            overlay.destroy();
            victoryText.destroy();
            subText.destroy();
            nextLevelBtn.destroy();
            restartBtn.destroy();
            this.scene.resume();
        });
        
        this.audioManager.playSuccess();
    }
    
    showGameOver(reason) {
        // Save progress
        this.saveManager.incrementGamesPlayed();
        
        // Pause game
        this.scene.pause();
        
        // Game over overlay
        const overlay = this.add.graphics();
        overlay.fillStyle(0x000000, 0.9);
        overlay.fillRect(0, 0, 1280, 720);
        overlay.setDepth(1000);
        
        const gameOverText = this.add.text(640, 250, '⏰ TIEMPO AGOTADO', {
            font: 'bold 48px Courier New',
            fill: '#ff0000',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5);
        gameOverText.setDepth(1001);
        
        const subText = this.add.text(640, 320, `${reason}\nPuntuación final: ${this.score} / ${this.winScore} puntos\nNivel: ${this.currentLevel}`, {
            font: 'bold 20px Courier New',
            fill: '#ffffff',
            align: 'center',
            lineSpacing: 10
        }).setOrigin(0.5);
        subText.setDepth(1001);
        
        const retryBtn = this.add.text(640, 420, '🔄 INTENTAR DE NUEVO', {
            font: 'bold 18px Courier New',
            fill: '#ffff00',
            backgroundColor: '#333300',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5);
        retryBtn.setDepth(1001);
        retryBtn.setInteractive({ useHandCursor: true });
        retryBtn.on('pointerdown', () => {
            this.score = 0;
            this.economicModel.reset();
            this.economicModel.setLevel(this.currentLevel);
            overlay.destroy();
            gameOverText.destroy();
            subText.destroy();
            retryBtn.destroy();
            restartBtn.destroy();
            this.scene.resume();
        });
        
        const restartBtn = this.add.text(640, 480, '🏠 VOLVER A NIVEL 1', {
            font: 'bold 16px Courier New',
            fill: '#888888',
            backgroundColor: '#222222',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5);
        restartBtn.setDepth(1001);
        restartBtn.setInteractive({ useHandCursor: true });
        restartBtn.on('pointerdown', () => {
            this.currentLevel = 1;
            this.score = 0;
            this.economicModel.reset();
            this.economicModel.setLevel(1);
            overlay.destroy();
            gameOverText.destroy();
            subText.destroy();
            retryBtn.destroy();
            restartBtn.destroy();
            this.scene.resume();
        });
        
        this.audioManager.playAlert();
    }

}
