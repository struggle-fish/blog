module.exports = {
	// 页面title
	title: '江小鱼的学习之旅',
	// 网页描述
  description: '高级前端进阶',
  // 打包后的输出目录
  dest: 'dist',
  // 配置 Github Pages 在哪个目录下访问
  base: '/blog/',
  // 主题配置
  themeConfig: {
  	// 连接到github
  	repo: 'https://github.com/struggle-fish/blog',
  	repoLabel: 'Github',
  	// 最后更新时间
    lastUpdated: '最后更新时间',
    // 搜索配置
    algolia: {
      apiKey: '<API_KEY>',
      indexName: '<INDEX_NAME>'
    },
  	// 顶部导航
    nav: [
      {
      	text: 'Home',
      	link: '/'
      },
      {
      	text: '前端积累',
      	items: [
          {
            text: 'JavaScript',
            link: '/html/'
          },
          {
            text: 'Css',
            link: '/html/'
          },
      		{
      			text: 'Vue',
      			link: '/html/'
      		},
        	{
        		text: 'React',
        		link: '/html/'
        	},
        	
      	]
      },
      {
      	text: '前端算法',
      	link: '/JavaScript/'
      },
      {
        text: '代码块',
        link: '/JavaScript/'
      },
      {
        text: '阅读摘抄',
        link: '/JavaScript/'
      }
    ],
    // 所有页面自动生成侧边栏
    sidebar: 'auto'
  },
  // markdown 配置
  markdown: {
    // 代码块行号
    lineNumbers: true
  },
  configureWebpack: {
    resolve: {
      // 静态资源的别名
      alias: {
        '@images': '../images'
      }
    }
  }
}
