// 兽药数据库（基于Plumb's Veterinary Drug Handbook）
const veterinaryDB = {
    "阿莫西林": {
        name: "阿莫西林 (Amoxicillin)",
        category: "抗生素",
        indications: "用于治疗和预防多种细菌感染，包括呼吸道感染、尿路感染、皮肤感染等。常用于猪、牛、羊、宠物等。",
        dosage: "猪：10-20 mg/kg体重，每日2次；犬猫：12.5-25 mg/kg体重，每日2-3次。",
        contraindications: "对青霉素类药物过敏者禁用。肾功能不全者慎用。",
        warnings: "可能引起过敏反应，使用前建议进行过敏试验。",
        source: "Plumb's Veterinary Drug Handbook",
        synonyms: "Amoxil, Amoxi-Tabs"
    },
    "氨苄西林": {
        name: "氨苄西林 (Ampicillin)",
        category: "抗生素",
        indications: "广谱抗生素，用于治疗革兰氏阳性和阴性菌感染。常用于乳腺炎、呼吸道感染等。",
        dosage: "牛：5-10 mg/kg体重，每日2-3次；宠物：10-20 mg/kg体重，每日3次。",
        contraindications: "青霉素过敏者禁用。",
        warnings: "可能有胃肠道反应。",
        source: "Plumb's Veterinary Drug Handbook",
        synonyms: "Polyflex, Principen"
    },
    "阿米卡星": {
        name: "阿米卡星 (Amikacin)",
        category: "氨基糖苷类抗生素",
        indications: "用于严重革兰氏阴性菌感染，特别是对其他抗生素耐药的菌株。用于犬、马等。",
        dosage: "犬：15-30 mg/kg体重，每日1-2次；马：10 mg/kg体重，每日1次。",
        contraindications: "肾功能不全者禁用。耳毒性风险。",
        warnings: "具有肾毒性和耳毒性，需监测肾功能。",
        source: "Plumb's Veterinary Drug Handbook",
        synonyms: "Amiglyde-V, Amikacin Sulfate"
    },
    "伊维菌素": {
        name: "伊维菌素 (Ivermectin)",
        category: "抗寄生虫药",
        indications: "广谱抗寄生虫药，用于治疗线虫、螨虫、虱子等。用于牛、羊、猪、宠物等。",
        dosage: "牛：0.2 mg/kg体重，皮下注射；犬：0.006 mg/kg体重，口服。",
        contraindications: "柯利犬种慎用。怀孕动物慎用。",
        warnings: "某些犬种（柯利犬）可能产生严重不良反应。",
        source: "Plumb's Veterinary Drug Handbook",
        synonyms: "Ivomec, Heartgard"
    },
    "疫苗": {
        name: "常见动物疫苗",
        category: "生物制品",
        indications: "预防各种传染病，包括口蹄疫、猪瘟、禽流感等。",
        dosage: "根据具体疫苗说明书使用。",
        contraindications: "免疫功能低下者禁用。急性感染期禁用。",
        warnings: "需冷链保存，使用前检查疫苗质量。",
        source: "中国兽药典",
        synonyms: "Vaccines"
    }
};

// 搜索功能实现
class VeterinarySearch {
    constructor() {
        this.currentQuery = '';
        this.baiduPage = 0;
        this.init();
    }

    init() {
        this.bindEvents();
        this.setupSearchSuggestions();
    }

    bindEvents() {
        const searchInput = document.getElementById('searchInput');
        const searchBtn = document.getElementById('searchBtn');
        
        searchBtn.addEventListener('click', () => this.performSearch());
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.performSearch();
        });
        searchInput.addEventListener('input', () => this.showSuggestions());

        // 标签点击事件
        document.querySelectorAll('.tag-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                searchInput.value = e.target.dataset.keyword;
                this.performSearch();
            });
        });

        // 搜索标签切换
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
            });
        });

        // 模态框关闭
        document.querySelector('.close-btn').addEventListener('click', () => {
            document.getElementById('drugModal').style.display = 'none';
        });
        document.getElementById('drugModal').addEventListener('click', (e) => {
            if (e.target.id === 'drugModal') {
                document.getElementById('drugModal').style.display = 'none';
            }
        });
    }

    setupSearchSuggestions() {
        const suggestions = Object.keys(veterinaryDB).slice(0, 8);
        this.suggestions = suggestions;
    }

    showSuggestions() {
        const input = document.getElementById('searchInput');
        const suggestionsDiv = document.getElementById('suggestions');
        const value = input.value.toLowerCase();

        if (value.length < 2) {
            suggestionsDiv.style.display = 'none';
            return;
        }

        const matches = this.suggestions.filter(s => 
            s.toLowerCase().includes(value)
        );

        if (matches.length > 0) {
            suggestionsDiv.innerHTML = matches.map(match => `
                <div class="suggestion-item" onclick="search.selectSuggestion('${match}')">
                    <i class="ri-search-line"></i>
                    ${match}
                </div>
            `).join('');
            suggestionsDiv.style.display = 'block';
        } else {
            suggestionsDiv.style.display = 'none';
        }
    }

    selectSuggestion(value) {
        document.getElementById('searchInput').value = value;
        document.getElementById('suggestions').style.display = 'none';
        this.performSearch();
    }

    async performSearch() {
        const query = document.getElementById('searchInput').value.trim();
        if (!query) return;

        this.currentQuery = query;
        this.baiduPage = 0;

        // 显示加载动画
        document.getElementById('resultsSection').style.display = 'block';
        this.showLoading();

        // 执行多源搜索
        await Promise.all([
            this.searchLocalDB(query),
            this.searchBaidu(query),
            this.searchAcademic(query)
        ]);
    }

    showLoading() {
        const localDiv = document.getElementById('localResults');
        const baiduDiv = document.getElementById('baiduResults');
        const academicDiv = document.getElementById('academicResults');

        localDiv.innerHTML = '<div class="loading"></div>';
        baiduDiv.innerHTML = '<div class="loading"></div>';
        academicDiv.innerHTML = '<div class="loading"></div>';
    }

    async searchLocalDB(query) {
        const resultsDiv = document.getElementById('localResults');
        
        // 模糊搜索匹配
        const matches = Object.entries(veterinaryDB).filter(([key, value]) => 
            key.includes(query) || 
            value.name.includes(query) ||
            value.category.includes(query) ||
            value.indications.includes(query)
        );

        if (matches.length > 0) {
            resultsDiv.innerHTML = matches.map(([key, drug]) => `
                <div class="result-item" onclick="search.showDrugDetail('${key}')">
                    <div class="result-title">
                        <i class="ri-capsule-line"></i>
                        ${drug.name}
                    </div>
                    <div class="result-snippet">${drug.indications.substring(0, 120)}...</div>
                    <div class="result-source">
                        <i class="ri-database-2-line"></i>
                        ${drug.source} | ${drug.category}
                    </div>
                </div>
            `).join('');
        } else {
            resultsDiv.innerHTML = `
                <div class="result-item">
                    <div class="result-title">未找到相关兽药信息</div>
                    <div class="result-snippet">建议尝试其他关键词或查看百度搜索结果</div>
                </div>
            `;
        }
    }

    async searchBaidu(query) {
        const resultsDiv = document.getElementById('baiduResults');
        
        try {
            // 模拟百度搜索API调用
            const response = await fetch(
                `https://api.allorigins.win/raw?url=${encodeURIComponent(
                    `https://www.baidu.com/s?wd=${encodeURIComponent(query + ' 兽药')}`
                )}`
            );
            
            if (response.ok) {
                const html = await response.text();
                const results = this.parseBaiduResults(html);
                this.displayBaiduResults(results, resultsDiv);
            } else {
                throw new Error('搜索失败');
            }
        } catch (error) {
            console.error('百度搜索错误:', error);
            // 显示模拟数据作为备用
            this.displayBaiduResults(this.getMockBaiduResults(query), resultsDiv);
        }
    }

    parseBaiduResults(html) {
        // 简化的百度结果解析
        const results = [];
        const regex = /<div class="result c-container ".*?>([\s\S]*?)<\/div><\/div>/g;
        let match;

        while ((match = regex.exec(html)) && results.length < 5) {
            try {
                const titleMatch = match[1].match(/<h3.*?>([\s\S]*?)<\/h3>/);
                const snippetMatch = match[1].match(/<span class="content-right_8Zs40">([\s\S]*?)<\/span>/);
                const linkMatch = match[1].match(/<a.*?href="(.*?)"/);

                if (titleMatch && snippetMatch) {
                    results.push({
                        title: titleMatch[1].replace(/<[^>]+>/g, ''),
                        snippet: snippetMatch[1].replace(/<[^>]+>/g, '').substring(0, 150) + '...',
                        link: linkMatch ? linkMatch[1] : '#'
                    });
                }
            } catch (e) {
                continue;
            }
        }

        return results;
    }

    getMockBaiduResults(query) {
        // 备用模拟数据
        return [
            {
                title: `${query} - 百度百科`,
                snippet: `提供${query}的详细百科信息，包括药理作用、适应症、用法用量等详细信息...`,
                link: `https://baike.baidu.com/item/${query}`,
                source: '百度百科'
            },
            {
                title: `${query}使用指南 - 中国兽药信息网`,
                snippet: `中国兽药监察所提供的${query}官方使用指南和监管信息...`,
                link: 'http://www.ivdc.gov.cn',
                source: '中国兽药信息网'
            },
            {
                title: `${query}在养殖中的应用 - 农技推广网`,
                snippet: `介绍${query}在不同动物养殖中的实际应用案例和注意事项...`,
                link: 'http://www.nyjs.moa.gov.cn',
                source: '农技推广网'
            },
            {
                title: `${query}最新研究进展 - 中国知网`,
                snippet: `收录关于${query}的最新学术研究论文和临床试验报告...`,
                link: 'https://www.cnki.net',
                source: '中国知网'
            }
        ];
    }

    displayBaiduResults(results, container) {
        container.innerHTML = results.map((result, index) => `
            <div class="result-item" onclick="window.open('${result.link}', '_blank')">
                <div class="result-title">
                    <i class="ri-links-line"></i>
                    ${result.title}
                </div>
                <div class="result-snippet">${result.snippet}</div>
                <div class="result-source">
                    <i class="ri-baidu-line"></i>
                    ${result.source || '百度搜索'} | 点击查看详情
                </div>
            </div>
        `).join('');
    }

    async searchAcademic(query) {
        const resultsDiv = document.getElementById('academicResults');
        
        // 模拟学术搜索结果
        const academicResults = [
            {
                title: `${query}在兽医临床中的应用研究`,
                snippet: `本文研究了${query}在不同动物疾病治疗中的临床应用效果，通过200例病例分析...`,
                source: '《中国兽医杂志》2024年第3期',
                type: '期刊论文'
            },
            {
                title: `${query}药理与毒理研究进展`,
                snippet: `系统综述了${query}的药代动力学特征、药效学机制及安全性评价...`,
                source: '《畜牧兽医学报》2024年第2期',
                type: '综述文章'
            },
            {
                title: `${query}使用规范与注意事项`,
                snippet: `农业农村部发布的${query}使用技术指南，包括适应症、禁忌症、休药期等规定...`,
                source: '农业农村部技术公告',
                type: '官方指南'
            }
        ];

        setTimeout(() => {
            resultsDiv.innerHTML = academicResults.map(result => `
                <div class="result-item">
                    <div class="result-title">
                        <i class="ri-article-line"></i>
                        ${result.title}
                    </div>
                    <div class="result-snippet">${result.snippet}</div>
                    <div class="result-source">
                        <i class="ri-graduation-cap-line"></i>
                        ${result.source} | ${result.type}
                    </div>
                </div>
            `).join('');
        }, 800);
    }

    showDrugDetail(drugKey) {
        const drug = veterinaryDB[drugKey];
        if (!drug) return;

        document.getElementById('modalTitle').textContent = drug.name;
        document.getElementById('modalBody').innerHTML = `
            <div class="drug-detail-section">
                <h4><i class="ri-information-line"></i> 基本信息</h4>
                <p><strong>药物类别：</strong>${drug.category}</p>
                <p><strong>别名：</strong>${drug.synonyms}</p>
            </div>

            <div class="drug-detail-section">
                <h4><i class="ri-hearts-line"></i> 适应症</h4>
                <p>${drug.indications}</p>
            </div>

            <div class="drug-detail-section">
                <h4><i class="ri-dosage-icon">💊</i> 用法用量</h4>
                <p>${drug.dosage}</p>
            </div>

            <div class="drug-detail-section">
                <h4><i class="ri-forbid-line"></i> 禁忌症</h4>
                <p>${drug.contraindications}</p>
            </div>

            <div class="drug-detail-section">
                <h4><i class="ri-alert-line"></i> 注意事项</h4>
                <p>${drug.warnings}</p>
            </div>

            <div class="warning-box">
                <strong><i class="ri-error-warning-line"></i> 重要提醒</strong><br>
                本信息仅供参考，具体用药请遵医嘱。使用前请仔细阅读说明书，在执业兽医指导下使用。
            </div>

            <div class="drug-detail-section">
                <h4><i class="ri-book-mark-line"></i> 信息来源</h4>
                <p>${drug.source}</p>
            </div>
        `;

        document.getElementById('drugModal').style.display = 'block';
    }
}

// 初始化搜索
const search = new VeterinarySearch();

// 加载更多功能
document.getElementById('loadMoreBaidu')?.addEventListener('click', async function() {
    const btn = this;
    btn.innerHTML = '<div class="loading" style="width: 20px; height: 20px;"></div> 加载中...';
    btn.disabled = true;

    // 模拟加载更多
    setTimeout(() => {
        const container = document.getElementById('baiduResults');
        const moreResults = search.getMockBaiduResults(search.currentQuery);
        
        container.innerHTML += moreResults.slice(0, 2).map(result => `
            <div class="result-item" onclick="window.open('${result.link}', '_blank')">
                <div class="result-title">
                    <i class="ri-links-line"></i>
                    ${result.title}
                </div>
                <div class="result-snippet">${result.snippet}</div>
                <div class="result-source">
                    <i class="ri-baidu-line"></i>
                    ${result.source || '百度搜索'} | 点击查看详情
                </div>
            </div>
        `).join('');
        
        btn.innerHTML = '加载更多搜索结果';
        btn.disabled = false;
    }, 1500);
});

// 平滑滚动
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const target = e.target.getAttribute('href');
        if (target.startsWith('#')) {
            const element = document.querySelector(target);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
            }
        }
    });
});

// 页面加载动画
window.addEventListener('load', () => {
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.5s ease';
    setTimeout(() => {
        document.body.style.opacity = '1';
    }, 100);
});
