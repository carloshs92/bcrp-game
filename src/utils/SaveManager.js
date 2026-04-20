/**
 * SaveManager - Handles saving and loading game data using LocalStorage
 */
export default class SaveManager {
    constructor() {
        this.storageKey = 'bcrp-inflation-game';
    }
    
    /**
     * Save game data
     */
    save(data) {
        try {
            const saveData = {
                highScore: data.highScore || 0,
                highestLevel: data.highestLevel || 1,
                totalGamesPlayed: data.totalGamesPlayed || 0,
                bestTime: data.bestTime || null,
                achievements: data.achievements || [],
                lastPlayed: new Date().toISOString()
            };
            
            localStorage.setItem(this.storageKey, JSON.stringify(saveData));
            console.log('✅ Game saved:', saveData);
            return true;
        } catch (e) {
            console.error('❌ Failed to save game:', e);
            return false;
        }
    }
    
    /**
     * Load game data
     */
    load() {
        try {
            const savedData = localStorage.getItem(this.storageKey);
            if (savedData) {
                const data = JSON.parse(savedData);
                console.log('✅ Game loaded:', data);
                return data;
            }
            console.log('ℹ️ No saved data found, starting fresh');
            return this.getDefaultData();
        } catch (e) {
            console.error('❌ Failed to load game:', e);
            return this.getDefaultData();
        }
    }
    
    /**
     * Get default data structure
     */
    getDefaultData() {
        return {
            highScore: 0,
            highestLevel: 1,
            totalGamesPlayed: 0,
            bestTime: null,
            achievements: [],
            lastPlayed: null
        };
    }
    
    /**
     * Update high score if current score is better
     */
    updateHighScore(currentScore, currentLevel) {
        const data = this.load();
        let updated = false;
        
        if (currentScore > data.highScore) {
            data.highScore = currentScore;
            updated = true;
            console.log('🏆 New high score!', currentScore);
        }
        
        if (currentLevel > data.highestLevel) {
            data.highestLevel = currentLevel;
            updated = true;
            console.log('🎯 New highest level!', currentLevel);
        }
        
        if (updated) {
            this.save(data);
        }
        
        return updated;
    }
    
    /**
     * Increment games played counter
     */
    incrementGamesPlayed() {
        const data = this.load();
        data.totalGamesPlayed = (data.totalGamesPlayed || 0) + 1;
        this.save(data);
    }
    
    /**
     * Clear all saved data
     */
    clear() {
        try {
            localStorage.removeItem(this.storageKey);
            console.log('✅ Save data cleared');
            return true;
        } catch (e) {
            console.error('❌ Failed to clear save data:', e);
            return false;
        }
    }
    
    /**
     * Check if save data exists
     */
    hasSaveData() {
        return localStorage.getItem(this.storageKey) !== null;
    }
}
