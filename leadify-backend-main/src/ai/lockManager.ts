
import fs from 'fs';
import path from 'path';

const LOCK_FILE = path.join(__dirname, 'ai-lock.json');

interface LockData {
    lockedUntil: number;
}

class LockManager {
    private lockedUntil: number = 0;

    constructor() {
        this.loadLock();
    }

    private loadLock() {
        if (fs.existsSync(LOCK_FILE)) {
            try {
                const data = fs.readFileSync(LOCK_FILE, 'utf-8');
                const parsed: LockData = JSON.parse(data);
                this.lockedUntil = parsed.lockedUntil || 0;
            } catch (e) {
                console.error('Failed to load AI lock file', e);
                this.lockedUntil = 0;
            }
        }
    }

    private saveLock() {
        try {
            const data: LockData = { lockedUntil: this.lockedUntil };
            fs.writeFileSync(LOCK_FILE, JSON.stringify(data));
        } catch (e) {
            console.error('Failed to save AI lock file', e);
        }
    }

    public isLocked(): boolean {
        // Refresh lock state in case another process updated it (though usually single instance)
        // For simplicity reusing memory state, but could reload if needed in cluster
        return Date.now() < this.lockedUntil;
    }

    public lock(durationMs: number) {
        this.lockedUntil = Date.now() + durationMs;
        this.saveLock();
        console.log(`AI Service locked for ${(durationMs / 1000 / 60 / 60).toFixed(2)} hours until ${new Date(this.lockedUntil)}`);
    }

    public getRemainingTimeMs(): number {
        return Math.max(0, this.lockedUntil - Date.now());
    }

    public unlock() {
        this.lockedUntil = 0;
        this.saveLock();
    }
}

// Export instance
export const lockManager = new LockManager();
// export default lockManager;
