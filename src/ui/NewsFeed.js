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
        // Panel background - OPTIMIZED SIZE
        const panel = this.scene.add.graphics();
        panel.fillStyle(0x0a0e1a, 0.95);
        panel.lineStyle(3, 0x00ffff, 1);
        panel.fillRoundedRect(this.x - 200, this.y - 100, 400, 260, 10);
        panel.strokeRoundedRect(this.x - 200, this.y - 100, 400, 260, 10);
        
        // Title
        this.scene.add.text(this.x, this.y - 75, '📰 NOTICIAS ECONÓMICAS', {
            font: 'bold 14px Courier New',
            fill: '#00ffff',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);
        
        // Subtitle
        this.scene.add.text(this.x, this.y - 55, 'Impacto de tus decisiones', {
            font: '10px Courier New',
            fill: '#888888'
        }).setOrigin(0.5);
        
        // Inflation indicator (small, at top)
        this.scene.add.text(this.x - 180, this.y - 35, '📊 INFLACIÓN:', {
            font: 'bold 11px Courier New',
            fill: '#ffd700'
        });
        
        this.inflationText = this.scene.add.text(this.x + 40, this.y - 35, '2.5%', {
            font: 'bold 13px Courier New',
            fill: '#00ff00'
        });
        
        this.inflationStatus = this.scene.add.text(this.x + 80, this.y - 35, '✓ Normal', {
            font: 'bold 11px Courier New',
            fill: '#00ff00'
        });
        
        // News container with clipping mask
        this.newsContainer = this.scene.add.container(this.x, this.y - 10);
        
        // Create clipping mask to prevent overflow
        const maskShape = this.scene.make.graphics();
        maskShape.fillStyle(0xffffff);
        maskShape.fillRect(this.x - 190, this.y - 10, 380, 165);
        
        const mask = maskShape.createGeometryMask();
        this.newsContainer.setMask(mask);
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
        
        // Display news items (most recent first) - DYNAMIC HEIGHT
        const recentNews = news.slice(-4).reverse();
        let currentY = 0; // Track vertical position dynamically
        
        recentNews.forEach((item, index) => {
            // Calculate age and fade (using months from item.time)
            const currentMonth = Math.floor(this.scene.economicModel.weekCounter / 4);
            const age = currentMonth - item.time;
            const alpha = Math.max(0.6, 1 - (age / 20));
            
            // Get color and icon for this news type
            const newsColor = this.getNewsColor(item.type);
            const newsIcon = this.getNewsIcon(item.type);
            
            // Create temporary text to measure height
            const tempText = this.scene.add.text(0, 0, item.text, {
                font: 'bold 11px Courier New',
                wordWrap: { width: 300 }
            });
            const textHeight = tempText.height;
            tempText.destroy();
            
            // Calculate container height (minimum 38px, grows with content)
            const containerHeight = Math.max(38, textHeight + 20);
            
            // News background with gradient effect
            const newsBg = this.scene.add.graphics();
            
            // Gradient background (darker at bottom)
            newsBg.fillGradientStyle(newsColor, newsColor, 0x0a0e1a, 0x0a0e1a, 0.15 * alpha, 0.15 * alpha, 0.05 * alpha, 0.05 * alpha);
            newsBg.fillRoundedRect(-185, currentY, 370, containerHeight, 6);
            
            // Left accent bar (colored)
            newsBg.fillStyle(newsColor, 0.8 * alpha);
            newsBg.fillRoundedRect(-185, currentY, 4, containerHeight, 2);
            
            // Subtle border
            newsBg.lineStyle(1, newsColor, 0.3 * alpha);
            newsBg.strokeRoundedRect(-185, currentY, 370, containerHeight, 6);
            
            // Icon (emoji with background circle)
            const iconBg = this.scene.add.circle(-170, currentY + 19, 12, newsColor, 0.2 * alpha);
            
            const iconText = this.scene.add.text(-170, currentY + 19, newsIcon, {
                font: '16px Courier New'
            }).setOrigin(0.5);
            iconText.setAlpha(alpha);
            
            // News text (better spacing, no age overlap)
            const newsText = this.scene.add.text(-150, currentY + 10, item.text, {
                font: 'bold 11px Courier New',
                fill: '#ffffff',
                wordWrap: { width: 300 }, // Leave space for age
                lineSpacing: 2
            });
            newsText.setAlpha(alpha);
            
            // Age badge (top right corner, no overlap)
            if (age > 0) {
                const ageText = age === 1 ? '1m' : `${age}m`;
                const ageBadge = this.scene.add.graphics();
                ageBadge.fillStyle(0x000000, 0.5 * alpha);
                ageBadge.fillRoundedRect(145, currentY + 5, 30, 14, 7);
                
                const ageLabel = this.scene.add.text(160, currentY + 12, ageText, {
                    font: '9px Courier New',
                    fill: '#888888'
                }).setOrigin(0.5);
                ageLabel.setAlpha(alpha);
                
                this.newsContainer.add([ageBadge, ageLabel]);
            } else {
                // "AHORA" badge for new news
                const nowBadge = this.scene.add.graphics();
                nowBadge.fillStyle(newsColor, 0.3 * alpha);
                nowBadge.fillRoundedRect(130, currentY + 5, 45, 14, 7);
                
                const nowLabel = this.scene.add.text(152, currentY + 12, 'AHORA', {
                    font: 'bold 9px Courier New',
                    fill: this.getColorHex(newsColor)
                }).setOrigin(0.5);
                nowLabel.setAlpha(alpha);
                
                this.newsContainer.add([nowBadge, nowLabel]);
            }
            
            this.newsContainer.add([newsBg, iconBg, iconText, newsText]);
            
            // Move to next position (add spacing between items)
            currentY += containerHeight + 4;
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
    
    
    getNewsIcon(type) {
        const icons = {
            'intervention': '💱',
            'rate': '📊',
            'credit': '🏦',
            'savings': '💰',
            'inflation': '🔥',
            'exchange': '💵',
            'prices': '📈',
            'gdp': '📊',
            'reserves': '🏦',
            'credibility': '⭐',
            'event-external': '🌍',
            'event-internal': '🏛️',
            'report': '📋',
            'fed': '🇺🇸',
            'general': '📰'
        };
        
        return icons[type] || icons['general'];
    }
    
    getColorHex(colorInt) {
        // Convert integer color to hex string for text
        const colors = {
            0x00ffff: '#00ffff', // cyan
            0xffd700: '#ffd700', // gold
            0x00ff00: '#00ff00', // green
            0xff0000: '#ff0000', // red
            0xff00ff: '#ff00ff', // magenta
            0xff8800: '#ff8800', // orange
            0xffff00: '#ffff00', // yellow
            0x0088ff: '#0088ff', // blue
            0x888888: '#888888'  // gray
        };
        
        return colors[colorInt] || '#ffffff';
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
            'reserves': 0xff0000,
            'credibility': 0xffff00,
            'event-external': 0xff0000, // Red for external events
            'event-internal': 0xff8800, // Orange for internal events
            'report': 0xff00ff, // Magenta for quarterly reports
            'fed': 0x0088ff, // Blue for FED news
            'general': 0x888888
        };
        
        return colors[type] || colors['general'];
    }
}
