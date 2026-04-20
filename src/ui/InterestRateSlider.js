import Phaser from 'phaser';

export default class InterestRateSlider {
    constructor(scene, x, y, onChange) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.onChange = onChange;
        
        this.minValue = 0;
        this.maxValue = 15;
        this.currentValue = 6.75;
        this.sliderWidth = 400;
        this.isDragging = false;
        
        this.create();
    }
    
    create() {
        // Panel background with pixel art border
        const panel = this.scene.add.graphics();
        panel.fillStyle(0x0a0e1a, 0.95);
        panel.lineStyle(3, 0xff00ff, 1);
        
        // Draw pixel art style border
        const borderPixelSize = 4;
        for (let i = 0; i < 500; i += borderPixelSize) {
            // Top border
            panel.fillRect(this.x - 250 + i, this.y - 60, borderPixelSize, borderPixelSize);
            // Bottom border
            panel.fillRect(this.x - 250 + i, this.y + 56, borderPixelSize, borderPixelSize);
        }
        for (let i = 0; i < 120; i += borderPixelSize) {
            // Left border
            panel.fillRect(this.x - 250, this.y - 60 + i, borderPixelSize, borderPixelSize);
            // Right border
            panel.fillRect(this.x + 246, this.y - 60 + i, borderPixelSize, borderPixelSize);
        }
        
        panel.fillRoundedRect(this.x - 250, this.y - 60, 500, 120, 10);
        
        // Title with better styling
        this.scene.add.text(this.x, this.y - 35, 'TASA DE INTERFERENCIA', {
            font: 'bold 18px Courier New',
            fill: '#ff00ff',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);
        
        // Slider track with pixel art style
        this.track = this.scene.add.graphics();
        this.track.fillStyle(0x2a2a3a, 1);
        this.track.lineStyle(2, 0xff00ff, 0.5);
        this.track.fillRect(this.x - this.sliderWidth / 2, this.y - 2, this.sliderWidth, 12);
        this.track.strokeRect(this.x - this.sliderWidth / 2, this.y - 2, this.sliderWidth, 12);
        
        // Add tick marks
        const tickGraphics = this.scene.add.graphics();
        tickGraphics.lineStyle(2, 0xff00ff, 0.3);
        for (let i = 0; i <= 10; i++) {
            const tickX = this.x - this.sliderWidth / 2 + (this.sliderWidth / 10) * i;
            tickGraphics.lineBetween(tickX, this.y - 8, tickX, this.y + 16);
        }
        
        // Slider fill (shows current value) with gradient effect
        this.fill = this.scene.add.graphics();
        this.updateFill();
        
        // Slider handle - pixel art style
        this.handle = this.scene.add.graphics();
        this.handle.fillStyle(0xff00ff, 1);
        this.handle.lineStyle(3, 0xffffff, 1);
        
        // Draw pixel art handle (diamond shape)
        const handleSize = 20;
        this.handle.fillRect(-handleSize/2, -handleSize/2, handleSize, handleSize);
        this.handle.strokeRect(-handleSize/2, -handleSize/2, handleSize, handleSize);
        
        this.handle.x = this.x - this.sliderWidth / 2;
        this.handle.y = this.y + 4;
        this.handle.setInteractive(
            new Phaser.Geom.Rectangle(-handleSize, -handleSize, handleSize * 2, handleSize * 2),
            Phaser.Geom.Rectangle.Contains
        );
        this.handle.input.draggable = true;
        this.handle.input.cursor = 'pointer';
        
        // Handle glow effect - pixel art style
        this.handleGlow = this.scene.add.graphics();
        this.handleGlow.fillStyle(0xff00ff, 0.3);
        this.handleGlow.fillRect(-30, -30, 60, 60);
        this.handleGlow.x = this.handle.x;
        this.handleGlow.y = this.handle.y;
        
        this.scene.tweens.add({
            targets: this.handleGlow,
            scaleX: 1.4,
            scaleY: 1.4,
            alpha: 0.1,
            duration: 1200,
            yoyo: true,
            repeat: -1
        });
        
        // Value display with better styling
        this.valueText = this.scene.add.text(this.x, this.y + 40, '', {
            font: 'bold 24px Courier New',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);
        
        // Min/Max labels with better styling
        this.scene.add.text(this.x - this.sliderWidth / 2, this.y + 20, `${this.minValue}%`, {
            font: 'bold 12px Courier New',
            fill: '#00ffff',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5, 0);
        
        this.scene.add.text(this.x + this.sliderWidth / 2, this.y + 20, `${this.maxValue}%`, {
            font: 'bold 12px Courier New',
            fill: '#ff0000',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5, 0);
        
        // Neutral rate indicator
        const neutralRate = 5.0;
        const neutralPercent = (neutralRate - this.minValue) / (this.maxValue - this.minValue);
        const neutralX = this.x - this.sliderWidth / 2 + this.sliderWidth * neutralPercent;
        this.scene.add.text(neutralX, this.y - 20, '⚖', {
            font: '16px Courier New',
            fill: '#ffd700'
        }).setOrigin(0.5);
        
        // Drag events
        this.scene.input.on('drag', (pointer, gameObject, dragX, dragY) => {
            if (gameObject === this.handle) {
                this.isDragging = true;
                const minX = this.x - this.sliderWidth / 2;
                const maxX = this.x + this.sliderWidth / 2;
                const clampedX = Phaser.Math.Clamp(dragX, minX, maxX);
                
                this.handle.x = clampedX;
                this.handleGlow.x = clampedX;
                
                // Calculate value
                const percent = (clampedX - minX) / this.sliderWidth;
                this.currentValue = this.minValue + percent * (this.maxValue - this.minValue);
                
                this.updateDisplay();
                this.updateFill();
                
                if (this.onChange) {
                    this.onChange(this.currentValue);
                }
            }
        });
        
        this.scene.input.on('dragend', (pointer, gameObject) => {
            if (gameObject === this.handle) {
                this.isDragging = false;
            }
        });
        
        // Initial display
        this.updateDisplay();
    }
    
    updateFill() {
        this.fill.clear();
        
        // Create gradient effect
        const percent = (this.currentValue - this.minValue) / (this.maxValue - this.minValue);
        const fillWidth = this.sliderWidth * percent;
        
        // Color based on rate level
        let fillColor;
        if (this.currentValue < 3) {
            fillColor = 0x00ffff; // Low rate - cyan
        } else if (this.currentValue < 7) {
            fillColor = 0xff00ff; // Medium rate - magenta
        } else {
            fillColor = 0xff0000; // High rate - red
        }
        
        this.fill.fillStyle(fillColor, 0.7);
        this.fill.fillRect(
            this.x - this.sliderWidth / 2,
            this.y - 2,
            fillWidth,
            12
        );
        
        // Add pixel art style segments
        this.fill.lineStyle(1, 0xffffff, 0.3);
        for (let i = 0; i < fillWidth; i += 10) {
            this.fill.lineBetween(
                this.x - this.sliderWidth / 2 + i,
                this.y - 2,
                this.x - this.sliderWidth / 2 + i,
                this.y + 10
            );
        }
    }
    
    updateDisplay() {
        this.valueText.setText(`${this.currentValue.toFixed(2)}%`);
    }
    
    setValue(value) {
        this.currentValue = Phaser.Math.Clamp(value, this.minValue, this.maxValue);
        
        const percent = (this.currentValue - this.minValue) / (this.maxValue - this.minValue);
        const newX = this.x - this.sliderWidth / 2 + percent * this.sliderWidth;
        
        this.handle.x = newX;
        this.handleGlow.x = newX;
        
        this.updateDisplay();
        this.updateFill();
    }
    
    adjustValue(delta) {
        this.setValue(this.currentValue + delta);
        if (this.onChange) {
            this.onChange(this.currentValue);
        }
    }
}
