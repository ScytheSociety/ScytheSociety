<?php
header('Content-Type: application/json');

try {
    // Get the posted data
    $rankingData = file_get_contents('php://input');

    // Validate JSON
    $decoded = json_decode($rankingData);
    if ($decoded === null) {
        throw new Exception('Invalid JSON data');
    }

    // Check if file is writable
    if (!is_writable('ranking.json')) {
        throw new Exception('Ranking file is not writable');
    }

    // Save to file
    $result = file_put_contents('ranking.json', $rankingData);

    if ($result === false) {
        throw new Exception('Failed to write to ranking file');
    }

    http_response_code(200);
    echo json_encode(['success' => true]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => $e->getMessage(),
        'details' => error_get_last()
    ]);
}