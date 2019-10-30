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

// app.use(koaCors());
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
//允许跨域
app.use(async (ctx, next) => {
  ctx.set('Access-Control-Allow-Origin', ctx.headers.origin);
  ctx.set("Access-Control-Max-Age", 864000);
  // 设置所允许的HTTP请求方法
  ctx.set("Access-Control-Allow-Methods", "OPTIONS, GET, POST");
  // 字段是必需的。它也是一个逗号分隔的字符串，表明服务器支持的所有头信息字段.
  ctx.set("Access-Control-Allow-Headers", "x-requested-with, accept, origin, content-type");

  await next();
})
// 文件二次处理，修改名称
app.use(ctx => {
  // 得到文件对象
  let files = ctx.request.files ? ctx.request.files['f1'] : [];
  let result = [];
  let body = ctx.request.body;
  // 文件标识
  let fileToken = body.token;
  // 文件顺序
  let fileIndex = body.index;
  if(files && !Array.isArray(files)) {
    files = [files];
  };
  files && files.forEach(file => {
    let path = file.path.replace(/\\/g,'/');
    let filename = file.name;
    // 得到扩展名
    let extArr = filename.split('.');
    let ext = extArr[extArr.length-1];
    // let nextPath = `${path}.${ext}`;
    let nextPath = `${path.slice(0, path.lastIndexOf('/')+1)}${fileIndex}-${fileToken}`;
    if(file.size>0 && path) {
      // 重命名文件
      fs.renameSync(path, nextPath);
    };
    result.push(`"${uploadHost}${nextPath.slice(nextPath.lastIndexOf('/')+1)}"`);
  });
  // 以json形式输出上传文件
  ctx.body = `{
    "fileUrl": ${JSON.stringify(result)}
  }`;
  // 合并文件
  if(body.type === 'merge') {
    let filename = body.filename;
    let chunkCount = body.chunkCount;
    let folder = path.resolve(__dirname, '../static/file')+'/';
    let writeStrem = fs.createWriteStream(`${folder}${filename}`);
    let cindex = 0;
    // 合并函数
    function fnMergeFile() {
      let fname = `${folder}${cindex}-${fileToken}`;
      let readStream = fs.createReadStream(fname);
      readStream.pipe(writeStrem, {
        end: false
      });
      readStream.on('end', function() {
        fs.unlink(fname, function(err) {
          if(err) {
            throw err;
          };
        });
        if(cindex+1<chunkCount) {
          cindex += 1;
          fnMergeFile();
        };
      });
    };
    fnMergeFile();
    ctx.body = 'merge ok 200';
  }
});

// http server
const server = http.createServer(app.callback());
server.listen(port);
console.log('demo1 server start...');