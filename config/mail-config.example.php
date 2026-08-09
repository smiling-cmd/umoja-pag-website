<?php

/*
 * Copy this file to domain-root/private/mail-config.php for local use.
 * Never place a real password in this example file or commit it to Git.
 *
 * Production should set UMOJA_SMTP_PASSWORD as a hosting environment
 * variable. The PHP backend uses that value in preference to this file.
 */

return [
    'smtp_host' => 'mail.example.org',
    'smtp_port' => 587,
    'smtp_encryption' => 'tls',
    'smtp_username' => 'website@example.org',
    'smtp_password' => '',
    'from_email' => 'website@example.org',
    'from_name' => 'Umoja P.A.G Website',
    'official_recipient' => 'office@example.org',
    'ministry_recipients' => [],
    'allowed_origins' => [
        'https://example.org',
        'http://127.0.0.1:8080',
    ],
];
