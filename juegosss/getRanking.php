<?php
header('Content-Type: application/json');

$file = "game_data.json";

if (file_exists($file)) {
    $data = json_decode(file_get_contents($file), true);
    
    // Ordenar por puntuación
    usort($data, function($a, $b) {
        return $b['score'] - $a['score'];
    });
    
    echo json_encode(array_slice($data, 0, 50));
} else {
    echo json_encode([]);
}
?>