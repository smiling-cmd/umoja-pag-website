from __future__ import annotations

import argparse
import re
import shutil
from datetime import datetime
from pathlib import Path

OFFICIAL_TAGLINE = "Transformed lives. Transforming lives."
FOOTER_SERVICES = (
    '<div class="footer-col"><h4>Services</h4>'
    '<a href="index.html#services">First Service 8:00–10:00 AM</a>'
    '<a href="index.html#services">Second Service 10:00 AM–12:30 PM</a>'
    '<a href="index.html#services">Teens Church 10:00 AM–12:00 PM</a>'
    '<a href="index.html#services">Youth Service 12:30–1:45 PM</a></div>'
)

SERVICE_ROW = '''<div class="editorial-service-row" id="services" aria-label="Sunday service times">
        <div class="editorial-service"><span>First Service</span><strong>8:00–10:00 AM</strong></div>
        <div class="editorial-service"><span>Second Service</span><strong>10:00 AM–12:30 PM</strong></div>
        <div class="editorial-service"><span>Teens Church</span><strong>10:00 AM–12:00 PM</strong></div>
        <div class="editorial-service"><span>Youth Service</span><strong>12:30–1:45 PM</strong></div>
      </div>
      <p class="editorial-service-note">Children Church runs concurrently with the main church services.</p>'''

MINISTRY_NAV = '''<nav class="ministry-jump-nav" aria-label="Jump to a ministry">
<a href="#sunday-school">Children Ministry</a><a href="#teens-ministry">Teens Ministry</a><a href="#youth">Youth Church</a><a href="#worship-team">Music Ministry</a><a href="#choir">Choir Team</a><a href="#cell-groups">Cell Groups</a><a href="#mens-fellowship">Men’s Ministry</a><a href="#womens-fellowship">Ladies Ministry</a><a href="#missions-evangelism">Missions &amp; Evangelism</a><a href="#media-team">Media &amp; ICT</a>
</nav>'''

ARTICLES: dict[str, str] = {
    "cell-groups": '''<article aria-labelledby="cell-groups-title" class="min-card reveal" id="cell-groups">
<img alt="Cell Groups at Umoja P.A.G Church" decoding="async" height="650" loading="lazy" src="images/cell groups background.jpg" width="900"/>
<div>
<h2 id="cell-groups-title">Cell Groups</h2>
<p>Cell Groups are small ministry groups of believers where regular worship, intercessory prayer, accountability and fellowship within God’s Word bind individuals into a cohesive unit of the Body of Christ as Umoja P.A.G Assembly.</p>
<p class="min-desc-more">They provide primary pastoral care on a one-on-one basis and a place where each person can feel connected, nurtured and supported. Cell Groups gather at least once a week based on area of residence or work.</p>
<div class="expect-title">Purpose</div>
<ul class="expect-list"><li>Regular worship and intercessory prayer</li><li>Accountability and fellowship in God’s Word</li><li>Primary pastoral care and practical support</li><li>Weekly connection based on area of residence or work</li></ul>
<div class="info-panel"><div class="info-row"><strong>Meets</strong><span>At least once a week</span></div><div class="info-row"><strong>Who</strong><span>Every church member is encouraged to belong and participate</span></div></div>
<div class="btn-row"><a class="btn-primary" href="connect.html#join">Join a cell group</a></div>
</div>
</article>''',

    "worship-team": '''<article aria-labelledby="worship-team-title" class="min-card reveal" id="worship-team">
<img alt="Praise and Worship Ministry" decoding="async" height="650" loading="lazy" src="images/background.jpg" width="900"/>
<div>
<h2 id="worship-team-title">Music Ministry — Praise &amp; Worship</h2>
<p>The Music Ministry encompasses vocalists who have dedicated themselves to God to lead the Body of Christ in praise, worship, psalms and hymns during church services and church-led activities.</p>
<p class="min-desc-more">Its goal is proclaiming God’s dominion and power to all nations through songs, while remaining submitted to God as ministry vessels that edify people’s lives.</p>
<div class="info-panel"><div class="info-row"><strong>Music Ministry</strong><span>Praise and Worship Ministry</span></div><div class="info-row"><strong>Goal</strong><span>Proclaim God’s dominion and power to all nations through songs</span></div></div>
<div class="btn-row"><a class="btn-primary" href="connect.html#join">Join Praise &amp; Worship</a></div>
</div>
</article>''',

    "choir": '''<article aria-labelledby="choir-title" class="min-card reveal" id="choir">
<img alt="Umoja P.A.G Church choir" decoding="async" height="650" loading="lazy" src="images/choir 2.jpg" width="900"/>
<div>
<h2 id="choir-title">Music Ministry — Choir Team</h2>
<p>The Choir Team is part of the Music Ministry, serving through praise, worship, psalms and hymns during church services and church-led activities.</p>
<p class="min-desc-more">Together with the Praise and Worship Ministry, the choir serves the Music Ministry’s goal of proclaiming God’s dominion and power through song and edifying people’s lives.</p>
<div class="info-panel"><div class="info-row"><strong>Music Ministry</strong><span>Choir Team</span></div><div class="info-row"><strong>Goal</strong><span>Edify people’s lives and proclaim God’s power through song</span></div></div>
<div class="btn-row"><a class="btn-primary" href="connect.html#join">Join the Choir Team</a></div>
</div>
</article>''',

    "media-team": '''<article aria-labelledby="media-team-title" class="min-card reveal" id="media-team">
<img alt="Media and ICT ministry" decoding="async" height="650" loading="lazy" src="images/media.jpg" width="900"/>
<div>
<h2 id="media-team-title">Media &amp; ICT</h2>
<p>Media &amp; ICT is listed among the ministries of Umoja P.A.G Church.</p>
<p class="min-desc-more">The supplied church write-up does not specify its current programmes or meeting schedule. Please contact the church for current information and ways to serve.</p>
<div class="btn-row"><a class="btn-primary" href="connect.html#contact">Contact the church</a></div>
</div>
</article>''',

    "sunday-school": '''<article aria-labelledby="sunday-school-title" class="min-card reveal" id="sunday-school">
<img alt="Children Ministry and Sunday School" decoding="async" height="650" loading="lazy" src="images/sunday schoool.jpg" width="900"/>
<div>
<h2 id="sunday-school-title">Children Ministry</h2>
<p>Umoja P.A.G Church upholds the words of Jesus in Matthew 19:14 and is committed to teaching children the Bible, training them in the way of God, and nurturing their God-given gifts.</p>
<p class="min-desc-more"><strong>Vision:</strong> Transforming and empowering children with the Word of God to transform the world.</p>
<div class="expect-title">Ministry scope</div>
<ul class="expect-list"><li>Sunday School classes</li><li>Bible study, devotions and Bible exposition</li><li>Guiding, counselling and discipleship</li><li>Personal-development programmes and Christian activities</li><li>DVBS</li></ul>
<div class="info-panel"><div class="info-row"><strong>Sunday School</strong><span>Runs during the main Sunday-service periods</span></div><div class="info-row"><strong>Children Church</strong><span>Runs concurrently with the main church services</span></div></div>
<div class="btn-row"><a class="btn-primary" href="connect.html#join">Connect with Children Ministry</a></div>
</div>
</article>''',

    "womens-fellowship": '''<article aria-labelledby="womens-fellowship-title" class="min-card reveal" id="womens-fellowship">
<img alt="Ladies Ministry gathering" decoding="async" height="650" loading="lazy" src="images/women fellowship.jpg" width="900"/>
<div>
<h2 id="womens-fellowship-title">Ladies Ministry</h2>
<p>At Umoja P.A.G Church, there is a place for every lady to be ministered to, to serve and to grow in God.</p>
<p class="min-desc-more"><strong>Goal:</strong> To nurture a holistic woman in matters of faith and physical life so that she can effectively stand in her rightful position in the purpose of God.</p>
<div class="expect-title">Programs</div>
<ul class="expect-list"><li>Morning Prayer — every Wednesday, 5:00 AM–6:00 AM</li><li>Service and Fellowship — third Saturday of the month</li><li>Ladies Week — annually in June</li></ul>
<div class="btn-row"><a class="btn-primary" href="connect.html#join">Join Ladies Ministry</a></div>
</div>
</article>''',

    "mens-fellowship": '''<article aria-labelledby="mens-fellowship-title" class="min-card reveal" id="mens-fellowship">
<img alt="Men’s Ministry fellowship" decoding="async" height="650" loading="lazy" src="images/men fellowship.jpg" width="900"/>
<div>
<h2 id="mens-fellowship-title">Men’s Ministry — TEEM</h2>
<p>Popularly referred to as TEEM — Transformed, Empowered and Equipped Men — this is a fellowship of all men in the church.</p>
<p class="min-desc-more"><strong>Vision:</strong> A transformed, empowered and equipped circle of Christian men impacting families and transforming communities to the glory of God. <strong>Goal:</strong> Men growing in Christ-likeness.</p>
<div class="expect-title">Programs</div>
<ul class="expect-list"><li>Morning Prayer &amp; Word — every Monday, 5:30 AM–6:30 AM</li><li>Service and Fellowship — every last Saturday of the month</li><li>Men’s Convention — annually in May</li></ul>
<div class="btn-row"><a class="btn-primary" href="connect.html#join">Join Men’s Ministry</a></div>
</div>
</article>''',

    "youth": '''<article aria-labelledby="youth-title" class="min-card reveal" id="youth">
<img alt="Youth Church gathering" decoding="async" height="650" loading="lazy" src="images/youth background.jpg" width="900"/>
<div>
<h2 id="youth-title">Youth Church</h2>
<p><strong>Vision:</strong> Raising mighty people, with mighty faith and glorifying God.</p>
<p class="min-desc-more">The ministry seeks to achieve this by receiving Christ, walking, rooted and built up in Him, and established in faith, in line with Colossians 2:6–7.</p>
<div class="expect-title">Objectives</div>
<ul class="expect-list"><li>Building people</li><li>Building dreams</li><li>Building the Kingdom of God</li></ul>
<div class="info-panel"><div class="info-row"><strong>Youth Service</strong><span>Sunday, 12:30 PM–1:45 PM</span></div><div class="info-row"><strong>Bible Study &amp; Discipleship</strong><span>At every Family Group</span></div></div>
<div class="btn-row"><a class="btn-primary" href="connect.html#join">Connect with Youth Church</a></div>
</div>
</article>''',
}

TEENS_ARTICLE = '''<article aria-labelledby="teens-ministry-title" class="min-card reveal" id="teens-ministry">
<img alt="Teens Ministry" decoding="async" height="650" loading="lazy" src="images/youth background.jpg" width="900"/>
<div>
<h2 id="teens-ministry-title">Teens Ministry</h2>
<p>A ministry for those who are 13–19 years of age.</p>
<p class="min-desc-more"><strong>Mission:</strong> “Not lagging in diligence, fervent in spirit, serving the Lord” — Romans 12:11 (NKJV).</p>
<div class="info-panel"><div class="info-row"><strong>Service</strong><span>Sunday, 10:00 AM–12:00 PM</span></div><div class="info-row"><strong>Age</strong><span>13–19 years</span></div></div>
<div class="btn-row"><a class="btn-primary" href="connect.html#join">Connect with Teens Ministry</a></div>
</div>
</article>'''

MISSIONS_ARTICLE = '''<article aria-labelledby="missions-evangelism-title" class="min-card reveal" id="missions-evangelism">
<img alt="Missions and Evangelism ministry" decoding="async" height="650" loading="lazy" src="images/Church.jpg" width="900"/>
<div>
<h2 id="missions-evangelism-title">Missions &amp; Evangelism</h2>
<p>Missions &amp; Evangelism is listed among the ministries of Umoja P.A.G Church.</p>
<p class="min-desc-more">The supplied church write-up does not specify its current programmes or meeting schedule. Please contact the church for current information and ways to participate.</p>
<div class="btn-row"><a class="btn-primary" href="connect.html#contact">Contact the church</a></div>
</div>
</article>'''

MINISTRY_OPTIONS = '''<option value="">Select a ministry</option>
<option value="sunday-school">Children Ministry</option>
<option value="teens-ministry">Teens Ministry</option>
<option value="youth">Youth Church</option>
<option value="mens-fellowship">Men’s Ministry (TEEM)</option>
<option value="womens-fellowship">Ladies Ministry</option>
<option value="worship-team">Music Ministry — Praise &amp; Worship</option>
<option value="choir">Music Ministry — Choir Team</option>
<option value="cell-groups">Cell Groups</option>
<option value="missions-evangelism">Missions &amp; Evangelism</option>
<option value="media-team">Media &amp; ICT</option>'''


def replace_article(text: str, article_id: str, replacement: str) -> tuple[str, bool]:
    pat = re.compile(
        rf'<article\b(?=[^>]*\bid=["\']{re.escape(article_id)}["\'])[^>]*>.*?</article>',
        re.I | re.S,
    )
    new, n = pat.subn(replacement, text, count=1)
    return new, bool(n)


def patch_globals(text: str) -> str:
    text = text.replace('“United in Faith, Rooted in Love” · Umoja, Nairobi, Kenya', f'“{OFFICIAL_TAGLINE}” · Umoja, Nairobi, Kenya')
    text = text.replace('"United in Faith, Rooted in Love" · Umoja, Nairobi, Kenya', f'“{OFFICIAL_TAGLINE}” · Umoja, Nairobi, Kenya')
    text = re.sub(r'<div class="footer-col"><h4>Services</h4>.*?</div>', FOOTER_SERVICES, text, flags=re.I | re.S)
    text = text.replace('Sunday: 8:15 AM · 10:15 AM · Youth 12:30 PM', 'Sunday: First Service 8:00–10:00 AM · Second Service 10:00 AM–12:30 PM · Teens 10:00 AM–12:00 PM · Youth 12:30–1:45 PM')
    text = text.replace('First Service 8:15 AM · Second Service 10:15 AM · Youth Service 12:30 PM.', 'First Service 8:00–10:00 AM · Second Service 10:00 AM–12:30 PM · Teens Church 10:00 AM–12:00 PM · Youth Service 12:30–1:45 PM.')
    return text


def patch_index(text: str) -> str:
    text = patch_globals(text)
    text = re.sub(r'<div class="home-kicker">A church family in Umoja, Nairobi</div>', '<div class="home-kicker">Welcome to Umoja Pentecostal Assembly of God</div>', text, count=1)
    text = re.sub(r'<h1 id="home-title">.*?</h1>', '<h1 id="home-title">Transformed lives. <em>Transforming lives.</em></h1>', text, count=1, flags=re.S)
    text = re.sub(r'<p class="editorial-hero-lead">.*?</p>', '<p class="editorial-hero-lead">Join us this Sunday for worship, prayer &amp; Word.</p>', text, count=1, flags=re.S)
    text = re.sub(r'<div class="editorial-service-row"[^>]*>(?:\s*<div class="editorial-service">.*?</div>)+\s*</div>(?:\s*<p class="editorial-service-note">.*?</p>)?', SERVICE_ROW, text, count=1, flags=re.S)
    text = text.replace('We are a vibrant Pentecostal Assemblies of God church in Umoja, Nairobi. Through worship, prayer, the Word, fellowship, and practical service, we help people grow in Christ and live out their faith in everyday life.', 'Umoja P.A.G Church is a family church of distinction that exists to worship God in truth and Spirit, proclaim the Word of God, and advance the Kingdom of God through evangelism, discipleship, social and economic programmes and capacity building through the power of the Holy Spirit in Kenya and beyond.')
    preview_pat = re.compile(r'<div class="home-ministry-index reveal">.*?<div class="home-ministry-button-row"><a class="btn-primary" href="ministries\.html">Explore Every Ministry →</a></div>\s*</div>', re.S)
    preview = '''<div class="home-ministry-index reveal">
          <a class="home-ministry-link" href="ministries.html#sunday-school"><span class="home-ministry-number">01</span><span><h3>Children &amp; Teens</h3><p>Bible teaching, discipleship and age-appropriate ministry for children and teens.</p></span><span class="home-ministry-arrow">→</span></a>
          <a class="home-ministry-link" href="ministries.html#youth"><span class="home-ministry-number">02</span><span><h3>Youth Church</h3><p>Raising mighty people with mighty faith who glorify God.</p></span><span class="home-ministry-arrow">→</span></a>
          <a class="home-ministry-link" href="ministries.html#worship-team"><span class="home-ministry-number">03</span><span><h3>Music Ministry</h3><p>Praise &amp; Worship and Choir serving through songs, psalms and hymns.</p></span><span class="home-ministry-arrow">→</span></a>
          <a class="home-ministry-link" href="ministries.html#cell-groups"><span class="home-ministry-number">04</span><span><h3>Cell Groups</h3><p>Weekly worship, prayer, accountability and fellowship in God’s Word.</p></span><span class="home-ministry-arrow">→</span></a>
          <a class="home-ministry-link" href="ministries.html#mens-fellowship"><span class="home-ministry-number">05</span><span><h3>Men &amp; Ladies Ministries</h3><p>Fellowship, prayer, growth and service for men and women.</p></span><span class="home-ministry-arrow">→</span></a>
          <a class="home-ministry-link" href="ministries.html#missions-evangelism"><span class="home-ministry-number">06</span><span><h3>Missions, Evangelism, Media &amp; ICT</h3><p>Explore the church’s outreach and media ministry pathways.</p></span><span class="home-ministry-arrow">→</span></a>
          <div class="home-ministry-button-row"><a class="btn-primary" href="ministries.html">Explore Every Ministry →</a></div>
        </div>'''
    text = preview_pat.sub(preview, text, count=1)
    text = text.replace('Join either morning service or the dedicated youth service at 12:30 PM.', 'First Service is 8:00–10:00 AM, Second Service is 10:00 AM–12:30 PM, Teens Church is 10:00 AM–12:00 PM, and Youth Service is 12:30–1:45 PM.')
    return text


def patch_about(text: str) -> str:
    text = patch_globals(text)
    text = text.replace('<div class="about-stat-num">10+</div>\n<div class="about-stat-label">Years of<br/>Ministry</div>', '<div class="about-stat-num">1989</div>\n<div class="about-stat-label">Dedicated<br/>26 March</div>')
    desc_pat = re.compile(r'(?:<p class="about-desc reveal d2">.*?</p>\s*){2}', re.S)
    source_desc = '''<p class="about-desc reveal d2">Umoja P.A.G Church was officially inaugurated and dedicated on 26 March 1989, after nine founding members had consistently held prayers and worship at the site for a few years.</p>
<p class="about-desc reveal d2">Our mission is to worship God in truth and Spirit, proclaim the Word of God, and advance the Kingdom of God through evangelism, discipleship, social and economic programmes and capacity building through the power of the Holy Spirit in Kenya and beyond.</p>
<p class="about-desc reveal d2">After its dedication, the church was commissioned to become salt and light to the community. Through God’s grace, the power of the Holy Spirit, prayer and the commitment of members, the church has grown into the congregation it is today.</p>'''
    text = desc_pat.sub(source_desc, text, count=1)
    for old, new in [
        ('Prayer First', 'Ministry'), ('Spirit-Led', 'Integrity'), ('Family in Christ', 'Accountability'), ('Biblical Truth', 'Community'), ('Love in Action', 'Excellence')
    ]:
        text = text.replace(old, new, 1)

    value_descriptions = {
        'Ministry': 'Committed to teaching the Word, enriching fellowship, fervent prayer, and Bible-based praise and worship, with the goal of producing the Fruit of the Holy Spirit in believers.',
        'Integrity': 'Committed to honesty, openness, moral integrity and financial integrity, living in holiness and honouring God in a manner worthy of our calling.',
        'Accountability': 'Accountable to God, His Word and one another, with a culture of transparency and trust.',
        'Community': 'A family that supports one another, embraces unity, encourages fellowship and prayer, and reaches outward as light and salt to the world.',
        'Excellence': 'Endeavouring to do ministry in God’s way and to the best standard possible, according to the revelation and grace God gives us.',
    }
    for heading, desc in value_descriptions.items():
        pat = re.compile(rf'(<div class="value-card[^>]*>\s*<div class="value-card-num">.*?</div>\s*<h3>{re.escape(heading)}</h3>)(?!\s*<p class="value-card-copy">)', re.S)
        text = pat.sub(rf'\1\n<p class="value-card-copy">{desc}</p>', text, count=1)
    return text


def patch_ministries(text: str) -> str:
    text = patch_globals(text)
    # Remove articles inserted by an earlier run so the patch is idempotent.
    text, _ = replace_article(text, 'teens-ministry', '')
    text, _ = replace_article(text, 'missions-evangelism', '')
    text = text.replace('Explore cell groups, worship, choir, media, Sunday School, women’s and men’s fellowships, and youth ministry at Umoja P.A.G Church.', 'Explore the Children, Teens, Youth, Men’s, Ladies, Music, Cell Groups, Missions & Evangelism, and Media & ICT ministries of Umoja P.A.G Church.')
    text = re.sub(r'<p class="page-hero-copy">.*?</p>', '<p class="page-hero-copy">At the core of our church is ministry: helping Christians grow in faith, love and the knowledge of God, and equipping them to live the quality life of Jesus Christ and glorify God wherever they are.</p>', text, count=1, flags=re.S)
    text = re.sub(r'<nav class="ministry-jump-nav"[^>]*>.*?</nav>', MINISTRY_NAV, text, count=1, flags=re.S)

    # Replace known ministry articles while keeping existing IDs/links compatible.
    for article_id in ['cell-groups', 'worship-team', 'choir', 'media-team', 'womens-fellowship', 'mens-fellowship']:
        text, _ = replace_article(text, article_id, ARTICLES[article_id])

    # Children article + dedicated Teens article.
    children_combo = ARTICLES['sunday-school'] + '\n' + TEENS_ARTICLE
    text, found_children = replace_article(text, 'sunday-school', children_combo)
    if not found_children and 'id="teens-ministry"' not in text:
        text = text.replace('<div class="page-actions">', children_combo + '\n<div class="page-actions">', 1)

    # Youth article + Missions & Evangelism.
    youth_combo = ARTICLES['youth'] + '\n' + MISSIONS_ARTICLE
    text, found_youth = replace_article(text, 'youth', youth_combo)
    if not found_youth and 'id="missions-evangelism"' not in text:
        text = text.replace('<div class="page-actions">', youth_combo + '\n<div class="page-actions">', 1)

    # If a newer build contains a ministry-registration select, align its public labels.
    select_pat = re.compile(r'(<select\b[^>]*\bname=["\']ministry["\'][^>]*>).*?(</select>)', re.I | re.S)
    text = select_pat.sub(lambda m: m.group(1) + '\n' + MINISTRY_OPTIONS + '\n' + m.group(2), text)
    return text


def patch_giving(text: str) -> str:
    text = patch_globals(text)
    text = text.replace('View M-Pesa and bank details for tithes and offerings to Umoja P.A.G Church.', 'View the church-supplied M-Pesa, cheque and Co-operative Bank giving details for Umoja P.A.G Church.')
    text = text.replace('Account Number: <span class="method-code">Your Name</span>', 'Account Number: <span class="method-code">Your Name # Tithe or Offering</span>')
    bank_pat = re.compile(r'<div class="method-title">Bank Transfer</div>\s*<div class="method-detail">.*?</div>', re.I | re.S)
    bank_repl = '''<div class="method-title">Bank Deposit / Cheque</div>
<div class="method-detail">
              Make cheque payable to: <strong>Umoja PAG Church</strong><br/>
              Bank: <strong>Co-operative Bank</strong><br/>
              Branch: <strong>Buruburu branch</strong><br/>
              Alternative M-Pesa Paybill: <strong>400200</strong><br/>
              <small>The supplied church write-up does not state the account/reference for Paybill 400200. Confirm it with the church office before sending.</small>
</div>'''
    text = bank_pat.sub(bank_repl, text, count=1)
    # Catch versions where only bank labels/numbers differ.
    text = text.replace('<strong>Equity Bank</strong>', '<strong>Co-operative Bank</strong>')
    text = text.replace('<strong>0112 8103159700</strong>', '<strong>Contact church office for current account/reference</strong>')
    return text


def patch_privacy(text: str) -> str:
    text = patch_globals(text)
    if '<strong>Ministry registration:</strong>' not in text:
        marker = '<li><strong>Event registration:</strong>'
        pos = text.find(marker)
        if pos != -1:
            end = text.find('</li>', pos)
            if end != -1:
                end += 5
                text = text[:end] + '\n<li><strong>Ministry registration:</strong> name, phone number, optional email address, selected ministry, optional message, and consent.</li>' + text[end:]
    return text


def patch_file(path: Path) -> bool:
    if not path.exists() or path.suffix.lower() != '.html':
        return False
    original = path.read_text(encoding='utf-8')
    name = path.name.lower()
    if name == 'index.html':
        updated = patch_index(original)
    elif name == 'about.html':
        updated = patch_about(original)
    elif name == 'ministries.html':
        updated = patch_ministries(original)
    elif name == 'giving.html':
        updated = patch_giving(original)
    elif name == 'privacy-policy.html':
        updated = patch_privacy(original)
    else:
        updated = patch_globals(original)
    if updated != original:
        path.write_text(updated, encoding='utf-8', newline='\n')
        return True
    return False


def patch_css(path: Path) -> bool:
    if not path.exists():
        return False
    original = path.read_text(encoding='utf-8')
    updated = re.sub(
        r'(\.editorial-service-row\s*\{.*?grid-template-columns:\s*)repeat\([^;]+\)(;)',
        r'\1repeat(4, minmax(0, 1fr))\2',
        original,
        count=1,
        flags=re.S,
    )
    updated = re.sub(
        r'(\.values-grid-5\s*\{.*?grid-template-columns:\s*)[^;]+(;)',
        r'\1repeat(3, minmax(0, 1fr))\2',
        updated,
        count=1,
        flags=re.S,
    )
    if '.editorial-service-note {' not in updated:
        updated += '''\n\n/* Official children-service note from church write-up */\n.editorial-service-note {\n  margin: 12px 0 0;\n  color: var(--site-text-soft, #5f6b7a);\n  font-size: 0.9rem;\n  line-height: 1.6;\n}\n'''
    if updated != original:
        path.write_text(updated, encoding='utf-8', newline='\n')
        return True
    return False


def patch_tree(root: Path) -> list[Path]:
    changed: list[Path] = []
    for filename in ['index.html', 'about.html', 'ministries.html', 'events.html', 'giving.html', 'connect.html', 'privacy-policy.html']:
        p = root / filename
        if patch_file(p):
            changed.append(p)
    css = root / 'index.css'
    if patch_css(css):
        changed.append(css)
    return changed


def main() -> None:
    parser = argparse.ArgumentParser(description='Align Umoja P.A.G website content with the supplied church write-up.')
    parser.add_argument('root', nargs='?', default='.', help='Repository root, default: current directory')
    args = parser.parse_args()
    repo = Path(args.root).resolve()
    if not (repo / 'index.html').exists() and not (repo / 'domain-root' / 'public_html' / 'index.html').exists():
        raise SystemExit(f'Could not find the Umoja site under: {repo}')

    stamp = datetime.now().strftime('%Y%m%d-%H%M%S-%f')
    backup = repo / f'_writeup_backup_{stamp}'
    backup.mkdir(parents=True, exist_ok=False)

    targets = []
    if (repo / 'index.html').exists():
        targets.append(repo)
    local_public = repo / 'domain-root' / 'public_html'
    if (local_public / 'index.html').exists():
        targets.append(local_public)

    # Back up only files this patch can touch.
    for target in targets:
        rel = target.relative_to(repo) if target != repo else Path('repo-root')
        dest = backup / rel
        dest.mkdir(parents=True, exist_ok=True)
        for filename in ['index.html', 'about.html', 'ministries.html', 'events.html', 'giving.html', 'connect.html', 'privacy-policy.html', 'index.css']:
            src = target / filename
            if src.exists():
                shutil.copy2(src, dest / filename)

    changed: list[Path] = []
    for target in targets:
        changed.extend(patch_tree(target))

    print('Umoja write-up alignment complete.')
    print(f'Backup: {backup}')
    if changed:
        print('Changed files:')
        for p in changed:
            print(' -', p)
    else:
        print('No matching content needed changes.')
    print('\nImportant: the write-up gives Paybill 400200 but no account/reference. The patched Giving page tells visitors to confirm that reference with the church office instead of inventing one.')


if __name__ == '__main__':
    main()
