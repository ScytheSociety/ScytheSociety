<?php
header('Content-Type: application/json');

try {
    $data = json_decode(file_get_contents('php://input'), true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception('JSON inválido recibido.');
    }

    $rankingFile = 'ranking.json';
    $existingRanking = [];

    if (file_exists($rankingFile)) {
        $existingRanking = json_decode(file_get_contents($rankingFile), true) ?? [];
    }

    $existingRanking[] = $data;
    usort($existingRanking, function ($a, $b) {
        return $b['score'] - $a['score'] ?: $a['time'] - $b['time'];
    });

    file_put_contents($rankingFile, json_encode($existingRanking, JSON_PRETTY_PRINT));
    echo json_encode(['success' => true]);
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
