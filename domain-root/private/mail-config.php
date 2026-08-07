<?php

return [
    // HOSTAFRICA DirectAdmin SMTP settings confirmed from the account setup screen.
    'smtp_host' => 'mail.umojapagchurch.org',
    'smtp_port' => 587,
    'smtp_encryption' => 'tls', // STARTTLS

    // The website authenticates with the church's official mailbox only.
    'smtp_username' => 'umojapag@umojapagchurch.org',
    'smtp_password' => 'FgTZfU5H6Ej5M3MjvzGt',

    'from_email' => 'umojapag@umojapagchurch.org',
    'from_name' => 'Umoja P.A.G Website',
    'official_recipient' => 'umojapag@umojapagchurch.org',

    // The browser never chooses an arbitrary email address. The PHP backend maps
    // the ministry key to this server-side allowlist.
    'ministry_recipients' => [
        'cell-groups' => 'cellgroups@umojapagchurch.org',
        'worship-team' => 'worship@umojapagchurch.org',
        'choir' => 'choir@umojapagchurch.org',
        'media-team' => 'media@umojapagchurch.org',
        'sunday-school' => 'sundayschool@umojapagchurch.org',
        'womens-fellowship' => 'women@umojapagchurch.org',
        'mens-fellowship' => 'men@umojapagchurch.org',
        'youth' => 'youth@umojapagchurch.org',
    ],

    'allowed_origins' => [
        'https://umojapagchurch.org',
        'https://www.umojapagchurch.org',
        'http://127.0.0.1:8080',
        
    ],
];
