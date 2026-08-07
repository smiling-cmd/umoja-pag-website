<?php

declare(strict_types=1);
require __DIR__ . '/_bootstrap.php';

$data = request_data();
reject_honeypot($data);
require_consent($data);

$name = text_value($data, 'name', 100);
$email = email_value($data, 'email', true);
$subject = text_value($data, 'subject', 150);
$message = text_value($data, 'message', 4000);

$config = load_mail_config();
$recipient = (string)$config['official_recipient'];

[$html, $text] = email_template(
    'New Contact Message',
    [
        'Name' => $name,
        'Email' => $email,
        'Subject' => $subject,
        'Message' => $message,
        'Submitted' => date('Y-m-d H:i:s T'),
    ],
    'Reply to this email to respond directly to the visitor.'
);

send_church_mail(
    $recipient,
    '[Website] Contact — ' . safe_subject_piece($subject) . ' — ' . safe_subject_piece($name),
    $html,
    $text,
    $email,
    $name
);

json_response(200, [
    'success' => true,
    'message' => 'Your message has been sent to Umoja P.A.G Church.',
]);
