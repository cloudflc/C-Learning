const http = require('http');
const crypto = require('crypto');
const { exec } = require('child_process');

const PORT = 9000;
const SECRET = process.env.WEBHOOK_SECRET || 'your-webhook-secret-here';
const DEPLOY_SCRIPT = '/home/admin/C-Learning/deploy.sh';

const server = http.createServer((req, res) => {
    if (req.method !== 'POST' || req.url !== '/webhook') {
        res.writeHead(404);
        res.end('Not Found');
        return;
    }

    let body = '';
    req.on('data', chunk => {
        body += chunk.toString();
    });

    req.on('end', () => {
        const signature = req.headers['x-hub-signature-256'];
        
        if (!signature) {
            console.log('缺少签名头');
            res.writeHead(401);
            res.end('Missing signature');
            return;
        }

        const expectedSignature = 'sha256=' + 
            crypto.createHmac('sha256', SECRET)
                .update(body)
                .digest('hex');

        if (signature !== expectedSignature) {
            console.log('签名验证失败');
            res.writeHead(401);
            res.end('Invalid signature');
            return;
        }

        try {
            const payload = JSON.parse(body);
            
            if (payload.ref === 'refs/heads/main' || payload.ref === 'refs/heads/master') {
                console.log('收到推送事件，开始部署...');
                
                exec(DEPLOY_SCRIPT, (error, stdout, stderr) => {
                    if (error) {
                        console.error('部署脚本执行失败:', error);
                        return;
                    }
                    console.log('部署输出:', stdout);
                    if (stderr) console.error('部署错误:', stderr);
                });
                
                res.writeHead(200);
                res.end('Deployment started');
            } else {
                console.log('忽略非主分支推送:', payload.ref);
                res.writeHead(200);
                res.end('Ignored');
            }
        } catch (e) {
            console.error('解析 payload 失败:', e);
            res.writeHead(400);
            res.end('Invalid payload');
        }
    });
});

server.listen(PORT, () => {
    console.log(`Webhook server listening on port ${PORT}`);
});
