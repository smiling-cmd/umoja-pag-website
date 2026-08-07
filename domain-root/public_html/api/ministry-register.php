<?php

declare(strict_types=1);
require __DIR__ . '/_bootstrap.php';

$data = request_data();
reject_honeypot($data);
require_consent($data);

$name = text_value($data, 'name', 100);
$phone = kenyan_phone_value($data);
$email = email_value($data, 'email', false);
$ministry = text_value($data, 'ministry', 80);
$message = text_value($data, 'message', 2000, false);

$labels = [
    'cell-groups' => 'Cell Groups',
    'worship-team' => 'Worship Team',
    'choir' => 'Choir',
    'media-team' => 'Media Team',
    'sunday-school' => 'Sunday School',
    'womens-fellowship' => "Women's Fellowship",
    'mens-fellowship' => "Men's Fellowship",
    'youth' => 'Youth',
];

$config = load_mail_config();
$recipients = $config['ministry_recipients'] ?? [];

if (!isset($labels[$ministry], $recipients[$ministry])) {
    json_response(422, [
        'success' => false,
        'message' => 'Please select a valid ministry.',
    ]);
}

$recipient = (string)$recipients[$ministry];
$label = $labels[$ministry];

[$html, $text] = email_template(
    'New ' . $label . ' Registration',
    [
        'Name' => $name,
        'Phone' => $phone,
        'Email' => $email,
        'Ministry' => $label,
        'Message' => $message,
        'Submitted' => date('Y-m-d H:i:s T'),
    ],
    'This registration was routed directly to the selected ministry mailbox.'
);

send_church_mail(
    $recipient,
    '[Website] ' . $label . ' Registration — ' . safe_subject_piece($name),
    $html,
    $text,
    $email,
    $name
);

json_response(200, [
    'success' => true,
    'message' => 'Your registration has been sent directly to the ' . $label . ' team.',
]);
