<?php

declare(strict_types=1);
require __DIR__ . '/_bootstrap.php';

$data = request_data();
reject_honeypot($data);
require_consent($data);

$name = text_value($data, 'name', 100);
$request = text_value($data, 'request', 5000);

$config = load_mail_config();
$recipient = (string)$config['official_recipient'];

[$html, $text] = email_template(
    'New Prayer Request',
    [
        'Name' => $name,
        'Prayer Request' => $request,
        'Submitted' => date('Y-m-d H:i:s T'),
    ],
    'Sensitive pastoral information: share only with authorised church personnel.'
);

send_church_mail(
    $recipient,
    '[Website] Prayer Request — ' . safe_subject_piece($name),
    $html,
    $text
);

json_response(200, [
    'success' => true,
    'message' => 'Your prayer request has been sent to the church prayer team.',
]);
