<?php
// Load WordPress environment
require_once('wp-load.php');

// Define secret token (must match the token in backend/src/routes/wordpress.ts)
$secret_token = 'GKPradio2026_SecureMailBridgeSecretToken!';

// Check Authorization header
$headers = getallheaders();
$auth_header = isset($headers['Authorization']) ? $headers['Authorization'] : '';

if (strpos($auth_header, 'Bearer ') !== 0) {
    status_header(401);
    header('Content-Type: application/json');
    echo json_encode(array('error' => 'Unauthorized'));
    exit;
}

$token = substr($auth_header, 7);
if ($token !== $secret_token) {
    status_header(401);
    header('Content-Type: application/json');
    echo json_encode(array('error' => 'Unauthorized'));
    exit;
}

// Get POST JSON data
$json_data = file_get_contents('php://input');
$data = json_decode($json_data, true);

if (!$data) {
    status_header(400);
    header('Content-Type: application/json');
    echo json_encode(array('error' => 'Invalid JSON'));
    exit;
}

$businessName = isset($data['businessName']) ? sanitize_text_field($data['businessName']) : '';
$contactPerson = isset($data['contactPerson']) ? sanitize_text_field($data['contactPerson']) : '';
$contactEmail = isset($data['contactEmail']) ? sanitize_email($data['contactEmail']) : '';
$phone = isset($data['phone']) ? sanitize_text_field($data['phone']) : '';
$websiteUrl = isset($data['websiteUrl']) ? esc_url_raw($data['websiteUrl']) : '';
$socialMediaLinks = isset($data['socialMediaLinks']) ? sanitize_textarea_field($data['socialMediaLinks']) : '';
$ministryDescription = isset($data['ministryDescription']) ? sanitize_textarea_field($data['ministryDescription']) : '';
$message = isset($data['message']) ? sanitize_textarea_field($data['message']) : '';
$packageType = isset($data['packageType']) ? sanitize_text_field($data['packageType']) : '';
$packagePrice = isset($data['packagePrice']) ? sanitize_text_field($data['packagePrice']) : '';

if (empty($businessName) || empty($contactPerson) || empty($contactEmail) || empty($ministryDescription) || empty($packageType) || empty($packagePrice)) {
    status_header(400);
    header('Content-Type: application/json');
    echo json_encode(array('error' => 'Missing required fields'));
    exit;
}

// Prepare email content for admin
$to_admin = get_option('admin_email');
if (empty($to_admin)) {
    $to_admin = 'godkingdomprinciplesradio@gmail.com'; // Fallback
}
$subject_admin = "New Advertising Promotion Application: " . $businessName;

$body_admin = "
You have received a new advertising promotion application from GKP Radio Mobile App.

--------------------------------------------------
PACKAGE DETAILS:
--------------------------------------------------
Package Name:  {$packageType}
Price:         {$packagePrice}

--------------------------------------------------
APPLICANT DETAILS:
--------------------------------------------------
Business/Ministry Name: {$businessName}
Contact Person:         {$contactPerson}
Contact Email:          {$contactEmail}
Phone Number:           {$phone}
Website URL:            {$websiteUrl}
Social Media Links:
{$socialMediaLinks}

--------------------------------------------------
MINISTRY DESCRIPTION & ALIGNMENT:
--------------------------------------------------
{$ministryDescription}

--------------------------------------------------
ADDITIONAL MESSAGE:
--------------------------------------------------
{$message}
";

// Set email headers to Plain Text and UTF-8
$email_headers = array('Content-Type: text/plain; charset=UTF-8');

// Send to admin
$admin_sent = wp_mail($to_admin, $subject_admin, $body_admin, $email_headers);

// Prepare email content for applicant (confirmation)
$subject_user = "Your GKP Radio Advertising Application Received";
$body_user = "
Dear {$contactPerson},

Thank you for your interest in partnering with God Kingdom Principles (GKP) Radio!

We have received your application for the {$packageType} sponsorship package ({$packagePrice}/month). Our team will review your application and description to ensure it aligns with Kingdom principles and contact you within 24-48 hours.

--------------------------------------------------
YOUR APPLICATION SUMMARY:
--------------------------------------------------
Business/Ministry:      {$businessName}
Selected Package:       {$packageType} ({$packagePrice})
Description:            {$ministryDescription}

If you have any urgent questions, please feel free to reply directly to this email or reach out to support.

Blessings,
The GKP Radio Team
";

// Send to user
$user_sent = wp_mail($contactEmail, $subject_user, $body_user, $email_headers);

status_header(200);
header('Content-Type: application/json');
echo json_encode(array(
    'success' => true,
    'admin_sent' => $admin_sent,
    'user_sent' => $user_sent
));
exit;
