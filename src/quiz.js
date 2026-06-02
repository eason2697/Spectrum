/**
 * 政治思想測驗 - 邏輯模組
 */
export const quizLogic = {
    questions: [
        { text: "政府應該全面控制並計畫市場經濟，以確保財富平均分配。", effect_x: -20, effect_y: 5 },
        { text: "為了國家安全與社會穩定，政府監控人民的隱私是必要的。", effect_x: 0, effect_y: 20 },
        { text: "無論性別、宗教或種族，每個人都應該享有絕對的婚姻與言論自由。", effect_x: 0, effect_y: -20 },
        { text: "企業應該能夠完全自由競爭，政府不該課徵重稅或干預。", effect_x: 20, effect_y: 0 },
        { text: "應該對富人徵收重稅，以提供全民基本收入和免費醫療。", effect_x: -15, effect_y: 0 },
        { text: "毒品使用是個人選擇，政府應該將其除罪化或合法化。", effect_x: 0, effect_y: -15 },
        { text: "國家應該有強大的軍隊，並在必要時主動介入他國事務以維護利益。", effect_x: 5, effect_y: 15 },
        { text: "跨國企業的剝削是當今世界不平等的主要原因，必須受到嚴格限制。", effect_x: -15, effect_y: 5 },
        { text: "傳統價值觀和宗教道德是社會穩定的基石，政府應該予以保護和提倡。", effect_x: 0, effect_y: 15 },
        { text: "所有的土地和自然資源都應該由全體人民共同擁有，而非私人壟斷。", effect_x: -15, effect_y: 5 },
        { text: "槍枝管制只會剝奪好人保護自己的權利，符合條件的平民有權持有武器。", effect_x: 5, effect_y: -15 },
        { text: "政府應該提供更多的補貼來幫助弱勢群體，即使這意味著增加國債。", effect_x: -15, effect_y: 0 },
        { text: "任何形式的審查制度都是對言論自由的侵犯，即使是仇恨言論也不該被封禁。", effect_x: 0, effect_y: -15 },
        { text: "為了經濟發展，適度犧牲環境和放寬環保法規是可接受的。", effect_x: 15, effect_y: 0 },
        { text: "同性伴侶應該與異性伴侶享有完全相同的合法收養小孩的權利。", effect_x: 0, effect_y: -15 },
        { text: "維護法律與秩序比保障嫌疑犯的權利更重要。", effect_x: 0, effect_y: 15 },
        { text: "醫療保健是基本人權，不應該被當作營利事業來經營。", effect_x: -15, effect_y: 0 },
        { text: "自由市場的自動調節能力遠勝過政府官僚的計畫經濟。", effect_x: 15, effect_y: -5 },
        { text: "國家元首或領袖應該擁有更高的決策權，以提高施政效率。", effect_x: 0, effect_y: 15 },
        { text: "學校的教育應該交由市場和家長決定，政府不該強制規定統一課綱。", effect_x: 10, effect_y: -15 },
        { text: "工會勢力過大會阻礙企業發展，政府應該限制工會的罷工權。", effect_x: 15, effect_y: 10 },
        { text: "政府應該積極干預並打破大型企業的壟斷，以保護小商家的生存空間。", effect_x: -10, effect_y: 5 },
        { text: "無論國籍為何，所有和平的移民都應該有權自由跨越國界工作和生活。", effect_x: 5, effect_y: -15 },
        { text: "犯罪者應該受到嚴厲的懲罰，死刑是維持社會正義的必要手段。", effect_x: 0, effect_y: 15 },
        { text: "最低工資法只會導致失業率上升，應該由勞資雙方自由協商薪資。", effect_x: 15, effect_y: -5 },
        { text: "國家應該直接分配工作或提供就業保障，不允許私人企業為了利潤隨意裁員。", effect_x: -15, effect_y: 10 },
        { text: "罷工與激進的工會活動會擾亂社會秩序，應該受到政府的嚴格管控與限制。", effect_x: 10, effect_y: 15 },
        { text: "所有的道路、橋樑等基礎設施都可以交由私人公司建設與自由收費。", effect_x: 20, effect_y: -5 },
        { text: "工廠與企業應該由在裡面工作的員工民主共同管理，而不是全憑老闆或股東決定。", effect_x: -20, effect_y: -10 },
        { text: "為了防止假新聞與極端思想傳播，政府有責任過濾並審查網際網路上的資訊。", effect_x: 0, effect_y: 20 },
        { text: "房地產不該成為炒作的商品，政府應該嚴格管制房價或實行大規模的居住配給。", effect_x: -20, effect_y: 5 },
        { text: "既然個人的身體屬於自己，那麼買賣器官或是自願安樂死都不該受到法律絕對禁止。", effect_x: 10, effect_y: -20 },
        { text: "在國家遭遇重大危難或傳染病時，政府有權強制徵用平民的財產與限制人身自由。", effect_x: 0, effect_y: 20 },
        { text: "專利與智慧財產權是保護創新的關鍵，政府應該嚴格執法打擊任何盜版與抄襲行為。", effect_x: 15, effect_y: 5 },
        { text: "賣淫等性工作只要是出於成人自願，就應該被視為合法的勞動並全面除罪化。", effect_x: -5, effect_y: -15 }
    ],
    currentQuestion: 0,
    userScore: { x: 0, y: 0 },
    scoreHistory: [],
    ideologyData: [],
    isAnimating: false,
    isReverse: false,

    init(data) {
        this.ideologyData = data;
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
        
        const progressFill = document.getElementById('progress-fill');
        if (progressFill) progressFill.style.width = ((index / this.questions.length) * 100) + '%';
        
        const box = document.createElement('div');
        const enterClass = this.isReverse ? 'animate-enter-reverse' : 'animate-enter';
        box.className = `question-box active ${enterClass}`;
        box.innerHTML = `
            <div class="question-number">第 ${index + 1} / ${this.questions.length} 題</div>
            <div class="question-text">${q.text}</div>
            <div class="quiz-options">
                <button class="btn btn-strongly-agree" onclick="window.quizLogic.answer(1)">強烈喜歡</button>
                <button class="btn btn-agree" onclick="window.quizLogic.answer(0.6)">喜歡</button>
                <button class="btn btn-neutral" onclick="window.quizLogic.answer(0)">中立 / 跳過</button>
                <button class="btn btn-disagree" onclick="window.quizLogic.answer(-0.6)">不喜歡</button>
                <button class="btn btn-strongly-disagree" onclick="window.quizLogic.answer(-1)">強烈不喜歡</button>
            </div>
            
            <div class="quiz-controls">
                ${index > 0 ? `<button class="btn btn-secondary" onclick="window.quizLogic.prev()">🔙 上一題</button>` : ''}
                <button class="btn btn-secondary" onclick="window.app.startQuiz()">🔄 重置</button>
                <button class="btn btn-secondary" onclick="window.quizLogic.skip()">🗺️ 跳過測驗</button>
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
        
        document.getElementById('closest-ideology').innerText = distances[0]?.ideology || '資料載入失敗';

        const topList = document.getElementById('top-ideologies-list');
        if (topList && distances.length >= 3) {
            topList.innerHTML = `
                <div style="margin-bottom: 8px; color: var(--secondary-hover);">🥈 第二相似：<strong>${distances[1].ideology}</strong></div>
                <div style="color: var(--secondary-hover);">🥉 第三相似：<strong>${distances[2].ideology}</strong></div>
            `;
        }
    },

    share(platform) {
        const ideology = document.getElementById('closest-ideology').innerText;
        const x = document.getElementById('score-x').innerText;
        const y = document.getElementById('score-y').innerText;
        const text = `我的政治立場是「${ideology}」！(經濟: ${x}, 權力: ${y})\n測驗地址：${window.location.href}`;
        
        const urls = {
            line: `https://line.me/R/msg/text/?${encodeURIComponent(text)}`,
            threads: `https://www.threads.net/intent/post?text=${encodeURIComponent(text)}`,
            copy: 'copy'
        };

        if (platform === 'copy') {
            navigator.clipboard.writeText(text).then(() => alert('已複製到剪貼簿！'));
        } else if (urls[platform]) {
            window.open(urls[platform], '_blank');
        } else if (platform === 'ig') {
            alert('Instagram 不支援直接分享文字，已將結果複製到剪貼簿，您可以直接貼上。');
            navigator.clipboard.writeText(text);
        }
    }
};