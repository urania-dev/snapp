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
  - Optimized metric retention to 30 customizable via
    MAX_RETENTION_DAYS=number|false
- 0.4.0
  - REST API at /api
  - OpenApi via Redoc-Static at [/openapi.html](http://snapp.li/openapi.html)
  - Updated FrontEnd
  - Updated minor fixes on REST API docs
- 0.4.1
  - Fixed regex in new shorten creation
  - Fixed some mispell around
- 0.4.2
  - Fixed the DB inconsistencies when linking a volume through docker. It now
    pushes the db. not the most elegant fix.
- 0.4.3
  - Github version was missing a +layout file wrongly in gitignore, that would
    not expose metrics umami integrations
  - minor cleaning
- 0.5
  - Added a SMTP to send confirmation mail and recover password
  - Added Settings page to update own profile
  - Added ossibility to create admin on launch if not exists
  - Some cleaning around the reamde file
- 0.6
  - Added a better structure for admin and users roles and can(t)-do
  - New Users page for users management
  - New User page to inspect snapps and user profile
  - Admins can delete users, and change ownership of their snapps before delete
    if they want to.
  - Added CLI utility for promote / demote users to admin in order to mantain
    older versions of snapp
  - New Admin capabilities of creating users, even with signups locked, resend
    password recovery, and edit users profiles.
  - New SuperAdmin role to keep order and peace
  - Improved Settings with admin only panels for app management
  - New blacklist page for blocking emails, username and derogatory names, and
    suspicious domains involved in redirections
  - Added malicious domain check via VirusTotal API harmfullness > maliciousness
    votes balance on last check
  - Improved Homepage layout
  - Minor cleaning here and there
- 0.6.1
  - Added export to CSV for operating user, other users and all snapps on db.
  - Cleaned README and CHANGELOG
- 0.6.2
  - minor clean up of changelog
  - minor clean up of csv auth needed

---

### first rebase

---

- 0.7.test
  - Import CSV from previous version, first of all
  - Rebuilt on top of Redis (with RedisInsight UI for a major QOL upgrade)
    instead of SQLITE, now it doesn't relies on third part libraries and my cron
    abilities for expiring urls
  - reworked UI, now based on [Skeleton.dev UI](https://skeleton.dev)
  - API Docs are now documented by swagger
  - API now have rate limits
  - API now respond to token generated from user settings
  - Some here and there quality of life
  - As for now the test release is not set as uraniadev/snapp:latest but it has
    to be done manually due to the new database stack and architecture
- 0.7
  - Released
- 0.7.1
  - Provided placeholder default for better understanding of missing languages
    file
  - Corrected README unnecessarely mounting translation folder
  - Fixed overlay on Single Snapp dashboard
- 0.7.2
  - Fixed typo on docker compose in home and in readme
  - Fix on custom theme
  - Feature Requested: Allow unsecure HTTP url in redirection
- 0.7.3
  - Added Spanish and Galician languages by
    [cabaseira](https://github.com/cabaseira)
  - Minor fix to unsecure HTTP Edit to fix
    [Issue #26](https://github.com/urania-dev/snapp/issues/26)
  - Removed some dev console.logs.

---

### second rebase

---

- 0.8-beta
  - on the road to version 1: This is a new rebuilt on top of Svelte5, Tailwind,
    Prisma. It's a semplification in order to keep it more mantainable in the
    future.
  - Rebase of the project, new code for the same features as before.
  - Prisma comes back again instead of Redis, this should allow me to change the
    database behind the project and create different images for mysql pg and
    sqlite
  - fixed long time running bugs as not resettable secrets of usages, api
    endpoint with form submission protections, and so on.
- 0.8.1
  - Fixed database declination and instantiation.
  - Fixed some labels mishaps in auth process
  - Fixed some scrolling prevented from mobile
- 0.8.2
  - Fixed SQLite initialization, and .dockerignore fle
  - Fixed Duplication on pasting
  - Fixed typos in homepage
  - Fixed scrollbars on chrome (sorry, FF user here, i haven't noticed before.)
- 0.8.3
  - Restored Forgotten Umami Integration in settings, added to .env.example
  - Restore QRCode Creation and download
  - Fixed some minor UI Issues
- 0.8.4
  - Re-added snapp select and bulk delete
  - Fixed some inconsistencies during import, now it import creation date and
    visits
- 0.8.5
  - Fixed api errors on ordering and filtering
  - Fixed Docs url not working in homepage
  - Fixed Base url to ORIGIN instead of official snapp.li API REST Endpoint
  - Fixed UMAMI not linking
- 0.8.6
  - Restored ENV Configuration for initial setup
- 0.8.6.1
  - Found a typo in email for password recovery
  - Some cleaning here and there
  - Added test mail button
- 0.8.6.2
  - Added more deep SMTP configuration via external file, see README for more
- 0.8.6.3
  - Fixed password regex
- 0.8.6.4
  - Disabled combo-box in language choosing for better UI from mobile
  - Added Chinese language by [xja](https://github.com/xja)
    [see more...](https://github.com/urania-dev/snapp/issues/48)
- 0.8.6.5, 0.8.6.6
  - Update on README for better understanding of db.sqlite location path
    [see more...](https://github.com/urania-dev/snapp/issues/50)
  - Fixing SMTP and invitation email
    [see more..](https://github.com/urania-dev/snapp/issues/51)
  - Fixed incomplete flow on the URL dashboard
    [see more...](https://github.com/urania-dev/snapp/issues/52)
- 0.8.6.7
  - Fixed entrypoint.sh typo
    [see more...](https://github.com/urania-dev/snapp/issues/53)
- 0.8.7
  - Introducing tags with two options
    [link to discussion](https://github.com/urania-dev/snapp/discussions/56)
    - Regular: user can assign multiple tags to own snapp and browse tags panel
      being able to see others people tags
    - Path as Prefix: disable domain.com/[shortcode] and prefers
      domain.com/[tag]/[shortcode]
    - Path as prefix wouldn't not work as disambiguation for shortcodes
    - Path as prefix would be enable only by ENV VAR TAGS_AS_PREFIX due to the
      different behaviour of the app
  - Introducing Multi Factors Authentication (Enabled via UI / ENV)
    [link to discussion](https://github.com/urania-dev/snapp/discussions/57)
  - Various fixes found around
  - update .dockerignore and .gitignore
    [see more...](https://github.com/urania-dev/snapp/pull/58)
- 0.8.7.1
  - Fixes in Tags API
  - Keycloak OIDC integration
- 0.8.7.2
  - fix: prevent double encoding of redirection URLs
    [see more...](https://github.com/urania-dev/snapp/pull/61)
- 0.8.7.3
  - feat(auth): implement generic OpenID Connect authentication.
    [see more...](https://github.com/urania-dev/snapp/pull/65)
  - fix: Tags with no paths when feature is on (should throw error)
    [see more...](https://github.com/urania-dev/snapp/issues/63#issuecomment-2423712962)
- 0.8.7.4
  - fix: edit snapps when tags as prefix is on
    [see more...](https://github.com/urania-dev/snapp/issues/68)
  - fix: SMPT typo in log
  - added endpoint as request to generate qrcode `/api/qrcode/path`. It will
    just render a shortcode to ORIGIN/...path (ex example.com/abc
    example.com/abc/def)
  - updated readme for typo
- 0.8.7.4.1, 0.8.7.4.2
  - fix: tags and typos
- 0.8.7.4.3
  - fix: snapps creation payload not including tags
  - update on package.json dependencies
- 0.8.7.4.4
  - fix: snapps api not sanitizing input
- 0.8.7.5
  - general update, cleaning and optimization of the dependencies
- 0.8.8
  - general cleanup after updating some dependencies (svelte-search-params and
    svelte5 updates)
  - fixed cased https check
- 0.8.9
  - TOTP now have a failsafe on first attempt, if missed will prompt a new
    QRCODE for the user, also put two buttons to download code and code text,
    [see more...](https://github.com/urania-dev/snapp/discussions/72)
    [see more...](https://github.com/urania-dev/snapp/issues/74)
  - Fixed some TAGS misbehaviour
  - Fixed minor map check
  - Fixed copy link and QRCODE on Snapp details and Edit Snapps highlighting
    with Notes for no reason
    [see more...](https://github.com/urania-dev/snapp/issues/75)
