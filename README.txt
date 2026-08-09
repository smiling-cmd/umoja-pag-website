Umoja P.A.G Church Website

Official website project for Umoja Pentecostal Assembly of God (Umoja P.A.G Church), Nairobi, Kenya.

This repository contains the public frontend used for preview/deployment, together with a PHP/PHPMailer backend workspace for form delivery, ministry routing, and duplicate-registration protection.

1. Project Purpose

The website provides:

church information and history

service times

vision, mission, and core values

leadership profiles

ministry information

ministry registration

church events and event registration

prayer requests

pastoral-care requests

contact messages

giving information

church directions

social-media links

privacy information

The current content has been aligned to the church-provided website write-up.

2. Official Church Content

Church slogan

Transformed lives. Transforming lives.

Sunday schedule

First Service: 8:00 AM–10:00 AM

Second Service: 10:00 AM–12:30 PM

Teens Church: 10:00 AM–12:00 PM

Youth Service: 12:30 PM–1:45 PM

Children Church: runs concurrently with the main church services

Church history

Umoja P.A.G Church was officially inaugurated and dedicated on 26 March 1989 after nine founding members had consistently held prayer and worship at the church site.

Vision

A Christ-centred Church of distinction and influence to the world through the gospel of the Lord Jesus Christ and the power of the Holy Spirit.

Core values

Ministry

Integrity

Accountability

Community

Excellence

3. Ministries

The website currently includes:

Children Ministry

Teens Ministry

Youth Church

Men’s Ministry — TEEM

Ladies Ministry

Music Ministry — Praise & Worship

Music Ministry — Choir Team

Cell Groups

Missions & Evangelism

Media & ICT

Where the supplied church write-up did not provide a current programme, leader, or meeting schedule, the website avoids inventing one and directs visitors to contact the church.

4. Project Structure

C:\laragon\www\Umoja
│
├── index.html
├── about.html
├── ministries.html
├── events.html
├── giving.html
├── connect.html
├── privacy-policy.html
│
├── index.css
├── ministries.css
├── index.js
│
├── images\
│
├── robots.txt
├── sitemap.xml
├── .gitignore
│
├── domain-root\
│   ├── private\
│   │   ├── mail-config.php
│   │   └── registration-guard.sqlite
│   │
│   ├── public_html\
│   │   ├── index.html
│   │   ├── about.html
│   │   ├── ministries.html
│   │   ├── events.html
│   │   ├── giving.html
│   │   ├── connect.html
│   │   ├── privacy-policy.html
│   │   ├── index.css
│   │   ├── ministries.css
│   │   ├── index.js
│   │   └── api\
│   │       ├── _bootstrap.php
│   │       ├── register.php
│   │       ├── ministry-register.php
│   │       ├── contact-message.php
│   │       ├── prayer-request.php
│   │       └── pastoral-care.php
│   │
│   ├── vendor\
│   ├── composer.json
│   └── composer.lock
│
└── README.md

5. Why the Frontend Exists Twice

The project currently supports two environments.

Repository root

The root files are used for:

GitHub Pages preview

static client presentation

source control

GitHub Pages serves only static files.

domain-root/public_html

This copy is used for:

local PHP testing

HostAfrica deployment

PHP API endpoints

PHPMailer form processing

GitHub Pages cannot execute PHP, so forms only work through the PHP-hosted version.

Long-term, the frontend can be maintained as one canonical copy with a sync script to reduce duplication.

6. Local Development

Start the PHP site

Open a terminal:

cd C:\laragon\www\Umoja\domain-root
php -S 127.0.0.1:8080 -t public_html

Then open:

http://127.0.0.1:8080/

Useful pages:

http://127.0.0.1:8080/
http://127.0.0.1:8080/about.html
http://127.0.0.1:8080/ministries.html
http://127.0.0.1:8080/ministries.html#ministry-register
http://127.0.0.1:8080/events.html#register
http://127.0.0.1:8080/giving.html
http://127.0.0.1:8080/connect.html

Do not use Live Server on port 5500 for PHP form testing.

7. Composer / PHPMailer

PHPMailer is installed with Composer.

From:

C:\laragon\www\Umoja\domain-root

run:

composer install --no-dev --optimize-autoloader

Required autoload file:

domain-root\vendor\autoload.php

The backend currently uses PHPMailer through the shared API bootstrap.

8. Email Architecture

Main SMTP account

The website authenticates through the official church mailbox:

umojapag@umojapagchurch.org

SMTP configuration is stored only in:

domain-root\private\mail-config.php

SMTP settings

Host: mail.umojapagchurch.org
Port: 587
Encryption: STARTTLS / TLS
Authentication: enabled

Form routing

Event registrations → official church mailbox

Contact messages → official church mailbox

Prayer requests → official church mailbox

Pastoral-care requests → official church mailbox

Ministry registrations → selected ministry mailbox where available

Ministry mailboxes

cellgroups@umojapagchurch.org
worship@umojapagchurch.org
choir@umojapagchurch.org
media@umojapagchurch.org
sundayschool@umojapagchurch.org
women@umojapagchurch.org
men@umojapagchurch.org
youth@umojapagchurch.org

Additional ministry routing currently uses an existing appropriate mailbox or the official church mailbox when there is no dedicated ministry address.

Visitors' email addresses are used as Reply-To, not as the SMTP sender.

9. API Endpoints

The public forms send JSON POST requests to:

/api/register.php
/api/ministry-register.php
/api/contact-message.php
/api/prayer-request.php
/api/pastoral-care.php

Shared backend code lives in:

/api/_bootstrap.php

The bootstrap contains:

JSON response handling

request parsing

same-origin checks

server-side validation

Kenyan phone normalization

consent checks

honeypot checks

email template generation

PHPMailer setup

mail routing

duplicate-registration support

10. Duplicate Registration Protection

The website prevents the same person from registering repeatedly for the same event or ministry.

The duplicate rule is based on:

registration type + event/ministry + normalized phone + normalized email

Therefore:

same event + same phone + same email → rejected

different event + same phone/email → allowed

same ministry + same phone + same email → rejected

different ministry + same phone/email → allowed

The duplicate guard uses SQLite.

Required PHP extensions:

pdo_sqlite
sqlite3

Verify with:

php -m | findstr /I "pdo_sqlite sqlite3"

The database is created at:

domain-root\private\registration-guard.sqlite

The system stores a SHA-256 registration fingerprint rather than storing the phone/email combination directly in the duplicate table.

11. Backend Verification

Check PHP syntax:

php -l public_html\api\_bootstrap.php
php -l public_html\api\register.php
php -l public_html\api\ministry-register.php
php -l public_html\api\contact-message.php
php -l public_html\api\prayer-request.php
php -l public_html\api\pastoral-care.php

Check bootstrap functions:

php -r "require 'public_html/api/_bootstrap.php'; echo function_exists('request_data') ? 'request_data EXISTS' : 'request_data MISSING';"

Duplicate guard:

php -r "require 'public_html/api/_bootstrap.php'; echo function_exists('guard_unique_registration') ? 'duplicate guard EXISTS' : 'duplicate guard MISSING';"

Expected:

request_data EXISTS
duplicate guard EXISTS

12. Security

Never commit secrets

The following directory must remain outside Git tracking:

domain-root\

Current .gitignore should include:

# Local PHP/email backend - never publish to GitHub
domain-root/

# Secrets
.env
.env.*

Verify the SMTP config is ignored:

git check-ignore -v domain-root/private/mail-config.php

Verify it is not tracked:

git ls-files domain-root/private/mail-config.php

The second command should return nothing.

Never commit or share:

SMTP passwords

private mail configuration

.env files

server credentials

database backups containing private data

13. GitHub Pages

Repository:

smiling-cmd/umoja-pag-website

Expected GitHub Pages preview:

https://smiling-cmd.github.io/umoja-pag-website/

GitHub Pages is intended for visual/client preview.

It cannot execute:

PHP

PHPMailer

SQLite backend code

server-side API forms

The live HostAfrica version should be used for complete form functionality.

14. HostAfrica Deployment

Hosting environment:

HostAfrica

DirectAdmin

server host previously identified as da23.host-ww.net

Production structure should preserve:

private\
public_html\
vendor\
composer.json
composer.lock

The private folder should remain outside the public web root.

The production public_html folder should contain the frontend and API endpoints.

15. Giving Information

The church-provided write-up currently gives:

M-Pesa

Paybill: 4019029
Account: Your Name / purpose of giving

Bank / alternate M-Pesa route

The supplied material refers to:

Co-operative Bank
Buruburu branch
M-Pesa Paybill: 400200

The write-up does not provide a complete account/reference for the 400200 route.

The website should therefore not invent one. Visitors should be instructed to confirm the correct bank/payment reference with the church office.

16. Contact Information

Public church contact email shown on the website:

info@umojapagchurch.org

Church phone:

+254 796 752 298

Location:

Umoja Innercore, Nairobi, Kenya

The internal SMTP mailbox and the public-facing contact email do not need to be the same address.

17. Main Pages

Home — index.html

Includes:

church theme

slogan

service schedule

church introduction

ministry preview

events preview

calls to action

location and contact information

About — about.html

Includes:

church history

pastor

leadership

vision

mission

core values

Ministries — ministries.html

Includes:

ministry directory

full ministry descriptions

programme information supported by the write-up

ministry registration form

Events — events.html

Includes:

event listings

filters

event registration

QR registration support

Giving — giving.html

Includes:

tithes and offerings

M-Pesa details

bank-related information supported by the church write-up

Connect — connect.html

Includes:

directions

contact form

prayer request

pastoral-care request

church connection information

Privacy — privacy-policy.html

Explains website information handling and form usage.

18. Leadership Section

The leadership cards use:

portrait image

leader name

leadership role

Learn more button

modal details

Main classes:

.leadership-grid
.leadership-card
.leadership-photo
.leadership-name
.leadership-role
.leadership-more

The leadership section uses blue, gold, white, and cream with responsive card layouts.

Individual portrait position can be adjusted with:

style="--photo-pos: 50% 20%"

19. Visual Design Direction

The current design uses:

white and cream as dominant surfaces

deep blue for structural elements

gold for accents and buttons

editorial page layouts

large photography

subtle shadows

rounded corners

responsive navigation

smooth scroll/reveal motion

reduced-motion accessibility support

The aim is to feel modern and premium without losing the identity of a church/community website.

20. Accessibility

The site includes or should retain:

semantic headings

accessible form labels

keyboard-friendly buttons

aria states where required

focus states

skip links

descriptive image alt text

reduced-motion support

error messages connected to forms

responsive layouts

21. Testing Checklist

Before deployment, test:

Frontend

Home page

About page

Ministries page

Events page

Giving page

Connect page

Privacy page

mobile navigation

social links

map

QR code

leadership modal

responsive images

service times

footer links

Forms

event registration

duplicate event registration

ministry registration

duplicate ministry registration

contact message

prayer request

pastoral-care request

Reply-To email behaviour

Backend

SMTP authentication

TLS connection

JSON responses

SQLite duplicate database

same-origin security

honeypot handling

consent validation

phone validation

22. Temporary / Cleanup Folders

Folders such as:

_writeup_backup_*
umoja_writeup_patch_package\

are temporary development/backup material.

After the site is fully verified, they do not need to remain in the repository.

A useful backup location is:

C:\laragon\backups\Umoja\

Keep backups outside the Git repository.

23. Recommended Final Cleanup

Once the website is stable:

move temporary backups outside the repository

remove old patch-package folders

retain only current frontend source files

keep domain-root ignored

create a frontend sync script to copy root frontend files to domain-root/public_html

run all local form tests

verify the HostAfrica production version

check git status

confirm no secret file is staged

commit and push only the public frontend changes

24. Important Maintenance Rule

When church information changes, update both the visible content and any related backend logic.

Examples:

new service time → update Home/footer

new ministry → update Ministries page, form dropdown, and backend routing

new ministry email → update private mail config

new event → update Events data

giving details → verify with church leadership before publishing

privacy/form changes → update Privacy Policy

Do not publish unconfirmed church leadership, giving, ministry schedule, or contact information.

25. Current Status

At the latest development stage:

PHP backend is loading correctly

PHPMailer SMTP authentication is working

event email delivery is working

ministry email routing is working

prayer-request delivery is working

visitor Reply-To behaviour is working

SQLite support is enabled

duplicate-registration guard is installed

event registration uses duplicate protection

ministry registration uses duplicate protection

Teens Ministry and Missions & Evangelism are present

website content has been aligned to the supplied church write-up

frontend design is undergoing final visual polish

26. Final Deployment Principle

Use the root frontend for GitHub/client preview.

Use domain-root/public_html + API + private config + vendor for the working PHP/HostAfrica site.

Never expose the private directory or SMTP credentials publicly.

Umoja P.A.G ChurchTransformed lives. Transforming lives.
