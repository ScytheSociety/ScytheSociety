<?php
header('Content-Type: application/json');

$data = json_decode(file_get_contents("php://input"), true);

if ($data && 
    isset($data['name']) && 
    isset($data['level']) && 
    isset($data['score']) && 
    isset($data['enemiesKilled']) && 
    isset($data['timePlayed']) && 
    isset($data['result'])) {
    
    $file = "game_data.json";
    
    // Sanitizar nombre
    $data['name'] = substr(preg_replace("/[^A-Za-z0-9]/", "", $data['name']), 0, 4);
    
    // Validar datos
    $data['score'] = intval($data['score']);
    $data['level'] = min(max(intval($data['level']), 1), 10);
    $data['enemiesKilled'] = intval($data['enemiesKilled']);
    $data['timePlayed'] = intval($data['timePlayed']);
    
    // Leer datos existentes
    $currentData = file_exists($file) ? json_decode(file_get_contents($file), true) : [];
    if (!is_array($currentData)) {
        $currentData = [];
    }
    
    // Añadir timestamp e IP hash
    $data['timestamp'] = date('Y-m-d H:i:s');
    $data['session_id'] = hash('sha256', $_SERVER['REMOTE_ADDR'] . date('Y-m-d'));
    
    // Añadir nuevo registro
    $currentData[] = $data;
    
    // Ordenar por puntuación
    usort($currentData, function($a, $b) {
        if ($b['score'] !== $a['score']) {
            return $b['score'] - $a['score'];
        }
        return $b['level'] - $a['level'];
    });
    
    // Mantener solo los mejores 100 puntajes
    $currentData = array_slice($currentData, 0, 100);
    
    // Guardar datos
    if (file_put_contents($file, json_encode($currentData, JSON_PRETTY_PRINT))) {
        echo json_encode(["status" => "success"]);
    } else {
        echo json_encode(["status" => "error", "message" => "Error al escribir el archivo"]);
    }
} else {
    echo json_encode(["status" => "error", "message" => "Datos inválidos"]);
}
?>