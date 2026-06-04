/**
 * 广告控制系统
 * 支持完整的URL参数控制广告显示
 */

(function() {
    'use strict';
    
    // 广告网络类型
    const AD_NETWORKS = {
        ADSENSE: 'adsense',
        ADSTERRA: 'adsterra',
        ADMANAGER: 'gam'
    };
    
    // URL参数值
    const AD_MODES = {
        ALL: 'all',
        ADSENSE: 'adsense',
        ADSTERRA: 'adsterra',
        GAM: 'gam',
        NONE: 'none'
    };
    
    // 获取当前广告模式
    function getAdMode() {
        // 如果 AdConfig 存在且被禁用，直接返回 NONE
        if (window.AdConfig && window.AdConfig.enabled === false) {
            return AD_MODES.NONE;
        }

        const urlParams = new URLSearchParams(window.location.search);
        let mode = urlParams.get('ads');
        
        // 如果 URL 参数没指定，尝试从 AdConfig 获取
        if (!mode && window.AdConfig) {
            // 如果 activePlatform 为 null，则视为 none 模式（不显示广告）
            if (window.AdConfig.activePlatform === null) {
                return AD_MODES.NONE;
            }
            // 如果 activePlatform 有值，则使用该平台作为模式
            if (window.AdConfig.activePlatform) {
                mode = window.AdConfig.activePlatform;
            }
        }
        
        // 如果还是没指定，默认返回 ALL
        if (!mode) {
            return AD_MODES.ALL;
        }
        
        // 兼容旧参数
        if (mode === 'manage') {
            return AD_MODES.GAM;
        }
        return mode;
    }
    
    // 检查是否应该显示特定网络的广告
    function shouldShowNetwork(network) {
        // 如果 AdConfig 存在且被禁用，则不显示任何广告
        if (window.AdConfig && window.AdConfig.enabled === false) {
            return false;
        }

        const mode = getAdMode();
        
        switch(mode) {
            case AD_MODES.ALL:
                return true;
            case AD_MODES.ADSENSE:
                return network === AD_NETWORKS.ADSENSE;
            case AD_MODES.ADSTERRA:
                return network === AD_NETWORKS.ADSTERRA;
            case AD_MODES.GAM:
                return network === AD_NETWORKS.ADMANAGER;
            case AD_MODES.NONE:
                return false;
            default:
                return true;
        }
    }
    
    // 检查是否有任何广告位是否该显示（根据广告位配置的网络列表）
    function shouldShowSlot(slotNetworks) {
        const mode = getAdMode();
        
        if (mode === AD_MODES.NONE) {
            return false;
        }
        
        if (mode === AD_MODES.ALL) {
            return true;
        }
        
        return slotNetworks && slotNetworks.some(net => shouldShowNetwork(net));
    }
    
    // 应用广告控制
    function applyAdControl() {
        const adContainers = document.querySelectorAll('[data-ad-container="true"]');
        
        adContainers.forEach(container => {
            // 获取该广告位支持的网络
            const networksAttr = container.getAttribute('data-ad-networks') || 'adsense,adsterra,gam';
            const networks = networksAttr.split(',').map(n => n.trim());
            
            // 首先检查广告位是否应该显示
            if (!shouldShowSlot(networks)) {
                container.style.display = 'none';
                return;
            }
            
            // 然后处理内容元素
            const adContents = container.querySelectorAll('.ad-content[data-ad-network]');
            
            adContents.forEach(content => {
                const network = content.getAttribute('data-ad-network');
                
                if (shouldShowNetwork(network)) {
                    content.style.display = 'block';
                } else {
                    content.style.display = 'none';
                }
            });
            
            // 显示容器
            container.style.display = '';
        });
        
        console.log('[Ads] Mode:', getAdMode());
    }
    
    // 获取当前广告模式信息
    function getCurrentAdInfo() {
        const mode = getAdMode();
        let activeNetworks = [];
        let description = '';
        
        switch(mode) {
            case AD_MODES.ALL:
                activeNetworks = ['adsense', 'adsterra', 'gam'];
                description = '显示所有平台的所有广告 - 默认模式，最大收益';
                break;
            case AD_MODES.ADSENSE:
                activeNetworks = ['adsense'];
                description = '仅显示AdSense广告 - 审核/测试用';
                break;
            case AD_MODES.ADSTERRA:
                activeNetworks = ['adsterra'];
                description = '仅显示Adsterra广告 - 审核/测试用';
                break;
            case AD_MODES.GAM:
                activeNetworks = ['gam'];
                description = '仅显示Google Ad Manager广告 - 审核/测试用';
                break;
            case AD_MODES.NONE:
                activeNetworks = [];
                description = '无任何广告 - 合规内容页';
                break;
        }
        
        return {
            mode: mode,
            activeNetworks: activeNetworks,
            description: description,
            availableModes: Object.values(AD_MODES)
        };
    }
    
    // 暴露到全局
    window.AdController = {
        getMode: getAdMode,
        getInfo: getCurrentAdInfo,
        refresh: applyAdControl,
        shouldShow: shouldShowNetwork,
        shouldShowSlot: shouldShowSlot,
        MODES: AD_MODES,
        NETWORKS: AD_NETWORKS
    };
    
    // 页面加载时应用广告控制
    document.addEventListener('DOMContentLoaded', applyAdControl);
    
    // 监听URL变化
    window.addEventListener('popstate', applyAdControl);
    window.addEventListener('hashchange', applyAdControl);
    
})();
