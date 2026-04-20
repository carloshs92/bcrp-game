/**
 * NewsFeed - Displays economic news and events
 * Replaces the inflation meter with a more informative news feed
 */
export default class NewsFeed {
    constructor(scene, x, y) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.newsItems = [];
        
        this.create();
    }
    
    create() {
        // Panel background
        const panel = this.scene.add.graphics();
        panel.fillStyle(0x0a0e1a, 0.95);
        panel.lineStyle(3, 0x00ffff, 1);
        panel.fillRoundedRect(this.x - 200, this.y - 250, 400, 500, 10);
        panel.strokeRoundedRect(this.x - 200, this.y - 250, 400, 500, 10);
        
        // Title
        this.scene.add.text(this.x, this.y - 220, '📰 NOTICIAS ECONÓMICAS', {
            font: 'bold 18px Courier New',
            fill: '#00ffff',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);
        
        // Subtitle
        this.scene.add.text(this.x, this.y - 195, 'Impacto de tus decisiones', {
            font: '12px Courier New',
            fill: '#888888'
        }).setOrigin(0.5);
        
        // Inflation indicator (small, at top)
        this.scene.add.text(this.x - 180, this.y - 165, '📊 INFLACIÓN:', {
            font: 'bold 14px Courier New',
            fill: '#ffd700',
            stroke: '#000000',
            strokeThickness: 2
        });
        
        this.inflationText = this.scene.add.text(this.x + 60, this.y - 165, '2.5%', {
            font: 'bold 16px Courier New',
            fill: '#00ff00'
        });
        
        this.inflationStatus = this.scene.add.text(this.x + 100, this.y - 165, '✓ Normal', {
            font: 'bold 14px Courier New',
            fill: '#00ff00'
        });
        
        // News container
        this.newsContainer = this.scene.add.container(this.x, this.y - 130);
    }
    
    update(news, inflation, inTarget) {
        // Update inflation display with state indicator
        let inflColor = '#00ff00';
        let inflState = '✓ Normal';
        
        if (inflation > 8) {
            inflColor = '#ff0000';
            inflState = '🔥 HIPERINFLACIÓN';
        } else if (inflation > 5) {
            inflColor = '#ff8800';
            inflState = '⚠️ Inflación Alta';
        } else if (inflation < 0.5) {
            inflColor = '#00ffff';
            inflState = '❄️ Deflación';
        } else if (!inTarget) {
            inflColor = '#ffff00';
            inflState = '⚠️ Fuera de meta';
        }
        
        this.inflationText.setText(`${inflation.toFixed(1)}%`);
        this.inflationText.setColor(inflColor);
        this.inflationStatus.setText(inflState);
        this.inflationStatus.setColor(inflColor);
        
        // Clear old news
        this.newsContainer.removeAll(true);
        
        // Display news items (most recent first)
        const recentNews = news.slice(-8).reverse();
        
        recentNews.forEach((item, index) => {
            const yPos = index * 55;
            
            // Calculate age and fade
            const age = Math.floor(this.scene.economicModel.monthCounter - item.time);
            const alpha = Math.max(0.3, 1 - (age / 20)); // Fade over 20 months
            
            // News background
            const newsBg = this.scene.add.graphics();
            newsBg.fillStyle(0x1a1e2a, 0.8 * alpha);
            newsBg.lineStyle(1, this.getNewsColor(item.type), 0.5 * alpha);
            newsBg.fillRoundedRect(-190, yPos, 380, 50, 5);
            newsBg.strokeRoundedRect(-190, yPos, 380, 50, 5);
            
            // News text (larger font)
            const newsText = this.scene.add.text(-180, yPos + 10, item.text, {
                font: '13px Courier New',
                fill: '#ffffff',
                wordWrap: { width: 360 },
                lineSpacing: 2
            });
            newsText.setAlpha(alpha);
            
            // Age indicator
            const ageText = age === 0 ? 'Ahora' : age === 1 ? 'Hace 1 mes' : `Hace ${age} meses`;
            const ageLabel = this.scene.add.text(170, yPos + 35, ageText, {
                font: '9px Courier New',
                fill: '#888888'
            }).setOrigin(1, 0);
            ageLabel.setAlpha(alpha);
            
            this.newsContainer.add([newsBg, newsText, ageLabel]);
        });
        
        // If no news, show placeholder
        if (recentNews.length === 0) {
            const placeholder = this.scene.add.text(0, 100, 'Esperando noticias económicas...', {
                font: '14px Courier New',
                fill: '#666666'
            }).setOrigin(0.5);
            
            this.newsContainer.add(placeholder);
        }
    }
    
    getNewsColor(type) {
        const colors = {
            'intervention': 0x00ffff,
            'rate': 0xffd700,
            'credit': 0x00ff00,
            'savings': 0x00ff00,
            'inflation': 0xff0000,
            'exchange': 0xff00ff,
            'prices': 0xff8800,
            'gdp': 0x00ff00,
            'event-external': 0xff0000, // Red for external events
            'event-internal': 0xff8800, // Orange for internal events
            'general': 0x888888
        };
        
        return colors[type] || colors['general'];
    }
}
