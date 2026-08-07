<?php

declare(strict_types=1);
require __DIR__ . '/_bootstrap.php';

$data = request_data();
reject_honeypot($data);
require_consent($data);

$name = text_value($data, 'name', 100);
$email = email_value($data, 'email', true);
$request = text_value($data, 'request', 5000);

$config = load_mail_config();
$recipient = (string)$config['official_recipient'];

[$html, $text] = email_template(
    'New Pastoral Care Request',
    [
        'Name' => $name,
        'Email' => $email,
        'Care Request' => $request,
        'Submitted' => date('Y-m-d H:i:s T'),
    ],
    'Sensitive pastoral information: share only with authorised pastoral staff.'
);

send_church_mail(
    $recipient,
    '[Website] Pastoral Care — ' . safe_subject_piece($name),
    $html,
    $text,
    $email,
    $name
);

json_response(200, [
    'success' => true,
    'message' => 'Your pastoral care request has been sent to Umoja P.A.G Church.',
]);
