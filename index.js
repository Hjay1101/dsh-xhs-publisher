// dsh-xhs-publisher —— Host 半。
//
// 这是一个纯客户端插件：所有功能（编辑器、字数校验、封面生成、
// 剪贴板打包）都在浏览器侧完成，Host 侧没有业务逻辑。
// 这里只需要一个可被 cordis 加载的插件入口（cordis.patch.yml 的
// insert 按包名加载 main），apply 为空即可。

export default {
  name: "dsh-xhs-publisher",
  apply() {
    /* 纯客户端插件：无需任何 Host 逻辑 */
  },
};