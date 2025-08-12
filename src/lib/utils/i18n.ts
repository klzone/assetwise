import { useAppStore } from '@/store';

// 翻译文本配置
export const TRANSLATIONS = {
  zh: {
    // 通用
    loading: '加载中...',
    save: '保存',
    cancel: '取消',
    confirm: '确认',
    delete: '删除',
    edit: '编辑',
    add: '添加',
    search: '搜索',
    filter: '筛选',
    export: '导出',
    import: '导入',
    refresh: '刷新',
    
    // 导航
    dashboard: '仪表盘',
    accounts: '账户管理',
    transactions: '交易记录',
    assets: '资产持仓',
    reviews: '复盘日志',
    plans: '投资计划',
    analysis: 'AI分析',
    settings: '设置',
    
    // 财务术语
    profit: '盈利',
    loss: '亏损',
    totalAssets: '总资产',
    totalProfit: '总盈亏',
    profitRate: '盈利率',
    balance: '余额',
    amount: '金额',
    price: '价格',
    quantity: '数量',
    
    // 颜色约定
    colorConvention: '盈亏颜色约定',
    colorConventionDesc: '中文：红涨绿跌',
    profitExample: '盈利',
    lossExample: '亏损',
    
    // 设置页面
    accountInfo: '账户信息',
    subscriptionManagement: '订阅管理',
    notificationSettings: '通知设置',
    securitySettings: '安全设置',
    privacySettings: '隐私设置',
    preferenceSettings: '偏好设置',
    appSettings: '应用设置',
    dataManagement: '数据管理',
    
    // 语言和主题
    theme: '主题',
    language: '语言',
    currency: '货币',
    light: '浅色',
    dark: '咖啡色',
    system: '跟随系统',
    
    // 订阅类型
    free: '免费版',
    pro: '专业版',
    premium: '旗舰版',

    // 页面标题和描述
    dashboardTitle: '仪表盘',
    dashboardDesc: '欢迎回来，查看您的投资概况',
    accountsTitle: '账户管理',
    accountsDesc: '管理您的投资账户和资产分布',
    transactionsTitle: '交易记录',
    transactionsDesc: '记录和管理您的投资交易',
    reviewsTitle: '复盘日志',
    reviewsDesc: '记录投资心得，总结经验教训',
    plansTitle: '投资计划',
    plansDesc: '制定投资目标',
    assetsTitle: '资产分析',
    assetsDesc: '深度分析投资组合',

    // 账户管理
    addAccount: '添加账户',
    editAccount: '编辑账户',
    accountName: '账户名称',
    accountType: '账户类型',
    accountNumber: '账户号码',
    broker: '券商',
    initialBalance: '初始余额',
    currentBalance: '当前余额',
    showAccountNumber: '显示',
    hideAccountNumber: '隐藏',

    // 交易记录
    addTransaction: '新增交易',
    editTransaction: '编辑交易',
    transactionDate: '日期',
    symbol: '证券',
    transactionType: '类型',
    fee: '费用',
    tax: '税费',
    notes: '备注',
    buy: '买入',
    sell: '卖出',
    dividend: '分红',
    split: '拆股',
    merge: '合股',
    transactionDetails: '交易明细',

    // 交易记录相关
    addTransactionTitle: '添加交易记录',
    addTransactionDesc: '记录您的买入、卖出等交易信息',
    editTransactionTitle: '编辑交易记录',
    editTransactionDesc: '修改交易信息',
    tradingAccount: '交易账户',
    selectAccount: '选择账户',
    selectType: '选择类型',
    stockCode: '证券代码',
    stockName: '证券名称',
    stockCodePlaceholder: '例如：000001',
    stockNamePlaceholder: '例如：平安银行',
    quantityPlaceholder: '交易数量',
    pricePlaceholder: '交易价格',
    feePlaceholder: '手续费',
    taxPlaceholder: '税费',
    notesPlaceholder: '交易备注（可选）',
    createTransactionFailed: '创建交易记录失败',
    updateTransactionFailed: '更新交易记录失败',
    deleteTransactionFailed: '删除交易记录失败',
    confirmDeleteTransaction: '确定要删除这条交易记录吗？',
    totalBuy: '总买入',
    totalSell: '总卖出',
    totalBuyAmount: '累计买入金额',
    totalSellAmount: '累计卖出金额',
    totalFeesAndTax: '总手续费和税费',
    transactionCount: '交易笔数',
    searchPlaceholder: '搜索证券代码或名称...',
    allTypes: '全部类型',
    noTransactions: '暂无交易记录',
    noMatchingTransactions: '没有找到匹配的交易记录',
    startFirstTransaction: '开始记录您的第一笔交易',
    date: '日期',
    operations: '操作',

    // 复盘日志
    writeReview: '写复盘',
    editReview: '编辑复盘日志',
    reviewTitle: '标题',
    reviewContent: '复盘内容',
    reviewDate: '复盘日期',
    emotion: '情绪',
    strategy: '策略',
    lesson: '教训',
    totalReviews: '总复盘数',
    emotionDistribution: '情绪分布',
    writeReviewTitle: '写复盘',
    writeReviewDesc: '记录投资心得和经验总结',
    reviewTitlePlaceholder: '请输入复盘标题',
    reviewContentPlaceholder: '请输入复盘内容...',
    selectEmotion: '选择情绪',
    selectStrategy: '选择策略',
    selectLesson: '选择教训',
    createReview: '创建复盘',
    updateReview: '更新复盘',
    // 情绪标签
    happy: '开心',
    excited: '兴奋',
    confident: '自信',
    calm: '平静',
    neutral: '中性',
    worried: '担心',
    frustrated: '沮丧',
    regretful: '后悔',
    fearful: '恐惧',

    // 复盘页面统计
    totalProfitLoss: '累计盈亏',
    averageEmotion: '平均情绪',
    emotionScore: '情绪评分 (1-10)',
    positiveNegativeReviews: '积极/消极复盘数',
    reviewsUnit: '篇',
    searchReviewsPlaceholder: '搜索复盘标题、内容或标签...',
    allEmotions: '全部情绪',
    positive: '积极',
    negative: '消极',
    noReviewRecords: '暂无复盘记录',
    startRecordingReviews: '开始记录您的投资复盘，总结经验教训',

    // 投资计划页面统计
    totalPlans: '总计划数',
    plansUnit: '个',
    completionRate: '完成率',
    completionProgress: '完成进度',
    totalInvestmentTarget: '总投资目标',
    allStatuses: '全部状态',
    active: '进行中',
    completed: '已完成',
    paused: '已暂停',
    cancelled: '已取消',
    noInvestmentPlans: '暂无投资计划',
    createFirstPlan: '创建您的第一个投资计划，开始规划投资目标',

    // 资产页面
    assetAnalysis: '资产分析',
    assetAnalysisDesc: '深度分析您的投资组合表现',
    noAssetData: '暂无资产数据',
    today: '今日',
    thisWeek: '本周',
    thisMonth: '本月',
    threeMonths: '三个月',
    thisYear: '本年',
    cost: '成本',
    todayChange: '今日变化',
    riskMetrics: '风险指标',
    volatility: '波动率',
    assetPerformanceTrend: '资产表现趋势',
    stock: '股票',
    fund: '基金',
    crypto: '数字货币',
    cash: '现金',

    // 设置页面
    settingsDesc: '管理您的账户设置和偏好',
    username: '用户名',
    email: '邮箱',
    notSet: '未设置',
    subscriptionStatus: '订阅状态',
    vipUser: 'VIP特权用户',
    vipThankYou: '感谢您对AssetWise的支持！您正在享受专业版的全部功能。',
    subscriptionExpires: '订阅到期时间',
    updatePersonalInfo: '更新个人信息',
    month: '月',
    currentPlan: '当前方案',
    upgrade: '升级',

    // 个人资料页面
    profile: '个人资料',
    profileDesc: '管理您的个人信息和账户设置',
    profileUpdated: '个人资料已更新',
    updateFailed: '更新失败，请稍后重试',
    editProfile: '编辑资料',
    saving: '保存中...',
    basicInfo: '基本信息',
    basicInfoDesc: '您的基本个人信息',
    changeAvatar: '更换头像',
    phone: '手机号',
    enterPhone: '请输入手机号',

    // 危险操作
    dangerousOperations: '危险操作',
    clearAllData: '清空所有数据',
    deleteAccount: '删除账户',
    confirmPassword: '确认密码',
    passwordRequired: '请输入密码确认操作',
    operationIrreversible: '以下操作不可逆，请谨慎操作',
    dataCleared: '数据已清空',
    accountDeleted: '账户已删除',
    incorrectPassword: '密码错误',
    enterPassword: '请输入密码',

    // 左侧边栏
    accountsMenuDesc: '管理投资账户',
    transactionsMenuDesc: '记录和分析交易',
    reviewsMenuDesc: '投资复盘和总结',
    plansMenuDesc: '制定投资目标',
    assetsMenuDesc: '深度分析投资组合',
    investmentTool: '投资复盘工具',

    // 仪表盘页面
    welcomeBack: '欢迎回来',
    viewInvestmentOverview: '查看您的投资概况',
    noDataAvailable: '暂无数据',
    startRecordingData: '开始记录您的投资数据',
    addFirstAccount: '添加账户',
    recordFirstTransaction: '记录交易',
    writeFirstReview: '写复盘',
    accountOverview: '账户概览',
    majorHoldings: '主要持仓',
    recentTransactions: '最近交易',
    accountDistributionDesc: '各账户资产分布和变化情况',
    majorHoldingsDesc: '按市值排序的主要资产',
    recentTransactionsDesc: '最新的交易记录',

    // 账户管理页面
    accountList: '账户列表',
    manageAllAccounts: '管理您的所有投资账户',
    accountTypeLabel: '类型',
    brokerLabel: '机构',
    accountNumberLabel: '账户号',
    totalAssetsLabel: '总资产',
    todayChangeLabel: '今日变化',
    totalProfitLabel: '总收益',
    operationsLabel: '操作',
    createdOn: '创建于',
    noAccountData: '暂无账户数据',
    showAccountNumbers: '显示账户号码',

    // 账户类型
    securities: '证券账户',
    fund: '基金账户',
    cash: '现金账户',
    crypto: '数字货币账户',
    commodity: '其他',

    // 账户管理弹窗
    addAccountTitle: '添加账户',
    addAccountDesc: '创建新的投资账户',
    editAccountTitle: '编辑账户',
    editAccountDesc: '修改账户信息',
    accountNamePlaceholder: '请输入账户名称',
    selectAccountType: '选择账户类型',
    brokerPlaceholder: '请输入机构名称',
    accountNumberPlaceholder: '请输入账户号码',
    selectCurrency: '选择货币',
    initialBalancePlaceholder: '请输入初始余额',
    createAccount: '创建账户',
    updateAccount: '更新账户',
    createAccountFailed: '创建账户失败',
    updateAccountFailed: '更新账户失败',

    // 新增字段翻译
    description: '描述',
    optional: '可选',
    descriptionPlaceholder: '请输入账户描述或备注',
    accountStatus: '账户状态',
    selectAccountStatus: '选择账户状态',
    accountActive: '活跃',
    accountInactive: '非活跃',
    currentBalancePlaceholder: '请输入当前账户余额',
    searchAndFilter: '搜索和筛选',
    showingAccountsTotal: '显示 {count} 个账户，共 {total} 个',
    exportSuccess: '账户数据导出成功！',
    exportFailed: '导出失败，请重试',
    importSuccess: '成功导入 {count} 个账户！',
    importFailed: '导入失败，请检查文件格式',
    noNewAccounts: '没有新账户需要导入',

    // 货币
    cny: '人民币 (CNY)',
    usd: '美元 (USD)',
    hkd: '港币 (HKD)',

    // 统计卡片
    activeAccounts: '个活跃账户',
    basedOnBalanceChange: '基于账户余额变化',

    // 其他
    recordTransaction: '记录交易',
    viewAllAccounts: '查看所有账户',
    viewAllTransactions: '查看所有交易',
    viewAllHoldings: '查看所有持仓',
    upgradeToProVersion: '升级到专业版',
    dataExport: '数据导出',
    exportData: '导出数据',
    dataManagementBtn: '数据管理',

    // 投资计划页面
    createPlan: '创建计划',
    createPlanTitle: '创建投资计划',
    createPlanDesc: '制定您的投资目标和策略',
    editPlanTitle: '编辑投资计划',
    editPlanDesc: '修改投资计划信息',
    planTitle: '计划标题',
    planTitlePlaceholder: '请输入计划标题',
    planDescription: '计划描述',
    planDescriptionPlaceholder: '请输入计划描述...',
    targetAmount: '目标金额',
    targetAmountPlaceholder: '请输入目标金额',
    targetDate: '目标日期',
    planStatus: '计划状态',
    selectStatus: '选择状态',
    createPlanBtn: '创建计划',
    updatePlanBtn: '更新计划',
  },
  en: {
    // 通用
    loading: 'Loading...',
    save: 'Save',
    cancel: 'Cancel',
    confirm: 'Confirm',
    delete: 'Delete',
    edit: 'Edit',
    add: 'Add',
    search: 'Search',
    filter: 'Filter',
    export: 'Export',
    import: 'Import',
    refresh: 'Refresh',
    
    // 导航
    dashboard: 'Dashboard',
    accounts: 'Accounts',
    transactions: 'Transactions',
    assets: 'Assets',
    reviews: 'Reviews',
    plans: 'Plans',
    analysis: 'AI Analysis',
    settings: 'Settings',
    
    // 财务术语
    profit: 'Profit',
    loss: 'Loss',
    totalAssets: 'Total Assets',
    totalProfit: 'Total P&L',
    profitRate: 'Return Rate',
    balance: 'Balance',
    amount: 'Amount',
    price: 'Price',
    quantity: 'Quantity',
    
    // 颜色约定
    colorConvention: 'P&L Color Convention',
    colorConventionDesc: 'English: Green up, Red down',
    profitExample: 'Profit',
    lossExample: 'Loss',
    
    // 设置页面
    accountInfo: 'Account Information',
    subscriptionManagement: 'Subscription Management',
    notificationSettings: 'Notification Settings',
    securitySettings: 'Security Settings',
    privacySettings: 'Privacy Settings',
    preferenceSettings: 'Preference Settings',
    appSettings: 'App Settings',
    dataManagement: 'Data Management',
    
    // 语言和主题
    theme: 'Theme',
    language: 'Language',
    currency: 'Currency',
    light: 'Light',
    dark: 'Coffee',
    system: 'System',
    
    // 订阅类型
    free: 'Free',
    pro: 'Professional',
    premium: 'Premium',

    // 页面标题和描述
    dashboardTitle: 'Dashboard',
    dashboardDesc: 'Welcome back, view your investment overview',
    accountsTitle: 'Account Management',
    accountsDesc: 'Manage your investment accounts and asset distribution',
    transactionsTitle: 'Transaction Records',
    transactionsDesc: 'Record and manage your investment transactions',
    reviewsTitle: 'Review Journal',
    reviewsDesc: 'Record investment insights and lessons learned',
    plansTitle: 'Investment Plans',
    plansDesc: 'Set investment goals',
    assetsTitle: 'Asset Analysis',
    assetsDesc: 'Deep analysis of investment portfolio',

    // 账户管理
    addAccount: 'Add Account',
    editAccount: 'Edit Account',
    accountName: 'Account Name',
    accountType: 'Account Type',
    accountNumber: 'Account Number',
    broker: 'Broker',
    initialBalance: 'Initial Balance',
    currentBalance: 'Current Balance',
    showAccountNumber: 'Show',
    hideAccountNumber: 'Hide',

    // 交易记录
    addTransaction: 'Add Transaction',
    editTransaction: 'Edit Transaction',
    transactionDate: 'Date',
    symbol: 'Symbol',
    transactionType: 'Type',
    fee: 'Fee',
    tax: 'Tax',
    notes: 'Notes',
    buy: 'Buy',
    sell: 'Sell',
    dividend: 'Dividend',
    split: 'Stock Split',
    merge: 'Stock Merge',
    transactionDetails: 'Transaction Details',

    // 交易记录相关
    addTransactionTitle: 'Add Transaction',
    addTransactionDesc: 'Record your buy, sell and other transaction information',
    editTransactionTitle: 'Edit Transaction',
    editTransactionDesc: 'Modify transaction information',
    tradingAccount: 'Trading Account',
    selectAccount: 'Select Account',
    selectType: 'Select Type',
    stockCode: 'Stock Code',
    stockName: 'Stock Name',
    stockCodePlaceholder: 'e.g.: AAPL',
    stockNamePlaceholder: 'e.g.: Apple Inc.',
    quantityPlaceholder: 'Transaction quantity',
    pricePlaceholder: 'Transaction price',
    feePlaceholder: 'Fee',
    taxPlaceholder: 'Tax',
    notesPlaceholder: 'Transaction notes (optional)',
    createTransactionFailed: 'Failed to create transaction',
    updateTransactionFailed: 'Failed to update transaction',
    deleteTransactionFailed: 'Failed to delete transaction',
    confirmDeleteTransaction: 'Are you sure you want to delete this transaction?',
    totalBuy: 'Total Buy',
    totalSell: 'Total Sell',
    totalBuyAmount: 'Total buy amount',
    totalSellAmount: 'Total sell amount',
    totalFeesAndTax: 'Total fees and tax',
    transactionCount: 'Transaction count',
    searchPlaceholder: 'Search stock code or name...',
    allTypes: 'All Types',
    noTransactions: 'No transactions',
    noMatchingTransactions: 'No matching transactions found',
    startFirstTransaction: 'Start recording your first transaction',
    date: 'Date',
    operations: 'Operations',

    // 复盘日志
    writeReview: 'Write Review',
    editReview: 'Edit Review',
    reviewTitle: 'Title',
    reviewContent: 'Review Content',
    reviewDate: 'Review Date',
    emotion: 'Emotion',
    strategy: 'Strategy',
    lesson: 'Lesson',
    totalReviews: 'Total Reviews',
    emotionDistribution: 'Emotion Distribution',
    writeReviewTitle: 'Write Review',
    writeReviewDesc: 'Record investment insights and experience summary',
    reviewTitlePlaceholder: 'Please enter review title',
    reviewContentPlaceholder: 'Please enter review content...',
    selectEmotion: 'Select Emotion',
    selectStrategy: 'Select Strategy',
    selectLesson: 'Select Lesson',
    createReview: 'Create Review',
    updateReview: 'Update Review',
    // 情绪标签
    happy: 'Happy',
    excited: 'Excited',
    confident: 'Confident',
    calm: 'Calm',
    neutral: 'Neutral',
    worried: 'Worried',
    frustrated: 'Frustrated',
    regretful: 'Regretful',
    fearful: 'Fearful',

    // 复盘页面统计
    totalProfitLoss: 'Total P&L',
    averageEmotion: 'Average Emotion',
    emotionScore: 'Emotion Score (1-10)',
    positiveNegativeReviews: 'Positive/Negative Reviews',
    reviewsUnit: 'reviews',
    searchReviewsPlaceholder: 'Search review titles, content or tags...',
    allEmotions: 'All Emotions',
    positive: 'Positive',
    negative: 'Negative',
    noReviewRecords: 'No review records',
    startRecordingReviews: 'Start recording your investment reviews and summarize lessons learned',

    // 投资计划页面统计
    totalPlans: 'Total Plans',
    plansUnit: 'plans',
    completionRate: 'Completion Rate',
    completionProgress: 'Completion Progress',
    totalInvestmentTarget: 'Total Investment Target',
    allStatuses: 'All Statuses',
    active: 'Active',
    completed: 'Completed',
    paused: 'Paused',
    cancelled: 'Cancelled',
    noInvestmentPlans: 'No investment plans',
    createFirstPlan: 'Create your first investment plan and start planning your investment goals',

    // 资产页面
    assetAnalysis: 'Asset Analysis',
    assetAnalysisDesc: 'In-depth analysis of your portfolio performance',
    noAssetData: 'No asset data',
    today: 'Today',
    thisWeek: 'This Week',
    thisMonth: 'This Month',
    threeMonths: 'Three Months',
    thisYear: 'This Year',
    cost: 'Cost',
    todayChange: 'Today\'s Change',
    riskMetrics: 'Risk Metrics',
    volatility: 'Volatility',
    assetPerformanceTrend: 'Asset Performance Trend',
    stock: 'Stock',
    fund: 'Fund',
    crypto: 'Crypto',
    cash: 'Cash',

    // 设置页面
    settingsDesc: 'Manage your account settings and preferences',
    username: 'Username',
    email: 'Email',
    notSet: 'Not set',
    subscriptionStatus: 'Subscription Status',
    vipUser: 'VIP Premium User',
    vipThankYou: 'Thank you for supporting AssetWise! You are enjoying all premium features.',
    subscriptionExpires: 'Subscription expires',
    updatePersonalInfo: 'Update Personal Information',
    month: 'month',
    currentPlan: 'Current Plan',
    upgrade: 'Upgrade',

    // 个人资料页面
    profile: 'Profile',
    profileDesc: 'Manage your personal information and account settings',
    profileUpdated: 'Profile updated successfully',
    updateFailed: 'Update failed, please try again later',
    editProfile: 'Edit Profile',
    saving: 'Saving...',
    basicInfo: 'Basic Information',
    basicInfoDesc: 'Your basic personal information',
    changeAvatar: 'Change Avatar',
    phone: 'Phone',
    enterPhone: 'Enter phone number',

    // 危险操作
    dangerousOperations: 'Dangerous Operations',
    clearAllData: 'Clear All Data',
    deleteAccount: 'Delete Account',
    confirmPassword: 'Confirm Password',
    passwordRequired: 'Please enter password to confirm operation',
    operationIrreversible: 'The following operations are irreversible, please proceed with caution',
    dataCleared: 'Data cleared',
    accountDeleted: 'Account deleted',
    incorrectPassword: 'Incorrect password',
    enterPassword: 'Enter password',

    // 左侧边栏
    accountsMenuDesc: 'Manage investment accounts',
    transactionsMenuDesc: 'Record and analyze transactions',
    reviewsMenuDesc: 'Investment review and summary',
    plansMenuDesc: 'Set investment goals',
    assetsMenuDesc: 'Deep analysis of investment portfolio',
    investmentTool: 'Investment Review Tool',

    // 仪表盘页面
    welcomeBack: 'Welcome back',
    viewInvestmentOverview: 'View your investment overview',
    noDataAvailable: 'No data available',
    startRecordingData: 'Start recording your investment data',
    addFirstAccount: 'Add Account',
    recordFirstTransaction: 'Record Transaction',
    writeFirstReview: 'Write Review',
    accountOverview: 'Account Overview',
    majorHoldings: 'Major Holdings',
    recentTransactions: 'Recent Transactions',
    accountDistributionDesc: 'Asset distribution and changes across accounts',
    majorHoldingsDesc: 'Major assets sorted by market value',
    recentTransactionsDesc: 'Latest transaction records',

    // 账户管理页面
    accountList: 'Account List',
    manageAllAccounts: 'Manage all your investment accounts',
    accountTypeLabel: 'Type',
    brokerLabel: 'Broker',
    accountNumberLabel: 'Account #',
    totalAssetsLabel: 'Total Assets',
    todayChangeLabel: 'Today Change',
    totalProfitLabel: 'Total P&L',
    operationsLabel: 'Operations',
    createdOn: 'Created on',
    noAccountData: 'No account data',
    showAccountNumbers: 'Show Account Numbers',

    // 账户类型
    stockAccount: 'Stock Account',
    fundAccount: 'Fund Account',
    cashAccount: 'Cash Account',
    cryptoAccount: 'Crypto Account',

    // 统计卡片
    activeAccounts: 'active accounts',
    basedOnBalanceChange: 'Based on account balance changes',

    // 其他
    recordTransaction: 'Record Transaction',
    viewAllAccounts: 'View All Accounts',
    viewAllTransactions: 'View All Transactions',
    viewAllHoldings: 'View All Holdings',
    upgradeToProVersion: 'Upgrade to Pro',
    dataExport: 'Data Export',
    exportData: 'Export Data',
    dataManagementBtn: 'Data Management',

    // 账户管理弹窗
    addAccountTitle: 'Add Account',
    addAccountDesc: 'Create a new investment account',
    editAccountTitle: 'Edit Account',
    editAccountDesc: 'Modify account information',
    accountNamePlaceholder: 'Please enter account name',
    selectAccountType: 'Select account type',
    brokerPlaceholder: 'Please enter broker name',
    accountNumberPlaceholder: 'Please enter account number',
    selectCurrency: 'Select currency',
    initialBalancePlaceholder: 'Please enter initial balance',
    createAccount: 'Create Account',
    updateAccount: 'Update Account',
    createAccountFailed: 'Failed to create account',
    updateAccountFailed: 'Failed to update account',

    // 新增字段翻译
    description: 'Description',
    optional: 'Optional',
    descriptionPlaceholder: 'Please enter account description or notes',
    accountStatus: 'Account Status',
    selectAccountStatus: 'Select account status',
    accountActive: 'Active',
    accountInactive: 'Inactive',
    currentBalancePlaceholder: 'Please enter current account balance',
    searchAndFilter: 'Search and Filter',
    showingAccountsTotal: 'Showing {count} accounts, total {total}',
    exportSuccess: 'Account data exported successfully!',
    exportFailed: 'Export failed, please try again',
    importSuccess: 'Successfully imported {count} accounts!',
    importFailed: 'Import failed, please check file format',
    noNewAccounts: 'No new accounts to import',

    // 货币
    cny: 'Chinese Yuan (CNY)',
    usd: 'US Dollar (USD)',
    hkd: 'Hong Kong Dollar (HKD)',

    // 投资计划页面
    createPlan: 'Create Plan',
    createPlanTitle: 'Create Investment Plan',
    createPlanDesc: 'Set your investment goals and strategies',
    editPlanTitle: 'Edit Investment Plan',
    editPlanDesc: 'Modify investment plan information',
    planTitle: 'Plan Title',
    planTitlePlaceholder: 'Please enter plan title',
    planDescription: 'Plan Description',
    planDescriptionPlaceholder: 'Please enter plan description...',
    targetAmount: 'Target Amount',
    targetAmountPlaceholder: 'Please enter target amount',
    targetDate: 'Target Date',
    planStatus: 'Plan Status',
    selectStatus: 'Select Status',
    createPlanBtn: 'Create Plan',
    updatePlanBtn: 'Update Plan',
  }
} as const;

// 国际化Hook
export function useI18n() {
  const { language } = useAppStore();
  
  const t = (key: string, params?: Record<string, any>): string => {
    const keys = key.split('.');
    let value: any = TRANSLATIONS[language as keyof typeof TRANSLATIONS] || TRANSLATIONS.zh;

    for (const k of keys) {
      value = value?.[k];
      if (value === undefined) break;
    }

    let result = value || key;

    // 参数插值
    if (params && typeof result === 'string') {
      Object.keys(params).forEach(paramKey => {
        result = result.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), params[paramKey]);
      });
    }

    return result;
  };
  
  const formatCurrency = (amount: number, currencyCode: string = '¥') => {
    const locale = language === 'zh' ? 'zh-CN' : 'en-US';
    
    return amount.toLocaleString(locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };
  
  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const locale = language === 'zh' ? 'zh-CN' : 'en-US';
    
    return dateObj.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  const formatDateTime = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const locale = language === 'zh' ? 'zh-CN' : 'en-US';
    
    return dateObj.toLocaleString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  return {
    t,
    formatCurrency,
    formatDate,
    formatDateTime,
    language,
    isZh: language === 'zh',
    isEn: language === 'en'
  };
}
