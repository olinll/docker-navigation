FROM node:20-alpine

WORKDIR /app

# 先复制依赖文件，利用 Docker 层缓存
COPY package*.json ./
RUN npm ci --omit=dev

# 复制源码
COPY src/ ./src/

# ico 目录由用户挂载，不打包进镜像
# services.yaml 同理，由用户通过 volume 挂载

EXPOSE 3000

CMD ["node", "src/index.js"]
