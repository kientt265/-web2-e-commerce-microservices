# nginx-api-gateway/Dockerfile
FROM nginx:latest

RUN rm /etc/nginx/conf.d/default.conf

COPY ./conf.d/default.conf /etc/nginx/conf.d/

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]