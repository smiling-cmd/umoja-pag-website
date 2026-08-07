<?php

declare(strict_types=1);
require __DIR__ . '/_bootstrap.php';

$data = request_data();
reject_honeypot($data);
require_consent($data);

$firstName = text_value($data, 'firstName', 80);
$lastName = text_value($data, 'lastName', 80);
$phone = kenyan_phone_value($data);
$email = email_value($data, 'email', false);
$ageGroup = text_value($data, 'ageGroup', 60, false);
$area = text_value($data, 'area', 120, false);
$event = text_value($data, 'regFor', 160);
$notes = text_value($data, 'notes', 1500, false);

if (($data['guardianConsent'] ?? false) !== true) {
    json_response(422, [
        'success' => false,
        'message' => 'Please confirm the age or guardian-permission requirement.',
    ]);
}

$config = load_mail_config();
$recipient = (string)$config['official_recipient'];
$name = trim($firstName . ' ' . $lastName);

[$html, $text] = email_template(
    'New Event Registration',
    [
        'Name' => $name,
        'Phone' => $phone,
        'Email' => $email,
        'Age Group' => $ageGroup,
        'Area / Estate' => $area,
        'Event' => $event,
        'Notes' => $notes,
        'Submitted' => date('Y-m-d H:i:s T'),
    ],
    'This registration was submitted through umojapagchurch.org.'
);

send_church_mail(
    $recipient,
    '[Website] Event Registration — ' . safe_subject_piece($event) . ' — ' . safe_subject_piece($name),
    $html,
    $text,
    $email,
    $name
);

json_response(200, [
    'success' => true,
    'message' => 'Your event registration has been sent to Umoja P.A.G Church.',
]);
