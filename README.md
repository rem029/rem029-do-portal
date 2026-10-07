## Self sign

```
openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout private.dohaoasis.com.key -out private.dohaoasis.com.crt
```

#### SSL preferred location

`/etc/nginx/ssl/private.dohaoasis.com.key`

`/etc/nginx/ssl/private.dohaoasis.com.crt`

## Lets Encrypt local SSL

```
certbot certonly --manual --preferred-challenges=dns -d private.dohaoasis.com
```

### HTTP Port 80

```
server {
        listen 80;
        listen [::]:80;

        server_name private.dohaoasis.com;
        root /home/surveyadmin/survey_do/apps/frontend/build;
        index index.html index.htm index.nginx-debian.html;

        location /payload {
                proxy_pass  http://localhost:3004;
                proxy_http_version 1.1;
                proxy_set_header Upgrade $http_upgrade;
                proxy_set_header Connection 'upgrade';
                proxy_set_header Host $host;
                proxy_cache_bypass $http_upgrade;
                proxy_set_header X-Real-IP $remote_addr;
                proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
                proxy_set_header X-Forwarded-Proto $scheme;
                proxy_pass_request_headers on;
                proxy_set_header X-Forwarded-Host $host;
                proxy_set_header X-Forwarded-Server $host;
        }

        location /verify {
                rewrite /verify/(.*) /$1 break;
                proxy_pass  http://localhost:3003/;
                proxy_http_version 1.1;
                proxy_set_header Upgrade $http_upgrade;
                proxy_set_header Connection 'upgrade';
                proxy_set_header Host $host;
                proxy_cache_bypass $http_upgrade;
                proxy_set_header X-Real-IP $remote_addr;
                proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
                proxy_set_header X-Forwarded-Proto $scheme;
                proxy_pass_request_headers on;
                proxy_set_header X-Forwarded-Host $host;
                proxy_set_header X-Forwarded-Server $host;
        }

        location / {
                if ($http_referer ~* ^.*/payload/.*$ ) {
                 proxy_pass  http://localhost:3004;
                }

                if ($http_referer ~* ^.*/verify/.*$ ) {
                 proxy_pass  http://localhost:3004;
                }

                try_files $uri $uri/ /index.html;
        }

        access_log /var/log/nginx/api_survey_prod_access.log;
        error_log /var/log/nginx/api_survey_prod_error.log;
}
```

### HTTPS Port 443

```
server {
    listen 80;
    listen [::]:80;
    server_name private.dohaoasis.com;

    return 301 https://$server_name$request_uri;
}

server {
        listen 443 ssl;

        server_name private.dohaoasis.com;
        root /home/surveyadmin/survey_do/apps/frontend/build;
        index index.html index.htm index.nginx-debian.html;

        ssl_certificate /etc/nginx/ssl/private.dohaoasis.com.crt;
        ssl_certificate_key /etc/nginx/ssl/private.dohaoasis.com.key;

        location /payload {
                proxy_pass  http://localhost:3004;
                proxy_http_version 1.1;
                proxy_set_header Upgrade $http_upgrade;
                proxy_set_header Connection 'upgrade';
                proxy_set_header Host $host;
                proxy_cache_bypass $http_upgrade;
                proxy_set_header X-Real-IP $remote_addr;
                proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
                proxy_set_header X-Forwarded-Proto $scheme;
                proxy_pass_request_headers on;
                proxy_set_header X-Forwarded-Host $host;
                proxy_set_header X-Forwarded-Server $host;
        }

        location /verify {
                rewrite /verify/(.*) /$1 break;
                proxy_pass  http://localhost:3003/;
                proxy_http_version 1.1;
                proxy_set_header Upgrade $http_upgrade;
                proxy_set_header Connection 'upgrade';
                proxy_set_header Host $host;
                proxy_cache_bypass $http_upgrade;
                proxy_set_header X-Real-IP $remote_addr;
                proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
                proxy_set_header X-Forwarded-Proto $scheme;
                proxy_pass_request_headers on;
                proxy_set_header X-Forwarded-Host $host;
                proxy_set_header X-Forwarded-Server $host;
        }

        location / {
                if ($http_referer ~* ^.*/payload/.*$ ) {
                 proxy_pass  http://localhost:3004;
                }

                if ($http_referer ~* ^.*/verify/.*$ ) {
                 proxy_pass  http://localhost:3004;
                }

                try_files $uri $uri/ /index.html;
        }

        access_log /var/log/nginx/api_survey_prod_access.log;
        error_log /var/log/nginx/api_survey_prod_error.log;
}

_Itelict text test_
```
