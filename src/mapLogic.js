/**
 * @file mapLogic.js
 * @description 政治光譜地圖核心邏輯：處理座標轉換、縮放與交互。
 */

/**
 * 1. 虛擬座標系統 (Virtual Coordinate System)
 * 職責：將政治光譜邏輯值 (-100 ~ +100) 轉換為視覺呈現數據。
 */
const CoordinateTransformer = {
    /**
     * 將邏輯座標轉換為畫布百分比
     * @param {number} x - 經濟傾向 (-100 左, +100 右)
     * @param {number} y - 政治傾向 (-100 自由, +100 威權)
     * @returns {Object} { left, top } 百分比字串
     */
    toPhysical(x, y) {
        // X: -100 -> 0%, 0 -> 50%, 100 -> 100%
        const left = (x + 100) / 2;
        // Y: 100 (威權) -> 0% (頂部), -100 (自由) -> 100% (底部)
        const top = (100 - y) / 2; 
        
        return {
            left: `${Math.max(0, Math.min(100, left))}%`,
            top: `${Math.max(0, Math.min(100, top))}%`
        };
    },

    /**
     * 反向轉換：將百分比轉回邏輯座標 (可用於點擊地圖時獲取座標)
     */
    toLogical(pctX, pctY) {
        return {
            x: (pctX * 2) - 100,
            y: 100 - (pctY * 2)
        };
    }
};

const mapLogic = {
    state: {
        zoom: 1,
        config: {
            step: 0.2,
            minZoom: 0.5,
            maxZoom: 3
        }
    },

    /**
     * 初始化地圖
     */
    init() {
        this.initInteractions();
        console.log("MapLogic: 模組初始化完成");
    },

    /**
     * 2. 徹底移除內聯事件，改用動態綁定 (Event Delegation / Binding)
     */
    initInteractions() {
        const btnIn = document.getElementById('map-zoom-in');
        const btnOut = document.getElementById('map-zoom-out');
        const btnReset = document.getElementById('map-reset');

        btnIn?.addEventListener('click', () => this.handleZoom(this.state.config.step));
        btnOut?.addEventListener('click', () => this.handleZoom(-this.state.config.step));
        btnReset?.addEventListener('click', () => this.resetView());

        // 搜尋框邏輯
        const searchInput = document.getElementById('map-search-input');
        searchInput?.addEventListener('input', (e) => this.handleSearch(e.target.value));
    },

    handleZoom(delta) {
        const newZoom = this.state.zoom + delta;
        if (newZoom >= this.state.config.minZoom && newZoom <= this.state.config.maxZoom) {
            this.state.zoom = newZoom;
            this.applyTransform();
        }
    },

    resetView() {
        this.state.zoom = 1;
        this.applyTransform();
    },

    applyTransform() {
        const mapArea = document.getElementById('map-area');
        if (mapArea) {
            mapArea.style.transform = `scale(${this.state.zoom})`;
            mapArea.style.transition = 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        }
    },

    /**
     * 3. 渲染點位：結合虛擬座標與 DOM 操作
     */
    renderPoint(data) {
        const mapArea = document.getElementById('map-area');
        const { left, top } = CoordinateTransformer.toPhysical(data.x, data.y);

        const dot = document.createElement('div');
        dot.className = `map-point ${data.type || 'ideology'}`;
        dot.style.left = left;
        dot.style.top = top;
        
        // 綁定點擊詳情
        dot.addEventListener('click', () => window.app?.showModal(data));
        
        mapArea.appendChild(dot);
    }
};

export default mapLogic;