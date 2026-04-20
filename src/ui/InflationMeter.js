import Phaser from 'phaser';

export default class InflationMeter {
    constructor(scene, x, y) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        
        this.minValue = 0;
        this.maxValue = 10;
        this.currentValue = 2.5;
        this.targetMin = 1.0;
        this.targetMax = 3.0;
        this.meterHeight = 400;
        this.inTarget = true;
        
        this.create();
    }
    
    create() {
        // Panel background with pixel art border
        const panel = this.scene.add.graphics();
        panel.fillStyle(0x0a0e1a, 0.95);
        panel.lineStyle(3, 0x00ffff, 1);
        
        // Draw pixel art style border
        const borderPixelSize = 4;
        for (let i = 0; i < 200; i += borderPixelSize) {
            // Top border
            panel.fillRect(this.x - 100 + i, this.y - 250, borderPixelSize, borderPixelSize);
            // Bottom border
            panel.fillRect(this.x - 100 + i, this.y + 246, borderPixelSize, borderPixelSize);
        }
        for (let i = 0; i < 500; i += borderPixelSize) {
            // Left border
            panel.fillRect(this.x - 100, this.y - 250 + i, borderPixelSize, borderPixelSize);
            // Right border
            panel.fillRect(this.x + 96, this.y - 250 + i, borderPixelSize, borderPixelSize);
        }
        
        panel.fillRoundedRect(this.x - 100, this.y - 250, 200, 500, 10);
        
        // Title with pixel art font style
        this.scene.add.text(this.x, this.y - 220, 'CANAL DE ENERGÍA', {
            font: 'bold 14px Courier New',
            fill: '#00ffff',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);
        
        this.scene.add.text(this.x, this.y - 200, '(Inflación Interna)', {
            font: '12px Courier New',
            fill: '#00ccff'
        }).setOrigin(0.5);
        
        // Meter container with pixel art style
        const meterX = this.x;
        const meterY = this.y - 150;
        
        // Meter background - pixel art style
        this.meterBg = this.scene.add.graphics();
        this.meterBg.fillStyle(0x1a1a2a, 1);
        this.meterBg.lineStyle(2, 0x00ffff, 0.5);
        this.meterBg.fillRect(meterX - 30, meterY, 60, this.meterHeight);
        this.meterBg.strokeRect(meterX - 30, meterY, 60, this.meterHeight);
        
        // Add pixel art grid inside meter
        const gridGraphics = this.scene.add.graphics();
        gridGraphics.lineStyle(1, 0x00ffff, 0.1);
        for (let i = 0; i < this.meterHeight; i += 20) {
            gridGraphics.lineBetween(meterX - 30, meterY + i, meterX + 30, meterY + i);
        }
        
        // Target range indicator with pixel art style
        const targetStartY = meterY + this.meterHeight - (this.targetMin / this.maxValue) * this.meterHeight;
        const targetEndY = meterY + this.meterHeight - (this.targetMax / this.maxValue) * this.meterHeight;
        const targetHeight = targetStartY - targetEndY;
        
        this.targetZone = this.scene.add.graphics();
        this.targetZone.fillStyle(0x00ff00, 0.15);
        this.targetZone.lineStyle(2, 0x00ff00, 0.8);
        this.targetZone.fillRect(meterX - 30, targetEndY, 60, targetHeight);
        this.targetZone.strokeRect(meterX - 30, targetEndY, 60, targetHeight);
        
        // Target range labels with better styling
        this.scene.add.text(meterX + 40, targetEndY, `${this.targetMax}%`, {
            font: 'bold 12px Courier New',
            fill: '#00ff00',
            stroke: '#000000',
            strokeThickness: 2
        });
        
        this.scene.add.text(meterX + 40, targetStartY, `${this.targetMin}%`, {
            font: 'bold 12px Courier New',
            fill: '#00ff00',
            stroke: '#000000',
            strokeThickness: 2
        });
        
        // Meter fill (energy flow) - will be drawn in update
        this.meterFill = this.scene.add.graphics();
        
        // Energy flow particles - pixel art style
        this.particles = [];
        for (let i = 0; i < 30; i++) {
            const particle = this.scene.add.rectangle(
                meterX + (Math.random() - 0.5) * 50,
                meterY + Math.random() * this.meterHeight,
                3,
                3,
                0x00ffff,
                0.9
            );
            this.particles.push(particle);
            
            this.scene.tweens.add({
                targets: particle,
                y: meterY + this.meterHeight + 20,
                alpha: 0,
                duration: 1500 + Math.random() * 1000,
                repeat: -1,
                onRepeat: () => {
                    particle.y = meterY - 20;
                    particle.alpha = 0.9;
                    particle.x = meterX + (Math.random() - 0.5) * 50;
                }
            });
        }
        
        // Current value indicator - pixel art arrow
        this.valueIndicator = this.scene.add.graphics();
        
        // Value text with better styling
        this.valueText = this.scene.add.text(this.x, this.y + 180, '', {
            font: 'bold 28px Courier New',
            fill: '#00ffff',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);
        
        // Status text with better styling
        this.statusText = this.scene.add.text(this.x, this.y + 215, '', {
            font: 'bold 14px Courier New',
            fill: '#00ff00',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);
        
        // Glow effect
        this.glow = this.scene.add.circle(meterX, meterY + this.meterHeight / 2, 90, 0x00ffff, 0);
        this.glowTween = this.scene.tweens.add({
            targets: this.glow,
            alpha: 0.2,
            scaleX: 1.3,
            scaleY: 1.3,
            duration: 1500,
            yoyo: true,
            repeat: -1,
            paused: true
        });
        
        // Initial update
        this.updateMeter();
    }
    
    update(value, inTarget) {
        this.currentValue = value;
        this.inTarget = inTarget;
        this.updateMeter();
    }
    
    updateMeter() {
        const meterX = this.x;
        const meterY = this.y - 150;
        
        // Calculate fill height
        const percent = Math.min(this.currentValue / this.maxValue, 1);
        const fillHeight = this.meterHeight * percent;
        const fillY = meterY + this.meterHeight - fillHeight;
        
        // Update fill color based on target range
        this.meterFill.clear();
        let fillColor;
        if (this.inTarget) {
            fillColor = 0x00ffff; // Cyan for in-range
            this.glow.setFillStyle(0x00ffff, 0.3);
            if (this.glowTween.paused) {
                this.glowTween.resume();
            }
        } else {
            fillColor = 0xff00ff; // Pink for out-of-range
            this.glow.setFillStyle(0xff00ff, 0.3);
            if (this.glowTween.paused) {
                this.glowTween.resume();
            }
        }
        
        this.meterFill.fillStyle(fillColor, 0.7);
        this.meterFill.fillRoundedRect(meterX - 25, fillY, 50, fillHeight, 5);
        
        // Update value indicator (horizontal line)
        this.valueIndicator.clear();
        this.valueIndicator.lineStyle(3, fillColor, 1);
        this.valueIndicator.lineBetween(meterX - 35, fillY, meterX + 35, fillY);
        
        // Update particle colors
        this.particles.forEach(particle => {
            particle.setFillStyle(fillColor, 0.8);
        });
        
        // Update glow position
        this.glow.y = fillY + fillHeight / 2;
        
        // Update text
        this.valueText.setText(`${this.currentValue.toFixed(2)}%`);
        this.valueText.setColor(this.inTarget ? '#00ffff' : '#ff00ff');
        
        if (this.inTarget) {
            this.statusText.setText('EN RANGO META ✓');
            this.statusText.setColor('#00ff00');
        } else if (this.currentValue < this.targetMin) {
            this.statusText.setText('INFLACIÓN BAJA ⚠');
            this.statusText.setColor('#ffff00');
        } else {
            this.statusText.setText('INFLACIÓN ALTA ⚠');
            this.statusText.setColor('#ff0000');
        }
    }
}
