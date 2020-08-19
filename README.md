#一、运行项目:
1.安装node.js
2.安装依赖:npm install
3.运行项目:npm start

#二、项目目录
1.node_modules:项目依赖包(运行npm install后出现)
2.Source:存放css\js\images、静态数据源
3.index.html:主页，包含项目程序代码和页面结构
4.server.js:简单的基于node.js的http服务器

#三、其它命令:
npm run build # 在Source目录下生成了一个Cesium.js文件,Sandcastle中包含`Development`分类。
npm run generateDocumentation # 创建文档,Cesium 文档底层调用的是`jsDoc`
npm run minifyRelease # 这个命令会把Source目录下所有的js文件打包放到Build/Cesium/目录下，
                      # 并且生成一个真正的供生产环境下来使用的Cesium.js文件。
npm run minify # 会压缩优化js代码，但是不会去掉调试信息。
npm run combine # 既不压缩优化，也不去掉调试信息。相当于生成具备调试信息的js文件。
npm run combineRelease # 不进行压缩优化，但是去掉了调试信息。
npm run release # 相当于combine、minifyRelease、generateDocumentation三个命令的集合。
                # 他会同时做了三件事：
                # 1. 在Build/CesiumUnminified目录下生成调试版的Cesium.js文件； 
                # 2. 在Build/Cesium目录下生成压缩优化好的(生产环境下）的Cesium.js文件； 
                # 3. 并且还生成了Cesium的api文档，文档放在Build/Documentation目录下。

