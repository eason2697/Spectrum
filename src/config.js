/**
 * 專案全域配置
 */
export const DEFAULT_SCALE = 0.3;
export const MAP_SIZE = 3000; // 畫布總尺寸 (px)
export const COORD_MAX = 100; // 坐標最大值
export const COORD_RANGE = COORD_MAX * 2; // 總量程 (200)
export const PIXELS_PER_UNIT = MAP_SIZE / COORD_RANGE; // 每 1 單位坐標對應的像素

export const COMMUNITY_DATA_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR63yn8Fj_lQWN4WKVOO4DDlh5VGOAolux8Kv4nMtmP4O8Jqv6b1qjPDwwvRDskJ2RnN_KPMr1rl0cO/pub?output=csv';
export const GOOGLE_FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSdvRrR0fGcTauYY6imJlJMpZo9jx-8Bz8-C3k9ohRbu_YxiBA/formResponse';