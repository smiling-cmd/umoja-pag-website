UMOJA P.A.G CHURCH — WRITE-UP ALIGNMENT PATCH

Basis
-----
This patch aligns the public website wording with the supplied document:
"Website Write up- Umoja PAG (2).docx".

What was aligned
----------------
1. Homepage slogan changed to:
   Transformed lives. Transforming lives.

2. Sunday schedule changed to the supplied schedule:
   - First Service: 8:00 AM–10:00 AM
   - Second Service: 10:00 AM–12:30 PM
   - Teens Church: 10:00 AM–12:00 PM
   - Youth Service: 12:30 PM–1:45 PM
   - Children Church noted as running concurrently with the main services.

3. About content now includes:
   - official dedication date: 26 March 1989
   - nine founding members
   - the supplied mission
   - salt-and-light journey wording
   - core values: Ministry, Integrity, Accountability, Community, Excellence

4. Ministries aligned to the supplied ministry structure:
   - Children Ministry
   - Teens Ministry
   - Youth Church
   - Men's Ministry / TEEM
   - Ladies Ministry
   - Music Ministry (Praise & Worship + Choir Team)
   - Cell Groups
   - Missions & Evangelism
   - Media & ICT

   Unsupported rehearsal times, made-up ministry schedules and unsupported ministry-leader
   names were removed from the ministry descriptions. Where the write-up only names a
   ministry but gives no programme details (Missions & Evangelism; Media & ICT), the site
   directs visitors to contact the church instead of inventing details.

5. Giving aligned to the supplied write-up:
   - M-Pesa Paybill 4019029
   - Account/reference wording: Your Name # Tithe or Offering
   - Cheques payable to Umoja PAG Church
   - Co-operative Bank, Buruburu branch
   - Alternative M-Pesa Paybill 400200

IMPORTANT GIVING NOTE
---------------------
The supplied write-up does NOT state the account/reference to use with Paybill 400200.
The patch deliberately does not invent one. The public page tells visitors to confirm it
with the church office before sending money.

6. Public contact email remains:
   info@umojapagchurch.org

How to use on the CURRENT local project
---------------------------------------
The current local site contains newer PHP/form work than the older front-end snapshot
available in ChatGPT. To avoid overwriting those newer forms, use the included patcher:

  cd C:\laragon\www\Umoja
  python apply_writeup_alignment.py .

The script backs up every file it touches before editing both:
  - the repository-root GitHub preview files, and
  - domain-root\public_html local PHP-copy files (when present).

After running it:
  1. Start the local PHP server.
  2. Refresh with Ctrl+F5.
  3. Check Home, About, Ministries, Giving, Connect and the footers.
  4. If the current Ministries page has the registration dropdown, the patcher updates
     its public options to the write-up names.
  5. Replace domain-root\public_html\api\ministry-register.php with the copy in
     backend-patches if you want the new Teens Ministry and Missions & Evangelism options
     to route successfully.

Do not put private/mail-config.php into Git.

Source wording note
-------------------
The public copy follows the supplied write-up. Obvious presentation/grammar issues were
normalised for readable website copy. Factual gaps were NOT guessed. In particular, the
write-up contains an internally inconsistent Sunday School time entry and does not provide
the Paybill 400200 account/reference; the patch uses the clearly stated main Sunday-service
schedule for the public Children Church note and explicitly asks visitors to confirm the
missing 400200 reference with the church office.
