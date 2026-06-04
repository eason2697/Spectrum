import { 
    DEFAULT_SCALE, 
    MAP_SIZE, 
    COORD_MAX, 
    COORD_RANGE, 
    PIXELS_PER_UNIT, 
    COMMUNITY_DATA_URL 
} from './config.js';
import { i18n, getI18nText } from './i18n.js';
import { getProxiedImageUrl, getPlaceholderStyle } from './utils.js';

export const mapLogic = {
    ideologyData: [],
    scale: DEFAULT_SCALE, 
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
    communityData: [], 
    currentLang: 'zh',
    
    init(data) {
        this.ideologyData = data;
        this.renderMap();
        this.initInteractions();
        this.initSearch();
        this.initFilters();
        this.fetchCommunityData(); 
    },

    initInteractions() {
        const container = document.getElementById('map-container');
        if (!container || container.dataset.interactable) return;
        container.dataset.interactable = 'true'; 

        this.setupSidebarFilters();
        this.setupControlButtons();
        this.setupWheelInteraction(container);
        this.setupDragInteraction(container);
        this.setupTouchInteraction(container);
    },

    setupSidebarFilters() {
        const sidebar = document.getElementById('app-sidebar');
        if (!sidebar) return;
        sidebar.addEventListener('change', (e) => {
            const target = e.target;
            if (target.classList.contains('filter-checkbox')) {
                this.toggleTypeVisibility(target.dataset.type, target.checked);
            }
            if (target.dataset.action === 'toggle-community') {
                this.showCommunityPoints = target.checked;
                this.renderCommunityPoints();
            }
        });
    },

    setupControlButtons() {
        // 地圖縮放與重置
        document.getElementById('map-zoom-in')?.addEventListener('click', () => this.zoomIn());
        document.getElementById('map-zoom-out')?.addEventListener('click', () => this.zoomOut());
        document.getElementById('map-reset')?.addEventListener('click', () => this.resetView());

        // 彈窗控制
        document.getElementById('modal-close-btn')?.addEventListener('click', () => this.closeModal());
        
        // 測驗結果頁面跳轉
        document.getElementById('result-btn-map')?.addEventListener('click', () => {
            if (window.app) window.app.showUserOnMap();
        });
        document.getElementById('result-btn-home')?.addEventListener('click', () => { // 這裡的 homeBtn 已經有 data-i18n 了
            if (window.app) window.app.switchView('home-view'); 
        });

        // 彈窗搜尋按鈕
        const modalSearchBtn = document.getElementById('modal-search-btn');
        if (modalSearchBtn) {
            modalSearchBtn.addEventListener('click', () => {
                const title = document.getElementById('modal-title')?.innerText;
                if (title) { // 這裡的 title 已經是 i18n 處理過的了
                    // 修正：移除不必要的角括號，並將 encodeURIComponent 的括號正確閉合
                    window.open(`https://www.google.com/search?q=${encodeURIComponent(title)} 政治思想`, '_blank');
                }
            });
        }
    },

    setupWheelInteraction(container) {
        container.addEventListener('wheel', (e) => {
            e.preventDefault();
            this.disableTransition();
            const zoomSpeed = 0.005; 
            const delta = e.deltaY > 0 ? -1 : 1;
            const oldScale = this.scale;
            const newScale = Math.min(Math.max(0.1, oldScale + delta * zoomSpeed), 5);
            
            const rect = container.getBoundingClientRect();
            const cx = rect.width / 2;
            const cy = rect.height / 2;
            const mx = e.clientX - rect.left - cx;
            const my = e.clientY - rect.top - cy;

            const ratio = newScale / oldScale;
            this.translateX = mx - (mx - this.translateX) * ratio;
            this.translateY = my - (my - this.translateY) * ratio;
            this.scale = newScale;

            this.updateTransform();
        }, { passive: false });
    },

    handleDragMove(e) {
        if (!this.isDragging) return;
        const dragSpeed = 0.5;
        this.translateX = this.initialTranslateX + (e.clientX - this.startX) * dragSpeed;
        this.translateY = this.initialTranslateY + (e.clientY - this.startY) * dragSpeed;
        this.updateTransform();
    },

    handleDragEnd() {
        this.isDragging = false;
        window.removeEventListener('mousemove', this._boundMouseMove);
        window.removeEventListener('mouseup', this._boundMouseUp);
    },

    setupDragInteraction(container) {
        this._boundMouseMove = this.handleDragMove.bind(this);
        this._boundMouseUp = this.handleDragEnd.bind(this);

        container.addEventListener('mousedown', (e) => {
            this.disableTransition();
            this.isDragging = true;
            this.startX = e.clientX;
            this.startY = e.clientY;
            this.initialTranslateX = this.translateX;
            this.initialTranslateY = this.translateY;
            window.addEventListener('mousemove', this._boundMouseMove);
            window.addEventListener('mouseup', this._boundMouseUp);
        });
    },

    setupTouchInteraction(container) {
        let lastPinchDistance = null;
        container.addEventListener('touchstart', (e) => {
            this.disableTransition();
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
            e.preventDefault();
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
                const actualRatio = newScale / oldScale;
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
                lastPinchDistance = currentDistance;
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
        
        // 使用 Map 來儲存 唯一標籤Key(中文) -> 完整標籤物件
        const uniqueTags = new Map(); 
        
        this.ideologyData.forEach(item => {
            const tags = item.tags || [];
            tags.forEach(t => {
                const zhKey = typeof t === 'object' ? t.zh : t;
                if (!uniqueTags.has(zhKey)) {
                    uniqueTags.set(zhKey, t);
                }
            });
        });

        filterContainer.innerHTML = '';
        uniqueTags.forEach((tagData, zhKey) => {
            const btn = document.createElement('button');
            btn.className = 'filter-tag';
            
            // 根據目前語系決定顯示文字
            const displayText = typeof tagData === 'object' 
                ? (tagData[this.currentLang] || tagData.zh) 
                : tagData;
                
            btn.innerText = `#${displayText}`;
            if (this.activeFilters.has(zhKey)) btn.classList.add('active');

            btn.onclick = () => {
                if (this.activeFilters.has(zhKey)) {
                    this.activeFilters.delete(zhKey);
                    btn.classList.remove('active');
                } else {
                    this.activeFilters.add(zhKey);
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
        
        if (!searchInput || !searchResults || searchInput.dataset.initialized) return;
        searchInput.dataset.initialized = 'true';
        
        let currentFocus = -1;

        searchInput.addEventListener('input', (e) => {
            const keyword = e.target.value.trim().toLowerCase();
            searchResults.innerHTML = '';
            currentFocus = -1;
            if (keyword === '') {
                searchResults.style.display = 'none';
                return;
            }
            const matches = this.ideologyData.filter(item => {
                const nameZH = getI18nText(item, 'ideology', 'zh').toLowerCase();
                const nameEN = getI18nText(item, 'ideology', 'en').toLowerCase();
                const category = (item.category || "").toLowerCase();
                
                return nameZH.includes(keyword) || nameEN.includes(keyword) || category.includes(keyword);
            });
            if (matches.length > 0) {
                searchResults.style.display = 'block';
                matches.forEach(item => {
                    const div = document.createElement('div');
                    div.className = 'search-result-item';
                    // 使用語系安全讀取
                    div.innerText = getI18nText(item, 'ideology', this.currentLang);
                    div.onclick = () => {
                        this.focusOn(item.x, item.y);
                        this.showModal(item);
                        searchInput.value = '';
                        searchResults.style.display = 'none';
                    };
                    searchResults.appendChild(div);
                });
            } else {
                searchResults.style.display = 'none';
            }
        });

        searchInput.addEventListener('keydown', (e) => {
            const items = searchResults.getElementsByClassName('search-result-item');
            if (items.length === 0) return;
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                currentFocus++;
                if (currentFocus >= items.length) currentFocus = 0;
                setActive(items);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                currentFocus--;
                if (currentFocus < 0) currentFocus = items.length - 1;
                setActive(items);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (currentFocus > -1) items[currentFocus].click();
                else if (items.length > 0) items[0].click();
            }
        });

        const setActive = (items) => {
            Array.from(items).forEach(item => item.classList.remove('active'));
            items[currentFocus].classList.add('active');
            items[currentFocus].scrollIntoView({ block: 'nearest' });
        };

        this._onDocumentClick = (e) => {
            if (!e.target.closest('.map-search-box')) {
                const results = document.getElementById('map-search-results');
                if (results) results.style.display = 'none';
            }
        };
        document.addEventListener('click', this._onDocumentClick);
    },

    updateTransform() {
        const mapArea = document.getElementById('map-area');
        if (mapArea) mapArea.style.transform = `translate(${this.translateX}px, ${this.translateY}px) scale(${this.scale})`;
    },

    enableTransition() {
        const mapArea = document.getElementById('map-area');
        if (mapArea) mapArea.style.transition = 'transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)';
    },

    disableTransition() {
        const mapArea = document.getElementById('map-area');
        if (mapArea) mapArea.style.transition = 'none';
    },

    zoomIn() {
        this.enableTransition();
        this.scale = Math.min(5, this.scale + 0.5);
        this.updateTransform();
    },

    zoomOut() {
        this.enableTransition();
        this.scale = Math.max(0.1, this.scale - 0.5);
        this.updateTransform();
    },

    resetView() {
        this.enableTransition();
        this.scale = DEFAULT_SCALE;
        this.translateX = 0;
        this.translateY = 0;
        this.updateTransform();
    },

    renderMap() {
        const mapArea = document.getElementById('map-area');
        if (!mapArea) return;
        mapArea.innerHTML = '';
        this.renderedPoints = [];
        this.scale = DEFAULT_SCALE;
        this.translateX = 0;
        this.translateY = 0;
        this.updateTransform();

        const quadrants = [
            { className: 'quadrant tl' },
            { className: 'quadrant tr' },
            { className: 'quadrant bl' },
            { className: 'quadrant br' }
        ];
        quadrants.forEach(q => {
            const quadDiv = document.createElement('div');
            quadDiv.className = q.className;
            mapArea.appendChild(quadDiv);
        });

        const vLine = document.createElement('div');
        vLine.className = 'axis-line vertical';
        const hLine = document.createElement('div');
        hLine.className = 'axis-line horizontal';
        mapArea.appendChild(vLine);
        mapArea.appendChild(hLine);

        this.renderCommunityPoints();

        this.ideologyData.forEach(item => {
            const point = this.createPoint(item);
            point.onclick = () => this.showModal(item);
            mapArea.appendChild(point);
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

    async fetchCommunityData() {
        try {
            const response = await fetch(COMMUNITY_DATA_URL);
            const csvText = await response.text();
            const rows = csvText.split('\n').slice(1);
            this.communityData = rows.map(row => {
                const cols = row.split(',');
                return { x: parseFloat(cols[1]), y: parseFloat(cols[2]) };
            }).filter(pos => !isNaN(pos.x) && !isNaN(pos.y));
            this.renderCommunityPoints();
        } catch (error) {
            console.error('無法讀取全網歷史數據:', error);
        }
    },

    renderCommunityPoints() {
        const canvas = document.getElementById('community-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (!this.showCommunityPoints || this.communityData.length === 0) return;

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
            const canvasX = ((safeX + COORD_MAX) / COORD_RANGE) * canvas.width;
            const canvasY = ((COORD_MAX - safeY) / COORD_RANGE) * canvas.height;
            let color = colors.primary;
            if (safeX < 0 && safeY > 0) color = colors.authLeft;
            else if (safeX >= 0 && safeY > 0) color = colors.authRight;
            else if (safeX < 0 && safeY <= 0) color = colors.libLeft;
            else if (safeX >= 0 && safeY <= 0) color = colors.libRight;
            ctx.beginPath();
            ctx.arc(canvasX, canvasY, 4, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.globalAlpha = 0.4;
            ctx.fill();
        });
    },

    applyFilters() {
        this.renderedPoints.forEach(p => {
            const item = p.data;
            const type = (item.type || 'ideology').toLowerCase();
            let typeMatch = true;
            if (type === 'figure' && !this.showFigures) typeMatch = false;
            if (type === 'party' && !this.showParties) typeMatch = false;
            
            const itemTags = item.tags || []; 
            const tagMatch = this.activeFilters.size === 0 || itemTags.some(tagObj => {
                // 統一使用中文 Key 進行匹配檢查
                const zhKey = typeof tagObj === 'object' ? tagObj.zh : tagObj;
                return this.activeFilters.has(zhKey);
            });
            
            if (typeMatch && tagMatch) {
                p.element.classList.remove('filtered-out');
                p.element.style.pointerEvents = 'auto';
            } else {
                p.element.classList.add('filtered-out');
                p.element.style.pointerEvents = 'none';
            }
        });
    },

    showUserResult(x, y) {
        const mapArea = document.getElementById('map-area');
        const oldMarker = document.getElementById('user-marker');
        if (oldMarker) oldMarker.remove(); // 移除舊的用戶標記
        const point = this.createPoint({ x, y, ideology: i18n[this.currentLang].userLocation }); // 使用 i18n 翻譯
        point.id = 'user-marker';
        point.classList.add('user-point');
        mapArea.appendChild(point);
        this.focusOn(x, y, 1.5);
    },

    focusOn(x, y, targetScale = 1.8) {
        this.enableTransition();
        const safeX = Math.max(-COORD_MAX, Math.min(COORD_MAX, x));
        const safeY = Math.max(-COORD_MAX, Math.min(COORD_MAX, y));
        this.scale = targetScale;
        this.translateX = -safeX * PIXELS_PER_UNIT * this.scale;
        this.translateY = safeY * PIXELS_PER_UNIT * this.scale;
        this.updateTransform();
        const targetPoint = this.renderedPoints.find(p => p.data.x === x && p.data.y === y);
        if (targetPoint) {
            const el = targetPoint.element;
            el.classList.add('search-focus-ping');
            setTimeout(() => el.classList.remove('search-focus-ping'), 3000);
        }
    },

    createPoint(item) {
        const { x, y, category, type, avatar } = item;
        const ideology = getI18nText(item, 'ideology', this.currentLang); // 這裡已經處理了 data.json 的 i18n
        const normalizedType = (type || 'ideology').toLowerCase();
        const point = document.createElement('div');
        point.className = 'map-point';
        point.classList.add('type-' + normalizedType);

        const avatarUrl = (avatar || '').toString().trim();
        const hasValidAvatar = avatarUrl !== "" && 
                               !['null', 'undefined', 'none', 'false'].includes(avatarUrl.toLowerCase());

        if (normalizedType !== 'ideology') {
            point.classList.add('highlight-point');
            const badge = document.createElement('div');
            badge.className = 'point-badge';
            if (normalizedType === 'figure') {
                badge.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`;
            } else if (normalizedType === 'party') {
                badge.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/></svg>`;
            }
            point.appendChild(badge);
        }

        if (category) {
            const pointClass = 'point-' + category.toLowerCase().replace(/\s+/g, '-');
            point.classList.add(pointClass);
        }

        if (hasValidAvatar) {
            const proxiedUrl = getProxiedImageUrl(avatarUrl, true);
            const img = new Image();
            img.onload = () => {
                point.style.backgroundImage = `url('${proxiedUrl}')`;
                point.style.backgroundSize = 'cover';
                point.style.backgroundPosition = 'center';
                point.classList.add('has-avatar');
                point.classList.remove('is-placeholder');
            };
            img.onerror = () => {
                this.applyPlaceholder(point, ideology);
            };
            img.src = proxiedUrl;
        } else if (normalizedType !== 'ideology') {
            this.applyPlaceholder(point, ideology);
        }

        const safeX = Math.max(-COORD_MAX, Math.min(COORD_MAX, x));
        const safeY = Math.max(-COORD_MAX, Math.min(COORD_MAX, y));
        point.style.left = `${((safeX + COORD_MAX) / COORD_RANGE) * 100}%`;
        point.style.top = `${((-safeY + COORD_MAX) / COORD_RANGE) * 100}%`;
        point.title = ideology;

        const label = document.createElement('span');
        label.className = 'map-point-label';
        label.innerText = ideology;
        point.appendChild(label);

        return point;
    },

    applyPlaceholder(el, name) {
        const { color, initial } = getPlaceholderStyle(name);
        el.style.backgroundColor = color;
        el.classList.add('is-placeholder');
        el.setAttribute('data-initial', initial);
    },

    showModal(item) {
        // --- 第一部分：文字內容填充 ---
        document.getElementById('modal-title').innerText = getI18nText(item, 'ideology', this.currentLang);
        const categoryText = getI18nText(item, 'category', this.currentLang) || '未分類';
        const categoryEl = document.getElementById('modal-category'); // 這裡的 categoryText 已經處理了 data.json 的 i18n
        categoryEl.innerText = categoryText;
        const categoryClass = 'tag-' + categoryText.toLowerCase().replace(/\s+/g, '-');
        categoryEl.className = 'category-tag ' + categoryClass;

        // --- 第二部分：彈窗圖片渲染（對齊 modal.css 的 .has-content 機制） ---
        const imgEl = document.getElementById('modal-image');
        const imgSlot = document.getElementById('modal-image-slot');
        
        // 1. 【絕對初始化】
        // 立即物理性隱藏槽位並移除所有殘留徽章，確保「無照片」時文字直接靠頂
        if (imgSlot) {
            imgSlot.classList.remove('has-content'); // 恢復 CSS 預設的 display: none
            imgSlot.style.backgroundColor = 'transparent';
            imgSlot.style.backgroundImage = 'none'; // 保持上一動校正：抹除行內背景圖
            imgSlot.querySelectorAll('.modal-placeholder').forEach(el => el.remove());
        }

        // 2. 清理圖片標籤本身的所有狀態
        if (imgEl) {
            imgEl.style.display = 'none';
            imgEl.onerror = null;
            imgEl.onload = null;
            imgEl.src = '';
            imgEl.removeAttribute('src');
        }

        // 3. 【嚴格頭像校驗】
        const avatarUrl = (item.avatar || '').toString().trim();
        const hasValidAvatar = avatarUrl !== "" && 
                               !['null', 'undefined', 'none', 'false'].includes(avatarUrl.toLowerCase());

        if (hasValidAvatar) {
            const proxiedUrl = getProxiedImageUrl(avatarUrl, false);
            imgEl.crossOrigin = "anonymous";
            
            // 只有「確定圖片像素已成功下載」，才加上 .has-content 打開 Slot 容器
            imgEl.onload = () => {
                imgSlot.classList.add('has-content'); // 👈 對齊 CSS，解鎖顯示！
                imgEl.style.display = 'block';
            };
            
            // 只有「原本有網址但失效（破圖）」時，才安全降級為徽章
            imgEl.onerror = () => {
                imgSlot.classList.add('has-content'); // 👈 破圖也需要加上類名來顯示徽章容器
                imgEl.style.display = 'none';
                this.injectModalPlaceholder(imgEl, item.ideology);
            };

            imgEl.src = proxiedUrl;
        } else {
            // avatar 不存在 (如胡安·庇隆、美國共和黨、艾茵·蘭德)：
            // 保持 imgSlot 沒有 .has-content，觸發 CSS 的 display: none !important。
            // 這樣文字區域會自動向上流動，完美靠頂，絕不留大色塊。
        }

        // --- 第三部分：其餘資料顯示 ---
        document.getElementById('modal-desc').innerText = getI18nText(item, 'description', this.currentLang) || i18n[this.currentLang].noDesc;
        document.getElementById('modal-history').innerText = getI18nText(item, 'history', this.currentLang) || i18n[this.currentLang].noHistory;
        document.getElementById('modal-score-x').innerText = item.x;
        document.getElementById('modal-score-y').innerText = item.y;

        document.getElementById('ideology-modal')?.classList.add('active');
    },

    closeModal() {
        document.getElementById('ideology-modal')?.classList.remove('active');
    },

    injectModalPlaceholder(targetImg, name) {
        // 確保不會重複注入
        const container = targetImg.parentElement;
        if (container.querySelector('.modal-placeholder')) return;
        
        const { color, initial } = getPlaceholderStyle(name);
        const placeholder = document.createElement('div');
        placeholder.className = 'modal-placeholder';
        placeholder.style.backgroundColor = color;
        placeholder.setAttribute('data-initial', initial);
        container.insertBefore(placeholder, targetImg);
    }
};