FROM node:20-alpine as build

WORKDIR /admin

COPY package*.json ./
RUN npm install

RUN npm ci

COPY . .


EXPOSE 5174

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
