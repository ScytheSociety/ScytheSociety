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
    
    // Leer datos existentes
    $currentData = file_exists($file) ? json_decode(file_get_contents($file), true) : [];
    if (!is_array($currentData)) {
        $currentData = [];
    }
    
    // Añadir timestamp
    $data['timestamp'] = date('Y-m-d H:i:s');
    
    // Añadir nuevo registro
    $currentData[] = $data;
    
    // Ordenar por puntuación
    usort($currentData, function($a, $b) {
        return $b['score'] - $a['score'];
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