<?php
// TMDB proxy — keeps the API key server-side.
// Reads $tmdb_api_key from config.php.

header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('X-XSS-Protection: 1; mode=block');
header('Content-Type: application/json');

include "config.php";

if (empty($tmdb_api_key)) {
    http_response_code(503);
    die(json_encode(['error' => 'TMDB proxy not configured']));
}

if (!isset($_GET['path']) || empty($_GET['path'])) {
    http_response_code(400);
    die(json_encode(['error' => 'Missing path parameter']));
}

// Allowlist: only permit TMDB v3 read endpoints we actually use.
$path = $_GET['path'];
$allowed = '#^/?3/(search/(movie|tv)|movie/\d+|tv/\d+(/season/\d+)?)/?$#';
if (!preg_match($allowed, $path)) {
    http_response_code(403);
    die(json_encode(['error' => 'Path not allowed']));
}

// Pass through a small set of safe query params.
$allowed_params = ['language', 'query', 'append_to_response', 'page'];
$qs = ['api_key' => $tmdb_api_key];
foreach ($allowed_params as $p) {
    if (isset($_GET[$p]) && is_string($_GET[$p]) && strlen($_GET[$p]) <= 512) {
        $qs[$p] = $_GET[$p];
    }
}

$url = 'https://api.themoviedb.org/' . ltrim($path, '/') . '?' . http_build_query($qs);

$ctx = stream_context_create([
    'http' => [
        'method'          => 'GET',
        'timeout'         => 20,
        'follow_location' => 0,
        'ignore_errors'   => true,
        'header'          => "User-Agent: StreamifyTmdbProxy/1.0\r\nAccept: application/json\r\n"
    ]
]);

$result = @file_get_contents($url, false, $ctx);
if ($result === false) {
    http_response_code(502);
    die(json_encode(['error' => 'TMDB upstream failed']));
}

if (isset($http_response_header)) {
    foreach ($http_response_header as $h) {
        if (preg_match('#^HTTP/\S+ (\d{3})#', $h, $m)) {
            http_response_code((int)$m[1]);
            break;
        }
    }
}

echo $result;
