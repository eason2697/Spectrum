/**
 * 政治思想測驗 - 邏輯模組
 */
import { i18n, getI18nText } from './i18n.js';
export const quizLogic = {
    questions: [],
    currentQuestion: 0,
    userScore: { x: 0, y: 0 },
    scoreHistory: [],
    ideologyData: [],
    isAnimating: false,
    isReverse: false,

    init(ideologyData, questions) {
        this.ideologyData = ideologyData;
        this.questions = questions ? [...questions] : [];
        this.currentQuestion = 0;
        this.userScore = { x: 0, y: 0 };
        this.scoreHistory = [];
        this.isAnimating = false;
        this.isReverse = false;

        // 隨機打亂題目順序 (Fisher-Yates Shuffle 演算法)
        for (let i = this.questions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.questions[i], this.questions[j]] = [this.questions[j], this.questions[i]];
        }
        
        this.render();
    },

    render() {
        const quizContainer = document.getElementById('quiz-container');
        if (!quizContainer) return;
        
        quizContainer.innerHTML = '';
        const index = this.currentQuestion;
        const q = this.questions[index];
        const lang = window.mapLogic.currentLang; // 獲取當前語言
        
        const progressFill = document.getElementById('progress-fill');
        if (progressFill) progressFill.style.width = ((index / this.questions.length) * 100) + '%';
        
        const box = document.createElement('div');
        const enterClass = this.isReverse ? 'animate-enter-reverse' : 'animate-enter';
        box.className = `question-box active ${enterClass}`;
        box.innerHTML = `
            <div class="question-number">${i18n[lang].questionPrefix} ${index + 1} / ${this.questions.length} ${i18n[lang].questionSuffix}</div>
            <div class="question-text">${getI18nText(q, 'text', lang)}</div>
            <div class="quiz-options">
                <button class="btn btn-strongly-agree" onclick="window.quizLogic.answer(1)">${i18n[lang].stronglyLike}</button>
                <button class="btn btn-agree" onclick="window.quizLogic.answer(0.6)">${i18n[lang].like}</button>
                <button class="btn btn-neutral" onclick="window.quizLogic.answer(0)">${i18n[lang].neutralSkip}</button>
                <button class="btn btn-disagree" onclick="window.quizLogic.answer(-0.6)">${i18n[lang].dislike}</button>
                <button class="btn btn-strongly-disagree" onclick="window.quizLogic.answer(-1)">${i18n[lang].stronglyDislike}</button>
            </div>
            
            <div class="quiz-controls">
                ${index > 0 ? `<button class="btn btn-secondary" onclick="window.quizLogic.prev()">${i18n[lang].prevQuestion}</button>` : ''}
                <button class="btn btn-secondary" onclick="window.app.startQuiz()">${i18n[lang].resetQuiz}</button>
                <button class="btn btn-secondary" onclick="window.quizLogic.skip()">${i18n[lang].skipQuiz}</button>
            </div>
        `;
        quizContainer.appendChild(box);
    },

    answer(multiplier) {
        if (this.isAnimating) return; // 防止動畫期間重複點擊
        this.isAnimating = true;

        const box = document.querySelector('.question-box');
        if (box) {
            box.classList.remove('animate-enter', 'animate-enter-reverse');
            box.classList.add('animate-leave'); // 觸發滑出動畫
        }

        // 延遲更新畫面，等待 CSS 動畫結束 (0.25 秒)
        setTimeout(() => {
            const q = this.questions[this.currentQuestion];
            this.scoreHistory.push({ x: this.userScore.x, y: this.userScore.y });
            this.userScore.x += q.effect_x * multiplier;
            this.userScore.y += q.effect_y * multiplier;
            this.currentQuestion++;
            
            this.isAnimating = false;
            if (this.currentQuestion < this.questions.length) {
                this.render();
            } else {
                this.showResult();
            }
        }, 250);
    },

    prev() {
        if (this.isAnimating) return;
        if (this.currentQuestion > 0) {
            this.isAnimating = true;
            const box = document.querySelector('.question-box');
            if (box) {
                box.classList.remove('animate-enter', 'animate-enter-reverse');
                box.classList.add('animate-leave-reverse'); // 觸發反向滑出動畫
            }
            setTimeout(() => {
                this.currentQuestion--;
                const last = this.scoreHistory.pop();
                this.userScore.x = last.x;
                this.userScore.y = last.y;
                this.isAnimating = false;
                this.isReverse = true;
                this.render();
                this.isReverse = false; // 恢復預設方向
            }, 250);
        }
    },

    skip() {
        window.app.switchView('map-view');
    },

    showResult() {
        window.app.switchView('result-view');
        const resBox = document.getElementById('result-box');
        if (resBox) resBox.classList.add('animate-enter');

        const scoreX = Math.max(-100, Math.min(100, this.userScore.x));
        const scoreY = Math.max(-100, Math.min(100, this.userScore.y));

        document.getElementById('score-x').innerText = scoreX.toFixed(1);
        document.getElementById('score-y').innerText = scoreY.toFixed(1);

        // 將本次結果存入 localStorage
        if (window.app && window.app.saveUserResult) {
            window.app.saveUserResult(scoreX, scoreY);
        }

        // 更新進度條游標位置 (將 -100 ~ 100 映射為 0% ~ 100%)
        const percentX = (scoreX + 100) / 2;
        const percentY = (scoreY + 100) / 2;
        const markerX = document.getElementById('score-x-marker');
        const markerY = document.getElementById('score-y-marker');
        if (markerX) markerX.style.left = `${percentX}%`;
        if (markerY) markerY.style.left = `${percentY}%`;

        // 計算與所有思想點的距離並由近到遠排序
        let distances = this.ideologyData.map(item => ({
            ...item,
            distance: Math.sqrt((scoreX - item.x) ** 2 + (scoreY - item.y) ** 2)
        }));
        distances.sort((a, b) => a.distance - b.distance);
        
        const closest = distances[0];
        const ideologyLabel = document.getElementById('closest-ideology');
        const lang = window.mapLogic.currentLang;
        
        if (closest) {
            ideologyLabel.innerText = getI18nText(closest, 'ideology', lang);
            
            // 建立類別與 CSS 變數的映射表
            const colorMap = {
                'Authoritarian Left': '--color-auth-left',
                'Authoritarian Right': '--color-auth-right',
                'Libertarian Left': '--color-lib-left',
                'Libertarian Right': '--color-lib-right'
            };
            ideologyLabel.style.color = `var(${colorMap[closest.category] || '--primary'})`;
        }

        const topList = document.getElementById('top-ideologies-list');
        if (topList && distances.length >= 3) {
            const name2 = getI18nText(distances[1], 'ideology', lang);
            const name3 = getI18nText(distances[2], 'ideology', lang);
            topList.innerHTML = `
                <div style="margin-bottom: 8px; color: var(--secondary-hover);">🥈 ${i18n[lang].secondMatch}：<strong>${name2}</strong></div>
                <div style="color: var(--secondary-hover);">🥉 ${i18n[lang].thirdMatch}：<strong>${name3}</strong></div>
            `;
        }
    },

    share(platform) {
        const ideology = document.getElementById('closest-ideology').innerText;
        const x = document.getElementById('score-x').innerText;
        const y = document.getElementById('score-y').innerText;
        const lang = window.mapLogic.currentLang;
        const text = `${i18n[lang].closestMatch.replace('：', '')}「${ideology}」！(${i18n[lang].ecoLabel.split(' ')[0]}: ${x}, ${i18n[lang].polLabel.split(' ')[0]}: ${y})\n${i18n[lang].siteSubTitle}：${window.location.href}`;
        
        const urls = {
            line: `https://line.me/R/msg/text/?${encodeURIComponent(text)}`,
            threads: `https://www.threads.net/intent/post?text=${encodeURIComponent(text)}`,
            copy: 'copy'
        };

        if (platform === 'copy') {
            navigator.clipboard.writeText(text).then(() => alert(i18n[lang].shareCopyText));
        } else if (urls[platform]) {
            window.open(urls[platform], '_blank');
        } else if (platform === 'ig') {
            alert(i18n[lang].shareIGWarning);
            navigator.clipboard.writeText(text);
        }
    }
};