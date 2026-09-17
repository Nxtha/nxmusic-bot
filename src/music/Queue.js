class Queue {
    constructor(limit = 100) {
        this.limit = limit;
        this.items = [];
        this.history = []
    }
    add(track) {
        if (this.items.length >= this.limit) throw new Error('QUEUE_FULL');
        this.items.push(track)
    }
    addMany(tracks) {
        for (const t of tracks) {
            if (this.items.length >= this.limit) break;
            this.items.push(t)
        }
    }
    next() {
        return this.items.shift() || null
    }
    clear() {
        this.items = []
    }
    remove(pos) {
        const i = Number(pos) - 1;
        if (i < 0 || i >= this.items.length) return null;
        return this.items.splice(i, 1)[0]
    }
    shuffle() {
        for (let i = this.items.length - 1;
        i > 0;
        i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.items[i], this.items[j]] = [this.items[j], this.items[i]]
        }
    }
}
module.exports = Queue;
