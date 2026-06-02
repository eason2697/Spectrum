/**
 * 圖片代理服務：處理圖片網址並轉換為代理連結，解決 CORS 與縮圖需求
 */
export function getProxiedImageUrl(url, isThumbnail = false) {
    if (!url || typeof url !== 'string' || !url.startsWith('http')) return url;
    
    // 使用 weserv.nl 代理圖片
    let proxyUrl = `https://images.weserv.nl/?url=${encodeURIComponent(url)}`;
    
    if (isThumbnail) {
        proxyUrl += `&w=150&h=150&fit=cover&output=webp`;
    } else {
        proxyUrl += `&output=webp`;
    }
    return proxyUrl;
}

/**
 * 根據名稱生成一致性的顏色與首字母，用於生成佔位徽章
 */
export function getPlaceholderStyle(name) {
    const colors = [
        '#91a3b0', '#b4c4ae', '#e5d1d0', '#c9ada7', '#adb5bd', 
        '#8d99ae', '#bdb2ff', '#ffd6a5', '#9bf6ff', '#a0c4ff'
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    const color = colors[Math.abs(hash) % colors.length];
    return { color, initial: name.substring(0, 1) };
}