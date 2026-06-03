/**
 * 介面靜態文字字典
 */
export const i18n = {
    zh: {
        siteTitle: "政治思想工具箱",
        siteSubTitle: "探索、測驗並分析各種政治意識形態",
        searchPlaceholder: "搜尋政治思想...",
        filterTitle: "探索篩選",
        toggleCommunity: "顯示群體落點分析",
        toggleFigures: "顯示歷史人物",
        toggleParties: "顯示當代政黨",
        homeBtn: "首頁",
        mapBtn: "查看地圖",
        quizBtn: "進入測驗",
        shareBtn: "分享網站",
        coreIdeology: "核心理念",
        historyBack: "歷史背景",
        scoreX: "經濟評分",
        scoreY: "政治評分",
        searchGoogle: "在網路上搜尋",
        noDesc: "暫無敘述",
        noHistory: "無相關歷史資料",
        closestMatch: "最貼近您的政治思想是：",
        resultTitle: "測驗結果",
        viewOnMap: "在地圖上查看我的位置",
        ecoLabel: "經濟傾向 (左 - 右)",
        polLabel: "政治傾向 (自由 - 威權)",
        secondMatch: "第二相似",
        thirdMatch: "第三相似"
        ,
        // 新增：首頁功能卡片
        quizFeatureTitle: "思想傾向測驗",
        quizFeatureDesc: "透過系列問答，定位你在政治與經濟光譜上的位置。",
        mapFeatureTitle: "意識形態地圖",
        mapFeatureDesc: "直觀瀏覽各項政治思想分佈，查看詳細的核心理念與背景。",
        enterNow: "立即進入 →",
        // 新增：測驗頁面
        questionPrefix: "第",
        questionSuffix: "題",
        stronglyLike: "強烈喜歡",
        like: "喜歡",
        neutralSkip: "中立 / 跳過",
        dislike: "不喜歡",
        stronglyDislike: "強烈不喜歡",
        prevQuestion: "🔙 上一題",
        resetQuiz: "🔄 重置",
        skipQuiz: "🗺️ 跳過測驗",
        // 新增：分享功能
        shareResult: "分享你的結果：",
        shareCopyText: "已複製到剪貼簿！",
        shareIGText: "IG / 複製文本",
        shareIGWarning: "Instagram 不支援直接分享文字，已將結果複製到剪貼簿，您可以直接貼上。",
        shareSiteText: "網站連結已複製到剪貼簿！",
        // 新增：地圖軸線與圖例
        axisAuth: "威權 (收緊)",
        axisLib: "自由 (放寬)",
        axisLeft: "社會主義 (左)",
        axisRight: "資本主義 (右)",
        mapLegendTitle: "圖例",
        legendAuthLeft: "威權左派",
        legendAuthRight: "威權右派",
        legendLibLeft: "自由左派",
        legendLibRight: "自由右派",
        legendIdeologyPoint: "政治思想點",
        legendYourLocation: "你的位置",
        mapZoomIn: "放大",
        mapZoomOut: "縮小",
        mapResetView: "重置視角",
        mapReset: "重置",
        userLocation: "你的位置"
    },
    en: {
        siteTitle: "Ideology Toolbox",
        siteSubTitle: "Explore, test, and analyze various political ideologies",
        searchPlaceholder: "Search ideologies...",
        filterTitle: "Exploration Filters",
        toggleCommunity: "Show Community Data",
        toggleFigures: "Show Historical Figures",
        toggleParties: "Show Contemporary Parties",
        homeBtn: "Home", // 保持 Home
        mapBtn: "View Map",
        quizBtn: "Take Quiz",
        shareBtn: "Share Site",
        coreIdeology: "Core Ideology",
        historyBack: "Historical Context",
        scoreX: "Economic Score",
        scoreY: "Political Score",
        searchGoogle: "Search on Google",
        noDesc: "No description available",
        noHistory: "No historical data available",
        closestMatch: "Your closest match is:",
        resultTitle: "Quiz Result",
        viewOnMap: "View my position on map",
        ecoLabel: "Economic Axis (Left - Right)",
        polLabel: "Political Axis (Lib - Auth)",
        secondMatch: "2nd Match",
        thirdMatch: "3rd Match"
        ,
        // New: Home Page Feature Cards
        quizFeatureTitle: "Ideology Test",
        quizFeatureDesc: "Answer questions to pinpoint your position on the political and economic spectrum.",
        mapFeatureTitle: "Ideology Map",
        mapFeatureDesc: "Visually explore political ideologies, their core tenets, and historical context.",
        enterNow: "Enter Now →",
        // New: Quiz Page
        questionPrefix: "Q",
        questionSuffix: "", // English usually doesn't need a suffix like "題"
        stronglyLike: "Strongly Agree",
        like: "Agree",
        neutralSkip: "Neutral / Skip",
        dislike: "Disagree",
        stronglyDislike: "Strongly Disagree",
        prevQuestion: "🔙 Previous",
        resetQuiz: "🔄 Reset",
        skipQuiz: "🗺️ Skip Quiz",
        // New: Share Functionality
        shareResult: "Share your result:",
        shareCopyText: "Copied to clipboard!",
        shareIGText: "IG / Copy Text",
        shareIGWarning: "Instagram does not support direct text sharing. Your result has been copied to the clipboard, you can paste it directly.",
        shareSiteText: "Website link copied to clipboard!",
        // New: Map Axis and Legend
        axisAuth: "Authoritarian (Strict)",
        axisLib: "Libertarian (Free)",
        axisLeft: "Socialist (Left)",
        axisRight: "Capitalist (Right)",
        mapLegendTitle: "Legend",
        legendAuthLeft: "Authoritarian Left",
        legendAuthRight: "Authoritarian Right",
        legendLibLeft: "Libertarian Left",
        legendLibRight: "Libertarian Right",
        legendIdeologyPoint: "Ideology Point",
        legendYourLocation: "Your Location",
        mapZoomIn: "Zoom In",
        mapZoomOut: "Zoom Out",
        mapResetView: "Reset View",
        mapReset: "Reset",
        userLocation: "Your Location"
    }
};

export const getI18nText = (item, field, lang) => {
    if (!item || !item[field]) return "";
    const value = item[field];
    // 核心相容邏輯：如果是物件則取語系，否則視為舊有字串（中文降級）
    if (typeof value === 'object' && value !== null) {
        return value[lang] || value['zh'] || "";
    }
    return value;
};