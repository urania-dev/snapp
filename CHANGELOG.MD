# Changelog

#### a.k.a. an unorthodox way of keeping track of my changes

- 0.0.0
  - Launch
- 0.1.0
  - Fixed CORS
  - HTTP/HTTPS authentication
- 0.2.0
  - QRCodes integrated
  - IP for metrics are gathered from X-Forward-For instead of X-Real-IP
  - Introduction of this changelog
- 0.2.1
  - QRCodes fix on PUBLIC_URL not being dynamic env
- 0.3.0
  - Integrated UMAMI metrics
  - Fixed secret snapp not always triggering redirect
  - Optimized metric retention to 30 customizable via MAX_RETENTION_DAYS=number|false
