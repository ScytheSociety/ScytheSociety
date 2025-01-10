<?php
// save_ranking.php
header('Content-Type: application/json');

// Obtener los datos enviados
$rankingData = file_get_contents('php://input');

// Validar que los datos sean JSON válido
if (!json_decode($rankingData)) {
    http_response_code(400);
    echo json_encode(['error' => 'Datos inválidos']);
    exit;
}

// Guardar en el archivo
$result = file_put_contents('ranking.json', $rankingData);

if ($result === false) {
    http_response_code(500);
    echo json_encode(['error' => 'Error al guardar el archivo']);
} else {
    http_response_code(200);
    echo json_encode(['success' => true]);
}
?>