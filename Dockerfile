FROM nginx:alpine
# COPY nginx.conf /etc/nginx
COPY site /usr/share/nginx/html
