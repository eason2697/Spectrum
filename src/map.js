const DEFAULT_SCALE = 0.3;
const MAP_SIZE = 3000; // 畫布總尺寸 (px)
const COORD_MAX = 100; // 坐標最大值
const COORD_RANGE = COORD_MAX * 2; // 總量程 (200)
const PIXELS_PER_UNIT = MAP_SIZE / COORD_RANGE; // 每 1 單位坐標對應的像素 (15px)
const COMMUNITY_DATA_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR63yn8Fj_lQWN4WKVOO4DDlh5VGOAolux8Kv4nMtmP4O8Jqv6b1qjPDwwvRDskJ2RnN_KPMr1rl0cO/pub?output=csv';

export const mapLogic = {
    ideologyData: [],
    scale: DEFAULT_SCALE, // 預設視角縮放比例
    translateX: 0,
    translateY: 0,
    isDragging: false,
    startX: 0,
    startY: 0,
    initialTranslateX: 0,
    initialTranslateY: 0,
    activeFilters: new Set(),
    renderedPoints: [],
    showCommunityPoints: true,
    showFigures: true,
    showParties: true,
    communityData: [], // 存放全網歷史落點
    
    init(data) {
        this.ideologyData = data;
        this.renderMap();
        this.initInteractions();
        this.initSearch();
        this.initFilters();
        this.fetchCommunityData(); // 初始化時開始拉取雲端數據
    },

    initInteractions() {
        const container = document.getElementById('map-container');
        if (!container || container.dataset.interactable) return;
        container.dataset.interactable = 'true'; // 確保事件只綁定一次

        // 滾輪縮放
        container.addEventListener('wheel', (e) => {
            e.preventDefault();
            this.disableTransition(); // 滾輪時關閉動畫避免延遲
            
            const zoomSpeed = 0.005; // 調降縮放靈敏度為一半
            const delta = e.deltaY > 0 ? -1 : 1;
            
            const oldScale = this.scale;
            const newScale = Math.min(Math.max(0.1, oldScale + delta * zoomSpeed), 5); // 放寬縮小極限至 0.1x
            
            // 計算滑鼠相對於容器中心點的位置
            const rect = container.getBoundingClientRect();
            const cx = rect.width / 2;
            const cy = rect.height / 2;
            const mx = e.clientX - rect.left - cx;
            const my = e.clientY - rect.top - cy;

            // 以滑鼠為中心的位移補償計算
            const ratio = newScale / oldScale;
            this.translateX = mx - (mx - this.translateX) * ratio;
            this.translateY = my - (my - this.translateY) * ratio;
            this.scale = newScale;

            this.updateTransform();
        }, { passive: false });

        // 桌面端拖曳
        container.addEventListener('mousedown', (e) => {
            this.disableTransition(); // 拖曳前關閉動畫確保跟手
            this.isDragging = true;
            this.startX = e.clientX;
            this.startY = e.clientY;
            this.initialTranslateX = this.translateX;
            this.initialTranslateY = this.translateY;
        });
        window.addEventListener('mousemove', (e) => {
            if (!this.isDragging) return;
            const dragSpeed = 0.5; // 調降平移靈敏度為一半
            this.translateX = this.initialTranslateX + (e.clientX - this.startX) * dragSpeed;
            this.translateY = this.initialTranslateY + (e.clientY - this.startY) * dragSpeed;
            this.updateTransform();
        });
        window.addEventListener('mouseup', () => { this.isDragging = false; });
        window.addEventListener('mouseleave', () => { this.isDragging = false; });

        // 手機端拖曳與雙指縮放
        let lastPinchDistance = null;

        container.addEventListener('touchstart', (e) => {
            this.disableTransition(); // 觸控前關閉動畫確保跟手
            if (e.touches.length === 1) {
                this.isDragging = true;
                this.startX = e.touches[0].clientX - this.translateX;
                this.startY = e.touches[0].clientY - this.translateY;
            } else if (e.touches.length === 2) {
                this.isDragging = false;
                lastPinchDistance = Math.hypot(
                    e.touches[0].clientX - e.touches[1].clientX,
                    e.touches[0].clientY - e.touches[1].clientY
                );
            }
        }, { passive: false });

        container.addEventListener('touchmove', (e) => {
            e.preventDefault(); // 防止拖曳時滾動頁面
            if (this.isDragging && e.touches.length === 1) {
                this.translateX = e.touches[0].clientX - this.startX;
                this.translateY = e.touches[0].clientY - this.startY;
                this.updateTransform();
            } else if (e.touches.length === 2 && lastPinchDistance) {
                const currentDistance = Math.hypot(
                    e.touches[0].clientX - e.touches[1].clientX,
                    e.touches[0].clientY - e.touches[1].clientY
                );
                
                const ratio = currentDistance / lastPinchDistance;
                const oldScale = this.scale;
                const newScale = Math.min(Math.max(0.1, oldScale * ratio), 5);
                const actualRatio = newScale / oldScale; // 防止撞到極限值產生飄移
                
                const rect = container.getBoundingClientRect();
                const cx = rect.width / 2;
                const cy = rect.height / 2;
                const touchCenterX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
                const touchCenterY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
                const mx = touchCenterX - rect.left - cx;
                const my = touchCenterY - rect.top - cy;

                this.translateX = mx - (mx - this.translateX) * actualRatio;
                this.translateY = my - (my - this.translateY) * actualRatio;
                this.scale = newScale;
                
                lastPinchDistance = currentDistance; // 更新上一次的距離
                this.updateTransform();
            }
        }, { passive: false });

        container.addEventListener('touchend', () => {
            this.isDragging = false;
            lastPinchDistance = null;
        });
    },

    initFilters() {
        const filterContainer = document.getElementById('filter-tags');
        if (!filterContainer) return;

        // 自動從資料庫提取所有出現過的不重複標籤
        const allTags = new Set();
        this.ideologyData.forEach(item => {
            if (item.tags) item.tags.forEach(t => allTags.add(t));
        });

        filterContainer.innerHTML = '';
        allTags.forEach(tag => {
            const btn = document.createElement('button');
            btn.className = 'filter-tag';
            btn.innerText = `#${tag}`;
            btn.onclick = () => {
                if (this.activeFilters.has(tag)) {
                    this.activeFilters.delete(tag);
                    btn.classList.remove('active');
                } else {
                    this.activeFilters.add(tag);
                    btn.classList.add('active');
                }
                this.applyFilters();
            };
            filterContainer.appendChild(btn);
        });
    },

    initSearch() {
        const searchInput = document.getElementById('map-search-input');
        const searchResults = document.getElementById('map-search-results');
        if (!searchInput || !searchResults) return;

        let currentFocus = -1; // 記錄目前鍵盤選中的選項索引

        searchInput.addEventListener('input', (e) => {
            const keyword = e.target.value.trim().toLowerCase();
            searchResults.innerHTML = '';
            
            currentFocus = -1; // 重新輸入時重置選擇狀態
            if (keyword === '') {
                searchResults.style.display = 'none';
                return;
            }

            // 根據名字或分類進行模糊搜尋
            const matches = this.ideologyData.filter(item => 
                item.ideology.toLowerCase().includes(keyword) || 
                (item.category && item.category.toLowerCase().includes(keyword))
            );

            if (matches.length > 0) {
                searchResults.style.display = 'block';
                matches.forEach(item => {
                    const div = document.createElement('div');
                    div.className = 'search-result-item';
                    div.innerText = item.ideology;
                    div.onclick = () => {
                        this.focusOn(item.x, item.y); // 自動對焦
                        this.showModal(item);         // 彈出視窗
                        searchInput.value = '';       // 清空搜尋列
                        searchResults.style.display = 'none';
                    };
                    searchResults.appendChild(div);
                });
            } else {
                searchResults.style.display = 'none';
            }
        });

        // 監聽鍵盤事件 (上下鍵與 Enter)
        searchInput.addEventListener('keydown', (e) => {
            const items = searchResults.getElementsByClassName('search-result-item');
            if (items.length === 0) return;

            if (e.key === 'ArrowDown') {
                e.preventDefault(); // 防止游標亂跑
                currentFocus++;
                if (currentFocus >= items.length) currentFocus = 0; // 到底時回到最上面
                setActive(items);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                currentFocus--;
                if (currentFocus < 0) currentFocus = items.length - 1; // 到頂時跳到最下面
                setActive(items);
            } else if (e.key === 'Enter') {
                e.preventDefault(); // 阻止表單預設提交行為
                if (currentFocus > -1) {
                    items[currentFocus].click(); // 模擬點擊當前選項
                } else if (items.length > 0) {
                    items[0].click(); // 如果沒選中任何選項直接按 Enter，預設跳轉第一個結果
                }
            }
        });

        // 更新選單視覺狀態的內部函式
        const setActive = (items) => {
            Array.from(items).forEach(item => item.classList.remove('active'));
            items[currentFocus].classList.add('active');
            items[currentFocus].scrollIntoView({ block: 'nearest' }); // 若選項太多被遮住，自動滾動讓選項可見
        };

        // 點擊空白處隱藏搜尋結果
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.map-search-box')) {
                searchResults.style.display = 'none';
            }
        });
    },

    updateTransform() {
        const mapArea = document.getElementById('map-area');
        if (mapArea) {
            mapArea.style.transform = `translate(${this.translateX}px, ${this.translateY}px) scale(${this.scale})`;
        }
    },

    enableTransition() {
        const mapArea = document.getElementById('map-area');
        // 使用 cubic-bezier 加入一點點滑順減速的效果
        if (mapArea) mapArea.style.transition = 'transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)';
    },

    disableTransition() {
        const mapArea = document.getElementById('map-area');
        if (mapArea) mapArea.style.transition = 'none';
    },

    zoomIn() {
        this.enableTransition();
        this.scale = Math.min(5, this.scale + 0.5); // 每次放大 0.5 倍，上限為 5x
        this.updateTransform();
    },

    zoomOut() {
        this.enableTransition();
        this.scale = Math.max(0.1, this.scale - 0.5); // 每次縮小 0.5 倍，下限為 0.1x
        this.updateTransform();
    },

    resetView() {
        this.enableTransition();
        // 重置為初始無縮放無位移狀態
        this.scale = DEFAULT_SCALE;
        this.translateX = 0;
        this.translateY = 0;
        this.updateTransform();
    },

    renderMap() {
        const mapArea = document.getElementById('map-area');
        if (!mapArea) return;
        mapArea.innerHTML = ''; // 清空地圖以防止重複渲染

        // 重置縮放與位移
        this.renderedPoints = [];
        this.scale = DEFAULT_SCALE;
        this.translateX = 0;
        this.translateY = 0;
        this.updateTransform();

        // --- 新增：動態繪製四個象限的平面化背景 ---
        const quadrants = [
            { className: 'quadrant tl' }, // 左上：威權左派 (綠)
            { className: 'quadrant tr' }, // 右上：威權右派 (紅)
            { className: 'quadrant bl' }, // 左下：自由左派 (藍)
            { className: 'quadrant br' }  // 右下：自由右派 (黃)
        ];
        
        quadrants.forEach(q => {
            const quadDiv = document.createElement('div');
            quadDiv.className = q.className;
            mapArea.appendChild(quadDiv);
        });
        // ------------------------------------------

        // 繪製中心十字線 (背景層之後，確保線條在背景上方)
        const vLine = document.createElement('div');
        vLine.className = 'axis-line vertical';
        const hLine = document.createElement('div');
        hLine.className = 'axis-line horizontal';
        mapArea.appendChild(vLine);
        mapArea.appendChild(hLine);

        // 渲染歷史群體落點
        this.renderCommunityPoints();

        // 渲染資料庫中的思想點
        this.ideologyData.forEach(item => {
            const point = this.createPoint(item);
            point.onclick = () => this.showModal(item);
            mapArea.appendChild(point);
            // 儲存完整資料以便後續複雜篩選
            this.renderedPoints.push({ element: point, data: item });
        });
        
        this.applyFilters();
    },

    toggleTypeVisibility(type, isVisible) {
        const typeLower = type.toLowerCase();
        if (typeLower === 'figure') this.showFigures = isVisible;
        if (typeLower === 'party') this.showParties = isVisible;
        this.applyFilters();
    },

    /**
     * 從 Google 試算表拉取全網數據
     */
    async fetchCommunityData() {
        try {
            const response = await fetch(COMMUNITY_DATA_URL);
            const csvText = await response.text();
            
            // 簡單解析 CSV (假設第一欄是時間戳, 第二欄是 X, 第三欄是 Y)
            const rows = csvText.split('\n').slice(1); // 跳過標題列
            this.communityData = rows.map(row => {
                const cols = row.split(',');
                return {
                    x: parseFloat(cols[1]), 
                    y: parseFloat(cols[2])
                };
            }).filter(pos => !isNaN(pos.x) && !isNaN(pos.y));

            console.log(`成功載入 ${this.communityData.length} 筆全網歷史數據`);
            this.renderCommunityPoints(); // 載入完成後立即更新一次畫面
        } catch (error) {
            console.error('無法讀取全網歷史數據:', error);
        }
    },

    renderCommunityPoints() {
        const canvas = document.getElementById('community-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        
        // 清除畫布
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 如果選擇關閉或數據尚未抵達
        if (!this.showCommunityPoints || this.communityData.length === 0) return;

        // 取得 CSS 變數中的顏色數值 (Canvas 需要具體的顏色字串)
        const style = getComputedStyle(document.documentElement);
        const colors = {
            authLeft: style.getPropertyValue('--color-auth-left').trim() || '#2e511b',
            authRight: style.getPropertyValue('--color-auth-right').trim() || '#8a2c0d',
            libLeft: style.getPropertyValue('--color-lib-left').trim() || '#1e40af',
            libRight: style.getPropertyValue('--color-lib-right').trim() || '#854d0e',
            primary: style.getPropertyValue('--primary').trim() || '#3b82f6'
        };

        this.communityData.forEach(pos => {
            const safeX = Math.max(-COORD_MAX, Math.min(COORD_MAX, pos.x));
            const safeY = Math.max(-COORD_MAX, Math.min(COORD_MAX, pos.y));
            
            // 計算 Canvas 內的像素座標
            const canvasX = ((safeX + COORD_MAX) / COORD_RANGE) * canvas.width;
            const canvasY = ((COORD_MAX - safeY) / COORD_RANGE) * canvas.height;

            // 根據象限決定顏色
            let color = colors.primary;
            if (safeX < 0 && safeY > 0) color = colors.authLeft;
            else if (safeX >= 0 && safeY > 0) color = colors.authRight;
            else if (safeX < 0 && safeY <= 0) color = colors.libLeft;
            else if (safeX >= 0 && safeY <= 0) color = colors.libRight;

            // 繪製圓點
            ctx.beginPath();
            ctx.arc(canvasX, canvasY, 4, 0, Math.PI * 2); // 半徑 4px
            ctx.fillStyle = color;
            ctx.globalAlpha = 0.4; // 設定半透明度
            ctx.fill();
        });
    },

    applyFilters() {
        this.renderedPoints.forEach(p => {
            const item = p.data;
            const type = (item.type || 'ideology').toLowerCase();
            
            // 1. 型態過濾邏輯
            let typeMatch = true;
            if (type === 'figure' && !this.showFigures) typeMatch = false;
            if (type === 'party' && !this.showParties) typeMatch = false;

            // 2. 標籤過濾邏輯
            const tagMatch = this.activeFilters.size === 0 || 
                             (item.tags && item.tags.some(tag => this.activeFilters.has(tag)));

            if (typeMatch && tagMatch) p.element.classList.remove('filtered-out');
            else p.element.classList.add('filtered-out');
        });
    },

    showUserResult(x, y) {
        const mapArea = document.getElementById('map-area');
        const oldMarker = document.getElementById('user-marker');
        if (oldMarker) oldMarker.remove();

        const point = this.createPoint({ x, y, ideology: '你的位置' });
        point.id = 'user-marker';
        point.classList.add('user-point');
        mapArea.appendChild(point);

        // 自動平移並對焦放大到使用者的點
        this.focusOn(x, y, 1.5);
    },

    focusOn(x, y, targetScale = 1.5) {
        this.enableTransition();
        const safeX = Math.max(-COORD_MAX, Math.min(COORD_MAX, x));
        const safeY = Math.max(-COORD_MAX, Math.min(COORD_MAX, y));
        
        this.scale = targetScale;
        this.translateX = -safeX * PIXELS_PER_UNIT * this.scale;
        this.translateY = safeY * PIXELS_PER_UNIT * this.scale;
        
        this.updateTransform();
    },

    createPoint(item) {
        const { x, y, ideology, category, type, avatar } = item;
        const normalizedType = (type || 'ideology').toLowerCase();
        const point = document.createElement('div');
        point.className = 'map-point';
        
        // 加上型態標籤 (強制小寫以符合 CSS)
        point.classList.add('type-' + normalizedType);

        // 如果是人物或政黨，加上高亮標籤
        if (normalizedType !== 'ideology') {
            point.classList.add('highlight-point');
            
            // 建立裝飾徽章
            const badge = document.createElement('div');
            badge.className = 'point-badge';
            if (normalizedType === 'figure') {
                badge.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`;
            } else if (normalizedType === 'party') {
                badge.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/></svg>`; // 更改政黨圖示為盾牌/旗幟樣式，更具標誌性
            }
            point.appendChild(badge);
        }

        // 根據分類加上對應的顏色 class
        if (category) {
            const pointClass = 'point-' + category.toLowerCase().replace(/\s+/g, '-');
            point.classList.add(pointClass);
        }

        // 處理頭像
        if (avatar) {
            // 使用引號包裹 URL 以處理特殊字元
            point.style.backgroundImage = `url("${avatar}")`;
            point.classList.add('has-avatar');
            
            // 建立圖片物件來檢查是否載入成功
            const img = new Image();
            img.src = avatar;
            img.onerror = () => {
                point.classList.remove('has-avatar');
                point.classList.add('avatar-error');
            };
        }

        // 確保 X, Y 限制在 -100 到 100 的合理範圍內，避免圓點超出地圖邊界
        const safeX = Math.max(-COORD_MAX, Math.min(COORD_MAX, x));
        const safeY = Math.max(-COORD_MAX, Math.min(COORD_MAX, y));
        
        // 映射到 0% - 100% 的 CSS 屬性
        point.style.left = `${((safeX + COORD_MAX) / COORD_RANGE) * 100}%`;
        point.style.top = `${((-safeY + COORD_MAX) / COORD_RANGE) * 100}%`;
        point.title = ideology;

        // 新增名稱標籤
        const label = document.createElement('span');
        label.className = 'map-point-label';
        label.innerText = ideology;
        point.appendChild(label);

        return point;
    },

    showModal(item) {
        document.getElementById('modal-title').innerText = item.ideology;
        
        const categoryText = item.category || '未分類';
        const categoryEl = document.getElementById('modal-category');
        categoryEl.innerText = categoryText;
        // 將文字轉換為 CSS Class，例如 "Authoritarian Left" 變成 "tag-authoritarian-left"
        const categoryClass = 'tag-' + categoryText.toLowerCase().replace(/\s+/g, '-');
        categoryEl.className = 'category-tag ' + categoryClass;

        // 處理動態圖片載入
        const imgEl = document.getElementById('modal-image');
        if (item.avatar) {
            imgEl.src = item.avatar;
            imgEl.style.display = 'block';
        } else {
            imgEl.style.display = 'none';
            imgEl.src = '';
        }

        document.getElementById('modal-desc').innerText = item.description || '暫無敘述';
        document.getElementById('modal-history').innerText = item.history || '無相關歷史資料';
        document.getElementById('modal-score-x').innerText = item.x;
        document.getElementById('modal-score-y').innerText = item.y;

        const searchBtn = document.getElementById('modal-search-btn');
        searchBtn.onclick = () => {
            window.open(`https://www.google.com/search?q=${encodeURIComponent(item.ideology + ' 政治思想')}`, '_blank');
        };

        document.getElementById('ideology-modal').classList.add('active');
    }
};