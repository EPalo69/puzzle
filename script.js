class SlidingPuzzle {
    constructor() {
        this.gridSize = 3;
        this.tiles = [];
        this.positions = []; // Track which tile is in which position
        this.emptyPosition = 8; // Bottom-right corner
        this.moves = 0;
        this.isShuffled = false;
        this.currentImageIndex = 1;
        this.availableImages = [1, 2]; // Images 1.png and 2.png
        
        this.puzzleEl = document.getElementById('puzzle');
        this.moveCountEl = document.getElementById('moveCount');
        this.winMessageEl = document.getElementById('winMessage');
        this.currentImageEl = document.getElementById('currentImage');
        this.gameContainer = document.getElementById('gameContainer');
        this.galleryContainer = document.getElementById('galleryContainer');
        
        // Calculate tile size based on puzzle size
        this.updateTileSize();
        
        this.init();
        this.attachEvents();
        this.setupGallery();
        
        // Auto-shuffle on page load
        setTimeout(() => {
            this.shuffle();
        }, 500);
    }

    updateTileSize() {
        const puzzleSize = this.puzzleEl.offsetWidth || 600;
        const padding = 4; // 2px padding on each side
        const gap = 2; // Gap between tiles
        const availableSpace = puzzleSize - padding;
        this.tileSize = (availableSpace - (gap * 2)) / 3;
        const gridGap = gap;
        
        // Position coordinates for 3x3 grid with gaps
        this.positionCoords = [
            [gridGap, gridGap], 
            [gridGap + this.tileSize + gridGap, gridGap], 
            [gridGap + (this.tileSize + gridGap) * 2, gridGap],
            [gridGap, gridGap + this.tileSize + gridGap], 
            [gridGap + this.tileSize + gridGap, gridGap + this.tileSize + gridGap], 
            [gridGap + (this.tileSize + gridGap) * 2, gridGap + this.tileSize + gridGap],
            [gridGap, gridGap + (this.tileSize + gridGap) * 2], 
            [gridGap + this.tileSize + gridGap, gridGap + (this.tileSize + gridGap) * 2], 
            [gridGap + (this.tileSize + gridGap) * 2, gridGap + (this.tileSize + gridGap) * 2]
        ];
    }

    init() {
        // Clear positions array
        this.positions = [];
        
        // Recalculate sizes in case of screen resize
        this.updateTileSize();
        const puzzleSize = this.puzzleEl.offsetWidth || 600;
        
        // Create 9 tiles (0-7 are visible, 8 is empty)
        for (let i = 0; i < 9; i++) {
            const tile = document.createElement('div');
            tile.classList.add('tile');
            tile.dataset.tileId = i; // Unique tile ID
            tile.dataset.correctPosition = i;
            
            // Set position
            const [left, top] = this.positionCoords[i];
            tile.style.left = left + 'px';
            tile.style.top = top + 'px';
            tile.style.width = this.tileSize + 'px';
            tile.style.height = this.tileSize + 'px';
            
            this.positions[i] = i; // Position i contains tile i
            
            if (i === 8) {
                tile.classList.add('empty');
                // Don't set any background for empty tile
            } else {
                // Set background image for current image
                tile.style.backgroundImage = `url('imgs/${this.currentImageIndex}.png')`;
                const imageSize = puzzleSize - 4; // Subtract padding
                tile.style.backgroundSize = `${imageSize}px ${imageSize}px`;
                // Calculate background position for each tile
                const row = Math.floor(i / 3);
                const col = i % 3;
                const bgOffset = -2; // Offset for padding
                tile.style.backgroundPosition = `${bgOffset - (col * (this.tileSize + 2))}px ${bgOffset - (row * (this.tileSize + 2))}px`;
            }
            
            this.tiles.push(tile);
            this.puzzleEl.appendChild(tile);
        }
    }

    attachEvents() {
        // Click event for tiles
        this.tiles.forEach((tile, index) => {
            tile.addEventListener('click', () => this.handleTileClick(index));
        });
        
        // Solve button (force win for testing)
        const solveBtn = document.getElementById('solve');
        if (solveBtn) {
            solveBtn.addEventListener('click', () => {
                this.resetToSolvedState();
                this.isShuffled = true;
                setTimeout(() => {
                    this.showWinMessage();
                }, 700);
            });
        }
    }
    
    resetToSolvedState() {
        // Remove any overlay from the win reveal
        const overlay = this.puzzleEl.querySelector('div[style*="z-index: 10"]');
        if (overlay) {
            overlay.remove();
        }
        
        // Move all tiles back to their correct positions
        for (let i = 0; i < 9; i++) {
            const tile = this.tiles[i];
            const [left, top] = this.positionCoords[i];
            tile.style.left = left + 'px';
            tile.style.top = top + 'px';
            this.positions[i] = i;
        }
        this.emptyPosition = 8;
        this.puzzleEl.style.background = '#333';
    }

    setupGallery() {
        const galleryGrid = document.getElementById('galleryGrid');
        galleryGrid.innerHTML = '';
        
        this.availableImages.forEach(imageIndex => {
            const item = document.createElement('div');
            item.className = 'gallery-item';
            item.innerHTML = `
                <img src="imgs/${imageIndex}.png" alt="Image ${imageIndex}">
                <div class="image-label">Image ${imageIndex}</div>
            `;
            
            item.addEventListener('click', () => {
                this.selectImage(imageIndex);
            });
            
            galleryGrid.appendChild(item);
        });
    }
    
    selectImage(imageIndex) {
        this.currentImageIndex = imageIndex;
        
        // Clear any existing win overlay
        const existingOverlay = this.puzzleEl.querySelector('div[style*="z-index: 10"]');
        if (existingOverlay) {
            existingOverlay.remove();
        }
        
        // Hide gallery, show game
        this.galleryContainer.classList.remove('active');
        this.gameContainer.classList.remove('hidden');
        
        // Full reset
        this.puzzleEl.innerHTML = ''; // Clear all tiles
        this.tiles = []; // Reset tiles array
        this.positions = []; // Reset positions
        this.emptyPosition = 8;
        this.moves = 0;
        this.isShuffled = false;
        this.updateMoveCount();
        this.puzzleEl.style.background = '#333';
        
        // Reinitialize with new image
        this.init();
        this.attachEvents(); // Reattach event handlers to new tiles
        setTimeout(() => this.shuffle(), 100);
    }

    handleTileClick(index) {
        if (!this.isShuffled) {
            return; // Wait for initial shuffle to complete
        }

        // Find which position this tile is currently at
        const tileId = parseInt(this.tiles[index].dataset.tileId);
        let currentPosition = -1;
        for (let i = 0; i < 9; i++) {
            if (this.positions[i] === tileId) {
                currentPosition = i;
                break;
            }
        }

        if (currentPosition !== -1 && this.canMove(currentPosition)) {
            this.moveTile(currentPosition);
            this.moves++;
            this.updateMoveCount();
            
            if (this.checkWin()) {
                this.showWinMessage();
            }
        }
    }

    canMove(position) {
        const emptyRow = Math.floor(this.emptyPosition / 3);
        const emptyCol = this.emptyPosition % 3;
        const tileRow = Math.floor(position / 3);
        const tileCol = position % 3;

        // Check if adjacent (same row, adjacent col OR same col, adjacent row)
        return (
            (emptyRow === tileRow && Math.abs(emptyCol - tileCol) === 1) ||
            (emptyCol === tileCol && Math.abs(emptyRow - tileRow) === 1)
        );
    }

    moveTile(position) {
        // Get the tile at this position
        const tileId = this.positions[position];
        const tile = this.tiles[tileId];
        
        // Move tile to empty position
        const [left, top] = this.positionCoords[this.emptyPosition];
        tile.style.left = left + 'px';
        tile.style.top = top + 'px';
        
        // Update positions array
        this.positions[this.emptyPosition] = tileId;
        this.positions[position] = 8; // 8 is the empty tile
        
        // Update empty position
        this.emptyPosition = position;
    }

    shuffle() {
        this.isShuffled = true;
        this.moves = 0;
        this.updateMoveCount();
        if (this.winMessageEl) {
            this.winMessageEl.classList.remove('show');
        }

        // Make 100 random valid moves to ensure solvability
        for (let i = 0; i < 100; i++) {
            const movableTiles = this.getMovableTiles();
            const randomTile = movableTiles[Math.floor(Math.random() * movableTiles.length)];
            this.moveTile(randomTile);
        }

        // Reset move counter after shuffle
        this.moves = 0;
        this.updateMoveCount();
    }

    getMovableTiles() {
        const movable = [];
        for (let position = 0; position < 9; position++) {
            if (this.positions[position] !== 8 && this.canMove(position)) {
                movable.push(position);
            }
        }
        return movable;
    }

    checkWin() {
        if (!this.isShuffled) return false;
        
        // Check if each position has the correct tile
        for (let position = 0; position < 9; position++) {
            if (this.positions[position] !== position) {
                return false;
            }
        }
        return true;
    }

    showWinMessage() {
        // Show complete image by filling empty tile
        this.revealCompleteImage();
        
        // Add delay before showing modal
        setTimeout(() => {
            if (this.winMessageEl) {
                this.winMessageEl.classList.add('show');
            }
            
            // Show modal
            const modal = document.getElementById('winModal');
            const finalMoves = document.getElementById('finalMoves');
            finalMoves.textContent = this.moves;
            modal.classList.add('show');
            
            const acceptButton = document.getElementById('accept');
            const rejectButton = document.getElementById('reject');
            
            // Accept button - trigger heart animation
            acceptButton.onclick = () => {
                this.createHeartAnimation();
                setTimeout(() => {
                    modal.classList.remove('show');
                    // Show gallery instead of immediately reshuffling
                    const gameContainer = document.getElementById('gameContainer');
                    const galleryContainer = document.getElementById('galleryContainer');
                    gameContainer.classList.add('hidden');
                    galleryContainer.classList.add('active');
                }, 2000);
            };
            
            // Reject button - swap button positions
            rejectButton.onclick = () => {
                const parent = acceptButton.parentElement;
                const acceptIndex = Array.from(parent.children).indexOf(acceptButton);
                const rejectIndex = Array.from(parent.children).indexOf(rejectButton);
                
                // Swap the buttons
                if (acceptIndex < rejectIndex) {
                    parent.insertBefore(rejectButton, acceptButton);
                } else {
                    parent.insertBefore(acceptButton, rejectButton);
                }
            };
        }, 1500); // 1.5 second delay
    }
    
    revealCompleteImage() {
        // Create an overlay with the complete image
        const overlay = document.createElement('div');
        overlay.style.position = 'absolute';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundImage = `url('imgs/${this.currentImageIndex}.png')`;
        overlay.style.backgroundSize = 'cover';
        overlay.style.backgroundPosition = 'center';
        overlay.style.opacity = '0';
        overlay.style.transition = 'opacity 0.5s ease-in';
        overlay.style.zIndex = '10';
        
        this.puzzleEl.appendChild(overlay);
        
        // Fade in the complete image
        setTimeout(() => {
            overlay.style.opacity = '1';
        }, 10);
    }
    
    createHeartAnimation() {
        const container = document.getElementById('heartsContainer');
        const heartCount = 30;
        
        for (let i = 0; i < heartCount; i++) {
            setTimeout(() => {
                const heart = document.createElement('div');
                heart.classList.add('heart');
                heart.textContent = '❤️';
                heart.style.left = Math.random() * 100 + '%';
                heart.style.top = Math.random() * 100 + '%';
                heart.style.fontSize = (Math.random() * 20 + 20) + 'px';
                heart.style.animationDelay = Math.random() * 0.5 + 's';
                
                container.appendChild(heart);
                
                // Remove heart after animation
                setTimeout(() => {
                    heart.remove();
                }, 3000);
            }, i * 100);
        }
    }

    updateMoveCount() {
        this.moveCountEl.textContent = this.moves;
    }
}

// Initialize the puzzle when page loads
window.addEventListener('DOMContentLoaded', () => {
    new SlidingPuzzle();
});