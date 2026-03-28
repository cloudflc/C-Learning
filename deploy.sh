#!/bin/bash

PROJECT_DIR="/home/admin/C-Learning"
LOG_FILE="/home/admin/C-Learning/deploy.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> $LOG_FILE
}

log "========== 开始部署 =========="

cd $PROJECT_DIR || {
    log "错误: 无法进入项目目录 $PROJECT_DIR"
    exit 1
}

log "拉取最新代码..."
git pull origin main >> $LOG_FILE 2>&1

if [ $? -ne 0 ]; then
    log "错误: git pull 失败"
    exit 1
fi

log "安装服务器依赖..."
cd $PROJECT_DIR/server
npm install --production >> $LOG_FILE 2>&1

log "安装客户端依赖并构建..."
cd $PROJECT_DIR/client
npm install >> $LOG_FILE 2>&1
npm run build >> $LOG_FILE 2>&1

log "重启服务..."
pm2 restart cpp-learning-server >> $LOG_FILE 2>&1

log "部署完成!"
log "========== 部署结束 =========="
