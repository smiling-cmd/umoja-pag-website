<?php

declare(strict_types=1);

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception as MailerException;

header('Content-Type: application/json; charset=UTF-8');
header('Cache-Control: no-store, max-age=0');
header('X-Content-Type-Options: nosniff');
date_default_timezone_set('Africa/Nairobi');

const MAX_REQUEST_BYTES = 65536;

function domain_root(): string
{
    return dirname(__DIR__, 2);
}

function json_response(int $status, array $payload): never
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

function load_mail_config(): array
{
    static $config = null;

    if (is_array($config)) {
        return $config;
    }

    $configPath = domain_root() . '/private/mail-config.php';
    if (!is_file($configPath)) {
        error_log('Umoja mail config missing: ' . $configPath);
        json_response(500, [
            'success' => false,
            'message' => 'Email delivery is not configured yet. Please contact the church directly.',
        ]);
    }

    $loaded = require $configPath;
    if (!is_array($loaded)) {
        error_log('Umoja mail config did not return an array.');
        json_response(500, [
            'success' => false,
            'message' => 'Email delivery is not configured correctly. Please contact the church directly.',
        ]);
    }

    $config = $loaded;
    return $config;
}

function load_phpmailer(): void
{
    $autoload = domain_root() . '/vendor/autoload.php';
    if (!is_file($autoload)) {
        error_log('PHPMailer autoload missing: ' . $autoload);
        json_response(500, [
            'success' => false,
            'message' => 'Email delivery is temporarily unavailable. Please contact the church directly.',
        ]);
    }

    require_once $autoload;
}

function enforce_same_origin(array $config): void
{
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    if ($origin === '') {
        return;
    }

    $allowedOrigins = $config['allowed_origins'] ?? [];
    if (!in_array($origin, $allowedOrigins, true)) {
        json_response(403, [
            'success' => false,
            'message' => 'This submission was blocked for security reasons.',
        ]);
    }
}

function read_json_request(): array
{
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
        header('Allow: POST');
        json_response(405, [
            'success' => false,
            'message' => 'Only POST requests are accepted.',
        ]);
    }

    $contentType = strtolower((string)($_SERVER['CONTENT_TYPE'] ?? ''));
    if (!str_starts_with($contentType, 'application/json')) {
        json_response(415, [
            'success' => false,
            'message' => 'The request format is not supported.',
        ]);
    }

    $length = (int)($_SERVER['CONTENT_LENGTH'] ?? 0);
    if ($length > MAX_REQUEST_BYTES) {
        json_response(413, [
            'success' => false,
            'message' => 'The submission is too large.',
        ]);
    }

    $raw = file_get_contents('php://input');
    if ($raw === false || $raw === '') {
        json_response(400, [
            'success' => false,
            'message' => 'No form data was received.',
        ]);
    }

    if (strlen($raw) > MAX_REQUEST_BYTES) {
        json_response(413, [
            'success' => false,
            'message' => 'The submission is too large.',
        ]);
    }

    try {
        $data = json_decode($raw, true, 32, JSON_THROW_ON_ERROR);
    } catch (JsonException) {
        json_response(400, [
            'success' => false,
            'message' => 'The form data could not be read.',
        ]);
    }

    if (!is_array($data)) {
        json_response(400, [
            'success' => false,
            'message' => 'The form data is invalid.',
        ]);
    }

    return $data;
}

function request_data(): array
{
    $config = load_mail_config();
    enforce_same_origin($config);
    return read_json_request();
}

function text_value(array $data, string $key, int $maxLength, bool $required = true): string
{
    $value = trim((string)($data[$key] ?? ''));

    if ($required && $value === '') {
        json_response(422, [
            'success' => false,
            'message' => 'Please complete all required fields.',
        ]);
    }

    if (strlen($value) > $maxLength) {
        json_response(422, [
            'success' => false,
            'message' => 'One of the submitted fields is too long.',
        ]);
    }

    return $value;
}

function email_value(array $data, string $key, bool $required = false): string
{
    $email = trim((string)($data[$key] ?? ''));

    if ($email === '' && !$required) {
        return '';
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 254) {
        json_response(422, [
            'success' => false,
            'message' => 'Please enter a valid email address.',
        ]);
    }

    return $email;
}

function kenyan_phone_value(array $data, string $key = 'phone'): string
{
    $raw = trim((string)($data[$key] ?? ''));
    $compact = preg_replace('/[\s().-]+/', '', $raw) ?? '';

    if (preg_match('/^0(7|1)\d{8}$/', $compact)) {
        $compact = '+254' . substr($compact, 1);
    } elseif (preg_match('/^254(7|1)\d{8}$/', $compact)) {
        $compact = '+' . $compact;
    }

    if (!preg_match('/^\+254(7|1)\d{8}$/', $compact)) {
        json_response(422, [
            'success' => false,
            'message' => 'Please enter a valid Kenyan phone number.',
        ]);
    }

    return $compact;
}

function require_consent(array $data, string $key = 'consent'): void
{
    if (($data[$key] ?? false) !== true) {
        json_response(422, [
            'success' => false,
            'message' => 'Consent is required before this form can be submitted.',
        ]);
    }
}

function reject_honeypot(array $data): void
{
    $honeypot = trim((string)($data['honeypot'] ?? ''));
    if ($honeypot !== '') {
        // Return a normal-looking success response so bots receive no useful signal.
        json_response(200, [
            'success' => true,
            'message' => 'Thank you. Your submission has been received.',
        ]);
    }
}

function safe_subject_piece(string $value): string
{
    $value = preg_replace('/[\r\n]+/', ' ', $value) ?? '';
    $value = trim($value);
    return substr($value, 0, 90);
}

function h(string $value): string
{
    return htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function email_template(string $heading, array $rows, string $note = ''): array
{
    $htmlRows = '';
    $textRows = [];

    foreach ($rows as $label => $value) {
        $display = $value === '' ? '—' : $value;
        $htmlRows .= '<tr>'
            . '<td style="padding:10px 12px;border-bottom:1px solid #e8edf5;font-weight:700;color:#072f6f;vertical-align:top;width:32%;">' . h((string)$label) . '</td>'
            . '<td style="padding:10px 12px;border-bottom:1px solid #e8edf5;color:#17243d;white-space:pre-wrap;">' . nl2br(h((string)$display)) . '</td>'
            . '</tr>';
        $textRows[] = $label . ': ' . $display;
    }

    $html = '<!doctype html><html><body style="margin:0;background:#f4f7fb;font-family:Arial,sans-serif;color:#17243d;">'
        . '<div style="max-width:680px;margin:0 auto;padding:30px 18px;">'
        . '<div style="background:#ffffff;border:1px solid #dfe7f2;border-top:5px solid #d1a326;border-radius:18px;overflow:hidden;">'
        . '<div style="padding:24px 26px;background:#072f6f;color:#ffffff;">'
        . '<div style="font-size:12px;letter-spacing:1.5px;text-transform:uppercase;color:#e6c65a;font-weight:700;">Umoja P.A.G Church Website</div>'
        . '<h1 style="margin:8px 0 0;font-size:24px;line-height:1.25;">' . h($heading) . '</h1>'
        . '</div>'
        . '<table role="presentation" style="width:100%;border-collapse:collapse;font-size:14px;">' . $htmlRows . '</table>';

    if ($note !== '') {
        $html .= '<div style="padding:18px 26px;color:#647087;font-size:12px;line-height:1.6;">' . h($note) . '</div>';
    }

    $html .= '</div></div></body></html>';

    $text = $heading . "\n\n" . implode("\n", $textRows);
    if ($note !== '') {
        $text .= "\n\n" . $note;
    }

    return [$html, $text];
}

function send_church_mail(
    string $recipient,
    string $subject,
    string $htmlBody,
    string $textBody,
    string $replyToEmail = '',
    string $replyToName = ''
): void {
    $config = load_mail_config();
    load_phpmailer();

    $allowedRecipients = array_values(array_filter(array_merge(
        [$config['official_recipient'] ?? ''],
        array_values($config['ministry_recipients'] ?? [])
    )));

    if (!in_array($recipient, $allowedRecipients, true)) {
        error_log('Blocked unexpected Umoja mail recipient: ' . $recipient);
        json_response(500, [
            'success' => false,
            'message' => 'The submission could not be routed. Please contact the church directly.',
        ]);
    }

    $mail = new PHPMailer(true);

    try {
        $mail->isSMTP();
        $mail->Host = (string)$config['smtp_host'];
        $mail->Port = (int)$config['smtp_port'];
        $mail->SMTPAuth = true;
        $mail->Username = (string)$config['smtp_username'];
        $mail->Password = (string)$config['smtp_password'];
        $mail->CharSet = 'UTF-8';
        $mail->Timeout = 20;

        $encryption = strtolower((string)($config['smtp_encryption'] ?? 'tls'));
        if ($encryption === 'ssl' || $encryption === 'smtps') {
            $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
        } else {
            $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        }

        $fromEmail = (string)$config['from_email'];
        $fromName = (string)($config['from_name'] ?? 'Umoja P.A.G Website');
        $mail->setFrom($fromEmail, $fromName);
        $mail->addAddress($recipient);

        if ($replyToEmail !== '' && filter_var($replyToEmail, FILTER_VALIDATE_EMAIL)) {
            $mail->addReplyTo($replyToEmail, safe_subject_piece($replyToName));
        }

        $mail->isHTML(true);
        $mail->Subject = safe_subject_piece($subject);
        $mail->Body = $htmlBody;
        $mail->AltBody = $textBody;
        $mail->send();
    } catch (MailerException $e) {
        error_log('Umoja SMTP error: ' . $mail->ErrorInfo . ' / ' . $e->getMessage());
        json_response(502, [
            'success' => false,
            'message' => 'The message could not be delivered right now. Please try again or contact the church directly.',
        ]);
    } catch (Throwable $e) {
        error_log('Umoja mail error: ' . $e->getMessage());
        json_response(500, [
            'success' => false,
            'message' => 'The message could not be delivered right now. Please try again or contact the church directly.',
        ]);
    }
}
