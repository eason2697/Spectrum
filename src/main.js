import { quizLogic } from './quiz.js';
import { mapLogic } from './map.js';
import { i18n } from './i18n.js';
import { GOOGLE_FORM_URL } from './config.js';

const app = {
    data: [],
    quizQuestions: [],
    // 模塊化配置：方便未來新增功能卡片
    features: [
        {
            id: 'quiz',
            titleKey: 'quizFeatureTitle', // 使用 i18n key
            descKey: 'quizFeatureDesc',   // 使用 i18n key
            icon: '<svg viewBox="0 0 24 24" width="48" height="48" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>',
            action: () => window.app.startQuiz()
        },
        {
            id: 'map',
            titleKey: 'mapFeatureTitle', // 使用 i18n key
            descKey: 'mapFeatureDesc',   // 使用 i18n key
            icon: '<svg viewBox="0 0 24 24" width="48" height="48" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"></polygon><line x1="9" y1="3" x2="9" y2="18"></line><line x1="15" y1="6" x2="15" y2="21"></line></svg>',
            action: () => window.app.switchView('map-view')
        }
    ],

    async init() {
        try {
            const response = await fetch('data/data.json');
            if (!response.ok) throw new Error('無法讀取資料檔');
            const jsonData = await response.json();
            
            // 模組化數據處理：分別提取思想點與特殊實體 (如歷史人物、政黨)
            const ideologies = jsonData.ideologies || (Array.isArray(jsonData) ? jsonData : []);
            const specialEntities = jsonData.special_entities || [];
            
            // 合併所有資料供地圖渲染與搜尋功能使用，確保搜尋列能搜尋到人物與政黨
            this.data = [...ideologies, ...specialEntities];
            this.quizQuestions = jsonData.questions || [];
            
            // 渲染首頁卡片
            this.renderHome();

            // 初始化側邊欄事件代理，修復按鈕失效問題
            this.initSidebarDelegation();

            // 初始化模組
            mapLogic.init(this.data);
            
            // 綁定全域變數，以便 HTML 中直接透過 onclick 調用
            window.quizLogic = quizLogic;
            window.mapLogic = mapLogic;
            window.app = this;
            
            // 如果是桌面版大螢幕，預設將側邊欄展開
            if (window.innerWidth >= 769) {
                document.getElementById('app-sidebar').classList.add('open');
            }
            
            // 點擊彈出視窗外的半透明背景時，自動關閉視窗
            const modal = document.getElementById('ideology-modal');
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal();
                }
            });

            // 綁定語系切換按鈕
            // 首次載入時，根據當前語系更新按鈕文字
            const langToggleBtn = document.getElementById('lang-toggle-btn');
            if (langToggleBtn) langToggleBtn.innerText = mapLogic.currentLang === 'zh' ? 'EN / 中文' : '中文 / EN';

            document.getElementById('lang-toggle-btn').addEventListener('click', () => {
                this.toggleLanguage();
            });
        } catch (error) {
            console.error('資料載入失敗:', error);
            alert('無法載入政治思想資料庫，請確認 data/data.json 是否存在。');
        }
    },

    /**
     * 實作事件代理：統一攔截側邊欄點擊行為
     */
    initSidebarDelegation() {
        const sidebar = document.getElementById('app-sidebar');
        const toggleBtn = document.getElementById('sidebar-toggle-btn');

        // 獨立為外部按鈕綁定點擊事件
        if (toggleBtn) {
            toggleBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleSidebar();
            });
        }

        if (!sidebar) return;

        sidebar.addEventListener('click', (e) => {
            // 攔截側邊欄內的導航按鈕或標題區域
            const btn = e.target.closest('.btn-sidebar, .sidebar-brand');
            if (!btn) return;

            try {
                // 2. 處理視圖切換 (根據 HTML data-view 屬性)
                const targetView = btn.getAttribute('data-view');
                if (targetView) {
                    this.switchView(targetView);
                    return;
                }

                // 3. 處理特殊功能邏輯
                if (btn.id === 'sidebar-btn-quiz') {
                    this.startQuiz();
                } else if (btn.id === 'sidebar-btn-share') {
                    this.shareWebsite();
                }

            } catch (error) {
                console.error(`[SPA Framework Error] 執行側邊欄功能 (${btn.id || 'unknown'}) 時發生錯誤:`, error);
            }
        });
    },

    toggleLanguage() {
        const newLang = mapLogic.currentLang === 'zh' ? 'en' : 'zh';
        mapLogic.currentLang = newLang;
        this.updateStaticTexts();
        mapLogic.renderMap(); // 重新渲染地圖上的點
        mapLogic.initFilters(); // 重新渲染標籤
        this.renderHome(); // 重新渲染首頁卡片
    },

    updateStaticTexts() {
        const lang = mapLogic.currentLang;
        // 更新所有帶有 data-i18n 屬性的元素
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (i18n[lang][key]) el.innerText = i18n[lang][key];
        });
        // 更新所有帶有 data-i18n-title 屬性的元素
        document.querySelectorAll('[data-i18n-title]').forEach(el => {
            const key = el.getAttribute('data-i18n-title');
            if (i18n[lang][key]) el.title = i18n[lang][key];
        });
        // 更新特殊元素，如 title 和 placeholder
        document.title = i18n[lang].siteTitle;
        document.getElementById('map-search-input').placeholder = i18n[lang].searchPlaceholder;
        document.getElementById('lang-toggle-btn').innerText = lang === 'zh' ? 'EN / 中文' : '中文 / EN';
    },

    handleFeatureClick(id) {
        const feature = this.features.find(f => f.id === id);
        if (feature && typeof feature.action === 'function') {
            feature.action();
        }
    },

    renderHome() {
        const grid = document.getElementById('app-grid');
        if (!grid) return;

        const lang = mapLogic.currentLang;
        grid.innerHTML = this.features.map(feat => {
            const title = i18n[lang][feat.titleKey] || feat.title; // 優先使用 i18n，否則回退到原始 title
            const desc = i18n[lang][feat.descKey] || feat.desc;     // 優先使用 i18n，否則回退到原始 desc
            const enterNowText = i18n[lang].enterNow;
            return `
            <div class="app-card" onclick="window.app.handleFeatureClick('${feat.id}')">
                <div class="app-card-icon">${feat.icon}</div>
                <div class="app-card-content">
                    <h3>${title}</h3>
                    <p>${desc}</p>
                    <div class="app-card-footer">${enterNowText}</div>
                </div>
            </div>
            `;
        }).join('');
    },

    switchView(viewId) {
        document.querySelectorAll('.view').forEach(el => el.classList.remove('active'));
        document.getElementById(viewId).classList.add('active');

        // 重置動畫類別，避免殘留
        document.querySelectorAll('.animate-enter').forEach(el => el.style.animation = 'none');

        // 定義各個 View 對應的 UI 狀態 (模組化配置)
        const uiStateConfig = {
            'home-view':   { filter: 'none',  home: 'none', map: 'flex', quiz: 'flex' },
            'map-view':    { filter: 'block', home: 'flex', map: 'none', quiz: 'flex' },
            'quiz-view':   { filter: 'none',  home: 'flex', map: 'flex', quiz: 'none' },
            'result-view': { filter: 'none',  home: 'flex', map: 'flex', quiz: 'none' }
        };

        const config = uiStateConfig[viewId] || uiStateConfig['home-view'];

        // 批量更新 UI 元素顯示狀態
        const uiElements = {
            'sidebar-filter-section': config.filter,
            'sidebar-btn-home': config.home,
            'sidebar-btn-map': config.map,
            'sidebar-btn-quiz': config.quiz
        };

        if (viewId === 'map-view') {
            mapLogic.renderCommunityPoints();
        }

        Object.entries(uiElements).forEach(([id, display]) => {
            const el = document.getElementById(id);
            if (el) el.style.display = display;
        });

        this.closeSidebar(); // 切換視圖時自動收起手機版側邊欄
    },

    startQuiz() {
        if (this.data.length === 0) {
            alert('資料尚未載入完成');
            return;
        }
        this.switchView('quiz-view');
        quizLogic.init(this.data, this.quizQuestions);
    },

    /**
     * 將結果上傳至 Google 表單 (Serverless Backend)
     */
    async saveUserResult(x, y) {
        const formData = new URLSearchParams();
        
        // 對應 Google 表單的 Entry ID
        formData.append('entry.71681822', x);
        formData.append('entry.1460016217', y);

        try {
            // 使用 no-cors 模式繞過 Google 表單的 CORS 限制（POST 會成功但無法讀取 Response）
            await fetch(GOOGLE_FORM_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: formData
            });
            console.log('數據已成功傳送至雲端：', { x, y });
        } catch (error) {
            console.error('雲端儲存失敗:', error);
        }
    },

    toggleCommunityPoints(isVisible) {
        mapLogic.showCommunityPoints = isVisible;
        mapLogic.renderCommunityPoints();
    },

    showUserOnMap() {
        this.switchView('map-view');
        mapLogic.showUserResult(quizLogic.userScore.x, quizLogic.userScore.y);
    },

    closeModal() {
        document.getElementById('ideology-modal').classList.remove('active');
    },

    toggleSidebar() {
        const sidebar = document.getElementById('app-sidebar');
        const btn = document.getElementById('sidebar-toggle-btn');
        sidebar?.classList.toggle('open');
        btn?.classList.toggle('open'); // 同步更新按鈕狀態，以便切換圖示
    },

    closeSidebar() {
        // 只有在手機版（螢幕寬度小於 769px）時，切換頁面才自動收合側邊欄
        if (window.innerWidth < 769) {
            const sidebar = document.getElementById('app-sidebar');
            const btn = document.getElementById('sidebar-toggle-btn');
            if (sidebar) sidebar.classList.remove('open');
            if (btn) btn.classList.remove('open');
        }
    },

    shareWebsite() {
        // 使用 window.location.href 並過濾掉雜訊（如 hash 或 query），確保連結乾淨
        const siteUrl = window.location.origin + window.location.pathname;
        const text = `${i18n[mapLogic.currentLang].siteSubTitle}！\n${siteUrl}`; // 使用 i18n 的副標題作為分享文案
        navigator.clipboard.writeText(text).then(() => alert(i18n[mapLogic.currentLang].shareSiteText));
    }
};

document.addEventListener('DOMContentLoaded', () => app.init());