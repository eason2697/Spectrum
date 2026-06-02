import { quizLogic } from './quiz.js';
import { mapLogic } from './map.js';

const app = {
    data: [],

    async init() {
        try {
            const response = await fetch('data/data.json');
            if (!response.ok) throw new Error('無法讀取資料檔');
            this.data = await response.json();
            
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

    switchView(viewId) {
        document.querySelectorAll('.view').forEach(el => el.classList.remove('active'));
        document.getElementById(viewId).classList.add('active');
        this.closeSidebar(); // 切換視圖時自動收起手機版側邊欄
    },

    startQuiz() {
        if (this.data.length === 0) {
            alert('資料尚未載入完成');
            return;
        }
        this.switchView('quiz-view');
        quizLogic.init(this.data);
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