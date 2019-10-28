const http = require('http');
const koa = require('koa2');
const koaStatic = require('koa-static');
const koaBody = require('koa-body');
const koaCors = require('koa-cors');
const path = require('path');
const fs = require('fs');

const app = new koa();
const port = process.env.PORT || '8100';
const uploadHost = `http://localhost:${port}/file/`;

app.use(koaCors());
app.use(koaBody({
  formidable: {
    // 设置文件的默认保存目录，默认保存在系统临时目录
    uploadDir: path.resolve(__dirname, '../static/file')
  },
  // 开启文件上传
  multipart: true
}));

// 开启静态文件访问
app.use(koaStatic(
  path.resolve(__dirname, '../static')
)); 

// 文件二次处理，修改名称
app.use(ctx => {
  // 得到文件对象
  let files = ctx.request.files?ctx.request.files['f1'] : null;
  let result = [];
  if(!Array.isArray(files)) {
    files = [files];
  };
  console.log(files);
  files && files.forEach(file => {
    console.log(file);
    let path = file.path.replace(/\\/g,'/');
    let filename = file.name;
    // 得到扩展名
    let extArr = filename.split('.');
    let ext = extArr[extArr.length-1];
    let nextPath = `${path}.${ext}`;
    if(file.size>0 && path) {
      // 重命名文件
      fs.renameSync(path, nextPath);
    };
    result.push(`"${uploadHost}${nextPath.slice(nextPath.lastIndexOf('/')+1)}"`)
    // 以json形式输出上传文件
    
  });
  ctx.body = `{
    "fileUrl": ${JSON.stringify(result)}
  }`;
});

// http server
const server = http.createServer(app.callback());
server.listen(port);
console.log('demo1 server start...');