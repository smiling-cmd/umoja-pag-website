UMOJA P.A.G CHURCH — HOSTAFRICA FORM EMAIL SETUP
================================================

CONFIRMED SMTP SETTINGS
-----------------------
Server: mail.umojapagchurch.org
Port: 587
Encryption: STARTTLS
SMTP account used by website: umojapag@umojapagchurch.org

RECIPIENT ROUTING
-----------------
Event registrations -> umojapag@umojapagchurch.org
Contact messages     -> umojapag@umojapagchurch.org
Prayer requests      -> umojapag@umojapagchurch.org
Pastoral care        -> umojapag@umojapagchurch.org

Cell Groups          -> cellgroups@umojapagchurch.org
Worship Team         -> worship@umojapagchurch.org
Choir                -> choir@umojapagchurch.org
Media Team           -> media@umojapagchurch.org
Sunday School        -> sundayschool@umojapagchurch.org
Women's Fellowship   -> women@umojapagchurch.org
Men's Fellowship     -> men@umojapagchurch.org
Youth                -> youth@umojapagchurch.org

IMPORTANT PASSWORD RULE
-----------------------
Do NOT put the SMTP password in index.js, HTML, CSS, or anywhere inside public_html.
The real password belongs only in:

  domains/umojapagchurch.org/private/mail-config.php

The supplied mail-config.example.php is only a template.

SERVER FOLDER LAYOUT
--------------------
In DirectAdmin File Manager, the domain should end up like this:

  domains/
    umojapagchurch.org/
      composer.json
      vendor/
      private/
        mail-config.php
      public_html/
        index.html
        index.js
        ministries.html
        ministries.css
        events.html
        connect.html
        about.html
        giving.html
        privacy-policy.html
        api/
          _bootstrap.php
          register.php
          ministry-register.php
          contact-message.php
          prayer-request.php
          pastoral-care.php

STEP 1 — INSTALL PHPMAILER
--------------------------
Recommended: install with Composer from the domain root.

  cd ~/domains/umojapagchurch.org
  composer install --no-dev --optimize-autoloader

This creates:

  ~/domains/umojapagchurch.org/vendor/

If HOSTAFRICA does not provide Terminal/SSH/Composer, run Composer on your own computer
using the supplied composer.json, then upload the generated vendor folder to the domain root
(next to public_html, NOT inside api).

STEP 2 — CREATE PRIVATE SMTP CONFIG
-----------------------------------
Copy:

  private/mail-config.example.php

to:

  private/mail-config.php

Open mail-config.php and replace only:

  PASTE_THE_OFFICIAL_MAILBOX_PASSWORD_HERE

with the current password for:

  umojapag@umojapagchurch.org

Do not share that password in chat or screenshots.

STEP 3 — UPLOAD PUBLIC FILES
----------------------------
Upload/replace the contents of this package's public_html folder into the live domain's
public_html folder.

The important new backend folder is public_html/api/.

index.js has been changed from extensionless API URLs to:

  /api/register.php
  /api/ministry-register.php
  /api/contact-message.php
  /api/prayer-request.php
  /api/pastoral-care.php

STEP 4 — TEST ON THE LIVE HTTPS DOMAIN
--------------------------------------
Do not test email delivery from 127.0.0.1:5500 because the production API intentionally
accepts the live website origin.

Test on:

  https://umojapagchurch.org/

Tests:
1. Submit an event registration -> official mailbox.
2. Submit a contact message -> official mailbox.
3. Submit a prayer request -> official mailbox.
4. Submit a pastoral-care request -> official mailbox.
5. Open Ministries, click "Join the choir", submit -> choir mailbox.
6. Repeat with another ministry to confirm routing.

If an email fails, check DirectAdmin -> E-mail Manager -> SMTP Log and the hosting PHP error log.

SECURITY NOTES
--------------
- Recipient addresses are allowlisted in private server configuration.
- Visitors cannot submit an arbitrary recipient address.
- Visitor email is used only as Reply-To when provided.
- SMTP errors are logged server-side but are not exposed to visitors.
- Prayer/pastoral submissions go only to the official church mailbox.
- The existing honeypot fields remain active.
- The real SMTP password remains outside public_html.
