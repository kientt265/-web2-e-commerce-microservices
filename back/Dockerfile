FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN prisma generate

RUN prisma db pull

RUN prisma db push

EXPOSE 3000

CMD ["npm", "run", "dev"]