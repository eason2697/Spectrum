import { quizLogic } from './quiz.js';
import { mapLogic } from './map.js';

const app = {
    data: [],
    quizQuestions: [],
    // 模塊化配置：方便未來新增功能卡片
    features: [
        {
            id: 'quiz',
            title: '思想傾向測驗',
            desc: '透過系列問答，定位你在政治與經濟光譜上的位置。',
            icon: '<svg viewBox="0 0 24 24" width="48" height="48" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>',
            action: () => window.app.startQuiz()
        },
        {
            id: 'map',
            title: '意識形態地圖',
            desc: '直觀瀏覽各項政治思想分佈，查看詳細的核心理念與背景。',
            icon: '<svg viewBox="0 0 24 24" width="48" height="48" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"></polygon><line x1="9" y1="3" x2="9" y2="18"></line><line x1="15" y1="6" x2="15" y2="21"></line></svg>',
            action: () => window.app.switchView('map-view')
        }
    ],

    async init() {
        try {
            const response = await fetch('data/data.json');
            if (!response.ok) throw new Error('無法讀取資料檔');
            const jsonData = await response.json();
            
            // 支援新舊格式相容性：如果是舊版 Array 則直接賦值，新版則讀取 ideologies 鍵值
            this.data = jsonData.ideologies || (Array.isArray(jsonData) ? jsonData : []);
            this.quizQuestions = jsonData.questions || [];
            
            // 渲染首頁卡片
            this.renderHome();

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
        } catch (error) {
            console.error('資料載入失敗:', error);
            alert('無法載入政治思想資料庫，請確認 data/data.json 是否存在。');
        }
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

        grid.innerHTML = this.features.map(feat => `
            <div class="app-card" onclick="window.app.handleFeatureClick('${feat.id}')">
                <div class="app-card-icon">${feat.icon}</div>
                <div class="app-card-content">
                    <h3>${feat.title}</h3>
                    <p>${feat.desc}</p>
                    <div class="app-card-footer">立即進入 →</div>
                </div>
            </div>
        `).join('');
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
        const FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSdvRrR0fGcTauYY6imJlJMpZo9jx-8Bz8-C3k9ohRbu_YxiBA/formResponse';
        const formData = new URLSearchParams();
        
        // 對應 Google 表單的 Entry ID
        formData.append('entry.71681822', x);
        formData.append('entry.1460016217', y);

        try {
            // 使用 no-cors 模式繞過 Google 表單的 CORS 限制（POST 會成功但無法讀取 Response）
            await fetch(FORM_URL, {
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
        document.getElementById('app-sidebar').classList.toggle('open');
    },

    closeSidebar() {
        // 只有在手機版（螢幕寬度小於 769px）時，切換頁面才自動收合側邊欄
        if (window.innerWidth < 769) {
            const sidebar = document.getElementById('app-sidebar');
            if (sidebar) sidebar.classList.remove('open');
        }
    },

    shareWebsite() {
        const text = `來看看這個政治思想測驗與光譜地圖吧！\n${window.location.origin}${window.location.pathname}`;
        navigator.clipboard.writeText(text).then(() => alert('網站連結已複製到剪貼簿！'));
    }
};

document.addEventListener('DOMContentLoaded', () => app.init());