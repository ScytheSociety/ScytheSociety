<?php
// Asegurarse de que no haya salida HTML antes de los headers
header('Content-Type: application/json');
error_reporting(E_ALL);
ini_set('display_errors', 0);

try {
    // Obtener los datos enviados
    $rankingData = file_get_contents('php://input');
    
    // Validar que los datos sean JSON válido
    $decoded = json_decode($rankingData);
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception('Datos JSON inválidos: ' . json_last_error_msg());
    }
    
    // Verificar permisos del archivo
    $rankingFile = 'ranking.json';
    if (!is_writable($rankingFile) && file_exists($rankingFile)) {
        chmod($rankingFile, 0666);
    }
    
    // Guardar en el archivo
    $result = file_put_contents($rankingFile, $rankingData);
    
    if ($result === false) {
        throw new Exception('Error al escribir en el archivo');
    }
    
    echo json_encode(['success' => true]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => $e->getMessage(),
        'success' => false
    ]);
}
?>