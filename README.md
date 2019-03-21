# chrome-pdf
[![npm](https://img.shields.io/badge/npm-chrome--pdf-green.svg?logo=npm)](https://www.npmjs.com/package/chrome-pdf)

## Install
Sorry for the required usage of --unsafe-perm ¯\\\_(ツ)\_/¯
```
npm install -g --unsafe-perm chrome-pdf
```

```
apt install gconf-service \
libasound2 \
libatk1.0-0 \
libatk-bridge2.0-0 \
libc6 \
libcairo2 \
libcups2 \
libdbus-1-3 \
libexpat1 \
libfontconfig1 \
libgcc1 \
libgconf-2-4 \
libgdk-pixbuf2.0-0 \
libglib2.0-0 \
libgtk-3-0 \
libnspr4 \
libpango-1.0-0 \
libpangocairo-1.0-0 \
libstdc++6 \
libx11-6 \
libx11-xcb1 \
libxcb1 \
libxcomposite1 \
libxcursor1 \
libxdamage1 \
libxext6 \
libxfixes3 \
libxi6 \
libxrandr2 \
libxrender1 \
libxss1 \
libxtst6 \
ca-certificates \
fonts-liberation \
libappindicator1 \
libnss3 \
lsb-release \
xdg-utils \
wget
```

## Usage
Help:
```
chrome-pdf --help
```

Render a site:
```
chrome-pdf pdf --page https://bbc.co.uk --path output.pdf
```

Render HTML:
```
chrome-pdf pdf --content "<h1>chrome-pdf</h1>" --path output.pdf
```

Screenshot a site:
```
chrome-pdf screenshot --page https://bbc.co.uk --path output.png
```

Screenshot a fullpage site:
```
chrome-pdf screenshot --page https://bbc.co.uk --fullPage --path output.png
```
