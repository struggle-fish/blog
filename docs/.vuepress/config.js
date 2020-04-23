module.exports = {
  // 页面title
  title: "江小鱼",
  // 网页描述
  description: "江小鱼的学习之旅",
  // 打包后的输出目录
  dest: "dist",
  // 配置 Github Pages 在哪个目录下访问
  // base: '/blog/',
  // 主题配置
  themeConfig: {
    // 连接到github
    repo: "https://github.com/struggle-fish/blog",
    repoLabel: "Github",
    // 最后更新时间
    lastUpdated: "最后更新时间",
    // 搜索配置
    algolia: {
      apiKey: "<API_KEY>",
      indexName: "<INDEX_NAME>"
    }
  },
  // markdown 配置
  markdown: {
    // 代码块行号
    lineNumbers: true
  },
  plugins: ['permalink-pinyin', ['autobar', {'pinyinNav': true}], 'rpurl'],
  configureWebpack: {
    resolve: {
      // 静态资源的别名
      alias: {
        "@images": "./images"
      }
    }
  },
  chainWebpack: (config, isServer) => {
    const inlineLimit = 10000
    config.module.rule('images')
    .test(/\.(png|jpe?g|gif|webp)(\?.*)?$/)
    .use('url-loader')
      .loader('url-loader')
      .options({
        limit: inlineLimit,
        name: `assets/images/[name].[hash:8].[ext]`
      })
  }
};
