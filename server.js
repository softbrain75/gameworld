// 간단한 로컬 웹 서버
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 8000;
const HOST = 'localhost';

// MIME 타입 정의
const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.md': 'text/markdown; charset=utf-8',
    '.txt': 'text/plain; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.eot': 'application/vnd.ms-fontobject',
    '.mp3': 'audio/mpeg',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
};

const server = http.createServer((req, res) => {
    // 기본값: index.html
    let filePath = req.url === '/' ? '/index.html' : req.url;

    // 쿼리 문자열 제거
    filePath = filePath.split('?')[0];

    // 현재 디렉토리 기준 파일 경로
    filePath = path.join(__dirname, filePath);

    // 경로 이탈 방지 (보안)
    const normalizedPath = path.normalize(filePath);
    if (!normalizedPath.startsWith(path.normalize(__dirname))) {
        res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('접근이 거부되었습니다.');
        return;
    }

    fs.stat(filePath, (err, stats) => {
        if (err) {
            // 파일이 없으면 404
            res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(`
                <!DOCTYPE html>
                <html lang="ko">
                <head>
                    <meta charset="UTF-8">
                    <title>404 - 페이지를 찾을 수 없습니다</title>
                </head>
                <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                    <h1>404 - 페이지를 찾을 수 없습니다</h1>
                    <p>요청한 파일: ${req.url}</p>
                    <p><a href="/">홈으로 돌아가기</a></p>
                </body>
                </html>
            `);
            return;
        }

        if (stats.isDirectory()) {
            // 디렉토리면 index.html 찾기
            const indexPath = path.join(filePath, 'index.html');
            fs.stat(indexPath, (err) => {
                if (err) {
                    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
                    res.end('index.html을 찾을 수 없습니다.');
                } else {
                    serveFile(indexPath, res);
                }
            });
        } else {
            // 파일 제공
            serveFile(filePath, res);
        }
    });
});

function serveFile(filePath, res) {
    const ext = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('서버 오류가 발생했습니다.');
            return;
        }

        res.writeHead(200, {
            'Content-Type': contentType,
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'no-cache'
        });
        res.end(data);
    });
}

server.listen(PORT, HOST, () => {
    console.log('\n' + '='.repeat(50));
    console.log('🎮 게임 로컬 서버 시작');
    console.log('='.repeat(50));
    console.log(`\n🌐 브라우저에서 다음 주소로 접속하세요:\n`);
    console.log(`   http://${HOST}:${PORT}`);
    console.log(`\n📱 게임 목록:`);
    console.log(`   • Memory.html    - 애국가 학습 게임`);
    console.log(`   • index.html     - 메인 페이지\n`);
    console.log(`⛔ 서버를 중지하려면 Ctrl+C를 누르세요\n`);
    console.log('='.repeat(50) + '\n');
});

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`\n❌ 포트 ${PORT}가 이미 사용 중입니다.`);
        console.error(`\n해결 방법:`);
        console.error(`1. 다른 서버를 중지하세요.`);
        console.error(`2. 또는 server.js의 PORT를 변경하세요.\n`);
    } else {
        console.error('서버 오류:', err);
    }
    process.exit(1);
});
