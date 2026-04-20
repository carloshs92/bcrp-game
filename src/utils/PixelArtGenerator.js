/**
 * PixelArtGenerator - Creates actual pixel art sprites programmatically
 * This is a temporary solution until we have real commissioned pixel art assets
 */
export default class PixelArtGenerator {
    /**
     * Generate Torre del Sol pixel art sprite
     * High-res pixel art (256x256) with cyberpunk-andean aesthetic
     */
    static generateTorredelSol(scene) {
        const width = 256;
        const height = 320;
        const pixelSize = 4; // Each "pixel" is 4x4 actual pixels for high-res look
        
        const canvas = scene.textures.createCanvas('torre-del-sol', width, height);
        const ctx = canvas.context;
        
        // Color palette - cyberpunk andean
        const colors = {
            darkBase: '#1a2332',
            midBase: '#2a3a52',
            lightBase: '#3a5a7a',
            accent: '#00ffff',
            gold: '#ffd700',
            window: '#00ccff',
            shadow: '#0a0e1a'
        };
        
        // Helper to draw pixel
        const drawPixel = (x, y, color, size = pixelSize) => {
            ctx.fillStyle = color;
            ctx.fillRect(x * pixelSize, y * pixelSize, size, size);
        };
        
        // Clear canvas
        ctx.clearRect(0, 0, width, height);
        
        // Base structure (simplified but recognizable building)
        // Foundation
        for (let x = 16; x < 48; x++) {
            for (let y = 70; y < 78; y++) {
                drawPixel(x, y, colors.darkBase);
            }
        }
        
        // Main tower body
        for (let x = 18; x < 46; x++) {
            for (let y = 40; y < 70; y++) {
                const shade = (x + y) % 3 === 0 ? colors.midBase : colors.lightBase;
                drawPixel(x, y, shade);
            }
        }
        
        // Top section
        for (let x = 20; x < 44; x++) {
            for (let y = 25; y < 40; y++) {
                drawPixel(x, y, colors.lightBase);
            }
        }
        
        // Spire (golden)
        const spirePoints = [
            [32, 15], [31, 16], [33, 16],
            [30, 17], [32, 17], [34, 17],
            [29, 18], [31, 18], [33, 18], [35, 18],
            [28, 19], [30, 19], [32, 19], [34, 19], [36, 19]
        ];
        spirePoints.forEach(([x, y]) => drawPixel(x, y, colors.gold));
        
        // Windows (glowing cyan)
        const windowPositions = [
            // Row 1
            [24, 45], [28, 45], [32, 45], [36, 45],
            // Row 2
            [24, 50], [28, 50], [32, 50], [36, 50],
            // Row 3
            [24, 55], [28, 55], [32, 55], [36, 55],
            // Row 4
            [24, 60], [28, 60], [32, 60], [36, 60],
            // Row 5
            [24, 65], [28, 65], [32, 65], [36, 65]
        ];
        
        windowPositions.forEach(([x, y]) => {
            // Window (2x3 pixels)
            drawPixel(x, y, colors.window);
            drawPixel(x + 1, y, colors.window);
            drawPixel(x, y + 1, colors.window);
            drawPixel(x + 1, y + 1, colors.window);
            drawPixel(x, y + 2, colors.window);
            drawPixel(x + 1, y + 2, colors.window);
        });
        
        // Neon outline accents
        // Left edge
        for (let y = 40; y < 70; y += 2) {
            drawPixel(18, y, colors.accent);
        }
        // Right edge
        for (let y = 40; y < 70; y += 2) {
            drawPixel(45, y, colors.accent);
        }
        // Top edge
        for (let x = 20; x < 44; x += 2) {
            drawPixel(x, 25, colors.accent);
        }
        
        canvas.refresh();
        return 'torre-del-sol';
    }
    
    /**
     * Generate Andean mountain background
     */
    static generateMountains(scene) {
        const width = 1280;
        const height = 400;
        
        const canvas = scene.textures.createCanvas('mountains-bg', width, height);
        const ctx = canvas.context;
        
        // Create layered mountains with pixel art style
        const colors = ['#0d1520', '#1a2332', '#2a3a52'];
        
        colors.forEach((color, layer) => {
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.moveTo(0, height);
            
            const peaks = 5 + layer;
            for (let i = 0; i <= peaks; i++) {
                const x = (width / peaks) * i;
                const y = height - (100 + layer * 30) - Math.random() * 50;
                ctx.lineTo(x, y);
            }
            
            ctx.lineTo(width, height);
            ctx.closePath();
            ctx.fill();
        });
        
        // Add terraces (andenes) with pixel art style
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.3;
        
        for (let i = 0; i < 8; i++) {
            const y = height - 50 - i * 30;
            const startX = 100 + i * 20;
            const endX = width - 100 - i * 20;
            
            ctx.beginPath();
            ctx.moveTo(startX, y);
            ctx.lineTo(endX, y);
            ctx.stroke();
        }
        
        canvas.refresh();
        return 'mountains-bg';
    }
    
    /**
     * Generate energy flow particles (pixel art style)
     */
    static generateEnergyParticle(scene, color = 0x00ffff) {
        const size = 8;
        const canvas = scene.textures.createCanvas('energy-particle', size, size);
        const ctx = canvas.context;
        
        // Draw a small glowing pixel
        ctx.fillStyle = `#${color.toString(16).padStart(6, '0')}`;
        ctx.fillRect(2, 2, 4, 4);
        
        // Glow effect
        ctx.globalAlpha = 0.5;
        ctx.fillRect(1, 1, 6, 6);
        ctx.globalAlpha = 0.3;
        ctx.fillRect(0, 0, 8, 8);
        
        canvas.refresh();
        return 'energy-particle';
    }
    
    /**
     * Generate holographic sun (pixel art style)
     */
    static generateHolographicSun(scene) {
        const size = 128;
        const canvas = scene.textures.createCanvas('holographic-sun', size, size);
        const ctx = canvas.context;
        
        const centerX = size / 2;
        const centerY = size / 2;
        const radius = 30;
        
        // Draw sun core (pixel art circle)
        ctx.fillStyle = '#ffd700';
        for (let angle = 0; angle < Math.PI * 2; angle += 0.1) {
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;
            ctx.fillRect(Math.floor(x / 4) * 4, Math.floor(y / 4) * 4, 4, 4);
        }
        
        // Draw rays (8 directions)
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 4;
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const startX = centerX + Math.cos(angle) * (radius + 5);
            const startY = centerY + Math.sin(angle) * (radius + 5);
            const endX = centerX + Math.cos(angle) * (radius + 20);
            const endY = centerY + Math.sin(angle) * (radius + 20);
            
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(endX, endY);
            ctx.stroke();
        }
        
        canvas.refresh();
        return 'holographic-sun';
    }
}
